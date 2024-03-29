//region Introduction
/*:
 * @target MZ
 * @plugindesc
 * [v1.0.0 JAFT] Enables the ability to craft items from recipes.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @orderAfter J-Base
 * @help
 * ============================================================================
 * OVERVIEW:
 * This plugin is the core menu system that other JAFTING menus plug into.
 * It was designed as an extensible wrapper scene for all JAFTING modes.
 *
 * NOTE ABOUT THIS PLUGIN:
 * This is a base plugin that offers no actual crafting functionality itself.
 * It offers instead a root "JAFTING" menu that the other extensions will
 * connect to for singular JAFTING access. Chances are, if you are using
 * this plugin, you probably also want to grab the "Creation" extension and/or
 * the "Refinement" extension and place them below this one.
 * ============================================================================
 * ORGANIZATION:
 * Have you ever wanted to a menu that is has a single purpose, such as grant
 * access to all the other crafting menus built to work with JAFTING? Well now
 * you can! Just drop this plugin above your other installed JAFTING extension
 * plugins, and voila! It works.
 *
 * NOTE ABOUT THIS PLUGIN:
 * It isn't really necessary. It is literally just a wrapper scene and menu
 * that unifies access to all JAFTING scenes. You could also just directly
 * call the other JAFTING scenes directly if you preferred.
 * ============================================================================
 * CHANGELOG:
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
 */