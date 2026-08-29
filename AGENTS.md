# Repository Guidelines

## Project Structure & Module Organization

أثر is an Arabic-first static wiki built with Vite and TypeScript.

- `src/` contains the application: components, routing, utilities, styles, design tokens, and brand/data definitions.
- `src/articles/` contains lazy-loaded article modules. Start from `src/articles/_template.ts` and register each article in `src/data/registry.ts`.
- `scripts/` contains the article editor, its tests, service-worker tests, and sitemap generation.
- `public/` contains logos, PWA files, and static assets.
- `.github/` contains CI, Dependabot, and issue and pull request templates.

## Build, Test, and Development Commands

The project requires Node.js 26 or newer:

```bash
npm install                  # Install dependencies
npm run dev                  # Start the local Vite server
npm test                     # Run Node.js tests
npm run typecheck            # Type-check without emitting files
npm run lint                 # Check source with Oxlint
npm run format:check         # Check formatting with Prettier
npm run build                # Type-check, build dist/, and generate the sitemap
npm run preview              # Preview the production build
npm run article:editor       # Start the local article editor
```

Use `SITE_URL=https://example.com npm run build` for deployment builds.

## Coding Style & Naming Conventions

Use two-space indentation, single quotes, no semicolons, and explicit `.ts` import extensions. Use `PascalCase` for components, `camelCase` for functions and variables, and kebab-case for slugs such as `prophet-muhammad-birth`. No formatter or linter is configured; TypeScript enforces type and unused-code checks. Preserve RTL, Arabic-first copy, hash routes, lazy loading, and semantic HTML.

## Testing Guidelines

Tests use Node’s built-in `node:test` runner and live beside relevant tools as `*.test.mjs`. Add tests for new behavior and failure paths. Run `npm test` and `npm run build` before opening a pull request. No coverage threshold is configured.

## Open-Source Contribution Rules

Read [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing. Search existing issues first, and open one before implementing a large change. Keep pull requests focused on one goal. Explain the problem, change, and verification; link an issue when relevant. Include screenshots for visible changes, direct sources for historical additions, and accessibility and text-direction checks for UI changes.

## Commit & Review Guidelines

Use short Conventional Commit-style subjects, such as `fix(article): improve mobile reading settings` or `chore: prepare site and article UX`. Keep cleanup separate, respond to review feedback, and do not commit build output or rely on local secrets.

## Security & Configuration

Never commit secrets, personal data, or unverified historical claims. Report vulnerabilities privately according to [SECURITY.md](SECURITY.md), not through a public issue. Keep `SITE_URL` out of application code and set it only in the build environment or hosting configuration.

## Licensing

The application code is MIT-licensed; original articles and documentation use [CC BY-SA 4.0](LICENSE-CONTENT.md). Contribute only work you own or have permission to publish. Keep third-party source, image, font, logo, and trademark terms and attribution intact.
