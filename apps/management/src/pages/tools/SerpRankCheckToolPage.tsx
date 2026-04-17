import { useCallback, useMemo, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ToolDisclaimer } from '@/features/tools/components/ToolDisclaimer';
import { ToolPageChrome } from '@/features/tools/components/ToolPageChrome';
import { ToolRunPanel } from '@/features/tools/components/ToolRunPanel';
import { PageTransition } from '@/components/ui/PageTransition';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useToolHistory } from '@/features/tools/useToolHistory';
import { cn } from '@/utils/cn';
import { useSerpRankCheck, useToolsStatus } from '@/api/tools';
import { toast } from 'sonner';
import { Play, Trash2 } from 'lucide-react';

const MARKETS = [
  { value: 'us|en', label: 'United States (English)' },
  { value: 'gb|en', label: 'United Kingdom (English)' },
  { value: 'bd|en', label: 'Bangladesh (English)' },
  { value: 'bd|bn', label: 'Bangladesh (Bengali UI)' },
  { value: 'pk|en', label: 'Pakistan (English)' },
  { value: 'ae|en', label: 'United Arab Emirates (English)' },
];

export default function SerpRankCheckToolPage() {
  const [keyword, setKeyword] = useState('');
  const [target, setTarget] = useState('');
  const [market, setMarket] = useState(MARKETS[2]!.value);
  const [location, setLocation] = useState('Bangladesh');
  const [googleDomain, setGoogleDomain] = useState('google.com.bd');
  const [maxScan, setMaxScan] = useState('100');
  const [running, setRunning] = useState(false);
  const [doneOnce, setDoneOnce] = useState(false);
  const [position, setPosition] = useState<number | null>(null);
  const [matchedUrl, setMatchedUrl] = useState<string | null>(null);
  const [resultTitle, setResultTitle] = useState<string | null>(null);
  const [scanned, setScanned] = useState(0);
  const { push } = useToolHistory('serp-rank-check');
  const { data: status } = useToolsStatus();
  const rankMutation = useSerpRankCheck();

  const clearAll = useCallback(() => {
    setKeyword('');
    setTarget('');
    setDoneOnce(false);
    setPosition(null);
    setMatchedUrl(null);
    setResultTitle(null);
    setScanned(0);
  }, []);

  const run = useCallback(async () => {
    const k = keyword.trim();
    const t = target.trim();
    if (!k || !t) return;
    const [gl, hl] = market.split('|');
    if (!gl || !hl) return;
    const ms = Math.min(200, Math.max(10, Number(maxScan) || 100));
    setRunning(true);
    setDoneOnce(false);
    setPosition(null);
    setMatchedUrl(null);
    setResultTitle(null);
    setScanned(0);
    try {
      const out = await rankMutation.mutateAsync({
        keyword: k,
        gl,
        hl,
        target: t,
        location: location.trim() || undefined,
        google_domain: googleDomain.trim() || undefined,
        num: 100,
        maxScan: ms,
      });
      setPosition(out.position);
      setMatchedUrl(out.matchedUrl);
      setResultTitle(out.title);
      setScanned(out.scannedOrganic);
      setDoneOnce(true);
      push(`${k} → ${t}`);
      if (out.position != null) {
        toast.success(`Found at organic position ${out.position}`);
      } else {
        toast.message(`No match in top ${ms} organic results`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Rank check failed';
      toast.error(msg);
    } finally {
      setRunning(false);
    }
  }, [keyword, target, market, location, googleDomain, maxScan, push, rankMutation]);

  const headerConfig = useMemo(
    () => ({
      title: 'SERP rank check',
      description: doneOnce && position != null ? `Pos. ${position}` : doneOnce ? 'No match' : undefined,
      breadcrumbs: [{ label: 'Tools', href: '/tools' }, { label: 'SERP rank check' }],
      actions: [
        {
          type: 'button' as const,
          label: 'Clear',
          icon: Trash2,
          variant: 'ghost' as const,
          onClick: clearAll,
        },
        {
          type: 'button' as const,
          label: 'Check',
          icon: Play,
          variant: 'primary' as const,
          disabled: !keyword.trim() || !target.trim() || !status?.serpApi,
          isLoading: running,
          onClick: run,
        },
      ],
    }),
    [clearAll, run, keyword, target, status?.serpApi, running, doneOnce, position],
  );

  useHeaderConfig(headerConfig, [clearAll, run, keyword, target, status?.serpApi, running, doneOnce, position]);

  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl space-y-5 px-4 pb-10 pt-1 sm:px-6 lg:px-8">
        <ToolDisclaimer status={status} highlight="serp" compact />

        <ToolPageChrome
          accent="rose"
          eyebrow="SEO · SerpAPI"
          title="Rank lookup"
          hint="Keyword + target host — optional locale fields below."
        />

        {(running || doneOnce) && (
          <div
            className={cn(
              'rounded-lg border px-3 py-2 text-xs font-medium',
              running
                ? 'border-primary-200 bg-primary-50/90 text-primary-950 dark:border-primary-800 dark:bg-primary-950/40 dark:text-primary-100'
                : position != null
                  ? 'border-emerald-200 bg-emerald-50/90 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100'
                  : 'border-amber-200 bg-amber-50/90 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100',
            )}
            role="status"
          >
            {running
              ? 'Scanning organic results…'
              : position != null
                ? `Position ${position} · scanned ${scanned}`
                : `No match · scanned ${scanned}`}
          </div>
        )}

        {doneOnce && position != null && matchedUrl && (
          <div className="rounded-xl border border-gray-200/90 bg-white p-4 dark:border-gray-700 dark:bg-gray-900/40">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Match</p>
            <p className="mt-1 font-medium text-[var(--color-text-primary)]">{resultTitle || '(no title)'}</p>
            <a
              href={matchedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block text-sm text-primary-600 hover:underline"
            >
              {matchedUrl}
            </a>
          </div>
        )}

        <ToolRunPanel onRun={run} showActions={false} runLabel="Check rank" running={running}>
          <div className="grid gap-4 lg:grid-cols-2">
            <Input
              label="Keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g. Coffee"
            />
            <Input
              label="Target domain or URL"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="e.g. chaldal.com"
            />
            <Select label="Market / language (gl / hl)" value={market} onChange={(e) => setMarket(e.target.value)} options={MARKETS} />
            <Input
              label="Max organic rank to scan"
              value={maxScan}
              onChange={(e) => setMaxScan(e.target.value)}
              placeholder="100"
            />
            <Input
              label="Location (optional)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Bangladesh"
            />
            <Input
              label="Google domain (optional)"
              value={googleDomain}
              onChange={(e) => setGoogleDomain(e.target.value)}
              placeholder="e.g. google.com.bd"
            />
          </div>
          {!status?.serpApi && (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Set <code className="rounded bg-amber-100 px-1 font-mono dark:bg-amber-900/50">SERPAPI_API_KEY</code>.
            </p>
          )}
        </ToolRunPanel>
      </div>
    </PageTransition>
  );
}
