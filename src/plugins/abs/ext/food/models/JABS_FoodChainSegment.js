//region JABS_FoodChainSegment
/**
 * Represents a single link in a food chain arc.
 *
 * Each segment corresponds to one database state in the chain, ordered from the
 * entry state (Well Fed) through any peak states to the tail. Instances are built
 * once by {@link JABS_FoodChainPlan._walkChain} during boot-time registry construction
 * and treated as read-only thereafter.
 */
class JABS_FoodChainSegment
{
  /**
   * The database state id for this chain link.
   * @type {number}
   */
  stateId = 0;

  /**
   * The food group chain type this state belongs to (e.g. 'protein', 'overstuffed').
   * Sourced from the {@code <foodChain:TYPE>} notetag on the state.
   * @type {string}
   */
  chainType = '';

  /**
   * The duration of this state in frames, from {@link RPG_State#jabsStateDurationFrames}
   * ({@code <stateDuration>} / {@code <stateDurationSec>}, else {@code stepsToRemove}).
   * At 60 fps, a value of 600 equals 10 seconds of duration.
   * @type {number}
   */
  frames = 0;

  /**
   * The hex color string for this segment's bar fill (e.g. '#44cc44').
   * Sourced from the {@code <foodGroupColor:#RRGGBB>} notetag on the state.
   * Defaults to a neutral grey when no tag is present on the state.
   * @type {string}
   */
  color = '#888888';

  /**
   * Constructor.
   * @param {number} stateId The database id of this state in the chain.
   * @param {string} chainType The food group chain type key (lowercase).
   * @param {number} frames Total duration in frames ({@link RPG_State#jabsStateDurationFrames}).
   * @param {string} color The hex color string for this segment's bar fill.
   */
  constructor(stateId, chainType, frames, color)
  {
    this.stateId = stateId;
    this.chainType = chainType;
    this.frames = frames;
    this.color = color;
  }
}

export default JABS_FoodChainSegment;
//endregion JABS_FoodChainSegment