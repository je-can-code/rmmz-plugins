//region annotations
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Adds typed (element/weapon type/skill type) AP gains and teachables.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-Aptitude
 * @orderAfter J-Base
 * @orderAfter J-ABS
 * @orderAfter J-Aptitude
 * @orderAfter J-Log
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin extends the Aptitude System by allowing the ability to define
 * teachables to require certain "types" of AP, and also allow the player to
 * gain certain "types" of AP.
 *
 * Integrates with others of mine plugins:
 * - J-Base; to be honest this is just required for all my plugins.
 * - J-Log; log the type of AP gained.
 * - J-Popups (+ J-Popups-APT); updates popups for typed AP gained.
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * This plugin allows the dev to create teachable skills that demand specific
 * "types" of AP to be earned instead of just plain AP. AP is "typed" by one of
 * two approaches: either explicit (putting a new "typed AP gain" tag on
 * specific enemies, similar to the existing AP gain tag) or implicit (the
 * ability to dynamically assess elements and the means of which an enemy was
 * defeated to determine what "types" of AP the player should earn).
 *
 * By default, implicit AP gains are disabled.
 * Update the plugin parameters to enable implicit AP gains.
 * See the next section for more details.
 *
 * ============================================================================
 * EXPLICIT vs IMPLICIT
 *
 * EXPLICIT
 * What is "explicit" typed AP gain?
 * You, the dev, can explicit apply tags to enemies of your choosing and state
 * that a particular enemy will grant a particular type of AP. Period. That is
 * it. You can specify that a fire demon grants 25 fire AP, or if you wanted,
 * you can specify that that same fire demon actually grants 10000 water AP. It
 * is explicit and simply whatever tags you apply.
 *
 *
 * IMPLICIT
 * What is "implicit" typed AP gain?
 * You, the dev, no longer need to worry about that cumbersome effort of having
 * to cycle over the entire database of enemies and applying tags to them.
 * Instead, the system will evaluate the means of defeat and the enemy being
 * defeated and determine "which type of AP" the player should gain. The system
 * will identify enemies as "aligned" by the following conditions in
 * conjunction with the plugin parameter values (that have sensible defaults).
 *
 * IMPLICIT ELEMENTAL GAIN FROM ENEMIES (elemental type)
 * If an enemy has a elemental trait on them that is equal to or lesser than
 * the plugin parameter "Elemental Alignment Threshold", then that enemy is
 * "aligned" with that particular element.
 *
 * IMPLICIT ELEMENTAL GAIN FROM ENEMIES (slayer type)
 * If an enemy has an elemental trait that is prefixed with "vs " or "x " or
 * "tool-" and it has a value that is equal to or greater than the plugin
 * parameter for "Slayer Alignment Threshold", then that enemy is "aligned"
 * with that particular element.
 *
 * NOTE ABOUT "SLAYER" TYPED ELEMENTS
 * "Slayer" type elements are an arbitrary concept where an element doubles as
 * a "taxonomy/attribute/functionality identifier" for an enemy. Examples of
 * such might be:
 * - "vs Reptile"     (taxonomy of lizards and dragons)
 * - "vs Undead"      (taxonomy of zombies and skeletons)
 * - "vs Slime"       (taxonomy of slimes and oozes)
 * - "vs Construct"   (taxonomy of robots and machines)
 * - "x Flying"       (attribute of enemies that fly or have wings)
 * - "x Armored"      (attribute of enemies that are armored or have shells)
 * - "tool-shatter"   (functionality of being susceptible to shatter effects)
 * - "tool-overload"  (functionality of being susceptible to overload effects)
 *
 * I do not know if this is a common usage of elements, but it is how I
 * leveraged elements in my own games, so if you want this type of
 * functionality in your game, you'll need to adapt your elements to follow
 * such conventions because it is hard-coded to look for this stuff.
 * You also do not have to use it.
 *
 * IMPLICIT WEAPON TYPE GAIN FROM USAGE
 * If an enemy is defeated with a skill that has a "required weapon type" value
 * on it, then AP gained from that enemy will be of that "weapon type".
 *
 * IMPLICIT SKILL TYPE GAIN FROM USAGE
 * If an enemy is defeated with a skill that is a part of a particular "skill
 * type", then AP gained from that enemy will be of that "skill type".
 *
 * IMPLICIT ELEMENT GAIN FROM USAGE
 * If an enemy is defeated with a skill that has a particular element (or
 * elements if using J-Elementalistics), then AP gained from that enemy will be
 * of that particular element.
 *
 *
 * NOTE ABOUT AP GAINED IMPLICITLY
 * All implicit gains will refer to the base <ap:AMOUNT> tag and will be gained
 * at "Percent of Implicitly-Typed AP Gained"% of AMOUNT. By default, this is
 * set to 0, meaning that no implicit AP gains will occur. If this system is
 *
 *
 * ============================================================================
 * TYPED TEACHABLES
 * Have you ever wanted to enable the ability to associate an element or
 * weapon type or skill type with a particular teachable so the player would
 * need to gain a particular type of AP to learn it? Well now you can! By
 * applying the appropriate tag to across the various database locations, you
 * too can do cool things that only others with this plugin can do.
 *
 * NOTE ABOUT IMPLICIT vs EXPLICIT GAINED AP
 * The typed teachables do not care whether the typed AP is explicitly gained
 * or implicitly gained. If the teachable requires 25 fire AP and the player
 * gains 25 fire AP from either approach, it will teach them the skill.
 *
 * TAG USAGE:
 * - Actors
 * - Classes
 * - Weapons
 * - Armor
 * - States
 *
 * TAG FORMAT:
 *  <aptitudeTyped:[SKILL_ID, REQUIRED_AP, DOMAIN, ID_OR_NAME]>
 *    Where SKILL_ID is the database id of the skill to learn,
 *    Where REQUIRED_AP is how much AP that source needs to teach it.
 *    Where DOMAIN is the family of AP typing to consider for ID_OR_NAME.
 *    Where ID_OR_NAME is the id or name of the element/weapon/skilltype.
 *
 * TAG EXAMPLES:
 *  <aptitudeTyped:[12, 150, element, fire]>
 * This source enables learning skill of id 12 once the owner gains 150 points
 * of "fire" element AP.
 *
 *  <aptitudeTyped:[20, 800, weapontype, 5]>
 * This source enables learning skill of id 20 once the owner gains 800 points
 * of weapon type with id 5 worth of AP.
 *
 *  <aptitudeTyped:[74, 1250, skilltype, sorcery]>
 * This source enables learning skill of id 74 once the owner gains 1250 points
 * of skill type with name "sorcery" worth of AP.
 *
 * ============================================================================
 * (explicit) TYPED AP GAIN
 * Have you ever wanted to gain AP of a particular type from enemies? Well now
 * you can! By applying the appropriate tags to enemies in the database, you
 * too can gain AP of a particular type from enemies.
 *
 * TAG USAGE:
 * - Enemies only.
 *
 * TAG FORMAT:
 *  <apTyped:[AMOUNT, DOMAIN, ID_OR_NAME]>
 *    Where AMOUNT is the amount of AP to be gained.
 *    Where DOMAIN is the family of AP typing to consider for ID_OR_NAME.
 *    Where ID_OR_NAME is the id or name of the element/weapon/skilltype.
 *
 * TAG EXAMPLES:
 *  <apTyped:[6, element, fire]>
 * This enemy will yield 6 fire-element AP upon defeat.
 *
 *  <apTyped:[3, weapontype, sword]>
 * This enemy will yield 3 sword-weapontype AP upon defeat.
 *
 * ============================================================================
 * CHANGELOG:
 * - 1.1.1
 *    Adapted to the RPGManager array read signature.
 * - 1.1.0
 *    Fixed <apTyped:[AMOUNT, DOMAIN, ID_OR_NAME]> never matching — the
 *    regex required a 4th leading numeric field that the documented
 *    3-argument format never had.
 *    Fixed AptitudeTeachable.js never being imported in entry.js, so
 *    setApTypeKey()/apTypeKey() were never actually attached.
 *    Renamed ApTypeKey.DomainType.WeaponType/SkillType to Weapon/Skill.
 *    Replaced the leftover boilerplate plugin description.
 * - 1.0.0
 *    The initial release.
 * ============================================================================
 *
 * @param implicitConfig
 * @text IMPLICIT SETUP
 *
 * @param implicitEnemyElementPercent
 * @parent implicitConfig
 * @type number
 * @text Percent of Implicitly-Typed AP Gained
 * @desc The percent of AP that will be gained from implicitly typed actions. Set to zero to disable implicit gains.
 * @min 0
 * @max 100
 * @default 0
 *
 * @param resistThreshold
 * @parent implicitConfig
 * @type number
 * @text Elemental Alignment Threshold
 * @desc The highest elemental rate allowed to identify an enemy's elemental alignment.
 * @min 0
 * @max 99
 * @default 75
 *
 * @param slayerWeaknessThreshold
 * @parent implicitConfig
 * @type number
 * @text Slayer Alignment Threshold
 * @desc The lowest elemental rate allowed to identify an enemy's taxonomy alignment.
 * @min 101
 * @max 1000
 * @default 125
 *
 * @param excludedAlignmentElements
 * @parent implicitConfig
 * @type string[]
 * @text Excluded Alignment Elements
 * @desc A list of elemental types that will not be considered for alignment.
 * @default []
 *
 * @command mod-ap-all
 * @text Add/Remove Typed AP (Party)
 * @desc Adds or removes a designated amount of typed AP from all members of the current party.
 * @arg points
 * @type number
 * @min -99999999
 * @max 99999999
 * @desc The amount of AP to modify by. Negative removes AP. Per-source never goes below 0.
 * @default 10
 * @arg domain
 * @type select
 * @option element
 * @option weapontype
 * @option skilltype
 * @desc The family of AP typing to consider for the actor.
 * @default element
 * @arg id
 * @type number
 * @min 1
 * @max 9999
 * @desc The id of the element, weapon type, or skill type to consider for the actor.
 * @default 1
 *
 * @command mod-ap
 * @text Add/Remove Typed AP
 * @desc Adds or removes a designated amount of typed AP from an actor by its id.
 * @arg actorId
 * @type actor
 * @desc The id of the actor to modify AP for.
 * @default 1
 * @arg points
 * @type number
 * @min -99999999
 * @max 99999999
 * @desc The amount of AP to modify by. Negative removes AP. Per-source never goes below 0.
 * @default 10
 * @arg domain
 * @type select
 * @option element
 * @option weapontype
 * @option skilltype
 * @desc The family of AP typing to consider for the actor.
 * @default element
 * @arg id
 * @type number
 * @min 1
 * @max 9999
 * @desc The id of the element, weapon type, or skill type to consider for the actor.
 * @default 1
 */
//endregion annotations