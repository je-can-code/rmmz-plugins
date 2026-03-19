//region AptitudeTeachable
/**
 * Sets the AP type key for this teachable.
 * @param {ApTypeKey} apTypeKey - The AP type key to set.
 */
AptitudeTeachable.prototype.setApTypeKey = function(apTypeKey)
{
  /**
   * The AP type key for this teachable.
   * @type {ApTypeKey} apTypeKey - The AP type key to set.
   */
  this.apType = apTypeKey;
};

/**
 * Gets the AP type key for this teachable.
 * @returns {ApTypeKey} The AP type key.
 */
AptitudeTeachable.prototype.apTypeKey = function()
{
  return this.apType;
};

/**
 * Determines if this teachable is typed.
 * @returns {boolean}
 */
AptitudeTeachable.prototype.isTyped = function()
{
  return this.apType !== undefined;
};
//endregion AptitudeTeachable