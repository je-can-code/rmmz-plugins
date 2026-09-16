//region Sprite_ChatterBubble
import ChatterScheduler from '../services/ChatterScheduler.js';

/**
 * One line a character is muttering to themselves, floating above them.
 *
 * It is the same bubble a message draws, with two deliberate differences. It carries **no legend**,
 * because idle chatter is not a conversation and nobody needs telling who is muttering - the tail is
 * already pointing at them. And it is **alive**: its glyph plane updates, so `\~` waves and `\%`
 * jitters here exactly as they do in a real message. A spent bubble is the opposite of this on
 * purpose, frozen at the frame its speaker stopped.
 *
 * The line types itself out rather than appearing whole. Every glyph is built the moment the bubble
 * is, so that is a matter of showing progressively more of them rather than of running a reveal
 * pipeline - which is also what makes the bubble the right size from its very first frame.
 */
class Sprite_ChatterBubble
  extends Sprite
{
  /**
   * Extend initialization to build one line of chatter.
   * @param {string} token The target token of whoever is saying it.
   * @param {ChatterSession} session The line being said.
   * @param {MessageGlyph[]} glyphs The line, laid out.
   * @param {number} padding How far the text sits inside the bubble.
   */
  initialize(token, session, glyphs, padding)
  {
    // perform original logic.
    super.initialize();

    this.initMembers();

    this.setToken(token);
    this.setSession(session);
    this.setPadding(padding);
    this.setContent(BubbleGeometry.contentBounds(glyphs));

    this.createBubble();
    this.createGlyphs(glyphs);
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
     * The target token of whoever is saying this line.
     * @type {string}
     */
    this._j._token = String.empty;

    /**
     * The line being said.
     * @type {ChatterSession}
     */
    this._j._session = null;

    /**
     * How far the text sits inside the bubble.
     * @type {number}
     */
    this._j._padding = 0;

    /**
     * How much room this line's text needs.
     * @type {BubbleBounds}
     */
    this._j._content = null;

    /**
     * The backdrop this line is drawn on.
     * @type {Sprite_MessageBubble}
     */
    this._j._bubble = null;

    /**
     * The plane holding this line's letters.
     * @type {Sprite_MessageGlyphLayer}
     */
    this._j._glyphLayer = null;

    /**
     * How many of this line's letters have appeared so far.
     * @type {number}
     */
    this._j._revealed = 0;
  }

  /**
   * The target token of whoever is saying this line.
   * @returns {string}
   */
  token()
  {
    return this._j._token;
  }

  /**
   * Sets the target token of whoever is saying this line.
   * @param {string} token The target token.
   */
  setToken(token)
  {
    this._j._token = token;
  }

  /**
   * The line being said.
   * @returns {ChatterSession}
   */
  session()
  {
    return this._j._session;
  }

  /**
   * Sets the line being said.
   * @param {ChatterSession} session The line.
   */
  setSession(session)
  {
    this._j._session = session;
  }

  /**
   * How far the text sits inside the bubble.
   * @returns {number}
   */
  padding()
  {
    return this._j._padding;
  }

  /**
   * Sets how far the text sits inside the bubble.
   * @param {number} padding The padding.
   */
  setPadding(padding)
  {
    this._j._padding = padding;
  }

  /**
   * How much room this line's text needs.
   * @returns {BubbleBounds}
   */
  content()
  {
    return this._j._content;
  }

  /**
   * Sets how much room this line's text needs.
   * @param {BubbleBounds} content The measured text.
   */
  setContent(content)
  {
    this._j._content = content;
  }

  /**
   * The backdrop this line is drawn on.
   * @returns {Sprite_MessageBubble}
   */
  bubble()
  {
    return this._j._bubble;
  }

  /**
   * Sets the backdrop this line is drawn on.
   * @param {Sprite_MessageBubble} bubble The backdrop.
   */
  setBubble(bubble)
  {
    this._j._bubble = bubble;
  }

  /**
   * The plane holding this line's letters.
   * @returns {Sprite_MessageGlyphLayer}
   */
  glyphLayer()
  {
    return this._j._glyphLayer;
  }

  /**
   * Sets the plane holding this line's letters.
   * @param {Sprite_MessageGlyphLayer} layer The glyph plane.
   */
  setGlyphLayer(layer)
  {
    this._j._glyphLayer = layer;
  }

  /**
   * How many of this line's letters have appeared so far.
   * @returns {number}
   */
  revealed()
  {
    return this._j._revealed;
  }

  /**
   * Sets how many of this line's letters have appeared so far.
   * @param {number} revealed The count.
   */
  setRevealed(revealed)
  {
    this._j._revealed = revealed;
  }

  /**
   * Builds the backdrop, with no name set into its border.
   *
   * The three backgrounds mean here what they mean to any other message: a window, a dimmed hush, or
   * no backdrop at all. Dim is the one that earns its keep - it is what a thought looks like, as
   * against something the character actually said out loud.
   */
  createBubble()
  {
    const background = this.session()
      .profile()
      .backgroundType();
    const style = BubbleStyle.forBackground(background);
    const bubble = new Sprite_MessageBubble();

    bubble.setFillColor(style.fillColor);
    bubble.setFillAlpha(style.fillAlpha);
    bubble.setBorderColor(style.borderColor);
    bubble.flagBordered(style.bordered);
    bubble.visible = style.drawn;

    // no legend at all, which leaves the border unbroken. Chatter is somebody talking to themselves,
    // and a nameplate would make it look like a line of dialogue the player is part of.
    bubble.setSpeakerName(String.empty);

    this.setBubble(bubble);
    this.addChild(bubble);
  }

  /**
   * Builds the line's letters, none of them showing yet.
   *
   * The plane is offset by the padding because the glyphs were laid out from the inside of a message
   * window's contents, while the bubble around them is drawn from its outer edge.
   * @param {MessageGlyph[]} glyphs The line, laid out.
   */
  createGlyphs(glyphs)
  {
    const layer = new Sprite_MessageGlyphLayer();
    layer.x = this.padding();
    layer.y = this.padding();

    glyphs.forEach(glyph => layer.addGlyph(glyph));

    // every letter starts hidden, and the reveal is what brings them out. Built all at once rather
    // than added over time so the bubble is the size of the finished line from its first frame -
    // a bubble that grew as the words arrived would be a bubble that moves while being read.
    layer.glyphSprites()
      .forEach(sprite =>
      {
        sprite.visible = false;
      });

    this.setGlyphLayer(layer);
    this.addChild(layer);
  }

  /**
   * Whoever this line belongs to, as they stand right now.
   * @returns {?(Game_Character|BubbleAnchor)}
   */
  currentTarget()
  {
    // the host event id is irrelevant: every token the manager keys on has already had `self`
    // rewritten into the event it meant.
    return BubbleTargetResolver.resolve(this.token(), 0);
  }

  /**
   * Extends {@link Sprite.update}.<br/>
   * Also types the line out and keeps it over whoever is saying it.
   */
  update()
  {
    // perform original logic, which is what advances the glyph plane's clock and moves whatever is
    // supposed to be moving.
    super.update();

    this.updateReveal();
    this.updatePlacement();
  }

  /**
   * Brings out however much of the line should have arrived by now.
   */
  updateReveal()
  {
    const session = this.session();
    const sprites = this.glyphLayer()
      .glyphSprites();
    const frame = this.glyphLayer()
      .frame();

    const speed = session.profile()
      .speed();
    const revealed = ChatterScheduler.revealedCount(frame, speed, sprites.length);

    // most frames of most lines reveal nothing new, and walking ninety sprites to change nothing is
    // work the map does not need doing sixty times a second.
    if (revealed === this.revealed()) return;

    sprites.slice(this.revealed(), revealed)
      .forEach(sprite =>
      {
        sprite.visible = true;
      });

    this.setRevealed(revealed);

    if (revealed < sprites.length) return;

    // the line is all there, which is the moment its time on screen begins - the manager is counting
    // reading time rather than total time, so a long line is not on screen for less of it.
    session.flagRevealed();
  }

  /**
   * Keeps the bubble over whoever is saying it.
   */
  updatePlacement()
  {
    const target = this.currentTarget();

    // the character walked off the map, or out of the party with it. The line keeps typing itself
    // out behind the scenes so that it still finishes and still expires, rather than hanging on
    // the manager's books forever waiting for a reveal nobody can see.
    if (target === null)
    {
      this.visible = false;

      return;
    }

    this.visible = true;

    const preferBelow = this.session()
      .profile()
      .prefersBelow();
    const anchorX = target.screenX();
    const anchorY = target.bubbleAnchorY(preferBelow);

    // the same solve a message uses, so chatter and dialogue sit identically above the same head.
    const solved = BubbleLayout.solve(
      this.content(),
      this.padding(),
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

export default Sprite_ChatterBubble;
//endregion Sprite_ChatterBubble