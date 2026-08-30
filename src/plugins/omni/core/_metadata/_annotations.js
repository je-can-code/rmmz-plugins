//region Introduction
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Enables the "omnipedia" data-centric scene.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @orderAfter J-Base
 * @orderAfter J-Base-Save
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin enables a new scene called the "Omnipedia".
 * This scene is designed with extendability in mind, and can/will/does
 * contain a number of other sub-datasets, such as:
 * - Bestiary
 * - Items
 * - Weapons
 * - Armors
 *
 * Integrates with others of mine plugins:
 * - J-ControlledDrops; enables viewing of dropped loot in the bestiary.
 * ============================================================================
 * NOTE ABOUT NOTETAGS:
 * This plugin has no notetags of its own- it is purely the extendable
 * scene/menu shell that its sub-dataset extensions (Monster, Quest, etc.)
 * plug into. Those extensions own their own respective tags.
 * ============================================================================
 * CHANGELOG:
 * - 1.1.1
 *    Removed the console.debug narrating each root pedia selection. The method
 *    is an extension point every pedia overrides, so it now says that instead.
 * - 1.1.0
 *    Routed the _omni namespace into its own save section, so every
 *    omnipedia extension's data lands in systems/omni.json together rather
 *    than inside the party and system blobs.
 *    Moved the _omni namespace seeding from the initialize alias to
 *    initMembers, so a decoded save can establish it without a constructor.
 * - 1.0.1
 *    Updated JABS menu integration with help text.
 * - 1.0.0
 *    Initial release.
 * ============================================================================
 */
//endregion Introduction