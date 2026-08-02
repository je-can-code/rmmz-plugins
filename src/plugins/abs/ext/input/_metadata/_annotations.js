//region introduction
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] A manager for overseeing the input of JABS.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-ABS
 * @base J-Base
 * @orderAfter J-ABS
 * @orderAfter J-Base
 * @orderAfter J-ABS-AllyAI
 * @orderBefore J-HUD
 * @help
 * ============================================================================
 * OVERVIEW
 * ----------------------------------------------------------------------------
 * This plugin is a mapping of inputs to controls for JABS.
 *
 * This plugin requires JABS.
 * This plugin has no additional configuration required.
 * ----------------------------------------------------------------------------
 * DETAILS:
 * This entire plugin provides an implementation of a "controller" that the
 * player leverages to control inputs for JABS. With it, the player can press
 * keys or buttons to trigger JABS-specific functionality, like execution of
 * a skill, cycling with other members of the party, or bringing up the quick
 * menu. This plugin also provides a way to remap inputs to different keys or
 * buttons to suit the player's preferences.
 *
 * NOTE ABOUT DUPLICATES:
 * No single input can be mapped to multiple actions. Mapping the same input
 * to a second action will unbind the original. Be sure all actions you care
 * about are mapped! These cannot be undone mid-run by the player! (but they
 * can there is an exposed function on Game_System that will reset all input
 * mapping back to defaults via script call if necessary).
 *
 * ============================================================================
 * NOTE ABOUT NOTETAGS:
 * This plugin has no notetags of its own. Everything here is exposed via
 * plugin parameters (input remapping) and a Game_System script call for
 * resetting mappings to default- there's nothing to tag on database
 * objects.
 * ============================================================================
 * CHANGELOG:
 * - 2.3.0
 *    Added UsableItem as a remappable logical input (R2 by default),
 *    wiring J-ABS core's new usable-item equip slot to its own trigger.
 *    Centralized raw Input symbol strings into JabsInputSymbols.
 *    Removed now-redundant defensive guards now that input scaffolding
 *    initialization guarantees the mappings/bindings shape always exists.
 * - 2.2.2
 *    Raised minimum J-ABS version requirement to 4.7.0.
 * - 2.2.1
 *    Raised minimum J-ABS version requirement to 4.6.0.
 * - 2.2.0
 *    Removed independent remappability of sprint and mobility.
 *    Added support for tracking "in combat" to handle dash/mobility switching.
 *    Updated sprint input to switch to mobility skill while "in combat".
 * - 2.1.1
 *    Fixed typo in custom input mapping.
 * - 2.1.0
 *    Added ability to use dpad in "Window_Select"-based windows.
 *    Moved debug logic from J-ABS to this plugin.
 *    Updated old namespace for inputs to match this plugin.
 * - 2.0.0
 *    Significantly overhauled the plugin to support with input remapping.
 * - 1.0.0
 *    Initial release.
 * ============================================================================
 */