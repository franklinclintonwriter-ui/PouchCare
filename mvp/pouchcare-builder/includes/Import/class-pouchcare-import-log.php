<?php
if (!defined('ABSPATH')) {
    exit;
}

class PouchCare_Import_Log
{
    private const OPTION_KEY = 'pouchcare_import_logs';
    private const MAX_ROWS = 50;

    public static function add(string $template, string $status, string $reason = ''): void
    {
        $rows = get_option(self::OPTION_KEY, []);
        if (!is_array($rows)) {
            $rows = [];
        }

        $rows[] = [
            'time' => gmdate('c'),
            'template' => $template,
            'status' => $status,
            'reason' => $reason,
        ];

        if (count($rows) > self::MAX_ROWS) {
            $rows = array_slice($rows, -1 * self::MAX_ROWS);
        }

        update_option(self::OPTION_KEY, $rows, false);
    }

    public static function get_recent(int $limit = 10): array
    {
        $rows = get_option(self::OPTION_KEY, []);
        if (!is_array($rows) || empty($rows)) {
            return [];
        }

        $slice = array_slice($rows, -1 * $limit);
        return array_reverse($slice);
    }
}
