<?php
if (!defined('ABSPATH')) {
    exit;
}

class PouchCare_Admin_Api
{
    private const OPTION_KEY = 'pouchcare_admin_snapshot';
    private const EVENTS_KEY = 'pouchcare_admin_events';
    /** Saved Style Manager payload (flat token map); consumed by the theme as CSS variables. */
    private const DESIGN_TOKENS_OPTION = 'pouchcare_design_tokens';

    public static function init(): void
    {
        add_action('rest_api_init', [self::class, 'register_routes']);
    }

    public static function register_routes(): void
    {
        // Snapshot endpoints.
        register_rest_route('pouchcare/v1', '/admin/snapshot', [
            [
                'methods'             => 'GET',
                'callback'            => [self::class, 'get_snapshot'],
                'permission_callback' => [PouchCare_Security::class, 'can_manage'],
            ],
            [
                'methods'             => 'PUT',
                'callback'            => [self::class, 'put_snapshot'],
                'permission_callback' => [PouchCare_Security::class, 'can_manage'],
            ],
        ]);

        register_rest_route('pouchcare/v1', '/admin/design-tokens', [
            [
                'methods'             => 'GET',
                'callback'            => [self::class, 'get_design_tokens'],
                'permission_callback' => [PouchCare_Security::class, 'can_manage'],
            ],
            [
                'methods'             => 'PUT',
                'callback'            => [self::class, 'put_design_tokens'],
                'permission_callback' => [PouchCare_Security::class, 'can_manage'],
            ],
            [
                'methods'             => 'DELETE',
                'callback'            => [self::class, 'delete_design_tokens'],
                'permission_callback' => [PouchCare_Security::class, 'can_manage'],
            ],
        ]);

        // Events endpoint.
        register_rest_route('pouchcare/v1', '/admin/events', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'post_event'],
            'permission_callback' => [PouchCare_Security::class, 'can_manage'],
        ]);

        // Companies CRUD.
        register_rest_route('pouchcare/v1', '/admin/companies', [
            [
                'methods'             => 'GET',
                'callback'            => [self::class, 'list_companies'],
                'permission_callback' => [PouchCare_Security::class, 'can_manage'],
            ],
            [
                'methods'             => 'POST',
                'callback'            => [self::class, 'create_company'],
                'permission_callback' => [PouchCare_Security::class, 'can_manage'],
            ],
        ]);

        register_rest_route('pouchcare/v1', '/admin/companies/(?P<id>[\\w-]+)', [
            [
                'methods'             => 'GET',
                'callback'            => [self::class, 'get_company'],
                'permission_callback' => [PouchCare_Security::class, 'can_manage'],
            ],
            [
                'methods'             => 'PATCH',
                'callback'            => [self::class, 'update_company'],
                'permission_callback' => [PouchCare_Security::class, 'can_manage'],
            ],
            [
                'methods'             => 'DELETE',
                'callback'            => [self::class, 'delete_company'],
                'permission_callback' => [PouchCare_Security::class, 'can_manage'],
            ],
        ]);

        register_rest_route('pouchcare/v1', '/admin/companies/(?P<id>[\\w-]+)/suspend', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'suspend_company'],
            'permission_callback' => [PouchCare_Security::class, 'can_manage'],
        ]);

        register_rest_route('pouchcare/v1', '/admin/companies/(?P<id>[\\w-]+)/activate', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'activate_company'],
            'permission_callback' => [PouchCare_Security::class, 'can_manage'],
        ]);

        register_rest_route('pouchcare/v1', '/admin/companies/(?P<id>[\\w-]+)/usage-limits', [
            'methods'             => 'PATCH',
            'callback'            => [self::class, 'update_usage_limits'],
            'permission_callback' => [PouchCare_Security::class, 'can_manage'],
        ]);

        // Company Notes.
        register_rest_route('pouchcare/v1', '/admin/companies/(?P<id>[\\w-]+)/notes', [
            [
                'methods'             => 'POST',
                'callback'            => [self::class, 'add_note'],
                'permission_callback' => [PouchCare_Security::class, 'can_manage'],
            ],
        ]);

        register_rest_route('pouchcare/v1', '/admin/companies/(?P<id>[\\w-]+)/notes/(?P<note_id>[\\w-]+)', [
            [
                'methods'             => 'PATCH',
                'callback'            => [self::class, 'update_note'],
                'permission_callback' => [PouchCare_Security::class, 'can_manage'],
            ],
            [
                'methods'             => 'DELETE',
                'callback'            => [self::class, 'delete_note'],
                'permission_callback' => [PouchCare_Security::class, 'can_manage'],
            ],
        ]);

        // Team Members CRUD.
        register_rest_route('pouchcare/v1', '/admin/team-members', [
            [
                'methods'             => 'GET',
                'callback'            => [self::class, 'list_team_members'],
                'permission_callback' => [PouchCare_Security::class, 'can_manage'],
            ],
            [
                'methods'             => 'POST',
                'callback'            => [self::class, 'create_team_member'],
                'permission_callback' => [PouchCare_Security::class, 'can_manage'],
            ],
        ]);

        register_rest_route('pouchcare/v1', '/admin/team-members/(?P<id>[\\w-]+)', [
            [
                'methods'             => 'PATCH',
                'callback'            => [self::class, 'update_team_member'],
                'permission_callback' => [PouchCare_Security::class, 'can_manage'],
            ],
            [
                'methods'             => 'DELETE',
                'callback'            => [self::class, 'delete_team_member'],
                'permission_callback' => [PouchCare_Security::class, 'can_manage'],
            ],
        ]);

        // Billing Records CRUD.
        register_rest_route('pouchcare/v1', '/admin/billing-records', [
            [
                'methods'             => 'GET',
                'callback'            => [self::class, 'list_billing_records'],
                'permission_callback' => [PouchCare_Security::class, 'can_manage'],
            ],
            [
                'methods'             => 'POST',
                'callback'            => [self::class, 'create_billing_record'],
                'permission_callback' => [PouchCare_Security::class, 'can_manage'],
            ],
        ]);

        register_rest_route('pouchcare/v1', '/admin/billing-records/(?P<id>[\\w-]+)', [
            [
                'methods'             => 'PATCH',
                'callback'            => [self::class, 'update_billing_record'],
                'permission_callback' => [PouchCare_Security::class, 'can_manage'],
            ],
            [
                'methods'             => 'DELETE',
                'callback'            => [self::class, 'delete_billing_record'],
                'permission_callback' => [PouchCare_Security::class, 'can_manage'],
            ],
        ]);
    }

    // -------------------------------------------------------------------------
    // Snapshot
    // -------------------------------------------------------------------------

    public static function get_snapshot(WP_REST_Request $request): WP_REST_Response
    {
        $snapshot = get_option(self::OPTION_KEY, []);

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

        $sanitized = self::sanitize_recursive($body);
        update_option(self::OPTION_KEY, $sanitized, false);

        return rest_ensure_response($sanitized);
    }

    public static function get_design_tokens(WP_REST_Request $request): WP_REST_Response
    {
        $raw = get_option(self::DESIGN_TOKENS_OPTION, null);
        $tokens = is_array($raw) ? $raw : null;

        return rest_ensure_response(['tokens' => $tokens]);
    }

    public static function put_design_tokens(WP_REST_Request $request): WP_REST_Response
    {
        $body = $request->get_json_params();
        if (!is_array($body) || empty($body['tokens']) || !is_array($body['tokens'])) {
            return new WP_REST_Response(
                ['code' => 'invalid_body', 'message' => 'Expected JSON object with a "tokens" object.'],
                400
            );
        }

        $sanitized = self::sanitize_design_tokens($body['tokens']);
        if (is_wp_error($sanitized)) {
            return new WP_REST_Response(
                ['code' => 'invalid_tokens', 'message' => $sanitized->get_error_message()],
                400
            );
        }

        update_option(self::DESIGN_TOKENS_OPTION, $sanitized, false);

        return rest_ensure_response(['ok' => true]);
    }

    public static function delete_design_tokens(WP_REST_Request $request): WP_REST_Response
    {
        delete_option(self::DESIGN_TOKENS_OPTION);

        return rest_ensure_response(['ok' => true]);
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, string>|\WP_Error
     */
    private static function sanitize_design_tokens(array $input)
    {
        $required = [
            'primaryColor',
            'primaryDark',
            'accentCyan',
            'accentGold',
            'accentOrange',
            'headingFont',
            'bodyFont',
            'borderRadiusCard',
            'borderRadiusButton',
        ];

        $out = [];
        foreach ($required as $key) {
            if (!isset($input[$key]) || !is_string($input[$key]) || $input[$key] === '') {
                return new \WP_Error('missing_field', sprintf('Missing or empty token: %s', $key));
            }
            $out[$key] = self::sanitize_token_value($key, $input[$key]);
        }

        return $out;
    }

    private static function sanitize_token_value(string $key, string $value): string
    {
        $value = trim(wp_strip_all_tags($value));
        if (strlen($value) > 200) {
            $value = substr($value, 0, 200);
        }

        $colorKeys = ['primaryColor', 'primaryDark', 'accentCyan', 'accentGold', 'accentOrange'];
        if (in_array($key, $colorKeys, true)) {
            if (preg_match('/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/', $value)) {
                return sanitize_hex_color($value) ?: '#000000';
            }
            if (preg_match('/^rgba?\\(/', $value)) {
                return preg_match('/^rgba?\\(\\s*\\d{1,3}\\s*,\\s*\\d{1,3}\\s*,\\s*\\d{1,3}(\\s*,\\s*[0-9.]+)?\\s*\\)$/', $value) ? $value : '#000000';
            }

            return sanitize_hex_color($value) ?: '#000000';
        }

        if (str_ends_with($key, 'Font')) {
            return sanitize_text_field($value);
        }

        // border radius: 12px, 0.5rem, 9999px, etc.
        if (preg_match('/^[0-9.]+(px|rem|em|%)?$/', $value) || preg_match('/^var\\(/', $value)) {
            return sanitize_text_field($value);
        }

        return sanitize_text_field($value);
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

        $event = [
            'id'        => wp_generate_uuid4(),
            'type'      => isset($body['type']) ? sanitize_text_field($body['type']) : 'unknown',
            'payload'   => isset($body['payload']) && is_array($body['payload'])
                ? self::sanitize_recursive($body['payload'])
                : [],
            'timestamp' => gmdate('c'),
            'user_id'   => get_current_user_id(),
        ];

        $events = get_option(self::EVENTS_KEY, []);
        if (!is_array($events)) {
            $events = [];
        }

        $events[] = $event;

        // Keep last 500 events.
        if (count($events) > 500) {
            $events = array_slice($events, -500);
        }

        update_option(self::EVENTS_KEY, $events, false);

        return rest_ensure_response($event);
    }

    // -------------------------------------------------------------------------
    // Companies CRUD
    // -------------------------------------------------------------------------

    public static function list_companies(WP_REST_Request $request): WP_REST_Response
    {
        $snapshot  = get_option(self::OPTION_KEY, []);
        $companies = isset($snapshot['companies']) && is_array($snapshot['companies']) ? $snapshot['companies'] : [];

        // Optional search/filter.
        $search = $request->get_param('search');
        $status = $request->get_param('status');

        if (!empty($search)) {
            $search    = mb_strtolower(sanitize_text_field($search));
            $companies = array_filter($companies, static function (array $c) use ($search): bool {
                $haystack = mb_strtolower(($c['name'] ?? '') . ' ' . ($c['email'] ?? '') . ' ' . ($c['id'] ?? ''));
                return strpos($haystack, $search) !== false;
            });
        }

        if (!empty($status)) {
            $status    = sanitize_text_field($status);
            $companies = array_filter($companies, static function (array $c) use ($status): bool {
                return ($c['status'] ?? '') === $status;
            });
        }

        return rest_ensure_response(array_values($companies));
    }

    public static function create_company(WP_REST_Request $request): WP_REST_Response
    {
        $body = $request->get_json_params();

        if (empty($body) || !is_array($body)) {
            return new WP_REST_Response(
                ['code' => 'invalid_body', 'message' => 'Request body must be a JSON object.'],
                400
            );
        }

        if (empty($body['name'])) {
            return new WP_REST_Response(
                ['code' => 'missing_name', 'message' => 'Company name is required.'],
                400
            );
        }

        $company = self::sanitize_recursive($body);
        $company['id']        = wp_generate_uuid4();
        $company['status']    = $company['status'] ?? 'active';
        $company['createdAt'] = gmdate('c');
        $company['updatedAt'] = gmdate('c');
        $company['notes']     = [];

        $snapshot = get_option(self::OPTION_KEY, []);
        if (!isset($snapshot['companies']) || !is_array($snapshot['companies'])) {
            $snapshot['companies'] = [];
        }

        $snapshot['companies'][] = $company;
        update_option(self::OPTION_KEY, $snapshot, false);

        return new WP_REST_Response($company, 201);
    }

    public static function get_company(WP_REST_Request $request): WP_REST_Response
    {
        $id      = sanitize_text_field($request->get_param('id'));
        $company = self::find_company($id);

        if ($company === null) {
            return new WP_REST_Response(
                ['code' => 'not_found', 'message' => 'Company not found.'],
                404
            );
        }

        return rest_ensure_response($company);
    }

    public static function update_company(WP_REST_Request $request): WP_REST_Response
    {
        $id   = sanitize_text_field($request->get_param('id'));
        $body = $request->get_json_params();

        if (empty($body) || !is_array($body)) {
            return new WP_REST_Response(
                ['code' => 'invalid_body', 'message' => 'Request body must be a JSON object.'],
                400
            );
        }

        $snapshot = get_option(self::OPTION_KEY, []);
        $index   = self::find_company_index($snapshot, $id);

        if ($index === null) {
            return new WP_REST_Response(
                ['code' => 'not_found', 'message' => 'Company not found.'],
                404
            );
        }

        $sanitized = self::sanitize_recursive($body);
        unset($sanitized['id']); // Prevent ID mutation.

        $snapshot['companies'][$index] = array_merge($snapshot['companies'][$index], $sanitized);
        $snapshot['companies'][$index]['updatedAt'] = gmdate('c');

        update_option(self::OPTION_KEY, $snapshot, false);

        return rest_ensure_response($snapshot['companies'][$index]);
    }

    public static function delete_company(WP_REST_Request $request): WP_REST_Response
    {
        $id       = sanitize_text_field($request->get_param('id'));
        $snapshot = get_option(self::OPTION_KEY, []);
        $index    = self::find_company_index($snapshot, $id);

        if ($index === null) {
            return new WP_REST_Response(
                ['code' => 'not_found', 'message' => 'Company not found.'],
                404
            );
        }

        array_splice($snapshot['companies'], $index, 1);
        update_option(self::OPTION_KEY, $snapshot, false);

        return new WP_REST_Response(null, 204);
    }

    public static function suspend_company(WP_REST_Request $request): WP_REST_Response
    {
        return self::set_company_status($request, 'suspended');
    }

    public static function activate_company(WP_REST_Request $request): WP_REST_Response
    {
        return self::set_company_status($request, 'active');
    }

    public static function update_usage_limits(WP_REST_Request $request): WP_REST_Response
    {
        $id   = sanitize_text_field($request->get_param('id'));
        $body = $request->get_json_params();

        if (empty($body) || !is_array($body)) {
            return new WP_REST_Response(
                ['code' => 'invalid_body', 'message' => 'Request body must be a JSON object.'],
                400
            );
        }

        $snapshot = get_option(self::OPTION_KEY, []);
        $index   = self::find_company_index($snapshot, $id);

        if ($index === null) {
            return new WP_REST_Response(
                ['code' => 'not_found', 'message' => 'Company not found.'],
                404
            );
        }

        $limits = [];
        if (isset($body['maxUsers'])) {
            $limits['maxUsers'] = absint($body['maxUsers']);
        }
        if (isset($body['maxWebsites'])) {
            $limits['maxWebsites'] = absint($body['maxWebsites']);
        }
        if (isset($body['maxStorage'])) {
            $limits['maxStorage'] = absint($body['maxStorage']);
        }
        if (isset($body['maxBandwidth'])) {
            $limits['maxBandwidth'] = absint($body['maxBandwidth']);
        }

        $existing_limits = $snapshot['companies'][$index]['usageLimits'] ?? [];
        $snapshot['companies'][$index]['usageLimits'] = array_merge($existing_limits, $limits);
        $snapshot['companies'][$index]['updatedAt']   = gmdate('c');

        update_option(self::OPTION_KEY, $snapshot, false);

        return rest_ensure_response($snapshot['companies'][$index]);
    }

    // -------------------------------------------------------------------------
    // Company Notes
    // -------------------------------------------------------------------------

    public static function add_note(WP_REST_Request $request): WP_REST_Response
    {
        $id   = sanitize_text_field($request->get_param('id'));
        $body = $request->get_json_params();

        if (empty($body['content'])) {
            return new WP_REST_Response(
                ['code' => 'missing_content', 'message' => 'Note content is required.'],
                400
            );
        }

        $snapshot = get_option(self::OPTION_KEY, []);
        $index   = self::find_company_index($snapshot, $id);

        if ($index === null) {
            return new WP_REST_Response(
                ['code' => 'not_found', 'message' => 'Company not found.'],
                404
            );
        }

        $note = [
            'id'        => wp_generate_uuid4(),
            'content'   => sanitize_textarea_field($body['content']),
            'author'    => wp_get_current_user()->display_name,
            'authorId'  => get_current_user_id(),
            'createdAt' => gmdate('c'),
            'updatedAt' => gmdate('c'),
        ];

        if (!isset($snapshot['companies'][$index]['notes']) || !is_array($snapshot['companies'][$index]['notes'])) {
            $snapshot['companies'][$index]['notes'] = [];
        }

        $snapshot['companies'][$index]['notes'][]    = $note;
        $snapshot['companies'][$index]['updatedAt']   = gmdate('c');

        update_option(self::OPTION_KEY, $snapshot, false);

        return new WP_REST_Response($note, 201);
    }

    public static function update_note(WP_REST_Request $request): WP_REST_Response
    {
        $id      = sanitize_text_field($request->get_param('id'));
        $note_id = sanitize_text_field($request->get_param('note_id'));
        $body    = $request->get_json_params();

        if (empty($body['content'])) {
            return new WP_REST_Response(
                ['code' => 'missing_content', 'message' => 'Note content is required.'],
                400
            );
        }

        $snapshot = get_option(self::OPTION_KEY, []);
        $index   = self::find_company_index($snapshot, $id);

        if ($index === null) {
            return new WP_REST_Response(
                ['code' => 'not_found', 'message' => 'Company not found.'],
                404
            );
        }

        $notes      = $snapshot['companies'][$index]['notes'] ?? [];
        $note_index = null;

        foreach ($notes as $i => $note) {
            if (($note['id'] ?? '') === $note_id) {
                $note_index = $i;
                break;
            }
        }

        if ($note_index === null) {
            return new WP_REST_Response(
                ['code' => 'note_not_found', 'message' => 'Note not found.'],
                404
            );
        }

        $snapshot['companies'][$index]['notes'][$note_index]['content']   = sanitize_textarea_field($body['content']);
        $snapshot['companies'][$index]['notes'][$note_index]['updatedAt'] = gmdate('c');
        $snapshot['companies'][$index]['updatedAt'] = gmdate('c');

        update_option(self::OPTION_KEY, $snapshot, false);

        return rest_ensure_response($snapshot['companies'][$index]['notes'][$note_index]);
    }

    public static function delete_note(WP_REST_Request $request): WP_REST_Response
    {
        $id      = sanitize_text_field($request->get_param('id'));
        $note_id = sanitize_text_field($request->get_param('note_id'));

        $snapshot = get_option(self::OPTION_KEY, []);
        $index   = self::find_company_index($snapshot, $id);

        if ($index === null) {
            return new WP_REST_Response(
                ['code' => 'not_found', 'message' => 'Company not found.'],
                404
            );
        }

        $notes      = $snapshot['companies'][$index]['notes'] ?? [];
        $note_index = null;

        foreach ($notes as $i => $note) {
            if (($note['id'] ?? '') === $note_id) {
                $note_index = $i;
                break;
            }
        }

        if ($note_index === null) {
            return new WP_REST_Response(
                ['code' => 'note_not_found', 'message' => 'Note not found.'],
                404
            );
        }

        array_splice($snapshot['companies'][$index]['notes'], $note_index, 1);
        $snapshot['companies'][$index]['updatedAt'] = gmdate('c');

        update_option(self::OPTION_KEY, $snapshot, false);

        return new WP_REST_Response(null, 204);
    }

    // -------------------------------------------------------------------------
    // Team Members CRUD
    // -------------------------------------------------------------------------

    public static function list_team_members(WP_REST_Request $request): WP_REST_Response
    {
        $snapshot = get_option(self::OPTION_KEY, []);
        $members  = isset($snapshot['teamMembers']) && is_array($snapshot['teamMembers']) ? $snapshot['teamMembers'] : [];

        $search = $request->get_param('search');
        if (!empty($search)) {
            $search  = mb_strtolower(sanitize_text_field($search));
            $members = array_filter($members, static function (array $m) use ($search): bool {
                $haystack = mb_strtolower(($m['name'] ?? '') . ' ' . ($m['email'] ?? '') . ' ' . ($m['role'] ?? ''));
                return strpos($haystack, $search) !== false;
            });
        }

        return rest_ensure_response(array_values($members));
    }

    public static function create_team_member(WP_REST_Request $request): WP_REST_Response
    {
        $body = $request->get_json_params();

        if (empty($body) || !is_array($body)) {
            return new WP_REST_Response(
                ['code' => 'invalid_body', 'message' => 'Request body must be a JSON object.'],
                400
            );
        }

        if (empty($body['name']) || empty($body['email'])) {
            return new WP_REST_Response(
                ['code' => 'missing_fields', 'message' => 'Name and email are required.'],
                400
            );
        }

        $member = self::sanitize_recursive($body);
        $member['id']        = wp_generate_uuid4();
        $member['email']     = sanitize_email($body['email']);
        $member['createdAt'] = gmdate('c');
        $member['updatedAt'] = gmdate('c');

        if (!is_email($member['email'])) {
            return new WP_REST_Response(
                ['code' => 'invalid_email', 'message' => 'A valid email address is required.'],
                400
            );
        }

        $snapshot = get_option(self::OPTION_KEY, []);
        if (!isset($snapshot['teamMembers']) || !is_array($snapshot['teamMembers'])) {
            $snapshot['teamMembers'] = [];
        }

        $snapshot['teamMembers'][] = $member;
        update_option(self::OPTION_KEY, $snapshot, false);

        return new WP_REST_Response($member, 201);
    }

    public static function update_team_member(WP_REST_Request $request): WP_REST_Response
    {
        $id   = sanitize_text_field($request->get_param('id'));
        $body = $request->get_json_params();

        if (empty($body) || !is_array($body)) {
            return new WP_REST_Response(
                ['code' => 'invalid_body', 'message' => 'Request body must be a JSON object.'],
                400
            );
        }

        $snapshot = get_option(self::OPTION_KEY, []);
        $index   = self::find_index_in($snapshot, 'teamMembers', $id);

        if ($index === null) {
            return new WP_REST_Response(
                ['code' => 'not_found', 'message' => 'Team member not found.'],
                404
            );
        }

        $sanitized = self::sanitize_recursive($body);
        unset($sanitized['id']);

        if (isset($sanitized['email'])) {
            $sanitized['email'] = sanitize_email($body['email']);
            if (!is_email($sanitized['email'])) {
                return new WP_REST_Response(
                    ['code' => 'invalid_email', 'message' => 'A valid email address is required.'],
                    400
                );
            }
        }

        $snapshot['teamMembers'][$index] = array_merge($snapshot['teamMembers'][$index], $sanitized);
        $snapshot['teamMembers'][$index]['updatedAt'] = gmdate('c');

        update_option(self::OPTION_KEY, $snapshot, false);

        return rest_ensure_response($snapshot['teamMembers'][$index]);
    }

    public static function delete_team_member(WP_REST_Request $request): WP_REST_Response
    {
        $id       = sanitize_text_field($request->get_param('id'));
        $snapshot = get_option(self::OPTION_KEY, []);
        $index    = self::find_index_in($snapshot, 'teamMembers', $id);

        if ($index === null) {
            return new WP_REST_Response(
                ['code' => 'not_found', 'message' => 'Team member not found.'],
                404
            );
        }

        array_splice($snapshot['teamMembers'], $index, 1);
        update_option(self::OPTION_KEY, $snapshot, false);

        return new WP_REST_Response(null, 204);
    }

    // -------------------------------------------------------------------------
    // Billing Records CRUD
    // -------------------------------------------------------------------------

    public static function list_billing_records(WP_REST_Request $request): WP_REST_Response
    {
        $snapshot = get_option(self::OPTION_KEY, []);
        $records  = isset($snapshot['billingRecords']) && is_array($snapshot['billingRecords']) ? $snapshot['billingRecords'] : [];

        $company_id = $request->get_param('company_id');
        if (!empty($company_id)) {
            $company_id = sanitize_text_field($company_id);
            $records    = array_filter($records, static function (array $r) use ($company_id): bool {
                return ($r['companyId'] ?? '') === $company_id;
            });
        }

        $status = $request->get_param('status');
        if (!empty($status)) {
            $status  = sanitize_text_field($status);
            $records = array_filter($records, static function (array $r) use ($status): bool {
                return ($r['status'] ?? '') === $status;
            });
        }

        return rest_ensure_response(array_values($records));
    }

    public static function create_billing_record(WP_REST_Request $request): WP_REST_Response
    {
        $body = $request->get_json_params();

        if (empty($body) || !is_array($body)) {
            return new WP_REST_Response(
                ['code' => 'invalid_body', 'message' => 'Request body must be a JSON object.'],
                400
            );
        }

        if (empty($body['companyId']) || !isset($body['amount'])) {
            return new WP_REST_Response(
                ['code' => 'missing_fields', 'message' => 'companyId and amount are required.'],
                400
            );
        }

        $record = self::sanitize_recursive($body);
        $record['id']        = wp_generate_uuid4();
        $record['amount']    = floatval($body['amount']);
        $record['status']    = $record['status'] ?? 'pending';
        $record['createdAt'] = gmdate('c');
        $record['updatedAt'] = gmdate('c');

        $snapshot = get_option(self::OPTION_KEY, []);
        if (!isset($snapshot['billingRecords']) || !is_array($snapshot['billingRecords'])) {
            $snapshot['billingRecords'] = [];
        }

        $snapshot['billingRecords'][] = $record;
        update_option(self::OPTION_KEY, $snapshot, false);

        return new WP_REST_Response($record, 201);
    }

    public static function update_billing_record(WP_REST_Request $request): WP_REST_Response
    {
        $id   = sanitize_text_field($request->get_param('id'));
        $body = $request->get_json_params();

        if (empty($body) || !is_array($body)) {
            return new WP_REST_Response(
                ['code' => 'invalid_body', 'message' => 'Request body must be a JSON object.'],
                400
            );
        }

        $snapshot = get_option(self::OPTION_KEY, []);
        $index   = self::find_index_in($snapshot, 'billingRecords', $id);

        if ($index === null) {
            return new WP_REST_Response(
                ['code' => 'not_found', 'message' => 'Billing record not found.'],
                404
            );
        }

        $sanitized = self::sanitize_recursive($body);
        unset($sanitized['id']);

        if (isset($body['amount'])) {
            $sanitized['amount'] = floatval($body['amount']);
        }

        $snapshot['billingRecords'][$index] = array_merge($snapshot['billingRecords'][$index], $sanitized);
        $snapshot['billingRecords'][$index]['updatedAt'] = gmdate('c');

        update_option(self::OPTION_KEY, $snapshot, false);

        return rest_ensure_response($snapshot['billingRecords'][$index]);
    }

    public static function delete_billing_record(WP_REST_Request $request): WP_REST_Response
    {
        $id       = sanitize_text_field($request->get_param('id'));
        $snapshot = get_option(self::OPTION_KEY, []);
        $index    = self::find_index_in($snapshot, 'billingRecords', $id);

        if ($index === null) {
            return new WP_REST_Response(
                ['code' => 'not_found', 'message' => 'Billing record not found.'],
                404
            );
        }

        array_splice($snapshot['billingRecords'], $index, 1);
        update_option(self::OPTION_KEY, $snapshot, false);

        return new WP_REST_Response(null, 204);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private static function set_company_status(WP_REST_Request $request, string $status): WP_REST_Response
    {
        $id       = sanitize_text_field($request->get_param('id'));
        $snapshot = get_option(self::OPTION_KEY, []);
        $index    = self::find_company_index($snapshot, $id);

        if ($index === null) {
            return new WP_REST_Response(
                ['code' => 'not_found', 'message' => 'Company not found.'],
                404
            );
        }

        $snapshot['companies'][$index]['status']    = $status;
        $snapshot['companies'][$index]['updatedAt'] = gmdate('c');

        update_option(self::OPTION_KEY, $snapshot, false);

        return rest_ensure_response($snapshot['companies'][$index]);
    }

    private static function find_company(string $id): ?array
    {
        $snapshot  = get_option(self::OPTION_KEY, []);
        $companies = $snapshot['companies'] ?? [];

        foreach ($companies as $company) {
            if (($company['id'] ?? '') === $id) {
                return $company;
            }
        }

        return null;
    }

    private static function find_company_index(array $snapshot, string $id): ?int
    {
        return self::find_index_in($snapshot, 'companies', $id);
    }

    private static function find_index_in(array $snapshot, string $key, string $id): ?int
    {
        $items = $snapshot[$key] ?? [];

        foreach ($items as $i => $item) {
            if (($item['id'] ?? '') === $id) {
                return $i;
            }
        }

        return null;
    }

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
