//region JABS_Aabb
/**
 * Axis-Aligned Bounding Box for battlers/actions in screen pixels.
 * Provides common geometry helpers used by collision and overlays.
 */
class JABS_Aabb
{
  /**
   * Constructor.
   * @param {number} x The top-left x of the rect.
   * @param {number} y The top-left y of the rect.
   * @param {number} w The width of the rect.
   * @param {number} h The height of the rect.
   */
  constructor(x, y, w, h)
  {
    /**
     * The top-left x coordinate in pixels.
     * @type {number}
     // policy step inside constructor.
     */
    this.x = x;

    // policy step inside constructor.
    /**
     * The top-left y coordinate in pixels.
     * @type {number}
     // policy step inside constructor.
     */
    this.y = y;

    // policy step inside constructor.
    /**
     * The width in pixels.
     * @type {number}
     */
    this.w = w;

    // policy step inside constructor.
    /**
     * The height in pixels.
     * @type {number}
     */
    this.h = h;

    // policy step inside constructor.
    /**
     * The center x coordinate in pixels.
     * @type {number}
     */
    this.cx = x + (w / 2);

    // policy step inside constructor.
    /**
     * The center y coordinate in pixels.
     * @type {number}
     */
    this.cy = y + (h / 2);
  }

  /**
   * Builds an AABB located directly above a feet-origin point.
   * @param {number} feetX Screen-space feet x.
   * @param {number} feetY Screen-space feet y.
   * @param {number} tw Tile width.
   * @param {number} th Tile height.
   * @returns {JABS_Aabb}
   */
  static fromFeet(feetX, feetY, tw, th)
  {
    // left edge half a tile left of feet.
    const x = feetX - (tw / 2);
    // top edge one tile above feet.
    const y = feetY - th;
    return new JABS_Aabb(x, y, tw, th);
  }

  /**
   * Tests intersection between two rectangles.
   * @param {JABS_Aabb} other The other rect.
   * @returns {boolean} True if any overlap occurs.
   */
  intersectsRect(other)
  {
    // axis-aligned rectangle overlap test.
    return !(other.x > (this.x + this.w)
      || (other.x + other.w) < this.x
      || other.y > (this.y + this.h)
      || (other.y + other.h) < this.y);
  }

  /**
   * Tests intersection of this rect vs a circle in screen pixels.
   * @param {number} cx Circle center x.
   * @param {number} cy Circle center y.
   * @param {number} r  Circle radius in pixels.
   * @returns {boolean}
   */
  intersectsCircle(cx, cy, r)
  {
    // find closest point on rect to circle center.
    const closestX = Math.max(this.x, Math.min(cx, this.x + this.w));
    const closestY = Math.max(this.y, Math.min(cy, this.y + this.h));

    // compute distance from circle center to that closest point.
    const dx = cx - closestX;
    const dy = cy - closestY;

    // hit if distance <= radius.
    return (dx * dx + dy * dy) <= (r * r);
  }

  /**
   * Returns a new rect expanded by padding on all sides.
   * @param {number} padX Padding on X per side.
   * @param {number} padY Padding on Y per side.
   * @returns {JABS_Aabb}
   */
  expanded(padX, padY)
  {
    return new JABS_Aabb(this.x - padX, this.y - padY, this.w + (2 * padX), this.h + (2 * padY));
  }

  /**
   * Builds a rect centered at a point with given size.
   * @param {number} cx Center x.
   * @param {number} cy Center y.
   * @param {number} w  Width.
   * @param {number} h  Height.
   * @returns {JABS_Aabb}
   */
  static centerSized(cx, cy, w, h)
  {
    return new JABS_Aabb(cx - (w / 2), cy - (h / 2), w, h);
  }
}

export default JABS_Aabb;
//endregion JABS_Aabb