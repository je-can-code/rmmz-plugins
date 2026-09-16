//region initialization
import J_MessageBubblesPluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};

//region version checks
(() =>
{
  // check to ensure we have the minimum required version of the J-Base plugin.
  const requiredBaseVersion = '3.0.0';
  const hasBaseRequirement = J.BASE.Helpers.satisfies(J.BASE.Metadata.Version, requiredBaseVersion);
  if (hasBaseRequirement === false)
  {
    throw new Error(`Either missing J-Base or has a lower version than the required: ${requiredBaseVersion}`);
  }

  // check to ensure we have the minimum required version of the J-Message plugin.
  const requiredMessageVersion = '1.3.0';
  const hasMessageRequirement = J.BASE.Helpers.satisfies(J.MESSAGE.Metadata.version.version(), requiredMessageVersion);
  if (hasMessageRequirement === false)
  {
    throw new Error(`Either missing J-Message or has a lower version than the required: ${requiredMessageVersion}`);
  }
})();
//endregion version checks

/**
 * The plugin umbrella that governs all extensions related to the message system.
 */
J.MESSAGE.EXT ||= {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.MESSAGE.EXT.BUBBLES = {};

/**
 * The metadata associated with this plugin.
 */
J.MESSAGE.EXT.BUBBLES.Metadata = new J_MessageBubblesPluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.MESSAGE.EXT.BUBBLES.Aliased = {};
J.MESSAGE.EXT.BUBBLES.Aliased.Game_Interpreter = new Map();
J.MESSAGE.EXT.BUBBLES.Aliased.Game_Message = new Map();
J.MESSAGE.EXT.BUBBLES.Aliased.Scene_Map = new Map();
J.MESSAGE.EXT.BUBBLES.Aliased.Window_Message = new Map();

/**
 * All regular expressions used by this plugin.
 */
J.MESSAGE.EXT.BUBBLES.RegExp = {};

/**
 * The text code declaring which character a message should float above.
 *
 * <pre>
 * Structure:
 *  \pop[TARGET]
 *
 * Example:
 *  \pop[a1]
 *
 * Translation:
 *  float this message above actor 1, wherever they happen to be marching.
 * </pre>
 *
 * The capture is deliberately permissive - anything that is not a closing bracket - because
 * rejecting a malformed target is the resolver's job and it does it by answering "no target",
 * which renders the message as an ordinary panel. A regex strict enough to reject the token here
 * would instead leave the code sitting in the text for the player to read.
 * @type {RegExp}
 */
J.MESSAGE.EXT.BUBBLES.RegExp.PopTarget = /\\pop\[([^\]]*)\]/i;
//endregion initialization