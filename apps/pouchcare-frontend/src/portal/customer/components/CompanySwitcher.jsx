import { useState, useRef, useEffect } from "react";
import { ChevronDown, Building2, Check } from "lucide-react";
import { useCustomerPortal } from "../state/CustomerPortalContext";
import StatusBadge from "../../shared/components/StatusBadge";
import { cn } from "../../../utils/cn";

/**
 * @typedef {Object} Company
 * @property {string} id
 * @property {string} name
 * @property {"owner"|"manager"|"viewer"} role
 * @property {string} plan
 */

/** Role display labels */
const ROLE_LABELS = /** @type {Record<string, string>} */ ({
  owner: "Owner",
  manager: "Manager",
  viewer: "Viewer",
});

/**
 * Dropdown component for switching between companies the customer belongs to.
 * Displays the active company name, a chevron indicator, and a dropdown with
 * all companies showing plan badges and role labels.
 *
 * @returns {JSX.Element}
 */
export default function CompanySwitcher() {
  const { data, switchCompany } = useCustomerPortal();
  const [open, setOpen] = useState(false);
  const ref = useRef(/** @type {HTMLDivElement|null} */ (null));

  const companies = data.companies || [];
  const activeId = data.activeCompanyId;
  const active = companies.find((c) => c.id === activeId) || companies[0];

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    /** @param {MouseEvent} e */
    function handleClick(e) {
      if (ref.current && !ref.current.contains(/** @type {Node} */ (e.target))) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (companies.length < 2) return null;

  return (
    <div ref={ref} className="relative mb-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm font-medium text-slate-800 transition-colors hover:bg-slate-100",
          open && "ring-2 ring-primary/30"
        )}
      >
        <span className="flex items-center gap-2 truncate">
          <Building2 className="h-4 w-4 shrink-0 text-slate-500" />
          <span className="truncate">{active?.name ?? "Select company"}</span>
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-slate-400 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {companies.map((company) => {
            const isActive = company.id === activeId;
            return (
              <button
                key={company.id}
                type="button"
                onClick={() => {
                  switchCompany(company.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-slate-50",
                  isActive && "bg-slate-50"
                )}
              >
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex items-center gap-2">
                    <span className={cn("truncate font-medium", isActive ? "text-primary" : "text-slate-800")}>
                      {company.name}
                    </span>
                    {isActive && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                  </span>
                  <span className="text-xs text-slate-500">
                    {ROLE_LABELS[company.role] || company.role}
                  </span>
                </div>
                <StatusBadge value={company.plan} className="shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
