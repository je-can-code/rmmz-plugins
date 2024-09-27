//region Game_Map
/**
 * Extends {@link initialize}.<br/>
 * Also initializes the questopedia members.
 */
J.OMNI.EXT.QUEST.Aliased.Game_Map.set('initialize', Game_Map.prototype.initialize);
Game_Map.prototype.initialize = function()
{
  // perform original logic.
  J.OMNI.EXT.QUEST.Aliased.Game_Map.get('initialize').call(this);

  // also initialize our members.
  this.initQuestopediaMembers();
};

/**
 * Initialize the members specific to the questopedia.
 */
Game_Map.prototype.initQuestopediaMembers = function()
{
  /**
   * The shared root namespace for all of J's plugin data.
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with the omnipedia.
   */
  this._j._omni ||= {};

  /**
   * A grouping of all properties associated with the questopedia portion of the omnipedia.
   */
  this._j._omni._quest = {};

  /**
   * The timer for tracking when to check the destination- prevents expensive repeated coordinate checking.
   * @type {J_Timer}
   * @private
   */
  this._j._omni._quest._destinationTimer = new J_Timer(15);
};

/**
 * Gets the timer for checking the destination completion.
 * @returns {J_Timer}
 */
Game_Map.prototype.getDestinationTimer = function()
{
  return this._j._omni._quest._destinationTimer;
};

/**
 * Extends {@link update}.<br/>
 * Also evaluates destination-based {@link OmniConditional}s.
 */
J.OMNI.EXT.QUEST.Aliased.Game_Map.set('update', Game_Map.prototype.update);
Game_Map.prototype.update = function(sceneActive)
{
  // perform original logic.
  J.OMNI.EXT.QUEST.Aliased.Game_Map.get('update').call(this, sceneActive);

  // process the quest checking for reaching destinations.
  this.processDestinationCheck();
};

/**
 * Checks if the destination timer is ready for an evaluation of destination objectives checking.
 */
Game_Map.prototype.processDestinationCheck = function()
{
  // grab the timer.
  const timer = this.getDestinationTimer();

  // checks if the timer is complete.
  if (timer.isTimerComplete())
  {
    // evaluate the destination objectives.
    this.evaluateDestinationObjectives();

    // and reset the timer.
    timer.reset();
  }
  // the timer is not completed.
  else
  {
    // tick tock!
    timer.update();
  }
};

/**
 * Evaluate all active destination objectives that reside on this map.
 */
Game_Map.prototype.evaluateDestinationObjectives = function()
{
  // grab all the valid destination objectives.
  const activeDestinationObjectives = QuestManager.getValidDestinationObjectives();

  // if there are none, don't try to process this.
  if (activeDestinationObjectives.length === 0) return;

  // iterate over each of the destination objectives.
  activeDestinationObjectives.forEach(objective =>
  {
    // extract the coordinate range from the objective.
    const [ , coordinateRange ] = objective.destinationData();

    // check if the player within the coordinate range.
    if (objective.isPlayerWithinDestinationRange(coordinateRange))
    {
      console.log(`player has achieved the objective! ${objective.questKey}`);

      // grab the quest for reference.
      const questToProgress = QuestManager.quest(objective.questKey);

      // flag the quest objective as completed.
      questToProgress.flagObjectiveAsCompleted(objective.id);

      // progress the quest to active its next objective.
      questToProgress.progressObjectives();
    }
  });
};
//endregion Game_Map