import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Puzzle, Download, Globe, Plus, Code2,
  CheckCircle, XCircle, Pencil, Upload, EyeOff,
} from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import {
  usePlugin, useUpdatePlugin, usePublishVersion, usePluginActivations,
  type PluginVersion, type PluginActivation,
} from '@/api/plugins';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Tabs } from '@/components/ui/Tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { PageTransition } from '@/components/ui/PageTransition';
import { Skeleton } from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { usePermission } from '@/hooks/usePermission';
import { getApiOrigin } from '@/config/apiOrigin';
import { toast } from 'sonner';

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'default'> = {
  PUBLISHED: 'success',
  DRAFT: 'warning',
};

const PHP_STARTER = (slug: string, name: string, version: string) => `<?php
/**
 * Plugin Name: ${name}
 * Plugin URI:  https://pouchcare.com/plugins/${slug}
 * Description: Activate this plugin with your PouchCare account credentials.
 * Version:     ${version}
 * Update URI:  {API_BASE}/v1/plugins/${slug}/update-info
 * License:     Proprietary
 */

if (!defined('ABSPATH')) {
    exit;
}

define('${slug.toUpperCase().replace(/-/g, '_')}_PLUGIN_VERSION', '${version}');
define('${slug.toUpperCase().replace(/-/g, '_')}_API_BASE', 'https://api.pouchcare.com/v1');

// Add admin settings page
function ${slug.replace(/-/g, '_')}_admin_menu() {
    add_options_page(
        '${name} Settings',
        '${name}',
        'manage_options',
        '${slug}-settings',
        '${slug.replace(/-/g, '_')}_settings_page'
    );
}
add_action('admin_menu', '${slug.replace(/-/g, '_')}_admin_menu');

// Render the settings/activation page
function ${slug.replace(/-/g, '_')}_settings_page() {
    $activated = get_option('${slug.replace(/-/g, '_')}_activated', false);
    $user_name  = get_option('${slug.replace(/-/g, '_')}_user_name', '');

    if ($activated) {
        echo '<div class="wrap"><h1>${name}</h1>';
        echo '<div class="notice notice-success"><p><strong>Plugin activated</strong> for: ' . esc_html($user_name) . '</p></div>';
        echo '</div>';
        return;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['${slug.replace(/-/g, '_')}_nonce'])) {
        if (!wp_verify_nonce($_POST['${slug.replace(/-/g, '_')}_nonce'], '${slug}-activate')) {
            wp_die('Security check failed');
        }
        $email    = sanitize_email($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';
        $response = wp_remote_post(${slug.toUpperCase().replace(/-/g, '_')}_API_BASE . '/plugins/activate', [
            'headers' => ['Content-Type' => 'application/json'],
            'body'    => wp_json_encode([
                'slug'      => '${slug}',
                'email'     => $email,
                'password'  => $password,
                'userType'  => 'staff',
                'siteUrl'   => get_site_url(),
                'siteTitle' => get_bloginfo('name'),
            ]),
        ]);

        if (!is_wp_error($response) && wp_remote_retrieve_response_code($response) === 200) {
            $body = json_decode(wp_remote_retrieve_body($response), true);
            if (!empty($body['data']['activated'])) {
                update_option('${slug.replace(/-/g, '_')}_activated', true);
                update_option('${slug.replace(/-/g, '_')}_token', $body['data']['token']);
                update_option('${slug.replace(/-/g, '_')}_user_name', $body['data']['userName']);
                echo '<div class="wrap"><div class="notice notice-success"><p>Activated successfully!</p></div></div>';
                return;
            }
        }
        echo '<div class="wrap"><div class="notice notice-error"><p>Activation failed. Check your credentials.</p></div></div>';
    }

    echo '<div class="wrap"><h1>${name} Activation</h1>';
    echo '<form method="post">';
    wp_nonce_field('${slug}-activate', '${slug.replace(/-/g, '_')}_nonce');
    echo '<table class="form-table">';
    echo '<tr><th>PouchCare Email</th><td><input name="email" type="email" class="regular-text" required/></td></tr>';
    echo '<tr><th>Password</th><td><input name="password" type="password" class="regular-text" required/></td></tr>';
    echo '</table>';
    echo '<p class="submit"><input type="submit" class="button-primary" value="Activate Plugin"/></p>';
    echo '</form></div>';
}

// Update checker hook
function ${slug.replace(/-/g, '_')}_check_for_update($transient) {
    if (empty($transient->checked)) return $transient;
    $res = wp_remote_get(${slug.toUpperCase().replace(/-/g, '_')}_API_BASE . '/plugins/${slug}/update-info');
    if (!is_wp_error($res) && wp_remote_retrieve_response_code($res) === 200) {
        $info = json_decode(wp_remote_retrieve_body($res));
        if (version_compare($info->version, ${slug.toUpperCase().replace(/-/g, '_')}_PLUGIN_VERSION, '>')) {
            $transient->response[plugin_basename(__FILE__)] = (object)[
                'slug'        => '${slug}',
                'new_version' => $info->version,
                'url'         => $info->download_url,
                'package'     => $info->download_url,
            ];
        }
    }
    return $transient;
}
add_filter('pre_set_site_transient_update_plugins', '${slug.replace(/-/g, '_')}_check_for_update');
`;

const emptyVersionForm = { version: '', phpFileContent: '', changelog: '' };
const emptyEditForm = { name: '', description: '' };

export default function PluginDetail() {
  const { id } = useParams<{ id: string }>();
  const perm = usePermission();
  const canManage = perm.isCEO;

  const { data: plugin, isLoading } = usePlugin(id!);
  const updatePlugin = useUpdatePlugin(id!);
  const publishVersion = usePublishVersion(id!);

  const [tab, setTab] = useState('versions');
  const [activationsPage, setActivationsPage] = useState(1);
  const { data: activationsData } = usePluginActivations(id!, activationsPage);

  // Publish version modal
  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const [versionForm, setVersionForm] = useState(emptyVersionForm);
  const [versionErrors, setVersionErrors] = useState<Partial<typeof emptyVersionForm>>({});

  // Edit plugin modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState(emptyEditForm);

  // Toggle status confirm
  const [toggleConfirmOpen, setToggleConfirmOpen] = useState(false);

  const openPublishVersion = useCallback(() => {
    if (!plugin) return;
    const parts = plugin.currentVersion.split('.').map(Number);
    parts[2] = (parts[2] ?? 0) + 1;
    const nextVersion = parts.join('.');
    setVersionForm({
      version: nextVersion,
      phpFileContent: plugin.versions[0]?.phpFileContent ?? PHP_STARTER(plugin.slug, plugin.name, nextVersion),
      changelog: '',
    });
    setVersionErrors({});
    setVersionModalOpen(true);
  }, [plugin]);

  const openEdit = useCallback(() => {
    if (!plugin) return;
    setEditForm({ name: plugin.name, description: plugin.description ?? '' });
    setEditModalOpen(true);
  }, [plugin]);

  useHeaderConfig({
    title: plugin?.name ?? 'Plugin',
    breadcrumbs: [
      { label: 'Plugins', href: '/plugins' },
      { label: plugin?.name ?? '…' },
    ],
    actions: canManage
      ? [
          { type: 'button', label: 'Edit', icon: Pencil, variant: 'secondary', onClick: openEdit },
          {
            type: 'button',
            label: plugin?.status === 'PUBLISHED' ? 'Unpublish' : 'Publish',
            icon: plugin?.status === 'PUBLISHED' ? EyeOff : Upload,
            variant: plugin?.status === 'PUBLISHED' ? 'danger' : 'primary',
            onClick: () => setToggleConfirmOpen(true),
          },
        ]
      : [],
  });

  const validateVersion = () => {
    const e: Partial<typeof emptyVersionForm> = {};
    if (!versionForm.version.trim()) e.version = 'Version is required';
    else if (!/^\d+\.\d+\.\d+$/.test(versionForm.version)) e.version = 'Must be semver format: X.Y.Z';
    if (!versionForm.phpFileContent.trim()) e.phpFileContent = 'PHP file content is required';
    setVersionErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePublishVersion = async () => {
    if (!validateVersion()) return;
    try {
      await publishVersion.mutateAsync({
        version: versionForm.version.trim(),
        phpFileContent: versionForm.phpFileContent,
        changelog: versionForm.changelog.trim() || undefined,
      });
      setVersionModalOpen(false);
      toast.success(`Version ${versionForm.version} published`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to publish version';
      toast.error(msg);
    }
  };

  const handleEditSave = async () => {
    if (!editForm.name.trim()) return;
    try {
      await updatePlugin.mutateAsync({ name: editForm.name.trim(), description: editForm.description.trim() });
      setEditModalOpen(false);
      toast.success('Plugin updated');
    } catch {
      toast.error('Failed to update plugin');
    }
  };

  const handleToggleStatus = async () => {
    if (!plugin) return;
    const newStatus = plugin.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      await updatePlugin.mutateAsync({ status: newStatus });
      setToggleConfirmOpen(false);
      toast.success(`Plugin ${newStatus === 'PUBLISHED' ? 'published' : 'unpublished'}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const versionColumns: Column<PluginVersion>[] = [
    {
      key: 'version',
      label: 'Version',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-medium">v{row.version}</span>
          {row.isLatest && <Badge variant="success" size="sm">Latest</Badge>}
        </div>
      ),
    },
    {
      key: 'changelog',
      label: 'Changelog',
      render: (row) => (
        <span className="text-sm text-[var(--color-text-secondary)] line-clamp-2">
          {row.changelog ?? '—'}
        </span>
      ),
    },
    {
      key: 'publishedAt',
      label: 'Published',
      render: (row) => (
        <span className="text-sm text-[var(--color-text-secondary)]">
          {new Date(row.publishedAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const activationColumns: Column<PluginActivation>[] = [
    {
      key: 'siteUrl',
      label: 'Site',
      render: (row) => (
        <div>
          <a
            href={row.siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:underline flex items-center gap-1 text-sm"
          >
            <Globe size={14} />
            {row.siteTitle ?? row.siteUrl}
          </a>
          {row.siteTitle && (
            <div className="text-xs text-[var(--color-text-secondary)] mt-0.5 font-mono">{row.siteUrl}</div>
          )}
        </div>
      ),
    },
    {
      key: 'activatedByName',
      label: 'Activated By',
      render: (row) => (
        <div>
          <div className="text-sm font-medium">{row.activatedByName ?? row.activatedById}</div>
          <div className="text-xs text-[var(--color-text-secondary)] capitalize">{row.activatedByType}</div>
        </div>
      ),
    },
    {
      key: 'activatedAt',
      label: 'Activated',
      render: (row) => (
        <span className="text-sm text-[var(--color-text-secondary)]">
          {new Date(row.activatedAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'lastPingAt',
      label: 'Last Ping',
      render: (row) => (
        <span className="text-sm text-[var(--color-text-secondary)]">
          {row.lastPingAt ? new Date(row.lastPingAt).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (row) =>
        row.isActive
          ? <CheckCircle size={16} className="text-success-600" />
          : <XCircle size={16} className="text-danger-600" />,
    },
  ];

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </PageTransition>
    );
  }

  if (!plugin) {
    return (
      <PageTransition>
        <Card><p className="py-8 text-center text-gray-500">Plugin not found.</p></Card>
      </PageTransition>
    );
  }

  const apiBase = getApiOrigin();
  const downloadUrl = `${apiBase}/v1/plugins/${plugin.slug}/download`;

  return (
    <PageTransition className="space-y-6">
      {/* Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-primary-50 p-3 dark:bg-primary-900/30 shrink-0">
                <Puzzle className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{plugin.name}</h2>
                  <Badge variant={STATUS_COLORS[plugin.status] ?? 'default'} size="sm">{plugin.status}</Badge>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] font-mono mt-0.5">{plugin.slug}</p>
                {plugin.description && (
                  <p className="text-sm text-[var(--color-text-secondary)] mt-2 max-w-lg">{plugin.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <div className="text-xs text-[var(--color-text-secondary)]">Current Version</div>
                <div className="font-mono font-semibold text-[var(--color-text-primary)]">v{plugin.currentVersion}</div>
              </div>
              {plugin.status === 'PUBLISHED' && (
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 text-sm font-medium transition-colors dark:bg-primary-900/30 dark:text-primary-300"
                >
                  <Download size={14} />
                  Download ZIP
                </a>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="mt-4 grid grid-cols-1 gap-3 border-t border-[var(--color-border)] pt-4 sm:grid-cols-3 sm:gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-[var(--color-text-primary)]">{plugin.versions.length}</div>
              <div className="text-xs text-[var(--color-text-secondary)]">Versions</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-[var(--color-text-primary)]">{plugin.activationCount}</div>
              <div className="text-xs text-[var(--color-text-secondary)]">Activated Sites</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-[var(--color-text-primary)]">{plugin.currentVersion}</div>
              <div className="text-xs text-[var(--color-text-secondary)]">Latest Version</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs
        tabs={[
          { label: 'Versions', value: 'versions' },
          { label: 'Activations', value: 'activations' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'versions' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Plugin Versions</CardTitle>
              {canManage && (
                <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={openPublishVersion}>
                  Publish New Version
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={versionColumns}
              data={plugin.versions}
              emptyTitle="No versions published yet"
            />
          </CardContent>
        </Card>
      )}

      {tab === 'activations' && (
        <Card>
          <CardHeader>
            <CardTitle>Activated Sites</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={activationColumns}
              data={activationsData?.data ?? []}
              pagination={activationsData?.meta ? {
                page: activationsData.meta.page,
                limit: 20,
                total: activationsData.meta.total,
                totalPages: activationsData.meta.totalPages,
              } : undefined}
              onPageChange={setActivationsPage}
              emptyTitle="No activations yet"
              emptyDescription="No WordPress sites have activated this plugin yet."
            />
          </CardContent>
        </Card>
      )}

      {/* Publish Version Modal */}
      <Modal
        isOpen={versionModalOpen}
        onClose={() => setVersionModalOpen(false)}
        title="Publish New Version"
        size="xl"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setVersionModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handlePublishVersion} isLoading={publishVersion.isPending}>
              Publish Version
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Version"
              placeholder="1.0.0"
              value={versionForm.version}
              onChange={(e) => setVersionForm((f) => ({ ...f, version: e.target.value }))}
              error={versionErrors.version}
              hint="Semantic version (X.Y.Z)"
              required
            />
          </div>
          <Textarea
            label="Changelog"
            placeholder="What's new in this version..."
            value={versionForm.changelog}
            onChange={(e) => setVersionForm((f) => ({ ...f, changelog: e.target.value }))}
            rows={3}
          />
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
              PHP File Content <span className="text-danger-500">*</span>
            </label>
            <div className="relative">
              <Code2 size={14} className="absolute top-3 left-3 text-[var(--color-text-secondary)]" />
              <textarea
                value={versionForm.phpFileContent}
                onChange={(e) => setVersionForm((f) => ({ ...f, phpFileContent: e.target.value }))}
                className="w-full min-h-[320px] pl-8 pr-4 py-3 font-mono text-xs bg-gray-950 text-green-300 border border-gray-700 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-950"
                placeholder="<?php /* WordPress plugin code */"
                spellCheck={false}
              />
            </div>
            {versionErrors.phpFileContent && (
              <p className="mt-1 text-xs text-danger-600">{versionErrors.phpFileContent}</p>
            )}
          </div>
        </div>
      </Modal>

      {/* Edit Plugin Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Plugin"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setEditModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleEditSave} isLoading={updatePlugin.isPending}>Save Changes</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Plugin Name"
            value={editForm.name}
            onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <Textarea
            label="Description"
            value={editForm.description}
            onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
          />
        </div>
      </Modal>

      {/* Toggle Status Confirm */}
      <ConfirmDialog
        isOpen={toggleConfirmOpen}
        onClose={() => setToggleConfirmOpen(false)}
        onConfirm={handleToggleStatus}
        title={plugin.status === 'PUBLISHED' ? 'Unpublish Plugin' : 'Publish Plugin'}
        message={
          plugin.status === 'PUBLISHED'
            ? 'This will prevent WordPress sites from downloading new versions. Existing activations remain active.'
            : 'This will make the plugin available for download by WordPress sites.'
        }
        confirmLabel={plugin.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
        variant={plugin.status === 'PUBLISHED' ? 'warning' : 'info'}
      />
    </PageTransition>
  );
}
