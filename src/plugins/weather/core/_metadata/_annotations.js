//region annotations
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Named ambience and weather, declared per map.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @orderAfter J-Base
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin draws the ambience of a place: rain, drifting snow, leaves on
 * the wind, embers over a lava flow, motes of light in a dark passage.
 *
 * None of those are separate features. Every one is the same emitter carrying
 * a different picture along a different path, which is why adding a new look
 * is a data edit rather than a code change.
 *
 * Integrates with others of my plugins:
 * - J-Base; to be honest this is just required for all my plugins.
 * - J-Weather-Time; lets the sky change over the course of a day.
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * A map's weather is a property of THAT MAP. It is resolved fresh on arrival
 * and never carries in from wherever the player came from.
 *
 * That matters more than it sounds. Weather that carried across a transfer
 * would make a connecting corridor look different depending on which end you
 * walked in from, and every room next to an unusual one would have to re-assert
 * normality on the way out. Resolving per map means neither is ever a problem.
 *
 * ============================================================================
 * DECLARING A MAP'S WEATHER:
 * Add to a MAP's note box:
 *
 * TAG FORMAT:
 *  <weather:PRESET>
 *
 * TAG EXAMPLES:
 *  <weather:rain>
 *   This place is rainy.
 *
 *  <weather:motes>
 *   Faint drifting lights, as in a deep passage.
 *
 * The preset names an entry in data/config.weather.json. It says nothing about
 * how hard it is coming down, because that is not a property of the place- the
 * Deluge Plains are rainy at every hour of every day, and only the amount
 * moves. That belongs to the sky, and the sky belongs to J-Weather-Time.
 *
 * On a map with no sky overhead, an authored look still draws- a cave full of
 * drifting motes is not weatherless- and simply sits at its middle strength.
 *
 * ----------------------------------------------------------------------------
 * WHAT A MAP WITH NO TAG DOES:
 * It asks the sky.
 *
 * An outdoor map that says nothing gets whatever the weather currently is,
 * which is what stops a connecting corridor between two rainy fields being the
 * one dry spot in the region. An indoor map that says nothing gets nothing,
 * because there is no sky for it to ask.
 *
 * Indoor and outdoor is read from <noToneChange>, the same tag J-TIME already
 * uses to keep a cave from changing colour at dusk. "Can you see the sky from
 * here" is one question, and asking it twice would eventually get two answers.
 *
 * ============================================================================
 * OPTING OUT ENTIRELY:
 * Add to a MAP's note box:
 *
 * TAG FORMAT:
 *  <noWeather>
 *
 * Nothing falls here, whatever the sky is doing.
 *
 * This is deliberately rare. An ordinary interior already draws nothing without
 * being told, so it needs no tag at all. This exists for the narrower case of
 * somewhere that genuinely has sky overhead and still should not be rained on:
 * a covered market, a colonnade, a courtyard under a canopy.
 *
 * It outranks everything, including a <weather:> tag on the same map.
 * ============================================================================
 * CHANGELOG:
 * - 1.0.0
 *    The initial release.
 * ============================================================================
 */
//endregion annotations