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

function pouchcare_theme_assets(): void
{
    wp_enqueue_style('pouchcare-main', get_template_directory_uri() . '/assets/css/main.css', [], '0.1.0');

    if (is_singular() || is_archive() || is_search()) {
        wp_enqueue_script('pouchcare-main', get_template_directory_uri() . '/assets/js/theme.js', [], '0.1.0', true);
    }
}
add_action('wp_enqueue_scripts', 'pouchcare_theme_assets');

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
