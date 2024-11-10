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
   * Gets all quest metadata as a map from the plugin's metadata.
   * @returns {Map<string, OmniQuest>}
   */
  static questMetadatas()
  {
    return J.OMNI.EXT.QUEST.Metadata.questsMap;
  }

  /**
   * Gets all quests that are currently being tracked.
   * @returns {TrackedOmniQuest[]}
   */
  static trackedQuests()
  {
    const allQuests = $gameParty.getQuestopediaEntriesCache()
      .values();
    return Array.from(allQuests)
      .filter(quest => quest.isTracked());
  }

  /**
   * Sets whether or not a quest is being tracked to the given state.
   * @param {string} key The key of the quest to modify tracking for.
   * @param {boolean} trackedState The tracking state for this quest.
   */
  static setQuestTrackingByKey(key, trackedState)
  {
    // grab the quest to modify tracking for.
    const quest = this.quest(key);

    // set the tracking state to the given state.
    quest.toggleTracked(trackedState);
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
   * Gets all quest category metadatas from the plugin's metadata.
   * @param {boolean=} asMap Whether or not to fetch the categories as a map or an array; defaults to true- as a map.
   * @returns {Map<string, OmniCategory>|OmniCategory[]}
   */
  static categories(asMap = true)
  {
    return asMap
      ? J.OMNI.EXT.QUEST.Metadata.categoriesMap
      : J.OMNI.EXT.QUEST.Metadata.categories;
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
   * Gets all quest tag metadatas from the plugin's metadata.
   * @param {boolean=} asMap Whether or not to fetch the tags as a map or an array; defaults to true- as a map.
   * @returns {Map<string, OmniTag>|OmniTag[]}
   */
  static tags(asMap = true)
  {
    return asMap
      ? J.OMNI.EXT.QUEST.Metadata.tagsMap
      : J.OMNI.EXT.QUEST.Metadata.tags;
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
   * @param {?number} objectiveId The objective id to interrogate.
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
   * Checks if a quest is active.
   * @param {string} questKey The key of the quest to check for completion.
   * @returns {boolean}
   */
  static isQuestActive(questKey)
  {
    // grab the quest.
    const quest = this.quest(questKey);

    // return if the quest is currently active.
    return quest.isActive();
  }

  /**
   * Checks if a quest is unlocked (aka not inactive).
   * @param {string} questKey The key of the quest to check for completion.
   * @returns {boolean}
   */
  static isQuestUnlocked(questKey)
  {
    // grab the quest.
    const quest = this.quest(questKey);

    // return if the quest is currently in any state aside from inactive.
    return !quest.isInactive();
  }

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
    return quest.state === OmniQuest.States.Completed;
  }

  /**
   * A script-friendly "if" conditional function that can be used in events to check if a particular objective on a
   * particular quest is already completed. If no objective id is provided, the fallback will be used
   * (immediate >> first).
   * @param {string} questKey The key of the quest to check the objective of.
   * @param {?number} objectiveId The objective id to interrogate.
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

  /**
   * Gets all valid destination objectives currently available to be progressed.
   * @returns {TrackedOmniObjective[]}
   */
  static getValidDestinationObjectives()
  {
    // grab all quests that are tracked.
    const quests = $gameParty.getQuestopediaEntriesCache()
      .values();

    const evaluateableStates = [ OmniQuest.States.Inactive, OmniQuest.States.Active ];
    const destinationObjectives = [];

    quests.forEach(quest =>
    {
      // do not evaluate the state if its not one of the ones that can be evaluated.
      if (!evaluateableStates.includes(quest.state)) return;

      // identify all the currently-active destination objectives on this quest.
      const validObjectives = quest.objectives
        .filter(objective =>
        {
          // validate the objective is the correct type.
          if (!objective.isValid(OmniObjective.Types.Destination)) return false;

          // validate the player is on the current objective's map.
          if ($gameMap.mapId() !== objective.destinationData()
            .at(0)) return false;

          // this is an objective to check!
          return true;
        });

      // if there are none, don't process them.
      if (validObjectives.length === 0) return;

      // add them to the running list.
      destinationObjectives.push(...validObjectives);
    });

    return destinationObjectives;
  }

  /**
   * Gets all valid fetch objectives currently available to be progressed.
   * @returns {TrackedOmniObjective[]}
   */
  static getValidFetchObjectives()
  {
    // grab all quests that are tracked.
    const quests = $gameParty.getQuestopediaEntriesCache()
      .values();

    const evaluateableStates = [ OmniQuest.States.Inactive, OmniQuest.States.Active ];
    const fetchObjectives = [];

    quests.forEach(quest =>
    {
      // do not evaluate the state if its not one of the ones that can be evaluated.
      if (!evaluateableStates.includes(quest.state)) return;

      // identify all the currently-active destination objectives on this quest.
      const validObjectives = quest.objectives
        .filter(objective =>
        {
          // validate the objective is the correct type.
          if (!objective.isValid(OmniObjective.Types.Fetch)) return false;

          // this is an objective to check!
          return true;
        });

      // if there are none, don't process them.
      if (validObjectives.length === 0) return;

      // add them to the running list.
      fetchObjectives.push(...validObjectives);
    });

    return fetchObjectives;
  }

  /**
   * Gets all valid slay objectives currently available to be progressed.
   * @returns {TrackedOmniObjective[]}
   */
  static getValidSlayObjectives()
  {
    // grab all quests that are tracked.
    const quests = $gameParty.getQuestopediaEntriesCache()
      .values();

    const evaluateableStates = [ OmniQuest.States.Inactive, OmniQuest.States.Active ];
    const slayObjectives = [];

    quests.forEach(quest =>
    {
      // do not evaluate the state if its not one of the ones that can be evaluated.
      if (!evaluateableStates.includes(quest.state)) return;

      // identify all the currently-active slay objectives on this quest.
      const validObjectives = quest.objectives
        .filter(objective =>
        {
          // validate the objective is the correct type.
          if (!objective.isValid(OmniObjective.Types.Slay)) return false;

          // this is an objective to check!
          return true;
        });

      // if there are none, don't process them.
      if (validObjectives.length === 0) return;

      // add them to the running list.
      slayObjectives.push(...validObjectives);
    });

    return slayObjectives;
  }

  /**
   * Gets all valid quest objectives currently available to be progressed.
   * @returns {TrackedOmniObjective[]}
   */
  static getValidQuestCompletionObjectives()
  {
    // grab all quests that are tracked.
    const quests = $gameParty.getQuestopediaEntriesCache()
      .values();

    const evaluateableStates = [ OmniQuest.States.Inactive, OmniQuest.States.Active ];
    const questCompletionObjectives = [];

    quests.forEach(quest =>
    {
      // do not evaluate the state if its not one of the ones that can be evaluated.
      if (!evaluateableStates.includes(quest.state)) return;

      // identify all the currently-active destination objectives on this quest.
      const validObjectives = quest.objectives
        .filter(objective =>
        {
          // validate the objective is the correct type.
          if (!objective.isValid(OmniObjective.Types.Quest)) return false;

          // validate the objective isn't an empty collection of questkeys for some reason- that doesn't count.
          if (objective.questCompletionData().length === 0)
          {
            console.warn(`quest of ${objective.questKey} has objective of id ${objective.id} set to "quest completion", but lacks 'fulfillmentQuestKeys'}.`);
            return false;
          }

          // this is an objective to check!
          return true;
        });

      // if there are none, don't process them.
      if (validObjectives.length === 0) return;

      // add them to the running list.
      questCompletionObjectives.push(...validObjectives);
    });

    return questCompletionObjectives;
  }
}

//endregion QuestManager