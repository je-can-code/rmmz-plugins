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

  clearContent()
  {
    super.clearContent();
  }

  drawContent()
  {
    // grab the current quest.
    const quest = this.getCurrentQuest();
    if (!quest) return;

    // define the origin x,y coordinates.
    const [x, y] = [0, 0];

    // shorthand the lineHeight.
    const lh = this.lineHeight();

    // grab the name of the quest.
    this.drawQuestName(x, y);

    const unknownHintY = y + (lh * 2);
    this.drawQuestUnknownHint(x, unknownHintY);
  }

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
    const textWidth = this.textWidth(questName);

    const resizedText = this.modFontSizeForText(10, possiblyMaskedName);

    // draw the header.
    this.drawTextEx(resizedText, x, y, textWidth);
  }

  drawQuestUnknownHint(x, y)
  {
    // grab the current quest.
    const quest = this.getCurrentQuest();

    const unknownHint = quest.unknownHint();

    const textWidth = this.textWidth(unknownHint);

    // draw the header.
    this.drawTextEx(unknownHint, x, y, textWidth);
  }
}