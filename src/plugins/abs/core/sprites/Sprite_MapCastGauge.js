//region Sprite_MapCastGauge
/**
 * A dedicated cast-time gauge for JABS battlers.
 * Extends {@link Sprite_MapGauge} and binds to a {@link JABS_Battler}.
 */
function Sprite_MapCastGauge()
{
  this.initialize(...arguments);
}

Sprite_MapCastGauge.prototype = Object.create(Sprite_MapGauge.prototype);
Sprite_MapCastGauge.prototype.constructor = Sprite_MapCastGauge;

/**
 * Initializes this map cast gauge with the given parameters.
 * @param {number=} bitmapWidth The bitmap width of this gauge.
 * @param {number=} bitmapHeight The bitmap height of this gauge.
 * @param {number=} gaugeHeight The height of the filled strip.
 */
Sprite_MapCastGauge.prototype.initialize = function(
  bitmapWidth = 128,
  bitmapHeight = 24,
  gaugeHeight = 10)
{
  // initialize as a map gauge.
  Sprite_MapGauge.prototype.initialize.call(this, bitmapWidth, bitmapHeight, gaugeHeight);

  /**
   * The JABS battler providing cast state.
   * @type {JABS_Battler|null}
   */
  this._jabsBattler = null;

  // Use MP gradient for a distinct blue tone fill by default.
  // TODO: update this to be more dynamic.
  this._statusType = "mp";
};

/**
 * Gets the {@link JABS_Battler} this gauge is associated with.
 * @returns {JABS_Battler|null}
 */
Sprite_MapCastGauge.prototype.getJabsBattler = function()
{
  return this._jabsBattler;
};

/**
 * Binds this gauge to a JABS battler and the expected character host.
 * Also assigns the underlying Game_Battler so Sprite_Gauge internals are satisfied.
 * @param {JABS_Battler} jabsBattler The JABS battler.
 * @param {Game_Character} expectedCharacter The character this sprite represents.
 */
Sprite_MapCastGauge.prototype.setupJabs = function(jabsBattler, expectedCharacter)
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
  this._expectedUuid = jabsBattler ? jabsBattler.getUuid() : null;

  // bind the underlying Game_Battler to satisfy Sprite_Gauge internals.
  this.setup(jabsBattler.getBattler(), this._statusType);
};

/**
 * Whether the gauge should be considered valid for fill-rate.
 * Valid only while this bound JABS battler is actively casting with time left,
 * the battler identity matches the UUID we were bound to, AND the battler
 * remains bound to this sprite’s expected character.
 * @returns {boolean}
 */
Sprite_MapCastGauge.prototype.isValid = function()
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
};

/**
 * The current (elapsed) value of the cast bar.
 * @returns {number}
 */
Sprite_MapCastGauge.prototype.currentValue = function()
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
};

/**
 * The max value for the cast bar: the action's cast time at decision.
 * @returns {number}
 */
Sprite_MapCastGauge.prototype.currentMaxValue = function()
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
};

/**
 * Updates this gauge.
 * Ensures the label/icon match the skill being cast while valid; otherwise clears label/icon.
 */
Sprite_MapCastGauge.prototype.update = function()
{
  // always keep the base gauge bound to the correct underlying battler each frame.
  if (this._jabsBattler)
  {
    this._battler = this._jabsBattler.getBattler();
  }

  // force a redraw to ensure we paint immediately when casting begins.
  this.redraw();

  // perform base updating/redraw lifecycle.
  Sprite_MapGauge.prototype.update.call(this);

  // if not casting-valid, clear adornments and exit.
  if (!this.isValid())
  {
    if (this._gauge._label)
    {
      this.setLabel(String.empty);
    }
    if (this._gauge._iconIndex !== -1)
    {
      this.setIcon(-1);
    }
    return;
  }

  // while valid (casting), reflect the current skill name + icon.
  const decided = this.getJabsBattler().getDecidedAction();
  if (!decided || decided.length === 0) return;

  const [ action ] = decided;
  const skill = action.getBaseSkill();

  // set the label and icon for the gauge; base draw uses these.
  this.setLabel(skill.name);
  this.setIcon(skill.iconIndex > 0 ? skill.iconIndex : -1);
};
//endregion Sprite_MapCastGauge