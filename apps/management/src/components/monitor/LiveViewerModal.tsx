import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Maximize2, Minimize2, Volume2, VolumeX, Radio, Wifi, WifiOff,
  Camera, ChevronLeft, ChevronRight, Activity, Clock, Settings2,
  Download, Share2, AlertTriangle, LayoutGrid,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { CameraDevice } from '@/api/monitor';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const now = useLiveClock();

  const currentIndex = siblingCameras.findIndex((c) => c.id === camera?.id);
  const onlineCameras = siblingCameras.filter((c) => c.status !== 'offline');

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

  // Keyboard navigation
  useEffect(() => {
    if (!camera) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'm' || e.key === 'M') setIsMuted((m) => !m);
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, onClose, goNext, goPrev]);

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

  // Fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => null);
    } else {
      document.exitFullscreen().catch(() => null);
    }
  }, []);

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
            className="fixed inset-4 z-50 flex overflow-hidden rounded-2xl bg-gray-950 shadow-2xl ring-1 ring-white/[0.08] md:inset-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Main content area ── */}
            <div className="relative flex flex-1 flex-col overflow-hidden">

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
                ) : (
                  <LiveFeedPlaceholder camera={camera!} isMuted={isMuted} />
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
                <div className="absolute left-0 right-0 top-0 bg-gradient-to-b from-black/80 via-black/30 to-transparent p-4 pb-8">
                  <div className="flex items-start justify-between gap-3">
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
                    </div>

                    {/* Right: controls */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setShowMultiview((v) => !v)}
                        title="Multi-view (4 cameras)"
                        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setShowSidebar((s) => !s)}
                        title="Toggle camera list"
                        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        <Camera className="h-4 w-4" />
                      </button>
                      <button
                        onClick={onClose}
                        title="Close (Esc)"
                        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
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
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 pt-10"
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
                      title="Download clip"
                      className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <Download className="h-5 w-5" />
                    </button>
                    <button
                      title="Share stream"
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

            {/* ── Camera list sidebar ── */}
            <AnimatePresence initial={false}>
              {showSidebar && (
                <motion.div
                  key="cam-sidebar"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 224, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ type: 'spring', damping: 30, stiffness: 300 }}
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
