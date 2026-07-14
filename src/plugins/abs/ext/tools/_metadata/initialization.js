//region Introduction
import J_ToolsPluginMetadata from './_pluginMetadata.js';

globalThis.J ||= {};

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
  const requiredJabsVersion = '4.6.0';
  const hasJabsRequirement = J.BASE.Helpers.satisfies(J.ABS.Metadata.version.version(), requiredJabsVersion);
  if (!hasJabsRequirement)
  {
    throw new Error(`Either missing J-ABS or has a lower version than the required: ${requiredJabsVersion}`);
  }
})();
//endregion version check

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.ABS.EXT.TOOLS = {};

/**
 * The metadata associated with this plugin.
 */
J.ABS.EXT.TOOLS.Metadata = new J_ToolsPluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.ABS.EXT.TOOLS.Aliased = {
  Game_Character: new Map(),
  Game_CharacterBase: new Map(),
  Game_Event: new Map(),
  Game_Follower: new Map(),
  Game_Player: new Map(),
  Game_System: new Map(),
  JABS_Engine: new Map(),
  JABS_Battler: new Map(),
};

/**
 * All regular expressions used by this plugin.
 */
J.ABS.EXT.TOOLS.RegExp = {
  GapClose: /<gapClose:(\w+)>/i,
  GapCloseAny: /<gapCloseAny>/i,
  GapCloseTarget: /<gapCloseTarget:(\w+)>/i,
  GapCloseMode: /<gapCloseMode:(blink|jump|travel)>/i,
  GapClosePosition: /<gapClosePosition:(infront|behind|same)>/i,
  GapCloseEndThis: /<thisOnGapCloseEnd:[ ]?(\[[\d, ]+])>/i,
  GapCloseEnd: /<onGapCloseEnd:[ ]?(\[[\d, ]+])>/i,
  BlockGapClose: /<blockGapClose>/i,
  RespectTerrain: /<respectTerrain>/i,
  PullForward: /<pullForward:[ ]?(\d+)>/i,
};

/**
 * All types of gap close modes that are available to pick from.
 * The mode is the means of which the battler will travel the to the destination.
 * All modes bypass terrain.
 * If they should not bypass terrain, consider eventing instead.
 */
J.ABS.EXT.TOOLS.GapCloseModes = {
  /**
   * Blinks instantly to the target.
   */
  Blink: "blink",

  /**
   * Jumps to the target.
   */
  Jump: "jump",

  /**
   * Glides to the target- same destination as a jump, but renders as a flat ground-level
   * slide instead of a parabolic hop.
   */
  Travel: "travel",
};

/**
 * All types of gap close positions that are available to pick from.
 * The position is ultimately the destination, defined as where the battler
 * should end up when they are done gap closing.
 */
J.ABS.EXT.TOOLS.GapClosePositions = {
  /**
   * Infront translates to being on the same side of the target as the gap-closing
   * battler was when they started the gap closing process, and does not consider the
   * facing of the target battler considering that can change wildly.
   */
  Infront: "infront",

  /**
   * Behind translates to being on the opposite side of the target as the gap-closing
   * battler was when they started the gap closing process, and does not consider the
   * facing of the target battler considering that can change wildly.
   */
  Behind: "behind",

  /**
   * Same translates to arriving at the same coordinates as the target is, meaning the
   * gap-closing battler will be ontop of the target.
   */
  Same: "same",
};
//endregion Introduction