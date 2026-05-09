<?php
if (!defined('ABSPATH')) {
    exit;
}

/**
 * PouchCare Auth Bridge
 * Bridges WordPress authentication with the React SPA frontend.
 */
class PouchCare_Auth {

    private const ROLE_MAP = [
        'administrator' => 'owner',
        'editor'        => 'editor',
        'author'        => 'editor',
        'contributor'   => 'support',
        'subscriber'    => 'customer',
    ];

    /**
     * Permission sets per PouchCare role.
     * Must stay in sync with portal/shared/auth/permissions.js.
     */
    private const ROLE_PERMISSIONS = [
        'owner' => [
            'manage_companies', 'manage_team', 'manage_billing', 'manage_templates',
            'manage_pages', 'manage_media', 'manage_seo', 'manage_leads',
            'manage_settings', 'manage_projects', 'view_analytics', 'view_system_status',
            'manage_marketplace', 'manage_websites', 'manage_subscriptions',
            'manage_plugins', 'manage_tickets', 'manage_api_keys', 'manage_profile',
            'view_dashboard',
        ],
        'admin' => [
            'manage_companies', 'manage_team', 'manage_billing', 'manage_templates',
            'manage_pages', 'manage_media', 'manage_seo', 'manage_leads',
            'manage_projects', 'view_analytics', 'view_system_status',
            'manage_marketplace', 'manage_websites', 'manage_subscriptions',
            'manage_plugins', 'manage_tickets', 'manage_api_keys', 'manage_profile',
            'view_dashboard',
        ],
        'support' => [
            'view_dashboard', 'manage_tickets', 'manage_leads',
        ],
        'finance' => [
            'view_dashboard', 'manage_billing', 'view_analytics',
        ],
        'editor' => [
            'manage_templates', 'manage_pages', 'manage_media', 'manage_seo',
            'view_dashboard',
        ],
        'customer' => [
            'manage_websites', 'manage_subscriptions', 'manage_plugins',
            'manage_tickets', 'manage_api_keys', 'manage_profile', 'view_dashboard',
        ],
    ];

    private const NONCE_ACTION = 'pouchcare_rest';
    private const NONCE_LIFETIME = 24 * HOUR_IN_SECONDS;

    public static function init(): void {
        add_action('admin_enqueue_scripts', [__CLASS__, 'inject_admin_auth_globals']);
        add_action('wp_enqueue_scripts', [__CLASS__, 'inject_frontend_auth_globals']);
        add_filter('rest_authentication_errors', [__CLASS__, 'validate_pouchcare_token'], 99);
        add_action('rest_api_init', [__CLASS__, 'register_auth_endpoints']);
    }

    /**
     * Inject auth globals into WP admin pages for the React SPA.
     */
    public static function inject_admin_auth_globals(): void {
        if (!is_user_logged_in()) return;

        $user = wp_get_current_user();
        $nonce = wp_create_nonce(self::NONCE_ACTION);
        $pouchcare_role = self::map_wp_role($user);

        $auth_data = [
            'token'    => $nonce,
            'csrfToken'=> $nonce,
            'user'     => [
                'id'          => 'u_' . $user->ID,
                'name'        => $user->display_name,
                'email'       => $user->user_email,
                'role'        => $pouchcare_role,
                'org'         => get_bloginfo('name'),
                'portal'      => 'admin',
                'wpUserId'    => $user->ID,
                'permissions' => self::get_role_permissions($pouchcare_role),
            ],
            'apiBase'  => esc_url_raw(rest_url('pouchcare/v1')),
        ];

        wp_add_inline_script(
            'pouchcare-admin',
            'window.__POUCHCARE_ADMIN_TOKEN__=' . wp_json_encode($nonce) . ';'
            . 'window.__POUCHCARE_CSRF_TOKEN__=' . wp_json_encode($nonce) . ';'
            . 'window.__POUCHCARE_ADMIN_USER__=' . wp_json_encode($auth_data['user']) . ';'
            . 'window.__POUCHCARE_ADMIN_API_BASE__=' . wp_json_encode($auth_data['apiBase']) . ';',
            'before'
        );
    }

    /**
     * Inject auth globals for customer-facing frontend pages.
     */
    public static function inject_frontend_auth_globals(): void {
        if (!is_user_logged_in()) return;

        $user = wp_get_current_user();
        $nonce = wp_create_nonce(self::NONCE_ACTION);
        $plan = get_user_meta($user->ID, 'pouchcare_plan', true) ?: 'Starter';

        $auth_data = [
            'token' => $nonce,
            'user'  => [
                'id'          => 'c_' . $user->ID,
                'name'        => $user->display_name,
                'email'       => $user->user_email,
                'plan'        => $plan,
                'status'      => 'active',
                'portal'      => 'customer',
                'wpUserId'    => $user->ID,
                'permissions' => self::get_role_permissions('customer'),
            ],
            'apiBase' => esc_url_raw(rest_url('pouchcare/v1')),
        ];

        wp_add_inline_script(
            'pouchcare-theme',
            'window.__POUCHCARE_CUSTOMER_TOKEN__=' . wp_json_encode($nonce) . ';'
            . 'window.__POUCHCARE_CSRF_TOKEN__=' . wp_json_encode($nonce) . ';'
            . 'window.__POUCHCARE_CUSTOMER_USER__=' . wp_json_encode($auth_data['user']) . ';'
            . 'window.__POUCHCARE_CUSTOMER_API_BASE__=' . wp_json_encode($auth_data['apiBase']) . ';',
            'before'
        );
    }

    /**
     * Validate PouchCare token on REST API requests.
     */
    public static function validate_pouchcare_token($result) {
        // If already authenticated by WP cookie, allow
        if (is_user_logged_in()) return $result;

        // Check for Bearer token in Authorization header
        $auth_header = self::get_authorization_header();
        if (!$auth_header) return $result;

        if (0 !== strpos($auth_header, 'Bearer ')) return $result;

        $token = substr($auth_header, 7);

        // Verify as WP nonce
        $nonce_valid = wp_verify_nonce($token, self::NONCE_ACTION);
        if (!$nonce_valid) {
            return new \WP_Error(
                'pouchcare_invalid_token',
                __('Invalid or expired authentication token.', 'pouchcare-builder'),
                ['status' => 401]
            );
        }

        return $result;
    }

    /**
     * Register auth-related REST endpoints.
     */
    public static function register_auth_endpoints(): void {
        register_rest_route('pouchcare/v1', '/auth/me', [
            'methods'  => 'GET',
            'callback' => [__CLASS__, 'get_current_user'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route('pouchcare/v1', '/auth/refresh', [
            'methods'  => 'POST',
            'callback' => [__CLASS__, 'refresh_token'],
            'permission_callback' => function() { return is_user_logged_in(); },
        ]);
    }

    /**
     * GET /pouchcare/v1/auth/me — return current user info or 401.
     */
    public static function get_current_user(\WP_REST_Request $request): \WP_REST_Response {
        if (!is_user_logged_in()) {
            return new \WP_REST_Response(['authenticated' => false], 401);
        }

        $user = wp_get_current_user();
        $role = self::map_wp_role($user);
        $plan = get_user_meta($user->ID, 'pouchcare_plan', true) ?: 'Starter';

        return rest_ensure_response([
            'authenticated' => true,
            'user' => [
                'id'          => ($role === 'customer' ? 'c_' : 'u_') . $user->ID,
                'name'        => $user->display_name,
                'email'       => $user->user_email,
                'role'        => $role,
                'plan'        => $plan,
                'org'         => get_bloginfo('name'),
                'portal'      => in_array($role, ['owner', 'admin', 'editor', 'support', 'finance']) ? 'admin' : 'customer',
                'wpUserId'    => $user->ID,
                'permissions' => self::get_role_permissions($role),
            ],
        ]);
    }

    /**
     * POST /pouchcare/v1/auth/refresh — issue a fresh nonce.
     */
    public static function refresh_token(\WP_REST_Request $request): \WP_REST_Response {
        $nonce = wp_create_nonce(self::NONCE_ACTION);
        return rest_ensure_response(['token' => $nonce]);
    }

    /**
     * Return the permissions array for a PouchCare role.
     *
     * @param string $role A PouchCare role key (owner, admin, etc.)
     * @return string[] Permission strings granted to the role.
     */
    public static function get_role_permissions(string $role): array {
        return self::ROLE_PERMISSIONS[$role] ?? self::ROLE_PERMISSIONS['customer'];
    }

    /**
     * Map a WP user's role to a PouchCare role.
     */
    public static function map_wp_role(\WP_User $user): string {
        foreach (self::ROLE_MAP as $wp_role => $pouchcare_role) {
            if (in_array($wp_role, $user->roles, true)) {
                return $pouchcare_role;
            }
        }
        return 'customer';
    }

    /**
     * Get the Authorization header from the request.
     */
    private static function get_authorization_header(): string {
        $headers = '';
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $headers = $_SERVER['HTTP_AUTHORIZATION'];
        } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $headers = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        } elseif (function_exists('apache_request_headers')) {
            $apache = apache_request_headers();
            $headers = $apache['Authorization'] ?? '';
        }
        return is_string($headers) ? trim($headers) : '';
    }
}
