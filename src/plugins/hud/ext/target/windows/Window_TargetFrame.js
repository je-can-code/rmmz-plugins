//region Window_TargetFrame
/**
 * A window that displays a target and their relevant information.
 */
class Window_TargetFrame
  extends Window_Base
{
  /**
   * The maximum possible duration in frames.
   * @type {number}
   */
  static MaxDuration = 180;

  /**
   * The size of each of the frame's gauges, in pixels. Each gauge's bar fills its whole bitmap, so the height is
   * both.
   * @type {{hp: {width: number, height: number}, mp: {width: number, height: number},
   * tp: {width: number, height: number}}}
   */
  static GaugeSizes = {
    hp: { width: 200, height: 12 },
    mp: { width: 200, height: 6 },
    tp: { width: 30, height: 6 },
  };

  /**
   * Constructor.
   * @param {Rectangle} rect The shape of this window.
   */
  constructor(rect)
  {
    super(rect);
  }

  /**
   * Initializes the properties of this class.
   * @param {Rectangle} rect The rectangle representing this window.
   */
  initialize(rect)
  {
    // perform original logic.
    super.initialize(rect);

    // add our extra data points to track.
    this.initMembers();

    // run any one-time configuration changes.
    this.configure();
  }

  /**
   * Initializes all members of this class.
   */
  initMembers()
  {
    /**
     * The over-arching object that contains all properties for this plugin.
     */
    this._j ||= {};

    /**
     * The cached collection of sprites.
     * @type {Map<string, Sprite_Icon|Sprite>}
     */
    this._j._spriteCache = new Map();

    /**
     * The name to display in the name field.
     *
     * NOTE:
     * This is separated out from the battler data itself so that it can be
     * separately assigned to something different if the dev wanted to.
     * @type {string}
     */
    this._j._name = String.empty;

    /**
     * When set, {@link #drawTargetName} tints the line with this `#RRGGBB` before `drawTextEx`.
     * Populated when a passive extension is active and supplies a name color for the target.
     * @type {string|String.empty}
     */
    this._j._nameColorHex = String.empty;

    /**
     * The second line associated with the target.
     * Optional.
     * @type {string}
     */
    this._j._text = String.empty;

    /**
     * The icon that this target has.
     * @type {number}
     */
    this._j._icon = 0;

    /**
     * Icons an extension placed ahead of the target's name, drawn after the target's own icon.
     * @type {number[]}
     */
    this._j._nameIconIndices = [];

    /**
     * The battler of the target.
     * @type {Game_Actor|Game_Enemy}
     */
    this._j._battler = null;

    /**
     * Whether or not this window requires a target update.
     * @type {boolean}
     */
    this._j._requestTargetRefresh = true;

    /**
     * The duration until this window is deemed inactive.
     * @type {number}
     */
    this._j._inactivityTimer = 0;
  }

  //region properties
  /**
   * Gets the j.
   * @returns {{_spriteCache: Map<string, Sprite>, _name: string, _nameColorHex: string, _text: string,
   * _icon: number, _nameIconIndices: number[], _battler: Game_Battler|null, _requestTargetRefresh: boolean,
   * _inactivityTimer: number}} The j.
   */
  j()
  {
    // hand back the j.
    return this._j;
  }
  //endregion properties

  /**
   * Executes any one-time configuration required for this window.
   */
  configure()
  {
    // make the window's background opacity transparent.
    this.opacity = 0;

    // build the image cache for the first time.
    this.refreshCache();
  }

  //region caching
  /**
   * Empties and recreates the entire cache of sprites.
   */
  refreshCache()
  {
    // destroy and empty all sprites within the cache.
    this.emptyCache();

    // recreate all sprites for the cache.
    this.createCache();
  }

  /**
   * Empties the cache of all sprites.
   */
  emptyCache()
  {
    // iterate over each sprite and destroy it properly.
    this.j()._spriteCache.forEach((value, _) => value.destroy());

    // empty the collection of all references.
    this.j()._spriteCache.clear();
  }

  /**
   * Ensures all sprites are created and available for use.
   */
  createCache()
  {
    // cache the target hp gauge.
    this.getOrCreateTargetHpGaugeSprite();

    // cache the target mp gauge.
    this.getOrCreateTargetMpGaugeSprite();

    // cache the target tp gauge.
    this.getOrCreateTargetTpGaugeSprite();
  }

  /**
   * Creates the target's hp gauge sprite for this window and caches it.
   * @returns {Sprite_MapGauge} The gauge sprite of the target.
   */
  getOrCreateTargetHpGaugeSprite()
  {
    return this.getOrCreateGaugeSprite('targetframe-enemy-hp-gauge', Window_TargetFrame.GaugeSizes.hp);
  }

  /**
   * Creates the target's mp gauge sprite for this window and caches it.
   * @returns {Sprite_MapGauge} The gauge sprite of the target.
   */
  getOrCreateTargetMpGaugeSprite()
  {
    return this.getOrCreateGaugeSprite('targetframe-enemy-mp-gauge', Window_TargetFrame.GaugeSizes.mp);
  }

  /**
   * Creates the target's tp gauge sprite for this window and caches it.<br/>
   * The tp gauge stands on end beside the others, turned however far the plugin settings say.
   * @returns {Sprite_MapGauge} The gauge sprite of the target.
   */
  getOrCreateTargetTpGaugeSprite()
  {
    // grab the gauge, making it if this is the first time.
    const sprite = this.getOrCreateGaugeSprite('targetframe-enemy-tp-gauge', Window_TargetFrame.GaugeSizes.tp);

    // turn it on its end.
    sprite.rotation = J.HUD.EXT.TARGET.Metadata.TpGaugeRotation * (Math.PI / 180);

    // return the gauge.
    return sprite;
  }

  /**
   * Creates a gauge sprite of the given size for this window and caches it under the given key- or hands back
   * the one already cached there.
   * @param {string} key The key the gauge is cached under.
   * @param {{width: number, height: number}} size The size of the gauge, in pixels.
   * @returns {Sprite_MapGauge}
   */
  getOrCreateGaugeSprite(key, size)
  {
    // check if the key already maps to a cached sprite.
    if (this.j()._spriteCache.has(key))
    {
      // if it does, just return that.
      return this.j()._spriteCache.get(key);
    }

    // create a new gauge at the given size- its bitmap and its bar the same height, so the bar fills it.
    const { width, height } = size;
    const sprite = new Sprite_MapGauge(width, height, height);

    // cache the sprite.
    this.j()._spriteCache.set(key, sprite);

    // hide the sprite for now.
    sprite.hide();

    // add the sprite to tracking.
    this.addChild(sprite);

    // return the created sprite.
    return sprite;
  }

  //endregion caching

  /**
   * Sets the target that this window should be tracking.
   * @param {FramedTarget} target The name of the target.
   */
  setTarget(target)
  {
    // assign the newly provided data.
    this.j()._name = target.name;
    this.j()._nameColorHex = target.nameColorHex;
    this.j()._text = target.text;
    this.j()._icon = target.icon;
    this.j()._nameIconIndices = target.nameIconIndices;
    this.j()._battler = target.battler;
    this.j()._configuration = target.configuration;

    // refresh the contents of the window to reflect the changes.
    this.refresh();
  }

  /**
   * Sets whether or not this window needs to refresh its target.
   */
  requestTargetRefresh()
  {
    this.j()._requestTargetRefresh = true;
  }

  /**
   * Gets whether or not this window needs to refresh its target.
   * @returns {boolean}
   */
  hasRequestTargetRefresh()
  {
    return this.j()._requestTargetRefresh;
  }

  /**
   * Acknowledges the request to refresh the target of this window.
   */
  acknowledgeTargetRefresh()
  {
    this.j()._requestTargetRefresh = false;
  }

  /**
   * Gets the name of the current target of this window.
   * @returns {string}
   */
  targetName()
  {
    return this.j()._name;
  }

  /**
   * Gets the extra line of information for the current target of this window.
   * @returns {string|String.empty}
   */
  targetText()
  {
    return this.j()._text;
  }

  /**
   * Gets the icon of the current target of this window.
   * @returns {number}
   */
  targetIcon()
  {
    return this.j()._icon;
  }

  /**
   * Gets the icons an extension placed ahead of the current target's name.
   * @returns {number[]}
   */
  targetNameIconIndices()
  {
    return this.j()._nameIconIndices;
  }

  /**
   * Gets the configuration of the current target.
   * @returns {FramedTargetConfiguration|null}
   */
  targetConfiguration()
  {
    return this.j()._configuration;
  }

  /**
   * Refreshes the contents of this window.
   */
  refresh()
  {
    // clear out the window contents.
    this.contents.clear();

    // reset the timer for fading.
    this.resetInactivityTimer();

    // request a refresh of the target of this window.
    this.requestTargetRefresh();

    // rebuilds the contents of the window.
    this.updateTarget();
  }

  /**
   * Resets the inactivity timer back to max.
   */
  resetInactivityTimer()
  {
    this.j()._inactivityTimer = Window_TargetFrame.MaxDuration;
  }

  /**
   * Hooks into the update cycle for updating this window.
   */
  update()
  {
    // perform original logic.
    super.update();

    // update the window logic.
    this.updateTarget();

    // fade toward or away from the player standing on top of this frame. this rides on top of the
    // inactivity fade rather than competing with it- that one owns opacity, this one owns alpha.
    this.alpha = HudInterferenceResolver.nextFrameAlpha(this);
  }

  /**
   * Updates the target of this window as-necessary.
   */
  updateTarget()
  {
    // check if we have a request to refresh this target frame inactivity timer.
    if ($hudManager.hasRequestTargetFrameRefreshInactivityTimer())
    {
      // reset it if we do.
      this.resetInactivityTimer();

      // acknowledge the request.
      $hudManager.acknowledgeTargetFrameInactivityTimerRefresh();
    }

    // manage inactivity timers and visibility.
    this.handleInactivity();

    // check if the target this window is tracking needs updating.
    if (this.needsTargetUpdate())
    {
      // determine base coordinates.
      const x = 0;
      const y = 0;

      // draw the target data.
      this.drawContent(x, y);

      // acknowledge the request to refresh the target.
      this.acknowledgeTargetRefresh();
    }
  }

  /**
   * Max width for subtext lines that span the window body.
   * @returns {number}
   */
  targetFrameBodyTextWidth()
  {
    return Math.max(200, this.contentsWidth() - 8);
  }

  /**
   * Lays out the target frame, top to bottom: a name row of icons, level, and name; the target's extra
   * text beneath that, when it has any; then the gauges.
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate.
   */
  drawContent(x, y)
  {
    // draw the icons, level, and name of the target along one row.
    this.drawTargetNameRow(x, y);

    // draw the extra data for the target.
    this.drawTargetExtra(x, y + 24);

    // draw the battler data of the target- if available.
    this.drawTargetBattlerInfo(x, y);
  }

  /**
   * Draws the name row: the target's icons, then its level, then its name, left to right.<br/>
   * Each piece is drawn on its own, so each keeps its own size and color, and each is centered on the
   * name's line- the name being the tallest thing on it.
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate.
   */
  drawTargetNameRow(x, y)
  {
    // the icons lead the row.
    const iconsWidth = this.drawTargetRowIcons(x, y);

    // the level follows the icons. Its small font sits on a line 10px shorter than the name's, so it drops
    // by half that to center on the name.
    const levelX = x + iconsWidth;
    const levelWidth = this.drawTargetLevel(levelX, y + 5);

    // the name follows the level, after a small gap- when there was a level to follow.
    const levelSpan = levelWidth > 0
      ? levelWidth + 6
      : 0;

    // draw the name of the target.
    this.drawTargetName(levelX + levelSpan, y);
  }

  /**
   * Draws the icons that lead the name row: the target's own icon, then any an extension set ahead of
   * its name.
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate of the row.
   * @returns {number} The width the icons took, including the gap after them; 0 when there were none.
   */
  drawTargetRowIcons(x, y)
  {
    // grab every icon the row leads with.
    const iconIndices = this.targetRowIconIndices();

    // no icons take no room.
    if (iconIndices.length === 0) return 0;

    // the icons are a touch shorter than the name's line, so they drop a pixel to center on it.
    const iconY = y + 1;

    // each icon sits one icon's width, and a sliver, past the last.
    const pitch = ImageManager.iconWidth + 2;

    // draw them left to right.
    iconIndices.forEach((iconIndex, index) =>
    {
      this.drawIcon(iconIndex, x + (index * pitch), iconY);
    });

    // the row carries on after the last icon and a small gap.
    return (iconIndices.length * pitch) + 4;
  }

  /**
   * The icon indices that lead the name row, in the order they are drawn.
   * @returns {number[]}
   */
  targetRowIconIndices()
  {
    // the target's own icon leads, when it has one.
    const ownIcons = this.hasTargetIcon()
      ? [ this.targetIcon() ]
      : [];

    // then come any icons an extension set ahead of the name.
    return [ ...ownIcons, ...this.targetNameIconIndices() ];
  }

  /**
   * Handles inactivity of this window.
   * Counts down the inactivity timer and manages visibility as-necessary.
   */
  handleInactivity()
  {
    // countdown the timer.
    this.j()._inactivityTimer--;

    // check if we have <1 second left before this goes inactive.
    if (this.j()._inactivityTimer < 60)
    {
      this.fadeOutWindow();
    }
    else
    {
      this.fadeInWindow();
    }
  }

  /**
   * Fades out the target frame's contents and sprites.<br/>
   * The frame floats over the map with no window drawn behind it, so there is no window frame or background
   * to fade- {@link #configure} hid those for good.
   */
  fadeOutWindow()
  {
    this.contentsOpacity -= 10;
    this.j()._spriteCache.forEach((sprite, _) => sprite.opacity -= 10);
  }

  /**
   * Fades in the target frame's contents and sprites.<br/>
   * Only those two- the window frame and background stay hidden, so the frame keeps floating.
   */
  fadeInWindow()
  {
    this.contentsOpacity += 40;
    this.j()._spriteCache.forEach((sprite, _) => sprite.opacity += 40);
  }

  /**
   * Determines whether or not the target data should be updated.
   * @returns {boolean} True if it needs an update, false otherwise.
   */
  needsTargetUpdate()
  {
    if (!this.hasRequestTargetRefresh()) return false;

    return true;
  }

  /**
   * Draws the target's name in the window.
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate.
   */
  drawTargetName(x, y)
  {
    let name = `\\FS[24]${this.targetName()}`;
    if (J.MESSAGE)
    {
      name = `\\*${name}`;
    }

    // the name takes whatever color the name hook settles on.
    const color = this.targetNameColor();

    // the name has the rest of the row to itself.
    const width = this.contentsWidth() - x;

    // draw the name in its color.
    this.drawTextExInColor(name, x, y, width, color);
  }

  /**
   * The color the target's name is drawn in.<br/>
   * The color an extension asked for on the framed target, when it asked for one- J-Passive-Affix asks for a
   * tier's color- and the normal text color otherwise.
   * @returns {string}
   */
  targetNameColor()
  {
    // an extension may have asked for the name in a color of its own.
    const hex = this.j()._nameColorHex;
    if (hex !== String.empty) return hex;

    // otherwise the name reads in the normal text color.
    return ColorManager.normalColor();
  }

  /**
   * Draws text-coded text starting in the given color, and reports how wide it drew.<br/>
   * {@link Window_Base#drawTextEx} opens by resetting the font, and that reset returns the text color to
   * normal- so a color set before calling it never survives into the draw. This takes the same steps with
   * the color applied after the reset instead.
   * @param {string} text The text to draw, escape codes included.
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate.
   * @param {number} width The width the text may take.
   * @param {string} color The color the text starts in.
   * @returns {number}
   */
  drawTextExInColor(text, x, y, width, color)
  {
    // start from the default font, as drawTextEx would.
    this.resetFontSettings();

    // then apply the color that reset would otherwise have wiped.
    this.changeTextColor(color);

    // lay the text out and draw it.
    const textState = this.createTextState(text, x, y, width);
    this.processAllText(textState);

    // leave the color as the next draw expects to find it.
    this.resetTextColor();

    // report how much room the text took.
    return textState.outputWidth;
  }

  /**
   * Draws the target's level in the window.
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate.
   * @returns {number} The width the level took; 0 when there was no level to draw.
   */
  drawTargetLevel(x, y)
  {
    // don't draw level if we can't.
    if (!this.canDrawTargetLevel()) return 0;

    // get the level from the battler.
    const { level } = this.j()._battler;

    // an unleveled target has no level to show.
    if (!level) return 0;

    // build the level string.
    const levelString = `\\FS[14]Lv.${level.padZero(3)}`;

    // and draw it wherever this frame places its level.
    return this.drawTargetLevelText(levelString, x, y);
  }

  /**
   * Draws the already-built level string at the given spot, in the level's color.<br/>
   * Kept apart from {@link #drawTargetLevel} so a frame with a different layout can decide where the
   * level goes without re-deciding whether there is a level to draw at all.
   * @param {string} levelString The level text, escape codes included.
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate.
   * @returns {number} The width the level took.
   */
  drawTargetLevelText(levelString, x, y)
  {
    // the level is drawn in whatever color the level hook settles on.
    const color = this.targetLevelColor();

    // it may run to the end of the row.
    const width = this.contentsWidth() - x;

    // draw it, reporting how much of the row it took.
    return this.drawTextExInColor(levelString, x, y, width, color);
  }

  /**
   * The color the target's level is drawn in.<br/>
   * The normal text color by default. This is the hook for extensions that have something to say about a
   * level- J-Level-Sync marks a synced level in its own color- so they can color the level without building
   * or drawing it themselves.
   * @returns {string}
   */
  targetLevelColor()
  {
    return ColorManager.normalColor();
  }

  /**
   * Determines whether or not we can draw the level of the target.
   * @returns {boolean} True if we can draw levels, false otherwise.
   */
  canDrawTargetLevel()
  {
    // if we don't have our level system, then don't draw levels.
    if (!J.LEVEL) return false;

    // if we don't have a battler as the target, then don't draw levels.
    if (!this.j()._battler) return false;

    // draw levels!
    return true;
  }

  /**
   * Draws the target's extra information in the window.
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate.
   */
  drawTargetExtra(x, y)
  {
    // if there is no text to draw, don't try to draw it.
    if (!this.hasTargetText()) return;

    // draw the extra text.
    this.drawTextEx(`\\FS[14]${this.targetText()}`, x, y, this.targetFrameBodyTextWidth());
  }

  /**
   * Determine whether or not we have extra text to draw for the current target.
   * @returns {boolean}
   */
  hasTargetText()
  {
    // if we have an empty string for the text, then lets not draw it.
    if (!this.targetText()) return false;

    // return the truth.
    return true;
  }

  /**
   * Determines whether or not we have an icon to draw for the current target.
   * @returns {boolean}
   */
  hasTargetIcon()
  {
    // if we have 0 icon index, then lets not draw one.
    if (!this.targetIcon()) return false;

    // return the truth.
    return true;
  }

  /**
   * Draws the target's battler data- if present- in the window.
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate.
   */
  drawTargetBattlerInfo(x, y)
  {
    // validate that we have a battler to draw data for.
    if (this.j()._battler)
    {
      // determine the corrected X coordinate.
      const currentX = x + this.targetBattlerGaugesX();

      // determine the corrected Y coordinate.
      const currentY = y + this.targetBattlerGaugesY();

      // draw the gauges at the desginated coordinates.
      this.drawTargetBattlerGauges(currentX, currentY);
    }
    // if we do not have a battler, then hide everything.
    else
    {
      // clear/hide the gauge data.
      this.j()._spriteCache.forEach(value => value.hide());
    }
  }

  /**
   * Calculate the X coordinate for gauges.<br/>
   * The gauges are children of the window rather than of its contents, and the contents start the window's
   * padding in from its edge- so shifting by the padding is what lines the gauges up with the name row.
   * @returns {number}
   */
  targetBattlerGaugesX()
  {
    return this.padding;
  }

  /**
   * Calculate the Y coordinate for gauges.
   * @returns {number}
   */
  targetBattlerGaugesY()
  {
    // if this target had extra text, then move the gauges down
    if (this.hasTargetText())
    {
      // move it down a bit more than usual.
      return 64;
    }

    // don't move it down as much..
    return 44;
  }

  /**
   * How far below the top of the gauges the afflictions start.<br/>
   * The mp gauge hangs beneath the hp gauge when it is shown, so the gauges run deeper with it than without.
   * @returns {number}
   */
  targetGaugeStackHeight()
  {
    // grab the sizes of the gauges stacked under the name.
    const { hp, mp } = Window_TargetFrame.GaugeSizes;

    // the afflictions have to clear the mp gauge too, when it is there: the hp gauge, a sliver, the mp gauge,
    // and a small gap.
    if (this.targetConfiguration().showMp) return hp.height + 2 + mp.height + 4;

    // otherwise there is only the hp gauge to clear, and the same small gap.
    return hp.height + 4;
  }

  /**
   * Draws the target's various gauges.
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate.
   */
  drawTargetBattlerGauges(x, y)
  {
    // the mp gauge sits a sliver below the hp gauge.
    const mpY = y + Window_TargetFrame.GaugeSizes.hp.height + 2;

    // draw all three of the primary gauges.
    this.drawTargetHpGauge(x, y);
    this.drawTargetMpGauge(x, mpY);
    this.drawTargetTpGauge(x - 10, y + 32);
  }

  /**
   * Draws the hp gauge of the target.
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate.
   */
  drawTargetHpGauge(x, y)
  {
    // grab the gauge, and whether the target shows it.
    const gauge = this.getOrCreateTargetHpGaugeSprite();
    const { showHp } = this.targetConfiguration();

    // put it in place.
    this.placeTargetGauge(gauge, 'hp', showHp, x, y);
  }

  /**
   * Draws the mp gauge of the target.
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate.
   */
  drawTargetMpGauge(x, y)
  {
    // grab the gauge, and whether the target shows it.
    const gauge = this.getOrCreateTargetMpGaugeSprite();
    const { showMp } = this.targetConfiguration();

    // put it in place.
    this.placeTargetGauge(gauge, 'mp', showMp, x, y);
  }

  /**
   * Draws the tp gauge of the target.
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate.
   */
  drawTargetTpGauge(x, y)
  {
    // grab the gauge, and whether the target shows it.
    const gauge = this.getOrCreateTargetTpGaugeSprite();
    const { showTp } = this.targetConfiguration();

    // put it in place.
    this.placeTargetGauge(gauge, 'tp', showTp, x, y);
  }

  /**
   * Points one of the target's gauges at the framed battler and puts it on screen- or hides it, when the target
   * does not show that gauge.<br/>
   * A map gauge that has been hidden also stops updating, and showing it again does not start it back up, so
   * both happen here explicitly. Without that, the gauge would draw once and then freeze.
   * @param {Sprite_MapGauge} gauge The gauge to place.
   * @param {string} statusType The resource the gauge shows, such as "hp".
   * @param {boolean} isShown Whether the target shows this gauge at all.
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate.
   */
  placeTargetGauge(gauge, statusType, isShown, x, y)
  {
    // a gauge the target doesn't show stays hidden.
    if (!isShown)
    {
      gauge.hide();
      return;
    }

    // point the gauge at the framed battler.
    gauge.setup(this.j()._battler, statusType);

    // put it on screen, and let it update.
    gauge.show();
    gauge.activateGauge();

    // relocate the gauge sprite.
    gauge.move(x, y);
  }
}

export default Window_TargetFrame;
//endregion Window_TargetFrame