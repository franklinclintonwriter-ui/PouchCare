import { useCallback, useState, useRef } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import { cn } from '@/utils/cn';

interface FileUploadProps {
  accept?: string;
  maxSize?: number;
  onFile: (file: File) => void;
  label?: string;
  className?: string;
}

function FileUpload({
  accept,
  maxSize = 10 * 1024 * 1024,
  onFile,
  label = 'Upload a file',
  className,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      if (maxSize && file.size > maxSize) {
        setError(`File too large. Max size: ${(maxSize / 1024 / 1024).toFixed(0)}MB`);
        return;
      }
      setSelectedFile(file);
      onFile(file);
    },
    [maxSize, onFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
    },
    [handleFile],
  );

  return (
    <div className={className}>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200',
          dragActive
            ? 'border-primary-400 bg-primary-50/50 dark:border-primary-500 dark:bg-primary-900/10'
            : 'border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800/30 dark:hover:border-gray-600',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        <Upload className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600" />
        <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
        <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
          Drag & drop or click to browse
        </p>
      </div>

      {error && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>}

      {selectedFile && (
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
          <FileText className="h-4 w-4 text-gray-400" />
          <span className="flex-1 truncate text-sm text-gray-700 dark:text-gray-300">{selectedFile.name}</span>
          <span className="text-xs text-gray-400">{(selectedFile.size / 1024).toFixed(0)}KB</span>
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
            className="rounded p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export { FileUpload };
