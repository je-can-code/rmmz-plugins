//region FilterCycle
/**
 * An ordered ring of filter positions with a cursor, driving the L2/R2 tab strip above a filterable list.
 *
 * This is deliberately the dumbest possible thing that can hold a cycle: it owns an order and an index and
 * nothing else. It does not know what a position means, where the positions came from, or whether any of
 * them would produce an empty list- because the two scenes that already do this disagree about that last
 * one on purpose. SDP omits families the actor has no panels in, so a filter over your own things can never
 * dead-end; the study shop deliberately steps onto empty shelves, because a shoulder button that sometimes
 * moves one place and sometimes three reads as broken, and an empty shelf says "come back later" rather
 * than "this does not exist". Both are right for their scene, so the choice lives at the call site that
 * builds the positions, and this class holds no opinion at all.
 */
class FilterCycle
{
  /**
   * The reserved key for the position that matches everything.
   * @type {string}
   */
  static ALL = '__all__';

  /**
   * The reserved key for the position collecting entries that resolve to no other position.
   * @type {string}
   */
  static UNKNOWN = '__unknown__';

  /**
   * The position handed back when the cycle holds nothing, so callers never receive null.
   * @type {{key: string, name: string, iconIndex: number}}
   */
  static EMPTY_POSITION = Object.freeze({
    key: FilterCycle.ALL,
    name: String.empty,
    iconIndex: 0,
  });

  /**
   * The ordered positions this cycle walks.
   * @type {Array<{key: string, name: string, iconIndex: number}>}
   */
  #positions = [];

  /**
   * The index into {@link #positions} currently selected.
   * @type {number}
   */
  #index = 0;

  /**
   * @constructor
   * @param {Array<{key: string, name: string, iconIndex: number}>=} positions The positions to start with.
   */
  constructor(positions = [])
  {
    this.setPositions(positions);
  }

  /**
   * Replaces the positions this cycle walks.
   *
   * The active key is preserved across a rebuild whenever it still exists, because the positions get rebuilt
   * for reasons that have nothing to do with the player- switching party member, learning a recipe- and
   * silently moving the tab out from under them on an unrelated event reads as the menu losing its place.
   * @param {Array<{key: string, name: string, iconIndex: number}>} positions The positions driving this step.
   */
  setPositions(positions)
  {
    const previousKey = this.activeKey();

    this.#positions = positions;

    const survivingIndex = positions.findIndex(position => position.key === previousKey);

    // a key that did not survive the rebuild falls back to the front rather than to a stale index.
    this.#index = survivingIndex === -1
      ? 0
      : survivingIndex;
  }

  /**
   * The positions this cycle is currently walking.
   * @returns {Array<{key: string, name: string, iconIndex: number}>}
   */
  positions()
  {
    return this.#positions;
  }

  /**
   * Whether there is anywhere to move to.
   *
   * A single position is not a cycle- pressing the shoulder button would land you exactly where you already
   * are, so the caller buzzes instead of pretending something happened.
   * @returns {boolean}
   */
  canCycle()
  {
    return this.#positions.length > 1;
  }

  /**
   * The position currently selected, or {@link FilterCycle.EMPTY_POSITION} when the cycle holds nothing.
   * @returns {{key: string, name: string, iconIndex: number}}
   */
  activePosition()
  {
    if (this.#positions.length === 0)
    {
      return FilterCycle.EMPTY_POSITION;
    }

    return this.#positions.at(this.#index);
  }

  /**
   * The key of the position currently selected.
   *
   * An empty cycle answers {@link FilterCycle.ALL}, so a list asked to filter by it shows everything rather
   * than nothing- an unbuilt cycle should never look like a filter that excluded every row.
   * @returns {string}
   */
  activeKey()
  {
    return this.activePosition().key;
  }

  /**
   * Moves the cursor forward one place, wrapping past the end.
   */
  next()
  {
    this.#step(1);
  }

  /**
   * Moves the cursor back one place, wrapping past the front.
   */
  previous()
  {
    this.#step(-1);
  }

  /**
   * Walks the cursor by a number of places, wrapping in either direction.
   *
   * A single position needs no special case: the wrap arithmetic already lands back on index 0. Only the
   * empty ring is worth naming, because a modulo by zero would poison the index rather than clamp it.
   * @param {number} step How many places to move, which may be negative.
   */
  #step(step)
  {
    const total = this.#positions.length;

    if (total === 0) return;

    this.#index = (this.#index + step + total) % total;
  }
}

export default FilterCycle;
//endregion FilterCycle