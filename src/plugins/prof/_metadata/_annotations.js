//region Introduction
/*:
 * @target MZ
 * @plugindesc
 * [v2.0.0 PROF] Enables skill proficiency tracking.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @orderAfter J-Base
 * @orderAfter J-ABS
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin enables the ability to have actors grow in prof when using
 * skills. Additionally, triggers can now be configured to execute
 * against these new proficiencies (and other things).
 *
 * Integrates with others of mine plugins:
 * - J-ABS; actions performed in JABS will accrue proficiency.
 * - J-Elem; enables damage formula integration for proficiency.
 * ----------------------------------------------------------------------------
 * DETAILS
 * This plugin tracks all skill usage for all battlers (actors and enemies,
 * though with enemies it is much less meaningful since they are short-lived).
 * By defining "proficiency conditionals", you can enable actors to unlock new
 * skills or gain other javascript-based rewards by using their skills.
 *
 * WHEN USING J-ELEMENTALISTICS
 * Additionally, a new parameter is exposed in the "damage formula" for "p"
 * which represents the attacker's proficiency in the skill being used. For
 * example, consider the following formula:
 *
 *  ((a.atk * 4) + p) - (b.def * 2)
 *
 * We would now translate that as:
 * 4X attacker ATK + attacker's proficiency in this skill
 * minus
 * 2X defender DEF
 *
 * Which gives this skill the ability to scale the more the attacker uses this
 * skill. Be aware there is no practical upper limit on proficiency, so if the
 * game is intended to go on for a long while, such scaling could be difficult
 * to balance in the long run. Use it in damage formulas wisely!
 * ----------------------------------------------------------------------------
 * !              IMPORTANT NOTE ABOUT CONFIGURATION DATA                     !
 * The configuration data for this plugin is derived from an external file
 * rather than the plugin's parameters. This file lives in the "/data"
 * directory of your project, and is called "config.proficiency.json". You can
 * absolutely generate/modify this file by hand, but you'll probably want to
 * visit my github and swipe the jmz-data-editor project I've built that
 * provides a convenient GUI for generating and modifying the configuration.
 *
 * If this configuration file is missing, the game will not run.
 *
 * Additionally, due to the way RMMZ base code is designed, by loading external
 * files for configuration like this, a project made with this plugin will
 * simply crash when attempting to load in a web context with an error akin to:
 *    "ReferenceError require is not defined"
 * This error is a result of attempting to leverage nodejs's "require" loader
 * to load the "fs" (file system) library to then load the plugin's config
 * file. Normally a web deployed game will alternatively use "forage" instead
 * to handle things that need to be read or saved, but because the config file
 * is just that- a file sitting in the /data directory rather than loaded into
 * forage storage- it becomes unaccessible.
 * ============================================================================
 * PROFICIENCY BONUSES
 * Have you ever wanted a battler to be able to gain some bonus proficiency by
 * means of something from the database? Well now you can! By applying the
 * appropriate tag to the various database locations, you too can have your
 * battlers gain bonus proficiency!
 *
 * NOTE:
 * Bonuses are flat bonuses that get added to the base amount, not percentage.
 *
 * TAG USAGE:
 * - Actors
 * - Classes
 * - Skills
 * - Weapons
 * - Armors
 * - Enemies
 * - States
 *
 * TAG FORMAT:
 *  <proficiencyBonus:NUM>
 *
 * TAG EXAMPLES:
 *  <proficiencyBonus:3>
 * The attacker now gains +3 bonus proficiency for any skill used.
 *
 *  <proficiencyBonus:50>
 * The attacker now gains +50 bonus proficiency for any skill used.
 * ============================================================================
 * PROFICIENCY BLOCKING
 * Have you ever wanted a battler to NOT be able to gain proficiency? Well now
 * you can! By applying the appropriate tags to the various database locations,
 * you too can block any battler from giving or gaining proficiency!
 *
 * NOTE:
 * It is important to recognize that there are two tags that both block the
 * gain of proficiency in different ways. One tag is designed to prevent the
 * GIVING of proficiency, for most commonly being placed on enemies or states
 * that enemies can be placed in. The second tag is designed to prevent the
 * GAINING of proficiency, most commonly being placed on actors or states that
 * actors can be placed in... though either tag can go on anything as long as
 * you understand what you're doing.
 *
 * TAG USAGE:
 * - Actors
 * - Classes
 * - Skills
 * - Weapons
 * - Armors
 * - Enemies
 * - States
 *
 * TAG FORMAT:
 *  <proficiencyGivingBlock>
 * or
 *  <proficiencyGainingBlock>
 *
 * TAG EXAMPLES:
 *  <proficiencyGivingBlock>
 * The battler that has this tag will not GIVE proficiency to any opposing
 * battlers that hit this battler with skills.
 *
 *  <proficiencyGainingBlock>
 * The battler that has this tag will not be able to GAIN proficiency from any
 * battlers that this battler uses skills against.
 * ============================================================================
 * PLUGIN COMMANDS
 * ----------------------------------------------------------------------------
 * COMMAND:
 * "Modify Actor's Proficiency"
 * This command will allow you to increase or decrease a single actor's
 * proficiency for a given skill. You only need choose the actor, skill, and
 * the amount to increase/decrease by.
 *
 * COMMAND:
 * "Modify Party's Proficiency"
 * This command will do the same as the single actor's command above, but
 * instead apply against the whole party.
 *
 * NOTES:
 * - You cannot reduce a skill's proficiency in a skill below 0.
 * - Increasing the proficiency can trigger rewards for the skill.
 * - Decreasing the proficiency will NOT undo rewards gained.
 * ============================================================================
 * CHANGELOG:
 * - 2.0.0
 *    THIS UPDATE BREAKS WEB DEPLOY FUNCTIONALITY FOR YOUR GAME.
 *    Updated to extend common plugin metadata patterns.
 *    Loads configuration data from external file.
 *    Proficiency conditional data is no longer saved to the actor.
 *    Retroactively added this changelog.
 * - 1.0.0
 *    The initial release.
 * ============================================================================
 * @param conditionals
 * @type struct<ProficiencyConditionalStruct>[]
 * @text Proficiency Conditionals
 * @desc A set of conditions that when met reward the player.
 * @default []
 *
 * @command modifyActorSkillProficiency
 * @text Modify Actor's Proficiency
 * @desc Increase/decrease one or more actor's proficiency with one or more skills.
 * @arg actorIds
 * @type actor[]
 * @text Actor Id
 * @desc Choose one or more actors to modify the proficiency for.
 * @arg skillIds
 * @type skill[]
 * @text Skill Id
 * @desc Choose one or more skills to modify the proficiency for.
 * @arg amount
 * @type number
 * @text Modifier
 * @desc This modifier can be negative or positive.
 * @min -999999
 * @max 999999
 *
 * @command modifyPartySkillProficiency
 * @text Modify Party's Proficiency
 * @desc Increase/decrease every member in the current party's proficiency with a particular skill.
 * @arg skillIds
 * @type skill[]
 * @text Skill Id
 * @desc Choose one or more skills to modify the proficiency for.
 * @arg amount
 * @type number
 * @text Modifier
 * @desc This modifier can be negative or positive.
 * @min -999999
 * @max 999999
 *
 */