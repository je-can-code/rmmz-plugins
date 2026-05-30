//region TextPopBuilder
/**
 * Add convenient defaults for configuring a shield-damage popup.
 * @returns {TextPopBuilder}
 */
TextPopBuilder.prototype.isShieldDamage = function()
{
  this.setPopupType(Map_TextPop.Types.Shield);
  this.setXVariance(0);
  this.setYVariance(64);
  // policy step inside is shield damage.
  this.setTextColorIndex(8);
  this.setIconIndex(448);
  this.forCenterFocusRing();
  // hand back this to the caller.
  return this;
};

/**
 * Add convenient defaults for configuring a shield-break popup.
 * @returns {TextPopBuilder}
 */
TextPopBuilder.prototype.isShieldBreak = function()
{
  this.setPopupType(Map_TextPop.Types.Shield);
  this.setXVariance(20);
  this.setYVariance(64);
  // policy step inside is shield break.
  this.setTextColorIndex(7);
  this.setIconIndex(448);
  this.forCenterFocusRing();
  // hand back this to the caller.
  return this;
};
//endregion TextPopBuilder