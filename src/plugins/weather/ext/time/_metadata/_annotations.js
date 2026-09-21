//region annotations
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] A sky that changes with the clock, forecast a year ahead.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-Weather
 * @base J-TIME
 * @orderAfter J-Base
 * @orderAfter J-Weather
 * @orderAfter J-TIME
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin makes the weather a thing that happens rather than a property a
 * map owns.
 *
 * J-Weather draws what a place looks like. J-TIME knows what hour it is. This
 * is the piece in between: it decides what the sky over the whole island is
 * doing right now, rolls that decision a year into the future so it can be
 * read, and hands the answer to J-Weather to draw.
 *
 * Integrates with others of mine plugins:
 * - J-Base; to be honest this is just required for all my plugins.
 * - J-Weather; this is an extension of it.
 * - J-TIME; this is where the calendar comes from.
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * The sky holds a CONDITION and a STRENGTH, and the two move separately.
 *
 * The condition steps through a transition graph belonging to the current
 * season, so a day reads as a sequence rather than as dice: overcast eases
 * into light rain, rain eases back off into overcast, and overcast clears.
 * Seasons hard-gate which conditions are even possible, which is why it never
 * snows in summer and why sakura is a spring thing.
 *
 * The strength takes a single step up or down a three-rung ladder - light,
 * moderate, heavy - and never jumps. A type may narrow that ladder for
 * itself: a monsoon is heavy or it is not a monsoon.
 *
 * ----------------------------------------------------------------------------
 * CONDITIONS AND FACES:
 * A condition is a state the sky is IN. A face is the preset it is DRAWN with,
 * chosen by season and hour.
 *
 * A clear summer afternoon and a clear winter afternoon are the same state and
 * completely different pictures - one is a heat shimmer and the other is ice
 * hanging in still air. Rather than make those separate conditions and author
 * every edge into and out of "clear" twice over, they are faces of one.
 *
 * This is also the only way some looks ever appear at all. Fireflies are the
 * face of a clear summer night; a field of stars is the face of any other
 * clear night.
 *
 * ----------------------------------------------------------------------------
 * SETTLING DAYS:
 * On the last day of a season the sky stops rolling and starts steering: each
 * phase takes whichever step gets it closest to clear.
 *
 * That gives a season handover a whole day to happen in, so the incoming
 * season starts from somewhere neutral and can bias away from it. Without it,
 * the last phase of autumn could be a monsoon and the first phase of winter a
 * blizzard, with nothing in between.
 *
 * Note that seasons do NOT sit on calendar quarters - winter is months 12, 1
 * and 2 - so the settling days are the last day of months 2, 5, 8 and 11.
 *
 * ----------------------------------------------------------------------------
 * CLIMATES:
 * A place may answer the sky rather than follow it.
 *
 *   <climate:NAME>
 *
 * on a map's note box bends the sky's strength through a named table before it
 * is drawn. The one this ships for is the Forest of Dreams, which is foggiest
 * when the sky is CLEAREST - something no amount of tuning the sky itself can
 * express, because it is a statement about somewhere in particular.
 *
 * A climate only bends a look the map already authored with `<weather:...>`.
 * A map with no weather of its own simply follows the sky.
 *
 * ----------------------------------------------------------------------------
 * EVENT PAGES:
 * A page may require the weather to be something, using comment commands in
 * the same style as J-TIME's:
 *
 *   <weatherTypePage:rain>
 *   <weatherIntensityPage:heavy>
 *   <weatherIntensityRangePage:moderate-heavy>
 *
 * These match what is ACTUALLY ON SCREEN - the resolved preset - rather than
 * the sky's condition. So a creature that comes out on clear summer nights is
 * tagged `fireflies`, because fireflies are what a clear summer night looks
 * like where the player is standing.
 *
 * Both names and numbers are accepted, matching `presetIds` and
 * `intensityIds` in the weather config.
 *
 * ============================================================================
 * CONFIGURATION:
 * The sky lives in the `sky` and `climates` blocks of
 * `data/config.weather.json` - the same file as the presets it names, so a
 * face pointing at a preset that does not exist can be caught by reading.
 *
 *  sky.types              every condition, its preset, and its faces
 *  sky.seasons            which conditions each season permits, and the graph
 *  sky.intensityDrift     how much the strength wants to hold, rise or fall
 *  sky.settleTo           the condition a season handover steers toward
 *  sky.forecastPhases     how far ahead the forecast is rolled
 *  sky.visibleDays        how much of it the forecast scene shows at once
 *  climates.<name>        how one kind of place bends the sky
 *
 * ----------------------------------------------------------------------------
 * THE DIAGNOSTIC FORECAST:
 * A developer screen, behind a plugin command and deliberately NOT in the
 * player's menu. One day at a time, paged left and right; the top row is the
 * sky over Erocia and every row beneath it is a named destination, with the
 * exact preset and strength each would draw, per phase.
 *
 * It exists to answer "is this weather that" - to check what is on screen
 * against what the sky rolled, and to see a climate inverting or a map tag
 * overriding without having to walk there.
 *
 * It is not what a player sees, for two reasons. The weather is reported from
 * Raevula, which is the only town left on Erocia - a player has no way to
 * check the sky over somewhere they are not. And a menu listing the Negative
 * Peaks and the Forest of Dreams tells them those places exist before they
 * have found them.
 *
 * Destinations are listed in `sky.places` as a name and a map id. The screen
 * reads that map's own note and runs it through the same resolver the game
 * uses on arrival, so nothing is restated and the two cannot disagree.
 *
 * ============================================================================
 * CHANGELOG:
 * - 1.0.0
 *    The initial release.
 * ============================================================================
 *
 * @command showDebugForecast
 * @text Show The Diagnostic Forecast
 * @desc Opens the developer forecast: every destination, exact preset and strength, per phase.
 *
 *
 * @command refreshForecastPlaces
 * @text Re-read Forecast Maps
 * @desc Forgets every destination's map note so it is read again. For development.
 */
//endregion annotations