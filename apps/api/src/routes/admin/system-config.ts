import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
// Import requireAuth from correct path
import { requireAuth } from '../../middleware/auth';
import { z } from 'zod';
import { validate } from '../../middleware/validate';
import { ok, serverError, forbidden } from '../../lib/response';
import { clearSystemSettingsCache, parseSettingValue, serializeSettingValue } from '../../lib/systemConfig';

const router = Router();

// Only CEO can access system config
router.use(requireAuth);
router.use((req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'CEO') {
    return forbidden(res, 'CEO access required');
  }
  next();
});

// GET /api/admin/system-config
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { group } = req.query;
    
    let query = {};
    if (group && typeof group === 'string') {
      query = { group };
    }

    const settings = await prisma.systemSetting.findMany({
      where: query,
      orderBy: { key: 'asc' },
    });

    // Parse values for the response
    const parsedSettings = settings.map((s) => ({
      ...s,
      value: parseSettingValue(s.value, s.type),
    }));

    return ok(res, { settings: parsedSettings });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/system-config
const updateConfigSchema = z.object({
  updates: z.array(
    z.object({
      key: z.string(),
      value: z.any(),
      type: z.enum(['string', 'boolean', 'number', 'json']).optional(),
      group: z.string().optional(),
      label: z.string().optional(),
      description: z.string().optional(),
    })
  ),
});

router.put(
  '/',
  validate(updateConfigSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { updates } = req.body as z.infer<typeof updateConfigSchema>;
      const user = req.user!;
      const staff = await prisma.staffMember.findUnique({ where: { id: user.id } });
      const actorName = staff?.name || 'Unknown';
      const actorRole = staff?.systemRole || user.role;

      // We'll process this inside a transaction to ensure all updates apply and an audit log is written
      await prisma.$transaction(async (tx) => {
        for (const update of updates) {
          // Check if setting exists
          const existing = await tx.systemSetting.findUnique({
            where: { key: update.key },
          });

          const actualType = update.type || existing?.type || 'string';
          const serializedValue = serializeSettingValue(update.value, actualType);

          if (existing) {
            await tx.systemSetting.update({
              where: { key: update.key },
              data: {
                value: serializedValue,
                type: actualType,
                group: update.group || existing.group,
                label: update.label || existing.label,
                description: update.description || existing.description,
                updatedBy: user.id,
              },
            });
            
            // Log if value changed
            if (existing.value !== serializedValue) {
               await tx.systemAuditLog.create({
                data: {
                  action: 'UPDATE_SETTING',
                  module: 'system_config',
                  actorId: user.id,
                  actorName: actorName,
                  actorRole: actorRole,
                  ipAddress: req.ip || req.socket.remoteAddress,
                  details: JSON.stringify({
                    key: update.key,
                    oldValue: parseSettingValue(existing.value, existing.type),
                    newValue: update.value,
                  }),
                },
              });
            }
          } else {
            // Create new
            await tx.systemSetting.create({
              data: {
                key: update.key,
                value: serializedValue,
                type: actualType,
                group: update.group || 'general',
                label: update.label || update.key,
                description: update.description || '',
                updatedBy: user.id,
              },
            });

            await tx.systemAuditLog.create({
              data: {
                action: 'CREATE_SETTING',
                module: 'system_config',
                actorId: user.id,
                actorName: actorName,
                actorRole: actorRole,
                ipAddress: req.ip || req.socket.remoteAddress,
                details: JSON.stringify({
                  key: update.key,
                  newValue: update.value,
                }),
              },
            });
          }
        }
      });

      // Clear cache to reflect updates
      clearSystemSettingsCache();

      return ok(res, { message: 'Settings updated successfully' });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/admin/system-config/audit
router.get('/audit', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await prisma.systemAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return ok(res, { logs });
  } catch (error) {
    next(error);
  }
});

export default router;
