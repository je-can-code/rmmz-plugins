//region annotations
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Adds the Statistopedia to the Omnipedia.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-ABS
 * @base J-ABS-Metrics
 * @base J-Omnipedia
 * @orderAfter J-Base
 * @orderAfter J-ABS
 * @orderAfter J-ABS-Metrics
 * @orderAfter J-Omnipedia
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin adds the "Statistopedia" to the Omnipedia: a read-only profile of
 * how this save has actually been played. Enemies felled, damage dealt and
 * taken, how often guard was raised and how often it mattered, which weapon has
 * done the most work, and where the player keeps dying.
 *
 * Nothing here changes gameplay. It observes and it reports.
 *
 * Integrates with others of mine plugins:
 * - J-Base; to be honest this is just required for all my plugins.
 * - J-ABS; every combat moment reported here is a JABS event.
 * - J-ABS-Metrics; owns the twenty-six lifetime counters this reads.
 * - J-Omnipedia; the menu this adds a row to.
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * The numbers behind this screen live in two places on purpose.
 *
 * J-ABS-Metrics keeps twenty-six running counters in game variables, because a
 * variable is the one store an event page can branch on- which is what makes a
 * trophy or a milestone message possible with no code at all. Each of those is
 * a single number, and a single number is what a variable is good at.
 *
 * This plugin keeps a second, separate record for the questions that are not a
 * single number: kills per enemy, damage per weapon, deaths per map. There is
 * no arrangement of variables that answers those without reserving one variable
 * per row in the database, so they live in a model on the party instead.
 *
 * The two are not copies of each other. The variables hold the totals, the
 * model holds the breakdowns, and this screen reads both.
 *
 * ----------------------------------------------------------------------------
 * DERIVED VALUES:
 * Rates- crit rate, parry rate, accuracy- are computed when the screen draws
 * them, never stored. Each is a division of two counters that are both already
 * recorded, and keeping the quotient would create a third number able to fall
 * out of agreement with the two it came from.
 *
 * ============================================================================
 * CONTROLS:
 * L2 / R2 cycles between sections.
 * Cancel returns to the Omnipedia.
 * ============================================================================
 * CHANGELOG:
 * - 1.0.0
 *    Initial release.
 * ============================================================================
 */
//endregion annotations