//region JABS_ActionOptionsBuilder
/**
 * A builder for creating {@link JABS_ActionOptions}.
 */
class JABS_ActionOptionsBuilder
{
  /**
   * Whether or not the action is a retaliation of another battler.
   * @type {boolean}
   */
  #isRetaliation = false;

  /**
   * The cooldown's key associated with the action being executed.
   * @type {string}
   */
  #cooldownKey = J.ABS.Globals.GlobalCooldownKey;

  /**
   * The location of the target of this action, where it will originate.
   * @type {JABS_Location}
   */
  #sourceLocation = null;

  /**
   * Whether or not the action is terrain damage.
   * @type {boolean}
   */
  #isTerrainDamage = false;

  /**
   * Builds a new instance of the options based on the built parameters.
   * @returns {JABS_ActionOptions}
   */
  build()
  {
    // use an empty location if none was provided.
    const locationToClone = this.#sourceLocation ?? JABS_Location.Builder()
      .build();

    // compile a new action.
    const newJabsActionOptions = new JABS_ActionOptions(this.#isRetaliation,
      this.#cooldownKey,
      JABS_Location.Clone(locationToClone),
      this.#isTerrainDamage);

    // clear out the previous data.
    this.clear();

    // return what was built.
    return newJabsActionOptions;
  }

  /**
   * Clears the builder for re-use.<br/>
   * Not recommended unless performing sequential re-uses.
   */
  clear()
  {
    this.#isRetaliation = false;
    this.#cooldownKey = J.ABS.Globals.GlobalCooldownKey;
    this.#sourceLocation = null;
    this.#isTerrainDamage = false;
  }

  /**
   * Sets whether or not the action is a retaliation of another battler.
   * @param {boolean} isRetaliation
   * @returns {JABS_ActionOptionsBuilder}
   */
  setIsRetaliation(isRetaliation)
  {
    this.#isRetaliation = isRetaliation;
    return this;
  }

  /**
   * Sets the cooldown key to the given cooldown key.
   * @param {string} cooldownKey
   * @returns {JABS_ActionOptionsBuilder}
   */
  setCooldownKey(cooldownKey)
  {
    this.#cooldownKey = cooldownKey;
    return this;
  }

  /**
   * Sets the location to the given location.
   * @param {JABS_Location} location
   * @returns {JABS_ActionOptionsBuilder}
   */
  setLocation(location)
  {
    this.#sourceLocation = location;
    return this;
  }

  /**
   * Sets whether or not the action is terrain damage.
   * @param {boolean} isTerrainDamage
   */
  setIsTerrainDamage(isTerrainDamage)
  {
    this.#isTerrainDamage = isTerrainDamage;
    return this;
  }
}

//endregion JABS_ActionOptionsBuilder