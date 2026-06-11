//region JABS_ActionOptionsBuilder
import JABS_Location from './JABS_Location.js';
import JABS_ActionOptions from './JABS_ActionOptions.js';
import JABS_Action from './JABS_Action.js';
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
   * The per-projectile spawn offset along the X axis in tiles.
   * @type {number}
   */
  #spawnOffsetX = 0;

  /**
   * The per-projectile spawn offset along the Y axis in tiles.
   * @type {number}
   */
  #spawnOffsetY = 0;

  /**
   * Optional projectile travel angle in degrees (null = move route only).
   * @type {number|null}
   */
  #projectileTravelAngleDegrees = null;

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
    const newJabsActionOptions = new JABS_ActionOptions(
      this.#isRetaliation,
      this.#cooldownKey,
      JABS_Location.Clone(locationToClone),
      this.#isTerrainDamage,
      this.#spawnOffsetX,
      this.#spawnOffsetY,
      this.#projectileTravelAngleDegrees);

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
    this.#spawnOffsetX = 0;
    this.#spawnOffsetY = 0;
    this.#projectileTravelAngleDegrees = null;
  }

  /**
   * Sets whether or not the action is a retaliation of another battler.
   * @param {boolean} isRetaliation The is retaliation driving this step.
   * @returns {JABS_ActionOptionsBuilder}
   */
  setIsRetaliation(isRetaliation)
  {
    this.#isRetaliation = isRetaliation;
    return this;
  }

  /**
   * Sets the cooldown key to the given cooldown key.
   * @param {string} cooldownKey The cooldown key driving this step.
   * @returns {JABS_ActionOptionsBuilder}
   */
  setCooldownKey(cooldownKey)
  {
    this.#cooldownKey = cooldownKey;
    return this;
  }

  /**
   * Sets the location to the given location.
   * @param {JABS_Location} location The location driving this step.
   * @returns {JABS_ActionOptionsBuilder}
   */
  setLocation(location)
  {
    this.#sourceLocation = location;
    return this;
  }

  /**
   * Sets whether or not the action is terrain damage.
   * @param {boolean} isTerrainDamage The is terrain damage driving this step.
   */
  setIsTerrainDamage(isTerrainDamage)
  {
    this.#isTerrainDamage = isTerrainDamage;
    return this;
  }

  /**
   * Sets the per-projectile spawn offset deltas relative to the caster's fire-time position.
   * Used by multi-projectile volleys to position parallel lanes without freezing a decision-time origin.
   * @param {number} dx The X offset in tiles.
   * @param {number} dy The Y offset in tiles.
   * @returns {JABS_ActionOptionsBuilder}
   */
  setSpawnOffset(dx, dy)
  {
    this.#spawnOffsetX = dx;
    this.#spawnOffsetY = dy;
    return this;
  }

  /**
   * Sets an optional projectile travel angle in degrees (RMMZ map space: 0 = right, 90 = down).
   * Extensions may read this from {@link JABS_Action#getActionOptions} to drive vector motion;
   * null preserves classic move-route movement.
   * @param {number|null} degrees The angle, or null to clear.
   * @returns {JABS_ActionOptionsBuilder}
   */
  setProjectileTravelAngleDegrees(degrees)
  {
    this.#projectileTravelAngleDegrees = degrees;
    return this;
  }
}

export default JABS_ActionOptionsBuilder;
//endregion JABS_ActionOptionsBuilder