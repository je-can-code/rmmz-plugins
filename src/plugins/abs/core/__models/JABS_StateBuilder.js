//region JABS_StateBuilder
/**
 * A fluent builder/factory for constructing {@link JABS_State} instances.
 *
 * Required parameters are provided at construction to prevent half-baked builders.
 * Optional parameters can be configured via fluent setters before calling {@link build}.
 *
 * Usage example:
 *
 * const built = new JABS_StateBuilder(target, stateId, iconIndex, duration)
 *   .setStartingStacks(2)
 *   .setSource(attacker)
 *   .build();
 */
class JABS_StateBuilder
{
  //region private fields
  /**
   * The battler that will receive the state when built.
   * @type {Game_Battler}
   */
  #battler = null;

  /**
   * The database id of the state to apply.
   * @type {number}
   */
  #stateId = null;

  /**
   * The icon index for the state (visual reference only).
   * @type {number}
   */
  #iconIndex = 0;

  /**
   * The duration in frames for the state instance.
   * @type {number}
   */
  #duration = 0;

  /**
   * The number of stacks the state should start with.
   * Defaults to 1 if not overridden via {@link setStartingStacks}.
   * @type {number}
   */
  #startingStacks = 1;

  /**
   * The battler that applied the state (source/assailant).
   * If not provided, it defaults to the afflicted battler at build time.
   * @type {Game_Battler|null}
   */
  #source = null;

  //endregion private fields

  /**
   * Constructor.
   * @param {Game_Battler} battler The battler afflicted by the state.
   * @param {number} stateId The database id of the state being applied.
   */
  constructor(battler, stateId)
  {
    this.#battler = battler;
    this.#stateId = stateId;
  }

  /**
   * Builds a {@link JABS_State} with the configured parameters.
   * @returns {JABS_State} The constructed state instance.
   */
  build()
  {
    // construct the JABS_State using the canonical constructor.
    const state = new JABS_State(
      this.#battler,
      this.#stateId,
      this.#iconIndex,
      this.#duration,
      this.#startingStacks,
      this.#source,
    );

    // return the fully constructed state instance.
    return state;
  }

  /**
   * Sets the icon index for the state.
   * @param {number} iconIndex The icon index.
   * @returns {JABS_StateBuilder}
   */
  setIconIndex(iconIndex)
  {
    // assign the icon index.
    this.#iconIndex = iconIndex;

    // return this for chaining.
    return this;
  }

  /**
   * Sets the duration of the state in frames.
   * @param {number} duration The number of frames the state lasts.
   */
  setDuration(duration)
  {
    // assign the duration.
    this.#duration = duration;

    // return this for chaining.
    return this;
  }

  /**
   * Sets the starting stack count for the state (defaults to 1 if not set).
   * @param {number} stacks The starting stack count.
   * @returns {JABS_StateBuilder} This builder for chaining.
   */
  setStartingStacks(stacks)
  {
    // assign the starting stacks.
    this.#startingStacks = stacks;

    // return this for chaining.
    return this;
  }

  /**
   * Sets the source battler who applied the state.
   * If not provided, it defaults to the afflicted battler during {@link build}.
   * @param {Game_Battler} source The applying battler.
   * @returns {JABS_StateBuilder} This builder for chaining.
   */
  setSource(source)
  {
    // assign the source battler.
    this.#source = source;

    // return this for chaining.
    return this;
  }
}

//endregion JABS_StateBuilder