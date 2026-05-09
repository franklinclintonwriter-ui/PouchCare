<?php
/**
 * PouchCare Phone Home
 *
 * Handles license activation with the PouchCare API and sends
 * periodic heartbeat data so the platform knows this site is alive.
 *
 * Shares the 'pouchcare_license' option with PouchCare_Licensing
 * so both classes see the same license state.
 */
if (!defined('ABSPATH')) {
    exit;
}

class PouchCare_Phone_Home
{
    /**
     * Shared option with PouchCare_Licensing.
     * Stores: ['key','plan','status','activated_at','expires_at','site_url','site_id']
     */
    private const LICENSE_OPTION = 'pouchcare_license';

    /** Option key for phone-home specific activation data */
    private const ACTIVATION_OPTION = 'pouchcare_activation';

    /** Heartbeat cron hook name */
    private const HEARTBEAT_HOOK = 'pouchcare_heartbeat_cron';

    /** Heartbeat interval (12 hours) */
    private const HEARTBEAT_INTERVAL = 'twicedaily';

    /** @var string PouchCare API base URL */
    private string $api_base;

    public function __construct()
    {
        $this->api_base = defined('POUCHCARE_API_URL')
            ? rtrim(POUCHCARE_API_URL, '/')
            : 'https://api.pouchcare.com';

        add_action('init', [$this, 'schedule_heartbeat']);
        add_action(self::HEARTBEAT_HOOK, [$this, 'send_heartbeat']);
        add_action('admin_menu', [$this, 'add_license_page']);
        add_action('admin_init', [$this, 'register_settings']);
        register_activation_hook(POUCHCARE_BUILDER_FILE, [$this, 'on_plugin_activate']);
        register_deactivation_hook(POUCHCARE_BUILDER_FILE, [$this, 'on_plugin_deactivate']);
    }

    /**
     * Get the stored license key from the shared option.
     */
    private function get_license_key(): string
    {
        $license = get_option(self::LICENSE_OPTION, []);
        if (is_array($license) && !empty($license['key'])) {
            return $license['key'];
        }
        return '';
    }

    /**
     * Check if license is active (from shared option).
     */
    private function is_license_active(): bool
    {
        $license = get_option(self::LICENSE_OPTION, []);
        return is_array($license)
            && !empty($license['status'])
            && $license['status'] === 'active';
    }

    public function schedule_heartbeat(): void
    {
        if (!wp_next_scheduled(self::HEARTBEAT_HOOK)) {
            wp_schedule_event(time(), self::HEARTBEAT_INTERVAL, self::HEARTBEAT_HOOK);
        }
    }

    private function get_site_data(): array
    {
        $theme = wp_get_theme();
        $pouchcare_theme_active = (
            str_contains(strtolower($theme->get('Name')), 'pouchcare') ||
            str_contains(strtolower($theme->get_template()), 'pouchcare')
        );

        return [
            'siteUrl'        => home_url(),
            'siteName'       => get_bloginfo('name'),
            'wpVersion'      => get_bloginfo('version'),
            'phpVersion'     => phpversion(),
            'pluginVersion'  => defined('POUCHCARE_BUILDER_VERSION') ? POUCHCARE_BUILDER_VERSION : '1.0.0',
            'themeVersion'   => $theme->get('Version'),
            'themeActive'    => $pouchcare_theme_active,
            'pluginActive'   => true,
        ];
    }

    public function activate_license(string $license_key): array
    {
        $data = array_merge($this->get_site_data(), [
            'licenseKey' => $license_key,
        ]);

        $response = wp_remote_post("{$this->api_base}/licenses/activate", [
            'timeout' => 15,
            'headers' => ['Content-Type' => 'application/json'],
            'body'    => wp_json_encode($data),
        ]);

        if (is_wp_error($response)) {
            return ['success' => false, 'error' => $response->get_error_message()];
        }

        $status = wp_remote_retrieve_response_code($response);
        $body   = json_decode(wp_remote_retrieve_body($response), true);

        if ($status >= 200 && $status < 300) {
            // Determine plan from API response
            $api_plan = strtolower($body['site']['plan'] ?? $body['plan'] ?? 'starter');
            $plan_map = ['starter' => 'starter', 'growth' => 'growth', 'agency' => 'agency'];
            $plan = $plan_map[$api_plan] ?? 'starter';

            // Write to shared option (same as PouchCare_Licensing)
            update_option(self::LICENSE_OPTION, [
                'key'          => $license_key,
                'plan'         => $plan,
                'status'       => 'active',
                'activated_at' => current_time('mysql'),
                'expires_at'   => $body['site']['expiresAt'] ?? gmdate('Y-m-d H:i:s', strtotime('+1 year')),
                'site_url'     => home_url(),
                'site_id'      => $body['site']['id'] ?? '',
            ]);

            // Phone-home specific activation data
            update_option(self::ACTIVATION_OPTION, [
                'active'    => true,
                'site_id'   => $body['site']['id'] ?? '',
                'message'   => $body['message'] ?? 'Activated',
                'activated' => current_time('mysql'),
            ]);

            return ['success' => true, 'data' => $body];
        }

        return [
            'success' => false,
            'error'   => $body['error'] ?? 'Activation failed',
        ];
    }

    public function deactivate_license(): array
    {
        $license_key = $this->get_license_key();
        if (empty($license_key)) {
            return ['success' => false, 'error' => 'No license key found'];
        }

        $response = wp_remote_post("{$this->api_base}/licenses/deactivate", [
            'timeout' => 15,
            'headers' => ['Content-Type' => 'application/json'],
            'body'    => wp_json_encode([
                'licenseKey' => $license_key,
                'siteUrl'    => home_url(),
            ]),
        ]);

        if (is_wp_error($response)) {
            return ['success' => false, 'error' => $response->get_error_message()];
        }

        // Clear shared license option
        delete_option(self::LICENSE_OPTION);
        delete_option(self::ACTIVATION_OPTION);
        return ['success' => true];
    }

    public function send_heartbeat(): void
    {
        $license_key = $this->get_license_key();

        if (empty($license_key) || !$this->is_license_active()) {
            return;
        }

        $data = array_merge($this->get_site_data(), [
            'licenseKey' => $license_key,
        ]);

        wp_remote_post("{$this->api_base}/sites/heartbeat", [
            'timeout'  => 10,
            'blocking' => false,
            'headers'  => ['Content-Type' => 'application/json'],
            'body'     => wp_json_encode($data),
        ]);
    }

    public function on_plugin_activate(): void
    {
        $this->schedule_heartbeat();
        $license_key = $this->get_license_key();
        if (!empty($license_key)) {
            $this->activate_license($license_key);
        }
    }

    public function on_plugin_deactivate(): void
    {
        wp_clear_scheduled_hook(self::HEARTBEAT_HOOK);
        $this->deactivate_license();
    }

    // ─────────────── Admin Settings Page ───────────────

    public function add_license_page(): void
    {
        add_submenu_page(
            'pouchcare-builder',
            'License',
            'License',
            'manage_options',
            'pouchcare-license',
            [$this, 'render_license_page']
        );
    }

    public function register_settings(): void
    {
        register_setting('pouchcare_license_group', 'pouchcare_license_key_input', [
            'sanitize_callback' => 'sanitize_text_field',
        ]);
    }

    public function render_license_page(): void
    {
        $license_key = $this->get_license_key();
        $activation  = get_option(self::ACTIVATION_OPTION, []);
        $is_active   = !empty($activation['active']);
        $message     = '';

        if (isset($_POST['pouchcare_license_action']) && check_admin_referer('pouchcare_license_nonce')) {
            $action = sanitize_text_field($_POST['pouchcare_license_action']);

            if ($action === 'activate') {
                $key    = sanitize_text_field($_POST['pouchcare_license_key_input'] ?? '');
                $result = $this->activate_license($key);
                if ($result['success']) {
                    $message    = '<div class="notice notice-success"><p>License activated successfully!</p></div>';
                    $is_active  = true;
                    $license_key = $key;
                } else {
                    $message = '<div class="notice notice-error"><p>Activation failed: ' . esc_html($result['error']) . '</p></div>';
                }
            } elseif ($action === 'deactivate') {
                $result = $this->deactivate_license();
                if ($result['success']) {
                    $message   = '<div class="notice notice-warning"><p>License deactivated.</p></div>';
                    $is_active = false;
                    $license_key = '';
                }
            }
        }

        ?>
        <div class="wrap">
            <h1>PouchCare License</h1>
            <?php echo $message; ?>

            <div class="card" style="max-width: 600px; margin-top: 20px;">
                <form method="post">
                    <?php wp_nonce_field('pouchcare_license_nonce'); ?>

                    <table class="form-table">
                        <tr>
                            <th scope="row"><label for="license-key">License Key</label></th>
                            <td>
                                <input
                                    type="text"
                                    id="license-key"
                                    name="pouchcare_license_key_input"
                                    value="<?php echo esc_attr($license_key); ?>"
                                    class="regular-text"
                                    placeholder="PC-XXXX-XXXX-XXXX-XXXX"
                                    <?php echo $is_active ? 'readonly' : ''; ?>
                                />
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">Status</th>
                            <td>
                                <?php if ($is_active): ?>
                                    <span style="color: #00a32a; font-weight: 600;">&#10003; Active</span>
                                    <br><small>Activated: <?php echo esc_html($activation['activated'] ?? 'Unknown'); ?></small>
                                <?php else: ?>
                                    <span style="color: #d63638;">&#10007; Not activated</span>
                                <?php endif; ?>
                            </td>
                        </tr>
                    </table>

                    <?php if ($is_active): ?>
                        <input type="hidden" name="pouchcare_license_action" value="deactivate" />
                        <p class="submit">
                            <button type="submit" class="button button-secondary">Deactivate License</button>
                        </p>
                    <?php else: ?>
                        <input type="hidden" name="pouchcare_license_action" value="activate" />
                        <p class="submit">
                            <button type="submit" class="button button-primary">Activate License</button>
                        </p>
                    <?php endif; ?>
                </form>
            </div>
        </div>
        <?php
    }
}
