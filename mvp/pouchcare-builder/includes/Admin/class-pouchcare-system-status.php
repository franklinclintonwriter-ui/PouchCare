<?php
if (!defined('ABSPATH')) {
    exit;
}

class PouchCare_System_Status
{
    public static function render(): void
    {
        if (!PouchCare_Security::can_manage()) {
            wp_die('Forbidden');
        }

        global $wp_version;

        $php = phpversion() ?: 'Unknown';
        $theme = wp_get_theme();
        $is_multisite = is_multisite() ? 'Yes' : 'No';

        $stylesheet = (string) $theme->get_stylesheet();
        $is_pouchcare_theme = in_array($stylesheet, ['pouchcare', 'pouchcare-theme'], true)
            || stripos((string) $theme->get('Name'), 'pouchcare') !== false;

        $checks = [
            ['label' => 'WordPress Version', 'value' => (string) $wp_version],
            ['label' => 'PHP Version', 'value' => (string) $php],
            ['label' => 'Multisite', 'value' => $is_multisite],
            ['label' => 'Active Theme', 'value' => (string) $theme->get('Name')],
            ['label' => 'PouchCare Theme Active', 'value' => $is_pouchcare_theme ? 'Yes' : 'No'],
            ['label' => 'Plugin Version', 'value' => POUCHCARE_BUILDER_VERSION],
        ];

        echo '<div class="wrap"><h1>PouchCare System Status</h1>';
        echo '<table class="widefat striped"><thead><tr><th>Check</th><th>Value</th></tr></thead><tbody>';

        foreach ($checks as $check) {
            echo '<tr><td>' . esc_html($check['label']) . '</td><td>' . esc_html($check['value']) . '</td></tr>';
        }

        echo '</tbody></table></div>';
    }
}
