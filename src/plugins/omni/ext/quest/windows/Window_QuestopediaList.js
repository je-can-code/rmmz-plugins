//region Window_QuestopediaList
import OmniQuest from './../__models/OmniQuest.js';
import QuestNameTruncator from './../managers/QuestNameTruncator.js';

/**
 * The list of quests in the category being browsed, one row per quest.
 *
 * Rows render a touch smaller than body copy: quest names are authored long, and the column has
 * to leave room at its right edge for the tracking marker without the two ever meeting.
 */
class Window_QuestopediaList
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
   * Overrides {@link Window_Base.resetFontSize}.<br/>
   * Every row of this list, marker included, renders a little smaller than body copy.
   *
   * This is the one seam that shrinks the name, the marker and the measurements together; wrapping
   * each name in a size code would leave the marker at full size beside a smaller name.
   */
  resetFontSize()
  {
    this.contents.fontSize = $gameSystem.mainFontSize() - this.fontSizeReduction();
  }

  /**
   * How much smaller than body copy this list renders.
   * @returns {number}
   */
  fontSizeReduction()
  {
    return 4;
  }

  /**
   * The text drawn at the right edge of a tracked quest's row.
   * @returns {string}
   */
  trackedMarker()
  {
    return '🔍';
  }

  /**
   * The width the command name is indented by to leave room for its icon.
   *
   * This mirrors the indent the shared command drawing applies before the name; it is not read from
   * there because the drawing has no reason to expose it, and the name is fitted here before the
   * drawing ever sees it.
   * @returns {number}
   */
  commandNameIndent()
  {
    return 40;
  }

  /**
   * The room reserved at the right edge of a row for the tracking marker, whether or not the row is
   * tracked. Reserving it unconditionally keeps every name fitted to the same width, so tracking a
   * quest never shortens its name.
   * @returns {number}
   */
  markerGutterWidth()
  {
    // measured as escape-code text so the measurement runs at this list's own font size, which is
    // what draws the marker.
    const markerWidth = this.textSizeEx(this.trackedMarker()).width;

    return markerWidth + this.itemPadding();
  }

  /**
   * The width a quest name may occupy before it would reach the marker's gutter.
   * @returns {number}
   */
  nameAvailableWidth()
  {
    const rowWidth = this.innerWidth - (this.itemPadding() * 2);

    return rowWidth - this.commandNameIndent() - this.markerGutterWidth();
  }

  /**
   * Fits a quest name into the room a row leaves for it.
   * @param {string} name The name, possibly carrying escape codes.
   * @returns {string}
   */
  fitQuestName(name)
  {
    const available = this.nameAvailableWidth();

    // a candidate fits when its rendered width, escape codes included, stays short of the gutter.
    const fits = candidate => this.textSizeEx(candidate).width <= available;

    return QuestNameTruncator.fit(name, fits);
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
     * The category that this list is being filtered by. When an empty string, no filter is applied.
     * @type {string}
     */
    this._currentCategoryKey = String.empty;
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
   * Implements {@link #makeCommandList}.<br/>
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
    const rawName = questopediaEntry.isKnown()
      ? questopediaEntry.name()
      : J.BASE.Helpers.maskString(questopediaEntry.name());

    // keep the name clear of the marker's gutter, tracked or not.
    const questName = this.fitQuestName(rawName);

    // if the quest is being tracked already, add a little emoji to indicate such.
    const trackedText = questopediaEntry.isTracked()
      ? this.trackedMarker()
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

export default Window_QuestopediaList;
//endregion Window_QuestopediaList