import { useEffect, useMemo, useState } from "react";
import { StatusBadge } from "../../shared/components";
import CompanyTabs from "../components/CompanyTabs";
import CompanySuspensionPanel from "../components/CompanySuspensionPanel";
import CompanyUsageLimitsForm from "../components/CompanyUsageLimitsForm";
import CompanyNotesPanel from "../components/CompanyNotesPanel";
import Button from "../../../components/ui/Button";
import { useAdminPortal } from "../state/AdminPortalContext";

function SimpleList({ items, emptyLabel }) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-slate-500">{emptyLabel}</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="rounded-lg border border-slate-200 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-slate-900">{item.title || item.name || item.id}</p>
            {item.status ? <StatusBadge value={item.status} /> : null}
          </div>
          <p className="mt-1 text-xs text-slate-500">{item.subtitle || item.updated || ""}</p>
        </div>
      ))}
    </div>
  );
}

export default function CompanyDetail({ companyId, onBack }) {
  const {
    data,
    suspendCompany,
    activateCompany,
    updateCompanyUsageLimits,
    addCompanyNote,
    updateCompanyNote,
    deleteCompanyNote,
  } = useAdminPortal();
  const [activeTab, setActiveTab] = useState("overview");

  const company = useMemo(() => data.companies.find((c) => c.id === companyId), [data.companies, companyId]);
  const [limitsDraft, setLimitsDraft] = useState(company?.usageLimits || { maxWebsites: 0, maxSeats: 0, monthlyPageViews: 0, storageGb: 0 });

  useEffect(() => {
    setLimitsDraft(company?.usageLimits || { maxWebsites: 0, maxSeats: 0, monthlyPageViews: 0, storageGb: 0 });
  }, [companyId, company?.usageLimits]);

  if (!company) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-600">Company not found.</p>
        <Button size="sm" className="mt-3" onClick={onBack}>
          Back to Companies
        </Button>
      </div>
    );
  }

  const tabBody = {
    overview: (
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900">Company Overview</h3>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <p>Name: {company.name}</p>
            <p>Owner: {company.ownerEmail}</p>
            <p>Plan: {company.plan}</p>
            <p>
              Status: <StatusBadge value={company.status} />
            </p>
            <p>Websites: {company.websites}</p>
            <p>MRR: ${company.mrr}</p>
          </div>
        </div>

        <CompanyUsageLimitsForm
          limits={limitsDraft}
          onChange={(key, value) => setLimitsDraft((prev) => ({ ...prev, [key]: value }))}
          onSave={() => updateCompanyUsageLimits(company.id, limitsDraft)}
        />

        <CompanySuspensionPanel
          company={company}
          onSuspend={(payload) => suspendCompany(company.id, payload)}
          onActivate={(payload) => activateCompany(company.id, payload)}
        />

        <CompanyNotesPanel
          notes={company.internalNotes || []}
          onAddNote={(text) => addCompanyNote(company.id, text)}
          onUpdateNote={(noteId, text) => updateCompanyNote(company.id, noteId, text)}
          onDeleteNote={(noteId) => deleteCompanyNote(company.id, noteId)}
        />
      </div>
    ),
    websites: <SimpleList items={company.websitesList} emptyLabel="No websites configured." />,
    subscriptions: <SimpleList items={company.subscriptions} emptyLabel="No subscriptions found." />,
    invoices: <SimpleList items={company.invoices} emptyLabel="No invoices available." />,
    activity: <SimpleList items={company.auditEvents} emptyLabel="No company activity logged yet." />,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{company.name}</h2>
          <p className="text-sm text-slate-500">Company detail and operational controls</p>
        </div>
        <Button size="sm" variant="secondary" onClick={onBack}>
          Back
        </Button>
      </div>

      <CompanyTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div>{tabBody[activeTab]}</div>
    </div>
  );
}

