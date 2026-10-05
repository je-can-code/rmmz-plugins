# HUD: one player unit, a skill ring, a reward toast, and a quieter screen

## Status

Unstarted. Planned with Jeremy on 2026-10-04, after a headless HUD review of Chef Adventure (Rupert
leading, every slot filled, captured calm, mid-fight, with L1 held, and the moment after a kill).
Jeremy: **"alright, yeah sign me up. Write down a hyper-detailed plan ... I'm gonna probably save it for
later."**

This is a living plan. Settle the open decisions below one at a time, record each with its date and his
words, and move it to "Decisions" when it lands.

One fix from the same review already shipped to the working tree, uncommitted on `main` at the time of
writing: J-ABS's `clearStates` re-entered `die()` once per tracked state, so a Bearcat carrying two
debuffs counted three times toward "Defeat 4 Bearcats" (and three Monsterpedia defeats). Guarded with
`_j._abs._clearingStates`, real-engine regression test, re-verified in game. It is not part of this item;
it only explains why the quest tracker in the review screenshots once read 3/4 after a single kill.

## Context

The player-facing HUD grew one frame at a time, one plugin per frame, and it shows:

- **Everything about "me" is split across the screen.** The portrait and bars sit flush in the
  bottom-left corner (J-HUD-PartyFrame), the action diamond sits bottom-center (J-HUD-InputFrame), and
  the food chain is a vertical strip on the far right edge (J-HUD-Food). Checking "how am I doing" is
  three glances.
- **The right edge is crowded and the left is nearly empty.** In a fight the right edge carries the
  clock, the dialog log, the loot log, the food strip, the action log and the minimap. The left carries
  the quest tracker and the party frame.
- **Frames collide because each plugin places itself without knowing the others.** J-Map's minimap
  auto-anchors bottom-right (`Sprite_MiniMap`, `boxWidth - w/2 - 10`) on top of J-Log's action log
  (`boxWidth - 600`, `boxHeight - h - 72`), hiding the end of long lines: a crit's damage number sat
  under the map. J-Log's dialog log (top-right, 700 wide) prints across the boss frame's HP bar (the
  boss window spans x 200 to 1712).
- **The input diamond speaks in internal names.** Slot labels are `inputType.toUpperCase()`
  (`Sprite_InputKeySlot.js:551`), so the item slot reads "USABLEITEM" and skills "SKILL1" through
  "SKILL4". No slot shows the button that fires it, even though the glyphs and device detection exist.
  A spell on cooldown is replaced by a red X icon (CA's `cooldownOverlayIconIndex` 90), so you cannot
  tell which spell is cooling. "Dash" draws at full size because `drawSprintNode` calls `setFontSize`
  and then `textSizeEx`, whose `resetFontSettings` undoes it.
- **Guard is invisible.** R1 guards whenever equipped gear grants a guard skill, and nothing on screen
  says so. Jeremy: "the player has NO IDEA that they have a guard functionality per the input panel
  right now lmao".
- **Rewards flood two channels at once.** One Bearcat kill wrote eight action-log lines (two members,
  each base AP plus three typed AP types), filling all eight visible rows and pushing the fight out.
  Over the character, EXP, gold, AP, each typed AP type, SDP and items each pop separately. Typed AP
  bypasses the existing per-type popup merge entirely (`TextPopManager.show` direct). Jeremy: "holy
  crap the actual visible popups over the character for exp/gold/AP/sdp/items is... a lot lmaoo".
- **Small defects on the way.** The clock prints a 24-hour hour with an AM/PM tag ("14:02 PM",
  `Window_Time.timeText`), the party frame's state timers collide (34px icon pitch against 18px
  one-decimal labels: "299.9" and "14.9" print as "299.914.9"), row-one timers tuck under row-two
  icons, the XP bar and a zero-padded "012" level sit on top of the portrait, and "IN COMBAT" / "FREE"
  float beside the bars as words.

Screenshots from the review (scratchpad, not kept): calm, combat, L1 held, post-kill, plus a captioned
crop sheet of the eight findings. Recreate them with the probe described under "Verification".

## Principles

Five rules the redesign is built from, taken from how action games that read well do it:

1. **Two speeds.** Fast information sits near the eyes (the character is at screen center), slow
   information goes to the edges.
2. **One glance per question.** "How am I?", "what can I press?", "what am I fighting?", "where am I
   going?" Each answer lives in one place.
3. **Breathe with combat.** The fight HUD appears while fighting and recedes while exploring, the way
   BotW's stamina wheel only shows while it drains. Anything that *changes* wakes it, so hiding never
   costs the player news.
4. **Shape, color and motion before text.** Readiness as a sweep, damage as the trail, numbers for when
   you look closer. Behavior over bespoke art: nothing here needs new art.
5. **Show the buttons.** Glyphs on the actions, for whichever device the player is holding.

## Source

- **Retired by this item:** `src/plugins/hud/ext/party/` (J-HUD-PartyFrame, `Window_PartyFrame`,
  `Sprite_ActorValue`), `src/plugins/hud/ext/input/` (J-HUD-InputFrame, `Window_InputFrame`, the seven
  `Sprite_*` slot sprites), `src/plugins/hud/ext/food/` (J-HUD-Food, `Window_FoodFrame`). About 5,450
  lines between them; only their metadata is tested.
- **J-HUD core it builds on:** `hud/core/managers/HudManager.js` (`canShowHud`, `canShowAllies`, the
  refresh / image-cache / input-frame request flags), `hud/core/services/HudInterferenceResolver.js`
  (alpha multiplier when the player stands under a frame), `hud/core/presenters/StateAfflictionHudPresenter.js`
  and `models/StateAfflictionHudLayoutSpec.js` (already supports `singleRow`, `polarityBacking`,
  `iconScale`), `hud/core/windows/Window_Frame.js` (sprite-cache base), `hud/core/scenes/Scene_Map.js`
  (`updateHudFrames`, `refreshHud`, `onPartyRotate`), `hud/core/objects/Game_System.js` (the saved
  `_hudVisible` / `_alliesVisible` flags).
- **J-Base pieces reused:** `Sprite_MapGauge` + `models/GaugeTrail.js` (the drain trail),
  `Window_Base.GAUGE_TYPES` (`Rectangle`, `Segmented`, `Pill`, `Radial`), `InputDeviceTracker`,
  `Sprite_Icon`, `Sprite_BaseText`, `Bitmap` device-scale rasterizing.
- **Plugins that hang off the retired frames and must move with them:**
  - J-ABS-Shield `abs/ext/shield/windows/Window_PartyFrame.js` and `sprites/Sprite_ActorValue.js`: a
    shield gauge composited over HP, plus a "(N)" value and an "Nx🛡" stack label, behind
    `if (J.HUD && J.HUD.EXT.PARTY)`.
  - J-Level-Sync `level/ext/sync/sprites/Sprite_ActorValue.js`: a sync icon, a blue outline, and
    "050 (101)" on the level value, behind `if (J.HUD && J.HUD.EXT && J.HUD.EXT.PARTY)`.
  - J-ABS `abs/core/objects/Game_Battler.js` `setEquippedSkill`: requests an input-frame refresh only
    `if (J.HUD && J.HUD.EXT.INPUT)`, though `requestRefreshInputFrame` lives on core's `HudManager`.
- **Input:** `abs/core/models/JABS_InputAdapter.js` (the `#canPerform*` gates, each returning a bare
  `false`), `abs/core/models/JABS_Battler.js` `getAttackData` (returns `[]` when
  `meetsSkillConditions` fails, so "no MP" is indistinguishable from "nothing equipped"),
  `tryDodgeSkill` (`canPaySkillCost`), `abs/ext/input/managers/IconManager.js`
  (`jabsInputTextForSymbol`, device-aware `\I[n]`), `abs/ext/input/managers/Input.js`
  (`getAllBindings('JABS')`, remap-aware), `abs/ext/input/_models/JabsInputSymbols.js`,
  `abs/ext/input/_models/JABS_StandardController.js` (guard on R1, `performGuard`),
  `abs/ext/food/input/Input.js` (binds `UsableItem` to the R2 symbol).
- **Rewards:** `abs/core/managers/JABS_Engine.js` `handleDefeatedEnemy`, `gainBasicRewards`,
  `gainExperienceReward`, `gainGoldReward`, `createRewardsLog` (carries a TODO to move logging into
  J-Log), `createLootLog`, `onItemPickedUp`, `battlerLevelup`, `battlerSkillLearn`;
  `apt/core/_models/JABS_Battler.js` (`gainAptitudeReward`, `createLogAp`);
  `apt/ext/typed/managers/JABS_Engine.js` (`distributeTypedAptitudeRewardsForMember`,
  `onTypedApGained`, `createLogApTyped`); `sdp/core/managers/JABS_Engine.js` (`onSdpRewardGranted` and
  its log); `popups/ext/abs/managers/JABS_Engine.js`, `JABS_PopupManager.js`,
  `JABS_PopupMergeController.js` (`routeRewardPop` already merges same-type rewards per character),
  `popups/ext/apt/managers/JABS_Engine.js`, `popups/ext/sdp/managers/JABS_Engine.js`.
- **Layout neighbors:** `log/core/scenes/Scene_Map.js` (the three log rects), `map/core/sprites/Sprite_MiniMap.js`
  (auto bottom-right), `time/core/windows/Window_Time.js` + CA's `timeWindowX/Y`, `hud/ext/boss/scenes/Scene_Map.js`
  (`bossFrameWindowRect`), `hud/ext/quest/scenes/Scene_Map.js`, `hud/ext/target` (CA params x 848, y 20).
- **Placement precedent:** `_base/core/sprites/Sprite_CaptionPlane.js` (captions sit above the tone but
  under J-Lighting's mask, "a caption ignores the hour and obeys the dark"; J-Popups parents popups to
  its own plane above the mask) and `Sprite_CharacterOverlay` (device-pixel snapping).
- **Chef Adventure:** `js/plugins.js` (J-HUD 44, PartyFrame 45, TargetFrame 46, BossFrame 47,
  InputFrame 48, Food 49, Dps 50 (off by param), J-Log 77, J-ABS-Shield 78, J-Level-Sync 64, J-Popups
  123 to 128), CE5 "Hide UI" / CE6 "Show UI" (the `hideHud` / `showHud` commands), CE60 "rdy2play" (the
  new-game event, which hides the HUD first), and the J-HUD commands CA uses: `hideHud` x2, `showHud`
  x2, `showAllies` x3, `hideAllies` x1, `refreshHud` x1, `refreshImageCache` x1. Nothing in CA's data
  references the three retired ships by name.

## Decisions

### D1. One player unit: settled 2026-10-04

Food, party and input become a single unit. Jeremy: "do you think… it would be better if the HUD was
one single unit? Like… in Ys? Except of course things that aren't 'the player' like the target frame
etc", then "It sounds like we would be making one unified HUD gathering: food, party, input. All as one
single unit. And yeah I think that would make space for the rest…"

The target frame, boss frame, quest tracker, clock, minimap and logs stay separate: they are about the
world, not the player.

### D2. Bottom-center: settled 2026-10-04

Jeremy: "that was why the input frame was in the bottom center to begin with: but the entire HUD for
the player data being bottom center makes even more sense." The diamond is the most-glanced element
mid-fight and the character stands at screen center, so a corner unit would roughly double the eye
travel.

### D3. A new ship, built fresh, replacing three: settled 2026-10-04

Jeremy: "Umm, new ship? Maybe since you know full well how my plugins look, and how to build them, you
should build this anew and we can just… turn off the three it's replacing?" Built from the proven parts
(gauges with trails, the state presenter, the slot sprites), not a copy of the old windows. The three
old ships are switched off in CA first and deleted once the new one has earned it in play.

### D4. L1 skills become a ring around the player: settled 2026-10-04

Jeremy: "If you didn't have to worry about inputs because they come and go as a ring around the player
when the skill trigger is held… that could be good." Holding L1 alone does nothing in JABS, so the ring
doubles as a free peek at the four skills.

### D5. The unit breathes with combat: settled 2026-10-04

Jeremy: "if the player data mostly auto-hid most of the data out of combat or after 10 seconds of no
combat then it would probably be a lot… more slick." JABS already models exactly that window: a
battler's in-combat countdown is 600 frames (`JABS_Battler` seeds `_inCombatWindowMax = 600`, refreshed
by `enterCombat`), and `isInCombat()` going false is "ten seconds since the last fight". Added in
discussion: anything that changes wakes the unit for a few seconds.

### D6. The food gauge keeps its segments: settled 2026-10-04

Jeremy: "would the good gauge still honor its segments and such?" (read as the food gauge; correct this
if he meant the resource bars, whose trails carry over either way). Yes: phase segments
proportional to duration, the per-state `<foodGroupColor>`, past phases drained, future phases muted,
the active phase draining live. It becomes a slim vertical meter beside the portrait.

## Open decisions

Each has a recommendation. None blocks writing code for the parts it does not touch. O3 and O4 are
leanings rather than decisions: Jeremy asked and agreed in passing, and neither has been confirmed.

- **O1. Which base buttons get a chip.** Recommended: the *reflex* buttons get none (✕ attack, □
  dash/dodge, L2 strafe: the fight tells you when, so the HUD only teaches them and reports failures).
  The *decision* buttons get a readiness chip, because their cooldowns, counts and costs are checked
  before committing: ○ offhand (Wordplay is 900 frames), △ tool (count), R2 food (count, or the burn
  skill while fed). Guard gets an R1 shield chip that exists only while equipped gear grants a guard
  skill. Jeremy, last word so far: "so basically you're suggesting that we don't even bother with the
  core buttons aside from maybe 'guard available' somewhere in 'the unit' lol. Hmm." Confirm.
- **O2. Four L1 pips in the unit.** Recommended: four tiny dots under the chips, lit when that skill is
  ready and affordable, so a 60-second Meltima can be checked without holding L1.
- **O3. Refused actions say why, on the player.** Jeremy, asking: "And a popup on failure when trying to
  execute stuff?" Recommended: yes, a short pop over the player ("No MP", "Cooling down", "Muted")
  through J-Popups, where the eyes already are. Design below, under "Refused actions".
- **O4. Rewards collapse into one ticking toast and one log line per kill.** Jeremy, on the toast that
  counts up while kills chain: "I mean yeah, I just didn't know how to build that." It is the gauge
  trail's trick pointed at numbers: a displayed value easing toward a real one. Typed AP stays visible
  ("the player needs to know they gained it"), folded into one line. Recommended: yes. This one is worth
  confirming before building, because it removes per-reward log lines and popups other plugins write
  today. Design below, under "Rewards".
- **O5. Who owns the toast.** Recommended: **J-Popups**, as an evolution of its reward merging. J-Popups
  already owns reward feedback and already aliases every reward seam; putting the toast in the HUD ship
  would make a HUD plugin suppress another family's popups. The toast anchors above the unit by screen
  position, not by reference.
- **O6. Where the rest goes.** Recommended, "one question per corner":
  - top-left: quest tracker, with the dialog log stacked under it (quest updates beside the quests)
  - top-center: boss frame (narrowed to its bar's real width, about 1100) and the target frame under it
  - top-right: clock and weather
  - bottom-left: action log and loot log, now that the party frame has vacated the corner
  - bottom-center: the player unit, the reward toast above it
  - bottom-right: minimap, alone
- **O7. The clock.** Recommended: drop the meridiem and keep 24-hour ("14:02"), since `timeText`
  already pads a 24-hour hour and its own JSDoc's example is "00:50". The alternative is 12-hour
  ("2:02 PM").
- **O8. The ship's name.** Placeholder only: J-HUD-PlayerUnit, `src/plugins/hud/ext/unit/`,
  `J.HUD.EXT.UNIT`, `PLUGIN_DESC_TAG` `HUD-UNIT`. Jeremy names it.
- **O9. Where tunables live.** The unit has a handful: quiet delay, wake duration, toast window, ring
  radius. Recommended: constants in the ship, because these are feel knobs rather than game data. If he
  wants them in the editor, they go in a CA config JSON with an editor board, never plugin parameters
  ("plugin params is worse IN EVERY WAY, EVERY TIME").
- **O10. Font.** The deferred font choice (Victor Mono, with `PixelOperator.ttf` the leading candidate)
  is unblocked now that the DPI smear is fixed, and the HUD is where it would show most. Recommended:
  a separate item, so the HUD change is judged on layout alone.

## Design

### The unit

A `Window_Frame` (J-HUD core's sprite-cache base) centered at the bottom with a 12px bottom margin,
transparent window chrome, one shared translucent backing (the HUD kit, below). Starting geometry at
1920x1080, to be tuned from screenshots:

```
 ┌──────────────────────────────────────────────────────────────┐
 │ [J]▬▬▬  -psn -bld +fed +hst                    ○    △    R2  R1│
 │ ┌────────┐▌HP ███████████████░░░░  326        [ ] [ ] [ ] [🛡]│
 │ │        │▌MP ██████████░░░░░░░░░  383        cd   3   ×6     │
 │ │ RUPERT │▌TP ███████░░░░░░░░░░░░  145         • • • •       │
 │ │     (!)│▌Lv 12 ━━━━━━━━━──────────                         │
 │ └────────┘ ^food                                              │
 └──────────────────────────────────────────────────────────────┘
```

- **Window:** about 760 x 176, x = (boxWidth - 760) / 2, y = boxHeight - 176 - 12.
- **Allies (Jerald):** a compact row above the portrait: mini face plus three hairline bars, no
  numbers, hidden when `$hudManager.canShowAllies()` is false.
- **Portrait:** 96px (down from 144), the leader's face. Swaps on party rotation (core's
  `onPartyRotate` already calls `refreshHud`), rebuilt on `refreshImageCache`.
- **Combat badge:** replaces the floating "IN COMBAT" / "FREE" words. While in combat a thin ring
  around the portrait (J-Base `GAUGE_TYPES.Radial`) drains over the 600-frame window, so "how long
  until free" reads without text. Out of combat it is absent.
- **Food meter:** the vertical segmented bar beside the portrait, 12px wide and portrait height,
  carrying everything D6 lists. The phase name shows small under it for about three seconds when the
  phase changes, then fades; the full list of phase names goes away.
- **Bars:** HP, MP, TP as `Sprite_MapGauge` with `GaugeTrail`, values at the left end as today, about
  240 wide. J-ABS-Shield's composite shield gauge sits over HP exactly as it does on the party frame.
- **XP line:** a thin line under the bars with "Lv 12" (not "012"). J-Level-Sync's indicator and
  "Lv 50 (101)" format hang off it.
- **States:** one row above the bars, debuffs first, then buffs, using the presenter's existing compact
  mode (`singleRow`, `polarityBacking`). Timers use a compact format that fits the pitch: under 10s
  "4.2", under 60s "45", otherwise "5m". Verify the pitch and font in a screenshot; the old collision
  was 4-5 character labels on a 34px pitch.
- **Readiness strip:** the O1 chips, about 64px each with 8px gaps: glyph in the corner (device-aware,
  remap-aware), the skill or item icon, an FF14-style recast sweep (a dark wedge that unwinds
  clockwise) with the seconds remaining large and centered, cost or count as a badge, dimmed when
  unaffordable. No slot-type labels: the glyph is the label. Empty chips are omitted, not drawn empty.
- **R1 guard chip:** present while `getGuardSkillId()` names a guard skill (gear grants one), absent
  otherwise; dimmed while that skill fails `meetsSkillConditions` (a guard with a cost the battler
  cannot pay right now), mirroring the check `JABS_Battler`'s guard data already makes.
- **L1 pips:** per O2.

### The HUD kit

One panel backing for every HUD element this item touches (the unit, the toast, the logs, the quest
tracker): a translucent dark rounded rectangle with a 1px light inner border, the same opacity and
corner radius everywhere. One type scale: title (quest name, toast), body (log lines, values), caption
(timers, badges, counts). A 12px safe margin from every screen edge. Logs and the quest tracker gain the
backing, which fixes their contrast on cliffs and snow.

### Breathing (presence)

Three states, decided by a pure service and applied as an alpha multiplier that composes with
`HudInterferenceResolver` (the same pattern its JSDoc describes: frames own their opacity, multipliers
layer on top):

- **Engaged:** the leader's JABS battler `isInCombat()`. Full presence.
- **Woken:** out of combat, within about 180 frames of a wake trigger. Full presence.
- **Quiet:** out of combat and nothing has woken it. The unit eases to alpha 0 (or a minimal sliver, to
  confirm in play), over about 20 frames.

**Presence is a local alpha only.** It never calls `$hudManager.requestShowHud()` or `requestHideHud()`,
and it reads `canShowHud()` fresh every frame rather than remembering it. A cutscene's CE5 must always
win, including when it lands after the unit has shown: CE60 "rdy2play" hides the HUD on every new game,
and `HudManager.update` processes a show and a hide requested in the same tick in that order, so the
hide stands. The review probe lost that race about half the time when it requested a show too early.

Wake triggers, detected by comparing a cheap snapshot each frame (no cross-plugin seams needed):
HP decreased, MP or TP spent (decreased), the set of non-passive state ids changed, the active food
phase changed, level changed, L1 pressed, any action button pressed. Regeneration (increases) does not
wake it, or regen would keep it awake forever. Independent of presence, the unit closes while
`$gameMessage.isBusy() || $gameMap.isEventRunning()` (as the old frames did) and hides entirely while
`$hudManager.canShowHud()` is false (CE5 / CE6, CE60).

### The L1 ring

- Shown while the SkillTrigger is held (`Input.getAllBindings('JABS')[JABS_Button.SkillTrigger]`, the
  `pageup` symbol), hidden on release, with a quick scale-in (J-ABS-Juice feel) and a fast fade out.
- Four slots at the face-button positions around the player, matching the old Skills diamond: top
  CombatSkill4 (△), left CombatSkill3 (□), right CombatSkill2 (○), bottom CombatSkill1 (✕). Each shows
  glyph, icon, name, cost, and the same recast sweep as the chips; unaffordable dims.
- **Placement:** screen-space, above J-Lighting's mask, never on the caption plane. The caption plane
  obeys the dark on purpose; "what can I press" must not. Positioned each frame from
  `$gamePlayer.screenX()` / `screenY()` with a radius cleared from the character's pattern height
  (measured per frame, never at construction: see the escribe lesson in memory), snapped to the device
  pixel grid like `Sprite_CharacterOverlay`, and clamped on-screen near map edges.
- On keyboard, glyphs come from the same remap-aware lookup, so the ring shows whatever keys
  CombatSkill1-4 are bound to.
- Hidden during messages and events, like the unit.

### Refused actions

Per O3, if it lands as recommended.

- **J-ABS (core):** each `JABS_InputAdapter.#canPerform*` gate learns to name its reason instead of
  returning a bare `false`. Reasons: `cooldown`, `cost`, `restricted` (muted, disabled, paralyzed),
  `empty`, `casting`, `gcd`, `npcInFront`, `noPermission`. `getAttackData`'s empty result is split so
  `cost` (`meetsSkillConditions` false) is distinguishable from nothing equipped. Then one seam,
  `JABS_Engine.prototype.onActionRefused(jabsBattler, slotKey, reason)`, empty by default. Only the
  player's presses can reach it: `JABS_InputAdapter` is driven solely by registered input controllers
  (`JABS_BaseController` registers itself), while AI battlers decide through `JABS_AiManager` and never
  touch the adapter. Dodging follows the same split: `tryDodgeSkill` (whose `canPaySkillCost` branch is
  where a dodge's cost refusal surfaces) is called only from the adapter, while AI dodges call
  `executeDodgeSkill` after a cost check of their own (`JABS_Battler`, around lines 5296-5306).
- **J-Popups-ABS:** aliases the seam and shows a short pop over the player for `cooldown`, `cost` and
  `restricted` only, with words from `TextManager` (owner-named, never literals). `casting`, `gcd` and
  `npcInFront` stay silent (mashing ✕ mid-cast must not spam), as does a cooldown on Mainhand (its 45
  frames are a rhythm, not a decision). Rate-limited to one pop per slot and reason per 30 frames.

### Rewards: one report, one toast, one log line

Per O4 and O5, if they land as recommended.

- **J-ABS (core):** a `JABS_RewardReport` model (the defeated enemy's name, EXP, gold, and an open list
  of further entries extensions add: AP, typed AP with its type key, SDP). `handleDefeatedEnemy` opens
  a report before `gainBasicRewards` and closes it after, then fires
  `JABS_Engine.prototype.onRewardsReported(report)`. Every reward is granted synchronously inside that
  alias chain (J-ABS, then J-SDP, J-Aptitude and J-Aptitude-Typed all alias `gainBasicRewards` or
  `gainAptitudeReward`), so one report sees all of them. `gainExperienceReward` and `gainGoldReward`
  record into the open report.
- **J-Aptitude, J-Aptitude-Typed, J-SDP:** record their amounts into the open report instead of writing
  their own log lines (`createLogAp`, `createLogApTyped`, and J-SDP's SDP line go away).
- **J-Log:** aliases `onRewardsReported` and writes one action-log line per kill: "Bearcat defeated · 48
  EXP · 12 G · 3 AP" with the typed AP icons inline, per-member AP only when the members' amounts
  differ. That retires `createRewardsLog`'s TODO ("extract this logging reference out of this plugin
  and into the J.LOG plugin"). Level-ups and skills learned keep their own lines: they are news.
- **J-Popups (per O5):** stops the over-character pops for EXP, gold, AP, typed AP and SDP, and feeds
  the toast from `onRewardsReported`. The toast keeps a tally per reward type; a report arriving within
  about 120 frames of the last adds to the same tally, and the displayed numbers ease toward the
  totals each frame (the `GaugeTrail` idea). When the window closes, it fades and resets. It shows what
  the party leader gained, so a party rotation closes the window and resets the tally: a running total
  must never change whose numbers it is counting mid-chain.
- **Items** keep their pickup pops over the character (loot is physical), stacked when the same item
  repeats ("Seared Meat ×3").
- **Out of scope:** rewards that never pass through a JABS kill (chests, quest turn-ins, event Change
  Gold) keep their current feedback.

## Work

One feature branch, one PR, in this order. Each step ends with `bun run hotfix` green.

1. **Move the reusable pieces into J-HUD core.** The seven slot sprites (`Sprite_BaseSkillSlot`,
   `Sprite_InputKeySlot`, `Sprite_SkillSlotIcon`, `Sprite_CooldownGauge`, `Sprite_CooldownTimer`,
   `Sprite_SkillCost`, `Sprite_SkillName`) and `Sprite_ActorValue` move to `hud/core/sprites/`, since a
   new ship may not import from another ship's tree. Gauge-type constants move out of
   `Window_PartyFrame.gaugeTypes` into a core model (`HudGaugeTypes`), so extensions depend on core
   rather than on a frame. The old ships keep working off the hoisted globals until step 9.
   - **This adds no new dependency to core, and that is worth saying out loud:** the slot sprites
     construct against `$jabsEngine.getPlayer1()` and read cooldowns and `JABS_Button`, but J-HUD core
     already declares `@base J-ABS` / `@orderAfter J-ABS`, checks a J-ABS version floor in
     `initialization.js`, and reads `$jabsEngine` in `StateAfflictionHudPresenter`. Moving rather than
     copying also keeps one definition of each global class name while the old ships still exist.
   - **The alternative:** the new ship owns the sprites outright and the three old ships are deleted in
     the same PR rather than switched off. Simpler tree, but no fallback while Jeremy plays with it.
2. **J-ABS seams.** `#canPerform*` reasons, the `getAttackData` split, `onActionRefused`,
   `JABS_RewardReport`, `onRewardsReported`. Change `setEquippedSkill`'s guard from
   `J.HUD.EXT.INPUT` to `J.HUD`, since the request lives on core's `HudManager`.
3. **Reward producers report.** J-Aptitude, J-Aptitude-Typed and J-SDP record into the report; their
   per-reward log lines go. J-Log writes the summary line.
4. **The new ship's skeleton.** `hud/ext/unit` (per O8): `_metadata` (meta, annotations,
   initialization with `J.HUD.EXT.UNIT`, the alias maps, `requiredBaseVersion` and J-HUD floor),
   `entry.js`, `vite.config.hud-unit.js`, `scenes/Scene_Map.js` (create, update, `refreshHud`,
   `handleRefreshInputFrame` and image-cache requests, the same acknowledge contract the party frame
   honored). Register in CA's `plugins.js` right after J-HUD.
5. **Services first, all pure and fully tested:** `HudPresence` (engaged, woken, quiet, from inputs),
   `PresenceSnapshot` (what changed between two frames), `RecastSweep` (cooldown ratio to wedge angle,
   quantized so redraws are rare), `SkillRingLayout` (slot offsets from player position, character
   height and screen bounds, with clamping), `CompactDuration` (the timer format), `ButtonGlyphs`
   (JABS_Button to bound symbol to glyph text, through `Input.getAllBindings` and
   `IconManager.jabsInputTextForSymbol`), `RewardTally` (merge window, eased display values).
6. **The unit window**, composed from the core sprites and J-Base gauges, in the order: portrait and
   allies, bars and XP, food meter, states, readiness strip, combat badge, presence. Extension seams
   for shield and level sync (`getOrCreateGaugeSprite(actor, type, size)`, a hook after the resource
   gauges are placed, the level value sprite).
7. **The L1 ring** (`Sprite_SkillRing` on a screen-space layer above the lighting mask), and the R1
   guard chip.
8. **J-Popups:** the refusal pops (O3), the stacked item pops, the reward toast and the end of the
   per-reward pops (O4, O5). Steps 2 and 3's reward and refusal seams are only worth building once O3
   and O4 are confirmed; the unit itself (steps 1, 4 to 7) does not depend on either.
9. **Neighbors and retirement prep.** J-ABS-Shield and J-Level-Sync gain unit files behind
   `J.HUD.EXT.UNIT`, keeping their party-frame files until the old ship is deleted. Apply O6's layout
   (J-Log rects, boss frame width), O7's clock, and the HUD kit backings. In CA, switch PartyFrame,
   InputFrame and Food off (keep the entries).
10. **Verify in the engine** (below), then hand Jeremy the screenshots. Deleting the three old ships, their
    CA entries and the shield/sync party-frame files is a follow-up once he is happy in play.

## Testing

- **Services carry the logic** and get one `it` per branch, near-miss siblings for anything that
  selects, hardcoded expectations, and a `bun run mutate` pass. Views stay dumb: a condition in a
  window either moves to a service or is a delegation tested by mocking the service.
- **The view layer is measured from the first commit**, the way J-Classes was: add the new ship's
  `windows/`, `sprites/` and `scenes/` to coverage. Wiring tests go through
  `test/setup/rmmz-view-harness.js` (read `docs/testing-scenes-and-windows.md` first): the unit builds
  its sprites for a real leader, the readiness strip omits empty chips, the R1 chip exists only with a
  guard skill, shield and sync hang off the seams, the ring builds four slots and hides on release.
- **J-ABS:** each refusal reason as its own `it`, the `getAttackData` cost split, the report opening and
  closing around `gainBasicRewards` (with a second, unrelated kill proving reports do not bleed into
  each other), `onRewardsReported` firing once per kill.
- **Real engine where ordering matters:** the report's lifetime around the alias chain is worth a
  real-chain test, the way the death re-entry fix was proven.

## Verification

Headless, with the probe recipe from this review (memory, rmmz-plugins engine umbrella, "Headless
captures: five traps"): a private game copy, Xvfb at 1920x1080, `--use-gl=angle --use-angle=gl
--ignore-gpu-blocklist` (llvmpipe, so the 11200-tall IconSet renders), muted three ways, CE60 allowed to
finish before showing the HUD, Map014's ev2 autorun erased in `setupEvents`, waits in game frames.
Shots to hand Jeremy:

1. Exploring, quiet (the unit receded), then woken by poison damage.
2. Mid-fight, every slot filled, boss and target up, logs active.
3. L1 held: the ring around Rupert.
4. The moment after a natural kill: one log line, the toast, an item pop.
5. A refused action: Circle pressed while Wordplay cools down; a dodge with no MP.
6. Jerald leading (party rotation), and a shield up on the leader (J-ABS-Shield).
7. Keyboard: the glyphs switch to keys. `InputDeviceTracker` flips only on a real key event for a key
   in `Input.keyMapper`, and the probe has no keyboard, so either dispatch a synthetic keydown through
   the engine's key handler from the probe or check this one at the desk.

Layout needs screenshot iteration; expect two or three rounds of number tuning.

## Definition of done

- [ ] One unit, bottom-center, holding portrait, allies, bars with trails, XP with "Lv", states in one
      row with timers that never collide, the segmented food meter, the readiness strip and the combat
      badge
- [ ] The unit recedes ten seconds after combat ends, wakes on damage, spending, state, food-phase or
      level changes, and ignores regeneration
- [ ] Holding L1 shows the four skills around the player with glyphs and recast sweeps, legible in an
      unlit room
- [ ] Every chip and ring slot shows the glyph for the device in hand, remaps included; no slot-type
      text anywhere
- [ ] R1 guard is visible whenever gear grants a guard skill, and absent otherwise
- [ ] (O3) A refused Circle, Triangle, R2 or L1 skill says why over the player; mashing ✕ mid-cast stays
      silent
- [ ] (O4) One kill writes one action-log line; the toast ticks up across a chain of kills; items stack
- [ ] No two HUD elements overlap at 1920x1080 in any of the verification shots
- [ ] The clock reads per O7
- [ ] J-ABS-Shield and J-Level-Sync work on the unit
- [ ] CE5/CE6 hide and show it, `hideAllies` / `showAllies` and `refreshImageCache` still work
- [ ] `bun run hotfix` green, coverage 100% with the new ship's view layer measured, mutation survivors
      triaged
- [ ] Jeremy has played with it and approved; only then are the three old ships deleted

## Not this

- **Kingdom Hearts portrait ring** for HP (HP wrapped around the portrait with J-Base's Radial gauge):
  compact and iconic, and a fine follow-up once the unit exists. The combat badge uses the same idea at
  a smaller scale.
- **Celeste-style tells on the sprite** (Rupert glows when Meltima is ready, sulks when Hangry):
  delightful, and a separate behavior item.
- **Nier-style HUD chips** (readouts installed into the Node Junction in-world): floated, not wanted
  for now.
- **A HUD layout options menu.** When an options setting for input glyph style came up (2026-07-29),
  Jeremy turned it down himself ("No options."), on the grounds that the player who most needs a thing
  never opens the options menu to find it. The same reasoning applies here, and fixed positions that
  never collide make a layout setting unnecessary.
- **A shared screen-anchor registry** so frames negotiate space automatically: the honest fix for
  "each plugin places itself blind", but O6's fixed layout solves today's collisions without a new
  system.

## Notes

- **The three retired ships have almost no tests** (metadata only), so nothing of value is lost in
  coverage; the new ship starts measured.
- **`Sprite_SkillSlotIcon` reads `J.HUD.EXT.INPUT`** (the cooldown overlay icon parameter). Moving it to
  core means that read moves with it; the red X overlay is retired by the recast sweep anyway.
- **The ring and the chips must measure the character every frame.** `Sprite_Character.patternHeight()`
  is zero until the image loads; anything sized at construction works in testing and fails cold.
- **Typed AP's popups never merged** because `onTypedApGained` calls `TextPopManager.show` directly
  rather than `JABS_PopupMergeController.routeRewardPop`; the toast makes that moot.
- **The combat window is a JABS battler field** (`_inCombatWindowMax`, 600) with a setter, so if the
  quiet delay ever needs to differ from combat's, it is a HUD constant, not a JABS change.
- **Things the review found that this item fixes along the way:** the "Dash" font reset and the
  "USABLEITEM" / "SKILL1" labels (gone with the input frame), the colliding state timers, the "012"
  level, the minimap and dialog-log overlaps, the clock's meridiem.