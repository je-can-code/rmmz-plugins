---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 4.26.2
  - Fixed every other event losing its `<teamId>`, `<noGlobalCooldown>` never matching, and `<visAnchor>` rejecting `1.0`.
  - `<visionMultiplier>` now scales its carrier's own sight and pursuit.
### 4.26.1
  - A battler that dies carrying states now dies once, so a kill counts once toward slay quests and defeat tallies.
### 4.26.0
  - Loot expires on time even out of sight. Diagonal path searches are faster and remember a failed search briefly.
    Requires J-Base 4.2.0.
### 4.25.1
  - Enemies take aim when a cast skill goes off, not when the cast begins.
### 4.25.0
  - An event whose page stops applying now forgets the battler that page described, rather than still reading as one.
    Added hooks for holding a page change back and for hearing when one lands.
### 4.24.0
  - Action events keep the event id they were built with, so an action can find its own data for its whole life rather
    than only while being constructed.
  - Game_Map#addEvent files an event at the slot its id names instead of hunting for a free one, which is what the
    invariant on that method always claimed.
### 4.23.0
  - Added the jabsSlotTransforms notetag to actors, classes, equipment and states, and
    Game_Battler#getSlotTransformSkillId to resolve one by slot.
### 4.22.0
  - Added JABS_Engine.toDisplacement, the shared conversion of a direction and a distance into a tile offset, so
    knockback, pull-forward and gap-close stop each carrying their own copy.
  - Added resolveKnockbackDistance, which a plugin can alias to introduce a knockback modifier without touching how the
    movement is carried out.
  - Action sprite facing is resolved from CardinalAxes and DiagonalCardinalComponents, a movement plugin's registration
    point for a different movement scheme.
### 4.21.0
  - A skill carrying no <proximity> tag is now castable from any distance rather than demanding the caster share a tile
    with its target, which nothing can do. An AI holding such a skill approached its target forever and never fired.
  - Evade procs and the vanilla fallback in addStateWithOverrides now name their source, so the application routes
    through JABS instead of landing as an inert vanilla state that never expires.
  - Added determineDodgeStepCount, the seam a movement extension restates a dodge's distance on. Aliasing the step
    setter instead also caught the per-step countdown.
### 4.20.1
  - A respawn-pending battler is now erased when its placement is refused, so a killed enemy no longer lingers on the
    map as an animating shell after a reload.
  - Forced displacement probes the tile it is standing on rather than the one it is reaching for, so knockback and
    pull-forward stop at the correct tile.
  - A skill slot resolving to no skill returns nothing instead of throwing, which could crash the HUD when a bitmap
    finished loading after a map transfer.
  - Removing a loot icon removes only that icon, and matches on the loot's uuid rather than on the uuid method, which
    had destroyed an unrelated drop.
### 4.20.0
  - Loot drops are now drawn toward a battler within their magnet radius, tunable per battler with <lootMagnetBuff:N>
    and <lootMagnetRate:N> and configured in data/config.jabs.json.
  - Added JABS_ActionOptions.withLocation, which copies an options set with only its location replaced.
  - Nameplates, gauges and affliction strips now hang off the character overlay, so they no longer squash, spin or blur
    along with a battler that is animating.
### 4.19.0
  - Added the Force Respawn plugin command, which frees every pending respawn record in the world at once regardless of
    the method each was scheduled with. It is the counterpart to the respawn tags rather than a bypass of them: a tag
    says how long a placement stays down if the player keeps playing, and this says that something happened which moved
    the world on - a night at an inn, a chapter break. Placements on the current map are rebuilt immediately; every
    other map is freed and rebuilds on the next visit. Permanence is honored unless the includePermanent argument
    overrules it, since <noRespawn> usually marks a story beat rather than a farmable placement.
  - The world-default respawn is now "seconds" at 120 rather than blank. A world where the dead stay dead until the
    player power-cycles the map is a world that asks the player to manage it; a blank method remains the deliberate
    opt-out for projects that want no timers anywhere.
### 4.18.0
  - Added respawn timers for defeated battlers. A defeated enemy may declare when it returns via the new
    <respawn:[METHOD, PARAM]> tag - resolved as world default < enemy note < event comment - and until that moment its
    event stays down through map transitions, saves, and loads. The battler then reappears at its authored coordinates
    while the player watches, optionally announced by <respawnAnimation:ID>. <noRespawn> makes a battler permanent
    instead: defeated once, gone for the playthrough. Core ships the "seconds" method (playtime-based); extensions can
    register richer methods with the new JABS_RespawnManager. Battlers declaring nothing behave as they always have.
    Dynamically-spawned clones are never tracked, since their event ids do not survive a map setup.
### 4.17.5
  - Fixed the Set JABS Skill plugin command assigning nothing when aimed at the tool or usable item slot. Plugin command
    arguments arrive as strings, so an unset item id reads as "0" and never equals the numeric zero it was compared
    against - every call took the item branch, overwrote the skill id with a zero and then bailed for having no id worth
    assigning.
  - Collapsed addOrUpdateBattler into a single write and removed updateBattler; the tracking map is keyed by uuid, so
    both arms already wrote the same entry.
  - Removed the player target clear from clearBattlerLastHit, since storing null through setBattlerLastHit is already
    what clears the player's target.
  - Flattened the aggro and elemental-effectiveness comparators to a subtraction.
### 4.17.4
  - Routed every console warning and error through J-Base's new Diagnostics, so each one names J-ABS in the console.
    Replaced the placeholder messages left behind while debugging - console.warn('omg') and 'that rare error occurred!'
    - with text that states what actually went wrong. The per-frame catch in Sprite_Animation now stays silent as its
    own comment always said it should.
### 4.17.3
  - Repointed combat and loot logging at J-Log's new $mapLogs registry. The $actionLogManager and $lootLogManager
    globals this called are gone.
  - Requires J-Log 3.0.0 when J-Log is installed at all.
### 4.17.2
  - Fixed losing a state stack leaving the battler's trait caches describing the deeper stack. Gaining a stack always
    refreshed them; losing one never did, so additive trait families like element rate kept reporting the resistance of
    a stack depth the battler no longer had.
### 4.17.1
  - Corrected the guard documentation, which credited EVA with extending the parry window. Parry extension became its
    own parameter and EVA went back to meaning physical evasion; only the prose still pointed at the old arrangement.
### 4.17.0
  - Added <guardInterval:N> so a held guard can refire its own skill on an interval rather than only on the frame it
    went up.
  - Fixed party cycling stepping over the member standing immediately behind the leader, who is the one the player
    expects to get next.
  - Fixed removeAggro dereferencing a battler that had already been cleaned up.
  - Fixed <shieldBypass> crashing when written without parameters.
### 4.16.0
  - Fixed turnEndOnMap running the engine's own turn-end effects while JABS was active and skipping them while it was
    disabled - the guard was negated, so regeneration and poison applied twice under JABS and not at all without it.
  - Fixed <noAutoAssignType:[IDS]> never being read; the blacklist was checking a J-Passive notetag instead, so equipped
    passive state ids were blocking skill types by numeric coincidence while the documented tag did nothing.
  - Moved the passive-state exclusion out of the affliction strip and into J-Passive-Conditional, which is where both
    halves of that question live.
### 4.15.0
  - Added <thisIgnoreParry:N> so a skill can carry its own parry-ignore, and made <ignoreParry:N> readable from every
    note source on the attacker rather than the skill alone - equipment, states and the actor all contribute now.
  - The two sum and clamp at 100, which keeps defensive pressure from inverting past the ceiling.
### 4.14.0
  - Declared what JABS state on the party and the system is worth writing to a savefile, and routed the _abs namespace
    into its own save section.
  - Moved the _abs namespace seeding from the initialize alias to initMembers, so a decoded save can establish it
    without running a constructor.
  - Declared JABS_SkillSlot's cooldown as a typed field; it was registered as serializable while holding a JABS_Cooldown
    instance nothing declared. command352 now opens J-Base-Save's files scene when that plugin is installed, and
    vanilla's save scene when it is not. Previously the JABS branch named Scene_Save outright, so every save platform
    bypassed the files scene entirely.
  - Added an @orderAfter for J-Base-Save, which the namespace guard alone does not cover: reaching Scene_Files needs the
    class, not just the namespace.
  - The forced map reload JABS needs after any load moved to a shared helper, so vanilla's load scene and the files
    scene cannot drift apart on it.
### 4.13.0
  - Added <channel> vessel skills that repeat a child skill over time.
  - Added cast/channel interruption via movement or <interrupt> hits.
  - Added Glancing Blow, a partial-hit tier between hit and parry.
  - Added lucky/cursed rerolls, veryLucky/veryCursed, encore repeats.
  - Added accumulate mode for on-chance roll contests.
  - Added onEvadeApply/onEvadeApplySelf/onEvadeExecute reactions.
  - Retaliate now filters by hit type and exposes d/m/t formula vars.
  - Added a UsableItem equip slot, separate from the Tool slot.
  - Added ~10 conditional/unconditional bonus damage tags.
  - Added cast-time damage bonus tags scaled by resolved cast time.
  - Added skill history bonus tags and SkillHistoryBonusDisplay HUD.
  - Added range/radius/proximity/thickness buff and rate modifiers.
  - Added proximity knockback and knockback amp tags.
  - Slip VAL now applies in full per tick, not divided over 5 sec.
  - Added tick speed flat/percent/type modifiers and per-state override.
  - Added DoT/HoT amplification tags, battler and skill scoped.
  - Added state spreading via <spread>, <viral>, and related tags.
  - Added apply-state-on-expire chaining on natural expiry.
  - Added purgeStates cleanse tag and noLogs suppression.
  - Added tiered state immunity and type-scoped resistance tags.
  - Added stackMaxBoost, stackOnExpire, and state-to-state conversion.
  - Renamed <stateDurationForm> to <stateDurationFormula>.
  - Replaced <size> with <innerRadius>, a hitbox dead-zone tag.
  - Added CDR (cooldown reduction) and PER (parry extension) stats.
  - Combos can now auto-clear after EXPIRE_FRAMES if unused.
  - <delay> now supports an independent touch-trigger radius.
  - Added aggroPercent and notMyAggro/notMyAggroPercent tags.
  - Added a map affliction icon strip HUD under map battlers.
  - Documented <jabsTool> vs default usable-item classification.
  - Documented that omitted <actionId> silently defaults to event 1.
  - Fixed JABS_SkillSlot.canBeAutocleared missing Mainhand/Offhand.
### 4.12.1
  - Arc hitbox (`<hitbox:arc>`) collision now correctly registers hits against large enemies whose AABB center falls
    outside the wedge sweep but whose edge or corner overlaps it.
  - The angle gate now samples all four AABB corners in addition to the center; if any sample point lies within the
    wedge, the hit registers.
### 4.12.0
  - Generic skill transform: <skillTransform:[BASE, OVERRIDE]> now applies to all equipped slots (combat, dodge,
    offhand) and all note-bearing sources (actor, class, weapon/armor, state). Precedence order: active states (highest
    priority, sorted by priority desc) > equipped items > class > actor/enemy DB row. The transform target does not need
    to be learned via hasSkill — the tag itself is the implicit permission grant. Tool slot is excluded (stores item
    ids, not skill ids).
  - Added Game_Battler#getSkillTransformSources, #resolveEquippedSkillId, #getResolvedSkillId.
  - Game_Actor extends getSkillTransformSources to include equips and class.
  - All execution paths (map action, guarding, dodging, AI guard decisions) use the resolved skill id. Added
    battlerHasPermissionForSlot to guard hasSkill against the raw base slot id.
  - Fixed applyPlayerCooldowns shared-cooldown stamping to use resolveEquippedSkillId so transformed slots correctly
    receive their cooldown when the executed skill id differs from the raw stored slot id.
  - HUD (Sprite_BaseSkillSlot, Sprite_SkillSlotIcon, Sprite_SkillCost) and JABS quick menu (Window_AbsMenuSelect) now
    display the transformed skill's icon, name, and cost.
  - Existing getTransformedOffhandSkillId now delegates to the generic resolver; the offhand-only
    findOffhandSkillTransform helper has been removed.
  - Added jabsSkillTransforms getter to RPG_BaseBattler, RPG_Class, and RPG_EquipItem.
### 4.11.0
  - Regen ticks twice per second (interval + scaled natural regen + per-state slip application so per-second totals
    match legacy math); slip/regen hooks can attribute popups per state. `JABS_Engine.implicitParryChancePercent`
    extracts the implicit parry probability step from {@link JABS_Engine#checkParry} for tooling/UI parity.
### 4.10.0
  - Defensive dodge and guard: readiness on battlers, `JABS_AiManager` interrupt and non-leader dodge direction,
    `Game_CharacterBase` dodge state, engine map-action gating, `JABS_SkillSlotManager` equipped-skill access for
    dodge/offhand, init metadata wiring. `JABS_EnemyAI` doc alignment.
### 4.9.0
  - Team rules are now data-driven via required `data/config.jabs.json` (root `{ teams: [...] }` with per-team `opposes`
    lists).
### 4.8.4
  - Action-map template `<vis*>` tags: Comment lines (+ optional event `note` on the event) are stamped once at spawn
    into a synthetic note on {@link JABS_Action}; {@link RPGManager} merges them with skill notes (skill wins on
    duplicate tags).
### 4.8.3
  - Projectile formation rotation supports diagonal facings (45° steps).
  - New {@link JABS_Battler#getProjectileSpawnBaseDirection} hook for aim vs map facing.
  - Optional {@link JABS_ActionOptions#getProjectileTravelAngleDegrees} on action options (builder API) reserved for
    vector-travel extensions; null preserves move-route motion.
  - Action sprites keep cardinal {@link Game_Character#direction} for RMMZ bitmap rows while diagonal travel stays on
    {@link JABS_Action}; fixes `$` sheet tearing.
  - `<visOffset*>` uses {@link JABS_Action#getDirectionForVisOffsetTags} (full 8-dir travel, not sprite-row direction on
    the action event). `<visRotate>` uses the same travel direction.
  - Cast stamp on action events records the caster's facing (not always the player).
### 4.8.2
  - Added battler name model to support richer name rendering.
### 4.8.1
  - Refactored gaining of rewards logic for other extensions.
  - Fixed issue where EXR was being calculated twice (oops!).
### 4.8.0
  - Optional global cooldown (GCD): plugin params, skill-type whitelist, notetags `noGlobalCooldown`/`ogcd`/`gcd`, AI
    and input gating (dodge/tool exempt), HUD combo gauge shows GCD pressure, plugin command to stamp GCD.
### 4.7.2
  - Unified enemy and ally AI skill decisions to return a skill-id array (empty or one id); JABS_AiManager phase-2 paths
    read the first element after validation.
  - JABS_AI#decideAction stub now returns an empty array to match concrete AI classes.
  - Fixed filterSkillsHealerPriority returning a scalar on the final healing-priority path instead of an array.
### 4.7.1
  - Added plugin parameter "Parry Map Animation Id" for the database animation played on successful parry (default 122;
    0 disables).
  - Fixed Sprite_MapCastGauge gauge track being shortened by skill name width; track now always occupies the full bitmap
    width.
  - Fixed enemy projectile fire direction baked at decision time rather than execution time; added
    restampActionDirections to re-orient volleys to the battler's facing at the moment of firing.
  - Fixed hasInteractableEventInFront using raw fractional player coordinates with eventsXy, which always returned no
    match; coordinates are now rounded to the nearest tile before the look-ahead is computed.
  - Removed obsolete J.ABS.EXT.CYCLE guard from hasInteractableEventInFront.
### 4.7.0
  - Renamed battler role tag from <jabsRole: X> to <aiRole: X>.
  - Fixed axis-alignment for AI using Line, Wall, and Arc hitboxes.
  - Fixed sentinel aggro flicker when a non-sentinel target leaves home sight range.
  - Fixed guardian aggro flicker when ward is attacked from outside the guardian's pursuit range.
  - Added <guardRange: N> for guardians to define an explicit engagement range for ward-protection; falls back to max
    ward pursuit otherwise.
  - Added balloon on target-switch for guardian battlers.
### 4.6.0
  - Fixed JABS_EnemyAI#decideAction using switch(this) against boolean traits, which never matched and forced generic AI
    for all enemies since 2023.
  - Fixed undefined "defensive" reference in healer follower filtering.
  - Fixed operator-precedence bugs in elemental and healer skill filters.
  - Lifted shared AI helpers into JABS_AI.
  - Moved JABS_BattleMemory into core for shared ally/enemy AI use.
  - Added JABS_BattlerRole and <aiRole: X> tags: leader, follower, guardian, ward, solo, sentinel.
  - Added enemy AI traits: cleanser, buffer, tactical, berserker.
  - Routed leader/follower coordination through AiManager before skill selection; solo role skips coordination entirely.
  - New notetags: <aiTrait: cleanser|buffer|tactical|berserker> and the full <aiRole: X> family.
### 4.5.0
  - Consumed RPGManager update.
  - Removed useless extraneous layers that handled note extraction.
  - Removed hard-coded reference to J-Extend from this plugin.
  - Shifted hard-coded regex to live in the initialization section.
### 4.4.0
  - Revamped dodge skills.
  - Dodge skills now execute their skill as well.
  - Added new tags for additional customization of dodge skills.
### 4.3.1
  - Prevented serialization of JABS_Action#_actionSprite.
  - Fixed issue with combat indicator and duration tailing not working.
  - Extended JABS_State to leverage a builder for extension.
  - Adjusted state stack loss to allow non-duration stack loss.
  - Fixed issue where eternal states were not refreshing if removed.
  - Removed action events from being added to save files.
### 4.3.0
  - Unified sprint and dash as one alter-action.
  - Added a notion of "being in combat" based on hitting or being hit.
  - Force dash to change to mobility skill while "in combat".
  - Added "on cast animation" that plays once a skill finishes casting.
### 4.2.0
  - Split projectile count from projectile formation.
### 4.1.1
  - Moved ownership of debug movement to J-ABS-InputManager.
  - Removed dead code (deprecated dash input).
### 4.1.0
  - Added support for J-ABS-InputManager 2.0.0.
### 4.0.0
  - Added hitbox visibility for castable skills and related tags.
  - Properly abstracted DIAG out of this plugin.
  - Added castbar visibility while casting.
  - Added performance improvements for maps with large battler counts.
  - Fixed numerous issues with collision and hitboxes.
  - Added additional tags related to hitboxes.
  - Updated projectile counts 2 & 3 to no longer be V and W.
  - Added support for delayed actions to touch-trigger within a radius.
### 3.4.3
  - Added hook for post-battler-conversion mutation.
### 3.4.2
  - Adjusted font size and sprite location for enemy battler name.
### 3.4.1
  - Applied significant regeneration reduction for actors in-combat.
  - Fixed facing-auto-parry not working as intended.
  - Fixed strafe functionality forcing strafe on allies.
  - Fixed knockback on player affecting all party allies.
### 3.4.0
  - Added functionality surrounding skill auto-assignment.
  - Extracted "poses" functionality to an extension for future work.
  - Added Scene_Map#forceCloseAbsMenu().
### 3.3.0
  - Added plugin command to generate enemies on the map dynamically.
  - Added plugin command to generate loot on the map dynamically.
  - Refactored away manual getter/setters of JABS_Engine.
### 3.2.2
  - JABS quick menu now honors menu access via event control.
  - Actor-based JABS parameter retrieval has been refactored.
  - Enabled auto-counter for enemies.
  - Fixed issue where states weren't reapplied properly.
  - Fixed issue where inanimate battlers could endlessly alert allies.
### 3.2.1
  - Refactored slip effects to accommodate the J-Passives update.
  - Fixed issue where endlessly delaying actions would never expire.
### 3.2.0
  - Fixed bug where actions couldn't connect if attacker was too close.
  - Upgraded AI to leverage combos (ally AI, too).
  - Refactored code surrounding AI action decision-making.
### 3.1.2
  - Refactored some of the JABS menu in a non-breaking way.
  - Optimized/centralized note tag retrieval in many cases.
### 3.1.1
  - Retroactively added this CHANGELOG.
### 3.1.0
  - Optimized battler, state, and integration tracking.
  - Added proper guidance in the plugin description.
  - Added state duration modifiers functionality.
  - Fixed "ignore all parry" tag.
  - Added "Skill Charging" as JABS extension.
  - Added "Casting Modifiers" as JABS extension.
  - Added "Map Tools" as JABS extension.
  - Added "Cyclone-Movement" adapter as JABS extension.
  - Updated distance-centric tags to allow decimals.
  - Added "circle" hitbox; updated hitbox logic.
  - Updated tags surrounding enemy event and AI configuration.
  - Optimized AI decision-making capabilities based on AI traits.
### 3.0.0
  - Extracted "Text Pops" as a JABS extension plugin.
  - Extracted "Input Management" as a JABS extension plugin.
  - Extracted "Diagonal Movements" as a JABS extension plugin.
  - Extracted "Movespeed Modifiers" as a JABS extension plugin.
  - Integrated "Ally AI" as a JABS extension.
  - Added Aggro functionality.
  - Added skill delay functionality (like bombs).
  - Adjusted numerous data points to be customizable in plugin params.
  - Further optimized "under-the-hood" parts of JABS.
### 2.3.1
  - Updated loot drop functionality to be less wonky.
  - Other miscellaneous bugfixes.
### 2.3.0
  - Updated plugin parameters format to be cleaner.
  - Added "Danger Indicator" functionality.
  - Added "Battler Name" functionality.
  - Other miscellaneous bugfixes.
### 2.2.0
  - Added 2 new AI types: "leader" and "follower".
  - Shifted enemy tag location from event notebox to comment format.
  - Other miscellaneous bugfixes.
### 2.1.0
  - Implemented party cycling between members of the party.
  - Added refresh command for JABS quick menu.
  - Added "bonus hits" functionality.
  - Disabled native RMMZ regeneration.
  - Modified dash functionality to be controlled by JABS instead.
  - Enemies now perform their active event page upon defeat.
  - Disabled on-hit effects against targets that parry.
  - Added "counter-guard" and "counter-parry" functionality.
  - Added visual indicator for "action decided" for AI battlers.
  - Excessive number of bugfixes.
### 2.0.0
  - Added guarding functionality.
  - Added counterattack functionality.
  - Added projectile count modifiers.
  - Enemy loot is now dropped on the ground.
  - Added movespeed modifier functionality (for player only).
  - Greatly optimized "under-the-hood" parts of JABS.
### 1.0.0
  - The initial release.