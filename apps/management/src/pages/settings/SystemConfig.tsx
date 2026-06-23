import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Settings2, Save, History } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { PageTransition } from '@/components/ui/PageTransition';
import { Tabs } from '@/components/ui/Tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { useSystemSettings, useUpdateSystemSettings, useSystemAuditLogs, type SettingValue, type SystemSetting } from '@/api/system-config';
import ServerStatusPanel from '@/pages/settings/ServerStatusPanel';
import { toast } from 'sonner';

/** Keys edited per tab — may span multiple DB groups (e.g. portal.* lives in general group). */
const TAB_KEYS: Record<string, string[]> = {
  general: ['company.name', 'company.email', 'company.phone', 'company.timezone'],
  financial: ['portal.commission_rate', 'portal.commission_hold_days', 'portal.min_payout_usd', 'finance.tax_rate'],
  security: ['security.two_factor_required', 'security.session_ttl_hours', 'security.ip_whitelist_enabled'],
  modules: [
    'modules.portal_enabled',
    'modules.crm_enabled',
    'modules.hr_enabled',
    'modules.plugins_enabled',
    'modules.tools_enabled',
    'modules.monitoring_enabled',
  ],
  integrations: ['integrations.smtp_host', 'integrations.smtp_port', 'integrations.whatsapp_enabled', 'integrations.cloudflare_proxy'],
};

function getSettingMeta(settings: SystemSetting[] | undefined, key: string): Pick<SystemSetting, 'type' | 'group'> {
  const found = settings?.find((s) => s.key === key);
  return {
    type: found?.type ?? 'string',
    group: found?.group ?? key.split('.')[0] ?? 'general',
  };
}

export default function SystemConfig() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') ?? 'general';
  const [activeTab, setActiveTab] = useState(initialTab);
  const { data: settings, isLoading } = useSystemSettings();
  const updateMutation = useUpdateSystemSettings();

  const [localState, setLocalState] = useState<Record<string, SettingValue>>({});

  useEffect(() => {
    if (settings) {
      const state: Record<string, SettingValue> = {};
      settings.forEach((s) => {
        state[s.key] = s.value;
      });
      setLocalState(state);
    }
  }, [settings]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams(tab === 'general' ? {} : { tab }, { replace: true });
  };

  const headerConfig = useMemo(() => ({
    title: 'System Configurations',
    breadcrumbs: [
      { label: 'Settings', href: '/settings/profile' },
      { label: 'System Config', icon: Settings2 },
    ],
    actions: [],
  }), []);

  useHeaderConfig(headerConfig);

  const handleSave = async (tab: string) => {
    if (!settings) return;

    const keys = TAB_KEYS[tab] ?? [];
    const updates: { key: string; value: SettingValue; type: string; group: string }[] = [];

    keys.forEach((key) => {
      const original = settings.find((s) => s.key === key);
      const current = localState[key];
      if (current === undefined) return;
      if (original && original.value === current) return;
      const meta = getSettingMeta(settings, key);
      updates.push({
        key,
        value: current,
        type: meta.type,
        group: meta.group,
      });
    });

    if (updates.length === 0) {
      toast.info('No changes to save.');
      return;
    }

    try {
      await updateMutation.mutateAsync(updates);
      toast.success('Settings updated successfully');
    } catch {
      toast.error('Failed to update settings');
    }
  };

  const handleUpdate = (key: string, value: SettingValue) => {
    setLocalState((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <PageTransition className="flex justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
      </PageTransition>
    );
  }

  return (
    <PageTransition className="p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Configurations Hub</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Global system settings, server status, and security policies. Accessible to CEO and Co-MD.
          </p>
        </div>

        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="wrap"
          tabs={[
            { label: 'General', value: 'general' },
            { label: 'Financial', value: 'financial' },
            { label: 'Security', value: 'security' },
            { label: 'Modules', value: 'modules' },
            { label: 'Integrations', value: 'integrations' },
            { label: 'Server', value: 'server' },
            { label: 'Audit Log', value: 'audit' },
          ]}
          className="mb-6"
        />

        {activeTab === 'general' && (
          <Card>
            <CardHeader>
              <CardTitle>General & Branding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Company Name"
                value={String(localState['company.name'] ?? '')}
                onChange={(e) => handleUpdate('company.name', e.target.value)}
              />
              <Input
                label="Support Email"
                value={String(localState['company.email'] ?? '')}
                onChange={(e) => handleUpdate('company.email', e.target.value)}
              />
              <Input
                label="Support Phone"
                value={String(localState['company.phone'] ?? '')}
                onChange={(e) => handleUpdate('company.phone', e.target.value)}
              />
              <Input
                label="Default Timezone"
                value={String(localState['company.timezone'] ?? 'UTC')}
                onChange={(e) => handleUpdate('company.timezone', e.target.value)}
              />
              <div className="flex justify-end pt-4">
                <Button onClick={() => handleSave('general')} disabled={updateMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" /> Save General
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'financial' && (
          <Card>
            <CardHeader>
              <CardTitle>Financial & Commission Engine</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="number"
                label="Global Default Commission Rate (decimal, e.g. 0.2 = 20%)"
                step="0.01"
                min="0"
                max="1"
                value={Number(localState['portal.commission_rate'] ?? 0.2)}
                onChange={(e) => handleUpdate('portal.commission_rate', Number(e.target.value))}
              />
              <Input
                type="number"
                label="Commission Hold Period (Days)"
                value={Number(localState['portal.commission_hold_days'] ?? 14)}
                onChange={(e) => handleUpdate('portal.commission_hold_days', Number(e.target.value))}
              />
              <Input
                type="number"
                label="Minimum Payout Threshold (USD)"
                value={Number(localState['portal.min_payout_usd'] ?? 50)}
                onChange={(e) => handleUpdate('portal.min_payout_usd', Number(e.target.value))}
              />
              <Input
                type="number"
                label="Default Tax Rate (decimal, e.g. 0.05 = 5%)"
                step="0.01"
                min="0"
                max="1"
                value={Number(localState['finance.tax_rate'] ?? 0.05)}
                onChange={(e) => handleUpdate('finance.tax_rate', Number(e.target.value))}
              />
              <div className="flex justify-end pt-4">
                <Button onClick={() => handleSave('financial')} disabled={updateMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" /> Save Financial
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'security' && (
          <Card>
            <CardHeader>
              <CardTitle>Security & Access Control</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Global 2FA Enforcement</p>
                  <p className="text-sm text-gray-500">Force all staff to use Two-Factor Authentication</p>
                </div>
                <Toggle
                  checked={Boolean(localState['security.two_factor_required'] ?? false)}
                  onChange={(v) => handleUpdate('security.two_factor_required', v)}
                />
              </div>
              <Input
                type="number"
                label="Session TTL (Hours)"
                value={Number(localState['security.session_ttl_hours'] ?? 168)}
                onChange={(e) => handleUpdate('security.session_ttl_hours', Number(e.target.value))}
              />
              <div className="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">IP Whitelist Enabled</p>
                  <p className="text-sm text-gray-500">Restrict admin panel access by IP</p>
                </div>
                <Toggle
                  checked={Boolean(localState['security.ip_whitelist_enabled'] ?? false)}
                  onChange={(v) => handleUpdate('security.ip_whitelist_enabled', v)}
                />
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={() => handleSave('security')} disabled={updateMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" /> Save Security
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'modules' && (
          <Card>
            <CardHeader>
              <CardTitle>Feature & Module Master Switches</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'modules.portal_enabled', label: 'Client Portal', desc: 'Enable/Disable client portal' },
                { key: 'modules.crm_enabled', label: 'CRM Module', desc: 'Enable/Disable CRM entirely' },
                { key: 'modules.hr_enabled', label: 'HR Module', desc: 'Enable/Disable HR features' },
                { key: 'modules.plugins_enabled', label: 'Plugin Marketplace', desc: 'Enable/Disable Plugins' },
                { key: 'modules.tools_enabled', label: 'SEO Tools', desc: 'Enable/Disable Marketing Tools' },
                { key: 'modules.monitoring_enabled', label: 'CCTV Integration', desc: 'Enable/Disable Vigi CCTV integration' },
              ].map((mod) => (
                <div key={mod.key} className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{mod.label}</p>
                    <p className="text-sm text-gray-500">{mod.desc}</p>
                  </div>
                  <Toggle
                    checked={Boolean(localState[mod.key] ?? true)}
                    onChange={(v) => handleUpdate(mod.key, v)}
                  />
                </div>
              ))}
              <div className="flex justify-end pt-4">
                <Button onClick={() => handleSave('modules')} disabled={updateMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" /> Save Modules
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'integrations' && (
          <Card>
            <CardHeader>
              <CardTitle>Integrations & API</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="SMTP Host"
                value={String(localState['integrations.smtp_host'] ?? '')}
                onChange={(e) => handleUpdate('integrations.smtp_host', e.target.value)}
              />
              <Input
                type="number"
                label="SMTP Port"
                value={Number(localState['integrations.smtp_port'] ?? 587)}
                onChange={(e) => handleUpdate('integrations.smtp_port', Number(e.target.value))}
              />
              <div className="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">WhatsApp Alerts</p>
                  <p className="text-sm text-gray-500">Enable WhatsApp notification integration</p>
                </div>
                <Toggle
                  checked={Boolean(localState['integrations.whatsapp_enabled'] ?? false)}
                  onChange={(v) => handleUpdate('integrations.whatsapp_enabled', v)}
                />
              </div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Cloudflare Proxy</p>
                  <p className="text-sm text-gray-500">Enable Cloudflare proxy on assets</p>
                </div>
                <Toggle
                  checked={Boolean(localState['integrations.cloudflare_proxy'] ?? true)}
                  onChange={(v) => handleUpdate('integrations.cloudflare_proxy', v)}
                />
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={() => handleSave('integrations')} disabled={updateMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" /> Save Integrations
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'server' && <ServerStatusPanel />}

        {activeTab === 'audit' && <AuditLogTab />}
      </div>
    </PageTransition>
  );
}

function AuditLogTab() {
  const { data: logs, isLoading } = useSystemAuditLogs();

  if (isLoading) return <p>Loading audit logs...</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" /> System Audit Logs
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs?.length === 0 ? (
          <p className="text-sm text-gray-500">No logs found.</p>
        ) : (
          <div className="space-y-4">
            {logs?.map((log) => (
              <div key={log.id} className="rounded-lg border border-gray-100 p-3 dark:border-gray-800">
                <div className="flex justify-between">
                  <p className="text-sm font-medium">{log.action}</p>
                  <p className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleString()}</p>
                </div>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  By: {String(log.metadata?.actorName ?? log.actorId ?? 'system')} ({log.actorRole ?? '—'}) | {log.resourceKind}:{log.resourceId} | IP: {log.ip ?? '—'}
                </p>
                {log.metadata && (
                  <pre className="mt-2 overflow-x-auto rounded bg-gray-50 p-2 text-[10px] text-gray-800 dark:bg-gray-900 dark:text-gray-300">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
