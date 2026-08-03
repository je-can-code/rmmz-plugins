//region plugin metadata
import OmniQuest from '../__models/OmniQuest.js';

class J_QUEST_PluginMetadata
  extends PluginMetadata
{
  /**
   * The path where the config for quests is located.
   * @type {string}
   */
  static CONFIG_PATH = 'data/config.quest.json';

  /**
   * Constructor.
   */
  constructor(name, version)
  {
    super(name, version);
  }

  static classifyQuests(parsedBlob)
  {
    const parsedQuests = [];

    /** @param {OmniQuest} parsedQuest */
    const foreacher = parsedQuest =>
    {
      // validate the name is not one of the organizational names for the editor-only.
      const questName = parsedQuest.name;
      if (questName.startsWith('__')) return;
      if (questName.startsWith('==')) return;
      if (questName.startsWith('--')) return;

      const builtQuest = OmniQuest.Builder()
        .name(parsedQuest.name)
        .key(parsedQuest.key)
        .categoryKey(parsedQuest.categoryKey)
        .tagKeys(parsedQuest.tagKeys)
        .unknownHint(parsedQuest.unknownHint)
        .overview(parsedQuest.overview)
        .recommendedLevel(parsedQuest.recommendedLevel)
        .objectives(parsedQuest.objectives)
        .build();

      // Append the row to the working collection.
      parsedQuests.push(builtQuest);
    };

    parsedBlob.forEach(foreacher, this);

    return parsedQuests;
  }

  /**
   *  Extends {@link #postInitialize}.<br>
   *  Includes translation of plugin parameters.
   */
  postInitialize()
  {
    // execute original logic.
    super.postInitialize();

    // initialize the quests from plugin configuration.
    this.initializeQuests();

    // initialize this plugin from configuration.
    this.initializeMetadata();
  }

  initializeQuests()
  {
    const canLogLoadInfo = J_QUEST_PluginMetadata.#hasMinimumBaseVersion();
    const summarize = canLogLoadInfo
      ? result => [
        `- ${result.quests.length} quests`,
        `- ${result.categories.length} categories`,
        `- ${result.tags.length} tags`,
      ]
      : null;

    const options = ExternalJsonConfigLoaderOptions.Builder()
      .pluginName('J-Omni-Questopedia')
      .configName('quest configuration')
      .logSummary(summarize)
      .build();

    const parsedConfiguration = ExternalJsonConfigLoader.load(J_QUEST_PluginMetadata.CONFIG_PATH, options);

    const classifiedQuests = J_QUEST_PluginMetadata.classifyQuests(parsedConfiguration.quests);

    /**
     * A collection of all defined quests.
     * @type {OmniQuest[]}
     */
    this.quests = classifiedQuests;

    // construct quest map for the next step in this routine.
    const questMap = new Map();
    this.quests.forEach(quest => questMap.set(quest.key, quest));

    /**
     * A key:quest map of all defined quests.
     * @type {Map<string, OmniQuest>}
     */
    this.questsMap = questMap;

    /**
     * A collection of all defined quest categories.
     * @type {OmniCategory[]}
     */
    this.categories = parsedConfiguration.categories;

    // construct category map for the next step in this routine.
    const categoryMap = new Map();
    this.categories.forEach(category => categoryMap.set(category.key, category));

    /**
     * A key:questCategory map of all defined categories.
     * @type {Map<string, OmniCategory>}
     */
    this.categoriesMap = categoryMap;

    /**
     * A collection of all defined quest tags.
     * @type {OmniTag[]}
     */
    this.tags = parsedConfiguration.tags;

    // construct tag map for the next step in this routine.
    const tagMap = new Map();
    this.tags.forEach(tag => tagMap.set(tag.key, tag));

    /**
     * A key:questTag map of all defined tags.
     * @type {Map<string, OmniTag>}
     */
    this.tagsMap = tagMap;
  }

  /**
   * Initializes the metadata associated with this plugin.
   */
  initializeMetadata()
  {
    /**
     * The id of a switch that represents whether or not this system is accessible in the menu.
     * @type {number}
     */
    this.menuSwitchId = J.BASE.Helpers.parsePluginInt(this.parsedPluginParameters['menu-switch'], 0);

    /**
     * When this switch is enabled, the command will be rendered into the command list as well.
     * @type {number}
     */
    this.enabledSwitchId = 104; //parseInt(this.parsedPluginParameters['enabled-switch-id']);

    /**
     * The data associated with rendering this plugin's command in a command list.
     */
    this.Command = {
      /**
       * The name of the command when viewed from the Omnipedia.
       */
      Name: 'Questopedia',

      /**
       * The symbol of the command in the command list.
       */
      Symbol: 'quest-pedia',

      /**
       * The icon for the command anywhere it is viewed.
       */
      IconIndex: 2564,
    };
  }

  /**
   * Checks if the BASE plugin meets the minimum version requirement for this plugin.
   * @return {boolean}
   */
  static #hasMinimumBaseVersion()
  {
    // identify the two versions for comparison.
    const minimumVersion = this.#minimumBaseVersion();
    const actualVersion = new PluginVersion(J.BASE.Metadata.Version);

    // check if we meet the minimum version threshold.
    const meetsThreshold = actualVersion.satisfiesPluginVersion(minimumVersion);

    // if the version isn't high enough, then we cannot proceed.
    if (!meetsThreshold) return false;

    // we're good!
    return true;
  }

  /**
   * Gets the current minimum version of the J-BASE system this plugin requires.
   * @returns {PluginVersion}
   */
  static #minimumBaseVersion()
  {
    return PluginVersion.builder
      .major('2')
      .minor('3')
      // continue the routine with the next policy step.
      .patch('1')
      .build();
  }
}

export default J_QUEST_PluginMetadata;
//endregion plugin metadata