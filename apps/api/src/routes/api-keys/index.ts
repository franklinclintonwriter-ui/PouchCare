import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { validate } from '@/middleware/validate';
import { authenticate, isCEO, type AuthRequest } from '@/middleware/auth';
import prisma from '@/lib/prisma';
import {
  ok,
  created,
  noContent,
  notFound,
  forbidden,
  serverError,
} from '@/lib/response';

const router = Router();

// ── Schemas ────────────────────────────────────────────────────────────────

const createKeySchema = z.object({
  name: z.string().min(1).max(100),
  scope: z.enum(['plugin_download', 'general']).default('plugin_download'),
  expiresAt: z.string().datetime().optional(),
});

// ── Routes (all require CEO/MD) ────────────────────────────────────────────

/** GET /v1/api-keys — list all API keys */
router.get('/', authenticate, isCEO, async (req: AuthRequest, res) => {
  try {
    const keys = await prisma.apiKey.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scope: true,
        isActive: true,
        createdById: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
    });
    return ok(res, keys);
  } catch (e) {
    return serverError(res, e);
  }
});

/**
 * POST /v1/api-keys — generate a new API key.
 * Returns the raw key ONCE — it is never retrievable again.
 */
router.post('/', authenticate, isCEO, validate(createKeySchema), async (req: AuthRequest, res) => {
  try {
    const { name, scope, expiresAt } = req.body;

    // Generate a cryptographically secure key: "pc_" prefix + 40 hex chars
    const rawKey = `pc_${crypto.randomBytes(20).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.slice(0, 11); // "pc_" + first 8 hex chars

    const apiKey = await prisma.apiKey.create({
      data: {
        name,
        keyHash,
        keyPrefix,
        scope,
        isActive: true,
        createdById: req.user!.id,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return created(res, {
      id: apiKey.id,
      name: apiKey.name,
      keyPrefix: apiKey.keyPrefix,
      scope: apiKey.scope,
      isActive: apiKey.isActive,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
      // Raw key returned ONLY at creation time
      rawKey,
    });
  } catch (e) {
    return serverError(res, e);
  }
});

/** DELETE /v1/api-keys/:id — revoke (soft-delete by setting isActive = false) */
router.delete('/:id', authenticate, isCEO, async (req: AuthRequest, res) => {
  try {
    const key = await prisma.apiKey.findUnique({ where: { id: req.params.id } });
    if (!key) return notFound(res, 'API key');

    await prisma.apiKey.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    return noContent(res);
  } catch (e) {
    return serverError(res, e);
  }
});

/** PUT /v1/api-keys/:id — update API key name, scope, or expiration */
const updateKeySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  scope: z.enum(['plugin_download', 'general']).optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  isActive: z.boolean().optional(),
});

router.put('/:id', authenticate, isCEO, validate(updateKeySchema), async (req: AuthRequest, res) => {
  try {
    const key = await prisma.apiKey.findUnique({ where: { id: req.params.id } });
    if (!key) return notFound(res, 'API key');

    const { name, scope, expiresAt, isActive } = req.body;
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (scope !== undefined) updateData.scope = scope;
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await prisma.apiKey.update({
      where: { id: req.params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scope: true,
        isActive: true,
        createdById: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    return ok(res, updated);
  } catch (e) {
    return serverError(res, e);
  }
});

/** POST /v1/api-keys/:id/rotate — generate new key for existing API key entry */
router.post('/:id/rotate', authenticate, isCEO, async (req: AuthRequest, res) => {
  try {
    const key = await prisma.apiKey.findUnique({ where: { id: req.params.id } });
    if (!key) return notFound(res, 'API key');
    if (!key.isActive) return forbidden(res, 'Cannot rotate an inactive key');

    const rawKey = `pc_${crypto.randomBytes(20).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.slice(0, 11);

    const updated = await prisma.apiKey.update({
      where: { id: req.params.id },
      data: { keyHash, keyPrefix },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scope: true,
        isActive: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    return ok(res, { ...updated, rawKey });
  } catch (e) {
    return serverError(res, e);
  }
});

export default router;
