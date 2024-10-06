//region TrackedOmniObjective
/**
 * A class representing the tracking for a single objective of a quest.
 */
function TrackedOmniObjective(questKey, id, omniFulfillmentData, hidden, optional)
{
  this.initialize(questKey, id, omniFulfillmentData, hidden, optional);
}

TrackedOmniObjective.prototype = {};
TrackedOmniObjective.prototype.constructor = TrackedOmniObjective;

//region init
/**
 * Initialize an objective tracker for an quest.
 * @param {number} id The id of this objective.
 * @param {string} questKey The key of the quest that owns this objective.
 * @param {OmniFulfillmentData} omniFulfillmentData The extraneous data on how this objective is to be fulfilled.
 * @param {boolean} hidden Whether or not this objective is hidden.
 * @param {boolean} optional Whether or not this objective is optional for its parent quest.
 */
TrackedOmniObjective.prototype.initialize = function(questKey, id, omniFulfillmentData, hidden, optional)
{
  /**
   * The key of the quest that owns this objective. This is mostly used for metadata lookup.
   * @type {string}
   */
  this.questKey = questKey;

  /**
   * The id of this objective. This is typically used to indicate order between objectives within a single quest.
   * @type {number}
   */
  this.id = id;

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
  this.populateFulfillmentData(omniFulfillmentData);
};

/**
 * Initialize the fulfillment data properties to default values.
 */
TrackedOmniObjective.prototype.initializeFulfillmentData = function()
{
  /**
   * The indiscriminate detail for completing this objective.
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
   * The target item id that the player must acquire.
   * @type {number}
   */
  this._targetItemId = -1;

  /**
   * The target quantity to fetch of item of type {@link _targetItemType} in order to fulfill the objective.
   * @type {number}
   */
  this._targetItemFetchQuantity = -1;

  /**
   * The current quantity of the target item to fetch.
   * @type {number}
   */
  this._currentItemFetchQuantity = 0;

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
   * The current quantity of the target enemy to slay.
   * @type {number}
   */
  this._currentEnemyAmount = 0;

  /**
   * The target quest keys to complete in order to fulfill this objective.
   * @type {string[]}
   */
  this._targetQuestKeys = [];
};

/**
 * Populates the this objective's fulfillment requirements.
 * @param {OmniFulfillmentData} omniFulfillmentData
 */
TrackedOmniObjective.prototype.populateFulfillmentData = function(omniFulfillmentData)
{
  // pivot based on the type of objective this is from the metadata.
  switch (this.type())
  {
    // if the type is indiscriminate, then it is event-controlled and not automagical.
    case OmniObjective.Types.Indiscriminate:
      this._indiscriminateTargetData = omniFulfillmentData.indiscriminate.hint ?? "No indiscriminate objective instructions provided.";
      return;

    // if the fulfillment is of type 'destination', then fill in the data.
    case OmniObjective.Types.Destination:
      const { mapId, x1, y1, x2, y2 } = omniFulfillmentData.destination;
      this._targetMapId = mapId;
      const point1 = [
        x1,
        y1
      ];
      const point2 = [
        x2,
        y2
      ];
      this._targetCoordinateRange.push(point1, point2);
      break;

    // if the fulfillment is of type 'fetch', then fill in the data.
    case OmniObjective.Types.Fetch:
      this._targetItemType = omniFulfillmentData.fetch.type;
      this._targetItemId = omniFulfillmentData.fetch.id;
      this._targetItemFetchQuantity = omniFulfillmentData.fetch.amount;
      break;

    // if the fulfillment is of type 'slay', then fill in the data.
    case OmniObjective.Types.Slay:
      this._targetEnemyId = omniFulfillmentData.slay.id;
      this._targetEnemyAmount = omniFulfillmentData.slay.amount;
      break;

    // if the fulfillment is of type 'quest', then fill in the data.
    case OmniObjective.Types.Quest:
      this._targetQuestKeys.push(...omniFulfillmentData.quest.keys);
      break;
  }
};
//endregion init

//region state check
/**
 * Returns whether or not this objective has moved beyond being {@link OmniObjective.States.Inactive}.
 * @returns {boolean}
 */
TrackedOmniObjective.prototype.isKnown = function()
{
  // objectives that are inactive but NOT hidden are "known".
  if (!this.hidden && this.isInactive()) return true;

  // objectives that have been at least started or even finished count as "known".
  if (!this.isInactive()) return true;

  // the objective is unknown at this time.
  return false;
};

/**
 * Returns whether or not this objective has had some form of finalization from another state. This most commonly will
 * be completed, failed, or missed.
 * @returns {boolean}
 */
TrackedOmniObjective.prototype.isFinalized = function()
{
  // completed/failed/missed are all forms of finalization.
  if (this.isCompleted()) return true;
  if (this.isFailed()) return true;
  if (this.isMissed()) return true;

  // active/inactive are not considered finalized.
  return false;
};

/**
 * Returns whether or not this objective is {@link OmniObjective.States.Inactive}.
 * @returns {boolean}
 */
TrackedOmniObjective.prototype.isInactive = function()
{
  return this.state === OmniObjective.States.Inactive;
};

/**
 * Returns whether or not this objective is {@link OmniObjective.States.Active}.
 * @returns {boolean}
 */
TrackedOmniObjective.prototype.isActive = function()
{
  return this.state === OmniObjective.States.Active;
};

/**
 * Returns whether or not this objective is {@link OmniObjective.States.Completed}.
 * @returns {boolean}
 */
TrackedOmniObjective.prototype.isCompleted = function()
{
  return this.state === OmniObjective.States.Completed;
};

/**
 * Returns whether or not this objective is {@link OmniObjective.States.Failed}.
 * @returns {boolean}
 */
TrackedOmniObjective.prototype.isFailed = function()
{
  return this.state === OmniObjective.States.Failed;
};

/**
 * Returns whether or not this objective is {@link OmniObjective.States.Missed}.
 * @returns {boolean}
 */
TrackedOmniObjective.prototype.isMissed = function()
{
  return this.state === OmniObjective.States.Missed;
};

/**
 * Returns whether or not this objective is hidden.<br/>
 * Objectives that are NOT hidden will show up in the questopedia and can be completed to activate the owning quest.
 * @returns {boolean}
 */
TrackedOmniObjective.prototype.isHidden = function()
{
  return this.hidden === true;
};

/**
 * Determines whether or not this objective is valid in the sense that it can be updated and completed.
 * @param {OmniObjective.Types} targetType One of the {@link OmniObjective.Types} to validate against.
 * @returns {boolean}
 */
TrackedOmniObjective.prototype.isValid = function(targetType)
{
  // cannot execute on objectives that have already been finalized.
  if (this.isCompleted() || this.isFailed() || this.isMissed()) return false;

  // cannot execute on non-active objectives if they are hidden.
  if (!this.isActive() && this.isHidden()) return false;

  // make sure the types match.
  return this.type() === targetType;
};

/**
 * Check if this objective is fulfilled- whatever type that it is.
 * @returns {boolean}
 */
TrackedOmniObjective.prototype.isFulfilled = function()
{
  switch (this.type())
  {
    // indiscriminate quests can only be completed manually by the developer and can't programmatically be fulfilled.
    case OmniObjective.Types.Indiscriminate:
      return false;

    case OmniObjective.Types.Destination:
      return this.isPlayerWithinDestinationRange();

    case OmniObjective.Types.Fetch:
      this.synchronizeFetchTargetItemQuantity();
      return this.hasFetchedEnoughItems();

    case OmniObjective.Types.Slay:
      return this.hasSlainEnoughEnemies();

    case OmniObjective.Types.Quest:
      return this.hasCompletedAllQuests();
  }
};
//endregion state check

//region metadata
/**
 * Gets the metadata for the quest that owns this objective.
 * @returns {OmniQuest}
 */
TrackedOmniObjective.prototype.parentQuestMetadata = function()
{
  return J.OMNI.EXT.QUEST.Metadata.questsMap.get(this.questKey);
};

/**
 * Gets the metadata for this objective.
 * @returns {OmniObjective}
 */
TrackedOmniObjective.prototype.objectiveMetadata = function()
{
  return this.parentQuestMetadata()
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
//endregion metadata

/**
 * Gets the log represented by the current state of this objective.
 * @returns {string}
 */
TrackedOmniObjective.prototype.log = function()
{
  // deconstruct the logs out of the metadata.
  const { inactive, active, completed, failed, missed } = this.objectiveMetadata().logs;

  switch (this.state)
  {
    case OmniObjective.States.Inactive:
      return inactive;

    case OmniObjective.States.Active:
      return active;

    case OmniObjective.States.Completed:
      return completed;

    case OmniObjective.States.Failed:
      return failed;

    case OmniObjective.States.Missed:
      return missed;
  }
};

/**
 * Gets the {@link OmniObjective.Types} of objective this is to determine how it must be fulfilled.
 * @returns {number}
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
  const enoughColor = 24; //ColorManager.powerUpColor();
  const notEnoughColor = 25; //ColorManager.powerDownColor();

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
      const fetchColor = (this._currentItemFetchQuantity < this._targetItemFetchQuantity)
        ? notEnoughColor
        : enoughColor;

      const targetItemText = `${this.fetchDataSourceTextPrefix()}[${this._targetItemId}]`;
      const quantity = `\\C[${fetchColor}]${this._currentItemFetchQuantity} / ${this._targetItemFetchQuantity}\\C[0]`;
      return OmniObjective.FulfillmentTemplate(this.type(), quantity, targetItemText);

    case OmniObjective.Types.Slay:
      const slayColor = (this._currentEnemyAmount < this._targetEnemyAmount)
        ? notEnoughColor
        : enoughColor;
      const targetEnemyText = `\\C[${slayColor}]${this._currentEnemyAmount} / ${this._targetEnemyAmount}\\C[0]`;
      return OmniObjective.FulfillmentTemplate(this.type(), targetEnemyText, this._targetEnemyId);

    case OmniObjective.Types.Quest:
      const questNames = this._targetQuestKeys
        .map(questKey => `'\\quest[${questKey}]'`);
      const questNamesWithCommas = questNames.join(', ');
      return OmniObjective.FulfillmentTemplate(this.type(), questNamesWithCommas);
  }
};

/**
 * Gets the icon index derived from the state of this objective.
 * @returns {number}
 */
TrackedOmniObjective.prototype.iconIndexByState = function()
{
  switch (this.state)
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
};

/**
 * Changes the state of this objective to a new state and processes the {@link onObjectiveUpdate} hook. If the state
 * does not actually change to something new, the hook will not trigger.
 * @param {number} newState The new {@link OmniObjective.States} to set this state to.
 */
TrackedOmniObjective.prototype.setState = function(newState)
{
  // check if the state actually differed.
  if (this.state !== newState)
  {
    // apply the changed state.
    this.state = newState;

    // notify a change happened with this objective.
    this.onObjectiveUpdate();
  }
};

//region destination data
/**
 * Gets the destination data for this objective. The response shape will contain the mapId, and the coordinate range.
 * <pre>
 *     [ mapId, [[x1,y1], [x2,y2]] ]
 * </pre>
 * @returns {[number,[[number,number],[number,number]]]}
 */
TrackedOmniObjective.prototype.destinationData = function()
{
  return [
    this._targetMapId,
    this._targetCoordinateRange
  ];
};

/**
 * Checks if the player is presently standing within the rectangle derived from the coordinate range for this objective.
 */
TrackedOmniObjective.prototype.isPlayerWithinDestinationRange = function()
{
  // grab the coordinate range from this objective.
  const [ mapId, range ] = this.destinationData();

  // validate the map is the correct map before assessing coordinates.
  if ($gameMap.mapId() !== mapId) return false;

  // deconstruct the points from the coordinate range.
  const [ x1, y1 ] = range.at(0);
  const [ x2, y2 ] = range.at(1);

  // identify the location of the player.
  const playerX = $gamePlayer.x;
  const playerY = $gamePlayer.y;

  // check if the player within the coordinate range.
  const isInCoordinateRange = playerX >= x1 && playerX <= x2 && playerY >= y1 && playerY <= y2;

  // process the event hook.
  this.onObjectiveUpdate();

  // return our findings.
  return isInCoordinateRange;
};
//endregion destination data

//region fetch data
/**
 * The data points associated with fetch-related objectives.
 * @returns {[number,number]}
 */
TrackedOmniObjective.prototype.fetchData = function()
{
  return [
    this._targetItemId,
    this._targetItemFetchQuantity
  ];
};

/**
 * Determines whether or not the given item is the target of this fetch objective.
 * @param {RPG_Item|RPG_Weapon|RPG_Armor} entry
 * @returns {boolean}
 */
TrackedOmniObjective.prototype.isFetchTarget = function(entry)
{
  // identify the type of objective this is.
  const objectiveType = this.type();

  // if this isn't a fetch objective, then it'll never be a fetch target.
  if (objectiveType !== OmniObjective.Types.Fetch) return false;

  // validate the target item type aligns with the corresponding entry.
  if (this._targetItemType === 0 && !entry.isItem()) return false;
  if (this._targetItemType === 1 && !entry.isWeapon()) return false;
  if (this._targetItemType === 2 && !entry.isArmor()) return false;

  // check if the id matches the target item id.
  return entry.id === this._targetItemId;
};

/**
 * Gets the escape code for displaying text in a window based on the given target item type to fetch.
 * @returns {string}
 */
TrackedOmniObjective.prototype.fetchDataSourceTextPrefix = function()
{
  switch (this._targetItemType)
  {
    case OmniObjective.FetchTypes.Item:
      return `\\Item`;
    case OmniObjective.FetchTypes.Weapon:
      return `\\Weapon`;
    case OmniObjective.FetchTypes.Armor:
      return `\\Armor`;
    default:
      throw new Error(`unknown target item type: ${this._targetItemType}`);
  }
};

/**
 * Returns the datasource of the fetch objective data.
 * @returns {RPG_Item[]|RPG_Weapon[]|RPG_Armor[]}
 */
TrackedOmniObjective.prototype.fetchItemDataSource = function()
{
  switch (this._targetItemType)
  {
    case OmniObjective.FetchTypes.Item:
      return $dataItems;
    case OmniObjective.FetchTypes.Weapon:
      return $dataWeapons;
    case OmniObjective.FetchTypes.Armor:
      return $dataArmors;
    default:
      throw new Error(`unknown target item type: ${this._targetItemType}`);
  }
};

/**
 * Synchronizes the number of items the player has in their possession with this objective.
 */
TrackedOmniObjective.prototype.synchronizeFetchTargetItemQuantity = function()
{
  // determine the current amount of the item in possession.
  const targetDataSource = this.fetchItemDataSource();
  const targetItem = targetDataSource.at(this._targetItemId);

  // align the tracked amount with the actual amount.
  this._currentItemFetchQuantity = $gameParty.numItems(targetItem);

  // process the event hook.
  this.onObjectiveUpdate();
};

/**
 * Checks whether or not the player has collected enough of the target fetched item. This always returns false for
 * objectives that are not of type {@link OmniObjective.Types.Fetch}.
 * @returns {boolean}
 */
TrackedOmniObjective.prototype.hasFetchedEnoughItems = function()
{
  // non-fetch objectives can never fetch enough items.
  if (this.type() !== OmniObjective.Types.Fetch) return false;

  // return the evaluation.
  return this._currentItemFetchQuantity >= this._targetItemFetchQuantity;
};
//endregion fetch data

//region slay data
/**
 * The data points associated with slay-related objectives.
 * @returns {[number,number]}
 */
TrackedOmniObjective.prototype.slayData = function()
{
  return [
    this._targetEnemyId,
    this._targetEnemyAmount
  ];
};

/**
 * Increments the counter for how many of the required enemies the player has slain.
 */
TrackedOmniObjective.prototype.incrementSlayTargetEnemyAmount = function()
{
  // we increment by +1 in this land.
  this._currentEnemyAmount++;

  // process the event hook.
  this.onObjectiveUpdate();
};

/**
 * Checks whether or not the player has collected enough of the target fetched item. This always returns false for
 * objectives that are not of type {@link OmniObjective.Types.Fetch}.
 * @returns {boolean}
 */
TrackedOmniObjective.prototype.hasSlainEnoughEnemies = function()
{
  // non-fetch objectives can never fetch enough items.
  if (this.type() !== OmniObjective.Types.Slay) return false;

  // return the evaluation.
  return this._currentEnemyAmount >= this._targetEnemyAmount;
};
//endregion slay data

//region quest completion data
TrackedOmniObjective.prototype.questCompletionData = function()
{
  return this._targetQuestKeys;
};

TrackedOmniObjective.prototype.hasCompletedAllQuests = function()
{
  // grab all the quest keys for this objective.
  const requiredQuestKeys = this.questCompletionData();

  // if there are no keys, then technically there are no quests to complete for this quest complete objective.
  if (requiredQuestKeys.length === 0) return true;

  // validate all required quests have been completed.
  return requiredQuestKeys
    .every(requiredQuestKey => QuestManager.quest(requiredQuestKey)
      .isCompleted())
};
//endregion quest completion data

/**
 * An event hook for when objective progress is updated, like an enemy is slain for the objective or an item is
 * acquired towards the fetch goal.
 */
TrackedOmniObjective.prototype.onObjectiveUpdate = function()
{
  // check if we have the dialog manager.
  if ($diaLogManager)
  {
    // handle logging.
    this.handleObjectiveUpdateLog();
  }
};

/**
 * Generate a dialog indicating the quest objectives have been updated.
 */
TrackedOmniObjective.prototype.handleObjectiveUpdateLog = function()
{
  // the logs only happen if the objective is finalized somehow.
  if (!this.isFinalized()) return;
  
  // start the message stating the quest is updated.
  const objectiveMessage = [ `\\C[1][${this.parentQuestMetadata().name}]\\C[0] updated.` ];

  // determine by state.
  switch (this.state)
  {
    case OmniObjective.States.Completed:
      objectiveMessage.push('Objective completed.');
      break;
    case OmniObjective.States.Failed:
      objectiveMessage.push('Objective failed.');
      break;
    case OmniObjective.States.Missed:
      objectiveMessage.push('Objective missed.');
      break;
    default:
      // if somehow we got here without a known finalization, throw.
      throw new Error('Unknown finalization state for objective update message.');
  }

  // construct the message.
  const log = new DiaLogBuilder()
    .setLines(objectiveMessage)
    .build();

  // display the log.
  $diaLogManager.addLog(log);

};

//endregion TrackedOmniObjective