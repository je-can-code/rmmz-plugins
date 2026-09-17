//region SpentBubbleManager
/**
 * The bubbles of everyone who has already spoken in the current conversation.
 *
 * A message window closing is not the same thing as a character being finished talking. Two people
 * trading lines should leave both bubbles on screen - the one being read bright and moving, the one
 * before it dimmed and still - because that is what a conversation looks like, and because the
 * alternative is a player who missed the first half of an exchange by blinking.
 *
 * This holds **data, never sprites.** What a spent bubble needs is a list of glyph records, a box, a
 * name and a target, all of which are plain values that outlive the window that produced them. The
 * sprites are built from that by whatever is currently on screen, which is what lets a conversation
 * survive the message window being torn down and rebuilt between every single line.
 *
 * **Keyed on the target token, not on the character it resolved to.** `\pop[a1]` is `$gamePlayer`
 * while Jerald is leading and a `Game_Follower` after a party reorder, so keying on the resolved
 * character would let one actor accumulate a bubble per marching position.
 */
class SpentBubbleManager
{
  /**
   * Everyone who has spoken so far, by the target their message named.
   * @type {Map<string, object>}
   */
  static #spent = new Map();

  /**
   * Remembers a bubble after the message that drew it has closed.
   *
   * Replaces rather than appends when the same target speaks again, which is the whole reason this
   * is a map: a character delivering four lines in a row should leave one bubble behind, not four
   * stacked in the same place.
   * @param {string} token The target the message named, verbatim.
   * @param {object} entry Everything needed to redraw the bubble without the window.
   */
  static retain(token, entry)
  {
    SpentBubbleManager.#spent.set(token, entry);
  }

  /**
   * Forgets one speaker's bubble.
   *
   * Called when that same speaker starts a new message: their old bubble is about to be replaced by
   * a live one in the same place, and two of them overlapping for the length of a line reads as a
   * rendering fault.
   * @param {string} token The target to forget.
   */
  static release(token)
  {
    SpentBubbleManager.#spent.delete(token);
  }

  /**
   * Ends the conversation.
   *
   * Reached two ways. Ordinarily the map ends it, the frame the player has control back - an event
   * still moving its characters around between lines is still running, so that boundary costs a
   * scene nothing and needs nothing written into one. An author can also end one early, mid-event,
   * for a scene that keeps going after the talking stops.
   */
  static clear()
  {
    SpentBubbleManager.#spent.clear();
  }

  /**
   * Everyone currently holding a spent bubble, with what they need to draw it.
   * @returns {Array<{token: string, entry: object}>}
   */
  static entries()
  {
    const listed = [];

    SpentBubbleManager.#spent.forEach((entry, token) =>
    {
      listed.push({
        token,
        entry,
      });
    });

    return listed;
  }

  /**
   * Whether anybody has spoken yet in the current conversation.
   * @returns {boolean}
   */
  static isEmpty()
  {
    return SpentBubbleManager.#spent.size === 0;
  }
}

export default SpentBubbleManager;
//endregion SpentBubbleManager