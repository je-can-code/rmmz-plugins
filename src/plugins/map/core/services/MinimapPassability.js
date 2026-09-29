//region MinimapPassability
/**
 * Which edges of each tile on the current map a step can be taken across.
 *
 * Every answer comes from {@link Game_Map#isPassable} rather than from the tileset's flags. Other
 * plugins alias passability to add rules of their own- J-Regions seals denied terrain tags and
 * region ids that way- and flags read directly would draw everything those rules close off as
 * open floor.
 */
class MinimapPassability
{
  /**
   * The blocked-edge mask of a tile that cannot be stepped onto or off of from any side.
   *
   * Masks share the engine's tileset layout: 0x01 down, 0x02 left, 0x04 right, 0x08 up.
   * @type {number}
   */
  static ImpassableMask = 0x0f;

  /**
   * The four directions a step can be taken in, in numpad notation: down, left, right, up.
   * @type {number[]}
   */
  static Directions = [ 2, 4, 6, 8 ];

  /**
   * The map width, in tiles, when the snapshot was taken.
   * @type {number}
   */
  #width = 0;

  /**
   * The exits the engine allowed out of every tile, one byte of direction bits per tile, row-major.
   * @type {Uint8Array}
   */
  #exits = new Uint8Array(0);

  /**
   * Takes the snapshot, asking the engine about each tile's four exits exactly once.
   */
  constructor()
  {
    // the snapshot covers the map exactly as it stands right now.
    this.#width = $gameMap.width();
    const tileCount = this.#width * $gameMap.height();

    // ask up front rather than per question: a looping map draws its cache up to nine times over and
    // every focus toggle rebuilds it, but none of that can change the answers.
    this.#exits = Uint8Array.from({ length: tileCount }, (_, index) => this.#exitsAtIndex(index));
  }

  /**
   * The bit a direction occupies in an exit or blocked-edge mask.
   * @param {number} direction The direction, in numpad notation.
   * @returns {number}
   */
  static #directionBit(direction)
  {
    // the engine's own mapping, as used by Game_Map#isPassable.
    return 1 << ((direction / 2) - 1);
  }

  /**
   * Asks the engine which ways a step may leave the tile at a snapshot index.
   * @param {number} index The tile's row-major position in the snapshot.
   * @returns {number}
   */
  #exitsAtIndex(index)
  {
    // unfold the row-major index back into the tile it stands for.
    const x = index % this.#width;
    const y = Math.floor(index / this.#width);

    // one bit for every direction the engine allows a step out in.
    return MinimapPassability.Directions.reduce((exits, direction) =>
    {
      // a direction the engine refuses adds nothing.
      if ($gameMap.isPassable(x, y, direction) === false) return exits;

      // any other direction is a way out.
      return exits | MinimapPassability.#directionBit(direction);
    }, 0);
  }

  /**
   * Whether the engine allowed a step out of a tile in a direction.
   * @param {number} x The tile's x coordinate.
   * @param {number} y The tile's y coordinate.
   * @param {number} direction The direction of the step, in numpad notation.
   * @returns {boolean}
   */
  #canLeave(x, y, direction)
  {
    // find the tile's exits in the row-major snapshot.
    const exits = this.#exits[(y * this.#width) + x];

    // the step is allowed when that direction's bit is set.
    return (exits & MinimapPassability.#directionBit(direction)) !== 0;
  }

  /**
   * Whether a step can be taken from a tile across one of its edges.
   *
   * Both tiles have to agree to it, exactly as they do for the engine's own movement check: the tile
   * being left must allow the exit, and the tile being entered must allow the step back.
   * @param {number} x The x coordinate of the tile being left.
   * @param {number} y The y coordinate of the tile being left.
   * @param {number} direction The direction of the step, in numpad notation.
   * @returns {boolean}
   */
  canCross(x, y, direction)
  {
    // let the engine find the neighbor, so a looping map wraps around its seam.
    const nextX = $gameMap.roundXWithDirection(x, direction);
    const nextY = $gameMap.roundYWithDirection(y, direction);

    // stepping off the edge of a map that does not loop is never a step; the snapshot has no row
    // beyond an edge, and a row-major read past one would land on a tile of the next row instead.
    if ($gameMap.isValid(nextX, nextY) === false) return false;

    // the tile being left has to allow the exit.
    if (this.#canLeave(x, y, direction) === false) return false;

    // opposite directions in numpad notation always sum to ten.
    const reverseDirection = 10 - direction;

    // and the tile being entered has to allow the step back.
    return this.#canLeave(nextX, nextY, reverseDirection);
  }

  /**
   * Which edges of a tile a step cannot be taken across, as direction bits.
   * @param {number} x The tile's x coordinate.
   * @param {number} y The tile's y coordinate.
   * @returns {number}
   */
  blockedMask(x, y)
  {
    // one bit for every edge that stops a step.
    return MinimapPassability.Directions.reduce((mask, direction) =>
    {
      // an edge that can be crossed adds nothing.
      if (this.canCross(x, y, direction) === true) return mask;

      // any other edge is a wall.
      return mask | MinimapPassability.#directionBit(direction);
    }, 0);
  }

  /**
   * Whether a tile has no edge a step can be taken across.
   *
   * Nothing can walk onto or off of such a tile, so it is drawn solid rather than as a square of
   * floor boxed in by walls.
   * @param {number} x The tile's x coordinate.
   * @param {number} y The tile's y coordinate.
   * @returns {boolean}
   */
  isImpassable(x, y)
  {
    // every edge blocked leaves no floor to speak of.
    return this.blockedMask(x, y) === MinimapPassability.ImpassableMask;
  }
}

export default MinimapPassability;
//endregion MinimapPassability