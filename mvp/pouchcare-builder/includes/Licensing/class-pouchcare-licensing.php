<?php
if (!defined('ABSPATH')) {
    exit;
}

class PouchCare_Licensing
{
    private const OPTION_KEY = 'pouchcare_license';
    private const LICENSE_API = 'https://api.pouchcare.com/v1/licenses';

    private const PLANS = [
        'community' => [
            'label'         => 'Community',
            'maxWebsites'   => 1,
            'maxSeats'      => 1,
            'templates'     => ['free-starter'],
            'support'       => 'community',
            'updates'       => false,
            'customBlocks'  => false,
        ],
        'starter' => [
            'label'         => 'Starter',
            'maxWebsites'   => 3,
            'maxSeats'      => 5,
            'templates'     => ['free-starter', 'starter-pack'],
            'support'       => 'email',
            'updates'       => true,
            'customBlocks'  => false,
        ],
        'growth' => [
            'label'         => 'Growth',
            'maxWebsites'   => 10,
            'maxSeats'      => 25,
            'templates'     => ['free-starter', 'starter-pack', 'growth-pack'],
            'support'       => 'priority',
            'updates'       => true,
            'customBlocks'  => true,
        ],
        'agency' => [
            'label'         => 'Agency',
            'maxWebsites'   => 50,
            'maxSeats'      => 100,
            'templates'     => ['all'],
            'support'       => 'priority',
            'updates'       => true,
            'customBlocks'  => true,
        ],
        'enterprise' => [
            'label'         => 'Enterprise',
            'maxWebsites'   => -1, // unlimited
            'maxSeats'      => -1,
            'templates'     => ['all'],
            'support'       => 'dedicated',
            'updates'       => true,
            'customBlocks'  => true,
        ],
    ];

    public static function init(): void
    {
        if (!defined('POUCHCARE_LICENSE_CHANNEL')) {
            define('POUCHCARE_LICENSE_CHANNEL', 'community');
        }
        add_action('rest_api_init', [__CLASS__, 'register_endpoints']);
        add_action('admin_notices', [__CLASS__, 'license_admin_notice']);
    }

    public static function register_endpoints(): void
    {
        register_rest_route('pouchcare/v1', '/license', [
            [
                'methods'             => 'GET',
                'callback'            => [__CLASS__, 'get_license_info'],
                'permission_callback' => [PouchCare_Security::class, 'can_manage'],
            ],
            [
                'methods'             => 'POST',
                'callback'            => [__CLASS__, 'activate_license'],
                'permission_callback' => [PouchCare_Security::class, 'can_manage'],
            ],
            [
                'methods'             => 'DELETE',
                'callback'            => [__CLASS__, 'deactivate_license'],
                'permission_callback' => [PouchCare_Security::class, 'can_manage'],
            ],
        ]);
    }

    public static function get_license_info(\WP_REST_Request $request): \WP_REST_Response
    {
        $license = self::get_stored_license();
        $plan_key = $license['plan'] ?? POUCHCARE_LICENSE_CHANNEL;
        $plan = self::PLANS[$plan_key] ?? self::PLANS['community'];

        return rest_ensure_response([
            'key'       => $license['key'] ?? '',
            'plan'      => $plan_key,
            'planLabel' => $plan['label'],
            'status'    => $license['status'] ?? 'inactive',
            'expiresAt' => $license['expires_at'] ?? null,
            'limits'    => $plan,
            'channel'   => POUCHCARE_LICENSE_CHANNEL,
        ]);
    }

    public static function activate_license(\WP_REST_Request $request): \WP_REST_Response
    {
        $key = sanitize_text_field($request->get_param('key'));
        if (empty($key)) {
            return new \WP_REST_Response(['error' => 'License key is required.'], 400);
        }

        // For PC-XXXX format keys, verify against the PouchCare API
        if (strpos($key, 'PC-') === 0) {
            $api_base = defined('POUCHCARE_API_URL')
                ? rtrim(POUCHCARE_API_URL, '/')
                : 'https://api.pouchcare.com';

            $theme = wp_get_theme();
            $response = wp_remote_post("{$api_base}/licenses/activate", [
                'timeout' => 15,
                'headers' => ['Content-Type' => 'application/json'],
                'body'    => wp_json_encode([
                    'licenseKey'    => $key,
                    'siteUrl'       => home_url(),
                    'siteName'      => get_bloginfo('name'),
                    'wpVersion'     => get_bloginfo('version'),
                    'phpVersion'    => phpversion(),
                    'pluginVersion' => defined('POUCHCARE_BUILDER_VERSION') ? POUCHCARE_BUILDER_VERSION : '1.0.0',
                    'themeVersion'  => $theme->get('Version'),
                    'themeActive'   => str_contains(strtolower($theme->get('Name')), 'pouchcare'),
                ]),
            ]);

            if (is_wp_error($response)) {
                return new \WP_REST_Response(['error' => $response->get_error_message()], 500);
            }

            $status_code = wp_remote_retrieve_response_code($response);
            $body = json_decode(wp_remote_retrieve_body($response), true);

            if ($status_code < 200 || $status_code >= 300) {
                return new \WP_REST_Response([
                    'error' => $body['error'] ?? 'License activation failed.',
                ], $status_code);
            }

            // API returns the plan info — use it instead of guessing from key prefix
            $api_plan = strtolower($body['site']['plan'] ?? $body['plan'] ?? 'starter');
            // Map API plan names to our internal plan keys
            $plan_map = ['starter' => 'starter', 'growth' => 'growth', 'agency' => 'enterprise'];
            $plan = $plan_map[$api_plan] ?? 'starter';

            $license = [
                'key'          => $key,
                'plan'         => $plan,
                'status'       => 'active',
                'activated_at' => current_time('mysql'),
                'expires_at'   => $body['site']['expiresAt'] ?? gmdate('Y-m-d H:i:s', strtotime('+1 year')),
                'site_url'     => home_url(),
                'site_id'      => $body['site']['id'] ?? '',
            ];
        } else {
            // Legacy key format: pc_starter_xxx — local validation only
            $plan = self::detect_plan_from_key($key);
            $license = [
                'key'          => $key,
                'plan'         => $plan,
                'status'       => 'active',
                'activated_at' => current_time('mysql'),
                'expires_at'   => gmdate('Y-m-d H:i:s', strtotime('+1 year')),
                'site_url'     => home_url(),
            ];
        }

        update_option(self::OPTION_KEY, $license);

        return rest_ensure_response([
            'message' => 'License activated successfully.',
            'license' => $license,
            'limits'  => self::PLANS[$plan] ?? self::PLANS['community'],
        ]);
    }

    public static function deactivate_license(\WP_REST_Request $request): \WP_REST_Response
    {
        delete_option(self::OPTION_KEY);
        return rest_ensure_response(['message' => 'License deactivated.']);
    }

    public static function get_current_plan(): string
    {
        $license = self::get_stored_license();
        if (empty($license['status']) || $license['status'] !== 'active') {
            return POUCHCARE_LICENSE_CHANNEL;
        }
        if (!empty($license['expires_at']) && strtotime($license['expires_at']) < time()) {
            return POUCHCARE_LICENSE_CHANNEL;
        }
        return $license['plan'] ?? POUCHCARE_LICENSE_CHANNEL;
    }

    public static function get_plan_limits(): array
    {
        $plan = self::get_current_plan();
        return self::PLANS[$plan] ?? self::PLANS['community'];
    }

    public static function can_use_feature(string $feature): bool
    {
        $limits = self::get_plan_limits();
        return !empty($limits[$feature]);
    }

    public static function within_website_limit(int $current_count): bool
    {
        $limits = self::get_plan_limits();
        if ($limits['maxWebsites'] === -1) return true;
        return $current_count < $limits['maxWebsites'];
    }

    public static function license_admin_notice(): void
    {
        $plan = self::get_current_plan();
        if ($plan !== 'community') return;

        $screen = get_current_screen();
        if (!$screen || strpos($screen->id, 'pouchcare') === false) return;

        echo '<div class="notice notice-info is-dismissible">'
           . '<p>' . esc_html__('PouchCare is running on the Community plan. Upgrade for more websites, templates, and priority support.', 'pouchcare-builder') . '</p>'
           . '</div>';
    }

    private static function get_stored_license(): array
    {
        $license = get_option(self::OPTION_KEY, []);
        return is_array($license) ? $license : [];
    }

    private static function detect_plan_from_key(string $key): string
    {
        // Support both legacy (pc_starter_xxx) and new (PC-XXXX-XXXX-XXXX-XXXX) formats.
        // For new PC- format, plan is determined by the API during activation,
        // so we return 'starter' as default — the real plan gets stored from the API response.
        if (strpos($key, 'pc_enterprise') === 0) return 'enterprise';
        if (strpos($key, 'pc_growth') === 0) return 'growth';
        if (strpos($key, 'pc_starter') === 0) return 'starter';
        // New format: PC-XXXX-XXXX-XXXX-XXXX — plan comes from API response
        if (strpos($key, 'PC-') === 0) return 'starter'; // placeholder until API confirms
        return 'starter';
    }
}
