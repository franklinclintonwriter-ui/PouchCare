<?php
if (!defined('ABSPATH')) {
    exit;
}

class PouchCare_Customer_Api
{
    private const OPTION_PREFIX = 'pouchcare_customer_snapshot_';
    private const EVENTS_PREFIX = 'pouchcare_customer_events_';
    private const COMPANY_SCOPE_HEADER = 'X-PouchCare-Company-Id';

    public static function init(): void
    {
        add_action('rest_api_init', [self::class, 'register_routes']);
    }

    /**
     * Permission callback: any authenticated user.
     */
    public static function can_read(): bool
    {
        return current_user_can('read');
    }

    public static function register_routes(): void
    {
        // Customer Snapshot.
        register_rest_route('pouchcare/v1', '/customer/snapshot', [
            [
                'methods'             => 'GET',
                'callback'            => [self::class, 'get_snapshot'],
                'permission_callback' => [self::class, 'can_read'],
            ],
            [
                'methods'             => 'PUT',
                'callback'            => [self::class, 'put_snapshot'],
                'permission_callback' => [self::class, 'can_read'],
            ],
        ]);

        // Customer Events.
        register_rest_route('pouchcare/v1', '/customer/events', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'post_event'],
            'permission_callback' => [self::class, 'can_read'],
        ]);

        // Websites CRUD.
        register_rest_route('pouchcare/v1', '/customer/websites', [
            [
                'methods'             => 'GET',
                'callback'            => [self::class, 'list_websites'],
                'permission_callback' => [self::class, 'can_read'],
            ],
            [
                'methods'             => 'POST',
                'callback'            => [self::class, 'create_website'],
                'permission_callback' => [self::class, 'can_read'],
            ],
        ]);

        register_rest_route('pouchcare/v1', '/customer/websites/(?P<id>[\\w-]+)', [
            [
                'methods'             => 'GET',
                'callback'            => [self::class, 'get_website'],
                'permission_callback' => [self::class, 'can_read'],
            ],
            [
                'methods'             => 'PATCH',
                'callback'            => [self::class, 'update_website'],
                'permission_callback' => [self::class, 'can_read'],
            ],
            [
                'methods'             => 'DELETE',
                'callback'            => [self::class, 'delete_website'],
                'permission_callback' => [self::class, 'can_read'],
            ],
        ]);

        // Subscriptions CRUD.
        register_rest_route('pouchcare/v1', '/customer/subscriptions', [
            [
                'methods'             => 'GET',
                'callback'            => [self::class, 'list_subscriptions'],
                'permission_callback' => [self::class, 'can_read'],
            ],
            [
                'methods'             => 'POST',
                'callback'            => [self::class, 'create_subscription'],
                'permission_callback' => [self::class, 'can_read'],
            ],
        ]);

        register_rest_route('pouchcare/v1', '/customer/subscriptions/(?P<id>[\\w-]+)', [
            [
                'methods'             => 'GET',
                'callback'            => [self::class, 'get_subscription'],
                'permission_callback' => [self::class, 'can_read'],
            ],
            [
                'methods'             => 'PATCH',
                'callback'            => [self::class, 'update_subscription'],
                'permission_callback' => [self::class, 'can_read'],
            ],
            [
                'methods'             => 'DELETE',
                'callback'            => [self::class, 'delete_subscription'],
                'permission_callback' => [self::class, 'can_read'],
            ],
        ]);

        // Plugins CRUD.
        register_rest_route('pouchcare/v1', '/customer/plugins', [
            [
                'methods'             => 'GET',
                'callback'            => [self::class, 'list_plugins'],
                'permission_callback' => [self::class, 'can_read'],
            ],
            [
                'methods'             => 'POST',
                'callback'            => [self::class, 'create_plugin'],
                'permission_callback' => [self::class, 'can_read'],
            ],
        ]);

        register_rest_route('pouchcare/v1', '/customer/plugins/(?P<id>[\\w-]+)', [
            [
                'methods'             => 'GET',
                'callback'            => [self::class, 'get_plugin'],
                'permission_callback' => [self::class, 'can_read'],
            ],
            [
                'methods'             => 'PATCH',
                'callback'            => [self::class, 'update_plugin'],
                'permission_callback' => [self::class, 'can_read'],
            ],
            [
                'methods'             => 'DELETE',
                'callback'            => [self::class, 'delete_plugin'],
                'permission_callback' => [self::class, 'can_read'],
            ],
        ]);

        // Profile.
        register_rest_route('pouchcare/v1', '/customer/profile', [
            'methods'             => 'PATCH',
            'callback'            => [self::class, 'update_profile'],
            'permission_callback' => [self::class, 'can_read'],
        ]);

        // Settings.
        register_rest_route('pouchcare/v1', '/customer/settings', [
            'methods'             => 'PATCH',
            'callback'            => [self::class, 'update_settings'],
            'permission_callback' => [self::class, 'can_read'],
        ]);

        // API Keys CRUD.
        register_rest_route('pouchcare/v1', '/customer/api-keys', [
            [
                'methods'             => 'GET',
                'callback'            => [self::class, 'list_api_keys'],
                'permission_callback' => [self::class, 'can_read'],
            ],
            [
                'methods'             => 'POST',
                'callback'            => [self::class, 'create_api_key'],
                'permission_callback' => [self::class, 'can_read'],
            ],
        ]);

        register_rest_route('pouchcare/v1', '/customer/api-keys/(?P<id>[\\w-]+)', [
            'methods'             => 'DELETE',
            'callback'            => [self::class, 'delete_api_key'],
            'permission_callback' => [self::class, 'can_read'],
        ]);

        // Tickets CRUD.
        register_rest_route('pouchcare/v1', '/customer/tickets', [
            [
                'methods'             => 'GET',
                'callback'            => [self::class, 'list_tickets'],
                'permission_callback' => [self::class, 'can_read'],
            ],
            [
                'methods'             => 'POST',
                'callback'            => [self::class, 'create_ticket'],
                'permission_callback' => [self::class, 'can_read'],
            ],
        ]);

        register_rest_route('pouchcare/v1', '/customer/tickets/(?P<id>[\\w-]+)', [
            [
                'methods'             => 'GET',
                'callback'            => [self::class, 'get_ticket'],
                'permission_callback' => [self::class, 'can_read'],
            ],
            [
                'methods'             => 'PATCH',
                'callback'            => [self::class, 'update_ticket'],
                'permission_callback' => [self::class, 'can_read'],
            ],
            [
                'methods'             => 'DELETE',
                'callback'            => [self::class, 'delete_ticket'],
                'permission_callback' => [self::class, 'can_read'],
            ],
        ]);

        // Payment Methods CRUD.
        register_rest_route('pouchcare/v1', '/customer/payment-methods', [
            [
                'methods'             => 'GET',
                'callback'            => [self::class, 'list_payment_methods'],
                'permission_callback' => [self::class, 'can_read'],
            ],
            [
                'methods'             => 'POST',
                'callback'            => [self::class, 'create_payment_method'],
                'permission_callback' => [self::class, 'can_read'],
            ],
        ]);

        register_rest_route('pouchcare/v1', '/customer/payment-methods/(?P<id>[\\w-]+)', [
            'methods'             => 'DELETE',
            'callback'            => [self::class, 'delete_payment_method'],
            'permission_callback' => [self::class, 'can_read'],
        ]);

        // Invitations CRUD.
        register_rest_route('pouchcare/v1', '/customer/invitations', [
            [
                'methods'             => 'GET',
                'callback'            => [self::class, 'list_invitations'],
                'permission_callback' => [self::class, 'can_read'],
            ],
            [
                'methods'             => 'POST',
                'callback'            => [self::class, 'create_invitation'],
                'permission_callback' => [self::class, 'can_read'],
            ],
        ]);

        register_rest_route('pouchcare/v1', '/customer/invitations/(?P<id>[\\w-]+)', [
            [
                'methods'             => 'GET',
                'callback'            => [self::class, 'get_invitation'],
                'permission_callback' => [self::class, 'can_read'],
            ],
            [
                'methods'             => 'DELETE',
                'callback'            => [self::class, 'delete_invitation'],
                'permission_callback' => [self::class, 'can_read'],
            ],
        ]);
    }

    // -------------------------------------------------------------------------
    // Snapshot
    // -------------------------------------------------------------------------

    public static function get_snapshot(WP_REST_Request $request): WP_REST_Response
    {
        $user_id  = get_current_user_id();
        $snapshot = get_option(self::OPTION_PREFIX . $user_id, []);

        return rest_ensure_response($snapshot);
    }

    public static function put_snapshot(WP_REST_Request $request): WP_REST_Response
    {
        $body = $request->get_json_params();

        if (empty($body) || !is_array($body)) {
            return new WP_REST_Response(
                ['code' => 'invalid_body', 'message' => 'Request body must be a JSON object.'],
                400
            );
        }

        $user_id   = get_current_user_id();
        $sanitized = self::sanitize_recursive($body);
        update_option(self::OPTION_PREFIX . $user_id, $sanitized, false);

        return rest_ensure_response($sanitized);
    }

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    public static function post_event(WP_REST_Request $request): WP_REST_Response
    {
        $body = $request->get_json_params();

        if (empty($body) || !is_array($body)) {
            return new WP_REST_Response(
                ['code' => 'invalid_body', 'message' => 'Request body must be a JSON object.'],
                400
            );
        }

        $user_id = get_current_user_id();

        $event = [
            'id'        => wp_generate_uuid4(),
            'type'      => isset($body['type']) ? sanitize_text_field($body['type']) : 'unknown',
            'payload'   => isset($body['payload']) && is_array($body['payload'])
                ? self::sanitize_recursive($body['payload'])
                : [],
            'timestamp' => gmdate('c'),
            'user_id'   => $user_id,
        ];
        $company_scope = self::get_company_scope($request);
        if ($company_scope !== '') {
            $event['companyId'] = $company_scope;
        }

        $events = get_option(self::EVENTS_PREFIX . $user_id, []);
        if (!is_array($events)) {
            $events = [];
        }

        $events[] = $event;

        // Keep last 200 events per user.
        if (count($events) > 200) {
            $events = array_slice($events, -200);
        }

        update_option(self::EVENTS_PREFIX . $user_id, $events, false);

        return rest_ensure_response($event);
    }

    // -------------------------------------------------------------------------
    // Websites CRUD
    // -------------------------------------------------------------------------

    public static function list_websites(WP_REST_Request $request): WP_REST_Response
    {
        return rest_ensure_response(self::get_collection('websites', $request));
    }

    public static function get_website(WP_REST_Request $request): WP_REST_Response
    {
        return self::get_item('websites', $request);
    }

    public static function create_website(WP_REST_Request $request): WP_REST_Response
    {
        $body = $request->get_json_params();

        if (empty($body['name']) || empty($body['url'])) {
            return new WP_REST_Response(
                ['code' => 'missing_fields', 'message' => 'Name and url are required.'],
                400
            );
        }

        $item = self::sanitize_recursive($body);
        $item['url'] = esc_url_raw($body['url']);

        return self::create_item('websites', $item, $request);
    }

    public static function update_website(WP_REST_Request $request): WP_REST_Response
    {
        $body = $request->get_json_params();

        if (isset($body['url'])) {
            $body['url'] = esc_url_raw($body['url']);
            $request->set_body(wp_json_encode($body));
        }

        return self::update_item('websites', $request);
    }

    public static function delete_website(WP_REST_Request $request): WP_REST_Response
    {
        return self::delete_item('websites', $request);
    }

    // -------------------------------------------------------------------------
    // Subscriptions CRUD
    // -------------------------------------------------------------------------

    public static function list_subscriptions(WP_REST_Request $request): WP_REST_Response
    {
        return rest_ensure_response(self::get_collection('subscriptions', $request));
    }

    public static function get_subscription(WP_REST_Request $request): WP_REST_Response
    {
        return self::get_item('subscriptions', $request);
    }

    public static function create_subscription(WP_REST_Request $request): WP_REST_Response
    {
        $body = $request->get_json_params();

        if (empty($body['plan'])) {
            return new WP_REST_Response(
                ['code' => 'missing_fields', 'message' => 'Plan is required.'],
                400
            );
        }

        return self::create_item('subscriptions', self::sanitize_recursive($body), $request);
    }

    public static function update_subscription(WP_REST_Request $request): WP_REST_Response
    {
        return self::update_item('subscriptions', $request);
    }

    public static function delete_subscription(WP_REST_Request $request): WP_REST_Response
    {
        return self::delete_item('subscriptions', $request);
    }

    // -------------------------------------------------------------------------
    // Plugins CRUD
    // -------------------------------------------------------------------------

    public static function list_plugins(WP_REST_Request $request): WP_REST_Response
    {
        return rest_ensure_response(self::get_collection('plugins', $request));
    }

    public static function get_plugin(WP_REST_Request $request): WP_REST_Response
    {
        return self::get_item('plugins', $request);
    }

    public static function create_plugin(WP_REST_Request $request): WP_REST_Response
    {
        $body = $request->get_json_params();

        if (empty($body['name'])) {
            return new WP_REST_Response(
                ['code' => 'missing_fields', 'message' => 'Plugin name is required.'],
                400
            );
        }

        return self::create_item('plugins', self::sanitize_recursive($body), $request);
    }

    public static function update_plugin(WP_REST_Request $request): WP_REST_Response
    {
        return self::update_item('plugins', $request);
    }

    public static function delete_plugin(WP_REST_Request $request): WP_REST_Response
    {
        return self::delete_item('plugins', $request);
    }

    // -------------------------------------------------------------------------
    // Profile
    // -------------------------------------------------------------------------

    public static function update_profile(WP_REST_Request $request): WP_REST_Response
    {
        $body = $request->get_json_params();

        if (empty($body) || !is_array($body)) {
            return new WP_REST_Response(
                ['code' => 'invalid_body', 'message' => 'Request body must be a JSON object.'],
                400
            );
        }

        $user_id  = get_current_user_id();
        $snapshot = get_option(self::OPTION_PREFIX . $user_id, []);

        $sanitized = self::sanitize_recursive($body);

        if (isset($sanitized['email'])) {
            $sanitized['email'] = sanitize_email($body['email']);
        }

        $snapshot['profile'] = array_merge($snapshot['profile'] ?? [], $sanitized);
        $snapshot['profile']['updatedAt'] = gmdate('c');

        update_option(self::OPTION_PREFIX . $user_id, $snapshot, false);

        return rest_ensure_response($snapshot['profile']);
    }

    // -------------------------------------------------------------------------
    // Settings
    // -------------------------------------------------------------------------

    public static function update_settings(WP_REST_Request $request): WP_REST_Response
    {
        $body = $request->get_json_params();

        if (empty($body) || !is_array($body)) {
            return new WP_REST_Response(
                ['code' => 'invalid_body', 'message' => 'Request body must be a JSON object.'],
                400
            );
        }

        $user_id  = get_current_user_id();
        $snapshot = get_option(self::OPTION_PREFIX . $user_id, []);

        $sanitized = self::sanitize_recursive($body);

        $snapshot['settings'] = array_merge($snapshot['settings'] ?? [], $sanitized);
        $snapshot['settings']['updatedAt'] = gmdate('c');

        update_option(self::OPTION_PREFIX . $user_id, $snapshot, false);

        return rest_ensure_response($snapshot['settings']);
    }

    // -------------------------------------------------------------------------
    // API Keys CRUD
    // -------------------------------------------------------------------------

    public static function list_api_keys(WP_REST_Request $request): WP_REST_Response
    {
        return rest_ensure_response(self::get_collection('apiKeys', $request));
    }

    public static function create_api_key(WP_REST_Request $request): WP_REST_Response
    {
        $body = $request->get_json_params();

        if (empty($body['name'])) {
            return new WP_REST_Response(
                ['code' => 'missing_fields', 'message' => 'Key name is required.'],
                400
            );
        }

        $item = self::sanitize_recursive($body);

        // Generate a random key value.
        $item['key']       = 'pc_' . wp_generate_password(32, false);
        $item['prefix']    = substr($item['key'], 0, 8) . '...';
        $item['lastUsed']  = null;

        $response = self::create_item('apiKeys', $item, $request);

        return $response;
    }

    public static function delete_api_key(WP_REST_Request $request): WP_REST_Response
    {
        return self::delete_item('apiKeys', $request);
    }

    // -------------------------------------------------------------------------
    // Tickets CRUD
    // -------------------------------------------------------------------------

    public static function list_tickets(WP_REST_Request $request): WP_REST_Response
    {
        return rest_ensure_response(self::get_collection('tickets', $request));
    }

    public static function get_ticket(WP_REST_Request $request): WP_REST_Response
    {
        return self::get_item('tickets', $request);
    }

    public static function create_ticket(WP_REST_Request $request): WP_REST_Response
    {
        $body = $request->get_json_params();

        if (empty($body['subject'])) {
            return new WP_REST_Response(
                ['code' => 'missing_fields', 'message' => 'Subject is required.'],
                400
            );
        }

        $item = self::sanitize_recursive($body);
        $item['status']   = $item['status'] ?? 'open';
        $item['priority'] = $item['priority'] ?? 'normal';

        if (isset($body['description'])) {
            $item['description'] = sanitize_textarea_field($body['description']);
        }

        return self::create_item('tickets', $item, $request);
    }

    public static function update_ticket(WP_REST_Request $request): WP_REST_Response
    {
        return self::update_item('tickets', $request);
    }

    public static function delete_ticket(WP_REST_Request $request): WP_REST_Response
    {
        return self::delete_item('tickets', $request);
    }

    // -------------------------------------------------------------------------
    // Payment Methods CRUD
    // -------------------------------------------------------------------------

    public static function list_payment_methods(WP_REST_Request $request): WP_REST_Response
    {
        return rest_ensure_response(self::get_collection('paymentMethods', $request));
    }

    public static function create_payment_method(WP_REST_Request $request): WP_REST_Response
    {
        $body = $request->get_json_params();

        if (empty($body['type'])) {
            return new WP_REST_Response(
                ['code' => 'missing_fields', 'message' => 'Payment method type is required.'],
                400
            );
        }

        $item = self::sanitize_recursive($body);
        $item['isDefault'] = $item['isDefault'] ?? false;

        return self::create_item('paymentMethods', $item, $request);
    }

    public static function delete_payment_method(WP_REST_Request $request): WP_REST_Response
    {
        return self::delete_item('paymentMethods', $request);
    }

    // -------------------------------------------------------------------------
    // Invitations CRUD
    // -------------------------------------------------------------------------

    public static function list_invitations(WP_REST_Request $request): WP_REST_Response
    {
        return rest_ensure_response(self::get_collection('invitations', $request));
    }

    public static function get_invitation(WP_REST_Request $request): WP_REST_Response
    {
        return self::get_item('invitations', $request);
    }

    public static function create_invitation(WP_REST_Request $request): WP_REST_Response
    {
        $body = $request->get_json_params();

        if (empty($body['email'])) {
            return new WP_REST_Response(
                ['code' => 'missing_fields', 'message' => 'Invitation email is required.'],
                400
            );
        }

        $item = self::sanitize_recursive($body);
        $item['email'] = sanitize_email($body['email']);
        $item['role'] = $item['role'] ?? 'member';
        $item['status'] = $item['status'] ?? 'pending';
        $item['invitedByUserId'] = get_current_user_id();

        return self::create_item('invitations', $item, $request);
    }

    public static function delete_invitation(WP_REST_Request $request): WP_REST_Response
    {
        return self::delete_item('invitations', $request);
    }

    // -------------------------------------------------------------------------
    // Generic CRUD helpers (per-user snapshot)
    // -------------------------------------------------------------------------

    private static function get_collection(string $key, ?WP_REST_Request $request = null): array
    {
        $user_id  = get_current_user_id();
        $snapshot = get_option(self::OPTION_PREFIX . $user_id, []);
        $items = isset($snapshot[$key]) && is_array($snapshot[$key]) ? array_values($snapshot[$key]) : [];
        $company_scope = self::get_company_scope($request);

        if ($company_scope === '') {
            return $items;
        }

        $filtered = [];
        foreach ($items as $item) {
            if (self::is_item_in_scope($item, $company_scope)) {
                $filtered[] = $item;
            }
        }

        return array_values($filtered);
    }

    private static function get_item(string $key, WP_REST_Request $request): WP_REST_Response
    {
        $id = sanitize_text_field($request->get_param('id'));
        $user_id = get_current_user_id();
        $snapshot = get_option(self::OPTION_PREFIX . $user_id, []);
        $items = isset($snapshot[$key]) && is_array($snapshot[$key]) ? $snapshot[$key] : [];
        $company_scope = self::get_company_scope($request);
        $index = self::find_item_index($items, $id, $company_scope);

        if ($index !== null) {
            return rest_ensure_response($items[$index]);
        }

        return new WP_REST_Response(
            ['code' => 'not_found', 'message' => ucfirst($key) . ' item not found.'],
            404
        );
    }

    private static function create_item(string $key, array $item, ?WP_REST_Request $request = null): WP_REST_Response
    {
        $user_id  = get_current_user_id();
        $snapshot = get_option(self::OPTION_PREFIX . $user_id, []);
        $company_scope = self::get_company_scope($request);

        if (!isset($snapshot[$key]) || !is_array($snapshot[$key])) {
            $snapshot[$key] = [];
        }

        if ($company_scope !== '') {
            $item['companyId'] = $company_scope;
        }

        $item['id']        = $item['id'] ?? wp_generate_uuid4();
        $item['createdAt'] = gmdate('c');
        $item['updatedAt'] = gmdate('c');

        $snapshot[$key][] = $item;
        update_option(self::OPTION_PREFIX . $user_id, $snapshot, false);

        return new WP_REST_Response($item, 201);
    }

    private static function update_item(string $key, WP_REST_Request $request): WP_REST_Response
    {
        $id   = sanitize_text_field($request->get_param('id'));
        $body = $request->get_json_params();

        if (empty($body) || !is_array($body)) {
            return new WP_REST_Response(
                ['code' => 'invalid_body', 'message' => 'Request body must be a JSON object.'],
                400
            );
        }

        $user_id  = get_current_user_id();
        $snapshot = get_option(self::OPTION_PREFIX . $user_id, []);
        $items    = $snapshot[$key] ?? [];
        $company_scope = self::get_company_scope($request);
        $index = self::find_item_index($items, $id, $company_scope);

        if ($index === null) {
            return new WP_REST_Response(
                ['code' => 'not_found', 'message' => ucfirst($key) . ' item not found.'],
                404
            );
        }

        $sanitized = self::sanitize_recursive($body);
        unset($sanitized['id']);
        unset($sanitized['createdAt']);

        if ($company_scope !== '') {
            $sanitized['companyId'] = $company_scope;
        }

        $snapshot[$key][$index] = array_merge($snapshot[$key][$index], $sanitized);
        $snapshot[$key][$index]['updatedAt'] = gmdate('c');

        update_option(self::OPTION_PREFIX . $user_id, $snapshot, false);

        return rest_ensure_response($snapshot[$key][$index]);
    }

    private static function delete_item(string $key, WP_REST_Request $request): WP_REST_Response
    {
        $id      = sanitize_text_field($request->get_param('id'));
        $user_id = get_current_user_id();

        $snapshot = get_option(self::OPTION_PREFIX . $user_id, []);
        $items    = $snapshot[$key] ?? [];
        $company_scope = self::get_company_scope($request);
        $index = self::find_item_index($items, $id, $company_scope);

        if ($index === null) {
            return new WP_REST_Response(
                ['code' => 'not_found', 'message' => ucfirst($key) . ' item not found.'],
                404
            );
        }

        array_splice($snapshot[$key], $index, 1);
        update_option(self::OPTION_PREFIX . $user_id, $snapshot, false);

        return new WP_REST_Response(null, 204);
    }

    private static function get_company_scope(?WP_REST_Request $request = null): string
    {
        if ($request === null) {
            return '';
        }

        return sanitize_text_field((string) $request->get_header(self::COMPANY_SCOPE_HEADER));
    }

    private static function is_item_in_scope($item, string $company_scope): bool
    {
        if ($company_scope === '') {
            return true;
        }

        if (!is_array($item)) {
            return false;
        }

        return isset($item['companyId']) && sanitize_text_field((string) $item['companyId']) === $company_scope;
    }

    private static function find_item_index(array $items, string $id, string $company_scope = ''): ?int
    {
        foreach ($items as $i => $item) {
            if (!is_array($item)) {
                continue;
            }

            $item_id = isset($item['id']) ? sanitize_text_field((string) $item['id']) : '';
            if ($item_id !== $id) {
                continue;
            }

            if (!self::is_item_in_scope($item, $company_scope)) {
                continue;
            }

            return $i;
        }

        return null;
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Recursively sanitize an array of data.
     *
     * @param array $data Raw data.
     * @return array Sanitized data.
     */
    private static function sanitize_recursive(array $data): array
    {
        $clean = [];

        foreach ($data as $key => $value) {
            $key = sanitize_text_field($key);

            if (is_array($value)) {
                $clean[$key] = self::sanitize_recursive($value);
            } elseif (is_bool($value)) {
                $clean[$key] = $value;
            } elseif (is_int($value)) {
                $clean[$key] = intval($value);
            } elseif (is_float($value)) {
                $clean[$key] = floatval($value);
            } elseif (is_null($value)) {
                $clean[$key] = null;
            } else {
                $clean[$key] = sanitize_text_field((string) $value);
            }
        }

        return $clean;
    }
}
