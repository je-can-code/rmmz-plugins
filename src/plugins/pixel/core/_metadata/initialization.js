//region initialization
import JPixelistics_PluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};

//region metadata
/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.PIXEL = {};

/**
 * The parent namespace for all J-Pixelistics extensions.
 */
J.PIXEL.EXT ||= {};

/**
 * The metadata associated with this plugin.
 */
J.PIXEL.Metadata = new JPixelistics_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.PIXEL.Aliased = {
  Game_Character: new Map(),
  Game_CharacterBase: new Map(),
  Game_Event: new Map(),
  Game_Follower: new Map(),
  Game_Interpreter: new Map(),
  Game_Map: new Map(),
  Game_Player: new Map(),
  Spriteset_Map: new Map(),
};

/**
 * All regular expressions used by this plugin.
 */
J.PIXEL.RegExp = {};

/**
 * The area an event's page covers: a rectangle of whole tiles whose top-left corner is the tile the
 * event itself stands on. Both sizes must be at least one, since an event always covers its own tile;
 * anything else does not match, and the page covers that one tile.
 *
 * <pre>
 * Structure:
 *  <areaEvent:[WIDTH, HEIGHT]>
 *
 * Example:
 *  <areaEvent:[5, 1]>
 *
 * Translation:
 *  This page covers the event's own tile and the four to the right of it.
 * </pre>
 * @type {RegExp}
 */
J.PIXEL.RegExp.AreaEvent = /<areaEvent:[ ]?(\[[ ]?[1-9]\d*[ ]?,[ ]?[1-9]\d*[ ]?])>/i;

/**
 * A transfer from this page lands as far along its destination as the player stood along the page's
 * area, measured from the event's own tile.
 *
 * <pre>
 * Structure:
 *  <relativeTransfer>
 *
 * Example:
 *  <areaEvent:[20, 1]>
 *  <relativeTransfer>
 *
 * Translation:
 *  Crossing this 20-tile edge eight tiles from the event lands the player eight tiles to the right of
 *  where its Transfer Player points.
 * </pre>
 * @type {RegExp}
 */
J.PIXEL.RegExp.RelativeTransfer = /<relativeTransfer>/i;

/**
 * Directional constants matching RMMZ engine conventions.
 * Defined here so the pixel core does not depend on J-ABS for basic direction numerics.
 */
J.PIXEL.Directions = {
  DOWN: 2,
  LEFT: 4,
  RIGHT: 6,
  UP: 8,
  LOWERLEFT: 1,
  LOWERRIGHT: 3,
  UPPERLEFT: 7,
  UPPERRIGHT: 9,
};
//endregion metadata
//endregion initialization