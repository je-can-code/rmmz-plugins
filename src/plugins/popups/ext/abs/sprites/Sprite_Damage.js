//region Sprite_Damage
import PopupResourceDisplayColor from './../helpers/PopupResourceDisplayColor.js';

/**
 * Extends {@link #damageColor}.<br/>
 * Combat resource harm/heal fills use ABS readability tints.
 */
J.POPUPS.EXT.ABS.Aliased.Sprite_Damage.set('damageColor', Sprite_Damage.prototype.damageColor);
Sprite_Damage.prototype.damageColor = function()
{
  return PopupResourceDisplayColor.resolvePopupFillColor(
    this._j._popups._sourcePopup,
    this._j._popups._damageColor,
  );
};

/**
 * Extends {@link #outlineColor}.<br/>
 * Resource HP/MP/TP pops use a black-ish tint of their gauge hue.
 */
J.POPUPS.EXT.ABS.Aliased.Sprite_Damage.set('outlineColor', Sprite_Damage.prototype.outlineColor);
Sprite_Damage.prototype.outlineColor = function()
{
  return PopupResourceDisplayColor.resolvePopupOutlineColor(this._j._popups._sourcePopup);
};

/**
 * Extends {@link #outlineWidth}.<br/>
 * Harm resource damage uses a slimmer outline than vanilla battle pops.
 */
J.POPUPS.EXT.ABS.Aliased.Sprite_Damage.set('outlineWidth', Sprite_Damage.prototype.outlineWidth);
Sprite_Damage.prototype.outlineWidth = function()
{
  return PopupResourceDisplayColor.resolvePopupOutlineWidth(
    this._j._popups._sourcePopup,
    this.isDamage(),
  );
};
//endregion Sprite_Damage