//region JABS_AllyAIMode
/**
 * The structure for a single ally AI mode in the context of a JABS ally.
 */
class JABS_AllyAIMode
{
  /**
   * The key of this ally AI mode.
   * @type {string}
   */
  key = String.empty;

  /**
   * The human-readable name for this ally AI mode.
   * @type {string}
   */
  name = String.empty;

  /**
   * The potentially multi-line description for this ally AI mode.
   * @type {string}
   */
  description = String.empty;

  /**
   * Constructor.
   * @param key
   * @param name
   * @param description
   */
  constructor(key, name, description)
  {
    this.key = key;
    this.name = name;
    this.description = description;
  }
}

//endregion JABS_AllyAIMode