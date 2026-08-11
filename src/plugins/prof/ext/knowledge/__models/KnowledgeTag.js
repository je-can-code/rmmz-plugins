//region KnowledgeTag
/**
 * A single kind of knowledge the party can accumulate.
 *
 * A tag is nothing but a name for a balance. This plugin never knows what any particular tag *means*-
 * whether it represents offense, defense, or something a future game invents- because the tags are
 * authored in configuration and referenced only by key. That is what keeps the currency generic: adding
 * a new kind of knowledge is a config edit rather than a code change.
 *
 * Tags are built from configuration at boot and are never saved; the balances they name live on
 * {@link Game_Party}.
 */
class KnowledgeTag
{
  /**
   * The unique identifier for this tag, used everywhere a balance is read or written.
   * @type {string}
   */
  key = String.empty;

  /**
   * The player-facing name of this kind of knowledge.
   * @type {string}
   */
  name = String.empty;

  /**
   * The icon representing this kind of knowledge wherever it is displayed.
   * @type {number}
   */
  iconIndex = 0;

  /**
   * The flavor text describing what this kind of knowledge represents.
   * @type {string}
   */
  description = String.empty;

  /**
   * Constructor.
   * @param {string} key The unique identifier for this tag.
   * @param {string} name The player-facing name of this kind of knowledge.
   * @param {number} iconIndex The icon representing this kind of knowledge.
   * @param {string} description The flavor text describing this kind of knowledge.
   */
  constructor(key, name, iconIndex, description)
  {
    this.key = key;
    this.name = name;
    this.iconIndex = iconIndex;
    this.description = description;
  }
}

export default KnowledgeTag;
//endregion KnowledgeTag