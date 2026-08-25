//region JABS_FoodChainPlan
import JABS_FoodChainSegment from './JABS_FoodChainSegment.js';

/**
 * Represents the pre-walked arc of a single food chain, built once at boot for every
 * distinct food group type found in the state database.
 *
 * Instances are stored in a static registry keyed by the lowercase chain type string
 * (e.g. 'protein', 'vegetable', 'overstuffed'). Retrieve a plan at runtime via
 * {@link JABS_FoodChainPlan.forChainType} rather than constructing one directly.
 *
 * The HUD reads this plan to paint the bar and label the phases without re-walking
 * the database every frame.
 */
class JABS_FoodChainPlan
{
  //region static registry
  /**
   * The boot-time registry of all known food chain plans.
   * Keyed by lowercase chain type string; values are fully-built plan instances.
   * Populated once by {@link JABS_FoodChainPlan.buildRegistry} and never mutated
   * afterward.
   * @type {Map<string, JABS_FoodChainPlan>}
   */
  static _registry = new Map();

  /**
   * Builds the complete registry of food chain plans by scanning {@code $dataStates}.
   * Must be called exactly once, from {@code Scene_Boot.prototype.start}, after the
   * database has finished loading.
   *
   * Algorithm:
   *   1. Collect all state ids that carry {@code <foodChain:TYPE>}.
   *   2. From those, identify which ids are referenced by another food-chain state's
   *      {@code applyStateOnExpire} link — these are mid-chain or tail nodes.
   *   3. Entry states = food-chain states NOT referenced by any other food-chain state.
   *   4. Walk from each entry state to produce an ordered {@link JABS_FoodChainSegment}
   *      array, enforcing type consistency and detecting cycles.
   *   5. Store the resulting {@link JABS_FoodChainPlan} keyed by chain type.
   *
   * Throws an {@link Error} immediately if:
   *   - a cycle is detected in any chain walk, or
   *   - two entry states claim the same chain type (duplicate authoring error).
   */
  static buildRegistry()
  {
    // reset the registry to support hot-reloads without stale data.
    JABS_FoodChainPlan._registry.clear();

    // gather all valid state ids that belong to a food chain.
    const foodChainStateIds = $dataStates
      .filter(state => state && state.id > 0 && state.jabsFoodChainType !== null)
      .map(state => state.id);

    // collect all state ids pointed to by another food-chain state's expire link.
    // those ids are NOT entry states — something points to them.
    const referencedIds = new Set();
    for (const id of foodChainStateIds)
    {
      const expireData = $dataStates[id].jabsApplyStateOnExpire;
      if (expireData !== null && expireData !== undefined)
      {
        referencedIds.add(expireData.stateId);
      }
    }

    // entry states are food-chain states that no other food-chain state points to.
    const entryStateIds = foodChainStateIds.filter(id => !referencedIds.has(id));

    // walk from each entry state and register the resulting plan.
    for (const entryId of entryStateIds)
    {
      const plan = JABS_FoodChainPlan._walkChain(entryId);
      const chainType = $dataStates[entryId].jabsFoodChainType;

      // two entry states claiming the same type is an authoring error — throw immediately.
      if (JABS_FoodChainPlan._registry.has(chainType))
      {
        const existingEntryId = JABS_FoodChainPlan._registry.get(chainType).getEntry().stateId;
        throw new Error(
          `J-ABS-FOOD: Duplicate food chain type '${chainType}' detected. ` +
          `States ${existingEntryId} and ${entryId} both claim to be the entry for '${chainType}'. ` +
          `Each chain type must have exactly one entry state in the database.`
        );
      }

      JABS_FoodChainPlan._registry.set(chainType, plan);
    }
  }

  /**
   * Returns the pre-built {@link JABS_FoodChainPlan} for the given chain type key.
   * The registry must have been built by {@link JABS_FoodChainPlan.buildRegistry}
   * before this is called.
   * @param {string} typeKey The lowercase chain type string (e.g. 'protein').
   * @returns {JABS_FoodChainPlan|null} The plan, or null if the type is not registered.
   */
  static forChainType(typeKey)
  {
    return JABS_FoodChainPlan._registry.get(typeKey) ?? null;
  }

  /**
   * Walks the natural-expiry chain starting at the given entry state id, producing an
   * ordered {@link JABS_FoodChainSegment} array.
   *
   * Walk rules:
   *   - Each visited state must carry {@code <foodChain:TYPE>}; a linked state without
   *     it is considered outside the food system and terminates the walk.
   *   - If a state id is encountered a second time, the data contains a cycle — a
   *     descriptive {@link Error} is thrown immediately so the bad data is caught on boot.
   *   - The walk is capped at 16 segments as a hard ceiling against runaway data.
   * @param {number} entryStateId The database id of the Well Fed entry state.
   * @returns {JABS_FoodChainPlan} The completed plan.
   */
  static _walkChain(entryStateId)
  {
    // hard cap — food chains longer than this are almost certainly data errors.
    const maxSegments = 16;

    const segments = [];

    // visited set tracks ids seen so far for cycle detection.
    const visited = new Set();

    // pathIds tracks the walk order for inclusion in cycle error messages.
    const pathIds = [];

    let currentId = entryStateId;

    while (currentId > 0 && segments.length < maxSegments)
    {
      // if we've already visited this id, there is a cycle — throw immediately.
      if (visited.has(currentId))
      {
        const cycleStr = [...pathIds, currentId].join(' \u2192 ');
        throw new Error(
          `J-ABS-FOOD: Food chain cycle detected: ${cycleStr}. ` +
          `Review the <applyStateOnExpire> tags on those states and break the loop.`
        );
      }

      visited.add(currentId);
      pathIds.push(currentId);

      const state = $dataStates[currentId];

      // missing state id in the database — data error, stop walking cleanly.
      if (!state) break;

      // read the chain type, duration, and color from the state.
      const chainType = state.jabsFoodChainType ?? 'unknown';
      const frames = state.jabsStateDurationFrames ?? 0;
      const color = state.jabsFoodGroupColor ?? '#888888';

      // warn when a food-chain row still relies on the mz-capped stepsToRemove field alone.
      if (frames > 0 && frames <= 9999 && state.jabsFoodChainType !== null)
      {
        const hasDurationTag = RPGManager.getNumberFromNoteByRegex(
          state,
          J.ABS.RegExp.StateDuration,
          true,
        ) !== null;
        const hasDurationSecTag = RPGManager.getNumberFromNoteByRegex(
          state,
          J.ABS.RegExp.StateDurationSec,
          true,
        ) !== null;

        if (hasDurationTag === false && hasDurationSecTag === false)
        {
          // the authoring fix belongs in the message, since whoever sees this is mid-authoring.
          const seconds = Math.round(frames / 60);
          const fallback = `using stepsToRemove=${frames} (~${seconds}s)`;
          const remedy = 'add <stateDuration:FRAMES> per ca/docs/food/food-chain-durations.md.';
          const message = `state ${currentId} (${state.name}) has <foodChain> but no <stateDuration>`;
          Diagnostics.warn('J-ABS-Food', `${message} - ${fallback}. ${remedy}`);
        }
      }

      segments.push(new JABS_FoodChainSegment(currentId, chainType, frames, color));

      // follow the natural-expiry link if one is configured.
      const expireData = state.jabsApplyStateOnExpire;

      // no expire link — this is the terminal (tail) node; the walk ends here.
      if (expireData === null || expireData === undefined) break;

      const nextId = expireData.stateId;
      const nextState = $dataStates[nextId];

      // if the next state has no food chain type, it is outside the food system — stop.
      if (!nextState || nextState.jabsFoodChainType === null) break;

      currentId = nextId;
    }

    return new JABS_FoodChainPlan(segments);
  }
  //endregion static registry

  //region instance
  /**
   * The ordered list of state segments comprising this chain arc, from entry to tail.
   * @type {Array<JABS_FoodChainSegment>}
   */
  segments = [];

  /**
   * Constructor.
   * @param {Array<JABS_FoodChainSegment>} segments The ordered chain arc from entry to tail.
   */
  constructor(segments)
  {
    this.segments = segments;
  }

  /**
   * Returns the entry (Well Fed) segment — the first link in the chain.
   * Returns null for an empty plan.
   * @returns {JABS_FoodChainSegment|null}
   */
  getEntry()
  {
    return this.segments[0] ?? null;
  }

  /**
   * Whether this plan has any segments at all.
   * An empty plan means the registry walk failed (bad entry state id, missing data, etc).
   * @returns {boolean} True if the plan has at least one segment.
   */
  isEmpty()
  {
    return this.segments.length === 0;
  }

  /**
   * Returns the index of the segment whose stateId matches the given id,
   * or -1 when the id is not part of this plan.
   * @param {number} stateId The state id to locate within this plan.
   * @returns {number} The zero-based segment index, or -1 if not found.
   */
  indexOfState(stateId)
  {
    return this.segments.findIndex(segment => segment.stateId === stateId);
  }

  /**
   * Returns the phase label for the segment at the given index.
   * Index 0 is always the Well Fed (entry) phase; the last index is always the tail.
   * Everything in between is a peak phase.
   * @param {number} index The segment index.
   * @returns {'wellFed'|'peak'|'tail'} The phase label for that position.
   */
  phaseAtIndex(index)
  {
    // the first segment is always the Well Fed (entry) phase.
    if (index === 0) return 'wellFed';

    // the last segment is always the tail (terminal) phase.
    if (index === this.segments.length - 1) return 'tail';

    // anything between entry and tail is a peak phase.
    return 'peak';
  }
  //endregion instance
}

export default JABS_FoodChainPlan;
//endregion JABS_FoodChainPlan