//region JABS_ActionOptions
/**
 * Options associated with a set of {@link JABS_Action}s.
 */
class JABS_ActionOptions
{
  /**
   * Whether or not the action is a retaliation of another battler.<br/>
   * This is used to prevent recursive retaliations.
   * @type {boolean}
   */
  #isRetaliation = false;

  /**
   * The cooldown's key associated with the action being executed.<br/>
   * If none is assigned, the global "global" cooldown key will be used.
   * @type {string|"global"}
   */
  #cooldownKey = J.ABS.Globals.GlobalCooldownKey;

  /**
   * The location of the target of this action, and where it will originate.<br/>
   * Typically used when the action is originating by force.<br/>
   * If not provided, an empty location will be defaulted (all nulls).
   * @type {JABS_Location}
   */
  #location = null;

  /**
   * Whether or not the action is a result of terrain damage.<br/>
   * When terrain damage is the source, the logging will be more generic.
   * @type {boolean}
   */
  #terrainDamage = false;

  /**
   * Constructor.<br/>
   * Use the {@link JABS_ActionOptionsBuilder} to fluently and properly build these.
   * @param {boolean} isRetaliation Whether or not the action is a retaliation of another battler.
   * @param {string} cooldownKey The cooldown's key associated with the action being executed.
   * @param {JABS_Location} location The location of the target of this action, and where it will originate.
   * @param {boolean} terrainDamage Whether or not the action is a result of terrain damage.
   */
  constructor(isRetaliation, cooldownKey, location, terrainDamage)
  {
    this.#isRetaliation = isRetaliation;
    this.#cooldownKey = cooldownKey;
    this.#location = location;
    this.#terrainDamage = terrainDamage;
  }

  /**
   * Whether or not the action is a retaliation of another battler.<br/>
   * This is used to prevent recursive retaliations.
   * @returns {boolean}
   */
  isActionRetaliation()
  {
    return this.#isRetaliation;
  }

  /**
   * The cooldown's key associated with the action being executed.<br/>
   * If none is assigned, the global "global" cooldown key will be used.
   * @returns {string|"global"}
   */
  getCooldownKey()
  {
    return this.#cooldownKey;
  }

  /**
   * The location of the target of this action, and where it will originate.<br/>
   * Typically used when the action is originating by force.<br/>
   * If not provided, an empty location will be defaulted (all nulls).
   * @returns {JABS_Location}
   */
  getTargetLocation()
  {
    return this.#location;
  }

  /**
   * Whether or not the action is a result of terrain damage.<br/>
   * When terrain damage is the source, the logging will be more generic.
   * @returns {boolean}
   */
  isTerrainDamage()
  {
    return this.#terrainDamage;
  }

  /**
   * A factory that generates {@link JABS_ActionOptions} with all default values.
   * @returns {JABS_ActionOptions}
   */
  static Default = () => this.Builder().build();

  /**
   * A factory that generates builders for creating {@link JABS_ActionOptions}s.
   * @returns {JABS_ActionOptionsBuilder}
   */
  static Builder = () => new class JABS_ActionOptionsBuilder
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
      const locationToClone = this.#sourceLocation ?? JABS_Location.Builder().build();

      // compile a new action.
      const newJabsActionOptions = new JABS_ActionOptions(
        this.#isRetaliation,
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
}

//endregion JABS_ActionOptions