//region PopupResourceDisplayColor

/**
 * Resolves combat resource popup fill and outline colors for JABS map streams.
 */
class PopupResourceDisplayColor
{
  /**
   * How much of the heal gauge tint bleeds into harm popups (remainder is white).
   * @type {number}
   */
  static HarmHealTintWeight = 0.32;

  /**
   * How much resource hue bleeds into harm outline colors (remainder is black).
   * @type {number}
   */
  static HarmOutlineResourceTintWeight = 0.4;

  /**
   * Resolves the bitmap fill color for a popup digit line.
   *
   * Harm HP stays white (classic RPG damage). Harm MP/TP pick up pale tints of their heal gauge colors.
   * Healing and non-resource pops keep the windowskin index from {@link Map_TextPop#textColorIndex}.
   *
   * @param {Map_TextPop|null|undefined} sourcePopup Live popup model on the sprite, when available.
   * @param {number} textColorIndex Fallback windowskin index from {@link TextPopBuilder}.
   * @returns {string} CSS color string for {@link Bitmap#textColor}.
   */
  static resolvePopupFillColor(sourcePopup, textColorIndex)
  {
    if (!sourcePopup || sourcePopup.healing === true)
    {
      return ColorManager.textColor(textColorIndex);
    }

    switch (sourcePopup.popupType)
    {
      case Map_TextPop.Types.HpDamage:
        return ColorManager.normalColor();
      case Map_TextPop.Types.MpDamage:
        return PopupResourceDisplayColor.tintWhiteToward(
          ColorManager.mpGaugeColor2(),
          PopupResourceDisplayColor.HarmHealTintWeight,
        );
      case Map_TextPop.Types.TpDamage:
        return PopupResourceDisplayColor.tintWhiteToward(
          ColorManager.tpGaugeColor2(),
          PopupResourceDisplayColor.HarmHealTintWeight,
        );
      default:
        return ColorManager.textColor(textColorIndex);
    }
  }

  /**
   * Darkens a heal gauge color toward black so harm outlines echo the same resource family.
   *
   * @param {Map_TextPop|null|undefined} sourcePopup Live popup model on the sprite, when available.
   * @returns {string} CSS color string for {@link Bitmap#outlineColor}.
   */
  static resolvePopupOutlineColor(sourcePopup)
  {
    if (!sourcePopup)
    {
      return 'rgba(0, 0, 0, 0.7)';
    }

    const gaugeColor = PopupResourceDisplayColor.resolveResourceGaugeColor(sourcePopup.popupType);

    if (!gaugeColor)
    {
      return 'rgba(0, 0, 0, 0.7)';
    }

    return PopupResourceDisplayColor.tintBlackToward(
      gaugeColor,
      PopupResourceDisplayColor.HarmOutlineResourceTintWeight,
    );
  }

  /**
   * Outline width for map resource pops; harm uses the slimmer stroke.
   *
   * @param {Map_TextPop|null|undefined} sourcePopup Live popup model on the sprite, when available.
   * @param {boolean} isDamagePopup Whether {@link Sprite_Damage#isDamage} is true for this sprite.
   * @returns {number}
   */
  static resolvePopupOutlineWidth(sourcePopup, isDamagePopup)
  {
    const gaugeColor = sourcePopup
      ? PopupResourceDisplayColor.resolveResourceGaugeColor(sourcePopup.popupType)
      : null;

    if (gaugeColor)
    {
      if (sourcePopup.healing === true)
      {
        return J.POPUPS.EXT.ABS.Metadata.healingOutlineWidth;
      }

      if (isDamagePopup === true)
      {
        return J.POPUPS.EXT.ABS.Metadata.damageOutlineWidth;
      }
    }

    return 4;
  }

  /**
   * @param {Map_TextPop.Types} popupType Resource lane for the popup.
   * @returns {string|null}
   */
  static resolveResourceGaugeColor(popupType)
  {
    switch (popupType)
    {
      case Map_TextPop.Types.HpDamage:
        return ColorManager.hpGaugeColor2();
      case Map_TextPop.Types.MpDamage:
        return ColorManager.mpGaugeColor2();
      case Map_TextPop.Types.TpDamage:
        return ColorManager.tpGaugeColor2();
      default:
        return null;
    }
  }

  /**
   * Lightens a heal gauge color toward white so harm pops read as the same resource family.
   *
   * @param {string} color CSS color from {@link ColorManager}.
   * @param {number} colorWeight Share of the source color (0 = white, 1 = unchanged).
   * @returns {string}
   */
  static tintWhiteToward(color, colorWeight)
  {
    const rgb = PopupResourceDisplayColor.parseCssColor(color);
    const whiteWeight = 1 - colorWeight;
    const r = Math.round((rgb.r * colorWeight) + (255 * whiteWeight));
    const g = Math.round((rgb.g * colorWeight) + (255 * whiteWeight));
    const b = Math.round((rgb.b * colorWeight) + (255 * whiteWeight));

    return `rgb(${r}, ${g}, ${b})`;
  }

  /**
   * Darkens a heal gauge color toward black for resource-tuned popup outlines.
   *
   * @param {string} color CSS color from {@link ColorManager}.
   * @param {number} colorWeight Share of the source color (0 = black, 1 = unchanged).
   * @returns {string}
   */
  static tintBlackToward(color, colorWeight)
  {
    const rgb = PopupResourceDisplayColor.parseCssColor(color);
    const r = Math.round(rgb.r * colorWeight);
    const g = Math.round(rgb.g * colorWeight);
    const b = Math.round(rgb.b * colorWeight);

    return `rgb(${r}, ${g}, ${b})`;
  }

  /**
   * Parses `#rrggbb` or `rgb(r,g,b)` into channel components.
   *
   * @param {string} color CSS color string.
   * @returns {{ r: number, g: number, b: number }}
   */
  static parseCssColor(color)
  {
    if (typeof color === 'string' && color.startsWith('#') && color.length >= 7)
    {
      return {
        r: parseInt(color.slice(1, 3), 16),
        g: parseInt(color.slice(3, 5), 16),
        b: parseInt(color.slice(5, 7), 16),
      };
    }

    const rgbMatch = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i.exec(color);

    if (rgbMatch)
    {
      return {
        r: Number(rgbMatch[1]),
        g: Number(rgbMatch[2]),
        b: Number(rgbMatch[3]),
      };
    }

    return { r: 255, g: 255, b: 255 };
  }
}

export default PopupResourceDisplayColor;
//endregion PopupResourceDisplayColor