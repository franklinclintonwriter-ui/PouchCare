.PHONY: install dev build lint format typecheck validate clean help

# Default target
help: ## Show this help
	@echo "Design System Bootstrapper - Figma Plugin"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	npm install

dev: ## Start development watch mode
	npm run dev

build: ## Build production bundle
	npm run build

lint: ## Run ESLint
	npm run lint

format: ## Format code with Prettier
	npm run format

typecheck: ## Run TypeScript type checker
	npm run typecheck

validate: build ## Build and validate manifest + bundle
	node scripts/validate-manifest.js

clean: ## Remove build artifacts
	rm -rf dist/ node_modules/

check: lint typecheck build validate ## Run all quality checks

import: build ## Build and show import instructions
	node scripts/import-plugin.js

release: check ## Full release build with validation
	@echo "Release build complete. Import manifest.json into Figma Desktop."
