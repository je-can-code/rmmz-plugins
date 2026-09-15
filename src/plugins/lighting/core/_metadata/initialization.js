//region initialization
import J_LIGHTING_PluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};

//region version checks
(() =>
{
  // check to ensure we have the minimum required version of the J-Base plugin.
  const requiredBaseVersion = '3.5.0';
  const hasBaseRequirement = J.BASE.Helpers.satisfies(J.BASE.Metadata.Version, requiredBaseVersion);
  if (hasBaseRequirement === false)
  {
    throw new Error(`Either missing J-Base or has a lower version than the required: ${requiredBaseVersion}`);
  }
})();
//endregion version checks

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.LIGHTING = {};

/**
 * The plugin umbrella that governs all extensions related to the parent.
 */
J.LIGHTING.EXT ||= {};

/**
 * The metadata associated with this plugin.
 */
J.LIGHTING.Metadata = new J_LIGHTING_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.LIGHTING.Aliased = {};
J.LIGHTING.Aliased.DataManager = new Map();
J.LIGHTING.Aliased.Game_Actor = new Map();
J.LIGHTING.Aliased.Game_Event = new Map();
J.LIGHTING.Aliased.Game_Screen = new Map();
J.LIGHTING.Aliased.Scene_Map = new Map();
J.LIGHTING.Aliased.Spriteset_Map = new Map();

/**
 * All regular expressions used by this plugin.
 */
J.LIGHTING.RegExp = {};

/**
 * How much light a map takes away, and what colour the dark it leaves behind is.
 *
 * Written on a map's note box, which is the one place a note is the correct home for a declaration:
 * a map has no pages, so it has no page comments to carry one instead.
 *
 * Darkness is a percentage rather than a colour because that is the unit an author thinks in - "this
 * room is mostly dark" - while the colour is a separate question about what sort of dark it is. A map
 * with no tag at all declares nothing and gets no mask, which is what keeps every existing map in the
 * game exactly as bright as it is today.
 *
 * <pre>
 * Structure:
 *  <ambient:[DARKNESS]>
 *  <ambient:[DARKNESS, COLOR]>
 *
 * Example:
 *  <ambient:[60]>
 *  <ambient:[85, #0a2a2a]>
 *
 * Translation:
 *  This map has 60% of its light taken away, in ordinary black.
 *  This map has 85% of its light taken away, and the dark itself is teal.
 * </pre>
 * @type {RegExp}
 */
J.LIGHTING.RegExp.Ambient = /<ambient:[ ]?(\[[\d.]+(?:,[ ]?[#\w.-]+)*])>/i;

/**
 * A source of light, given a radius in tiles and optionally a colour and a flicker.
 *
 * Written on an event page as a comment, so the light belongs to the page rather than to the event:
 * an unlit torch is a page with no tag, and lighting it is a page change. Also read from anything
 * {@link Game_Battler.getAllNotes} reaches for the party leader - an equipped lantern, a glowing
 * state, a class that sees in the dark - which is the only way the player carries a light at all.
 *
 * <pre>
 * Structure:
 *  <light:[RADIUS]>
 *  <light:[RADIUS, COLOR]>
 *  <light:[RADIUS, COLOR, flicker]>
 *
 * Example:
 *  <light:[5]>
 *  <light:[4, #ffbb73]>
 *  <light:[6, #ffbb73, flicker]>
 *
 * Translation:
 *  A plain white light reaching five tiles.
 *  A warm incandescent light reaching four tiles.
 *  The same warm light, reaching six tiles and guttering like a flame.
 * </pre>
 * @type {RegExp}
 */
J.LIGHTING.RegExp.Light = /<light:[ ]?(\[[\d.]+(?:,[ ]?[#\w.-]+)*])>/i;
//endregion initialization