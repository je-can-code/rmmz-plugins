class Window_QuestopediaDescription extends Window_Base
{
  /**
   * The current selected quest in the quest list window.
   * @type {TrackedOmniQuest}
   */
  #currentQuest = null;

  /**
   * Constructor.
   * @param {Rectangle} rect The rectangle that represents this window.
   */
  constructor(rect)
  {
    super(rect);
  }

  /**
   * Gets the quest currently being displayed.
   * @returns {TrackedOmniQuest}
   */
  getCurrentQuest()
  {
    return this.#currentQuest;
  }

  /**
   * Sets the quest currently being displayed.
   * @param {TrackedOmniQuest} quest The quest to display data for.
   */
  setCurrentQuest(quest)
  {
    this.#currentQuest = quest;
  }

  drawContent()
  {
    // grab the current quest.
    const quest = this.getCurrentQuest();
    if (!quest) return;

    // define the origin x,y coordinates.
    const [ x, y ] = [ 0, 0 ];

    // shorthand the lineHeight.
    const lh = this.lineHeight();

    // draw the name of the quest.
    this.drawQuestName(x, y);

    // draw the overview of the quest.
    const overviewY = y + (lh * 2);
    this.drawQuestOverview(x, overviewY);

    // draw the various logs of the quest.
    const logsY = y + (lh * 5);
    this.drawQuestLogs(x, logsY);
  }

  /**
   * Renders the quest name, if it is known. If it is not, it will be masked.
   * @param {number} x The origin x.
   * @param {number} y The origin y.
   */
  drawQuestName(x, y)
  {
    // grab the current quest.
    const quest = this.getCurrentQuest();

    // grab the name of the quest.
    const questName = quest.name();

    // potentially mask the name depending on whether or not the player knows it.
    const possiblyMaskedName = (quest.state !== OmniQuest.States.Inactive)
      ? questName
      : J.BASE.Helpers.maskString(questName);

    // determine the width of the quest's name.
    const resizedText = this.modFontSizeForText(10, possiblyMaskedName);
    const textWidth = this.textWidth(resizedText);

    // draw the header.
    this.drawTextEx(resizedText, x, y, textWidth);
  }

  /**
   * Renders the quest overview, if the quest is unlocked. If the quest is still locked, the overview will be replaced
   * with the "unknown hint" instead.
   * @param {number} x The origin x.
   * @param {number} y The origin y.
   */
  drawQuestOverview(x, y)
  {
    // grab the current quest.
    const quest = this.getCurrentQuest();

    // TODO: this may need adjustment.
    // grab the text to display for the quest description.
    const overview = quest.isKnown()
      ? quest.overview()
      : quest.unknownHint();

    const textWidth = this.textWidth(overview);

    // draw the overview.
    this.drawTextEx(overview, x, y, textWidth);
  }

  /**
   * Renders the quest logs, the notes that the protagonist observes as they complete the objectives.
   * @param {number} x The origin x.
   * @param {number} y The origin y.
   */
  drawQuestLogs(x, y)
  {
    // grab the current quest.
    const quest = this.getCurrentQuest();

    // don't render any logs if the quest isn't known yet.
    if (!quest.isKnown()) return;

    // shorthand the lineHeight.
    const lh = this.lineHeight();

    quest.objectives.forEach((objective, index) =>
    {
      const logY = y + (lh * index);
      const log = objective.log();
      const textWidth = this.textWidth(log);

      // draw the overview.
      this.drawTextEx(log, x, logY, textWidth);
    });
  }
}