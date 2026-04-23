//region Sprite_HitboxPulse
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
    this._age = 0;           // current frame
    this._duration = 18;     // total frames

    // visual alpha curve.
    this._startAlpha = 0.22;
    this._endAlpha = 0.0;

    // scale pulse curve.
    this._scaleStart = 1.00;
    this._scaleEnd = 1.08;

    // base style components.
    this._lineColor = 0xFFFFFF;
    this._lineAlpha = 0.85;
    this._lineWidth = 2;
    this._fillColor = 0xFFFFFF;
    this._fillAlpha = 0.18;
    this._blendMode = PIXI.BLEND_MODES.ADD;

    // geometry settings.
    this._shape = J.ABS.Shapes.Circle;
    this._range = 1;         // in tiles
    this._degrees = 180;     // for Arc shape
    this._thickness = 1;     // for Line/Wall width (tiles)

    // snap transforms.
    this.rotation = 0;
    this.alpha = 1.0;
    this.scale.set(1.0, 1.0);

    // clear old geometry.
    this._graphics.clear();
  }

  /**
   * Sets up geometry and visuals from merged options.
   */
  setup(opts)
  {
    // cache the duration and curves.
    this._duration = Math.max(1, opts.duration);
    this._startAlpha = opts.startAlpha;
    this._endAlpha = opts.endAlpha;
    this._scaleStart = opts.scaleStart;
    this._scaleEnd = opts.scaleEnd;

    // cache style.
    this._lineColor = opts.lineColor;
    this._lineAlpha = opts.lineAlpha;
    this._lineWidth = opts.lineWidth;
    this._fillColor = opts.fillColor;
    this._fillAlpha = opts.fillAlpha;
    this._blendMode = opts.blendMode;

    // cache geometry.
    this._shape = opts.shape;
    this._range = Math.max(0, opts.range);
    this._degrees = opts.degrees !== undefined
      ? opts.degrees
      : 180;
    this._thickness = opts.thickness !== undefined
      ? Math.max(0, opts.thickness)
      : 1;

    // set blend.
    this.blendMode = this._blendMode;

    // draw the geometry now (static path; only alpha/scale animates per frame).
    this.drawGeometry();
  }

  //endregion lifecycle

  //region geometry
  /**
   * Draws the static geometry path according to the shape and style.
   */
  drawGeometry()
  {
    // clear previous path.
    const g = this._graphics;
    g.clear();

    // apply outline and fill.
    g.lineStyle(this._lineWidth, this._lineColor, this._lineAlpha);
    g.beginFill(this._fillColor, this._fillAlpha);

    // convert tiles→pixels for sizes using current map tile size.
    const tile = $gameMap.tileWidth();

    // resolve per-shape drawing.
    switch (this._shape)
    {
      case J.ABS.Shapes.Circle:
      {
        // compute world-space pixel radius.
        const r = this._range * tile;

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
        const half = this._range * tile;
        g.drawRect(-half, -half, half * 2, half * 2);
        break;
      }

      case J.ABS.Shapes.Line:
      {
        // a rectangle extending forward from origin by `range` with thickness.
        const length = this._range * tile;
        const thick = Math.max(1, this._thickness * tile);
        g.drawRect(0, -thick * 0.5, length, thick);
        break;
      }

      case J.ABS.Shapes.Arc:
      default:
      {
        // draw a sector (wedge) oriented along +X (we rotate the sprite externally).
        const r = this._range * tile;
        const deg = Math.max(0, Math.min(360, this._degrees));
        const rad = deg * Math.PI / 180;
        const startAngle = -rad / 2;  // symmetric about +X axis
        const endAngle = rad / 2;

        // move to origin and arc outward with a polygonal fan for a crisp edge.
        g.moveTo(0, 0);

        // sample the arc with a reasonable step for smoothness; ~1 sample per 8°.
        const steps = Math.max(2, Math.ceil(deg / 8));
        for (let i = 0; i <= steps; i++)
        {
          // interpolate angle across the wedge.
          const t = i / steps;
          const a = startAngle + (endAngle - startAngle) * t;

          // compute the rim point.
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r;
          g.lineTo(px, py);
        }

        // close back to origin.
        g.lineTo(0, 0);
        break;
      }
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
    // increment age.
    this._age++;

    // compute progress 0..1.
    const t = Math.min(1, this._age / this._duration);

    // interpolate alpha and scale.
    const a = this._startAlpha + (this._endAlpha - this._startAlpha) * t;
    const s = this._scaleStart + (this._scaleEnd - this._scaleStart) * t;

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
    // report if this pulse has reached or exceeded its lifetime.
    return this._age >= this._duration;
  }

  //endregion update
}

//endregion Sprite_HitboxPulse