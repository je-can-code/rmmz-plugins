//region Sprite_SpentBubble
import BubbleLayout from '../services/BubbleLayout.js';
import BubbleTargetResolver from '../services/BubbleTargetResolver.js';
import Sprite_MessageBubble from './Sprite_MessageBubble.js';

/**
 * A bubble somebody has finished speaking, still on screen while the conversation continues.
 *
 * Built from the message's glyph records rather than handed the live window's sprites. The window
 * measures every message before it reveals it, so the records are already sitting there as plain
 * values - and a value survives the window being torn down and rebuilt for the next line, which an
 * object graph reparented out of it does not.
 *
 * **It is frozen by not walking its own children.** The engine's `Sprite.update` recurses, so a
 * glyph plane inside anything that updates keeps ticking; declining to recurse stops the effect
 * clock dead while leaving this sprite free to keep following its owner around the map. A waving
 * word stays caught at whatever point in its wave the speaker stopped talking, which is the right
 * answer for both: it is still legibly the same word, and it is visibly no longer being said.
 */
class Sprite_SpentBubble
  extends Sprite
{
  /**
   * How much of its original brightness a spent bubble keeps.
   *
   * Far enough down to read as background without becoming unreadable. What is being communicated
   * is "this was said a moment ago", not "this is gone".
   * @type {number}
   */
  static SpentAlpha = 0.62;

  /**
   * Extend initialization to rebuild one finished message.
   * @param {string} token The target the message named, verbatim.
   * @param {object} entry Everything the message left behind.
   */
  initialize(token, entry)
  {
    // perform original logic.
    super.initialize();

    this.initMembers();

    this.setToken(token);
    this.setEntry(entry);

    this.createBubble();
    this.createGlyphs();

    this.alpha = Sprite_SpentBubble.SpentAlpha;
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
     * The target the message named, which is also this bubble's identity.
     * @type {string}
     */
    this._j._token = String.empty;

    /**
     * Everything the finished message left behind.
     * @type {object}
     */
    this._j._entry = null;

    /**
     * The backdrop this bubble is drawn on.
     * @type {Sprite_MessageBubble}
     */
    this._j._bubble = null;

    /**
     * The plane holding this bubble's frozen letters.
     * @type {Sprite}
     */
    this._j._glyphPlane = null;
  }

  /**
   * The target the message named.
   * @returns {string}
   */
  token()
  {
    return this._j._token;
  }

  /**
   * Sets the target the message named.
   * @param {string} token The target, verbatim.
   */
  setToken(token)
  {
    this._j._token = token;
  }

  /**
   * Everything the finished message left behind.
   * @returns {object}
   */
  entry()
  {
    return this._j._entry;
  }

  /**
   * Sets everything the finished message left behind.
   * @param {object} entry The retained message.
   */
  setEntry(entry)
  {
    this._j._entry = entry;
  }

  /**
   * The backdrop this bubble is drawn on.
   * @returns {Sprite_MessageBubble}
   */
  bubble()
  {
    return this._j._bubble;
  }

  /**
   * Sets the backdrop this bubble is drawn on.
   * @param {Sprite_MessageBubble} bubble The backdrop.
   */
  setBubble(bubble)
  {
    this._j._bubble = bubble;
  }

  /**
   * The plane holding this bubble's frozen letters.
   * @returns {Sprite}
   */
  glyphPlane()
  {
    return this._j._glyphPlane;
  }

  /**
   * Sets the plane holding this bubble's frozen letters.
   * @param {Sprite} plane The glyph plane.
   */
  setGlyphPlane(plane)
  {
    this._j._glyphPlane = plane;
  }

  /**
   * Builds the backdrop, in the colours the message was drawn in.
   */
  createBubble()
  {
    const { style, speakerName } = this.entry();
    const bubble = new Sprite_MessageBubble();

    bubble.setFillColor(style.fillColor);
    bubble.setFillAlpha(style.fillAlpha);
    bubble.setBorderColor(style.borderColor);
    bubble.setLegendColor(style.legendColor);
    bubble.setSpeakerName(speakerName);
    bubble.visible = style.drawn;

    this.setBubble(bubble);
    this.addChild(bubble);
  }

  /**
   * Rebuilds the message's letters, each caught at the moment its speaker stopped.
   *
   * The plane is offset by the window's padding because glyph coordinates were measured from the
   * inside of the message window's contents, and the bubble around them is drawn from its outer
   * edge. Without it every letter lands one padding up and to the left of the box it belongs in.
   */
  createGlyphs()
  {
    const { glyphs, padding, frame } = this.entry();

    const plane = new Sprite();
    plane.x = padding;
    plane.y = padding;

    glyphs.forEach(glyph =>
    {
      const sprite = new Sprite_MessageGlyph(glyph);

      // caught mid-effect rather than snapped back to rest: a word stops where the speaker stopped.
      const modulation = MessageEffectRegistry.modulate(glyph.effects, glyph.index, frame);
      sprite.applyModulation(modulation);

      plane.addChild(sprite);
    });

    this.setGlyphPlane(plane);
    this.addChild(plane);
  }

  /**
   * Whether the character this bubble belongs to is still somewhere it can be drawn above.
   * @returns {boolean}
   */
  hasTarget()
  {
    return this.currentTarget() !== null;
  }

  /**
   * Whoever this bubble belongs to, as they stand right now.
   *
   * Resolved every frame rather than remembered, for the same reason the entry is keyed on a token:
   * an actor moves between the player sprite and a follower as the party is reordered, and the
   * bubble should follow the actor rather than whichever sprite they happened to be.
   * @returns {?(Game_Character|BubbleAnchor)}
   */
  currentTarget()
  {
    const { hostEventId } = this.entry();

    return BubbleTargetResolver.resolve(this.token(), hostEventId);
  }

  /**
   * Keeps this bubble over its owner, without letting anything inside it move.
   *
   * Deliberately does **not** call the original. The engine's own update walks every child, and the
   * children here are a frozen message - the whole point of a spent bubble is that its effects
   * stopped when its speaker did.
   */
  update()
  {
    const target = this.currentTarget();

    // the character walked out of the party, or off the map with it. Nothing to sit above.
    if (target === null)
    {
      this.visible = false;

      return;
    }

    this.visible = true;

    const { content, padding, preferBelow } = this.entry();
    const anchorX = target.screenX();
    const anchorY = target.bubbleAnchorY(preferBelow);

    // the side is carried on the entry rather than read back from `$gameMessage`, which was cleared
    // the moment this bubble stopped being the live one.
    const solved = BubbleLayout.solve(
      content,
      padding,
      anchorX,
      anchorY,
      Graphics.boxWidth,
      Graphics.boxHeight,
      preferBelow);

    this.x = solved.x;
    this.y = solved.y;

    this.bubble()
      .refresh(solved.bounds, solved.tail);
  }
}

export default Sprite_SpentBubble;
//endregion Sprite_SpentBubble