---
status: done
area: core
---

# Build Tools: Linting and Validation

## Summary

`bun run hotfix` used to only concatenate source files; a successful build didn’t imply the source was lint-valid.

This item is considered done now that linting is integrated into the repo workflow and `hotfix` is gated on ESLint failures.

## What shipped

- ESLint 10 flat config added at `eslint.config.js` (replacing legacy `.eslintrc.*`).
- `package.json` scripts:
  - `lint`: runs ESLint across `src/plugins/**/*.js` and `src/build-tools/**/*.js`.
  - `hotfix`: now runs `lint` first and **stops the chain** if lint exits non-zero (errors).
- Lint policy: **warnings allowed** (including complexity), errors block `hotfix`.
- Targeted `no-unused-vars` strategy:
  - Model folders (`__models` / `_models`) exempted where bindings are used indirectly (serialization/registration patterns).
  - Hook/extension surface args preserved with per-line `eslint-disable-next-line no-unused-vars` where needed.

## Notes

- Complexity warnings were intentionally left as warnings (with local disables + TODOs added separately).
- If/when you want “warnings allowed, but don’t increase”, that’s a separate effort and not part of this item.

