//region plugin metadata
import KnowledgeExchange from '../__models/KnowledgeExchange.js';
import KnowledgeTag from '../__models/KnowledgeTag.js';

/**
 * The metadata for the knowledge extension of J-Proficiency.
 *
 * Everything this plugin knows about what knowledge *is* comes out of configuration. The three blocks it
 * reads all live in `config.proficiency.json` alongside the conditionals rather than in a file of their
 * own, the same way J-ABS-Boss reads its encounters out of `config.jabs.json`- one file per plugin family
 * keeps the editor's boards mapping one-to-one onto config files.
 *
 * None of the parse helpers below may be `#private`. The whole chain runs out of {@link PluginMetadata}'s
 * constructor by way of `postInitialize`, and a derived class installs its private members only after
 * `super()` returns- so a private helper does not exist yet at the moment this runs, and touching one
 * throws before the game finishes booting.
 */
class J_KnowledgePluginMetadata
  extends PluginMetadata
{
  /**
   * Constructor.
   * @param {string} name The name of this plugin.
   * @param {string} version The version of this plugin.
   */
  constructor(name, version)
  {
    super(name, version);
  }

  /**
   * Extends {@link #postInitialize}.<br/>
   * Also reads the knowledge configuration out of the proficiency config's root.
   */
  postInitialize()
  {
    // perform original logic.
    super.postInitialize();

    // initialize this plugin from configuration.
    this.initializeKnowledge();
  }

  /**
   * Reads every knowledge tag, skill type mapping and exchange out of configuration.
   *
   * J-Proficiency guarantees the parsed root is on its metadata by the time extensions postInitialize().
   * All three blocks are optional: a game that installs this plugin before authoring anything simply has
   * no tags, and therefore grants nothing to nobody, which is the correct behavior rather than a crash.
   */
  initializeKnowledge()
  {
    const externalConfig = J.PROF.Metadata.ExternalConfig;

    const rawTags = externalConfig.knowledgeTags ?? [];
    const rawMapping = externalConfig.skillTypeMapping ?? {};
    const rawExchanges = externalConfig.knowledgeExchanges ?? [];

    /**
     * Every kind of knowledge this game defines.
     * @type {KnowledgeTag[]}
     */
    this.tags = this.parseTags(rawTags);

    /**
     * A map of tagKey:tag, for resolving a tag by the key everything else refers to it by.
     * @type {Map<string, KnowledgeTag>}
     */
    this.tagsMap = new Map(this.tags.map(tag => [ tag.key, tag ]));

    /**
     * A map of skill type id:tagKey[], describing which kinds of knowledge a skill's use produces.
     * @type {Map<number, string[]>}
     */
    this.skillTypeMapping = this.parseSkillTypeMapping(rawMapping);

    /**
     * Every standing offer to convert knowledge into something from the database.
     * @type {KnowledgeExchange[]}
     */
    this.exchanges = this.parseExchanges(rawExchanges);

    /**
     * A map of exchangeKey:exchange, for resolving an offer by the key a caller names it by.
     * @type {Map<string, KnowledgeExchange>}
     */
    this.exchangesMap = new Map(this.exchanges.map(exchange => [ exchange.key, exchange ]));
  }

  /**
   * Builds every knowledge tag out of its raw configuration.
   * @param {any[]} rawTags The unparsed tags from configuration.
   * @returns {KnowledgeTag[]}
   */
  parseTags(rawTags)
  {
    const tagMapper = rawTag => new KnowledgeTag(rawTag.key, rawTag.name, rawTag.iconIndex, rawTag.description);

    return rawTags.map(tagMapper, this);
  }

  /**
   * Builds the skill type mapping out of its raw configuration.
   *
   * The keys arrive as strings because they are JSON object keys, and are converted to numbers so that a
   * skill's `stypeId` can be looked up without the caller stringifying it first.
   * @param {Object<string, string[]>} rawMapping The unparsed mapping from configuration.
   * @returns {Map<number, string[]>}
   */
  parseSkillTypeMapping(rawMapping)
  {
    const mapping = new Map();

    Object.keys(rawMapping)
      .forEach(rawSkillTypeId =>
      {
        const tagKeys = rawMapping[rawSkillTypeId];

        // a mapping pointing at a tag nobody defined would silently grant nothing forever.
        tagKeys.forEach(tagKey => this.assertTagIsDefined(tagKey, `skill type ${rawSkillTypeId}`));

        const skillTypeId = parseInt(rawSkillTypeId, 10);

        mapping.set(skillTypeId, tagKeys);
      });

    return mapping;
  }

  /**
   * Builds every exchange out of its raw configuration.
   * @param {any[]} rawExchanges The unparsed exchanges from configuration.
   * @returns {KnowledgeExchange[]}
   */
  parseExchanges(rawExchanges)
  {
    const exchangeMapper = rawExchange =>
    {
      const { key, tagKey, cost, output } = rawExchange;

      // an exchange spending a tag nobody defined can never be satisfied.
      this.assertTagIsDefined(tagKey, `exchange '${key}'`);

      return new KnowledgeExchange(key, tagKey, cost, output.type, output.id, output.count);
    };

    return rawExchanges.map(exchangeMapper, this);
  }

  /**
   * Throws when configuration refers to a knowledge tag that was never defined.
   *
   * This is an authoring mistake that produces no symptom at runtime- the knowledge simply never accrues,
   * or the exchange is never affordable- so it is caught while the config is being read instead.
   * @param {string} tagKey The tag key being referred to.
   * @param {string} referrer A description of what refers to it, for the error message.
   */
  assertTagIsDefined(tagKey, referrer)
  {
    if (this.tagsMap.has(tagKey)) return;

    throw new Error(`${referrer} names the knowledge tag '${tagKey}', which is not defined in knowledgeTags.`);
  }

  /**
   * The kinds of knowledge that using a given skill produces.
   *
   * A skill type absent from the mapping produces nothing, which is what makes the whole roster of
   * passives, tool skills and item skills need no exclusion list- and makes a skill type added later
   * fail closed rather than leaking into a pool nobody chose.
   * @param {number} skillId The id of the skill that was used.
   * @returns {string[]}
   */
  tagKeysForSkillId(skillId)
  {
    const skill = $dataSkills.at(skillId);

    const { stypeId } = skill;

    if (this.skillTypeMapping.has(stypeId) === false) return Array.empty;

    return this.skillTypeMapping.get(stypeId);
  }

  /**
   * The exchange a caller named.
   *
   * An unknown key is an authoring mistake in an event, and silently doing nothing would look exactly
   * like an empty wallet- so it says so instead.
   * @param {string} exchangeKey The key of the exchange being resolved.
   * @returns {KnowledgeExchange}
   */
  exchangeByKey(exchangeKey)
  {
    if (this.exchangesMap.has(exchangeKey) === false)
    {
      throw new Error(`there is no knowledge exchange with the key of '${exchangeKey}'.`);
    }

    return this.exchangesMap.get(exchangeKey);
  }
}

export default J_KnowledgePluginMetadata;
//endregion plugin metadata