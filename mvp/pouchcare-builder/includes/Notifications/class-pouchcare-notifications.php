<?php
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Email notification system for PouchCare.
 *
 * Handles email template management, rendering, and delivery via wp_mail().
 * Templates use {{variable}} placeholder syntax for dynamic content.
 */
class PouchCare_Notifications
{
    private const OPTION_PREFIX = 'pouchcare_email_template_';
    private const LAST_SENT_KEY = 'pouchcare_email_last_sent';

    /**
     * Supported email template types with their metadata.
     *
     * @var array<string, array{subject: string, variables: string[]}>
     */
    private static array $template_types = [
        'welcome' => [
            'subject'   => 'Welcome to {{brand_name}}!',
            'variables' => ['brand_name', 'user_name', 'login_url', 'support_email'],
        ],
        'password_reset' => [
            'subject'   => 'Reset Your Password — {{brand_name}}',
            'variables' => ['brand_name', 'user_name', 'reset_url', 'expiry_hours'],
        ],
        'invoice' => [
            'subject'   => 'Invoice #{{invoice_number}} from {{brand_name}}',
            'variables' => ['brand_name', 'user_name', 'invoice_number', 'amount', 'due_date', 'invoice_url'],
        ],
        'subscription_renewal' => [
            'subject'   => 'Your {{plan_name}} Subscription Has Been Renewed',
            'variables' => ['brand_name', 'user_name', 'plan_name', 'amount', 'next_renewal_date', 'manage_url'],
        ],
        'plugin_update' => [
            'subject'   => 'Plugin Update Available: {{plugin_name}} v{{new_version}}',
            'variables' => ['brand_name', 'user_name', 'plugin_name', 'old_version', 'new_version', 'changelog_url'],
        ],
        'ticket_response' => [
            'subject'   => 'Re: {{ticket_subject}} — Ticket #{{ticket_id}}',
            'variables' => ['brand_name', 'user_name', 'ticket_id', 'ticket_subject', 'response_body', 'ticket_url'],
        ],
        'payment_failure' => [
            'subject'   => 'Payment Failed — Action Required',
            'variables' => ['brand_name', 'user_name', 'amount', 'reason', 'retry_url', 'support_email'],
        ],
        'new_company' => [
            'subject'   => 'New Company Registered: {{company_name}}',
            'variables' => ['brand_name', 'company_name', 'owner_name', 'owner_email', 'admin_url'],
        ],
    ];

    public static function init(): void
    {
        add_action('rest_api_init', [self::class, 'register_routes']);
    }

    /* ─── REST Routes ─────────────────────────────────── */

    public static function register_routes(): void
    {
        register_rest_route('pouchcare/v1', '/email-templates', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'rest_list_templates'],
            'permission_callback' => [PouchCare_Security::class, 'can_manage'],
        ]);

        register_rest_route('pouchcare/v1', '/email-templates/(?P<type>[a-z_]+)', [
            'methods'             => 'PUT',
            'callback'            => [self::class, 'rest_update_template'],
            'permission_callback' => [PouchCare_Security::class, 'can_manage'],
        ]);

        register_rest_route('pouchcare/v1', '/notifications/send', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'rest_send'],
            'permission_callback' => [PouchCare_Security::class, 'can_manage'],
        ]);

        register_rest_route('pouchcare/v1', '/notifications/test', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'rest_test'],
            'permission_callback' => [PouchCare_Security::class, 'can_manage'],
        ]);
    }

    /* ─── REST Callbacks ──────────────────────────────── */

    /**
     * GET /pouchcare/v1/email-templates
     *
     * @return \WP_REST_Response
     */
    public static function rest_list_templates(\WP_REST_Request $request): \WP_REST_Response
    {
        return new \WP_REST_Response(self::get_templates(), 200);
    }

    /**
     * PUT /pouchcare/v1/email-templates/{type}
     *
     * @return \WP_REST_Response
     */
    public static function rest_update_template(\WP_REST_Request $request): \WP_REST_Response
    {
        $type    = $request->get_param('type');
        $subject = sanitize_text_field($request->get_param('subject') ?? '');
        $body    = wp_kses_post($request->get_param('body') ?? '');

        if (!isset(self::$template_types[$type])) {
            return new \WP_REST_Response(['error' => 'Unknown template type.'], 400);
        }

        if (empty($subject) || empty($body)) {
            return new \WP_REST_Response(['error' => 'Subject and body are required.'], 400);
        }

        self::update_template($type, $subject, $body);

        return new \WP_REST_Response(['success' => true, 'type' => $type], 200);
    }

    /**
     * POST /pouchcare/v1/notifications/send
     *
     * @return \WP_REST_Response
     */
    public static function rest_send(\WP_REST_Request $request): \WP_REST_Response
    {
        $type = sanitize_text_field($request->get_param('type') ?? '');
        $to   = sanitize_email($request->get_param('to') ?? '');
        $data = $request->get_param('data') ?? [];

        if (!isset(self::$template_types[$type])) {
            return new \WP_REST_Response(['error' => 'Unknown template type.'], 400);
        }

        if (!is_email($to)) {
            return new \WP_REST_Response(['error' => 'Invalid email address.'], 400);
        }

        $result = self::send($type, $to, (array) $data);

        return new \WP_REST_Response(['success' => $result], $result ? 200 : 500);
    }

    /**
     * POST /pouchcare/v1/notifications/test
     *
     * Sends a test email of the given type to the currently authenticated admin user.
     *
     * @return \WP_REST_Response
     */
    public static function rest_test(\WP_REST_Request $request): \WP_REST_Response
    {
        $type = sanitize_text_field($request->get_param('type') ?? 'welcome');
        $user = wp_get_current_user();

        if (!$user || !$user->user_email) {
            return new \WP_REST_Response(['error' => 'No authenticated user.'], 401);
        }

        // Build sample data using all template variables.
        $sample_data = self::get_sample_data($type);
        $result      = self::send($type, $user->user_email, $sample_data);

        return new \WP_REST_Response([
            'success' => $result,
            'sent_to' => $user->user_email,
            'type'    => $type,
        ], $result ? 200 : 500);
    }

    /* ─── Core Public API ─────────────────────────────── */

    /**
     * Send an email using the specified template type.
     *
     * @param string $type Template type key.
     * @param string $to   Recipient email address.
     * @param array  $data Key-value pairs for placeholder replacement.
     * @return bool Whether wp_mail() succeeded.
     */
    public static function send(string $type, string $to, array $data): bool
    {
        if (!isset(self::$template_types[$type])) {
            return false;
        }

        $template = self::get_resolved_template($type);
        $subject  = self::render($template['subject'], $data);
        $body     = self::render($template['body'], $data);

        $headers = ['Content-Type: text/html; charset=UTF-8'];

        $result = wp_mail($to, $subject, $body, $headers);

        if ($result) {
            update_option(self::LAST_SENT_KEY, current_time('mysql'));
        }

        return $result;
    }

    /**
     * Return all template definitions with their current (possibly custom) content.
     *
     * @return array<string, array{subject: string, body: string, variables: string[], customized: bool}>
     */
    public static function get_templates(): array
    {
        $out = [];

        foreach (self::$template_types as $type => $meta) {
            $custom  = get_option(self::OPTION_PREFIX . $type, null);
            $default = self::get_template($type);

            $out[$type] = [
                'subject'    => $custom ? ($custom['subject'] ?? $default['subject']) : $default['subject'],
                'body'       => $custom ? ($custom['body'] ?? $default['body']) : $default['body'],
                'variables'  => $meta['variables'],
                'customized' => $custom !== null && $custom !== false,
            ];
        }

        $out['_meta'] = [
            'last_sent' => get_option(self::LAST_SENT_KEY, null),
        ];

        return $out;
    }

    /**
     * Return the default HTML template for a given type.
     *
     * @param string $type Template type key.
     * @return array{subject: string, body: string}
     */
    public static function get_template(string $type): array
    {
        if (!isset(self::$template_types[$type])) {
            return ['subject' => '', 'body' => ''];
        }

        $subject = self::$template_types[$type]['subject'];
        $body    = self::get_default_body($type);

        return ['subject' => $subject, 'body' => $body];
    }

    /**
     * Persist a custom template override.
     *
     * @param string $type    Template type key.
     * @param string $subject Custom subject line.
     * @param string $body    Custom HTML body.
     */
    public static function update_template(string $type, string $subject, string $body): void
    {
        update_option(self::OPTION_PREFIX . $type, [
            'subject' => $subject,
            'body'    => $body,
        ]);
    }

    /* ─── Internal Helpers ────────────────────────────── */

    /**
     * Get the resolved template (custom override or default) for a type.
     */
    private static function get_resolved_template(string $type): array
    {
        $custom = get_option(self::OPTION_PREFIX . $type, null);

        if ($custom && !empty($custom['subject']) && !empty($custom['body'])) {
            return $custom;
        }

        return self::get_template($type);
    }

    /**
     * Replace {{variable}} placeholders in a string with data values.
     */
    private static function render(string $template, array $data): string
    {
        foreach ($data as $key => $value) {
            $template = str_replace('{{' . $key . '}}', esc_html((string) $value), $template);
        }

        // Remove any remaining unreplaced placeholders.
        $template = preg_replace('/\{\{[a-z_]+\}\}/', '', $template);

        return $template;
    }

    /**
     * Return sample data for test emails.
     */
    private static function get_sample_data(string $type): array
    {
        $brand = get_option('blogname', 'PouchCare');

        $base = [
            'brand_name'    => $brand,
            'user_name'     => 'Test User',
            'support_email' => get_option('admin_email', 'support@example.com'),
            'login_url'     => wp_login_url(),
            'admin_url'     => admin_url(),
        ];

        $extras = [
            'welcome'               => [],
            'password_reset'        => ['reset_url' => '#reset-preview', 'expiry_hours' => '24'],
            'invoice'               => ['invoice_number' => 'INV-0001', 'amount' => '$49.99', 'due_date' => date('Y-m-d', strtotime('+30 days')), 'invoice_url' => '#invoice-preview'],
            'subscription_renewal'  => ['plan_name' => 'Pro Plan', 'amount' => '$29/mo', 'next_renewal_date' => date('Y-m-d', strtotime('+30 days')), 'manage_url' => '#manage-preview'],
            'plugin_update'         => ['plugin_name' => 'PouchCare Builder', 'old_version' => '1.0.0', 'new_version' => '1.1.0', 'changelog_url' => '#changelog-preview'],
            'ticket_response'       => ['ticket_id' => 'TKT-1234', 'ticket_subject' => 'Test Ticket', 'response_body' => 'This is a sample response to your support ticket.', 'ticket_url' => '#ticket-preview'],
            'payment_failure'       => ['amount' => '$49.99', 'reason' => 'Card declined', 'retry_url' => '#retry-preview'],
            'new_company'           => ['company_name' => 'Acme Corp', 'owner_name' => 'John Doe', 'owner_email' => 'john@example.com'],
        ];

        return array_merge($base, $extras[$type] ?? []);
    }

    /**
     * Return the default HTML body for a template type.
     */
    private static function get_default_body(string $type): string
    {
        $wrapper_start = '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333;">';
        $wrapper_end   = '<hr style="border:none;border-top:1px solid #eee;margin:30px 0 15px;"><p style="font-size:12px;color:#999;">Sent by {{brand_name}}</p></body></html>';

        $bodies = [
            'welcome' => '<h2 style="color:#2563eb;">Welcome, {{user_name}}!</h2>'
                . '<p>Thank you for joining {{brand_name}}. We are excited to have you on board.</p>'
                . '<p><a href="{{login_url}}" style="display:inline-block;padding:10px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">Get Started</a></p>'
                . '<p>If you have any questions, reach out to us at {{support_email}}.</p>',

            'password_reset' => '<h2 style="color:#2563eb;">Password Reset Request</h2>'
                . '<p>Hi {{user_name}}, we received a request to reset your password.</p>'
                . '<p><a href="{{reset_url}}" style="display:inline-block;padding:10px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">Reset Password</a></p>'
                . '<p>This link expires in {{expiry_hours}} hours. If you did not request this, please ignore this email.</p>',

            'invoice' => '<h2 style="color:#2563eb;">Invoice #{{invoice_number}}</h2>'
                . '<p>Hi {{user_name}}, here is your invoice from {{brand_name}}.</p>'
                . '<table style="width:100%;border-collapse:collapse;margin:16px 0;">'
                . '<tr><td style="padding:8px;border:1px solid #eee;font-weight:bold;">Amount</td><td style="padding:8px;border:1px solid #eee;">{{amount}}</td></tr>'
                . '<tr><td style="padding:8px;border:1px solid #eee;font-weight:bold;">Due Date</td><td style="padding:8px;border:1px solid #eee;">{{due_date}}</td></tr>'
                . '</table>'
                . '<p><a href="{{invoice_url}}" style="display:inline-block;padding:10px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">View Invoice</a></p>',

            'subscription_renewal' => '<h2 style="color:#2563eb;">Subscription Renewed</h2>'
                . '<p>Hi {{user_name}}, your {{plan_name}} subscription has been renewed for {{amount}}.</p>'
                . '<p>Your next renewal date is {{next_renewal_date}}.</p>'
                . '<p><a href="{{manage_url}}" style="display:inline-block;padding:10px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">Manage Subscription</a></p>',

            'plugin_update' => '<h2 style="color:#2563eb;">Plugin Update Available</h2>'
                . '<p>Hi {{user_name}}, a new version of {{plugin_name}} is available.</p>'
                . '<p><strong>{{old_version}}</strong> &rarr; <strong>{{new_version}}</strong></p>'
                . '<p><a href="{{changelog_url}}" style="display:inline-block;padding:10px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">View Changelog</a></p>',

            'ticket_response' => '<h2 style="color:#2563eb;">New Response on Ticket #{{ticket_id}}</h2>'
                . '<p>Hi {{user_name}}, there is a new response on your ticket: <strong>{{ticket_subject}}</strong></p>'
                . '<div style="background:#f8fafc;border-left:4px solid #2563eb;padding:12px 16px;margin:16px 0;">{{response_body}}</div>'
                . '<p><a href="{{ticket_url}}" style="display:inline-block;padding:10px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">View Ticket</a></p>',

            'payment_failure' => '<h2 style="color:#dc2626;">Payment Failed</h2>'
                . '<p>Hi {{user_name}}, we were unable to process your payment of {{amount}}.</p>'
                . '<p><strong>Reason:</strong> {{reason}}</p>'
                . '<p><a href="{{retry_url}}" style="display:inline-block;padding:10px 24px;background:#dc2626;color:#fff;text-decoration:none;border-radius:6px;">Update Payment Method</a></p>'
                . '<p>If you need help, contact us at {{support_email}}.</p>',

            'new_company' => '<h2 style="color:#2563eb;">New Company Registered</h2>'
                . '<p>A new company has been registered on {{brand_name}}.</p>'
                . '<table style="width:100%;border-collapse:collapse;margin:16px 0;">'
                . '<tr><td style="padding:8px;border:1px solid #eee;font-weight:bold;">Company</td><td style="padding:8px;border:1px solid #eee;">{{company_name}}</td></tr>'
                . '<tr><td style="padding:8px;border:1px solid #eee;font-weight:bold;">Owner</td><td style="padding:8px;border:1px solid #eee;">{{owner_name}} ({{owner_email}})</td></tr>'
                . '</table>'
                . '<p><a href="{{admin_url}}" style="display:inline-block;padding:10px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">View in Admin</a></p>',
        ];

        return $wrapper_start . ($bodies[$type] ?? '<p>No template defined.</p>') . $wrapper_end;
    }
}
