import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Cctv,
  Radio,
  Wifi,
  WifiOff,
  Activity,
  RefreshCw,
  LayoutGrid,
  List,
  Search,
  LayoutDashboard,
  Clock,
  Signal,
  Download,
  ArrowDownUp,
  Layers,
  Settings,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { PageTransition } from '@/components/ui/PageTransition';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { LiveViewerModal } from '@/components/monitor/LiveViewerModal';
import {
  useCamerasByBranch,
  useCameraPing,
  downloadCamerasExport,
  type CameraDevice,
  type CamerasByBranchParams,
} from '@/api/monitor';
import { useBranchDetail } from '@/api/admin-resources';
import { usePermission } from '@/hooks/usePermission';
import { VigiIntegrationCard } from '@/components/monitor/VigiIntegrationCard';

function formatMotionAge(iso: string): string {
  const t = Date.now() - new Date(iso).getTime();
  if (t < 0) return new Date(iso).toLocaleString();
  const m = Math.floor(t / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  return new Date(iso).toLocaleDateString();
}

// ── Status helpers ──────────────────────────────────────────

function StatusDot({ status }: { status: CameraDevice['status'] }) {
  return (
    <span className="relative flex h-2.5 w-2.5 shrink-0">
      {status !== 'offline' && (
        <span
          className={cn(
            'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
            status === 'recording' ? 'bg-red-400' : 'bg-emerald-400',
          )}
        />
      )}
      <span
        className={cn(
          'relative inline-flex h-2.5 w-2.5 rounded-full',
          status === 'recording'
            ? 'bg-red-500'
            : status === 'online'
            ? 'bg-emerald-500'
            : 'bg-gray-400',
        )}
      />
    </span>
  );
}

function ScanlineOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10"
      style={{
        background:
          'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)',
      }}
    />
  );
}

// ── Live feed thumbnail (static placeholder) ─────────────────

function LiveFeedThumbnail({ camera }: { camera: CameraDevice }) {
  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        background:
          camera.status !== 'offline'
            ? 'linear-gradient(135deg, #090d1a 0%, #0c1524 50%, #090d1a 100%)'
            : '#111827',
      }}
    >
      <ScanlineOverlay />

      {camera.status === 'offline' ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
          <WifiOff className="h-7 w-7 text-gray-600" />
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600">
            No Signal
          </p>
        </div>
      ) : (
        <svg className="absolute inset-0 h-full w-full opacity-[0.15]" xmlns="http://www.w3.org/2000/svg">
          <line x1="10%" y1="80%" x2="90%" y2="80%" stroke="#3b82f6" strokeWidth="0.5" />
          <line x1="30%" y1="30%" x2="30%" y2="80%" stroke="#3b82f6" strokeWidth="0.5" />
          <line x1="70%" y1="30%" x2="70%" y2="80%" stroke="#3b82f6" strokeWidth="0.5" />
        </svg>
      )}

      {/* Vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)',
        }}
      />
    </div>
  );
}

// ── Camera tile (grid view) ─────────────────────────────────

function SourceBadge({ source }: { source: string | null | undefined }) {
  const s = source ?? 'manual';
  const isVigi = s === 'vigi';
  return (
    <span
      className={cn(
        'rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide',
        isVigi
          ? 'bg-violet-600/85 text-violet-100'
          : 'bg-gray-700/85 text-gray-300',
      )}
    >
      {isVigi ? 'VIGI' : 'Manual'}
    </span>
  );
}

function CameraGridTile({
  camera,
  onClick,
  onPing,
  pingPending,
}: {
  camera: CameraDevice;
  onClick: () => void;
  onPing?: (e: React.MouseEvent) => void;
  pingPending?: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.18 }}
    >
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'group relative w-full overflow-hidden rounded-xl border transition-all duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
          camera.status === 'offline'
            ? 'border-gray-700/50 bg-gray-900/50 opacity-70'
            : 'border-gray-700/60 bg-gray-900 hover:border-blue-500/60 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]',
        )}
        style={{ aspectRatio: '16/9' }}
      >
        <LiveFeedThumbnail camera={camera} />

        {/* Hover overlay */}
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center bg-blue-900/20 opacity-0 transition-opacity duration-150',
            camera.status !== 'offline' && 'group-hover:opacity-100',
          )}
        >
          <div className="flex flex-col items-center gap-1 rounded-xl bg-black/60 px-4 py-2 backdrop-blur-sm">
            <Cctv className="h-5 w-5 text-blue-400" />
            <span className="text-xs font-semibold text-white">View Live</span>
          </div>
        </div>

        {/* Status dot — top left */}
        <div className="absolute left-2 top-2">
          <StatusDot status={camera.status} />
        </div>

        {/* Source — below status dot */}
        <div className="absolute left-2 top-8">
          <SourceBadge source={camera.source} />
        </div>

        {/* Status badge — top right */}
        <div className="absolute right-2 top-2">
          {camera.status === 'recording' && (
            <span className="flex items-center gap-1 rounded bg-red-600/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
              <Radio className="h-2.5 w-2.5" /> REC
            </span>
          )}
          {camera.status === 'online' && (
            <span className="flex items-center gap-1 rounded bg-emerald-700/80 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-200 backdrop-blur-sm">
              <Wifi className="h-2.5 w-2.5" /> LIVE
            </span>
          )}
          {camera.status === 'offline' && (
            <span className="rounded bg-gray-800/80 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 backdrop-blur-sm">
              OFFLINE
            </span>
          )}
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2.5">
          <div className="flex items-end justify-between gap-1">
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-white">{camera.label}</p>
              <p className="truncate text-[10px] text-gray-400">{camera.location}</p>
              {camera.lastMotionAt && camera.hasMotionDetect && (
                <p className="truncate text-[9px] text-blue-300/90">Motion {formatMotionAge(camera.lastMotionAt)}</p>
              )}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1 text-right">
              <p className="text-[10px] font-medium text-gray-400">{camera.resolution ?? '—'}</p>
              {camera.status !== 'offline' && (
                <p className="text-[10px] text-gray-500">{camera.fps ?? '—'} fps</p>
              )}
              {onPing && (
                <button
                  type="button"
                  onClick={(e) => onPing(e)}
                  disabled={pingPending}
                  title="Record feed check (updates last ping)"
                  className="rounded bg-black/50 px-1.5 py-0.5 text-[9px] font-semibold text-blue-300 backdrop-blur-sm hover:bg-black/70 disabled:opacity-50"
                >
                  {pingPending ? '…' : 'Ping'}
                </button>
              )}
            </div>
          </div>
        </div>
      </button>
    </motion.div>
  );
}

// ── Camera row (list view) ──────────────────────────────────

function CameraListRow({
  camera,
  onClick,
  onPing,
  pingPending,
}: {
  camera: CameraDevice;
  onClick: () => void;
  onPing?: (e: React.MouseEvent) => void;
  pingPending?: boolean;
}) {
  const lastMotionStr = camera.lastMotionAt
    ? new Date(camera.lastMotionAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '—';

  return (
    <motion.button
      layout
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -6 }}
      transition={{ duration: 0.14 }}
      onClick={onClick}
      className={cn(
        'flex w-full flex-col gap-3 rounded-xl border px-3 py-3 text-left transition-all duration-150 sm:flex-row sm:items-center sm:gap-3 sm:px-4',
        'border-gray-200/70 bg-white hover:border-blue-300 hover:bg-blue-50/40',
        'dark:border-gray-700/50 dark:bg-gray-900/60 dark:hover:border-blue-500/50 dark:hover:bg-gray-900',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.99]',
        camera.status === 'offline' && 'opacity-60',
      )}
    >
      {/* Thumbnail */}
      <div className="relative h-14 w-full shrink-0 overflow-hidden rounded-lg border border-gray-200 sm:h-12 sm:w-20 dark:border-gray-700/60">
        <LiveFeedThumbnail camera={camera} />
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <StatusDot status={camera.status} />
          <SourceBadge source={camera.source} />
          <span className="font-semibold text-gray-900 dark:text-white">{camera.label}</span>
          <span className="truncate text-sm text-gray-500">{camera.location}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
          <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] dark:bg-gray-800">
            {camera.resolution}
          </span>
          {camera.status !== 'offline' && (
            <span className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              {camera.fps ?? '—'} fps
            </span>
          )}
          <span>{camera.angle ?? '—'}</span>
          {camera.hasMotionDetect && (
            <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              Motion
            </span>
          )}
        </div>
      </div>

      {/* Last motion + status badge */}
      <div className="flex shrink-0 flex-row items-center justify-between gap-2 sm:flex-col sm:items-end sm:justify-start sm:gap-1.5">
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {camera.status === 'recording' && (
            <Badge variant="danger" size="sm" className="flex items-center gap-1">
              <Radio className="h-2.5 w-2.5" /> REC
            </Badge>
          )}
          {camera.status === 'online' && (
            <Badge variant="success" size="sm">LIVE</Badge>
          )}
          {camera.status === 'offline' && (
            <Badge variant="default" size="sm">OFFLINE</Badge>
          )}
          {onPing && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPing(e);
              }}
              disabled={pingPending}
              title="Record feed check"
              className="flex min-h-[32px] min-w-[32px] items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              <Signal className={cn('h-3.5 w-3.5', pingPending && 'animate-pulse')} />
            </button>
          )}
        </div>
        <span className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-600">
          <Clock className="h-3 w-3" />
          {lastMotionStr}
        </span>
      </div>
    </motion.button>
  );
}

// ── Stats bar ───────────────────────────────────────────────

function BranchStatsBar({ nvrLabel, cameras }: { nvrLabel: string; cameras: CameraDevice[] }) {
  const online = cameras.filter((c) => c.status !== 'offline').length;
  const recording = cameras.filter((c) => c.status === 'recording').length;
  const offline = cameras.filter((c) => c.status === 'offline').length;
  const pct = cameras.length > 0 ? Math.round((online / cameras.length) * 100) : 0;

  const statClass =
    'flex flex-col items-center justify-center rounded-xl border border-gray-200/90 bg-white px-2 py-2.5 text-center shadow-sm dark:border-gray-700/80 dark:bg-gray-800/90 sm:py-3';

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className={statClass}>
          <span className="text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400 sm:text-xl">
            {online}
          </span>
          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Online
          </span>
        </div>
        <div className={statClass}>
          <span className="flex items-center justify-center gap-1 text-lg font-bold tabular-nums text-red-500 sm:text-xl">
            <Radio className="h-3.5 w-3.5 sm:hidden" aria-hidden />
            {recording}
          </span>
          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Rec
          </span>
        </div>
        <div className={statClass}>
          <span className="text-lg font-bold tabular-nums text-gray-600 dark:text-gray-300 sm:text-xl">
            {offline}
          </span>
          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Off
          </span>
        </div>
      </div>
      <div className="flex min-w-0 items-center gap-2 rounded-xl border border-gray-200/80 bg-gray-50/90 px-3 py-2 dark:border-gray-700 dark:bg-gray-900/50">
        <span
          className={cn(
            'shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
            pct >= 90
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
              : pct >= 60
                ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
                : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300',
          )}
        >
          {pct}%
        </span>
        <span className="min-w-0 truncate text-xs text-gray-600 dark:text-gray-300" title={nvrLabel}>
          <span className="text-gray-400">NVR · </span>
          {nvrLabel}
        </span>
      </div>
    </div>
  );
}

// ── Empty state ─────────────────────────────────────────────

function EmptySearch({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-700/50 py-14 text-center">
      <Search className="mb-3 h-8 w-8 text-gray-600" />
      <p className="text-sm text-gray-400">
        No cameras match{' '}
        <span className="font-semibold text-gray-300">&ldquo;{query}&rdquo;</span>
      </p>
    </div>
  );
}

// ── View type ───────────────────────────────────────────────

type ViewMode = 'grid' | 'multiview' | 'list';
type FilterStatus = 'all' | 'online' | 'recording' | 'offline';

// ── Main page ───────────────────────────────────────────────

export default function BranchCameras() {
  const { branchId } = useParams<{ branchId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasRole } = usePermission();
  const canVigiManage = hasRole(['CEO', 'CO_MD', 'OP_MANAGER']);

  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [sourceFilter, setSourceFilter] = useState<'all' | 'manual' | 'vigi'>('all');
  const [sortKey, setSortKey] = useState<NonNullable<CamerasByBranchParams['sort']>>('label_asc');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  const listParams = useMemo((): CamerasByBranchParams => {
    const q = deferredSearch.trim();
    const p: CamerasByBranchParams = {
      limit: 500,
      ...(q ? { q } : {}),
      ...(sourceFilter !== 'all' ? { source: sourceFilter } : {}),
      sort: sortKey,
    };
    if (filterStatus === 'online') p.excludeOffline = true;
    else if (filterStatus === 'recording') p.status = 'recording';
    else if (filterStatus === 'offline') p.status = 'offline';
    return p;
  }, [deferredSearch, sourceFilter, sortKey, filterStatus]);

  const {
    data: branchPayload,
    isLoading: branchLoading,
    refetch: refetchBranch,
  } = useBranchDetail(branchId);

  const {
    data: cameraPage,
    isLoading: camerasLoading,
    isError: camerasError,
    error: camerasErr,
    refetch: refetchCameras,
  } = useCamerasByBranch(branchId, listParams);

  const pingMutation = useCameraPing();
  const [pingingId, setPingingId] = useState<string | null>(null);

  const handleCameraPing = useCallback(
    (cameraId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setPingingId(cameraId);
      pingMutation.mutate(cameraId, {
        onSuccess: () => toast.success('Feed check recorded'),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : 'Could not record feed check'),
        onSettled: () => setPingingId(null),
      });
    },
    [pingMutation],
  );

  const cameras = cameraPage?.data ?? [];
  const branchMeta = branchPayload?.branch;

  const displayBranch = useMemo(() => {
    if (branchMeta) return branchMeta;
    if (cameras.length > 0) {
      return {
        name: cameras[0].branchName ?? 'Branch',
        city: undefined as string | undefined,
        country: undefined as string | undefined,
        address: undefined as string | undefined,
      };
    }
    return null;
  }, [branchMeta, cameras]);

  const [selectedCamera, setSelectedCamera] = useState<CameraDevice | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const onSearchChange = useCallback((v: string) => setSearch(v), []);

  const clearAllFilters = useCallback(() => {
    setSearch('');
    setSourceFilter('all');
    setSortKey('label_asc');
    setFilterStatus('all');
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      refetchCameras(),
      branchId ? refetchBranch() : Promise.resolve(),
      queryClient.invalidateQueries({ queryKey: ['monitor-summary'] }),
    ]);
    setIsRefreshing(false);
  }, [refetchCameras, refetchBranch, branchId, queryClient]);

  const handleExportCsv = useCallback(async () => {
    if (!branchId) return;
    setExporting(true);
    try {
      await downloadCamerasExport({
        branchId,
        q: listParams.q,
        source: listParams.source,
        sort: listParams.sort,
        excludeOffline: listParams.excludeOffline,
        status: listParams.status,
      });
      toast.success('Camera list downloaded');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  }, [branchId, listParams]);

  useHeaderConfig(
    useMemo(
      () => ({
        title: displayBranch?.name ?? 'Branch Cameras',
        breadcrumbs: [
          { label: 'Monitor', href: '/monitor', icon: Cctv },
          { label: displayBranch?.name ?? '…' },
        ],
        actions: [
          {
            type: 'search' as const,
            placeholder: 'Search cameras…',
            value: search,
            onChange: onSearchChange,
          },
          {
            type: 'filter' as const,
            label: 'Source',
            icon: Layers,
            options: [
              { label: 'Manual', value: 'manual' },
              { label: 'Vigi', value: 'vigi' },
            ],
            value: sourceFilter === 'all' ? '' : sourceFilter,
            onChange: (v: string) =>
              setSourceFilter(v === '' ? 'all' : (v as 'manual' | 'vigi')),
          },
          {
            type: 'filter' as const,
            label: 'Sort',
            icon: ArrowDownUp,
            options: [
              { label: 'Name A–Z', value: 'label_asc' },
              { label: 'Name Z–A', value: 'label_desc' },
              { label: 'By status', value: 'status' },
              { label: 'Updated (newest)', value: 'updated_desc' },
              { label: 'Updated (oldest)', value: 'updated_asc' },
            ],
            value: sortKey === 'label_asc' ? '' : sortKey,
            onChange: (v: string) =>
              setSortKey(
                (v === '' ? 'label_asc' : v) as NonNullable<CamerasByBranchParams['sort']>,
              ),
          },
          {
            type: 'filter' as const,
            label: 'Status',
            icon: Activity,
            options: [
              { label: 'Online', value: 'online' },
              { label: 'Recording', value: 'recording' },
              { label: 'Offline', value: 'offline' },
            ],
            value: filterStatus === 'all' ? '' : filterStatus,
            onChange: (v: string) =>
              setFilterStatus(v === '' ? 'all' : (v as FilterStatus)),
          },
          {
            type: 'button' as const,
            label: '',
            ariaLabel: 'Camera and NVR settings',
            icon: Settings,
            variant: 'outline' as const,
            onClick: () => setSettingsOpen(true),
          },
        ],
      }),
      [
        displayBranch?.name,
        search,
        onSearchChange,
        sourceFilter,
        sortKey,
        filterStatus,
      ],
    ),
  );

  const pageLoading = (branchLoading || camerasLoading) && !displayBranch && cameras.length === 0;

  if (pageLoading) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <RefreshCw className="mb-3 h-8 w-8 animate-spin text-gray-400" />
          <p className="text-sm text-gray-500">Loading cameras…</p>
        </div>
      </PageTransition>
    );
  }

  if (camerasError && cameras.length === 0) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Cctv className="mb-3 h-10 w-10 text-gray-400" />
          <p className="text-sm text-red-600 dark:text-red-400">
            {camerasErr instanceof Error ? camerasErr.message : 'Could not load cameras.'}
          </p>
          <Button className="mt-4" variant="outline" onClick={() => refetchCameras()}>
            Retry
          </Button>
          <Button className="mt-2" variant="ghost" onClick={() => navigate('/monitor')}>
            Back to Monitor
          </Button>
        </div>
      </PageTransition>
    );
  }

  if (!displayBranch && cameras.length === 0) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Cctv className="mb-3 h-10 w-10 text-gray-400" />
          <p className="text-gray-500">Branch not found or you do not have access.</p>
          <Button className="mt-4" variant="outline" onClick={() => navigate('/monitor')}>
            Back to Monitor
          </Button>
        </div>
      </PageTransition>
    );
  }

  const showEmpty = cameras.length === 0;
  const totalMatching = cameraPage?.meta?.total ?? cameras.length;

  return (
    <PageTransition className="space-y-3 sm:space-y-5 pb-[max(1rem,env(safe-area-inset-bottom))]">
      {/* Stats bar */}
      <BranchStatsBar nvrLabel={cameras[0]?.nvrDevice ?? '—'} cameras={cameras} />

      {/* Actions: refresh, export, layout — search & filters live in the main header */}
      <div className="rounded-xl border border-gray-200/90 bg-white p-2 shadow-sm dark:border-gray-700/80 dark:bg-gray-900/40 sm:p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div className="min-w-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {cameras.length} of {totalMatching} cameras
            </span>
            {search.trim() && (
              <span className="truncate text-gray-500" title={search.trim()}>
                · “{search.trim()}”
              </span>
            )}
            {(sourceFilter !== 'all' || filterStatus !== 'all' || sortKey !== 'label_asc') && (
              <span className="text-gray-500">
                · filtered
              </span>
            )}
            {(search.trim() ||
              sourceFilter !== 'all' ||
              filterStatus !== 'all' ||
              sortKey !== 'label_asc') && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="shrink-0 font-medium text-primary-600 hover:underline dark:text-primary-400"
              >
                Reset all
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="flex h-10 items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 sm:hidden"
            >
              <Settings className="h-4 w-4" aria-hidden />
              Settings
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              aria-label="Refresh camera list"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-600 transition-colors hover:bg-gray-100 active:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={exporting || !branchId || cameras.length === 0}
              aria-label="Download camera list as CSV"
              title="Export CSV (current filters)"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-600 transition-colors hover:bg-gray-100 active:bg-gray-200 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <Download className={cn('h-4 w-4', exporting && 'animate-pulse')} />
            </button>
            <div
              className="inline-flex overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/80"
              role="group"
              aria-label="View layout"
            >
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                aria-pressed={viewMode === 'grid'}
                className={cn(
                  'flex h-10 w-10 items-center justify-center transition-colors sm:h-9 sm:w-9',
                  viewMode === 'grid'
                    ? 'bg-white text-primary-600 shadow-inner dark:bg-gray-700 dark:text-primary-400'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700/80',
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('multiview')}
                aria-label="Multiview 2 by 2"
                aria-pressed={viewMode === 'multiview'}
                className={cn(
                  'flex h-10 w-10 items-center justify-center border-x border-gray-200 transition-colors dark:border-gray-600 sm:h-9 sm:w-9',
                  viewMode === 'multiview'
                    ? 'bg-white text-primary-600 shadow-inner dark:bg-gray-700 dark:text-primary-400'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700/80',
                )}
              >
                <LayoutDashboard className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-label="List view"
                aria-pressed={viewMode === 'list'}
                className={cn(
                  'flex h-10 w-10 items-center justify-center transition-colors sm:h-9 sm:w-9',
                  viewMode === 'list'
                    ? 'bg-white text-primary-600 shadow-inner dark:bg-gray-700 dark:text-primary-400'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700/80',
                )}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Grid view ── */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {cameras.map((cam) => (
              <CameraGridTile
                key={cam.id}
                camera={cam}
                onClick={() => setSelectedCamera(cam)}
                onPing={(e) => handleCameraPing(cam.id, e)}
                pingPending={pingingId === cam.id}
              />
            ))}
          </AnimatePresence>
          {showEmpty && (
            <div className="col-span-full">
              {search ? (
                <EmptySearch query={search} />
              ) : (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <Cctv className="mb-3 h-9 w-9 text-gray-400" />
                  <p className="text-sm text-gray-500">No cameras match this filter.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Multiview 2×2 ── */}
      {viewMode === 'multiview' && (
        <motion.div
          key="multiview-grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-h-[70vh] overflow-hidden rounded-xl border border-gray-800/60 bg-black sm:max-h-none"
          style={{ aspectRatio: '16/9' }}
        >
          <div className="grid h-full grid-cols-2 grid-rows-2 gap-0.5 bg-gray-950 p-0.5">
            {cameras.slice(0, 4).map((cam, i) => (
              <button
                key={cam.id}
                onClick={() => setSelectedCamera(cam)}
                className={cn(
                  'group relative overflow-hidden bg-gray-950 transition-all duration-150',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500',
                  cam.status !== 'offline' && 'hover:ring-2 hover:ring-inset hover:ring-blue-500/60',
                )}
              >
                <div className="relative h-full w-full">
                  <LiveFeedThumbnail camera={cam} />
                </div>

                {/* Hover overlay */}
                <div
                  className={cn(
                    'absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-150',
                    cam.status !== 'offline' && 'group-hover:opacity-100',
                  )}
                >
                  <div className="rounded-xl bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                    View Live
                  </div>
                </div>

                {/* CAM label */}
                <div className="absolute left-1.5 top-1.5 flex items-center gap-1">
                  <StatusDot status={cam.status} />
                  <span className="text-[9px] font-mono text-gray-500">CAM {i + 1}</span>
                </div>

                {/* Status badge */}
                {cam.status === 'recording' && (
                  <div className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded bg-red-600/90 px-1 py-0.5 text-[9px] font-bold uppercase text-white backdrop-blur-sm">
                    <Radio className="h-2 w-2" /> REC
                  </div>
                )}

                {/* Bottom label */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-2 py-1.5">
                  <p className="truncate text-[10px] font-bold text-white">{cam.label}</p>
                  <p className="truncate text-[9px] text-gray-400">{cam.location}</p>
                </div>
              </button>
            ))}

            {/* Filler cells if < 4 */}
            {Array.from({ length: Math.max(0, 4 - cameras.length) }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex items-center justify-center bg-gray-950/80"
              >
                <Cctv className="h-6 w-6 text-gray-800" />
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── List view ── */}
      {viewMode === 'list' && (
        <div className="flex flex-col gap-2">
          <AnimatePresence mode="popLayout">
            {cameras.map((cam) => (
              <CameraListRow
                key={cam.id}
                camera={cam}
                onClick={() => setSelectedCamera(cam)}
                onPing={(e) => handleCameraPing(cam.id, e)}
                pingPending={pingingId === cam.id}
              />
            ))}
          </AnimatePresence>
          {showEmpty && (
            search ? (
              <EmptySearch query={search} />
            ) : (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <Cctv className="mb-3 h-9 w-9 text-gray-400" />
                <p className="text-sm text-gray-500">No cameras match this filter.</p>
              </div>
            )
          )}
        </div>
      )}

      <Modal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Camera & NVR settings"
        description="Configure the Vigi NVR integration for this branch and sync imported channels. Search, source, sort, and status filters are in the header."
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            <strong className="text-gray-900 dark:text-gray-100">Importing cameras:</strong> connect the NVR, save the
            integration, then use <strong>Sync cameras</strong> to pull channels. Manual camera records are maintained
            through your existing admin or API workflows.
          </p>
          {branchId ? (
            <VigiIntegrationCard branchId={branchId} canManage={canVigiManage} />
          ) : (
            <p className="text-sm text-gray-500">Branch context is missing.</p>
          )}
        </div>
      </Modal>

      {/* Live viewer modal */}
      <LiveViewerModal
        camera={selectedCamera}
        branch={displayBranch ? { name: displayBranch.name } : null}
        siblingCameras={cameras}
        onClose={() => setSelectedCamera(null)}
        onSelectCamera={setSelectedCamera}
      />
    </PageTransition>
  );
}
