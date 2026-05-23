<?php
if (!defined('ABSPATH')) {
    exit;
}

function pouchcare_theme_setup(): void
{
    load_theme_textdomain('pouchcare', get_template_directory() . '/languages');

    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('editor-styles');
    add_theme_support('wp-block-styles');
    add_theme_support('responsive-embeds');
    add_theme_support('custom-logo', [
        'height' => 80,
        'width' => 220,
        'flex-height' => true,
        'flex-width' => true,
    ]);
    add_theme_support('html5', ['search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script']);

    add_editor_style('assets/css/editor.css');

    register_nav_menus([
        'primary' => __('Primary Menu', 'pouchcare'),
        'footer' => __('Footer Menu', 'pouchcare'),
    ]);
}
add_action('after_setup_theme', 'pouchcare_theme_setup');

/**
 * Register block style variations referenced in templates/patterns (e.g. is-style-pouchcare-card).
 */
function pouchcare_register_block_styles(): void
{
    if (!function_exists('register_block_style')) {
        return;
    }

    register_block_style(
        'core/group',
        [
            'name'  => 'pouchcare-card',
            'label' => __('PouchCare card', 'pouchcare'),
        ]
    );
}
add_action('init', 'pouchcare_register_block_styles');

/**
 * Google Fonts stylesheet URL for Plus Jakarta Sans / Inter when referenced in saved or default stacks.
 * Filter `pouchcare_google_fonts_url` to replace or return empty string to skip. Filter `pouchcare_enable_google_fonts` as false to disable.
 */
function pouchcare_get_google_fonts_stylesheet_url(): ?string
{
    if (!apply_filters('pouchcare_enable_google_fonts', true)) {
        return null;
    }

    $tokens = get_option('pouchcare_design_tokens', null);
    $heading = (is_array($tokens) && !empty($tokens['headingFont']) && is_string($tokens['headingFont']))
        ? $tokens['headingFont']
        : 'Plus Jakarta Sans, sans-serif';
    $body = (is_array($tokens) && !empty($tokens['bodyFont']) && is_string($tokens['bodyFont']))
        ? $tokens['bodyFont']
        : 'Inter, sans-serif';

    $families = [];
    if (preg_match('/plus[\s-]*jakarta[\s-]*sans/i', $heading)) {
        $families[] = 'family=' . rawurlencode('Plus Jakarta Sans') . ':wght@400;500;600;700';
    }
    if (preg_match('/(?<![a-z])inter(?![a-z])/i', $body)) {
        $families[] = 'family=' . rawurlencode('Inter') . ':wght@400;500;600';
    }

    if ($families === []) {
        return null;
    }

    $built = 'https://fonts.googleapis.com/css2?' . implode('&', $families) . '&display=swap';
    $filtered = apply_filters('pouchcare_google_fonts_url', $built);

    return is_string($filtered) && $filtered !== '' ? $filtered : null;
}

function pouchcare_theme_fonts_preconnect(): void
{
    if (pouchcare_get_google_fonts_stylesheet_url() === null) {
        return;
    }
    echo '<link rel="preconnect" href="https://fonts.googleapis.com">' . "\n";
    echo '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' . "\n";
}
add_action('wp_head', 'pouchcare_theme_fonts_preconnect', 2);

function pouchcare_theme_assets(): void
{
    $font_deps = [];
    $font_url = pouchcare_get_google_fonts_stylesheet_url();
    if ($font_url !== null) {
        wp_enqueue_style('pouchcare-google-fonts', esc_url_raw($font_url), [], null);
        $font_deps[] = 'pouchcare-google-fonts';
    }

    wp_enqueue_style('pouchcare-main', get_template_directory_uri() . '/assets/css/main.css', $font_deps, '0.1.0');

    if (is_user_logged_in() || is_singular() || is_archive() || is_search()) {
        wp_enqueue_script('pouchcare-main', get_template_directory_uri() . '/assets/js/theme.js', [], '0.1.0', true);
    }
}
add_action('wp_enqueue_scripts', 'pouchcare_theme_assets');

function pouchcare_editor_google_fonts(): void
{
    $font_url = pouchcare_get_google_fonts_stylesheet_url();
    if ($font_url === null) {
        return;
    }
    wp_enqueue_style('pouchcare-google-fonts', esc_url_raw($font_url), [], null);
}
add_action('enqueue_block_editor_assets', 'pouchcare_editor_google_fonts', 5);

/**
 * Build :root CSS from PouchCare Builder–saved design tokens (option pouchcare_design_tokens).
 */
function pouchcare_build_design_token_root_css(): string
{
    $t = get_option('pouchcare_design_tokens', null);
    if (!is_array($t)) {
        return '';
    }

    $pick = static function (string $k, string $fallback) use ($t): string {
        return isset($t[$k]) && is_string($t[$k]) && $t[$k] !== ''
            ? esc_attr($t[$k])
            : esc_attr($fallback);
    };

    $primary = $pick('primaryColor', '#1E3A5F');
    $primaryDark = $pick('primaryDark', '#152A45');
    $cyan = $pick('accentCyan', '#5B8FA8');
    $gold = $pick('accentGold', '#B8860B');
    $orange = $pick('accentOrange', '#C17817');
    $heading = $pick('headingFont', 'Plus Jakarta Sans, sans-serif');
    $body = $pick('bodyFont', 'Inter, sans-serif');
    $rCard = $pick('borderRadiusCard', '6px');
    $rBtn = $pick('borderRadiusButton', '4px');

    return ':root{'
        . '--pc-color-primary:' . $primary . ';'
        . '--pc-color-primary-dark:' . $primaryDark . ';'
        . '--pc-accent-cyan:' . $cyan . ';'
        . '--pc-accent-gold:' . $gold . ';'
        . '--pc-accent-orange:' . $orange . ';'
        . '--pc-font-heading:' . $heading . ';'
        . '--pc-font-body:' . $body . ';'
        . '--pc-radius-card:' . $rCard . ';'
        . '--pc-radius-button:' . $rBtn . ';'
        . '--pc-radius:var(--pc-radius-card);'
        . '}';
}

function pouchcare_inline_design_tokens(): void
{
    $css = pouchcare_build_design_token_root_css();
    if ($css === '') {
        return;
    }
    if (wp_style_is('pouchcare-main', 'enqueued')) {
        wp_add_inline_style('pouchcare-main', $css);
    }
}
add_action('wp_enqueue_scripts', 'pouchcare_inline_design_tokens', 30);

function pouchcare_editor_inline_design_tokens(): void
{
    $css = pouchcare_build_design_token_root_css();
    if ($css === '') {
        return;
    }
    wp_register_style('pouchcare-token-overrides', false, [], '0.1.0');
    wp_enqueue_style('pouchcare-token-overrides');
    wp_add_inline_style('pouchcare-token-overrides', $css);
}
add_action('enqueue_block_editor_assets', 'pouchcare_editor_inline_design_tokens', 20);

/**
 * Format a font stack for theme.json (quoted family name when a single family).
 */
function pouchcare_theme_json_font_family(string $stack): string
{
    $stack = trim(wp_strip_all_tags($stack));
    if ($stack === '') {
        return '"Inter", sans-serif';
    }
    if (str_contains($stack, ',') || str_starts_with($stack, '"')) {
        return $stack;
    }

    return '"' . $stack . '", sans-serif';
}

/**
 * Merge saved Style Manager tokens into theme.json presets (editor + front).
 */
function pouchcare_filter_theme_json_with_design_tokens($theme_json)
{
    if (!class_exists('WP_Theme_JSON_Data')) {
        return $theme_json;
    }

    $tokens = get_option('pouchcare_design_tokens', null);
    if (!is_array($tokens)) {
        return $theme_json;
    }

    $data = $theme_json->get_data();
    if (!is_array($data)) {
        return $theme_json;
    }

    if (isset($data['settings']['color']['palette']) && is_array($data['settings']['color']['palette'])) {
        foreach ($data['settings']['color']['palette'] as &$entry) {
            if (!is_array($entry)) {
                continue;
            }
            $slug = $entry['slug'] ?? '';
            if (($slug === 'primary' || $slug === 'brand') && !empty($tokens['primaryColor'])) {
                $entry['color'] = $tokens['primaryColor'];
            } elseif ($slug === 'primary-dark' && !empty($tokens['primaryDark'])) {
                $entry['color'] = $tokens['primaryDark'];
            } elseif ($slug === 'accent-cyan' && !empty($tokens['accentCyan'])) {
                $entry['color'] = $tokens['accentCyan'];
            } elseif ($slug === 'accent-gold' && !empty($tokens['accentGold'])) {
                $entry['color'] = $tokens['accentGold'];
            } elseif ($slug === 'accent-orange' && !empty($tokens['accentOrange'])) {
                $entry['color'] = $tokens['accentOrange'];
            }
        }
        unset($entry);
    }

    if (isset($data['settings']['typography']['fontFamilies']) && is_array($data['settings']['typography']['fontFamilies'])) {
        foreach ($data['settings']['typography']['fontFamilies'] as &$ff) {
            if (!is_array($ff)) {
                continue;
            }
            $slug = $ff['slug'] ?? '';
            if ($slug === 'heading' && !empty($tokens['headingFont'])) {
                $ff['fontFamily'] = pouchcare_theme_json_font_family($tokens['headingFont']);
            }
            if ($slug === 'body' && !empty($tokens['bodyFont'])) {
                $ff['fontFamily'] = pouchcare_theme_json_font_family($tokens['bodyFont']);
            }
        }
        unset($ff);
    }

    if (!empty($tokens['borderRadiusButton']) && is_string($tokens['borderRadiusButton'])) {
        $radius = trim(wp_strip_all_tags($tokens['borderRadiusButton']));
        if ($radius !== '' && strlen($radius) <= 32) {
            if (!isset($data['styles']) || !is_array($data['styles'])) {
                $data['styles'] = [];
            }
            if (!isset($data['styles']['elements']) || !is_array($data['styles']['elements'])) {
                $data['styles']['elements'] = [];
            }
            if (!isset($data['styles']['elements']['button']) || !is_array($data['styles']['elements']['button'])) {
                $data['styles']['elements']['button'] = [];
            }
            if (!isset($data['styles']['elements']['button']['border']) || !is_array($data['styles']['elements']['button']['border'])) {
                $data['styles']['elements']['button']['border'] = [];
            }
            $data['styles']['elements']['button']['border']['radius'] = $radius;
        }
    }

    return new WP_Theme_JSON_Data($data, 'theme');
}
add_filter('wp_theme_json_data_theme', 'pouchcare_filter_theme_json_with_design_tokens', 100);

function pouchcare_register_pattern_category(): void
{
    if (!function_exists('register_block_pattern_category')) {
        return;
    }

    register_block_pattern_category('pouchcare', [
        'label' => __('PouchCare', 'pouchcare'),
    ]);

    register_block_pattern_category('pouchcare-sections', [
        'label' => __('PouchCare Sections', 'pouchcare'),
    ]);
}
add_action('init', 'pouchcare_register_pattern_category');

function pouchcare_theme_favicon_fallback(): void
{
    if (function_exists('has_site_icon') && has_site_icon()) {
        return;
    }

    $base = get_template_directory_uri() . '/assets/icons';
    echo '<link rel="icon" type="image/png" sizes="16x16" href="' . esc_url($base . '/favicon-16x16.png') . '">' . "\n";
    echo '<link rel="icon" type="image/png" sizes="32x32" href="' . esc_url($base . '/favicon-32x32.png') . '">' . "\n";
    echo '<link rel="apple-touch-icon" sizes="180x180" href="' . esc_url($base . '/apple-touch-icon.png') . '">' . "\n";
}
add_action('wp_head', 'pouchcare_theme_favicon_fallback', 1);
