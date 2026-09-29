//region annotations
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Shows each class's natural growths in the class scene.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-Classes
 * @base J-NaturalGrowth
 * @orderAfter J-Base
 * @orderAfter J-Classes
 * @orderAfter J-NaturalGrowth
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin connects J-Classes to J-NaturalGrowth, for games whose classes
 * carry natural growth tags.
 *
 * Integrates with others of mine plugins:
 * - J-Base; to be honest this is just required for all my plugins.
 * - J-Classes; the class scene this adds to.
 * - J-NaturalGrowth; the growths this shows.
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * The class scene lists one more section for the highlighted class, beneath
 * its parameters:
 * - Growth per level: every Growth tag on the class. These are earned once
 *   for each level gained while the class is worn, and kept for good, so the
 *   class an actor levels in shapes them in every class afterwards.
 *
 * Only the class's own note is read. Each formula is worked out for the actor
 * as they would be in that class, so a formula reading their level or a
 * parameter's base shows what it would give right now.
 *
 * A class's Buff tags have no section of their own. They apply only while
 * the class is worn, so they show in the values of the parameters J-Classes
 * lists, and in their multipliers, below.
 *
 * ============================================================================
 * MULTIPLIERS:
 * A parameter with no growth curve gets its multiplier from its flat Buff
 * tag instead, measured the same way a curve is: the class's buff at level 99
 * over the buff of the class the actor started the game in. A class authored
 * as its starting class's buff times some number shows exactly that number.
 *  Starting class:  <hitBuffPlus:[1*a.level]>
 *  This class:      <hitBuffPlus:[2*a.level]>
 * This class reads Accuracy ×2.00 among its parameters.
 *
 * ============================================================================
 * CHANGELOG:
 * - 1.0.0
 *    The initial release.
 * ============================================================================
 */
//endregion annotations