<?php
if (!defined('ABSPATH')) {
    exit;
}

class PouchCare_Security
{
    /** Transient prefix for rate limiting */
    private const RATE_LIMIT_PREFIX = 'pouchcare_rl_';

    public static function init(): void
    {
        // Enforce REST API nonce verification for authenticated endpoints
        add_filter('rest_pre_dispatch', [__CLASS__, 'enforce_rest_nonce'], 10, 3);

        // Add security headers
        add_action('send_headers', [__CLASS__, 'add_security_headers']);

        // Sanitize all PouchCare REST inputs
        add_filter('rest_pre_dispatch', [__CLASS__, 'sanitize_rest_input'], 5, 3);
    }

    /**
     * Permission callback — does current user have manage_options capability?
     */
    public static function can_manage(): bool
    {
        return current_user_can('manage_options');
    }

    /**
     * Permission callback — is user at least an editor?
     */
    public static function can_edit(): bool
    {
        return current_user_can('edit_posts');
    }

    /**
     * Enforce WP nonce on authenticated PouchCare REST endpoints.
     * Skips public endpoints like heartbeat and license activation.
     */
    public static function enforce_rest_nonce($result, \WP_REST_Server $server, \WP_REST_Request $request)
    {
        $route = $request->get_route();

        // Only apply to pouchcare endpoints
        if (strpos($route, '/pouchcare/') !== 0) {
            return $result;
        }

        // Skip public endpoints (no auth required)
        $public_routes = [
            '/pouchcare/v1/license/activate',
            '/pouchcare/v1/license/heartbeat',
            '/pouchcare/v1/templates',
            '/pouchcare/v1/blocks',
        ];

        foreach ($public_routes as $public_route) {
            if (strpos($route, $public_route) === 0 && $request->get_method() === 'GET') {
                return $result;
            }
        }

        // For write operations from authenticated users, verify nonce
        if (in_array($request->get_method(), ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
            if (is_user_logged_in() && !wp_verify_nonce($request->get_header('X-WP-Nonce'), 'wp_rest')) {
                // Allow only valid Bearer or Basic auth to bypass nonce.
                // A garbage Authorization header does NOT bypass the check.
                $auth_header = $request->get_header('Authorization');
                $has_valid_auth = false;

                if (!empty($auth_header)) {
                    // Only skip nonce for real auth schemes (Bearer token or Basic auth)
                    $has_valid_auth = (
                        preg_match('/^Bearer\s+[A-Za-z0-9\-._~+\/]+=*$/i', $auth_header) ||
                        preg_match('/^Basic\s+[A-Za-z0-9+\/]+=*$/i', $auth_header)
                    );
                }

                if (!$has_valid_auth) {
                    return new \WP_Error(
                        'rest_cookie_invalid_nonce',
                        __('Cookie nonce is invalid.', 'pouchcare-builder'),
                        ['status' => 403]
                    );
                }
            }
        }

        return $result;
    }

    /**
     * Add security headers to all responses.
     */
    public static function add_security_headers(): void
    {
        if (is_admin() || self::is_pouchcare_rest_request()) {
            header('X-Content-Type-Options: nosniff');
            header('X-Frame-Options: SAMEORIGIN');
            header('Referrer-Policy: strict-origin-when-cross-origin');
        }
    }

    /**
     * Basic sanitization of REST input for PouchCare routes.
     */
    public static function sanitize_rest_input($result, \WP_REST_Server $server, \WP_REST_Request $request)
    {
        $route = $request->get_route();
        if (strpos($route, '/pouchcare/') !== 0) {
            return $result;
        }

        // Enforce JSON content type for write operations
        if (in_array($request->get_method(), ['POST', 'PUT', 'PATCH'], true)) {
            $content_type = $request->get_content_type();
            if ($content_type && !empty($content_type['value'])) {
                // Allow JSON and form-encoded
                $allowed = ['application/json', 'application/x-www-form-urlencoded', 'multipart/form-data'];
                if (!in_array($content_type['value'], $allowed, true)) {
                    return new \WP_Error(
                        'rest_invalid_content_type',
                        __('Invalid content type.', 'pouchcare-builder'),
                        ['status' => 415]
                    );
                }
            }
        }

        return $result;
    }

    /**
     * IP-based rate limiting for REST endpoints.
     * @param string $action   Identifier for the action being limited
     * @param int    $max      Max attempts in the window
     * @param int    $window   Window in seconds (default 15 minutes)
     * @return bool|\WP_Error  True if allowed, WP_Error if rate limited
     */
    public static function check_rate_limit(string $action, int $max = 20, int $window = 900)
    {
        $ip = self::get_client_ip();
        $key = self::RATE_LIMIT_PREFIX . md5($action . '_' . $ip);

        $attempts = (int) get_transient($key);

        if ($attempts >= $max) {
            return new \WP_Error(
                'rate_limit_exceeded',
                sprintf(
                    __('Too many %s attempts. Please try again later.', 'pouchcare-builder'),
                    $action
                ),
                ['status' => 429]
            );
        }

        set_transient($key, $attempts + 1, $window);
        return true;
    }

    /**
     * Generate a CSRF token for admin forms (non-REST).
     */
    public static function csrf_field(string $action = 'pouchcare_action'): string
    {
        return wp_nonce_field($action, '_pouchcare_nonce', true, false);
    }

    /**
     * Verify CSRF token from admin form submission.
     */
    public static function verify_csrf(string $action = 'pouchcare_action'): bool
    {
        return isset($_POST['_pouchcare_nonce']) && wp_verify_nonce($_POST['_pouchcare_nonce'], $action);
    }

    /**
     * Get the client IP address, accounting for proxies.
     */
    private static function get_client_ip(): string
    {
        $headers = ['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR'];
        foreach ($headers as $header) {
            if (!empty($_SERVER[$header])) {
                $ips = explode(',', $_SERVER[$header]);
                $ip = trim($ips[0]);
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }
        return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    }

    /**
     * Check if current request is a PouchCare REST API request.
     */
    private static function is_pouchcare_rest_request(): bool
    {
        if (!defined('REST_REQUEST') || !REST_REQUEST) {
            return false;
        }
        $uri = $_SERVER['REQUEST_URI'] ?? '';
        return strpos($uri, '/pouchcare/') !== false;
    }
}
