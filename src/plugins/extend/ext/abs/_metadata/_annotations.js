//region annotations
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] J-ABS integration for J-Extend.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-ABS
 * @base J-Extend
 * @orderAfter J-Base
 * @orderAfter J-ABS
 * @orderAfter J-Extend
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin is an extension of J-Extend for J-ABS.
 * It prevents the JABS AI from selecting skill-extension skills as actions.
 * ============================================================================
 * NOTE ABOUT NOTETAGS:
 * This plugin has no notetags of its own- it is pure integration glue
 * between J-Extend and J-ABS's AI skill-selection logic.
 * ============================================================================
 * CHANGELOG:
 * - 1.0.1
 *    The AI now recognizes an extension skill by asking whether it is one, rather
 *    than by inspecting its declared types. A skill given a type but no id list was
 *    invisible to the old test, so enemies kept selecting skills they cannot cast.
 * - 1.0.0
 *    Initial release.
 * ============================================================================
 */
//endregion annotations
