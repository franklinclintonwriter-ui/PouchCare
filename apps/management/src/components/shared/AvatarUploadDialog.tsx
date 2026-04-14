import { useEffect, useMemo, useRef, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { Camera, ImageIcon, Move, ScanSearch } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { toast } from 'sonner';

const ACCEPT_AVATAR = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_GIF_BYTES = 1024 * 1024;

interface AvatarUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  name?: string | null;
  currentAvatarUrl?: string | null;
  isLoading?: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: (file: File) => Promise<void>;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

function isGif(file: File | null): boolean {
  return file?.type === 'image/gif';
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not load selected image'));
    image.src = url;
  });
}

async function createCroppedAvatarFile(file: File, imageUrl: string, cropArea: Area | null): Promise<File> {
  if (isGif(file) || !cropArea) return file;

  const image = await createImage(imageUrl);
  const canvas = document.createElement('canvas');
  const targetSize = 512;
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not prepare image crop');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(
    image,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    targetSize,
    targetSize,
  );

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((value) => resolve(value), 'image/jpeg', 0.92);
  });
  if (!blob) throw new Error('Could not finalize cropped image');

  const baseName = file.name.replace(/\.[^.]+$/, '') || 'avatar';
  return new File([blob], `${baseName}-cropped.jpg`, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });
}

function AvatarUploadDialog({
  isOpen,
  onClose,
  name,
  currentAvatarUrl,
  isLoading = false,
  title = 'Upload profile photo',
  description = 'Choose an image and confirm before uploading.',
  confirmLabel = 'Upload photo',
  onConfirm,
}: AvatarUploadDialogProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const onPick = (next: File | undefined) => {
    if (!next) return;
    if (!ACCEPT_AVATAR.includes(next.type as (typeof ACCEPT_AVATAR)[number])) {
      toast.error('Use JPEG, PNG, WebP, or GIF');
      return;
    }
    if (next.size > MAX_BYTES) {
      toast.error('Image must be 5MB or smaller');
      return;
    }
    if (next.type === 'image/gif' && next.size > MAX_GIF_BYTES) {
      toast.error('GIF must be 1MB or smaller');
      return;
    }
    setFile(next);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? () => {} : onClose}
      title={title}
      description={description}
      size="md"
      footer={(
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button
            isLoading={isLoading}
            disabled={!file}
            onClick={async () => {
              if (!file) return;
              const uploadFile = await createCroppedAvatarFile(file, previewUrl ?? '', croppedAreaPixels);
              await onConfirm(uploadFile);
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </>
      )}
    >
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-3">
          {file && previewUrl && !isGif(file) ? (
            <div className="w-full space-y-3">
              <div className="relative mx-auto h-72 overflow-hidden rounded-2xl bg-gray-950">
                <Cropper
                  image={previewUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  minZoom={1}
                  maxZoom={3}
                  objectFit="horizontal-cover"
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300">
                  <ScanSearch className="h-3.5 w-3.5" />
                  Zoom and position
                </div>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-primary-600"
                />
                <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                  <span>Fit</span>
                  <span>{zoom.toFixed(2)}x</span>
                  <span>Close-up</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative">
              <Avatar
                name={name}
                src={previewUrl ?? currentAvatarUrl}
                size="xl"
                className="!h-28 !w-28 text-2xl ring-2 ring-gray-100 dark:ring-gray-700"
              />
              <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-black/5 dark:ring-white/10" />
            </div>
          )}
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {file ? file.name : 'No new file selected'}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {file
                ? `${formatBytes(file.size)} · ${file.type || 'image'}`
                : 'JPEG, PNG, or WebP can be cropped here before upload. GIF uploads without cropping and must stay under 1MB.'}
            </p>
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT_AVATAR.join(',')}
          className="hidden"
          onChange={(e) => {
            const next = e.target.files?.[0];
            e.currentTarget.value = '';
            onPick(next);
          }}
        />

        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/70 p-4 dark:border-gray-700 dark:bg-gray-900/40">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-lg bg-white p-2 text-gray-500 shadow-sm dark:bg-gray-800 dark:text-gray-300">
              <ImageIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Crop before upload
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Drag to reposition and use the zoom slider for a tighter face crop. The server still optimizes the final file.
              </p>
              {!file || isGif(file) ? (
                <p className="mt-2 flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                  <Move className="h-3.5 w-3.5" />
                  {file && isGif(file) ? 'GIF cropping is skipped to preserve animation.' : 'Choose a file to start cropping.'}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={<Camera />}
                  onClick={() => fileRef.current?.click()}
                  disabled={isLoading}
                >
                  {file ? 'Choose another' : 'Choose photo'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export { AvatarUploadDialog };
