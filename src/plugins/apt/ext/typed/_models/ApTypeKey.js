//region ApTypeKey
class ApTypeKey
{
  /**
   * The types available for domain on a typed AP teachable.
   * @type {{Element: string, Weapon: string, Skill: string}}
   */
  static DomainType = {
    Element: 'element',
    Weapon: 'weapontype',
    Skill: 'skilltype',
  }

  //region properties
  /**
   * The domain of the key.
   * @type {string}
   */
  domain = String.empty;

  /**
   * The id of the key.
   * @type {number}
   */
  id = 0;

  //endregion properties

  //region init
  /**
   * Constructor.
   * @param {string} domain The domain of the key.
   * @param {number} id The id of the key.
   */
  constructor(domain, id)
  {
    this.domain = String(domain);
    this.id = Number(id);
  }

  //endregion init

  /**
   * Determines equality with another key by domain+id.
   * @param {ApTypeKey} other - The other key to compare against.
   * @returns {boolean} - True when both domain and id match.
   */
  equals(other)
  {
    return this.domain === other.domain && this.id === other.id;
  }
}

export default ApTypeKey;