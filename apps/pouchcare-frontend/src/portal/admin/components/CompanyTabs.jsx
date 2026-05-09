import { cn } from "../../../utils/cn";

const tabs = [
  { key: "overview", label: "Overview" },
  { key: "websites", label: "Websites" },
  { key: "subscriptions", label: "Subscriptions" },
  { key: "invoices", label: "Invoices" },
  { key: "activity", label: "Activity" },
];

export default function CompanyTabs({ activeTab, onTabChange }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <div className="flex min-w-max gap-1 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange(tab.key)}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              activeTab === tab.key ? "bg-primary text-white" : "text-slate-600 hover:bg-slate-100"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

