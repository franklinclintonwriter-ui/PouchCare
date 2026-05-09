# Changelog

## 0.1.0
- Gutenberg-native PouchCare theme and builder baseline.
- 8 production block interfaces under `pouchcare/*`.
- Template import with validation, duplicate handling, and logging.
- CI validation + deterministic packaging pipeline.

## 0.1.1
- Expanded template library to 24 templates across SaaS, Clinic, Agency, Ecommerce, Education, and Nonprofit.
- Added template filters (category/search) in admin UI.
- Added template metadata visibility (pack/version/category).
- Added `/wp-json/pouchcare/v1/templates` endpoint.
- Added theme archive-family templates and style variation.
- Added template-contract QA script and CI step.

## 0.1.2
- Added generated PouchCare branding assets for plugin and theme runtime usage.
- Added favicon fallback output in theme when Site Icon is not configured.
- Added plugin admin menu custom icon fallback using bundled brand asset.
- Added branding installation script and branding QA validation gate.

## 0.1.3
- Replaced starter placeholders with 24 complete SEO-friendly templates using native WordPress blocks.
- Improved template content depth: H1/H2/H3 hierarchy, FAQ sections, conversion CTAs, and implementation steps.
- Updated template pack manifests to `1.2.0`.

## 0.1.4
- Completed default PouchCare theme page hierarchy with richer page layouts.
- Upgraded header/footer/sidebar template parts for production-ready default UX.
- Added missing theme fallback templates: `singular.html` and `attachment.html`.
- Refined single, archive, search, and front-page block structures for complete page coverage.

## 0.1.5
- Added Docker-based local runtime validation with `wp-env` configuration and npm scripts.
- Added executable UAT suites: core smoke, multisite smoke, rollback smoke, and full UAT runner.
- Normalized project text/json encodings to UTF-8 without BOM for clean activation/runtime behavior.
- Verified local production-readiness flows end-to-end on runtime URL `http://localhost:8896`.
