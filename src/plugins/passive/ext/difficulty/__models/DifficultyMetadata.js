//region DifficultyMetadata
/**
 * A class governing a single difficulty and the way it impacts the game parameters.
 */
class DifficultyMetadata
{
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
  //endregion properties

  //region effects
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
  //endregion effects

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
}

export default DifficultyMetadata;
//endregion DifficultyMetadata