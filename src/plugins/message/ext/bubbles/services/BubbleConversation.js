//region BubbleConversation
/**
 * When a conversation is over, and everyone's last line can stop hanging in the air.
 *
 * A bubble outliving the message that drew it is the entire point of a spent bubble: two characters
 * trading lines should both be readable, and a player who blinked should not have missed half of an
 * exchange. That only works while somebody is still talking. Once nobody is, the last thing anybody
 * said is a speech bubble sitting over an empty map.
 *
 * The boundary is **the player getting control back**, which is a state transition rather than a
 * guess at one. It costs a scene nothing: an event pacing its characters around between lines is
 * still running, so the conversation it is in the middle of is still open. The frame the player can
 * move again is the frame the scene is over, and it is the same frame in every event ever written -
 * including the several thousand that were authored years before any of this existed.
 *
 * Nothing here reads the engine. The three things it judges are handed in, which is what lets the
 * whole policy be checked without a map, an event or a message.
 */
class BubbleConversation
{
  /**
   * Whether everyone's last line should be let go of.
   * @param {boolean} isHoldingBubbles Whether anybody has spoken yet in this conversation.
   * @param {boolean} isEventRunning Whether an event is currently running on the map.
   * @param {boolean} isMessageBusy Whether a message is currently being read.
   * @returns {boolean}
   */
  static shouldRelease(isHoldingBubbles, isEventRunning, isMessageBusy)
  {
    // nobody has spoken, so there is no conversation to end. The ordinary state of the map.
    if (isHoldingBubbles === false) return false;

    // whoever started this is still running it, which includes every pause, movement and wait they
    // put between two lines.
    if (isEventRunning === true) return false;

    // a message with no event behind it - a parallel process, or a command a script ran - is still
    // being read, and the player does not have control back until it closes.
    if (isMessageBusy === true) return false;

    return true;
  }
}

export default BubbleConversation;
//endregion BubbleConversation