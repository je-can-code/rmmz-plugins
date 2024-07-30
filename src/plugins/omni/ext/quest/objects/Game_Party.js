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

  // initialize the monsterpedia.
  this.initQuestopediaMembers();
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
Game_Party.prototype.translateQuestopediaCacheForSaving = function()
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
  this.translateQuestopediaCacheForSaving();

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
  this.translateQuestopediaCacheForSaving();
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
  return Array.from(this.getQuestopediaEntriesCache().values());
};

//endregion questopedia
//endregion Game_Party