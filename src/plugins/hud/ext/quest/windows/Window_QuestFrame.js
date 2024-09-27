//region Window_QuestFrame
/**
 * A window containing the HUD data for the {@link QuestManager}'s tracked quests.
 */
class Window_QuestFrame extends Window_Base
{
  /**
   * @constructor
   * @param {Rectangle} rect The window size desired for this window.
   */
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

  /**
   * Extends {@link #update}.<br/>
   * Manages visibility of the quest frame.
   */
  update()
  {
    // perform original logic.
    super.update();

    // check if we can show this hud.
    if (!$hudManager.canShowHud())
    {
      // if we're not allowed to see the hud, then close it.
      if (!this.isClosed())
      {
        this.close();
      }
      
      // don't do anything else if the hud can't be shown.
      return;
    }
    else
    {
      // otherwise, open the hud.
      if (!this.isOpen())
      {
        this.open();
        this.refresh();
      }
    }

    // manage interference-based opacity.
    this.updateVisibility();
  }

  /**
   * Manages the visibility while the player is potentially interfering with it.
   */
  updateVisibility()
  {
    if (this.playerInterference())
    {
      // drastically reduce visibility of the this quest frame while the player is overlapped.
      this.handlePlayerInterference();
    }
    // otherwise, it must be regular visibility processing.
    else
    {
      // handle opacity based on the time remaining on the inactivity timer.
      this.handleNonInterferenceOpacity();
    }
  }

  /**
   * Determines whether or not the player is in the way (or near it) of this window.
   * @returns {boolean} True if the player is in the way, false otherwise.
   */
  playerInterference()
  {
    const playerX = $gamePlayer.screenX();
    const playerY = $gamePlayer.screenY();

    // the quest frame is in the upper left corner, thus the player only interferes
    // when they are literally between 0 and the width/height of the window.
    return (playerX < (this.width)) && (playerY < (this.height));
  }

  /**
   * Manages opacity for the window while the player is interfering with the visibility.
   */
  handlePlayerInterference()
  {
    // if we are above 64, rapidly decrement by -15 until we get below 64.
    if (this.contentsOpacity > 64) this.contentsOpacity -= 15;
    // if we are below 64, increment by +1 until we get to 64.
    else if (this.contentsOpacity < 64) this.contentsOpacity += 1;
  }

  /**
   * Reverts the opacity changes associated with the player getting in the way.
   */
  handleNonInterferenceOpacity()
  {
    // refresh the opacity so the frame can be seen again.
    this.contentsOpacity = 255;
  }

  /**
   * Draws the quests currently tracked in the window as an element of the HUD.
   */
  drawContent()
  {
    // don't draw the hud if it can't be shown.
    if (!$hudManager.canShowHud()) return;
    
    // we default to the upper left most point of the window for origin.
    const [ x, y ] = [ 0, 0 ];

    // draw the quests and their objective datas.
    this.drawQuests(x, y);
  }

  /**
   * Renders all {@link TrackedOmniQuest}s the player currently has set as "tracked".
   * @param {number} x The origin x.
   * @param {number} y The origin y.
   */
  drawQuests(x, y)
  {
    // grab the current quest.
    const quests = QuestManager.trackedQuests();

    // if there are no tracked quests, do not render them.
    if (quests.length === 0) return;

    // designate the lineheight once!
    const lh = this.lineHeight();

    // initialize the line counter, shared throughout the rendering of this window.
    let lineCount = 0;

    // render each quest with a global line count that keeps the Y in sync.
    // TODO: consider using a reducer?
    quests.forEach(quest =>
    {
      // the base y for this quest.
      const questY = y;

      // the base y for this quest.
      const questNameY = questY + (lh * lineCount);

      // render the quest name as the header of the quest frame for each quest.
      // TODO: if necessary, make this return how many lines rendered?
      this.drawQuestName(quest, x, questNameY);

      // and count the line.
      lineCount++;

      // grab all the active objectives.
      const drawableObjectives = quest.objectives.filter(objective => objective.isActive());

      // check if we ended up with no active objectives.
      if (drawableObjectives.length === 0)
      {
        // identify the specified line height for each successive quest .
        const nonObjectiveY = questY + (lh * lineCount);

        // render the non-objective.
        // TODO: if necessary, make this return how many lines rendered?
        this.drawNonObjective(quest, x, nonObjectiveY);

        // and count the line.
        lineCount++;

        // don't process the objectives.
        return;
      }

      // iterate over each objective to render it.
      drawableObjectives
        .forEach(objective =>
        {
          // identify the specified line height for each successive objective.
          const objectiveY = questY + (lh * lineCount);

          // render the objective.
          // TODO: if necessary, make this return how many lines rendered?
          this.drawObjective(objective, x, objectiveY);

          // and count the line.
          lineCount++;
        });
    }, this);
  }

  /**
   * Renders the name of the quest being tracked.
   * @param {TrackedOmniQuest} quest The quest being tracked.
   * @param {number} x The origin x.
   * @param {number} y The origin y.
   */
  drawQuestName(quest, x, y)
  {
    // if the quest isn't known, it should be masked.
    const possiblyMaskedName = quest.isKnown()
      ? quest.name()
      : J.BASE.Helpers.maskString(quest.name());

    // the quest name itself looks a bit better when its a bit smaller than the base size and bold.
    const questNameSized = this.modFontSizeForText(-4, possiblyMaskedName);
    const questName = this.boldenText(questNameSized);

    // render the emboldened text of the quest name.
    const questNameWidth = this.textWidth(questName);
    this.drawTextEx(questName, x, y, questNameWidth);
  }

  /**
   * Renders in-place of objectives the appropriate "you're not currently on any active objective for this quest" text,
   *
   * This situation is kind of an exceptional situation for a player to likely want to track a quest for, and should be
   * called out as a thing to discourage the player from keeping tracked.
   * @param {TrackedOmniQuest} quest The quest to render for the non-objective situation.
   * @param {number} x The origin x.
   * @param {number} y The origin y.
   */
  drawNonObjective(quest, x, y)
  {
    // determine the suspected reason for which there are no active objectives.
    let noObjectivesText;
    switch (true)
    {
      case quest.isCompleted():
        noObjectivesText = `✅ Quest is complete.`;
        break;
      case quest.isFailed():
        noObjectivesText = `❌ Quest is failed.`;
        break;
      case quest.isMissed():
        noObjectivesText = `❓ Quest is missed.`;
        break;
      default:
        const secretObjective = quest.objectives.find(objective => !objective.isHidden());
        noObjectivesText = secretObjective
          ? secretObjective.fulfillmentText()
          : `🍈 Quest is in a state with no known objectives active.`;
        break;
    }

    // render the line and count it.
    const text = this.modFontSizeForText(-8, noObjectivesText);
    const nonObjectiveX = x + 10;
    const objectiveTextWidth = this.textWidth(text);
    this.drawTextEx(text, nonObjectiveX, y, objectiveTextWidth);
  }

  /**
   * Renders the fulfillment text for the given objective.
   * @param {TrackedOmniObjective} objective The objective to render.
   * @param {number} x The origin x.
   * @param {number} y The origin y.
   */
  drawObjective(objective, x, y)
  {
    // the fulfillment text may be longer, so render it a bit smaller.
    const objectiveText = this.modFontSizeForText(-8, objective.fulfillmentText());

    // render the text a bit indented to the right.
    const objectiveX = x + 10;
    const objectiveTextWidth = this.textWidth(objectiveText);
    this.drawTextEx(objectiveText, objectiveX, y, objectiveTextWidth);
  }

  /**
   * Overrides {@link lineHeight}.<br/>
   * This window's default lineheight will be 10 less than the default.
   * @returns {number}
   */
  lineHeight()
  {
    return super.lineHeight() - 10;
  }
}

//endregion Window_QuestFrame