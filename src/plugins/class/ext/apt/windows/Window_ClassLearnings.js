//region Window_ClassLearnings
import ClassAptitudeManager from '../managers/ClassAptitudeManager.js';

/**
 * The window beside the class's parameters: what the highlighted class keeps known while it is worn, then
 * every skill it teaches, and how far along the actor is with each.
 *
 * This is J-Aptitude's own source-details window pointed at a class, so the ladder, the DONE and KNOWN marks,
 * the progress gauges and the typed-AP badge all read exactly as they do in the aptitude scene. Progress is
 * kept per source whether or not that source is worn, which is what lets a class the actor has set aside
 * still show how far along they got.
 */
class Window_ClassLearnings
  extends Window_AptitudeSourceDetails
{
  /**
   * Constructor.
   * @param {Rectangle} rect The rectangle to draw the window in.
   */
  constructor(rect)
  {
    super(rect);
  }

  /**
   * Points this window at an actor and one of their classes, and redraws it.
   * @param {Game_Actor} actor The actor whose progress is shown.
   * @param {number} classId The id of the class whose learnings are shown.
   */
  showClass(actor, classId)
  {
    // the progress drawn belongs to whoever is being viewed.
    this.setActor(actor);

    // a class is an aptitude source like any other.
    const dataClass = $dataClasses[classId];

    // the window only redraws itself when its source changes, so the same class for a new actor needs a nudge.
    if (this.source() === dataClass)
    {
      this.refresh();
      return;
    }

    // a different class redraws on its own.
    this.setSource(dataClass);
  }

  /**
   * Overrides {@link Window_AptitudeSourceDetails#drawHeader}.<br/>
   * Draws what the class keeps known for as long as it is worn, above the skills it teaches.
   *
   * The source's own header is left out. The class's name is already highlighted in the list, and the
   * header's description of a class assumes it is the one being worn, which here it often is not.
   */
  drawHeader()
  {
    const skillIds = ClassAptitudeManager.alwaysKnownSkillIds(this.source().id);

    // a class keeping nothing known leaves the ladder at the top of the window.
    if (skillIds.length === 0) return;

    // titled the same way as the ladder beneath it, under the icon the class wears in the list.
    const left = this.contentLeft();
    const titleY = this.nextY();
    const iconIndex = ClassManager.classIconIndex(this.source());
    const title = `\\I[${iconIndex}]\\C[16]Always known\\C[0]`;
    this.drawTextEx(title, left, titleY, this.contentsWidth());

    // one row per skill: its icon and name.
    skillIds.forEach((skillId, index) =>
    {
      const skill = this.actor()
        .skill(skillId);
      const rowY = titleY + ((index + 1) * this.lineHeight());
      this.drawTextEx(`\\I[${skill.iconIndex}]${skill.name}`, left, rowY, this.contentsWidth());
    });

    // the ladder follows, after half a line of air.
    const afterRows = titleY + ((skillIds.length + 1) * this.lineHeight());
    this.setNextY(afterRows + Math.floor(this.lineHeight() / 2));
  }

  /**
   * Overrides {@link Window_AptitudeSourceDetails#contentLeft}.<br/>
   * Starts every row the class scene's shared inset in from the left edge, as the parameters beside it do.
   * @returns {number}
   */
  contentLeft()
  {
    return ClassSceneLayout.contentInset(this);
  }

  /**
   * Overrides {@link Window_AptitudeSourceDetails#teachableGaugeX}.<br/>
   * Anchors each gauge against the right side, the class scene's shared inset in from the edge.
   *
   * J-Aptitude spaces the ladder for the full width of its own scene. Beside the class's parameters this
   * window has about half that, so the gauge moves to the side and leaves a skill's name the rest of the row.
   * @returns {number}
   */
  teachableGaugeX()
  {
    const right = this.contentsWidth() - ClassSceneLayout.contentInset(this);

    return right - this.gaugeWidth();
  }

  /**
   * Overrides {@link Window_AptitudeSourceDetails#gaugeWidth}.<br/>
   * Shortens the gauges, so the longest skill names still clear their numbers inside the inset.
   * @returns {number}
   */
  gaugeWidth()
  {
    return 120;
  }

  /**
   * Overrides {@link Window_AptitudeSourceDetails#teachableStatusRight}.<br/>
   * Ends each teachable's status just short of its gauge.
   * @returns {number}
   */
  teachableStatusRight()
  {
    // a little air between the numbers and the gauge they describe.
    return this.teachableGaugeX() - this.itemPadding();
  }

  /**
   * Overrides {@link Window_Base#lineHeight}.<br/>
   * Spaces rows the way the parameters beside it are spaced, which is also what lets the longest ladders
   * fit in the window at all.
   * @returns {number}
   */
  lineHeight()
  {
    return ClassSceneLayout.ROW_HEIGHT;
  }

  /**
   * Overrides {@link Window_Base#resetFontSize}.<br/>
   * Draws everything in this window a step smaller than the menus' own type, to suit its shorter rows.
   *
   * Nearly everything here is drawn with text codes, and drawing text codes resets the font first, so the
   * smaller size belongs in the reset itself rather than being applied row by row.
   */
  resetFontSize()
  {
    this.contents.fontSize = $gameSystem.mainFontSize() - ClassSceneLayout.ROW_FONT_REDUCTION;
  }
}

export default Window_ClassLearnings;
//endregion Window_ClassLearnings