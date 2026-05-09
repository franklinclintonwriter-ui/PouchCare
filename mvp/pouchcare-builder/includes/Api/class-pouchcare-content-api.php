<?php
if (!defined('ABSPATH')) {
    exit;
}

class PouchCare_Content_Api
{
    public static function init(): void
    {
        add_action('rest_api_init', [self::class, 'register_routes']);
    }

    public static function register_routes(): void
    {
        // Blocks list.
        register_rest_route('pouchcare/v1', '/blocks', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'list_blocks'],
            'permission_callback' => static function (): bool {
                return current_user_can('read');
            },
        ]);

        // Patterns list.
        register_rest_route('pouchcare/v1', '/patterns', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'list_patterns'],
            'permission_callback' => static function (): bool {
                return current_user_can('read');
            },
        ]);

        // Single block detail.
        register_rest_route('pouchcare/v1', '/blocks/(?P<slug>[\\w-]+)', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'get_block'],
            'permission_callback' => static function (): bool {
                return current_user_can('read');
            },
            'args'                => [
                'slug' => [
                    'required'          => true,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_key',
                ],
            ],
        ]);

        // Customizer preview URL generator.
        register_rest_route('pouchcare/v1', '/customizer/preview', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'customizer_preview'],
            'permission_callback' => [PouchCare_Security::class, 'can_manage'],
        ]);

        // Template import.
        register_rest_route('pouchcare/v1', '/templates/(?P<slug>[\\w-]+)/import', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'import_template'],
            'permission_callback' => [PouchCare_Security::class, 'can_manage'],
        ]);
    }

    /**
     * Return all registered PouchCare blocks with metadata.
     */
    public static function list_blocks(WP_REST_Request $request): WP_REST_Response
    {
        $registry = WP_Block_Type_Registry::get_instance();
        $all      = $registry->get_all_registered();
        $blocks   = [];

        foreach ($all as $name => $block_type) {
            // Only include pouchcare blocks.
            if (strpos($name, 'pouchcare/') !== 0) {
                continue;
            }

            $blocks[] = [
                'name'        => $name,
                'title'       => $block_type->title ?? $name,
                'description' => $block_type->description ?? '',
                'category'    => $block_type->category ?? 'common',
                'icon'        => is_string($block_type->icon ?? null) ? $block_type->icon : 'block-default',
                'keywords'    => $block_type->keywords ?? [],
                'supports'    => $block_type->supports ?? [],
            ];
        }

        return rest_ensure_response([
            'count' => count($blocks),
            'items' => $blocks,
        ]);
    }

    /**
     * Return all registered PouchCare block patterns.
     */
    public static function list_patterns(WP_REST_Request $request): WP_REST_Response
    {
        $registry = WP_Block_Patterns_Registry::get_instance();
        $all      = $registry->get_all_registered();
        $patterns = [];

        foreach ($all as $pattern) {
            $name = $pattern['name'] ?? '';

            // Only include pouchcare patterns.
            if (strpos($name, 'pouchcare/') !== 0) {
                continue;
            }

            $patterns[] = [
                'name'        => $name,
                'title'       => $pattern['title'] ?? $name,
                'description' => $pattern['description'] ?? '',
                'categories'  => $pattern['categories'] ?? [],
                'keywords'    => $pattern['keywords'] ?? [],
                'content'     => $pattern['content'] ?? '',
            ];
        }

        return rest_ensure_response([
            'count' => count($patterns),
            'items' => $patterns,
        ]);
    }

    /**
     * Import a template by slug via the PouchCare_Template_Importer.
     */
    public static function import_template(WP_REST_Request $request): WP_REST_Response
    {
        $slug = sanitize_key($request->get_param('slug'));

        if (empty($slug)) {
            return new WP_REST_Response(
                ['code' => 'missing_slug', 'message' => 'Template slug is required.'],
                400
            );
        }

        $templates = PouchCare_Template_Importer::get_templates();

        if (!isset($templates[$slug])) {
            return new WP_REST_Response(
                ['code' => 'not_found', 'message' => 'Template not found.'],
                404
            );
        }

        $template = $templates[$slug];
        $title    = (string) $template['title'];

        // Check settings for duplicate handling.
        if (class_exists('PouchCare_Settings')) {
            $settings = PouchCare_Settings::get();
            $status   = $settings['default_status'] ?? 'draft';
            $dup_mode = $settings['duplicate_mode'] ?? 'append-copy';
        } else {
            $status   = 'draft';
            $dup_mode = 'append-copy';
        }

        // Title duplicate check.
        if ($dup_mode === 'skip' && self::title_exists($title)) {
            return new WP_REST_Response(
                ['code' => 'duplicate', 'message' => 'A page with this title already exists.'],
                409
            );
        }

        if ($dup_mode === 'append-copy' && self::title_exists($title)) {
            $title .= ' (Copy)';
        }

        $post_id = wp_insert_post([
            'post_title'   => wp_strip_all_tags($title),
            'post_content' => wp_kses_post((string) $template['content']),
            'post_status'  => in_array($status, ['draft', 'pending'], true) ? $status : 'draft',
            'post_type'    => 'page',
        ], true);

        if (is_wp_error($post_id)) {
            if (class_exists('PouchCare_Import_Log')) {
                PouchCare_Import_Log::add($slug, 'failed', $post_id->get_error_message());
            }

            return new WP_REST_Response(
                ['code' => 'import_failed', 'message' => $post_id->get_error_message()],
                500
            );
        }

        if (class_exists('PouchCare_Import_Log')) {
            PouchCare_Import_Log::add($slug, 'success', 'Imported #' . (string) $post_id . ' via REST API');
        }

        return rest_ensure_response([
            'postId'  => $post_id,
            'title'   => $title,
            'status'  => $status,
            'editUrl' => admin_url('post.php?post=' . (int) $post_id . '&action=edit'),
        ]);
    }

    /**
     * Return details for a single PouchCare block by slug.
     *
     * @param WP_REST_Request $request Request with 'slug' parameter.
     * @return WP_REST_Response
     */
    public static function get_block(WP_REST_Request $request): WP_REST_Response
    {
        $slug     = sanitize_key($request->get_param('slug'));
        $name     = 'pouchcare/' . $slug;
        $registry = WP_Block_Type_Registry::get_instance();
        $block    = $registry->get_registered($name);

        if (!$block) {
            return new WP_REST_Response(
                ['code' => 'not_found', 'message' => 'Block not found.'],
                404
            );
        }

        return rest_ensure_response([
            'name'        => $name,
            'title'       => $block->title ?? $name,
            'description' => $block->description ?? '',
            'category'    => $block->category ?? 'common',
            'icon'        => is_string($block->icon ?? null) ? $block->icon : 'block-default',
            'keywords'    => $block->keywords ?? [],
            'supports'    => $block->supports ?? [],
            'attributes'  => $block->attributes ?? [],
            'styles'      => $block->styles ?? [],
        ]);
    }

    /**
     * Generate a WordPress Customizer preview URL.
     *
     * Accepts optional design token overrides (colors, fonts, border-radius)
     * and returns a URL that opens the Customizer with those values pre-loaded.
     *
     * @param WP_REST_Request $request Request body with optional token overrides.
     * @return WP_REST_Response
     */
    public static function customizer_preview(WP_REST_Request $request): WP_REST_Response
    {
        $tokens = $request->get_json_params();

        // Store tokens as a transient so the Customizer can pick them up.
        $preview_key = 'pouchcare_preview_' . wp_generate_password(12, false);
        set_transient($preview_key, $tokens, HOUR_IN_SECONDS);

        $preview_url = add_query_arg(
            [
                'autofocus[section]' => 'pouchcare_design_tokens',
                'pouchcare_preview'  => $preview_key,
                'return'             => rawurlencode(admin_url()),
            ],
            admin_url('customize.php')
        );

        return rest_ensure_response([
            'previewUrl'  => $preview_url,
            'previewKey'  => $preview_key,
            'expiresIn'   => HOUR_IN_SECONDS,
        ]);
    }

    /**
     * Check if a page with the given title already exists.
     */
    private static function title_exists(string $title): bool
    {
        global $wpdb;

        $post_id = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT ID FROM {$wpdb->posts} WHERE post_type = 'page' AND post_status <> 'trash' AND post_title = %s LIMIT 1",
                $title
            )
        );

        return !empty($post_id);
    }
}
