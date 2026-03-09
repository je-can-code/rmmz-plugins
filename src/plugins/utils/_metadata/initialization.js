/**
 * The core where all of my extensions live: in the `J` object.
 */
var J = J || {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.UTILS = {};

/**
 * The metadata associated with this plugin, such as name and version.
 */
J.UTILS.Metadata = new J_UtilsPluginMetadata('J-SystemUtilities', '1.1.2');

/**
 * A collection of all aliased methods for this plugin.
 */
J.UTILS.Aliased = {
  DataManager: new Map(),
  Game_Actor: new Map(),
  Game_Temp: new Map(),
  Input: new Map(),
  Scene_Base: new Map(),
  Scene_Boot: new Map(),
  Scene_Map: new Map(),
};

/**
 * A collection of all helper functions that don't need to live anywhere specific.
 */
J.UTILS.Helpers = {};

/**
 * Checks recursively how deep an object goes.
 *
 * This was used once to help troubleshoot where I accidentally created an infinitely nested
 * save object. I used this function to check each of the chunks of data in the save file to
 * see which was the one that was infinitely deep.
 * @param {any} o The object to check.
 * @returns {number} Chances are if this returns a number you're fine, otherwise it'll hang.
 */
/* eslint-disable indent */
J.UTILS.Helpers.depth = (o) => Object(o) === o
  ? 1 + Math.max(
  -1,
  ...Object.values(o)
    .map(J.UTILS.Helpers.depth)
)
  : 0;
/* eslint-enable indent */

//region gamepad logging
// create the lightweight gamepad logging namespace.
J.UTILS.GamepadLog ||= {};

// whether or not logging is enabled (opt-in).
J.UTILS.GamepadLog.enabled = J.UTILS.GamepadLog.enabled || false;

/**
 * Enables console logging of fresh gamepad presses.
 */
J.UTILS.GamepadLog.enable = function()
{
  // mark logging as enabled.
  this.enabled = true;

  // inform the console that logging is now active.
  console.log('[InputLog] Enabled.');
};

/**
 * Disables console logging of fresh gamepad presses.
 */
J.UTILS.GamepadLog.disable = function()
{
  // mark logging as disabled.
  this.enabled = false;

  // inform the console that logging is now inactive.
  console.log('[InputLog] Disabled.');
};

/**
 * Logs only newly-pressed physical inputs resolved through Input.gamepadMapper.
 * Uses centralized symbols from J.ABS.EXT.INPUT when available.
 * @param {Gamepad} pad The active gamepad instance.
 * @param {boolean[]} prev The previous button-state array (by index).
 * @param {boolean[]} next The new button-state array (by index).
 */
J.UTILS.GamepadLog.logFreshPresses = function(pad, prev, next)
{
  // do not process if disabled.
  if (this.enabled === false)
  {
    return;
  }

  // collect mapped symbols that transitioned from false -> true.
  const symbols = [];

  // iterate over the next-state buttons.
  for (let i = 0; i < next.length; i++)
  {
    // determine current and previous pressed states.
    const now = next[i] === true;
    const was = prev[i] === true;

    // only emit fresh presses.
    if (now && was === false)
    {
      // resolve the physical symbol via the centralized mapper.
      const mapped = Input.gamepadMapper[i];

      // only log if the index is mapped to a known symbol.
      if (mapped)
      {
        // add the resolved symbol to the list.
        symbols.push(mapped);
      }
    }
  }

  // skip logging when there are no fresh presses.
  if (symbols.length === 0)
  {
    return;
  }

  // build a concise pad label.
  const label = pad.id
    ? `${pad.id} (Index ${pad.index})`
    : `Gamepad ${pad.index}`;

  // emit a single consolidated log for this frame.
  console.log(`[InputLog] ${label} pressed:`, symbols.join(', '));
};
//endregion gamepad logging