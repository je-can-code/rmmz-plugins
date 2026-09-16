//region Sprite_ChatterBubbleLayer
import ChatterManager from '../managers/ChatterManager.js';
import Sprite_ChatterBubble from './Sprite_ChatterBubble.js';
import Window_ChatterLayout from '../windows/Window_ChatterLayout.js';

/**
 * The plane everybody currently muttering to themselves is standing on.
 *
 * It owns no state of its own beyond the measuring window. Every frame it compares what it is
 * showing against the lines the manager says are being said, and makes the two agree - somebody who
 * has started speaking gets a bubble, somebody who has finished loses theirs. Cutting a line short
 * is therefore something the manager does to a record, with nothing here needing to be told.
 *
 * It sits on the scene beside the spent-bubble plane rather than inside the spriteset, for the same
 * reason that one does: `Spriteset_Base.updatePosition` applies the screen's shake and zoom to
 * everything beneath it while `screenX` includes neither, so chatter in there would drift away from
 * the character it belongs to the moment anything shook the screen.
 */
class Sprite_ChatterBubbleLayer
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
     * The bubbles currently on this plane, by the token each one belongs to.
     * @type {Map<string, Sprite_ChatterBubble>}
     */
    this._j._bubbles = new Map();

    /**
     * The window every chatter line is laid out against.
     *
     * Built on demand rather than here, because a project may well go a whole session without an
     * NPC saying anything, and building one costs a bitmap and a windowskin.
     * @type {?Window_ChatterLayout}
     */
    this._j._layoutWindow = null;
  }

  /**
   * The bubbles currently on this plane.
   * @returns {Map<string, Sprite_ChatterBubble>}
   */
  bubbles()
  {
    return this._j._bubbles;
  }

  /**
   * The window every chatter line is laid out against, building it if this is the first line.
   * @returns {Window_ChatterLayout}
   */
  layoutWindow()
  {
    const existing = this._j._layoutWindow;

    if (existing !== null) return existing;

    const built = this.buildLayoutWindow();
    this.setLayoutWindow(built);

    return built;
  }

  /**
   * Sets the window every chatter line is laid out against.
   * @param {Window_ChatterLayout} window The measuring window.
   */
  setLayoutWindow(window)
  {
    this._j._layoutWindow = window;
  }

  /**
   * Builds the window chatter lines are measured against.
   *
   * As wide as the screen because chatter is never wrapped - a line is as wide as its author wrote
   * it - so the width only has to be generous enough never to be the thing that decides a break.
   * @returns {Window_ChatterLayout}
   */
  buildLayoutWindow()
  {
    const height = Window_Base.prototype.fittingHeight(Window_ChatterLayout.LineCapacity);
    const rect = new Rectangle(0, 0, Graphics.boxWidth, height);

    return new Window_ChatterLayout(rect);
  }

  /**
   * Extend the update to keep this plane agreeing with who is talking.
   */
  update()
  {
    this.syncChatterBubbles();

    // perform original logic, which is what types each line out and keeps it over its speaker.
    super.update();
  }

  /**
   * Adds and removes bubbles until this plane shows exactly who the manager says is talking.
   */
  syncChatterBubbles()
  {
    const live = ChatterManager.liveSessions();

    this.removeFinishedBubbles(live);

    live.forEach(([ token, session ]) => this.addMissingBubble(token, session));
  }

  /**
   * Takes away the bubbles of anyone who has stopped talking.
   * @param {Array<[string, ChatterSession]>} live Every line currently being said.
   */
  removeFinishedBubbles(live)
  {
    const stillTalking = live.map(([ token ]) => token);
    const drawn = [ ...this.bubbles()
      .keys() ];

    // collected before anything is removed, because removing from a map while walking it is the kind
    // of thing that works until the day two characters stop talking at once.
    const finished = drawn.filter(token => stillTalking.includes(token) === false);

    finished.forEach(token =>
    {
      const sprite = this.bubbles()
        .get(token);

      this.removeChild(sprite);
      this.bubbles()
        .delete(token);
    });
  }

  /**
   * Gives a talker a bubble if they do not already have one on this plane.
   * @param {string} token The target token of whoever is talking.
   * @param {ChatterSession} session The line they are saying.
   */
  addMissingBubble(token, session)
  {
    const existing = this.bubbles()
      .get(token);

    // already drawn, and its own update is what types it out and keeps it over its speaker.
    if (existing !== undefined) return;

    const sprite = this.buildBubble(token, session);

    this.bubbles()
      .set(token, sprite);
    this.addChild(sprite);
  }

  /**
   * Lays a line out and builds the bubble that shows it.
   * @param {string} token The target token of whoever is talking.
   * @param {ChatterSession} session The line they are saying.
   * @returns {Sprite_ChatterBubble}
   */
  buildBubble(token, session)
  {
    const window = this.layoutWindow();
    const glyphs = window.layoutMessageGlyphs(session.line());

    return new Sprite_ChatterBubble(token, session, glyphs, window.padding);
  }
}

export default Sprite_ChatterBubbleLayer;
//endregion Sprite_ChatterBubbleLayer