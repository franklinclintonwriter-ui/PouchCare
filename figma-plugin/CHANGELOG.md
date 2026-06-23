# Changelog

All notable changes to the Design System Bootstrapper plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-15

### Added

- Theme system with 4 modes: DarkNeon, LightMinimal, EsportsBlackRed, CyberpunkPurpleCyan
- 14 color variables, 6 numeric variables, 2 string variables per mode
- 7 text styles (Display/H1-H3, Body/Regular-Caption, Mono/Data)
- 6 paint styles (Surface/Panel-Card, Accent/Primary-Secondary, Border/Default-Focus)
- 6 container component types: Centered, FullBleed, TwoColumn, Sidebar, Stack, Grid12
- 8 card types with 4 theme variants each (32 total): Generic, Game, Guide, Featured, Stats, FAQ, Profile, Pricing
- 4 page templates: Guide Hub, Game Showcase, FAQ & Support, Dashboard
- Theme preview system with color swatches, typography samples, and contrast validation
- Export system with JSON manifest, CSS custom properties, and Style Dictionary tokens
- Master orchestrator with bootstrap, rollback, and validation
- Plugin UI with action buttons, progress indicators, and status panel
- findOrCreate guards for idempotent re-runs
- Font fallback chain (Orbitron -> Inter, JetBrains Mono -> Fira Code)
- esbuild configuration with watch mode and production minification
- ESLint + Prettier code formatting
- TypeScript strict mode with branded types
