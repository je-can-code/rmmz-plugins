# Data validation CI for `ca`

## Source

- `ca/chef-adventure/data/**` (388 tracked JSON files, ~26MB)
- `ca/chef-adventure/js/plugins/j/**` (117 tracked files, mirrored from this repo by `hotfix`)
- `src/plugins/**/_metadata/initialization.js` (the `RegExp` tables)
- `docs/notetag-reference.md`
- `tools/verify-no-build-drift.js` (the symmetric check on this side of the seam)

## Context

`ca` has no CI at all, and the reflex answer is that an RMMZ project has nothing to build so there
is nothing to check. That mistakes compilation for validation.

**The editor is not the gap.** jmz-data-editor writes the `config.*.json` files and enforces integrity
within them as it goes; a check that re-litigates what the editor already guarantees is busywork. The
gap is that **`ca/chef-adventure/data` has three writers and only one of them knows about the others**:

- **jmz-data-editor** owns the `config.*.json` files and validates them.
- **RPG Maker MZ** owns `Actors`, `Classes`, `Skills`, `Items`, `Weapons`, `Armors`, `Enemies`, `Map*`.
  It has never heard of `config.crafting.json`, so deleting or renumbering a row there breaks references
  the editor is not running to catch.
- **`ca/tools/*.js`** bulk scripts move rows outright — `armor-reorder.js` permutes the entire
  `a301-a455` material block by design.

This has already fired once, at scale. From `tools/dead-drops.js`:

> the enemy `<drops:[a,ID,N]>` tags naming those rows were never updated, so **274 of them point at
> blank rows and drop nothing** — silently, because a drop tag naming a missing row is not an error,
> it is just a drop that never happens.

That is the shape of every bug this item is for: a reference living in MZ-owned data, pointing at
MZ-owned data, with no writer in the loop that had any reason to check it. It was found by hand and
repaired by a one-off script. The point of the check is that the next one is found by a runner in
under a second, and that the fix is a diff rather than an archaeology project.

So the value is concentrated in the **seams between writers**, not inside any one of them. For scale,
the config side alone holds roughly 6,500 outbound references into MZ-owned tables — 4,468 `id` +
`type` pairs in crafting, 903 `id` and 301 `mapId` in quests, 542 `masterySkillId` in SDP, 115
`skillId` / 115 `secondarySkillIds` / 112 `actorIds` in proficiency. Each one is valid when the editor
writes it and stays valid only for as long as nothing else moves the row it names.

## Work

Ordered by how much real breakage each one catches, which is to say by how wide a seam it covers.

- **Notetag reference resolution.** The `dead-drops` class, and the one with a proven body count.
  Parse every `note` field in MZ-owned data and resolve the ids the tags name — `<drops:[a,ID,N]>`
  against `Armors.json`, and the same for every other tag whose payload is an id. Needs this repo to
  expose its per-ship `RegExp` tables in a form a script can consume; that is the real
  rmmz-plugins-side deliverable, and `docs/notetag-reference.md` is the cross-check that the exported
  set is complete.
- **Notetag well-formedness.** Same walk, cheaper question: flag anything shaped like a J-tag that
  matches no known pattern at all. A typo'd `<sght:5>` parses as nothing and stays silent forever.
  Falls out of the exported regex tables for free once the previous item has them.
- **Config-to-database integrity.** Resolve the config side's outbound ids against the MZ tables that
  own them. This is the seam the editor cannot police, since MZ moves the target without it. One
  wrinkle the validator has to encode: crafting ingredients use `"id": 0` with a non-empty `categories`
  array as the category-match form, so id 0 is legal there and only a bug when `categories` is empty.
  That rule currently lives nowhere but Jeremy's head.
- **Plugin drift.** Nothing verifies that `ca`'s mirrored `j/` plugins match what this repo actually
  built. It is the same failure `verify:no-build-drift` catches here, unguarded on the far side of
  the copy.
- **Parse floor.** Parse all 388 files. Cheap, and it catches a truncated tool write or an interrupted
  editor save before it becomes a boot failure rather than after.
- **Housekeeping.** `chef-adventure/data/Classes.old.json` is tracked. MZ ignores it; a reader in two
  years will not. Fail the build on committed `*.old.json` / `*.backup*.json`.

## Definition of done

- [ ] one command runs the whole suite, in whichever repo the scope question in Notes settles on
- [ ] run against the current `ca` tree it reports clean: every id a notetag names resolves, every
      config-side outbound id resolves, all 388 data files parse
- [ ] the negative case is proven, not assumed: point an existing `<drops:[a,ID,N]>` at an empty
      armor row, re-run, and the check names the enemy and the id it could not resolve — then revert.
      This is the exact bug that shipped 274 times, so a suite that cannot catch it on purpose has
      not been tested
- [ ] a deliberately typo'd J-tag (`<sght:5>`) is reported as matching no known pattern
- [ ] `ca/chef-adventure/data/Classes.old.json` is gone, or the check fails on it
- [ ] the check is wired as a required status check on the `ca` ruleset

## Notes

- `ca` has no root `package.json`, so a runner has to be stood up before any of this can hang off a
  workflow. Small, but not zero — that is the first commit, not an afterthought.
- The ruleset on `ca` is active with no required status checks, because there is currently no check
  to require. Wire the first one in as a required check once it exists.
- Scope question worth settling before starting: does the validator live in `ca/tools/` next to the
  data it reads, or here next to the regex tables it needs? Splitting it across both repos is the
  obvious trap.
- Validation only. This is deliberately not a lint pass on content quality — no opinions about
  descriptions, balance, or naming.
- Do not re-check what jmz-data-editor already enforces on write. Every duplicated rule is a second
  place to update when the schema moves, and the copy in CI is the one that will be forgotten. If a
  check belongs to the editor, the fix for a gap in it is a fix in the editor.
- A `ca/tools/*.js` bulk script is the highest-risk writer in the repo and the easiest to run right
  before a commit. Worth considering whether the validator is also a thing those scripts call on their
  way out, rather than only a workflow step.
