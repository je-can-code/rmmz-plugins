//region ApTypeGrant
import ApTypeKey from './ApTypeKey.js';

/**
 * Represents a typed AP grant consisting of a `domain`, an `id`, and an `amount`.
 * Used for explicit typed AP reward lines parsed off enemies.
 */
class ApTypeGrant
{
  /**
   * The amount of AP to grant (pre- or post-scaling depending on usage site).
   * @type {number}
   */
  amount = 0;

  /**
   * The normalized domain name for this grant.
   * @type {string}
   */
  domain = String.empty;

  /**
   * The numeric id within the domain.
   * @type {number}
   */
  id = 0;

  /**
   * Constructs a new typed AP grant.
   * @param {number} amount - The amount of AP granted.
   * @param {string} domain - The domain name (normalized lowercase recommended).
   * @param {number} id - The numeric id within the domain.
   */
  constructor(amount, domain, id)
  {
    // set the amount to grant.
    this.amount = Number(amount);

    // normalize and assign the domain key.
    this.domain = String(domain).trim().toLowerCase();

    // coerce and assign the id.
    this.id = Number(id);
  }

  /**
   * Creates a key model from this grant’s identity for matching teachables.
   * @returns {ApTypeKey} - The domain+id key.
   */
  toKey()
  {
    // build a key from this grant's domain and id.
    return new ApTypeKey(this.domain, this.id);
  }
}
export default ApTypeGrant;
//endregion ApTypeGrant