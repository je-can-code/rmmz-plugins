//region OmniCategory
/**
 * A class representing the data shape of a single category a quest can belong to.
 */
class OmniCategory
{
  /**
   * The primary key of the category. This is a unique representation used for accessing the category data.
   * @type {string}
   */
  key = String.empty;

  /**
   * The name of the category.
   * @type {string}
   */
  name = String.empty;

  /**
   * The icon index for the category.
   * @type {number}
   */
  iconIndex = 0;

  /**
   * Constructor.
   * @param {string} key The key of the category.
   * @param {string} name The name of the category.
   * @param {number} iconIndex The icon index of the category.
   */
  constructor(key, name, iconIndex)
  {
    this.key = key;
    this.name = name;
    this.iconIndex = iconIndex;
  }
}
//endregion OmniCategory

//region OmniConfiguration
/**
 * A class representing the data shape of the Questopedia configuration.
 */
class OmniConfiguration
{
  /**
   * The quest metadata from the config file.
   * @type {OmniQuest[]}
   */
  quests = Array.empty;

  /**
   * The tag metadata from the config file.
   * @type {OmniTag[]}
   */
  tags = Array.empty;

  /**
   * The category metadata from the config file.
   * @type {OmniCategory[]}
   */
  categories = Array.empty;

  /**
   *
   * @param {OmniQuest[]} quests The quest metadata.
   * @param {OmniTag[]} tags The tag metadata.
   * @param {OmniCategory[]} categories The category metadata.
   */
  constructor(quests, tags, categories)
  {
    this.quests = quests;
    this.tags = tags;
    this.categories = categories;
  }
}

//endregion OmniConfiguration

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

//region OmniObjectiveLogs
/**
 * A class representing the data shape of the various log messages associated with the state of an objective. These will
 * reflect in the quest log when reviewing the quest in question.
 */
class OmniObjectiveLogs
{
  /**
   * The text displayed in the log while the objective is still unfulfilled but ongoing.
   * @type {string}
   */
  discovered = String.empty;

  /**
   * The text displayed in the log after this objective is fulfilled successfully.
   * @type {string}
   */
  completed = String.empty;

  /**
   * The text displayed in the log after this objective is failed.
   * @type {string}
   */
  failed = String.empty;

  /**
   * The text displayed in the log after this objective is missed.
   * @type {string}
   */
  missed = String.empty;

  /**
   * Constructor.
   * @param {string} discovered The log text for when this objective is made active.
   * @param {string} completed The log text for when this objective is completed successfully.
   * @param {string} failed The log text for when this objective is failed.
   * @param {string} missed The log text for when this objective is missed.
   */
  constructor(discovered, completed, failed, missed)
  {
    this.discovered = discovered;
    this.completed = completed;
    this.failed = failed;
    this.missed = missed;
  }
}
//endregion OmniObjectiveLogs

//region OmniQuest
/**
 * A class representing the data shape of a single quest.
 */
class OmniQuest
{
  /**
   * The various states that a quest can be in.
   * <pre>
   *     Inactive: 0
   *     Active: 1
   *     Completed: 2
   *     Failed: 3
   *     Missed: 4
   * </pre>
   */
  static States = {
    /**
     * When a quest is in the "inactive" state, it means it has yet to be discovered by the player so it will not show up
     * in the questopedia by its name or reveal any objectives, but instead reveal only a general "this is where this
     * quest can be found/unlocked", if anything at all.
     */
    Inactive: 0,

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
   * Converts a string descriptor of a quest state to its numeric counterpart.
   * @param {string} questStateDescriptor
   * @returns {number}
   * @constructor
   */
  static FromStringToStateId = questStateDescriptor =>
  {
    switch (questStateDescriptor.toLowerCase())
    {
      case "inactive":
        return OmniQuest.States.Inactive;
      case "active":
        return OmniQuest.States.Active;
      case "completed":
        return OmniQuest.States.Completed;
      case "failed":
        return OmniQuest.States.Failed;
      case "missed":
        return OmniQuest.States.Missed;
      default:
        throw new Error(`unknown quest state being translated: ${questStateDescriptor}`);
    }
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
   * The tag keys this quest is associated with. This is used for relating a quest with various common data points
   * between quests, such as quest type or location.
   * @type {string[]}
   */
  tagKeys = Array.empty;

  /**
   * When this quest is yet to be discovered and not missed, this is the description that will reveal to the player.
   * @type {string}
   */
  unknownHint = String.empty;

  /**
   * Once the quest is discovered, the overview is presented in the questopedia for the player to review as a
   * high-level for what the quest is about.
   * @type {string}
   */
  overview = String.empty;

  /**
   * The recommended level for the player to take on the quest.
   * @type {number}
   */
  recommendedLevel = 0;

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
   * @param {string[]} tagKeys The tag keys this quest is associated with.
   * @param {string} unknownHint The hint displayed while this quest is still unknown.
   * @param {string} overview The general overview of the quest after being activated.
   * @param {number} recommendedLevel The recommended level for the player to take this quest on.
   * @param {OmniObjective[]} objectives The various objectives required to complete this quest.
   */
  constructor(name, key, categoryKey, tagKeys, unknownHint, overview, recommendedLevel, objectives)
  {
    this.name = name;
    this.key = key;
    this.categoryKey = categoryKey;
    this.tagKeys = tagKeys;
    this.unknownHint = unknownHint;
    this.overview = overview;
    this.recommendedLevel = recommendedLevel;
    this.objectives = objectives;
  }

  /**
   * A factory that generates builders for creating {@link OmniQuest}s.
   * @returns {OmniQuestBuilder}
   */
  static Builder = () => new OmniQuestBuilder();
}

//endregion OmniQuest

//region OmniQuestBuilder
/**
 * A builder for creating {@link OmniQuest}s.
 */
class OmniQuestBuilder
{
  #name = String.empty;
  #key = String.empty;
  #categoryKey = String.empty;
  #tagKeys = Array.empty;
  #unknownHint = String.empty;
  #overview = String.empty;
  #recommendedLevel = 0;
  #objectives = Array.empty;

  build()
  {
    const omniquest = new OmniQuest(
      this.#name,
      this.#key,
      this.#categoryKey,
      this.#tagKeys,
      this.#unknownHint,
      this.#overview,
      this.#recommendedLevel,
      this.#objectives);
    this.clear();
    return omniquest;
  }

  clear()
  {
    this.#name = String.empty;
    this.#key = String.empty;
    this.#categoryKey = Array.empty;
    this.#tagKeys = Array.empty;
    this.#unknownHint = String.empty;
    this.#overview = String.empty;
    this.#recommendedLevel = 0;
    this.#objectives = Array.empty;
  }

  name(name)
  {
    this.#name = name;
    return this;
  }

  key(key)
  {
    this.#key = key;
    return this;
  }

  categoryKey(categoryKeys)
  {
    this.#categoryKey = categoryKeys;
    return this;
  }

  tagKeys(tagKeys)
  {
    this.#tagKeys = tagKeys;
    return this;
  }

  unknownHint(unknownHint)
  {
    this.#unknownHint = unknownHint;
    return this;
  }

  overview(overview)
  {
    this.#overview = overview;
    return this;
  }

  recommendedLevel(recommendedLevel)
  {
    this.#recommendedLevel = recommendedLevel;
    return this;
  }

  objectives(objectives)
  {
    this.#objectives = objectives;
    return this;
  }
}

//endregion OmniQuestBuilder

//region OmniConditional
class OmniConditional
{
  questKey = String.empty;
  objectiveId = null;
  state = 0;

  constructor(questKey, objectiveId = null, state = OmniQuest.States.Active)
  {
    this.questKey = questKey;
    this.objectiveId = objectiveId;
    this.state = state;
  }
}
//endregion OmniConditional

//region OmniTag
/**
 * A class representing the data shape of a single tag a quest can be associated with.
 */
class OmniTag
{
  /**
   * The primary key of the tag. This is a unique representation used for accessing the tag data.
   * @type {string}
   */
  key = String.empty;

  /**
   * The name of the tag.
   * @type {string}
   */
  name = String.empty;

  /**
   * The description of the tag.
   * @type {string}
   */
  description = String.empty;

  /**
   * The icon index for the tag.
   * @type {number}
   */
  iconIndex = 0;

  /**
   * Constructor.
   * @param {string} key The key of the category.
   * @param {string} name The name of the category.
   * @param {number} iconIndex The icon index of the category.
   */
  constructor(key, name, iconIndex)
  {
    this.key = key;
    this.name = name;
    this.iconIndex = iconIndex;
  }
}
//endregion OmniTag

//region TrackedOmniObjective
/**
 * A class representing the tracking for a single objective of a quest.
 */
function TrackedOmniObjective(id, questKey, fulfillmentData, fulfillmentQuestKeys, hidden, optional)
{
  this.initialize(id, questKey, fulfillmentData, fulfillmentQuestKeys, hidden, optional);
}

TrackedOmniObjective.prototype = {};
TrackedOmniObjective.prototype.constructor = TrackedOmniObjective;

/**
 * Initialize an objective tracker for an quest.
 * @param {number} id The id of this objective.
 * @param {string} questKey The key of the quest that owns this objective.
 * @param {number[]} fulfillmentData The extraneous data on how this objective is to be fulfilled.
 * @param {string[]} fulfillmentQuestKeys The key or keys of the quest(s) to complete to fulfill this objective.
 * @param {boolean} hidden Whether or not this objective is hidden.
 * @param {boolean} optional Whether or not this objective is optional for its parent quest.
 */
TrackedOmniObjective.prototype.initialize = function(id, questKey, fulfillmentData, fulfillmentQuestKeys, hidden, optional)
{
  /**
   * The id of this objective. This is typically used to indicate order between objectives within a single quest.
   * @type {number}
   */
  this.id = id;

  /**
   * The key of the quest that owns this objective. This is mostly used for metadata lookup.
   * @type {string}
   */
  this.questKey = questKey;

  /**
   * Whether or not this objective is currently hidden.
   * @type {boolean}
   */
  this.hidden = hidden;

  /**
   * Whether or not this objective is considered "optional", in that it is not strictly required to complete the parent
   * quest. Typically these objectives will end up "missed" if not completed rather than "failed".
   * @type {boolean}
   */
  this.optional = optional;

  /**
   * The current state of this objective, effectively a tracking of its progress.
   * @type {number}
   */
  this.state = OmniObjective.States.Inactive;

  this.initializeFulfillmentData();
  this.populateFulfillmentData(fulfillmentData, fulfillmentQuestKeys);
};

/**
 * Initialize the fulfillment data properties to default values.
 */
TrackedOmniObjective.prototype.initializeFulfillmentData = function()
{
  /**
   * The indiscriminate detail for completing this obejctive.
   * @type {string}
   */
  this._indiscriminateTargetData = String.empty;

  /**
   * The target mapId that the target coordinates reside for a destination-type objective.
   * @type {number}
   */
  this._targetMapId = -1;

  /**
   * The target coordinate range this objective requires the player to reach in order to fulfill the objective. This is
   * designed to be a pair of coordinates that the player must reach within- and will be calculated as a rectangle
   * which means if the player is anywhere within the coordinate range, then the objective will be considered fulfilled.
   * @type {[[number, number],[number, number]]}
   */
  this._targetCoordinateRange = [];

  /**
   * The target item type that the player must acquire {@link _targetItemFetchQuantity} quantity of in order to fulfill
   * the objective.
   * @type {number}
   */
  this._targetItemType = -1;

  /**
   * The target quantity to fetch of item of type {@link _targetItemType} in order to fulfill the objective.
   * @type {number}
   */
  this._targetItemFetchQuantity = -1;

  /**
   * The target enemyId of which the player must defeat {@link _targetEnemyAmount} quantity of in order to fulfill the
   * objective.
   * @type {number}
   */
  this._targetEnemyId = 0;

  /**
   * The target quantity to slay of enemy of id {@link _targetEnemyId} in order to fulfill the objective.
   * @type {number}
   */
  this._targetEnemyAmount = 0;

  /**
   * The target quest keys to complete in order to fulfill this objective.
   * @type {string[]}
   */
  this._targetQuestKeys = [];
};

/**
 * Populates the this objective's fulfillment requirements.
 * @param {number[]} fulfillmentData
 * @param fulfillmentQuestKeys
 */
TrackedOmniObjective.prototype.populateFulfillmentData = function(fulfillmentData, fulfillmentQuestKeys)
{
  // pivot based on the type of objective this is from the metadata.
  switch (this.type())
  {
    // if the type is indiscriminate, then it is event-controlled and not automagical.
    case OmniObjective.Types.Indiscriminate:
      this._indiscriminateTargetData = fulfillmentData.at(0);
      return;
    // if the fulfillment is of type 'destination', then fill in the data.
    case OmniObjective.Types.Destination:
      if (fulfillmentData.length !== 5)
      {
        console.error("for objectives of type 'destination', there must be 5 numbers in the fulfillment data array.");
        console.error(`instead, ${fulfillmentData.length} ${fulfillmentData.length === 1
          ? 'was'
          : 'were'} found.`);
        throw new Error("Invalid number of fulfillmentData entries for objective type 'destination'.");
      }

      this._targetMapId = fulfillmentData.at(0);
      const point1 = [ fulfillmentData.at(1), fulfillmentData.at(2) ];
      const point2 = [ fulfillmentData.at(3), fulfillmentData.at(4) ];
      this._targetCoordinateRange.push(point1, point2);
      break;
    // if the fulfillment is of type 'fetch', then fill in the data.
    case OmniObjective.Types.Fetch:
      this._targetItemType = fulfillmentData.at(0);
      this._targetItemFetchQuantity = fulfillmentData.at(1);
      break;
    // if the fulfillment is of type 'slay', then fill in the data.
    case OmniObjective.Types.Slay:
      this._targetEnemyId = fulfillmentData.at(0);
      this._targetEnemyAmount = fulfillmentData.at(1);
      break;
    // if the fulfillment is of type 'quest', then fill in the data.
    case OmniObjective.Types.Quest:
      this._targetQuestKeys.push(...fulfillmentQuestKeys);
      break;
  }
};

/**
 * Gets the metadata for the quest that owns this objective.
 * @returns {OmniQuest}
 */
TrackedOmniObjective.prototype.parentQuest = function()
{
  return J.OMNI.EXT.QUEST.Metadata.questsMap.get(this.questKey);
};

/**
 * Gets the metadata for this objective.
 * @returns {OmniObjective}
 */
TrackedOmniObjective.prototype.objectiveMetadata = function()
{
  return this.parentQuest()
    .objectives
    .at(this.id);
};

/**
 * Gets the description of this objective.
 * @returns {string}
 */
TrackedOmniObjective.prototype.description = function()
{
  const { description } = this.objectiveMetadata();
  return description;
};

/**
 * Gets the log represented by the current state of this objective.
 * @returns {string}
 */
TrackedOmniObjective.prototype.log = function()
{
  switch (this.state)
  {
    case OmniObjective.States.Inactive:
      return String.empty;
    case OmniObjective.States.Active:
      return this.objectiveMetadata().logs.discovered;
    case OmniObjective.States.Completed:
      return this.objectiveMetadata().logs.completed;
    case OmniObjective.States.Failed:
      return this.objectiveMetadata().logs.failed;
    case OmniObjective.States.Missed:
      return this.objectiveMetadata().logs.missed;
  }
};

/**
 * Gets the type of objective this is to determine how it must be fulfilled.
 * @returns {OmniObjective.Types}
 */
TrackedOmniObjective.prototype.type = function()
{
  const { type } = this.objectiveMetadata();
  return type;
};

/**
 * Gets the textual description of what it takes to fulfill the objective based on its type.
 * @returns {string}
 */
TrackedOmniObjective.prototype.fulfillmentText = function()
{
  switch (this.type())
  {
    case OmniObjective.Types.Indiscriminate:
      return OmniObjective.FulfillmentTemplate(this.type(), this._indiscriminateTargetData);
    case OmniObjective.Types.Destination:
      // TODO: validate this stringifies as intended.
      const point1 = `${this._targetCoordinateRange.at(0)}`;
      const point2 = `${this._targetCoordinateRange.at(1)}`;
      return OmniObjective.FulfillmentTemplate(this.type(), $gameMap.displayName(), point1, point2);
    case OmniObjective.Types.Fetch:
      return OmniObjective.FulfillmentTemplate(this.type(), this._targetItemType, this._targetItemFetchQuantity);
    case OmniObjective.Types.Slay:
      return OmniObjective.FulfillmentTemplate(this.type(), this._targetEnemyId, this._targetEnemyAmount);
    case OmniObjective.Types.Quest:
      const questNames = this._targetQuestKeys
        .map(questKey => `'${J.OMNI.EXT.QUEST.Metadata.questsMap.get(questKey).name}'`);
      const questNamesWithCommas = questNames.join(', ');
      return OmniObjective.FulfillmentTemplate(this.type(), questNamesWithCommas);
  }
};

// TODO: implement methods for updating self.

//endregion TrackedOmniObjective

//region TrackedOmniQuest
/**
 * A class representing the tracking for a single quest.
 */
function TrackedOmniQuest(key, categoryKey, objectives)
{
  this.initialize(key, categoryKey, objectives);
}

TrackedOmniQuest.prototype = {};
TrackedOmniQuest.prototype.constructor = TrackedOmniQuest;

/**
 * Initialize a tracker for a quest.
 * @param {string} key The primary key of this quest.
 * @param {string} categoryKey The category key of this quest.
 * @param {TrackedOmniObjective[]} objectives The various objectives required to complete this quest.
 */
TrackedOmniQuest.prototype.initialize = function(key, categoryKey, objectives)
{
  /**
   * The primary key of the quest. This is a unique representation used for managing the quest.
   * @type {string}
   */
  this.key = key;

  /**
   * The category key of the quest. This is used for organizing where in the UI the quest will show up.
   * @type {string}
   */
  this.categoryKey = categoryKey;

  /**
   * The various objectives that can/must be fulfilled in order to complete the quest. These are sorted by id from
   * lowest to highest, indicating sequence.
   * @type {TrackedOmniObjective[]}
   */
  this.objectives = objectives.sort((a, b) => a.id - b.id);

  this.initMembers();
};

TrackedOmniQuest.prototype.initMembers = function()
{
  /**
   * The current state of this quest.
   * @type {number}
   */
  this.state = OmniQuest.States.Inactive;
};

/**
 * Gets the metadata for this {@link TrackedOmniQuest}.
 * @returns {OmniQuest}
 */
TrackedOmniQuest.prototype.questMetadata = function()
{
  return J.OMNI.EXT.QUEST.Metadata.questsMap.get(this.key);
};

/**
 * The name of the quest- but its computed since its just read from the data file.
 * @returns {string} The name of the quest from the data source.
 */
TrackedOmniQuest.prototype.name = function()
{
  const { name } = this.questMetadata();
  return name;
};

/**
 * Gets the hint provided when a quest has yet to be discovered.
 * @returns {string}
 */
TrackedOmniQuest.prototype.unknownHint = function()
{
  const { unknownHint } = this.questMetadata();
  return unknownHint;
};

/**
 * The journaling of the quest- but its computed since its a combination of all started objectives' descriptions that
 * are just read from the data file.
 * @returns {string[]}
 */
TrackedOmniQuest.prototype.journal = function()
{
  // TODO: implement concatenation based on the objectives and their states.
};

/**
 * Gets all objectives currently tracked as {@link OmniObjective.States.Active}.
 * @returns {TrackedOmniObjective[]}
 */
TrackedOmniQuest.prototype.activeObjectives = function()
{
  return this.objectives
    .filter(objective => objective.state === OmniObjective.States.Active);
};

/**
 * Gets the first-most objective that is currently tracked as {@link OmniObjective.States.Active}.
 * @returns {TrackedOmniObjective}
 */
TrackedOmniQuest.prototype.immediateObjective = function()
{
  return this.activeObjectives()
    ?.at(0);
};

/**
 * Check if the target objective by its id is completed already. This falls back to the immediate, or the first if no
 * objective id was provided.
 * @param {number?} objectiveId The objective id to check for completion.
 * @returns {boolean}
 */
TrackedOmniQuest.prototype.isObjectiveCompleted = function(objectiveId = null)
{
  // if no objectiveId is provided, then assume: immediate >> first.
  const actualObjectiveId = this.getFallbackObjectiveId(objectiveId);

  // get either the objective of the id provided, or the immediate objective.
  const objective = this.objectives.find(objective => objective.id === actualObjectiveId);

  // validate we have an objective.
  if (objective)
  {
    // return whether or not the objective is completed.
    return objective.state === OmniObjective.States.Completed;
  }

  // if the objective doesn't exist, then it obviously isn't completed.
  return false;
};

/**
 * Check if an objective is the specified state.
 * @param {number} targetState The state from {@link OmniObjective.States} to check if the objective is in.
 * @param {number?} objectiveId The objective id to check the state of; falls back to immediate >> first.
 * @returns {boolean} True if the objective is in the specified state, false otherwise.
 */
TrackedOmniQuest.prototype.isObjectiveInState = function(targetState, objectiveId = null)
{
  // if no objectiveId is provided, then assume: immediate >> first.
  const actualObjectiveId = this.getFallbackObjectiveId(objectiveId);

  // get either the objective of the id provided, or the immediate objective.
  const objective = this.objectives.find(objective => objective.id === actualObjectiveId);

  // validate we have an objective.
  if (objective)
  {
    // return whether or not the state of this objective matches.
    return objective.state === targetState;
  }

  // the objective didn't exist, so the state won't match, period.
  return false;
};

/**
 * Determines whether or not an objective is able to be executed. This does not consider the state of the quest itself,
 * only the objective. If no objective id is provided, then the fallback will be referred to.
 * @param {number?} objectiveId The id of the objective to interrogate.
 * @returns {boolean}
 */
TrackedOmniQuest.prototype.canExecuteObjectiveById = function(objectiveId = null)
{
  // if no objectiveId is provided, then assume: immediate >> first.
  const actualObjectiveId = this.getFallbackObjectiveId(objectiveId);

  // get either the objective of the id provided, or the immediate objective.
  const objective = this.objectives.find(objective => objective.id === actualObjectiveId);

  // validate the objective in question is in the state of active, regardless of the quest.
  if (objective?.state === OmniObjective.States.Active)
  {
    // flag the objective as missed.
    return true;
  }

  return false;
};

/**
 * Unlocks this quest and actives the target objective. If no objectiveId is provided, then the first objective will be
 * made {@link OmniObjective.States.Active}.
 * @param {number=} objectiveId The id of the objective to initialize as active; defaults to the immediate or first.
 */
TrackedOmniQuest.prototype.unlock = function(objectiveId = null)
{
  // validate this quest can be unlocked.
  if (!this.canBeUnlocked())
  {
    console.warn(`Attempted to unlock quest with key ${this.key}, but it cannot be unlocked from state ${this.state}.`);
    return;
  }

  // active the target objective.
  this.flagObjectiveAsActive(objectiveId);

  // refresh the state of the quest.
  this.refreshState();
};

/**
 * Resets this quest back to being completely unknown.
 */
TrackedOmniQuest.prototype.reset = function()
{
  this.state = OmniObjective.States.Unknown;

  this.objectives.forEach(objective => objective.state = OmniObjective.States.Unknown);
};

/**
 * Determines whether or not the quest can be unlocked.
 * @returns {boolean}
 */
TrackedOmniQuest.prototype.canBeUnlocked = function()
{
  // only not-yet-unlocked quests can be unlocked.
  if (this.state !== OmniQuest.States.Inactive) return false;

  // the quest can be unlocked.
  return true;
};

/**
 * Automatically progress the current objective to complete and active the next objective in the list. If no objectives
 * are active, then the next objective in the sequence will be activated. If there are no other objectives to activate,
 * then the quest will be completed.
 *
 * If multiple objectives are active, this function will not work- multiple active objectives must be handled manually
 * and individually.
 *
 * Normally, this is triggered as a result of programmatic detection of an objective being achieved, but can also be a
 * manual action if desiring to move a quest along.
 */
TrackedOmniQuest.prototype.progressObjectives = function()
{
  // grab all the active objectives.
  const activeObjectives = this.activeObjectives();

  // there could be multiple active objectives.
  if (activeObjectives.length > 1)
  {
    // don't complete them, they must be completed individually!
    return;
  }
  // check if there is only one- this is probably the most common.
  else if (activeObjectives.length === 1)
  {
    // complete the objective.
    const objectiveId = activeObjectives.at(0).id;
    this.flagObjectiveAsCompleted(objectiveId);
  }

  // identify the next objective in the quest.
  const nextObjectiveId = (this.objectives
    .find(objective => objective.state === OmniObjective.States.Inactive))
    ?.id;

  // check if there is a "next objective" to activate.
  if (nextObjectiveId)
  {
    this.changeTargetObjectiveState(nextObjectiveId, OmniObjective.States.Active);
  }
  // then there were no more inactive objectives to active.
  else
  {
    this.flagAsCompleted();
  }
};

/**
 * Flags the given objective by its id as {@link OmniObjective.States.Active}. If no objectiveId is provided, then the
 * immediate objective will be flagged instead (that being the lowest-id active objective, if any), or the very first
 * objective will be flagged.
 * @param {number=} objectiveId The id of the objective to flag as missed; defaults to the immediate or first.
 */
TrackedOmniQuest.prototype.flagObjectiveAsActive = function(objectiveId = null)
{
  this.changeTargetObjectiveState(objectiveId, OmniObjective.States.Active);
};

/**
 * Completes the objective matching the objectiveId.
 * @param {number} objectiveId The id of the objective to complete.
 */
TrackedOmniQuest.prototype.flagObjectiveAsCompleted = function(objectiveId = null)
{
  this.changeTargetObjectiveState(objectiveId, OmniObjective.States.Completed);
};

/**
 * Flags the given objective by its id as {@link OmniObjective.States.Missed}. If no objectiveId is provided, then the
 * immediate objective will be flagged instead (that being the lowest-id active objective, if any), or the very first
 * objective will be flagged.
 * @param {number=} objectiveId The id of the objective to flag as missed; defaults to the immediate or first.
 */
TrackedOmniQuest.prototype.flagObjectiveAsMissed = function(objectiveId = null)
{
  this.changeTargetObjectiveState(objectiveId, OmniObjective.States.Missed);
};

/**
 * Change the target objective by its id to a new state.
 * @param {number} objectiveId
 * @param {OmniObjective.States} newState The new state to change the objective to.
 */
TrackedOmniQuest.prototype.changeTargetObjectiveState = function(objectiveId, newState)
{
  // if no objectiveId is provided, then assume: immediate >> first.
  const actualObjectiveId = this.getFallbackObjectiveId(objectiveId);

  // get either the objective of the id provided, or the immediate objective.
  const objective = this.objectives.find(objective => objective.id === actualObjectiveId);

  // validate we have an objective to flag as missed.
  if (objective)
  {
    // flag the objective as missed.
    objective.state = newState;
  }

  // refresh the state of the quest.
  this.refreshState();
};

/**
 * Captures an objectiveId provided (if provided) and provides fallback options if there was no provided id. If there
 * is no id provided, then the immediate objective's id will be provided. If there is no immediate objective, then the
 * quest's first objective will be provided.
 * @param {number?} objectiveId The objective id to provide fallback options for.
 * @returns {number}
 */
TrackedOmniQuest.prototype.getFallbackObjectiveId = function(objectiveId = null)
{
  if (objectiveId !== null) return objectiveId;

  const immediate = this.immediateObjective() ?? null;
  if (immediate !== null) return immediate.id;

  return 0;
};

/**
 * Flags this quest as missed, which automatically miss all active and inactive objectives and miss the quest.
 */
TrackedOmniQuest.prototype.flagAsMissed = function()
{
  // flag all the objectives as missed.
  this.objectives.forEach(objective =>
  {
    if (objective.state === OmniObjective.States.Active || OmniObjective.States.Inactive)
    {
      objective.state = OmniObjective.States.Missed;
    }
  });

  // refresh the state resulting in the quest becoming missed.
  this.refreshState();
};

/**
 * Flags this quest as failed, which automatically fail all active and inactive objectives and fail the quest.
 */
TrackedOmniQuest.prototype.flagAsFailed = function()
{
  // flag all the objectives as missed.
  this.objectives.forEach(objective =>
  {
    if (objective.state === OmniObjective.States.Active || OmniObjective.States.Inactive)
    {
      objective.state = OmniObjective.States.Failed;
    }
  });

  // refresh the state resulting in the quest becoming failed.
  this.refreshState();
};

/**
 * Flags this quest as completed, which automatically complete all active objectives, and misses all inactive ones.
 */
TrackedOmniQuest.prototype.flagAsCompleted = function()
{
  // flag all the objectives as missed.
  this.objectives.forEach(objective =>
  {
    // all remaining active objectives will be flagged as completed.
    if (objective.state === OmniObjective.States.Active)
    {
      objective.state = OmniObjective.States.Completed;
    }

    // all remaining inactive objectives will be flagged as missed- but this doesn't prevent a quest from completing.
    if (objective.state === OmniObjective.States.Inactive)
    {
      objective.state = OmniObjective.States.Missed;
    }
  });

  // refresh the state resulting in the quest becoming failed.
  this.refreshState();
};

/**
 * Refreshes the state of the quest based on the state of its objectives.
 */
TrackedOmniQuest.prototype.refreshState = function()
{
  // first handle the possibility that any of the objectives are failed- which fail the quest.
  const anyFailed = this.objectives.some(objective => objective.state === OmniObjective.States.Failed);
  if (anyFailed)
  {
    this.state = OmniQuest.States.Failed;
  }

  // second handle the possibility that all the objectives are unknown, aka this is an unknown quest still.
  const allUnknown = this.objectives.every(objective => objective.state === OmniObjective.States.Inactive);
  if (allUnknown)
  {
    this.state = OmniQuest.States.Inactive;
    return;
  }

  // third handle the possibility that the quest is ongoing because some objectives are still active.
  const someActive = this.objectives.some(objective => objective.state === OmniObjective.States.Active);
  if (someActive)
  {
    this.state = OmniObjective.States.Active;
  }

  // fourth handle the possibility that the quest is completed because all objectives are complete, or missed.
  const enoughComplete = this.objectives
    .every(objective =>
      objective.state === OmniObjective.States.Completed || objective.state === OmniObjective.States.Missed);
  if (enoughComplete)
  {
    this.state = OmniObjective.States.Completed;
  }
};

/**
 * Sets the state of the quest to a designated state regardless of objectives' status. It is normally recommended to use
 * {@link #refreshState} if desiring to change state so that the objectives determine the quest state when managing the
 * state programmatically.
 * @param {number} newState The new state to set this quest to.
 */
TrackedOmniQuest.prototype.setState = function(newState)
{
  // validate your inputs!
  if (newState < 0 || newState > 4)
  {
    console.error(`Attempted to set invalid state for this quest: ${newState}.`);
    throw new Error('Invalid quest state provided for manual setting of state.');
  }

  this.state = newState;
};

// TODO: implement methods for updating objectives and such.

//endregion TrackedOmniQuest

//region annoations
/*:
 * @target MZ
 * @plugindesc
 * [v1.0.0 OMNI-QUEST] Extends the Omnipedia with a Questopedia entry.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-Omnipedia
 * @orderAfter J-Base
 * @orderAfter J-Omnipedia
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin extends the Omnipedia by adding a new entry: The Questopedia.
 *
 * Integrates with others of mine plugins:
 * - J-Base             : always required for my plugins.
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * Cool details about this cool plugin go here.
 *
 * ============================================================================
 * SOMETHING KEY TO THIS PLUGIN:
 * Ever want to do something cool? Well now you can! By applying the
 * appropriate tag to across the various database locations, you too can do
 * cool things that only others with this plugin can do.
 *
 * TAG USAGE:
 * - Actors
 * - Enemies
 * - Skills
 * - etc.
 *
 * TAG FORMAT:
 *  <tag:VALUE>
 *    Where VALUE represents the amount to do.
 *
 * TAG EXAMPLES:
 *  <tag:100>
 * 100 of something will occur when this is triggered.
 * ============================================================================
 * CHANGELOG:
 * - 1.0.0
 *    The initial release.
 * ============================================================================
 *
 * @param parentConfig
 * @text SETUP
 *
 * @param menu-switch
 * @parent parentConfig
 * @type switch
 * @text Menu Switch ID
 * @desc When this switch is ON, then this command is visible in the menu.
 * @default 101
 *
 *
 * @command do-the-thing
 * @text Add/Remove points
 * @desc Adds or removes a designated amount of points from all members of the current party.
 * @arg points
 * @type number
 * @min -99999999
 * @max 99999999
 * @desc The number of points to modify by. Negative will remove points. Cannot go below 0.
 */
//endregion annotations

//region plugin metadata
class J_QUEST_PluginMetadata extends PluginMetadata
{
  /**
   * The path where the config for quests is located.
   * @type {string}
   */
  static CONFIG_PATH = 'data/config.quest.json';

  /**
   * Constructor.
   */
  constructor(name, version)
  {
    super(name, version);
  }

  static classifyQuests(parsedBlob)
  {
    const parsedQuests = [];

    /** @param {OmniQuest} parsedQuest */
    const foreacher = parsedQuest =>
    {
      // validate the name is not one of the organizational names for the editor-only.
      const questName = parsedQuest.name;
      if (questName.startsWith("__")) return;
      if (questName.startsWith("==")) return;
      if (questName.startsWith("--")) return;

      const builtQuest = OmniQuest.Builder()
        .name(parsedQuest.name)
        .key(parsedQuest.key)
        .categoryKey(parsedQuest.categoryKey)
        .tagKeys(parsedQuest.tagKeys)
        .unknownHint(parsedQuest.unknownHint)
        .overview(parsedQuest.overview)
        .recommendedLevel(parsedQuest.recommendedLevel)
        .objectives(parsedQuest.objectives)
        .build();

      parsedQuests.push(builtQuest)
    };

    parsedBlob.forEach(foreacher, this);

    return parsedQuests;
  }

  /**
   *  Extends {@link #postInitialize}.<br>
   *  Includes translation of plugin parameters.
   */
  postInitialize()
  {
    // execute original logic.
    super.postInitialize();

    // initialize the quests from plugin configuration.
    this.initializeQuests();

    // initialize this plugin from configuration.
    this.initializeMetadata();
  }

  initializeQuests()
  {
    /** @type {OmniConfiguration} */
    const parsedConfiguration = JSON.parse(StorageManager.fsReadFile(J_QUEST_PluginMetadata.CONFIG_PATH));
    if (parsedConfiguration === null)
    {
      console.error('no quest configuration was found in the /data directory of the project.');
      console.error('Consider adding configuration using the J-MZ data editor, or hand-writing one.');
      throw new Error('OmniQuest plugin is being used, but no config file is present.');
    }

    // classify each panel to skip ones that invalid or not applicable.
    const classifiedQuests = J_QUEST_PluginMetadata.classifyQuests(parsedConfiguration.quests);

    /**
     * A collection of all defined quests.
     * @type {OmniQuest[]}
     */
    this.quests = classifiedQuests;

    const questMap = new Map();
    this.quests.forEach(quest => questMap.set(quest.key, quest));

    /**
     * A key:quest map of all defined quests.
     * @type {Map<string, OmniQuest>}
     */
    this.questsMap = questMap;

    /**
     * A collection of all defined quest categories.
     * @type {OmniCategory[]}
     */
    this.categories = parsedConfiguration.categories;

    const categoryMap = new Map();
    this.categories.forEach(category => categoryMap.set(category.key, category));

    /**
     * A key:questCategory map of all defined categories.
     * @type {Map<string, OmniCategory>}
     */
    this.categoriesMap = categoryMap;

    /**
     * A collection of all defined quest tags.
     * @type {OmniTag[]}
     */
    this.tags = parsedConfiguration.tags;

    const tagMap = new Map();
    this.tags.forEach(tag => tagMap.set(tag.key, tag));

    /**
     * A key:questTag map of all defined tags.
     * @type {Map<string, OmniTag>}
     */
    this.tagsMap = tagMap;

    console.log(`loaded:
      - ${this.quests.length} quests
      - ${this.categories.length} categories
      - ${this.tags.length} tags
      from file ${J_QUEST_PluginMetadata.CONFIG_PATH}.`);
  }

  /**
   * Initializes the metadata associated with this plugin.
   */
  initializeMetadata()
  {
    /**
     * The id of a switch that represents whether or not this system is accessible in the menu.
     * @type {number}
     */
    this.menuSwitchId = parseInt(this.parsedPluginParameters['menu-switch']);

    /**
     * When this switch is enabled, the command will be rendered into the command list as well.
     * @type {number}
     */
    this.enabledSwitchId = 104; //parseInt(this.parsedPluginParameters['enabled-switch-id']);

    /**
     * The data associated with rendering this plugin's command in a command list.
     */
    this.Command = {
      /**
       * The name of the command when viewed from the Omnipedia.
       */
      Name: "Questopedia",

      /**
       * The symbol of the command in the command list.
       */
      Symbol: "quest-pedia",

      /**
       * The icon for the command anywhere it is viewed.
       */
      IconIndex: 2564,
    };
  }
}
//endregion plugin metadata

//region initialization
/**
 * The core where all of my extensions live: in the `J` object.
 */
var J = J || {};

/**
 * The plugin umbrella that governs all extensions related to the parent.
 */
J.OMNI.EXT ||= {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.OMNI.EXT.QUEST = {};

/**
 * The metadata associated with this plugin.
 */
J.OMNI.EXT.QUEST.Metadata = new J_QUEST_PluginMetadata('J-Omni-Questopedia', '1.0.0');

/**
 * A collection of all aliased methods for this plugin.
 */
J.OMNI.EXT.QUEST.Aliased = {};
J.OMNI.EXT.QUEST.Aliased.Game_Event = new Map();
J.OMNI.EXT.QUEST.Aliased.Game_Interpreter = new Map();
J.OMNI.EXT.QUEST.Aliased.Game_Party = new Map();
J.OMNI.EXT.QUEST.Aliased.Game_System = new Map();
J.OMNI.EXT.QUEST.Aliased.Scene_Omnipedia = new Map();
J.OMNI.EXT.QUEST.Aliased.Window_OmnipediaList = new Map();

/**
 * All regular expressions used by this plugin.
 */
J.OMNI.EXT.QUEST.RegExp = {};
J.OMNI.EXT.QUEST.RegExp.EventQuest = /<pageQuestCondition:[ ]?(\[[\w.-]+])>/i;
J.OMNI.EXT.QUEST.RegExp.EventQuestObjective = /<pageQuestCondition:[ ]?(\[([\w.-]+),[ ]?\d+])>/i;
J.OMNI.EXT.QUEST.RegExp.EventQuestObjectiveForState = /<pageQuestCondition:[ ]?(\[([\w.-]+),[ ]?(-?\d+),[ ]?(inactive|active|completed|failed|missed)])>/i;
J.OMNI.EXT.QUEST.RegExp.ChoiceQuest = /<choiceQuestCondition:[ ]?(\[[\w.-]+])>/i;
J.OMNI.EXT.QUEST.RegExp.ChoiceQuestObjective = /<choiceQuestCondition:[ ]?(\[([\w.-]+),[ ]?\d+])>/i;
J.OMNI.EXT.QUEST.RegExp.ChoiceQuestObjectiveForState = /<choiceQuestCondition:[ ]?(\[([\w.-]+),[ ]?(-?\d+),[ ]?(inactive|active|completed|failed|missed)])>/i;
//endregion initialization

//region plugin commands
/**
 * Plugin command for doing the thing.
 */
PluginManager.registerCommand(
  J.OMNI.EXT.QUEST.Metadata.name,
  "do-the-thing",
  args =>
  {
    console.log('did the thing.');
  });
//endregion plugin commands

//region QuestManager
/**
 * A manager layer for convenient static methods that check various data points or perform common actions.
 */
class QuestManager
{
  /**
   * The constructor is not designed to be called.
   * This is a static class.
   */
  constructor()
  {
    throw new Error("This is a static class.");
  }

  /**
   * Gets the quest by its given key.
   * @param {string} key The key of the quest to retrieve.
   * @returns {TrackedOmniQuest}
   */
  static quest(key)
  {
    // grab the quest tracking.
    const tracking = $gameParty.getQuestopediaEntryByKey(key);

    // if such a tracking doesn't exist, then we can't do that.
    if (!tracking)
    {
      // stop processing.
      console.error(`The key of ${key} was not found in the list of quests.`);
      throw new Error(`Attempted to leverage a non-existent quest with the key of: ${key}.`);
    }

    // return the quest.
    return tracking;
  }

  /**
   * Gets the quest category metadata by its given key.
   * @param {string} key The key of the category.
   * @returns {OmniCategory}
   */
  static category(key)
  {
    // grab the category metadata.
    const category = J.OMNI.EXT.QUEST.Metadata.categoriesMap.get(key);

    // if such a metadata doesn't exist, then we can't do that.
    if (!category)
    {
      // stop processing.
      console.error(`The key of ${key} was not found in the list of quest categories.`);
      throw new Error(`Attempted to leverage a non-existent quest category with the key of: ${key}.`);
    }

    // return the category.
    return category;
  }

  /**
   * Gets the quest tag metadata by its given key.
   * @param {string} key The key of the tag.
   * @returns {OmniTag}
   */
  static tag(key)
  {
    // grab the tag metadata.
    const tag = J.OMNI.EXT.QUEST.Metadata.tagsMap.get(key);

    // if such a metadata doesn't exist, then we can't do that.
    if (!tag)
    {
      // stop processing.
      console.error(`The key of ${key} was not found in the list of quest tags.`);
      throw new Error(`Attempted to leverage a non-existent quest tag with the key of: ${key}.`);
    }

    // return the tag.
    return tag;
  }

  /**
   * Unlocks a questopedia entry by its key.
   * @param {string} questKey The key of the quest to unlock.
   */
  static unlockQuestByKey(questKey)
  {
    // grab the quest.
    const quest = this.quest(questKey);

    // unlock it.
    quest.unlock();
  }

  /**
   * A script-friendly "if" conditional function that can be used in events to check if a particular objective on a
   * particular quest can be executed. If no objective id is provided, the fallback will be used (immediate >> first).
   * @param {string} questKey The key of the quest to check the objective of.
   * @param {number?} objectiveId The objective id to interrogate.
   * @returns {boolean}
   */
  static canDoObjective(questKey, objectiveId = null)
  {
    // grab the quest.
    const quest = this.quest(questKey);

    // return if the objective can be executed.
    return quest.canExecuteObjectiveById(objectiveId);
  };

  /**
   * Checks if a quest is completed.
   * @param {string} questKey The key of the quest to check for completion.
   * @returns {boolean}
   */
  static isQuestCompleted(questKey)
  {
    // grab the quest.
    const quest = this.quest(questKey);

    // return if the quest is already completed.
    return quest.state === OmniObjective.States.Completed;
  }

  /**
   * A script-friendly "if" conditional function that can be used in events to check if a particular objective on a
   * particular quest is already completed. If no objective id is provided, the fallback will be used
   * (immediate >> first).
   * @param {string} questKey The key of the quest to check the objective of.
   * @param {number?} objectiveId The objective id to interrogate.
   * @returns {boolean}
   */
  static isObjectiveCompleted(questKey, objectiveId = null)
  {
    // grab the quest.
    const quest = this.quest(questKey);

    // return if the objective for this quest is already completed.
    return quest.isObjectiveCompleted(objectiveId);
  }

  /**
   * Progresses the quest through its current objective and activates the next. If there is no "next" objective, then
   * the quest will be completed instead.
   * @param {string} questKey the key of the quest to progress.
   */
  static progressQuest(questKey)
  {
    // grab the quest.
    const quest = this.quest(questKey);

    // progress it.
    quest.progressObjectives();
  }
}
//endregion QuestManager

//region Game_Event
/**
 * Extends {@link meetsConditions}.<br/>
 * Also includes the custom conditions that relate to a quest.
 * @param {any} page
 * @returns {boolean}
 */
J.OMNI.EXT.QUEST.Aliased.Game_Event.set('meetsConditions', Game_Event.prototype.meetsConditions);
Game_Event.prototype.meetsConditions = function(page)
{
  // check original conditions.
  const metOtherPageConditions = J.OMNI.EXT.QUEST.Aliased.Game_Event.get('meetsConditions')
    .call(this, page);

  // if other conditions aren't met, then quest conditions don't override that.
  if (!metOtherPageConditions) return false;

  // grab the list of valid comments.
  //const commentCommandList = this.getValidCommentCommands();
  const commentCommandList = this.getValidCommentCommandsFromPage(page);

  // there aren't any comments on this event at all.
  if (commentCommandList.length === 0) return true;

  // gather all quest comments from the comment commands of this event.
  const questConditionals = this.toQuestConditionals(commentCommandList);

  // if there are none, then this event is fine to proceed!
  if (questConditionals.length === 0) return true;

  // determine if all the quest conditionals are satisfied.
  const questConditionalsMet = questConditionals.every(this.questConditionalMet, this);

  // return whether or not the quest conditionals were satisfied.
  return questConditionalsMet;
};

/**
 * Filters the comment commands to only quest conditionals- should any exist in the collection.
 * @param {rm.types.EventCommand[]} commentCommandList The comment commands to potentially convert to conditionals.
 * @returns {OmniConditional[]}
 */
Game_Event.prototype.toQuestConditionals = function(commentCommandList)
{
  // gather all quest comments from the comment commands of this event.
  const questCommentCommands = commentCommandList
    .filter(this.filterCommentCommandsByQuestConditional, this);

  // if there are no quest conditionals available for parsing, don't bother.
  if (questCommentCommands.length === 0) return [];

  // map all the quest conditionals from the parsed regex.
  return questCommentCommands.map(this.toQuestConditional, this);
};

/**
 * Converts a known comment event command into a conditional for quest control.
 * @param {rm.types.EventCommand} commentCommand The comment command to parse into a conditional.
 * @returns {OmniConditional}
 */
Game_Event.prototype.toQuestConditional = function(commentCommand)
{
  // shorthand the comment into a variable.
  const [ comment, ] = commentCommand.parameters;

  let result = null;

  switch (true)
  {
    // FOR WHOLE EVENTS:
    // check if its a basic "while this quest is active" condition.
    case J.OMNI.EXT.QUEST.RegExp.EventQuest.test(comment):
      result = J.OMNI.EXT.QUEST.RegExp.EventQuest.exec(comment);
      break;
    // check if its a specific "while this quest is active AND this objective is active.
    case J.OMNI.EXT.QUEST.RegExp.EventQuestObjective.test(comment):
      result = J.OMNI.EXT.QUEST.RegExp.EventQuestObjective.exec(comment);
      break;
    // check if its a specific "while this quest is active AND this objective is active.
    case J.OMNI.EXT.QUEST.RegExp.EventQuestObjectiveForState.test(comment):
      result = J.OMNI.EXT.QUEST.RegExp.EventQuestObjectiveForState.exec(comment);
      break;

    // JUST FOR CHOICES:
    // check if its a basic "while this quest is active" condition.
    case J.OMNI.EXT.QUEST.RegExp.ChoiceQuest.test(comment):
      result = J.OMNI.EXT.QUEST.RegExp.ChoiceQuest.exec(comment);
      break;
    // check if its a specific "while this quest is active AND this objective is active.
    case J.OMNI.EXT.QUEST.RegExp.ChoiceQuestObjective.test(comment):
      result = J.OMNI.EXT.QUEST.RegExp.ChoiceQuestObjective.exec(comment);
      break;
    // check if its a specific "while this quest is active AND this objective is active.
    case J.OMNI.EXT.QUEST.RegExp.ChoiceQuestObjectiveForState.test(comment):
      result = J.OMNI.EXT.QUEST.RegExp.ChoiceQuestObjectiveForState.exec(comment);
      break;
  }

  // parse the value out of the regex capture group.
  const [ , val ] = result;
  const parsedVal = JsonMapper.parseObject(val);

  // different sizes result in building conditionals differently.
  switch (parsedVal.length)
  {
    // the quest tag will result in the event page being valid while the quest remains active.
    case 1:
      return new OmniConditional(parsedVal.at(0), null, OmniQuest.States.Active);

    // the quest tag will result in the event page being valid while the objective remains active.
    case 2:
      return new OmniConditional(parsedVal.at(0), parsedVal.at(1), OmniQuest.States.Active);

    // the quest tag will result in the event page being valid while the objective remains in the target state.
    case 3:
      const targetQuestState = OmniQuest.FromStringToStateId(parsedVal.at(2));
      return new OmniConditional(parsedVal.at(0), parsedVal.at(1), targetQuestState);

    default:
      throw new Error(`unknown parsedVal length in quest event tag: ${comment}`);
  }
};

/**
 * A filter function for only including comment event commands relevant to quests.
 * @param {rm.types.EventCommand} command The command being evaluated.
 * @returns {boolean}
 */
Game_Event.prototype.filterCommentCommandsByQuestConditional = function(command)
{
  // identify the actual comment being evaluated.
  const [ comment, ] = command.parameters;

  // in case the command isn't even valid for comment-validation.
  if (!comment) return false;

  // extract the types of regex we will be considering.
  const { EventQuest, EventQuestObjective, EventQuestObjectiveForState } = J.OMNI.EXT.QUEST.RegExp;
  return [ EventQuest, EventQuestObjective, EventQuestObjectiveForState, ].some(regex => regex.test(comment));
};

/**
 * A filter function for only including comment event commands relevant to quests.
 * @param {rm.types.EventCommand} command The command being evaluated.
 * @returns {boolean}
 */
Game_Event.prototype.filterCommentCommandsByChoiceConditional = function(command)
{
  // identify the actual comment being evaluated.
  const [ comment, ] = command.parameters;

  // in case the command isn't even valid for comment-validation.
  if (!comment) return false;

  // extract the types of regex we will be considering.
  const { ChoiceQuest, ChoiceQuestObjective, ChoiceQuestObjectiveForState } = J.OMNI.EXT.QUEST.RegExp;
  return [ ChoiceQuest, ChoiceQuestObjective, ChoiceQuestObjectiveForState, ].some(regex => regex.test(comment));
};

/**
 * Evaluates a {@link OmniConditional} to see if its requirements are currently met.
 * @param {OmniConditional} questConditional The quest conditional to evaluate satisfaction of.
 * @returns {boolean}
 */
Game_Event.prototype.questConditionalMet = function(questConditional)
{
  // grab reference to this quest.
  const quest = QuestManager.quest(questConditional.questKey);

  // check if there was an objectiveId from the conditional.
  if (questConditional.objectiveId !== null && questConditional.objectiveId >= 0)
  {
    // validate the quest objective is in the target state- which defaults to active.
    return quest.isObjectiveInState(questConditional.state, questConditional.objectiveId);
  }
  // the conditional didn't have an objective, or it was negative (which translates to quest state evaluation).
  else
  {
    // make sure the quest itself is in the target state.
    return quest.state === questConditional.state;
  }
};
//endregion Game_Event

//region Game_Interpreter
/**
 * Extends {@link evaluateChoicesForVisibility}.<br/>
 * Includes hiding quest-specific choices that don't meet the specified conditionals.
 */
J.OMNI.EXT.QUEST.Aliased.Game_Interpreter.set('evaluateChoicesForVisibility',
  Game_Interpreter.prototype.evaluateChoicesForVisibility);
Game_Interpreter.prototype.evaluateChoicesForVisibility = function(params)
{
  // perform original logic.
  J.OMNI.EXT.QUEST.Aliased.Game_Interpreter.get('evaluateChoicesForVisibility')
    .call(this, params);

  // also hide the unmet quest conditional choices.
  this.hideQuestSpecificChoices();
};

/**
 * Hide all the choices that don't meet the quest conditionals.
 */
Game_Interpreter.prototype.hideQuestSpecificChoices = function()
{
  const currentCommand = this.currentCommand();
  const eventMetadata = $gameMap.event(this.eventId());
  const currentPage = eventMetadata.page();

  // 102 = start show choice
  // 402 = one of the show choice options
  // 404 = end show choice

  const startShowChoiceIndex = currentPage.list.findIndex(item => item === currentCommand);
  const endShowChoiceIndex = currentPage.list
    .findIndex((item, index) => (index > startShowChoiceIndex && item.indent === currentCommand.indent && item.code === 404));

  // build an array of indexes that align with the options.
  const showChoiceIndices = currentPage.list
    .map((command, index) =>
    {
      if (index < startShowChoiceIndex || index > endShowChoiceIndex) return null;

      if (currentCommand.indent !== command.indent) return null;

      if (command.code === 402 || command.code === 404) return index;

      return null;
    })
    .filter(choiceIndex => choiceIndex !== null);

  // convert the indices into an array of arrays that represent the actual choice code embedded within the choices.
  const choiceGroups = showChoiceIndices.reduce((runningCollection, choiceIndex, index) =>
  {
    if (showChoiceIndices.length < index) return;
    const startIndex = choiceIndex;
    const endIndex = showChoiceIndices.at(index + 1);

    let counterIndex = startIndex;
    const choiceGroup = [];
    while (counterIndex < endIndex)
    {
      choiceGroup.push(counterIndex);
      counterIndex++;
    }

    runningCollection.push(choiceGroup);

    return runningCollection;
  }, []);

  // an array of booleans where the index aligns with a choice, true being hidden, false being visible.
  const choiceGroupsHidden = choiceGroups.map(choiceGroup =>
  {
    const shouldHideGroup = choiceGroup.some(subChoiceCommandIndex =>
    {
      // grab the event subcommand.
      const subEventCommand = currentPage.list.at(subChoiceCommandIndex);

      // ignore non-comment event commands.
      if (!eventMetadata.filterInvalidEventCommand(subEventCommand)) return false;

      // ignore non-quest comment commands.
      if (!eventMetadata.filterCommentCommandsByChoiceConditional(subEventCommand)) return false;

      // convert the known-quest-command to a conditional.
      const conditional = eventMetadata.toQuestConditional(subEventCommand);

      // if the condition is met, then we don't need to hide.
      const met = eventMetadata.questConditionalMet(conditional);
      if (met) return false;

      // the conditional isn't met, hide the group.
      return true;
    });

    return shouldHideGroup;
  });

  // hide the groups accordingly.
  choiceGroupsHidden
    .forEach((isGroupHidden, choiceIndex) => this.setChoiceHidden(choiceIndex, isGroupHidden), this);
};
//endregion Game_Interpreter

//region Game_Party
/**
 * Extends {@link #initOmnipediaMembers}.<br>
 * Includes monsterpedia members.
 */
J.OMNI.EXT.QUEST.Aliased.Game_Party.set('initOmnipediaMembers', Game_Party.prototype.initOmnipediaMembers);
Game_Party.prototype.initOmnipediaMembers = function()
{
  // perform original logic.
  J.OMNI.EXT.QUEST.Aliased.Game_Party.get('initOmnipediaMembers')
    .call(this);

  // initialize the questopedia.
  this.initQuestopediaMembers();

  // populate the trackings for the first time.
  this.populateQuestopediaTrackings();
};

//region questopedia
/**
 * Initialize members related to the omnipedia's questopedia.
 */
Game_Party.prototype.initQuestopediaMembers = function()
{
  /**
   * The shared root namespace for all of J's plugin data.
   */
  this._j ||= {};

  /**
   * The grouping of all properties related to the omnipedia.
   */
  this._j._omni ||= {};

  /**
   * A collection of the current quests and their state.
   * @type {TrackedOmniQuest[]}
   */
  this._j._omni._questopediaSaveables = [];

  /**
   * A more friendly cache of quests to work with.
   * This is what is kept up-to-date until saving.
   *
   * This is keyed by the quest key.
   * @type {Map<string, TrackedOmniQuest>}
   */
  this._j._omni._questopediaCache = new Map();
};

/**
 * Initialize the trackables for the questopedia.
 */
Game_Party.prototype.populateQuestopediaTrackings = function()
{
  // convert all the metadata into trackables.
  const trackedOmniquests = J.OMNI.EXT.QUEST.Metadata.quests.map(this.toTrackedOmniQuest, this);

  // populate the cache so it gets updated upon saving.
  trackedOmniquests.forEach(trackedOmniquest =>
  {
    this._j._omni._questopediaCache.set(trackedOmniquest.key, trackedOmniquest);
  });
};

/**
 * Maps an {@link OmniQuest} to a {@link TrackedOmniQuest}.
 * @param {OmniQuest} omniquest The omniquest to map.
 * @returns {TrackedOmniQuest}
 */
Game_Party.prototype.toTrackedOmniQuest = function(omniquest)
{
  const objectivesMapper = omniObjective => new TrackedOmniObjective(
    omniObjective.id,
    omniquest.key,
    omniObjective.fulfillmentData,
    omniObjective.fulfillmentQuestKeys,
    omniObjective.hiddenByDefault,
    omniObjective.isOptional);

  const trackedObjectives = omniquest.objectives.map(objectivesMapper, this);

  return new TrackedOmniQuest(omniquest.key, omniquest.categoryKey, trackedObjectives);
};

/**
 * Updates the tracking of {@link TrackedOmniQuest}s from the latest metadata- in case there have been updates since
 * the game has been last loaded. This likely only happens during a game's development.
 */
Game_Party.prototype.updateTrackedOmniQuestsFromConfig = function()
{
  // grab the current list of trackings by reference.
  const trackings = this.getSavedQuestopediaEntries();

  // iterate over all of the ones defined in the plugin metadata.
  J.OMNI.EXT.QUEST.Metadata.quests.forEach(omniquest =>
  {
    // skip ones that we shouldn't be adding.
    if (!this.canGainEntry(omniquest.key) || !this.canGainEntry(omniquest.name)) return;

    // find one by the same key in the existing trackings.
    const foundTracking = trackings.find(tracking => tracking.key === omniquest.key);

    // check if we found a tracking.
    if (!foundTracking)
    {
      console.log(`adding new quest; ${omniquest.key}`);

      // we didn't find one, so create and add a new tracking.
      const newTracking = this.toTrackedOmniQuest(omniquest);
      trackings.push(newTracking);
    }
  });

  // sort the quests by their key, in-place.
  trackings.sort((a, b) => a.key - b.key);
};

/**
 * Gets all questopedia entries.
 * @returns {TrackedOmniQuest[]}
 */
Game_Party.prototype.getSavedQuestopediaEntries = function()
{
  return this._j._omni._questopediaSaveables;
};

/**
 * Gets the cache of questopedia entries.
 * The cache is keyed by the quest key.
 * @returns {Map<string, TrackedOmniQuest>}
 */
Game_Party.prototype.getQuestopediaEntriesCache = function()
{
  return this._j._omni._questopediaCache;
};

/**
 * Sets the cache of questopedia entries.
 * @param {Map<string, TrackedOmniQuest>} cache The cache to set over the old cache.
 */
Game_Party.prototype.setQuestopediaEntriesCache = function(cache)
{
  this._j._omni._questopediaCache = cache;
};

/**
 * Updates the saveable questopedia entries collection with the latest from the running cache of entries.
 */
Game_Party.prototype.translateQuestopediaCacheToSaveables = function()
{
  // grab the collection that is saveable.
  const savedQuestopediaEntries = this.getSavedQuestopediaEntries();

  // grab the cache we've been maintaining.
  const cache = this.getQuestopediaEntriesCache();

  // an iterator function for building out the saveables.
  const forEacher = (questopediaEntry, key) =>
  {
    // update the saveable observations with the cached data.
    savedQuestopediaEntries[key] = questopediaEntry;
  };

  // iterate over each cached item.
  cache.forEach(forEacher, this);
};

/**
 * Updates the questopedia cache with the data from the saveables.
 */
Game_Party.prototype.translateQuestopediaSaveablesToCache = function()
{
  // grab the collection that is saveable.
  const savedQuestopediaEntries = this.getSavedQuestopediaEntries();

  // grab the cache of observations we've been maintaining.
  const cache = new Map();

  // iterate over each saved item.
  savedQuestopediaEntries.forEach(questopediaEntry =>
  {
    // if the entry is invalid, do not store it in the cache.
    if (!questopediaEntry) return;

    // update the cache with the saveable.
    cache.set(questopediaEntry.key, questopediaEntry);
  }, this);

  // update the cache with the latest saveable datas.
  this.setQuestopediaEntriesCache(cache);
};

/**
 * Synchronizes the questopedia cache into the saveable datas.
 */
Game_Party.prototype.synchronizeQuestopediaDataBeforeSave = function()
{
  // validate the omnipedia is initialized.
  if (!this.isOmnipediaInitialized())
  {
    // initialize the omnipedia if it wasn't already.
    this.initOmnipediaMembers();
  }

  // translate the cache into saveables.
  this.translateQuestopediaCacheToSaveables();

  // translate the saveables into cache.
  this.translateQuestopediaSaveablesToCache();
};

/**
 * Synchronize the questopedia saveable datas into the cache.
 */
Game_Party.prototype.synchronizeQuestopediaAfterLoad = function()
{
  // validate the omnipedia is initialized.
  if (!this.isOmnipediaInitialized())
  {
    // initialize the omnipedia if it wasn't already.
    this.initOmnipediaMembers();
  }

  // translate the saveables into cache.
  this.translateQuestopediaSaveablesToCache();

  // translate the cache into saveables.
  this.translateQuestopediaCacheToSaveables();

  console.log('executed "synchronizeQuestopediaAfterLoad".');
};

/**
 * Gets the questopedia entry for a given quest key.
 * @param {string} questKey The key of the quest to find the entry for.
 * @returns {TrackedOmniQuest} The questopedia entry matching that key.
 */
Game_Party.prototype.getQuestopediaEntryByKey = function(questKey)
{
  // grab the cache for querying.
  const cache = this.getQuestopediaEntriesCache();

  // find the observation of the given enemy id.
  return cache.get(questKey);
};

/**
 * Gets all the questopedia entries available as an array from the cache.
 * @returns {TrackedOmniQuest[]}
 */
Game_Party.prototype.getQuestopediaEntries = function()
{
  return Array.from(this.getQuestopediaEntriesCache()
    .values());
};

// TODO: relocate this to a more central location.
if (!Game_Party.prototype.canGainEntry)
{
  /**
   * Whether or not a named entry should be unlockable.
   * This is mostly for skipping recipe names that are used as dividers in the list.
   * @param {string} name The name of the entry.
   * @return {boolean} True if the entry can be gained, false otherwise.
   */
  Game_Party.prototype.canGainEntry = function(name)
  {
    // skip entries that are null.
    if (name === null) return false;

    // skip entries with empty names.
    if (name.trim().length === 0) return false;

    // skip entries that start with an underscore (arbitrary).
    if (name.startsWith('_')) return false;

    // skip entries that start with a multiple equals (arbitrary).
    if (name.startsWith('==')) return false;

    // skip entries that are the "empty" name (arbitrary).
    if (name.includes('-- empty --')) return false;

    // we can gain it!
    return true;
  };
}

//endregion questopedia
//endregion Game_Party

//region Game_System
/**
 * Update the saved data with the running cache.
 */
J.OMNI.EXT.QUEST.Aliased.Game_System.set('onBeforeSave', Game_System.prototype.onBeforeSave);
Game_System.prototype.onBeforeSave = function()
{
  // perform original logic.
  J.OMNI.EXT.QUEST.Aliased.Game_System.get('onBeforeSave').call(this);

  // update the cache into saveable data.
  $gameParty.synchronizeQuestopediaDataBeforeSave();
};

/**
 * Extends {@link #onAfterLoad}.<br>
 * Updates the database with the tracked refined equips.
 */
J.OMNI.EXT.QUEST.Aliased.Game_System.set('onAfterLoad', Game_System.prototype.onAfterLoad);
Game_System.prototype.onAfterLoad = function()
{
  // perform original logic.
  J.OMNI.EXT.QUEST.Aliased.Game_System.get('onAfterLoad').call(this);

  // update the quests.
  $gameParty.synchronizeQuestopediaAfterLoad();
  $gameParty.updateTrackedOmniQuestsFromConfig();
};
//endregion Game_System

//region Scene_Omnipedia
//region root actions
/**
 * Extends {@link #onRootPediaSelection}.<br>
 * When the monsterpedia is selected, open the monsterpedia.
 */
J.OMNI.EXT.QUEST.Aliased.Scene_Omnipedia.set('onRootPediaSelection', Scene_Omnipedia.prototype.onRootPediaSelection);
Scene_Omnipedia.prototype.onRootPediaSelection = function()
{
  // grab which pedia was selected.
  const currentSelection = this.getRootOmnipediaKey();

  // check if the current selection is the questopedia.
  if (currentSelection === J.OMNI.EXT.QUEST.Metadata.Command.Symbol)
  {
    // execute the questopedia.
    this.questopediaSelected();
  }
  // the current selection is not the questopedia.
  else
  {
    // possibly activate other choices.
    J.OMNI.EXT.QUEST.Aliased.Scene_Omnipedia.get('onRootPediaSelection').call(this);
  }
}

/**
 * Switch to the questopedia when selected from the root omnipedia list.
 */
Scene_Omnipedia.prototype.questopediaSelected = function()
{
  // close the root omnipedia windows.
  this.closeRootPediaWindows();

  // call the questopedia scene.
  Scene_Questopedia.callScene();
}
//endregion root actions
//endregion Scene_Omnipedia

//region Scene_Questopedia
/**
 * A scene for interacting with the Questopedia.
 */
class Scene_Questopedia extends Scene_MenuBase
{
  /**
   * Constructor.
   */
  constructor()
  {
    // call super when having extended constructors.
    super();

    // jumpstart initialization on creation.
    this.initialize();
  }

  /**
   * Pushes this current scene onto the stack, forcing it into action.
   */
  static callScene()
  {
    SceneManager.push(this);
  }

  //region init
  /**
   * Initialize the window and all properties required by the scene.
   */
  initialize()
  {
    // perform original logic.
    super.initialize();

    // also initialize our scene properties.
    this.initMembers();
  }

  /**
   * Initialize all properties for our omnipedia.
   */
  initMembers()
  {
    // initialize the root-namespace definition members.
    this.initCoreMembers();

    // initialize the questopedia members.
    this.initPrimaryMembers();
  }

  /**
   * The core properties of this scene are the root namespace definitions for this plugin.
   */
  initCoreMembers()
  {
    /**
     * The shared root namespace for all of J's plugin data.
     */
    this._j ||= {};

    /**
     * A grouping of all properties associated with the omnipedia.
     */
    this._j._omni = {};
  }

  /**
   * The primary properties of the scene are the initial properties associated with
   * the main list containing all pedias unlocked by the player along with some subtext of
   * what the pedia entails.
   */
  initPrimaryMembers()
  {
    /**
     * A grouping of all properties associated with the questopedia.
     * The questopedia is a subcategory of the omnipedia.
     */
    this._j._omni._quest = {};

    /**
     * The window that shows the list of known quests.
     * @type {Window_QuestopediaList}
     */
    this._j._omni._quest._pediaList = null;

    /**
     * The window that shows the description of the selected quest.
     * @type {Window_QuestopediaDescription}
     */
    this._j._omni._quest._pediaDescription = null;

    /**
     * The window that shows the list of objectives for the selected quest.
     * @type {Window_QuestopediaObjectives}
     */
    this._j._omni._quest._pediaObjectives = null;
  }
  //endregion init

  //region create
  /**
   * Initialize all resources required for this scene.
   */
  create()
  {
    // perform original logic.
    super.create();

    // create the various display objects on the screen.
    this.createDisplayObjects();
  }

  /**
   * Creates the display objects for this scene.
   */
  createDisplayObjects()
  {
    // create all our windows.
    this.createAllWindows();
  }

  /**
   * Creates all questopedia windows.
   */
  createAllWindows()
  {
    // create the list of quests that are known.
    this.createQuestopediaListWindow();

    // create the description of the selected quest.
    this.createQuestopediaDescriptionWindow();

    // create the known list of unfinished and completed objectives of the selected quest.
    this.createQuestopediaObjectivesWindow();

    // grab the list window for refreshing.
    const listWindow = this.getQuestopediaListWindow();

    // initial refresh the detail window by way of force-changing the index.
    listWindow.onIndexChange();
  }

  /**
   * Overrides {@link Scene_MenuBase.prototype.createBackground}.<br>
   * Changes the filter to a different type from {@link PIXI.filters}.<br>
   */
  createBackground()
  {
    this._backgroundFilter = new PIXI.filters.AlphaFilter(0.1);
    this._backgroundSprite = new Sprite();
    this._backgroundSprite.bitmap = SceneManager.backgroundBitmap();
    this._backgroundSprite.filters = [ this._backgroundFilter ];
    this.addChild(this._backgroundSprite);
  }
  //endregion create

  //region windows
  //region list window
  /**
   * Creates the list of monsters the player has perceived.
   */
  createQuestopediaListWindow()
  {
    // create the window.
    const window = this.buildQuestopediaListWindow();

    // update the tracker with the new window.
    this.setQuestopediaListWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  /**
   * Sets up and defines the questopedia listing window.
   * @returns {Window_OmnipediaList}
   */
  buildQuestopediaListWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.questopediaListRectangle();

    // create the window with the rectangle.
    const window = new Window_QuestopediaList(rectangle);

    // assign cancel functionality.
    window.setHandler('cancel', this.onCancelQuestopedia.bind(this));

    // assign on-select functionality.
    window.setHandler('ok', this.onQuestopediaListSelection.bind(this));

    // overwrite the onIndexChange hook with our local onQuestopediaIndexChange hook.
    window.onIndexChange = this.onQuestopediaIndexChange.bind(this);

    // return the built and configured omnipedia list window.
    return window;
  }

  /**
   * Gets the rectangle associated with the questopedia list command window.
   * @returns {Rectangle}
   */
  questopediaListRectangle()
  {
    // the list window's origin coordinates are the box window's origin as well.
    const [ x, y ] = Graphics.boxOrigin;

    // define the width of the list.
    const width = 400;

    // define the height of the list.
    const height = Graphics.boxHeight - (Graphics.verticalPadding * 2);

    // build the rectangle to return.
    return new Rectangle(x, y, width, height);
  }

  /**
   * Gets the currently tracked questopedia list window.
   * @returns {Window_QuestopediaList}
   */
  getQuestopediaListWindow()
  {
    return this._j._omni._quest._pediaList;
  }

  /**
   * Set the currently tracked questopedia list window to the given window.
   * @param {Window_QuestopediaList} listWindow The questopedia list window to track.
   */
  setQuestopediaListWindow(listWindow)
  {
    this._j._omni._quest._pediaList = listWindow;
  }

  //endregion list window

  //region description window
  /**
   * Creates the description of a single quest the player has discovered.
   */
  createQuestopediaDescriptionWindow()
  {
    // create the window.
    const window = this.buildQuestopediaDetailWindow();

    // update the tracker with the new window.
    this.setQuestopediaDetailWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  /**
   * Sets up and defines the questopedia detail window.
   * @returns {Window_QuestopediaDescription}
   */
  buildQuestopediaDetailWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.questopediaDetailRectangle();

    // create the window with the rectangle.
    const window = new Window_QuestopediaDescription(rectangle);

    // return the built and configured omnipedia list window.
    return window;
  }

  /**
   * Gets the rectangle associated with the questopedia detail command window.
   * @returns {Rectangle}
   */
  questopediaDetailRectangle()
  {
    // grab the questopedia list window.
    const listWindow = this.getQuestopediaListWindow();

    // calculate the X for where the origin of the list window should be.
    const x = listWindow.x + listWindow.width;

    // calculate the Y for where the origin of the list window should be.
    const y = Graphics.verticalPadding;

    // define the width of the list.
    const width = Graphics.boxWidth - listWindow.width - (Graphics.horizontalPadding * 2);

    // define the height of the list.
    const height = Graphics.boxHeight - (Graphics.verticalPadding * 2);

    // build the rectangle to return.
    return new Rectangle(x, y, width, height);
  }

  /**
   * Gets the currently tracked questopedia description window.
   * @returns {Window_QuestopediaDescription}
   */
  getQuestopediaDetailWindow()
  {
    return this._j._omni._quest._pediaDescription;
  }

  /**
   * Set the currently tracked questopedia description window to the given window.
   * @param {Window_QuestopediaDescription} descriptionWindow The questopedia description window to track.
   */
  setQuestopediaDetailWindow(descriptionWindow)
  {
    this._j._omni._quest._pediaDescription = descriptionWindow;
  }

  //endregion description window

  //region objectives window
  /**
   * Creates the list of objectives for the current quest that the player knows about.
   */
  createQuestopediaObjectivesWindow()
  {
    // create the window.
    const window = this.buildQuestopediaObjectivesWindow();

    // update the tracker with the new window.
    this.setQuestopediaObjectivesWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  /**
   * Sets up and defines the questopedia objectives window.
   * @returns {Window_QuestopediaObjectives}
   */
  buildQuestopediaObjectivesWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.questopediaObjectivesRectangle();

    // create the window with the rectangle.
    const window = new Window_QuestopediaObjectives(rectangle);

    window.deactivate();
    window.deselect();

    // assign cancel functionality.
    // window.setHandler('cancel', this.onCancelQuestopediaObjectives.bind(this));

    // assign on-select functionality.
    // TODO: should the player even be able to "select" an objective?
    // window.setHandler('ok', this.onQuestopediaObjectiveSelection.bind(this));

    // overwrite the onIndexChange hook with our local onQuestopediaObjectivesIndexChange hook.
    // TODO: is there even any logic required for perusing objectives?
    // window.onIndexChange = this.onQuestopediaObjectivesIndexChange.bind(this);

    // return the built and configured objectives window.
    return window;
  }

  /**
   * Gets the rectangle associated with the questopedia objectives command window.
   * @returns {Rectangle}
   */
  questopediaObjectivesRectangle()
  {
    // grab the questopedia list window.
    const listWindow = this.getQuestopediaListWindow();

    // calculate the X for where the origin of the list window should be.
    const x = listWindow.x + listWindow.width;

    // calculate the Y for where the origin of the list window should be.
    const y = (Graphics.boxHeight / 2);

    // define the width of the list.
    const width = Graphics.boxWidth - listWindow.width - (Graphics.horizontalPadding * 2);

    // define the height of the list.
    const height = (Graphics.boxHeight / 2) - Graphics.verticalPadding;

    // build the rectangle to return.
    return new Rectangle(x, y, width, height);
  }

  /**
   * Gets the currently tracked questopedia objectives window.
   * @returns {Window_QuestopediaObjectives}
   */
  getQuestopediaObjectivesWindow()
  {
    return this._j._omni._quest._pediaObjectives;
  }

  /**
   * Set the currently tracked questopedia objectives window to the given window.
   * @param {Window_QuestopediaObjectives} listWindow The questopedia objectives window to track.
   */
  setQuestopediaObjectivesWindow(listWindow)
  {
    this._j._omni._quest._pediaObjectives = listWindow;
  }

  //endregion objectives window
  //endregion windows

  /**
   * Synchronize the detail window with the list window of the questopedia.
   */
  onQuestopediaIndexChange()
  {
    // grab the list window.
    const listWindow = this.getQuestopediaListWindow();

    // grab the detail window.
    const detailWindow = this.getQuestopediaDetailWindow();

    // grab the objectives window.
    const objectivesWindow = this.getQuestopediaObjectivesWindow();

    // grab the highlighted enemy's extra data, their observations.
    const highlightedQuestEntry = listWindow.currentExt();

    // sync the detail window with the currently-highlighted quest.
    detailWindow.setCurrentQuest(highlightedQuestEntry);
    detailWindow.refresh();

    // sync the objectives window with the currently-highlighted quest.
    objectivesWindow.setCurrentObjectives(highlightedQuestEntry.objectives);
    objectivesWindow.refresh();
  }

  /**
   * TODO: implement
   */
  onQuestopediaListSelection()
  {
    const listWindow = this.getQuestopediaListWindow();

    console.log(`quest selected index: [${listWindow.index()}].`);

    listWindow.activate();
  }

  /**
   * Close the questopedia and return to the main omnipedia.
   */
  onCancelQuestopedia()
  {
    // revert to the previous scene.
    SceneManager.pop();
  }
}

//endregion Scene_Questopedia

/**
 * Extends {@link #buildCommands}.<br>
 * Adds the questopedia command to the list of commands in the omnipedia.
 */
J.OMNI.EXT.QUEST.Aliased.Window_OmnipediaList.set('buildCommands', Window_OmnipediaList.prototype.buildCommands);
Window_OmnipediaList.prototype.buildCommands = function()
{
  // perform original logic.
  const originalCommands = J.OMNI.EXT.QUEST.Aliased.Window_OmnipediaList.get('buildCommands').call(this);

  // check if the monsterpedia command should be added.
  if (this.canAddMonsterpediaCommand())
  {
    // build the monsterpedia command.
    const questopediaCommand = new WindowCommandBuilder(J.OMNI.EXT.QUEST.Metadata.Command.Name)
      .setSymbol(J.OMNI.EXT.QUEST.Metadata.Command.Symbol)
      .addTextLine("A fine binding full of pages that contain details of known quests.")
      .addTextLine("It won't contain anything you don't actually know about.")
      .setIconIndex(J.OMNI.EXT.QUEST.Metadata.Command.IconIndex)
      .build();

    // add the monsterpedia command to the running list.
    originalCommands.push(questopediaCommand);
  }

  // return all the commands.
  return originalCommands;
};

/**
 * Determines whether or not the monsterpedia command should be added to the Omnipedia.
 * @returns {boolean}
 */
Window_OmnipediaList.prototype.canAddMonsterpediaCommand = function()
{
  // if the necessary switch isn't ON, don't render the command at all.
  if (!$gameSwitches.value(J.OMNI.EXT.QUEST.Metadata.enabledSwitchId)) return false;

  // add the command!
  return true;
};

class Window_QuestopediaDescription extends Window_Base
{
  /**
   * The current selected quest in the quest list window.
   * @type {TrackedOmniQuest}
   */
  #currentQuest = null;

  /**
   * Constructor.
   * @param {Rectangle} rect The rectangle that represents this window.
   */
  constructor(rect)
  {
    super(rect);
  }

  /**
   * Gets the quest currently being displayed.
   * @returns {TrackedOmniQuest}
   */
  getCurrentQuest()
  {
    return this.#currentQuest;
  }

  /**
   * Sets the quest currently being displayed.
   * @param {TrackedOmniQuest} quest The quest to display data for.
   */
  setCurrentQuest(quest)
  {
    this.#currentQuest = quest;
  }

  clearContent()
  {
    super.clearContent();
  }

  drawContent()
  {
    // grab the current quest.
    const quest = this.getCurrentQuest();
    if (!quest) return;

    // define the origin x,y coordinates.
    const [x, y] = [0, 0];

    // shorthand the lineHeight.
    const lh = this.lineHeight();

    // grab the name of the quest.
    this.drawQuestName(x, y);

    const unknownHintY = y + (lh * 2);
    this.drawQuestUnknownHint(x, unknownHintY);
  }

  drawQuestName(x, y)
  {
    // grab the current quest.
    const quest = this.getCurrentQuest();

    // grab the name of the quest.
    const questName = quest.name();

    // potentially mask the name depending on whether or not the player knows it.
    const possiblyMaskedName = (quest.state !== OmniQuest.States.Inactive)
      ? questName
      : J.BASE.Helpers.maskString(questName);

    // determine the width of the quest's name.
    const textWidth = this.textWidth(questName);

    const resizedText = this.modFontSizeForText(10, possiblyMaskedName);

    // draw the header.
    this.drawTextEx(resizedText, x, y, textWidth);
  }

  drawQuestUnknownHint(x, y)
  {
    // grab the current quest.
    const quest = this.getCurrentQuest();

    const unknownHint = quest.unknownHint();

    const textWidth = this.textWidth(unknownHint);

    // draw the header.
    this.drawTextEx(unknownHint, x, y, textWidth);
  }
}

//region Window_QuestopediaList
class Window_QuestopediaList extends Window_Command
{
  /**
   * Constructor.
   * @param {Rectangle} rect The rectangle that represents this window.
   */
  constructor(rect)
  {
    super(rect);
  }

  /**
   * Implements {@link #makeCommandList}.<br>
   * Creates the command list of all known quests in this window.
   */
  makeCommandList()
  {
    // grab all the omnipedia listings available.
    const commands = this.buildCommands();

    // build all the commands.
    commands.forEach(this.addBuiltCommand, this);
  }

  /**
   * Builds all commands for this command window.
   * Adds all known quests to the list that are known.
   * @returns {BuiltWindowCommand[]}
   */
  buildCommands()
  {
    // grab all possible quests.
    const questEntries = $gameParty.getQuestopediaEntries();

    // compile the list of commands.
    const commands = questEntries.map(this.buildCommand, this);

    // return the compiled list of commands.
    return commands;
  }

  /**
   * Builds a {@link BuiltWindowCommand} based on the quest data.
   * @param {TrackedOmniQuest} questopediaEntry The quest data.
   * @returns {BuiltWindowCommand} The built command based on this quest.
   */
  buildCommand(questopediaEntry)
  {
    // quests that are yet to be known are in an unknown state.
    const isKnown = questopediaEntry.state !== OmniQuest.States.Inactive;

    // determine the name based on whether its known or not.
    const questName = isKnown
      ? questopediaEntry.name()
      : J.BASE.Helpers.maskString(questopediaEntry.name())

    // build a command based on the enemy.
    return new WindowCommandBuilder(questName)
      .setSymbol(questopediaEntry.key)
      .setExtensionData(questopediaEntry)
      .setIconIndex(this.determineQuestStateIcon(questopediaEntry))
      .setEnabled(isKnown)
      .build();
  }

  /**
   * Translates a quest entry's state into the icon.
   * @param {TrackedOmniQuest} questopediaEntry The quest data.
   */
  determineQuestStateIcon(questopediaEntry)
  {
    switch (questopediaEntry.state)
    {
      // TODO: parameterize this.
      case OmniQuest.States.Inactive:
        return 93;
      case OmniQuest.States.Active:
        return 92;
      case OmniQuest.States.Completed:
        return 91;
      case OmniQuest.States.Failed:
        return 90;
      case OmniQuest.States.Missed:
        return 95;
    }
  }
}

//endregion Window_QuestopediaList

//region Window_QuestopediaObjectives
class Window_QuestopediaObjectives extends Window_Command
{
  _currentObjectives = [];

  /**
   * Constructor.
   * @param {Rectangle} rect The rectangle that represents this window.
   */
  constructor(rect)
  {
    super(rect);
  }

  /**
   * Overrides {@link #itemHeight}.<br>
   * Makes the command rows bigger so there can be additional lines.
   * @returns {number}
   */
  itemHeight()
  {
    return this.lineHeight() * 2;
  }

  /**
   * Gets the quest objectives currently being rendered.
   * @returns {TrackedOmniObjective[]}
   */
  getCurrentObjectives()
  {
    return this._currentObjectives ?? [];
  }

  /**
   * Sets the quest objectives currently being rendered.
   * @param {TrackedOmniObjective[]} questObjectives The quest objectives to render in this list.
   */
  setCurrentObjectives(questObjectives)
  {
    this._currentObjectives = questObjectives ?? [];
  }

  /**
   * Implements {@link #makeCommandList}.<br>
   * Creates the command list of all known quests in this window.
   */
  makeCommandList()
  {
    // grab all the omnipedia listings available.
    const commands = this.buildCommands();

    if (commands.length === 0)
    {
      commands.push(this.buildNoObjectivesCommand());
    }


    // build all the commands.
    commands.forEach(this.addBuiltCommand, this);
  }

  /**
   * Builds all commands for this command window.
   * Adds all known quests to the list that are known.
   * @returns {BuiltWindowCommand[]}
   */
  buildCommands()
  {
    // grab the current quest objectives.
    const objectives = this.getCurrentObjectives();
    if (objectives.length === 0) return [];

    // compile the list of commands.
    const commands = objectives
      // if an objective is inactive, it shouldn't be rendered at all.
      .filter(objective => objective.state !== OmniObjective.States.Inactive)
      .map(this.buildCommand, this);

    // return the compiled list of commands.
    return commands;
  }

  /**
   * Builds a {@link BuiltWindowCommand} based on the quest objective.
   * @param {TrackedOmniObjective} questObjective The quest objective data.
   * @returns {BuiltWindowCommand} The built command based on this objective.
   */
  buildCommand(questObjective)
  {
    // fix the size a bit.
    const text = this.modFontSizeForText(-4, questObjective.description());

    // build a command based on the enemy.
    return new WindowCommandBuilder(text)
      .setSymbol(questObjective.id)
      .setExtensionData(questObjective)
      .setIconIndex(this.determineObjectiveStateIcon(questObjective))
      .addTextLine(questObjective.log())
      .flagAsMultiline()
      .build();
  }

  buildNoObjectivesCommand()
  {
    return new WindowCommandBuilder(String.empty)
      .setSymbol(0)
      .setExtensionData(null)
      .addTextLine("No known objectives for this quest.")
      .flagAsSubText()
      .build();
  }

  /**
   * Translates a quest objective's state into the icon.
   * @param {TrackedOmniObjective} questObjective The quest objective data.
   */
  determineObjectiveStateIcon(questObjective)
  {
    switch (questObjective.state)
    {
      // TODO: parameterize this.
      case OmniObjective.States.Inactive:
        return 93;
      case OmniObjective.States.Active:
        return 92;
      case OmniObjective.States.Completed:
        return 91;
      case OmniObjective.States.Failed:
        return 90;
      case OmniObjective.States.Missed:
        return 95;
    }
  }
}

//endregion Window_QuestopediaObjectives