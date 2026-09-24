//region Window_BossFrame
class Window_BossFrame
  extends Window_TargetFrame
{
  /**
   * The size of the boss's hp gauge, in pixels: far wider than a regular target's, and a touch taller. Its bar
   * fills its whole bitmap, so the height is both.
   * @type {{width: number, height: number}}
   */
  static HpGaugeSize = { width: 1000, height: 16 };

  constructor(rect)
  {
    super(rect);
  }

  /**
   * Initializes all members of this class.
   */
  initMembers()
  {
    // perform original logic.
    super.initMembers();

    this._j._hud ||= {};

    this._j._hud._boss = {};

    this._j._hud._boss._requestHide = false;

    this._j._hud._boss._concealing = false;

    this._j._hud._boss._requestShow = false;

    this._j._hud._boss._revealing = false;
  }

  //region properties
  /**
   * Gets the j.
   * @returns {{_hud: {_boss: {_requestHide: boolean, _concealing: boolean, _requestShow: boolean,
   * _revealing: boolean}}}} The j.
   */
  j()
  {
    // hand back the j.
    return this._j;
  }
  //endregion properties

  requestHideBossFrame()
  {
    this.j()._hud._boss._requestHide = true;

    this.beginConcealing();
  }

  beginConcealing()
  {
    this.j()._hud._boss._concealing = true;
  }

  endConcealing()
  {
    this.j()._hud._boss._concealing = false;

    this.acknowledgeBossFrameHidden();
  }

  acknowledgeBossFrameHidden()
  {
    this.j()._hud._boss._requestHide = false;
  }

  isStillConcealing()
  {
    return this.j()._hud._boss._concealing;
  }

  requestShowBossFrame()
  {
    this.j()._hud._boss._requestShow = true;

    this.beginRevealing();
  }

  beginRevealing()
  {
    this.j()._hud._boss._revealing = true;
  }

  endRevealing()
  {
    this.j()._hud._boss._revealing = false;
  }

  isStillRevealing()
  {
    return this.j()._hud._boss._revealing;
  }

  //region caching
  /**
   * Ensures all sprites are created and available for use.
   */
  createCache()
  {
    // cache the target hp gauge.
    this.getOrCreateTargetHpGaugeSprite();

    // remove the mp/tp gauges for bosses.
  }

  /**
   * Creates the boss's hp gauge sprite for this window and caches it.
   * @returns {Sprite_MapGauge} The gauge sprite of the boss.
   */
  getOrCreateTargetHpGaugeSprite()
  {
    return this.getOrCreateGaugeSprite('bossframe-enemy-hp-gauge', Window_BossFrame.HpGaugeSize);
  }

  //endregion caching

  handleInactivity()
  {
    // boss frames don't go inactive.
  }

  update()
  {
    super.update();

    this.manageBossFrameVisibility();
  }

  manageBossFrameVisibility()
  {
    if (this.isStillConcealing())
    {
      this.fadeOutWindow();
    }

    if (this.isStillRevealing())
    {
      this.fadeInWindow();
    }
  }

  /**
   * Fades out the boss frame window along with all sprites and content.
   */
  fadeOutWindow()
  {
    // perform original logic.
    this.contentsOpacity -= 10;
    this.j()._spriteCache.forEach((sprite, _) => sprite.opacity -= 10);

    // verify the opacities.
    const contentsOpacityZero = this.contentsOpacity <= 0;

    // determine if this frame is done concealing.
    const doneFading = (contentsOpacityZero);

    // check if we're done concealing.
    if (doneFading)
    {
      // end the concealment process.
      this.endConcealing();
    }
  }

  /**
   * Fades in the boss frame window along with all sprites and content.
   */
  fadeInWindow()
  {
    // perform original logic.
    this.contentsOpacity += 40;
    this.j()._spriteCache.forEach((sprite, _) => sprite.opacity += 40);

    // verify the opacities.
    const contentsOpacityMax = this.contentsOpacity >= 255;

    // determine if this frame is done revealing.
    const doneShowing = (contentsOpacityMax);

    // check if we're done revealing.
    if (doneShowing)
    {
      // end the revealment process.
      this.endRevealing();
    }
  }

  /**
   * Lays out the boss frame. Where the target frame runs its icons, level, and name along one row, the
   * boss frame centers its icons and name across the whole frame, rides the level small and centered along the
   * top directly above them, and centers its gauge beneath.<br/>
   * Everything below the level drops by one level row to make room for it.
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate.
   */
  drawContent(x, y)
  {
    // the level sits along the very top of the frame.
    this.drawTargetLevel(x, y);

    // the rest of the frame starts one level row lower, so it clears the level above it.
    const bodyY = y + this.bossLevelRowHeight();

    // draw the icons and name of the boss.
    this.drawTargetName(x, bodyY);

    // draw the extra data for the boss.
    this.drawTargetExtra(x, bodyY + 24);

    // the gauges are handed the unshifted x and y on purpose: their place comes from targetBattlerGaugesX and
    // targetBattlerGaugesY, which already center the gauge and allow for the level row, and the affliction
    // strip is placed from those same values.
    this.drawTargetBattlerInfo(x, y);
  }

  /**
   * Centers the boss's gauge across the frame, under the centered name.<br/>
   * The gauge is a child of the window rather than of its contents, so it centers on the window's own width.
   * The affliction strip starts from this same value, so it lines up under the gauge's left end.
   * @returns {number}
   */
  targetBattlerGaugesX()
  {
    return (this.width - Window_BossFrame.HpGaugeSize.width) / 2;
  }

  /**
   * How far below the top of the gauges the afflictions start.<br/>
   * The boss frame only ever draws its hp gauge, so the afflictions only have to clear it, and a small gap.
   * @returns {number}
   */
  targetGaugeStackHeight()
  {
    return Window_BossFrame.HpGaugeSize.height + 4;
  }

  /**
   * The vertical room reserved along the top of the frame for the level.<br/>
   * Nothing is reserved when there is no level to draw, so a frame without one keeps its name and
   * gauges where they would otherwise sit.
   * @returns {number}
   */
  bossLevelRowHeight()
  {
    // no level means no row to make room for.
    if (!this.canDrawTargetLevel()) return 0;

    // just enough to clear the small level text sitting above the name.
    return 16;
  }

  /**
   * Drops the gauges by the level row, so they stay below the name as it moves down to make room for
   * the level.<br/>
   * The affliction rows are positioned from this same value, which keeps them moving with the gauges.
   * @returns {number}
   */
  targetBattlerGaugesY()
  {
    // start from wherever the target frame would put the gauges.
    const baseGaugesY = super.targetBattlerGaugesY();

    // and push them down past the level row.
    return baseGaugesY + this.bossLevelRowHeight();
  }

  /**
   * Draws the target's name in the window.<br/>
   * A boss's name reads larger than a regular target's, and is centered across the frame- led by the same
   * icons the target frame leads its name with (the boss's own, then any an extension set), and in whatever
   * color the name hook settles on.
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate.
   */
  drawTargetName(x, y)
  {
    // the icons lead the name as icon codes, so the two are measured and centered together as one line.
    const iconCodes = this.targetRowIconIndices()
      .map(iconIndex => `\\I[${iconIndex}]`)
      .join(String.empty);

    // the boss name reads bigger than a regular target's.
    let name = `\\FS[24]${iconCodes}${this.targetName()}`;

    // and bold, when J-Message is around.
    if (J.MESSAGE)
    {
      name = `\\*${name}`;
    }

    // the name takes whatever color the name hook settles on.
    const color = this.targetNameColor();

    // center it across the frame.
    this.drawCenteredTextEx(name, y, color);
  }

  /**
   * Draws the level small and centered across the top of the frame, directly above the name.<br/>
   * On a frame this wide, anywhere measured from an edge would sit out under the rest of the HUD- so the
   * given x is not used here.
   * @param {string} levelString The level text, escape codes included.
   * @param {number} x The x coordinate; unused, since the level is centered.
   * @param {number} y The y coordinate.
   * @returns {number} The width the level took.
   */
  drawTargetLevelText(levelString, x, y)
  {
    // the level is drawn in whatever color the level hook settles on.
    const color = this.targetLevelColor();

    // center the level over the name.
    return this.drawCenteredTextEx(levelString, y, color);
  }

  /**
   * Draws a line of text centered across the frame, and reports how wide it drew.<br/>
   * Measures with {@link Window_Base#textSizeEx} rather than {@link Window_Base#textWidth}: the latter
   * measures the raw string, so escape codes like `\FS[24]` count as printed characters, and the extra
   * width drags the line left of center.
   * @param {string} text The text to draw, escape codes included.
   * @param {number} y The y coordinate.
   * @param {string} color The color the text starts in.
   * @returns {number}
   */
  drawCenteredTextEx(text, y, color)
  {
    // measure the text as it will actually render, with its escape codes applied rather than counted.
    const { width } = this.textSizeEx(text);

    // split the leftover space evenly on both sides.
    const centerX = (this.contentsWidth() - width) / 2;

    // draw it in its color, allowing exactly the width it needs.
    return this.drawTextExInColor(text, centerX, y, width, color);
  }

  /**
   * Draws the target's various gauges.
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate.
   */
  drawTargetBattlerGauges(x, y)
  {
    // draw all three of the primary gauges.
    this.drawTargetHpGauge(x, y);
  }
}

export default Window_BossFrame;
//endregion Window_BossFrame