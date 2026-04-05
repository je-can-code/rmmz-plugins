//region TextPopSpriteManager
/**
 * A builder class for converting text pops to sprites.
 */
class TextPopSpriteManager
{
  /**
   * Constructor.
   * A static class though, so don't construct it or you'll throw an error.
   */
  constructor()
  {
    throw new Error(`The TextPopSpriteManager is a static class. Just use the "convert()" function on it.`);
  }

  /**
   * Converts a `Map_TextPop` into a `Sprite_Damage`.
   * @param {Map_TextPop} popup The popup to convert.
   * @param {{ x?: number, y?: number }} ringExtra Extra offset from {@link J.POPUPS.consumeLayoutRingOffset}.
   * @returns {Sprite_Damage} The converted sprite.
   */
  static convert(popup, ringExtra = { x: 0, y: 0 })
  {
    // start by creating a blank damage sprite.
    const sprite = new Sprite_Damage();

    const rx = ringExtra.x || 0;
    const ry = ringExtra.y || 0;

    // add the x variance to the x coordinate for the base sprite.
    sprite.setXVariance(popup.coordinateVariance[0] + rx);

    // add the y variance to the y coordinate for the base sprite.
    sprite.setYVariance(popup.coordinateVariance[1] + ry);

    // check if there is an iconIndex present.
    if (popup.iconIndex > -1)
    {
      // add the found icon to the sprite
      sprite.addIcon(popup.iconIndex);
    }

    // add duration bonus onto sprite.
    sprite.addDuration(this.#getDurationByPopupType(popup.popupType));

    // set the healing flag to be what the popup designates.
    sprite.setHealingFlag(popup.healing);

    // designate whether or not its a damage popup.
    sprite.setDamageFlag(this.#isDamageFlagByPopupType(popup.popupType));

    // set the color of the damage for the sprite.
    sprite.setDamageColor(popup.textColorIndex);

    // check if the popup was actually a critical skill usage.
    if (popup.critical)
    {
      // apply the fancy critical effects, such as flash color and duration.
      sprite.setupCriticalEffect();
    }

    sprite._j._popups._textAccent = popup.textAccent || null;
    sprite._j._popups._sourcePopup = popup;

    sprite.createValue(popup.value);

    // reposition children if both icon and text exist.
    sprite.repositionChildren();

    // return the constructed sprite for the popup.
    return sprite;
  }

  /**
   * Gets the bonus duration based on the type of popup this is.
   * @param {Map_TextPop.Types} popupType The type of popup this is.
   * @returns {number} The bonus duration for this type.
   */
  static #getDurationByPopupType(popupType)
  {
    switch (popupType)
    {
      case Map_TextPop.Types.HpDamage:
      case Map_TextPop.Types.MpDamage:
      case Map_TextPop.Types.TpDamage:
        return 30;
      case Map_TextPop.Types.Experience:
      case Map_TextPop.Types.Gold:
      case Map_TextPop.Types.Sdp:
      case Map_TextPop.Types.Item:
        return 120;
      case Map_TextPop.Types.Learn:
        return 120;
      case Map_TextPop.Types.Levelup:
        return 180;
      case Map_TextPop.Types.Parry:
      case Map_TextPop.Types.SkillUsage:
      case Map_TextPop.Types.Slip:
        return 0;
      default:
        return 0;
    }
  }

  /**
   * Checks whether or not the popup type is damage.
   * @param {Map_TextPop.Types} popupType The type of popup this is.
   * @returns {boolean} True if it is damage, false otherwise.
   */
  static #isDamageFlagByPopupType(popupType)
  {
    switch (popupType)
    {
      case Map_TextPop.Types.HpDamage:
      case Map_TextPop.Types.MpDamage:
      case Map_TextPop.Types.TpDamage:
        return true;
      default:
        return false;
    }
  }
}

//endregion TextPopSpriteManager