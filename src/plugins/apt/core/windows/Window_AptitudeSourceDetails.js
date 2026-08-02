//region Window_AptitudeSourceDetails
import AptitudeTeachable from './../_models/AptitudeTeachable.js';
import ApManager from './../managers/ApManager.js';

/**
 * A window displaying details about a specific aptitude source.
 */
class Window_AptitudeSourceDetails
  extends Window_Base
{
  //region properties
  /**
   * The actor bound to this window.
   * @type {Game_Actor|null}
   */
  _actor = null;

  /**
   * The source bound to this window.
   * @type {RPG_Actor|RPG_Class|RPG_EquipItem|RPG_Weapon|RPG_Armor|RPG_Skill|RPG_State|null}
   */
  _source = null;

  /**
   * The y position of the next block to draw.
   * @type {number}
   */
  _nextY = 0;

  //endregion properties

  //region init
  /**
   * Constructor.
   * @param {Rectangle} rect The rectangle to draw the window in.
   */
  constructor(rect)
  {
    // call parent ctor.
    super(rect);

    // initialize members.
    this.initMembers();

    // draw initial contents.
    this.refresh();
  }

  /**
   * Initializes the members of this window.
   */
  initMembers()
  {
    // initialize the actor.
    this._actor = null;

    // initialize the source.
    this._source = null;

    // initialize the next y position.
    this._nextY = 0;
  }

  //endregion init

  //region accessors
  /**
   * Gets the actor that is bound to this window.
   * @returns {Game_Actor|null}
   */
  actor()
  {
    return this._actor;
  }

  /**
   * Sets the actor for this window.
   * @param {Game_Actor} actor The actor to bind.
   */
  setActor(actor)
  {
    this._actor = actor;
  }

  /**
   * Gets the source that is bound to this window.
   * @returns {RPG_Actor|RPG_Class|RPG_EquipItem|RPG_Weapon|RPG_Armor|RPG_Skill|RPG_State|null}
   */
  source()
  {
    return this._source;
  }

  /**
   * Sets the source for this window.
   * @param {RPG_Actor|RPG_Class|RPG_EquipItem|RPG_Weapon|RPG_Armor|RPG_Skill|RPG_State} source The new source.
   */
  setSource(source)
  {
    // do nothing if the source is unchanged.
    if (this.source() === source) return;

    // update the source.
    this._source = source;

    // refresh the contents for the new source.
    this.refresh();
  }

  /**
   * The y position of the next block to draw.
   * @returns {number}
   */
  nextY()
  {
    return this._nextY;
  }

  /**
   * Sets the next y position for drawing.
   * @param {number} y The y position to set.
   */
  setNextY(y)
  {
    this._nextY = y;
  }

  //endregion accessors

  //region draw
  /**
   * Implements {@link #drawContent}.<br/>
   * Draws the details for the selected source.
   */
  drawContent()
  {
    if (!this.source() || !this.actor())
    {
      // render a default hint.
      this.resetTextColor();
      this.drawText('Select a source from the list.', 0, 0, this.contentsWidth());
      return;
    }

    // reset the next y position.
    this.setNextY(0);

    // draw the header.
    this.drawHeader();

    // draw the learnable skills from the source.
    this.drawSourceDetails();
  }

  /**
   * Draws the header containing the icon and name.
   */
  drawHeader()
  {
    // grab the source data.
    const source = this.source();

    // y anchor for the header.
    let y = this.nextY();

    if (source.iconIndex > 0)
    {
      this.drawIcon(source.iconIndex, 0, y);
    }

    // compute a left indent if we drew an icon.
    const left = (source.iconIndex > 0)
      ? 36
      : 0;

    // draw the name of the source.
    this.changeTextColor(this.systemColor());
    this.drawText(`${source.name}`, left, y, this.contentsWidth() - left);

    // advance y.
    y += this.lineHeight();

    // filled per source kind below.
    let description;

    // actors use their profile as the description.
    if (source.isActor())
    {
      description = source.profile;
    }
    // classes simply don't have a description.
    else if (source.isClass())
    {
      description = 'The class applied to the current actor.';
    }
    // states also don't have a description.
    else if (source.isState())
    {
      description = 'A state applied to the actor.';
    }
    // the rest of the possibilities do, though.
    else
    {
      ({ description } = source);
    }

    // render the description.
    const wrappedText = this.modFontSizeForText(-4, description);
    this.drawTextEx(wrappedText, 0, y, this.contentsWidth());

    // update the nextY coordinate.
    y += this.lineHeight() * 3;
    this.setNextY(y);
  }

  /**
   * Draws the details for the source.
   * This includes the learnable skills and their progress.
   */
  drawSourceDetails()
  {
    // grab the source data.
    const source = this.source();

    // establish a y anchor somewhat below the gauges.
    const baseY = this.nextY();

    // header label for the section.
    this.drawTextEx(`\\I[79]\\C[16]Skills\\C[0]`, 0, baseY, this.contentsWidth());

    // compute the starting y for rows.
    const updatedY = baseY + this.lineHeight();
    this.setNextY(updatedY);

    // extract all the teachables for this source.
    const teachables = source.aptitudeTeachings;

    // check if we are lacking in teachables.
    if (teachables.length === 0)
    {
      // render a friendly hint.
      this.resetTextColor();
      this.drawText('No teachable skills available.', 0, this.nextY(), this.contentsWidth());

      // stop processing.
      return;
    }

    // iterate over the teachables and draw the details for each.
    teachables.forEach(this.drawTeachable, this);
  }

  /**
   * Draws the details for a single teachable.
   * @param {AptitudeTeachable} teachable The teachable to render.
   */
  drawTeachable(teachable)
  {
    // grab the actor.
    const actor = this.actor();

    // derive the key from the source.
    const sourceKey = ApManager.deriveKey(this.source());

    // default with 0 for the x coordinate.
    const x = 0;

    // start with the nextY.
    const nextY = this.nextY();

    // calculate the left column width for the icon+label.
    const leftW = Math.floor(this.contentsWidth() * 0.60);

    // extract the AP required to learn this skill.
    const {
      requiredAp,
      skillId
    } = teachable;

    // identify the skill.
    const skill = actor.skill(skillId);

    // determine if the actor is learning this teachable.
    const learning = actor.getAptitudeLearning(sourceKey, skillId);

    // identify if the learning exists or not.
    const hasLearning = learning !== null;

    // render the learnable skill name.
    this.drawTextEx(`\\I[${skill.iconIndex}]${skill.name}`, x, nextY, leftW);

    // give extensions an opportunity to render additional info.
    this.drawExtensionData(teachable, sourceKey, x + leftW, nextY);

    // determine the current AP count for this skill.
    const currentAp = hasLearning
      ? learning.currentAp
      : 0;

    // determine learned state for this specific source.
    const learned = hasLearning && learning.isLearned() === true;

    // determine if the actor already knows the skill via some other source.
    const knownElsewhere = (learned === false) &&
      this.actor()
        .hasSkill(skillId);

    // decide the right-side text content.
    let rightText;
    if (learned === true)
    {
      // if learned from this source, show DONE.
      rightText = 'DONE';
    }
    else if (knownElsewhere === true)
    {
      // if not learned from this source but the actor already knows the skill, show KNOWN.
      rightText = 'KNOWN';
    }
    else
    {
      // otherwise, show the current/required AP counts.
      rightText = `${currentAp}/${requiredAp}`;
    }

    // decide the right-side color index.
    let rightColor = 7; // gray by default
    if (learned === true)
    {
      // green when learned.
      rightColor = 11;
    }
    else if (currentAp > 0)
    {
      // yellow when in-progress.
      rightColor = 6;
    }

    // apply the right-side color and draw the right-aligned status text.
    this.changeTextColor(ColorManager.textColor(rightColor));
    const rightW = this.contentsWidth() - leftW;
    this.drawText(rightText, 0, nextY, rightW, Window_Base.TextAlignments.Right);

    // Only draw a gauge if the skill is neither DONE nor KNOWN.
    const shouldDrawGauge = learned === false && knownElsewhere === false;
    if (shouldDrawGauge === true)
    {
      // draw the segmented gauge.
      this.drawTeachableGauge(currentAp, requiredAp);
    }

    // and add a line for the next row.
    this.setNextY(nextY + this.lineHeight());
  }

  /**
   * Draws a gauge for a teachable skill.
   * @param {number} currentAp The current AP for the teachable.
   * @param {number} requiredAp The required AP for the teachable.
   */
  drawTeachableGauge(currentAp, requiredAp)
  {
    // grab the nextY position.
    const nextY = this.nextY();

    // compute the gauge rectangle centered vertically within the row.
    const gaugeX = Math.floor(this.contentsWidth() * 0.40);
    const gaugeY = nextY + Math.round(this.lineHeight() / 2) - Math.round(this.gaugeHeight() / 2);
    const rect = new Rectangle(gaugeX, gaugeY, this.gaugeWidth(), this.gaugeHeight());

    // compute the rate between 0..1 for the gauge.
    const progressRate = Math.max(0, Math.min(currentAp / requiredAp, 1));

    // build the gauge options with a dynamic segment count and colors.
    const segOpts = WindowGaugeOptions.Builder()
      .gaugeType(Window_Base.GAUGE_TYPES.Segmented)
      .segments(Math.max(1, Math.ceil(requiredAp / this.segmentValue())))
      .gap(2)
      .leftGradientColor(this.gaugeColor1())
      .rightGradientColor(this.gaugeColor2())
      .build();

    // draw the segmented gauge.
    this.drawGauge(rect, progressRate, segOpts);
  }

  /**
   * Extension hook for drawing additional teachable information.
   * @param {AptitudeTeachable} teachable - The teachable being rendered.
   * @param {string} sourceKey - The stable key for the source currently displayed.
   * @param {number} x - The row's x coordinate.
   * @param {number} y - The row's y coordinate.
   */
  // eslint-disable-next-line no-unused-vars
  drawExtensionData(teachable, sourceKey, x, y)
  {
    // no-op.
  }

  //endregion draw

  //region helpers
  /**
   * The width of the gauges in this window.
   * @returns {number}
   */
  gaugeWidth()
  {
    return 200;
  }

  /**
   * The height of the gauges in this window.
   * @returns {number}
   */
  gaugeHeight()
  {
    return 12;
  }

  /**
   * The back color of the gauges in this window.
   * @returns {string}
   */
  gaugeBackColor()
  {
    return 'rgba(255, 255, 255, 0.1)';
  }

  /**
   * The color to gradient from.
   * Defaults to blue.
   * @returns {string}
   */
  gaugeColor1()
  {
    return 'rgba(179, 89, 0, 1)';
  }

  /**
   * The color to gradient into.
   * Defaults to green.
   * @returns {string}
   */
  gaugeColor2()
  {
    return 'rgba(255, 166, 77, 1)';
  }

  /**
   * The amount that one segment represents.
   * @returns {number}
   */
  segmentValue()
  {
    return 10;
  }

  //endregion helpers
}

export default Window_AptitudeSourceDetails;
//endregion Window_AptitudeSourceDetails