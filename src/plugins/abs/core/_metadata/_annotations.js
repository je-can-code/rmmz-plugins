/* eslint-disable max-len */
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Enables combat to be carried out on the map.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @orderAfter J-Base
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin is JABS: J's Action Battle System.
 * Using this plugin will enable you to carry out combat directly on the
 * map in real-time, similar to popular game franchises like Zelda.
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * Have you ever wanted to decorate events with tons of event comments and
 * watch them come to life as AI-controlled allies/enemies in an action
 * battle system for your button-mashing hack-n-slash pleasure? Well now
 * you can! Just slap some tags on the various everything across the entire
 * RMMZ editor, and you too can have a functional ABS, aka JABS!
 *
 * ============================================================================
 * INTEGRATIONS:
 * In addition to JABS, I've written a suite (20+) of other plugins that
 * add new systems or modify existing systems.
 *
 * All plugins I have written are highly compatible with each other, and
 * with JABS. Many of them were written to complement JABS, such as the
 * HUD or Ally AI.
 *
 * If you find an issue with how my plugins are interacting with one
 * another, feel free to reach out and let me know.
 *
 * If you find an issue with how JABS is interacting with someone else's
 * plugin, I encourage you to communicate with that plugin author to have
 * them reach out to me. We shall discuss the problem and try to find a
 * solution.
 *
 * Alternatively, you are welcome to file an issue against my GitHub
 * repository describing the issue and how to reproduce it minimally,
 * and I will look into it when possible.
 * ============================================================================
 * Due to the sheer length of instruction provided below, the changelog
 * for JABS lives at the top instead of the bottom.
 *
 * CHANGELOG:
 * - 4.12.4
 *    State spread: `<spread:[CHANCE, RANGE]>`, `<viral>`, `<spreadTick:N>`, `<spreadPerTick:N>`,
 *    `<spreadPreferUnafflicted>`, `<spreadSkipAfflicted>`. Each tracked JABS_State ticks a spread
 *    counter (plugin param `defaultStateSpreadTickInterval`, default 30 frames). Independent chance
 *    per target in range; applies via addState with original source battler. Not tied to slip/regen.
 *    Startup: `_pluginMetadata` no longer imports `JABS_State` (default reapply type `'refresh'`).
 * - 4.12.3
 *    Cast-time direct damage scaling: `<castTimeDamageBonus:N>` on any getAllNotes() source and
 *    `<thisCastTimeDamageBonus:N>` on a specific skill. Bonus percent = sum(N per sec) × resolved
 *    cast seconds (frames ÷ 60). Resolved cast duration is stamped on the shared Game_Action when
 *    JABS actions are built (includes J-ABS-Timing cast speed). Applies to HP/MP damage skills
 *    only; not healing, recovery, or slip DoT ticks.
 * - 4.12.2
 *    Fixed a bug where `JABS_SkillSlot.canBeAutocleared` was missing Mainhand and
 *    Offhand from its protected-slots list, causing those slots to be wiped by
 *    `removeInvalidSkills` any time a proficiency conditional taught the actor a new
 *    skill (or any other mid-refresh skill-learn path).
 * - 4.12.1
 *    Arc hitbox (`<hitbox:arc>`) collision now correctly registers hits against large enemies
 *    whose AABB center falls outside the wedge sweep but whose edge or corner overlaps it.
 *    The angle gate now samples all four AABB corners in addition to the center; if any sample
 *    point lies within the wedge, the hit registers.
 * - 4.12.0
 *    Generic skill transform: <skillTransform:[BASE, OVERRIDE]> now applies to all equipped
 *    slots (combat, dodge, offhand) and all note-bearing sources (actor, class, weapon/armor,
 *    state). Precedence order: active states (highest priority, sorted by priority desc) >
 *    equipped items > class > actor/enemy DB row. The transform target does not need to be
 *    learned via hasSkill — the tag itself is the implicit permission grant. Tool slot is
 *    excluded (stores item ids, not skill ids).
 *    Added Game_Battler#getSkillTransformSources, #resolveEquippedSkillId, #getResolvedSkillId.
 *    Game_Actor extends getSkillTransformSources to include equips and class.
 *    All execution paths (map action, guarding, dodging, AI guard decisions) use the resolved
 *    skill id. Added battlerHasPermissionForSlot to guard hasSkill against the raw base slot id.
 *    Fixed applyPlayerCooldowns shared-cooldown stamping to use resolveEquippedSkillId so
 *    transformed slots correctly receive their cooldown when the executed skill id differs from
 *    the raw stored slot id.
 *    HUD (Sprite_BaseSkillSlot, Sprite_SkillSlotIcon, Sprite_SkillCost) and JABS quick menu
 *    (Window_AbsMenuSelect) now display the transformed skill's icon, name, and cost.
 *    Existing getTransformedOffhandSkillId now delegates to the generic resolver; the
 *    offhand-only findOffhandSkillTransform helper has been removed.
 *    Added jabsSkillTransforms getter to RPG_BaseBattler, RPG_Class, and RPG_EquipItem.
 * - 4.11.0
 *    Regen ticks twice per second (interval + scaled natural regen + per-state slip application so per-second totals match
 *    legacy math); slip/regen hooks can attribute popups per state. `JABS_Engine.implicitParryChancePercent` extracts the
 *    implicit parry probability step from {@link JABS_Engine#checkParry} for tooling/UI parity.
 * - 4.10.0
 *    Defensive dodge and guard: readiness on battlers, `JABS_AiManager` interrupt and non-leader dodge direction,
 *    `Game_CharacterBase` dodge state, engine map-action gating, `JABS_SkillSlotManager` equipped-skill access for
 *    dodge/offhand, init metadata wiring. `JABS_EnemyAI` doc alignment.
 * - 4.9.0
 *    Team rules are now data-driven via required `data/config.jabs.json`
 *    (root `{ teams: [...] }` with per-team `opposes` lists).
 * - 4.8.4
 *    Action-map template `<vis*>` tags: Comment lines (+ optional event `note` on the event) are stamped once at spawn
 *    into a synthetic note on {@link JABS_Action}; {@link RPGManager} merges them with skill notes (skill wins on duplicate tags).
 * - 4.8.3
 *    Projectile formation rotation supports diagonal facings (45° steps).
 *    New {@link JABS_Battler#getProjectileSpawnBaseDirection} hook for aim vs map facing.
 *    Optional {@link JABS_ActionOptions#getProjectileTravelAngleDegrees} on action options
 *    (builder API) reserved for vector-travel extensions; null preserves move-route motion.
 *    Action sprites keep cardinal {@link Game_Character#direction} for RMMZ bitmap rows
 *    while diagonal travel stays on {@link JABS_Action}; fixes `$` sheet tearing.
 *    `<visOffset*>` uses {@link JABS_Action#getDirectionForVisOffsetTags} (full 8-dir travel,
 *    not sprite-row direction on the action event). `<visRotate>` uses the same travel direction.
 *    Cast stamp on action events records the caster's facing (not always the player).
 * - 4.8.2
 *    Added battler name model to support richer name rendering.
 * - 4.8.1
 *    Refactored gaining of rewards logic for other extensions.
 *    Fixed issue where EXR was being calculated twice (oops!).
 * - 4.8.0
 *    Optional global cooldown (GCD): plugin params, skill-type whitelist,
 *    notetags `noGlobalCooldown`/`ogcd`/`gcd`,
 *    AI and input gating (dodge/tool exempt), HUD combo gauge shows GCD
 *    pressure, plugin command to stamp GCD.
 * - 4.7.2
 *    Unified enemy and ally AI skill decisions to return a skill-id array
 *    (empty or one id);
 *    JABS_AiManager phase-2 paths read the first element after validation.
 *    JABS_AI#decideAction stub now returns an empty array to match concrete AI
 *    classes.
 *    Fixed filterSkillsHealerPriority returning a scalar on the final
 *    healing-priority path instead of an array.
 * - 4.7.1
 *    Added plugin parameter "Parry Map Animation Id" for the database
 *    animation played on successful parry (default 122; 0 disables).
 *    Fixed Sprite_MapCastGauge gauge track being shortened by skill name
 *    width; track now always occupies the full bitmap width.
 *    Fixed enemy projectile fire direction baked at decision time rather than
 *    execution time; added restampActionDirections to re-orient volleys to the
 *    battler's facing at the moment of firing.
 *    Fixed hasInteractableEventInFront using raw fractional player coordinates
 *    with eventsXy, which always returned no match; coordinates are now
 *    rounded to the nearest tile before the look-ahead is computed.
 *    Removed obsolete J.ABS.EXT.CYCLE guard from hasInteractableEventInFront.
 * - 4.7.0
 *    Renamed battler role tag from <jabsRole: X> to <aiRole: X>.
 *    Fixed axis-alignment for AI using Line, Wall, and Arc hitboxes.
 *    Fixed sentinel aggro flicker when a non-sentinel target leaves home
 *    sight range.
 *    Fixed guardian aggro flicker when ward is attacked from outside the
 *    guardian's pursuit range.
 *    Added <guardRange: N> for guardians to define an explicit engagement
 *    range for ward-protection; falls back to max ward pursuit otherwise.
 *    Added balloon on target-switch for guardian battlers.
 * - 4.6.0
 *    Fixed JABS_EnemyAI#decideAction using switch(this) against boolean
 *    traits, which never matched and forced generic AI for all enemies
 *    since 2023.
 *    Fixed undefined "defensive" reference in healer follower filtering.
 *    Fixed operator-precedence bugs in elemental and healer skill filters.
 *    Lifted shared AI helpers into JABS_AI.
 *    Moved JABS_BattleMemory into core for shared ally/enemy AI use.
 *    Added JABS_BattlerRole and <aiRole: X> tags: leader, follower,
 *    guardian, ward, solo, sentinel.
 *    Added enemy AI traits: cleanser, buffer, tactical, berserker.
 *    Routed leader/follower coordination through AiManager before skill
 *    selection; solo role skips coordination entirely.
 *    New notetags: <aiTrait: cleanser|buffer|tactical|berserker> and the
 *    full <aiRole: X> family.
 * - 4.5.0
 *    Consumed RPGManager update.
 *    Removed useless extraneous layers that handled note extraction.
 *    Removed hard-coded reference to J-Extend from this plugin.
 *    Shifted hard-coded regex to live in the initialization section.
 * - 4.4.0
 *    Revamped dodge skills.
 *    Dodge skills now execute their skill as well.
 *    Added new tags for additional customization of dodge skills.
 * - 4.3.1
 *    Prevented serialization of JABS_Action#_actionSprite.
 *    Fixed issue with combat indicator and duration tailing not working.
 *    Extended JABS_State to leverage a builder for extension.
 *    Adjusted state stack loss to allow non-duration stack loss.
 *    Fixed issue where eternal states were not refreshing if removed.
 *    Removed action events from being added to save files.
 * - 4.3.0
 *    Unified sprint and dash as one alter-action.
 *    Added a notion of "being in combat" based on hitting or being hit.
 *    Force dash to change to mobility skill while "in combat".
 *    Added "on cast animation" that plays once a skill finishes casting.
 * - 4.2.0
 *    Split projectile count from projectile formation.
 * - 4.1.1
 *    Moved ownership of debug movement to J-ABS-InputManager.
 *    Removed dead code (deprecated dash input).
 * - 4.1.0
 *    Added support for J-ABS-InputManager 2.0.0.
 * - 4.0.0
 *    Added hitbox visibility for castable skills and related tags.
 *    Properly abstracted DIAG out of this plugin.
 *    Added castbar visibility while casting.
 *    Added performance improvements for maps with large battler counts.
 *    Fixed numerous issues with collision and hitboxes.
 *    Added additional tags related to hitboxes.
 *    Updated projectile counts 2 & 3 to no longer be V and W.
 *    Added support for delayed actions to touch-trigger within a radius.
 * - 3.4.3
 *    Added hook for post-battler-conversion mutation.
 * - 3.4.2
 *    Adjusted font size and sprite location for enemy battler name.
 * - 3.4.1
 *    Applied significant regeneration reduction for actors in-combat.
 *    Fixed facing-auto-parry not working as intended.
 *    Fixed strafe functionality forcing strafe on allies.
 *    Fixed knockback on player affecting all party allies.
 * - 3.4.0
 *    Added functionality surrounding skill auto-assignment.
 *    Extracted "poses" functionality to an extension for future work.
 *    Added Scene_Map#forceCloseAbsMenu().
 * - 3.3.0
 *    Added plugin command to generate enemies on the map dynamically.
 *    Added plugin command to generate loot on the map dynamically.
 *    Refactored away manual getter/setters of JABS_Engine.
 * - 3.2.2
 *    JABS quick menu now honors menu access via event control.
 *    Actor-based JABS parameter retrieval has been refactored.
 *    Enabled auto-counter for enemies.
 *    Fixed issue where states weren't reapplied properly.
 *    Fixed issue where inanimate battlers could endlessly alert allies.
 * - 3.2.1
 *    Refactored slip effects to accommodate the J-Passives update.
 *    Fixed issue where endlessly delaying actions would never expire.
 * - 3.2.0
 *    Fixed bug where actions couldn't connect if attacker was too close.
 *    Upgraded AI to leverage combos (ally AI, too).
 *    Refactored code surrounding AI action decision-making.
 * - 3.1.2
 *    Refactored some of the JABS menu in a non-breaking way.
 *    Optimized/centralized note tag retrieval in many cases.
 * - 3.1.1
 *    Retroactively added this CHANGELOG.
 * - 3.1.0
 *    Optimized battler, state, and integration tracking.
 *    Added proper guidance in the plugin description.
 *    Added state duration modifiers functionality.
 *    Fixed "ignore all parry" tag.
 *    Added "Skill Charging" as JABS extension.
 *    Added "Casting Modifiers" as JABS extension.
 *    Added "Map Tools" as JABS extension.
 *    Added "Cyclone-Movement" adapter as JABS extension.
 *    Updated distance-centric tags to allow decimals.
 *    Added "circle" hitbox; updated hitbox logic.
 *    Updated tags surrounding enemy event and AI configuration.
 *    Optimized AI decision-making capabilities based on AI traits.
 * - 3.0.0
 *    Extracted "Text Pops" as a JABS extension plugin.
 *    Extracted "Input Management" as a JABS extension plugin.
 *    Extracted "Diagonal Movements" as a JABS extension plugin.
 *    Extracted "Movespeed Modifiers" as a JABS extension plugin.
 *    Integrated "Ally AI" as a JABS extension.
 *    Added Aggro functionality.
 *    Added skill delay functionality (like bombs).
 *    Adjusted numerous data points to be customizable in plugin params.
 *    Further optimized "under-the-hood" parts of JABS.
 * - 2.3.1
 *    Updated loot drop functionality to be less wonky.
 *    Other miscellaneous bugfixes.
 * - 2.3.0
 *    Updated plugin parameters format to be cleaner.
 *    Added "Danger Indicator" functionality.
 *    Added "Battler Name" functionality.
 *    Other miscellaneous bugfixes.
 * - 2.2.0
 *    Added 2 new AI types: "leader" and "follower".
 *    Shifted enemy tag location from event notebox to comment format.
 *    Other miscellaneous bugfixes.
 * - 2.1.0
 *    Implemented party cycling between members of the party.
 *    Added refresh command for JABS quick menu.
 *    Added "bonus hits" functionality.
 *    Disabled native RMMZ regeneration.
 *    Modified dash functionality to be controlled by JABS instead.
 *    Enemies now perform their active event page upon defeat.
 *    Disabled on-hit effects against targets that parry.
 *    Added "counter-guard" and "counter-parry" functionality.
 *    Added visual indicator for "action decided" for AI battlers.
 *    Excessive number of bugfixes.
 * - 2.0.0
 *    Added guarding functionality.
 *    Added counterattack functionality.
 *    Added projectile count modifiers.
 *    Enemy loot is now dropped on the ground.
 *    Added movespeed modifier functionality (for player only).
 *    Greatly optimized "under-the-hood" parts of JABS.
 * - 1.0.0
 *    The initial release.
 * ============================================================================
 * SETTING UP YOUR ENEMY EVENTS:
 * There are a lot of potential tags you can place all across the database
 * to accomplish various goals, so let's get started with setting up an
 * enemy event.
 *
 * First and foremost, all tags will be living inside comment event
 * commands:
 *    "Event Commands > Flow Control > Comment"
 *
 * NOTE ABOUT PRIORITY OF TAGS:
 * With the exception of the ENEMY ID tag and MOVE SPEED tag, all the
 * rest are mostly optional. If you place the same tags for ENEMY EVENTS
 * in the database, they will become the defaults for that enemy, and the
 * tags in the event will act as "overrides".
 * Priority order:
 *    1st: tags in the ENEMY EVENT.
 *    2nd: tags in the database on that particular enemy.
 *    3rd: the defaults listed in the plugin parameters.
 * ----------------------------------------------------------------------------
 * ENEMY ID:
 * If you want an event to act as an enemy, the system needs a way to
 * associate the event with the enemy in the database. Use the "enemy" tag:
 *    <enemyId:ENEMY_ID>
 *  Where ENEMY_ID is the id from the database for this enemy.
 *
 * ----------------------------------------------------------------------------
 * SIGHT RADIUS:
 * Sight is the radius around the enemy that it can perceive the player.
 * When the player enters this radius, the enemy will try to engage.
 *    <sight:RADIUS>
 *  Where RADIUS is the distance in tiles this enemy can see.
 *
 * NOTE: Enemy sight ignores obstacles like walls; they have x-ray vision.
 *
 * This can also be placed in the database on the enemy as a default.
 *
 * ----------------------------------------------------------------------------
 * PURSUIT RADIUS:
 * Pursuit is the radius an enemy will maintain while actively engaged in
 * combat. Think of it as the "sight radius after aggro". It is typically
 * designed to be larger than the sight radius so enemies don't trivially
 * disengage the moment the player steps back one tile.
 *    <pursuit:RADIUS>
 *  Where RADIUS is the distance in tiles this enemy can pursue.
 *
 * This can also be placed in the database on the enemy as a default.
 *
 * ----------------------------------------------------------------------------
 * PREPARE TIME:
 * Every enemy has a "prepare" timer -- the number of frames they wait
 * before taking their first action. By default this is controlled by the
 * "Attack Speed" trait in the database enemy editor, but you can override
 * it per event or per database enemy with this tag:
 *    <prepare:FRAMES>
 *  Where FRAMES is the number of frames to wait before first acting.
 *
 * This can also be placed in the database on the enemy as a default.
 *
 * ----------------------------------------------------------------------------
 * ALERTING:
 * When an enemy is struck from outside of its sight/pursuit range, it
 * enters an "alerted" state. While alerted, it gains heightened sight and
 * pursuit and navigates to where it believes the attacker is. Use this
 * functionality, or else enemies can be cheaply defeated with ranged
 * skills from outside their range. There are a few tags to configure it:
 *    <alertDuration:DURATION>
 *  Where DURATION is the number of frames to remain alerted.
 *
 *    <alertedSightBoost:RADIUS_BOOST>
 *  Where RADIUS_BOOST is bonus sight gained while alerted.
 *
 *    <alertedPursuitBoost:RADIUS_BOOST>
 *  Where RADIUS_BOOST is bonus pursuit gained while alerted.
 *
 * This can also be placed in the database on the enemy as a default.
 *
 * ----------------------------------------------------------------------------
 * VISION MULTIPLIER:
 * You can scale how well a battler sees its opponents using this tag.
 * It modifies the sight and pursuit radii by a percent offset from 100.
 *    <visionMultiplier:VAL>
 *  Where VAL is the percent offset (e.g. 50 adds 50%, -50 cuts in half).
 *
 * A value of 0 has no effect. Tags from all applicable notes are summed.
 * Values are clamped so the result never drops below zero. Place this on
 * actors, classes, enemies, weapons, armors, or states.
 *
 * EXAMPLE: An enemy with sight 4 and a state bearing <visionMultiplier:50>
 * will see as if it had sight 6 for the duration of that state.
 *
 * ----------------------------------------------------------------------------
 * MOVE SPEED:
 * Sometimes you want an enemy to move between 3 and 4 movespeed, because
 * 3 to 4 is literally a 2x jump. To assign a value like 3.7, use this:
 *    <moveSpeed:SPEED>
 *  Where SPEED is the numeric value to set as the move speed.
 *
 * NOTE: This will override whatever the native RMMZ event page is set to.
 * NOTE: A good balance is usually between 3.5 and 4.5 for move speed.
 *
 * ============================================================================
 * AI TRAITS:
 * While the basic AI works, you may want to tune it for specific enemies.
 * AI traits modify how an enemy chooses and uses its skills. Add these
 * tags alongside the enemy id, sight, and other configuration tags.
 *
 * NOTE: Without any AI traits, enemies will still attack and use skills,
 * but skill selection will be mostly random within what is available,
 * subject to cooldowns and resource costs.
 *
 * NOTE: Multiple AI traits can be stacked on a single enemy.
 *
 * ----------------------------------------------------------------------------
 * <aiTrait:careful>
 * Careful enemies are more calculating. They avoid using skills that
 * would be elementally ineffective, and generally make smarter decisions.
 * This also amplifies the judgment of other AI traits when combined.
 *
 * ----------------------------------------------------------------------------
 * <aiTrait:executor>
 * Executor enemies prioritize skills that maximize damage and target weak
 * spots. They will use everything in their arsenal to destroy you.
 *
 * ----------------------------------------------------------------------------
 * <aiTrait:reckless>
 * Reckless enemies never use their basic attack. They will spam their
 * learned skills until they are out of resources. This also influences
 * decision-making for other traits when combined.
 *
 * ----------------------------------------------------------------------------
 * <aiTrait:healer>
 * Healer enemies monitor nearby allies and prioritize healing skills to
 * keep those allies alive. If combined with Reckless, they will ignore
 * efficiency and use the strongest healing skill available. If combined
 * with Careful, they will use the best-fit healing skill for the
 * situation rather than just the most powerful one.
 *
 * ----------------------------------------------------------------------------
 * <aiTrait:cleanser>
 * Cleanser enemies scan nearby allies for negative states and attempt to
 * remove them using skills flagged as state-removing. They will prioritize
 * cleansing over attacking when allies are suffering. If combined with
 * Careful, they use the most targeted cleanser available. If combined with
 * Reckless, they will use any cleanser regardless of overlap.
 *
 * ----------------------------------------------------------------------------
 * <aiTrait:buffer>
 * Buffer enemies try to apply positive states to nearby allies using
 * buff-flagged skills before choosing an attack. This lets you build
 * support enemies who bolster their teammates before engaging the player.
 * Buffer is amplified by Careful (more selective) and Reckless (spams it).
 *
 * ----------------------------------------------------------------------------
 * <aiTrait:tactical>
 * Tactical enemies step back to maintain optimal range before using a
 * skill. Where a basic enemy will fire wherever they happen to be,
 * a tactical enemy will reposition first. Pair with Careful or Executor
 * for enemies that stay at range and punish you for advancing.
 *
 * ----------------------------------------------------------------------------
 * <aiTrait:berserker>
 * Berserker enemies go all-out when their HP drops below a threshold.
 * Once low on health, they stop caring about range, cooldowns, or
 * efficiency, and just attack as fast as possible. Think of it as the
 * AI equivalent of "panic mode".
 *
 * ----------------------------------------------------------------------------
 * <aiTrait:follower>
 * NOTE: This is a coordination trait. Prefer <aiRole: follower> instead.
 * Supported as a backward-compatible alias only.
 *
 * ----------------------------------------------------------------------------
 * <aiTrait:leader>
 * NOTE: This is a coordination trait. Prefer <aiRole: leader> instead.
 * Supported as a backward-compatible alias only.
 *
 * ============================================================================
 * AI ROLES:
 * AI roles define how a battler coordinates with other battlers on its
 * team. They are distinct from AI traits, which govern what skills an
 * enemy chooses -- roles govern who they work with and how.
 *
 * A battler can only meaningfully hold one role. Assigning multiple roles
 * to the same battler has undefined behavior.
 *
 * NOTE: AI roles are configured with the <aiRole: X> tag on the enemy
 * database entry or as an event comment override. All roles are optional;
 * an enemy with no role behaves as a default self-interested combatant.
 *
 * ----------------------------------------------------------------------------
 * <aiRole: leader>
 * Leader battlers act like normal enemies and obey their own AI traits,
 * but they also make skill decisions on behalf of nearby followers. A
 * leader uses its own AI traits to choose which skill a follower should
 * execute, effectively turning followers into remote extensions of the
 * leader's strategy.
 *
 * NOTE: Leaders need followers nearby to actually coordinate. Without
 * any followers in range, a leader behaves like a normal enemy.
 *
 * ----------------------------------------------------------------------------
 * <aiRole: follower>
 * Follower battlers are restricted to only their basic attack when no
 * leader is nearby. When a leader is in range, the leader will take over
 * and decide which of the follower's skills to use. This is a great way
 * to create "dormant" enemies that suddenly become dangerous when a boss
 * or leader enemy is present.
 *
 * NOTE: Followers are intentionally hobbled without a leader. If you
 * want followers that can still fight independently but coordinate when
 * a leader is around, give them other AI traits on top of this role.
 *
 * ----------------------------------------------------------------------------
 * <aiRole: guardian>
 * Guardians are passive by default; they will not initiate attacks on
 * their own. However, the moment one of their ward-role allies is struck,
 * the guardian immediately retargets to engage whoever attacked the ward.
 * Think of guardians as bodyguards who stay out of the fight unless their
 * charge is threatened.
 *
 * GUARD RANGE:
 * By default, a guardian's engagement range when protecting a ward is the
 * largest pursuit radius of any ward currently nearby. You can override
 * this with an explicit range tag:
 *    <guardRange:RADIUS>
 *  Where RADIUS is the tile distance at which the guardian can respond
 *  to ward attacks and stay engaged after engaging.
 *
 * Use this when you want a guardian that sits at a distance but swoops
 * in the moment its ward is touched, even from across the room.
 *
 * NOTE: guardRange only applies while the guardian is in guardian mode.
 * Without this tag, the fallback is the max ward pursuit radius, which
 * may be smaller than you want if your wards are close-range fighters.
 *
 * ----------------------------------------------------------------------------
 * <aiRole: ward>
 * Wards are the potential targets of guardian battlers. A ward itself has
 * no special behavioral code -- it simply serves as the "trigger" for a
 * guardian to engage. Place this on any enemy you want others to protect.
 *
 * ----------------------------------------------------------------------------
 * <aiRole: solo>
 * Solo battlers act purely on their own, ignoring all coordination logic.
 * A solo enemy will not respond to leader commands and will not be picked
 * up as a follower. Use this for enemies that should fight independently
 * even if they happen to be in the same area as a leader or follower.
 *
 * ----------------------------------------------------------------------------
 * <aiRole: sentinel>
 * Sentinel battlers hold their position. A sentinel will engage enemies
 * that enter their sight, but once the target leaves the sentinel's home
 * range (based on pursuit radius), the sentinel disengages and returns
 * home. Use this for "guard" type enemies who aren't supposed to chase
 * the player across the entire map.
 *
 * NOTE: The sentinel's "home range" is measured from its spawn position.
 * If the sentinel itself is pushed far from home, it may disengage more
 * readily than expected. Keep sentinel pursuit values reasonable.
 *
 * ============================================================================
 * TEAMS:
 * JABS teams are now fully data-driven.
 *
 * Team relationships (friendly vs opposing) are defined in an external file:
 *  - `data/config.jabs.json`
 *
 * This file is REQUIRED. If it is missing or invalid, JABS will error on boot.
 *
 * The root shape is an object with a `teams` array:
 *  {
 *    "teams": [
 *      { "id": 0, "name": "Allies", "opposes": [ 1, 2 ] },
 *      { "id": 1, "name": "Enemies", "opposes": [ 0, 2 ] },
 *      { "id": 2, "name": "Neutral", "opposes": [ 0, 1 ] }
 *    ]
 *  }
 *
 * Default team assignment (unchanged):
 * - Actors and party battlers are team 0.
 * - Enemies are team 1 (unless overridden).
 * - Inanimate battlers are team 2.
 *
 * Assigning a team id is still done via notes/event comments:
 *    <teamId:TEAM>
 * Where TEAM is the numeric id to assign to the battler.
 *
 * ============================================================================
 * CIRCUMSTANTIAL CONFIG OPTIONS:
 * A few more tags modify the base look or behavior of enemies. Add these
 * to the enemy (in the database or as an event comment override) to
 * change the defaults.
 *
 * ----------------------------------------------------------------------------
 * IDLING:
 * By default, enemies idle in a 2-tile radius around where they were
 * placed on the map. To change this:
 *    <jabsConfig:noIdle>
 *    <jabsConfig:canIdle>
 *
 * ----------------------------------------------------------------------------
 * HP BAR:
 * Enemies have small HP bars beneath them by default. To hide or force
 * the HP bar to show:
 *    <jabsConfig:noHpBar>
 *    <jabsConfig:showHpBar>
 *
 * ----------------------------------------------------------------------------
 * STATE STRIP:
 * Enemies show active affliction icons beneath their hp bar by default.
 * To hide or force the strip to show:
 *    <jabsConfig:hideStates>
 *    <jabsConfig:showStates>
 *
 * ----------------------------------------------------------------------------
 * BATTLER NAME:
 * The name of the enemy is shown beneath their character sprite. To
 * conceal or reveal it:
 *    <jabsConfig:noName>
 *    <jabsConfig:showName>
 *
 * ----------------------------------------------------------------------------
 * INVINCIBLE:
 * To make an enemy completely invincible (skills will not connect), or
 * to disable invincibility:
 *    <jabsConfig:invincible>
 *    <jabsConfig:notInvincible>
 *
 * ----------------------------------------------------------------------------
 * INANIMATE:
 * Pots, crates, bushes, environmental objects -- things that shouldn't
 * think, move, or react. This one tag disables AI, movement, knockback,
 * the HP bar, and more:
 *    <jabsConfig:inanimate>
 *    <jabsConfig:notInanimate>
 *
 * ============================================================================
 * FIRST TIME SETUP, THE ENEMY MAP:
 * While you can create enemies on the map as much as your heart desires,
 * it is also possible to dynamically generate enemies on-the-fly with
 * plugin or script commands. If you want to use this, you will need to
 * define an "enemy clone map" -- a map of premade enemy events used
 * exclusively for spawning via plugin/script commands.
 *
 * NOTE: If you have zero chance of using this functionality, JABS will
 * operate fine as long as the map defined as "enemy clone map" in the
 * plugin configuration does indeed exist.
 *
 * ============================================================================
 * SETTING UP THE ENEMIES IN THE DATABASE:
 * Setting up an enemy event is not quite enough on its own. A couple of
 * basics still need to be defined in the database.
 *
 * NOTE: Configuration you want to apply universally to all enemies of a
 * given id should be placed in the database notes for that enemy, rather
 * than repeated on every single event.
 *
 * ----------------------------------------------------------------------------
 * BASIC ATTACK:
 * All enemies should have a "basic attack". This is defined by the
 * "Attack Skill" trait, found at the top of the third page in the trait
 * picker for enemies.
 *
 * PREPARE SPEED:
 * To emulate a "turn speed", enemies wait a fixed number of frames before
 * acting. This is defined by the "Attack Speed" trait found in the middle
 * of the third page in the trait picker. You can also use the
 * <prepare: FRAMES> tag described above to override this value.
 * ----------------------------------------------------------------------------
 * AVAILABLE SKILLS:
 * Any skills listed in the "Action Patterns" section of an enemy in the
 * database will be considered available. To create a skill usable in
 * JABS, see the "SETTING UP YOUR SKILLS" section below.
 *
 * NOTE ABOUT CONDITIONS:
 * Enemies do not currently obey conditions; they obey their AI traits
 * along with skill cooldowns.
 *
 * NOTE ABOUT SKILL EXTENSION FOR ENEMIES:
 * If you are leveraging "J-SkillExtend", extension skills must be known
 * to the enemy in some form. Extension skills are excluded from random
 * selection but will still apply their extension effects.
 *
 * ============================================================================
 * FIRST TIME SETUP, THE ACTION MAP:
 * If you're not using the demo as a base, you'll need to add a new map
 * to your project where all the "action events" will live. These events
 * represent the visual components of skills on the map and are linked to
 * skills via a tag on the skill. Once you've created the map, take note
 * of the map id and set it in the plugin parameters as "Action Map Id".
 *
 * ============================================================================
 * SETTING UP YOUR SKILLS:
 * In addition to setting up enemies, you'll need to set up skills.
 * There are a huge variety of tags to use, but a few will appear on
 * most skills.
 *
 * NOTE ABOUT THROUGH:
 * I would strongly encourage setting action events on the action map to
 * have "through" checked. Otherwise, they may get stuck on events or
 * terrains unexpectedly, especially with pixel movement plugins.
 *
 * ----------------------------------------------------------------------------
 * ACTION ID:
 * Associate a skill with an event on the action map.
 *    <actionId:EVENT_ID>
 *  Where EVENT_ID is the id of the event from the action map.
 *
 * ----------------------------------------------------------------------------
 * DURATION:
 * How long the skill's action event persists on the map.
 *    <duration:FRAMES>
 *  Where FRAMES is how long in frames this event will exist.
 *
 * NOTE ABOUT HIT COUNT:
 * When a skill hits its maximum number of times (once by default, or as
 * many as defined by the "pierce" tag), it disappears.
 *
 * NOTE ABOUT MIN DURATION:
 * Skills have an arbitrary minimum duration of 8 frames.
 *
 * ----------------------------------------------------------------------------
 * LINGER:
 * When an action expires (runs out of hits or duration), it normally
 * vanishes immediately. With linger, the action event will fade out over
 * the given number of frames instead, giving a visual tail. Collision is
 * disabled during the linger phase.
 *    <linger:FRAMES>
 *  Where FRAMES is how many frames to spend fading out.
 *
 * NOTE: All skills have a default linger of 10 frames if no tag is set.
 * Set to 0 if you want the action event to disappear instantly.
 *
 * ----------------------------------------------------------------------------
 * COOLDOWN MANAGEMENT:
 * To prevent endless skill spam, you'll want to add cooldowns.
 *
 * COOLDOWN:
 * The primary tag for cooldown management. This defines the number of
 * frames that must pass before the skill can be used again.
 *    <cooldown:VAL>
 *  Where VAL is the cooldown in frames for this skill.
 *
 * NOTE ABOUT SLOTS ON COOLDOWN:
 * JABS allows the same skill to be equipped in multiple slots. By
 * default, when a skill with a cooldown is used, all slots carrying that
 * same skill ID will also go on cooldown. Use the next tag to change this.
 *
 * UNIQUE COOLDOWN:
 * Forces each slot to track its cooldown independently, even if the skill
 * shares the same ID as another slot.
 *    <uniqueCooldown>
 *
 * GLOBAL COOLDOWN (GCD):
 * Optional battler-wide lockout after using skills whose skill type id (stypeId)
 * is listed in plugin param "Global Cooldown Skill Types" (number[]). Dodge and
 * tool inputs never participate. Enable via "Enable Global Cooldown".
 *    <noGlobalCooldown>
 *    <ogcd>
 *  Either tag marks an "oGCD" skill: it does not stamp GCD and is not blocked
 *  by the global timer.
 *    <gcd:FRAMES>
 *  Overrides default GCD length for this skill when it triggers GCD.
 *
 * COOLDOWN REDUCTION (CDR):
 * A battler-wide stat that shrinks how long the global cooldown lasts once
 * it's triggered. This is not a per-skill tag -- it's summed from every note
 * source on the battler (actor, class, weapons, armors, states) and cached
 * as a single percent-point value, same as a stat like ATK would be.
 *    <cdr:[FORMULA]>
 *  Where FORMULA resolves to the percent-points of cooldown reduction this
 *  source contributes. All matching sources are summed together.
 *
 * Formula context: a = the battler being evaluated, b = 0, v = $gameVariables._data.
 *
 * EXAMPLE:
 *    <cdr:[10]>
 *  This source grants a flat +10 percent-points of CDR.
 *
 *    <cdr:[a.luk * 0.1]>
 *  This source grants CDR scaled off the battler's own LUK.
 *
 * NOTE: The final summed value is converted from percent-points to a decimal
 * before use (e.g. 25 percent-points becomes 0.25) and clamped at 0 on the
 * low end by the GCD length math (Math.max(0, baseFrames * (1 - cdr))). A
 * total of 100 or more percent-points reduces GCD length to zero frames.
 *
 * ----------------------------------------------------------------------------
 * RADIUS:
 * How large the hitbox of this skill is, using tiles as measurement.
 * Must be a positive number.
 *    <radius:VAL>
 *  Where VAL is the radius value for this skill.
 *
 * ----------------------------------------------------------------------------
 * PROXIMITY:
 * Defines the maximum tile distance between the battler and the target at which
 * the skill can be used. This tag serves two purposes:
 *
 * 1. AI GATE: An AI-controlled battler will not attempt this skill unless they
 *    are within VAL tiles of their current target.
 *
 * 2. DIRECT SKILL RANGE: For skills that also carry <direct>, proximity defines
 *    the search radius for target selection at decision time. The engine will
 *    only lock onto targets within this distance. All direct skills must have
 *    this tag -- it is not optional.
 *
 *    <proximity:VAL>
 *  Where VAL is the proximity value (in tiles) for this skill.
 *
 * NOTE: <proximity:0> means zero range, not uncapped. A value of 0 will never
 * match any target.
 *
 * ----------------------------------------------------------------------------
 * DIRECT:
 * With the "direct" tag, the skill locks onto the nearest valid target within
 * <proximity:N> rather than firing a flying map projectile. The hitbox event
 * is spawned at the resolved target's tile and stays there.
 * The skill still obeys CAST TIME, RADIUS, HITBOX, and other tags.
 *
 * <direct> requires <proximity:N> on the same skill. Proximity defines the
 * maximum range at which a target can be locked onto.
 *
 * Target selection priority (highest to lowest):
 *   1. Opponent carrying the <directStateTarget:N> state (if configured).
 *   2. Non-inanimate explicit target or last-hit within range.
 *   3. Closest non-inanimate opponent found via proximity scan.
 *   4. Inanimate fallback (explicit target or last-hit within range).
 *
 *    <direct>
 *
 * NOTE ABOUT PARRYING:
 * A "direct" skill can still be parried if all parry conditions are met.
 *
 * NOTE ABOUT DODGING:
 * By default, a direct skill snapshots the target's position when the
 * decision is made. If the target moves during the cast window, the
 * action will fire at where the target was, not where they are now.
 * This gives a skilled player a window to dodge by moving away during
 * the cast. If you want to remove that window, use <directLock> below.
 *
 * ----------------------------------------------------------------------------
 * DIRECT LOCK:
 * Similar to <direct>, but locks onto the target's live position at the
 * moment the skill fires rather than when it was decided. This removes
 * the dodge window -- the action will always originate right on top of
 * the target regardless of how far they moved during the cast.
 *    <directLock>
 *
 * Use this for skills that should feel guaranteed and inescapable, like
 * a debuff that snaps to the target even if they teleport mid-cast.
 *
 * NOTE: <directLock> and <direct> are mutually exclusive. If both are
 * present on a skill, <directLock> takes precedence.
 *
 * ----------------------------------------------------------------------------
 * DIRECT STATE TARGET:
 * When present on a <direct> skill, the targeting system will prioritize any
 * opponent within <proximity:N> that is currently afflicted with the specified
 * state ID above all other targeting candidates.
 *
 * This is designed for combo chains where the opening hit applies a "mark"
 * state to the target, and subsequent hits in the chain should snap to that
 * marked target rather than the nearest foe. As long as the state is active
 * and the target is within proximity, the chain stays locked.
 *
 * If the state expires, the target moves beyond proximity, or the state is
 * cleansed, the skill falls through to the normal priority chain.
 *
 *    <directStateTarget:STATE_ID>
 *  Where STATE_ID is the ID of the state that marks the priority target.
 *
 * NOTE: Requires <direct> and <proximity:N> on the same skill.
 * NOTE: Proximity is always enforced. A marked target beyond range is not eligible.
 *
 * ----------------------------------------------------------------------------
 * PROJECTILE:
 * How many projectiles fire when the skill is executed. All fire in
 * parallel in the direction the caster is facing.
 *    <projectile:VAL>
 *  Where VAL is the number of projectiles per direction.
 *
 * NOTE: There is no hard cap, but keep the count reasonable to avoid
 * performance issues.
 *
 * PROJECTILE DURATION:
 * A battler-wide percent-point modifier against how long ALL of this
 * battler's map actions (projectiles, hitboxes, everything with a
 * <duration:FRAMES> tag) persist on the map. This is not a per-skill tag --
 * it's summed from every note source on the battler (actor, class,
 * weapons, armors, states), same as CDR/PER above.
 *    <projectileDuration:PERCENT_POINTS>
 *  Where PERCENT_POINTS is the percent-point offset from the 100 baseline.
 *  All matching sources are summed together before being applied.
 *
 * EXAMPLE:
 *    <projectileDuration:50>
 *  This source makes this battler's map actions last 150% as long (100 + 50).
 *
 *    <projectileDuration:-40>
 *  This source makes this battler's map actions last 60% as long (100 - 40).
 *
 * NOTE: The combined total is clamped so the resulting multiplier never
 * drops below 0 (a total of -100 or less reduces duration to nothing).
 *
 * ----------------------------------------------------------------------------
 * FORMATION:
 * Defines the direction pattern in which projectiles fire. Valid values:
 *  line:   Fires in a straight line.
 *  spray:  Fires in a spray pattern (like a W).
 *  cross:  Fires in a cross (the four cardinal directions).
 *  xburst: Fires in an X (the four diagonal directions).
 *  nova:   Fires in a circle (all 8 cardinal + diagonal directions).
 *
 *    <formation:VAL>
 *  Where VAL is one of the valid formation values listed above.
 *
 * NOTE ABOUT PROJECTILE MOTION:
 * Use "turn X degrees" instead of "turn X direction" in custom move
 * routes, and "1 step forward/backward" instead of "Move up/down/
 * left/right". This preserves the illusion that projectiles respect
 * the direction they were fired.
 *
 * NOTE ABOUT DIAGONALS:
 * Use my "J-ABS-Diagonals" plugin for more precise rotation within
 * custom move routes.
 *
 * ----------------------------------------------------------------------------
 * HITBOX:
 * The hitbox defines the shape of collision for this skill. The hitbox
 * is always centered on the action event (with some exceptions).
 *
 * NOTE: If this skill has multiple projectiles, all share the same
 * hitbox shape.
 *
 * CIRCLE:
 * A circle that grows in size with greater radius.
 *    <hitbox:circle>
 *
 * RHOMBUS:
 * A diamond that grows in size with greater radius.
 *    <hitbox:rhombus>
 *
 * ARC:
 * A forward-facing wedge. Like a rhombus, but the back half is omitted.
 * The width of the arc at its widest point is controlled by the
 * <degrees: VAL> tag (see below). Defaults to 90 degrees if omitted.
 *    <hitbox:arc>
 *
 * SQUARE:
 * An equal square. The <radius> defines the length of each side.
 *    <hitbox:square>
 *
 * LINE:
 * A single 1-tile-wide line. The <radius> defines the line's length.
 *    <hitbox:line>
 *
 * WALL:
 * A single 1-tile-tall horizontal wall. The <radius> defines its width.
 * Think of it as an inverted line hitbox.
 *    <hitbox:wall>
 *
 * CROSS:
 * The combination of line and wall in one cross shape. The <radius>
 * determines how far each arm of the cross reaches.
 *    <hitbox:cross>
 *
 * ----------------------------------------------------------------------------
 * DEGREES:
 * Controls the angular width of an ARC hitbox. Values from 1 to 359.
 * If degrees is 180 or more, the arc effectively becomes a full forward
 * hemisphere with width equal to double the radius.
 *    <degrees:VAL>
 *  Where VAL is the arc angle in degrees.
 *
 * NOTE: This tag only affects the ARC hitbox. It is ignored by all
 * other hitbox types.
 *
 * ----------------------------------------------------------------------------
 * THICKNESS:
 * Controls how many extra tiles of width a LINE or WALL hitbox occupies
 * perpendicular to its primary axis.
 *    <thickness:VAL>
 *  Where VAL is the additional perpendicular width in tiles.
 *
 * For a LINE hitbox, thickness grows the hit area sideways.
 * For a WALL hitbox, thickness grows the hit area upward/downward.
 * NOTE: This tag only affects LINE and WALL hitboxes.
 *
 * ----------------------------------------------------------------------------
 * INNER RADIUS:
 * Excludes targets within VAL tiles of the action's origin from colliding at
 * all, regardless of hitbox shape -- a universal dead zone carved out of the
 * middle of whatever shape the skill uses (a donut CIRCLE, an ARC with a bite
 * taken out of its own pivot, etc). Applies uniformly to every hitbox type.
 *    <innerRadius:VAL>
 *  Where VAL is the dead zone radius, in tiles. Supports decimals.
 *
 * The exclusion is measured from the target's center point, not its full
 * hitbox -- a target is excluded only once its center crosses inside VAL
 * tiles of the origin, matching how the outer shape checks already treat
 * a target as "in range" the moment any part of it qualifies.
 *
 * NOTE ABOUT RING WIDTH: keep (RADIUS - VAL) at least 0.5 tiles. This engine's
 * targeting precision bottoms out around half a tile elsewhere (see PROXIMITY
 * and DIRECT skill targeting); a thinner ring than that asks the player to
 * land inside a band too narrow to reliably hit in real-time play, even
 * though the collision math itself is correct at any width.
 *
 * ----------------------------------------------------------------------------
 * CAST TIME:
 * The number of frames the battler must wait before the skill fires.
 * While casting, the "cast animation" will loop if one is defined.
 *    <castTime:VAL>
 *  Where VAL is the number of frames to cast this skill.
 *
 * ----------------------------------------------------------------------------
 * CAST ANIMATION:
 * An animation that loops on the caster while the skill is being cast.
 *    <castAnimation:VAL>
 *  Where VAL is the animation id to loop while casting.
 *
 * ----------------------------------------------------------------------------
 * SELF ANIMATION:
 * An animation that plays on the caster when the skill hits a target.
 *    <selfAnimationId:VAL>
 *  Where VAL is the animation id to execute once the hit lands.
 *
 * ----------------------------------------------------------------------------
 * ON-CAST ANIMATION:
 * An animation that plays on the caster once the cast is complete and
 * the skill fires. Unlike the CAST ANIMATION (which loops during casting),
 * this plays exactly once at the moment of skill execution.
 *    <onCastAnimationId:VAL>
 *  Where VAL is the animation id to play at the moment of execution.
 *
 * Use this to create a "launch" effect -- e.g., the cast animation builds
 * up tension, and the on-cast animation is the visible "release".
 *
 * ----------------------------------------------------------------------------
 * CHANNEL:
 * Turns this skill into a "vessel": instead of executing its own effects, it pays its own
 * cost once, then repeatedly executes a child skill every so many frames for a total duration.
 *    <channel:[SKILL_ID, TOTAL_DURATION]>
 *  Where SKILL_ID is the skill id to repeatedly execute.
 *  Where TOTAL_DURATION is the number of frames the channel lasts.
 *
 * A vessel skill's own damage/effects are never invoked- author it with no real effects of its
 * own. The first execution of SKILL_ID happens after the first tick interval elapses, not
 * immediately when the channel begins.
 *
 *    <channelTickSpeed:VAL>
 *  Optional. VAL is the number of frames between each repeated execution of SKILL_ID. Falls
 *  back to the plugin's configured default channel tick speed when omitted.
 *
 *    <onChannelComplete:[SKILL_ID, ...]>
 *  Optional. One or more skill ids to execute for free, once, immediately after the channel
 * completes its full duration uninterrupted. Resolved the same way the channel's own ticks are-
 * does NOT fire if the channel is cut short by an interrupt.
 *
 * Example:
 *    <channel:[25, 180]>
 *    <channelTickSpeed:30>
 *    <onChannelComplete:[36]>
 *  Fires skill 25 every 30 frames for 180 frames (6 executions), then fires skill 36 once, for
 *  free, the instant the channel completes- but only if nothing interrupted it first.
 *
 * ----------------------------------------------------------------------------
 * CASTING / CHANNELING INTERRUPTION:
 * By default, ALL casting and channeling can be interrupted two ways: the caster chooses to
 * move (self-interrupt), or an enemy lands a hit with an `<interrupt:MAGNIFIER>` skill
 * (external interrupt). Either way, the skill in-flight never fires (or, for a channel, no
 * further ticks/on-complete payoff occur), and a cooldown penalty is stamped onto the
 * interrupted skill's own slot: its full effective cooldown for a self-interrupt, or that
 * cooldown scaled by MAGNIFIER percent for an external interrupt.
 *
 *    <cannotMoveToInterrupt>
 *  Placed on the casting/channeling skill itself. Roots the caster in place entirely for the
 *  duration (today's original cast-time behavior)- movement is simply not possible, so it can
 *  never trigger a self-interrupt.
 *
 *    <interrupt:MAGNIFIER>
 *  Placed on an attacking skill. On landing a hit against a casting/channeling target, cancels
 *  that cast/channel and stamps (target's effective cooldown for the interrupted skill) *
 *  (MAGNIFIER / 100) onto its slot. A skill with no `<interrupt>` tag never disturbs a cast or
 *  channel it hits, no matter how hard it hits.
 *
 * Example: a skill has a cooldown of 100 frames, reduced by CDR/fastCooldown to an effective
 * 75 frames. It gets hit by an `<interrupt:200>` skill mid-cast: the slot goes on cooldown for
 * 75 * (200 / 100) = 150 frames.
 *
 *    <thisCannotBeInterrupted>
 *  Placed on the casting/channeling skill itself. That specific cast/channel cannot be
 *  externally interrupted, regardless of the caster's own battler-wide immunity (or lack
 *  thereof). Does not affect self-interruption via movement- that is `<cannotMoveToInterrupt>`'s
 *  job.
 *
 *    <cannotBeInterrupted>
 *  A battler-wide immunity tag, read from ANY of a battler's own note sources (states, equips,
 *  class, actor)- not the skill being cast/channeled. Suppresses external interrupts entirely
 *  for this battler, no matter what is casting/channeling. Does not affect self-interruption via
 *  movement.
 *
 * ----------------------------------------------------------------------------
 * PIERCING:
 * Defines how many collision "steps" (connections) the map action may
 * complete before it ends, and the delay between those steps.
 *    <pierce:[TIMES,DELAY]>
 *  Where TIMES is the connection budget for this skill (including the first).
 *  Where DELAY is the number of frames to wait before the next connection.
 *
 * NOTE ABOUT HIT FREQUENCY:
 * The most a skill can register a new connection is once per frame. A DELAY
 * of 0 means it can connect every frame its hitbox overlaps valid targets.
 *
 * NOTE ABOUT DATABASE REPEATS:
 * JABS does not read the RMMZ skill "repeats" field for pierce or for extra
 * hits per connection. Use <pierce:[...]> and the bonus-hits tags below.
 *
 * ----------------------------------------------------------------------------
 * PER-CONNECTION BONUS HITS (SKILL NOTE):
 * Each time a pierce step resolves against targets, JABS runs the full
 * battle-effect pipeline once per target, plus extra runs controlled by
 * bonus-hit tags. This tag on the skill adds extra applications per target
 * for that step (stacking with battler-side tags).
 *    <bonus-hits:VAL>
 *  Where VAL is a non-negative integer added to the per-connection bonus.
 *
 * FORMULA VARIANT:
 * VAL can also be a bracketed formula instead of a flat integer, evaluated
 * with `a` bound to the caster at the moment the action is created.
 *    <bonus-hits:[FORMULA]>
 *  Where FORMULA is a JS-style expression (e.g. <bonus-hits:[a.luk / 10]>).
 *
 * NOTE: The final combined total across every bonus-hits source (flat and
 * formula, skill-note and battler-side) is floored once at the very end.
 * Formulas do not need to wrap themselves in floor() -- the engine handles
 * discretization so a clean `a.luk / 10` is fine as-is.
 *
 * PARRY VS GUARD:
 * If a parry triggers on a target during the first application of a bundle,
 * remaining applications in that bundle for that target are skipped. Guard
 * still runs every application in the bundle with normal mitigation each time.
 *
 * ----------------------------------------------------------------------------
 * KNOCKBACK:
 * How many tiles the target is knocked back when hit by this skill.
 *    <knockback:VAL>
 *  Where VAL is the distance the target will be knocked back.
 *
 * IGNORE TERRAIN:
 * By default, forced displacement (knockback, pull, etc.) walks the target
 * tile-by-tile toward the destination and stops early at the last passable
 * tile if terrain blocks the rest of the way. With this tag, the target
 * instead jumps straight to the computed destination, sailing over pits,
 * gaps, or anything else that would normally halt the walk.
 *    <ignoreTerrain>
 *
 * ----------------------------------------------------------------------------
 * DELAY:
 * Allows a skill to sit on the map for a duration before triggering.
 * Think time bombs or landmines. Set DURATION to -1 to never detonate
 * until touched.
 *    <delay:[DURATION,TOUCHABLE,TRIGGER_RADIUS?]>
 *  Where DURATION is frames to exist before detonating.
 *  Where TOUCHABLE is true/false for whether touching it triggers it.
 *  Where TRIGGER_RADIUS (optional) is a tile radius used ONLY for touch-arming
 *  during the delay window. When omitted, touch-triggering falls back to the
 *  action's normal hitbox. This lets the touch-trigger space be smaller (or
 *  larger) than the eventual detonation/hitbox size- e.g. a mine that's only
 *  steppable-on within 1 tile, but explodes across a much bigger AoE once it
 *  actually goes off.
 *
 * EXAMPLE:
 *      <delay:[300,true]>
 * Sits on the map for 300 frames (~5 seconds). Any enemy who walks
 * into it (within the action's normal hitbox) triggers the action.
 *
 *      <delay:[300,true,1]>
 * Same as above, but only touch-arms within 1 tile- the detonation itself
 * still uses whatever AoE the skill's own hitbox tags define.
 *
 * WARNING ABOUT INDEFINITE DELAY:
 * If DURATION is -1, set TOUCHABLE to true, or the action will sit
 * there forever and never trigger.
 *
 * ----------------------------------------------------------------------------
 * COMBOS:
 * COMBO ACTION:
 * Defines what skill can be followed up after using this skill, how long
 * until that follow-up becomes available, and optionally how long the window
 * stays open before the combo is auto-cleared.
 *    <combo:[COMBO_SKILL_ID]>
 *    <combo:[COMBO_SKILL_ID, LINK_TIME]>
 *    <combo:[COMBO_SKILL_ID, LINK_TIME, EXPIRE_FRAMES]>
 *  Where COMBO_SKILL_ID is the skill ID that will be combo'd into.
 *  Where LINK_TIME is frames until the combo becomes pressable (default 0).
 *  Where EXPIRE_FRAMES is the total frames from skill fire until the combo
 *  auto-clears if unused (default 0 = no expiry; window stays open until
 *  the slot's base cooldown resets).
 *
 * The combo-starter's cooldown must be longer than the LINK_TIME, or
 * the combo will never be reachable. Each executed combo action extends
 * the remaining cooldown by LINK_TIME, keeping the chain going.
 *
 * EXPIRE_FRAMES counts from the moment the opener fires — not from when
 * the combo becomes pressable. For a tight follow-up window on a slow skill,
 * set EXPIRE_FRAMES close to LINK_TIME so the player must press quickly
 * once the combo opens.
 *
 * EXAMPLE:
 *      <combo:[2,10]>
 * Using this skill makes skill ID 2 available after 10 frames (no expiry).
 *
 *      <combo:[5,8,60]>
 * Makes skill ID 5 available after 8 frames; auto-clears after 60 frames
 * total if the player has not pressed it.
 *
 * COMBO STARTER:
 * AI-controlled battlers ignore skills with combo tags by default.
 * Adding this tag tells the AI that this skill is safe to initiate.
 *    <comboStarter>
 *
 * NOTE: Follow-up combos require the skill to connect with a target.
 * If you want the combo to become available regardless of whether the
 * skill hit, use <freeCombo> instead.
 *
 * FREECOMBO:
 * Makes the next combo action available immediately on skill execution,
 * without requiring a hit.
 *    <freeCombo>
 *
 * AI SKILL EXCLUSION:
 * Excludes this skill from the pool of skills an AI battler can select.
 * Useful for combo-ender skills that should only be reachable through
 * the combo chain, not random selection.
 *    <aiSkillExclusion>
 *
 * NOTE ABOUT SKILL EXTENSION SKILLS:
 * If using "J-SkillExtend", extension skills are automatically excluded
 * from random AI selection, identical to the tag above.
 *
 * ----------------------------------------------------------------------------
 * GUARDING:
 * Guarding is a first-class feature of JABS!
 *
 * IMPLICIT VS EXPLICIT PARRY:
 * Implicit (passive) parry uses attacker pressure A vs defender pressure D: baseline
 * floor plus per-level on each side (caster level on A, target level on D), then
 * 100×HIT and 100×(GRD−1) respectively and small AGI/LUK terms; J-LEVEL scales A like
 * other attacker-vs-target effects, then
 * ratio = A/max(D,1). If ratio >= M (plugin param, default 2), no parry; if
 * ratio <= 1/M, always parry; between, linear chance. It does
 * not run while the defender is guarding, casting, or dashing — timed guard
 * parry replaces implicit while a guard is held, and committed movement or
 * casts suspend passive parry. Dash and guard are mutually exclusive for the
 * player (pivot guard clears dash; pixel movement does not reapply dash while
 * guarding).
 *
 * Explicit parry is the <parry:N> window after raising guard; EVA extends
 * that window. Skills may still use <unparryable> and <ignoreParry:N>.
 *
 * NOTE ABOUT GUARD SKILL TYPES:
 * A skill must have the "Guard Skill Type" id to be recognized as a
 * guard skill. This is defined in the plugin parameters.
 *
 * GUARD:
 * The basic guard tag defines damage reduction when guarding.
 *    <guard:[FLAT,PERCENT]>
 *  Where FLAT is the flat damage modification (usually negative).
 *  Where PERCENT is the percent damage modification (usually negative).
 *
 * EXAMPLE:
 *      <guard:[-10,-25]>
 * Reduces damage by 10 flat, then by 25%. Flat comes first to favor
 * the player.
 *
 * PARRY:
 * Defines the window (in frames) where a "just guard" completely
 * mitigates an incoming attack.
 *    <parry:VAL>
 *  Where VAL is the number of frames parrying is available.
 *
 * The window opens when guarding starts and counts down. A successful
 * parry is identified by a blue flash on the guarding battler.
 *
 * NOTE: On a successful parry, all guarding stops and the parry window
 * ends. Release and re-press the guard button to parry again.
 *
 * COUNTER-GUARD/COUNTER-PARRY:
 * Define a skill to fire back when guarding or parrying.
 *    <counterGuard:[SKILL,CHANCE]>
 *  Where SKILL is the skill ID to counter with when guarding.
 *  Where CHANCE is the percent chance to execute per hit guarded.
 *
 *    <counterParry:[SKILL,CHANCE]>
 *  Where SKILL is the skill ID to counter with when parrying.
 *  Where CHANCE is the percent chance to execute on parry.
 *
 * NOTE: Counter-parry takes precedence over counter-guard. If both
 * are available and RNG favors a counter, only counter-parry fires.
 *
 * UNPARRYABLE:
 * Makes a skill unable to be parried under any circumstances.
 *    <unparryable>
 *
 * PARRY EXTENSION RATE (PER):
 * A battler-wide stat that widens the parry window (see PARRY above). This
 * is not a per-skill tag -- it's summed from every note source on the
 * battler (actor, class, weapons, armors, states) and cached as a single
 * percent-point value, same as CDR above.
 *    <per:[FORMULA]>
 *  Where FORMULA resolves to the percent-points of parry extension this
 *  source contributes. All matching sources are summed together.
 *
 * Formula context: a = the battler being evaluated, b = 0, v = $gameVariables._data.
 *
 * EXAMPLE:
 *    <per:[15]>
 *  This source grants a flat +15 percent-points of parry window extension.
 *
 *    <per:[a.agi * 0.2]>
 *  This source extends the parry window scaled off the battler's own AGI.
 *
 * NOTE: The final summed value is converted from percent-points to a decimal
 * (e.g. 50 percent-points becomes 0.50) and applied as a multiplier against
 * the skill's parry window: Math.floor((1 + per) * parryDuration). A total
 * of 50 percent-points makes the parry window 1.5x as long.
 *
 * ============================================================================
 * ON-CHANCE EFFECTS:
 * These tags define skills that can fire under special circumstances.
 * Each tag takes the form [SKILL_ID, CHANCE], where CHANCE is an integer
 * percent (0-100).
 *
 * ----------------------------------------------------------------------------
 * RETALIATE:
 * When this battler is struck, they have a chance to fire a skill in
 * immediate retaliation.
 *    <retaliate:[SKILL_ID, CHANCE]>
 *    <retaliate:[SKILL_ID, CHANCE, TYPE]>
 *  Where SKILL_ID is the skill to fire.
 *  Where CHANCE is the integer percent chance to fire it (0-100).
 *  Where TYPE is an optional hit type filter: physical, magical, or certain.
 *    When TYPE is omitted the skill fires regardless of the incoming hit type.
 *    When TYPE is set the skill only fires if the incoming hit matches that type.
 *
 * Inside the payload skill's damage formula, three extra variables are available:
 *    d  — the HP damage dealt by the hit that triggered this retaliation
 *    m  — the MP damage dealt by the triggering hit
 *    t  — the TP damage dealt by the triggering hit
 * All three default to 0 in non-retaliation formulas, so referencing them is safe
 * on any skill.
 *
 * Thorns authoring example — reflect 30% of physical HP damage back:
 *    <retaliate:[THORNS_SKILL_ID, 100, physical]>
 *    Payload skill formula: d * 0.3
 *    Payload skill: <unparryable>
 *
 * Place this tag on a state, piece of equipment, skill, class, or actor note.
 *
 * ----------------------------------------------------------------------------
 * ON OWN DEFEAT:
 * When this battler is defeated, they may fire a parting skill.
 *    <onOwnDefeat:[SKILL_ID,CHANCE]>
 *  Where SKILL_ID is the skill to fire on self-defeat.
 *  Where CHANCE is the integer percent chance to fire it (0-100).
 *
 * Use this for enemies that "explode" or curse the player on death.
 *
 * ----------------------------------------------------------------------------
 * ON TARGET DEFEAT:
 * When this battler defeats a target, they may fire a follow-up skill.
 *    <onTargetDefeat:[SKILL_ID,CHANCE]>
 *  Where SKILL_ID is the skill to fire when killing a target.
 *  Where CHANCE is the integer percent chance to fire it (0-100).
 *
 * Use this for "execute" skills or landing a visual flourish on a kill.
 *
 * ----------------------------------------------------------------------------
 * ON DEFEATED TARGET:
 * A companion flag for <onTargetDefeat>. When present on a skill that
 * fires via onTargetDefeat, the action event spawns on top of the
 * defeated target's last position rather than on the caster.
 *    <onDefeatedTarget>
 *
 * Without this flag, the onTargetDefeat skill spawns at the caster.
 * With this flag, the visual effect appears where the target fell.
 * Use this to create effects like "on kill: play animation on corpse".
 *
 * ----------------------------------------------------------------------------
 * ON EVADE APPLY:
 * When this battler evades an incoming attack, they may inflict a state on
 * the attacker who missed them.
 *    <onEvadeApply:[STATE_ID, CHANCE]>
 *  Where STATE_ID is the id of the state to apply to the attacker.
 *  Where CHANCE is the integer percent chance to apply it (0-100).
 *
 * Use this for retributive effects — punishing the attacker for missing.
 *
 * ----------------------------------------------------------------------------
 * ON EVADE APPLY SELF:
 * When this battler evades an incoming attack, they may apply a state to
 * themselves (the one who evaded).
 *    <onEvadeApplySelf:[STATE_ID, CHANCE]>
 *  Where STATE_ID is the id of the state to apply to the evader.
 *  Where CHANCE is the integer percent chance to apply it (0-100).
 *
 * Use this for self-buff effects — rewarding the evader for successfully
 * dodging an attack.
 *
 * ----------------------------------------------------------------------------
 * ON EVADE EXECUTE:
 * When this battler evades an incoming attack, they may fire a skill.
 * The attacker is used as the seed target; the skill's own scope determines
 * actual targeting (an AoE or self-targeting skill ignores the seed target).
 *    <onEvadeExecute:[SKILL_ID, CHANCE]>
 *  Where SKILL_ID is the id of the skill to execute on evasion.
 *  Where CHANCE is the integer percent chance to execute it (0-100).
 *
 * Use this for counter-attacks, gap-closers, or any skill that should
 * trigger automatically when the battler successfully evades.
 *
 * ============================================================================
 * ON-CHANCE ROLL MANIPULATION (LUCKY/CURSED ROLLS):
 * Nearly every on-chance roll in JABS (hit, crit, state application, and
 * skill procs) isn't a single roll -- it's a "best of N" roll for the party
 * rolling toward success and a "best of N" roll for the party rolling
 * toward failure, where N defaults to 1 for each side. These tags let you
 * add extra rolls to either side of that contest.
 *
 * Formula context: a = the battler being evaluated, b = 0, v = $gameVariables._data.
 *
 * LUCKY ROLLS:
 * Battler-wide extra positive rerolls, summed from all note sources. This
 * battler gets an extra roll toward success any time IT is the one trying
 * to succeed (landing a hit, applying a state, scoring a crit, proccing a
 * bonus-hit or retaliate check).
 *    <luckyRolls:[FORMULA]>
 *  Where FORMULA resolves to the number of bonus positive rolls to grant.
 *
 * THIS LUCKY ROLLS:
 * Skill-scoped variant. Adds on top of the battler-wide total, but only
 * while this specific skill is executing.
 *    <thisLuckyRolls:[FORMULA]>
 *
 * CURSED ROLLS:
 * Battler-wide extra negative rerolls, summed from all note sources. This
 * battler gets an extra roll toward failure any time it is on the
 * receiving end of a chance roll (an incoming hit trying to land, an
 * incoming state trying to apply).
 *    <cursedRolls:[FORMULA]>
 *  Where FORMULA resolves to the number of bonus negative rolls to grant.
 *
 * THIS CURSED ROLLS:
 * Skill-scoped variant, layered on top of the battler-wide total. Applies
 * while the target is defending against this specific incoming skill.
 *    <thisCursedRolls:[FORMULA]>
 *
 * EXAMPLE:
 *    <luckyRolls:[Math.floor(a.luk / 20)]>
 *  Grants one bonus positive roll per 20 points of this battler's own LUK.
 *
 * VERY LUCKY / VERY CURSED:
 * Boolean bypass flags rather than reroll counts. These short-circuit the
 * roll contest entirely instead of adding more dice to it.
 *    <veryLucky>
 *  This battler's on-chance rolls always succeed when it is the roller.
 *    <veryCursed>
 *  This battler's on-chance rolls always fail when it is the roller.
 *
 * NOTE: veryLucky/veryCursed are checked before any reroll math runs, so a
 * battler with both tags present resolves to whichever the engine checks
 * first (lucky wins ties) -- avoid stacking both on the same battler.
 *
 * ----------------------------------------------------------------------------
 * ENCORE REPEATS (BONUS PROC EXECUTIONS):
 * A battler-wide bonus to how many times a successful on-chance proc (bonus
 * hits, retaliate, on-evade, on-defeat, etc.) actually executes once it
 * succeeds. A proc that would normally fire once instead fires
 * 1 + encoreRepeats times.
 *    <encoreRepeats:[FORMULA]>
 *  Where FORMULA resolves to the number of bonus executions per success.
 *
 * Formula context: a = the battler being evaluated, b = 0, v = $gameVariables._data.
 *
 * ACCUMULATE MODE:
 * By default, a chance-roll contest stops rolling the instant it finds one
 * success (or exhausts all rolls without one). With <accumulate>, every
 * single positive roll in the contest is counted instead of stopping at
 * the first success, and that count feeds into how many times the proc
 * executes -- stacking with (not replacing) ENCORE REPEATS above.
 *    <accumulate>
 *
 * Use ACCUMULATE MODE for "the luckier you get, the more it snowballs"
 * builds; use plain LUCKY ROLLS/ENCORE REPEATS for a steady, predictable
 * bonus instead.
 *
 * ============================================================================
 * SKILL HISTORY BONUS:
 * These tags apply a damage multiplier based on a battler's recent skill
 * execution history. Both tags scale damage by: 1 + (PCT * COUNT / 100).
 *
 * COUNT_MODE controls what is counted from the history window:
 *   all           — total executions matching the type/skill filter
 *   unique        — distinct skill ids matching the filter
 *   streak        — consecutive executions from the most recent entry
 *                   backward, stopping at the first non-matching entry
 *   distinct_types — distinct skill type ids in the window (most useful
 *                   with TYPE_ID = 0 for any type)
 *
 * ----------------------------------------------------------------------------
 * SKILL HISTORY BONUS (passive / equipment / state):
 * Reads from getAllNotes() sources. Fires on every attack by the bearer.
 * TYPE_ID = 0 matches any skill type (the "no filter" sentinel).
 *    <skillHistoryBonus:[TYPE_ID, WINDOW, PCT, COUNT_MODE]>
 *  Where TYPE_ID is the stypeId to filter on (0 = any type).
 *  Where WINDOW is the lookback in seconds (must be <= plugin max window).
 *  Where PCT is the integer percent bonus per unit of COUNT.
 *  Where COUNT_MODE is: all | unique | streak | distinct_types
 *
 * Examples:
 *  Ghosty mastery — 5% per unique skill used in last 10 seconds:
 *    <skillHistoryBonus:[0, 10, 5, unique]>
 *
 *  Berserker mastery — 5% per consecutive weapon-type execution (type 7):
 *    <skillHistoryBonus:[7, 5, 5, streak]>
 *
 * ----------------------------------------------------------------------------
 * THIS-SKILL HISTORY BONUS (on a specific skill):
 * Reads from this.item() only. Fires exclusively when this skill is the
 * action being resolved. History scope is limited to this skill's own id.
 *    <thisSkillHistoryBonus:[WINDOW, PCT, COUNT_MODE]>
 *  Where WINDOW is the lookback in seconds (must be <= plugin max window).
 *  Where PCT is the integer percent bonus per unit of COUNT.
 *  Where COUNT_MODE is: all | unique | streak | distinct_types
 *
 * Examples:
 *  Taser — 8% more damage per consecutive cast of this skill in 3 seconds:
 *    <thisSkillHistoryBonus:[3, 8, streak]>
 *
 * ============================================================================
 * CAST TIME DAMAGE BONUS:
 * Scales direct HP/MP damage from skills that have a resolved cast time greater than zero.
 * Read at damage resolution from the cast duration stamped on the shared Game_Action when
 * the JABS action volley was created (same value as JABS_Action#getCastTime after cast speed).
 *
 * Does NOT affect healing/recovery, slip DoT ticks, or state-only skills. DoT amplification
 * belongs in a future DoT pipeline revamp (see backlog abs-dot-slip-revamp).
 *
 * Formula:
 *   bonusPct = sum(all N per sec tags) × (castFrames / 60)
 *   finalDamage = round(baseDamage × (1 + bonusPct / 100))
 *
 * No cap. Faster cast speed (J-ABS-Timing) reduces wait time and therefore reduces bonus.
 *
 * ----------------------------------------------------------------------------
 * CAST TIME DAMAGE BONUS (passive / equipment / state):
 * Reads from getAllNotes() sources. Fires on every qualifying direct-damage skill hit.
 *    <castTimeDamageBonus:N>
 *  Where N is integer percent bonus per second of resolved cast time.
 *
 * Example — Lamia Focusing Beam mastery passive (+12% per second of cast):
 *    <castTimeDamageBonus:12>
 *
 * ----------------------------------------------------------------------------
 * THIS-SKILL CAST TIME DAMAGE BONUS (on a specific skill):
 * Reads from this.item() only. Stacks additively with castTimeDamageBonus sources.
 *    <thisCastTimeDamageBonus:N>
 *
 * Example — signature laser (+20% per second on this skill alone):
 *    <castTime:180>
 *    <thisCastTimeDamageBonus:20>
 *  A 3-second cast → +60% from this tag alone (+36% more if mastery also has 12/sec).
 *
 * ============================================================================
 * RANGE SIZE MODIFIERS:
 * These tags scale the effective reach of every JABS action launched by the
 * bearer. They apply to three dimensions simultaneously:
 *   radius    — the hitbox extent used for circle/rhombus/square/line/wall/cross
 *   proximity — how close a direct-target skill must be to its target to fire
 *   thickness — the perpendicular width of LINE and WALL hitboxes
 *
 * Read from getAllNotes() on the caster (passives, equips, states, class,
 * actor, etc.). Tags on the skill itself work too but will affect ALL of
 * the bearer's outgoing actions, not just that skill.
 *
 * Both buff and rate are optional; if neither is present the base value is
 * used unchanged. Modifiers are skipped entirely when the skill has no
 * explicit tag for that dimension (e.g. a skill with no <proximity:N> is
 * not affected by rangeBuff/rangeRate on the proximity axis).
 *
 * STACKING FORMULA (shared, per-axis, and combined):
 *   finalValue = max(0, (base + sharedBuff + axisBuff) * (sharedRate + axisRateDelta))
 *
 * Where sharedBuff = sum of every <rangeBuff:N>, axisBuff = sum of every axis-specific buff,
 * sharedRate accumulates as: 1.0 + sum(each rangeRate - 1.0),
 * and axisRateDelta = sum(each axis-specific rate - 1.0) added on top.
 *   <rangeRate:1.5> alone → 1.5x
 *   <rangeRate:1.5> + <rangeRate:1.5> → 2.0x  (each contributes +0.5)
 *   <rangeRate:1.5> + <radiusRate:1.2> on radius → (1.0 + 0.5 + 0.2) = 1.7x
 *   <rangeRate:0.8> → 0.8x  (contributes -0.2, acts as a range penalty)
 *
 * ----------------------------------------------------------------------------
 * RANGE BUFF (flat additive, applied before rate — affects ALL dimensions):
 * Adds N tiles to the base value before the rate multiplier is applied.
 * Negative values reduce reach (range penalty).
 *    <rangeBuff:N>
 *  Where N is a signed decimal tile count (e.g. 1.5, -0.5).
 *
 * Example:
 *  +2 tiles on every outgoing action's radius, proximity, and thickness:
 *    <rangeBuff:2>
 *
 * ----------------------------------------------------------------------------
 * RANGE RATE (multiplicative, base-1.0 delta model — affects ALL dimensions):
 * Multiplies the buffed value. The tag value IS the rate, not the delta;
 * each tag contributes (N - 1.0) to the rate accumulator so that stacking
 * multiple rates behaves additively rather than compounding exponentially.
 *    <rangeRate:N>
 *  Where N is a non-negative decimal multiplier (1.0 = no change).
 *
 * Example:
 *  1.5x reach on all actions (radius, proximity, and thickness):
 *    <rangeRate:1.5>
 *
 * ----------------------------------------------------------------------------
 * RADIUS BUFF (flat additive, radius only — stacks with rangeBuff):
 * Adds N tiles to the radius (AoE splash zone) only; does not affect proximity or thickness.
 *    <radiusBuff:N>
 *  Where N is a signed decimal tile count.
 *
 * Example:
 *  Hazard mastery — +2 tiles to AoE splash zone only:
 *    <radiusBuff:2>
 *
 * ----------------------------------------------------------------------------
 * RADIUS RATE (multiplicative, radius only — stacks with rangeRate):
 * Adds (N - 1.0) to the rate accumulator for radius only.
 *    <radiusRate:N>
 *  Where N is a non-negative decimal multiplier (1.0 = no change).
 *
 * Example:
 *  Hazard mastery — 1.5x AoE splash zone, targeting reach unchanged:
 *    <radiusRate:1.5>
 *
 * ----------------------------------------------------------------------------
 * PROXIMITY BUFF (flat additive, proximity only — stacks with rangeBuff):
 * Adds N tiles to proximity (targeting reach) only; does not affect radius or thickness.
 *    <proximityBuff:N>
 *  Where N is a signed decimal tile count.
 *
 * Example:
 *  +2 tiles of targeting reach, splash zone unchanged:
 *    <proximityBuff:2>
 *
 * ----------------------------------------------------------------------------
 * PROXIMITY RATE (multiplicative, proximity only — stacks with rangeRate):
 * Adds (N - 1.0) to the rate accumulator for proximity only.
 *    <proximityRate:N>
 *  Where N is a non-negative decimal multiplier (1.0 = no change).
 *
 * Example:
 *  1.5x targeting reach, splash zone unchanged:
 *    <proximityRate:1.5>
 *
 * ----------------------------------------------------------------------------
 * THICKNESS BUFF (flat additive, thickness only — stacks with rangeBuff):
 * Adds N tiles to thickness (LINE/WALL hitbox width) only; does not affect radius or proximity.
 *    <thicknessBuff:N>
 *  Where N is a signed decimal tile count.
 *
 * Example:
 *  +1 tile of LINE/WALL width, radius and proximity unchanged:
 *    <thicknessBuff:1>
 *
 * ----------------------------------------------------------------------------
 * THICKNESS RATE (multiplicative, thickness only — stacks with rangeRate):
 * Adds (N - 1.0) to the rate accumulator for thickness only.
 *    <thicknessRate:N>
 *  Where N is a non-negative decimal multiplier (1.0 = no change).
 *
 * Example:
 *  1.5x LINE/WALL width, radius and proximity unchanged:
 *    <thicknessRate:1.5>
 *
 * ============================================================================
 * STATE DAMAGE MULTIPLIERS:
 * These tags apply damage bonuses based on the current states of the target
 * at the moment the action resolves. All tags are read from getAllNotes() on
 * the caster (passives, equips, states, class, actor, etc.).
 *
 * Bonuses are applied BEFORE guard reduction so that a target's heavily-guarded
 * stance cannot fully negate the caster's state-exploitation advantage. Guard
 * still reduces the amplified value — it is simply less effective at canceling
 * the bonus outright than it would be if the bonus were applied afterward.
 *
 * Combined formula:
 *   totalPct = perDebuffBonusPct + specificStateBonusPct + typePresenceBonusPct + typeCountBonusPct
 *   finalDamage = round(baseDamage * (1 + totalPct / 100))
 *
 * ----------------------------------------------------------------------------
 * PER-DEBUFF BONUS:
 * Adds N% bonus damage for every negative state (jabsNegative tagged) currently
 * active on the target. Multiple <perDebuffBuff:N> tags have their N values
 * summed, then the total is multiplied by the debuff count.
 *    <perDebuffBuff:N>
 *  Where N is a signed decimal percent-per-debuff (5 = +5% per debuff).
 *  Negative N acts as a damage penalty against debuffed targets.
 *
 * Example:
 *  Puppet mastery — +5% damage per debuff on the target:
 *    <perDebuffBuff:5>
 *
 * With three debuffs active (e.g. Paralyzed + Rooted + Poisoned):
 *    totalPct from this tag = 5 * 3 = 15%
 *
 * NOTE: Only states tagged with <negative> in their note box are counted.
 * Buffs, temp power-ups, and untagged states do not increment the count.
 *
 * ----------------------------------------------------------------------------
 * BONUS DAMAGE IF STATE:
 * Adds PCT% bonus damage if the target currently has a specific state active.
 * Multiple tags for the same state id stack additively. Multiple tags for
 * different state ids each contribute independently.
 *    <bonusDamageIfState:[STATE_ID, PCT]>
 *  Where STATE_ID is the database id of the state to check.
 *  Where PCT is the integer percent bonus to add when the state is present.
 *
 * Example:
 *  Puppet mastery — +25% if paralyzed, +25% if rooted, +25% if disabled:
 *    <bonusDamageIfState:[STATE_ID_PARALYZED, 25]>
 *    <bonusDamageIfState:[STATE_ID_ROOTED, 25]>
 *    <bonusDamageIfState:[STATE_ID_DISABLED, 25]>
 *
 * If the target has all three, specificStateBonusPct = 75 (each fires independently).
 *
 * ----------------------------------------------------------------------------
 * BONUS DAMAGE / THIS BONUS DAMAGE:
 * Unconditional flat percent damage bonus- no target state requirement at all.
 * bonusDamage reads from the caster's notes (actor, class, equips, states), so
 * it applies to EVERY action the caster performs- good fit for a passive state
 * that just says "you deal X% more damage" while it's active. thisBonusDamage
 * is the skill-scoped sibling: fires only when THIS skill is the action being
 * resolved, useful for prof extend rows that boost one specific skill without
 * touching its formula or leaking the bonus to the rest of the caster's kit.
 * Multiple tags of either kind, on any number of sources, stack additively.
 *    <bonusDamage:PCT>
 *    <thisBonusDamage:PCT>
 *  Where PCT is the integer (or decimal) percent bonus to add unconditionally.
 *
 * Example:
 *  A "Berserk" state that grants +15% damage on everything while active:
 *    <bonusDamage:15>
 *
 *  Blade of the Mouse row 6 — +20% damage on mainchain skills:
 *    placed on the extend skill targeting [11,12,13]:
 *    <thisBonusDamage:20>
 *
 * ----------------------------------------------------------------------------
 * THIS BONUS DAMAGE IF STATE:
 * Skill-scoped variant of BONUS DAMAGE IF STATE. Adds PCT% bonus damage if the
 * target currently has a specific state active, but only when THIS skill is the
 * action being resolved. Put on a specific skill to avoid bleeding the bonus
 * across the entire kit (unlike the caster-wide bonusDamageIfState tag).
 * Multiple tags for different state ids each contribute independently.
 *    <thisBonusDamageIfState:[STATE_ID, PCT]>
 *  Where STATE_ID is the database id of the state to check.
 *  Where PCT is the integer percent bonus to add when the state is present.
 *
 * Example:
 *  Blade of the Dragon row 9 — +100% damage from this skill vs stunned enemies:
 *    <thisBonusDamageIfState:[STATE_ID_STUN, 100]>
 *
 * If this tag appears multiple times on the same skill (different state ids),
 * each matching state adds PCT independently to the total.
 *
 * ----------------------------------------------------------------------------
 * BONUS DAMAGE IF STATE TYPE:
 * Adds PCT% bonus damage if the target currently has at least one active state
 * carrying the given type classifier (see the <type:CLASSIFIER> notetag on
 * states). Multiple tags for different types each contribute independently.
 * Having more than one matching state of the same type does not add the
 * bonus more than once — this tag is a presence check, not a count.
 *    <bonusDamageIfStateType:[TYPE, PCT]>
 *  Where TYPE is the classifier string to check for (matched case-insensitively).
 *  Where PCT is the integer percent bonus to add when any matching state is present.
 *
 * Example:
 *  Venom mastery — +25% damage if the target has any "poison"-typed state:
 *    <bonusDamageIfStateType:[poison, 25]>
 *
 * If the target has two different poison-typed states active simultaneously,
 * typePresenceBonusPct is still only 25 (presence, not count).
 *
 * ----------------------------------------------------------------------------
 * BONUS DAMAGE PER STATE TYPE:
 * Adds PCT% bonus damage for every distinct active state on the target that
 * carries the given type classifier. Unlike PER-DEBUFF BONUS, this tag is
 * scoped to a single named type per tag rather than counting all negative
 * states; multiple tags for different types each contribute independently.
 *    <bonusDamagePerStateType:[TYPE, PCT]>
 *  Where TYPE is the classifier string to check for (matched case-insensitively).
 *  Where PCT is the integer percent bonus to add per matching active state.
 *
 * Example:
 *  Venom mastery — +10% damage per "poison"-typed state active on the target:
 *    <bonusDamagePerStateType:[poison, 10]>
 *
 * If the target has two different poison-typed states active simultaneously,
 * typeCountBonusPct from this tag = 10 * 2 = 20%.
 *
 * ----------------------------------------------------------------------------
 * BONUS DAMAGE IF SELF STATE:
 * Sibling to BONUS DAMAGE IF STATE above, but checks the caster's own active
 * states instead of the target's. Great for "empowered while buffed" kits.
 *    <bonusDamageIfSelfState:[STATE_ID, PCT]>
 *  Where STATE_ID is the state that must be active on the caster.
 *  Where PCT is the integer percent bonus to add while that state is active.
 *
 * THIS BONUS DAMAGE IF SELF STATE:
 * Skill-scoped variant. Only applies while this exact skill is executing,
 * layering on top of the caster-wide <bonusDamageIfSelfState> tag rather
 * than replacing it.
 *    <thisBonusDamageIfSelfState:[STATE_ID, PCT]>
 *
 * Example — a rogue's "Shadow Form" empowers only their finishers:
 *    <thisBonusDamageIfSelfState:[STATE_SHADOW_FORM_ID, 40]>
 *
 * ----------------------------------------------------------------------------
 * BONUS DAMAGE PER STATE STACK:
 * Adds PCT% bonus damage per current stack of a specific named state active
 * on the target. Unlike BONUS DAMAGE PER STATE TYPE, which counts distinct
 * states of a type, this counts the stack depth of one exact state id.
 *    <bonusDamagePerStateStack:[STATE_ID, PCT]>
 *  Where STATE_ID is the exact state id to read stacks from.
 *  Where PCT is the integer percent bonus to add per stack.
 *
 * Example — "Exploit Wounds": +8% damage per stack of Bleed on the target:
 *    <bonusDamagePerStateStack:[STATE_BLEED_ID, 8]>
 * A target with 3 stacks of Bleed takes +24% bonus damage from this hit.
 *
 * NOTE: If the target is not currently tracked as afflicted by STATE_ID
 * (state absent, or somehow untracked), this tag contributes nothing.
 *
 * THIS BONUS DAMAGE PER STATE STACK:
 * Skill-scoped variant. Only applies while this exact skill is executing,
 * layering on top of the caster-wide <bonusDamagePerStateStack> tag rather
 * than replacing it.
 *    <thisBonusDamagePerStateStack:[STATE_ID, PCT]>
 *
 * Example — a finisher that punishes stacked Bleed harder than the caster's
 * baseline kit does: +15% per stack of Bleed, but only on this skill:
 *    <thisBonusDamagePerStateStack:[STATE_BLEED_ID, 15]>
 *
 * ----------------------------------------------------------------------------
 * BONUS DAMAGE FOR MY STATE COUNT:
 * Adds PCT% bonus damage for every distinct state on the target that this
 * exact caster is the one who applied. This lives entirely on the caster's
 * own notes (actor/class/weapon/armor/state), not on the skill — it's a
 * passive that's always live regardless of which skill is executing.
 *    <bonusDamageForMyStateCount:PCT>
 *  Where PCT is the integer percent bonus per distinct caster-authored state.
 *
 * THIS BONUS DAMAGE FOR MY STATE COUNT:
 * Skill-scoped variant. Reads only from the executing skill's own note,
 * stacking on top of the caster-wide tag above rather than replacing it.
 *    <thisBonusDamageForMyStateCount:PCT>
 *
 * Example — a debuffer whose finisher scales off their own handiwork:
 *    <thisBonusDamageForMyStateCount:15>
 *  If this caster personally applied 3 different states currently active on
 *  the target (regardless of who else also has states on it), this skill
 *  gains +45% bonus damage (15 * 3).
 *
 * ----------------------------------------------------------------------------
 * BONUS DAMAGE IF TARGET HP BELOW / THIS BONUS DAMAGE IF TARGET HP BELOW:
 * Execute-style bonus that SCALES CONTINUOUSLY as the target's hp keeps
 * dropping- not a flat one-time bonus. The gate opens once the target's
 * current hp% is at or under THRESHOLD_PCT; once open, the bonus grows by
 * PCT_PER_POINT for every percentage point the target is under that
 * threshold. bonusDamageIfTargetHpBelow reads from the caster's notes
 * (actor, class, equips, states)- good fit for a "the lower they are, the
 * harder you hit" passive. thisBonusDamageIfTargetHpBelow is the skill-scoped
 * sibling, useful for a dedicated execute/finisher skill.
 * Multiple tags of either kind, on any number of sources (including multiple
 * thresholds on the same source), stack additively.
 *    <bonusDamageIfTargetHpBelow:[THRESHOLD_PCT, PCT_PER_POINT]>
 *    <thisBonusDamageIfTargetHpBelow:[THRESHOLD_PCT, PCT_PER_POINT]>
 *  Where THRESHOLD_PCT is the hp% ceiling that opens the gate.
 *  Where PCT_PER_POINT is the percent bonus added per percentage point the
 *  target is currently under THRESHOLD_PCT.
 *
 * Example — "the big red button": meaningful at 70%, ugly at 30% or lower:
 *    <bonusDamageIfTargetHpBelow:[50, 2]>
 *  At 51% hp: +0% (gate not open). At 50%: +0% (just crossed). At 30%:
 *  +40% (20 points under 50, times 2). At 10%: +80% (40 points under 50).
 *
 * ============================================================================
 * APPLY STATE ON EXPIRE:
 * When a state expires by its natural frame-counter reaching zero, this tag
 * causes a follow-up state to be applied to the same battler at a given
 * percent chance. This is the backbone of any "chain" state system.
 *
 * IMPORTANT: This tag fires ONLY on natural expiry. Forced removal — via
 * dispel, script calls, KO, or the food-chain strip routine — does NOT
 * trigger it. This distinction is intentional so that removing a chain
 * early does not cascade the chain forward.
 *
 * Tag format:
 *    <applyStateOnExpire:[STATE_ID, CHANCE]>
 *  Where STATE_ID is the integer database id of the state to apply next.
 *  Where CHANCE is an integer percent chance (0–100) of the follow-up firing.
 *
 * Examples:
 *  A "Well Fed (Protein)" state that always transitions into "Pumped":
 *    <applyStateOnExpire:[STATE_PUMPED_ID, 100]>
 *
 *  A "Burning" state that has a 50% chance to leave a "Scorched" debuff:
 *    <applyStateOnExpire:[STATE_SCORCHED_ID, 50]>
 *
 * Only one <applyStateOnExpire> tag per state is read (the first match).
 * The follow-up state inherits the same source battler as the expiring state.
 *
 * ----------------------------------------------------------------------------
 * PURGE STATES:
 * A cleanse/dispel effect placed on a SKILL. When this skill lands a hit
 * (parried and evaded actions do not trigger it), it strips one or more
 * states off the target by priority, highest-priority state first.
 *    <purgeStates:[TYPE, ALLOW_DEATH, COUNT]>
 *  Where TYPE is one of "negative" (only <negative>-tagged states,
 *    default), "positive" (only states NOT tagged <negative>), or "all"
 *    (no polarity filter).
 *  Where ALLOW_DEATH is true/false for whether the death state (id 1) is
 *    eligible for removal (default false).
 *  Where COUNT is how many states to strip, highest priority first
 *    (default 1).
 *
 * All three parameters are optional and fall back to their defaults if
 * omitted or malformed.
 *
 * EXAMPLES:
 *    <purgeStates:[negative, false, 1]>
 *  Strips the single highest-priority negative state from the target.
 *  Equivalent to the tag's own defaults.
 *
 *    <purgeStates:[all, false, 3]>
 *  A "cleanse burst" that strips up to 3 states (any polarity, never
 *  death) from the target, highest priority first.
 *
 * NO LOGS:
 * Place on a STATE to suppress its own removal from being written to the
 * `Map_TextLog` when it is stripped via <purgeStates>.
 *    <noLogs>
 *
 * ============================================================================
 * STATE SPREADING:
 * Tracked combat states can spread to nearby battlers on a cadence independent of slip/regen.
 * Buffs and debuffs both qualify; spreading is not limited to negative states.
 *
 * Tag format:
 *    <spread:[CHANCE, RANGE]>
 *  CHANCE = percent (1–100) rolled independently per candidate each spread pulse.
 *  RANGE = tile distance (same as AI proximity helpers).
 *
 * Optional tags (state row only):
 *    <viral> — candidates are all battlers in range, not only same-side allies.
 *    <spreadTick:FRAME_COUNT> — frames between spread pulses (default: plugin param, usually 30).
 *    <spreadPerTick:N> — max successful spreads per pulse (failed rolls do not count).
 *    <spreadPreferUnafflicted> — try battlers without this state id first (closest-first within each group).
 *    <spreadSkipAfflicted> — never spread to battlers who already have this state id (no spread refresh).
 *
 * Spread uses the original source battler from when the state was first applied (JABS_State#source).
 *
 * ============================================================================
 * USING SKILLS:
 * Now that you've spent all this time setting up skills, you'll probably
 * want to actually use them. Fortunately, that is relatively easy.
 *
 * NOTE ABOUT SKILL USABILITY:
 * In addition to the default RMMZ requirements (cost etc), the battler
 * MUST know the skill to execute it. This is especially relevant for
 * the mainhand/offhand slots, where gear can provide a skill the actor
 * never explicitly learned.
 *
 * A LITTLE ABOUT SKILL SLOTS FIRST:
 * JABS has eight skill slots:
 * - mainhand
 * - offhand
 * - tool
 * - dodge
 * - combat skill 1
 * - combat skill 2
 * - combat skill 3
 * - combat skill 4
 *
 * ----------------------------------------------------------------------------
 * MAINHAND AND OFFHAND SLOTS:
 * The mainhand slot is auto-assigned via the weapon equip slot using its
 * <skillId:SKILL_ID> tag. The offhand slot is resolved each refresh using
 * the following precedence (highest first):
 *  1. Native offhand seal: if the battler has RMMZ's "Seal Equip: Offhand"
 *     trait active AND the mainhand does not also declare <offhandSkillId:N>,
 *     the offhand resolves to nothing.
 *  2. Player pin: a skill the player explicitly assigned to the offhand
 *     via the JABS quick menu (see "ASSIGNING THE OFFHAND" below).
 *  3. Mainhand-provided offhand skill: <offhandSkillId:N> on the
 *     currently equipped mainhand weapon.
 *  4. The equipped offhand item's <skillId:N> tag.
 *  5. Nothing.
 *
 * Once the base offhand skill is resolved, it may be further transformed
 * via <skillTransform:[BASE, OVERRIDE]> from any note-bearing source
 * (state, equip, class, or actor) — see SKILL TRANSFORM below.
 *
 * To designate which skill a piece of equipment grants, use:
 *    <skillId:SKILL_ID>
 *  Where SKILL_ID is the skill to assign to the equip slot.
 *
 * NOTE: Only the offhand slot can host a guard skill. Pinning a non-guard
 * skill into the offhand intentionally trades the guard ability for that
 * skill until the player clears or changes the pin.
 *
 * OFFHAND SKILL OVERRIDE:
 * In some cases, you may want a weapon to specify a different skill for
 * the offhand slot than the mainhand slot. This is useful for two-handed
 * weapons that also define their own offhand behavior:
 *    <offhandSkillId:SKILL_ID>
 *  Where SKILL_ID is the skill to assign specifically to the offhand.
 *
 * TWO-HANDED WEAPONS:
 * Use RMMZ's native trait instead of a notetag:
 *    Trait -> Seal Equip -> Offhand
 * When that trait is active anywhere on the battler, JABS treats the offhand
 * as sealed. The seal is bypassed if the mainhand also declares
 * <offhandSkillId:N>, which lets a "two-handed but defines its own offhand
 * action" weapon (such as a spear) keep its offhand action.
 *
 * ASSIGNING THE OFFHAND (PLAYER PIN):
 * Players may pin a learned skill into the offhand slot via the JABS
 * quick menu. The pin survives until the player either clears it or
 * changes the offhand equipment, at which point the pin is automatically
 * cleared so that the newly equipped offhand's skill takes priority.
 *
 * Skills available in the offhand assignment list are:
 *  - Learned skills carrying the <offhandEligible> tag.
 *  - The skill currently granted by the equipped offhand item.
 *  - The skill currently granted by the mainhand's <offhandSkillId:N>.
 * Generic learned weapon skills are NOT automatically eligible.
 *
 *    <offhandEligible>
 * Place this tag on any skill to opt it into the offhand assignment list
 * regardless of skill type. This is intended for specially learned support,
 * utility, or offensive skills that should be equippable as player-chosen
 * offhand actions.
 *
 * KNOCKBACK RESISTANCE:
 * Equip this on a weapon or armor to reduce the tiles a battler carrying
 * this equipment is knocked back by incoming hits:
 *    <knockbackResist:VAL>
 *  Where VAL is the number of knockback tiles to cancel.
 *
 * ----------------------------------------------------------------------------
 * PROXIMITY KNOCKBACK:
 * Amplifies this battler's outgoing knockback based on how many opposing
 * battlers are currently near them. Evaluated fresh against the live
 * battlefield every time this battler lands a knockback hit.
 *    <proximityKnockback:[RADIUS, PCT]>
 *  Where RADIUS is the tile radius (from this battler) to scan for enemies.
 *  Where PCT is the percent bonus applied per enemy found within RADIUS.
 *
 * Example: Orbiter's "Offended by Proximity" (+25% knockback per nearby
 * enemy within 4 tiles):
 *    <proximityKnockback:[4, 25]>
 *
 * NOTE: Only opposing battlers count -- allies within RADIUS are ignored.
 * NOTE: Multiple tags (different sources, different radii) all contribute
 * independently and sum together.
 *
 * ----------------------------------------------------------------------------
 * KNOCKBACK AMP / THIS KNOCKBACK AMP:
 * Unconditional outgoing knockback amplifier- no proximity requirement,
 * unlike PROXIMITY KNOCKBACK above. knockbackAmp reads from any of the
 * caster's note sources (actor, class, equips, states) and applies to every
 * knockback this battler deals. thisKnockbackAmp is the skill-scoped
 * sibling, read from the executing skill's own note only. Both sum
 * additively with each other AND with proximityKnockback into one combined
 * percent, applied as a single multiplier to outgoing knockback.
 *    <knockbackAmp:PCT>
 *    <thisKnockbackAmp:PCT>
 *  Where PCT is the percent bonus (or penalty, if negative) to apply.
 *
 * Example: a battler who always knocks back 50% farther, plus a signature
 * skill that adds another +20% on top when it specifically lands:
 *    <knockbackAmp:50>
 *    (placed on the signature skill itself) <thisKnockbackAmp:20>
 *
 * ----------------------------------------------------------------------------
 * PER-CONNECTION BONUS HITS (ACTOR / CLASS / EQUIPMENT / STATES):
 * These stack with <bonus-hits:VAL> on the executing skill. Place them on
 * actor, class, weapons, armors, states, or enemy data as appropriate.
 *    <bonus-hits-global:VAL>
 * Adds VAL to the per-connection bonus for every JABS action.
 *    <bonus-hits-basic:VAL>
 * Adds VAL only when the action is a basic attack (mainhand/offhand for
 * actors, or the enemy's designated basic attack skill).
 *    <bonus-hits-skill:VAL>
 * Adds VAL only for non-basic skills.
 *
 * FORMULA VARIANT:
 * All three of the above accept a bracketed formula instead of a flat
 * integer, evaluated with `a` bound to the battler carrying the tag:
 *    <bonus-hits-global:[FORMULA]>
 *    <bonus-hits-basic:[FORMULA]>
 *    <bonus-hits-skill:[FORMULA]>
 *  Where FORMULA is a JS-style expression (e.g. <bonus-hits-basic:[a.luk / 10]>).
 *
 * NOTE: As with the skill-note version above, the final combined total is
 * floored once at the end -- formulas do not need their own floor() wrapper.
 *
 * HIDING ITEMS/SKILLS FROM ASSIGNMENT:
 * To prevent certain items or skills from appearing in the assignment
 * menu for a given slot:
 *    <hideFromJabsMenu>
 *
 * This applies to "dodge" and "combat" skills and "tools". Hidden skills
 * still appear in the main menu.
 *
 * ----------------------------------------------------------------------------
 * TOOL SLOT:
 * The tool slot is always player-assigned and represents usable items.
 * Like equipment, assign a SKILL_ID to them to make them usable:
 *    <skillId:SKILL_ID>
 *  Where SKILL_ID is the skill to perform from the tool slot.
 *
 * WHICH ITEMS QUALIFY AS TOOLS:
 * Place this tag on the item itself to mark it as belonging in the tool
 * slot (hookshots, bombs, and other equippable-from-the-menu items):
 *    <jabsTool>
 *  Without this tag, an item is instead treated as a consumable and shows
 *  up in the usable-item slot's list instead of the tool slot's list.
 *
 * NOTE: The tag alone is not the whole story -- the item's Item Type must
 * also be "Regular Item" and Occasion must be "Always" for it to actually
 * populate either the tool or usable-item menu. <jabsTool> only decides
 * which of those two menus a qualifying item lands in.
 *
 * ----------------------------------------------------------------------------
 * DODGE SLOT:
 * The dodge slot represents a unique mobility skill. For a skill to be
 * recognized as a "dodge" skill, it must belong to the skill type defined
 * in the plugin parameters for "dodge skill type".
 *
 * NOTE: The dodge skill is still processed through the normal JABS action
 * pipeline, so it can apply states, deal damage, fire projectiles, etc.
 *
 * DODGE MOVETYPE:
 *    <moveType:TYPE>
 *  Where TYPE is one of "forward", "backward", or "directional".
 *
 * - forward: Move in the direction the player is facing.
 * - backward: Move in the opposite direction.
 * - directional: Move in whatever direction the player is pressing.
 *
 * DODGE DISTANCE:
 *    <dodge:DISTANCE>
 *  Where DISTANCE is the number of tiles to be forcefully moved.
 *
 * DODGE SPEED:
 *    <dodgeSpeed:MODIFIER>
 *  Where MODIFIER is added to the player's current move speed.
 *  Note that this value can be a decimal or negative.
 *
 * DODGE INVINCIBILITY:
 * Makes the player fully invincible for the entire dodge duration.
 *    <invincibleDodge>
 *
 * For partial invincibility (i-frames), specify a start and end frame:
 *    <iframes:[START_FRAME, END_FRAME]>
 *  Where START_FRAME is when invincibility begins.
 *  Where END_FRAME is when invincibility ends.
 *
 * NOTE: If the iframes window extends beyond the dodge duration, only
 * the overlapping frames are counted.
 *
 * ----------------------------------------------------------------------------
 * COMBAT SKILL SLOTS:
 * There are four combat skill slots, all player-assigned. They can be
 * swapped at any time from the quickmenu using skills the player knows
 * and has set up with the appropriate tags.
 *
 * ----------------------------------------------------------------------------
 * AUTO ASSIGNMENT OF SKILLS:
 * For developer convenience, new skills can be auto-assigned to combat
 * slots when learned. Skills can only auto-assign to the four combat
 * slots, not mainhand/offhand/dodge/tool.
 *
 * AUTO ASSIGNMENT CONDITIONALS:
 * The full check for auto-assignment upon learning a skill:
 * 1) The actor or class has the "enable auto assign" tag.
 * 2) The actor doesn't already have the skill equipped.
 * 3) The actor has an empty combat slot.
 * 4) The skill is not blocked from auto assignment.
 * 5) The skill is not upgrade-only.
 * 6) The skill type is not on the blacklist.
 * If all are true, the skill is auto-assigned.
 *
 * ENABLE AUTO ASSIGN:
 *    <autoAssignSkills>
 *
 * ENABLE AUTO UPGRADE:
 * To allow auto-learned skills to replace existing equipped skills:
 *    <autoUpgradeSkills>
 *
 * Place this on the actor or class whose skills should automatically
 * upgrade when a newer version is learned.
 *
 * BLOCK AUTO ASSIGNMENT PER SKILL TYPE:
 *    <noAutoAssignType:[TYPE_IDS...]>
 *  Where TYPE_IDS is a comma-delimited list of skill type ids.
 *
 * BLOCK AUTO ASSIGNMENT PER INDIVIDUAL SKILL:
 *    <noAutoAssign>
 *
 * AUTO SKILL UPGRADES:
 * UPGRADE OVER SKILL:
 * Makes a newly learned skill replace a currently equipped skill.
 *    <upgradeOverSkill:NUM>
 *  Where NUM is the skill id this skill should replace.
 *
 * NOTE: If the target skill isn't equipped, the new skill will still
 * be auto-assigned unless it has a tag preventing it.
 *
 * UPGRADE ONLY SKILL:
 * Prevents a skill from being auto-assigned (only via upgrade):
 *    <onlyUpgrade>
 *
 * NO UPGRADING A SKILL:
 * Prevents a skill from ever being upgraded by another skill:
 *    <noUpgrade>
 *
 * ============================================================================
 * AGGRO MANAGEMENT:
 * Any AI-controlled battler always targets the foe with the highest aggro
 * value in relation to them. Aggro is a numeric representation of how mad
 * a battler is at another.
 *
 * Review the plugin parameter tags for aggro generation defaults.
 *
 * Aggro calculation order:
 * 1. Base amount from plugin params.
 * 2. HP, then MP, then TP damage.
 * 3. HP Drain (MP/TP not considered).
 * 4. Parry amount if applicable (target parrying also aggros attacker).
 * 5. Bonus aggro from tags below.
 * 6. Bonus rate from tags below.
 * 7. Iterative multiplier from attacker states.
 * 8. Iterative multiplier from target states.
 * 9. Attacker TGR stat multiplier.
 * 10. Player-unique multiplier, if applicable.
 *
 * Steps 1-10 above produce a single delta that gets written to the caster's
 * own aggro entry on the target. aggroPercent and notMyAggro/notMyAggroPercent
 * (below) are separate post-processing steps that run AFTER that write,
 * operating on already-stored aggro entries rather than this hit's delta.
 *
 * ----------------------------------------------------------------------------
 * AGGRO TAGS FOR SKILLS:
 * BONUS AGGRO:
 *    <aggro:VAL>
 *  Where VAL is the flat amount of aggro to gain (or lose if negative).
 *
 * AGGRO MULTIPLIER:
 *    <aggroMultiplier:VAL>
 *  Where VAL is a decimal multiplier applied on top of all other aggro.
 *
 * NOTE: Default is 1.0. A value of 0.5 halves aggro; 2.0 doubles it.
 *
 * AGGRO PERCENT (own existing aggro):
 *    <aggroPercent:VAL>
 *  Where VAL is a percent adjustment applied to the caster's own ALREADY-
 *  STANDING aggro total on the target- not just this hit's contribution.
 *  Resolved as aggro *= (1 + VAL/100). Contrast with aggroMultiplier above,
 *  which only scales this one hit's newly-computed amount before it's added.
 *
 * TAG EXAMPLE:
 *    <aggroPercent:100>
 *  If the caster already has 1000 standing aggro on the target, landing
 *  this skill doubles it to 2000 (in addition to whatever this hit's own
 *  <aggro>/<aggroMultiplier> chain contributes).
 *
 * NOT MY AGGRO (redirect threat to yourself):
 *    <notMyAggro:VAL>
 *    <notMyAggroPercent:VAL>
 *  Unlike the tags above (which only touch the caster's own aggro entry),
 *  these adjust every OTHER battler's standing aggro on the same target-
 *  battlers sharing the caster's team, excluding the caster's own entry.
 *  notMyAggro adds VAL flat to each of those entries independently (can be
 *  negative). notMyAggroPercent scales each of those entries independently
 *  as entry *= (1 + VAL/100). Flat applies before percent, per entry.
 *
 * TAG EXAMPLE:
 *    <notMyAggro:-50>
 *    <notMyAggroPercent:-25>
 *  On landing, every ally's standing aggro on this target drops by 50
 *  flat, then by another 25% of whatever remains- a taunt that pulls
 *  threat toward the caster and away from teammates fighting the same foe.
 *
 * NOTE: All aggro tags above fire regardless of hit/miss/parry, same as
 * the base aggro calculation chain.
 *
 * ----------------------------------------------------------------------------
 * AGGRO TAGS FOR STATES:
 * AGGRO LOCK:
 * Prevents this battler's aggro from changing while the state is active.
 * They can still affect others' aggro, but theirs is frozen.
 *    <aggroLock>
 *
 * AGGRO OUT AMPLIFIER:
 * Multiplies all aggro this battler generates while the state is active.
 *    <aggroOutAmp:VAL>
 *  Where VAL is the decimal multiplier against outgoing aggro.
 *
 * AGGRO IN AMPLIFIER:
 * Multiplies all aggro received by this battler while the state is active.
 *    <aggroInAmp:VAL>
 *  Where VAL is the decimal multiplier against incoming aggro.
 *
 * ============================================================================
 * CONFIGURING LOOT:
 * After a hard day of chopping up trash mobs, reward your player with
 * loot! Any droppable item from the database can be collected. Consider
 * using "J-DropsControl" for cleaner loot drop configuration.
 *
 * ----------------------------------------------------------------------------
 * USE ON PICKUP:
 * The "heart drop" from Zelda: an item that heals when picked up. Add
 * this tag to any droppable item to have it immediately perform as if
 * used on the player who picks it up.
 *    <useOnPickup>
 *
 * ----------------------------------------------------------------------------
 * EXPIRATION:
 * Override the default loot duration for a specific drop.
 *    <expires:DURATION>
 *  Where DURATION is the number of frames the loot persists.
 *
 * NOTE: All loot is erased on map transfer. This is intentional.
 *
 * ----------------------------------------------------------------------------
 * DYNAMICALLY SPAWNING LOOT:
 * Plugin/script commands can generate and spawn loot at any map location.
 * See the plugin commands for input parameter details.
 *
 * ============================================================================
 * SETTING UP STATES:
 * States are obviously critical to any good RPG! There are a few
 * important concepts to understand when building states for JABS.
 *
 * ----------------------------------------------------------------------------
 * NEGATIVE:
 * Functionally, a "negative" flag does not change how a state works, but
 * it informs the AI that this state is harmful. Healers and support ally
 * AI will attempt to remove these states when choosing actions.
 *    <negative>
 *
 * ----------------------------------------------------------------------------
 * ROOTED:
 * Locks the battler's movement, including dodge skills for actors.
 *    <rooted>
 *
 * ----------------------------------------------------------------------------
 * DISABLED:
 * Locks the battler's basic attacks. For actors, this is mainhand and
 * offhand. For enemies, this is their basic attack traited skill.
 *    <disabled>
 *
 * ----------------------------------------------------------------------------
 * MUTED:
 * Locks the battler's combat skills. For actors, this is the four combat
 * slots. For enemies, this is any skill that isn't the basic attack.
 *    <muted>
 *
 * ----------------------------------------------------------------------------
 * PARALYZED:
 * Functionally the same as being rooted, disabled, and muted all at once.
 *    <paralyzed>
 *
 * ----------------------------------------------------------------------------
 * STATE-APPLICATION IMMUNITY & RESISTANCE:
 * These tags are read from the TARGET's own notes (states, equips, class, etc.),
 * not from the state being applied. Checked in Game_Battler#isStateAddable, in
 * this priority order- each fully blocks application before any chance roll:
 *   1. <immuneToAll>          — blocks everything, including the death state.
 *   2. <immuneToStates>       — blocks everything EXCEPT the death state.
 *   3. <immuneToNegatives>    — blocks any state carrying <negative>.
 *   4. <stateTypeImmune:TYPE> — blocks any state carrying a matching <type:TYPE>.
 * <stateTypeResist:[TYPE, PCT]> is different- it does not block anything outright,
 * it reduces the chance a state carrying a matching <type:TYPE> tag lands, folded
 * into the same application roll as vanilla's per-id state rate. Multiple tags for
 * the same TYPE stack additively.
 *
 *    <stateTypeResist:[TYPE, PCT]>
 *    <stateTypeImmune:TYPE>
 *    <immuneToNegatives>
 *    <immuneToStates>
 *    <immuneToAll>
 *
 * Examples:
 *    <stateTypeResist:[cc, 50]>
 *    <stateTypeImmune:cc>
 *
 * ----------------------------------------------------------------------------
 * SKILL TRANSFORM:
 * Transforms one equipped skill into another at runtime without mutating
 * the slot's stored id. Valid on actors, enemies, classes, weapons, armors,
 * and states. The slot's base skill id is compared against BASE; when they
 * match, OVERRIDE is used for all execution and display purposes instead.
 *    <skillTransform:[BASE, OVERRIDE]>
 *  Where BASE is the equipped skill id to match against.
 *  Where OVERRIDE is the skill id that executes and displays instead.
 *
 * This applies to ALL equipped skill slots (combat, dodge, offhand). The tool
 * slot is excluded because it stores item ids rather than skill ids.
 *
 * PERMISSION: The battler does not need to have formally learned OVERRIDE.
 * The transform tag itself grants implicit permission; only the BASE slot
 * skill must be known via the normal hasSkill check.
 *
 * PRECEDENCE (first match wins):
 *  1. Active states, ordered by highest priority first.
 *  2. Equipped items (actors only), in equip-slot order.
 *  3. Current class (actors only).
 *  4. Actor or enemy database row.
 *
 * If multiple sources define a transform for the same BASE, the source
 * highest in the precedence list wins. States always beat equips.
 *
 * Example:
 *    <skillTransform:[151, 152]>
 * While this note is active on any source, any slot whose base skill id is
 * 151 will execute and display as skill 152 instead.
 *
 * ----------------------------------------------------------------------------
 * ----------------------------------------------------------------------------
 * SLIP DAMAGE:
 * "Slip damage" is an alternative name for damage over time. There are
 * three types: flat, percent, and formula-based. VAL is applied in full on
 * every tick -- there is no per-tick division. A tick's length is governed
 * by the tick interval (see TICK SPEED below), so the authored VAL is
 * effectively "this much per tick", and the actual per-second/per-duration
 * total depends entirely on how fast this battler's ticks are resolving.
 * This is intentional: speeding up ticks (via tickSpeed tags) is what makes
 * a slip effect hit harder over time, since the same VAL just lands more
 * often.
 *
 * ----------------------------------------------------------------------------
 * SLIP DAMAGE AS A CONCEPT:
 * Battlers have three parameter pools: HP, MP, and TP. Slip tags can
 * diminish or replenish any of them.
 *
 * NEGATIVE SLIP DAMAGE:
 * To diminish a pool over time (poison, exhaustion, etc.):
 * Use negative VAL values.
 *
 * POSITIVE SLIP DAMAGE:
 * To replenish a pool over time (regen, meditation, etc.):
 * Use positive VAL values.
 *
 * FLAT:
 *    <hpFlat:VAL>
 *    <mpFlat:VAL>
 *    <tpFlat:VAL>
 *  Where VAL is the flat amount to gain or lose, applied in full every tick.
 *
 * PERCENT:
 * Eats a portion of the battler's max value per tick. Use with care!
 *    <hpPercent:VAL>
 *    <mpPercent:VAL>
 *    <tpPercent:VAL>
 *  Where VAL is the % of max value to gain or lose, applied in full every tick.
 *
 * FORMULA:
 * Allows damage that scales with battler stats.
 *    <hpFormula:[FORMULA]>
 *    <mpFormula:[FORMULA]>
 *    <tpFormula:[FORMULA]>
 *  Where FORMULA is a damage-like formula to calculate VAL, applied in full
 *  every tick.
 *
 * Formula context: "a" is the battler who applied the state (the source),
 * "b" is the battler afflicted by the state (the one ticking), "v" is
 * variables, and "s" is the state object itself. If the state was applied
 * to oneself (self-inflicted), a and b are the same battler.
 *
 * NOTE ABOUT SIGN: write this formula the same way you would a normal
 * damage formula, where a positive result means "harm". The engine negates
 * the formula's output internally before adding it to the slip total, so a
 * positive formula result becomes a loss and a negative formula result
 * becomes a gain -- this is the opposite convention from FLAT and PERCENT
 * above, where positive VAL is explicitly a gain.
 *
 * EXAMPLES:
 *    <hpFlat:-100>
 *  Lose 100 HP on every tick this state is active.
 *
 *    <mpPercent:50>
 *  Lose 50% max MP on every tick this state is active.
 *
 *    <tpFormula:[-(a.atk * 2)]>
 *  Gain TP equal to 200% of the source's ATK on every tick (negative
 *  formula result = gain, per the sign note above).
 *
 *    <hpFormula:[(a.mat * 3)]>
 *  Lose HP equal to 300% of the source's MAT on every tick (positive
 *  formula result = harm, just like a damage formula).
 *
 * TICK SPEED:
 * Slip/regen effects don't tick every frame -- they tick on an interval
 * (the "Default State Tick Interval" plugin parameter as the base for state
 * slips, a separate configurable interval for natural HP/MP/TP regen).
 * Because slip VAL is applied in full every tick (see SLIP DAMAGE above),
 * making ticks fire more often is what makes a slip effect deal more total
 * damage over time -- there is no rescaling to compensate. These tags are
 * battler-wide modifiers against that interval, summed from every note
 * source on the battler (actor, class, weapons, armors, states).
 *
 *    <tickSpeedFlat:VAL>
 *  Where VAL is a flat number of frames added to (or, if negative,
 *  subtracted from) the base tick interval. Positive VAL = slower ticks
 *  (longer wait between them); negative VAL = faster ticks.
 *
 *    <tickSpeedPercent:VAL>
 *  Where VAL is a percent applied against the interval as a divisor:
 *  interval / (1 + VAL / 100). Positive VAL = faster ticks (shorter
 *  interval); negative VAL = slower ticks. Note this is the OPPOSITE sign
 *  convention from tickSpeedFlat above -- a positive flat value slows ticks
 *  down, but a positive percent value speeds them up.
 *
 *    <tickSpeedTypePercent:[TYPE, VAL]>
 *  A percent modifier scoped to a single <type:TYPE> classifier (the same
 *  classifier family used by <stateTypeResist>/<stateTypeImmune> above)
 *  rather than applying universally. Only contributes when the state or
 *  regen source actually carries a matching <type:TYPE> tag. Same sign
 *  convention as tickSpeedPercent (positive = faster).
 *
 * Both flat and percent modifiers apply together: the flat offset is added
 * to the base interval first, then the combined percent divides the result.
 * The final interval is floored at a small minimum (the plugin's
 * "Minimum State Tick Interval" parameter, never below 1 frame) so ticks
 * can never be reduced to zero or negative frames.
 *
 * PER-STATE TICK SPEED OVERRIDE:
 * Independent of the modifiers above, an individual state can declare its
 * own fixed tick interval rather than using the shared base interval:
 *    <thisTickSpeed:FRAMES>
 *  Where FRAMES is this state's own tick interval, ignoring the plugin
 *  parameter default entirely. The flat/percent modifiers above still
 *  apply on top of this override the same way they would the default.
 *
 * EXAMPLE:
 *    <tickSpeedPercent:100>
 *  This source doubles this battler's slip/regen tick frequency (ticks
 *  twice as often).
 *
 *    <tickSpeedTypePercent:[poison, 50]>
 *  This source ticks poison-typed states 50% faster, but has no effect on
 *  any other state.
 *
 * SLIP AMPLIFICATION:
 * Independent of tick speed, the VAL of a single tick can be amplified
 * directly. Amplification is always sourced from the battler who APPLIED
 * the slip effect (the source), not the battler suffering/receiving it --
 * a Ring of Melting worn by the poisoner makes their poison hit harder, it
 * does nothing for the poisoner's own poison resistance. Healing-over-time
 * additionally still applies the afflicted battler's own REC trait first,
 * exactly as before; these tags layer on top of that.
 *
 *    <dotAmpRate:VAL>
 *    <hotAmpRate:VAL>
 *  Battler-wide percent amplification against every DoT/HoT this battler
 *  applies, summed from every note source on the source (actor, class,
 *  weapons, armors, states). VAL is a percent: 100 = double tick damage/
 *  healing, -50 = half.
 *
 *    <thisDotAmpRate:VAL>
 *    <thisHotAmpRate:VAL>
 *  Skill-scoped percent amplification, read from the skill that was
 *  executing when the state was applied (not the bearer's other skills).
 *  Adds on top of the battler-wide rate above; a state applied with no
 *  skill in scope (ambient/self-inflicted effects) never consults this.
 *
 * EXAMPLE:
 *    <dotAmpRate:100>
 *  (Ring of Melting) Doubles the tick damage of every DoT this battler's
 *  wearer applies to anyone.
 *
 *    <thisDotAmpRate:50>
 *  (on a specific poison skill) Adds another 50% on top of that, but only
 *  for poison applied by this exact skill.
 *
 * STATE DURATIONS (map / ABS):
 * J-ABS does not use MZ "Remove by Walking" for map timers. That checkbox only
 * unlocked the stepsToRemove field in the database editor. Use note tags instead.
 *
 * FINITE TIMER (expires on the map):
 *    <stateDuration:FRAMES>
 *    <stateDurationSec:SECONDS>   (optional; SECONDS * 60 = frames)
 *
 * INDEFINITE (never expires on the map):
 *    <indefiniteState>
 *
 * RPG Maker MZ caps stepsToRemove at 9999 in the UI (~2.8 min at 60 fps).
 * You may leave stepsToRemove as a placeholder; J-ABS reads the tags above.
 * Food chain HUD segments use the same duration getter.
 *
 * NOTE: RMMZ targets 60 FPS but may run lower under heavy load, so
 * actual duration may exceed what the math suggests.
 *
 * ============================================================================
 * STATE DURATION EXTENSIONS:
 * Tags that modify the outgoing duration of states applied by a battler.
 * Place on weapons, armors, states, or other note-bearing objects.
 *
 * NOTE: These affect outgoing state duration only. They do not shorten
 * or extend how long incoming states last on this battler.
 *
 * NOTE: Multiple tags are summed from all applicable sources.
 *
 * FLAT:
 *    <stateDurationFlat: VAL>
 *  Where VAL is the flat number of frames to add (can be negative).
 *
 * PERCENT:
 *    <stateDurationPerc: VAL>
 *  Where VAL is the % of base duration to add (can be negative).
 *
 * FORMULA:
 *    <stateDurationFormula:[FORMULA]>
 *  Where FORMULA calculates bonus frames to add to the base duration.
 *
 * Formula context: a = the assailant applying the state (whose notes are
 * being summed), b = the base duration in frames before any boosts,
 * v = $gameVariables._data.
 *
 * EXAMPLE:
 *    <stateDurationFormula:[a.luk * 2]>
 *  Adds bonus frames to every state this battler applies, scaled off their
 *  own LUK.
 *
 * ============================================================================
 * PER-STATE REAPPLY OVERRIDES:
 * By default, all states use the reapply strategy defined in the plugin
 * parameters (refresh, extend, or stack). You can override this on a
 * per-state basis using these tags on individual states in the database.
 *
 * STACK TYPE:
 * Overrides the reapply strategy for this specific state.
 *    <stackType:TYPE>
 *  Where TYPE is one of: refresh, extend, stack.
 *
 * REFRESH CONFIG OVERRIDES:
 *    <stateRefreshDiminish:VAL>
 *  Frames shaved off each successive refresh (diminishing returns).
 *
 *    <stateRefreshReset:VAL>
 *  Frames of quiet time after which diminish resets back to zero.
 *
 * EXTEND CONFIG OVERRIDES:
 *    <stackExtendAmount:VAL>
 *  Frames added to the remaining duration on each extend application.
 *
 *    <stackExtendMax:VAL>
 *  The maximum total duration this state can be extended to.
 *
 * STACK CONFIG OVERRIDES:
 *    <stackMax:VAL>
 *  Maximum number of stacks this state can accumulate.
 *
 *    <stackMaxBoost:VAL>
 *  A blanket bonus to the stack cap of every state this battler stacks, regardless
 *  of which state it is. Read from every note source on the battler applying the
 *  stack (actor, class, equips, states) and summed together. Place on gear or a
 *  passive state for a "stacks build up further, period" effect.
 *
 *    <thisStackMaxBoost:VAL>
 *  A bonus to this specific state's own stack cap, read from this state's own note
 *  only (not summed from the battler's other sources). On its own this is nothing
 *  you couldn't do by just raising <stackMax:VAL> directly- its purpose is to ride
 *  along on a J-Extend overlay state. When another active state carries
 *  <extend:[STATE_ID]> or <extendType:TYPE> targeting this state, J-Extend
 *  merges the overlay's note (and thus its <thisStackMaxBoost:VAL> tag) into this
 *  state's resolved note before this tag is read- so a single overlay state (e.g.
 *  an equipment-granted passive) can raise the stack cap of one specific state, or
 *  of every state sharing a <type:TYPE> classifier, without touching the target
 *  state(s) directly.
 *
 *    <applyStacks:VAL>
 *  Number of stacks applied per hit (default 1).
 *
 *    <loseAllStacksAtOnce>
 *  If present, all stacks are lost at once upon expiration rather
 *  than losing one stack and refreshing.
 *
 *    <stackOnExpire>
 *  Inverts the normal expiration behavior entirely: instead of losing a
 *  stack when duration runs out, the state GAINS a stack and re-arms its
 *  own duration indefinitely, with no external reapplication needed. This
 *  is a self-perpetuating "ticking clock" state -- once applied, it keeps
 *  building stacks on its own timer until something else removes it
 *  outright (dispel, death, script call). Takes precedence over
 *  <loseAllStacksAtOnce>, since stacks are never lost via this path.
 *
 *    <stacksConvertToState:[NEW_STATE_ID, STACKS_REQUIRED]>
 *  When this state's stack count reaches STACKS_REQUIRED (checked on every
 *  stack application, using >= so overshooting is safe), the state identified
 *  by NEW_STATE_ID is applied to the afflicted battler as a fresh application.
 *  The converted state starts at 1 stack regardless of the source state's count.
 *  If the converted state is already active on the battler, the re-application
 *  is intentional — the converted state will be refreshed/stacked/extended
 *  per its own reapplication type on each subsequent source stack application.
 *  Only the first tag is read.
 *
 *    <removeOnConvert>
 *  If present alongside <stacksConvertToState>, the source state is fully
 *  removed from the battler when the conversion fires. Without this tag the
 *  source state remains active (both states coexist), which is the intended
 *  behavior for escalation patterns where the lesser effect persists alongside
 *  the greater one (e.g. base poison stays while lethal dose is also applied).
 *
 *    <convertUsesCaster>
 *  By default, conversion data (<stacksConvertToState> and <removeOnConvert>)
 *  is read from the TARGET's perceived version of the state. Add this tag to
 *  the base state to instead read conversion data from the CASTER's perceived
 *  version of the state. This is required when the conversion tag is added via
 *  a caster-side extension passive (e.g. a prof unlock that extends Tenderizing
 *  with <stacksConvertToState:[EXPOSED_ID, 20]>) — without it, the enemy target
 *  would not see the extension and the conversion would never fire.
 *
 * ============================================================================
 * ACTOR/CLASS TAGS:
 * These tags are placed on actors or classes in the database.
 *
 * ----------------------------------------------------------------------------
 * NO SWITCH:
 * Prevents the player from switching to this actor as the party leader
 * via the JABS party rotate command. Use this for actors that should
 * never be player-controlled (permanent support members, story actors,
 * etc.).
 *    <noSwitch>
 *
 * ============================================================================
 * VISUAL METADATA:
 * These tags are placed on skills and control how the action event
 * sprite looks on the map. None of them affect hitboxes or physics.
 *
 * All tags are optional. Omitting a tag leaves that property at its
 * default value.
 *
 * ----------------------------------------------------------------------------
 * VIS OFFSET:
 * Shifts the action sprite by a fixed pixel offset relative to the
 * center of the action event.
 *    <visOffset:[X,Y]>
 *  Where X is the horizontal offset in pixels (positive = right).
 *  Where Y is the vertical offset in pixels (positive = down).
 *
 * DIRECTIONAL OFFSETS:
 * Apply a different pixel offset depending on the direction the action
 * is traveling. Useful when a sprite looks off-center in some directions.
 *    <visOffsetU:[X,Y]>   (facing up)
 *    <visOffsetD:[X,Y]>   (facing down)
 *    <visOffsetL:[X,Y]>   (facing left)
 *    <visOffsetR:[X,Y]>   (facing right)
 *    <visOffsetUR:[X,Y]>  (diagonal: up-right)
 *    <visOffsetUL:[X,Y]>  (diagonal: up-left)
 *    <visOffsetDR:[X,Y]>  (diagonal: down-right)
 *    <visOffsetDL:[X,Y]>  (diagonal: down-left)
 *
 * NOTE: Directional offsets take precedence over <visOffset> when
 * a direction-specific tag is present.
 *
 * ----------------------------------------------------------------------------
 * VIS ANCHOR:
 * Overrides the anchor point of the action sprite. Anchor values are
 * between 0.0 and 1.0, where [0.5, 0.5] is the center.
 *    <visAnchor:[AX,AY]>
 *  Where AX is the horizontal anchor (0.0 = left edge, 1.0 = right).
 *  Where AY is the vertical anchor (0.0 = top, 1.0 = bottom).
 *
 * ----------------------------------------------------------------------------
 * VIS ROTATE:
 * Makes the action sprite rotate to face the direction it is moving.
 * Useful for directional projectile sprites like arrows or energy beams.
 *    <visRotate>
 *
 * ----------------------------------------------------------------------------
 * VIS SCALE:
 * Overrides the scale (stretch) of the action sprite.
 *    <visScale:[SX,SY]>
 *  Where SX is the horizontal scale (1.0 = normal).
 *  Where SY is the vertical scale (1.0 = normal).
 *
 * ----------------------------------------------------------------------------
 * VIS Z:
 * Overrides the z-order of the action sprite, controlling whether it
 * renders above or below other map sprites.
 *    <visZ:VAL>
 *  Where VAL is the z-order integer (higher = renders on top).
 *
 * ----------------------------------------------------------------------------
 * VIS DEBUG:
 * Renders a center-point debug gizmo on the action sprite. Use this
 * during development to diagnose offset and anchor issues.
 *    <visDebug>
 *
 * NOTE: Remove this before shipping. It is a development aid only.
 *
 * ============================================================================
 * CAST PREVIEW:
 * These tags control the hitbox preview overlay that is shown on the map
 * while a battler is casting a skill. Previews are visible by default if
 * the hitbox overlay system is enabled.
 *
 * ----------------------------------------------------------------------------
 * NO CAST PREVIEW (PER SKILL):
 * Disables the preview for this specific skill while it is being cast.
 *    <noCastPreview>
 *
 * Use this for skills where showing the hitbox preview would be too much
 * of a hint or ruin the surprise.
 *
 * ----------------------------------------------------------------------------
 * CAST PREVIEW WARN AT:
 * Instead of showing the preview for the full cast duration, this delays
 * the preview until only the last N frames of the cast remain.
 *    <castPreviewWarnAt:FRAMES>
 *  Where FRAMES is how many frames before cast completion the preview
 *  should appear.
 *
 * Use this for a "danger warning" style: the hitbox flashes briefly
 * right before the skill fires, giving the player a reaction window
 * instead of full cast visibility.
 *
 * ----------------------------------------------------------------------------
 * NO CAST PREVIEWS (PER BATTLER):
 * Disables cast previews for every skill this battler executes.
 *    <noCastPreviews>
 *
 * Place this on an enemy (in the database or as an event comment) to
 * make all of that enemy's skills fire without any hitbox preview.
 * Good for boss enemies whose telegraphs should come from animation
 * and sound rather than a hitbox overlay.
 *
 * ============================================================================
 * @param baseConfigs
 * @text BASE SETUP
 *
 * @param maxAiUpdateRange
 * @parent baseConfigs
 * @type number
 * @min 10
 * @text Max AI Update Range
 * @desc CHANGE THIS VALUE WITH CAUTION. MAKING THIS TOO HIGH WILL CAUSE LAG IF THERE ARE LOTS(30+) OF ENEMIES IN RANGE.
 * @default 15
 *
 * @param actionMapId
 * @parent baseConfigs
 * @type number
 * @text Action Map Id
 * @desc The default id of the map used for cloning action events off of.
 * @default 2
 *
 * @param enemyMapId
 * @parent baseConfigs
 * @type number
 * @text Enemy Map Id
 * @desc The id of the map used for cloning enemy events off of.
 * @default
 *
 * @param dodgeSkillTypeId
 * @parent baseConfigs
 * @type number
 * @text Dodge Skill Type Id
 * @desc The default id of the skill type that acts as a classification for dodge skills.
 * @default 1
 *
 * @param guardSkillTypeId
 * @parent baseConfigs
 * @type number
 * @text Rotate Skill Type Id
 * @desc The default id of the skill type that acts as a classification for guard skills.
 * @default 2
 *
 * @param weaponSkillTypeId
 * @parent baseConfigs
 * @type number
 * @text Weapon Skill Type Id
 * @desc The default id of the skill type that acts as a classification for weapon skills.
 * @default 7
 *
 * @param enemyDefaultConfigs
 * @text ENEMY BATTLER DEFAULTS
 *
 * @param defaultEnemyPrepareTime
 * @parent enemyDefaultConfigs
 * @type number
 * @text Default Enemy Prepare Time
 * @desc The default number of frames for "prepare" time.
 * @default 180
 *
 * @param defaultEnemyAttackSkillId
 * @parent enemyDefaultConfigs
 * @type number
 * @min 1
 * @text Default Enemy Attack Skill
 * @desc The default skill id used for an enemy basic attack where their animation is "normal attack".
 * @default 1
 *
 * @param defaultEnemySightRange
 * @parent enemyDefaultConfigs
 * @type number
 * @min 1
 * @text Default Enemy Sight Range
 * @desc The default range from a battler that they can engage in combat from.
 * @default 4
 *
 * @param defaultEnemyPursuitRange
 * @parent enemyDefaultConfigs
 * @type number
 * @min 1
 * @text Default Enemy Pursuit Range
 * @desc The default range from a battler that they can remain in combat within.
 * @default 6
 *
 * @param defaultEnemyAlertedSightBoost
 * @parent enemyDefaultConfigs
 * @type number
 * @min 1
 * @text Default Enemy Alerted Sight Boost
 * @desc The default boost to sight an enemy gains while alerted (alerted: hit from out of combat).
 * @default 2
 *
 * @param defaultEnemyAlertedPursuitBoost
 * @parent enemyDefaultConfigs
 * @type number
 * @min 1
 * @text Default Enemy Alerted Pursuit Boost
 * @desc The default boost to pursuit an enemy gains while alerted (alerted: hit from out of combat).
 * @default 4
 *
 * @param defaultEnemyAlertDuration
 * @parent enemyDefaultConfigs
 * @type number
 * @min 60
 * @text Default Enemy Alert Duration
 * @desc The default number of frames an enemy remains alerted (alerted: hit from out of combat).
 * @default 300
 *
 * @param defaultEnemyCanIdle
 * @parent enemyDefaultConfigs
 * @type boolean
 * @text Default Enemy Can Idle
 * @desc The default for whether or not enemies can idle.
 * @default true
 *
 * @param defaultEnemyShowHpBar
 * @parent enemyDefaultConfigs
 * @type boolean
 * @text Default Enemy Show HP Bar
 * @desc The default for whether or not enemies' HP bars are visible.
 * @default true
 *
 * @param defaultEnemyShowBattlerName
 * @parent enemyDefaultConfigs
 * @type boolean
 * @text Default Enemy Show Battler Name
 * @desc The default for whether or not enemies' names are visible.
 * @default true
 *
 * @param defaultEnemyIsInvincible
 * @parent enemyDefaultConfigs
 * @type boolean
 * @text Default Enemy Is Invincible
 * @desc Setting this to true will cause all enemies to be invincible by default. USE WITH CAUTION.
 * @default false
 *
 * @param defaultEnemyIsInanimate
 * @parent enemyDefaultConfigs
 * @type boolean
 * @text Default Enemy Is Inanimate
 * @desc Setting this to true will cause all enemies to be inanimate by default. USE WITH CAUTION.
 * @default false
 *
 * @param defaultConfigs
 * @text WHEN UNASSIGNED
 *
 * @param defaultToolCooldownTime
 * @parent defaultConfigs
 * @type number
 * @text Default Tool Cooldown Time
 * @desc The default number of frames for an item's cooldown if one isn't specified.
 * @default 300
 *
 * @param defaultLootExpiration
 * @parent defaultConfigs
 * @type number
 * @min -1
 * @text Default Loot Duration
 * @desc The default number of frames before an item expires from the map. Set to -1 for no expiration.
 * @default 900
 *
 * @param mapAfflictionConfigs
 * @text MAP AFFLICTION STRIP
 *
 * @param mapAfflictionIconScale
 * @parent mapAfflictionConfigs
 * @type number
 * @decimals 2
 * @text Map Affliction Icon Scale
 * @desc Scale applied to map affliction icons (1 = full icon size).
 * @default 0.5
 *
 * @param mapAfflictionGaugeHeight
 * @parent mapAfflictionConfigs
 * @type number
 * @min 1
 * @text Map Affliction Gauge Height
 * @desc Height in pixels of each map affliction drain gauge.
 * @default 3
 *
 * @param mapAfflictionGapBelowHpBar
 * @parent mapAfflictionConfigs
 * @type number
 * @min 0
 * @text Gap Below HP Bar
 * @desc Pixels between the hp gauge bottom and the affliction icon row.
 * @default 2
 *
 * @param mapAfflictionMaxSlots
 * @parent mapAfflictionConfigs
 * @type number
 * @min 1
 * @max 16
 * @text Map Affliction Max Slots
 * @desc Maximum number of affliction icons shown per row below a map battler.
 * @default 8
 *
 * @param defaultAttackAnimationId
 * @parent defaultConfigs
 * @type number
 * @text Default Attack Animation Id
 * @desc The default id of the animation for battlers when none is defined.
 * @default 1
 *
 * @param iconConfigs
 * @text ICON CONFIGURATIONS
 *
 * @param useElementalIcons
 * @parent iconConfigs
 * @type boolean
 * @text Use Elemental Icons
 * @desc Enable or disable the display of elemental icons on damage popups with this option.
 * @default true
 *
 * @param elementalIconData
 * @parent iconConfigs
 * @type struct<ElementalIconStruct>[]
 * @text Elemental Icon Data
 * @desc The collection of element ids and their icon indices.
 * @default ["{\"elementId\":\"0\",\"iconIndex\":\"127\"}","{\"elementId\":\"1\",\"iconIndex\":\"97\"}","{\"elementId\":\"2\",\"iconIndex\":\"107\"}","{\"elementId\":\"3\",\"iconIndex\":\"110\"}","{\"elementId\":\"4\",\"iconIndex\":\"64\"}","{\"elementId\":\"5\",\"iconIndex\":\"67\"}","{\"elementId\":\"6\",\"iconIndex\":\"69\"}","{\"elementId\":\"7\",\"iconIndex\":\"68\"}","{\"elementId\":\"8\",\"iconIndex\":\"70\"}","{\"elementId\":\"9\",\"iconIndex\":\"71\"}"]
 *
 * @param animationConfigs
 * @text ACTION DECIDED ANIMATIONS
 *
 * @param attackDecidedAnimationId
 * @parent animationConfigs
 * @type animation
 * @text Attack Decided Animation Id
 * @desc The animation id that plays on the ai-controlled battler when they decide an attack-action.
 * @default 135
 *
 * @param supportDecidedAnimationId
 * @parent animationConfigs
 * @type animation
 * @text Support Decided Animation Id
 * @desc The animation id that plays on the ai-controlled battler when they decide a support-action.
 * @default 136
 *
 * @param aggroConfigs
 * @text AGGRO DEFAULTS
 *
 * @param baseAggro
 * @parent aggroConfigs
 * @type number
 * @text Base Aggro
 * @desc The base amount of aggro generated by every action, in addition to the rest of the formula.
 * @default 100
 *
 * @param aggroPerHp
 * @parent aggroConfigs
 * @type number
 * @text Aggro per HP damage
 * @desc The amount of aggro generated per 1 HP damage dealt to a non-allied target.
 * @default 1
 *
 * @param aggroPerMp
 * @parent aggroConfigs
 * @type number
 * @text Aggro per MP damage
 * @desc The amount of aggro generated per 1 MP damage dealt to a non-allied target.
 * @default 2
 *
 * @param aggroPerTp
 * @parent aggroConfigs
 * @type number
 * @text Aggro per TP damage
 * @desc The amount of aggro generated per 1 TP damage dealt to a non-allied target.
 * @default 10
 *
 * @param aggroDrainMultiplier
 * @parent aggroConfigs
 * @type number
 * @text Aggro Drain Multiplier
 * @desc If the skill was an HP Drain, then generate an additional X aggro per HP drained.
 * @default 4
 *
 * @param aggroParryFlatAmount
 * @parent aggroConfigs
 * @type number
 * @min -999999
 * @text Aggro Parry Flat Amount
 * @desc If the skill didn't connect because it was parried, add this much instead. Can be negative.
 * @default -50
 *
 * @param aggroParryUserGain
 * @parent aggroConfigs
 * @type number
 * @text Aggro Parry User Gain
 * @desc If the skill didn't connect because it was parried, aggro the attacker this much.
 * @default 200
 *
 * @param aggroPlayerReduction
 * @parent aggroConfigs
 * @type number
 * @text Aggro Player Reduction
 * @desc The player can attack much faster than AI, so reducing their aggro output by default is sensible.
 * @decimals 2
 * @default 0.50
 *
 * @param channelConfigs
 * @text CHANNELING DEFAULTS
 *
 * @param defaultChannelTickSpeed
 * @parent channelConfigs
 * @type number
 * @min 1
 * @text Default Channel Tick Speed
 * @desc The number of frames between each repeated execution of a `<channel:[SKILL_ID, DURATION]>` skill's child skill, when the skill omits its own `<channelTickSpeed:N>` override.
 * @default 30
 *
 * @param stateConfigs
 * @text STATE DEFAULTS
 *
 * @param defaultStateReapplyType
 * @parent stateConfigs
 * @type select
 * @text Reapply Type
 * @desc The strategy used when applying a state on a battler already afflicted with the same state.
 * @default refresh
 * @option Refresh
 * @value refresh
 * @option Extend
 * @value extend
 * @option Stack
 * @value stack
 *
 * @param refreshConfigs
 * @parent stateConfigs
 * @text "REFRESH" CONFIG
 * @desc "Refresh" means that the state will have its duration reset to its original duration.
 *
 * @param extendConfigs
 * @parent stateConfigs
 * @text "EXTEND" CONFIG
 * @desc "Extend" means that the state will have its duration increased by its original duration.
 *
 * @param stackConfigs
 * @parent stateConfigs
 * @text "STACK" CONFIG
 * @desc "Stack" means that a state will gain an additional instance and be "refreshed".
 *
 * @param tickConfigs
 * @parent stateConfigs
 * @text "TICK" CONFIG
 * @desc Governs how often states (and natural regen) tick for slip/regen purposes.
 *
 * @param defaultStateRefreshDiminish
 * @parent refreshConfigs
 * @type number
 * @text Refresh Diminishment
 * @desc When a state is "refreshed", it will have this many frames less in duration added.
 * @default 120
 *
 * @param defaultStateRefreshReset
 * @parent refreshConfigs
 * @type number
 * @text Diminishment Reset
 * @desc After this many frames, the diminishing returns on a state being "refreshed" will reset. (60 frames = 1 second)
 * @default 900
 *
 * @param defaultStateSpreadTickInterval
 * @parent refreshConfigs
 * @type number
 * @text Default Spread Tick Interval
 * @desc Frames between state spread pulses when a state row omits <spreadTick:N>. (60 frames = 1 second)
 * @default 30
 *
 *
 * @param defaultStateExtendAmount
 * @parent extendConfigs
 * @type number
 * @text Extend Amount
 * @desc When a state is "extended", it will instead extend remaining duration by this many frames.
 * @default 120
 *
 * @param defaultStateExtendMax
 * @parent extendConfigs
 * @type number
 * @text Extend Amount
 * @desc When a state is "extended", it will instead extend remaining duration by this many frames.
 * @default 216000
 *
 *
 * @param defaultStateStackMax
 * @parent stackConfigs
 * @type number
 * @text Stack Cap
 * @desc When a state "stacks", there is a limit of this many stacks.
 * @default 5
 *
 * @param defaultStateApplicationCount
 * @parent stackConfigs
 * @type number
 * @text Stacks per Application
 * @desc When "stacking" a state, it will apply this many stacks by default.
 * @default 1
 *
 * @param defaultStateLoseAllStacksAtOnce
 * @parent stackConfigs
 * @type boolean
 * @text Lose All Stacks
 * @desc If true, then all state "stacks" will be lost upon expiration. If false, then one will be lost and "refresh".
 * @default false
 *
 * @param defaultStateTickInterval
 * @parent tickConfigs
 * @type number
 * @text Default Tick Interval
 * @desc Frames between slip/regen ticks when a state omits <thisTickSpeed:N>. (60 frames = 1 second)
 * @default 60
 *
 * @param minimumStateTickInterval
 * @parent tickConfigs
 * @type number
 * @text Minimum Tick Interval
 * @desc The tunable floor for tick intervals after all modifiers are applied; ticks can never resolve faster than this.
 * @default 4
 *
 * @param naturalRegenTickType
 * @parent tickConfigs
 * @type string
 * @text Natural Regen Tick Type
 * @desc The <type:CLASSIFIER> string treated as natural HRG/MRG/TRG's own type, so type-scoped tick modifiers can reach it.
 * @default regen
 *
 *
 * @param miscConfigs
 * @text MISCELLANEOUS SETUP
 *
 * @param lootPickupDistance
 * @parent miscConfigs
 * @type number
 * @text Loot Pickup Distance
 * @desc The distance of which the player must be to collect loot on the ground.
 * @decimals 2
 * @default 1.50
 *
 * @param lootPickupDistance
 * @parent miscConfigs
 * @type number
 * @decimals 2
 * @text Loot Pickup Distance
 * @desc The distance of which the player must be to collect loot on the ground.
 * @default 1.50
 *
 * @param allyRubberbandAdjustment
 * @parent miscConfigs
 * @type number
 * @decimals 2
 * @text Ally Rubberband Adjustment
 * @desc A modifier on the ally rubber band range (defaults of 10). This also affects the ally AI plugin if used.
 * @default 2.00
 *
 * @param dashSpeedBoost
 * @parent miscConfigs
 * @type number
 * @decimals 2
 * @text Dash Movespeed Boost
 * @desc The boost to movement speed when dashing. You may need to toy with this a bit to get it right.
 * @default 1.25
 *
 * @param hitboxOverlaysInitiallyVisible
 * @parent miscConfigs
 * @type boolean
 * @text Enable Hitbox Overlays
 * @desc Whether or not to overlay the map with battler and action hitbox visuals- for debugging.
 * @default false
 *
 * @param hitboxMeleeOriginOffsetPxX
 * @parent miscConfigs
 * @type number
 * @decimals 0
 * @min -999
 * @max 999
 * @text Melee Hitbox Origin Offset X (px)
 * @desc Extra pixels added to the screen-space X origin shared by collision, overlays, and hitbox pulses (negative = left).
 * @default 0
 *
 * @param hitboxMeleeOriginOffsetPxY
 * @parent miscConfigs
 * @type number
 * @decimals 0
 * @min -999
 * @max 999
 * @text Melee Hitbox Origin Offset Y (px)
 * @desc Extra pixels added to the screen-space Y origin shared by collision, overlays, and hitbox pulses (negative = up).
 * @default -10
 *
 * @param hitboxMeleeOriginExtraPxYFacingDown
 * @parent miscConfigs
 * @type number
 * @decimals 0
 * @min -999
 * @max 999
 * @text Melee Origin Extra Y When Facing Down (px)
 * @desc Added on top of Offset Y when travel facing is down (2) or diagonal down (1/3); tune if down-swings read behind the actor.
 * @default 0
 *
 * @param hitboxMeleeOriginExtraPxYFacingUp
 * @parent miscConfigs
 * @type number
 * @decimals 0
 * @min -999
 * @max 999
 * @text Melee Origin Extra Y When Facing Up (px)
 * @desc Added on top of Offset Y when travel facing is up (8) or diagonal up (7/9); tune if up-swings read too far from the body.
 * @default 0
 *
 * @param hitboxMeleeOriginLiftReductionPxFacingDown
 * @parent miscConfigs
 * @type number
 * @decimals 0
 * @min 0
 * @max 999
 * @text Melee Origin Lift Reduction When Facing Down (px)
 * @desc Subtracts from the default half-tile vertical lift when facing down (2) or diagonal down (1/3). Fixes pivots that sit too high (hitbox reads behind the actor). Half strength on diagonals.
 * @default 28
 *
 * @param hitboxPulseEnabled
 * @parent miscConfigs
 * @type boolean
 * @text Hitbox Pulse (Active Shape)
 * @desc When enabled, draws your attack hit shape for the full active lifetime (hit or miss). Uses the Hitbox Pulse layer.
 * @default true
 *
 * @param hitboxPulseHighlightColliders
 * @parent miscConfigs
 * @type boolean
 * @text Pulse: Highlight Colliding Battlers
 * @desc While Hitbox Pulse is enabled, briefly outline battlers (enemies, pillars, etc.) whose collision box overlaps your action shape—without turning on full debug overlays.
 * @default true
 *
 * @param hitboxPulseUseFadeAnimation
 * @parent miscConfigs
 * @type boolean
 * @text Hitbox Pulse: Use Fade / Pop Animation
 * @desc When false, the active hit shape holds steady alpha for the whole swing. When true, uses the legacy fade/scale pulse curve (better for very short flashes).
 * @default false
 *
 *
 * @param disengageConfigs
 * @text DISENGAGE SETUP
 *
 * @param showDisengageBalloon
 * @parent disengageConfigs
 * @type boolean
 * @text Show Disengage Balloon
 * @desc Whether or not to show a balloon above a battler when they disengage from their target.
 * @default false
 *
 * @param disengageBalloonId
 * @parent disengageConfigs
 * @type number
 * @text Disengage Balloon Id
 * @desc The id of the balloon to display when a battler disengages. Requires "Show Disengage Balloon" to be enabled.
 * @default 7
 *
 *
 * @param guardParryVisualConfigs
 * @text GUARD / PARRY VISUALS
 *
 * @param parryCharacterAnimationId
 * @parent guardParryVisualConfigs
 * @type number
 * @min 0
 * @text Parry Map Animation Id
 * @desc Database animation id played on the map character when a parry succeeds. Use 0 to skip the effect.
 * @default 122
 *
 *
 * @param implicitParryConfigs
 * @text IMPLICIT PARRY (PASSIVE)
 *
 * @param implicitParryDominanceMultiplier
 * @parent implicitParryConfigs
 * @type number
 * @decimals 2
 * @min 1.01
 * @text Dominance Multiplier (M)
 * @desc A/D ratio: no parry if >= M; always parry if <= 1/M; else linear odds. Default 2. Min 1.01.
 * @default 2
 *
 * @param implicitParryBaselineFloor
 * @parent implicitParryConfigs
 * @type number
 * @decimals 2
 * @min 0
 * @text Implicit Parry Baseline Floor
 * @desc Base pressure on both A and D before the per-level add below.
 * @default 50
 *
 * @param implicitParryBaselinePerLevel
 * @parent implicitParryConfigs
 * @type number
 * @decimals 3
 * @min 0
 * @text Baseline Per Caster/Target Level
 * @desc Extra baseline per level: caster level on A, target level on D (Lv1 adds 0).
 * @default 0.25
 *
 * @param implicitParryScaleFactor
 * @parent implicitParryConfigs
 * @type number
 * @decimals 2
 * @min 0
 * @max 1
 * @text Full Parry Scale Factor
 * @desc Multiplies the raw parry formula output to produce the actual full-negate chance. 0.2 = 20% of formula.
 * @default 0.2
 *
 *
 * @param glancingBlowConfigs
 * @text GLANCING BLOW (PARTIAL HIT)
 *
 * @param glancingBlowDominanceMultiplier
 * @parent glancingBlowConfigs
 * @type number
 * @decimals 2
 * @min 1.01
 * @text Glancing Dominance Multiplier (M)
 * @desc Band width for the glancing roll; uses the same A/D formula as parry but an independent M. Default 2.
 * @default 2
 *
 * @param glancingBlowDamageFactor
 * @parent glancingBlowConfigs
 * @type number
 * @decimals 2
 * @min 0
 * @max 1
 * @text Glancing Blow Damage Factor
 * @desc Fraction of normal damage dealt on a glancing blow. 0.3 = 30% of calculated damage.
 * @default 0.3
 *
 *
 * @param quickmenuConfigs
 * @text QUICKMENU SETUP
 *
 * @param equipCombatSkillsText
 * @parent quickmenuConfigs
 * @type string
 * @text Equip Combat Skills Text
 * @desc The text that shows up in the JABS quickmenu for the "equip combat skills" command.
 * @default Equip Combat Skills
 *
 * @param equipDodgeSkillsText
 * @parent quickmenuConfigs
 * @type string
 * @text Equip Dodge Skills Text
 * @desc The text that shows up in the JABS quickmenu for the "equip dodge skills" command.
 * @default Equip Dodge Skills
 *
 * @param equipOffhandText
 * @parent quickmenuConfigs
 * @type string
 * @text Equip Offhand Skill Text
 * @desc The text that shows up in the JABS quickmenu for the "equip offhand skill" command.
 * @default Equip Offhand Skill
 *
 * @param equipToolsText
 * @parent quickmenuConfigs
 * @type string
 * @text Equip Tools Text
 * @desc The text that shows up in the JABS quickmenu for the "equip tools" command.
 * @default Equip Tools
 *
 * @param equipUsableItemText
 * @parent quickmenuConfigs
 * @type string
 * @text Equip Usable Item Text
 * @desc The text that shows up in the JABS quickmenu for the "equip usable item" command.
 * @default Equip Usable Item
 *
 * @param mainMenuText
 * @parent quickmenuConfigs
 * @type string
 * @text Main MenuText
 * @desc The text that shows up in the JABS quickmenu for the "main menu" command.
 * @default Full Menu
 *
 * @param cancelText
 * @parent quickmenuConfigs
 * @type string
 * @text Cancel Text
 * @desc The text that shows up in the JABS quickmenu for the "cancel" command.
 * @default Cancel
 *
 * @param clearSlotText
 * @parent quickmenuConfigs
 * @type string
 * @text Clear Slot Text
 * @desc The text that shows up in the JABS quickmenu for the "clear slot" command.
 * @default Clear Slot...
 *
 * @param unassignedText
 * @parent quickmenuConfigs
 * @type string
 * @text UnassignedText
 * @desc The text that shows up in the JABS quickmenu for the "- unassigned -" command.
 * @default - unassigned -
 *
 * @param globalCooldownConfigs
 * @text GLOBAL COOLDOWN (GCD)
 *
 * @param enableGlobalCooldown
 * @parent globalCooldownConfigs
 * @type boolean
 * @text Enable Global Cooldown
 * @desc When true, whitelisted skill types stamp a battler-wide GCD and respect it on skill use (not dodge/tool).
 * @default false
 *
 * @param globalCooldownFrames
 * @parent globalCooldownConfigs
 * @type number
 * @min 1
 * @text Default GCD Frames
 * @desc Frames of global lockout after a GCD skill executes. Per-skill override: gcd notetag.
 * @default 30
 *
 * @param globalCooldownSkillTypes
 * @parent globalCooldownConfigs
 * @type number[]
 * @text Global Cooldown Skill Types
 * @desc Skill type ids (stypeId, same order as Database Types). These types trigger and respect GCD. Empty = no type-based GCD.
 * @default []
 *
 *
 *
 *
 * @param skillHistoryConfigs
 * @text SKILL HISTORY
 *
 * @param skillExecutionMaxWindowSeconds
 * @parent skillHistoryConfigs
 * @type number
 * @min 1
 * @text Skill History Max Window (Seconds)
 * @desc How many seconds a skill execution entry is kept before being pruned. Individual tag windows must be <= this value.
 * @default 15
 *
 * @param skillExecutionExcludedSkillTypes
 * @parent skillHistoryConfigs
 * @type number[]
 * @text Skill History Excluded Skill Types
 * @desc Skill type ids (stypeId) that are never recorded in the skill history log. Useful for excluding weapon combo types.
 * @default []
 *
 *
 *
 *
 * @command Enable JABS
 * @text Enable JABS
 * @desc Enables the JABS engine allowing battles on the map to take place.
 *
 * @command Disable JABS
 * @text Disable JABS
 * @desc Disables the JABS engine.
 *
 * @command toggleHitboxOverlays
 * @text Toggle Hitbox Overlays
 * @desc Toggles the visibility of the hitbox overlays.
 *
 * @command Set JABS Skill
 * @text Assign a JABS skill
 * @desc
 * Assigns a specific skill id or (item id) to a designated slot.
 * Assigned skills will be removed if not learned (unless locked).
 * @arg actorId
 * @type actor
 * @text Choose Actor
 * @desc
 * The actor to have the skill assigned to.
 * Please don't choose "none", that'll cause the game to crash.
 * @default 1
 *
 * @arg skillId
 * @type skill
 * @text Choose Skill
 * @desc
 * The skill to be assigned to the actor.
 * You may choose "none" if you want to unassign the slot.
 * @default 0
 *
 * @arg itemId
 * @type item
 * @text Choose Item
 * @desc
 * The item to be assigned to the actor.
 * This is only for use if assigning to the "tool" slot.
 * @default 0
 *
 * @arg slot
 * @type select
 * @text Choose Slot
 * @desc The slot to assign the skill to for this actor.
 * @option Tool
 * @option UsableItem
 * @option Dodge
 * @option Offhand
 * @option L1A
 * @option L1B
 * @option L1X
 * @option L1Y
 * @default L1A
 * @arg locked
 * @type boolean
 * @on Lock Skill
 * @off Don't Lock
 * @desc Locked skills cannot be unequipped until unlocked.
 * @default false
 *
 * @command Unlock JABS Skill Slot
 * @text Unlock a single JABS skill slot
 * @desc Unlocks a single JABS skill slot for the leader.
 * @arg Slot
 * @type select
 * @option Tool
 * @option UsableItem
 * @option Dodge
 * @option Offhand
 * @option L1A
 * @option L1B
 * @option L1X
 * @option L1Y
 *
 * @command Unlock All JABS Skill Slots
 * @text Unlock all JABS skill slots
 * @desc Unlocks all JABS skill slots for the leader.
 *
 * @command Rotate Party Members
 * @text Cycle to next leader
 * @desc Cycles the leader to the back and shifts all members forward one slot.
 *
 * @command Disable Party Rotation
 * @text Disable Party Rotation
 * @desc Disables the player from being able to rotate the party leader.
 * (This only affects the JABS party rotate functionality.)
 *
 * @command Enable Party Rotation
 * @text Enable Party Rotation
 * @desc (Re-)Enables the ability to execute a party rotate.
 * Other conditions still apply (like not rotating to a dead member).
 *
 * @command Refresh JABS Menu
 * @text Refresh JABS Menu
 * @desc Refreshes the JABS menu in case there were any adjustments made to it.
 *
 * @command Apply Global Cooldown
 * @text Apply global cooldown to actor
 * @desc Sets the battler-wide GCD timer on a party actor that is on the map (leader or visible follower).
 * @arg actorId
 * @type actor
 * @text Actor
 * @desc Actor receiving the GCD. Must be the leader or a visible follower on the current map.
 * @default 1
 * @arg frames
 * @type number
 * @min 0
 * @text Frames
 * @desc GCD duration in frames. Use 0 to clear the global cooldown slot.
 * @default 30
 *
 * @command Spawn Enemy
 * @text Spawn Enemy
 * @desc Dynamically spawn an enemy onto the map from the enemy clone map.
 * @arg x
 * @type number
 * @desc The x coordinate of where on the current map to spawn the enemy.
 * @default 1
 * @arg y
 * @type number
 * @desc The y coordinate of where on the current map to spawn the enemy.
 * @default 1
 * @arg enemyEventId
 * @type number
 * @desc The id of the event from the enemy clone map to spawn onto this map.
 * @default 1
 * @arg spawnAnimationId
 * @type animation
 * @desc The animation to execute upon the newly spawned enemy.
 * By default, no animation will play.
 * @default 0
 *
 * @command Spawn Loot
 * @text Spawn Loot
 * @desc Dynamically spawn some loot onto the map from the database.
 * If multiple loot ids are defined, then multiple will be dropped.
 * @arg x
 * @type number
 * @desc The x coordinate of where on the current map to spawn the loot.
 * @default 1
 * @arg y
 * @type number
 * @desc The y coordinate of where on the current map to spawn the loot.
 * @default 1
 * @arg lootItemIds
 * @type item[]
 * @desc The items to be dropped as loot.
 * @default []
 * @arg lootWeaponIds
 * @type weapon[]
 * @desc The weapons to be dropped as loot.
 * @default []
 * @arg lootArmorIds
 * @type armor[]
 * @desc The armors to be dropped as loot.
 * @default []
 * @arg spawnAnimationId
 * @type animation
 * @desc The animation to execute upon the newly spawned enemy.
 * By default, no animation will play.
 * @default 0
 */
//=================================================================================================
/*~struct~ElementalIconStruct:
 * @param elementId
 * @type number
 * @desc The id of the element to match an icon to.
 * @default 0
 *
 * @param iconIndex
 * @type number
 * @desc The index of the icon for this element.
 * @default 64
*/
//=================================================================================================
/* eslint-enable max-len */