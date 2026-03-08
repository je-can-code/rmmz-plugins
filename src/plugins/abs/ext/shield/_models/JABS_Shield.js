//region JABS_Shield
/**
 * Represents a state-owned shield pool for a {@link JABS_State}.
 */
class JABS_Shield
{
  /**
   * Derives a {@link JABS_Shield} from a state id.
   * @param {number} stateId The id of the state we should derive a shield from.
   * @param {Game_Battler} target The battler that will have the shield.
   * @returns {JABS_Shield|null} The shield data, or null if the state is not a shield state.
   */
  static fromStateId(stateId, target)
  {
    // grab the state we're working with.
    // TODO: target may perceive enhanced shield bonuses from state.
    const state = target.state(stateId);

    // grab all the formulas that the
    const pointFormulas = RPGManager.getStringsFromNoteByRegex(state, J.ABS.EXT.SHIELD.RegExp.ShieldPointsFormula);

    // allows access to the battler and state itself.
    /* eslint-disable no-unused-vars */
    const a = target;
    const b = state;
    /* eslint-enable no-unused-vars */

    const totalPoints = pointFormulas
      .reduce((total, formula) => total + eval(formula), 0);

    // if we have no shield points, then nothing else matters.
    if (totalPoints === 0) return null;

    // grab all the formulas that make up the cap.
    const capFormulas = RPGManager.getStringsFromNoteByRegex(state, J.ABS.EXT.SHIELD.RegExp.ShieldCapFormula);

    // combine all the cap formulas into a single value and add the flat cap points.
    const totalCap = capFormulas
      .reduce((total, formula) => total + eval(formula), 0);

    // if no cap was specified, then use the total points as the cap by default.
    const normalizedCap = totalCap === 0
      ? totalPoints
      : totalCap;

    // determine the priority, or default to 0.
    const priority = RPGManager.getNumberFromNoteByRegex(state, J.ABS.EXT.SHIELD.RegExp.Priority);

    // see if this shield protects all overflow damage when breaking.
    const isProtect = RPGManager.checkForBooleanFromNoteByRegex(state, J.ABS.EXT.SHIELD.RegExp.Protect) === true;

    // epoch timestamp in milliseconds for when this shield was applied.
    const appliedAt = Date.now();

    // grab the shield types from the state.
    // NOTE: if no types are present, then "bypass" only works if its also a typeless bypass.
    const shieldTypes = RPGManager.getArrayFromNotesByRegex(state, J.ABS.EXT.SHIELD.RegExp.Type, true);

    // derive the new state!
    return new JABS_Shield(totalPoints, normalizedCap, priority, shieldTypes, isProtect, appliedAt);
  }

  //region properties
  /**
   * The maximum amount of shield points this shield can hold.
   * @type {number}
   */
  #cap = 0;

  /**
   * The original amount of shield points when this state was instantiated.
   * @type {number}
   */
  #originalAmount = 0;

  /**
   * The current amount of shield points remaining.
   * @type {number}
   */
  #current = 0;

  /**
   * The priority of this shield.
   * @type {number}
   */
  #priority = 0;

  /**
   * The element types this shield protects against.
   * @type {number[]}
   */
  #types = [];

  /**
   * Whether or not this shield negates overflow when broken.
   * @type {boolean}
   */
  #protect = false;

  /**
   * The epoch timestamp in milliseconds for when this shield was applied.
   * @type {number}
   */
  #appliedAt = 0;

  //endregion properties

  /**
   * Constructor.
   * @param {number} shields The amount of shields provided by this state initially.
   * @param {number} cap The accumulation cap for add-and-clamp refresh behavior (often equals `max`).
   * @param {number} priority A numeric priority; higher values resolve earlier.
   * @param {number[]} shieldTypes The element types this shield protects against.
   * @param {boolean} protect When true, breaking this shield nullifies the remainder of the hit.
   * @param {number} appliedAt The frame index when this shield was created (for FIFO tiebreakers).
   */
  constructor(shields, cap, priority, shieldTypes, protect, appliedAt)
  {
    this.#cap = cap;
    this.#originalAmount = shields;
    this.#current = shields;
    this.#priority = priority;
    this.#types = shieldTypes;
    this.#protect = protect === true;
    this.#appliedAt = appliedAt;
  }

  /**
   * Gets the accumulation cap used when adding via refresh (non-stackable add-and-clamp).
   * @returns {number} The accumulation cap.
   */
  getCap()
  {
    // return the add-and-clamp cap value.
    return this.#cap;
  }

  /**
   * Gets the current amount of shield points remaining.
   * @returns {number} The current shield points.
   */
  getCurrent()
  {
    // return the current remaining shield points.
    return this.#current;
  }

  /**
   * Sets the current shield points.
   * The amount set can never be more than the shield cap.
   * @param {number} value The desired new current value.
   */
  setCurrent(value)
  {
    // clamp the value to the valid range.
    this.#current = Math.round(Math.max(0, Math.min(this.#cap, value)));
  }

  /**
   * Damages the shield by a given amount and returns the overflow, if any.
   * @param {number} amount The amount of damage to be deducted.
   * @returns {number} The amount of damage that overflowed the shield.
   */
  applyShieldDamage(amount)
  {
    // if the damage amount is greater than the current shield, we have overflow.
    const shieldAfterDamage = this.#current - amount;

    // update the shield value.
    this.#current = Math.round(Math.max(0, shieldAfterDamage));

    // if we have damage left, then the remainder would be overflow.
    if (shieldAfterDamage < 0)
    {
      // return the overflow amount.
      return Math.round(Math.abs(shieldAfterDamage));
    }

    // we have no overflow.
    return 0;
  }

  /**
   * Gets this shield's resolution priority; higher resolves earlier.
   * @returns {number} The priority value.
   */
  getPriority()
  {
    // return the priority of this shield.
    return this.#priority;
  }

  /**
   * Gets the element types this shield protects against.
   * @returns {number[]} The elementIds for this shield.
   */
  getShieldTypes()
  {
    return this.#types;
  }

  /**
   * Gets whether this shield has protected-break semantics.
   * @returns {boolean} True if breaking this shield nullifies hit remainder; otherwise false.
   */
  isProtected()
  {
    // return whether or not this shield is protected.
    return this.#protect === true;
  }

  /**
   * Gets the frame index when this shield was first applied.
   * @returns {number} The application frame index used for FIFO ordering.
   */
  getAppliedAt()
  {
    // return the applied-at frame.
    return this.#appliedAt;
  }

  /**
   * Determines whether this shield is currently depleted.
   * @returns {boolean} True if `current` is zero; otherwise false.
   */
  isBroken()
  {
    // return whether the shield is at zero.
    return this.#current === 0;
  }

  /**
   * Refreshes the shields current value to whatever its original application amount was.
   */
  refresh()
  {
    // project the new current by adding a full pool amount.
    const projected = this.#current + this.#originalAmount;

    // clamp the projected value to the add-and-clamp cap.
    this.#current = Math.max(0, Math.min(this.#cap, projected));
  }
}

//endregion JABS_Shield