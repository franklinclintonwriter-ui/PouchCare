# Production Rollout Checklist

1. Run CI pipeline and verify green status for PHP 8.1 and 8.2.
2. Generate deterministic release artifacts from `mvp/tools/scripts/package.ps1`.
3. Test activation on clean WordPress with PouchCare theme + builder.
4. Import all starter templates and verify block rendering.
5. Verify rollback by reinstalling previous artifact version.
