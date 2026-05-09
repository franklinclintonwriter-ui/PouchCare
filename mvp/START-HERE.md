# Start Here

1. Copy `mvp/pouchcare-theme` to `wp-content/themes/pouchcare`.
2. Copy `mvp/pouchcare-builder` to `wp-content/plugins/pouchcare-builder`.
3. Activate theme + plugin.
4. Open `PouchCare -> Templates` and import starter pages.
5. Open `PouchCare -> Settings` to configure duplicate/import defaults.
6. Open `PouchCare -> System Status` for environment checks.

## Branding
- Runtime assets are bundled.
- To refresh from `mvp/branding`, run:
  - `powershell -ExecutionPolicy Bypass -File mvp/tools/scripts/install-branding-assets.ps1`

## Local Runtime UAT (Docker)
- Start runtime: `npm run wpenv:start`
- Full UAT suite: `npm run uat:full`
- Core only: `npm run uat:run`
- Multisite smoke: `npm run uat:multisite`
- Rollback smoke: `npm run uat:rollback`
- Runtime URL: `http://localhost:8896`

## QA and Packaging
- Validate JSON: `powershell -ExecutionPolicy Bypass -File mvp/tools/qa/validate-json.ps1`
- Validate template contract: `powershell -ExecutionPolicy Bypass -File mvp/tools/qa/test-template-contract.ps1`
- Validate branding assets: `powershell -ExecutionPolicy Bypass -File mvp/tools/qa/test-branding-assets.ps1`
- Validate block manifests: `powershell -ExecutionPolicy Bypass -File mvp/tools/qa/test-block-manifests.ps1`
- Build release zips: `powershell -ExecutionPolicy Bypass -File mvp/tools/scripts/package.ps1`
