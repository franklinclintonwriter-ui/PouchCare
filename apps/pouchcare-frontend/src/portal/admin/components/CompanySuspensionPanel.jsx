import { useState } from "react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";

export default function CompanySuspensionPanel({ company, onSuspend, onActivate }) {
  const [reason, setReason] = useState(company.suspension?.reason || "");
  const [notes, setNotes] = useState(company.suspension?.notes || "");

  const isSuspended = company.status === "Suspended";

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Account Suspension Workflow</h3>
        <p className="text-xs text-slate-500">Set explicit reason and notes for trust and compliance tracking.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Suspension reason" />
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Operational notes" />
      </div>

      <div className="flex flex-wrap gap-2">
        {isSuspended ? (
          <Button
            size="sm"
            onClick={() => {
              onActivate({ notes: notes.trim() });
            }}
          >
            Activate Company
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => {
              const trimmedReason = reason.trim();
              if (!trimmedReason) return;
              onSuspend({ reason: trimmedReason, notes: notes.trim() });
            }}
          >
            Suspend Company
          </Button>
        )}
      </div>

      {isSuspended && company.suspension?.reason ? (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
          <p className="font-medium">Current reason: {company.suspension.reason}</p>
          {company.suspension.notes ? <p className="mt-1">Notes: {company.suspension.notes}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

