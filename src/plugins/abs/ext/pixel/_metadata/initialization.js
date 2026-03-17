/**
 * The core where all of my extensions live: in the `J` object.
 */
var J = J || {};

//region version checks
(() =>
{
  // Check to ensure we have the minimum required version of the J-Base plugin.
  const requiredBaseVersion = '3.0.0';
  const hasBaseRequirement = J.BASE.Helpers.satisfies(J.BASE.Metadata.Version, requiredBaseVersion);
  if (!hasBaseRequirement)
  {
    throw new Error(`Either missing J-Base or has a lower version than the required: ${requiredBaseVersion}`);
  }

  // Check to ensure we have the minimum required version of the J-ABS plugin.
  const requiredJabsVersion = '4.5.0';
  const hasJabsRequirement = J.BASE.Helpers.satisfies(J.ABS.Metadata.Version, requiredJabsVersion);
  if (!hasJabsRequirement)
  {
    throw new Error(`Either missing J-ABS or has a lower version than the required: ${requiredJabsVersion}`);
  }
})();
//endregion version check

//region metadata
/**
 * The over-arching extensions collection for JABS.
 */
J.ABS.EXT ||= {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.ABS.EXT.PIXEL = {};

/**
 * The `metadata` associated with this plugin, such as version.
 */
J.ABS.EXT.PIXEL.Metadata = {};
J.ABS.EXT.PIXEL.Metadata.Version = '1.0.0';
J.ABS.EXT.PIXEL.Metadata.Name = `J-ABS-PixelMovement`;

/**
 * The actual `plugin parameters` extracted from RMMZ.
 */
J.ABS.EXT.PIXEL.PluginParameters = PluginManager.parameters(J.ABS.EXT.PIXEL.Metadata.Name);

/**
 * A collection of all aliased methods for this plugin.
 */
J.ABS.EXT.PIXEL.Aliased = {
  Game_Character: new Map(),
  Game_CharacterBase: new Map(),
  Game_Follower: new Map(),
  Game_Map: new Map(),
  Game_Player: new Map(),

  JABS_AiManager: new Map(),

  Spriteset_Map: new Map(),
};
//endregion metadata

/**
 * A small debug container for one-frame collision sampling traces.
 */
J.ABS.EXT.PIXEL.Debug = {
  /** @type {{x:number,y:number,color:string}[]} */
  samples: [],

  /**
   * Queues a subcell sample to be drawn this frame by the overlay.
   * @param {number} x Fractional tile x (seam-aligned).
   * @param {number} y Fractional tile y (seam-aligned).
   * @param {string} color A rgba color string.
   */
  push(x, y, color)
  {
    this.samples.push({ x, y, color });
  },

  /** Clears samples at end-of-frame. */
  clear()
  {
    this.samples.length = 0;
  }
};