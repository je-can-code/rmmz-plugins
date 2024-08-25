//region Window_QuestFrame
class Window_QuestFrame extends Window_Base
{
  constructor(rect)
  {
    super(rect);
  }

  /**
   * Extends {@link initialize}.<br/>
   * Also configures this window accordingly.
   * @param {Rectangle} rect The rectangle representing this window.
   */
  initialize(rect)
  {
    // perform original logic.
    super.initialize(rect);

    // run our one-time setup and configuration.
    this.configure();

    // refresh the window for the first time.
    this.refresh();
  }

  /**
   * Performs the one-time setup and configuration per instantiation.
   */
  configure()
  {
    // make the window's background opacity transparent.
    this.opacity = 0;
  }

  drawContent()
  {
    // we default to the upper left most point of the window for origin.
    const [ x, y ] = [ 0, 0 ];

    // draw the quests and their objective datas.
    this.drawQuests(x, y);
  }

  drawQuests(x, y)
  {
    // grab the current quest.
    const quests = QuestManager.trackedQuests();

    // if there are no quests, do not render them.
    if (quests.length === 0) return;

    const lh = this.lineHeight();

    let lineCount = 0;

    quests.forEach((quest, questIndex) =>
    {
      const questNameY = lh * lineCount;
      const questNameSized = this.modFontSizeForText(-4, quest.name());
      const questName = this.boldenText(questNameSized);
      const questNameWidth = this.textWidth(questName);
      this.drawTextEx(questName, 0, questNameY, questNameWidth);
      lineCount++;

      const drawableObjectives = quest.objectives.filter(objective => objective.isActive());

      if (drawableObjectives.length === 0)
      {
        const objectiveTextWidth = this.textWidth(objectiveText);
        this.drawTextEx(objectiveText, 10, objectiveY, objectiveTextWidth);
      }

      drawableObjectives
        .forEach((objective, objectiveIndex) =>
        {
          const objectiveY = lh * (objectiveIndex + lineCount);
          const objectiveText = this.modFontSizeForText(-8, objective.fulfillmentText());
          const objectiveTextWidth = this.textWidth(objectiveText);
          this.drawTextEx(objectiveText, 10, objectiveY, objectiveTextWidth);
          lineCount++;
        });
    }, this);
  }

  drawQuest(x, y)
  {

  }

  drawObjectives(x, y)
  {

  }

  drawObjective(x, y)
  {

  }

  lineHeight()
  {
    return super.lineHeight() - 10;
  }

}

//endregion Window_QuestFrame