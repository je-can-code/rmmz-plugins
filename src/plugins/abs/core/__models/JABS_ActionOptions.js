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
  static Default = () => this.Builder()
    .build();

  /**
   * A factory that generates builders for creating {@link JABS_ActionOptions}.
   * @returns {JABS_ActionOptionsBuilder}
   */
  static Builder = () => new JABS_ActionOptionsBuilder();
}
//endregion JABS_ActionOptions