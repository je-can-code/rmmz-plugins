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