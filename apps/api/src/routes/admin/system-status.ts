import { Router } from 'express';
import { authenticate, isCEO } from '@/middleware/auth';
import { ok, serverError } from '@/lib/response';
import { clearSystemSettingsCache } from '@/lib/systemConfig';
import { collectSystemStatus, invalidateSystemStatusCache } from '@/lib/systemStatus';

const router = Router();

router.use(authenticate, isCEO);

/** GET /v1/admin/system-status — live host and service metrics */
router.get('/', async (_req, res) => {
  try {
    const status = await collectSystemStatus();
    return ok(res, status);
  } catch (err) {
    return serverError(res, err);
  }
});

/** POST /v1/admin/system-status/clear-cache — clear system settings cache */
router.post('/clear-cache', async (_req, res) => {
  try {
    clearSystemSettingsCache();
    invalidateSystemStatusCache();
    return ok(res, { cleared: true, at: new Date().toISOString() });
  } catch (err) {
    return serverError(res, err);
  }
});

export default router;
