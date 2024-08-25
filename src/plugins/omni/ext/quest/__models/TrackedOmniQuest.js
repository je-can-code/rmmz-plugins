//region TrackedOmniQuest
/**
 * A class representing the tracking for a single quest.
 */
function TrackedOmniQuest(key, categoryKey, objectives)
{
  this.initialize(key, categoryKey, objectives);
}

/**
 * The quest category key that represents "main"- as in, "main story" quests.
 * @type {string}
 */
TrackedOmniQuest.mainQuestCategoryKey = "main";

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

/**
 * Initialize all members of this quest.
 */
TrackedOmniQuest.prototype.initMembers = function()
{
  /**
   * The current state of this quest.
   * @type {number}
   */
  this.state = OmniQuest.States.Inactive;

  /**
   * Whether or not this quest is being tracked.
   * @type {boolean}
   */
  this.tracked = false;
};

/**
 * Determines whether or not this quest is a "main story" quest.
 * @returns {boolean}
 */
TrackedOmniQuest.prototype.isMain = function()
{
  return this.categoryKey.toLowerCase() === TrackedOmniQuest.mainQuestCategoryKey;
};

/**
 * Whether or not this quest is being tracked.
 * @returns {boolean}
 */
TrackedOmniQuest.prototype.isTracked = function()
{
  return this.tracked;
};

/**
 * Toggles whether or not the quest is being tracked.
 */
TrackedOmniQuest.prototype.toggleTracked = function()
{
  this.tracked = !this.tracked;
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
TrackedOmniQuest.prototype.overview = function()
{
  const { overview } = this.questMetadata();
  return overview;
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
  return this.isObjectiveInState(OmniObjective.States.Completed, objectiveId);
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
 * A "known" quest is one that is no longer undiscovered/inactive. This includes completed/failed/missed quests.
 * @returns {boolean}
 */
TrackedOmniQuest.prototype.isKnown = function()
{
  return this.state !== OmniQuest.States.Inactive;
};

//region state management
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
  const nextObjectiveId = (this.objectives.find(objective => objective.state === OmniObjective.States.Inactive))?.id;

  // check if there is a "next objective" to activate- but it could be "0" as the next objectiveId.
  if (nextObjectiveId !== null && nextObjectiveId !== undefined)
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

  // validate we have an objective to flag that isn't already the given state.
  if (objective && objective.state !== newState)
  {
    // flag the objective as the new state.
    objective.state = newState;

    // refresh the state of the quest.
    this.refreshState();
  }
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

  // refresh the state resulting in the quest becoming completed.
  this.refreshState();

  // check if the change of state was to "completed".
  if (this.state === OmniQuest.States.Completed)
  {
    // evaluate if the quest quest being completed checked any boxes.
    this._processQuestCompletionQuestsCheck();
  }
};

/**
 * Evaluate all active quest completion objectives that reside applicable to this quest.
 */
TrackedOmniQuest.prototype._processQuestCompletionQuestsCheck = function()
{
  // grab all the valid objectives.
  const activeQuestCompletionObjectives = QuestManager.getValidQuestCompletionObjectives();

  // if there are none, don't try to process this.
  if (activeQuestCompletionObjectives.length === 0) return;

  // iterate over each of the destination objectives.
  activeQuestCompletionObjectives.forEach(objective =>
  {
    // extract the coordinate range from the objective.
    const targetQuestKeys = objective.questCompletionData();

    // if the quest keys for the objective don't align, then don't worry about that quest.
    if (!targetQuestKeys.includes(this.key)) return;

    // grab the quest for reference.
    const questToProgress = QuestManager.quest(objective.questKey);

    // flag the quest objective as completed.
    questToProgress.flagObjectiveAsCompleted(objective.id);

    // progress the quest to active its next objective.
    questToProgress.progressObjectives();
  }, this);

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
    return;
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
    return;
  }

  // fourth handle the possibility that the quest is completed because all objectives are complete, or missed.
  const enoughComplete = this.objectives
    .every(objective => objective.state === OmniObjective.States.Completed || objective.state === OmniObjective.States.Missed);
  if (enoughComplete)
  {
    this.state = OmniObjective.States.Completed;
    return;
  }

  console.warn(`reached the end of quest state refresh without changing anything for quest key: ${this.key}`);
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
//endregion state management

//endregion TrackedOmniQuest