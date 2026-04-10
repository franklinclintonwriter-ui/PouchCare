import { useState, useEffect, useRef } from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCw, Move, RefreshCw } from 'lucide-react';
import { cn } from '@/utils/cn';

interface DocumentPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  title?: string;
}

export function DocumentPreview({ isOpen, onClose, fileUrl, fileName, mimeType, title }: DocumentPreviewProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const lastTap = useRef(0);

  const isImage = mimeType.startsWith('image/');
  const isPdf = mimeType === 'application/pdf';

  useEffect(() => {
    if (isOpen) {
      setZoom(100);
      setRotation(0);
      setLoading(true);
      setError(false);
      setPosition({ x: 0, y: 0 });
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, fileUrl]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(z + 25, 300));
      if (e.key === '-') setZoom((z) => Math.max(z - 25, 25));
      if (e.key === 'r' || e.key === 'R') setRotation((r) => (r + 90) % 360);
      if (e.key === '0') resetView();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const resetView = () => {
    setZoom(100);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

  const handleMouseUp = () => {
    setIsDragging(false);
  };

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

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleDoubleTap = () => {
    if (isImage) {
      if (zoom === 100) {
        setZoom(200);
      } else {
        resetView();
      }
    }
  };

  const handleDoubleClick = () => {
    handleDoubleTap();
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col bg-black/98 touch-none',
        'animate-in fade-in duration-200'
      )}
    >
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-b from-black/80 to-transparent">
        {/* Left: Close + Title */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            onClick={onClose}
            className="flex-shrink-0 p-2.5 -ml-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            aria-label="Close"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          <div className="min-w-0">
            <h3 className="text-white font-medium text-sm sm:text-base truncate">{title || fileName}</h3>
            {isImage && (
              <p className="text-white/50 text-xs">{zoom}% · {rotation > 0 ? `${rotation}°` : 'Original'}</p>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center">
          {/* Image controls */}
          {isImage && (
            <div className="hidden sm:flex items-center gap-1 mr-2">
              <button
                onClick={() => {
                  const newZoom = Math.max(zoom - 25, 25);
                  setZoom(newZoom);
                  if (newZoom <= 100) setPosition({ x: 0, y: 0 });
                }}
                className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                title="Zoom out"
              >
                <ZoomOut className="h-5 w-5" />
              </button>
              <span className="text-white/50 text-xs w-10 text-center">{zoom}%</span>
              <button
                onClick={() => setZoom((z) => Math.min(z + 25, 300))}
                className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                title="Zoom in"
              >
                <ZoomIn className="h-5 w-5" />
              </button>
              <div className="w-px h-5 bg-white/20 mx-1" />
              <button
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                title="Rotate"
              >
                <RotateCw className="h-5 w-5" />
              </button>
              <button
                onClick={resetView}
                className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                title="Reset view"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
              <div className="w-px h-5 bg-white/20 mx-1" />
            </div>
          )}

          <button
            onClick={handleDownload}
            className="p-2.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            aria-label="Download"
          >
            <Download className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Content Area */}
      <div
        className={cn(
          'flex-1 overflow-hidden flex items-center justify-center relative',
          isImage && zoom > 100 && 'cursor-grab',
          isDragging && 'cursor-grabbing'
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleDoubleClick}
      >
        {/* Loading */}
        {loading && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="h-10 w-10 border-3 border-white/20 border-t-white rounded-full animate-spin" />
            <span className="text-white/60 text-sm">Loading...</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex flex-col items-center gap-4 text-center p-6">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
              <X className="h-8 w-8 text-red-400" />
            </div>
            <div>
              <p className="text-white font-medium mb-1">Failed to load</p>
              <p className="text-white/50 text-sm mb-4">The document couldn't be displayed</p>
            </div>
            <button
              onClick={handleDownload}
              className="px-5 py-2.5 bg-white text-black rounded-xl font-medium hover:bg-white/90 active:scale-95 transition-all"
            >
              Download Instead
            </button>
          </div>
        )}

        {/* Image */}
        {isImage && (
          <img
            src={fileUrl}
            alt={title || fileName}
            className={cn(
              'max-w-full max-h-full object-contain select-none',
              loading && 'invisible',
              isDragging ? 'transition-none' : 'transition-transform duration-200'
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

        {/* PDF */}
        {isPdf && (
          <iframe
            src={`${fileUrl}#toolbar=1&navpanes=0&view=FitH`}
            className={cn(
              'w-full h-full bg-white',
              'sm:w-[95%] sm:h-[95%] sm:rounded-xl sm:shadow-2xl',
              loading && 'invisible'
            )}
            title={title || fileName}
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError(true);
            }}
          />
        )}

        {/* Unsupported */}
        {!isImage && !isPdf && !loading && !error && (
          <div className="flex flex-col items-center gap-5 text-center p-6">
            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
              <Download className="h-10 w-10 text-white/60" />
            </div>
            <div>
              <p className="text-white font-semibold text-lg mb-1">{fileName}</p>
              <p className="text-white/50 text-sm">This file type cannot be previewed</p>
            </div>
            <button
              onClick={handleDownload}
              className="px-6 py-3 bg-white text-black rounded-xl font-semibold hover:bg-white/90 active:scale-95 transition-all"
            >
              <Download className="h-4 w-4 inline mr-2" />
              Download File
            </button>
          </div>
        )}
      </div>

      {/* Mobile Controls for Images */}
      {isImage && !loading && !error && (
        <div className="sm:hidden absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                const newZoom = Math.max(zoom - 25, 25);
                setZoom(newZoom);
                if (newZoom <= 100) setPosition({ x: 0, y: 0 });
              }}
              className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white active:scale-90 transition-transform"
            >
              <ZoomOut className="h-5 w-5" />
            </button>
            <button
              onClick={resetView}
              className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white active:scale-90 transition-transform"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.min(z + 25, 300))}
              className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white active:scale-90 transition-transform"
            >
              <ZoomIn className="h-5 w-5" />
            </button>
            <div className="w-px h-8 bg-white/20 mx-1" />
            <button
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white active:scale-90 transition-transform"
            >
              <RotateCw className="h-5 w-5" />
            </button>
          </div>
          {zoom > 100 && (
            <p className="text-center text-white/40 text-xs mt-3 flex items-center justify-center gap-1.5">
              <Move className="h-3.5 w-3.5" />
              Drag to pan · Double-tap to reset
            </p>
          )}
        </div>
      )}
    </div>
  );
}
