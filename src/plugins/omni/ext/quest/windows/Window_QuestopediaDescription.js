//region Window_QuestopediaDescription
import QuestOverviewWrapper from './../managers/QuestOverviewWrapper.js';

/**
 * The pane describing the highlighted quest: its name, recommended level, tags and overview.
 *
 * The objectives live in their own pane beneath this one, so this window never draws them. Keeping
 * the two apart is what lets each be sized for its own content rather than one window guessing at
 * where the other's text will end.
 */
class Window_QuestopediaDescription
  extends Window_Base
{
  /**
   * The current selected quest in the quest list window.
   * @type {TrackedOmniQuest}
   */
  _currentQuest = null;

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
    return this._currentQuest;
  }

  /**
   * Sets the quest currently being displayed.
   * @param {TrackedOmniQuest} quest The quest to display data for.
   */
  setCurrentQuest(quest)
  {
    this._currentQuest = quest;
  }

  /**
   * Implements {@link Window_Base.drawContent}.<br/>
   * Draws the name, recommended level, tags and overview of the current quest, top to bottom.
   */
  drawContent()
  {
    // grab the current quest.
    const quest = this.getCurrentQuest();

    // nothing highlighted means nothing to describe.
    if (quest === null) return;

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

  /**
   * Renders the recommended level of the quest, masked while the quest is unknown or the level is
   * deliberately unset.
   * @param {number} x The origin x.
   * @param {number} y The origin y.
   */
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

  /**
   * Renders one icon per tag on the quest, left to right, once the quest is known.
   * @param {number} x The origin x.
   * @param {number} y The origin y.
   */
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

    // grab the text to display for the quest description.
    const overview = quest.isKnown()
      ? quest.overview()
      : quest.unknownHint();

    // an authored blank is drawn as a visible question rather than as nothing at all.
    if (overview.length === 0)
    {
      this.drawTextEx('???', x, y, this.innerWidth);
      return;
    }

    // break the overview into lines that fit this window at its current width and font.
    const lines = this.buildQuestOverviewLines(overview);

    // the text lines for the overview should be tighter.
    const overviewLineHeight = this.lineHeight() - 10;

    // iterate over each line and draw it.
    lines.forEach((line, index) =>
    {
      // determine the y coordinate for the line.
      const lineY = y + (index * overviewLineHeight);

      // draw the line.
      this.drawTextEx(line, x, lineY, this.innerWidth);
    });
  }

  /**
   * Breaks the overview into lines no wider than this window's content area.
   *
   * The measurement is this window's own, so the same overview breaks differently in a narrower pane
   * or a larger font, which is the whole point of measuring rather than counting characters.
   * @param {string} overview The overview to be chopped into lines.
   * @returns {string[]} The overview chopped up into lines.
   */
  buildQuestOverviewLines(overview)
  {
    // a candidate line fits when its rendered width, escape codes included, stays inside the pane.
    const fits = line => this.textSizeEx(line).width <= this.innerWidth;

    return QuestOverviewWrapper.wrap(overview, fits);
  }
}

export default Window_QuestopediaDescription;
//endregion Window_QuestopediaDescription