//region JABS_ActionSpawner
/**
 * The action spawner is responsible for translating projectile directions into
 * fully-formed `JABS_Action` instances, including per-spoke odd/even parallel
 * lane offsets and origin deltas. This remains 8-dir/tile-native.
 */
class JABS_ActionSpawner
{
  /**
   * Builds a collection of `JABS_Action` instances from provided directions.
   * @param {JABS_Battler} caster The battler spawning the actions.
   * @param {number[]} projectileDirections The directions to translate into actions.
   * @param {Game_Action} action The underlying action payload shared by all.
   * @param {JABS_ActionOptions} actionOptions The base options to clone per projectile.
   * @returns {JABS_Action[]} The actions representing this volley.
   */
  static buildVolley(
    caster,
    projectileDirections,
    action,
    actionOptions
  )
  {
    // build a per-direction tally for how many projectiles each spoke will spawn.
    const countsByDir = this.buildProjectileCountsByDirection(projectileDirections);

    // precompute the lateral offset arrays for each direction based on counts.
    const offsetsByDir = this.buildOffsetsByDirection(countsByDir);

    // build all actions from directions using per-spoke offsets.
    const actions = this.buildActionsForDirections(
      caster,
      projectileDirections,
      action,
      actionOptions,
      offsetsByDir
    );

    // return the full collection of actions for this volley.
    return actions;
  }

  /**
   * Builds a map of total projectiles to spawn per direction.
   * @param {number[]} projectileDirections The flat list of directions to spawn.
   * @returns {Object.<number, number>} A map of `dir -> count`.
   */
  static buildProjectileCountsByDirection(projectileDirections)
  {
    // initialize the per-direction counts.
    /**
     * @type {Object.<number, number>}
     */
    const totalByDir = {};

    // iterate over all projectile directions.
    projectileDirections.forEach(dir =>
    {
      // initialize the count for this direction if not present.
      if (totalByDir[dir] === undefined)
      {
        // start the count at zero.
        totalByDir[dir] = 0;
      }

      // increment the count for this direction.
      totalByDir[dir]++;
    });

    // return the computed per-direction totals.
    return totalByDir;
  }

  /**
   * Precomputes offset arrays for each direction based on how many projectiles that spoke has.
   * @param {Object.<number, number>} countsByDir The per-direction counts.
   * @returns {Object.<number, number[]>} A map of `dir -> [offsets...]`.
   */
  static buildOffsetsByDirection(countsByDir)
  {
    // initialize the per-direction offsets.
    /**
     * @type {Object.<number, number[]>}
     */
    const offsetsByDir = {};

    // iterate over the directions present.
    Object.keys(countsByDir)
      .forEach(key =>
      {
        // parse the numeric direction from the key.
        const dir = Number(key);

        // compute the offsets for this direction based on its count.
        offsetsByDir[dir] = this.buildOffsets(countsByDir[dir]);
      }, this);

    // return the computed per-direction offsets.
    return offsetsByDir;
  }

  /**
   * Builds the lateral-offset series for any N using odd/even rules, in tile units.
   * Odd N:  [0, +1, -1, +2, -2, ...]
   * Even N: [-0.5, +0.5, -1.5, +1.5, ...]
   * @param {number} projectileCount The number of parallel projectiles in a spoke.
   * @returns {number[]} The sequence of lateral offsets.
   */
  static buildOffsets(projectileCount = 1)
  {
    // initialize the collection of offsets.
    const offsets = [];

    // check if the count is odd.
    if ((projectileCount % 2) === 1)
    {
      // add the centered lane first.
      offsets.push(0);

      // calculate how many pairs are needed.
      const pairs = (projectileCount - 1) / 2;

      // add symmetric integer lanes outward from center.
      for (let i = 1; i <= pairs; i++)
      {
        // add the positive then negative to alternate sides.
        offsets.push(i);
        offsets.push(-i);
      }

      // return the constructed offsets.
      return offsets;
    }

    // for even counts, build half-tile spaced pairs outward.
    const pairs = projectileCount / 2;

    // iterate for each pair of lanes.
    for (let i = 0; i < pairs; i++)
    {
      // compute the base offset at a half-tile plus i tiles.
      const halfStep = i + 0.5;

      // push the negative then positive to keep symmetry about center.
      offsets.push(-halfStep);
      offsets.push(halfStep);
    }

    // return the constructed offsets.
    return offsets;
  }

  /**
   * Translates a lateral offset (in tiles) into an [dx, dy] spawn delta for a given 8-dir facing.
   * @param {number} facing The spoke direction (2/4/6/8 or 1/3/7/9 for diagonals).
   * @param {number} lateral The lateral offset in tiles (may be fractional).
   * @returns {[number, number]} The [dx, dy] pair to add to origin.
   */
  static offsetToDelta(facing, lateral)
  {
    // default to no offset.
    let dx = 0;
    let dy = 0;

    // determine the perpendicular axis based on facing.
    if (facing === J.ABS.Directions.UP || facing === J.ABS.Directions.DOWN)
    {
      // vertical spokes shift along x.
      dx = lateral;
    }
    else if (facing === J.ABS.Directions.LEFT || facing === J.ABS.Directions.RIGHT)
    {
      // horizontal spokes shift along y.
      dy = lateral;
    }
    else if (facing === J.ABS.Directions.UPPERRIGHT || facing === J.ABS.Directions.LOWERLEFT)
    {
      // UR/DL diagonal spokes shift along the (1,1) perpendicular.
      dx = lateral;
      dy = lateral;
    }
    else if (facing === J.ABS.Directions.UPPERLEFT || facing === J.ABS.Directions.LOWERRIGHT)
    {
      // UL/DR diagonal spokes shift along the (1,-1) perpendicular.
      dx = lateral;
      dy = -lateral;
    }

    // return the computed delta as a tuple.
    return [ dx, dy ];
  }

  /**
   * Builds a collection of `JABS_Action` instances for a list of directions using per-spoke offsets.
   * @param {JABS_Battler} caster The battler spawning the actions.
   * @param {number[]} projectileDirections The flat list of directions to translate into actions.
   * @param {Game_Action} action The game action payload shared across projectiles.
   * @param {JABS_ActionOptions} actionOptions The base options to clone per projectile.
   * @param {Object.<number, number[]>} offsetsByDir The per-direction lateral offsets array.
   * @returns {JABS_Action[]} The built actions.
   */
  static buildActionsForDirections(
    caster,
    projectileDirections,
    action,
    actionOptions,
    offsetsByDir
  )
  {
    // track how many offsets have been consumed per direction.
    /**
     * @type {Object.<number, number>}
     */
    const usedIndexByDir = {};

    // a mapping function to build one action for a projectile in a specific direction.
    const mapper = (
      projectileDirection
    ) =>
    {
      // initialize how many have been used for this direction.
      if (usedIndexByDir[projectileDirection] === undefined)
      {
        // set the used index to zero.
        usedIndexByDir[projectileDirection] = 0;
      }

      // capture the index within this spoke for offset picking.
      const spokeIndex = usedIndexByDir[projectileDirection];

      // increment usage for this direction for the next projectile.
      usedIndexByDir[projectileDirection]++;

      // derive the lateral offset for this specific projectile in this spoke.
      const lateral = (offsetsByDir[projectileDirection] && offsetsByDir[projectileDirection][spokeIndex]) || 0;

      // translate lateral offset into dx/dy for the given facing.
      const delta = this.offsetToDelta(projectileDirection, lateral);

      // clone/compose a new options instance per projectile, storing only the lateral delta.
      // the absolute spawn position is resolved at fire time by applying this offset to the
      // caster's current coordinates in JABS_Engine.buildActionEventData.
      const perActionOptions = JABS_ActionOptions.Builder()
        .setIsRetaliation(actionOptions.isActionRetaliation())
        .setCooldownKey(actionOptions.getCooldownKey())
        .setSpawnOffset(delta[0], delta[1])
        .setIsTerrainDamage(actionOptions.isTerrainDamage())
        .setProjectileTravelAngleDegrees(actionOptions.getProjectileTravelAngleDegrees())
        .build();

      // build and return the action bound to this projectile's setup.
      return JABS_Action.Builder()
        .setCaster(caster)
        .setGameAction(action)
        .setInitialDirection(projectileDirection)
        .setActionOptions(perActionOptions)
        .build();
    };

    // map directions to fully built actions with per-spoke offsets.
    const actions = projectileDirections.map(mapper, this);

    // return the built actions.
    return actions;
  }
}
//endregion JABS_ActionSpawner
