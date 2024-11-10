//region Window_QuestopediaList
class Window_QuestopediaList extends Window_Command
{
  /**
   * The category that this list is being filtered by. When an empty string, no filter is applied.
   * @type {string}
   */
  _currentCategoryKey = String.empty;

  /**
   * Constructor.
   * @param {Rectangle} rect The rectangle that represents this window.
   */
  constructor(rect)
  {
    super(rect);
  }

  /**
   * Gets the current category key of quests being displayed in this list.
   * @returns {string}
   */
  getCurrentCategoryKey()
  {
    return this._currentCategoryKey;
  }

  /**
   * Sets the current category of quests to display in this list.
   * @param {string} categoryKey The quest category key.
   */
  setCurrentCategoryKey(categoryKey)
  {
    this._currentCategoryKey = categoryKey;
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

    // filter the quests by various criteria.
    const filteredQuests = questEntries.filter(this._questFiltering, this);

    // no quests to display.
    if (filteredQuests.length === 0) return [];

    // return the compiled list of commands.
    return filteredQuests.map(this.buildCommand, this);
  }

  /**
   * Determines whether or not this quest should be shown in the current list.
   * @param {TrackedOmniQuest} quest The quest in question.
   * @returns {boolean}
   */
  _questFiltering(quest)
  {
    // grab the current category being viewed.
    const currentCategory = this.getCurrentCategoryKey();

    // if the current category is unset or empty, then no filtering is applied.
    if (currentCategory === String.empty) return true;

    // if the category key matches the current category, then this quest should be rendered.
    if (quest.categoryKey === currentCategory) return true;

    // this quest should not be rendered.
    return false;
  }

  /**
   * Builds a {@link BuiltWindowCommand} based on the quest data.
   * @param {TrackedOmniQuest} questopediaEntry The quest data.
   * @returns {BuiltWindowCommand} The built command based on this quest.
   */
  buildCommand(questopediaEntry)
  {
    // determine the name based on whether its known or not.
    const questName = questopediaEntry.isKnown()
      ? questopediaEntry.name()
      : J.BASE.Helpers.maskString(questopediaEntry.name());

    // if the quest is being tracked already, add a little emoji to indicate such.
    const trackedText = questopediaEntry.isTracked()
      ? "🔍"
      : String.empty;

    // check if the quest can actually be tracked in its current state.
    const canBeTracked = questopediaEntry.canBeTracked();

    // just-in-case cleanup of quests that can't be tracked any longer.
    if (!canBeTracked && questopediaEntry.isTracked())
    {
      questopediaEntry.toggleTracked();
    }

    // build a command based on the enemy.
    return new WindowCommandBuilder(questName)
      .setSymbol(questopediaEntry.key)
      .setExtensionData(questopediaEntry)
      .setIconIndex(this.determineQuestStateIcon(questopediaEntry))
      .setRightText(trackedText)
      .setEnabled(canBeTracked)
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