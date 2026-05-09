<?php
if (!defined('ABSPATH')) {
    exit;
}

class PouchCare_Api
{
    public static function init(): void
    {
        add_action('rest_api_init', [self::class, 'register_routes']);
    }

    public static function register_routes(): void
    {
        register_rest_route('pouchcare/v1', '/status', [
            'methods' => 'GET',
            'permission_callback' => static function (): bool {
                return PouchCare_Security::can_manage();
            },
            'callback' => static function (): WP_REST_Response {
                return new WP_REST_Response([
                    'pluginVersion' => POUCHCARE_BUILDER_VERSION,
                    'timestamp' => gmdate('c'),
                ]);
            },
        ]);

        register_rest_route('pouchcare/v1', '/templates', [
            'methods' => 'GET',
            'permission_callback' => static function (): bool {
                return PouchCare_Security::can_manage();
            },
            'callback' => static function (): WP_REST_Response {
                return new WP_REST_Response([
                    'count' => count(PouchCare_Template_Importer::get_templates()),
                    'items' => array_values(PouchCare_Template_Importer::get_templates()),
                ]);
            },
        ]);
    }
}
