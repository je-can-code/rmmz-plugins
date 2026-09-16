//region Window_Message
import ChatterManager from '../managers/ChatterManager.js';

/**
 * Extends {@link #startMessage}.<br/>
 * Also stops the character this message is being spoken by muttering to themselves.
 *
 * Only that character. Somebody the player has walked up to and started a conversation with should
 * not be talking over their own dialogue - but the shopkeeper two doors down has nothing to do with
 * it and carries on. A blanket hush on any message would empty a whole market square every time
 * anybody read a signpost.
 *
 * Before the original, because the original is what starts revealing the message; a bubble that
 * appeared and was cut on the same frame would flicker.
 */
J.MESSAGE.EXT.CHATTER.Aliased.Window_Message.set('startMessage', Window_Message.prototype.startMessage);
Window_Message.prototype.startMessage = function()
{
  this.silenceChatterTarget();

  // perform original logic.
  J.MESSAGE.EXT.CHATTER.Aliased.Window_Message.get('startMessage')
    .call(this);
};

/**
 * Hushes whoever this message is floating above, if it is floating above anybody.
 */
Window_Message.prototype.silenceChatterTarget = function()
{
  const requested = $gameMessage.bubbleTarget();

  // an ordinary message in the box at the edge of the screen names nobody, so it hushes nobody.
  if (requested === String.empty) return;

  const hostEventId = $gameMessage.bubbleHostEventId();
  const token = ChatterManager.normalizeToken(requested, hostEventId);

  ChatterManager.silence(token);
};
//endregion Window_Message