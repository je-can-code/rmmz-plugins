/* eslint-disable max-len */
/*:
 * @target MZ
 * @plugindesc
 * [v4.7.2 JABS] Enables combat to be carried out on the map.
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
 * - 4.7.2
 *    Unified enemy and ally AI skill decisions to return a skill-id array (empty or one id);
 *    JABS_AiManager phase-2 paths read the first element after validation.
 *    JABS_AI#decideAction stub now returns an empty array to match concrete AI classes.
 *    Fixed filterSkillsHealerPriority returning a scalar on the final healing-priority path
 *    instead of an array.
 * - 4.7.1
 *    Added plugin parameter "Parry Map Animation Id" for the database
 *    animation played on successful parry (default 122; 0 disables).
 *    Fixed Sprite_MapCastGauge gauge track being shortened by skill name width;
 *    track now always occupies the full bitmap width.
 *    Fixed enemy projectile fire direction baked at decision time rather than
 *    execution time; added restampActionDirections to re-orient volleys to the
 *    battler's facing at the moment of firing.
 *    Fixed hasInteractableEventInFront using raw fractional player coordinates
 *    with eventsXy, which always returned no match; coordinates are now rounded
 *    to the nearest tile before the look-ahead is computed.
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
 * By default, enemies are assigned team 1 and allied battlers are team 0.
 * Because they are on different teams, they can damage each other. If your
 * game needs more than "good guys and bad guys", you can reassign teams.
 *
 * NOTE: Team relationships (allies between teams, neutral factions, etc.)
 * are not deeply supported, but you can still redefine team ids to make
 * enemies fight each other.
 *
 * Default teams:
 * - 0 is for the player/allies.
 * - 1 is for enemies/monsters.
 * - 2 is for "neutral", aka inanimate objects.
 *
 *    <teamId:TEAM>
 *  Where TEAM is the numeric id to assign.
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
 * ----------------------------------------------------------------------------
 * RADIUS:
 * How large the hitbox of this skill is, using tiles as measurement.
 * Must be a positive number.
 *    <radius:VAL>
 *  Where VAL is the radius value for this skill.
 *
 * ----------------------------------------------------------------------------
 * PROXIMITY:
 * How close an AI-controlled battler must get to the target before they
 * can execute this skill.
 *    <proximity:VAL>
 *  Where VAL is the proximity value for this skill.
 *
 * ----------------------------------------------------------------------------
 * DIRECT:
 * With the "direct" tag, no projectile event is produced. Instead, the
 * skill immediately targets the nearest foe within the caster's proximity.
 * The skill still obeys CAST TIME, RADIUS, HITBOX, and other tags.
 * The most common use case is healing skills, or skills that should feel
 * instant and unblockable.
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
 * PROJECTILE:
 * How many projectiles fire when the skill is executed. All fire in
 * parallel in the direction the caster is facing.
 *    <projectile:VAL>
 *  Where VAL is the number of projectiles per direction.
 *
 * NOTE: There is no hard cap, but keep the count reasonable to avoid
 * performance issues.
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
 * FRONTSQUARE:
 * Like square, but the back half (behind the action) is omitted.
 *    <hitbox:frontsquare>
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
 * SIZE:
 * Overrides the collision radius for this skill in pixels rather than
 * tiles. Useful for fine-tuning hitboxes that feel too small or too large
 * at standard tile resolution.
 *    <size:VAL>
 *  Where VAL is the collision radius in pixels.
 *
 * NOTE: Most skills will not need this. Use <radius> for tile-based
 * sizing and only reach for <size> when pixel precision matters.
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
 * PIERCING:
 * Enables a skill to hit multiple targets multiple times, with an optional
 * delay between each hit.
 *    <pierce:[TIMES,DELAY]>
 *  Where TIMES is the maximum number of times this skill can pierce.
 *  Where DELAY is the number of frames between each hit.
 *
 * NOTE ABOUT HIT FREQUENCY:
 * The most a skill can hit is once per frame. A DELAY of 0 means it
 * hits every frame it collides.
 *
 * NOTE ABOUT SKILL REPEATS:
 * The database "repeats" field is added on top of the TIMES value.
 * Omitting the tag and adding "5 repeats" in the database is equivalent
 * to having <pierce:[6,0]> on the skill.
 *
 * ----------------------------------------------------------------------------
 * KNOCKBACK:
 * How many tiles the target is knocked back when hit by this skill.
 *    <knockback:VAL>
 *  Where VAL is the distance the target will be knocked back.
 *
 * ----------------------------------------------------------------------------
 * DELAY:
 * Allows a skill to sit on the map for a duration before triggering.
 * Think time bombs or landmines. Set DURATION to -1 to never detonate
 * until touched.
 *    <delay:[DURATION,TOUCHABLE]>
 *  Where DURATION is frames to exist before detonating.
 *  Where TOUCHABLE is true/false for whether touching it triggers it.
 *
 * EXAMPLE:
 *      <delay:[300,true]>
 * Sits on the map for 300 frames (~5 seconds). Any enemy who walks
 * into it triggers the action.
 *
 * WARNING ABOUT INDEFINITE DELAY:
 * If DURATION is -1, set TOUCHABLE to true, or the action will sit
 * there forever and never trigger.
 *
 * ----------------------------------------------------------------------------
 * COMBOS:
 * COMBO ACTION:
 * Defines what skill can be followed up after using this skill, and how
 * long until that follow-up becomes available.
 *    <combo:[COMBO_SKILL_ID,LINK_TIME]>
 *  Where COMBO_SKILL_ID is the skill ID that will be combo'd into.
 *  Where LINK_TIME is the number of frames until the combo is available.
 *
 * The combo-starter's cooldown must be longer than the LINK_TIME, or
 * the combo will never be reachable. Each executed combo action extends
 * the remaining cooldown by LINK_TIME, keeping the chain going.
 *
 * EXAMPLE:
 *      <combo:[2,10]>
 * Using this skill makes skill ID 2 available after 10 frames.
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
 *    <retaliate:[SKILL_ID,CHANCE]>
 *  Where SKILL_ID is the skill to fire.
 *  Where CHANCE is the integer percent chance to fire it (0-100).
 *
 * Place this tag on a state or on a piece of equipment. A battler under
 * a "thorns" state is a classic example of how to use this.
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
 * These slots are typically auto-assigned via equipment. The weapon slot
 * translates to mainhand; the shield fills offhand. Dual-wielding puts
 * the second weapon in the offhand slot. To designate which skill a
 * piece of equipment grants, use:
 *    <skillId:SKILL_ID>
 *  Where SKILL_ID is the skill to assign to the equip slot.
 *
 * NOTE: Only the offhand slot can define a guard skill.
 *
 * OFFHAND SKILL OVERRIDE:
 * In some cases, you may want a weapon to specify a different skill for
 * the offhand slot than the mainhand slot. This is useful for two-handed
 * weapons that also define their own offhand behavior:
 *    <offhandSkillId:SKILL_ID>
 *  Where SKILL_ID is the skill to assign specifically to the offhand.
 *
 * KNOCKBACK RESISTANCE:
 * Equip this on a weapon or armor to reduce the tiles a battler carrying
 * this equipment is knocked back by incoming hits:
 *    <knockbackResist:VAL>
 *  Where VAL is the number of knockback tiles to cancel.
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
 * ----------------------------------------------------------------------------
 * SLIP DAMAGE:
 * "Slip damage" is an alternative name for damage over time. There are
 * three types: flat, percent, and formula-based. All values are expressed
 * as "this much per 5 seconds" and are spread over 20 ticks (4/second).
 * The math:
 *    VAL / 20 = AMOUNT_PER_TICK
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
 *  Where VAL is the flat amount to gain or lose per 5 seconds.
 *
 * PERCENT:
 * Eats a portion of the battler's max value per tick. Use with care!
 *    <hpPercent:VAL>
 *    <mpPercent:VAL>
 *    <tpPercent:VAL>
 *  Where VAL is the % of max value to gain or lose per 5 seconds.
 *
 * FORMULA:
 * Allows damage that scales with battler stats. "a" is the afflicted
 * battler, "b" is the one who applied the state, "v" is variables,
 * and "s" is the state object.
 *    <hpFormula:[FORMULA]>
 *    <mpFormula:[FORMULA]>
 *    <tpFormula:[FORMULA]>
 *  Where FORMULA is a damage-like formula to calculate VAL per 5 sec.
 *
 * EXAMPLES:
 *    <hpFlat:-100>
 *  Lose 100 HP over five seconds (5 per tick).
 *
 *    <mpPercent:50>
 *  Lose 50% max MP over five seconds (2.5% per tick).
 *
 *    <tpFormula:[(a.atk * 2)]>
 *  Gain TP equal to 200% of own ATK over five seconds.
 *
 * NOTE ABOUT VAL OUTPUT:
 * Multiples of 20 are a handy mental shortcut: val 20 = 1 per tick,
 * val 40 = 2 per tick, and so on.
 *
 * STATE DURATIONS:
 * State duration is controlled by the "Remove by Walking" number box in
 * the database editor. That value is the number of frames the state
 * persists. At ~60 FPS, 300 frames ≈ 5 seconds.
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
 *    <stateDurationForm:[FORMULA]>
 *  Where FORMULA calculates bonus frames to add to the base duration.
 *  "a" is the afflicted battler, "b" is the base duration, "v" is
 *  the variable store.
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
 *    <applyStacks:VAL>
 *  Number of stacks applied per hit (default 1).
 *
 *    <loseAllStacksAtOnce>
 *  If present, all stacks are lost at once upon expiration rather
 *  than losing one stack and refreshing.
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
 * @param disableTextPops
 * @parent miscConfigs
 * @type boolean
 * @text Disable Text Pops
 * @desc Whether or not to disable the text popups, including: damage, rewards, parry, etc.
 * @default false
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
 * @param equipToolsText
 * @parent quickmenuConfigs
 * @type string
 * @text Equip Tools Text
 * @desc The text that shows up in the JABS quickmenu for the "equip tools" command.
 * @default Equip Tools
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
 * @option Dodge
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
 * @option Dodge
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
