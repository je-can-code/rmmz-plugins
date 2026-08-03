//region Introduction
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Root JAFTING menu, salvage loop, and extension hooks.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @orderAfter J-Base
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin is the core menu system that other JAFTING menus plug into.
 * It was designed as an extensible wrapper scene for all JAFTING modes.
 *
 * NOTE ABOUT THIS PLUGIN:
 * This is a base plugin that offers no actual crafting functionality itself.
 * It offers instead a root "JAFTING" menu that the other extensions will
 * connect to for singular JAFTING access—including Salvage on that hub (same
 * scene as {@code call-salvage}). Chances are, if you are using
 * this plugin, you probably also want to grab the "Creation" extension and/or
 * the "Refinement" extension and place them below this one.
 * ============================================================================
 * ORGANIZATION:
 * Have you ever wanted a menu that has a single purpose, such as granting
 * access to all the other crafting menus built to work with JAFTING? Well now
 * you can! Just drop this plugin above your other installed JAFTING extension
 * plugins, and voila! It works.
 *
 * NOTE ABOUT THIS PLUGIN:
 * It isn't really necessary. It is literally just a wrapper scene and menu
 * that unifies access to all JAFTING scenes. You could also just directly
 * call the other JAFTING scenes directly if you preferred.
 * ============================================================================
 * NOTE ABOUT NOTETAGS:
 * This plugin has no notetags of its own- salvage/refine material typing is
 * configured entirely via plugin parameters (armor/weapon type ids), and
 * the JAFTING extensions that plug into this hub (Creation, Refinement) own
 * their own respective tags.
 * ============================================================================
 * CHANGELOG:
 * - 2.2.0
 *    Routed the _jafting namespace into its own save section, so crafting
 *    state lands in systems/jafting.json rather than in the system blob.
 * - 2.1.3
 *    Split JaftingSalvageDataModels.js into one file per class
 *    (JaftingSalvageLedgerRow/Snapshot/PartyLedgerBag) and registered all
 *    three with SerializableRegistry so JsonEx restores keep their
 *    prototype methods after a save load.
 * - 2.1.2
 *    Salvage hub row: label, icon, optional switch gate
 *    ({@link Window_JaftingList}).
 *    {@link Scene_JaftingSalvage.KEY} ties the hub entry to scene routing.
 * - 2.1.1
 *    Party salvage bags init from {@link DataManager.createGameObjects} and
 *    {@link DataManager.extractSaveContents}
 *    (not {@link Scene_Boot#onDatabaseLoaded}; runs before $gameParty exists).
 * - 2.1.0
 *    Salvage ledger helpers, {@link Scene_JaftingSalvage}, and plugin command
 *    call-salvage.
 * - 2.0.0
 *    Removed all references to refinement logic.
 *    Extracted the crafting logic entirely into its own plugin.
 *    Repurposes this plugin to be the "core" or "root" crafting menu only.
 *    Retroactively added this CHANGELOG.
 * - 1.0.0
 *    Initial release.
 * ============================================================================
 *
 * @command call-menu
 * @text Call Core Menu
 * @desc Brings up the core JAFTING menu.
 *
 * @command call-salvage
 * @text Call Salvage Scene
 * @desc Opens the JAFTING salvage scene where stamped gear can be dismantled (same scene as the hub Salvage row).
 *
 * @param jaftingSalvageConfig
 * @text SALVAGE / REFINE STACKS
 *
 * @param material-armor-type-id
 * @parent jaftingSalvageConfig
 * @type number
 * @min -1
 * @text Material armor type id
 * @desc Armor atypeId treated as stack-only ingredients (refinement base list omits them; dismantle keeps bare rows). Use -1 to disable. Default 5.
 * @default 5
 *
 * @param material-weapon-type-id
 * @parent jaftingSalvageConfig
 * @type number
 * @min -1
 * @text Material weapon type id
 * @desc Weapon wtypeId treated like material armors (stack counts in refine lists; dismantle pass-through). Use -1 to disable; 0 is a valid type id.
 * @default -1
 *
 * @param jaftingHubSalvage
 * @text HUB — SALVAGE ROW
 *
 * @param salvage-menu-switch
 * @parent jaftingHubSalvage
 * @type number
 * @min 0
 * @text Salvage hub switch id
 * @desc When non-zero, the Salvage hub row requires this game switch ON. Use 0 to always show Salvage (ignore switches).
 * @default 0
 *
 * @param salvage-menu-name
 * @parent jaftingHubSalvage
 * @type string
 * @text Salvage hub command name
 * @desc Label for the Salvage entry on the root JAFTING menu.
 * @default Salvage
 *
 * @param salvage-menu-icon
 * @parent jaftingHubSalvage
 * @type number
 * @text Salvage hub command icon
 * @desc Icon index drawn beside the Salvage hub command (RPG Maker icon sheet).
 * @default 192
 *
 */