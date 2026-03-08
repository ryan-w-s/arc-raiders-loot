# ARC Raiders Loot Guide

Static loot keep/sell/recycle lookup for ARC Raiders, built with React, TypeScript, and Vite.

## Development

- Install deps: `bun install`
- Start dev server: `bun run dev`
- Run checks: `bun run precommit`

## GitHub Pages

- Production output builds into `docs/`
- The Vite base path is set for `https://ryanws.tech/arc-raiders-loot/`
- GitHub Pages should be configured to publish from `master` and the `/docs` folder
- `.nojekyll` is included via `public/.nojekyll` so static assets are served directly

To publish an update:

1. Run `bun run build`
2. Commit the source changes and updated `docs/` output
3. Push to `master`
