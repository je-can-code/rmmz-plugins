---
status: open
area: code-quality
---

# Proficiency: replace hardcoded actor conditional map seed

## Severity

**Medium** for correctness in games with more than six actors or non-contiguous actor IDs. **Low** for small default parties.

## Gain

**Low effort, high clarity.** Removes a known TODO and avoids silent empty lookups for actor 7+.

## Source

- `src/plugins/prof/_metadata/_pluginMetadata.js` — inside `initializeProficiencies`, after `classifyConditionals`:

```javascript
// TODO: fix this!
[ 1, 2, 3, 4, 5, 6 ].forEach(actorId =>
{
  this.actorConditionalsMap.set(actorId, Array.empty);
});
```

## Context

The map is pre-seeded for actors 1–6 only. Real projects can have larger rosters or DLC actors. The right fix likely derives keys from `$dataActors`, from parsed proficiency data, or lazily inserts on first access.

## Work

1. Define intended semantics: “all actors that exist in database” vs “only actors referenced in proficiency JSON.”
2. Replace the hardcoded loop; add a test in `test/plugins/` if a Proficiency VM harness exists or is added later.
3. If this uncovers missing config entries, document migration for existing `config.proficiency.json` files.

## Notes

- Fits well after or alongside `j-base-external-json-config-loader.md` for shared load helpers.
