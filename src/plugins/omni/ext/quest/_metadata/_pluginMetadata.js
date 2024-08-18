//region plugin metadata
class J_QUEST_PluginMetadata extends PluginMetadata
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
      if (questName.startsWith("__")) return;
      if (questName.startsWith("==")) return;
      if (questName.startsWith("--")) return;

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

      parsedQuests.push(builtQuest)
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
    /** @type {OmniConfiguration} */
    const parsedConfiguration = JSON.parse(StorageManager.fsReadFile(J_QUEST_PluginMetadata.CONFIG_PATH));
    if (parsedConfiguration === null)
    {
      console.error('no quest configuration was found in the /data directory of the project.');
      console.error('Consider adding configuration using the J-MZ data editor, or hand-writing one.');
      throw new Error('OmniQuest plugin is being used, but no config file is present.');
    }

    // classify each panel to skip ones that invalid or not applicable.
    const classifiedQuests = J_QUEST_PluginMetadata.classifyQuests(parsedConfiguration.quests);

    /**
     * A collection of all defined quests.
     * @type {OmniQuest[]}
     */
    this.quests = classifiedQuests;

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

    const tagMap = new Map();
    this.tags.forEach(tag => tagMap.set(tag.key, tag));

    /**
     * A key:questTag map of all defined tags.
     * @type {Map<string, OmniTag>}
     */
    this.tagsMap = tagMap;

    console.log(`loaded:
      - ${this.quests.length} quests
      - ${this.categories.length} categories
      - ${this.tags.length} tags
      from file ${J_QUEST_PluginMetadata.CONFIG_PATH}.`);
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
    this.menuSwitchId = parseInt(this.parsedPluginParameters['menu-switch']);

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
      Name: "Questopedia",

      /**
       * The symbol of the command in the command list.
       */
      Symbol: "quest-pedia",

      /**
       * The icon for the command anywhere it is viewed.
       */
      IconIndex: 2564,
    };
  }
}
//endregion plugin metadata