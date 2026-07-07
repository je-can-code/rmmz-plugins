//region annotations
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] An extension for JABS that adds cursor-driven tactical targeting.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-ABS
 * @base J-ABS-InputManager
 * @orderAfter J-Base
 * @orderAfter J-ABS
 * @orderAfter J-ABS-InputManager
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin adds a cursor-driven target-selection mode to JABS. Skills
 * flagged for targeting pause combat (reusing the same soft-pause the JABS
 * quick menu already uses) and let the player aim a reticle at allies or
 * enemies, scoped per skill, before the action fires.
 *
 * Integrates with others of mine plugins:
 * - J-Base; to be honest this is just required for all my plugins.
 * - J-ABS; this is an extension of the core JABS engine.
 * - J-ABS-InputManager; needed so the cursor recognizes d-pad input the same way the standard
 *   controller's own menu windows do (its custom d-pad symbols aren't visible to the vanilla
 *   `Input.dir8` accessor).
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * TODO: flesh out once the targeting mode's shape is finalized.
 *
 * ============================================================================
 * TAG USAGE:
 * - Skills
 *
 * TAG FORMAT:
 *  <targeted>
 *    Marks a skill as requiring the tactical targeting UX instead of firing
 *    immediately.
 *
 * TAG EXAMPLES:
 *  <targeted>
 * This skill will pause combat and prompt for a target before executing.
 * ============================================================================
 * CHANGELOG:
 * - 1.0.0
 *    The initial release.
 * ============================================================================
 *
 * @param reticleImage
 * @text Reticle Image
 * @type file
 * @dir img/system
 * @desc The image shown as the aiming reticle. Defaults to the stock RMMZ window-scroll arrow.
 * @default WindowArrow
 *
 * @param targetingListWindowX
 * @text List Window X
 * @type number
 * @min 0
 * @desc The screen X of the cycle-select list window.
 * @default 576
 *
 * @param targetingListWindowY
 * @text List Window Y
 * @type number
 * @min 0
 * @desc The screen Y of the cycle-select list window.
 * @default 186
 */
//endregion annotations
