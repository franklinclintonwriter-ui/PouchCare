<?php
/**
 * Plugin Name: PouchCare Builder
 * Plugin URI: https://pouchcare.com
 * Description: PouchCare block builder and template import plugin.
 * Version: 0.1.0
 * Requires at least: 6.5
 * Requires PHP: 8.1
 * Author: PouchCare
 * Text Domain: pouchcare-builder
 * License: GPL-2.0-or-later
 */

if (!defined('ABSPATH')) {
    exit;
}

define('POUCHCARE_BUILDER_VERSION', '0.1.0');
define('POUCHCARE_BUILDER_FILE', __FILE__);
define('POUCHCARE_BUILDER_PATH', plugin_dir_path(__FILE__));
define('POUCHCARE_BUILDER_URL', plugin_dir_url(__FILE__));

require_once POUCHCARE_BUILDER_PATH . 'includes/class-pouchcare-builder.php';

PouchCare_Builder::instance();
