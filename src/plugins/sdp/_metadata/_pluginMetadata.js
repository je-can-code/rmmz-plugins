//region plugin metadata
class J_SdpPluginMetadata
  extends PluginMetadata
{
  /**
   * The path where the config for panels is located.
   * @type {string}
   */
  static CONFIG_PATH = 'data/config.sdp.json';

  /**
   * Converts the JSON-parsed blob into classified {@link StatDistributionPanel}s.
   * @param {any} parsedBlob The already-parsed JSON blob.
   * @return {StatDistributionPanel[]} The blob with all data converted into proper classes.
   */
  static classifyPanels(parsedBlob)
  {
    const parsedPanels = [];

    const foreacher = parsedPanel =>
    {
      // validate the name is not one of the organizational names for the editor-only.
      const panelName = parsedPanel.name;
      if (panelName.startsWith("__")) return;
      if (panelName.startsWith("==")) return;
      if (panelName.startsWith("--")) return;

      // destructure the details we care about.
      const {
        panelParameters,
        panelRewards
      } = parsedPanel;

      // parse and assign all the various panel parameters.
      const parsedPanelParameters = [];
      panelParameters.forEach(paramBlob =>
      {
        const parsedParameter = paramBlob;
        const panelParameter = new PanelParameter({
          parameterId: parseInt(parsedParameter.parameterId),
          perRank: parseFloat(parsedParameter.perRank),
          isFlat: parsedParameter.isFlat,
          isCore: parsedParameter.isCore,
        });
        parsedPanelParameters.push(panelParameter);
      });

      // parse out all the panel rewards if there are any.
      const parsedPanelRewards = [];
      if (panelRewards)
      {
        panelRewards.forEach(reward =>
        {
          const parsedReward = reward;
          const panelReward = new PanelRankupReward(
            parsedReward.rewardName,
            parseInt(parsedReward.rankRequired),
            parsedReward.effect);
          parsedPanelRewards.push(panelReward);
        });
      }

      // create the panel.
      const panel = StatDistributionPanel.Builder
        .name(parsedPanel.name)
        .key(parsedPanel.key)
        .iconIndex(parseInt(parsedPanel.iconIndex))
        .rarity(parsedPanel.rarity)
        .unlockedByDefault(parsedPanel.unlockedByDefault)
        .description(parsedPanel.description)
        .flavorText(parsedPanel.topFlavorText)
        .maxRank(parseInt(parsedPanel.maxRank))
        .baseCost(parseInt(parsedPanel.baseCost))
        .flatGrowth(parseInt(parsedPanel.flatGrowthCost))
        .multGrowth(parseFloat(parsedPanel.multGrowthCost))
        .parameters(parsedPanelParameters)
        .rewards(parsedPanelRewards)
        .build();

      parsedPanels.push(panel);
    }

    // build an SDP from each parsed item provided.
    parsedBlob.forEach(foreacher, this);

    return parsedPanels;
  }

  /**
   * Constructor.
   */
  constructor(name, version)
  {
    super(name, version);
  }

  /**
   *  Extends {@link #postInitialize}.<br>
   *  Includes translation of plugin parameters.
   */
  postInitialize()
  {
    // execute original logic.
    super.postInitialize();

    // initialize the panels from plugin configuration.
    this.initializePanels();

    // initialize the other miscellaneous plugin configuration.
    this.initializeMetadata();
  }

  /**
   * Initializes the SDPs that exist in the SDP configuration.
   */
  initializePanels()
  {
    // parse the files as an actual list of objects from the JSON configuration.
    const parsedPanels = JSON.parse(StorageManager.fsReadFile(J_SdpPluginMetadata.CONFIG_PATH));
    if (parsedPanels === null)
    {
      console.error('no SDP configuration was found in the /data directory of the project.');
      console.error('Consider adding configuration using the J-MZ data editor, or hand-writing one.');
      throw new Error('SDP plugin is being used, but no config file is present.');
    }

    // classify each panel.
    const classifiedPanels = J_SdpPluginMetadata.classifyPanels(parsedPanels.sdps);

    /**
     * The collection of all defined SDPs.
     * @type {StatDistributionPanel[]}
     */
    this.panels = classifiedPanels;

    const panelMap = new Map();
    this.panels.forEach(panel => panelMap.set(panel.key, panel));

    /**
     * A key:panel map of all defined SDPs.
     * @type {Map<string, StatDistributionPanel>}
     */
    this.panelsMap = panelMap;

    console.log(`loaded:
      - ${this.panels.length} panels
      from file ${J_SdpPluginMetadata.CONFIG_PATH}.`);
  }

  initializeMetadata()
  {
    /**
     * The id of a switch that represents whether or not this system is accessible
     * in the menu.
     * @type {number}
     */
    this.menuSwitchId = parseInt(this.parsedPluginParameters['menuSwitch']);

    /**
     * The icon index that represents the system itself.
     * Used as the icon for costs and currency.
     * @type {number}
     */
    this.sdpIconIndex = parseInt(this.parsedPluginParameters['sdpIcon']);

    /**
     * The text displayed upon victory during a battle-end victory scene.
     */
    this.victoryText = this.parsedPluginParameters['victoryText'];

    /**
     * The name used for the command when visible in a menu.
     * @type {string}
     */
    this.commandName = this.parsedPluginParameters['menuCommandName'] ?? 'Distribute';

    /**
     * The icon used alongside the command's name when visible in the menu.
     * @type {number}
     */
    this.commandIconIndex = parseInt(this.parsedPluginParameters['menuCommandIcon']);

    /**
     * When JABS is enabled, this menu is removed from the main menu and added instead
     * to the quick menu. If this is set to true, then access to the menu will be re-added
     * to the main menu again.<br>
     *
     * Both menus are shown/hidden by the menu switch id.
     * @type {boolean}
     */
    this.jabsShowInBothMenus = this.parsedPluginParameters['showInBoth'] === "true";
  }
}

//endregion plugin metadata