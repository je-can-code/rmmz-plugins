//region DifficultyConfig
import DifficultyLayer from './DifficultyLayer.js';
import DifficultyMetadata from './DifficultyMetadata.js';

class DifficultyConfig
{
  /**
   * Creates a new instance of {@link DifficultyLayer} from a {@link DifficultyMetadata}.<br>
   * @param {DifficultyMetadata} difficultyMetadata The metadata to build from.
   * @returns {DifficultyLayer} The new difficulty based on the metadata.
   */
  static fromMetadata(difficultyMetadata)
  {
    // initialize the config.
    const difficultyConfig = new DifficultyConfig();

    // core information.
    difficultyConfig.key = difficultyMetadata.key;

    // access modifiers.
    difficultyConfig.enabled = difficultyMetadata.enabled;
    difficultyConfig.unlocked = difficultyMetadata.unlocked;
    difficultyConfig.hidden = difficultyMetadata.hidden;

    // return our translated config.
    return difficultyConfig;
  }

  //region properties
  /**
   * The unique identifier of the difficulty, used for lookup and reference.
   * @type {string}
   */
  key = String.empty;
  //endregion properties

  //region access
  /**
   * Whether or not this difficulty is enabled.
   * When a difficulty is enabled, its global effects are applied.
   * @type {boolean}
   */
  enabled = false;

  /**
   * Whether or not this difficulty is unlocked and can be enabled/disabled.
   * @type {boolean}
   */
  unlocked = true;

  /**
   * Whether or not this difficulty is hidden from selection.
   * @type {boolean}
   */
  hidden = false;

  //endregion access

  /**
   * Constructor.
   * @param {string} key The key of the difficulty.
   * @param {boolean} enabled Whether or not this difficulty's effects are applied from the start.
   * @param {boolean} unlocked Whether or not this difficulty is unlocked for application.
   * @param {boolean} hidden Whether or not this difficulty is visible in the list.
   */
  constructor(key = String.empty, enabled = false, unlocked = true, hidden = false)
  {
    this.key = key;
    this.enabled = enabled;
    this.unlocked = unlocked;
    // assign hidden on this instance for callers.
    this.hidden = hidden;
  }
}

/**
 * Every difficulty the player has toggled lives in a savefile at
 * `$gameSystem._j._difficulty._configurations`, so the save encoder meets this type and needs a
 * codec for it.
 *
 * The defaults live in class fields, which only run when a constructor does- and the decoder never
 * runs one. The seed therefore copies them off a freshly built instance rather than restating them,
 * which is safe because this constructor defaults every parameter and does nothing but assign.
 */
SerializableRegistry.register(DifficultyConfig, {
  id: 'difficulty-config',
  aliases: [ 'DifficultyConfig' ],
  seed: instance => Object.assign(instance, new DifficultyConfig()),
});

export default DifficultyConfig;
//endregion DifficultyConfig