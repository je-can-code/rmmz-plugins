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
    omniquest.key,
    omniObjective.id,
    omniObjective.fulfillment,
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
 * Sets the questopedia entries to the given entries.
 * @param {TrackedOmniQuest[]} entries The new collection of quests.
 */
Game_Party.prototype.setSavedQuestopediaEntries = function(entries)
{
  this._j._omni._questopediaSaveables = entries;
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
  // grab the cache we've been maintaining.
  const cache = this.getQuestopediaEntriesCache();
  
  // determine the updated entries.
  const updatedQuestopediaEntries = Array.from(cache.values());
  
  // update the quests from the cache.
  this.setSavedQuestopediaEntries(updatedQuestopediaEntries);
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

//region evaluation
/**
 * Extends {@link processItemGain}.<br/>
 * Also synchronizes the item count with any relevant quests.
 * @param {RPG_Item|RPG_Weapon|RPG_Armor} item The item to modify the quantity of.
 * @param {number} amount The amount to modify the quantity by.
 * @param {boolean} includeEquip Whether or not to include equipped items for equipment.
 */
J.OMNI.EXT.QUEST.Aliased.Game_Party.set('processItemGain', Game_Party.prototype.processItemGain);
Game_Party.prototype.processItemGain = function(item, amount, includeEquip)
{
  // perform original logic.
  J.OMNI.EXT.QUEST.Aliased.Game_Party.get('processItemGain')
    .call(this, item, amount, includeEquip);

  // also evaluate the item being gained/lost for quest objectives.
  this.processItemCheck(item);
};

/**
 * Process an item being gained and update any relevant quest objectives.
 * @param {RPG_Base} item The item being gained.
 */
Game_Party.prototype.processItemCheck = function(item)
{
  // grab all fetch objectives currently active.
  const fetchObjectives = QuestManager.getValidFetchObjectives();

  // if there are none, don't try to process this.
  if (fetchObjectives.length === 0) return;

  fetchObjectives
    // filter out irrelevant items being gained.
    .filter(objective =>
    {
      // validate the data sources match.
      if (!objective.isFetchTarget(item)) return false;

      // this objective can be updated!
      return true;
    })
    // iterate over whats left to sync and update.
    .forEach(objective =>
    {
      // synchronize the current with target quantities for this object.
      objective.synchronizeFetchTargetItemQuantity();

      if (objective.hasFetchedEnoughItems())
      {
        // grab the quest for reference.
        const questToProgress = QuestManager.quest(objective.questKey);

        // flag the quest objective as completed.
        questToProgress.flagObjectiveAsCompleted(objective.id);

        // progress the quest to active its next objective.
        questToProgress.progressObjectives();
      }
    });
};
//endregion evaluation
//endregion Game_Party