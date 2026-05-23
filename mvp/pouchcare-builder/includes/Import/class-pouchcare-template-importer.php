<?php
if (!defined('ABSPATH')) {
    exit;
}

class PouchCare_Template_Importer
{
    private const ACTION = 'pouchcare_import_template';
    private const REQUIRED_KEYS = ['slug', 'title', 'content'];

    public static function init(): void
    {
        add_action('admin_menu', [self::class, 'register_templates_submenu']);
        add_action('admin_post_' . self::ACTION, [self::class, 'handle_import']);
    }

    public static function register_templates_submenu(): void
    {
        add_submenu_page(
            'pouchcare-builder',
            __('Templates', 'pouchcare-builder'),
            __('Templates', 'pouchcare-builder'),
            'manage_options',
            'pouchcare-templates',
            [self::class, 'render_templates_page']
        );
    }

    public static function render_templates_page(): void
    {
        if (!PouchCare_Security::can_manage()) {
            wp_die('Forbidden');
        }

        $templates = self::discover_templates();
        $activeCategory = isset($_GET['template_category']) ? sanitize_text_field(wp_unslash($_GET['template_category'])) : 'all';
        $search = isset($_GET['s']) ? sanitize_text_field(wp_unslash($_GET['s'])) : '';

        $filtered = self::filter_templates($templates, $activeCategory, $search);
        $categories = self::collect_categories($templates);

        echo '<div class="wrap"><h1>PouchCare Templates</h1>';
        echo '<p>Import production starter templates into pages (draft by default).</p>';

        if (isset($_GET['import']) && $_GET['import'] === 'failed') {
            echo '<div class="notice notice-error"><p>Template import failed. Please check logs on Dashboard.</p></div>';
        }

        echo '<form method="get" style="margin:16px 0;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">';
        echo '<input type="hidden" name="page" value="pouchcare-templates" />';
        echo '<label for="template_category" class="screen-reader-text">Category</label>';
        echo '<select id="template_category" name="template_category">';
        echo '<option value="all" ' . selected($activeCategory, 'all', false) . '>All categories</option>';
        foreach ($categories as $category) {
            echo '<option value="' . esc_attr($category) . '" ' . selected($activeCategory, $category, false) . '>' . esc_html($category) . '</option>';
        }
        echo '</select>';

        echo '<label for="template_search" class="screen-reader-text">Search templates</label>';
        echo '<input id="template_search" type="search" name="s" value="' . esc_attr($search) . '" placeholder="Search templates" />';
        submit_button(__('Filter', 'pouchcare-builder'), 'secondary', '', false);
        echo '</form>';

        if (empty($filtered)) {
            echo '<p>No valid templates found for this filter.</p></div>';
            return;
        }

        echo '<table class="widefat striped"><thead><tr><th>Title</th><th>Category</th><th>Pack</th><th>Version</th><th>Action</th></tr></thead><tbody>';

        foreach ($filtered as $slug => $template) {
            $url = wp_nonce_url(
                admin_url('admin-post.php?action=' . self::ACTION . '&template=' . rawurlencode($slug)),
                self::ACTION . ':' . $slug
            );

            echo '<tr>';
            echo '<td><strong>' . esc_html($template['title']) . '</strong><br/><span class="description">' . esc_html($template['slug']) . '</span></td>';
            echo '<td>' . esc_html($template['category']) . '</td>';
            echo '<td>' . esc_html($template['pack']) . '</td>';
            echo '<td>' . esc_html($template['version']) . '</td>';
            echo '<td><a class="button button-primary" href="' . esc_url($url) . '">Import</a></td>';
            echo '</tr>';
        }

        echo '</tbody></table></div>';
    }

    public static function handle_import(): void
    {
        if (!PouchCare_Security::can_manage()) {
            wp_die('Forbidden');
        }

        $slug = isset($_GET['template']) ? sanitize_text_field(wp_unslash($_GET['template'])) : '';

        if ($slug === '') {
            PouchCare_Import_Log::add('unknown', 'failed', 'Template slug missing');
            wp_safe_redirect(admin_url('admin.php?page=pouchcare-templates&import=failed'));
            exit;
        }

        check_admin_referer(self::ACTION . ':' . $slug);

        $templates = self::discover_templates();
        if (!isset($templates[$slug])) {
            PouchCare_Import_Log::add($slug, 'failed', 'Template not found');
            wp_safe_redirect(admin_url('admin.php?page=pouchcare-templates&import=failed'));
            exit;
        }

        $template = $templates[$slug];
        $settings = PouchCare_Settings::get();

        $title = (string) $template['title'];
        $status = $settings['default_status'] ?? 'draft';

        if (($settings['duplicate_mode'] ?? 'append-copy') === 'skip' && self::title_exists($title)) {
            PouchCare_Import_Log::add($slug, 'skipped', 'Duplicate title found');
            wp_safe_redirect(admin_url('admin.php?page=pouchcare-templates'));
            exit;
        }

        if (($settings['duplicate_mode'] ?? 'append-copy') === 'append-copy' && self::title_exists($title)) {
            $title .= ' (Copy)';
        }

        $post_id = wp_insert_post([
            'post_title' => wp_strip_all_tags($title),
            'post_content' => wp_kses_post((string) $template['content']),
            'post_status' => in_array($status, ['draft', 'pending'], true) ? $status : 'draft',
            'post_type' => 'page',
        ], true);

        if (is_wp_error($post_id)) {
            PouchCare_Import_Log::add($slug, 'failed', $post_id->get_error_message());
            wp_safe_redirect(admin_url('admin.php?page=pouchcare-templates&import=failed'));
            exit;
        }

        PouchCare_Import_Log::add($slug, 'success', 'Imported #' . (string) $post_id . ' from ' . (string) $template['pack']);
        wp_safe_redirect(admin_url('post.php?post=' . (int) $post_id . '&action=edit'));
        exit;
    }

    public static function get_templates(): array
    {
        return self::discover_templates();
    }

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

    private static function discover_templates(): array
    {
        $roots = self::template_roots();
        $items = [];

        foreach ($roots as $rootPath => $rootLabel) {
            $files = self::glob_template_json_files($rootPath);
            if ($files === []) {
                continue;
            }

            foreach ($files as $file) {
                $parsed = self::parse_template_file($file, $rootLabel);
                if ($parsed === null) {
                    continue;
                }
                $items[$parsed['slug']] = $parsed;
            }
        }

        uasort($items, static function (array $a, array $b): int {
            return strcmp($a['title'], $b['title']);
        });

        return $items;
    }

    private static function template_roots(): array
    {
        return [
            POUCHCARE_BUILDER_PATH . 'templates/free-starter' => 'Plugin Pack',
            dirname(POUCHCARE_BUILDER_PATH) . '/pouchcare-template-packs/free-starter' => 'External Pack',
        ];
    }

    /**
     * Collect JSON template files under category subdirectories (e.g. saas/home.json).
     * Uses per-directory globs so discovery works on Windows paths where one deep
     * glob across category folders (pack wildcard slash wildcard dot json) can return no matches.
     */
    private static function glob_template_json_files(string $rootPath): array
    {
        $rootPath = untrailingslashit(wp_normalize_path($rootPath));
        if ($rootPath === '' || !is_dir($rootPath)) {
            return [];
        }

        $files = [];
        $subdirs = glob($rootPath . '/*', GLOB_ONLYDIR);
        if (!is_array($subdirs)) {
            return [];
        }

        foreach ($subdirs as $dir) {
            $dir = untrailingslashit(wp_normalize_path((string) $dir));
            $found = glob($dir . '/*.json');
            if (!is_array($found)) {
                continue;
            }
            foreach ($found as $file) {
                $files[] = $file;
            }
        }

        return $files;
    }

    private static function parse_template_file(string $file, string $pack): ?array
    {
        $raw = file_get_contents($file);
        if ($raw === false) {
            return null;
        }

        $data = json_decode($raw, true);
        if (!is_array($data)) {
            return null;
        }

        foreach (self::REQUIRED_KEYS as $key) {
            if (empty($data[$key]) || !is_string($data[$key])) {
                return null;
            }
        }

        $allowed = [
            'slug' => sanitize_key($data['slug']),
            'title' => sanitize_text_field($data['title']),
            'content' => (string) $data['content'],
            'category' => isset($data['category']) ? sanitize_text_field((string) $data['category']) : 'General',
            'thumbnail' => isset($data['thumbnail']) ? esc_url_raw((string) $data['thumbnail']) : '',
            'version' => isset($data['version']) ? sanitize_text_field((string) $data['version']) : '1.0.0',
            'pack' => $pack,
        ];

        if ($allowed['slug'] === '') {
            return null;
        }

        return $allowed;
    }

    private static function collect_categories(array $templates): array
    {
        $categories = [];
        foreach ($templates as $template) {
            $categories[] = $template['category'];
        }

        $categories = array_values(array_unique($categories));
        sort($categories);

        return $categories;
    }

    private static function filter_templates(array $templates, string $category, string $search): array
    {
        $search = mb_strtolower($search);

        return array_filter($templates, static function (array $template) use ($category, $search): bool {
            if ($category !== 'all' && $template['category'] !== $category) {
                return false;
            }

            if ($search === '') {
                return true;
            }

            $haystack = mb_strtolower($template['title'] . ' ' . $template['slug'] . ' ' . $template['category']);
            return strpos($haystack, $search) !== false;
        });
    }
}
