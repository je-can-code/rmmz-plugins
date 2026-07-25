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
  Game_Follower: new Map(),
  Game_Map: new Map(),
  Game_Player: new Map(),
  Spriteset_Map: new Map(),
};

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