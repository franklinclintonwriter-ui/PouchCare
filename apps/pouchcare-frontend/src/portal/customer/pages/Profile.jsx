import { useState } from "react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Card from "../../../components/ui/Card";
import AdminPage from "../../../components/ui/PageShell";
import { useCustomerPortal } from "../state/CustomerPortalContext";

export default function ProfilePage() {
  const { data, updateProfile } = useCustomerPortal();
  const [form, setForm] = useState(data.profile);

  return (
    <AdminPage
      title="Profile"
      description="Personal profile, company details, and account identity."
      actions={<Button size="sm" onClick={() => setForm(data.profile)}>Reset</Button>}
    >
      <Card hover={false} className="p-5">
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            updateProfile(form);
          }}
        >
          <Input value={form.fullName || ""} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} placeholder="Full Name" />
          <Input type="email" value={form.email || ""} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="Email" />
          <Input value={form.company || ""} onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))} placeholder="Company" />
          <Input value={form.phone || ""} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone" />
          <Input className="sm:col-span-2" value={form.timezone || ""} onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))} placeholder="Timezone" />
          <div className="sm:col-span-2">
            <Button type="submit" size="sm">Save Profile</Button>
          </div>
        </form>
      </Card>
    </AdminPage>
  );
}

