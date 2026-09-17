//region Sprite_SpentBubbleLayer
import BubbleConversation from '../services/BubbleConversation.js';
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

    /**
     * The bubbles still on this plane but on their way off it.
     * @type {FadingSprites}
     */
    this._j._departing = new FadingSprites();
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
   * The bubbles on their way off this plane.
   * @returns {FadingSprites}
   */
  departingBubbles()
  {
    return this._j._departing;
  }

  /**
   * Extend the update to keep this plane agreeing with the conversation.
   */
  update()
  {
    this.syncSpentBubbles();
    this.updateDepartingBubbles();
    this.releaseFinishedConversation();

    // perform original logic, which is what ticks each bubble into position over its owner.
    super.update();
  }

  /**
   * Lets go of everyone's last line once the conversation they were having is over.
   *
   * **Asked here rather than from the scene, and the ordering is the whole reason.** This plane is
   * added during `createSpriteset`, so it updates before the window layer does - which means the
   * frame a final message terminates, this plane has already compared itself against the manager and
   * the bubble that message left behind does not exist yet. A release decided anywhere later in that
   * same frame would delete the entry before it was ever drawn, and a bubble that was never built
   * cannot depart: the last line of every conversation would blink out instead of fading.
   *
   * Deciding it here means a retained bubble is always realized by the sync above before this can
   * take it away, so it leaves the way every other bubble does.
   */
  releaseFinishedConversation()
  {
    const isHoldingBubbles = SpentBubbleManager.isEmpty() === false;
    const isEventRunning = $gameMap.isEventRunning();
    const isMessageBusy = $gameMessage.isBusy();

    const shouldRelease = BubbleConversation.shouldRelease(isHoldingBubbles, isEventRunning, isMessageBusy);
    if (shouldRelease === false) return;

    SpentBubbleManager.clear();
  }

  /**
   * Fades out whatever is leaving, and takes it off the plane once it has.
   */
  updateDepartingBubbles()
  {
    const finished = this.departingBubbles()
      .update(MessageFade.alphaAt);

    finished.forEach(({ sprite }) => this.removeChild(sprite));
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

      // handed over rather than removed. A conversation ending is the most visible disappearance in
      // the whole system - several bubbles at once - and it is the one worth not being abrupt about.
      this.departingBubbles()
        .begin(token, sprite, MessageFade.frames());

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

    // somebody who started talking again mid-departure. The bubble on its way out is showing the
    // line before this one, so it goes rather than being caught and reused.
    const interrupted = this.departingBubbles()
      .take(token);

    if (interrupted !== null)
    {
      this.removeChild(interrupted);
    }

    const sprite = new Sprite_SpentBubble(token, entry);

    this.bubbles()
      .set(token, sprite);
    this.addChild(sprite);
  }
}

export default Sprite_SpentBubbleLayer;
//endregion Sprite_SpentBubbleLayer