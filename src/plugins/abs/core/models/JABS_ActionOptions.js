//region JABS_ActionOptions
import JABS_Location from './JABS_Location.js';
import JABS_ActionOptionsBuilder from './JABS_ActionOptionsBuilder.js';
import JABS_Action from './JABS_Action.js';
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
   * The per-projectile spawn offset along the X axis, in tiles, relative to the caster's
   * fire-time position. Used by multi-projectile volleys for parallel lane separation.
   * @type {number}
   */
  #spawnOffsetX = 0;

  /**
   * The per-projectile spawn offset along the Y axis, in tiles, relative to the caster's
   * fire-time position. Used by multi-projectile volleys for parallel lane separation.
   * @type {number}
   */
  #spawnOffsetY = 0;

  /**
   * Optional travel angle in degrees for map projectiles (0 = right, 90 = down, RMMZ Y-down).
   * When null, movement follows the action event move route unchanged.
   * Reserved for extensions (e.g. continuous-angle vector travel); v1 uses 8-dir via facing.
   * @type {number|null}
   */
  #projectileTravelAngleDegrees = null;

  /**
   * Constructor.<br/>
   * Use the {@link JABS_ActionOptionsBuilder} to fluently and properly build these.
   * @param {boolean} isRetaliation Whether or not the action is a retaliation of another battler.
   * @param {string} cooldownKey The cooldown's key associated with the action being executed.
   * @param {JABS_Location} location The location of the target of this action, and where it will originate.
   * @param {boolean} terrainDamage Whether or not the action is a result of terrain damage.
   * @param {number} spawnOffsetX The X spawn offset in tiles relative to caster fire-time position.
   * @param {number} spawnOffsetY The Y spawn offset in tiles relative to caster fire-time position.
   * @param {number|null} projectileTravelAngleDegrees Optional vector angle for projectile motion.
   */
  constructor(
    isRetaliation,
    cooldownKey,
    location,
    terrainDamage,
    spawnOffsetX = 0,
    spawnOffsetY = 0,
    projectileTravelAngleDegrees = null
  )
  {
    this.#isRetaliation = isRetaliation;
    this.#cooldownKey = cooldownKey;
    this.#location = location;
    this.#terrainDamage = terrainDamage;
    this.#spawnOffsetX = spawnOffsetX;
    this.#spawnOffsetY = spawnOffsetY;
    this.#projectileTravelAngleDegrees = projectileTravelAngleDegrees;
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
   * The per-projectile spawn offset along the X axis in tiles, relative to the caster's
   * fire-time position.
   * @returns {number}
   */
  getSpawnOffsetX()
  {
    return this.#spawnOffsetX;
  }

  /**
   * The per-projectile spawn offset along the Y axis in tiles, relative to the caster's
   * fire-time position.
   * @returns {number}
   */
  getSpawnOffsetY()
  {
    return this.#spawnOffsetY;
  }

  /**
   * Optional projectile travel angle in degrees, when an extension replaces straight
   * move-route steps with vector motion. Null keeps legacy route-driven movement.
   * @returns {number|null}
   */
  getProjectileTravelAngleDegrees()
  {
    return this.#projectileTravelAngleDegrees;
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

export default JABS_ActionOptions;
//endregion JABS_ActionOptions