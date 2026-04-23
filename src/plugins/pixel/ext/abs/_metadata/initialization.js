//region initialization
/**
 * The core where all of my extensions live: in the `J` object.
 */
var J = J || {};

//region metadata
/**
 * The plugin umbrella that governs all things related to this plugin.
 * Nested under J.PIXEL.EXT to follow the extension convention:
 * J.PIXEL owns this namespace; ABS is the consuming context.
 */
J.PIXEL.EXT ||= {};

/**
 * The extension namespace for J-ABS-Pixelistics.
 * Sentinel: check `J.PIXEL.EXT.ABS` to detect whether this plugin is loaded.
 */
J.PIXEL.EXT.ABS = {};

/**
 * The metadata associated with this plugin.
 */
J.PIXEL.EXT.ABS.Metadata = new JAbsPixelistics_PluginMetadata('J-ABS-Pixelistics', '1.0.1');

/**
 * A collection of all aliased methods for this plugin.
 */
J.PIXEL.EXT.ABS.Aliased = {
  Game_Player: new Map(),
  JABS_AiManager: new Map(),
  JABS_Battler: new Map(),
};
//endregion metadata
//endregion initialization
