//region Sprite_SpentBubbleLayer
import SpentBubbleManager from '../managers/SpentBubbleManager.js';
import Sprite_SpentBubble from './Sprite_SpentBubble.js';

/**
 * The plane everyone who has already spoken is still sitting on.
 *
 * It owns no state of its own. Every frame it compares what it is showing against what the manager
 * is holding and makes the two agree - a speaker the manager has gained gets a bubble, one it has
 * lost has theirs taken away. That is what makes ending a conversation a single `clear()` somewhere
 * else rather than a cleanup routine that has to find and dismantle things.
 *
 * It lives on the scene rather than inside the spriteset on purpose. `Spriteset_Base.updatePosition`
 * applies the screen's shake and zoom to everything under it, and `screenX` does not include either
 * - so a spent bubble in there would drift away from the live message beside it the moment anything
 * shook the screen, which is precisely when a conversation is most likely to be happening.
 */
class Sprite_SpentBubbleLayer
  extends Sprite
{
  /**
   * Extend initialization to establish an empty plane.
   */
  initialize()
  {
    // perform original logic.
    super.initialize();

    this.initMembers();
  }

  /**
   * Initialize all properties of this class.
   */
  initMembers()
  {
    /**
     * The shared root namespace for all of J's plugin data.
     */
    this._j ||= {};

    /**
     * The bubbles currently on this plane, by the target each one belongs to.
     * @type {Map<string, Sprite_SpentBubble>}
     */
    this._j._bubbles = new Map();
  }

  /**
   * The bubbles currently on this plane.
   * @returns {Map<string, Sprite_SpentBubble>}
   */
  bubbles()
  {
    return this._j._bubbles;
  }

  /**
   * Extend the update to keep this plane agreeing with the conversation.
   */
  update()
  {
    this.syncSpentBubbles();

    // perform original logic, which is what ticks each bubble into position over its owner.
    super.update();
  }

  /**
   * Adds and removes bubbles until this plane shows exactly who the manager says has spoken.
   */
  syncSpentBubbles()
  {
    const retained = SpentBubbleManager.entries();

    this.removeDepartedBubbles(retained);

    retained.forEach(({ token, entry }) => this.addMissingBubble(token, entry));
  }

  /**
   * Takes away the bubbles of anyone no longer part of the conversation.
   * @param {Array<{token: string, entry: object}>} retained Everyone the manager is still holding.
   */
  removeDepartedBubbles(retained)
  {
    const stillSpeaking = retained.map(({ token }) => token);
    const drawn = [ ...this.bubbles()
      .keys() ];

    // collected before anything is removed, because removing from a map while walking it is the
    // kind of thing that works until the day two speakers leave at once.
    const departed = drawn.filter(token => stillSpeaking.includes(token) === false);

    departed.forEach(token =>
    {
      const sprite = this.bubbles()
        .get(token);

      this.removeChild(sprite);
      this.bubbles()
        .delete(token);
    });
  }

  /**
   * Gives a speaker a bubble if they do not already have one on this plane.
   * @param {string} token The target the message named.
   * @param {object} entry Everything that message left behind.
   */
  addMissingBubble(token, entry)
  {
    const existing = this.bubbles()
      .get(token);

    // already drawn, and its own update is what keeps it over its owner.
    if (existing !== undefined) return;

    const sprite = new Sprite_SpentBubble(token, entry);

    this.bubbles()
      .set(token, sprite);
    this.addChild(sprite);
  }
}

export default Sprite_SpentBubbleLayer;
//endregion Sprite_SpentBubbleLayer