import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { readFileSync } from 'fs';
import { prisma } from './prisma';
import { redis } from './redis';
import { env } from '@/config/env';
import { isLocalUploadFallbackEnabled } from './storage';

const execFileAsync = promisify(execFile);

export type ServiceHealth = 'healthy' | 'degraded' | 'down';

export interface SystemStatusPayload {
  collectedAt: string;
  host: {
    uptimeSec: number;
    platform: string;
    hostname: string;
    timezone: string;
    cpuCores: number;
    loadAvg: [number, number, number];
    memoryTotalBytes: number;
    memoryUsedBytes: number;
    memoryUsedPercent: number;
    disk: {
      available: boolean;
      totalBytes?: number;
      usedBytes?: number;
      usedPercent?: number;
      mount?: string;
      reason?: string;
    };
  };
  process: {
    uptimeSec: number;
    pid: number;
    nodeVersion: string;
    memoryRssBytes: number;
    memoryHeapUsedBytes: number;
    memoryHeapTotalBytes: number;
  };
  services: {
    api: {
      status: ServiceHealth;
      port: number;
      nodeEnv: string;
      version: string;
    };
    postgres: {
      status: ServiceHealth;
      latencyMs: number | null;
      error?: string;
    };
    redis: {
      status: ServiceHealth;
      latencyMs: number | null;
      error?: string;
    };
    storage: {
      status: ServiceHealth;
      mode: 'r2' | 'local' | 'unconfigured';
      bucket?: string;
    };
    websocket: {
      status: ServiceHealth;
      path: string;
    };
  };
  jobs: Array<{ id: string; schedule: string; label: string }>;
  runtime: {
    allowedOriginsCount: number;
    inDocker: boolean;
  };
  build: {
    version: string;
    gitSha: string;
    buildTime: string;
  };
}

export const BACKGROUND_JOBS: SystemStatusPayload['jobs'] = [
  { id: 'commission-release', schedule: '0 2 * * *', label: 'Release commissions after hold period' },
  { id: 'domain-expiry', schedule: '0 8 * * *', label: 'Domain expiry alerts (30-day window)' },
  { id: 'payroll-reminder', schedule: '0 9 1 * *', label: 'Payroll reminder (1st of month)' },
  { id: 'daily-report', schedule: '0 11 * * 1-5', label: 'Daily report reminders (weekdays)' },
  { id: 'ai-task-coach', schedule: '30 9 * * 1-5', label: 'AI task coach notifications (weekdays)' },
];

let cachedStatus: SystemStatusPayload | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 5000;

function getApiVersion(): string {
  try {
    const pkgPath = path.join(__dirname, '..', '..', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    return pkg.version ?? '1.0.0';
  } catch {
    return '1.0.0';
  }
}

async function pingPostgres(): Promise<{ status: ServiceHealth; latencyMs: number | null; error?: string }> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - start;
    return {
      status: latencyMs > 500 ? 'degraded' : 'healthy',
      latencyMs,
    };
  } catch (e) {
    return {
      status: 'down',
      latencyMs: null,
      error: e instanceof Error ? e.message : 'database_unreachable',
    };
  }
}

async function pingRedis(): Promise<{ status: ServiceHealth; latencyMs: number | null; error?: string }> {
  const start = Date.now();
  try {
    const result = await redis.ping();
    const latencyMs = Date.now() - start;
    if (result !== 'PONG') {
      return { status: 'degraded', latencyMs, error: 'unexpected_ping_response' };
    }
    return {
      status: latencyMs > 300 ? 'degraded' : 'healthy',
      latencyMs,
    };
  } catch (e) {
    return {
      status: 'down',
      latencyMs: null,
      error: e instanceof Error ? e.message : 'redis_unreachable',
    };
  }
}

async function getDiskUsage(): Promise<SystemStatusPayload['host']['disk']> {
  if (process.platform === 'win32') {
    return { available: false, reason: 'Disk metrics are not available on Windows dev hosts' };
  }
  try {
    const { stdout } = await execFileAsync('df', ['-kP', '/'], { timeout: 5000 });
    const lines = stdout.trim().split('\n');
    if (lines.length < 2) {
      return { available: false, reason: 'Unable to parse df output' };
    }
    const parts = lines[1].split(/\s+/);
    const totalKb = Number(parts[1]);
    const usedKb = Number(parts[2]);
    if (!Number.isFinite(totalKb) || !Number.isFinite(usedKb) || totalKb <= 0) {
      return { available: false, reason: 'Invalid df values' };
    }
    const totalBytes = totalKb * 1024;
    const usedBytes = usedKb * 1024;
    return {
      available: true,
      totalBytes,
      usedBytes,
      usedPercent: Math.round((usedBytes / totalBytes) * 1000) / 10,
      mount: parts[5] ?? '/',
    };
  } catch (e) {
    return {
      available: false,
      reason: e instanceof Error ? e.message : 'df_failed',
    };
  }
}

function getStorageInfo(): SystemStatusPayload['services']['storage'] {
  const s3Key = env.S3_ACCESS_KEY || env.S3_ACCESS_KEY_ID;
  const s3Secret = env.S3_SECRET_KEY || env.S3_SECRET_ACCESS_KEY;
  const r2Configured = Boolean(env.S3_BUCKET && env.S3_ENDPOINT && s3Key && s3Secret);

  if (r2Configured) {
    return { status: 'healthy', mode: 'r2', bucket: env.S3_BUCKET };
  }
  if (isLocalUploadFallbackEnabled) {
    return { status: 'healthy', mode: 'local' };
  }
  return { status: env.NODE_ENV === 'production' ? 'down' : 'degraded', mode: 'unconfigured' };
}

function isRunningInDocker(): boolean {
  try {
    readFileSync('/.dockerenv');
    return true;
  } catch {
    return false;
  }
}

export async function collectSystemStatus(): Promise<SystemStatusPayload> {
  const now = Date.now();
  if (cachedStatus && now - cachedAt < CACHE_TTL_MS) {
    return cachedStatus;
  }

  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const mem = process.memoryUsage();

  const [postgres, redisResult, disk] = await Promise.all([
    pingPostgres(),
    pingRedis(),
    getDiskUsage(),
  ]);

  const storage = getStorageInfo();
  const apiHealthy = postgres.status !== 'down';

  const payload: SystemStatusPayload = {
    collectedAt: new Date().toISOString(),
    host: {
      uptimeSec: Math.floor(os.uptime()),
      platform: `${process.platform} ${os.release()}`,
      hostname: os.hostname(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      cpuCores: os.cpus().length,
      loadAvg: os.loadavg() as [number, number, number],
      memoryTotalBytes: totalMem,
      memoryUsedBytes: usedMem,
      memoryUsedPercent: Math.round((usedMem / totalMem) * 1000) / 10,
      disk,
    },
    process: {
      uptimeSec: Math.floor(process.uptime()),
      pid: process.pid,
      nodeVersion: process.version,
      memoryRssBytes: mem.rss,
      memoryHeapUsedBytes: mem.heapUsed,
      memoryHeapTotalBytes: mem.heapTotal,
    },
    services: {
      api: {
        status: apiHealthy ? 'healthy' : 'degraded',
        port: env.PORT,
        nodeEnv: env.NODE_ENV,
        version: getApiVersion(),
      },
      postgres,
      redis: redisResult,
      storage,
      websocket: {
        status: apiHealthy ? 'healthy' : 'degraded',
        path: '/v1/realtime',
      },
    },
    jobs: BACKGROUND_JOBS,
    runtime: {
      allowedOriginsCount: env.ALLOWED_ORIGINS.split(',').filter(Boolean).length,
      inDocker: isRunningInDocker(),
    },
    build: {
      version: getApiVersion(),
      gitSha: process.env.GIT_SHA ?? 'unknown',
      buildTime: process.env.BUILD_TIME ?? 'unknown',
    },
  };

  cachedStatus = payload;
  cachedAt = now;
  return payload;
}

export function invalidateSystemStatusCache(): void {
  cachedStatus = null;
  cachedAt = 0;
}
