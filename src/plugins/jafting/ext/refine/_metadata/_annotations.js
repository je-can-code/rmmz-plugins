//region Introduction
/*:
 * @target MZ
 * @plugindesc
 * [v1.0.0 JAFT-Refine] An extension for JAFTING to enable equip refinement.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @orderAfter J-Base
 * @orderAfter J-JAFTING
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin enables the "refine" functionality of JAFTING.
 * The "refine" functionality is basically a trait transferrence system with
 * some guardrails in-place.
 *
 * Integrates with others of mine plugins:
 * - J-Base; to be honest this is just required for all my plugins.
 * - J-JAFTING; the core that this engine hooks into to enable upgrading.
 *
 * ============================================================================
 * UPGRADING
 * Ever want to upgrade your equips by sacrificing others in the name of
 * ascending to godliness? Well now you can! By using a variety of tags placed
 * deliberately on your equips throughout the database, you too can have a
 * dynamic and powerful upgrading system for equipment.
 *
 * HOW DOES IT WORK?
 * This is an extension of the JAFTING plugin to enable the ability to "refine"
 * equipment. "Refinement" is defined as "transfering the traits of one item
 * onto another". It is also important to note that "transferable traits" are
 * defined as "all traits on an equip in the database that are below the
 * divider".
 *
 * NOTE ABOUT THE DIVIDER
 * The "divider" is another trait: 'Collapse Effect'. It doesn't matter which
 * option you select in the dropdown for this (for now). Traits that are above
 * the "divider" are considered "passive" traits that cannot be transfered.
 *
 * NOTE ABOUT TRAIT REMOVAL
 * This plugin does not handle trait removal, so do keep that in mind.
 *
 * This functionality's exclusive target is equipment. The most common use case
 * for this type of plugin is to repeatedly upgrade a weapon or armor of a
 * given type with new/improved traits, allowing the player to keep their
 * equipment relevant longer (or hang onto stuff for sentimental reasons, I
 * guess). It works in tandem with a basic crafting system (the JAFTING base
 * system) to allow you, the RM dev, to come up with fun ways to allow not only
 * you, but the player as well, to flex creativity by using recipes to make
 * stuff, then using refinement to upgrade it. With a wide variety of traits
 * spread across various equipment, combined with the notetags below, this
 * extension on JAFTING can make for some interesting situations in-game (good
 * and bad).
 * ============================================================================
 * MENU MANAGEMENT
 * In order to enable or disable menu access for this plugin, you can use the
 * plugin parameter that identifies the switch and toggle that in-editor. The
 * enabling of the menu option for refinement will match the state of the
 * switch in the plugin parameters.
 *
 * ============================================================================
 * TAGS
 * Obviously, being able to willy nilly refine any equips with any equips could
 * be volatile for the RM dev being able to keep control on what the player
 * should be doing (such as refining a unique equipment onto another and there
 * by losing said unique equipment that could've been required for story!).
 *
 * TAG USAGE
 * - Weapons
 * - Armors
 *
 * ----------------------------------------------------------------------------
 * DISABLE REFINEMENT
 * Placing this tag onto equipment renders it unavailable to be refined at all.
 * That means it simply won't show up in the refinement menu's equip lists.
 *
 * TAG FORMAT
 *  <noRefine>
 *
 * ----------------------------------------------------------------------------
 * DISALLOW USING AS A "BASE"
 * Placing this tag onto equipment means it will be a disabled option when
 * selecting a base equip to refine. This most commonly would be used by
 * perhaps some kind of "fragile" types of equipment, or for equipment you
 * designed explicitly as a material.
 *
 * TAG FORMAT
 *  <notRefinementBase>
 *
 * ----------------------------------------------------------------------------
 * DISALLOW USING AS A "MATERIAL"
 * Placing this tag onto equipment means it will be a disabled option when
 * selecting a material equip to refine onto the base. This most commonly would
 * be used for preventing the player from sacrificing an equipment that is
 * required for story purposes.
 *
 * TAG FORMAT
 *  <notRefinementMaterial>
 *
 * ----------------------------------------------------------------------------
 * MAXIMUM REFINEMENT COUNT
 * Where NUM is a number that represents how many times this can be refined.
 * Placing this tag onto equipment means it can only be used as a base for
 * refinement NUM number of times.
 *
 * TAG FORMAT
 *  <maxRefineCount:NUM>
 *
 * TAG EXAMPLES
 *  <maxRefinementCount:3>
 * An equip with this can only be used as a "base" for refinement 3 times
 * OR
 * An equip can only achieve be fused to or beyond +3 once
 * (whichever comes first)
 *
 * NOTE ABOUT LIMITS
 * While the refinement count may be fixed, you can still refine equips beyond
 * their limits by leveraging already-refined equipment as the material. The
 * system will allow fusing something if there are still refinement counts
 * available, even if the material has +8 when there is only 1 count left.
 *
 * ----------------------------------------------------------------------------
 * MAXIMUM TRAITS PER EQUIP
 * Where NUM is a number that represents how many combined traits it can have.
 * Placing this tag onto equipment means it can only be used as a base as long
 * as the number of combined trait slots (see the screen while refining) is
 * lesser than or equal to NUM. This most commonly would be used to prevent
 * the player from adding an unreasonable number of traits onto an equip.
 *
 * TAG FORMAT
 *  <maxRefinedTraits:NUM>
 *
 * TAG EXAMPLES
 *  <maxRefinedTraits:3>
 * An equip with this can only have a total of 3 unique traits.
 *
 * NOTE ABOUT LIMITS
 * Attempting to fuse beyond the max will not be allowed, even if there are
 * additional refinement counts available. However, traits will intelligently
 * stack if they are the same, and powering up existing traits will still be
 * allowed.
 *
 * ============================================================================
 * CHANGELOG:
 *
 * - 1.0.0
 *    Initial release.
 * ============================================================================
 *
 * @param parentConfig
 * @text SETUP
 *
 * @param menu-switch
 * @parent parentConfig
 * @type switch
 * @text Menu Switch ID
 * @desc When this switch is ON, then this command is visible in the menu.
 * @default 106
 *
 * @param menu-name
 * @parent parentConfig
 * @type string
 * @text Menu Name
 * @desc The name of the command used for JAFTING's Refinement.
 * @default Refinement
 *
 * @param menu-icon
 * @parent parentConfig
 * @type number
 * @text Menu Icon
 * @desc The icon of the command used for JAFTING's Refinement.
 * @default 2565
 *
 *
 * @command call-menu
 * @text Call the Refinement Menu
 * @desc Calls the JAFTING Refinement scene.
 *
 */