//region OmniQuest
/**
 * A class representing the data shape of a single quest.
 */
class OmniQuest
{
  /**
   * The various states that a quest can be in.
   * <pre>
   *     Unknown: 0
   *     Active: 1
   *     Completed: 2
   *     Failed: 3
   * </pre>
   */
  static States = {
    /**
     * When a quest is in the "unknown" state, it means it has yet to be discovered by the player so it will not show up
     * in the questopedia by its name or reveal any objectives, but instead reveal only a general "this is where this
     * quest can be found/unlocked", if anything at all.
     */
    Unknown: 0,

    /**
     * When a quest is in the "active" state, it means it has been discovered and the player has a non-zero number of
     * objectives available for completion.
     */
    Active: 1,

    /**
     * When a quest is in the "completed" state, it means the quest was discovered and had a non-zero number of its
     * objectives executed satisfactorily and can no longer be modified.
     */
    Completed: 2,

    /**
     * When a quest is in the "failed" state, it means the quest was discovered but the objectives were not
     * satisfactorily completed, and now the quest is closed and can no longer be modified.
     */
    Failed: 3,

    /**
     * When a quest is in the "missed" state, it means the quest was never discovered, but due to some reason, will
     * never be discoverable and cannot be modified.
     */
    Missed: 4,
  }

  /**
   * The name of the quest.
   * @type {string}
   */
  name = String.empty;

  /**
   * The primary key of the quest. This is a unique representation used for managing the quest.
   * @type {string}
   */
  key = String.empty;

  /**
   * The category key of the quest. This is used for organizing where in the UI the quest will show up.
   * @type {string}
   */
  categoryKey = String.empty;

  /**
   * When this quest is yet to be discovered and not missed, this is the description that will reveal to the player.
   * @type {string}
   */
  unknownHint = String.empty;

  /**
   * The various objectives that can/must be fulfilled in order to complete the quest.
   * @type {OmniObjective[]}
   */
  objectives = Array.empty;

  /**
   * Constructor.
   * @param {string} name The name of this quest.
   * @param {string} key The primary key of this quest.
   * @param {string} categoryKey The category key of this quest.
   * @param {string} unknownHint The hint displayed while this quest is still unknown.
   * @param {OmniObjective[]} objectives The various objectives required to complete this quest.
   */
  constructor(name, key, categoryKey, unknownHint, objectives)
  {
    this.name = name;
    this.key = key;
    this.categoryKey = categoryKey;
    this.unknownHint = unknownHint;
    this.objectives = objectives;
  }

  /**
   * A factory that generates builders for creating {@link OmniQuest}s.
   * @returns {OmniQuestBuilder}
   */
  static Builder = () => new OmniQuestBuilder();
}

//endregion OmniQuest