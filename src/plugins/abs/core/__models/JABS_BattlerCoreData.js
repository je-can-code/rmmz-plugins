//region JABS_BattlerCoreData
/**
 * A class containing all the data extracted from the comments of an event's
 * comments and contained with friendly methods to access and manipulate.
 */
function JABS_BattlerCoreData()
{
  this.initialize(...arguments);
}

JABS_BattlerCoreData.prototype = {};
JABS_BattlerCoreData.prototype.constructor = JABS_BattlerCoreData;

/**
 * Initializes this battler data object.
 * @param {number} battlerId This enemy id.
 * @param {number} teamId This battler's team id.
 * @param {JABS_EnemyAI} battlerAI This battler's converted AI.
 * @param {number} sightRange The sight range.
 * @param {number} alertedSightBoost The boost to sight range while alerted.
 * @param {number} pursuitRange The pursuit range.
 * @param {number} alertedPursuitBoost The boost to pursuit range while alerted.
 * @param {number} alertDuration The duration in frames of how long to remain alerted.
 * @param {boolean} canIdle Whether or not this battler can idle.
 * @param {boolean} showHpBar Whether or not to show the hp bar.
 * @param {boolean} showBattlerName Whether or not to show the battler's name.
 * @param {boolean} isInvincible Whether or not this battler is invincible.
 * @param {boolean} isInanimate Whether or not this battler is inanimate.
 */
JABS_BattlerCoreData.prototype.initialize = function({
  battlerId,
  teamId,
  battlerAI,
  sightRange,
  alertedSightBoost,
  pursuitRange,
  alertedPursuitBoost,
  alertDuration,
  canIdle,
  showHpBar,
  showBattlerName,
  isInvincible,
  isInanimate
})
{
  /**
   * The id of the enemy that this battler represents.
   * @type {number}
   */
  this._battlerId = battlerId;

  /**
   * The id of the team this battler belongs to.
   * @type {number}
   */
  this._teamId = teamId;

  /**
   * The converted-from-binary AI of this battler.
   * @type {JABS_EnemyAI}
   */
  this._battlerAI = battlerAI;

  /**
   * The base range that this enemy can and engage targets within.
   * @type {number}
   */
  this._sightRange = sightRange;

  /**
   * The boost to sight range this enemy gains while alerted.
   * @type {number}
   */
  this._alertedSightBoost = alertedSightBoost;

  /**
   * The base range that this enemy will pursue it's engaged target.
   * @type {number}
   */
  this._pursuitRange = pursuitRange;

  /**
   * The boost to pursuit range this enemy gains while alerted.
   * @type {number}
   */
  this._alertedPursuitBoost = alertedPursuitBoost;

  /**
   * The duration in frames that this enemy will remain alerted.
   * @type {number}
   */
  this._alertDuration = alertDuration;

  /**
   * Whether or not this battler will move around while idle.
   * @type {boolean} True if the battler can move while idle, false otherwise.
   */
  this._canIdle = canIdle;

  /**
   * Whether or not this battler's hp bar will be visible.
   * @type {boolean} True if the battler's hp bar should show, false otherwise.
   */
  this._showHpBar = showHpBar;

  /**
   * Whether or not this battler's name will be visible.
   * @type {boolean} True if the battler's name should show, false otherwise.
   */
  this._showBattlerName = showBattlerName;

  /**
   * Whether or not this battler is invincible.
   *
   * Invincible is defined as: `actions will not collide with this battler`.
   * @type {boolean} True if the battler is invincible, false otherwise.
   */
  this._isInvincible = isInvincible;

  /**
   * Whether or not this battler is inanimate. Inanimate battlers have a few
   * unique traits, those being: cannot idle, hp bar is hidden, cannot be alerted,
   * does not play deathcry when defeated, and cannot engage in battle.
   * @type {boolean} True if the battler is inanimate, false otherwise.
   */
  this._isInanimate = isInanimate;

  this.initMembers()
};

/**
 * Initializes all properties of this class.
 * This is effectively a hook for adding extra properties into this object.
 */
JABS_BattlerCoreData.prototype.initMembers = function()
{ };

/**
 * Gets this battler's enemy id.
 * @returns {number}
 */
JABS_BattlerCoreData.prototype.battlerId = function()
{
  return this._battlerId;
};

/**
 * Gets this battler's team id.
 * @returns {number}
 */
JABS_BattlerCoreData.prototype.team = function()
{
  return this._teamId;
};

/**
 * Gets this battler's AI.
 * @returns {JABS_EnemyAI}
 */
JABS_BattlerCoreData.prototype.ai = function()
{
  return this._battlerAI;
};

/**
 * Gets the base range that this enemy can engage targets within.
 * @returns {number}
 */
JABS_BattlerCoreData.prototype.sightRange = function()
{
  return this._sightRange;
};

/**
 * Gets the boost to sight range while alerted.
 * @returns {number}
 */
JABS_BattlerCoreData.prototype.alertedSightBoost = function()
{
  return this._alertedSightBoost;
};

/**
 * Gets the base range that this enemy will pursue it's engaged target.
 * @returns {number}
 */
JABS_BattlerCoreData.prototype.pursuitRange = function()
{
  return this._pursuitRange;
};

/**
 * Gets the boost to pursuit range while alerted.
 * @returns {number}
 */
JABS_BattlerCoreData.prototype.alertedPursuitBoost = function()
{
  return this._alertedPursuitBoost;
};

/**
 * Gets the duration in frames for how long this battler remains alerted.
 * @returns {number}
 */
JABS_BattlerCoreData.prototype.alertDuration = function()
{
  return this._alertDuration;
};

/**
 * Gets whether or not this battler will move around while idle.
 * @returns {boolean}
 */
JABS_BattlerCoreData.prototype.canIdle = function()
{
  return this._canIdle;
};

/**
 * Gets whether or not this battler's hp bar will be visible.
 * @returns {boolean}
 */
JABS_BattlerCoreData.prototype.showHpBar = function()
{
  return this._showHpBar;
};

/**
 * Gets whether or not this battler's name will be visible.
 * @returns {boolean}
 */
JABS_BattlerCoreData.prototype.showBattlerName = function()
{
  return this._showBattlerName;
};

/**
 * Gets whether or not this battler is `invincible`.
 * @returns {boolean}
 */
JABS_BattlerCoreData.prototype.isInvincible = function()
{
  return this._isInvincible;
};

/**
 * Gets whether or not this battler is `inanimate`.
 * @returns {boolean}
 */
JABS_BattlerCoreData.prototype.isInanimate = function()
{
  return this._isInanimate;
};

/**
 *
 * @returns {JABS_CoreDataBuilder}
 */
JABS_BattlerCoreData.Builder = function()
{
  return new class JABS_CoreDataBuilder
  {
    //region properties
    /**
     * The battler's id, such as the actor id or enemy id.
     * @type {number}
     * @private
     */
    #battlerId = 0;

    /**
     * The team id that this battler belongs to.
     * @type {number}
     * @private
     */
    #teamId = JABS_Battler.enemyTeamId();

    /**
     * The AI of this battler.
     * @type {JABS_AI}
     * @private
     */
    #battlerAi = new JABS_AI();

    /**
     * The sight range of this battler.
     * @type {number}
     * @private
     */
    #sightRange = J.ABS.Metadata.DefaultEnemySightRange;

    /**
     * The alerted sight boost of this battler.
     * @type {number}
     * @private
     */
    #alertedSightBoost = J.ABS.Metadata.DefaultEnemyAlertedSightBoost;

    /**
     * The pursuit range of this battler.
     * @type {number}
     * @private
     */
    #pursuitRange = J.ABS.Metadata.DefaultEnemyPursuitRange;

    /**
     * The alerted pursuit boost of this battler.
     * @type {number}
     * @private
     */
    #alertedPursuitBoost = J.ABS.Metadata.DefaultEnemyAlertedPursuitBoost;

    /**
     * The duration this battler remains alerted.
     * @type {number}
     * @private
     */
    #alertDuration = J.ABS.Metadata.DefaultEnemyAlertDuration;

    /**
     * Whether or not this battler is allowed to idle about.
     * @type {boolean}
     * @private
     */
    #canIdle = J.ABS.Metadata.DefaultEnemyCanIdle;

    /**
     * Whether or not this battler has a visible hp bar.
     * @type {boolean}
     * @private
     */
    #showHpBar = J.ABS.Metadata.DefaultEnemyShowHpBar;

    /**
     * Whether or not this battler has a visible hp bar.
     * @type {boolean}
     * @private
     */
    #showDangerIndicator = J.ABS.EXT.DANGER ? J.ABS.EXT.DANGER.Metadata.DefaultEnemyShowDangerIndicator : false;

    /**
     * Whether or not this battler's name is visible.
     * @type {boolean}
     * @private
     */
    #showBattlerName = J.ABS.Metadata.DefaultEnemyShowBattlerName;

    /**
     * Whether or not this battler is invincible.
     * @type {boolean}
     * @private
     */
    #isInvincible = J.ABS.Metadata.DefaultEnemyIsInvincible;

    /**
     * Whether or not this battler is inanimate.
     * @type {boolean}
     * @private
     */
    #isInanimate = J.ABS.Metadata.DefaultEnemyIsInanimate;
    //endregion properties

    /**
     * Constructor.
     * @param {number} battlerId The id of the battler from the database.
     */
    constructor(battlerId)
    {
      this.setBattlerId(battlerId);
    }

    /**
     * Builds the core data with the current set of parameters.
     * @returns {JABS_BattlerCoreData}
     */
    build()
    {
      const core = new JABS_BattlerCoreData({
        // configure core battler data.
        battlerId: this.#battlerId,
        teamId: this.#teamId,
        battlerAI: this.#battlerAi,

        // configure sight and alert battler data.
        sightRange: this.#sightRange,
        alertedSightBoost: this.#alertedSightBoost,
        pursuitRange: this.#pursuitRange,
        alertedPursuitBoost: this.#alertedPursuitBoost,
        alertDuration: this.#alertDuration,

        // configure on-the-map settings.
        canIdle: this.#canIdle,
        showHpBar: this.#showHpBar,
        showBattlerName: this.#showBattlerName,
        isInvincible: this.#isInvincible,
        isInanimate: this.#isInanimate
      });

      // if using danger indicators, then set that, too.
      if (J.ABS.EXT.DANGER)
      {
        core.setDangerIndicator(this.#showDangerIndicator);
      }

      return core;
    }

    //region setters
    /**
     * Sets all properties based on this battler's own data except id.
     * @param {Game_Battler} battler
     * @returns {this} This builder for fluent-building.
     */
    setBattler(battler)
    {
      this.#battlerId = battler.battlerId();
      this.#teamId = battler.teamId();
      this.#battlerAi = battler.ai();

      this.#sightRange = battler.sightRange();
      this.#alertedSightBoost = battler.alertedSightBoost();
      this.#pursuitRange = battler.pursuitRange();
      this.#alertedPursuitBoost = battler.alertedPursuitBoost();
      this.#alertDuration = battler.alertDuration();

      this.#canIdle = battler.canIdle();
      this.#showHpBar = battler.showHpBar();
      this.#showDangerIndicator = battler.showDangerIndicator();
      this.#showBattlerName = battler.showBattlerName();
      this.#isInvincible = battler.isInvincible();
      this.#isInanimate = battler.isInanimate();

      return this;
    }

    /**
     * Sets all properties based on the assumption that this is for the player.
     * Effectively, all ranges are set to 0, and all booleans are set to false.
     * @returns {this} This builder for fluent-building.
     */
    isPlayer()
    {
      this.#teamId = JABS_Battler.allyTeamId();

      this.#sightRange = 0;
      this.#alertedSightBoost = 0;
      this.#pursuitRange = 0;
      this.#alertedPursuitBoost = 0;
      this.#alertDuration = 0;

      this.#canIdle = false;
      this.#showHpBar = false;
      this.#showBattlerName = false;
      this.#isInvincible = false;
      this.#isInanimate = false;

      return this;
    }

    /**
     * Sets all properties based on the assumption that this is a dummy enemy.
     * Only the defaults are used because this isn't a real enemy to engage on the map.
     * @param {boolean} isFriendly Whether or not this is an allied dummy.
     * @returns {this} This builder for fluent-building.
     */
    isDummy(isFriendly = false)
    {
      this.#teamId = isFriendly
        ? JABS_Battler.allyTeamId()
        : JABS_Battler.enemyTeamId();
      return this;
    }

    /**
     * Sets the battler id of this core data.
     * @param {number} battlerId The id of the battler from the database.
     * @returns {this} This builder for fluent-building.
     */
    setBattlerId(battlerId)
    {
      this.#battlerId = battlerId;
      return this;
    }

    /**
     * Sets the team id of this core data.
     * @param {number} teamId The id of the team this battler belongs to.
     * @returns {this} This builder for fluent-building.
     */
    setTeamId(teamId)
    {
      this.#teamId = teamId;
      return this;
    }

    /**
     * Sets the AI of this core data.
     * @param {JABS_EnemyAI} battlerAi The AI of this battler.
     * @returns {this} This builder for fluent-building.
     */
    setBattlerAi(battlerAi)
    {
      this.#battlerAi = battlerAi;
      return this;
    }

    /**
     * Sets the sight range of this core data.
     * @param {number} sightRange The sight range of this battler.
     * @returns {this} This builder for fluent-building.
     */
    setSightRange(sightRange)
    {
      this.#sightRange = sightRange;
      return this;
    }

    /**
     * Sets the alerted sight boost of this core data.
     * @param {number} alertedSightBoost The alerted sight boost of this battler.
     * @returns {this} This builder for fluent-building.
     */
    setAlertedSightBoost(alertedSightBoost)
    {
      this.#alertedSightBoost = alertedSightBoost;
      return this;
    }

    /**
     * Sets the pursuit range of this core data.
     * @param {number} pursuitRange The pursuit range of this battler.
     * @returns {this} This builder for fluent-building.
     */
    setPursuitRange(pursuitRange)
    {
      this.#pursuitRange = pursuitRange;
      return this;
    }

    /**
     * Sets the alerted pursuit boost of this core data.
     * @param {number} alertedPursuitBoost The alerted pursuit boost of this battler.
     * @returns {this} This builder for fluent-building.
     */
    setAlertedPursuitBoost(alertedPursuitBoost)
    {
      this.#alertedPursuitBoost = alertedPursuitBoost;
      return this;
    }

    /**
     * Sets the alerted duration of this core data.
     * @param {number} alertDuration The duration of which this battler remains alerted.
     * @returns {this} This builder for fluent-building.
     */
    setAlertDuration(alertDuration)
    {
      this.#alertDuration = alertDuration;
      return this;
    }

    /**
     * Sets whether or not this battler can idle while not in combat.
     * @param {boolean} canIdle Whether or not this battler can idle about.
     * @returns {this} This builder for fluent-building.
     */
    setCanIdle(canIdle)
    {
      this.#canIdle = canIdle;
      return this;
    }

    /**
     * Sets whether or not this battler's hp bar is visible.
     * @param {boolean} showHpBar Whether or not the hp bar is visible.
     * @returns {this} This builder for fluent-building.
     */
    setShowHpBar(showHpBar)
    {
      this.#showHpBar = showHpBar;
      return this;
    }

    /**
     * Sets whether or not this battler's danger indicator is visible.
     * @param {boolean} showDangerIndicator Whether or not the danger indicator is visible.
     * @returns {this} This builder for fluent-building.
     */
    setShowDangerIndicator(showDangerIndicator)
    {
      this.#showDangerIndicator = showDangerIndicator;
      return this;
    }

    /**
     * Sets whether or not this battler's name is visible.
     * @param {boolean} showBattlerName Whether or not the battler name is visible.
     * @returns {this} This builder for fluent-building.
     */
    setShowBattlerName(showBattlerName)
    {
      this.#showBattlerName = showBattlerName;
      return this;
    }

    /**
     * Sets whether or not this battler is invincible.
     * @param {boolean} isInvincible Whether or not the battler is invincible.
     * @returns {this} This builder for fluent-building.
     */
    setIsInvincible(isInvincible)
    {
      this.#isInvincible = isInvincible;
      return this;
    }

    /**
     * Sets whether or not this battler is inanimate.
     * @param {boolean} isInanimate Whether or not the battler is inanimate.
     * @returns {this} This builder for fluent-building.
     */
    setIsInanimate(isInanimate)
    {
      this.#isInanimate = isInanimate;
      return this;
    }
    //endregion setters
  }
};
//endregion JABS_BattlerCoreData