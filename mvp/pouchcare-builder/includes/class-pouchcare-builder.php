<?php
if (!defined('ABSPATH')) {
    exit;
}

class PouchCare_Builder
{
    private static ?self $instance = null;

    public static function instance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    private function __construct()
    {
        $this->load_files();

        add_action('plugins_loaded', [$this, 'load_textdomain']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_assets']);

        PouchCare_Security::init();
        PouchCare_Auth::init();
        PouchCare_Licensing::init();
        PouchCare_Updater::init();
        PouchCare_Blocks::init();
        PouchCare_Admin::init();
        PouchCare_Template_Importer::init();
        PouchCare_Api::init();
        PouchCare_Admin_Api::init();
        PouchCare_Customer_Api::init();
        PouchCare_Content_Api::init();
        PouchCare_Analytics_Api::init();
        PouchCare_Marketplace_Api::init();
        PouchCare_Notifications::init();

        // Phone-home: license activation + heartbeat (instantiation-based, no ::init())
        new PouchCare_Phone_Home();
    }

    private function load_files(): void
    {
        require_once POUCHCARE_BUILDER_PATH . 'includes/Security/class-pouchcare-security.php';
        require_once POUCHCARE_BUILDER_PATH . 'includes/Auth/class-pouchcare-auth.php';
        require_once POUCHCARE_BUILDER_PATH . 'includes/Licensing/class-pouchcare-licensing.php';
        require_once POUCHCARE_BUILDER_PATH . 'includes/Updater/class-pouchcare-updater.php';
        require_once POUCHCARE_BUILDER_PATH . 'includes/Blocks/class-pouchcare-blocks.php';
        require_once POUCHCARE_BUILDER_PATH . 'includes/Admin/class-pouchcare-admin.php';
        require_once POUCHCARE_BUILDER_PATH . 'includes/Admin/class-pouchcare-settings.php';
        require_once POUCHCARE_BUILDER_PATH . 'includes/Admin/class-pouchcare-system-status.php';
        require_once POUCHCARE_BUILDER_PATH . 'includes/Import/class-pouchcare-import-log.php';
        require_once POUCHCARE_BUILDER_PATH . 'includes/Import/class-pouchcare-template-importer.php';
        require_once POUCHCARE_BUILDER_PATH . 'includes/Api/class-pouchcare-api.php';
        require_once POUCHCARE_BUILDER_PATH . 'includes/Api/class-pouchcare-admin-api.php';
        require_once POUCHCARE_BUILDER_PATH . 'includes/Api/class-pouchcare-customer-api.php';
        require_once POUCHCARE_BUILDER_PATH . 'includes/Api/class-pouchcare-content-api.php';
        require_once POUCHCARE_BUILDER_PATH . 'includes/Api/class-pouchcare-analytics-api.php';
        require_once POUCHCARE_BUILDER_PATH . 'includes/Api/class-pouchcare-marketplace-api.php';
        require_once POUCHCARE_BUILDER_PATH . 'includes/Notifications/class-pouchcare-notifications.php';
        require_once POUCHCARE_BUILDER_PATH . 'includes/Licensing/class-pouchcare-phone-home.php';
    }

    public function load_textdomain(): void
    {
        load_plugin_textdomain('pouchcare-builder', false, dirname(plugin_basename(POUCHCARE_BUILDER_FILE)) . '/languages');
    }

    public function enqueue_admin_assets(): void
    {
        wp_enqueue_style('pouchcare-builder-admin', POUCHCARE_BUILDER_URL . 'assets/css/admin.css', [], POUCHCARE_BUILDER_VERSION);
        wp_enqueue_script('pouchcare-builder-admin', POUCHCARE_BUILDER_URL . 'assets/js/admin.js', [], POUCHCARE_BUILDER_VERSION, true);
    }
}
