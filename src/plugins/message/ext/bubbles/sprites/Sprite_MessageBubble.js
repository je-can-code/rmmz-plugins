//region Sprite_MessageBubble
import BubbleShape from '../services/BubbleShape.js';

/**
 * The drawn backdrop a floating message sits on.
 *
 * Drawn rather than stamped from a windowskin, which is the decision everything else about this
 * ship follows from. A nine-sliced image can be stretched to any size but it cannot have a hole cut
 * in one edge for a name to sit in, it cannot grow a tail pointing at a character who is walking,
 * and it cannot be recoloured per speaker without shipping a second image. All three of those are
 * the feature.
 *
 * It is a direct child of the window rather than an inner child, unlike the glyph layer. The client
 * area an inner child lands in is clipped to its own rectangle by a filter, and a tail lives
 * entirely outside that rectangle by design - it would be neatly cut off at the exact line it is
 * supposed to cross.
 *
 * This class decides nothing. Where the border runs, where the tail leaves from and how wide the
 * legend's gap is are all {@link BubbleShape}'s, because a sprite is not somewhere logic can be
 * tested. What is left here is issuing the drawing calls in order, which is all a sprite should be.
 */
class Sprite_MessageBubble
  extends Sprite
{
  /**
   * How thick the drawn border is, in logical pixels.
   * @type {number}
   */
  static BorderWidth = 3;

  /**
   * The colour a bubble is filled with until a speaker's profile says otherwise.
   * @type {number}
   */
  static DefaultFillColor = 0x121826;

  /**
   * How opaque a bubble's fill is.
   *
   * Not quite solid, so a bubble sitting over a busy tile still reads as floating above the map
   * rather than as a hole cut in it - but nowhere near translucent enough to make the text compete
   * with whatever is behind it.
   * @type {number}
   */
  static DefaultFillAlpha = 0.92;

  /**
   * The colour a bubble is outlined in until a speaker's profile says otherwise.
   * @type {number}
   */
  static DefaultBorderColor = 0xf2f4f8;

  /**
   * How large the speaker's name is drawn, in logical pixels.
   *
   * A little larger than the dialogue it labels, and bold, because it is a label rather than part of
   * the conversation - it wants to be readable at a glance and then ignored, which is the opposite
   * of what shrinking it would achieve. Fixed rather than derived from the message's own font size,
   * so a line written at `\FS[16]` does not arrive with a shrunken nameplate attached.
   * @type {number}
   */
  static LegendFontSize = 30;

  /**
   * The colour the speaker's name is drawn in, as the CSS string the engine deals in.
   * @type {string}
   */
  static DefaultLegendColor = '#f2f4f8';

  /**
   * Extend initialization to build an empty backdrop.
   */
  initialize()
  {
    // perform original logic.
    super.initialize();

    this.initMembers();

    this.createGraphics();

    // after the graphics, so the name draws on top of the border it is set into rather than under it.
    this.createLegend();
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
     * The canvas this bubble's body and border are drawn onto.
     * @type {PIXI.Graphics}
     */
    this._j._graphics = null;

    /**
     * The colour this bubble is filled with.
     * @type {number}
     */
    this._j._fillColor = Sprite_MessageBubble.DefaultFillColor;

    /**
     * How opaque this bubble's fill is.
     * @type {number}
     */
    this._j._fillAlpha = Sprite_MessageBubble.DefaultFillAlpha;

    /**
     * The colour this bubble is outlined in.
     * @type {number}
     */
    this._j._borderColor = Sprite_MessageBubble.DefaultBorderColor;

    /**
     * The speaker's name, set into the border the way a legend is set into a fieldset.
     * @type {Sprite_BaseText}
     */
    this._j._legend = null;
  }

  /**
   * Creates the canvas this bubble draws onto and attaches it.
   */
  createGraphics()
  {
    const graphics = new PIXI.Graphics();

    this.setGraphics(graphics);
    this.addChild(graphics);
  }

  /**
   * Creates the sprite the speaker's name is drawn on and attaches it.
   */
  createLegend()
  {
    const legend = new Sprite_BaseText(String.empty);

    legend.setFontSize(Sprite_MessageBubble.LegendFontSize);
    legend.setColor(Sprite_MessageBubble.DefaultLegendColor);
    legend.setBold(true);

    this.setLegend(legend);
    this.addChild(legend);
  }

  /**
   * The sprite the speaker's name is drawn on.
   * @returns {Sprite_BaseText}
   */
  legend()
  {
    return this._j._legend;
  }

  /**
   * Sets the sprite the speaker's name is drawn on.
   * @param {Sprite_BaseText} legend The name sprite.
   */
  setLegend(legend)
  {
    this._j._legend = legend;
  }

  /**
   * Sets the colour the speaker's name is drawn in.
   * @param {string} color The colour, as the CSS string text rendering deals in.
   */
  setLegendColor(color)
  {
    this.legend()
      .setColor(color);
  }

  /**
   * Names whoever is speaking, or nobody.
   * @param {string} speakerName The name to set into the border, already converted from any text
   * codes it was written with.
   */
  setSpeakerName(speakerName)
  {
    this.legend()
      .setText(speakerName);
  }

  /**
   * How much room the speaker's name needs, in logical pixels.
   * @returns {number} The width of the drawn name, or zero when nobody is named.
   */
  legendWidth()
  {
    const legend = this.legend();

    // narration, signposts and system text name nobody, and their bubbles want an unbroken border
    // rather than a gap with nothing in it.
    if (legend.text() === String.empty) return 0;

    return legend.measureTextWidth();
  }

  /**
   * The canvas this bubble's body and border are drawn onto.
   * @returns {PIXI.Graphics}
   */
  graphics()
  {
    return this._j._graphics;
  }

  /**
   * Sets the canvas this bubble's body and border are drawn onto.
   * @param {PIXI.Graphics} graphics The canvas.
   */
  setGraphics(graphics)
  {
    this._j._graphics = graphics;
  }

  /**
   * The colour this bubble is filled with.
   * @returns {number}
   */
  fillColor()
  {
    return this._j._fillColor;
  }

  /**
   * Sets the colour this bubble is filled with.
   * @param {number} color The fill colour.
   */
  setFillColor(color)
  {
    this._j._fillColor = color;
  }

  /**
   * How opaque this bubble's fill is.
   * @returns {number}
   */
  fillAlpha()
  {
    return this._j._fillAlpha;
  }

  /**
   * Sets how opaque this bubble's fill is.
   * @param {number} alpha The fill opacity.
   */
  setFillAlpha(alpha)
  {
    this._j._fillAlpha = alpha;
  }

  /**
   * The colour this bubble is outlined in.
   * @returns {number}
   */
  borderColor()
  {
    return this._j._borderColor;
  }

  /**
   * Sets the colour this bubble is outlined in.
   * @param {number} color The border colour.
   */
  setBorderColor(color)
  {
    this._j._borderColor = color;
  }

  /**
   * Draws this bubble at the given size, pointing wherever it is pointing right now.
   *
   * Redrawn whole rather than in pieces, and redrawn on every frame the caller asks for. The tail
   * has to follow a speaker who is walking, and the tail is part of the same outline as the body -
   * splitting them so the body could be cached would put a seam across the tail's mouth, which is
   * the one join in the whole shape that has to be invisible. A dozen path commands per frame for a
   * single object is not the cost worth paying for that.
   * @param {BubbleBounds} bounds The box the border encloses.
   * @param {?object} tail Where the tail leaves and points, or null to draw no tail.
   */
  refresh(bounds, tail)
  {
    // the name has to be measured before the border is drawn, because how much border to leave out
    // is a question about how wide the name turned out to be.
    const legendGap = BubbleShape.legendGapFor(bounds, this.legendWidth());

    const graphics = this.graphics();
    graphics.clear();

    this.fillBody(graphics, bounds, tail);
    this.strokeBorder(graphics, bounds, tail, legendGap);
    this.placeLegend(bounds, legendGap);
  }

  /**
   * Sits the speaker's name in the gap left for it, or hides it when there is no gap.
   *
   * The name straddles the border rather than resting above or below it, which is the whole look:
   * `Sprite_BaseText` centres its text vertically within its own bitmap, so putting the bitmap's
   * centre on the border line puts the text's centre there too.
   * @param {BubbleBounds} bounds The box the border encloses.
   * @param {?object} legendGap The stretch of border left out for the name, or null.
   */
  placeLegend(bounds, legendGap)
  {
    const legend = this.legend();

    // no gap means either nobody is speaking or the name was too long to carve room for; either way
    // there is nowhere to put it that is not on top of the border.
    if (legendGap === null)
    {
      legend.visible = false;

      return;
    }

    legend.visible = true;
    legend.x = legendGap.start + BubbleShape.LegendPadding - legend.padding();
    legend.y = bounds.top - (legend.bitmap.height / 2);
  }

  /**
   * Fills the body of the bubble, tail included.
   *
   * Traced without the legend's gap on purpose: the gap is a hole in the *border*, not in the
   * bubble. Filling around it would cut a notch out of the backdrop and the name would be sitting
   * over the map.
   * @param {PIXI.Graphics} graphics The canvas to draw onto.
   * @param {BubbleBounds} bounds The box the border encloses.
   * @param {?object} tail Where the tail leaves and points, or null to draw no tail.
   */
  fillBody(graphics, bounds, tail)
  {
    const path = BubbleShape.outlinePath(bounds, tail, null);

    graphics.beginFill(this.fillColor(), this.fillAlpha());
    this.tracePath(graphics, path);
    graphics.endFill();
  }

  /**
   * Strokes the border, stepping around the legend.
   * @param {PIXI.Graphics} graphics The canvas to draw onto.
   * @param {BubbleBounds} bounds The box the border encloses.
   * @param {?object} tail Where the tail leaves and points, or null to draw no tail.
   * @param {?object} legendGap The stretch of border to leave out, or null for an unbroken one.
   */
  strokeBorder(graphics, bounds, tail, legendGap)
  {
    const path = BubbleShape.outlinePath(bounds, tail, legendGap);

    graphics.lineStyle(Sprite_MessageBubble.BorderWidth, this.borderColor(), 1);
    this.tracePath(graphics, path);

    // put the pen down again, or the next thing drawn onto this canvas inherits a border.
    graphics.lineStyle(0);
  }

  /**
   * Walks a path onto the canvas, lifting the pen only where the path itself is broken.
   * @param {PIXI.Graphics} graphics The canvas to draw onto.
   * @param {object[]} path The segments to trace, in order.
   */
  tracePath(graphics, path)
  {
    path.forEach((segment, index) =>
    {
      const startsFresh = index === 0 || BubbleShape.continuesFrom(path[ index - 1 ], segment) === false;

      if (startsFresh === true)
      {
        const start = BubbleShape.startOf(segment);
        graphics.moveTo(start.x, start.y);
      }

      this.traceSegment(graphics, segment);
    });
  }

  /**
   * Draws one segment from wherever the pen currently is.
   * @param {PIXI.Graphics} graphics The canvas to draw onto.
   * @param {object} segment The line or arc to draw.
   */
  traceSegment(graphics, segment)
  {
    if (segment.kind === 'arc')
    {
      graphics.arc(segment.centerX, segment.centerY, segment.radius, segment.startAngle, segment.endAngle);

      return;
    }

    graphics.lineTo(segment.toX, segment.toY);
  }
}

export default Sprite_MessageBubble;
//endregion Sprite_MessageBubble