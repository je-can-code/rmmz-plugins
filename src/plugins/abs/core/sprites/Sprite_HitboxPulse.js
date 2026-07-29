//region Sprite_HitboxPulse
import JABS_HitboxPulseManager from './../managers/JABS_HitboxPulseManager.js';
/**
 * A lightweight graphics sprite that renders a transient hitbox visualization.
 * It supports several common JABS shapes: Circle, Square, Line, Arc (sector).
 * Geometry is drawn in local space; caller sets world x/y and rotation.
 */
class Sprite_HitboxPulse
  extends Sprite
{
  /**
   * Constructor.
   * Creates the internal Graphics child and resets members.
   */
  

  //region properties
  /**
   * Gets the sustained.
   * @returns {*} The sustained.
   */
  isSustained()
  {
    // hand back the sustained.
    return this._sustained;
  }

  /**
   * Sets the sustained.
   * @param {*} newSustained The new sustained.
   */
  setSustained(newSustained)
  {
    // assign the sustained.
    this._sustained = newSustained;
  }

  /**
   * Gets the age.
   * @returns {*} The age.
   */
  age()
  {
    // hand back the age.
    return this._age;
  }

  /**
   * Sets the age.
   * @param {*} newAge The new age.
   */
  setAge(newAge)
  {
    // assign the age.
    this._age = newAge;
  }

  /**
   * Gets the duration.
   * @returns {*} The duration.
   */
  duration()
  {
    // hand back the duration.
    return this._duration;
  }

  /**
   * Sets the duration.
   * @param {*} newDuration The new duration.
   */
  setDuration(newDuration)
  {
    // assign the duration.
    this._duration = newDuration;
  }

  /**
   * Gets the start alpha.
   * @returns {*} The startAlpha.
   */
  startAlpha()
  {
    // hand back the start alpha.
    return this._startAlpha;
  }

  /**
   * Sets the start alpha.
   * @param {*} newStartAlpha The new startAlpha.
   */
  setStartAlpha(newStartAlpha)
  {
    // assign the start alpha.
    this._startAlpha = newStartAlpha;
  }

  /**
   * Gets the end alpha.
   * @returns {*} The endAlpha.
   */
  endAlpha()
  {
    // hand back the end alpha.
    return this._endAlpha;
  }

  /**
   * Sets the end alpha.
   * @param {*} newEndAlpha The new endAlpha.
   */
  setEndAlpha(newEndAlpha)
  {
    // assign the end alpha.
    this._endAlpha = newEndAlpha;
  }

  /**
   * Gets the scale start.
   * @returns {*} The scaleStart.
   */
  scaleStart()
  {
    // hand back the scale start.
    return this._scaleStart;
  }

  /**
   * Sets the scale start.
   * @param {*} newScaleStart The new scaleStart.
   */
  setScaleStart(newScaleStart)
  {
    // assign the scale start.
    this._scaleStart = newScaleStart;
  }

  /**
   * Gets the scale end.
   * @returns {*} The scaleEnd.
   */
  scaleEnd()
  {
    // hand back the scale end.
    return this._scaleEnd;
  }

  /**
   * Sets the scale end.
   * @param {*} newScaleEnd The new scaleEnd.
   */
  setScaleEnd(newScaleEnd)
  {
    // assign the scale end.
    this._scaleEnd = newScaleEnd;
  }

  /**
   * Gets the line color.
   * @returns {*} The lineColor.
   */
  lineColor()
  {
    // hand back the line color.
    return this._lineColor;
  }

  /**
   * Sets the line color.
   * @param {*} newLineColor The new lineColor.
   */
  setLineColor(newLineColor)
  {
    // assign the line color.
    this._lineColor = newLineColor;
  }

  /**
   * Gets the line alpha.
   * @returns {*} The lineAlpha.
   */
  lineAlpha()
  {
    // hand back the line alpha.
    return this._lineAlpha;
  }

  /**
   * Sets the line alpha.
   * @param {*} newLineAlpha The new lineAlpha.
   */
  setLineAlpha(newLineAlpha)
  {
    // assign the line alpha.
    this._lineAlpha = newLineAlpha;
  }

  /**
   * Gets the line width.
   * @returns {*} The lineWidth.
   */
  lineWidth()
  {
    // hand back the line width.
    return this._lineWidth;
  }

  /**
   * Sets the line width.
   * @param {*} newLineWidth The new lineWidth.
   */
  setLineWidth(newLineWidth)
  {
    // assign the line width.
    this._lineWidth = newLineWidth;
  }

  /**
   * Gets the fill color.
   * @returns {*} The fillColor.
   */
  fillColor()
  {
    // hand back the fill color.
    return this._fillColor;
  }

  /**
   * Sets the fill color.
   * @param {*} newFillColor The new fillColor.
   */
  setFillColor(newFillColor)
  {
    // assign the fill color.
    this._fillColor = newFillColor;
  }

  /**
   * Gets the fill alpha.
   * @returns {*} The fillAlpha.
   */
  fillAlpha()
  {
    // hand back the fill alpha.
    return this._fillAlpha;
  }

  /**
   * Sets the fill alpha.
   * @param {*} newFillAlpha The new fillAlpha.
   */
  setFillAlpha(newFillAlpha)
  {
    // assign the fill alpha.
    this._fillAlpha = newFillAlpha;
  }

  /**
   * Gets the shape.
   * @returns {*} The shape.
   */
  shape()
  {
    // hand back the shape.
    return this._shape;
  }

  /**
   * Sets the shape.
   * @param {*} newShape The new shape.
   */
  setShape(newShape)
  {
    // assign the shape.
    this._shape = newShape;
  }

  /**
   * Gets the range.
   * @returns {*} The range.
   */
  range()
  {
    // hand back the range.
    return this._range;
  }

  /**
   * Sets the range.
   * @param {*} newRange The new range.
   */
  setRange(newRange)
  {
    // assign the range.
    this._range = newRange;
  }

  /**
   * Gets the degrees.
   * @returns {*} The degrees.
   */
  degrees()
  {
    // hand back the degrees.
    return this._degrees;
  }

  /**
   * Sets the degrees.
   * @param {*} newDegrees The new degrees.
   */
  setDegrees(newDegrees)
  {
    // assign the degrees.
    this._degrees = newDegrees;
  }

  /**
   * Gets the thickness.
   * @returns {*} The thickness.
   */
  thickness()
  {
    // hand back the thickness.
    return this._thickness;
  }

  /**
   * Sets the thickness.
   * @param {*} newThickness The new thickness.
   */
  setThickness(newThickness)
  {
    // assign the thickness.
    this._thickness = newThickness;
  }

  /**
   * Gets the inner radius.
   * @returns {*} The innerRadius.
   */
  innerRadius()
  {
    // hand back the inner radius.
    return this._innerRadius;
  }

  /**
   * Sets the inner radius.
   * @param {*} newInnerRadius The new innerRadius.
   */
  setInnerRadius(newInnerRadius)
  {
    // assign the inner radius.
    this._innerRadius = newInnerRadius;
  }

  /**
   * Gets the graphics.
   * @returns {*} The graphics.
   */
  graphics()
  {
    // hand back the graphics.
    return this._graphics;
  }
  //endregion properties

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
    this.setRange(1);         // in tiles
    this.setDegrees(180);     // for Arc shape
    this.setThickness(1);     // for Line/Wall width (tiles)
    this.setInnerRadius(0);   // universal dead zone punched out of any shape (tiles)

    // sustained pulses skip pooled expiry animation; manager refreshes them each frame.
    this.setSustained(false);

    // snap transforms.
    this.rotation = 0;
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

    // apply outline and fill.
    g.lineStyle(this.lineWidth(), this.lineColor(), this.lineAlpha());
    g.beginFill(this.fillColor(), this.fillAlpha());

    // set by the Arc/default branch when it bakes the dead zone into its own polygon,
    // so the generic hole-punch below doesn't double-apply on top of it.
    let holeAlreadyBaked = false;

    // convert tiles→pixels for sizes using current map tile size.
    const tile = $gameMap.tileWidth();

    // resolve per-shape drawing.
    switch (this.shape())
    {
      case J.ABS.Shapes.Circle:
      {
        // compute world-space pixel radius.
        const r = this.range() * tile;

        // draw the circle centered at local origin.
        g.drawCircle(0, 0, r);
        break;
      }

      case J.ABS.Shapes.Square:
      case J.ABS.Shapes.Rhombus:     // approximation for pulse visualization
      case J.ABS.Shapes.Cross:       // approximation for pulse visualization
      case J.ABS.Shapes.Wall:        // approximation (wall uses Line in engine; see Line branch below if needed)
      {
        // use a square AABB centered on origin with half-extent = range.
        const half = this.range() * tile;
        g.drawRect(-half, -half, half * 2, half * 2);
        break;
      }

      case J.ABS.Shapes.Line:
      {
        // a rectangle extending forward from origin by `range` with thickness.
        const length = this.range() * tile;
        const thick = Math.max(1, this.thickness() * tile);
        g.drawRect(0, -thick * 0.5, length, thick);
        break;
      }

      case J.ABS.Shapes.Arc:
      default:
      {
        // draw a sector (wedge) oriented along +X (we rotate the sprite externally).
        const r = this.range() * tile;
        const deg = Math.max(0, Math.min(360, this.degrees()));
        const rad = deg * Math.PI / 180;
        const startAngle = -rad / 2;  // symmetric about +X axis
        const endAngle = rad / 2;

        // sample the arc with a reasonable step for smoothness; ~1 sample per 8°.
        const steps = Math.max(2, Math.ceil(deg / 8));
        const innerRadiusPx = this.innerRadius() * tile;

        if (innerRadiusPx > 0)
        {
          // bake the dead zone directly into the polygon as a true annular sector (a
          // donut slice), rather than holing a circle out of a fan that touches the
          // origin- a hole centered exactly on a point the host path also visits breaks
          // PIXI's triangulation and renders as two overlapping shapes instead of one cut wedge.
          holeAlreadyBaked = true;

          g.moveTo(Math.cos(startAngle) * innerRadiusPx, Math.sin(startAngle) * innerRadiusPx);

          // trace the outer rim forward from startAngle to endAngle.
          for (let i = 0; i <= steps; i++)
          {
            const t = i / steps;
            const a = startAngle + (endAngle - startAngle) * t;
            g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
          }

          // walk the inner rim backward from endAngle to startAngle, closing the slice.
          for (let i = steps; i >= 0; i--)
          {
            const t = i / steps;
            const a = startAngle + (endAngle - startAngle) * t;
            g.lineTo(Math.cos(a) * innerRadiusPx, Math.sin(a) * innerRadiusPx);
          }
        }
        else
        {
          // no dead zone- original pivot-to-rim fan.
          g.moveTo(0, 0);

          for (let i = 0; i <= steps; i++)
          {
            const t = i / steps;
            const a = startAngle + (endAngle - startAngle) * t;
            g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
          }

          g.lineTo(0, 0);
        }

        break;
      }
    }

    // punch the universal dead zone out of every shape that didn't already bake it directly
    // into its own polygon above (Arc, and any unrecognized shape sharing its fallback path).
    if (this.innerRadius() > 0 && holeAlreadyBaked === false)
    {
      const innerRadiusPx = this.innerRadius() * tile;
      g.beginHole();
      g.drawCircle(0, 0, innerRadiusPx);
      g.endHole();
    }

    // finish fill.
    g.endFill();
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

  /**
   * Sets the rotation for directional shapes (in radians).
   * @param {number} r The rotation to set.
   */
  setRotation(r)
  {
    // assign the rotation in radians.
    this.rotation = r;
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