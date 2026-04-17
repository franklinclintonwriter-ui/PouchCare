/**
 * FileUpload — drag-drop + click-to-browse + preview + validation.
 *
 * The 13th (and last) Week-1 UI-kit primitive. Used by Profile avatar,
 * Web-to-APK zip uploads, and Support ticket attachments.
 *
 * Design:
 *   - Single-file (default) or multi-file mode (`multiple`).
 *   - Accepts a concise MIME / extension list via `accept` (forwarded to
 *     `<input type="file">` and also enforced client-side for drag-drop).
 *   - Max-size guard (`maxSizeMb`) with a clear inline error.
 *   - Image previews render automatically for `image/*` files.
 *   - Controlled API: the caller owns the `files` state. A fully-uncontrolled
 *     variant is not provided on purpose — every call site wants to react to
 *     changes (validation, submit enable, etc.).
 *   - a11y: the drop zone is a `<button role="button">` so it's keyboard /
 *     screen-reader reachable; Enter / Space triggers the file picker.
 *
 * @example
 *   const [files, setFiles] = useState<File[]>([])
 *   <FileUpload
 *     files={files}
 *     onChange={setFiles}
 *     accept="image/png, image/jpeg"
 *     maxSizeMb={5}
 *     hint="PNG or JPG, up to 5 MB"
 *   />
 */
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type ReactNode,
} from "react";
import { FileUp, X, FileIcon, ImageIcon, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";

export interface FileUploadProps {
  /** Controlled file list. Pass `[]` for the empty state. */
  files: File[];
  onChange: (files: File[]) => void;
  /** Accept list forwarded to `<input>` (e.g. "image/*", ".zip, .apk"). */
  accept?: string;
  /** Allow multiple files. Default `false`. */
  multiple?: boolean;
  /** Max size per file in MB. Default 10. */
  maxSizeMb?: number;
  /** Short helper caption shown under the drop zone. */
  hint?: ReactNode;
  /** Disables drop + browse. */
  disabled?: boolean;
  /** Override the default "Drop files here or browse" copy. */
  label?: ReactNode;
  /** Optional id so an outer `<label>` can `htmlFor` the input. */
  id?: string;
  className?: string;
}

function isImage(f: File) {
  return f.type.startsWith("image/");
}
function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function matchesAccept(file: File, accept?: string): boolean {
  if (!accept) return true;
  const parts = accept
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return parts.some((p) => {
    if (p.startsWith(".")) return name.endsWith(p.toLowerCase());
    if (p.endsWith("/*")) return type.startsWith(p.slice(0, -1).toLowerCase());
    return type === p.toLowerCase();
  });
}

export function FileUpload({
  files,
  onChange,
  accept,
  multiple = false,
  maxSizeMb = 10,
  hint,
  disabled,
  label,
  id,
  className,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptLimitBytes = maxSizeMb * 1024 * 1024;

  const validate = useCallback(
    (list: File[]): { ok: File[]; error: string | null } => {
      const ok: File[] = [];
      for (const f of list) {
        if (!matchesAccept(f, accept)) {
          return {
            ok: [],
            error: `"${f.name}" is not an accepted file type.`,
          };
        }
        if (f.size > acceptLimitBytes) {
          return {
            ok: [],
            error: `"${f.name}" is ${formatBytes(f.size)} — max ${maxSizeMb} MB.`,
          };
        }
        ok.push(f);
      }
      return { ok, error: null };
    },
    [accept, acceptLimitBytes, maxSizeMb],
  );

  const handleFiles = useCallback(
    (list: FileList | File[] | null) => {
      if (!list || disabled) return;
      const incoming = Array.from(list);
      const { ok, error } = validate(incoming);
      setError(error);
      if (error) return;
      const next = multiple ? [...files, ...ok] : ok.slice(0, 1);
      onChange(next);
    },
    [disabled, files, multiple, onChange, validate],
  );

  const handleDrop = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeAt = (idx: number) => {
    onChange(files.filter((_, i) => i !== idx));
  };

  // Build and revoke image preview URLs when the file set changes.
  const previews = useMemo(
    () => files.map((f) => (isImage(f) ? URL.createObjectURL(f) : null)),
    [files],
  );

  return (
    <div className={cn("space-y-3", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-6 text-sm transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40",
          dragOver
            ? "border-primary-400 bg-primary-50/60 text-primary-700 dark:border-primary-500 dark:bg-primary-900/20 dark:text-primary-300"
            : "border-gray-300 bg-gray-50/40 text-gray-600 hover:border-primary-300 hover:text-primary-700 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-400",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <FileUp className="h-6 w-6" aria-hidden />
        <span className="font-medium">
          {label ?? (
            <>
              Drop {multiple ? "files" : "a file"} here,{" "}
              <span className="text-primary-600 underline-offset-2 hover:underline">
                or browse
              </span>
            </>
          )}
        </span>
        {hint && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {hint}
          </span>
        )}
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          className="sr-only"
          onChange={(e) => {
            handleFiles(e.target.files);
            // Clear so the same file can be re-selected after a remove.
            e.target.value = "";
          }}
        />
      </button>

      {error && (
        <div
          role="alert"
          className="inline-flex items-center gap-1.5 rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          {error}
        </div>
      )}

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            >
              {previews[i] ? (
                <img
                  src={previews[i]!}
                  alt=""
                  className="h-10 w-10 rounded object-cover"
                  onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100 text-gray-400 dark:bg-gray-800">
                  {isImage(f) ? (
                    <ImageIcon className="h-4 w-4" />
                  ) : (
                    <FileIcon className="h-4 w-4" />
                  )}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-gray-900 dark:text-gray-100">
                  {f.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {formatBytes(f.size)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeAt(i)}
                disabled={disabled}
                aria-label={`Remove ${f.name}`}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
