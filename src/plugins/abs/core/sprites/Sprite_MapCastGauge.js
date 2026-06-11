//region Sprite_MapCastGauge
import JABS_Battler from '../models/JABS_Battler.js';
/**
 * A dedicated cast-time gauge for JABS battlers.
 * Extends {@link Sprite_MapGauge} and binds to a {@link JABS_Battler}.
 */
class Sprite_MapCastGauge
  extends Sprite_MapGauge
{
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
    this._statusType = "cast";

    // default hidden to prevent any invalid-frame flashes.
    this.visible = false;
  }

  /**
   * Gets the {@link JABS_Battler} this gauge is associated with.
   * @returns {JABS_Battler|null}
   */
  getJabsBattler()
  {
    return this._jabsBattler;
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
    this._jabsBattler = jabsBattler;

    /**
     * The character this gauge expects the JABS battler to be bound to.
     * (kept for reference but not used for validity gating)
     * @type {Game_Character|null}
     */
    this._expectedCharacter = expectedCharacter ?? null;

    /**
     * The UUID we expect this gauge to track. Stable across leader/follower swaps.
     * @type {string}
     */
    this._expectedUuid = jabsBattler
      ? jabsBattler.getUuid()
      : null;

    // bind the underlying Game_Battler to satisfy Sprite_Gauge internals.
    this.setup(jabsBattler.getBattler(), this._statusType);
  }

  /**
   * Whether the gauge should be considered valid for fill-rate.
   * Valid only while this bound JABS battler is actively casting with time left,
   * the battler identity matches the UUID we were bound to, AND the battler
   * remains bound to this sprite’s expected character.
   * @returns {boolean}
   */
  isValid()
  {
    // grab the JABS battler and basic binding state.
    const jabsBattler = this.getJabsBattler(); // the JABS battler for this gauge.
    const expectedUuid = this._expectedUuid; // the uuid captured at setup.
    const expectedCharacter = this._expectedCharacter; // the sprite's character at setup.

    // must have a jabs battler and an expected uuid.
    if (!jabsBattler || !expectedUuid) return false;

    // identity guard by uuid.
    if (jabsBattler.getUuid() !== expectedUuid) return false;

    // host guard by character reference (prevents cross-sprite leakage on swaps).
    if (expectedCharacter && jabsBattler.getCharacter() !== expectedCharacter) return false;

    // must be actively casting.
    if (!jabsBattler.isCasting()) return false;

    // must have a decided action and time remaining.
    const decided = jabsBattler.getDecidedAction();
    if (!decided || decided.length === 0) return false;
    if (jabsBattler.getCastTimeCountdown() <= 0) return false;

    // valid under these conditions.
    return true;
  }

  /**
   * The current (elapsed) value of the cast bar.
   * @returns {number}
   */
  currentValue()
  {
    // if we lack a JABS battler, we cannot provide values.
    const jabsBattler = this.getJabsBattler();
    if (!jabsBattler) return NaN;

    // only provide values while actively casting with a decided action and time remaining.
    if (!jabsBattler.isCasting()) return NaN;
    const decided = jabsBattler.getDecidedAction();
    if (!decided || decided.length === 0) return NaN;
    if (jabsBattler.getCastTimeCountdown() <= 0) return NaN;

    // compute elapsed from countdown vs total.
    const [ action ] = decided;
    const max = action.getCastTime();
    if (!max) return NaN; // zero-cast means do not draw.

    const remaining = jabsBattler.getCastTimeCountdown();
    const elapsed = Math.max(0, max - remaining);
    return elapsed;
  }

  /**
   * The max value for the cast bar: the action's cast time at decision.
   * @returns {number}
   */
  currentMaxValue()
  {
    // if we lack a JABS battler, we cannot provide values.
    const jabsBattler = this.getJabsBattler();
    if (!jabsBattler) return NaN;

    // only provide max while actively casting with a decided action and time remaining.
    if (!jabsBattler.isCasting()) return NaN;
    const decided = jabsBattler.getDecidedAction();
    if (!decided || decided.length === 0) return NaN;
    if (jabsBattler.getCastTimeCountdown() <= 0) return NaN;

    const [ action ] = decided;
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
      this._battler = this.getJabsBattler()
        .getBattler();
    }

    // determine validity for this frame.
    const valid = this.isValid();

    // if not valid, hard-exit: hide, clear adornments, and skip base update to prevent redraws.
    if (valid === false)
    {
      // hide the gauge entirely.
      this.visible = false;

      // clear label if present.
      if (this._gauge._label)
      {
        this.setLabel(String.empty);
      }

      // clear icon if present.
      if (this._gauge._iconIndex !== -1)
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
    if (!this._gauge._label) return;

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
      this._gauge._label,
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