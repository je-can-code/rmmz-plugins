//region initialization
import JAbsPixelistics_PluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};

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
J.PIXEL.EXT.ABS.Metadata = new JAbsPixelistics_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of regex patterns for this plugin.
 */
J.PIXEL.EXT.ABS.RegExp = {};

/**
 * Optional per-enemy hitbox size override.
 * Supports either a square shorthand or explicit width/height rectangle in tiles.
 */
J.PIXEL.EXT.ABS.RegExp.HitboxSize =
  /<hitboxSize:[ ]?(\[[ ]?[+-]?\d+(?:\.\d+)?[ ]?,[ ]?[+-]?\d+(?:\.\d+)?[ ]?]|[+-]?\d+(?:\.\d+)?)>/i;

/**
 * Optional per-enemy hitbox reveal range override.
 *
 * <pre>
 * Structure:
 *  <hitboxReveal:RANGE>
 *
 * Example:
 *  <hitboxReveal:6.5>
 *
 * Translation:
 *  Reveal this battler's hitbox outline while the player is within 6.5 tiles.
 * </pre>
 * @type {RegExp}
 */
J.PIXEL.EXT.ABS.RegExp.HitboxReveal = /<hitboxReveal:[ ]?([+-]?\d+(?:\.\d+)?)>/i;

/**
 * A collection of all aliased methods for this plugin.
 */
J.PIXEL.EXT.ABS.Aliased = {
  Game_CharacterBase: new Map(),
  Game_Event: new Map(),
  Game_Player: new Map(),
  JABS_AiManager: new Map(),
  JABS_Battler: new Map(),
  JABS_Engine: new Map(),
  Spriteset_Map: new Map(),
};
//endregion metadata
//endregion initialization