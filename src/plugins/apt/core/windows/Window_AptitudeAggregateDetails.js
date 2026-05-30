//region Window_AptitudeDetails
import AptitudeSkillSourceProgress from './../_models/AptitudeSkillSourceProgress.js';
import AptitudeSkillAggregate from './../_models/AptitudeSkillAggregate.js';
import ApManager from './../managers/ApManager.js';

/**
 * The window containing the details of an aptitude skill aggregate.
 */
class Window_AptitudeAggregateDetails
  extends Window_Base
{
  //region properties
  /**
   * The actor bound to this window.
   * @type {Game_Actor|null}
   */
  _actor = null;

  /**
   * The selected entry for display.
   * @type {AptitudeSkillAggregate|null}
   */
  _aggregate = null;

  /**
   * The y position of the next block to draw.
   * @type {number}
   */
  _nextY = 0;

  //endregion properties

  // region init
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

    // initialize the aggregate.
    this._aggregate = null;

    // initialize the next y position.
    this._nextY = 0;
  }

  //endregion init

  //region accessors
  /**
   * The actor bound to this window.
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
    // do nothing if the actor is unchanged.
    if (this.actor() === actor) return;

    // update the actor.
    this._actor = actor;

    // refresh the contents for the new actor.
    this.refresh();
  }

  /**
   * The selected aggregate for display.
   * @returns {AptitudeSkillAggregate|null}
   */
  aggregate()
  {
    return this._aggregate;
  }

  /**
   * Sets the selected aggregate for display.
   * @param {AptitudeSkillAggregate|null} aggregate The selected aggregate or null to clear.
   */
  setAggregate(aggregate)
  {
    // do nothing if unchanged.
    if (this.aggregate() === aggregate) return;

    // update the entry.
    this._aggregate = aggregate;

    // refresh the contents for the new aggregate.
    this.refresh();
  }

  /**
   * The y position of the next block to draw.
   * @returns {number}
   */
  nextY()
  {
    return this._nextY || 0;
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
   * Draws the details for the selected aggregate.
   */
  drawContent()
  {
    // if we do not have an entry or actor to work with, show a friendly hint.
    if (!this.aggregate() || !this.actor())
    {
      // render a default hint.
      this.resetTextColor();
      this.drawText('Select a skill from the list.', 0, 0, this.contentsWidth());
      return;
    }

    // reset the next y position.
    this.setNextY(0);

    // draw the header.
    this.drawHeader();

    // draw the per‑source breakdown table.
    this.drawSources();
  }

  /**
   * Draws the header containing the icon+name and learned badge.
   */
  drawHeader()
  {
    // grab the aggregate data.
    const aggregate = this.aggregate();

    // derive the skill data for icon+name.
    const skill = this.actor()
      .skill(aggregate.skillId());

    // y anchor for the header.
    let y = this.nextY();

    // draw the icon if present.
    if (skill.iconIndex > 0)
    {
      // draw the icon at the far left.
      this.drawIcon(skill.iconIndex, 0, y);
    }

    // compute a left indent if we drew an icon.
    const left = (skill.iconIndex > 0)
      ? 36
      : 0;

    // draw the name.
    this.changeTextColor(this.systemColor());
    this.drawText(`${skill.name}`, left, y, this.contentsWidth() - left);

    // if learned, render a badge at the right.
    if (aggregate.learnedAny() === true)
    {
      // draw learned badge.
      this.resetTextColor();
      this.drawText('[LEARNED]', 0, y, this.contentsWidth(), 'right');
    }

    // advance y.
    y += this.lineHeight();

    // draw the description.
    this.changeTextColor(ColorManager.normalColor());
    const wrappedText = this.modFontSizeForText(-4, skill.description);
    this.drawTextEx(wrappedText, 0, y, this.contentsWidth());

    // add some spacing below the description.
    y += this.lineHeight() * 2;

    // set the next block anchor.
    this.setNextY(y);
  }

  /**
   * Draws the sources for the selected entry.
   */
  drawSources()
  {
    // grab the aggregate data.
    const aggregate = this.aggregate();

    // establish a y anchor somewhat below the gauges.
    const baseY = this.nextY() + this.lineHeight();

    // header label for the section.
    this.changeTextColor(this.systemColor());
    this.drawTextEx('\\I[86]\\C[16]Sources\\C[0]', 0, baseY, this.contentsWidth());

    // compute the starting y for rows.
    const updatedY = baseY + this.lineHeight();
    this.setNextY(updatedY);

    // iterate and draw each source row.
    aggregate.sources()
      .forEach(this.drawSource, this);
  }

  /**
   * Draws a single source row.
   * @param {AptitudeSkillSourceProgress} sourceProgress - The per-source progress to draw for this skill.
   */
  drawSource(sourceProgress)
  {
    // capture the current y position for this row.
    const y = this.nextY();

    // calculate the left column width for the icon+label.
    const leftW = Math.floor(this.contentsWidth() * 0.60);

    // resolve the database object for the display (icon/name) using the key.
    const databaseSource = ApManager.resolveStaticSourceByKey(sourceProgress.sourceKey());

    // don't render none-sourced rows.
    if (!databaseSource) return;

    // determine whether this source is currently active on the actor.
    const isActive = ApManager.isSourceActive(this.actor(), sourceProgress.sourceKey());

    // extract the icon index from the database object if available.
    let { iconIndex } = databaseSource;

    // actors don't normally have an icon index, so lets give em one.
    if (databaseSource.isActor())
    {
      iconIndex = 2727;
    }
    // classes also don't normally have an icon index, so lets give em one.
    else if (databaseSource.isClass())
    {
      iconIndex = 2694;
    }

    // extract the label from the database object if available, else fallback to the raw key.
    let { name } = databaseSource;
    let activityColorIndex = 0;

    // when isActive  equals  false, take this branch.
    if (isActive === false)
    {
      activityColorIndex = 7;
      name += ' (inactive)';
    }

    // draw the icon + label on the left side of the row.
    this.drawTextEx(`\\C[${activityColorIndex}]\\I[${iconIndex}]${name}\\C[0]`, 0, y, leftW);

    // give extensions an opportunity to render additional info.
    this.drawExtensionData(sourceProgress, 0 + leftW, y);

    // determine learned state for this specific source.
    const learned = sourceProgress.learned() === true;

    // determine if the actor already knows the skill via some other source.
    const knownElsewhere = learned === false &&
      sourceProgress.currentAp() < sourceProgress.requiredAp() &&
      this.actor()
        .hasSkill(sourceProgress.skillId());

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
      rightText = `${sourceProgress.currentAp()}/${sourceProgress.requiredAp()}`;
    }

    // decide the right-side color index.
    let rightColor = 7; // gray by default
    if (learned === true)
    {
      // green when learned.
      rightColor = 11;
    }
    else if (sourceProgress.currentAp() > 0)
    {
      // yellow when in-progress.
      rightColor = isActive
        ? 6
        : 7;
    }

    // apply the right-side color and draw the right-aligned status text.
    this.changeTextColor(ColorManager.textColor(rightColor));
    const rightW = this.contentsWidth() - leftW;
    this.drawText(rightText, 0, y, rightW, Window_Base.TextAlignments.Right);

    // Only draw a gauge if the skill is neither DONE nor KNOWN.
    const shouldDrawGauge = learned === false && knownElsewhere === false;
    if (shouldDrawGauge === true)
    {
      // draw the segmented gauge.
      this.drawProgressGauge(sourceProgress.currentAp(), sourceProgress.requiredAp(), isActive);
    }

    // advance to the next row position.
    this.setNextY(y + this.lineHeight());
  }

  /**
   * Extension hook for drawing additional per-source information (such as typed badges).
   * @param {AptitudeSkillSourceProgress} sourceProgress - The per-source progress for this skill.
   * @param {number} x - The row's x coordinate.
   * @param {number} y - The row's y coordinate.
   */
  // eslint-disable-next-line no-unused-vars
  drawExtensionData(sourceProgress, x, y)
  {
    // no-op.
  }

  /**
   * Draws a gauge for a progress of the skill for this source.
   * @param {number} currentAp The current AP for the progress.
   * @param {number} requiredAp The required AP for the progress.
   * @param {boolean} isActive Whether the source is currently active.
   */
  drawProgressGauge(currentAp, requiredAp, isActive)
  {
    // grab the next y position.
    const y = this.nextY();

    // compute the gauge rectangle centered vertically within the row.
    const gaugeX = Math.floor(this.contentsWidth() * 0.40);
    const gaugeY = y + Math.round(this.lineHeight() / 2) - Math.round(this.gaugeHeight() / 2);
    const rect = new Rectangle(gaugeX, gaugeY, this.gaugeWidth(), this.gaugeHeight());

    // compute the rate between 0..1 for the gauge.
    const progressRate = Math.max(0, Math.min(currentAp / requiredAp, 1));

    // build the gauge options with a dynamic segment count and colors.
    const leftGaugeColor = isActive
      ? this.gaugeColor1()
      : this.inactiveColor1();
    const rightGaugeColor = isActive
      ? this.gaugeColor2()
      : this.inactiveColor2();
    const segOpts = WindowGaugeOptions.Builder()
      .gaugeType(Window_Base.GAUGE_TYPES.Segmented)
      .segments(Math.max(1, Math.ceil(requiredAp / this.segmentValue())))
      .gap(2)
      .leftGradientColor(leftGaugeColor)
      .rightGradientColor(rightGaugeColor)
      .build();

    // draw the segmented gauge.
    this.drawGauge(rect, progressRate, segOpts);
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

  inactiveColor1()
  {
    return 'rgba(77, 77, 77, 1)';
  }

  inactiveColor2()
  {
    return 'rgba(153, 153, 153, 1)';
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

export default Window_AptitudeAggregateDetails;
//endregion Window_AptitudeDetails