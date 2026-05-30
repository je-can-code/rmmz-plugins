/**
 * A simple calculated gauge representing the current cooldown of an action.
 * While the skill is ready, this gauge is invisible.
 */
class Sprite_CooldownGauge
  extends Sprite
{
  constructor(cooldownData)
  {
    // perform original logic with no bitmap.
    super();

    // initialize with the cooldown data.
    this.initMembers();

    // initialize the bitmap for the gauge.
    this.createBitmap();

    // sets up this gauge with the cooldown data.
    this.setup(cooldownData);
  }

  //region properties
  /**
   * Initializes all members of this class.
   */
  initMembers()
  {
    /**
     * The shared root namespace for all of J's plugin data.
     */
    // store  j on the instance for later reads.
    this._j = {
      /**
       * The cooldown data this gauge is associated with.
       * @type {JABS_Cooldown|null}
       */
      _cooldownData: null,

      /**
       * The current value of the gauge.
       * @type {number}
       */
      _valueCurrent: 0,

      /**
       * The maximum value of the gauge.
       * @type {number}
       */
      _valueMax: 0,

      /**
       * Highest recent combined cooldown (slot vs GCD) so the bar does not shrink when GCD outlasts the per-skill
       * timer.
       * @type {number}
       */
      _gcdHudPeak: 0,

      /**
       * Leader battler whose {@link J.ABS.Globals.GlobalCooldownKey} may be reflected on this input-slot gauge.
       * @type {JABS_Battler|null}
       */
      _gcdMergeBattler: null,

      /**
       * Skill id assigned to this HUD slot; used with
       * {@link JABS_GlobalCooldown.skillIsSubjectToGlobalCooldown} to decide if GCD should merge.
       * @type {number}
       */
      _gcdMergeSkillId: 0,
    };
  }

  /**
   * Binds this gauge to show remaining GCD alongside the slot cooldown when the slot maps to a GCD-subject skill.
   * Clears merge state for tool, dodge, and item slots so those inputs never display the shared timer.
   * @param {JABS_Battler|null} jabsBattler The leader JABS battler.
   * @param {JABS_SkillSlot|null} skillSlot Slot shown on this input key.
   */
  setHudGcdMerge(jabsBattler, skillSlot)
  {
    this._j._gcdMergeBattler = null;
    this._j._gcdMergeSkillId = 0;
    if (!jabsBattler || !skillSlot) return;
    const { key } = skillSlot;
    if (key === JABS_Button.Tool || key === JABS_Button.Dodge) return;
    if (skillSlot.isItem()) return;
    this._j._gcdMergeBattler = jabsBattler;
    this._j._gcdMergeSkillId = skillSlot.id;
  }

  /**
   * Remaining frames on the battler-wide GCD for HUD purposes when merge is armed and the slotted skill is
   * GCD-subject.
   * Returns zero if J-ABS or {@link JABS_GlobalCooldown} is unavailable, the slot is not merged, or the global timer
   * is ready.
   * @returns {number} Frames left on {@link J.ABS.Globals.GlobalCooldownKey}, or 0 when not applicable.
   */
  globalHudFrames()
  {
    if (!this._j._gcdMergeBattler || !this._j._gcdMergeSkillId) return 0;
    if (typeof J.ABS === 'undefined' || typeof JABS_GlobalCooldown === 'undefined') return 0;
    const sk = $dataSkills[this._j._gcdMergeSkillId];
    if (JABS_GlobalCooldown.skillIsSubjectToGlobalCooldown(sk) === false) return 0;
    const globalCd = this._j._gcdMergeBattler.getCooldown(J.ABS.Globals.GlobalCooldownKey);
    if (!globalCd) return 0;
    if (globalCd.isBaseReady() === true) return 0;
    return globalCd.frames;
  }

  /**
   * Gets whether or not this gauge has a max value currently.
   * @returns {boolean}
   */
  isMaxUnassigned()
  {
    return this._j._valueMax === 0;
  }

  /**
   * Gets the cooldown data associated with this gauge.
   * @returns {JABS_Cooldown}
   */
  cooldownData()
  {
    return this._j._cooldownData;
  }

  /**
   * Sets the cooldown data associated with this gauge.
   * @param {JABS_Cooldown} cooldownData The new cooldown data to set.
   */
  setCooldownData(cooldownData)
  {
    this._j._cooldownData = cooldownData;
  }

  /**
   * Gets the current value for this gauge.
   * @returns {number}
   */
  currentValue()
  {
    const cd = this.cooldownData();
    const g = this.globalHudFrames();
    return Math.max(cd.frames, g);
  }

  /**
   * Gets the max value for this gauge.
   * @returns {number}
   */
  maxValue()
  {
    return this._j._valueMax;
  }

  /**
   * Sets the max value for this gauge.
   * @param {number} maxValue The max value to set.
   */
  setMaxValue(maxValue)
  {
    this._j._valueMax = maxValue;
  }

  /**
   * The width of the bitmap.
   */
  bitmapWidth()
  {
    return 32;
  }

  /**
   * The height of the bitmap.
   */
  bitmapHeight()
  {
    return 20;
  }

  /**
   * The height of this gauge.
   */
  gaugeHeight()
  {
    return 10;
  }

  /**
   * The color to gradient from.
   * Defaults to blue.
   * @returns {string}
   */
  gaugeColor1()
  {
    return 'rgba(0, 0, 255, 1)';
  }

  /**
   * The color to gradient into.
   * Defaults to green.
   * @returns {string}
   */
  gaugeColor2()
  {
    return 'rgba(0, 255, 0, 1)';
  }

  /**
   * The backdrop color.
   * Defaults to black with 50% opacity.
   * @returns {string}
   */
  gaugeBackColor()
  {
    return 'rgba(0, 0, 0, 0.5)';
  }

  /**
   * The percent/decimal representing how full this gauge is currently is.
   * @returns {number} A number between 0 and 1.
   */
  gaugeRate()
  {
    // the rate is always zero if we don't have anything assigned.
    if (this.isMaxUnassigned()) return 0;

    const value = this.currentValue();
    const maxValue = this.maxValue();
    const rate = maxValue > 0
      ? value / maxValue
      : 0;

    const parsedRate = parseFloat(rate.toFixed(3));

    return parsedRate;
  }

  //endregion properties

  /**
   * Sets up the gauge based on the cooldown data.
   * @param {JABS_Cooldown} cooldownData The cooldown data for this gauge.
   */
  setup(cooldownData)
  {
    this.setCooldownData(cooldownData);
  }

  /**
   * Generates the bitmap for this gauge.
   */
  createBitmap()
  {
    this.bitmap = new Bitmap(this.bitmapWidth(), this.bitmapHeight());
  }

  /**
   * Disables the gauge, clears the GCD peak used for merged display, and makes it invisible.
   */
  disableGauge()
  {
    // zero the max value.
    this.setMaxValue(0);

    this._j._gcdHudPeak = 0;

    // make the sprite invisible.
    this.bitmap.paintOpacity = 0;
  }

  /**
   * Enables the gauge and sets the max value from the greater of the slot cooldown and merged GCD so the bar matches
   * the longer wait.
   * Tracks a peak so the fill rate stays stable when GCD extends past the per-skill countdown.
   */
  enableGauge()
  {
    const cd = this.cooldownData();
    const g = this.globalHudFrames();
    const eff = Math.max(cd.frames, g);
    if (this._j._gcdHudPeak < eff)
    {
      this._j._gcdHudPeak = eff;
    }
    this.setMaxValue(this._j._gcdHudPeak);

    // make the sprite visible.
    this.bitmap.paintOpacity = 255;
  }

  /**
   * Extends {@link Sprite.update}.<br/>
   * Also updates the drawing of this gauge.
   */
  update()
  {
    // perform original logic.
    super.update();

    // if we cannot update, do not try to draw the gauge.
    if (!this.canUpdate()) return;

    // handle readiness of the combo.
    this.handleActionReadiness();

    // draw the gauge.
    this.redraw();
  }

  /**
   * Whether or not this gauge can be updated.
   * @returns {boolean} True if this gauge can be updated, false otherwise.
   */
  canUpdate()
  {
    // if we do not have a current value, do not update.
    if (Number.isNaN(this.currentValue())) return false;

    return true;
  }

  /**
   * Shows or hides the gauge and updates its max from slot cooldown and optional merged GCD.
   * Hides only when both the slot base cooldown and merged GCD are finished; otherwise keeps the peak max for a smooth
   * drain.
   */
  handleActionReadiness()
  {
    const cooldown = this.cooldownData();
    const g = this.globalHudFrames();
    const eff = Math.max(cooldown.frames, g);

    if (cooldown.isComboReady() && this.isMaxUnassigned())
    {
      this.enableGauge();
    }

    if (cooldown.isBaseReady() === true && g <= 0)
    {
      this.disableGauge();
      return;
    }

    if (cooldown.isBaseReady() === false || g > 0)
    {
      if (this._j._gcdHudPeak < eff)
      {
        this._j._gcdHudPeak = eff;
      }
      this.setMaxValue(this._j._gcdHudPeak);
      this.bitmap.paintOpacity = 255;
    }
  }

  /**
   * Clears the bitmap to redraw the gauge anew.
   */
  redraw()
  {
    // clear the rendering.
    this.bitmap.clear();

    // draw the gauge.
    this.drawGauge();
  }

  /**
   * Draws this gauge.
   */
  drawGauge()
  {
    // define the origin point of this gauge.
    const x = 0;
    const y = this.bitmapHeight() - this.gaugeHeight();

    // define the size of this gauge.
    const w = this.bitmapWidth() - x;
    const h = this.gaugeHeight();

    // draw the gauge with the given parameters.
    this.drawGaugeRect(x, y, w, h);
  }

  /**
   * Actually draws the gauge based on the given parameters.
   * @param {number} x The x of the origin for this gauge.
   * @param {number} y The y of the origin for this gauge.
   * @param {number} w The width of the gauge.
   * @param {number} h The height of this gauge.
   */
  drawGaugeRect(x, y, w, h)
  {
    // determine the percent/decimal amount of how filled the gauge is.
    const rate = this.gaugeRate();

    // calculate the width of the filled portion of the gauge lesser the borders.
    const fillW = Math.floor((w - 2) * rate);

    // calculate the height of the filled portion of the gauge lesser the borders.
    const fillH = h - 2;

    // render the backdrop of the gauge.
    this.bitmap.fillRect(x, y, w, h, this.gaugeBackColor());

    // calculate the bordered x,y coordinates.
    const [ borderedX, borderedY ] = [ x + 1, y + 1 ];

    // render the filled portion of the gauge onto the bitmap.
    this.bitmap.gradientFillRect(
      borderedX,            // the x including borders.
      borderedY,            // the y including borders.
      fillW,                // the width to fill.
      fillH,                // the hieght to fill.
      this.gaugeColor1(),   // the color gradient to start with.
      this.gaugeColor2()
    );  // the color gradient to end with.
  }
}

export default Sprite_CooldownGauge;
//endregion Sprite_CooldownGauge