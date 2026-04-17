/**
 * DomainSearchWidget — compact, embeddable domain search bar.
 * Used on: Home.tsx (section) + DomainSearchPage.tsx (full page).
 */
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Globe2, Search, Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { paths } from "@/routes/paths";
import { toast } from "sonner";
import { usePublicDomainSearch, type DomainSearchResult } from "@/api/portal-hosting";
import { useCartStore } from "@/stores/cartStore";
import { formatUsd } from "@/lib/format";

const POPULAR_TLDS = [
  { tld: ".com", color: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" },
  { tld: ".net", color: "bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100" },
  { tld: ".io",  color: "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100" },
  { tld: ".co",  color: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" },
  { tld: ".dev", color: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100" },
  { tld: ".app", color: "bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100" },
  { tld: ".ai",  color: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 hover:bg-fuchsia-100" },
  { tld: ".org", color: "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100" },
];

interface Props {
  /** If true renders the full inline results; if false navigates to domain search page */
  inline?: boolean;
  className?: string;
}

export function DomainSearchWidget({ inline = false, className }: Props) {
  const navigate = useNavigate();
  const addToCart = useCartStore((s) => s.add);

  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");

  const { data: results = [], isLoading: searching } = usePublicDomainSearch(
    inline ? submitted : "",
  );

  const available = results.filter((r) => r.available);
  const taken = results.filter((r) => !r.available);

  const runSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const q = query.trim().toLowerCase().replace(/\s+/g, "");
      if (q.length < 2) { toast.error("Enter at least 2 characters"); return; }
      if (inline) {
        setSubmitted(q);
      } else {
        navigate(`${paths.domainSearch}?q=${encodeURIComponent(q)}`);
      }
    },
    [query, inline, navigate],
  );

  const handleTld = (tld: string) => {
    const base = query.replace(/\.[a-z]+$/, "").trim() || "mybrand";
    const q = base + tld;
    setQuery(q);
    if (inline) setSubmitted(q);
    else navigate(`${paths.domainSearch}?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className={cn("w-full", className)}>
      {/* ── Search bar ──────────────────────────────────────────────── */}
      <form
        onSubmit={runSearch}
        className="flex w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.08)] transition-shadow focus-within:shadow-[0_4px_32px_rgba(37,99,235,0.14)] focus-within:border-primary-300"
      >
        <div className="relative min-w-0 flex-1">
          <Globe2 className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" aria-hidden />
          <input
            name="domain"
            type="text"
            autoComplete="off"
            spellCheck={false}
            placeholder="yourname.com, mybrand…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-14 w-full bg-transparent pl-12 pr-4 text-base text-gray-900 placeholder-gray-400 outline-none sm:h-16 sm:text-lg"
          />
        </div>
        <div className="flex shrink-0 items-center p-2">
          <button
            type="submit"
            disabled={searching}
            className="flex h-10 items-center gap-2 rounded-xl bg-primary-600 px-5 text-sm font-bold text-white transition-all hover:bg-primary-700 active:scale-[0.97] disabled:opacity-70 sm:h-12 sm:px-6 sm:text-base"
          >
            {searching
              ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              : <Search className="h-4 w-4" aria-hidden />}
            <span className="hidden sm:inline">{searching ? "Searching…" : "Search"}</span>
          </button>
        </div>
      </form>

      {/* ── TLD pills ───────────────────────────────────────────────── */}
      <div className="mt-3 flex flex-wrap gap-1.5 sm:gap-2">
        {POPULAR_TLDS.map(({ tld, color }) => (
          <button
            key={tld}
            type="button"
            onClick={() => handleTld(tld)}
            className={cn(
              "rounded-lg border px-2.5 py-1 font-mono text-xs font-semibold transition-colors",
              color,
            )}
          >
            {tld}
          </button>
        ))}
        {!inline && (
          <button
            type="button"
            onClick={() => navigate(paths.domainSearch)}
            className="ml-auto flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-800 transition-colors"
          >
            50+ TLDs <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* ── Inline results (only when inline=true) ──────────────────── */}
      {inline && searching && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" style={{ animationDelay: `${i * 50}ms` }} />
          ))}
        </div>
      )}

      {inline && !searching && results.length > 0 && (
        <div className="mt-6 space-y-4">
          {available.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Available ({available.length})
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {available.slice(0, 8).map((s) => (
                  <DomainResultCard key={s.fqdn} domain={s} onAdd={addToCart} />
                ))}
              </div>
            </div>
          )}
          {taken.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-400">
                <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                Taken
              </p>
              <div className="flex flex-wrap gap-2">
                {taken.map((s) => (
                  <span key={s.fqdn} className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-1.5 font-mono text-xs text-gray-400 line-through">{s.fqdn}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DomainResultCard({ domain, onAdd }: { domain: DomainSearchResult; onAdd: (line: { serviceId: string; name: string; slug: string; unitPriceUsd: number }) => void }) {
  const lines = useCartStore((s) => s.lines);
  const added = lines.some((l) => l.serviceId === `domain-${domain.fqdn}`);

  const handleAdd = () => {
    onAdd({ serviceId: `domain-${domain.fqdn}`, name: domain.fqdn, slug: domain.fqdn, unitPriceUsd: domain.pricePerYearUsd });
    toast.success(`${domain.fqdn} added to cart`);
  };

  return (
    <div className={cn(
      "group relative flex flex-col rounded-xl border p-3 transition-all",
      added ? "border-emerald-300 bg-emerald-50" : "border-gray-200 bg-white hover:border-primary-300 hover:shadow-sm",
    )}>
      <p className="break-all font-mono text-xs font-bold text-gray-900">{domain.fqdn}</p>
      <p className="mt-0.5 text-lg font-extrabold tabular-nums text-gray-900">
        {domain.pricePerYearUsd === 0 ? "Free" : formatUsd(domain.pricePerYearUsd)}
        <span className="text-xs font-normal text-gray-400">/yr</span>
      </p>
      <button
        disabled={added}
        onClick={handleAdd}
        className={cn(
          "mt-2 w-full rounded-lg py-1.5 text-xs font-bold transition-all",
          added ? "bg-emerald-100 text-emerald-700 cursor-default" : "bg-primary-600 text-white hover:bg-primary-700",
        )}
      >
        {added ? "✓ In cart" : "Add to cart"}
      </button>
    </div>
  );
}
