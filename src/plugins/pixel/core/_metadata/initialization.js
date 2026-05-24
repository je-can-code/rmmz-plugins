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

/**
 * A small debug container for one-frame collision sampling traces.
 * Populated by the pixel passage helpers and consumed by Sprite_PixelCollisionOverlay.
 */
J.PIXEL.Debug = {
  /**
   * Controls whether subcell samples are collected.
   * Set to true only when the collision overlay is actively visible.
   * Leave false in production to avoid per-frame object allocations in the probe loops.
   * @type {boolean}
   */
  enabled: false,

  /**
   * @type {{x:number,y:number,color:string}[]}
   */
  samples: [],

  /**
   * Queues a subcell sample to be drawn this frame by the overlay.
   * @param {number} x Fractional tile x (seam-aligned).
   * @param {number} y Fractional tile y (seam-aligned).
   * @param {string} color A rgba color string.
   */
  push(x, y, color)
  {
    if (this.enabled === false) return;

    this.samples.push({ x, y, color });
  },

  /**
   * Clears all queued samples at the end of each frame.
   */
  clear()
  {
    this.samples.length = 0;
  },
};
//endregion metadata
//endregion initialization