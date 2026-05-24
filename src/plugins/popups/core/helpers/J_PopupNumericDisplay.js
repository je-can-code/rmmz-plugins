//region J_PopupNumericDisplay
import TextPopBuilder from './../_models/TextPopBuilder.js';
/**
 * Strips IEEE-754 dust from purely numeric popup labels immediately before bitmap draw.
 *
 * Floating merges (strike totals, slip ticks, …) can accumulate tiny fractional error in JS.
 * Mitigation stacks, item names, and other letter-bearing labels must pass through untouched.
 *
 * @param {string|number} raw Value for {@link Sprite_Damage#createValue} or
 * {@link Sprite_MapDamage#refreshDisplayedValue}.
 * @param {boolean} [isHealingPopup] When true ( {@link Map_TextPop#healing} ), show regen/heal as `+N`
 * using absolute magnitude — merge refreshes bypass {@link TextPopBuilder#makePopupValue}'s minus strip.
 * @returns {string} Rounded integer text for numeric payloads; prose returns verbatim.
 */
J.POPUPS.formatNumericPopupDisplayString = function(raw, isHealingPopup)
{
  const text = raw === undefined || raw === null ? '' : String(raw);
  const trimmed = text.trim();

  if (trimmed.length === 0)
  {
    return text;
  }

  // Anything beyond a signed decimal literal is intentional prose (e.g. PARRY x3, item titles).
  if (/^[.\d-]+$/.test(trimmed) === false)
  {
    return text;
  }

  const n = Number(trimmed);

  if (!Number.isFinite(n))
  {
    return text;
  }

  const rounded = Math.round(n);

  if (isHealingPopup === true)
  {
    return `+${Math.abs(rounded)}`;
  }

  return String(rounded);
};
//endregion J_PopupNumericDisplay