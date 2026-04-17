import pouchcareLogo from '../../../pouchcare-logo.png';

type PrintBrandHeaderProps = {
  documentLabel: string;
  title: string;
  subtitle?: string;
  meta?: { label: string; value: string }[];
};

/**
 * Visible only when printing (Ctrl+P). Brand masthead with official logo and report metadata.
 */
function PrintBrandHeader({ documentLabel, title, subtitle, meta }: PrintBrandHeaderProps) {
  const generated = new Date().toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <header className="mb-6 hidden flex-col gap-4 border-b border-gray-200 pb-5 print:flex">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <img
          src={pouchcareLogo}
          alt="PouchCare"
          className="h-12 w-auto max-h-[52px] max-w-[min(100%,240px)] object-contain object-left"
        />
        <div className="text-right text-[11px] leading-snug text-gray-600">
          <div className="font-semibold uppercase tracking-wide text-gray-800">PouchCare Management</div>
          <div className="mt-0.5 text-gray-500">Printed {generated}</div>
        </div>
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">{documentLabel}</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-gray-900">{title}</h1>
        {subtitle ? <p className="mt-1.5 text-sm text-gray-600">{subtitle}</p> : null}
      </div>
      {meta && meta.length > 0 ? (
        <dl className="grid grid-cols-1 gap-x-8 gap-y-2 border-t border-gray-100 pt-4 text-sm sm:grid-cols-2">
          {meta.map((row) => (
            <div key={row.label} className="flex gap-2">
              <dt className="shrink-0 font-medium text-gray-500">{row.label}</dt>
              <dd className="min-w-0 text-gray-900">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </header>
  );
}

export { PrintBrandHeader };
