<?php
if (!defined('ABSPATH')) {
    exit;
}

/**
 * PouchCare Marketplace REST API.
 *
 * Provides endpoints for listing and installing marketplace items.
 *
 * GET  /pouchcare/v1/marketplace          — List available marketplace items
 * POST /pouchcare/v1/marketplace/install   — Install a marketplace item (simulated)
 */
class PouchCare_Marketplace_Api
{
    private const OPTION_KEY = 'pouchcare_marketplace_installed';

    public static function init(): void
    {
        add_action('rest_api_init', [self::class, 'register_routes']);
    }

    public static function register_routes(): void
    {
        register_rest_route('pouchcare/v1', '/marketplace', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'list_items'],
            'permission_callback' => [PouchCare_Security::class, 'can_manage'],
        ]);

        register_rest_route('pouchcare/v1', '/marketplace/install', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'install_item'],
            'permission_callback' => [PouchCare_Security::class, 'can_manage'],
        ]);
    }

    /**
     * Return available marketplace items with install status.
     */
    public static function list_items(\WP_REST_Request $request): \WP_REST_Response
    {
        $installed = get_option(self::OPTION_KEY, []);
        $items     = self::get_catalog();

        // Mark installed items
        foreach ($items as &$item) {
            $item['installed'] = in_array($item['id'], $installed, true);
        }
        unset($item);

        $category = sanitize_text_field($request->get_param('category') ?? '');
        $search   = sanitize_text_field($request->get_param('search') ?? '');

        if ($category && $category !== 'All') {
            $items = array_values(array_filter($items, fn($i) => $i['category'] === $category));
        }

        if ($search) {
            $q     = strtolower($search);
            $items = array_values(array_filter($items, fn($i) =>
                str_contains(strtolower($i['name']), $q) ||
                str_contains(strtolower($i['description']), $q)
            ));
        }

        return rest_ensure_response([
            'items' => $items,
            'total' => count($items),
        ]);
    }

    /**
     * Simulate installing a marketplace item.
     */
    public static function install_item(\WP_REST_Request $request): \WP_REST_Response
    {
        $item_id = sanitize_text_field($request->get_param('id'));
        if (empty($item_id)) {
            return new \WP_REST_Response(['error' => 'Item ID is required.'], 400);
        }

        // Verify item exists in catalog
        $catalog = self::get_catalog();
        $found   = null;
        foreach ($catalog as $item) {
            if ($item['id'] === $item_id) {
                $found = $item;
                break;
            }
        }

        if (!$found) {
            return new \WP_REST_Response(['error' => 'Item not found.'], 404);
        }

        // Check plan requirement
        $current_plan   = PouchCare_Licensing::get_current_plan();
        $plan_hierarchy = ['community', 'starter', 'growth', 'enterprise'];
        $current_rank   = array_search($current_plan, $plan_hierarchy, true);
        $required_rank  = array_search($found['requiredPlan'], $plan_hierarchy, true);

        if ($current_rank < $required_rank) {
            return new \WP_REST_Response([
                'error'        => 'Plan upgrade required.',
                'requiredPlan' => $found['requiredPlan'],
            ], 403);
        }

        // Mark as installed
        $installed = get_option(self::OPTION_KEY, []);
        if (!in_array($item_id, $installed, true)) {
            $installed[] = $item_id;
            update_option(self::OPTION_KEY, $installed);
        }

        return rest_ensure_response([
            'message' => 'Item installed successfully.',
            'item'    => array_merge($found, ['installed' => true]),
        ]);
    }

    /**
     * Return the static marketplace catalog.
     *
     * @return array<int, array<string, mixed>>
     */
    private static function get_catalog(): array
    {
        return [
            [
                'id'           => 'mp-001',
                'name'         => 'Business Starter',
                'description'  => 'Professional business template with hero, services, and contact sections.',
                'category'     => 'Starter Templates',
                'rating'       => 4.8,
                'installs'     => 1240,
                'requiredPlan' => 'starter',
            ],
            [
                'id'           => 'mp-002',
                'name'         => 'Portfolio Starter',
                'description'  => 'Clean portfolio layout with project gallery and about page.',
                'category'     => 'Starter Templates',
                'rating'       => 4.6,
                'installs'     => 890,
                'requiredPlan' => 'starter',
            ],
            [
                'id'           => 'mp-003',
                'name'         => 'Testimonial Carousel',
                'description'  => 'Animated testimonial slider with avatar, rating, and company info.',
                'category'     => 'Premium Blocks',
                'rating'       => 4.9,
                'installs'     => 2100,
                'requiredPlan' => 'growth',
            ],
            [
                'id'           => 'mp-004',
                'name'         => 'Pricing Table Pro',
                'description'  => 'Responsive pricing comparison table with toggle and feature list.',
                'category'     => 'Premium Blocks',
                'rating'       => 4.7,
                'installs'     => 1560,
                'requiredPlan' => 'starter',
            ],
            [
                'id'           => 'mp-005',
                'name'         => 'Schema Markup Generator',
                'description'  => 'Automatic JSON-LD schema generation for pages, posts, and products.',
                'category'     => 'SEO Tools',
                'rating'       => 4.5,
                'installs'     => 780,
                'requiredPlan' => 'growth',
            ],
            [
                'id'           => 'mp-006',
                'name'         => 'Meta Tag Optimizer',
                'description'  => 'Bulk edit meta titles and descriptions with AI suggestions.',
                'category'     => 'SEO Tools',
                'rating'       => 4.4,
                'installs'     => 650,
                'requiredPlan' => 'growth',
            ],
            [
                'id'           => 'mp-007',
                'name'         => 'WooCommerce Quick View',
                'description'  => 'Ajax-powered product quick view modal for WooCommerce stores.',
                'category'     => 'E-Commerce',
                'rating'       => 4.3,
                'installs'     => 430,
                'requiredPlan' => 'growth',
            ],
            [
                'id'           => 'mp-008',
                'name'         => 'Cart Abandonment Recovery',
                'description'  => 'Automated email recovery for abandoned WooCommerce carts.',
                'category'     => 'E-Commerce',
                'rating'       => 4.6,
                'installs'     => 920,
                'requiredPlan' => 'enterprise',
            ],
            [
                'id'           => 'mp-009',
                'name'         => 'Heatmap Tracker',
                'description'  => 'Visual heatmap recording of clicks, scrolls, and mouse movements.',
                'category'     => 'Analytics',
                'rating'       => 4.2,
                'installs'     => 340,
                'requiredPlan' => 'enterprise',
            ],
            [
                'id'           => 'mp-010',
                'name'         => 'Conversion Funnel',
                'description'  => 'Track visitor journeys through custom conversion funnels.',
                'category'     => 'Analytics',
                'rating'       => 4.5,
                'installs'     => 510,
                'requiredPlan' => 'growth',
            ],
            [
                'id'           => 'mp-011',
                'name'         => 'Form Builder Pro',
                'description'  => 'Drag-and-drop form builder with conditional logic and Zapier integration.',
                'category'     => 'Starter Templates',
                'rating'       => 4.7,
                'installs'     => 1870,
                'requiredPlan' => 'starter',
            ],
            [
                'id'           => 'mp-012',
                'name'         => 'White-Label Dashboard',
                'description'  => 'Remove PouchCare branding and apply your own logo and colors.',
                'category'     => 'Premium Blocks',
                'rating'       => 4.9,
                'installs'     => 210,
                'requiredPlan' => 'enterprise',
            ],
        ];
    }
}
