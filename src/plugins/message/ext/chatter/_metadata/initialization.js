//region initialization
import J_MessageChatterPluginMetadata from './_pluginMetadata.js';

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
  const requiredMessageVersion = '1.3.1';
  const hasMessageRequirement = J.BASE.Helpers.satisfies(J.MESSAGE.Metadata.version.version(), requiredMessageVersion);
  if (hasMessageRequirement === false)
  {
    throw new Error(`Either missing J-Message or has a lower version than the required: ${requiredMessageVersion}`);
  }

  // check to ensure we have the minimum required version of the J-Message-Bubbles plugin.
  const requiredBubblesVersion = '1.0.0';
  const bubblesVersion = J.MESSAGE.EXT.BUBBLES.Metadata.version.version();
  const hasBubblesRequirement = J.BASE.Helpers.satisfies(bubblesVersion, requiredBubblesVersion);
  if (hasBubblesRequirement === false)
  {
    throw new Error(`Either missing J-Message-Bubbles or has a lower version than the required: ${requiredBubblesVersion}`);
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
J.MESSAGE.EXT.CHATTER = {};

/**
 * The metadata associated with this plugin.
 */
J.MESSAGE.EXT.CHATTER.Metadata = new J_MessageChatterPluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.MESSAGE.EXT.CHATTER.Aliased = {};
J.MESSAGE.EXT.CHATTER.Aliased.Game_Event = new Map();
J.MESSAGE.EXT.CHATTER.Aliased.Game_Map = new Map();
J.MESSAGE.EXT.CHATTER.Aliased.Scene_Map = new Map();
J.MESSAGE.EXT.CHATTER.Aliased.Window_Message = new Map();

/**
 * All regular expressions used by this plugin.
 */
J.MESSAGE.EXT.CHATTER.RegExp = {};

/**
 * One line this character may say to themselves, unprompted.
 *
 * <pre>
 * Structure:
 *  <chatter:LINE>
 *
 * Example:
 *  <chatter:Anything I can get you? Half price today.>
 *
 * Translation:
 *  this character may mutter "Anything I can get you? Half price today." as the player passes.
 * </pre>
 *
 * This is the one tag on the page that may appear more than once: every one of them is a line in
 * the same character's pool, and the picker chooses between them. The capture is anything that is
 * not a closing angle bracket, because the value is prose rather than a parameter list - a line
 * carrying a comma or a bracket is ordinary writing, not a second argument.
 * @type {RegExp}
 */
J.MESSAGE.EXT.CHATTER.RegExp.Chatter = /<chatter: ?([^>]+)>/i;

/**
 * How far away this character can still be heard, in tiles.
 *
 * <pre>
 * Structure:
 *  <chatterRadius:TILES>
 *
 * Example:
 *  <chatterRadius:5>
 *
 * Translation:
 *  this character chatters while the player is within five tiles of them.
 * </pre>
 * @type {RegExp}
 */
J.MESSAGE.EXT.CHATTER.RegExp.ChatterRadius = /<chatterRadius: ?(\d+)>/i;

/**
 * How long this character rests after a line before they may say another, in frames.
 *
 * <pre>
 * Structure:
 *  <chatterCooldown:FRAMES>
 *
 * Example:
 *  <chatterCooldown:600>
 *
 * Translation:
 *  this character says nothing for ten seconds after finishing a line.
 * </pre>
 * @type {RegExp}
 */
J.MESSAGE.EXT.CHATTER.RegExp.ChatterCooldown = /<chatterCooldown: ?(\d+)>/i;

/**
 * The longest this character waits before speaking once they are able to, in frames.
 *
 * <pre>
 * Structure:
 *  <chatterDelay:FRAMES>
 *
 * Example:
 *  <chatterDelay:300>
 *
 * Translation:
 *  this character waits somewhere between zero and five seconds before speaking.
 * </pre>
 *
 * The actual wait is rolled somewhere in that range rather than being the number written, which is
 * what keeps a row of shopkeepers from all speaking on the same frame forever.
 * @type {RegExp}
 */
J.MESSAGE.EXT.CHATTER.RegExp.ChatterDelay = /<chatterDelay: ?(\d+)>/i;

/**
 * How long a finished line stays on screen, in frames.
 *
 * <pre>
 * Structure:
 *  <chatterDuration:FRAMES>
 *
 * Example:
 *  <chatterDuration:180>
 *
 * Translation:
 *  this character's lines linger for three seconds after they finish typing out.
 * </pre>
 * @type {RegExp}
 */
J.MESSAGE.EXT.CHATTER.RegExp.ChatterDuration = /<chatterDuration: ?(\d+)>/i;

/**
 * How quickly this character's lines type out, in frames per character.
 *
 * <pre>
 * Structure:
 *  <chatterSpeed:FRAMES>
 *
 * Example:
 *  <chatterSpeed:2>
 *
 * Translation:
 *  a new character of this line appears every two frames.
 * </pre>
 * @type {RegExp}
 */
J.MESSAGE.EXT.CHATTER.RegExp.ChatterSpeed = /<chatterSpeed: ?(\d+)>/i;

/**
 * Which side of this character their chatter sits on.
 *
 * <pre>
 * Structure:
 *  <chatterPosition:WHERE>
 *
 * Example:
 *  <chatterPosition:top>
 *
 * Translation:
 *  this character's chatter floats above their head.
 * </pre>
 *
 * The three words mean what the Show Text command's Position dropdown means to a bubble, so an
 * author who has placed a conversation already knows what they do.
 * @type {RegExp}
 */
J.MESSAGE.EXT.CHATTER.RegExp.ChatterPosition = /<chatterPosition: ?(top|middle|bottom)>/i;
//endregion initialization