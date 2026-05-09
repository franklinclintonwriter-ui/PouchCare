import { useMemo, useState } from "react";
import AdminPage from "../../../components/ui/PageShell";
import DataTable from "../../../components/ui/DataTable";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { StatusBadge, CrudActions, CrudCreateForm, MetricTile } from "../../shared/components";
import { useAdminPortal } from "../state/AdminPortalContext";

const STATUS_CYCLE = ["Planning", "In Progress", "On Hold", "Completed", "Cancelled"];

const emptyForm = {
  name: "",
  companyName: "",
  templateName: "",
  assignedTo: "",
  deadline: "",
  status: "Planning",
};

function progressColor(pct) {
  if (pct >= 75) return "text-green-600";
  if (pct >= 40) return "text-amber-600";
  return "text-red-600";
}

export default function ProjectsPage() {
  const { data, createProject, updateProject, deleteProject } = useAdminPortal();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState(emptyForm);

  const today = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.projects.filter((p) => {
      const okStatus = statusFilter === "all" || p.status === statusFilter;
      const okQuery = q ? `${p.name} ${p.companyName} ${p.templateName}`.toLowerCase().includes(q) : true;
      return okStatus && okQuery;
    });
  }, [data.projects, query, statusFilter]);

  const totalProjects = data.projects.length;
  const inProgress = data.projects.filter((p) => p.status === "In Progress").length;
  const overdue = data.projects.filter((p) => p.deadline < today && p.status !== "Completed" && p.status !== "Cancelled").length;

  const cycleStatus = (project) => {
    const idx = STATUS_CYCLE.indexOf(project.status);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    updateProject(project.id, { status: next });
  };

  const rows = filtered.map((p) => ({
    name: p.name,
    company: p.companyName,
    template: p.templateName,
    status: <StatusBadge value={p.status} />,
    assignedTo: p.assignedTo || "—",
    deadline: p.deadline,
    progress: <span className={`font-semibold ${progressColor(p.progress)}`}>{p.progress}%</span>,
    updated: p.updated,
    actions: (
      <CrudActions
        onEdit={() => cycleStatus(p)}
        onDelete={() => deleteProject(p.id)}
        editLabel={`→ ${STATUS_CYCLE[(STATUS_CYCLE.indexOf(p.status) + 1) % STATUS_CYCLE.length]}`}
      />
    ),
  }));

  return (
    <AdminPage
      title="Projects"
      description="Company websites, environments, and publishing workflows."
      actions={<Button size="sm">Export Projects</Button>}
    >
      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <MetricTile label="Total Projects" value={totalProjects} hint="All tracked projects" />
        <MetricTile label="In Progress" value={inProgress} hint="Actively being worked on" />
        <MetricTile label="Overdue" value={overdue} hint="Past deadline, not completed" />
      </div>

      <CrudCreateForm
        title="Create Project"
        fields={[
          { key: "name", label: "Project Name" },
          { key: "companyName", label: "Company" },
          { key: "templateName", label: "Template" },
          { key: "assignedTo", label: "Assigned To", required: false },
          { key: "deadline", label: "Deadline", type: "date" },
          {
            key: "status",
            type: "select",
            options: [
              { value: "Planning", label: "Planning" },
              { value: "In Progress", label: "In Progress" },
              { value: "On Hold", label: "On Hold" },
              { value: "Completed", label: "Completed" },
              { value: "Cancelled", label: "Cancelled" },
            ],
          },
        ]}
        values={form}
        onChange={(key, value) => setForm((prev) => ({ ...prev, [key]: value }))}
        onSubmit={(e) => {
          e.preventDefault();
          createProject(form);
          setForm(emptyForm);
        }}
        submitLabel="Create Project"
      />

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-3">
        <Input placeholder="Search project, company, or template" value={query} onChange={(e) => setQuery(e.target.value)} />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="Planning">Planning</option>
          <option value="In Progress">In Progress</option>
          <option value="On Hold">On Hold</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </Select>
        <div className="text-sm text-slate-600 self-center">{filtered.length} project(s)</div>
      </div>

      <DataTable
        columns={[
          { key: "name", label: "Project Name" },
          { key: "company", label: "Company" },
          { key: "template", label: "Template" },
          { key: "status", label: "Status" },
          { key: "assignedTo", label: "Assigned To" },
          { key: "deadline", label: "Deadline" },
          { key: "progress", label: "Progress" },
          { key: "updated", label: "Updated" },
          { key: "actions", label: "Actions" },
        ]}
        rows={rows}
      />
    </AdminPage>
  );
}
