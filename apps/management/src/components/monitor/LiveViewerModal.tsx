import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Maximize2, Minimize2, Volume2, VolumeX, Radio, Wifi, WifiOff,
  Camera, ChevronLeft, ChevronRight, Activity, Clock, Settings2,
  Download, Share2, AlertTriangle, LayoutGrid, Copy, Film, Link2,
  ExternalLink, RefreshCw, Keyboard, PictureInPicture2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';
import type { CameraDevice, CameraExportWindowResult } from '@/api/monitor';
import { useCameraStreamUrls, useCameraExportWindow } from '@/api/monitor';

function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function isEditableTarget(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

function isProbablyHls(url: string | null | undefined): boolean {
  if (!url) return false;
  return /\.m3u8(\?|$)/i.test(url) || url.includes('m3u8');
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

interface LiveViewerModalProps {
  camera: CameraDevice | null;
  branch: { name: string } | null;
  siblingCameras: CameraDevice[];
  onClose: () => void;
  onSelectCamera: (camera: CameraDevice) => void;
}

// ── Live clock hook ─────────────────────────────────────────

function useLiveClock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

// ── Status dot ──────────────────────────────────────────────

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
            : 'bg-gray-500',
        )}
      />
    </span>
  );
}

// ── Scanline overlay ────────────────────────────────────────

function ScanlineOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10"
      style={{
        background:
          'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.025) 2px, rgba(0,0,0,0.025) 4px)',
      }}
    />
  );
}

// ── No signal ───────────────────────────────────────────────

function NoSignalPlaceholder({ camera }: { camera: CameraDevice }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gray-950">
      <ScanlineOverlay />
      <div className="flex flex-col items-center gap-2 rounded-xl border border-red-900/30 bg-red-950/40 px-6 py-4 backdrop-blur-sm">
        <WifiOff className="h-10 w-10 text-red-700" />
        <p className="text-sm font-bold uppercase tracking-widest text-red-500">
          No Signal
        </p>
        <p className="text-xs text-gray-600">{camera.label} · {camera.location}</p>
      </div>
    </div>
  );
}

// ── Live feed canvas placeholder ────────────────────────────
// Uses requestAnimationFrame throttled to ~15 fps to save CPU.
// Each camera gets a unique noise signature via a seed.

function LiveFeedPlaceholder({ camera, isMuted }: { camera: CameraDevice; isMuted: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const lastDrawRef = useRef(0);
  const TARGET_FPS = 15;
  const FRAME_INTERVAL = 1000 / TARGET_FPS;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId: number;
    const seed = camera.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);

    // Pre-create a reusable ImageData buffer
    const W = canvas.width;
    const H = canvas.height;
    // Alias so TypeScript knows it is non-null inside the nested draw() closure
    const c = ctx;
    const imgData = c.createImageData(W, H);
    const px = imgData.data;

    function draw(ts: number) {
      animId = requestAnimationFrame(draw);
      if (ts - lastDrawRef.current < FRAME_INTERVAL) return;
      lastDrawRef.current = ts;
      frameRef.current++;

      const frame = frameRef.current;

      // Dark noise
      for (let i = 0; i < px.length; i += 4) {
        const n = ((Math.random() * 14) | 0) + (seed % 4);
        px[i] = n;
        px[i + 1] = n;
        px[i + 2] = n + 3;
        px[i + 3] = 255;
      }
      c.putImageData(imgData, 0, 0);

      // Blue scan beam
      const scanY = (frame * 2) % H;
      const g = c.createLinearGradient(0, scanY - 24, 0, scanY + 24);
      g.addColorStop(0, 'rgba(59,130,246,0)');
      g.addColorStop(0.5, 'rgba(59,130,246,0.07)');
      g.addColorStop(1, 'rgba(59,130,246,0)');
      c.fillStyle = g;
      c.fillRect(0, scanY - 24, W, 48);

      // Fake room silhouette — floor + walls
      const t = 0.38 + Math.sin(frame * 0.015) * 0.04;
      c.strokeStyle = `rgba(30,50,90,${t})`;
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(W * 0.08, H * 0.82);
      c.lineTo(W * 0.92, H * 0.82);
      c.moveTo(W * 0.28, H * 0.25);
      c.lineTo(W * 0.28, H * 0.82);
      c.moveTo(W * 0.72, H * 0.25);
      c.lineTo(W * 0.72, H * 0.82);
      c.stroke();

      // Optional simulated motion blip
      if (camera.hasMotionDetect && frame % 90 < 3) {
        const bx = W * 0.35 + (seed % 50);
        const by = H * 0.4 + (seed % 30);
        c.strokeStyle = 'rgba(239,68,68,0.6)';
        c.lineWidth = 1;
        c.strokeRect(bx, by, 50, 40);
      }

      // Vignette
      const vg = c.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(0,0,0,0.55)');
      c.fillStyle = vg;
      c.fillRect(0, 0, W, H);
    }

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera.id]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <ScanlineOverlay />
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        width={960}
        height={540}
        aria-label={`Live feed for ${camera.label}`}
        style={{ display: 'block', objectFit: 'cover' }}
      />
      {/* Muted overlay indicator */}
      <AnimatePresence>
        {isMuted && (
          <motion.div
            key="muted"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-20 right-4 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur-sm"
          >
            <VolumeX className="h-3.5 w-3.5 text-gray-300" />
            Muted
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Thumbnail card ──────────────────────────────────────────

function ThumbnailCard({
  camera,
  isActive,
  onClick,
}: {
  camera: CameraDevice;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-lg border-2 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
        isActive
          ? 'border-blue-500 shadow-[0_0_0_1px_rgba(59,130,246,0.35)]'
          : 'border-gray-700/60 hover:border-gray-500 hover:shadow-md',
      )}
      style={{ aspectRatio: '16/9' }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            camera.status !== 'offline'
              ? 'linear-gradient(135deg, #090d1a 0%, #0c1524 50%, #090d1a 100%)'
              : '#111827',
        }}
      />
      <ScanlineOverlay />

      {camera.status === 'offline' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <WifiOff className="h-4 w-4 text-gray-600" />
        </div>
      )}

      <div className="absolute left-1.5 top-1.5">
        <StatusDot status={camera.status} />
      </div>

      {camera.status === 'recording' && (
        <div className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded bg-red-600/90 px-1 py-0.5 text-[9px] font-bold uppercase text-white">
          <Radio className="h-2 w-2" />
          REC
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 to-transparent px-1.5 py-1">
        <p className="truncate text-[10px] font-semibold text-white">{camera.label}</p>
        <p className="truncate text-[9px] text-gray-400">{camera.location}</p>
      </div>
    </button>
  );
}

// ── Main modal ──────────────────────────────────────────────

export function LiveViewerModal({
  camera,
  branch,
  siblingCameras,
  onClose,
  onSelectCamera,
}: LiveViewerModalProps) {
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [showMultiview, setShowMultiview] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [exportStart, setExportStart] = useState('');
  const [exportEnd, setExportEnd] = useState('');
  const [exportStream, setExportStream] = useState<1 | 2>(1);
  const [exportResult, setExportResult] = useState<CameraExportWindowResult | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [pipSupported, setPipSupported] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsVideoRef = useRef<HTMLVideoElement>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const now = useLiveClock();

  useEffect(() => {
    setPipSupported(
      typeof document !== 'undefined' &&
        'pictureInPictureEnabled' in document &&
        document.pictureInPictureEnabled !== false,
    );
  }, []);

  const {
    data: streamUrls,
    isError: streamUrlsError,
    isFetching: streamUrlsFetching,
    refetch: refetchStreamUrls,
  } = useCameraStreamUrls(camera?.id);
  const exportWin = useCameraExportWindow();

  const applyExportPreset = useCallback((minutesBack: number) => {
    const end = new Date();
    const start = new Date(end.getTime() - minutesBack * 60_000);
    setExportEnd(toDatetimeLocalValue(end));
    setExportStart(toDatetimeLocalValue(start));
    setExportResult(null);
  }, []);

  /** Centered window around last motion (±3 min each side, 6 min total). */
  const applyExportAroundLastMotion = useCallback(() => {
    if (!camera?.lastMotionAt) return;
    const center = new Date(camera.lastMotionAt);
    if (Number.isNaN(center.getTime())) return;
    const padMs = 3 * 60_000;
    const start = new Date(center.getTime() - padMs);
    const end = new Date(center.getTime() + padMs);
    setExportStart(toDatetimeLocalValue(start));
    setExportEnd(toDatetimeLocalValue(end));
    setExportResult(null);
    toast.message('Range set around last motion event (+/− 3 min)');
  }, [camera?.lastMotionAt]);

  useEffect(() => {
    if (!camera || !showExport) return;
    setExportResult(null);
    applyExportPreset(20);
  }, [camera?.id, showExport, applyExportPreset]);

  const currentIndex = siblingCameras.findIndex((c) => c.id === camera?.id);
  const onlineCameras = siblingCameras.filter((c) => c.status !== 'offline');

  const hlsPlaybackUrl =
    (streamUrls?.mode === 'vigi' ? streamUrls.storedStreamUrl : streamUrls?.mode === 'manual' ? streamUrls.streamUrl : null) ??
    camera?.streamUrl ??
    null;
  const showHls = !!camera && camera.status !== 'offline' && isProbablyHls(hlsPlaybackUrl);

  const goNext = useCallback(() => {
    if (!camera) return;
    const next = siblingCameras[(currentIndex + 1) % siblingCameras.length];
    if (next) onSelectCamera(next);
  }, [camera, currentIndex, siblingCameras, onSelectCamera]);

  const goPrev = useCallback(() => {
    if (!camera) return;
    const prev =
      siblingCameras[(currentIndex - 1 + siblingCameras.length) % siblingCameras.length];
    if (prev) onSelectCamera(prev);
  }, [camera, currentIndex, siblingCameras, onSelectCamera]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => null);
    } else {
      document.exitFullscreen().catch(() => null);
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!camera) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showShortcuts) {
          setShowShortcuts(false);
          return;
        }
        if (showExport) {
          setShowExport(false);
          setExportResult(null);
          return;
        }
        onClose();
        return;
      }
      if (isEditableTarget(e.target)) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      }
      if (e.key === 'm' || e.key === 'M') setIsMuted((m) => !m);
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
      if (e.key === 'e' || e.key === 'E') {
        const vigi =
          streamUrls?.mode === 'vigi' || camera.source === 'vigi';
        if (vigi && camera.status !== 'offline') setShowExport(true);
      }
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowShortcuts((s) => !s);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [
    camera,
    onClose,
    goNext,
    goPrev,
    showExport,
    showShortcuts,
    toggleFullscreen,
    streamUrls?.mode,
  ]);

  // Auto-hide controls after inactivity
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => setShowControls(false), 4000);
  }, []);

  useEffect(() => {
    resetControlsTimer();
    return () => {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, [camera?.id, resetControlsTimer]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Don't render anything if no camera selected
  const isOpen = !!camera && !!branch;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="viewer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 bg-black/92 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal panel */}
          <motion.div
            key="viewer-panel"
            ref={containerRef}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            onMouseMove={resetControlsTimer}
            onTouchStart={resetControlsTimer}
            className="fixed inset-0 z-50 flex overflow-hidden rounded-none bg-gray-950 shadow-2xl ring-1 ring-white/[0.08] sm:inset-4 sm:rounded-2xl md:inset-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Main content area ── */}
            <div className="relative z-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">

              {/* Multiview grid overlay (2×2) */}
              <AnimatePresence>
                {showMultiview && (
                  <motion.div
                    key="multiview"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-20 grid grid-cols-2 gap-0.5 bg-black p-0.5"
                  >
                    {onlineCameras.slice(0, 4).map((cam, i) => (
                      <button
                        key={cam.id}
                        onClick={() => { onSelectCamera(cam); setShowMultiview(false); }}
                        className="group relative overflow-hidden bg-gray-950 hover:ring-2 hover:ring-blue-500/60"
                      >
                        <div className="h-full w-full"
                          style={{
                            background: 'linear-gradient(135deg, #090d1a 0%, #0c1524 100%)',
                          }}
                        >
                          <ScanlineOverlay />
                          <svg className="absolute inset-0 h-full w-full opacity-10">
                            <line x1="10%" y1="80%" x2="90%" y2="80%" stroke="#3b82f6" strokeWidth="0.5" />
                          </svg>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2">
                          <p className="text-[10px] font-bold text-white">{cam.label}</p>
                          <p className="text-[9px] text-gray-400">{cam.location}</p>
                        </div>
                        {cam.id === camera!.id && (
                          <div className="absolute inset-0 ring-2 ring-inset ring-blue-500/70" />
                        )}
                        <span className="absolute left-1.5 top-1.5 text-[8px] font-mono text-gray-500">
                          CAM {i + 1}
                        </span>
                      </button>
                    ))}
                    {/* Close multiview */}
                    <button
                      onClick={() => setShowMultiview(false)}
                      className="absolute right-2 top-2 z-30 rounded-lg bg-black/60 p-2 text-gray-300 hover:bg-white/10 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Video feed */}
              <div className="relative flex-1 bg-black">
                {camera!.status === 'offline' ? (
                  <NoSignalPlaceholder camera={camera!} />
                ) : showHls && hlsPlaybackUrl ? (
                  <div className="relative h-full w-full">
                    <video
                      ref={hlsVideoRef}
                      src={hlsPlaybackUrl}
                      className="h-full w-full object-contain"
                      controls
                      playsInline
                      muted={isMuted}
                      autoPlay
                      onError={() => {
                        toast.error(
                          'Could not play this stream. Check the URL, CORS, and that the feed is reachable from your network.',
                        );
                      }}
                    />
                    <div className="pointer-events-none absolute left-3 top-20 rounded bg-emerald-600/85 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                      HLS live
                    </div>
                    {pipSupported && (
                      <button
                        type="button"
                        title="Picture-in-picture"
                        onClick={async () => {
                          const v = hlsVideoRef.current;
                          if (!v) return;
                          try {
                            if (document.pictureInPictureElement === v) {
                              await document.exitPictureInPicture();
                            } else {
                              await v.requestPictureInPicture();
                            }
                          } catch {
                            toast.error('Picture-in-picture is not available for this stream');
                          }
                        }}
                        className="absolute right-3 top-20 rounded-lg bg-black/55 p-2 text-white backdrop-blur-sm hover:bg-black/75"
                      >
                        <PictureInPicture2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <LiveFeedPlaceholder camera={camera!} isMuted={isMuted} />
                    {streamUrlsFetching && !streamUrls && !streamUrlsError && (
                      <div className="absolute bottom-28 left-2 right-2 z-20 rounded-lg border border-white/10 bg-black/70 px-3 py-2 text-[11px] text-gray-300 backdrop-blur-sm sm:bottom-24 sm:left-3 sm:right-3">
                        Loading NVR stream URLs…
                      </div>
                    )}
                    {streamUrlsError && (
                      <div className="absolute bottom-28 left-2 right-2 z-20 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/35 bg-amber-950/80 px-3 py-2.5 text-[11px] text-amber-100 backdrop-blur-md sm:bottom-24 sm:left-3 sm:right-3">
                        <span>Could not load stream URLs from the server.</span>
                        <button
                          type="button"
                          onClick={() => refetchStreamUrls()}
                          className="rounded-md bg-amber-600/90 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-amber-500"
                        >
                          Retry
                        </button>
                      </div>
                    )}
                    {streamUrls?.mode === 'vigi' && (
                      <div className="absolute bottom-28 left-2 right-2 z-20 flex max-h-[42vh] flex-col gap-2 overflow-y-auto rounded-xl border border-white/10 bg-black/75 p-2.5 text-[10px] text-gray-200 backdrop-blur-md sm:bottom-24 sm:left-3 sm:right-3 sm:max-h-none sm:flex-row sm:items-start sm:justify-between sm:p-3 sm:text-[11px]">
                        <div className="flex items-start gap-2 min-w-0">
                          <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
                          <div className="min-w-0">
                            <p className="font-semibold text-white">Branch NVR (TP-Link VIGI)</p>
                            <p className="text-[10px] text-gray-400">
                              CH{streamUrls.channel} · RTSP port {streamUrls.rtspPort} · Browsers cannot play RTSP — use
                              VLC or open NVR web UI on LAN.
                            </p>
                            <p className="mt-1 text-[10px] text-gray-500">{streamUrls.nvrWebUiHint}</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5 sm:items-end">
                          <div className="flex flex-wrap gap-1.5 justify-end">
                            <a
                              href={streamUrls.nvrHttpsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg bg-blue-600/90 px-2.5 py-1.5 text-[10px] font-medium text-white hover:bg-blue-500"
                            >
                              <ExternalLink className="h-3 w-3" /> Open NVR
                            </a>
                            <button
                              type="button"
                              onClick={async () => {
                                const r = await refetchStreamUrls();
                                if (r.isError) toast.error('Could not refresh stream URLs');
                              }}
                              className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-[10px] font-medium text-white hover:bg-white/20"
                            >
                              <RefreshCw className="h-3 w-3" /> Refresh
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5 justify-end">
                            <button
                              type="button"
                              onClick={async () => {
                                const ok = await copyText(streamUrls.liveMain);
                                if (ok) toast.success('Main (HD) RTSP copied — paste in VLC');
                                else toast.error('Could not copy to clipboard');
                              }}
                              className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-[10px] font-medium text-white hover:bg-white/20"
                            >
                              <Copy className="h-3 w-3" /> Main RTSP
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                const ok = await copyText(streamUrls.liveSub);
                                if (ok) toast.success('Sub stream RTSP copied — lower bandwidth');
                                else toast.error('Could not copy to clipboard');
                              }}
                              className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-[10px] font-medium text-white hover:bg-white/20"
                            >
                              <Copy className="h-3 w-3" /> Sub RTSP
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    {streamUrls?.mode === 'manual' && (camera.rtspUrl || camera.streamUrl) && (
                      <div className="absolute bottom-28 left-2 right-2 z-20 rounded-lg border border-white/10 bg-black/70 px-3 py-2 text-[10px] text-gray-300 backdrop-blur-sm sm:bottom-24 sm:left-3 sm:right-3">
                        Set an HLS (.m3u8) stream URL on the camera for in-browser video; RTSP: copy from camera record
                        for VLC.
                      </div>
                    )}
                  </>
                )}

                {/* Offline banner */}
                {camera!.status === 'offline' && (
                  <motion.div
                    initial={{ y: -40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="absolute left-4 right-4 top-16 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/80 px-4 py-2.5 text-sm text-red-300 backdrop-blur-sm"
                  >
                    <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
                    Camera offline
                    {camera!.lastMotionAt && (
                      <span className="ml-1 text-red-400">
                        — last seen {new Date(camera!.lastMotionAt).toLocaleString()}
                      </span>
                    )}
                  </motion.div>
                )}

                {/* ── Top HUD — always visible ── */}
                <div className="absolute left-0 right-0 top-0 bg-gradient-to-b from-black/80 via-black/30 to-transparent p-3 pb-6 pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-4 sm:pb-8">
                  <div className="flex items-start justify-between gap-2 sm:gap-3">
                    {/* Left: camera identity */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <StatusDot status={camera!.status} />
                        <span className="text-sm font-bold text-white">{camera!.label}</span>
                        {camera!.status === 'recording' && (
                          <span className="flex items-center gap-1 rounded bg-red-600/90 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                            <Radio className="h-3 w-3" /> REC
                          </span>
                        )}
                        {camera!.status === 'online' && (
                          <span className="flex items-center gap-1 rounded bg-emerald-700/70 px-2 py-0.5 text-xs font-semibold text-emerald-200 backdrop-blur-sm">
                            <Wifi className="h-3 w-3" /> LIVE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {branch!.name} &mdash; {camera!.location}
                      </p>
                      {camera!.lastMotionAt && (
                        <p className="text-[10px] text-gray-500">
                          Last motion {new Date(camera!.lastMotionAt).toLocaleString()}
                        </p>
                      )}
                    </div>

                    {/* Right: controls */}
                    <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
                      <button
                        type="button"
                        onClick={() => setShowShortcuts(true)}
                        title="Keyboard shortcuts (?)"
                        className="rounded-lg p-2.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white sm:p-2"
                      >
                        <Keyboard className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setShowMultiview((v) => !v)}
                        title="Multi-view (4 cameras)"
                        className="rounded-lg p-2.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white sm:p-2"
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setShowSidebar((s) => !s)}
                        title="Toggle camera list"
                        className="rounded-lg p-2.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white sm:p-2"
                      >
                        <Camera className="h-4 w-4" />
                      </button>
                      <button
                        onClick={onClose}
                        title="Close (Esc)"
                        className="rounded-lg p-2.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white sm:p-2"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── Bottom controls — auto-hide ── */}
                <motion.div
                  animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : 8 }}
                  transition={{ duration: 0.25 }}
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-8 sm:p-4 sm:pt-10"
                >
                  {/* Info row */}
                  <div className="mb-2.5 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      {camera!.fps ?? 25} fps
                    </span>
                    <span className="rounded bg-gray-800/60 px-1.5 py-0.5 font-mono text-[10px]">
                      {camera!.resolution ?? '—'}
                    </span>
                    <span>{camera!.angle ?? '—'}</span>
                    {camera!.hasAudio && (
                      <span className="rounded bg-gray-800/60 px-1.5 py-0.5 text-[10px]">
                        Audio
                      </span>
                    )}
                    {camera!.hasMotionDetect && (
                      <span className="rounded bg-blue-900/50 px-1.5 py-0.5 text-[10px] text-blue-300">
                        Motion
                      </span>
                    )}
                    <span className="ml-auto flex items-center gap-1 tabular-nums">
                      <Clock className="h-3 w-3" />
                      {now.toLocaleTimeString()}
                    </span>
                  </div>

                  {/* Camera prev / next + action buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={goPrev}
                      title="Previous camera (←)"
                      className="rounded-lg p-2 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="text-xs tabular-nums text-gray-500">
                      {currentIndex + 1} / {siblingCameras.length}
                    </span>
                    <button
                      onClick={goNext}
                      title="Next camera (→)"
                      className="rounded-lg p-2 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>

                    <div className="flex-1" />

                    <button
                      onClick={() => setIsMuted((m) => !m)}
                      title="Toggle mute (M)"
                      className={cn(
                        'rounded-lg p-2 transition-colors hover:bg-white/10',
                        isMuted ? 'text-gray-500' : 'text-white',
                      )}
                    >
                      {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </button>
                    <button
                      type="button"
                      title="Export recorded footage (E)"
                      onClick={() => setShowExport(true)}
                      className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <Download className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      title="Copy stream URL (RTSP or HLS)"
                      onClick={async () => {
                        const url =
                          streamUrls?.mode === 'vigi'
                            ? streamUrls.liveMain
                            : hlsPlaybackUrl ?? camera.streamUrl ?? camera.rtspUrl;
                        if (!url) {
                          toast.message('No stream URL yet — use NVR buttons above or set HLS/RTSP on the camera.');
                          return;
                        }
                        const ok = await copyText(url);
                        if (ok) toast.success('Stream URL copied');
                        else toast.error('Could not copy to clipboard');
                      }}
                      className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <Share2 className="h-5 w-5" />
                    </button>
                    <button
                      title="Camera settings"
                      className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <Settings2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={toggleFullscreen}
                      title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}
                      className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      {isFullscreen ? (
                        <Minimize2 className="h-5 w-5" />
                      ) : (
                        <Maximize2 className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </motion.div>
              </div>
            </div>

            {showSidebar && (
              <button
                type="button"
                aria-label="Close camera list"
                className="absolute inset-0 z-[54] bg-black/55 md:hidden"
                onClick={() => setShowSidebar(false)}
              />
            )}

            {/* ── Camera list sidebar ── */}
            <AnimatePresence initial={false}>
              {showSidebar && (
                <motion.div
                  key="cam-sidebar"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 224, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                  className="relative z-[56] max-md:absolute max-md:right-0 max-md:top-0 max-md:h-full max-md:shadow-2xl md:relative md:z-auto"
                  style={{ overflow: 'hidden', flexShrink: 0 }}
                >
                  <div className="flex h-full w-56 flex-col border-l border-white/[0.08] bg-gray-900/90 backdrop-blur-md">
                    <div className="flex items-center justify-between border-b border-white/[0.07] px-3 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Cameras ({siblingCameras.length})
                      </p>
                      <span className="text-[10px] text-gray-600">
                        {onlineCameras.length} online
                      </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
                      <div className="flex flex-col gap-1.5">
                        {siblingCameras.map((cam) => (
                          <ThumbnailCard
                            key={cam.id}
                            camera={cam}
                            isActive={cam.id === camera!.id}
                            onClick={() => onSelectCamera(cam)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showExport && camera && (
                <motion.div
                  key="export-dialog"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-4"
                  onClick={() => {
                    setShowExport(false);
                    setExportResult(null);
                  }}
                >
                  <motion.div
                    initial={{ scale: 0.96, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.96, opacity: 0 }}
                    className="max-h-[min(90vh,720px)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-2xl border border-gray-600 bg-gray-950 p-4 shadow-2xl sm:p-5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="mb-4 flex items-center justify-between gap-2">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                        <Film className="h-4 w-4 shrink-0 text-blue-400" />
                        Export footage (replay RTSP)
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          setShowExport(false);
                          setExportResult(null);
                        }}
                        className="rounded-lg p-1 text-gray-400 hover:bg-white/10 hover:text-white"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <p className="mb-4 text-[11px] leading-relaxed text-gray-400">
                      Generates a TP-Link VIGI <span className="text-gray-200">replay</span> URL for the selected window.
                      Open in VLC (Media → Open Network Stream). Your PC must reach the NVR RTSP port (554).
                    </p>
                    {streamUrls?.mode !== 'vigi' ? (
                      <p className="text-sm text-amber-400/95">
                        Connect a VIGI NVR on this branch and sync cameras first.
                      </p>
                    ) : (
                      <>
                        <div className="mb-3 flex flex-wrap gap-2">
                          <span className="w-full text-[10px] font-medium uppercase tracking-wide text-gray-500">
                            Quick range
                          </span>
                          {(
                            [
                              { label: 'Last 5 min', m: 5 },
                              { label: 'Last 15 min', m: 15 },
                              { label: 'Last 1 hr', m: 60 },
                            ] as const
                          ).map(({ label, m }) => (
                            <button
                              key={label}
                              type="button"
                              onClick={() => applyExportPreset(m)}
                              className="rounded-lg border border-gray-600 bg-gray-900/80 px-2.5 py-1 text-[11px] text-gray-200 hover:border-gray-500 hover:bg-gray-800"
                            >
                              {label}
                            </button>
                          ))}
                          {camera.lastMotionAt && (
                            <button
                              type="button"
                              onClick={applyExportAroundLastMotion}
                              className="rounded-lg border border-blue-600/50 bg-blue-950/40 px-2.5 py-1 text-[11px] text-blue-200 hover:border-blue-500 hover:bg-blue-900/50"
                            >
                              Around last motion (±3 min)
                            </button>
                          )}
                        </div>
                        <div className="mb-4">
                          <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-wide text-gray-500">
                            Replay quality
                          </span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setExportStream(1)}
                              className={cn(
                                'flex-1 rounded-lg border px-3 py-2 text-left text-xs transition-colors',
                                exportStream === 1
                                  ? 'border-blue-500 bg-blue-950/60 text-white'
                                  : 'border-gray-600 bg-black/40 text-gray-300 hover:border-gray-500',
                              )}
                            >
                              <span className="font-semibold">Main stream</span>
                              <span className="mt-0.5 block text-[10px] text-gray-500">Higher quality (matches Main RTSP)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setExportStream(2)}
                              className={cn(
                                'flex-1 rounded-lg border px-3 py-2 text-left text-xs transition-colors',
                                exportStream === 2
                                  ? 'border-blue-500 bg-blue-950/60 text-white'
                                  : 'border-gray-600 bg-black/40 text-gray-300 hover:border-gray-500',
                              )}
                            >
                              <span className="font-semibold">Sub stream</span>
                              <span className="mt-0.5 block text-[10px] text-gray-500">Smaller file / lower bandwidth</span>
                            </button>
                          </div>
                        </div>
                        <div className="mb-4 space-y-3">
                          <div>
                            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-gray-500">
                              Start
                            </label>
                            <input
                              type="datetime-local"
                              value={exportStart}
                              onChange={(e) => setExportStart(e.target.value)}
                              className="w-full rounded-lg border border-gray-600 bg-black/50 px-3 py-2 text-sm text-white"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-gray-500">
                              End
                            </label>
                            <input
                              type="datetime-local"
                              value={exportEnd}
                              onChange={(e) => setExportEnd(e.target.value)}
                              className="w-full rounded-lg border border-gray-600 bg-black/50 px-3 py-2 text-sm text-white"
                            />
                          </div>
                        </div>
                        <p className="mb-3 text-[10px] text-gray-600">
                          Max window 7 days. Times use your local timezone; the server sends UTC to the NVR.
                        </p>
                        <button
                          type="button"
                          disabled={exportWin.isPending}
                          onClick={async () => {
                            try {
                              const s = new Date(exportStart);
                              const en = new Date(exportEnd);
                              if (Number.isNaN(s.getTime()) || Number.isNaN(en.getTime())) {
                                toast.error('Invalid start or end time');
                                return;
                              }
                              if (en <= s) {
                                toast.error('End time must be after start time');
                                return;
                              }
                              const r = await exportWin.mutateAsync({
                                cameraId: camera.id,
                                start: s.toISOString(),
                                end: en.toISOString(),
                                stream: exportStream,
                              });
                              setExportResult(r);
                              toast.success('Replay URL ready — copy below or open in VLC');
                            } catch (err) {
                              setExportResult(null);
                              toast.error(err instanceof Error ? err.message : 'Could not build replay URL');
                            }
                          }}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                        >
                          {exportWin.isPending ? 'Generating…' : 'Generate replay RTSP URL'}
                        </button>
                        {exportResult && (
                          <div className="mt-4 space-y-2 rounded-xl border border-gray-700 bg-black/40 p-3">
                            <p className="text-[10px] text-gray-500">
                              Duration ~{exportResult.durationMinutes} min · CH{exportResult.channel} ·{' '}
                              {exportResult.stream === 1 ? 'Main' : 'Sub'} stream
                            </p>
                            <textarea
                              readOnly
                              rows={3}
                              value={exportResult.replayRtsp}
                              className="w-full resize-none rounded-lg border border-gray-600 bg-gray-900 px-2 py-1.5 font-mono text-[11px] text-emerald-300"
                            />
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  const ok = await copyText(exportResult.replayRtsp);
                                  if (ok) toast.success('Replay RTSP URL copied');
                                  else toast.error('Could not copy to clipboard');
                                }}
                                className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20"
                              >
                                <Copy className="h-3.5 w-3.5" /> Copy
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const text = `VIGI replay export\n${exportResult.replayRtsp}\n\n${exportResult.exportHint}`;
                                  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
                                  const a = document.createElement('a');
                                  a.href = URL.createObjectURL(blob);
                                  a.download = exportResult.filenameSuggestion.replace(/\.mp4$/, '.txt');
                                  a.click();
                                  URL.revokeObjectURL(a.href);
                                }}
                                className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20"
                              >
                                <Download className="h-3.5 w-3.5" /> Save .txt
                              </button>
                            </div>
                            <p className="text-[10px] leading-relaxed text-gray-500">{exportResult.exportHint}</p>
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showShortcuts && (
                <motion.div
                  key="shortcuts-dialog"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[75] flex items-center justify-center bg-black/75 p-3 pt-[max(1rem,env(safe-area-inset-top))] sm:p-4"
                  onClick={() => setShowShortcuts(false)}
                >
                  <motion.div
                    initial={{ scale: 0.96, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.96, opacity: 0 }}
                    className="max-h-[85vh] w-full max-w-md overflow-y-auto overscroll-contain rounded-2xl border border-gray-600 bg-gray-950 p-4 shadow-2xl sm:p-5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="mb-4 flex items-center justify-between gap-2">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                        <Keyboard className="h-4 w-4 text-blue-400" />
                        Keyboard shortcuts
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowShortcuts(false)}
                        className="rounded-lg p-1 text-gray-400 hover:bg-white/10 hover:text-white"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <ul className="space-y-2.5 text-[13px] text-gray-300">
                      <li className="flex justify-between gap-4">
                        <span className="text-gray-500">Close viewer / export</span>
                        <kbd className="shrink-0 rounded border border-gray-600 bg-gray-900 px-2 py-0.5 font-mono text-[11px] text-gray-200">
                          Esc
                        </kbd>
                      </li>
                      <li className="flex justify-between gap-4">
                        <span className="text-gray-500">Previous / next camera</span>
                        <span className="flex gap-1">
                          <kbd className="rounded border border-gray-600 bg-gray-900 px-2 py-0.5 font-mono text-[11px]">←</kbd>
                          <kbd className="rounded border border-gray-600 bg-gray-900 px-2 py-0.5 font-mono text-[11px]">→</kbd>
                        </span>
                      </li>
                      <li className="flex justify-between gap-4">
                        <span className="text-gray-500">Mute (HLS)</span>
                        <kbd className="rounded border border-gray-600 bg-gray-900 px-2 py-0.5 font-mono text-[11px]">M</kbd>
                      </li>
                      <li className="flex justify-between gap-4">
                        <span className="text-gray-500">Fullscreen</span>
                        <kbd className="rounded border border-gray-600 bg-gray-900 px-2 py-0.5 font-mono text-[11px]">F</kbd>
                      </li>
                      <li className="flex justify-between gap-4">
                        <span className="text-gray-500">Export replay (VIGI)</span>
                        <kbd className="rounded border border-gray-600 bg-gray-900 px-2 py-0.5 font-mono text-[11px]">E</kbd>
                      </li>
                      <li className="flex justify-between gap-4">
                        <span className="text-gray-500">This panel</span>
                        <kbd className="rounded border border-gray-600 bg-gray-900 px-2 py-0.5 font-mono text-[11px]">?</kbd>
                      </li>
                    </ul>
                    <p className="mt-4 text-[10px] leading-relaxed text-gray-600">
                      RTSP streams open in VLC. Use <span className="text-gray-400">Open NVR</span> for the full web UI on
                      your LAN (TLS warning is normal for self-signed certs).
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
