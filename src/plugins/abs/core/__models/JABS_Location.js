//region JABS_Location
/**
 * A class representing the location of a JABS entity.
 */
class JABS_Location
{
  /**
   * The X coordinate of this location.
   * @type {null|number}
   */
  x = null;

  /**
   * The Y coordinate of this location.
   * @type {null|number}
   */
  y = null;

  /**
   * The direction of the entity at this location.
   * @type {number}
   */
  d = 5;

  /**
   * Constructor.
   * @param {number=} x The X coordinate.
   * @param {number=} y The Y coordinate.
   * @param {1|2|3|4|6|7|8|9=} d The numpad direction.
   */
  constructor(x = null, y = null, d = null)
  {
    this.x = x;
    this.y = y;
    this.d = d;
  }

  /**
   * Create a new instance with the same location values as another instance.
   * @param {JABS_Location} sourceLocation The source location to copy the values of.
   * @returns {JABS_Location} A new instance of the same location.
   */
  static Clone = sourceLocation => new JABS_Location(sourceLocation?.x, sourceLocation?.y, sourceLocation?.d);

  /**
   * A factory that generates builders for creating {@link JABS_Location}s.
   * @type {JABS_LocationBuilder}
   */
  static Builder = () => new JABS_LocationBuilder();
}

//endregion JABS_Location