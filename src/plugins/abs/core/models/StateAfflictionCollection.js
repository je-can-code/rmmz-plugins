//region StateAfflictionCollection
/**
 * A typed collection of negative and positive affliction view models.
 */
class StateAfflictionCollection
{
  /**
   * Negative affliction rows.
   * @type {StateAfflictionViewModel[]}
   */
  negative = [];

  /**
   * Positive affliction rows.
   * @type {StateAfflictionViewModel[]}
   */
  positive = [];

  /**
   * Returns every active affliction row in polarity order.
   * @returns {StateAfflictionViewModel[]}
   */
  allActive()
  {
    return [...this.negative, ...this.positive];
  }

  /**
   * Whether this collection has no rows to render.
   * @returns {boolean}
   */
  isEmpty()
  {
    if (this.negative.length > 0)
    {
      return false;
    }

    if (this.positive.length > 0)
    {
      return false;
    }

    return true;
  }
}

export default StateAfflictionCollection;
//endregion StateAfflictionCollection