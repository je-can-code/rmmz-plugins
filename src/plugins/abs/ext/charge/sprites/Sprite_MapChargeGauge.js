//region Sprite_MapChargeGauge
/**
 * A dedicated segmented charge gauge for JABS battlers.
 * Extends {@link Sprite_MapGauge} and binds to a {@link JABS_Battler}.
 * Each segment represents one charge tier; segments fill left-to-right as tiers complete.
 */
class Sprite_MapChargeGauge
  extends Sprite_MapGauge
{

  //region properties
  /**
   * Gets the jabs battler.
   * @returns {JABS_Battler|null} The jabsBattler.
   */
  jabsBattler()
  {
    // hand back the jabs battler.
    return this._jabsBattler;
  }

  /**
   * Sets the jabs battler.
   * @param {JABS_Battler|null} newJabsBattler The new jabsBattler.
   */
  setJabsBattler(newJabsBattler)
  {
    // assign the jabs battler.
    this._jabsBattler = newJabsBattler;
  }

  /**
   * Gets the expected character.
   * @returns {*} The expectedCharacter.
   */
  expectedCharacter()
  {
    // hand back the expected character.
    return this._expectedCharacter;
  }

  /**
   * Sets the expected character.
   * @param {*} newExpectedCharacter The new expectedCharacter.
   */
  setExpectedCharacter(newExpectedCharacter)
  {
    // assign the expected character.
    this._expectedCharacter = newExpectedCharacter;
  }

  /**
   * Gets the expected uuid.
   * @returns {*} The expectedUuid.
   */
  expectedUuid()
  {
    // hand back the expected uuid.
    return this._expectedUuid;
  }

  /**
   * Sets the expected uuid.
   * @param {*} newExpectedUuid The new expectedUuid.
   */
  setExpectedUuid(newExpectedUuid)
  {
    // assign the expected uuid.
    this._expectedUuid = newExpectedUuid;
  }

  /**
   * Gets the gauge.
   * @returns {*} The gauge.
   */
  gauge()
  {
    // hand back the gauge.
    return this._gauge;
  }
  //endregion properties

  /**
   * Constructor.
   * @param {...*} args Forwarded to {@link #initialize}.
   */
  constructor(...args)
  {
    super();
    this.initialize(...args);
  }

  /**
   * Initializes this charge gauge with the given parameters.
   * @param {number=} bitmapWidth The bitmap width of this gauge.
   * @param {number=} bitmapHeight The bitmap height of this gauge.
   * @param {number=} gaugeHeight The height of the filled strip.
   */
  initialize(
    bitmapWidth = 128,
    bitmapHeight = 24,
    gaugeHeight = 10)
  {
    // initialize as a map gauge.
    super.initialize(bitmapWidth, bitmapHeight, gaugeHeight);

    /**
     * The JABS battler providing charge state.
     * @type {JABS_Battler|null}
     */
    this._jabsBattler = null;

    // indicate this is not one of the base types.
    this.setStatusType("charge");

    // default hidden to prevent any invalid-frame flashes.
    this.visible = false;
  }

  /**
   * Gets the {@link JABS_Battler} this gauge is associated with.
   * @returns {JABS_Battler|null}
   */
  getJabsBattler()
  {
    return this.jabsBattler();
  }

  /**
   * Binds this gauge to a JABS battler and the expected character host.
   * @param {JABS_Battler} jabsBattler The JABS battler.
   * @param {Game_Character} expectedCharacter The character this sprite represents.
   */
  setupJabs(jabsBattler, expectedCharacter)
  {
    // retain the JABS battler for charge-state logic.
    this.setJabsBattler(jabsBattler);

    /**
     * The character this gauge expects the JABS battler to be bound to.
     * @type {Game_Character|null}
     */
    this.setExpectedCharacter(expectedCharacter ?? null);

    /**
     * The UUID we expect this gauge to track.
     * @type {string}
     */
    this.setExpectedUuid(jabsBattler
      ? jabsBattler.getUuid()
      : null);

    // bind the underlying Game_Battler to satisfy Sprite_Gauge internals.
    this.setup(jabsBattler.getBattler(), this.statusType());
  }

  /**
   * Whether the gauge should be considered valid for fill-rate.
   * Valid only while the battler is actively charging with at least one incomplete tier.
   * @returns {boolean}
   */
  isValid()
  {
    // grab binding state.
    const jabsBattler = this.getJabsBattler();
    const expectedUuid = this.expectedUuid();
    const expectedCharacter = this.expectedCharacter();

    // must have a battler and a bound uuid.
    if (!jabsBattler || !expectedUuid) return false;

    // identity guard: the uuid must still match.
    if (jabsBattler.getUuid() !== expectedUuid) return false;

    // host guard: prevents cross-sprite leakage when battlers swap characters.
    if (expectedCharacter && jabsBattler.getCharacter() !== expectedCharacter) return false;

    // must be actively charging with an incomplete tier remaining.
    if (!jabsBattler.isCharging()) return false;
    if (!jabsBattler.getCurrentChargingTier()) return false;

    // valid!
    return true;
  }

  /**
   * The elapsed frames in the current charge tier.
   * @returns {number|NaN}
   */
  currentValue()
  {
    // without a battler there is no value.
    const jabsBattler = this.getJabsBattler();
    if (!jabsBattler) return NaN;

    // only provide a value while actively charging.
    if (!jabsBattler.isCharging()) return NaN;

    // the current tier drives the fill; null means all tiers are done.
    const currentTier = jabsBattler.getCurrentChargingTier();
    if (!currentTier) return NaN;

    return currentTier.duration;
  }

  /**
   * The total frames required to complete the current charge tier.
   * @returns {number|NaN}
   */
  currentMaxValue()
  {
    // without a battler there is no value.
    const jabsBattler = this.getJabsBattler();
    if (!jabsBattler) return NaN;

    // only provide a max while actively charging.
    if (!jabsBattler.isCharging()) return NaN;

    // the current tier drives the fill.
    const currentTier = jabsBattler.getCurrentChargingTier();
    if (!currentTier) return NaN;

    return currentTier.maxDuration;
  }

  /**
   * Updates this gauge.
   * Shows the gauge while charging and updates label/icon to reflect the current tier.
   * Hides and clears adornments when not valid.
   */
  update()
  {
    // always keep the base gauge bound to the correct underlying battler each frame.
    if (this.getJabsBattler())
    {
      this.setBattler(this.getJabsBattler().getBattler());
    }

    // determine validity for this frame.
    const valid = this.isValid();

    // if not valid, hide and clear adornments without a base update.
    if (valid === false)
    {
      this.visible = false;

      // clear label if present.
      if (this.gauge()._label)
      {
        this.setLabel(String.empty);
      }

      // clear icon if present.
      if (this.gauge()._iconIndex !== -1)
      {
        this.setIcon(-1);
      }

      return;
    }

    // from here on we are valid and should be visible.
    this.visible = true;

    // update label and icon to reflect the current tier before the base redraw.
    const currentTier = this.getJabsBattler().getCurrentChargingTier();
    if (currentTier)
    {
      // show "T1/2" style label so the player can read where they are in the chain.
      const totalTiers = this.getJabsBattler().getChargingTierData().length;
      this.setLabel(`T${currentTier.tier}/${totalTiers}`);

      // show the icon of the skill that fires if the player releases at this tier.
      const releaseSkill = currentTier.skillId
        ? $dataSkills[currentTier.skillId]
        : null;
      this.setIcon(releaseSkill
        ? releaseSkill.iconIndex
        : -1);
    }

    // perform base update/redraw lifecycle.
    super.update();
  }

  /**
   * Overwrites {@link Sprite_Gauge.drawGauge}.<br/>
   * Draws one segment per charge tier instead of a single continuous bar.
   * Completed tiers render full; the current tier renders at its elapsed fraction;
   * future tiers render as empty background only.
   */
  drawGauge()
  {
    // nothing to draw without a battler.
    const jabsBattler = this.getJabsBattler();
    if (!jabsBattler) return;

    // grab tier data; nothing to segment if empty.
    const tiers = jabsBattler.getChargingTierData();
    const currentTier = jabsBattler.getCurrentChargingTier();
    if (!tiers.length) return;

    // compute geometry: each segment is proportional to its tier's maxDuration.
    const totalTiers = tiers.length;
    const gapWidth = 2;
    const totalGaps = (totalTiers - 1) * gapWidth;
    const availableWidth = this.bitmapWidth() - totalGaps;
    const totalDuration = tiers.reduce((sum, tier) => sum + tier.maxDuration, 0);
    const gaugeY = this.bitmapHeight() - this.gaugeHeight();

    // draw each tier as its own segment, width scaled to its share of the total duration.
    let cursorX = 0;
    for (let i = 0; i < totalTiers; i++)
    {
      // each tier occupies a horizontal strip proportional to its maxDuration.
      const tier = tiers[i];
      const segmentWidth = Math.floor((tier.maxDuration / totalDuration) * availableWidth);
      const segX = cursorX;

      // draw the dark background for this segment first.
      this.bitmap.fillRect(segX, gaugeY, segmentWidth, this.gaugeHeight(), this.gaugeBackColor());

      // determine how much of this segment should be filled.
      let fillRate = 0;
      if (tier.completed)
      {
        // completed tiers are always drawn full.
        fillRate = 1;
      }
      else if (currentTier && tier.tier === currentTier.tier)
      {
        // the active tier fills proportionally to elapsed/max duration.
        fillRate = currentTier.maxDuration > 0
          ? Math.min(1, currentTier.duration / currentTier.maxDuration)
          : 0;
      }
      // future tiers remain at fillRate 0 (background only).

      // draw the gradient fill if there is anything to show.
      if (fillRate > 0)
      {
        const fillWidth = Math.floor(segmentWidth * fillRate);
        this.bitmap.gradientFillRect(
          segX,
          gaugeY,
          fillWidth,
          this.gaugeHeight(),
          this.gaugeColor1(),
          this.gaugeColor2());
      }

      // advance cursor past this segment and its trailing gap (no gap after the last segment).
      cursorX += segmentWidth + (i < totalTiers - 1 ? gapWidth : 0);
    }
  }

  /**
   * Overwrites {@link Sprite_MapCastGauge.drawLabel}.<br/>
   * Draws the tier label with crisp, integer-aligned text.
   */
  drawLabel()
  {
    // if there is no label, don't draw anything.
    if (!this.gauge()._label) return;

    // configure font for crisp small-text map display.
    this.bitmap.fontFace = $gameSystem.mainFontFace();
    this.bitmap.fontSize = 12;
    this.bitmap.outlineWidth = 2;
    this.bitmap.outlineColor = "rgba(0, 0, 0, 1)";
    this.bitmap.textColor = "#ffffff";

    // indent past the icon area; align top.
    const x = 32;
    const y = 0;
    const w = this.bitmapWidth() - x;
    const h = this.bitmapHeight();

    this.bitmap.drawText(
      this.gauge()._label,
      Math.floor(x),
      Math.floor(y),
      Math.floor(w),
      Math.floor(h),
      "left");
  }

  /**
   * Overwrites {@link Sprite_MapGauge.gaugeX}.<br/>
   * Returns 0 so the segmented fill occupies the full bitmap width.
   * @returns {number}
   */
  gaugeX()
  {
    return 0;
  }

  /**
   * The background color for each empty segment.
   * @returns {string}
   */
  gaugeBackColor()
  {
    return "rgba(32, 32, 32, 0.85)";
  }

  /**
   * The left gradient color for the fill strip.
   * @returns {string}
   */
  gaugeColor1()
  {
    // deep orange on the left.
    return "#FF8C00";
  }

  /**
   * The right gradient color for the fill strip.
   * @returns {string}
   */
  gaugeColor2()
  {
    // bright gold on the right.
    return "#FFD700";
  }
}

export default Sprite_MapChargeGauge;
//endregion Sprite_MapChargeGauge
