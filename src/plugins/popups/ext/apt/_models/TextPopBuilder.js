//region TextPopBuilder
/**
 * Add convenient defaults for configuring an AP-gain popup.
 * @returns {TextPopBuilder}
 */
TextPopBuilder.prototype.isAptitude = function()
{
  this.setPopupType(Map_TextPop.Types.Ap);
  this.setTextColorIndex(17);
  this.setIconIndex(IconManager.apPoints());
  this.forRewardUpRing();
  return this;
};
//endregion TextPopBuilder