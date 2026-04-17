import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { useUpdateStaff } from '@/api/staff';
import type { StaffProfileDetail } from '@/types/models';
import type { SystemRole } from '@/types/enums';
import { ROLE_LABELS } from '@/utils/permissions';

const ROLE_OPTIONS = (Object.keys(ROLE_LABELS) as SystemRole[]).map((r) => ({ value: r, label: ROLE_LABELS[r] }));
const STATUS_OPTIONS = ['Active', 'Inactive', 'Suspended', 'Pending'].map((s) => ({ value: s, label: s }));

function toDateInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function parseOptionalNumber(s: string): number | null {
  const t = s.trim();
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function buildPayload(form: Record<string, string>, systemRole: SystemRole) {
  const g = (k: string) => (form[k] ?? '').trim();
  const nullStr = (k: string) => {
    const v = g(k);
    return v === '' ? null : v;
  };
  const yearsExperience = parseOptionalNumber(g('yearsExperience'));
  const salary = parseOptionalNumber(g('salary'));
  const joinRaw = g('joinDate');
  const termRaw = g('terminationDate');

  return {
    name: g('name'),
    email: g('email'),
    systemRole,
    status: g('status'),
    branch: g('branch'),
    jobRole: nullStr('jobRole'),
    primarySkill: nullStr('primarySkill'),
    skillLevel: nullStr('skillLevel'),
    secondarySkills: nullStr('secondarySkills'),
    toolsKnown: nullStr('toolsKnown'),
    yearsExperience,
    employmentType: nullStr('employmentType'),
    salary,
    email2: nullStr('email2'),
    phone: nullStr('phone'),
    whatsapp: nullStr('whatsapp'),
    address: nullStr('address'),
    country: nullStr('country'),
    nidPassport: nullStr('nidPassport'),
    emergencyContact: nullStr('emergencyContact'),
    joinDate: joinRaw === '' ? null : new Date(`${joinRaw}T12:00:00.000Z`).toISOString(),
    terminationDate: termRaw === '' ? null : new Date(`${termRaw}T12:00:00.000Z`).toISOString(),
    exitReason: nullStr('exitReason'),
    portfolioUrl: nullStr('portfolioUrl'),
    linkedinUrl: nullStr('linkedinUrl'),
    githubUrl: nullStr('githubUrl'),
    certifications: nullStr('certifications'),
  };
}

function memberToForm(member: StaffProfileDetail): Record<string, string> {
  return {
    name: member.name,
    email: member.email,
    systemRole: member.systemRole,
    status: member.status ?? (member.isActive ? 'Active' : 'Inactive'),
    branch: member.branch === '-' ? '' : member.branch,
    jobRole: member.department === '-' ? '' : member.department,
    primarySkill: member.primarySkill ?? '',
    skillLevel: member.skillLevel ?? '',
    secondarySkills: member.secondarySkills ?? '',
    toolsKnown: member.toolsKnown ?? '',
    yearsExperience: member.yearsExperience != null ? String(member.yearsExperience) : '',
    employmentType: member.employmentType ?? '',
    salary: member.salary != null ? String(member.salary) : '',
    email2: member.email2 ?? '',
    phone: member.phone === '-' ? '' : member.phone,
    whatsapp: member.whatsapp ?? '',
    address: member.address ?? '',
    country: member.country ?? '',
    nidPassport: member.nidPassport ?? '',
    emergencyContact: member.emergencyContact ?? '',
    joinDate: toDateInput(member.joinDate),
    terminationDate: toDateInput(member.terminationDate),
    exitReason: member.exitReason ?? '',
    portfolioUrl: member.portfolioUrl ?? '',
    linkedinUrl: member.linkedinUrl ?? '',
    githubUrl: member.githubUrl ?? '',
    certifications: member.certifications ?? '',
  };
}

export function StaffProfileAdminForm({ member }: { member: StaffProfileDetail }) {
  const update = useUpdateStaff();
  const [form, setForm] = useState(() => memberToForm(member));

  useEffect(() => {
    setForm(memberToForm(member));
  }, [member]);

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || form.name.trim().length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }
    if (!form.email.trim()) {
      toast.error('Email is required');
      return;
    }
    const systemRole = form.systemRole as SystemRole;
    const payload = buildPayload(form, systemRole);
    try {
      await update.mutateAsync({ id: member.id, ...payload });
      toast.success('Profile updated');
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response
          ? String((err.response as { data?: { message?: string } }).data?.message ?? '')
          : '';
      toast.error(msg || 'Update failed');
    }
  };

  const grid = 'grid gap-4 sm:grid-cols-2';

  return (
    <form onSubmit={onSubmit}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Edit staff profile</CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Changes are saved to this user&apos;s record. Role changes follow assignment rules (e.g. CEO roles).
          </p>
        </CardHeader>
        <CardContent className="space-y-8">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Identity &amp; role</h3>
            <div className={grid}>
              <Input label="Full name" value={form.name} onChange={(e) => set('name', e.target.value)} required />
              <Input label="Work email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required />
              <Select
                label="System role"
                options={ROLE_OPTIONS}
                value={form.systemRole}
                onChange={(e) => set('systemRole', e.target.value)}
              />
              <Select
                label="Status"
                options={STATUS_OPTIONS}
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
              />
              <Input label="Branch" value={form.branch} onChange={(e) => set('branch', e.target.value)} />
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Role &amp; compensation</h3>
            <div className={grid}>
              <Input label="Job title / department" value={form.jobRole} onChange={(e) => set('jobRole', e.target.value)} />
              <Input label="Primary skill" value={form.primarySkill} onChange={(e) => set('primarySkill', e.target.value)} />
              <Input label="Skill level" value={form.skillLevel} onChange={(e) => set('skillLevel', e.target.value)} />
              <Input
                label="Years experience"
                type="number"
                min={0}
                max={80}
                value={form.yearsExperience}
                onChange={(e) => set('yearsExperience', e.target.value)}
              />
              <Input label="Employment type" value={form.employmentType} onChange={(e) => set('employmentType', e.target.value)} placeholder="e.g. Full-time" />
              <Input
                label="Salary"
                type="number"
                min={0}
                step="0.01"
                value={form.salary}
                onChange={(e) => set('salary', e.target.value)}
              />
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Skills &amp; tools</h3>
            <div className="space-y-4">
              <Textarea
                label="Secondary skills"
                value={form.secondarySkills}
                onChange={(e) => set('secondarySkills', e.target.value)}
                rows={2}
              />
              <Textarea label="Tools known" value={form.toolsKnown} onChange={(e) => set('toolsKnown', e.target.value)} rows={2} />
              <Textarea
                label="Certifications"
                value={form.certifications}
                onChange={(e) => set('certifications', e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Contact</h3>
            <div className={grid}>
              <Input label="Phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
              <Input label="WhatsApp" value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} />
              <Input label="Secondary email" type="email" value={form.email2} onChange={(e) => set('email2', e.target.value)} />
              <Input label="Country" value={form.country} onChange={(e) => set('country', e.target.value)} />
            </div>
            <div className="mt-4 space-y-4">
              <Textarea label="Address" value={form.address} onChange={(e) => set('address', e.target.value)} rows={2} />
              <div className={grid}>
                <Input label="NID / Passport" value={form.nidPassport} onChange={(e) => set('nidPassport', e.target.value)} />
                <Input label="Emergency contact" value={form.emergencyContact} onChange={(e) => set('emergencyContact', e.target.value)} />
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Dates &amp; exit</h3>
            <div className={grid}>
              <Input label="Join date" type="date" value={form.joinDate} onChange={(e) => set('joinDate', e.target.value)} />
              <Input label="Termination date" type="date" value={form.terminationDate} onChange={(e) => set('terminationDate', e.target.value)} />
            </div>
            <div className="mt-4">
              <Textarea label="Exit reason" value={form.exitReason} onChange={(e) => set('exitReason', e.target.value)} rows={2} />
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Links</h3>
            <div className={grid}>
              <Input label="Portfolio URL" type="url" value={form.portfolioUrl} onChange={(e) => set('portfolioUrl', e.target.value)} />
              <Input label="LinkedIn URL" type="url" value={form.linkedinUrl} onChange={(e) => set('linkedinUrl', e.target.value)} />
              <Input label="GitHub URL" type="url" value={form.githubUrl} onChange={(e) => set('githubUrl', e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end border-t border-gray-100 pt-4 dark:border-gray-700">
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
