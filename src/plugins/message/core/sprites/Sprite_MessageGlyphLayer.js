//region Sprite_MessageGlyphLayer
import MessageEffectRegistry from '../services/MessageEffectRegistry.js';
import Sprite_MessageGlyph from './Sprite_MessageGlyph.js';

/**
 * The plane a message's letters live on, above the window's own contents.
 *
 * It exists to own two things the individual glyphs should not: the clock, and the list. A frame
 * counter kept per glyph would drift between letters that are supposed to share a wave, and ninety
 * sprites each deciding when to update is ninety times the bookkeeping for one shared answer.
 *
 * The layer is added to its window with `addInnerChild`, which is doing more work than it appears
 * to. That parents it into the window's client area, which is already offset by the window's
 * padding, already scrolled by the window's origin, already hidden while the window is opening or
 * closing, and already drawn above the contents sprite - so the face still renders behind the text,
 * the letters still disappear with the window, and none of it needed a coordinate system of its own.
 *
 * It also inherits its heartbeat for free: the engine's `Window.update` walks its children, the
 * client area is a `Sprite`, and `Sprite.update` walks *its* children. Being a sprite in that chain
 * is the whole subscription.
 */
class Sprite_MessageGlyphLayer
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
     * The sprites currently on this plane, in the order their glyphs were emitted.
     * @type {Sprite_MessageGlyph[]}
     */
    this._j._glyphSprites = [];

    /**
     * How many frames this plane has been animating.
     *
     * Counted from when the page began rather than from when the game did, so an effect looks the
     * same every time a line is read rather than depending on how long the player has been playing.
     * @type {number}
     */
    this._j._frame = 0;
  }

  /**
   * The sprites currently on this plane.
   * @returns {Sprite_MessageGlyph[]}
   */
  glyphSprites()
  {
    return this._j._glyphSprites;
  }

  /**
   * How many frames this plane has been animating.
   * @returns {number}
   */
  frame()
  {
    return this._j._frame;
  }

  /**
   * Sets how many frames this plane has been animating.
   * @param {number} frame The new frame count.
   */
  setFrame(frame)
  {
    this._j._frame = frame;
  }

  /**
   * Puts one emitted glyph onto the plane.
   * @param {MessageGlyph} glyph The glyph to draw.
   */
  addGlyph(glyph)
  {
    const sprite = new Sprite_MessageGlyph(glyph);

    this.glyphSprites().push(sprite);
    this.addChild(sprite);
  }

  /**
   * Empties the plane and restarts its clock.
   *
   * Called wherever the window clears its own contents, which is the start of every page. Resetting
   * the frame alongside the sprites is what keeps a wave from arriving mid-swell on page two.
   */
  clearGlyphs()
  {
    this.glyphSprites()
      .forEach(sprite => this.removeChild(sprite));

    this._j._glyphSprites = [];

    this.setFrame(0);
  }

  /**
   * Extends {@link Sprite.update}.<br/>
   * Also advances the plane's clock and moves whatever is supposed to be moving.
   */
  update()
  {
    // perform original logic.
    super.update();

    this.setFrame(this.frame() + 1);

    this.updateGlyphs();
  }

  /**
   * Applies this frame's effects to every glyph carrying any.
   */
  updateGlyphs()
  {
    const frame = this.frame();

    this.glyphSprites()
      .forEach(sprite =>
      {
        const glyph = sprite.glyph();

        // most glyphs in most messages carry nothing at all, and a glyph at rest was placed
        // correctly when it was added - recomputing that every frame would be work for no motion.
        if (glyph.effects.length === 0) return;

        const modulation = MessageEffectRegistry.modulate(glyph.effects, glyph.index, frame);
        sprite.applyModulation(modulation);
      });
  }
}

export default Sprite_MessageGlyphLayer;
//endregion Sprite_MessageGlyphLayer