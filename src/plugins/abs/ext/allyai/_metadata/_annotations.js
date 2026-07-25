//region Introduction
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Grants your allies AI to fight alongside the player.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-ABS
 * @orderBefore J-ABS-InputManager
 * @orderAfter J-Base
 * @orderAfter J-ABS
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin grants party followers AI to fight alongside the player.
 * Ally behavior is governed by three orthogonal axes and a do-nothing toggle.
 *
 * This plugin requires JABS.
 * This plugin requires followers be enabled to do anything.
 * ----------------------------------------------------------------------------
 * DETAILS:
 * All party members represented by followers on the field are granted AI for
 * action decision-making and movement positioning while in combat.
 *
 * Each ally's behavior is shaped by three independent axes:
 *
 *   RISK    (careful / balanced / reckless)
 *     Controls how aggressively the ally selects offensive skills.
 *     Careful allies lean on battle memories; reckless allies always press
 *     the strongest available skill.
 *
 *   SUPPORT (offense / balanced / support)
 *     Controls how much the ally weighs healing and buffing against offense.
 *     Support allies prioritize cleansing > healing > buffing before attacking.
 *     Balanced allies conditionally support when allies are in danger.
 *
 *   SPACING (frontline / midline / backline)
 *     Controls how close the ally positions itself relative to its target.
 *     Frontline allies close to melee range; backline allies hold at max skill
 *     range and maintain a shorter leash from the leader.
 *
 * The ten named presets snap all three axes to a coherent archetype:
 *   berserker  — reckless / offense  / frontline
 *   guardian   — careful  / offense  / frontline
 *   vanguard   — balanced / balanced / frontline
 *   war-priest — balanced / support  / frontline
 *   skirmisher — balanced / offense  / midline
 *   generalist — balanced / balanced / midline   (default)
 *   cleric     — careful  / support  / midline
 *   artillery  — careful  / offense  / backline
 *   wizard     — balanced / offense  / backline
 *   medic      — careful  / support  / backline
 *
 * A separate DO-NOTHING toggle overrides all axis behavior: the ally takes no
 * actions and backs away from all targets, staying near the leader.
 *
 * ============================================================================
 * DEFAULT ALLY AI PRESET:
 * Apply a tag to an actor or class to set their default preset on game start.
 * Class tags take priority over actor tags.
 *
 * TAG USAGE:
 * - Actors
 * - Classes
 *
 * TAG FORMAT:
 *  <defaultAi:PRESET>
 * Where PRESET is one of the ten preset keys listed above.
 *
 * EXAMPLE:
 *  <defaultAi:medic>
 * This ally defaults to the Medic preset (careful / support / backline).
 *
 * ----------------------------------------------------------------------------
 * BATTLE MEMORIES:
 * Allies accumulate battle memories as they fight. A memory records which
 * skills proved effective against a given enemy. Careful and balanced allies
 * use these memories to inform skill selection; reckless allies use them only
 * as a secondary signal when picking the strongest skill.
 *
 * AGGRO/PASSIVE TOGGLE:
 * A party-wide toggle controls engagement behavior. When Passive, allies only
 * fight when the leader attacks or when struck directly. When Aggressive,
 * allies engage any enemy that enters their sight range.
 *
 * ============================================================================
 * Caveats to note:
 * - When party-cycling, all allies will be pulled to the player and all aggro
 *   will be removed (so they don't just try to resume fighting).
 *
 * - When an ally is defeated, party-cycling will skip over them and they will
 *   follow the player like a normal non-battler follower.
 *
 * ============================================================================
 * CHANGELOG:
 * - 3.0.1
 *    Ally idle-check now also treats channeling as busy (J-ABS Channel).
 *    Fixed applyBattleMemories' inverted check; memories went unrecorded.
 *    Fixed jumpAll returning early instead of skipping just one follower.
 * - 3.0.0
 *    Replaced exclusive AI modes with three orthogonal behavior axes:
 *    risk (careful/balanced/reckless), support (offense/balanced/support),
 *    and spacing (frontline/midline/backline).
 *    Added ten named presets that snap all axes to a coherent archetype.
 *    Added per-ally do-nothing toggle (overrides all axes).
 *    Spacing axis now drives per-ally safe-distance thresholds and leash range.
 *    Removed dead modes: do-nothing (now a toggle), basic-attack, variety,
 *    full-force, support. Removed unused JABS_AllyAIMode class.
 * - 2.2.0
 *    Raised minimum J-ABS version to 4.10.0 (defensive dodge/guard coordination).
 *    Ally `JABS_AiManager` / battler paths updated for defensive interrupts and follower dodge behavior.
 * - 2.1.2
 *    decideAction and ally AI mode helpers now return a skill-id array, matching J-ABS 4.7.2.
 *    Raised minimum J-ABS version to 4.7.2.
 * - 2.1.1
 *    Raised minimum J-ABS version to 4.7.0.
 * - 2.1.0
 *    Raised minimum J-ABS version to 4.6.0.
 *    Delegates cleanse/heal/buff support logic to shared `JABS_AI` base methods (same behavior, less duplication).
 *    Fixed `aiComboChanceModifier` using `getMode().key` when `getMode()` already returns the mode key string.
 *    Fixed `bestFitHealingAllSkill` calling `bestFitHealingOneSkill` with no arguments on multi-heal fallback.
 *    Battle memory helpers now live on `JABS_AI`; `JABS_BattleMemory` class moved to J-ABS core.
 * - 2.0.1
 *    Consumed `RPGManager` update.
 * - 2.0.0
 *    Added a concept of "formations".
 *    Allies now own their own movement instead of mirroring the player.
 *    Added castbar visibility while casting (for allies).
 *    Changed rubberbanding to blink allies to the player instead of jump.
 * - 1.2.0
 *    Removed ally AI code from core JABS and added here.
 *    Fixed issue where battle memories were not correctly applied.
 * - 1.1.1
 *    Updated JABS menu integration with help text.
 * - 1.1.0
 *    Retroactively added this CHANGELOG.
 *    Upgraded AI to be able to leverage combos (enemy AI, too).
 *    Refactored code surrounding AI action decision-making.
 *    Refactored code surrounding ally AI assignment from command windows.
 *    Refactored code surrounding battler access and management.
 *    Refactored ally AI targeting.
 *    Removed dead code.
 * - 1.0.0
 *    The initial release.
 * ============================================================================
 * @param menuConfigs
 * @text MENU DETAILS
 *
 * @param jabsMenuAllyAiCommandName
 * @parent menuConfigs
 * @type string
 * @text Menu Text
 * @desc The text displayed in the JABS quick menu for the ally ai command.
 * @default Manage Allies AI
 *
 * @param jabsMenuAllyAiCommandIconIndex
 * @parent menuConfigs
 * @type number
 * @text Menu Icon
 * @desc The icon displayed beside the above menu text.
 * @default 2564
 *
 * @param jabsMenuAllyAiCommandSwitchId
 * @parent menuConfigs
 * @type number
 * @text Menu Switch
 * @desc The control switch for whether or not the ally ai command displays in the menu.
 * @default 101
 *
 * @param partyConfigs
 * @text PARTY-WIDE DETAILS
 *
 * @param partyWidePassiveText
 * @parent partyConfigs
 * @type string
 * @text Party Passive Text
 * @desc The text displayed when the party-wide toggle is set to "passive".
 * @default Passive Enabled
 *
 * @param partyWidePassiveIconIndex
 * @parent partyConfigs
 * @type number
 * @text Party Passive Icon
 * @desc The icon indicating party-wide passive engagement is enabled.
 * @default 4
 *
 * @param partyWideAggressiveText
 * @parent partyConfigs
 * @type string
 * @text Party Aggressive Text
 * @desc The text displayed when the party-wide toggle is set to "aggressive".
 * @default Aggressive Enabled
 *
 * @param partyWideAggressiveIconIndex
 * @parent partyConfigs
 * @type number
 * @text Party Aggressive Icon
 * @desc The icon indicating party-wide aggressive engagement is enabled.
 * @default 15
 *
 * @param allyFormationsConfigs
 * @text ALLY FORMATIONS DETAILS
 *
 * @param allyFormationsCommandName
 * @parent allyFormationsConfigs
 * @type string
 * @text Formations Command Text
 * @desc The text displayed for the ally formations command in the party menu.
 * @default Ally Formations
 *
 * @param allyFormationsCommandIconIndex
 * @parent allyFormationsConfigs
 * @type number
 * @text Formations Command Icon
 * @desc The icon displayed beside the ally formations command.
 * @default 289
 *
 * @param aiModeConfigs
 * @text AI-MODE DETAILS
 *
 * @param aiModeEquipped
 * @parent aiModeConfigs
 * @type number
 * @text Mode Equipped Icon
 * @desc The icon indicating that the mode is equipped.
 * @default 91
 *
 * @param aiModeNotEquipped
 * @parent aiModeConfigs
 * @type number
 * @text Mode Not Equipped Icon
 * @desc The icon indicating that the mode is not equipped.
 * @default 95
 *
 *
 */