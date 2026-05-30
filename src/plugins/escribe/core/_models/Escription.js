//region Escription
/**
 * A single "describe" class which contains various data to describe this event on the map.
 */
class Escription
{
  /**
   * Initializes the data about the event's describe.
   * @param {string} text The text to show on this event.
   * @param {number} iconIndex The index of the icon to show on this event.
   * @param {number} proximityTextRange The distance required for the describe text to be visible.
   * @param {number} proximityIconRange The distance required for the describe icon to be visible.
   */
  constructor(text, iconIndex, proximityTextRange, proximityIconRange)
  {
    this._text = text;
    this._iconIndex = iconIndex;
    this._proximityText = proximityTextRange;
    // store  proximity icon on the instance for later reads.
    this._proximityIcon = proximityIconRange;
  }

  /**
   * Gets the text associated with this describe.
   * @returns {string}
   */
  text()
  {
    return this._text;
  }

  /**
   * Gets the icon index associated with this describe.
   * @returns {number}
   */
  iconIndex()
  {
    return this._iconIndex;
  }

  /**
   * Gets the distance required for this describe text to be visible.
   * Returns -1 when there is no proximity requirement.
   * @returns {number}
   */
  proximityTextRange()
  {
    return this._proximityText;
  }

  /**
   * Gets the distance required for this describe icon to be visible.
   * Returns -1 when there is no proximity requirement.
   * @returns {number}
   */
  proximityIconRange()
  {
    return this._proximityIcon;
  }
}

export default Escription;
//endregion Escription