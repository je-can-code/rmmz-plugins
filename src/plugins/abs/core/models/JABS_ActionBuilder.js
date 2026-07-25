//region JABS_ActionBuilder
import JABS_Battler from './JABS_Battler.js';
import JABS_ActionOptions from './JABS_ActionOptions.js';
import JABS_Action from './JABS_Action.js';
/**
 * A builder for creating {@link JABS_Action}s.
 * @returns {JABS_ActionBuilder}
 */
class JABS_ActionBuilder
{
  /**
   * The compiled skill-action data of the action being executed.
   * @type {Game_Action}
   */
  #gameAction = null;

  /**
   * The battler that executed this action.
   * @type {JABS_Battler}
   */
  #caster = null;

  /**
   * Whether or not the action is the retaliation of another battler.
   * @type {boolean}
   */
  #isRetaliation = false;

  /**
   * The direction that this action will be pointed when first starting its move route.
   * @type {number}
   */
  #initialDirection = J.ABS.Directions.DOWN;

  /**
   * The cooldown key associated with this action.
   * @type {string}
   */
  #cooldownKey = J.ABS.Globals.GlobalCooldownKey;

  /**
   * Whether or not this action was a result of terrain damage.
   * @type {boolean}
   */
  #isTerrainDamage = false;

  /**
   * The action options used to build this action.
   * @type {JABS_ActionOptions|null}
   */
  #actionOptions = null;

  /**
   * Builds a new instance of the action based on the built parameters.
   * @returns {JABS_Action}
   */
  build()
  {
    const mapAction = new JABS_Action(
      this.#gameAction,
      this.#caster,
      this.#isRetaliation,
      this.#initialDirection,
      this.#cooldownKey,
      this.#isTerrainDamage);

    // attach the options used to create this action (carries frozen target location).
    if (this.#actionOptions)
    {
      mapAction.setActionOptions(this.#actionOptions);
    }

    this.clear();

    return mapAction;
  }

  clear()
  {
    // reset the underlying game action.
    this.#gameAction = null;

    // reset the caster.
    this.#caster = null;

    // reset retaliation flag.
    this.#isRetaliation = false;

    // reset initial direction.
    this.#initialDirection = J.ABS.Directions.DOWN;

    // reset cooldown key.
    this.#cooldownKey = J.ABS.Globals.GlobalCooldownKey;

    // reset terrain damage.
    this.#isTerrainDamage = false;

    // reset action options.
    this.#actionOptions = null;
  }

  setGameAction(gameAction)
  {
    this.#gameAction = gameAction;
    return this;
  }

  setCaster(caster)
  {
    this.#caster = caster;
    return this;
  }

  setIsRetaliation(isRetaliation)
  {
    this.#isRetaliation = isRetaliation;
    return this;
  }

  setInitialDirection(direction)
  {
    this.#initialDirection = direction;
    return this;
  }

  setCooldownKey(cooldownKey)
  {
    this.#cooldownKey = cooldownKey;
    return this;
  }

  setIsTerrainDamage(isTerrainDamage)
  {
    this.#isTerrainDamage = isTerrainDamage;
    return this;
  }

  /**
   * Applies the {@link JABS_ActionOptions} to this builder.
   * @param {JABS_ActionOptions} actionOptions The options to apply to this builder.
   * @returns {this} This builder for fluent-chaining.
   */
  setActionOptions(actionOptions)
  {
    // persist the entire options object for later attachment onto the built action.
    this.#actionOptions = actionOptions;

    // also extract and cache common flags for existing behavior.
    this.#isRetaliation = actionOptions.isActionRetaliation();
    this.#cooldownKey = actionOptions.getCooldownKey();
    this.#isTerrainDamage = actionOptions.isTerrainDamage();

    // allow method chaining.
    return this;
  }
}

export default JABS_ActionBuilder;
//endregion JABS_ActionBuilder