//region Window_QuestopediaObjectives
/**
 * The pane listing the objectives of the highlighted quest that the player knows about.
 *
 * Each row is one objective: the state icon and the description on the first line, then how it is
 * fulfilled and what the protagonists made of it beneath. The rows are read, never chosen- the scene
 * keeps the cursor on the quest list- but a command window is still the right shape, because it
 * already knows how to draw a block of lines per entry and to scroll when there are more than fit.
 */
class Window_QuestopediaObjectives
  extends Window_Command
{
  /**
   * Constructor.
   * @param {Rectangle} rect The rectangle that represents this window.
   */
  constructor(rect)
  {
    // perform original logic, which seeds this window's members before building the list.
    super(rect);
  }

  /**
   * Implements {@link Window_Command.initMembers}.<br/>
   * Initializes the members of this window.
   *
   * This cannot be a class field declaration: JavaScript applies those only after `super()` returns,
   * by which point the command list has already been built from it and found it undefined.
   */
  initMembers()
  {
    /**
     * The quest objectives currently being rendered.
     * @type {TrackedOmniObjective[]}
     */
    this._currentObjectives = [];
  }

  /**
   * Overwrites {@link #itemHeight}.<br/>
   * Each row carries the objective's description and two lines of subtext beneath it, so the row is
   * two lines tall to hold the block once it is centered.
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
    return this._currentObjectives;
  }

  /**
   * Sets the quest objectives currently being rendered.
   * @param {TrackedOmniObjective[]} questObjectives The quest objectives to render in this list.
   */
  setCurrentObjectives(questObjectives)
  {
    this._currentObjectives = questObjectives;
  }

  /**
   * Implements {@link #makeCommandList}.<br/>
   * Creates one row per known objective, or a single row saying there are none.
   */
  makeCommandList()
  {
    // grab the rows for every objective the player knows about.
    const commands = this.buildCommands();

    // a quest with nothing to show still says so, rather than presenting an empty pane.
    if (commands.length === 0)
    {
      commands.push(this.buildNoObjectivesCommand());
    }

    // build all the commands.
    commands.forEach(this.addBuiltCommand, this);
  }

  /**
   * Builds the rows for every objective the player knows about.
   *
   * An objective is known once it has been activated, or when it was never hidden in the first
   * place; a hidden objective that has not started yet is a spoiler and stays out of the pane.
   * @returns {BuiltWindowCommand[]}
   */
  buildCommands()
  {
    // grab the current quest objectives.
    const objectives = this.getCurrentObjectives();

    // keep only the objectives the player is allowed to see, in the order they resolve.
    return objectives
      .filter(objective => objective.isKnown())
      .map(this.buildCommand, this);
  }

  /**
   * Builds a {@link BuiltWindowCommand} based on the quest objective.
   * @param {TrackedOmniObjective} questObjective The quest objective data.
   * @returns {BuiltWindowCommand} The built command based on this objective.
   */
  buildCommand(questObjective)
  {
    // the description heads the row, a touch smaller so the fulfillment and log beneath read as its own.
    const description = this.modFontSizeForText(-4, questObjective.description());

    // build a row headed by the description, with the fulfillment and the log as subtext beneath it.
    return new WindowCommandBuilder(description)
      .setSymbol(questObjective.id)
      .setExtensionData(questObjective)
      .setIconIndex(questObjective.iconIndexByState())
      .addTextLine(questObjective.fulfillmentText())
      .addTextLine(questObjective.log())
      .build();
  }

  /**
   * Builds the single row shown when the quest has no objectives the player knows about.
   * @returns {BuiltWindowCommand}
   */
  buildNoObjectivesCommand()
  {
    return new WindowCommandBuilder(String.empty)
      .setSymbol(0)
      .setExtensionData(null)
      .addTextLine('No known objectives for this quest.')
      .build();
  }
}

export default Window_QuestopediaObjectives;
//endregion Window_QuestopediaObjectives