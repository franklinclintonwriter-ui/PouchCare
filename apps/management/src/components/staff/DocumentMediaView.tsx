import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCw, Move, RefreshCw } from 'lucide-react';
import { cn } from '@/utils/cn';

export type DocumentMediaViewHandle = {
  printPdf: () => void;
  printImage: () => void;
};

type Props = {
  fileUrl: string;
  fileName: string;
  mimeType: string;
  title?: string;
  className?: string;
};

export const DocumentMediaView = forwardRef<DocumentMediaViewHandle, Props>(
  function DocumentMediaView({ fileUrl, fileName, mimeType, title, className }, ref) {
    const [zoom, setZoom] = useState(100);
    const [rotation, setRotation] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const lastTap = useRef(0);
    const pdfRef = useRef<HTMLIFrameElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    const isImage = mimeType.startsWith('image/');
    const isPdf = mimeType === 'application/pdf';

    useEffect(() => {
      setZoom(100);
      setRotation(0);
      setLoading(true);
      setError(false);
      setPosition({ x: 0, y: 0 });
    }, [fileUrl]);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(z + 25, 300));
        if (e.key === '-') setZoom((z) => Math.max(z - 25, 25));
        if (e.key === 'r' || e.key === 'R') setRotation((r) => (r + 90) % 360);
        if (e.key === '0') resetView();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const resetView = () => {
      setZoom(100);
      setPosition({ x: 0, y: 0 });
      setRotation(0);
    };

    useImperativeHandle(ref, () => ({
      printPdf: () => {
        try {
          pdfRef.current?.contentWindow?.focus();
          pdfRef.current?.contentWindow?.print();
        } catch {
          window.print();
        }
      },
      printImage: () => {
        const w = window.open('', '_blank');
        if (!w) {
          window.print();
          return;
        }
        const img = imgRef.current;
        const src = img?.src ?? fileUrl;
        const safeSrc = JSON.stringify(src);
        const safeTitle = JSON.stringify(fileName);
        w.document.write(
          `<!DOCTYPE html><html><head><title>${safeTitle}</title>
          <style>body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh}
          img{max-width:100%;max-height:100vh;object-fit:contain}</style></head>
          <body><img src=${safeSrc} alt="" onload="window.print();window.close()"/></body></html>`,
        );
        w.document.close();
      },
    }));

    const handleMouseDown = (e: React.MouseEvent) => {
      if (zoom > 100 && isImage) {
        setIsDragging(true);
        dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
      }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.current.x,
          y: e.clientY - dragStart.current.y,
        });
      }
    };

    const handleMouseUp = () => setIsDragging(false);

    const handleTouchStart = (e: React.TouchEvent) => {
      const now = Date.now();
      if (now - lastTap.current < 300) {
        handleDoubleTap();
        lastTap.current = 0;
        return;
      }
      lastTap.current = now;
      if (zoom > 100 && isImage && e.touches.length === 1) {
        setIsDragging(true);
        dragStart.current = {
          x: e.touches[0].clientX - position.x,
          y: e.touches[0].clientY - position.y,
        };
      }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
      if (isDragging && e.touches.length === 1) {
        e.preventDefault();
        setPosition({
          x: e.touches[0].clientX - dragStart.current.x,
          y: e.touches[0].clientY - dragStart.current.y,
        });
      }
    };

    const handleTouchEnd = () => setIsDragging(false);

    const handleDoubleTap = () => {
      if (isImage) {
        if (zoom === 100) setZoom(200);
        else resetView();
      }
    };

    return (
      <div className={cn('flex flex-col flex-1 min-h-0 bg-gray-50 dark:bg-gray-950', className)}>
        {isImage && (
          <div className="flex flex-wrap items-center justify-center gap-1 border-b border-gray-200/90 bg-white/90 px-2 py-2 dark:border-gray-700 dark:bg-gray-900/90 sm:justify-start sm:gap-2 sm:px-3">
            <button
              type="button"
              onClick={() => {
                const nz = Math.max(zoom - 25, 25);
                setZoom(nz);
                if (nz <= 100) setPosition({ x: 0, y: 0 });
              }}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              title="Zoom out"
            >
              <ZoomOut className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <span className="w-9 text-center text-xs text-gray-500 tabular-nums">{zoom}%</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(z + 25, 300))}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              title="Zoom in"
            >
              <ZoomIn className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <div className="hidden h-5 w-px bg-gray-200 sm:block dark:bg-gray-600" />
            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              title="Rotate"
            >
              <RotateCw className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button
              type="button"
              onClick={resetView}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              title="Reset"
            >
              <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <span className="ml-auto hidden text-xs text-gray-400 sm:inline">{rotation > 0 ? `${rotation}°` : ''}</span>
          </div>
        )}

        <div
          className={cn(
            'relative flex min-h-0 flex-1 items-center justify-center overflow-hidden',
            isImage && zoom > 100 && 'cursor-grab',
            isDragging && 'cursor-grabbing',
            'rounded-b-xl border border-t-0 border-gray-200/80 bg-white dark:border-gray-700/80 dark:bg-gray-900',
          )}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={handleDoubleTap}
        >
          {loading && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-primary-500" />
              <span className="text-sm text-gray-500">Loading…</span>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center gap-4 p-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/30">
                <X className="h-8 w-8 text-red-500" />
              </div>
              <div>
                <p className="mb-1 font-medium text-gray-900 dark:text-gray-100">Failed to load</p>
                <p className="text-sm text-gray-500">The document could not be displayed</p>
              </div>
            </div>
          )}

          {isImage && (
            <img
              ref={imgRef}
              src={fileUrl}
              alt={title || fileName}
              className={cn(
                'max-h-[min(72vh,900px)] max-w-full object-contain select-none',
                loading && 'invisible',
                isDragging ? 'transition-none' : 'transition-transform duration-200',
              )}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom / 100}) rotate(${rotation}deg)`,
              }}
              draggable={false}
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError(true);
              }}
            />
          )}

          {isPdf && (
            <iframe
              ref={pdfRef}
              src={`${fileUrl}#toolbar=1&navpanes=0&view=FitH`}
              className={cn('h-[min(78vh,900px)] w-full bg-white', loading && 'invisible')}
              title={title || fileName}
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError(true);
              }}
            />
          )}

          {!isImage && !isPdf && !loading && !error && (
            <div className="flex flex-col items-center gap-5 p-6 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <Download className="h-10 w-10 text-gray-400" />
              </div>
              <div>
                <p className="mb-1 text-lg font-semibold text-gray-900 dark:text-gray-100">{fileName}</p>
                <p className="text-sm text-gray-500">This file type cannot be previewed in the browser</p>
              </div>
            </div>
          )}
        </div>

        {isImage && !loading && !error && (
          <div className="border-t border-gray-200/80 bg-white/95 p-3 dark:border-gray-700 dark:bg-gray-900/95 sm:hidden">
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const nz = Math.max(zoom - 25, 25);
                  setZoom(nz);
                  if (nz <= 100) setPosition({ x: 0, y: 0 });
                }}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 active:scale-95 dark:bg-gray-800"
              >
                <ZoomOut className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={resetView}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 active:scale-95 dark:bg-gray-800"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(z + 25, 300))}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 active:scale-95 dark:bg-gray-800"
              >
                <ZoomIn className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 active:scale-95 dark:bg-gray-800"
              >
                <RotateCw className="h-5 w-5" />
              </button>
            </div>
            {zoom > 100 && (
              <p className="mt-2 flex items-center justify-center gap-1 text-center text-xs text-gray-400">
                <Move className="h-3.5 w-3.5" />
                Drag to pan · Double-tap to reset
              </p>
            )}
          </div>
        )}
      </div>
    );
  },
);

DocumentMediaView.displayName = 'DocumentMediaView';
