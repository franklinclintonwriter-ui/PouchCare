import { useState } from "react";
import Button from "../../../components/ui/Button";
import AdminPage from "../../../components/ui/PageShell";
import DataTable from "../../../components/ui/DataTable";
import { CrudCreateForm, StatusBadge, OpsPanel } from "../../shared/components";
import { useAdminPortal } from "../state/AdminPortalContext";

const roleMatrix = [
  { permission: "Manage Companies", Owner: true, Support: true, Finance: false, Editor: false },
  { permission: "Manage Billing", Owner: true, Support: false, Finance: true, Editor: false },
  { permission: "Publish Content", Owner: true, Support: false, Finance: false, Editor: true },
  { permission: "View System Logs", Owner: true, Support: true, Finance: true, Editor: false },
  { permission: "Team Administration", Owner: true, Support: false, Finance: false, Editor: false },
];

export default function TeamPage() {
  const { data, createTeamMember, updateTeamMember, deleteTeamMember } = useAdminPortal();
  const [form, setForm] = useState({ name: "", email: "", role: "Support", status: "Invited" });
  const invited = data.teamMembers.filter((m) => m.status === "Invited");

  return (
    <AdminPage
      title="Team"
      description="Global team, role assignment, and operations access governance."
      actions={<Button size="sm">Review Access Audit</Button>}
    >
      <CrudCreateForm
        title="Invite Team Member"
        fields={[
          { key: "name", label: "Full name" },
          { key: "email", label: "Email" },
          {
            key: "role",
            type: "select",
            options: [
              { value: "Owner", label: "Owner" },
              { value: "Support", label: "Support" },
              { value: "Finance", label: "Finance" },
              { value: "Editor", label: "Editor" },
            ],
          },
          {
            key: "status",
            type: "select",
            options: [
              { value: "Invited", label: "Invited" },
              { value: "Active", label: "Active" },
            ],
          },
        ]}
        values={form}
        onChange={(key, value) => setForm((prev) => ({ ...prev, [key]: value }))}
        onSubmit={(e) => {
          e.preventDefault();
          createTeamMember(form);
          setForm({ name: "", email: "", role: "Support", status: "Invited" });
        }}
        submitLabel="Send Invite"
      />

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <OpsPanel title="Pending Invitations" subtitle="Resend or revoke before acceptance.">
          {invited.length ? (
            <div className="space-y-2">
              {invited.map((member) => (
                <div key={member.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{member.name}</p>
                    <p className="text-xs text-slate-500">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => updateTeamMember(member.id, { updated: "Invite resent (Now)" })}>
                      Resend
                    </Button>
                    <Button size="sm" onClick={() => deleteTeamMember(member.id)}>
                      Revoke
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No pending invitations.</p>
          )}
        </OpsPanel>

        <OpsPanel title="Role Matrix (RBAC)" subtitle="Baseline access controls by role.">
          <DataTable
            columns={[
              { key: "permission", label: "Permission" },
              { key: "Owner", label: "Owner" },
              { key: "Support", label: "Support" },
              { key: "Finance", label: "Finance" },
              { key: "Editor", label: "Editor" },
            ]}
            rows={roleMatrix.map((row) => ({
              permission: row.permission,
              Owner: row.Owner ? "Allow" : "Deny",
              Support: row.Support ? "Allow" : "Deny",
              Finance: row.Finance ? "Allow" : "Deny",
              Editor: row.Editor ? "Allow" : "Deny",
            }))}
          />
        </OpsPanel>
      </div>

      <DataTable
        columns={[
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "role", label: "Role" },
          { key: "status", label: "Status" },
          { key: "updated", label: "Updated" },
          { key: "actions", label: "Actions" },
        ]}
        rows={data.teamMembers.map((m) => ({
          name: m.name,
          email: m.email,
          role: m.role,
          status: <StatusBadge value={m.status} />,
          updated: m.updated,
          actions: (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => updateTeamMember(m.id, { status: m.status === "Active" ? "Invited" : "Active" })}
              >
                {m.status === "Active" ? "Disable" : "Activate"}
              </Button>
              {m.status === "Invited" ? (
                <Button size="sm" variant="secondary" onClick={() => updateTeamMember(m.id, { updated: "Invite resent (Now)" })}>
                  Resend Invite
                </Button>
              ) : null}
              <Button size="sm" onClick={() => deleteTeamMember(m.id)}>
                Revoke Access
              </Button>
            </div>
          ),
        }))}
      />
    </AdminPage>
  );
}

