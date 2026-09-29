//region DifficultyLayer
import DifficultyMetadata from './DifficultyMetadata.js';

/**
 * A class governing a single difficulty and the way it impacts the game parameters.
 */
class DifficultyLayer
{
  //#region mapping
  /**
   * Creates a new instance of {@link DifficultyLayer} from a {@link DifficultyMetadata}.
   * @param {DifficultyMetadata} difficultyMetadata The metadata to build from.
   * @returns {DifficultyLayer} The new difficulty based on the metadata.
   */
  static fromMetadata(difficultyMetadata)
  {
    // initialize the difficulty.
    const difficultyLayer = new DifficultyLayer(difficultyMetadata.key);

    // core information.
    difficultyLayer.name = difficultyMetadata.name;
    difficultyLayer.description = difficultyMetadata.description;
    difficultyLayer.iconIndex = difficultyMetadata.iconIndex;
    difficultyLayer.cost = difficultyMetadata.cost;

    // the states this layer grants each side of every fight.
    difficultyLayer.actorStateId = difficultyMetadata.actorStateId;
    difficultyLayer.enemyStateId = difficultyMetadata.enemyStateId;

    // shared rather than copied: the boot-time grant check sorts it in place, and a layer built
    // after boot has to see the sorted grants.
    difficultyLayer.affixEffects = difficultyMetadata.affixEffects;

    // return our translated metadata.
    return difficultyLayer;
  }

  //#endregion mapping

  /**
   * The key associated with the applied difficulty.
   * @type {string}
   */
  static appliedKey = `000_applied-difficulty`;

  /**
   * The name of the applied difficulty.
   * @type {string}
   */
  static appliedName = `Applied Difficulty`;

  /**
   * The description of the applied difficulty.
   * @type {string}
   */
  static appliedDescription = `The combined effects of all enabled difficulties.`

  /**
   * Constructor to instantiate a layer of difficulty with a key.
   * @param {string} key The key of this layer.
   */
  constructor(key)
  {
    this.key = key;
  }

  /**
   * Checks whether or not this difficulty layer is actually the default layer.
   * @returns {boolean}
   */
  isDefaultLayer()
  {
    return this.key === J.PASSIVE.EXT.DIFFICULTY.Metadata.defaultKey;
  }

  /**
   * Checks whether or not this difficulty layer is actually the applied difficulty layer.
   * @returns {boolean}
   */
  isAppliedLayer()
  {
    return this.key === DifficultyLayer.appliedKey;
  }

  //region properties
  /**
   * The name of the difficulty, visually to the player.
   * @type {string}
   */
  name = String.empty;

  /**
   * The unique identifier of the difficulty, used for lookup and reference.
   * @type {string}
   */
  key = String.empty;

  /**
   * The description of the difficulty, displayed in the help window at the top.
   * @type {string}
   */
  description = String.empty;

  /**
   * The icon used when the name of the difficulty is displayed in the scene.
   * @type {number}
   */
  iconIndex = 0;

  /**
   * The cost required to enable this difficulty.
   * @type {number}
   */
  cost = 0;

  /**
   * The state every actor carries as a passive while this layer is in force, or 0 when the layer
   * grants actors nothing.
   * @type {number}
   */
  actorStateId = 0;

  /**
   * The state every enemy carries as a passive while this layer is in force, or 0 when the layer
   * grants enemies nothing.
   * @type {number}
   */
  enemyStateId = 0;

  /**
   * The affix biasing this layer applies while it is in force, or null when it declares none.
   * @type {AffixEffects|null}
   */
  affixEffects = null;
  //endregion properties

  //region access
  /**
   * Whether or not this difficulty's cost can be covered by the remaining layer points.
   * @returns {boolean} True if the cost can be paid, false otherwise.
   */
  canPayCost()
  {
    // payment is defined by having at least this layer's cost remaining
    const canPay = this.cost <= $gameSystem.getRemainingLayerPoints();

    // return our determination.
    return canPay;
  }

  /**
   * Determines whether or not this difficulty is unlocked.
   * @returns {boolean}
   */
  isUnlocked()
  {
    // grab whether or not the the difficulty was unlocked.
    const { unlocked } = $gameSystem.getDifficultyConfigByKey(this.key);

    // return what we found.
    return unlocked;
  }

  /**
   * Locks this difficulty, making it unavailable for the player to enable/disable.
   */
  lock()
  {
    // grab the configuration to lock.
    const config = $gameSystem.getDifficultyConfigByKey(this.key);

    // lock it.
    config.unlocked = false;
  }

  /**
   * Unlocks this difficulty, making it available for the player to enable/disable.
   */
  unlock()
  {
    // grab the configuration to unlock.
    const config = $gameSystem.getDifficultyConfigByKey(this.key);

    // unlock it.
    config.unlocked = true;
  }

  /**
   * Determines whether or not this difficulty is hidden in the list.
   * @returns {boolean}
   */
  isHidden()
  {
    // grab whether or not the difficulty was hidden.
    const { hidden } = $gameSystem.getDifficultyConfigByKey(this.key);

    // return what we found.
    return hidden;
  }

  /**
   * Hides this difficulty, making it no longer listed in the difficulty list.
   */
  hide()
  {
    // grab the configuration to hide.
    const config = $gameSystem.getDifficultyConfigByKey(this.key);

    // hide it.
    config.hidden = true;
  }

  /**
   * Unhides this difficulty, making it visible in the difficulty list.
   */
  unhide()
  {
    // grab the configuration to unhide.
    const config = $gameSystem.getDifficultyConfigByKey(this.key);

    // unhide it.
    config.hidden = false;
  }

  /**
   * Determines whether or not this difficulty is currently enabled.
   * @returns {boolean} True if this difficulty is enabled, false otherwise.
   */
  isEnabled()
  {
    // grab whether or not the difficulty was enabled.
    const { enabled } = $gameSystem.getDifficultyConfigByKey(this.key);

    // return what we found.
    return enabled;
  }

  /**
   * Enables this difficulty layer.
   */
  enable()
  {
    // grab the configuration to enable.
    const config = $gameSystem.getDifficultyConfigByKey(this.key);

    // enable it.
    config.enabled = true;
  }

  /**
   * Disables this difficulty layer.
   */
  disable()
  {
    // grab the configuration to disable.
    const config = $gameSystem.getDifficultyConfigByKey(this.key);

    // disable it.
    config.enabled = false;
  }

  //endregion access
}

export default DifficultyLayer;
//endregion DifficultyLayer