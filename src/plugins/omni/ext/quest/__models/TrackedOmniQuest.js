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
 * Determines whether or not this quest can be tracked.
 * @returns {boolean}
 */
TrackedOmniQuest.prototype.canBeTracked = function()
{
  // quests that are currently active can always be tracked.
  if (this.isActive()) return true;

  // quests that are inactive, but have hidden objectives can be tracked.
  return this.objectives.some(objective => !objective.isHidden());
};

/**
 * Whether or not this quest is being tracked.
 * @returns {boolean}
 */
TrackedOmniQuest.prototype.isTracked = function()
{
  return this.tracked === true || this.tracked === "true";
};

/**
 * Toggles whether or not the quest is being tracked.
 * @param {?boolean} forcedState If provided, then will force tracking to the designated boolean.
 */
TrackedOmniQuest.prototype.toggleTracked = function(forcedState = null)
{
  // check if providing a forced value to track.
  if (forcedState !== null)
  {
    // set the quest to the forced state.
    this.tracked = forcedState;

    // stop processing.
    return;
  }

  // toggle the quest's tracking state.
  this.tracked = !this.tracked;
};

//region metadata
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
 * The recommended level for the quest- but its computed since its just read from the data file.
 * @returns {number} The recommended level to complete the quest.
 */
TrackedOmniQuest.prototype.recommendedLevel = function()
{
  const { recommendedLevel } = this.questMetadata();
  return recommendedLevel;
};

/**
 * The tag keys on the quest- but its computed since its just read from the data file.
 * @returns {string[]} The tag keys associated with the quest.
 */
TrackedOmniQuest.prototype.tagKeys = function()
{
  const { tagKeys } = this.questMetadata();
  return tagKeys ?? [];
};

/**
 * Gets the {@link OmniTag}s that correspond with the tag keys on the quest.
 * @returns {OmniTag[]}
 */
TrackedOmniQuest.prototype.tags = function()
{
  return this.tagKeys()
    .map(tagKey => J.OMNI.EXT.QUEST.Metadata.tagsMap.get(tagKey));
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
//endregion metadata

//region state check
/**
 * Check if the target objective by its id is completed already. This falls back to the immediate, or the first if no
 * objective id was provided.
 * @param {?number} objectiveId The objective id to check for completion.
 * @returns {boolean}
 */
TrackedOmniQuest.prototype.isObjectiveCompleted = function(objectiveId = null)
{
  return this.isObjectiveInState(OmniObjective.States.Completed, objectiveId);
};

/**
 * Check if an objective is the specified state.
 * @param {number} targetState The state from {@link OmniObjective.States} to check if the objective is in.
 * @param {?number} objectiveId The objective id to check the state of; falls back to immediate >> first.
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
 * @param {?number} objectiveId The id of the objective to interrogate.
 * @returns {boolean}
 */
TrackedOmniQuest.prototype.canExecuteObjectiveById = function(objectiveId = null)
{
  // if no objectiveId is provided, then assume: immediate >> first.
  const actualObjectiveId = this.getFallbackObjectiveId(objectiveId);

  // get either the objective of the id provided, or the immediate objective.
  const objective = this.objectives.find(objective => objective.id === actualObjectiveId);

  // validate the objective in question is in the state of active, regardless of the quest.
  return objective?.state === OmniObjective.States.Active;
};

/**
 * A "known" quest is one that is no longer undiscovered/inactive. This includes completed/failed/missed quests.
 * @returns {boolean}
 */
TrackedOmniQuest.prototype.isKnown = function()
{
  return !this.isInactive();
};

/**
 * An {@link OmniQuest.States.Inactive} quest is one that has yet to be unlocked/discovered by the player.
 * @returns {boolean}
 */
TrackedOmniQuest.prototype.isInactive = function()
{
  return this.isInState(OmniQuest.States.Inactive);
};

/**
 * An {@link OmniQuest.States.Active} quest is one that has already been unlocked/discovered by the player.
 * @returns {boolean}
 */
TrackedOmniQuest.prototype.isActive = function()
{
  return this.isInState(OmniQuest.States.Active);
};

/**
 * A {@link OmniQuest.States.Completed} quest is one that had all of its objectives completed with some possibly missed.
 * This is considered a finalized state.
 * @returns {boolean}
 */
TrackedOmniQuest.prototype.isCompleted = function()
{
  return this.isInState(OmniQuest.States.Completed);
};

/**
 * A {@link OmniQuest.States.Failed} quest is one that had one or more of its objectives placed into a failed state.
 * This is considered a finalized state.
 * @returns {boolean}
 */
TrackedOmniQuest.prototype.isFailed = function()
{
  return this.isInState(OmniQuest.States.Failed);
};

/**
 * A {@link OmniQuest.States.Missed} quest is one that had one or more of its objectives placed into a missed state, and
 * none of the objectives marked as completed. This most likely will happen to a quest that may or may not have a
 * non-hidden objective to the player but the objective was never completed resulting in the quest being missed.
 * @returns {boolean}
 */
TrackedOmniQuest.prototype.isMissed = function()
{
  return this.isInState(OmniQuest.States.Missed);
};

/**
 * A "Finalized" quest is one that has been completed/failed/missed.
 * @returns {boolean}
 */
TrackedOmniQuest.prototype.isFinalized = function()
{
  // completed/failed/missed are all forms of finalization.
  if (this.isCompleted()) return true;
  if (this.isFailed()) return true;
  if (this.isMissed()) return true;

  // active/inactive are not considered finalized.
  return false;
};

/**
 * Checks if the quest is in a particular {@link OmniQuest.States}.
 * @param {number} targetState The {@link OmniQuest.States} to compare the current state against.
 * @returns {boolean}
 */
TrackedOmniQuest.prototype.isInState = function(targetState)
{
  return this.state === targetState;
};
//endregion state check

//region actions
/**
 * Unlocks this quest and actives the target objective. If no objectiveId is provided, then the first objective will be
 * made {@link OmniObjective.States.Active}.
 * @param {?number} objectiveId The id of the objective to initialize as active; defaults to the immediate or first.
 */
TrackedOmniQuest.prototype.unlock = function(objectiveId = null)
{
  // validate this quest can be unlocked.
  if (!this.canBeUnlocked())
  {
    console.warn(`Attempted to unlock quest with key ${this.key}, but it cannot be unlocked from state ${this.state}.`);
    return;
  }

  // active the target objective- though one likely won't be provided, activating the first objective in the quest.
  this.flagObjectiveAsActive(objectiveId);

  // refresh the state of the quest.
  this.refreshState();
};

/**
 * Resets this quest back to being completely unknown.<br/>
 * Note that objectives that are still not-hidden will be visible.
 */
TrackedOmniQuest.prototype.reset = function()
{
  // revert the quest to inactive.
  this.setState(OmniQuest.States.Inactive);

  // revert all the objectives to inactive.
  this.objectives.forEach(objective => objective.state = OmniObjective.States.Inactive);
};

/**
 * Determines whether or not the quest can be unlocked.
 * @returns {boolean}
 */
TrackedOmniQuest.prototype.canBeUnlocked = function()
{
  // only not-yet-unlocked quests can be unlocked.
  if (this.isKnown()) return false;

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
    console.warn(`multiple quest objectives are currently active and must be finalized manually by id.`);
    return;
  }

  // check if there is only one- this is probably the most common.
  if (activeObjectives.length === 1)
  {
    // complete the objective.
    const objectiveId = activeObjectives.at(0).id;
    this.flagObjectiveAsCompleted(objectiveId);
  }

  // NOTE: at this point, we should have zero active objectives, so we should seek to activate the next one in sequence.

  // fast-forward through the quest objectives as-necessary.
  this._fastForwardToNextObjective();
};

/**
 * Fast-forwards to the next objective in the list and changes it from inactive to active. If the newly activated
 * objective is completable immediately, complete it and keep taking one more inactive objective sequentially until we
 * stop immediately completing them and leave the player with an active objective on the quest, or by running out of
 * inactive objectives to activate translating to the quest being officially complete.
 */
TrackedOmniQuest.prototype._fastForwardToNextObjective = function()
{
  let needsNextObjective = false;
  do
  {
    // identify the sequentially-next inactive objective in the quest.
    const nextObjective = this.objectives.find(objective => objective.state === OmniObjective.States.Inactive);

    // validate there was a next objective.
    if (nextObjective)
    {
      // check if the objective is fulfilled already.
      if (nextObjective.isFulfilled())
      {
        // flag it as completed and cycle to the next one.
        this.flagObjectiveAsCompleted(nextObjective.id);
        needsNextObjective = true;
      }
      // the objective hasn't already been fulfilled, so lets activate it.
      else
      {
        // flag it as active and stop looking for a next objective.
        this.flagObjectiveAsActive(nextObjective.id);
        needsNextObjective = false;
      }
    }
    // we have no available next inactive objective.
    else
    {
      // stop looping.
      needsNextObjective = false;
    }
  }
    // keep taking one objective while we have them- one must be active!
  while (needsNextObjective);

  // check if there are any additional active objectives.
  const hasAnymoreActiveObjectives = this.objectives.some(objective => objective.isActive());

  // if there are still active objectives, then we are done processing for now.
  if (hasAnymoreActiveObjectives) return;

  // then there were no more inactive objectives to activate, nor are there any active objectives- quest complete!
  this.flagAsCompleted();
};
//endregion actions

//region state management
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
 * Flags the given objective by its id as {@link OmniObjective.States.Active}. If no objectiveId is provided, then the
 * immediate objective will be flagged instead (that being the lowest-id active objective, if any), or the very first
 * objective will be flagged.
 * @param {?number} objectiveId The id of the objective to flag as missed; defaults to the immediate or first.
 */
TrackedOmniQuest.prototype.flagObjectiveAsActive = function(objectiveId = null)
{
  this.changeTargetObjectiveState(objectiveId, OmniObjective.States.Active);
};

/**
 * Completes the objective matching the objectiveId.
 * @param {?number} objectiveId The id of the objective to complete.
 */
TrackedOmniQuest.prototype.flagObjectiveAsCompleted = function(objectiveId = null)
{
  this.changeTargetObjectiveState(objectiveId, OmniObjective.States.Completed);
};

/**
 * Flags the given objective by its id as {@link OmniObjective.States.Missed}. If no objectiveId is provided, then the
 * immediate objective will be flagged instead (that being the lowest-id active objective, if any), or the very first
 * objective will be flagged.
 * @param {?number} objectiveId The id of the objective to flag as missed; defaults to the immediate or first.
 */
TrackedOmniQuest.prototype.flagObjectiveAsMissed = function(objectiveId = null)
{
  this.changeTargetObjectiveState(objectiveId, OmniObjective.States.Missed);
};

/**
 * Change the target objective by its id to a new state.
 * @param {number} objectiveId
 * @param {number} newState The new {@link OmniObjective.States} to change the objective to.
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
    objective.setState(newState);

    // refresh the state of the quest.
    this.refreshState();
  }
};

/**
 * Captures an objectiveId provided (if provided) and provides fallback options if there was no provided id. If there
 * is no id provided, then the immediate objective's id will be provided. If there is no immediate objective, then the
 * quest's first objective will be provided.
 * @param {?number} objectiveId The objective id to provide fallback options for.
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
    // currently-active and yet-to-be active objectives are updated.
    if (objective.isActive() || objective.isInactive())
    {
      // flag the objective as missed.
      objective.setState(OmniObjective.States.Missed);
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
    // currently-active and yet-to-be active objectives are updated.
    if (objective.isActive() || objective.isInactive())
    {
      // flag the objective as failed.
      objective.setState(OmniObjective.States.Failed);
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
  // forcefully flag all the objectives as missed and at once.
  this.objectives.forEach(objective =>
  {
    // all remaining active objectives will be flagged as completed.
    if (objective.isActive())
    {
      objective.setState(OmniObjective.States.Completed);
    }

    // all remaining inactive objectives will be flagged as missed- but this doesn't prevent a quest from completing.
    if (objective.isInactive())
    {
      objective.setState(OmniObjective.States.Missed);
    }
  });

  // refresh the state resulting in the quest becoming completed.
  this.refreshState();

  // evaluate if the quest quest being completed checked any boxes.
  this._processQuestCompletionQuestsCheck();
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
  const anyFailed = this.objectives.some(objective => objective.isFailed());
  if (anyFailed)
  {
    this.setState(OmniObjective.States.Failed);
    return;
  }

  // second handle the possibility that all the objectives are unknown, aka this is an unknown quest still.
  const allUnknown = this.objectives.every(objective => objective.isInactive());
  if (allUnknown)
  {
    this.setState(OmniObjective.States.Inactive);
    return;
  }

  // third handle the possibility that the quest is ongoing because some objectives are still active.
  const someActive = this.objectives.some(objective => objective.isActive());
  if (someActive)
  {
    this.setState(OmniObjective.States.Active);
    return;
  }

  // fourth handle the possibility that the quest is completed because all objectives are complete, or missed.
  const enoughComplete = this.objectives
    .every(objective => objective.isCompleted() || objective.isMissed());
  if (enoughComplete)
  {
    this.setState(OmniObjective.States.Completed);
    return;
  }

  console.info(`refreshed state without changing state for quest key: ${this.key}`);
};

/**
 * Sets the state of the quest to a designated state regardless of objectives' status.<br/>
 * It is normally recommended to use {@link #refreshState} if desiring to change state so that the objectives determine
 * the quest state when managing the state programmatically. Unexpected behavior may occur if this is executed from
 * outside of state refresh.
 * @param {number} newState The new state to set this quest to.
 */
TrackedOmniQuest.prototype.setState = function(newState)
{
  // validate your inputs!
  if (newState < 0 || newState > 4)
  {
    console.error(`Attempted to set invalid state for this quest: ${newState}.`);
    throw new Error('Invalid quest state provided for setting of state.');
  }

  // if it is already the given state, don't try to set it again.
  if (this.state === newState) return;

  // update the state.
  this.state = newState;

  // trigger on-state-change effects.
  this.onQuestStateChange();
};

/**
 * The hook for when the state of the quest changes.
 */
TrackedOmniQuest.prototype.onQuestStateChange = function()
{
  // check if we have the dialog manager.
  if ($diaLogManager)
  {
    // handle logging.
    this.handleQuestUpdateLog();
  }
};

/**
 * Generate a dialog indicating the quest state has been updated.
 */
TrackedOmniQuest.prototype.handleQuestUpdateLog = function()
{
  // don't log if we are resetting a quest.
  if (this.state === OmniQuest.States.Inactive) return;

  // start the message stating the quest is updated.
  const questUpdatedLines = [ `\\C[1][${this.name()}]\\C[0]` ];

  // determine by state.
  switch (this.state)
  {
    case OmniQuest.States.Active:
      questUpdatedLines.push('Quest unlocked.');
      break;
    case OmniQuest.States.Completed:
      questUpdatedLines.push('Quest completed.');
      break;
    case OmniQuest.States.Failed:
      questUpdatedLines.push('Quest failed.');
      break;
    case OmniQuest.States.Missed:
      questUpdatedLines.push('Quest missed.');
      break;
    default:
      // if somehow we got here without a known finalization, ignore.
      console.warn(`unexpected state change for logging: ${this.state}`);
      return;
  }

  // construct the message.
  const log = new DiaLogBuilder()
    .setLines(questUpdatedLines)
    .build();

  // display the log.
  $diaLogManager.addLog(log);
};
//endregion state management

//endregion TrackedOmniQuest