//region PIXEL_CollisionManager
/**
 * A static manager that builds and serves a subcell collision table per map.
 * It derives all subcell data only from the engine's tile passability.
 * No external plugin references are used.
 */
class PIXEL_CollisionManager
{

  //region properties
  /**
   * Gets the table.
   * @returns {number[]} The table.
   */
  static table()
  {
    // hand back the table.
    return this._table;
  }

  /**
   * Sets the table.
   * @param {number[]} newTable The new table.
   */
  static setTable(newTable)
  {
    // assign the table.
    this._table = newTable;
  }
  //endregion properties

  /**
   * Initializes configuration for collision table density and storage.
   * Reads the step count from J.PIXEL.Metadata if available, otherwise defaults to 4.
   */

  static initConfig()
  {
    // Read the step count from plugin metadata if already initialized.
    const metaCount = (J.PIXEL && J.PIXEL.Metadata)
      ? J.PIXEL.Metadata.CollisionStepCount
      : 4;

    // Define how many subcells per tile axis will be used (1, 2, or 4).
    this.collisionStepCount = metaCount;

    // Precompute the subcell size in tile units.
    this.collisionSize = 1 / this.collisionStepCount;

    // Initialize the subcell table storage.
    this._table = [];
  }

  /**
   * Builds the subcell collision table from the current map.
   * Call on map setup after the map is loaded.
   */
  static setupCollision()
  {
    // Ensure configuration exists before building.
    if (this.collisionStepCount === undefined)
    {
      // Initialize with defaults if not yet configured.
      this.initConfig();
    }

    // If the map or data does not exist, skip building.
    if (!$gameMap || !$dataMap)
    {
      // No data available to build a table.
      return;
    }

    // Compute the width of the subcell grid.
    const subW = $dataMap.width * this.collisionStepCount;

    // Compute the height of the subcell grid.
    const subH = $dataMap.height * this.collisionStepCount;

    // Allocate a new subcell collision table sized to the current map.
    this.setTable(new Array(subW * subH));

    // Load the default passability-derived collision into the subcell table.
    this._loadDefaultCollisionTable();
  }

  /**
   * Populates the subcell collision table using engine tile passability.
   */
  static _loadDefaultCollisionTable()
  {
    // Loop over all integer tiles vertically.
    for (let y = 0; y < $dataMap.height; y++)
    {
      // Loop over all integer tiles horizontally.
      for (let x = 0; x < $dataMap.width; x++)
      {
        // Check whether each adjacent tile can move INTO this tile.
        // A tile that cannot be entered from any direction (e.g. a deny-region tile)
        // must be treated as fully solid so that AABB overlap checks catch it.
        const canEnterFromBelow = $gameMap.isPassable(x, y + 1, J.PIXEL.Directions.UP);
        const canEnterFromAbove = $gameMap.isPassable(x, y - 1, J.PIXEL.Directions.DOWN);
        const canEnterFromLeft  = $gameMap.isPassable(x - 1, y, J.PIXEL.Directions.RIGHT);
        const canEnterFromRight = $gameMap.isPassable(x + 1, y, J.PIXEL.Directions.LEFT);

        const canBeEntered = canEnterFromBelow || canEnterFromAbove || canEnterFromLeft || canEnterFromRight;

        // If this tile is unreachable from every direction, mark it completely solid.
        if (canBeEntered === false)
        {
          this._fillTile(x, y, this.Codes.Solid);
          continue;
        }

        // Determine whether moving down is allowed from this tile.
        const passDown = $gameMap.isPassable(x, y, J.PIXEL.Directions.DOWN);

        // Determine whether moving left is allowed from this tile.
        const passLeft = $gameMap.isPassable(x, y, J.PIXEL.Directions.LEFT);

        // Determine whether moving right is allowed from this tile.
        const passRight = $gameMap.isPassable(x, y, J.PIXEL.Directions.RIGHT);

        // Determine whether moving up is allowed from this tile.
        const passUp = $gameMap.isPassable(x, y, J.PIXEL.Directions.UP);

        // Apply those passabilities to this tile's subcells.
        this._applyTileCollision(x, y, passDown, passLeft, passRight, passUp);
      }
    }
  }

  /**
   * Computes the flattened index into the subcell table for a fractional coordinate.
   * RAW indexer: no global shift applied here. Writers use this (build-time).
   * @param {number} px The fractional x (tile units).
   * @param {number} py The fractional y (tile units).
   * @returns {number} The subcell index.
   */
  static _index(px, py)
  {
    // Acquire the subcell density for this map.
    const step = this.collisionStepCount;

    // Acquire the full subcell dimensions.
    const widthInSub = $gameMap.width() * step;

    // Acquire the full subcell dimensions.
    const heightInSub = $gameMap.height() * step;

    // Convert the fractional tile coordinate into subcell integers (no shift).
    let ix = Math.floor(px * step);

    // Convert the fractional tile coordinate into subcell integers (no shift).
    let iy = Math.floor(py * step);

    // Wrap negative/overflow indices safely into the valid range.
    ix = ((ix % widthInSub) + widthInSub) % widthInSub;
    iy = ((iy % heightInSub) + heightInSub) % heightInSub;

    // Compute the flattened index from the wrapped subcell coordinates.
    return iy * widthInSub + ix;
  }

  /**
   * Writes a collision code into the table at a fractional coordinate.
   * @param {number} px The fractional x (tile units).
   * @param {number} py The fractional y (tile units).
   * @param {number} code The collision code to write.
   */
  static _set(px, py, code)
  {
    // Compute the index into the subcell table.
    const idx = this._index(px, py);

    // Set the code at that index.
    this.table()[idx] = code;
  }

  /**
   * Fills an entire integer tile with a single collision code.
   * @param {number} x The integer tile x.
   * @param {number} y The integer tile y.
   * @param {number} code The collision code to fill with.
   */
  static _fillTile(x, y, code)
  {
    // Compute the subcell increment size.
    const step = this.collisionSize;

    // Iterate the tile's subcolumns.
    for (let subX = x; subX < x + 1; subX += step)
    {
      // Iterate the tile's subrows.
      for (let subY = y; subY < y + 1; subY += step)
      {
        // Assign the code for this subcell.
        this._set(subX, subY, code);
      }
    }
  }

  /**
   * Draws a one-subcell-thick edge line along a tile's boundary.
   * @param {number} x The tile x.
   * @param {number} y The tile y.
   * @param {2|4|6|8} d The boundary direction to draw along.
   * @param {number} code The collision code to write.
   */
  static _drawEdge(x, y, d, code)
  {
    // Capture the subcell size.
    const step = this.collisionSize;

    // If drawing a horizontal edge on top or bottom.
    if (d === J.PIXEL.Directions.DOWN || d === J.PIXEL.Directions.UP)
    {
      // Compute the subrow for bottom or top.
      const subY = (d === J.PIXEL.Directions.DOWN)
        ? (y + 1 - step)
        : y;

      // Iterate across all subcolumns along that row.
      for (let subX = x; subX < x + 1; subX += step)
      {
        // Assign the code for this subcell.
        this._set(subX, subY, code);
      }

      // Stop processing for horizontal edges.
      return;
    }

    // Compute the subcolumn for right or left.
    const subX = (d === J.PIXEL.Directions.RIGHT)
      ? (x + 1 - step)
      : x;

    // Iterate across all subrows along that column.
    for (let subY = y; subY < y + 1; subY += step)
    {
      // Assign the code for this subcell.
      this._set(subX, subY, code);
    }
  }

  /**
   * Places a single corner subcell blocker at the specified tile corner.
   * @param {number} x The tile x.
   * @param {number} y The tile y.
   * @param {4|6} horz The horizontal side (LEFT/RIGHT).
   * @param {2|8} vert The vertical side (DOWN/UP).
   * @param {number} code The collision code to write.
   */
  static _drawCorner(x, y, horz, vert, code)
  {
    // Capture the subcell size.
    const step = this.collisionSize;

    // Compute the subrow for top or bottom.
    const subY = (vert === J.PIXEL.Directions.DOWN)
      ? (y + 1 - step)
      : y;

    // Compute the subcolumn for left or right.
    const subX = (horz === J.PIXEL.Directions.RIGHT)
      ? (x + 1 - step)
      : x;

    // Assign the code for the corner subcell.
    this._set(subX, subY, code);
  }

  /**
   * Applies four direction passabilities to the tile's subcells using codes.
   * @param {number} x The tile x.
   * @param {number} y The tile y.
   * @param {boolean} passDown Whether moving DOWN is allowed from this tile.
   * @param {boolean} passLeft Whether moving LEFT is allowed from this tile.
   * @param {boolean} passRight Whether moving RIGHT is allowed from this tile.
   * @param {boolean} passUp Whether moving UP is allowed from this tile.
   */
  static _applyTileCollision(x, y, passDown, passLeft, passRight, passUp)
  {
    // If all directions are the same, the tile is uniformly open or solid.
    if (passDown === passLeft && passDown === passRight && passDown === passUp)
    {
      // Determine the uniform code for this tile.
      const code = (passDown === true)
        ? this.Codes.Open
        : this.Codes.Solid;

      // Fill the entire tile with that code.
      this._fillTile(x, y, code);

      // Stop processing for uniform tiles.
      return;
    }

    // If using one subcell per tile, merge to a single representative code.
    if (this.collisionStepCount === 1)
    {
      // Merge the edge-block flags into a single code.
      const merged = this._mergeSingleTile(!passUp, !passDown, !passLeft, !passRight);

      // Assign to this tile's single subcell.
      this._set(x, y, merged);

      // Stop processing for single-subcell tiles.
      return;
    }

    // Start by marking the tile as open everywhere.
    this._fillTile(x, y, this.Codes.Open);

    // If left is blocked, draw the left edge line.
    if (passLeft === false)
    {
      // Draw the left boundary as an edge blocker.
      this._drawEdge(x, y, J.PIXEL.Directions.LEFT, this.Codes.EdgeLeft);
    }

    // If right is blocked, draw the right edge line.
    if (passRight === false)
    {
      // Draw the right boundary as an edge blocker.
      this._drawEdge(x, y, J.PIXEL.Directions.RIGHT, this.Codes.EdgeRight);
    }

    // If down is blocked, draw bottom edge and corners as needed.
    if (passDown === false)
    {
      // Draw the bottom boundary as an edge blocker.
      this._drawEdge(x, y, J.PIXEL.Directions.DOWN, this.Codes.EdgeDown);

      // If left is also blocked, draw the bottom-left corner.
      if (passLeft === false)
      {
        // Place a single blocked subcell in the bottom-left corner.
        this._drawCorner(x, y, J.PIXEL.Directions.LEFT, J.PIXEL.Directions.DOWN, this.Codes.CornerBottomLeft);
      }

      // If right is also blocked, draw the bottom-right corner.
      if (passRight === false)
      {
        // Place a single blocked subcell in the bottom-right corner.
        this._drawCorner(x, y, J.PIXEL.Directions.RIGHT, J.PIXEL.Directions.DOWN, this.Codes.CornerBottomRight);
      }
    }

    // If up is blocked, draw top edge and corners as needed.
    if (passUp === false)
    {
      // Draw the top boundary as an edge blocker.
      this._drawEdge(x, y, J.PIXEL.Directions.UP, this.Codes.EdgeUp);

      // If left is also blocked, draw the top-left corner.
      if (passLeft === false)
      {
        // Place a single blocked subcell in the top-left corner.
        this._drawCorner(x, y, J.PIXEL.Directions.LEFT, J.PIXEL.Directions.UP, this.Codes.CornerTopLeft);
      }

      // If right is also blocked, draw the top-right corner.
      if (passRight === false)
      {
        // Place a single blocked subcell in the top-right corner.
        this._drawCorner(x, y, J.PIXEL.Directions.RIGHT, J.PIXEL.Directions.UP, this.Codes.CornerTopRight);
      }
    }
  }

  /**
   * Folds the four blocked-edge booleans into the single number that identifies their combination.
   *
   * Sixteen combinations exist and eleven of them name a tile shape, which is a lookup rather than
   * a decision tree once the four booleans stop being four separate questions.
   * @param {boolean} blockUp Whether the up edge is blocked.
   * @param {boolean} blockDown Whether the down edge is blocked.
   * @param {boolean} blockLeft Whether the left edge is blocked.
   * @param {boolean} blockRight Whether the right edge is blocked.
   * @returns {number} The UDLR bitmask.
   */
  static toEdgeMask(blockUp, blockDown, blockLeft, blockRight)
  {
    const { Up, Down, Left, Right } = this.EdgeBits;
    let mask = 0;

    // each edge contributes its own bit, so the four booleans survive as one addressable number.
    if (blockUp) mask |= Up;
    if (blockDown) mask |= Down;
    if (blockLeft) mask |= Left;
    if (blockRight) mask |= Right;

    return mask;
  }

  /**
   * Merges directional edge blocks into a single code when only one subcell is used.
   * @param {boolean} blockUp Whether the up edge is blocked.
   * @param {boolean} blockDown Whether the down edge is blocked.
   * @param {boolean} blockLeft Whether the left edge is blocked.
   * @param {boolean} blockRight Whether the right edge is blocked.
   * @returns {number} The representative collision code.
   */
  static _mergeSingleTile(blockUp, blockDown, blockLeft, blockRight)
  {
    const mask = this.toEdgeMask(blockUp, blockDown, blockLeft, blockRight);

    // the five unclaimed combinations are the empty one and the four with exactly three edges
    // blocked. No tile shape draws those, and an unclaimed combination is open rather than a fault.
    return this.SingleTileMerges[mask] ?? this.Codes.Open;
  }

  /**
   * Determines if a fractional subcell allows movement in a given direction.
   * Applies the global half-tile grid shift on READS to align with visual seams.
   * @param {number} px The fractional x (tile units).
   * @param {number} py The fractional y (tile units).
   * @param {2|4|6|8} d The entering direction.
   * @returns {boolean} True if passable, false otherwise.
   */
  static isPositionPassable(px, py, d)
  {
    // Apply the global lattice shift only for reads.
    const sx = px + this.GridShiftX;
    const sy = py + this.GridShiftY;

    // Compute integer tile coordinates for bounds check in the shifted frame.
    const tx = Math.floor(sx);

    // Compute integer tile coordinates for bounds check in the shifted frame.
    const ty = Math.floor(sy);

    // If off-map, always block.
    if (tx < 0 || ty < 0 || tx >= $gameMap.width() || ty >= $gameMap.height())
    {
      // Outside the map bounds is impassable.
      return false;
    }

    // Acquire the stored code for this subcell (default to open if empty).
    const code = this.table()[this._index(sx, sy)] || this.Codes.Open;

    const predicate = this.PassagePredicates[code];

    // A code nothing registered a predicate for is one this manager does not know how to block on,
    // and over-blocking strands a player far more visibly than under-blocking lets one clip a wall.
    if (predicate === undefined) return true;

    return predicate(d);
  }
}

/**
 * Attach an enumeration of collision codes to the manager class.
 * These codes represent the logical shape located at a given subcell.
 */
PIXEL_CollisionManager.Codes =
  {
    // A fully open subcell; movement allowed from any direction.
    Open: 1,

    // A fully solid subcell; movement blocked from any direction.
    Solid: 2,

    // A vertical blocking line through the subcell; blocks Up/Down.
    VerticalLine: 4,

    // A horizontal blocking line through the subcell; blocks Left/Right.
    HorizontalLine: 5,

    // A left edge blocker at the leftmost subcolumn of a tile; blocks entering from the LEFT.
    EdgeLeft: 14,

    // A right edge blocker at the rightmost subcolumn of a tile; blocks entering from the RIGHT.
    EdgeRight: 16,

    // A bottom edge blocker at the bottom subrow of a tile; blocks entering from DOWN.
    EdgeDown: 12,

    // A top edge blocker at the top subrow of a tile; blocks entering from UP.
    EdgeUp: 18,

    // A bottom-left corner blocker; a single blocked subcell in that corner.
    CornerBottomLeft: 11,

    // A bottom-right corner blocker; a single blocked subcell in that corner.
    CornerBottomRight: 13,

    // A top-left corner blocker; a single blocked subcell in that corner.
    CornerTopLeft: 17,

    // A top-right corner blocker; a single blocked subcell in that corner.
    CornerTopRight: 19,
  };

/**
 * The bit each blocked edge contributes to a tile's edge mask.
 *
 * Attached beside {@link PIXEL_CollisionManager.Codes} rather than declared in the class body,
 * because {@link PIXEL_CollisionManager.SingleTileMerges} below reads the codes and a static field
 * inside the class would be evaluated before either table exists.
 * @type {{Up: number, Down: number, Left: number, Right: number}}
 */
PIXEL_CollisionManager.EdgeBits =
  {
    Up: 8,
    Down: 4,
    Left: 2,
    Right: 1,
  };

/**
 * The collision code each combination of blocked edges merges into, keyed by edge mask.
 *
 * Eleven of the sixteen combinations name a shape. The five absent ones are the empty mask and the
 * four holding exactly three blocked edges, which no tile shape draws; those fall through to open.
 *
 * A plugin introducing a collision code of its own registers the mask that produces it here, rather
 * than this manager growing a branch per shape somebody else invented.
 * @type {Object<number, number>}
 */
PIXEL_CollisionManager.SingleTileMerges =
  {
    // every edge blocked; nothing gets through.
    15: PIXEL_CollisionManager.Codes.Solid,

    // opposing pairs read as a line through the subcell rather than as two edges.
    12: PIXEL_CollisionManager.Codes.VerticalLine,
    3: PIXEL_CollisionManager.Codes.HorizontalLine,

    // a lone blocked edge is a one-way blocker facing that direction.
    8: PIXEL_CollisionManager.Codes.EdgeUp,
    4: PIXEL_CollisionManager.Codes.EdgeDown,
    2: PIXEL_CollisionManager.Codes.EdgeLeft,
    1: PIXEL_CollisionManager.Codes.EdgeRight,

    // two adjacent edges meet at a corner, which blocks that single subcell outright.
    10: PIXEL_CollisionManager.Codes.CornerTopLeft,
    9: PIXEL_CollisionManager.Codes.CornerTopRight,
    6: PIXEL_CollisionManager.Codes.CornerBottomLeft,
    5: PIXEL_CollisionManager.Codes.CornerBottomRight,
  };

/**
 * The predicates deciding whether a subcell may be entered, keyed by collision code.
 *
 * A predicate receives the entering direction and answers whether the move is allowed. Splitting
 * the decision this way is what lets a plugin add a collision code and teach passability about it
 * from its own tree, instead of every new shape needing another branch in
 * {@link PIXEL_CollisionManager.isPositionPassable}. A code with no predicate is treated as
 * passable there.
 * @type {Object<number, function(number): boolean>}
 */
PIXEL_CollisionManager.PassagePredicates =
  {
    // an open subcell imposes nothing, and a solid one refuses everything.
    [PIXEL_CollisionManager.Codes.Open]: () => true,
    [PIXEL_CollisionManager.Codes.Solid]: () => false,

    // a line blocks the axis it stands across and leaves the other axis alone.
    [PIXEL_CollisionManager.Codes.VerticalLine]: direction => direction !== J.PIXEL.Directions.UP
      && direction !== J.PIXEL.Directions.DOWN,
    [PIXEL_CollisionManager.Codes.HorizontalLine]: direction => direction !== J.PIXEL.Directions.LEFT
      && direction !== J.PIXEL.Directions.RIGHT,

    // an edge blocker refuses only the one direction it faces, so it can be walked off but not onto.
    [PIXEL_CollisionManager.Codes.EdgeLeft]: direction => direction !== J.PIXEL.Directions.LEFT,
    [PIXEL_CollisionManager.Codes.EdgeRight]: direction => direction !== J.PIXEL.Directions.RIGHT,
    [PIXEL_CollisionManager.Codes.EdgeDown]: direction => direction !== J.PIXEL.Directions.DOWN,
    [PIXEL_CollisionManager.Codes.EdgeUp]: direction => direction !== J.PIXEL.Directions.UP,

    // a corner occupies its subcell completely, so the approach direction does not change the answer.
    [PIXEL_CollisionManager.Codes.CornerTopLeft]: () => false,
    [PIXEL_CollisionManager.Codes.CornerTopRight]: () => false,
    [PIXEL_CollisionManager.Codes.CornerBottomLeft]: () => false,
    [PIXEL_CollisionManager.Codes.CornerBottomRight]: () => false,
  };

/**
 * Global collision-lattice shift (in tiles) applied on the X axis inside the indexer.
 * Use +0.5 when character/world coords are edge-based but movement logic expects center alignment.
 * Flip to -0.5 if your incoming sample coords are already center-shifted elsewhere.
 * @type {number}
 */
PIXEL_CollisionManager.GridShiftX = 0;

/**
 * Global collision-lattice shift (in tiles) applied on the Y axis inside the indexer.
 * See GridShiftX for guidance on selecting the sign.
 * @type {number}
 */
PIXEL_CollisionManager.GridShiftY = 0;

export default PIXEL_CollisionManager;
//endregion PIXEL_CollisionManager