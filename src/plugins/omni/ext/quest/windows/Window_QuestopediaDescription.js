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

    // draw the recommended level for the quest.
    const recommendedLevelY = y + lh;
    this.drawQuestRecommendedLevel(x, recommendedLevelY);

    // draw the icons for each tag on this quest.
    const tagIconsY = y + (lh * 2);
    this.drawQuestTagIcons(x, tagIconsY);

    // draw the overview of the quest.
    const overviewY = y + (lh * 3);
    this.drawQuestOverview(x, overviewY);

    // draw the various logs of the quest.
    const logsY = y + (lh * 9);
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
    const possiblyMaskedName = quest.isKnown()
      ? questName
      : J.BASE.Helpers.maskString(questName);

    // determine the width of the text.
    const resizedText = this.modFontSizeForText(10, possiblyMaskedName);
    const textWidth = this.textWidth(resizedText);

    // draw the text.
    this.drawTextEx(resizedText, x, y, textWidth);
  }

  drawQuestRecommendedLevel(x, y)
  {
    // grab the current quest.
    const quest = this.getCurrentQuest();

    // grab the recommended level for the quest.
    const questRecommendedLevel = quest.recommendedLevel();

    // if no valid level is provided or is intentionally invalid, or the quest is unknown, it should be masked.
    const possiblyMaskedLevel = (quest.isKnown() && questRecommendedLevel >= 0)
      ? questRecommendedLevel.toString()
      : "???";

    // determine the width of the text.
    const combinedText = `Recommended Level: ${possiblyMaskedLevel}`;
    const resizedText = this.modFontSizeForText(-2, combinedText);
    const textWidth = this.textWidth(resizedText);

    // draw the text.
    this.drawTextEx(resizedText, x, y, textWidth);
  }

  drawQuestTagIcons(x, y)
  {
    // grab the current quest.
    const quest = this.getCurrentQuest();

    // don't render the icons if the quest is unknown, period.
    if (!quest.isKnown()) return;

    const tags = quest.tags();

    // don't render the tags if there are none.
    if (tags.length === 0) return;

    // iterate over each of the tags for rendering.
    tags.forEach((tag, index) =>
    {
      // accommodate multiple tag icons being draw sequentially.
      const tagX = x + (ImageManager.iconWidth * index);

      // render the tag icon.
      this.drawIcon(tag.iconIndex, tagX, y);
    });
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

    // TODO: this may need adjustment to text height.
    // grab the text to display for the quest description.
    let overview = quest.isKnown()
      ? quest.overview()
      : quest.unknownHint();

    // validate there was not an empty string.
    if (overview.length === 0)
    {
      // no empty strings allowed!
      overview = '???';

      // measure accordingly.
      const textWidth = this.textWidth(overview);

      // draw the overview.
      this.drawTextEx(overview, x, y, textWidth);

      // done.
      return;
    }

    // convert the quest overview into length-limited lines with words not sliced up.
    const lines = this.buildQuestOverviewLines(overview, 128);

    // the text lines for the overview should be tighter.
    const overviewLineHeight = this.lineHeight() - 10;

    // iterate over each line and draw it.
    lines.forEach((line, index) =>
    {
      // determine the y coordinate for the line.
      const lineY = y + (index * overviewLineHeight);

      // measure accordingly.
      const textWidth = this.textWidth(overview);

      // draw the overview.
      this.drawTextEx(line, x, lineY, textWidth);
    });
  }

  /**
   * Chops up the very long overview string into multiple lines based on the given max line length.
   * @param {string} overview The overview to be chopped into lines.
   * @param {number=} [maxLineLength=128] The maximum line length for any one line.
   * @returns {string[]} The overview chopped up into lines.
   */
  buildQuestOverviewLines(overview, maxLineLength = 128)
  {
    // split the text blob into words based on spaces.
    const words = overview.split(/\s/);

    // start with an empty collection for the lines.
    const lines = [];

    // reduce the words into lines by size, and capture the final line.
    const finalLine = words.reduce((currentLine, word) =>
    {
      // check if the word was translated to an empty string- the indicator it was a newline.
      if (word === String.empty)
      {
        // check if we even have a current line currently.
        if (currentLine.length > 0)
        {
          // finish the previous line.
          lines.push(currentLine);
        }

        // arbitrary check to prevent two or more new lines in a row.
        if (lines.length >= 2 && lines.at(-1) === String.empty)
        {
          return String.empty;
        }

        // manually add a new and empty line.
        lines.push(String.empty);

        // start a new line with the word- sans the new line indicators.
        return String.empty;
      }

      // the first word of a line doesn't need a space in front of it.
      if (currentLine.length === 0) return word;

      // translate the word if necessary- as escape codes are shorter than most actual words.
      const translatedWord = this.convertEscapeCharacters(word);

      // check the current line with the new word to see if the line is too long.
      const testLine = `${currentLine} ${translatedWord}`;

      // if the line does not exceed 120 characters, then keep going.
      if (testLine.length <= maxLineLength) return `${currentLine} ${word}`;

      // adding the new word would go beyond the fixed length of 120, so capture the line.
      lines.push(currentLine);

      // and start a new line.
      return word;

      // start with an empty string.
    }, String.empty);

    // add the last line to the running list.
    lines.push(finalLine);

    // return the lines of the text.
    return lines;
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

    // shorthand the lineHeight.
    const lh = this.lineHeight();

    quest.objectives
      .filter(objective =>
      {
        // objectives that have had action are included.
        if (objective.isKnown()) return true;

        // un-hidden but inactive objectives are also included.
        if (!objective.hidden && objective.isInactive()) return true;

        // objectives still in the 'InActive' status and also hidden (default) are explicitly not rendered.
        return false;
      })
      .forEach((objective, index) =>
      {
        // determine the y for the log.
        const logY = y + ((lh * 2) * index);

        // draw the log of the current state of fulfillment.
        this.drawQuestObjectiveLog(objective, x, logY);
      });
  }

  /**
   * Renders the log of the objective based on its current state.
   * @param {TrackedOmniObjective} objective The objective with the log to render.
   * @param {number} x The origin x.
   * @param {number} y The origin y.
   */
  drawQuestObjectiveLog(objective, x, y)
  {
    // the description is a header to the log.
    const descriptionText = this.modFontSizeForText(-4, objective.description());
    const description = `▫ ${descriptionText}`;
    const descriptionWidth = this.textWidth(description);

    // draw the log of the static description of the objective.
    this.drawTextEx(description, x, y, descriptionWidth);

    // the fulfillment text is a subheader to the log.
    const fulfillmentText = this.modFontSizeForText(-4, objective.fulfillmentText());
    const fulfillment = `    ${fulfillmentText}`;
    const fulfillmentWidth = this.textWidth(fulfillment);

    // draw the fulfillment text for the objective.
    const fulfillmentY = y + (this.lineHeight() / 2);
    this.drawTextEx(fulfillment, x, fulfillmentY, fulfillmentWidth);

    // the log has no special sizing or anything, but is slightly indented.
    const logText = objective.log();
    const logWidth = this.textWidth(logText);

    // draw the log of the current state of fulfillment.
    const logX = x + 40;
    const logY = y + this.lineHeight();
    this.drawTextEx(logText, logX, logY, logWidth);

    // and draw the icon indicating state.
    this.drawIcon(objective.iconIndexByState(), x, logY);
  }
}