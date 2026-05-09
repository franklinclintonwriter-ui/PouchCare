<?php
if (!defined('ABSPATH')) {
    exit;
}

class PouchCare_Settings
{
    private const OPTION_KEY = 'pouchcare_builder_settings';
    private const ACTION_KEY = 'pouchcare_save_settings';

    public static function render(): void
    {
        if (!PouchCare_Security::can_manage()) {
            wp_die('Forbidden');
        }

        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            self::save();
        }

        $settings = self::get();

        echo '<div class="wrap"><h1>PouchCare Settings</h1>';
        echo '<form method="post">';
        wp_nonce_field(self::ACTION_KEY);

        echo '<table class="form-table" role="presentation"><tbody>';
        echo '<tr><th scope="row"><label for="default_status">Template import status</label></th>';
        echo '<td><select id="default_status" name="default_status">';
        foreach (['draft', 'pending'] as $status) {
            echo '<option value="' . esc_attr($status) . '" ' . selected($settings['default_status'], $status, false) . '>' . esc_html(ucfirst($status)) . '</option>';
        }
        echo '</select></td></tr>';

        echo '<tr><th scope="row"><label for="duplicate_mode">Duplicate template handling</label></th>';
        echo '<td><select id="duplicate_mode" name="duplicate_mode">';
        $modes = [
            'append-copy' => 'Create a copied page',
            'skip' => 'Skip when existing page title matches',
        ];
        foreach ($modes as $value => $label) {
            echo '<option value="' . esc_attr($value) . '" ' . selected($settings['duplicate_mode'], $value, false) . '>' . esc_html($label) . '</option>';
        }
        echo '</select></td></tr>';
        echo '</tbody></table>';

        submit_button(__('Save Settings', 'pouchcare-builder'));
        echo '</form></div>';
    }

    private static function save(): void
    {
        check_admin_referer(self::ACTION_KEY);

        $default_status = isset($_POST['default_status']) ? sanitize_text_field(wp_unslash($_POST['default_status'])) : 'draft';
        $duplicate_mode = isset($_POST['duplicate_mode']) ? sanitize_text_field(wp_unslash($_POST['duplicate_mode'])) : 'append-copy';

        if (!in_array($default_status, ['draft', 'pending'], true)) {
            $default_status = 'draft';
        }

        if (!in_array($duplicate_mode, ['append-copy', 'skip'], true)) {
            $duplicate_mode = 'append-copy';
        }

        update_option(self::OPTION_KEY, [
            'default_status' => $default_status,
            'duplicate_mode' => $duplicate_mode,
        ], false);

        echo '<div class="notice notice-success is-dismissible"><p>Settings saved.</p></div>';
    }

    public static function get(): array
    {
        $defaults = [
            'default_status' => 'draft',
            'duplicate_mode' => 'append-copy',
        ];

        $saved = get_option(self::OPTION_KEY, []);
        if (!is_array($saved)) {
            return $defaults;
        }

        return wp_parse_args($saved, $defaults);
    }
}

