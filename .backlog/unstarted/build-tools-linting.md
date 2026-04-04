---
status: open
area: core
---

# Build Tools: Linting and Validation

## Summary

`bun run hotfix` currently only concatenates source files. A successful build
says nothing about code quality, undefined references, or broken notetag
annotations. Weave static analysis into the build pipeline so "built" actually
means "validated".

## Severity

**Medium** (bad code ships silently today).

## Gain

**Very high** once CI enforces it; upfront cost to tune ESLint + validators. Unlocks consistent style (`style-optional-chaining-drift.md`) and fewer annotation wiring bugs.

## Proposed Additions

### 1. ESLint (or similar)
- Add an ESLint config scoped to `src/plugins/**` that enforces the repo's
  coding standards: no `var`, no optional chaining, semicolons required,
  Allman brace style, etc.
- Run as a pre-build step; fail the build on errors.

### 2. Annotation Validator
- Parse `_annotations.js` files and verify that every `@param` declared in
  the `@plugindesc` block has a corresponding entry in `initialization.js`
  (and vice versa).
- Catches the class of bug where a parameter is wired in the plugin manager
  but never read, or is read under the wrong key name.

### 3. Dead-Export Detector
- Since plugin files are plain concatenated JS (no module bundler), a simple
  regex pass can flag prototype methods that are defined but never referenced
  anywhere in the same plugin's source tree.

### 4. Output Size / Sanity Check
- After concatenation, assert the output file is non-empty and above a
  minimum expected byte count (catches obliterator/race-condition failures
  silently passing).

## Integration Point

All steps should slot in between `clean:out` and `copy:to-all` in the hotfix
pipeline, or as a separate `lint` script that CI can run independently.

## Notes

- ESLint config must explicitly ignore `src/external/` (third-party files).
- False positives in the dead-export detector are expected; it should produce
  warnings, not errors, until the signal/noise ratio is understood.
- The TOCTOU race condition in the current build (`apt-typed` writing before
  its output dir exists) should be fixed as part of this work.
- Add `no-restricted-syntax` (or equivalent) to **forbid optional chaining** in `src/plugins/**` to support `style-optional-chaining-drift.md` enforcement.
- Annotation validation complements manual processes for `boolean-notetag-regex-audit.md` only indirectly; keep regex audit separate.
