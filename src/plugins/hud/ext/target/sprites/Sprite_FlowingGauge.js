// TODO: move this to J-Base.
//region Sprite_FlowingGauge
/**
 * A gauge that acts like a regular `Sprite_Gauge` that is instead based
 * on images and also "flows".
 */
class Sprite_FlowingGauge
  extends Sprite
{
  //region properties
  static Types = {
    HP: "hp",
    MP: "mp",
    TP: "tp",
  };

  /**
   * The bitmap for the background sprite.
   * @type {Bitmap|null}
   * @private
   */
  _backgroundBitmap = null;

  /**
   * The sprite background of this gauge.
   * @type {Sprite}
   */
  _gaugeBackground = null;

  /**
   * The bitmap of the file that makes up this gauge.
   * It is expected to be a pair of horizontal gauges equal in height.
   * @type {Bitmap|null}
   */
  _gaugeBitmap = null;

  /**
   * The sprite representing the "current" value of this gauge.
   * It slides gradually over a couple seconds to the target value.
   * @type {Sprite}
   */
  _gaugeCurrentSprite = null;

  /**
   * The sprite representing the "actual" value of this gauge.
   * It does not slide, it is instantly changed.
   * @type {Sprite}
   */
  _gaugeActualSprite = null;

  /**
   * The battler this gauge is representing when in use.
   * @type {Game_Enemy|null}
   */
  _battler = null;

  /**
   * The "current" value of the gauge in numeric form.
   * @type {number}
   */
  _gaugeCurrent = 0;

  /**
   * The "target" value of the gauge in numeric form.
   * @type {number}
   */
  _gaugeTarget = 0;

  /**
   * The "max" value of the gauge in numeric form.
   * @type {number}
   */
  _gaugeMax = 0;

  /**
   * The type of gauge this is, such as HP, MP, or TP.
   * @type {Sprite_FlowingGauge.Types}
   */
  _gaugeType = String.empty;

  /**
   * Whether or not this gauge is setup and ready to be drawn.
   * @type {boolean}
   */
  _isReady = false;

  /**
   * Left edge (in texture pixels) of the painted fill inside one gauge slice.
   * @type {number}
   */
  _gaugeSliceFillMinX = 0;

  /**
   * Width (in texture pixels) of the painted fill inside one gauge slice.
   * @type {number}
   */
  _gaugeSliceFillInnerWidth = 0;

  /**
   * Left edge (in texture pixels) of the background track interior.
   * @type {number}
   */
  _gaugeBackgroundTrackMinX = 0;

  /**
   * Width (in texture pixels) of the background track interior.
   * @type {number}
   */
  _gaugeBackgroundTrackInnerWidth = 0;

  //endregion properties

  /**
   * Initializes all properties of this class.
   */
  initialize(bitmap)
  {
    // perform original logic; we don't need the underlying sprite to have a bitmap.
    super.initialize(bitmap);

    // initialize the gauge sprites from file.
    this.initializeGauges();
  }

  /**
   * Initializes the gauges based on bitmaps loaded from file.
   */
  initializeGauges()
  {
    // reset all gauges to baseline/defaults.
    this.resetValues();

    // establish a promise for loading the gauge background into memory.
    const backgroundFilename = this.extractFileName(J.HUD.EXT.TARGET.Metadata.BackgroundFilename);
    const backgroundPromise = ImageManager.loadHudBitmap(backgroundFilename);

    // manage the completion and error handling of the bitmap loading.
    backgroundPromise
      .then(bitmap => this.setBackgroundBitmap(bitmap))
      .catch(() =>
      {
        throw new Error('background bitmap failed to load.');
      });

    // establish a promise for loading the gauge foreground into memory.
    const foregroundFilename = this.extractFileName(J.HUD.EXT.TARGET.Metadata.ForegroundFilename);
    const foregroundPromise = ImageManager.loadHudBitmap(foregroundFilename);

    // manage the completion and error handling of the bitmap loading.
    foregroundPromise
      .then(bitmap => this.setForegroundBitmap(bitmap))
      .catch(() =>
      {
        throw new Error('background bitmap failed to load.');
      });

    // when both back and foreground are done loading, let this gauge know we're ready.
    Promise
      .all([ backgroundPromise, foregroundPromise ])
      .then(() => this.onReady());
  }

  /**
   * Extracts the filename out of the extended path.
   * @param {string} longFileName The filename with the path in it.
   * @returns {string} Just the filename.
   */
  extractFileName(longFileName)
  {
    // get the character after the last slash.
    const lastSlash = longFileName.lastIndexOf('/') + 1;

    // return only the filename.
    return longFileName.substring(lastSlash);
  }

  /**
   * Sets the background bitmap to the given value.
   * @param {Bitmap} bitmap The bitmap to set to the background.
   */
  setBackgroundBitmap(bitmap)
  {
    // assign the bitmap for re-use.
    this._backgroundBitmap = bitmap;
  }

  /**
   * Sets the foreground bitmap to the given value.
   * @param {Bitmap} bitmap The bitmap to set to the foreground.
   */
  setForegroundBitmap(bitmap)
  {
    // assign the bitmap for re-use.
    this._gaugeBitmap = bitmap;
  }

  /**
   * Creates gauge's background sprite.
   */
  createGaugeBackground()
  {
    // establish the new sprite based on the given bitmap.
    this._gaugeBackground = new Sprite(this._backgroundBitmap);
    this._gaugeBackground.x = J.HUD.EXT.TARGET.Metadata.BackgroundGaugeImageX;
    this._gaugeBackground.y = J.HUD.EXT.TARGET.Metadata.BackgroundGaugeImageY;
    this.addChild(this._gaugeBackground);
  }

  /**
   * Creates gauge's foreground sprite.
   */
  createGaugeForeground()
  {
    // generate the middleground of the gauge.
    this._gaugeCurrentSprite = new Sprite(this._gaugeBitmap);
    this._gaugeCurrentSprite.x = J.HUD.EXT.TARGET.Metadata.MiddlegroundGaugeImageX;
    this._gaugeCurrentSprite.y = J.HUD.EXT.TARGET.Metadata.MiddlegroundGaugeImageY;
    this.addChild(this._gaugeCurrentSprite);

    // generate the foreground of the gauge
    this._gaugeActualSprite = new Sprite(this._gaugeBitmap);
    this._gaugeActualSprite.x = J.HUD.EXT.TARGET.Metadata.ForegroundGaugeImageX;
    this._gaugeActualSprite.y = J.HUD.EXT.TARGET.Metadata.ForegroundGaugeImageY;
    this.addChild(this._gaugeActualSprite);
  }

  /**
   * Resets all gauge values to 0.
   */
  resetValues()
  {
    this._gaugeCurrent = 0;
    this._gaugeTarget = 0;
    this._gaugeMax = 0;
  }

  /**
   * Clears the battler of this gauge.
   */
  clearBattler()
  {
    this._battler = null;
  }

  /**
   * The "current" value of the gauge.
   * This is spends a lot of time in flux due to gradual change for visual enjoyment.
   * If you need the real current value, use `.target()`.
   * @returns {number}
   */
  current()
  {
    return this._gaugeCurrent;
  }

  /**
   * The "target" value of the gauge.
   * This is what the "current" is striving to reach.
   * @returns {number}
   */
  target()
  {
    if (this._battler)
    {
      return this.#targetByType();
    }
    else
    {
      return 0;
    }
  }

  /**
   * Gets the target value for this gauge by its gauge type.
   * @returns {number}
   */
  #targetByType()
  {
    switch (this._gaugeType)
    {
      case Sprite_FlowingGauge.Types.HP:
        return this._battler.hp;
      case Sprite_FlowingGauge.Types.MP:
        return this._battler.mp;
      case Sprite_FlowingGauge.Types.TP:
        return this._battler.tp;
      default:
        return 0;
    }
  }

  /**
   * The "max" value of the gauge.
   * This is simply the maximum amount that the gauge represents when full.
   * @returns {number}
   */
  max()
  {
    if (this._battler)
    {
      return this.#maxByType();
    }
    else
    {
      return 0;
    }
  }

  /**
   * Gets the max value for this gauge by its gauge type.
   * @returns {number}
   */
  #maxByType()
  {
    switch (this._gaugeType)
    {
      case Sprite_FlowingGauge.Types.HP:
        return this._battler.mhp;
      case Sprite_FlowingGauge.Types.MP:
        return this._battler.mmp;
      case Sprite_FlowingGauge.Types.TP:
        return this._battler.maxTp();
      default:
        return 0;
    }
  }

  /**
   * Sets up this gauge with the given enemy battler.
   * @param {Game_Enemy} battler The enemy battler.
   * @param {Sprite_FlowingGauge.Types} gaugeType The type of gauge this is.
   */
  setup(battler, gaugeType = Sprite_FlowingGauge.Types.HP)
  {
    // assign the battler.
    this._battler = battler;

    // assign the gauge type and setup accordingly.
    this._gaugeType = gaugeType;
    this.setupGaugeByType();

    // show the gauge when it is setup for battle.
    this.show();
  }

  /**
   * Sets up the gauge based on the gauge type.
   */
  setupGaugeByType()
  {
    this._gaugeCurrentSprite.setColorTone(this.greyTone());

    switch (this._gaugeType)
    {
      case Sprite_FlowingGauge.Types.HP:
        this.setupGaugeAsHp();
        break;
      case Sprite_FlowingGauge.Types.MP:
        this.setupGaugeAsMp();
        break;
      case Sprite_FlowingGauge.Types.TP:
        this.setupGaugeAsTp();
        break;
    }
  }

  /**
   * Sets up the gauge as an hp gauge.
   */
  setupGaugeAsHp()
  {
    this._gaugeCurrent = this._battler.hp;
    this._gaugeTarget = this._battler.hp;
    this._gaugeMax = this._battler.mhp;
    this._gaugeActualSprite.setHue(this.hpGaugeHue());
  }

  hpGaugeHue()
  {
    return 0;
  }

  /**
   * Sets up the gauge as an mp gauge.
   */
  setupGaugeAsMp()
  {
    this._gaugeCurrent = this._battler.mp;
    this._gaugeTarget = this._battler.mp;
    this._gaugeMax = this._battler.mmp;
    this._gaugeActualSprite.setHue(this.mpGaugeHue());
  }

  mpGaugeHue()
  {
    return -180;
  }

  /**
   * Sets up the gauge as a tp gauge.
   */
  setupGaugeAsTp()
  {
    this._gaugeCurrent = this._battler.tp;
    this._gaugeTarget = this._battler.tp;
    this._gaugeMax = this._battler.maxTp();
    this._gaugeActualSprite.setHue(this.tpGaugeHue());
  }

  tpGaugeHue()
  {
    return 80;
  }

  /**
   * Refresh this gauge by redrawing it.
   */
  refresh()
  {
    this.drawGauge();
  }

  /**
   * The update loop of this gauge.
   */
  update()
  {
    // perform original logic.
    super.update();

    if (!this.isReady()) return;

    // update the current value for this.
    this.updateCurrent();

    // update the visual flow.
    this.updateFlow();

    // redraw the gauge.
    this.drawGauge();
  }

  /**
   * Checks if this gauge is ready for drawing.
   * If it is not, then updating will not take place.
   * @returns {boolean} True if this gauge is ready, false otherwise.
   */
  isReady()
  {
    // if we are already ready, then just carry on.
    return this._isReady;
  }

  /**
   * Executes one-time actions once the gauge is ready.
   */
  onReady()
  {
    // create the background of the gauge.
    this.createGaugeBackground();

    // create the foreground of the gauge ("two" bars).
    this.createGaugeForeground();

    // measure the real track vs fill extents so scaled gauges don't gap or spill past the frame art.
    this.measureGaugeArtExtents();

    // snap the bar sprites to the background track using those measurements.
    this.alignGaugeForegroundToBackgroundTrack();

    // update the flow now that we have all our gauges.
    this.updateFlowMax();

    // and now we are ready to draw gauges.
    this._isReady = true;
  }

  /**
   * Updates the current and max values of the flow effect.
   */
  updateFlowMax()
  {
    // keep the flowing frame inside the bitmap slice while respecting the measured fill inset.
    const sliceW = this.gaugeWidth();
    const maxFlow = sliceW - this._gaugeSliceFillMinX - this._gaugeSliceFillInnerWidth;

    this._gaugeActualFlowLimit = Math.max(1, maxFlow);
    this._gaugeActualFlowCurrent = Math.floor(Math.random() * this._gaugeActualFlowLimit);
  }

  /**
   * Updates the current value of the fore-most gauge.
   * This is the background gauge that is a bit slower.
   */
  updateCurrent()
  {
    // if we have no battler, then don't update.
    if (!this.canUpdateCurrent()) return;

    // check if the target died.
    if (this.isHpGaugeEmpty())
    {
      // run on-defeat logic.
      this.onDefeat();
      return;
    }

    // check if there is a different between the current and target values.
    if (this.current() !== this.target())
    {
      // if something has changed, then update the current value.
      this.handleCurrentValueUpdate();
    }
    // if no difference, then it isn't changing.
    else
    {
      // handle what happens when the value isn't changing.
      this.handleCurrentValueUnchanged();
    }
  }

  /**
   * Handles the update to the "current" value while it is changing either up or down.
   */
  handleCurrentValueUpdate()
  {
    // calculate a rate of change for the gauge.
    const changeRate = this.changeRate();

    // check if the target amount is less than the current.
    if (this.target() < this.current())
    {
      this.processCurrentValueIncrease(changeRate);
    }
    // check if the target amount is greater than the current.
    else if (this.target() > this.current())
    {
      this.processCurrentValueDecrease(changeRate);
    }
  }

  /**
   * Processes the decrease of the current value and changes the tone.
   */
  processCurrentValueIncrease(changeRate)
  {
    // if so, reduce the current by the change rate until we hit the target.
    this._gaugeCurrent -= changeRate;

    // check to make sure we didn't pass the target with the incremental change rate.
    if (this.current() < this.target())
    {
      // if we did, just re-assign that.
      this._gaugeCurrent = this._gaugeTarget;
    }

    // if the gauge is going down, set the tone to be red.
    this._gaugeCurrentSprite.setColorTone(this.downTone());
  }

  /**
   * Processes the increase of the current value and changes the tone.
   */
  processCurrentValueDecrease(changeRate)
  {
    // if so, increase the current by the change rate until we hit the target.
    this._gaugeCurrent += changeRate;

    // check to make sure we didn't pass the target with the incremental change rate.
    if (this.current() > this.target())
    {
      // if we did, just re-assign that.
      this._gaugeCurrent = this._gaugeTarget;
    }

    // if the gauge is going up, set the tone to be green.
    this._gaugeCurrentSprite.setColorTone(this.upTone());
  }

  /**
   * Handles the update to the "current" value while it is unchanging.
   */
  handleCurrentValueUnchanged()
  {
    // if the gauge isn't going anywhere, then set it to grey.
    this._gaugeCurrentSprite.setColorTone(this.greyTone());
  }

  /**
   * Whether or not we can update the
   * @returns {boolean}
   */
  canUpdateCurrent()
  {
    if (!this._battler) return false;

    return true;
  }

  /**
   * Whether or not this HP gauge is empty.
   * Not applicable to non-HP gauges.
   * @returns {boolean} True if the HP gauge target is 0, false if not HP gauge or not 0.
   */
  isHpGaugeEmpty()
  {
    if (this._gaugeType !== Sprite_FlowingGauge.Types.HP) return false;

    if (this.target() !== 0) return false;

    return true;
  }

  /**
   * Logic to execute when this target is defeated.
   */
  onDefeat()
  {
    // remove the battler from tracking.
    this.clearBattler();

    // reset the gauge values.
    this.resetValues();
  }

  /**
   * The hue to alter the image by when the middleground gauge is going up.
   * The gauge goes up when you're healing, so this defaults to green.
   * @returns {[number, number, number, number]} The color tone: [red, green, blue, grey].
   */
  upTone()
  {
    // [red, green, blue, grey].
    return [ 0, 255, 0, 128 ];
  }

  /**
   * The hue to alter the image by when the middleground gauge is going down.
   * @returns {[number, number, number, number]} The color tone: [red, green, blue, grey].
   */
  downTone()
  {
    // [red, green, blue, grey].
    return [ 255, 0, 0, 0 ];
  }

  /**
   * The color tone to turn the sprite greyscale.
   * @returns {[number, number, number, number]} The color tone: [red, green, blue, grey].
   */
  greyTone()
  {
    // [red, green, blue, grey].
    return [ 0, 0, 0, 255 ];
  }

  /**
   * Calculates the rate of which to increment/decrement the current gauge.
   * The gauge goes down when they are hurting, so this defaults to red.
   * @returns {number}
   */
  changeRate()
  {
    const divisor = 10;
    const rate = Math.abs((this.target() - this.current()) / divisor);
    return rate;
  }

  /**
   * Update the flow meter to give the flowy aesthetic.
   */
  updateFlow()
  {
    // update the x coordinate of where to set the frame to emulate "flowing" gauges.
    this._gaugeActualFlowCurrent += 0.3;

    // if the current flow exceeds the limit, reset it.
    if (this._gaugeActualFlowCurrent > this._gaugeActualFlowLimit)
    {
      // reset the current flow to 0.
      this._gaugeActualFlowCurrent = 0;
    }
  }

  /**
   * Draws this gauge.
   */
  drawGauge()
  {
    // draw the in-flux "current" gauge.
    this.drawCurrentGauge();

    // draw the accurate "actual" gauge.
    this.drawActualGauge();
  }

  /**
   * Draws the "current" gauge, the gauge drawn in the middleground that
   * represents the amount that the enemy looks like they have. This extra
   * bar is drawn mostly for effect, and will spend a lot of time in-flux.
   */
  drawCurrentGauge()
  {
    // get the height of the gauge.
    const gaugeHeight = this.gaugeHeight();

    // determine the actual width to draw inside the measured fill band.
    const factor = (this.current() / this.max()) * this._gaugeSliceFillInnerWidth;

    // set the flowed-frame of the gauge.
    const frameX = this._gaugeActualFlowCurrent + this._gaugeSliceFillMinX;
    this._gaugeCurrentSprite.setFrame(frameX, gaugeHeight, factor, gaugeHeight);
  }

  /**
   * Draws the "actual" gauge, the gauge drawn in the foremost-ground that
   * represents the amount that the enemy currently has.
   */
  drawActualGauge()
  {
    // get the height of the gauge.
    const gaugeHeight = this.gaugeHeight();

    // determine the actual width to draw inside the measured fill band.
    const factor = (this.target() / this.max()) * this._gaugeSliceFillInnerWidth;

    // set the flowed-frame of the gauge.
    const frameX = this._gaugeActualFlowCurrent + this._gaugeSliceFillMinX;
    this._gaugeActualSprite.setFrame(frameX, 0, factor, gaugeHeight);
  }

  /**
   * The width of the gauge.
   * @returns {number}
   */
  gaugeWidth()
  {
    return Math.floor(this._gaugeBitmap.width / 3);
  }

  /**
   * The height of the gauge.
   * @returns {number}
   */
  gaugeHeight()
  {
    return Math.floor(this._gaugeBitmap.height / 2);
  }

  /**
   * Measures the interior track on the background and the interior fill band on the foreground slice.
   * This keeps HP/MP bars inside the frame art when `scale.x` is cranked up.
   */
  measureGaugeArtExtents()
  {
    // default to full-slice behavior if anything is missing or measurement fails.
    this._gaugeSliceFillMinX = 0;
    this._gaugeSliceFillInnerWidth = 1;
    this._gaugeBackgroundTrackMinX = 0;
    this._gaugeBackgroundTrackInnerWidth = 1;

    if (!this._gaugeBitmap) return;

    const sliceW = this.gaugeWidth();
    const sliceH = this.gaugeHeight();

    if (sliceW === 0 || sliceH === 0) return;

    this._gaugeSliceFillInnerWidth = sliceW;
    this._gaugeBackgroundTrackInnerWidth = this._backgroundBitmap
      ? this._backgroundBitmap.width
      : sliceW;

    if (!this._backgroundBitmap) return;

    // Caps on the frame art read as "bright" while the trough reads as near-black; a naive bright min/max would span
    // cap-to-cap and pretend the gutter is part of the interior (wrong width + wrong left edge).
    const bgTrack = this.measureLongestOpaqueDarkHorizontalRun(
      this._backgroundBitmap,
      0,
      0,
      this._backgroundBitmap.width,
      this._backgroundBitmap.height,
      80
    );

    const topTrack = this.measureBrightHorizontalExtent(
      this._gaugeBitmap,
      0,
      0,
      sliceW,
      sliceH,
      24
    );

    const bottomTrack = this.measureBrightHorizontalExtent(
      this._gaugeBitmap,
      0,
      sliceH,
      sliceW,
      sliceH,
      24
    );

    const fillMinX = Math.min(topTrack.minX, bottomTrack.minX);
    const fillMaxX = Math.max(topTrack.maxX, bottomTrack.maxX);
    const fillInnerW = Math.max(1, fillMaxX - fillMinX + 1);

    const trackInnerW = Math.max(1, bgTrack.maxX - bgTrack.minX + 1);

    this._gaugeSliceFillMinX = fillMinX;
    this._gaugeSliceFillInnerWidth = fillInnerW;
    this._gaugeBackgroundTrackMinX = bgTrack.minX;
    this._gaugeBackgroundTrackInnerWidth = trackInnerW;
  }

  /**
   * Positions and scales the bar sprites so the measured fill maps onto the measured background track.
   */
  alignGaugeForegroundToBackgroundTrack()
  {
    if (!this._gaugeCurrentSprite || !this._gaugeActualSprite) return;

    if (this._gaugeSliceFillInnerWidth <= 0 || this._gaugeBackgroundTrackInnerWidth <= 0) return;

    const bgX = J.HUD.EXT.TARGET.Metadata.BackgroundGaugeImageX;

    // Left edge of the fill must share the same origin as the measured trough (`bgX + troughMinX`). Using the plugin
    // middle/foreground ImageX values here while also clamping width from `troughRight - ImageX` split the problem:
    // the right clamp assumed one coordinate system and the hand-tuned X another — e.g. trough starts at column 1 but
    // defaults put the fill at 2, so a green underlay shows in that column and HP vs MP could disagree if anything
    // differed between layers. One `fillLeftX` and one `ratio` keeps both strips locked.
    const fillLeftX = bgX + this._gaugeBackgroundTrackMinX;

    const troughRightExclusive = bgX + this._gaugeBackgroundTrackMinX + this._gaugeBackgroundTrackInnerWidth;

    const effectiveBarWidth = Math.max(
      1,
      Math.min(this._gaugeBackgroundTrackInnerWidth, troughRightExclusive - fillLeftX)
    );

    const ratio = effectiveBarWidth / this._gaugeSliceFillInnerWidth;

    this._gaugeCurrentSprite.scale.x = ratio;
    this._gaugeActualSprite.scale.x = ratio;

    this._gaugeCurrentSprite.x = fillLeftX;
    this._gaugeActualSprite.x = fillLeftX;
  }

  /**
   * Finds the horizontal span of "bright enough" pixels inside a bitmap rectangle.
   * Used to ignore near-black border pixels that are still opaque.
   * @param {Bitmap} bitmap The bitmap to scan.
   * @param {number} rectX The left of the scan rectangle.
   * @param {number} rectY The top of the scan rectangle.
   * @param {number} rectW The width of the scan rectangle.
   * @param {number} rectH The height of the scan rectangle.
   * @param {number} minBrightSum Minimum r+g+b sum to count as interior content.
   * @returns {{minX:number,maxX:number}}
   */
  measureBrightHorizontalExtent(bitmap, rectX, rectY, rectW, rectH, minBrightSum)
  {
    let minX = rectW;
    let maxX = -1;

    for (let y = 0; y < rectH; y++)
    {
      for (let x = 0; x < rectW; x++)
      {
        const px = rectX + x;
        const py = rectY + y;

        if (bitmap.getAlphaPixel(px, py) < 8) continue;

        const hex = bitmap.getPixel(px, py);
        const bright = this.sumRgbFromHexString(hex);

        if (bright <= minBrightSum) continue;

        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
      }
    }

    if (maxX < 0)
    {
      return { minX: 0, maxX: rectW - 1 };
    }

    return { minX, maxX };
  }

  /**
   * Finds the longest horizontal run of opaque "dark" pixels in a rectangle (row by row).
   * Used for capsule-style gauge frames where the playable trough is darker than the end caps.
   * @param {Bitmap} bitmap The bitmap to scan.
   * @param {number} rectX The left of the scan rectangle.
   * @param {number} rectY The top of the scan rectangle.
   * @param {number} rectW The width of the scan rectangle.
   * @param {number} rectH The height of the scan rectangle.
   * @param {number} maxDarkSum Inclusive ceiling on r+g+b for a pixel to count as trough (caps sit above this).
   * @returns {{minX:number,maxX:number}} Inclusive span of the best run in the same local x space as {@link measureBrightHorizontalExtent}.
   */
  measureLongestOpaqueDarkHorizontalRun(bitmap, rectX, rectY, rectW, rectH, maxDarkSum)
  {
    let bestMinX = 0;
    let bestMaxX = rectW - 1;
    let bestLen = 0;

    for (let y = 0; y < rectH; y++)
    {
      const py = rectY + y;
      let runStart = -1;

      for (let x = 0; x <= rectW; x++)
      {
        const atEnd = x === rectW;
        let isDark = false;

        if (atEnd === false)
        {
          const px = rectX + x;

          if (bitmap.getAlphaPixel(px, py) < 8)
          {
            isDark = false;
          }
          else
          {
            const sum = this.sumRgbFromHexString(bitmap.getPixel(px, py));

            isDark = sum <= maxDarkSum;
          }
        }

        if (isDark && runStart < 0)
        {
          runStart = x;
        }

        if ((isDark === false || atEnd) && runStart >= 0)
        {
          const runEnd = x - 1;
          const len = runEnd - runStart + 1;

          if (len > bestLen)
          {
            bestLen = len;
            bestMinX = runStart;
            bestMaxX = runEnd;
          }

          runStart = -1;
        }
      }
    }

    if (bestLen === 0)
    {
      return { minX: 0, maxX: rectW - 1 };
    }

    return { minX: bestMinX, maxX: bestMaxX };
  }

  /**
   * Parses `#RRGGBB` from {@link Bitmap#getPixel} and sums the channels.
   * @param {string} hex The color string.
   * @returns {number}
   */
  sumRgbFromHexString(hex)
  {
    if (!hex || hex.length < 7) return 0;

    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    return r + g + b;
  }
}

//endregion Sprite_FlowingGauge