//region initialization
/*:
 * @target MZ
 * @plugindesc [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Allows levels to have greater control and purpose.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @orderAfter J-Base
 * @orderAfter J-ABS
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin scales various data points based on the difference between the
 * actor and enemy's levels. This also bestows a new "level" property upon
 * enemies, meaning they too can leverage their level in damage formulas for
 * skills and whatever other scripting shenanigans you want to do.
 *
 * The various data points include:
 * - damage
 * - experience
 * - gold
 *
 * See below SAMPLE CALCULATIONS to understand how the scaling works.
 *
 * CAUTION:
 * This probably won't work with any other plugins that mess with the
 * level functionality of battlers.
 *
 * Integrates with others of mine plugins:
 * - J-ABS; enables per-event-enemy level overrides.
 * - J-NATURAL; handles level-based max hp/mp/tp growths.
 *
 * ============================================================================
 * PLUGIN CONFIGURATION:
 * All tuning for this plugin (scaling multipliers, invariance ranges, actor/
 * enemy level balancer variable ids, single-level-across-classes toggle, the
 * canonical exp curve inputs, and the max level settings) lives in an external
 * JSON file rather than PluginManager parameters:
 *   data/config.level.json
 * This file is required- a missing or invalid file will crash boot, exactly
 * like this author's other config-file-driven plugins (J-ABS, J-SDP,
 * J-JAFTING-Creation, Omni-Quest, J-Diff, J-Prof). Author/maintain it via
 * jmz-data-editor's Level board rather than hand-editing JSON.
 *
 * Fields and their meaning:
 *  - useScaling (boolean):
 *      Whether or not this scaling functionality is enabled by default.
 *  - minMultiplier / maxMultiplier (number):
 *      Clamp floor/ceiling for damage and other combat uses of level scaling.
 *  - rewardMinMultiplier / rewardMaxMultiplier (number, nullable):
 *      Separate clamps for EXP and gold from level scaling. When null/absent,
 *      the combat min/max above is used instead.
 *  - growthMultiplier (number):
 *      The amount the multiplier changes per level of difference.
 *  - invariantUpperRange / invariantLowerRange (number):
 *      The amount above/below 0 levels of difference before scaling is
 *      applied. See the SAMPLE CALCULATIONS below for examples.
 *  - variableActorBalancer / variableEnemyBalancer (number):
 *      A variableId whose value is added to all actors'/enemies' levels.
 *  - useSharedActorLevel (boolean):
 *      Whether all classes share one actor-wide level/exp instead of each
 *      class leveling independently (vanilla RMMZ behavior).
 *  - canonicalExpBasis / canonicalExpExtra / canonicalExpAccA / canonicalExpAccB (number):
 *      The four inputs to the class-independent exp curve used when
 *      useSharedActorLevel is on. Ignored if another plugin (e.g.
 *      J-Level-Flat) overrides expForLevel; only matters as the honest
 *      default when nothing else does.
 *  - defaultBeyondMaxLevel (number):
 *      The default max level beyond the database's 99 cap.
 *  - trueMaxLevel (number):
 *      The absolute max level your level can be, including all boosts.
 * ============================================================================
 * SINGLE LEVEL ACROSS CLASSES:
 * By default, RPG Maker MZ tracks experience per-class (Game_Actor._exp is
 * keyed by classId), so switching to a class you haven't played resets you to
 * level 1 even if your other classes are deep into the double digits. With
 * this setting enabled, every class always agrees on the same level and exp
 * for a given actor- _exp remains an object keyed by classId (for
 * compatibility with anything that expects that shape), but every key is kept
 * in sync with every write, so there is effectively only one level per actor.
 *
 * Switching classes no longer resets or re-derives level from a per-class
 * exp bucket. It also retroactively grants every learning on the destination
 * class at or below your current level (mirroring how a fresh actor learns
 * everything up to their initial level), so jumping into a brand new class at
 * level 40 doesn't skip past its first 40 levels of learnings.
 *
 * This is intentionally orthogonal to per-class stat growth (see J-NATURAL):
 * J-NATURAL banks permanent stat growth once per level-up, sourced from
 * whichever class is active in that exact moment. With levels shared, playing
 * many classes no longer punishes you with a level-1 reset, but the stat
 * growth you bank is still shaped entirely by which classes you actually
 * spent those levels playing.
 * ============================================================================
 * LEVEL TAGS:
 * Have you ever wanted to scale damage/experience/gold by level, but realized
 * that enemies in RMMZ don't have a level parameter? Well now you can! By
 * adding the appropriate tags to various locations in the database, you too
 * can scale numbers to your hearts content!
 *
 * NOTE ABOUT LEVEL ZERO:
 * The level-scaling utility has no concept of actor or enemy when performing
 * its calculations. With that in mind, be cognizant of the magic level of
 * zero. If a level ever ends up being zero, that battler will be identified
 * as a "non-level", aka level scaling won't apply and all multipliers to and
 * from that battler will be 1.0x. Level can drop below zero, though, so just
 * stay aware when doing unusual things, like trying to add a state that grants
 * bonus levels for a scaling bonus to a non-level enemy.
 *
 * NOTE ABOUT REWARDS:
 * The way the math works out for the level-scaling calculations, the inputs
 * for levels are entered in reverse from the way they are in combat formulas!
 * If it helps you, you can think of it like enemies using a skill against
 * each member of your party that gives experience- and is affected by the
 * normal level-scaling mechanics. The same applies to gold rewards.
 *
 * NOTE ABOUT WORKING WITH JABS:
 * If a level is present on an event that is identified as a JABS enemy, this
 * level will override whatever is present on the database note section. You
 * can think of the event as the real level, while the database notes are the
 * "default" level for enemies. The overriden level still gets combined with
 * any other modifications from states and whatnot. If an enemy has a level, by
 * default it will show up in their battler name. If it is desired to be
 * hidden, it can be converted to ??? by using the hide level tag.
 *
 * DETAILS:
 * This was initially designed only for enemies, but has since been expanded to
 * also allow you to apply modifiers to your actors as well. For enemies, since
 * they do not innately have levels, the total amount of "level" is the sum of
 * all tags found for a given enemy across itself and any states that may be
 * applied to an enemy. For actors, it starts with whatever their current level
 * is, and if states/classes/equipment/skills also contain the tags, the level
 * modifiers will be stacked against the actor's base level.
 *
 * ENEMY TAG USAGE:
 * - Enemies
 * - States
 * - Events (w/ JABS)
 *
 * ACTOR TAG USAGE:
 * - Actors
 * - Classes
 * - Skills
 * - Weapons
 * - Armors
 * - States
 *
 * TAG FORMAT:
 *  <lv:NUM> or <lvl:NUM> or <level:NUM>
 * Where NUM is the level value to set/modify. (can be negative)
 *
 * TAG EXAMPLES:
 *  <level:4>
 * On enemies, if on the enemy, it would set their base level to 4.
 * On enemies, if on a state, it would grant a +4 modifier to their base level.
 * On events, this will override whatever the JABS enemy's level would be.
 * On actors, this would grant a +4 level modifier to their base level.
 *
 *  <level:-2>
 * On enemies, if on the enemy, it would do nothing.
 * On enemies, if on a state, and they have a base level set,
 *  this will grant a -2 modifier to their base level.
 * On actors, this will grant a -2 modifier to their base level.
 *
 *  <hideLevel>
 * On enemies, this will turn the level into "???" instead of the level value.
 * On events, this will override a singular enemy into hiding the value.
 * On states, this will do nothing.
 *
 * ============================================================================
 * SKILL LEARNING TAGS
 * Have you ever wanted enemies to learn new skills as they "level up"? Well,
 * now you can! By applying the appropriate tag w/ data points to the enemies,
 * you too can have enemies obtain new skills as they reach ever-higher levels!
 *
 * NOTE ABOUT LEVELS AND SKILLS:
 * The actual skill needs to be in the actions list of an enemy in order for it
 * to ever be available. The tag is basically a "guard" that level-checks before
 * allowing the skill to be included in the skill list when the list of skills
 * for an enemy is grabbed and mapped.
 *
 * NOTE ABOUT COMPATIBILITY:
 * Due to the nature of how this functionality works, this tag probably won't
 * work as-intended outside of JABS. An extension would need to be drafted
 * that leverages the Game_Enemy.prototype.skills function to determine their
 * available skills instead of the default- which directly parses the actions.
 *
 * TAG USAGE:
 * - Enemies only.
 *
 * TAG FORMAT:
 *  <learning:[SKILL_ID, LEVEL_LEARNED]>
 * Where SKILL_ID is the skill being learned, and LEVEL_LEARNED is the level
 * at which the enemy must be before the skill becomes available to them.
 *
 * TAG EXAMPLE:
 *  <learning:[210, 10]>
 * An enemy with this tag will have skill of ID 210 become "learned" when the
 * enemy is level 10 or higher.
 *
 * ============================================================================
 * BEYOND THE MAX LEVELS
 * Have you ever wanted levels to exceed 99? Well now you can! By properly
 * setting the plugin configuration, you too can reach beyond the max level!
 *
 * NOTE ABOUT PLUGIN CONFIGURATION:
 * There are two important values that should be considered when working with
 * beyond max level tags: the "default beyond max level" value- aka the "base",
 * and the "max boosted level" value- aka the "cap", as they influence the tags
 * in this section.
 *
 * TAG USAGE:
 * - Actors
 * - Classes
 * - Skills
 * - Weapons
 * - Armors
 * - States
 *
 * TAG FORMAT:
 *  <maxLevelBoost:AMOUNT>
 * Where AMOUNT is a negative or positive integer applied to the base beyond
 * max level.
 *
 * TAG EXAMPLES:
 *  <maxLevelBoost:+25> (on the actor)
 * The actor with this tag will have a +25 modifier to their base max level,
 * but no higher than the cap max level.
 *
 *  <maxLevelBoost:+100> (on the actor)
 *  <maxLevelBoost:-25> (on an equipped weapon)
 * The actor with these tags will have a +75 (100-25=75) modifier to their base
 * max level, but no higher than the cap max level.
 *
 *  <maxLevelBoost:-50> (on the actor)
 *  <maxLevelBoost:-25> (on a learned skill for the actor)
 *  <maxLevelBoost:+10> (on a state applied to the actor)
 * The actor with these tags will have a -65 (-50-25+10=-65) modifier to their
 * base max level.
 *
 * ============================================================================
 * GROWTH CURVES (BEYOND MAX LEVEL)
 * Have you ever wanted precise, authored control over a stat's growth past
 * level 99 instead of trusting a slope-extrapolation guess? Well now you can!
 * By tagging a class with a growth curve formula for a given parameter, that
 * formula becomes the source of truth for that stat beyond 99- replacing the
 * fallback extrapolation entirely for that class/param combination.
 *
 * NOTE ABOUT AUTHORING:
 * These are primarily generated via the jmz-data-editor's Classes board
 * (which previews the exact same formula evaluation the runtime uses), but
 * nothing stops you from hand-authoring them directly on a class note.
 *
 * NOTE ABOUT MTP:
 * Every base parameter (mhp/mmp/atk/def/mat/mdf/agi/luk) only uses its growth
 * curve tag beyond level 99- levels 1-99 stay driven by the class's baked
 * params[] array from the database. MTP is different: it has no params[]
 * array at all (it's a J-Base/J-NaturalGrowth note-tag-only stat), so its
 * growth curve tag, when present, is evaluated LIVE for every level, not
 * just beyond 99.
 *
 * Formula context:
 *   a.level = the level being evaluated (this is the ONLY binding available-
 *             no b, no v, unlike most other formula tags in this ecosystem)
 *
 * TAG USAGE:
 * - Classes only.
 *
 * TAG FORMAT:
 *  <mhpGrowthCurve:[FORMULA]>
 *  <mmpGrowthCurve:[FORMULA]>
 *  <atkGrowthCurve:[FORMULA]>
 *  <defGrowthCurve:[FORMULA]>
 *  <matGrowthCurve:[FORMULA]>
 *  <mdfGrowthCurve:[FORMULA]>
 *  <agiGrowthCurve:[FORMULA]>
 *  <lukGrowthCurve:[FORMULA]>
 *  <mtpGrowthCurve:[FORMULA]>
 *
 * TAG EXAMPLES:
 *  <atkGrowthCurve:[20 + (a.level * 3)]>
 * Beyond level 99, this class's ATK follows 20 + (level * 3) instead of the
 * slope-extrapolation fallback.
 *
 *  <mtpGrowthCurve:[a.level * 2]>
 * This class's max TP is always (level * 2), evaluated live at every level-
 * not just beyond 99.
 *
 * ============================================================================
 * SAMPLE CALCULATIONS:
 * Here is an example back and forth encounter between an allied party and
 * enemy party.
 *
 * Let us assume you are using the default plugin parameters.
 *
 * You have a party that looks like this:
 * - Gilbert  lv12
 * - Susan    lv14
 * - Frank    lv11
 * - Ophelia  lv35
 *
 * And you are fighting an enemy troop that looks like this:
 * - Slime      lv12  (10xp)
 * - Goblin     lv13  (14xp)
 * - Gigagoblin lv20  (55xp)
 * - Red Slime  lv16  (21xp)
 *
 * Gilbert attacks Slime!
 * They are the same level.
 * Damage is not modified; 1.0x.
 *
 * Susan attacks Slime!
 * Susan is 2 levels over the slime.
 * There is 1 level of upper invariance.
 * The actual variance is +1 level difference.
 * The growth per level of difference is 0.1x.
 * Damage is increased; 1.1x for this attack.
 *
 * Goblin attacks Gilbert!
 * The attacker(Goblin) is 1 level over the defender(Gilbert).
 * There is 1 level of upper invariance.
 * The actual variance is 0 level difference.
 * Damage is not modified; 1.0x.
 *
 * Gigagoblin attacks Susan!
 * The attacker(Gigagoblin) is 6 levels over the defender(Susan).
 * There is 1 level of upper invariance.
 * The actual variance is +5 level difference.
 * The growth per level of difference is 0.1x.
 * Damage is increased; 1.5x for this attack.
 *
 * Ophelia attacks Gigagoblin!
 * The attacker(Ophelia) is 15 levels over the defender(Gigagoblin).
 * There is 1 level of lower invariance.
 * The actual variance is +14 level difference.
 * The growth per level of difference is 0.1x.
 * The actual multiplier is 2.4x.
 * The cap multiplier is 2.0x.
 * Damage is increased; capped at 2.0x (from 2.4x).
 *
 * Frank attacks Red Slime!
 * The attacker(Frank) is 5 levels under the defender(Red Slime).
 * There is 1 level of lower invariance.
 * The actual variance is -4 level difference.
 * The reduction per level of difference is -0.1x.
 * Damage is reduced; 0.6x for this attack.
 *
 * Gigagoblin attacks Ophelia!
 * The attacker(Gigagoblin) is 15 levels under the defender(Ophelia).
 * There is 1 level of lower invariance.
 * The actual variance is -14 level difference.
 * The reduction per level of difference is -0.1x.
 * The actual multiplier is -0.4x.
 * (which would actually heal the defender!!!)
 * The minimum multiplier is 0.1x.
 * Damage is reduced; capped at 0.1x for this attack.
 *
 * Eventually, all enemies are defeated (thanks Ophelia!).
 * Average the actor's party level (18).
 * There is 1 level of upper/lower invariance.
 *
 * Party average of 18 is 6 levels over the slime, -1 for invariance.
 * Slime experience (10) is multiplied by 0.5x; 5xp.
 * Party average of 18 is 5 levels over the goblin, -1 for invariance.
 * Goblin experience (14) is multiplied by 0.6x; 8.4xp.
 * Party average of 18 is 2 levels under the gigagoblin, +1 for invariance.
 * Gigagoblin experience (55) is multiplied by 1.1x; 60.5xp.
 * Party average of 18 is 2 levels over the red slime, -1 for invariance.
 * Red Slime experience (21) is multiplied by 0.9x; 18.9xp.
 * Each member of the party gains 92.8 experience.
 *
 * This same logic is again applied to gold from each defeated enemy.
 * ============================================================================
 * CHANGELOG:
 * - 1.5.0
 *    Learning a skill by levelling now announces in the dia log instead of
 *    only producing a floating text pop on the same visual channel as damage
 *    numbers and gold. backfillLearningsForCurrentLevel is explicitly safe to
 *    call repeatedly, so it snapshots prior knowledge and does not re-announce
 *    an actor's whole class list on every class change.
 * - 1.4.0
 *    Added Single Level Across Classes: actors can now share one level/exp
 *    across all classes instead of leveling each class independently, with
 *    a class-independent canonical exp curve and retroactive learning
 *    backfill on class change.
 *    Added per-class growth curve tags (<mhpGrowthCurve>, etc. for all base
 *    params plus <mtpGrowthCurve>) as authored, formula-driven replacements
 *    for the slope-extrapolation fallback beyond level 99. MTP's curve is
 *    evaluated live at every level, not just beyond 99, since MTP has no
 *    baked params[] array to defer to below the cap.
 * - 1.3.1
 *    Updated battler name rendering support for compatibility.
 * - 1.3.0
 *    Added reward-specific min/max multipliers; LevelScaling.multiplier accepts combat vs reward scope.
 * - 1.2.1
 *    Fixed issue with level overrides not apply J-NATURAL growths.
 * - 1.2.0
 *    Added ability to override JABS enemies on the map with a new level.
 * - 1.1.1
 *    Added ability to manipulate max level for actors.
 *    Adapted extended plugin metadata structure.
 * - 1.1.0
 *    Refactored various data retrieval methods from given battlers.
 *    Fixed issue with mismapped level calculations.
 *    Added more jsdocs and comments to explain better the logical flow.
 *    Removed useless methods.
 *    Updated example battle scenario to be more verbose.
 * - 1.0.0
 *    The initial release.
 * ============================================================================
 * @command enableScaling
 * @text Enable Scaling
 * @desc Enables the scaling functionality for damage/rewards.
 *
 * @command disableScaling
 * @text Disable Scaling
 * @desc Disables the scaling functionality for damage/rewards.
 */