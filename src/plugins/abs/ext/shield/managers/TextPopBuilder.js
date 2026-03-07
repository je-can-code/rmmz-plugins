//region TextPopBuilder
if (J.POPUPS)
{
  /**
   * Add some convenient defaults for configuring a shield damage popup.
   * @returns {TextPopBuilder}
   */
  TextPopBuilder.prototype.isShieldDamage = function()
  {
    // set the popup type to be experience.
    this.setPopupType(Map_TextPop.Types.Shield);

    // randomize the variance a bit.
    this.setXVariance(0);
    this.setYVariance(64);

    // set the text color to be metallic grey.
    this.setTextColorIndex(8);

    // set the icon index to a shield icon.
    this.setIconIndex(448);

    // return this for fluent chaining.
    return this;
  };

  /**
   * Add some convenient defaults for configuring a shield break popup.
   * @returns {TextPopBuilder}
   */
  TextPopBuilder.prototype.isShieldBreak = function()
  {
    // set the popup type to be experience.
    this.setPopupType(Map_TextPop.Types.Shield);

    // randomize the variance a bit.
    this.setXVariance(20);
    this.setYVariance(64);

    // set the text color to be metallic grey.
    this.setTextColorIndex(7);

    // set the icon index to an X icon.
    this.setIconIndex(448);

    // return this for fluent chaining.
    return this;
  };
}
//endregion TextPopBuilder