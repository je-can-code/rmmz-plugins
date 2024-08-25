//region Window_QuestopediaObjectives
class Window_QuestopediaObjectives extends Window_Command
{
  _currentObjectives = [];

  /**
   * Constructor.
   * @param {Rectangle} rect The rectangle that represents this window.
   */
  constructor(rect)
  {
    super(rect);
  }

  /**
   * Overrides {@link #itemHeight}.<br>
   * Makes the command rows bigger so there can be additional lines.
   * @returns {number}
   */
  itemHeight()
  {
    return this.lineHeight() * 2;
  }

  /**
   * Gets the quest objectives currently being rendered.
   * @returns {TrackedOmniObjective[]}
   */
  getCurrentObjectives()
  {
    return this._currentObjectives ?? [];
  }

  /**
   * Sets the quest objectives currently being rendered.
   * @param {TrackedOmniObjective[]} questObjectives The quest objectives to render in this list.
   */
  setCurrentObjectives(questObjectives)
  {
    this._currentObjectives = questObjectives ?? [];
  }

  /**
   * Implements {@link #makeCommandList}.<br>
   * Creates the command list of all known quests in this window.
   */
  makeCommandList()
  {
    // grab all the omnipedia listings available.
    const commands = this.buildCommands();

    if (commands.length === 0)
    {
      commands.push(this.buildNoObjectivesCommand());
    }


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
    // grab the current quest objectives.
    const objectives = this.getCurrentObjectives();
    if (objectives.length === 0) return [];

    // compile the list of commands.
    const commands = objectives
      // if an objective is inactive, it shouldn't be rendered at all.
      .filter(objective => objective.state !== OmniObjective.States.Inactive)
      .map(this.buildCommand, this);

    // return the compiled list of commands.
    return commands;
  }

  /**
   * Builds a {@link BuiltWindowCommand} based on the quest objective.
   * @param {TrackedOmniObjective} questObjective The quest objective data.
   * @returns {BuiltWindowCommand} The built command based on this objective.
   */
  buildCommand(questObjective)
  {
    // fix the size a bit.
    const text = this.modFontSizeForText(-4, questObjective.description());

    // build a command based on the enemy.
    return new WindowCommandBuilder(text)
      .setSymbol(questObjective.id)
      .setExtensionData(questObjective)
      .setIconIndex(this.determineObjectiveStateIcon(questObjective))
      .addTextLine(questObjective.fulfillmentText() ?? String.empty)
      .flagAsMultiline()
      .build();
  }

  buildNoObjectivesCommand()
  {
    return new WindowCommandBuilder(String.empty)
      .setSymbol(0)
      .setExtensionData(null)
      .addTextLine("No known objectives for this quest.")
      .flagAsSubText()
      .build();
  }

  /**
   * Translates a quest objective's state into the icon.
   * @param {TrackedOmniObjective} questObjective The quest objective data.
   */
  determineObjectiveStateIcon(questObjective)
  {
    switch (questObjective.state)
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
  }
}

//endregion Window_QuestopediaObjectives