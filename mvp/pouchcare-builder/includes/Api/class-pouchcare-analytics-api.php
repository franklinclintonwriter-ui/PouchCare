<?php
if (!defined('ABSPATH')) {
    exit;
}

class PouchCare_Analytics_Api
{
    private const DATA_SOURCE_DEMO = 'demo_fixture';

    public static function init(): void
    {
        add_action('rest_api_init', [self::class, 'register_routes']);
    }

    public static function register_routes(): void
    {
        register_rest_route('pouchcare/v1', '/analytics', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'get_analytics'],
            'permission_callback' => [PouchCare_Security::class, 'can_manage'],
            'args'                => [
                'start' => [
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ],
                'end' => [
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ],
            ],
        ]);

        register_rest_route('pouchcare/v1', '/analytics/pages', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'get_page_analytics'],
            'permission_callback' => [PouchCare_Security::class, 'can_manage'],
            'args'                => [
                'start' => [
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ],
                'end' => [
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ],
            ],
        ]);

        register_rest_route('pouchcare/v1', '/analytics/revenue', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'get_revenue'],
            'permission_callback' => [PouchCare_Security::class, 'can_manage'],
            'args'                => [
                'start' => [
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ],
                'end' => [
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ],
            ],
        ]);
    }

    // -------------------------------------------------------------------------
    // Aggregated analytics
    // -------------------------------------------------------------------------

    public static function get_analytics(WP_REST_Request $request): WP_REST_Response
    {
        $start = $request->get_param('start');
        $end   = $request->get_param('end');

        $data = [
            'period' => [
                'start' => $start ?: gmdate('Y-m-01'),
                'end'   => $end   ?: gmdate('Y-m-d'),
            ],
            'overview' => [
                'totalPageViews'  => 12847,
                'conversionRate'  => 3.2,
                'revenueMtd'      => 4250.00,
                'activeWebsites'  => 8,
            ],
            'dailyViews' => self::generate_daily_views(30),
            'leadSources' => [
                ['label' => 'Organic',  'value' => 45],
                ['label' => 'Direct',   'value' => 25],
                ['label' => 'Referral', 'value' => 20],
                ['label' => 'Social',   'value' => 10],
            ],
            'funnel' => [
                ['label' => 'Visitors',  'count' => 12847, 'percentage' => 100],
                ['label' => 'Leads',     'count' => 1028,  'percentage' => 8],
                ['label' => 'Customers', 'count' => 411,   'percentage' => 3.2],
            ],
            'simulated' => true,
            'source' => self::DATA_SOURCE_DEMO,
            'capabilities' => [
                'liveDataProvider' => false,
                'historicalSync'   => false,
                'dateFiltering'    => 'input_echo_only',
            ],
            'notes' => ['Analytics values are demo data for UI preview and integration scaffolding.'],
        ];

        return rest_ensure_response($data);
    }

    // -------------------------------------------------------------------------
    // Per-page analytics
    // -------------------------------------------------------------------------

    public static function get_page_analytics(WP_REST_Request $request): WP_REST_Response
    {
        $pages = [
            [
                'page'       => '/',
                'views'      => 4210,
                'bounceRate' => 32,
                'avgTime'    => 135,
                'simulated'  => true,
                'source'     => self::DATA_SOURCE_DEMO,
            ],
            [
                'page'       => '/pricing',
                'views'      => 2830,
                'bounceRate' => 28,
                'avgTime'    => 182,
                'simulated'  => true,
                'source'     => self::DATA_SOURCE_DEMO,
            ],
            [
                'page'       => '/templates',
                'views'      => 1940,
                'bounceRate' => 41,
                'avgTime'    => 108,
                'simulated'  => true,
                'source'     => self::DATA_SOURCE_DEMO,
            ],
            [
                'page'       => '/docs',
                'views'      => 1620,
                'bounceRate' => 25,
                'avgTime'    => 250,
                'simulated'  => true,
                'source'     => self::DATA_SOURCE_DEMO,
            ],
            [
                'page'       => '/blog/getting-started',
                'views'      => 1150,
                'bounceRate' => 38,
                'avgTime'    => 155,
                'simulated'  => true,
                'source'     => self::DATA_SOURCE_DEMO,
            ],
            [
                'page'       => '/blog/seo-tips',
                'views'      => 1097,
                'bounceRate' => 35,
                'avgTime'    => 202,
                'simulated'  => true,
                'source'     => self::DATA_SOURCE_DEMO,
            ],
        ];

        return rest_ensure_response($pages);
    }

    // -------------------------------------------------------------------------
    // Revenue metrics
    // -------------------------------------------------------------------------

    public static function get_revenue(WP_REST_Request $request): WP_REST_Response
    {
        $revenue = [
            'mtd'     => 4250.00,
            'ytd'     => 22850.00,
            'monthly' => [
                ['month' => 'Dec', 'amount' => 3200],
                ['month' => 'Jan', 'amount' => 3600],
                ['month' => 'Feb', 'amount' => 3900],
                ['month' => 'Mar', 'amount' => 4100],
                ['month' => 'Apr', 'amount' => 3800],
                ['month' => 'May', 'amount' => 4250],
            ],
            'simulated' => true,
            'source' => self::DATA_SOURCE_DEMO,
            'capabilities' => [
                'liveRevenueSync' => false,
                'bookingsLink'    => false,
            ],
            'notes' => ['Revenue values are demo-only and are not sourced from transactions.'],
        ];

        return rest_ensure_response($revenue);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Generate sample daily view counts.
     *
     * @param int $days Number of days.
     * @return int[]
     */
    private static function generate_daily_views(int $days): array
    {
        $views = [];
        $base  = 400;

        for ($i = 0; $i < $days; $i++) {
            $views[] = $base + intval(sin($i * 0.3) * 100) + wp_rand(0, 80);
        }

        return $views;
    }
}
