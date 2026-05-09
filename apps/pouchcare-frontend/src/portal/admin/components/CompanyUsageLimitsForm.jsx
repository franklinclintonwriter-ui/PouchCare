import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";

export default function CompanyUsageLimitsForm({ limits, onChange, onSave }) {
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">Usage Limits</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          type="number"
          min="0"
          value={limits.maxWebsites}
          onChange={(e) => onChange("maxWebsites", Number(e.target.value || 0))}
          placeholder="Max websites"
        />
        <Input
          type="number"
          min="0"
          value={limits.maxSeats}
          onChange={(e) => onChange("maxSeats", Number(e.target.value || 0))}
          placeholder="Max seats"
        />
        <Input
          type="number"
          min="0"
          value={limits.monthlyPageViews}
          onChange={(e) => onChange("monthlyPageViews", Number(e.target.value || 0))}
          placeholder="Monthly page views"
        />
        <Input
          type="number"
          min="0"
          value={limits.storageGb}
          onChange={(e) => onChange("storageGb", Number(e.target.value || 0))}
          placeholder="Storage (GB)"
        />
      </div>
      <Button size="sm" onClick={onSave}>
        Save Limits
      </Button>
    </div>
  );
}

