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