//region Sprite_MapDamage
/**
 * Map combat popup sprite that can hold motion until accumulation finishes, then reuse {@link Sprite_Damage} motion.
 * Extends engine {@link Sprite_Damage} so Juicy bits (critical flash, colors) stay consistent.
 */
function Sprite_MapDamage()
{
  this.initialize(...arguments);
}

Sprite_MapDamage.prototype = Object.create(Sprite_Damage.prototype);
Sprite_MapDamage.prototype.constructor = Sprite_MapDamage;

/**
 * Runs after {@link Sprite_Damage.prototype.initialize}.
 */
Sprite_MapDamage.prototype.initialize = function()
{
  Sprite_Damage.prototype.initialize.call(this);

  /**
   * When true, child motion is frozen so totals can climb in place on the anchor.
   * @type {boolean}
   */
  this._j._popups._mapAccumulatePhase = true;

  /**
   * Frame index into {@link #kickMergeCombinePulse}; {@link #_mergePulseTotalFrames} or greater means idle.
   * @type {number}
   */
  this._j._popups._mergePulseFrameIndex = 10;

  /**
   * How many frames the merge tally scale pulse runs.
   * @type {number}
   */
  this._j._popups._mergePulseTotalFrames = 10;
};

/**
 * Mirrors {@link Sprite_Damage.prototype.update} but skips the duration countdown while accumulating.
 *
 * Vanilla damage sprites always decrement {@link Sprite_Damage#_duration}; if we only gate motion in
 * {@link Sprite_MapDamage.prototype.updateChild}, the popup still expires, {@link Sprite_Damage.prototype.isPlaying}
 * returns false, and {@link Sprite_Character.prototype._removeTrackedPopSprite} destroys the sprite early.
 * {@link JABS_PopupMergeController} then keeps a dead reference and combo-flush hits {@link Sprite.prototype.destroy}
 * twice (PIXI tears down listeners that are already null).
 */
Sprite_MapDamage.prototype.update = function()
{
  Sprite.prototype.update.call(this);

  if (this._duration > 0)
  {
    if (this._j._popups._mapAccumulatePhase !== true)
    {
      this._duration--;
    }

    for (let i = 0; i < this.children.length; i++)
    {
      this.updateChild(this.children[i]);
    }
  }

  this.updateFlash();
  this.updateOpacity();

  this.updateMergeCombinePulse();
};

/**
 * Eases root scale after {@link #refreshDisplayedValue} so combined totals read as a pulse, not a silent swap.
 */
Sprite_MapDamage.prototype.updateMergeCombinePulse = function()
{
  const idx = this._j._popups._mergePulseFrameIndex;
  const total = this._j._popups._mergePulseTotalFrames;

  if (idx >= total)
  {
    this.scale.x = 1;
    this.scale.y = 1;

    return;
  }

  const peak = 1.13;
  const w = Math.sin((Math.PI * (idx + 0.5)) / total);
  const s = 1 + (peak - 1) * w;

  this.scale.x = s;
  this.scale.y = s;
  this._j._popups._mergePulseFrameIndex = idx + 1;
};

/**
 * Restarts the combine pulse when a merge refresh lands (stacking hits, slip ticks, mitigation counts).
 */
Sprite_MapDamage.prototype.kickMergeCombinePulse = function()
{
  this._j._popups._mergePulseFrameIndex = 0;
};

/**
 * Ends the accumulation phase and allows normal bounce / flyaway motion to run.
 */
Sprite_MapDamage.prototype.releaseAccumulatePhase = function()
{
  this._j._popups._mapAccumulatePhase = false;

  const baseDuration = J.POPUPS.Layout.BaseDuration;

  if (this._duration < baseDuration)
  {
    this._duration = baseDuration;
  }
};

/**
 * Refreshes the primary value line without rebuilding icon geometry from scratch.
 *
 * @param {string} valueString The new display string (digits or mitigation label).
 */
Sprite_MapDamage.prototype.refreshDisplayedValue = function(valueString)
{
  let healingPopup = false;

  if (this._j._popups._sourcePopup && this._j._popups._sourcePopup.healing === true)
  {
    healingPopup = true;
  }

  const displayString = J.POPUPS.formatNumericPopupDisplayString(valueString, healingPopup);

  if (this._j._popups._sourcePopup)
  {
    this._j._popups._sourcePopup.value = displayString;
  }

  const iconRef = this._j._popups._iconSprite;

  const textSprite = this.children.find(child =>
    child !== iconRef && child.bitmap && child.bitmap.width === J.POPUPS.Layout.ValueBitmapWidth);

  if (!textSprite || !textSprite.bitmap)
  {
    return;
  }

  const w = J.POPUPS.Layout.ValueBitmapWidth;
  const h = this.fontSize();

  textSprite.bitmap.clear();

  let fontSize = 20;

  if (this._j._popups._isCritical)
  {
    fontSize += 12;
    textSprite.bitmap.fontBold = true;
  }
  else
  {
    const accent = this._j._popups._textAccent;
    const accentItalic = accent === 'miss' || accent === 'evade' || accent === 'parry';
    const legacyItalic = displayString.includes('Missed')
      || displayString.includes('Evaded')
      || displayString.includes('Parry');

    if (accentItalic || legacyItalic)
    {
      fontSize -= 6;
      textSprite.bitmap.fontItalic = true;
    }
  }

  textSprite.bitmap.fontSize = fontSize;
  textSprite.bitmap.drawText(displayString, 0, 0, w, h, 'center');

  this.repositionChildren();
  this.kickMergeCombinePulse();
};

/**
 * Gates motion during accumulation so numbers stay readable on the target.
 *
 * @param {Sprite} sprite Child motion sprite from {@link Sprite_Damage#createChildSprite}.
 */
Sprite_MapDamage.prototype.updateChild = function(sprite)
{
  if (this._j._popups._mapAccumulatePhase === true)
  {
    sprite.setBlendColor(this._flashColor);

    return;
  }

  Sprite_Damage.prototype.updateChild.call(this, sprite);
};
//endregion Sprite_MapDamage