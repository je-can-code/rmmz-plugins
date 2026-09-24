# J-Difficulty: apply difficulty layers as hidden states

## Source

- `src/plugins/diff/core/__models/DifficultyBattlerEffects.js` (the `bparams` / `sparams` / `xparams` /
  `cparams` percentage arrays), plus `DifficultyMetadata.js`, `DifficultyLayer.js` and
  `DifficultyBuilder.js` beside it
- `src/plugins/diff/core/objects/Game_Actor.js` and `Game_Enemy.js` (the `param` / `sparam` / `xparam`
  overrides that multiply by the applied difficulty)
- `src/plugins/diff/core/windows/Window_DifficultyEffects.js` (lists what each layer changes)
- `ca/chef-adventure/data/config.difficulty.json` (17 layers)
- jmz-data-editor: `app/src/presentation/boards/difficulty/DifficultyBoard.tsx`,
  `app/src/core/domain/valueObjects/difficulty-parameters.ts` and `difficulty-config.ts`,
  `app/src/types/custom/Difficulty.d.ts`

## Context

Every difficulty layer carries its own hand-rolled parameter model: a percentage for each of the 8 base
parameters, 10 ex-parameters and 10 sp-parameters, once for actors and once for enemies. J-Difficulty
then overrides `param`, `sparam` and `xparam` on `Game_Actor` and `Game_Enemy` to multiply by whichever
layers are applied. That is a second, private copy of what RMMZ's trait system already does, and it only
reaches the parameters it was written for. `cparams`, the slot meant for custom registry parameters, is
carried through the metadata and the layer copies, but nothing ever applies it, and it is empty in all
17 of Chef Adventure's layers.

Jeremy's direction (2026-09-23): a layer names a state for actors and a state for enemies, and applying
the layer applies those states secretly. The states' traits carry the modifiers, so any trait works,
registry parameters included, and the States board becomes the one place a difficulty's numbers are
authored.

## Work

- Give each layer an actor state id and an enemy state id, and remove `DifficultyBattlerEffects` and its
  four arrays.
- Apply every enabled layer's states to the matching battlers without the state showing anywhere a
  player looks: no icon, no HUD strip, no status entry, no turn count, and nothing a cure can remove.
- Remove the `param` / `sparam` / `xparam` overrides.
- Have the difficulty scene describe a layer from its states' traits instead of from the arrays.
- In jmz-data-editor, replace the parameter arrays on the difficulty board with the two state pickers.
- Migrate Chef Adventure's six drive layers (011-016) into states, rebalanced so each is manageable on
  its own and in combination. The Favor and Challenge tiers (001-010) are removed rather than
  migrated.
- Give parameters a floor, so summed rates from several layers cannot drive one below it. MHP's
  existing floor of 1 stays as it is.

## Definition of done

- [ ] `grep -rn 'bparams\|xparams\|sparams\|cparams' src/plugins/diff/` returns nothing outside
      `_annotations.js` changelog text, and J-Difficulty defines no `param`, `sparam` or `xparam`
      override
- [ ] in-game: enable a layer whose enemy state carries ATK x150%. Enemies hit harder, the state appears
      in no status window, HUD strip or state list, and disabling the layer puts ATK back
- [ ] in-game: a layer whose state carries a registry parameter trait (a J-CriticalFactors parameter,
      for example) takes effect, which the arrays could never do
- [ ] the difficulty scene still tells the player what each layer does
- [ ] the difficulty board edits state ids, and Chef Adventure's `config.difficulty.json` carries no
      parameter arrays and no Favor or Challenge tiers
- [ ] no two drive layers' states touch the same parameter or tag: list each drive state's traits and
      tags, and no parameter appears under more than one drive
- [ ] the floor holds: a parameter pushed down by a drive and by the battler's own gear or states stops
      at its floor rather than reaching zero or below
- [ ] `bun run hotfix` green and coverage still 100%

## Notes

- **Convert with J-NaturalGrowth's Rate tags, not RMMZ ex-parameter traits.** J-Difficulty multiplies
  ex-parameters today (`xparam * percent`), and RMMZ's ex-parameter trait adds, so a trait conversion
  would change them: on a 5% evasion, x90% gives 4.5% where -10% gives -5%, and Bloody Exchange's CEV
  x0% has no additive equivalent at all. `<(PARAM)BuffRate:[N]>` keeps today's meaning: Rate multiplies
  base plus Plus, works on States, is read through `getAllNotes()`, and covers every engine parameter
  plus the registry ones (`cdm`, `dor`, `hcr` and the rest). Bloody Exchange becomes
  `<criBuffRate:[300]>` and `<cevBuffRate:[-100]>`.
- **Stacking changes meaning, and the design removes the question (decided 2026-09-23).** J-Difficulty
  multiplies enabled layers together (`Game_Temp.buildAppliedDifficulty`, one `*=` per layer), while
  Rate tags from several states sum (`naturalBuffRate` totals every note, then `calculatePlusRate`
  applies it once). Jeremy's calls: the Favor and Challenge tiers, the layers built to stack, are
  removed; the drives are rebalanced to work alone and together; parameters get a floor; and **drives
  are independent, so no two may touch the same parameter or effect**. With nothing shared, summing
  versus multiplying never comes up between drives. Today only Royal (016) breaks that rule: it shares
  MCR/TCR with Aqua (x0.2 today, x1.1 summed), and MRG/TRG (x25 against x9) and enemy REC (x0.2 against
  x1.1) with Viridian. The rebalance moves one side of each.
- **Rewards are not battler parameters.** `exp`, `gold`, `sdp`, `drops` and `encounters` scale what an
  enemy yields or how often encounters happen, and no trait expresses an enemy's yield. Decide whether
  they stay in config or move to party-side traits (EXR, `gdr`, `dor`), which changes who they scale.
- **The seams for "secretly" already exist, and J-Passive is the precedent.** J-Base draws traits from
  `buildTraitObjects()` and notes from `allStates()` (every tag reader goes through `getAllNotes()`, and
  nothing iterates `states()` to read tags). J-Passive extends both, which is how its passive states act
  fully without ever being added, and being added is what icons, turn counts, the HUD and cures all
  hang off. Extending the same two seams gives a layer's states both halves. Extending only the trait
  side would carry the numbers but hide the state from every notetag reader, and that is the half that
  makes this worth doing: a layer could carry `<tickSpeedPercent:N>` and speed up every state's ticks on
  whoever it is applied to, or anything else a state tag can express. `addState` is the one to avoid,
  since it brings the icon, the turns and the cure with it.
- **J-Passive-Conditional's rule tags are the exception.** `<autoApplyState>`, `<autoExecuteSkill>` and
  the rest are read by `AutoRuleManager` from `getPassiveStateSources()`, not from `getAllNotes()`, so
  they fire only if the layer states are registered as J-Passive sources. That does not require moving
  J-Difficulty under `passive/`: core can stay standalone on J-Base's seams, and a small bridge
  extension (`diff/ext/passive`, the way `diff/ext/affix` already bridges J-Passive-Affix) can register
  the states as sources. Moving the whole ship would also mean migrating Chef Adventure's `plugins.js`
  entry and the 10 event commands that call `j/diff/J-Difficulty` by name.
- Check what a save stores for the chosen layers before changing the layer shape.
