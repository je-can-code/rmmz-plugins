---
completed: 2026-11-09
ship: J-ABS 4.28.0, J-SDP 4.9.0, J-Aptitude 2.1.0 and J-Level-Flat 1.1.0
---

# Breakables pay EXP: `<no:exp>`, `<no:gold>`, `<no:sdp>` and `<no:ap>`

## Severity

**High once `feat/inanimate-rewards` reaches main.** Every breakable in Chef Adventure pays EXP as if it were an enemy
of its own level. A harvest node or crate at a high level is a free level-up per break.

## Gain

Any enemy row can opt out of any one reward, by tag, without touching the rest. Breakables keep paying whatever
they are meant to pay, which is mostly nothing, and an inanimate enemy that should pay out still can.

## Source

- `src/plugins/abs/core/managers/JABS_Engine.js`: `canGainReward` (the shared gate, `true` for everyone),
  `determineExperienceGained` and `determineGoldGained`
- `src/plugins/level/ext/flat/managers/JABS_Engine.js`: its own `determineExperienceGained`, which pays from
  `ExperienceManager.calculateRewardFromLevelDifference` and never reads the row's EXP
- `src/plugins/sdp/core/managers/JABS_Engine.js`: `determineSdpGained`
- `src/plugins/apt/core/_models/JABS_Battler.js`: `determineApGained`
- `docs/notetag-reference.md`: one entry for the four tags
- `ca/chef-adventure/data/Enemies.json`: rows 1-100, the breakables

## Context

`f5573cda` "Let inanimate enemies pay out rewards" deleted J-CA-Mods' `canGainReward` override
(`src/plugins/__ca-mods/core/managers/JABS_Engine.js`), the rule that inanimate enemies never grant EXP, gold, SDP
or AP in Chef Adventure, so inanimate enemies could pay out on purpose. Breakables were relying on that rule. Their rows hold 0
gold, SDP and AP, so those already come out at nothing, but EXP under J-Level-Flat ignores the row and pays by level
difference alone. The 2026-11-04 read put a level 60 node at about a full level per break.

The fix is per reward, not per enemy: one tag per reward type, each checked where that reward is computed, so a row
can drop EXP and keep its gold.

## Work

1. Parse the tags on the enemy row through `RPGManager`, in the plugin that owns each reward: `<no:exp>` and
   `<no:gold>` in J-ABS, `<no:sdp>` in J-SDP, `<no:ap>` in J-APT.
2. Each `determine*` method returns 0 when its own tag is on the row. Check it beside the existing `canGainReward` call.
   The J-Level-Flat override reads the same `<no:exp>` as J-ABS does.
3. Add a `docs/notetag-reference.md` entry for the four tags. They take no ids, so no `notetag-id-targets` entry.
4. Tests: per site, one where the tag zeroes that reward and one where a sibling tag leaves it alone.
5. Chef Adventure: `<no:exp>` on every breakable row (1-100). Add the other three wherever a row's data does not
   already zero that reward.

## Definition of done

- [x] `bun run hotfix` green, every touched file at 100%
- [x] `docs/notetag-reference.md` has an entry naming `<no:exp>`, `<no:gold>`, `<no:sdp>` and `<no:ap>`
- [x] Every Chef Adventure enemy row from 1 to 100 that has a name carries `<noRewardPoints>`, which stops its EXP
- [x] in-game: break a high-level node with a low-level party, and no EXP lands in the log
- [x] in-game: defeat an ordinary enemy right after, and its EXP still lands

## Notes

Raised during the Chef Adventure enemy pass on 2026-11-08 and kept out of that PR on purpose, to land on its own.

Chef Adventure's breakables carry `<noRewardPoints>` rather than the four tags: J-ABS gained it alongside them, and
it stops every reward at once, which is what every breakable row wants. The four single tags are for a row that keeps
some of its rewards.

Checked in-game on 2026-11-09: `*Deposit (Iron)` at level 10, broken by a level 1 party, paid no EXP, gold or SDP, and
Ghosty, defeated right after, paid 25 EXP, 6 gold and 4 SDP.
