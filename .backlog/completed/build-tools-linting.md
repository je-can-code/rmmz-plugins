---
updated: 2026-05-24
---

# Build Tools: Linting and Validation

## Summary

`bun run hotfix` must not publish broken source. Lint runs before every full build/copy chain.

## What shipped

- **Oxlint** at `.oxlintrc.json`; `bun run lint` → `oxlint src/plugins src/build-tools`.
- **`hotfix`:** lint → `clean:out` → `build:all` (69 Vite ships) → `copy:to-all`; lint failures block the chain.
- Lint policy: fix errors; warnings may remain when justified (workspace + `.junie/guidelines.md`).
- Layout style (Allman braces, `eol-last: never`, line length) documented in guidelines; not all enforced by Oxlint yet.

## Historical note

Originally tracked against ESLint + Combiner™. ESLint flat config may still exist for reference; **Oxlint** is the active linter. Builds are **Vite-only** (see [`monorepo-vite-esm-plugin-migration.md`](monorepo-vite-esm-plugin-migration.md)).

## Notes

- Complexity refactors remain a separate item: [`eslint-complexity-refactors.md`](../unstarted/eslint-complexity-refactors.md) (title retained; applies to Oxlint complexity rules where enabled).
