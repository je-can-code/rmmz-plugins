//region initialization
/**
 * The core where all of my extensions live: in the `J` object.
 */
var J = J || {};

//region metadata
/**
 * The plugin umbrella that governs all things related to this plugin.
 * Nested under J.ABS.EXT to follow the extension convention.
 */
J.ABS.EXT ||= {};

/**
 * The extension namespace for J-ABS-Pixelistics.
 */
J.ABS.EXT.PIXEL = {};

/**
 * The metadata associated with this plugin.
 * Stored under J.PIXEL.EXT so this extension is discoverable from the pixel side as well.
 */
J.PIXEL.EXT.ABS = {};

/**
 * A collection of all aliased methods for this plugin.
 */
J.ABS.EXT.PIXEL.Aliased = {
  Game_Event: new Map(),
  JABS_AiManager: new Map(),
  JABS_Battler: new Map(),
};
//endregion metadata
//endregion initialization
