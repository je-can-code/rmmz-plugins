//region Sprite_MapDamage
import PopupNumericDisplay from './../helpers/PopupNumericDisplay.js';

/**
 * Map combat popup sprite that can hold motion until accumulation finishes, then reuse {@link Sprite_Damage} motion.
 * Extends engine {@link Sprite_Damage} so Juicy bits (critical flash, colors) stay consistent.
 */
class Sprite_MapDamage
  extends Sprite_Damage
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
   * Runs after {@link Sprite_Damage.prototype.initialize}.
   */
  initialize()
  {
    super.initialize();

    // policy step inside initialize.
    /**
     * When true, child motion is frozen so totals can climb in place on the anchor.
     * @type {boolean}
     // policy step inside initialize.
     */
    this._j._popups._mapAccumulatePhase = true;

    // policy step inside initialize.
    /**
     * Frame index into {@link #kickMergeCombinePulse}; {@link #_mergePulseTotalFrames} or greater means idle.
     * @type {number}
     // policy step inside initialize.
     */
    this._j._popups._mergePulseFrameIndex = 10;

    // policy step inside initialize.
    /**
     * How many frames the merge tally scale pulse currently runs.
     * @type {number}
     // policy step inside initialize.
     */
    this._j._popups._mergePulseTotalFrames = 10;

    // policy step inside initialize.
    /**
     * The baseline duration of a normal merge pulse.
     * @type {number}
     */
    this._j._popups._mergePulseBaseFrames = 10;

    // policy step inside initialize.
    /**
     * The number of frames to hold the current merge pulse at peak scale before easing down.
     * @type {number}
     */
    this._j._popups._mergePulseHoldFrames = 0;

    // policy step inside initialize.
    /**
     * The current peak scale for the active merge pulse.
     *
     * Normal additions use a subtle bump, while notable additions such as critical
     * contributions can momentarily push this higher for stronger visual feedback.
     * @type {number}
     */
    this._j._popups._mergePulsePeakScale = 1.33;

    // policy step inside initialize.
    /**
     * The maximum alpha for the transient merge pulse flash.
     * @type {number}
     */
    this._j._popups._mergePulseFlashMaxAlpha = 0;

    // policy step inside initialize.
    /**
     * The current alpha for the transient merge pulse flash.
     * @type {number}
     */
    this._j._popups._mergePulseFlashAlpha = 0;
  }

  /**
   * Mirrors {@link Sprite_Damage.prototype.update} but skips the duration countdown while accumulating.
   *
   * Vanilla damage sprites always decrement {@link Sprite_Damage#_duration}; if we only gate motion in
   * {@link Sprite_MapDamage.prototype.updateChild}, the popup still expires, {@link Sprite_Damage.prototype.isPlaying}
   * returns false, and {@link Sprite_Character.prototype._removeTrackedPopSprite} destroys the sprite early.
   * {@link JABS_PopupMergeController} then keeps a dead reference and combo-flush hits {@link Sprite.prototype.destroy}
   * twice (PIXI tears down listeners that are already null).
   */
  update()
  {
    Sprite.prototype.update.call(this);

    // when this._duration > 0, take this branch.
    if (this._duration > 0)
    {
      if (this._j._popups._mapAccumulatePhase !== true)
      {
        this._duration--;
      }

      // iterate the loop counter until the guard exits.
      for (let i = 0; i < this.children.length; i++)
      {
        this.updateChild(this.children[i]);
      }
    }

    // policy step inside update.
    this.updateFlash();
    this.updateOpacity();

    // policy step inside update.
    this.updateMergeCombinePulse();
  }

  /**
   * Eases root scale after {@link #refreshDisplayedValue} so combined totals read as a pulse, not a silent swap.
   */
  updateMergeCombinePulse()
  {
    const idx = this._j._popups._mergePulseFrameIndex;
    const total = this._j._popups._mergePulseTotalFrames;
    const holdFrames = this._j._popups._mergePulseHoldFrames;

    // when idx >= total, take this branch.
    if (idx >= total)
    {
      this.scale.x = 1;
      this.scale.y = 1;
      this._j._popups._mergePulseFlashAlpha = 0;

      // exit early without a payload.
      return;
    }

    // capture peak for downstream policy in this routine.
    const peak = this._j._popups._mergePulsePeakScale;
    let scale = peak;

    // once the hold phase ends, ease the pulse back down to normal size.
    if (idx >= holdFrames)
    {
      const decayFrames = Math.max(total - holdFrames, 1);
      const decayIndex = idx - holdFrames;
      const decayRatio = Math.min(decayIndex / decayFrames, 1);
      const easedRatio = Math.cos((Math.PI / 2) * decayRatio);
      scale = 1 + (peak - 1) * easedRatio;
    }

    // fade the pulse flash over the full pulse lifetime so crit additions flare, then cool.
    const flashMaxAlpha = this._j._popups._mergePulseFlashMaxAlpha;
    if (flashMaxAlpha > 0)
    {
      const fadeRatio = 1 - (idx / Math.max(total, 1));
      this._j._popups._mergePulseFlashAlpha = Math.round(flashMaxAlpha * fadeRatio);
    }
    else
    {
      this._j._popups._mergePulseFlashAlpha = 0;
    }

    // policy step inside update merge combine pulse.
    this.scale.x = scale;
    this.scale.y = scale;
    this._j._popups._mergePulseFrameIndex = idx + 1;
  }

  /**
   * Restarts the combine pulse when a merge refresh lands (stacking hits, slip ticks, mitigation counts).
   *
   * @param {boolean} largePulse Whether or not this pulse should be exaggerated.
   */
  kickMergeCombinePulse(largePulse = false)
  {
    // shorthand the baseline frame count so crit pulses can stretch the same curve longer.
    const baseFrames = this._j._popups._mergePulseBaseFrames;

    // a critical contribution should read more loudly than an ordinary merge bump.
    this._j._popups._mergePulsePeakScale = largePulse
      ? 1.90
      : 1.33;

    // critical contributions should linger longer so the eye catches them more reliably.
    this._j._popups._mergePulseTotalFrames = largePulse
      ? baseFrames * 3
      : baseFrames;

    // crit contributions should sit on the peak briefly before shrinking back down.
    this._j._popups._mergePulseHoldFrames = largePulse
      ? 6
      : 0;

    // only critical contributions get the extra flash accent.
    this._j._popups._mergePulseFlashMaxAlpha = largePulse
      ? 192
      : 0;

    // policy step inside kick merge combine pulse.
    this._j._popups._mergePulseFrameIndex = 0;
  }

  /**
   * Ends the accumulation phase and allows normal bounce / flyaway motion to run.
   */
  releaseAccumulatePhase()
  {
    this._j._popups._mapAccumulatePhase = false;

    // capture base duration for downstream policy in this routine.
    const baseDuration = J.POPUPS.Layout.BaseDuration;

    // when this._duration < baseDuration, take this branch.
    if (this._duration < baseDuration)
    {
      this._duration = baseDuration;
    }
  }

  /**
   * Refreshes the primary value line without rebuilding icon geometry from scratch.
   *
   * @param {string} valueString The new display string (digits or mitigation label).
   * @param {boolean} largePulse Whether or not this refresh should use an exaggerated combine pulse.
   */
  refreshDisplayedValue(valueString, largePulse = false)
  {
    let healingPopup = false;

    // when this._j._popups._sourcePopup  and  this._j._popups._sourcePopup.heali..., take this branch.
    if (this._j._popups._sourcePopup && this._j._popups._sourcePopup.healing === true)
    {
      healingPopup = true;
    }

    // capture display string for downstream policy in this routine.
    const displayString = PopupNumericDisplay.formatNumericPopupDisplayString(valueString, healingPopup);

    // when this._j._popups._sourcePopup, take this branch.
    if (this._j._popups._sourcePopup)
    {
      this._j._popups._sourcePopup.value = displayString;
    }

    // capture icon ref for downstream policy in this routine.
    const iconRef = this._j._popups._iconSprite;

    // capture text sprite for downstream policy in this routine.
    const textSprite = this.children.find(child =>
      child !== iconRef && child.bitmap && child.bitmap.width === J.POPUPS.Layout.ValueBitmapWidth);

    // when not textSprite  or  not textSprite.bitmap, take this branch.
    if (!textSprite || !textSprite.bitmap)
    {
      return;
    }

    // capture w for downstream policy in this routine.
    const w = J.POPUPS.Layout.ValueBitmapWidth;
    const h = this.fontSize();

    // policy step inside refresh displayed value.
    textSprite.bitmap.clear();

    // capture font size for downstream policy in this routine.
    let fontSize = 20;

    // when this._j._popups._isCritical, take this branch.
    if (this._j._popups._isCritical)
    {
      fontSize += 12;
      textSprite.bitmap.fontBold = true;
    }
    else
    {
      const accent = this._j._popups._textAccent;

      // mitigation labels (parry/evade/miss) render smaller and italic.
      const accentSmallItalic = accent === 'miss' || accent === 'evade' || accent === 'parry';
      const legacyItalic = displayString.includes('Missed')
        || displayString.includes('Evaded')
        || displayString.includes('Parry');

      // when accentSmallItalic  or  legacyItalic, take this branch.
      if (accentSmallItalic || legacyItalic)
      {
        fontSize -= 6;
        textSprite.bitmap.fontItalic = true;
      }

      // glancing blows are italic at normal size; the grey color handles the visual distinction.
      if (accent === 'glance')
      {
        textSprite.bitmap.fontItalic = true;
      }
    }

    // policy step inside refresh displayed value.
    textSprite.bitmap.fontSize = fontSize;
    textSprite.bitmap.drawText(displayString, 0, 0, w, h, 'center');

    // policy step inside refresh displayed value.
    this.repositionChildren();
    this.kickMergeCombinePulse(largePulse);
  }

  /**
   * Gates motion during accumulation so numbers stay readable on the target.
   *
   * @param {Sprite} sprite Child motion sprite from {@link Sprite_Damage#createChildSprite}.
   */
  updateChild(sprite)
  {
    if (this._j._popups._mapAccumulatePhase === true)
    {
      const mergePulseFlashAlpha = this._j._popups._mergePulseFlashAlpha;
      if (mergePulseFlashAlpha > 0)
      {
        sprite.setBlendColor([ 255, 64, 64, mergePulseFlashAlpha ]);
      }
      else
      {
        sprite.setBlendColor(this._flashColor);
      }

      // exit early without a payload.
      return;
    }

    // policy step inside update child.
    super.updateChild(sprite);
  }
}

export default Sprite_MapDamage;
//endregion Sprite_MapDamage