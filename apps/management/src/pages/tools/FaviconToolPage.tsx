import { useCallback, useEffect, useState } from 'react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ToolDisclaimer } from '@/features/tools/components/ToolDisclaimer';
import { ToolRunPanel } from '@/features/tools/components/ToolRunPanel';
import { useToolHistory } from '@/features/tools/useToolHistory';
import { downloadFaviconZip, useToolsStatus } from '@/api/tools';
import { toast } from 'sonner';

const PRESETS: { size: number; label: string }[] = [
  { size: 16, label: 'Favicon' },
  { size: 32, label: 'Shortcut' },
  { size: 48, label: 'Windows' },
  { size: 180, label: 'Apple touch' },
];

export default function FaviconToolPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const { push } = useToolHistory('favicon');
  const { data: status } = useToolsStatus();

  useHeaderConfig({
    title: 'Favicon generator',
    breadcrumbs: [{ label: 'Tools', href: '/tools' }, { label: 'Favicon' }],
    actions: [],
  });

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const u = URL.createObjectURL(file);
    setPreviewUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const onPick = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFile(f ?? null);
  }, []);

  const run = useCallback(async () => {
    if (!file) {
      toast.error('Choose an image first (PNG or JPG).');
      return;
    }
    setRunning(true);
    try {
      const blob = await downloadFaviconZip(file);
      push(file.name);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'favicon-kit.zip';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('favicon-kit.zip downloaded');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setRunning(false);
    }
  }, [file, push]);

  return (
    <PageTransition>
      <div className="mx-auto max-w-5xl space-y-6 px-4 pb-10 pt-2 sm:px-6 lg:px-8">
        <ToolDisclaimer status={status ?? undefined} />

        <ToolRunPanel
          onRun={run}
          onClear={() => setFile(null)}
          runLabel="Build & download ZIP"
          running={running}
          disabled={!file}
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Source image</label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={onPick}
              className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-700 hover:file:bg-primary-100 dark:text-gray-400 dark:file:bg-primary-900/40 dark:file:text-primary-200"
            />
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
              Server resizes with Sharp to 16–180px PNGs and zips them. Max ~4MB.
            </p>
          </div>
        </ToolRunPanel>

        {previewUrl && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preview (source)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {PRESETS.map(({ size, label: lbl }) => (
                  <div
                    key={size}
                    className="flex flex-col items-center gap-2 rounded-xl border border-gray-200/80 bg-white p-4 dark:border-gray-700/60 dark:bg-gray-800/50"
                  >
                    <div
                      className="overflow-hidden rounded-lg bg-gray-100 shadow-inner dark:bg-gray-900"
                      style={{
                        width: Math.min(size, 96),
                        height: Math.min(size, 96),
                      }}
                    >
                      <img src={previewUrl} alt="" className="h-full w-full object-cover" />
                    </div>
                    <span className="text-center text-xs font-medium text-[var(--color-text-secondary)]">
                      {lbl}
                      <span className="block font-mono text-[10px] text-gray-400">
                        {size}×{size}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
