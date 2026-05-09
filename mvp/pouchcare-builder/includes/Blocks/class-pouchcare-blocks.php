<?php
if (!defined('ABSPATH')) {
    exit;
}

class PouchCare_Blocks
{
    private const BLOCKS = [
        'hero',
        'features',
        'pricing',
        'testimonials',
        'cta',
        'faq',
        'contact',
        'footer',
    ];

    public static function init(): void
    {
        add_action('init', [self::class, 'register_shared_assets']);
        add_action('init', [self::class, 'register_blocks']);
    }

    public static function register_shared_assets(): void
    {
        wp_register_script(
            'pouchcare-block-factory',
            POUCHCARE_BUILDER_URL . 'assets/js/pouchcare-block-factory.js',
            ['wp-blocks', 'wp-block-editor', 'wp-components', 'wp-element', 'wp-i18n'],
            POUCHCARE_BUILDER_VERSION,
            true
        );

        wp_register_style(
            'pouchcare-block-shared-style',
            POUCHCARE_BUILDER_URL . 'assets/css/pouchcare-blocks.css',
            [],
            POUCHCARE_BUILDER_VERSION
        );
    }

    public static function register_blocks(): void
    {
        foreach (self::BLOCKS as $slug) {
            $path = POUCHCARE_BUILDER_PATH . 'blocks/' . $slug;
            if (is_dir($path)) {
                register_block_type($path, ['style' => 'pouchcare-block-shared-style']);
            }
        }
    }
}
