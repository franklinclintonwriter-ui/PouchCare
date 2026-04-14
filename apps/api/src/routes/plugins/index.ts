import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { validate } from '@/middleware/validate';
import { authenticate, isCEO, type AuthRequest } from '@/middleware/auth';
import prisma from '@/lib/prisma';
import { comparePassword } from '@/lib/hash';
import { signAccess } from '@/lib/jwt';
import { buildPluginZip } from '@/lib/pluginZip';
import {
  ok,
  created,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  serverError,
  paginated,
} from '@/lib/response';

const router = Router();

// ── Schemas ────────────────────────────────────────────────────────────────

const createPluginSchema = z.object({
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers and hyphens only'),
  name: z.string().min(2).max(120),
  description: z.string().max(1000).optional(),
});

const updatePluginSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(1000).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
});

const publishVersionSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must follow semver: X.Y.Z'),
  phpFileContent: z.string().min(10),
  changelog: z.string().max(2000).optional(),
});

const activateSchema = z.object({
  slug: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(1),
  userType: z.enum(['staff', 'portal']),
  siteUrl: z.string().url(),
  siteTitle: z.string().max(200).optional(),
});

// ── Helpers ────────────────────────────────────────────────────────────────

function hashApiKey(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

// ── Protected routes (staff JWT required) ──────────────────────────────────

/** GET /v1/plugins — list all plugins (any staff) */
router.get('/', authenticate, async (_req, res) => {
  try {
    const plugins = await prisma.plugin.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { versions: true, activations: true } },
      },
    });
    return ok(res, plugins.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      status: p.status,
      currentVersion: p.currentVersion,
      versionCount: p._count.versions,
      activationCount: p._count.activations,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })));
  } catch (e) {
    return serverError(res, e);
  }
});

/** POST /v1/plugins — create plugin (CEO/MD only) */
router.post('/', authenticate, isCEO, validate(createPluginSchema), async (req: AuthRequest, res) => {
  try {
    const { slug, name, description } = req.body;
    const existing = await prisma.plugin.findUnique({ where: { slug } });
    if (existing) return conflict(res, `Slug "${slug}" is already taken`);
    const plugin = await prisma.plugin.create({
      data: {
        slug,
        name,
        description: description ?? null,
        createdById: req.user!.id,
      },
    });
    return created(res, plugin);
  } catch (e) {
    return serverError(res, e);
  }
});

/** GET /v1/plugins/:id — get plugin + versions (any staff) */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const plugin = await prisma.plugin.findUnique({
      where: { id: req.params.id },
      include: {
        versions: { orderBy: { publishedAt: 'desc' } },
        _count: { select: { activations: true } },
      },
    });
    if (!plugin) return notFound(res, 'Plugin');
    return ok(res, {
      ...plugin,
      activationCount: plugin._count.activations,
    });
  } catch (e) {
    return serverError(res, e);
  }
});

/** PATCH /v1/plugins/:id — edit plugin metadata (CEO/MD only) */
router.patch('/:id', authenticate, isCEO, validate(updatePluginSchema), async (req: AuthRequest, res) => {
  try {
    const plugin = await prisma.plugin.findUnique({ where: { id: req.params.id } });
    if (!plugin) return notFound(res, 'Plugin');
    const updated = await prisma.plugin.update({
      where: { id: req.params.id },
      data: {
        ...(req.body.name !== undefined && { name: req.body.name }),
        ...(req.body.description !== undefined && { description: req.body.description }),
        ...(req.body.status !== undefined && { status: req.body.status }),
      },
    });
    return ok(res, updated);
  } catch (e) {
    return serverError(res, e);
  }
});

/** POST /v1/plugins/:id/versions — publish a new version (CEO/MD only) */
router.post('/:id/versions', authenticate, isCEO, validate(publishVersionSchema), async (req: AuthRequest, res) => {
  try {
    const plugin = await prisma.plugin.findUnique({ where: { id: req.params.id } });
    if (!plugin) return notFound(res, 'Plugin');

    const { version, phpFileContent, changelog } = req.body;

    const existing = await prisma.pluginVersion.findUnique({
      where: { pluginId_version: { pluginId: plugin.id, version } },
    });
    if (existing) return conflict(res, `Version ${version} already exists for this plugin`);

    // Unset previous latest
    await prisma.pluginVersion.updateMany({
      where: { pluginId: plugin.id, isLatest: true },
      data: { isLatest: false },
    });

    const newVersion = await prisma.pluginVersion.create({
      data: {
        pluginId: plugin.id,
        version,
        phpFileContent,
        changelog: changelog ?? null,
        isLatest: true,
        publishedById: req.user!.id,
      },
    });

    // Update plugin's currentVersion
    await prisma.plugin.update({
      where: { id: plugin.id },
      data: { currentVersion: version },
    });

    return created(res, newVersion);
  } catch (e) {
    return serverError(res, e);
  }
});

/** GET /v1/plugins/:id/activations — list activated sites (CEO/MD only) */
router.get('/:id/activations', authenticate, isCEO, async (req, res) => {
  try {
    const plugin = await prisma.plugin.findUnique({ where: { id: req.params.id } });
    if (!plugin) return notFound(res, 'Plugin');

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const [activations, total] = await Promise.all([
      prisma.pluginActivation.findMany({
        where: { pluginId: plugin.id },
        orderBy: { activatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.pluginActivation.count({ where: { pluginId: plugin.id } }),
    ]);

    return paginated(res, activations, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (e) {
    return serverError(res, e);
  }
});

// ── Public routes (no JWT — used by WordPress sites) ───────────────────────

/**
 * POST /v1/plugins/activate
 * WordPress plugin calls this with staff/portal credentials + site URL.
 * Returns a long-lived activation JWT token.
 */
router.post('/activate', validate(activateSchema), async (req, res) => {
  try {
    const { slug, email, password, userType, siteUrl, siteTitle } = req.body;

    const plugin = await prisma.plugin.findUnique({ where: { slug } });
    if (!plugin) return notFound(res, 'Plugin');
    if (plugin.status !== 'PUBLISHED') return forbidden(res, 'Plugin is not published');

    let userId: string;
    let userName: string;

    if (userType === 'staff') {
      const staff = await prisma.staffMember.findUnique({ where: { email: email.trim().toLowerCase() } });
      if (!staff || !(await comparePassword(password, staff.passwordHash))) {
        return unauthorized(res, 'Invalid credentials');
      }
      if (staff.status === 'INACTIVE') return unauthorized(res, 'Account is inactive');
      userId = staff.id;
      userName = staff.name;
    } else {
      const member = await prisma.portalMember.findUnique({ where: { email: email.trim().toLowerCase() } });
      if (!member || !(await comparePassword(password, member.passwordHash))) {
        return unauthorized(res, 'Invalid credentials');
      }
      if (member.status === 'SUSPENDED') return unauthorized(res, 'Account is suspended');
      userId = member.id;
      userName = member.fullName;
    }

    // Upsert activation record
    const activation = await prisma.pluginActivation.upsert({
      where: { pluginId_siteUrl: { pluginId: plugin.id, siteUrl } },
      update: {
        activatedByType: userType,
        activatedById: userId,
        activatedByName: userName,
        siteTitle: siteTitle ?? null,
        activatedAt: new Date(),
        lastPingAt: new Date(),
        isActive: true,
      },
      create: {
        pluginId: plugin.id,
        activatedByType: userType,
        activatedById: userId,
        activatedByName: userName,
        siteUrl,
        siteTitle: siteTitle ?? null,
        lastPingAt: new Date(),
        isActive: true,
      },
    });

    // Issue an activation token (long-lived, 10 years)
    const token = await signAccess({
      sub: activation.id,
      role: 'plugin_activation',
      type: userType as 'staff' | 'portal',
    });

    return ok(res, {
      activated: true,
      activationId: activation.id,
      pluginName: plugin.name,
      pluginVersion: plugin.currentVersion,
      userName,
      token,
    });
  } catch (e) {
    return serverError(res, e);
  }
});

/**
 * GET /v1/plugins/:slug/update-info
 * WordPress update checker polls this. Returns version metadata as JSON.
 * No auth required — public endpoint.
 */
router.get('/:slug/update-info', async (req, res) => {
  try {
    const plugin = await prisma.plugin.findUnique({
      where: { slug: req.params.slug },
      include: {
        versions: { where: { isLatest: true }, take: 1 },
      },
    });
    if (!plugin || plugin.status !== 'PUBLISHED') {
      return res.status(404).json({ error: 'Plugin not found' });
    }

    const latest = plugin.versions[0];
    const apiBase = process.env.API_BASE_URL ?? 'http://localhost:7000/v1';

    return res.json({
      id: plugin.slug,
      slug: plugin.slug,
      name: plugin.name,
      version: plugin.currentVersion,
      description: plugin.description ?? '',
      download_url: `${apiBase}/plugins/${plugin.slug}/download`,
      last_updated: latest?.publishedAt?.toISOString() ?? plugin.updatedAt.toISOString(),
      changelog: latest?.changelog ?? '',
      requires_wp: '5.0',
      tested_up_to: '6.5',
      sections: {
        description: plugin.description ?? '',
        changelog: latest?.changelog ?? '',
      },
    });
  } catch (e) {
    return serverError(res, e);
  }
});

/**
 * GET /v1/plugins/:slug/download
 * Streams the latest plugin .zip. Requires a valid API key in the X-Api-Key header.
 */
router.get('/:slug/download', async (req, res) => {
  try {
    // Validate API key
    const rawKey = (req.headers['x-api-key'] as string) ?? req.query.api_key as string;
    if (!rawKey) return unauthorized(res, 'API key required');

    const keyHash = hashApiKey(rawKey);
    const apiKey = await prisma.apiKey.findUnique({ where: { keyHash } });
    if (!apiKey || !apiKey.isActive) return unauthorized(res, 'Invalid or revoked API key');
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return unauthorized(res, 'API key expired');

    // Update last used
    await prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } });

    const plugin = await prisma.plugin.findUnique({
      where: { slug: req.params.slug },
      include: { versions: { where: { isLatest: true }, take: 1 } },
    });
    if (!plugin || plugin.status !== 'PUBLISHED') return notFound(res, 'Plugin');

    const latest = plugin.versions[0];
    if (!latest) return notFound(res, 'No published version found');

    const filename = `${plugin.slug}-${latest.version}.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const stream = buildPluginZip({
      slug: plugin.slug,
      name: plugin.name,
      version: latest.version,
      description: plugin.description ?? '',
      phpFileContent: latest.phpFileContent,
      changelog: latest.changelog ?? undefined,
    });

    stream.pipe(res);
  } catch (e) {
    return serverError(res, e);
  }
});

export default router;
