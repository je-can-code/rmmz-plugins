# J-OneTimeItemBoost rewrite

Hold new automated tests and non-trivial fixes for J-OTIB until this plugin is rewritten from scratch.

## Motivation

The current One-Time Item Boost implementation is slated for a full redesign; investing in deep regression coverage or patching legacy behavior is deferred.

## Scope when tackled

- Replace or heavily refactor `src/plugins/otib/` and rebuild `out/J-OneTimeItemBoost.js`.
- Add a `test/plugins/otib/` harness (metadata + VM behavior) after the new design stabilizes.
