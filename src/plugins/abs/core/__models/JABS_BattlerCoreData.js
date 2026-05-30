//region JABS_BattlerCoreData
import JABS_EnemyAI from './JABS_EnemyAI.js';
import JABS_BattlerRole from './JABS_BattlerRole.js';
import JABS_BattlerCoreDataBuilder from './JABS_BattlerCoreDataBuilder.js';
/**
 * A class containing all the data extracted from the comments of an event's
 * comments and contained with friendly methods to access and manipulate.
 */
class JABS_BattlerCoreData
{
  /**
   * Constructor.
   * @param {...*} args Forwarded to {@link #initialize}.
   */
  constructor(...args)
  {
    this.initialize(...args);
  }

  /**
   * Initializes this battler data object.
   * @param {number} battlerId This enemy id.
   * @param {number} teamId This battler's team id.
   * @param {JABS_EnemyAI} battlerAI This battler's converted AI.
   * @param {JABS_BattlerRole} battlerRole This battler's structural coordination role.
   * @param {number} sightRange The sight range.
   * @param {number} alertedSightBoost The boost to sight range while alerted.
   * @param {number} pursuitRange The pursuit range.
   * @param {number} alertedPursuitBoost The boost to pursuit range while alerted.
   * @param {number} alertDuration The duration in frames of how long to remain alerted.
   * @param {number|null} guardRange The explicit guardian engagement range, or null to use the ward-pursuit fallback.
   * @param {boolean} canIdle Whether or not this battler can idle.
   * @param {boolean} showHpBar Whether or not to show the hp bar.
   * @param {boolean} showBattlerName Whether or not to show the battler's name.
   * @param {boolean} isInvincible Whether or not this battler is invincible.
   * @param {boolean} isInanimate Whether or not this battler is inanimate.
   */
  initialize({
    battlerId,
    teamId,
    battlerAI,
    battlerRole,
    sightRange,
    alertedSightBoost,
    pursuitRange,
    alertedPursuitBoost,
    alertDuration,
    guardRange,
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
     * The structural coordination role of this battler.
     * @type {JABS_BattlerRole}
     */
    this._battlerRole = battlerRole ?? new JABS_BattlerRole();

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
     * The explicit engagement range for guardian-role battlers.
     * When null, the guardian falls back to the largest ward pursuit radius among its allies.
     * @type {number|null}
     */
    this._guardRange = guardRange ?? null;

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
  }

  /**
   * Initializes all properties of this class.
   * This is effectively a hook for adding extra properties into this object.
   */
  initMembers()
  {
  }

  /**
   * Gets this battler's enemy id.
   * @returns {number}
   */
  battlerId()
  {
    return this._battlerId;
  }

  /**
   * Gets this battler's team id.
   * @returns {number}
   */
  team()
  {
    return this._teamId;
  }

  /**
   * Gets this battler's AI.
   * @returns {JABS_EnemyAI}
   */
  ai()
  {
    return this._battlerAI;
  }

  /**
   * Gets this battler's structural coordination role.
   * @returns {JABS_BattlerRole}
   */
  battlerRole()
  {
    return this._battlerRole;
  }

  /**
   * Gets the base range that this enemy can engage targets within.
   * @returns {number}
   */
  sightRange()
  {
    return this._sightRange;
  }

  /**
   * Gets the boost to sight range while alerted.
   * @returns {number}
   */
  alertedSightBoost()
  {
    return this._alertedSightBoost;
  }

  /**
   * Gets the base range that this enemy will pursue it's engaged target.
   * @returns {number}
   */
  pursuitRange()
  {
    return this._pursuitRange;
  }

  /**
   * Gets the boost to pursuit range while alerted.
   * @returns {number}
   */
  alertedPursuitBoost()
  {
    return this._alertedPursuitBoost;
  }

  /**
   * Gets the duration in frames for how long this battler remains alerted.
   * @returns {number}
   */
  alertDuration()
  {
    return this._alertDuration;
  }

  /**
   * Gets the explicit guardian engagement range.
   * When null, the guardian falls back to the largest ward pursuit radius.
   * @returns {number|null}
   */
  guardRange()
  {
    return this._guardRange;
  }

  /**
   * Gets whether or not this battler will move around while idle.
   * @returns {boolean}
   */
  canIdle()
  {
    return this._canIdle;
  }

  /**
   * Gets whether or not this battler's hp bar will be visible.
   * @returns {boolean}
   */
  showHpBar()
  {
    return this._showHpBar;
  }

  /**
   * Gets whether or not this battler's name will be visible.
   * @returns {boolean}
   */
  showBattlerName()
  {
    return this._showBattlerName;
  }

  /**
   * Gets whether or not this battler is `invincible`.
   * @returns {boolean}
   */
  isInvincible()
  {
    return this._isInvincible;
  }

  /**
   * Gets whether or not this battler is `inanimate`.
   * @returns {boolean}
   */
  isInanimate()
  {
    return this._isInanimate;
  }

  /**
   * A factory for generating builders for creating {@link JABS_BattlerCoreData}s.
   * @returns {JABS_BattlerCoreDataBuilder}
   */
  static Builder()
  {
    return new JABS_BattlerCoreDataBuilder();
  }
}

export default JABS_BattlerCoreData;
//endregion JABS_BattlerCoreData