//region Sprite_HitboxPulse
import JABS_HitboxPulseManager from './../managers/JABS_HitboxPulseManager.js';
import JABS_HitboxPainter from './../managers/JABS_HitboxPainter.js';
/**
 * A lightweight graphics sprite that renders a transient hitbox visualization.
 * Geometry is drawn in local space, already aimed; caller sets world x/y.
 */
class Sprite_HitboxPulse
  extends Sprite
{

  //region properties
  /**
   * Gets the sustained.
   * @returns {boolean} The sustained.
   */
  isSustained()
  {
    // hand back the sustained.
    return this._sustained;
  }

  /**
   * Sets the sustained.
   * @param {boolean} newSustained The new sustained.
   */
  setSustained(newSustained)
  {
    // assign the sustained.
    this._sustained = newSustained;
  }

  /**
   * Gets the age.
   * @returns {number} The age.
   */
  age()
  {
    // hand back the age.
    return this._age;
  }

  /**
   * Sets the age.
   * @param {number} newAge The new age.
   */
  setAge(newAge)
  {
    // assign the age.
    this._age = newAge;
  }

  /**
   * Gets the duration.
   * @returns {number} The duration.
   */
  duration()
  {
    // hand back the duration.
    return this._duration;
  }

  /**
   * Sets the duration.
   * @param {number} newDuration The new duration.
   */
  setDuration(newDuration)
  {
    // assign the duration.
    this._duration = newDuration;
  }

  /**
   * Gets the start alpha.
   * @returns {number} The startAlpha.
   */
  startAlpha()
  {
    // hand back the start alpha.
    return this._startAlpha;
  }

  /**
   * Sets the start alpha.
   * @param {number} newStartAlpha The new startAlpha.
   */
  setStartAlpha(newStartAlpha)
  {
    // assign the start alpha.
    this._startAlpha = newStartAlpha;
  }

  /**
   * Gets the end alpha.
   * @returns {number} The endAlpha.
   */
  endAlpha()
  {
    // hand back the end alpha.
    return this._endAlpha;
  }

  /**
   * Sets the end alpha.
   * @param {number} newEndAlpha The new endAlpha.
   */
  setEndAlpha(newEndAlpha)
  {
    // assign the end alpha.
    this._endAlpha = newEndAlpha;
  }

  /**
   * Gets the scale start.
   * @returns {number} The scaleStart.
   */
  scaleStart()
  {
    // hand back the scale start.
    return this._scaleStart;
  }

  /**
   * Sets the scale start.
   * @param {number} newScaleStart The new scaleStart.
   */
  setScaleStart(newScaleStart)
  {
    // assign the scale start.
    this._scaleStart = newScaleStart;
  }

  /**
   * Gets the scale end.
   * @returns {number} The scaleEnd.
   */
  scaleEnd()
  {
    // hand back the scale end.
    return this._scaleEnd;
  }

  /**
   * Sets the scale end.
   * @param {number} newScaleEnd The new scaleEnd.
   */
  setScaleEnd(newScaleEnd)
  {
    // assign the scale end.
    this._scaleEnd = newScaleEnd;
  }

  /**
   * Gets the line color.
   * @returns {number} The lineColor.
   */
  lineColor()
  {
    // hand back the line color.
    return this._lineColor;
  }

  /**
   * Sets the line color.
   * @param {number} newLineColor The new lineColor.
   */
  setLineColor(newLineColor)
  {
    // assign the line color.
    this._lineColor = newLineColor;
  }

  /**
   * Gets the line alpha.
   * @returns {number} The lineAlpha.
   */
  lineAlpha()
  {
    // hand back the line alpha.
    return this._lineAlpha;
  }

  /**
   * Sets the line alpha.
   * @param {number} newLineAlpha The new lineAlpha.
   */
  setLineAlpha(newLineAlpha)
  {
    // assign the line alpha.
    this._lineAlpha = newLineAlpha;
  }

  /**
   * Gets the line width.
   * @returns {number} The lineWidth.
   */
  lineWidth()
  {
    // hand back the line width.
    return this._lineWidth;
  }

  /**
   * Sets the line width.
   * @param {number} newLineWidth The new lineWidth.
   */
  setLineWidth(newLineWidth)
  {
    // assign the line width.
    this._lineWidth = newLineWidth;
  }

  /**
   * Gets the fill color.
   * @returns {number} The fillColor.
   */
  fillColor()
  {
    // hand back the fill color.
    return this._fillColor;
  }

  /**
   * Sets the fill color.
   * @param {number} newFillColor The new fillColor.
   */
  setFillColor(newFillColor)
  {
    // assign the fill color.
    this._fillColor = newFillColor;
  }

  /**
   * Gets the fill alpha.
   * @returns {number} The fillAlpha.
   */
  fillAlpha()
  {
    // hand back the fill alpha.
    return this._fillAlpha;
  }

  /**
   * Sets the fill alpha.
   * @param {number} newFillAlpha The new fillAlpha.
   */
  setFillAlpha(newFillAlpha)
  {
    // assign the fill alpha.
    this._fillAlpha = newFillAlpha;
  }

  /**
   * Gets the shape.
   * @returns {string} The shape.
   */
  shape()
  {
    // hand back the shape.
    return this._shape;
  }

  /**
   * Sets the shape.
   * @param {string} newShape The new shape.
   */
  setShape(newShape)
  {
    // assign the shape.
    this._shape = newShape;
  }

  /**
   * Gets the facing.
   * @returns {number} The facing.
   */
  facing()
  {
    // hand back the facing.
    return this._facing;
  }

  /**
   * Sets the facing.
   * @param {number} newFacing The new facing.
   */
  setFacing(newFacing)
  {
    // assign the facing.
    this._facing = newFacing;
  }

  /**
   * Gets the range.
   * @returns {number} The range.
   */
  range()
  {
    // hand back the range.
    return this._range;
  }

  /**
   * Sets the range.
   * @param {number} newRange The new range.
   */
  setRange(newRange)
  {
    // assign the range.
    this._range = newRange;
  }

  /**
   * Gets the degrees.
   * @returns {number} The degrees.
   */
  degrees()
  {
    // hand back the degrees.
    return this._degrees;
  }

  /**
   * Sets the degrees.
   * @param {number} newDegrees The new degrees.
   */
  setDegrees(newDegrees)
  {
    // assign the degrees.
    this._degrees = newDegrees;
  }

  /**
   * Gets the thickness.
   * @returns {number} The thickness.
   */
  thickness()
  {
    // hand back the thickness.
    return this._thickness;
  }

  /**
   * Sets the thickness.
   * @param {number} newThickness The new thickness.
   */
  setThickness(newThickness)
  {
    // assign the thickness.
    this._thickness = newThickness;
  }

  /**
   * Gets the inner radius.
   * @returns {number} The innerRadius.
   */
  innerRadius()
  {
    // hand back the inner radius.
    return this._innerRadius;
  }

  /**
   * Sets the inner radius.
   * @param {number} newInnerRadius The new innerRadius.
   */
  setInnerRadius(newInnerRadius)
  {
    // assign the inner radius.
    this._innerRadius = newInnerRadius;
  }

  /**
   * Gets the graphics.
   * @returns {PIXI.Graphics} The graphics.
   */
  graphics()
  {
    // hand back the graphics.
    return this._graphics;
  }
  //endregion properties

  /**
   * Constructor.
   * Creates the internal Graphics child and resets members.
   */

  constructor()
  {
    // initialize base Sprite.
    super();

    /**
     * Internal graphics used to draw the hitbox geometry.
     * @type {PIXI.Graphics}
     */
    this._graphics = new PIXI.Graphics();

    // attach the graphics element as a child.
    this.addChild(this._graphics);

    // initialize members.
    this.reset();
  }

  //region lifecycle
  /**
   * Resets transient members to defaults for reuse.
   */
  reset()
  {
    // lifetime counters.
    this.setAge(0);           // current frame
    this.setDuration(18);     // total frames

    // visual alpha curve.
    this.setStartAlpha(0.22);
    this.setEndAlpha(0.0);

    // scale pulse curve.
    this.setScaleStart(1.00);
    this.setScaleEnd(1.08);

    // base style components.
    this.setLineColor(0xFFFFFF);
    this.setLineAlpha(0.85);
    this.setLineWidth(2);
    this.setFillColor(0xFFFFFF);
    this.setFillAlpha(0.18);
    this.blendMode = PIXI.BLEND_MODES.ADD;

    // geometry settings.
    this.setShape(J.ABS.Shapes.Circle);
    this.setFacing(2);        // dir8
    this.setRange(1);         // in tiles
    this.setDegrees(180);     // for Arc shape
    this.setThickness(1);     // for Line/Wall width (tiles)
    this.setInnerRadius(0);   // universal dead zone punched out of any shape (tiles)

    // sustained pulses skip pooled expiry animation; manager refreshes them each frame.
    this.setSustained(false);

    // snap transforms.
    this.alpha = 1.0;
    this.scale.set(1.0, 1.0);

    // clear old geometry.
    this.graphics().clear();
  }

  /**
   * Sets up geometry and visuals from merged options.
   */
  setup(opts)
  {
    // cache the duration and curves.
    this.setDuration(Math.max(1, opts.duration));
    this.setStartAlpha(opts.startAlpha);
    this.setEndAlpha(opts.endAlpha);
    this.setScaleStart(opts.scaleStart);
    this.setScaleEnd(opts.scaleEnd);

    // cache style.
    this.setLineColor(opts.lineColor);
    this.setLineAlpha(opts.lineAlpha);
    this.setLineWidth(opts.lineWidth);
    this.setFillColor(opts.fillColor);
    this.setFillAlpha(opts.fillAlpha);
    this.blendMode = opts.blendMode;

    // cache geometry.
    this.setShape(opts.shape);
    this.setFacing(opts.facing);
    this.setRange(Math.max(0, opts.range));
    this.setDegrees(opts.degrees !== undefined
      ? opts.degrees
      : 180);
    this.setThickness(opts.thickness !== undefined
      ? Math.max(0, opts.thickness)
      : 1);
    this.setInnerRadius(opts.innerRadius !== undefined
      ? Math.max(0, opts.innerRadius)
      : 0);

    // sustained overlays are ticked by JABS_HitboxPulseManager.sync, not the ephemeral pool update().
    this.setSustained(opts.sustained === true);


    // draw the geometry now (static path; only alpha/scale animates per frame).
    this.drawGeometry();

    // snap visual curve for sustained pulses so they read as a steady outline during the swing.
    if (this.isSustained())
    {
      this.alpha = this.startAlpha();
      this.scale.set(this.scaleStart(), this.scaleStart());
    }
  }

  //endregion lifecycle

  //region geometry
  /**
   * Draws the static geometry path according to the shape and style.
   */
  drawGeometry()
  {
    // clear previous path.
    const g = this.graphics();
    g.clear();

    // apply outline and fill, stroked inward so the visible edge stays honest to the real geometry.
    g.lineStyle(this.lineWidth(), this.lineColor(), this.lineAlpha(), 0);
    g.beginFill(this.fillColor(), this.fillAlpha());

    // this is what teaches a player what just hit them, so it draws the true shape.
    JABS_HitboxPainter.draw(g, {
      shape: this.shape(),
      range: this.range(),
      facing: this.facing(),
      degrees: this.degrees(),
      thickness: this.thickness(),
      innerRadius: this.innerRadius(),
    });
  }

  //endregion geometry

  //region transforms
  /**
   * Sets the world position (tile-space aligned with JABS action sprites).
   * @param {number} x The world x.
   * @param {number} y The world y.
   */
  setWorldPosition(x, y)
  {
    // assign the position.
    this.x = x;
    this.y = y;
  }

  //endregion transforms

  //region update
  /**
   * Updates the pulse animation (alpha fade and gentle scale pulse).
   */
  update()
  {
    // sustained pulses live outside the ephemeral pool timeline.
    if (this.isSustained())
    {
      return;
    }

    // increment age.
    this.setAge(this.age() + 1);

    // compute progress 0..1.
    const t = Math.min(1, this.age() / this.duration());

    // interpolate alpha and scale.
    const a = this.startAlpha() + (this.endAlpha() - this.startAlpha()) * t;
    const s = this.scaleStart() + (this.scaleEnd() - this.scaleStart()) * t;

    // assign transforms.
    this.alpha = a;
    this.scale.set(s, s);
  }

  /**
   * Whether the pulse has finished its lifetime.
   * @returns {boolean}
   */
  isExpired()
  {
    // sustained pulses never expire through age; the manager detaches them explicitly.
    if (this.isSustained())
    {
      return false;
    }

    // report if this pulse has reached or exceeded its lifetime.
    return this.age() >= this.duration();
  }

  //endregion update
}

export default Sprite_HitboxPulse;
//endregion Sprite_HitboxPulse