//region Sprite_MapCastGauge
import JABS_Battler from '../models/JABS_Battler.js';
/**
 * A dedicated cast-time gauge for JABS battlers.
 * Extends {@link Sprite_MapGauge} and binds to a {@link JABS_Battler}.
 */
class Sprite_MapCastGauge
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
   * @returns {Game_Character|null} The expectedCharacter.
   */
  expectedCharacter()
  {
    // hand back the expected character.
    return this._expectedCharacter;
  }

  /**
   * Sets the expected character.
   * @param {Game_Character|null} newExpectedCharacter The new expectedCharacter.
   */
  setExpectedCharacter(newExpectedCharacter)
  {
    // assign the expected character.
    this._expectedCharacter = newExpectedCharacter;
  }

  /**
   * Gets the expected uuid.
   * @returns {string|null} The expectedUuid.
   */
  expectedUuid()
  {
    // hand back the expected uuid.
    return this._expectedUuid;
  }

  /**
   * Sets the expected uuid.
   * @param {string|null} newExpectedUuid The new expectedUuid.
   */
  setExpectedUuid(newExpectedUuid)
  {
    // assign the expected uuid.
    this._expectedUuid = newExpectedUuid;
  }

  /**
   * Gets the gauge.
   * @returns {{_bitmapWidth: number, _bitmapHeight: number, _gaugeHeight: number, _label: string,
   * _value: number|null, _iconIndex: number, _iconSprite: Sprite|null, _activated: boolean}} The gauge.
   */
  gauge()
  {
    // hand back the gauge.
    return this._gauge;
  }
  //endregion properties

  /**
   * Constructor.
   * @param {number=} bitmapWidth The bitmap width of this gauge.
   * @param {number=} bitmapHeight The bitmap height of this gauge.
   * @param {number=} gaugeHeight The height of the filled strip.
   */
  constructor(bitmapWidth = 128, bitmapHeight = 24, gaugeHeight = 10)
  {
    super();
    this.initialize(bitmapWidth, bitmapHeight, gaugeHeight);
  }

  /**
   * Initializes this map cast gauge with the given parameters.
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
     * The JABS battler providing cast state.
     * @type {JABS_Battler|null}
     */
    this._jabsBattler = null;

    // indicate this is not one of the base types.
    this.setStatusType("cast");

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
   * Also assigns the underlying Game_Battler so Sprite_Gauge internals are satisfied.
   * @param {JABS_Battler} jabsBattler The JABS battler.
   * @param {Game_Character} expectedCharacter The character this sprite represents.
   */
  setupJabs(jabsBattler, expectedCharacter)
  {
    // retain the JABS battler for cast-time logic.
    this.setJabsBattler(jabsBattler);

    /**
     * The character this gauge expects the JABS battler to be bound to.
     * (kept for reference but not used for validity gating)
     * @type {Game_Character|null}
     */
    this.setExpectedCharacter(expectedCharacter ?? null);

    /**
     * The UUID we expect this gauge to track. Stable across leader/follower swaps.
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
   * Valid only while this bound JABS battler is actively casting or channeling with time left,
   * the battler identity matches the UUID we were bound to, AND the battler
   * remains bound to this sprite’s expected character.
   * @returns {boolean}
   */
  isValid()
  {
    // grab the JABS battler and basic binding state.
    const jabsBattler = this.getJabsBattler(); // the JABS battler for this gauge.
    const expectedUuid = this.expectedUuid(); // the uuid captured at setup.
    const expectedCharacter = this.expectedCharacter(); // the sprite's character at setup.

    // must have a jabs battler and an expected uuid.
    if (!jabsBattler || !expectedUuid) return false;

    // identity guard by uuid.
    if (jabsBattler.getUuid() !== expectedUuid) return false;

    // host guard by character reference (prevents cross-sprite leakage on swaps).
    if (expectedCharacter && jabsBattler.getCharacter() !== expectedCharacter) return false;

    // must be actively casting or channeling, with a decided action to read progress from.
    if (!jabsBattler.isCastingOrChanneling()) return false;
    const decided = jabsBattler.getDecidedAction();
    if (!decided || decided.length === 0) return false;

    // whichever of the two states is active, it must still have time left.
    if (jabsBattler.isCasting() && jabsBattler.getCastTimeCountdown() <= 0) return false;
    if (jabsBattler.isChanneling() && jabsBattler.getChannelDurationRemaining() <= 0) return false;

    // valid under these conditions.
    return true;
  }

  /**
   * The current value of the cast/channel bar. A cast fills up (elapsed time); a channel
   * depletes from full instead, so the two states read as visually distinct at a glance.
   * @returns {number}
   */
  currentValue()
  {
    // if this frame isn't valid, there is nothing to draw.
    if (!this.isValid()) return NaN;

    const jabsBattler = this.getJabsBattler();
    const [ action ] = jabsBattler.getDecidedAction();

    // channeling depletes from full instead of filling up, so it reads differently than a cast.
    if (jabsBattler.isChanneling())
    {
      const [ , totalDuration ] = action.getBaseSkill().jabsChannel;
      if (!totalDuration) return NaN; // zero-duration means do not draw.

      return Math.max(0, jabsBattler.getChannelDurationRemaining());
    }

    // compute elapsed from countdown vs total for a normal cast.
    const max = action.getCastTime();
    if (!max) return NaN; // zero-cast means do not draw.

    const remaining = jabsBattler.getCastTimeCountdown();
    return Math.max(0, max - remaining);
  }

  /**
   * The max value for the cast/channel bar: the action's cast time, or the channel's total
   * duration, at decision.
   * @returns {number}
   */
  currentMaxValue()
  {
    // if this frame isn't valid, there is nothing to draw.
    if (!this.isValid()) return NaN;

    const jabsBattler = this.getJabsBattler();
    const [ action ] = jabsBattler.getDecidedAction();

    // channeling's max is its own total duration instead of a cast time.
    if (jabsBattler.isChanneling())
    {
      const [ , totalDuration ] = action.getBaseSkill().jabsChannel;
      return totalDuration || NaN;
    }

    const max = action.getCastTime();
    return max || NaN;
  }

  /**
   * Updates this gauge.
   * Ensures the label/icon match the skill being cast while valid; otherwise clears label/icon.
   */
  update()
  {
    // always keep the base gauge bound to the correct underlying battler each frame.
    if (this.getJabsBattler())
    {
      const battler = this.getJabsBattler()
        .getBattler();

      this.setBattler(battler);
    }

    // determine validity for this frame.
    const valid = this.isValid();

    // if not valid, hard-exit: hide, clear adornments, and skip base update to prevent redraws.
    if (valid === false)
    {
      // hide the gauge entirely.
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

      // do not call the base update; avoids it re-enabling visibility or repainting.
      return;
    }

    // from here on, we are valid and should be visible.
    this.visible = true;

    // assign label+icon BEFORE base update so they render correctly this frame.
    const decided = this.getJabsBattler()
      .getDecidedAction();

    if (decided && decided.length > 0)
    {
      const [ action ] = decided;
      const skill = action.getBaseSkill();

      // update the label and icon (iconIndex >= 0 is valid in MZ; -1 clears).
      this.setLabel(skill.name);
      this.setIcon(skill.iconIndex >= 0
        ? skill.iconIndex
        : -1);
    }

    // perform base updating/redraw lifecycle (will call redraw() internally).
    super.update();
  }

  /**
   * Draws the label for the cast gauge using crisp, integer-aligned text.
   */
  drawLabel()
  {
    // if there is no label, don't draw anything.
    if (!this.gauge()._label) return;

    // configure font styling intentionally for small/crisp map text.
    this.bitmap.fontFace = $gameSystem.mainFontFace(); // use game’s primary font
    this.bitmap.fontSize = 12; // slightly larger than 12 for clarity
    this.bitmap.outlineWidth = 2; // thinner outline to keep edges sharp
    this.bitmap.outlineColor = "rgba(0, 0, 0, 1)"; // subtle outline
    this.bitmap.textColor = "#ffffff"; // bright text for readability

    // integer-aligned draw rect to avoid subpixel blurring.
    const x = 32; // left padding to clear the icon
    const y = 0;  // top of gauge bitmap
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
   * Overwrites {@link Sprite_Gauge.gaugeX}.<br/>
   * Returns 0 so the fill track occupies the full bitmap width.
   * The skill name label and icon are drawn overlaid on the fill, not to its left,
   * so the track must not be shortened by the label text width.
   * @returns {number}
   */
  gaugeX()
  {
    return 0;
  }

  /**
   * The background color for the cast gauge.
   * @returns {string}
   */
  gaugeBackColor()
  {
    // A subtle dark background that reads well on maps.
    return "rgba(32, 32, 32, 0.85)";
  }

  /**
   * The left gradient color for the cast gauge.
   * @returns {string}
   */
  gaugeColor1()
  {
    // Purple-ish left.
    return "#7A5CFF";
  }

  /**
   * The right gradient color for the cast gauge.
   * @returns {string}
   */
  gaugeColor2()
  {
    // Purple/magenta right.
    return "#C86BFA";
  }
}

export default Sprite_MapCastGauge;
//endregion Sprite_MapCastGauge