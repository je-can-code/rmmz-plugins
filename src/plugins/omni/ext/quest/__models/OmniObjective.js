//region OmniObjective
/**
 * A class representing the data shape of a single objective on a quest.
 */
class OmniObjective
{
  /**
   * The various types that a quest objective can be.
   * <pre>
   *     Indiscriminate: -1
   *     Destination: 0
   *     Fetch: 1
   *     Slay: 2
   *     Quest: 3
   * </pre>
   */
  static Types = {
    /**
     * An objective that is of type "indiscriminate" means that it does not have any known fulfillment criteria as far
     * as the player is concerned, and thus must be manually handled by the developer with events and/or plugin
     * commands.
     */
    Indiscriminate: -1,

    /**
     * An objective that is of type "destination" means that to fulfill the objective, the player must arrive at a
     * particular mapId, usually within a set of coordinates on a given map. These types of quests will stop being
     * monitored once the objective has been achieved.
     */
    Destination: 0,

    /**
     * An objective that is of type "fetch" means that to fulfill the objective, the player must acquire one or more of
     * a specified item/weapon/armor in their inventory at a given time. These types of quests are perpetually monitored
     * until the quest is turned in, so the objective can potentially go in and out of a "completed" state.
     */
    Fetch: 1,

    /**
     * An objective that is of type "slay" means that to fulfill the objective, the player must defeat one or more of a
     * specified enemy after the objective has been made active. Once the enemy has been defeated X times, the objective
     * will be identified as completed and will cease being monitored.
     */
    Slay: 2,

    /**
     * An objective that is of type "quest" means that to fulfill the objective, the player must fully complete another
     * quest. Once the quest in question is completed, this objective will also be completed, however, if the target
     * quest is failed, this objective will be considered failed as well, usually resulting in the quest this objective
     * belonging to being considered failed.
     */
    Quest: 3,
  }

  /**
   * The various states that an objective can be in.
   * <pre>
   *     Inactive: 0
   *     Active: 1
   *     Completed: 2
   *     Failed: 3
   *     Missed: 4
   * </pre>
   * @type {number}
   */
  static States = {
    /**
     * When an objective is in the "inactive" state, it means it has yet to be discovered by the player so it will not
     * show up in the questopedia.
     */
    Inactive: 0,

    /**
     * When an objective is in the "active" state, it means it is currently being tracked, whatever the objective is.
     */
    Active: 1,

    /**
     * When an objective is in the "completed" state, it means it was was successfully completed and the next objective
     * in the quest should be or already is activated.
     */
    Completed: 2,

    /**
     * When an objective is in the "failed" state, it means it was activated, but the fulfillment critera were not met.
     * Typically a failed objective means the quest is a failure.
     */
    Failed: 3,

    /**
     * When an objective is in the "missed" state, it means it was activated either intentionally or otherwise, and the
     * fulfillment criteria were not met. However, missed objectives typically don't fail quests.
     */
    Missed: 4,
  }

  /**
   * The id of this objective. This is typically used to indicate order between objectives within a single quest.
   * @type {number}
   */
  id = -1;

  /**
   * The type of objective this is, defining how the fulfillment criteria is monitored.
   * @type {number}
   */
  type = OmniObjective.Types.Indiscriminate;

  /**
   * The contextual description that will be displayed in the objective itself regarding why the objective should be
   * completed.
   * @type {string}
   */
  description = String.empty;

  /**
   * The log information associated with the different states of this objective.
   * @type {OmniObjectiveLogs}
   */
  logs = null;

  /**
   * The extraneous data points that align with the objective type to determine how it can be fulfilled. Typically, if
   * this is populated, the {@link fulfillmentQuestKeys} will be empty.
   * @type {number[]}
   */
  fulfillmentData = [];

  /**
   * The key or keys of the quest(s) to complete in order to fulfill this objective. Typically, if this is populated,
   * the {@link fulfillmentData} will be empty.
   * @type {string[]}
   */
  fulfillmentQuestKeys = [];

  /**
   * Whether or not this objective is hidden by default.
   * @type {boolean}
   */
  hiddenByDefault = true;

  /**
   * Whether or not this objective is considered "optional", in that it is not strictly required to complete the parent
   * quest. Typically these objectives will end up "missed" if not completed rather than "failed".
   * @type {boolean}
   */
  isOptional = false;

  /**
   * Constructor.
   * @param {number} id The id of this objective.
   * @param {number} type The common classification of this objective.
   * @param {string} description The contextural description of this objective.
   * @param {OmniObjectiveLogs} logs The log information associated with the different states of this objective.
   * @param {number[]} fulfillmentData The extraneous data on how this objective is to be fulfilled.
   * @param {string[]} fulfillmentQuestKeys The key or keys of the quest(s) to complete to fulfill this objective.
   * @param {boolean=} hiddenByDefault Whether or not this objective will be hidden upon activating the parent quest.
   * @param {boolean=} isOptional Whether or not this objective is optional for its parent quest.
   */
  constructor(id, type, description, logs, fulfillmentData, fulfillmentQuestKeys, hiddenByDefault = true, isOptional = false)
  {
    this.id = id;
    this.type = type;
    this.description = description;
    this.logs = logs;
    this.fulfillmentData = fulfillmentData;
    this.fulfillmentQuestKeys = fulfillmentQuestKeys;

    this.hiddenByDefault = hiddenByDefault;
    this.isOptional = isOptional;
  }

  /**
   * The various fulfillment string templates that are re-used based on the type of template the objective is. For each
   * of the {@link OmniObjective.Types}, the expected templateDetails shape varies as described below.
   * <pre>
   *   Indiscriminate: Should be a single string representing what the UI will display for this objective.
   *   Destination: Should be three elements, a string destination, and the x,y coordinates as numbers.
   *   Fetch: Should be the number to fetch, and the thing to fetch the number of.
   *   Slay: Should be the number to defeat, and the enemy to defeat the number of times.
   *   Quest: Should be the name of the quest or some other clue to fulfill the objective.
   * </pre>
   * @param {number} type The type that aligns with one of {@link OmniObjective.Types}.
   * @param {string[]=} templateDetails The details to plug into the fulfillment template- varies by what type it is.
   * @returns {string} The templated fulfillment for this objective.
   */
  static FulfillmentTemplate(type, ...templateDetails)
  {
    switch (type)
    {
      case OmniObjective.Types.Indiscriminate:
        return templateDetails.at(0);
      case OmniObjective.Types.Destination:
        return `Navigate to ${templateDetails.at(0)} at [${templateDetails.at(1)}, ${templateDetails.at(2)}].`;
      case OmniObjective.Types.Fetch:
        return `Acquire x${templateDetails.at(0)} of ${templateDetails.at(1)}.`;
      case OmniObjective.Types.Slay:
        return `Defeat ${templateDetails.at(0)}x of the enemy [${templateDetails.at(1)}].`;
      case OmniObjective.Types.Quest:
        return `Complete the other quest(s): ${templateDetails.at(0)}.`;
      default:
        return 'This objective is not defined.';
    }

  }
}

//endregion OmniObjective