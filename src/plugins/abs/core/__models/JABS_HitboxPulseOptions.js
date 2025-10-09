//region JABS_HitboxPulseOptions
/**
 * Encapsulates all parameters for a transient hitbox pulse visualization.
 * Provides defaults, fluent setters, cloning, and normalization.
 */
class JABS_HitboxPulseOptions
{
  /**
   * Builds a new options object with default visuals and unset geometry.
   * @returns {JABS_HitboxPulseOptions}
   */
  static defaults()
  {
    // create a new instance.
    const o = new JABS_HitboxPulseOptions();

    // geometry (to be set by caller).
    o.x = 0;
    o.y = 0;
    o.shape = J.ABS.Shapes.Circle;
    o.range = 1;
    o.facing = 2;
    o.degrees = 180;
    o.thickness = 1;

    // visuals/lifetime.
    o.duration = 60;
    o.startAlpha = 0.20;
    o.endAlpha = 0.00;
    o.scaleStart = 1.00;
    o.scaleEnd = 1.08;
    o.lineColor = 0xFFFFFF;
    o.lineAlpha = 0.85;
    o.lineWidth = 2;
    o.fillColor = 0xFFFFFF;
    o.fillAlpha = 0.18;
    o.blendMode = PIXI.BLEND_MODES.ADD;

    // return the new instance.
    return o;
  }

  /**
   * Creates a shallow clone of this options object.
   * @returns {JABS_HitboxPulseOptions}
   */
  clone()
  {
    // create the new instance.
    const c = new JABS_HitboxPulseOptions();

    // copy all fields.
    Object.assign(c, this);

    // return the cloned copy.
    return c;
  }

  /**
   * Applies provided partial fields onto this options object.
   * @param {Partial<JABS_HitboxPulseOptions>} patch The partial fields to apply.
   * @returns {JABS_HitboxPulseOptions}
   */
  apply(patch)
  {
    // guard against nothing provided.
    if (!patch) return this;

    // merge fields from the provided patch.
    Object.assign(this, patch);

    // return for chaining.
    return this;
  }

  /**
   * Builds a plain object representation consumable by sprites.
   */
  toPlain()
  {
    // return the plain object for consumers that expect a literal.
    return {
      x: this.x,
      y: this.y,
      shape: this.shape,
      range: this.range,
      facing: this.facing,
      degrees: this.degrees,
      thickness: this.thickness,
      duration: this.duration,
      startAlpha: this.startAlpha,
      endAlpha: this.endAlpha,
      scaleStart: this.scaleStart,
      scaleEnd: this.scaleEnd,
      lineColor: this.lineColor,
      lineAlpha: this.lineAlpha,
      lineWidth: this.lineWidth,
      fillColor: this.fillColor,
      fillAlpha: this.fillAlpha,
      blendMode: this.blendMode,
    };
  }

  /**
   * Fluent: sets the origin position.
   * @param {number} x The world x.
   * @param {number} y The world y.
   * @returns {JABS_HitboxPulseOptions}
   */
  withOrigin(x, y)
  {
    // assign x/y.
    this.x = x;
    this.y = y;

    // allow chaining.
    return this;
  }

  /**
   * Fluent: sets the shape.
   * @param {string} shape The shape name (see J.ABS.Shapes).
   * @returns {JABS_HitboxPulseOptions}
   */
  withShape(shape)
  {
    // assign the shape.
    this.shape = shape;

    // allow chaining.
    return this;
  }

  /**
   * Fluent: sets the radial/extent range in tiles.
   * @param {number} range The range.
   * @returns {JABS_HitboxPulseOptions}
   */
  withRange(range)
  {
    // assign the range.
    this.range = range;

    // allow chaining.
    return this;
  }

  /**
   * Fluent: sets the facing.
   * @param {number} facing The numeric direction (2/4/6/8 and diagonals).
   * @returns {JABS_HitboxPulseOptions}
   */
  withFacing(facing)
  {
    // assign the facing.
    this.facing = facing;

    // allow chaining.
    return this;
  }

  /**
   * Fluent: sets sector degrees for Arc shapes.
   * @param {number} degrees The degrees (0-360).
   * @returns {JABS_HitboxPulseOptions}
   */
  withDegrees(degrees)
  {
    // assign the degrees.
    this.degrees = degrees;

    // allow chaining.
    return this;
  }

  /**
   * Fluent: sets thickness for Line/Wall shapes.
   * @param {number} tiles The thickness in tiles.
   * @returns {JABS_HitboxPulseOptions}
   */
  withThickness(tiles)
  {
    // assign the thickness.
    this.thickness = tiles;

    // allow chaining.
    return this;
  }

  /**
   * Fluent: overrides duration and fade curve.
   * @param {number} duration The lifetime in frames.
   * @param {number} startAlpha The starting alpha.
   * @param {number} endAlpha The ending alpha.
   * @returns {JABS_HitboxPulseOptions}
   */
  withFade(duration, startAlpha, endAlpha)
  {
    // assign the fade/lifetime parameters.
    this.duration = duration;
    this.startAlpha = startAlpha;
    this.endAlpha = endAlpha;

    // allow chaining.
    return this;
  }

  /**
   * Fluent: overrides scale pulse curve.
   * @param {number} start The starting uniform scale.
   * @param {number} end The ending uniform scale.
   * @returns {JABS_HitboxPulseOptions}
   */
  withScale(start, end)
  {
    // assign the scale parameters.
    this.scaleStart = start;
    this.scaleEnd = end;

    // allow chaining.
    return this;
  }

  /**
   * Fluent: overrides outline style.
   * @param {number} color The outline color.
   * @param {number} alpha The outline alpha.
   * @param {number} width The outline width.
   * @returns {JABS_HitboxPulseOptions}
   */
  withLine(color, alpha, width)
  {
    // assign the outline properties.
    this.lineColor = color;
    this.lineAlpha = alpha;
    this.lineWidth = width;

    // allow chaining.
    return this;
  }

  /**
   * Fluent: overrides fill style.
   * @param {number} color The fill color.
   * @param {number} alpha The fill alpha.
   * @returns {JABS_HitboxPulseOptions}
   */
  withFill(color, alpha)
  {
    // assign the fill properties.
    this.fillColor = color;
    this.fillAlpha = alpha;

    // allow chaining.
    return this;
  }

  /**
   * Fluent: overrides blend mode.
   * @param {number} mode The PIXI blend mode.
   * @returns {JABS_HitboxPulseOptions}
   */
  withBlendMode(mode)
  {
    // assign the blend mode.
    this.blendMode = mode;

    // allow chaining.
    return this;
  }

  /**
   * Creates an options instance from either a plain object or an instance.
   * @param {JABS_HitboxPulseOptions|Partial<JABS_HitboxPulseOptions>} data The source data.
   * @param {JABS_HitboxPulseOptions=} base Optional base options to start from.
   * @returns {JABS_HitboxPulseOptions}
   */
  static from(data, base)
  {
    // if already an instance, clone it to de-couple from caller.
    if (data instanceof JABS_HitboxPulseOptions) return data.clone();

    // derive a base to apply changes on.
    const seed = base
      ? base.clone()
      : JABS_HitboxPulseOptions.defaults();

    // apply partial fields when provided.
    return seed.apply(data || {});
  }
}

//endregion JABS_HitboxPulseOptions