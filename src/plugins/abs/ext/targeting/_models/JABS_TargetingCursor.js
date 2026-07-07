//region JABS_TargetingCursor
/**
 * Represents the aiming state for one in-progress targeting session.<br/>
 * Two distinct modes, chosen once at session start based on the skill's `jabsDirect` flag:
 * - **cycle**: a discrete pool of eligible battlers (direct skills) that the player cycles
 *   through; `getSelectedBattler()` is the current pick.
 * - **freeRoam**: a continuous point in world space (non-direct skills), clamped to range.
 */
class JABS_TargetingCursor
{
  /**
   * `'cycle'` or `'freeRoam'`.
   * @type {string}
   */
  #mode = 'freeRoam';

  /**
   * The caster doing the aiming.
   * @type {JABS_Battler}
   */
  #caster = null;

  /**
   * The maximum distance (world/tile units) the cursor may be from the caster.
   * @type {number}
   */
  #range = 0;

  //region cycle mode
  /**
   * The eligible battlers to cycle between, in mode `'cycle'`.
   * @type {JABS_Battler[]}
   */
  #candidates = [];

  /**
   * The index into `#candidates` currently selected, in mode `'cycle'`.
   * @type {number}
   */
  #selectedIndex = 0;
  //endregion cycle mode

  //region freeRoam mode
  /**
   * The cursor's current world X, in mode `'freeRoam'`.
   * @type {number}
   */
  #x = 0;

  /**
   * The cursor's current world Y, in mode `'freeRoam'`.
   * @type {number}
   */
  #y = 0;
  //endregion freeRoam mode

  /**
   * Builds a cycle-mode cursor over the given candidates.
   * @param {JABS_Battler} caster The battler doing the aiming.
   * @param {JABS_Battler[]} candidates The eligible battlers to cycle between.
   * @param {number} range The proximity range the candidates were gathered from.
   * @returns {JABS_TargetingCursor}
   */
  static Cycle(caster, candidates, range)
  {
    const cursor = new JABS_TargetingCursor();
    cursor.#mode = 'cycle';
    cursor.#caster = caster;
    cursor.#candidates = candidates;
    cursor.#range = range;
    return cursor;
  }

  /**
   * Builds a free-roam cursor starting at the caster's own position.
   * @param {JABS_Battler} caster The battler doing the aiming.
   * @param {number} range The maximum distance the cursor may travel from the caster.
   * @returns {JABS_TargetingCursor}
   */
  static FreeRoam(caster, range)
  {
    const cursor = new JABS_TargetingCursor();
    cursor.#mode = 'freeRoam';
    cursor.#caster = caster;
    cursor.#range = range;
    cursor.#x = caster.getX();
    cursor.#y = caster.getY();
    return cursor;
  }

  /**
   * Whether this cursor is in cycle-select mode.
   * @returns {boolean}
   */
  isCycleMode()
  {
    return this.#mode === 'cycle';
  }

  /**
   * Whether this cursor is in free-roam mode.
   * @returns {boolean}
   */
  isFreeRoamMode()
  {
    return this.#mode === 'freeRoam';
  }

  /**
   * Gets the caster doing the aiming.
   * @returns {JABS_Battler}
   */
  getCaster()
  {
    return this.#caster;
  }

  /**
   * Gets the maximum range this cursor may travel/select from the caster.
   * @returns {number}
   */
  getRange()
  {
    return this.#range;
  }

  //region cycle mode
  /**
   * Gets the full eligible candidate pool, in cycle mode.
   * @returns {JABS_Battler[]}
   */
  getCandidates()
  {
    return this.#candidates;
  }

  /**
   * Gets the currently-selected index into the candidate pool, in cycle mode.
   * @returns {number}
   */
  getSelectedIndex()
  {
    return this.#selectedIndex;
  }

  /**
   * Sets the currently-selected index into the candidate pool, in cycle mode.
   * @param {number} index The index to select.
   */
  setSelectedIndex(index)
  {
    this.#selectedIndex = index;
  }

  /**
   * Gets the currently-selected battler, in cycle mode. Null if the candidate pool is empty.
   * @returns {JABS_Battler|null}
   */
  getSelectedBattler()
  {
    return this.#candidates.at(this.#selectedIndex) ?? null;
  }

  /**
   * Steps the current selection to the best-aligned candidate in the given direction, in cycle
   * mode. A no-op if there's nothing to cycle between, or nothing meaningfully lines up with the
   * pressed direction.<br/>
   * Candidates are scored by how well they line up with the pressed direction (higher dot
   * product with the direction vector = more "in that direction"), with distance as a tiebreak,
   * so cycling feels directional rather than jumping to whatever's merely closest.
   * @param {number} dirX Unit-vector X component of the pressed direction.
   * @param {number} dirY Unit-vector Y component of the pressed direction.
   */
  selectTowards(dirX, dirY)
  {
    // nothing to cycle between with zero or one candidate.
    if (this.#candidates.length <= 1) return;

    const current = this.getSelectedBattler();
    let bestIndex = this.#selectedIndex;
    let bestScore = -Infinity;

    this.#candidates.forEach((candidate, index) =>
    {
      // never re-select the currently-selected candidate.
      if (candidate === current) return;

      // measure how far away, and in what direction, this candidate sits from the current pick.
      const candidateDx = candidate.getX() - current.getX();
      const candidateDy = candidate.getY() - current.getY();
      const distance = Math.hypot(candidateDx, candidateDy);
      if (distance === 0) return;

      // require at least some forward alignment with the pressed direction.
      const alignment = ((candidateDx * dirX) + (candidateDy * dirY)) / distance;
      if (alignment <= 0) return;

      // prefer the best-aligned candidate, breaking ties by favoring the closer one.
      const score = alignment - (distance * 0.01);
      if (score > bestScore)
      {
        bestScore = score;
        bestIndex = index;
      }
    });

    this.#selectedIndex = bestIndex;
  }

  /**
   * Steps the current selection forward/backward through the candidate list by raw index,
   * wrapping around at either end, in cycle mode. Unlike {@link #selectTowards}, this never
   * skips a candidate based on directional alignment — every candidate gets a turn.
   * @param {number} delta The number of steps to advance (negative to go backward).
   */
  stepIndex(delta)
  {
    // nothing to cycle between with zero or one candidate.
    if (this.#candidates.length <= 1) return;

    // wrap around at either end rather than clamping.
    const { length } = this.#candidates;
    this.#selectedIndex = ((this.#selectedIndex + delta) % length + length) % length;
  }
  //endregion cycle mode

  //region freeRoam mode
  /**
   * Gets the cursor's current world X, in free-roam mode.
   * @returns {number}
   */
  getX()
  {
    return this.#x;
  }

  /**
   * Gets the cursor's current world Y, in free-roam mode.
   * @returns {number}
   */
  getY()
  {
    return this.#y;
  }

  /**
   * Sets the cursor's current world position, in free-roam mode.
   * @param {number} x The world X.
   * @param {number} y The world Y.
   */
  setPosition(x, y)
  {
    this.#x = x;
    this.#y = y;
  }
  //endregion freeRoam mode
}

export default JABS_TargetingCursor;
//endregion JABS_TargetingCursor
