<?php
if (!defined('ABSPATH')) {
    exit;
}

class PouchCare_Updater
{
    private const UPDATE_API = 'https://api.pouchcare.com/v1/updates';
    private const CACHE_KEY = 'pouchcare_update_check';
    private const CACHE_TTL = 12 * HOUR_IN_SECONDS;
    private const OP_SOURCE_REMOTE = 'remote_update_api';
    private const OP_SOURCE_NONE = 'unavailable';
    private const OP_SOURCE_LOCAL_OPTION = 'local_option_store';
    private const OP_MODE_SIMULATED = 'simulated';

    public static function init(): void
    {
        add_filter('site_transient_update_plugins', [__CLASS__, 'inject_update_metadata']);
        add_filter('plugins_api', [__CLASS__, 'plugin_info'], 20, 3);
        add_action('rest_api_init', [__CLASS__, 'register_endpoints']);
    }

    public static function register_endpoints(): void
    {
        register_rest_route('pouchcare/v1', '/updates/check', [
            'methods'             => 'GET',
            'callback'            => [__CLASS__, 'check_for_updates_endpoint'],
            'permission_callback' => [PouchCare_Security::class, 'can_manage'],
        ]);

        register_rest_route('pouchcare/v1', '/updates/apply', [
            'methods'             => 'POST',
            'callback'            => [__CLASS__, 'apply_update_endpoint'],
            'permission_callback' => [PouchCare_Security::class, 'can_manage'],
        ]);

        register_rest_route('pouchcare/v1', '/updates/rollback', [
            'methods'             => 'POST',
            'callback'            => [__CLASS__, 'rollback_endpoint'],
            'permission_callback' => [PouchCare_Security::class, 'can_manage'],
            'args'                => [
                'previous_version' => [
                    'required' => true,
                    'type'     => 'string',
                ],
            ],
        ]);

        register_rest_route('pouchcare/v1', '/updates/changelog', [
            'methods'             => 'GET',
            'callback'            => [__CLASS__, 'changelog_endpoint'],
            'permission_callback' => [PouchCare_Security::class, 'can_manage'],
        ]);
    }

    public static function inject_update_metadata($transient)
    {
        if (empty($transient) || !is_object($transient)) {
            return $transient;
        }

        $update = self::get_cached_update_info();
        if (!$update) {
            return $transient;
        }

        $current_version = defined('POUCHCARE_BUILDER_VERSION') ? POUCHCARE_BUILDER_VERSION : '0.0.0';
        if (version_compare($current_version, $update['version'], '>=')) {
            // No update available — add to no_update list
            $plugin_file = self::get_plugin_file();
            if (!isset($transient->no_update)) {
                $transient->no_update = [];
            }
            $transient->no_update[$plugin_file] = (object) [
                'slug'        => 'pouchcare-builder',
                'plugin'      => $plugin_file,
                'new_version' => $current_version,
                'url'         => $update['homepage'] ?? '',
                'package'     => '',
            ];
            return $transient;
        }

        // Update available
        $plugin_file = self::get_plugin_file();
        $transient->response[$plugin_file] = (object) [
            'slug'         => 'pouchcare-builder',
            'plugin'       => $plugin_file,
            'new_version'  => $update['version'],
            'url'          => $update['homepage'] ?? '',
            'package'      => $update['download_url'] ?? '',
            'tested'       => $update['tested_wp'] ?? '',
            'requires'     => $update['requires_wp'] ?? '6.5',
            'requires_php' => $update['requires_php'] ?? '8.1',
        ];

        return $transient;
    }

    public static function plugin_info($result, $action, $args)
    {
        if ($action !== 'plugin_information') return $result;
        if (!isset($args->slug) || $args->slug !== 'pouchcare-builder') return $result;

        $update = self::get_cached_update_info();
        if (!$update) return $result;

        $current_version = defined('POUCHCARE_BUILDER_VERSION') ? POUCHCARE_BUILDER_VERSION : '0.0.0';

        return (object) [
            'name'          => 'PouchCare Builder',
            'slug'          => 'pouchcare-builder',
            'version'       => $update['version'] ?? $current_version,
            'author'        => '<a href="https://pouchcare.com">PouchCare</a>',
            'homepage'      => $update['homepage'] ?? 'https://pouchcare.com',
            'requires'      => $update['requires_wp'] ?? '6.5',
            'tested'        => $update['tested_wp'] ?? '',
            'requires_php'  => $update['requires_php'] ?? '8.1',
            'download_link' => $update['download_url'] ?? '',
            'sections'      => [
                'description' => $update['description'] ?? 'Professional WordPress website builder.',
                'changelog'   => $update['changelog'] ?? 'See release notes on pouchcare.com.',
            ],
        ];
    }

    public static function check_for_updates_endpoint(\WP_REST_Request $request): \WP_REST_Response
    {
        // Force fresh check
        delete_transient(self::CACHE_KEY);
        $update = self::fetch_update_info();
        $current = defined('POUCHCARE_BUILDER_VERSION') ? POUCHCARE_BUILDER_VERSION : '0.0.0';
        $has_remote_update = is_array($update) && !empty($update['version']);
        $latest = $update['version'] ?? $current;

        return rest_ensure_response([
            'currentVersion'  => $current,
            'latestVersion'   => $latest,
            'updateAvailable' => $has_remote_update ? version_compare($current, $latest, '<') : false,
            'downloadUrl'     => $update['download_url'] ?? null,
            'changelog'       => $update['changelog'] ?? null,
            'checkedAt'       => current_time('c'),
            'simulated'       => !$has_remote_update,
            'source'          => $has_remote_update ? self::OP_SOURCE_REMOTE : self::OP_SOURCE_NONE,
            'capabilities'    => [
                'check'        => true,
                'apply'        => self::OP_MODE_SIMULATED,
                'rollback'     => self::OP_MODE_SIMULATED,
                'realUpgrader' => false,
            ],
            'notes'           => $has_remote_update
                ? []
                : ['Update API unavailable; using safe no-update fallback.'],
        ]);
    }

    /**
     * Returns an array of changelog entries with version, date, and changes.
     *
     * @return array<int, array{version: string, date: string, changes: string[]}>
     */
    public static function get_changelog(): array
    {
        return [
            [
                'version' => '1.1.0',
                'date'    => '2026-05-01',
                'changes' => [
                    'Added automated plugin update system',
                    'Improved licensing validation flow',
                    'Fixed template rendering edge cases',
                ],
            ],
            [
                'version' => '1.0.1',
                'date'    => '2026-04-15',
                'changes' => [
                    'Patched security issue in REST endpoints',
                    'Improved caching performance',
                ],
            ],
            [
                'version' => '1.0.0',
                'date'    => '2026-03-20',
                'changes' => [
                    'Initial release of PouchCare Builder',
                    'Full WordPress site building capabilities',
                    'Multi-company management support',
                ],
            ],
        ];
    }

    /**
     * POST /pouchcare/v1/updates/apply
     * Simulates applying an update — stores new version in options and logs the event.
     */
    public static function apply_update_endpoint(\WP_REST_Request $request): \WP_REST_Response
    {
        $update = self::get_cached_update_info();
        $current = defined('POUCHCARE_BUILDER_VERSION') ? POUCHCARE_BUILDER_VERSION : '0.0.0';
        $new_version = $update['version'] ?? $current;

        // Store updated version in options (simulated — real update uses WP upgrader)
        update_option('pouchcare_simulated_version', $new_version);

        // Log the update in history
        $history = get_option('pouchcare_update_history', []);
        if (!is_array($history)) {
            $history = [];
        }
        $history[] = [
            'from'      => $current,
            'to'        => $new_version,
            'component' => $request->get_param('component') ?? 'pouchcare-builder',
            'timestamp' => current_time('c'),
            'action'    => 'update',
        ];
        update_option('pouchcare_update_history', $history);

        // Clear cached update info so next check is fresh
        delete_transient(self::CACHE_KEY);

        return rest_ensure_response([
            'success'    => true,
            'newVersion' => $new_version,
            'updatedAt'  => current_time('c'),
            'simulated'  => true,
            'operation'  => 'apply_update',
            'status'     => 'simulated_applied',
            'source'     => self::OP_SOURCE_LOCAL_OPTION,
            'capabilities' => [
                'realUpgrader'       => false,
                'writesPluginFiles'  => false,
                'recordsUpdateEvent' => true,
            ],
            'notes' => ['No plugin files were modified. This endpoint records a simulated update only.'],
        ]);
    }

    /**
     * POST /pouchcare/v1/updates/rollback
     * Simulates rolling back to a previous version.
     */
    public static function rollback_endpoint(\WP_REST_Request $request): \WP_REST_Response
    {
        $previous_version = $request->get_param('previous_version');
        $current = defined('POUCHCARE_BUILDER_VERSION') ? POUCHCARE_BUILDER_VERSION : '0.0.0';

        // Store rolled-back version in options (simulated)
        update_option('pouchcare_simulated_version', $previous_version);

        // Log the rollback in history
        $history = get_option('pouchcare_update_history', []);
        if (!is_array($history)) {
            $history = [];
        }
        $history[] = [
            'from'      => $current,
            'to'        => $previous_version,
            'component' => 'pouchcare-builder',
            'timestamp' => current_time('c'),
            'action'    => 'rollback',
        ];
        update_option('pouchcare_update_history', $history);

        delete_transient(self::CACHE_KEY);

        return rest_ensure_response([
            'success'      => true,
            'rolledBackTo' => $previous_version,
            'rolledBackAt' => current_time('c'),
            'simulated'    => true,
            'operation'    => 'rollback_update',
            'status'       => 'simulated_rollback',
            'source'       => self::OP_SOURCE_LOCAL_OPTION,
            'capabilities' => [
                'realRollback'       => false,
                'writesPluginFiles'  => false,
                'recordsUpdateEvent' => true,
            ],
            'notes' => ['No plugin files were modified. This endpoint records a simulated rollback only.'],
        ]);
    }

    /**
     * GET /pouchcare/v1/updates/changelog
     * Returns structured changelog data.
     */
    public static function changelog_endpoint(\WP_REST_Request $request): \WP_REST_Response
    {
        return rest_ensure_response([
            'changelog' => self::get_changelog(),
            'simulated' => true,
            'source'    => 'static_changelog',
            'capabilities' => [
                'remoteChangelog' => false,
            ],
        ]);
    }

    private static function get_cached_update_info(): ?array
    {
        $cached = get_transient(self::CACHE_KEY);
        if ($cached !== false) {
            return is_array($cached) ? $cached : null;
        }
        return self::fetch_update_info();
    }

    private static function fetch_update_info(): ?array
    {
        $license = PouchCare_Licensing::get_current_plan();
        $current_version = defined('POUCHCARE_BUILDER_VERSION') ? POUCHCARE_BUILDER_VERSION : '0.0.0';

        $response = wp_remote_get(self::UPDATE_API, [
            'timeout' => 10,
            'headers' => [
                'X-PouchCare-Plan'    => $license,
                'X-PouchCare-Version' => $current_version,
                'X-PouchCare-Site'    => home_url(),
            ],
        ]);

        if (is_wp_error($response) || wp_remote_retrieve_response_code($response) !== 200) {
            // Cache negative result to avoid hammering
            set_transient(self::CACHE_KEY, 'none', self::CACHE_TTL);
            return null;
        }

        $body = json_decode(wp_remote_retrieve_body($response), true);
        if (!is_array($body) || empty($body['version'])) {
            set_transient(self::CACHE_KEY, 'none', self::CACHE_TTL);
            return null;
        }

        set_transient(self::CACHE_KEY, $body, self::CACHE_TTL);
        return $body;
    }

    private static function get_plugin_file(): string
    {
        return defined('POUCHCARE_BUILDER_FILE')
            ? plugin_basename(POUCHCARE_BUILDER_FILE)
            : 'pouchcare-builder/pouchcare-builder.php';
    }
}
