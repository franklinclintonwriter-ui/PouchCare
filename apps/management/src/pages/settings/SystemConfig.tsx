import { useMemo, useState, useEffect } from 'react';
import { Settings2, Save, History } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { PageTransition } from '@/components/ui/PageTransition';
import { Tabs } from '@/components/ui/Tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { useSystemSettings, useUpdateSystemSettings, useSystemAuditLogs } from '@/api/system-config';
import { toast } from 'sonner';

export default function SystemConfig() {
  const [activeTab, setActiveTab] = useState('general');
  const { data: settings, isLoading } = useSystemSettings();
  const updateMutation = useUpdateSystemSettings();

  const [localState, setLocalState] = useState<Record<string, any>>({});

  useEffect(() => {
    if (settings) {
      const state: Record<string, any> = {};
      settings.forEach((s) => {
        state[s.key] = s.value;
      });
      setLocalState(state);
    }
  }, [settings]);

  const headerConfig = useMemo(() => ({
    title: 'System Configurations',
    breadcrumbs: [
      { label: 'Settings', href: '/settings/profile' },
      { label: 'System Config', icon: Settings2 },
    ],
    actions: [],
  }), []);

  useHeaderConfig(headerConfig);

  const handleSave = async (group: string) => {
    if (!settings) return;

    // find what changed in this group
    const updates: any[] = [];
    settings.filter(s => s.group === group).forEach(s => {
      if (localState[s.key] !== s.value) {
        updates.push({
          key: s.key,
          value: localState[s.key],
          type: s.type,
          group: s.group,
        });
      }
    });

    // Also check for new keys that might have been added to localState but don't exist yet
    // For this simple implementation, we assume keys are predefined or added via seed.
    // If we need to dynamically add keys, we can do that here.

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

  const handleUpdate = (key: string, value: any) => {
    setLocalState(prev => ({ ...prev, [key]: value }));
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
            Global system settings, module toggles, and security policies. Only the CEO can access this area.
          </p>
        </div>

        <Tabs
          value={activeTab}
          onChange={setActiveTab}
          variant="wrap"
          tabs={[
            { label: 'General', value: 'general' },
            { label: 'Financial', value: 'financial' },
            { label: 'Security', value: 'security' },
            { label: 'Modules', value: 'modules' },
            { label: 'Integrations', value: 'integrations' },
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
                  value={localState['company_name'] || ''}
                  onChange={(e) => handleUpdate('company_name', e.target.value)}
                />
                <Input
                  label="Support Email"
                  value={localState['support_email'] || ''}
                  onChange={(e) => handleUpdate('support_email', e.target.value)}
                />
                <Input
                  label="Support Phone"
                  value={localState['support_phone'] || ''}
                  onChange={(e) => handleUpdate('support_phone', e.target.value)}
                />
                <Input
                  label="Default Timezone"
                  value={localState['default_timezone'] || 'UTC'}
                  onChange={(e) => handleUpdate('default_timezone', e.target.value)}
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
                  label="Global Default Commission Rate (%)"
                  value={localState['commission_rate'] || 20}
                  onChange={(e) => handleUpdate('commission_rate', Number(e.target.value))}
                />
                <Input
                  type="number"
                  label="Commission Hold Period (Days)"
                  value={localState['commission_hold_days'] || 14}
                  onChange={(e) => handleUpdate('commission_hold_days', Number(e.target.value))}
                />
                <Input
                  type="number"
                  label="Minimum Payout Threshold (USD)"
                  value={localState['min_payout_threshold'] || 50}
                  onChange={(e) => handleUpdate('min_payout_threshold', Number(e.target.value))}
                />
                <div className="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Enable Crypto Payments</p>
                    <p className="text-sm text-gray-500">Allow USDT/Binance for payouts</p>
                  </div>
                  <Toggle
                    checked={localState['crypto_payments_enabled'] ?? true}
                    onChange={(v) => handleUpdate('crypto_payments_enabled', v)}
                  />
                </div>
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
                    checked={localState['force_2fa'] ?? false}
                    onChange={(v) => handleUpdate('force_2fa', v)}
                  />
                </div>
                <Input
                  type="number"
                  label="Session Timeout (Minutes)"
                  value={localState['session_timeout'] || 120}
                  onChange={(e) => handleUpdate('session_timeout', Number(e.target.value))}
                />
                <Input
                  label="Whitelisted Office IPs (Comma separated)"
                  placeholder="e.g. 192.168.1.1, 10.0.0.1"
                  value={localState['whitelisted_ips'] || ''}
                  onChange={(e) => handleUpdate('whitelisted_ips', e.target.value)}
                />
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
                  { key: 'module_crm', label: 'CRM Module', desc: 'Enable/Disable CRM entirely' },
                  { key: 'module_hr', label: 'HR Module', desc: 'Enable/Disable HR features' },
                  { key: 'module_plugins', label: 'Plugin Marketplace', desc: 'Enable/Disable Plugins' },
                  { key: 'module_tools', label: 'SEO Tools', desc: 'Enable/Disable Marketing Tools' },
                  { key: 'module_cctv', label: 'CCTV Integration', desc: 'Enable/Disable Vigi CCTV integration' },
                ].map((mod) => (
                  <div key={mod.key} className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{mod.label}</p>
                      <p className="text-sm text-gray-500">{mod.desc}</p>
                    </div>
                    <Toggle
                      checked={localState[mod.key] ?? true}
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
                  value={localState['smtp_host'] || ''}
                  onChange={(e) => handleUpdate('smtp_host', e.target.value)}
                />
                <Input
                  label="SMTP User"
                  value={localState['smtp_user'] || ''}
                  onChange={(e) => handleUpdate('smtp_user', e.target.value)}
                />
                <Input
                  type="password"
                  label="SMTP Password"
                  value={localState['smtp_pass'] || ''}
                  onChange={(e) => handleUpdate('smtp_pass', e.target.value)}
                />
                <Input
                  label="WhatsApp API Key"
                  value={localState['whatsapp_api_key'] || ''}
                  onChange={(e) => handleUpdate('whatsapp_api_key', e.target.value)}
                />
                <div className="flex justify-end pt-4">
                  <Button onClick={() => handleSave('integrations')} disabled={updateMutation.isPending}>
                    <Save className="mr-2 h-4 w-4" /> Save Integrations
                  </Button>
                </div>
              </CardContent>
            </Card>
        )}

        {activeTab === 'audit' && (
            <AuditLogTab />
        )}
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
                  By: {log.actorName} ({log.actorRole}) | IP: {log.ipAddress}
                </p>
                {log.details && (
                  <pre className="mt-2 overflow-x-auto rounded bg-gray-50 p-2 text-[10px] text-gray-800 dark:bg-gray-900 dark:text-gray-300">
                    {JSON.stringify(JSON.parse(log.details), null, 2)}
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
