//region TextPopBuilder
/**
 * Add convenient defaults for configuring an AP-gain popup.
 * @returns {TextPopBuilder}
 */
TextPopBuilder.prototype.isAptitude = function()
{
  this.setPopupType(Map_TextPop.Types.Ap);
  this.setTextColorIndex(17);
  this.setIconIndex(86);
  // policy step inside is aptitude.
  this.forRewardUpRing();
  return this;
};
//endregion TextPopBuilder