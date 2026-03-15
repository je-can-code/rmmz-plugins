if (J.POPUPS)
{
  /**
   * Add some convenient defaults for configuring AP points popups.
   * @returns {TextPopBuilder} The builder, for fluent chaining.
   */
  TextPopBuilder.prototype.isAptitude = function()
  {
    // set the popup type to be an AP point acquisition.
    this.setPopupType(Map_TextPop.Types.Ap);

    // set the text color to be lovely pink.
    this.setTextColorIndex(17);

    // set the icon index to the learned skill's icon.
    this.setIconIndex(86);

    // add no x variance when working with AP points.
    this.setXVariance(48);

    // add some y variance when working with AP points.
    this.setYVariance(96);

    // return the builder for fluent chaining.
    return this;
  };
}