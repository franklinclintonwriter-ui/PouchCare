<?php
if (!defined('ABSPATH')) {
    exit;
}

class PouchCare_Admin
{
    public static function init(): void
    {
        add_action('admin_menu', [self::class, 'register_menu']);
    }

    public static function register_menu(): void
    {
        add_menu_page(
            __('PouchCare', 'pouchcare-builder'),
            __('PouchCare', 'pouchcare-builder'),
            'manage_options',
            'pouchcare-builder',
            [self::class, 'render_dashboard'],
            self::menu_icon(),
            58
        );

        add_submenu_page(
            'pouchcare-builder',
            __('Dashboard', 'pouchcare-builder'),
            __('Dashboard', 'pouchcare-builder'),
            'manage_options',
            'pouchcare-builder',
            [self::class, 'render_dashboard']
        );

        add_submenu_page(
            'pouchcare-builder',
            __('Settings', 'pouchcare-builder'),
            __('Settings', 'pouchcare-builder'),
            'manage_options',
            'pouchcare-settings',
            [PouchCare_Settings::class, 'render']
        );

        add_submenu_page(
            'pouchcare-builder',
            __('System Status', 'pouchcare-builder'),
            __('System Status', 'pouchcare-builder'),
            'manage_options',
            'pouchcare-system-status',
            [PouchCare_System_Status::class, 'render']
        );
    }

    public static function render_dashboard(): void
    {
        $logs = PouchCare_Import_Log::get_recent();
        echo '<div class="wrap"><h1>PouchCare Builder</h1>';
        echo '<p>Use Templates to import pages, Settings to tune behavior, and System Status for diagnostics.</p>';
        echo '<h2>Recent Template Imports</h2>';

        if (empty($logs)) {
            echo '<p>No import activity yet.</p></div>';
            return;
        }

        echo '<table class="widefat striped"><thead><tr><th>Time (UTC)</th><th>Template</th><th>Status</th><th>Reason</th></tr></thead><tbody>';

        foreach ($logs as $row) {
            echo '<tr>';
            echo '<td>' . esc_html((string) $row['time']) . '</td>';
            echo '<td>' . esc_html((string) $row['template']) . '</td>';
            echo '<td>' . esc_html((string) $row['status']) . '</td>';
            echo '<td>' . esc_html((string) $row['reason']) . '</td>';
            echo '</tr>';
        }

        echo '</tbody></table></div>';
    }

    private static function menu_icon(): string
    {
        $iconPath = POUCHCARE_BUILDER_PATH . 'assets/branding/plugin-icon-128x128.png';
        if (!file_exists($iconPath)) {
            return 'dashicons-layout';
        }

        $bytes = file_get_contents($iconPath);
        if ($bytes === false) {
            return 'dashicons-layout';
        }

        return 'data:image/png;base64,' . base64_encode($bytes);
    }
}
