//region plugin metadata
class J_SdpPluginMetadata
  extends PluginMetadata
{
  /**
   * Project-relative path to the SDP JSON configuration file.
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
      if (panelName.startsWith('__')) return;
      if (panelName.startsWith('==')) return;
      if (panelName.startsWith('--')) return;

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
        const panelParameter = new PanelParameter(
          parseInt(parsedParameter.parameterId),
          parseFloat(parsedParameter.perRank),
          parsedParameter.isFlat,
          parsedParameter.isCore
        );
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
            parsedReward.effect
          );
          parsedPanelRewards.push(panelReward);
        });
      }

      // create the panel.
      const panel = StatDistributionPanel.Builder()
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
    };

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

    // load rarity-based rank-up cost defaults before panels (rankUpCost resolves against these).
    this.initializePanelCostDefaultsByRarity();

    // initialize the panels from plugin configuration.
    this.initializePanels();

    // initialize the other miscellaneous plugin configuration.
    this.initializeMetadata();
  }

  /**
   * Parses plugin parameters into six rarity rows (**Common..Godlike**) used as the core rank-up cost spine.
   * Panel JSON fields layer additive / multiplicative offsets on top — see resolveEffectiveRankUpCostParts.
   */
  initializePanelCostDefaultsByRarity()
  {
    const { parsedPluginParameters: p } = this;

    /**
     * One rarity tier: base SDP, exponential coefficient, and growth base (**mult**).
     * @type {{ baseCost: number, flatGrowthCost: number, multGrowthCost: number }}
     */
    const row = (baseKey, flatKey, multKey, fbBase, fbFlat, fbMult) =>
    {
      return {
        baseCost: J.BASE.Helpers.parsePluginInt(p[baseKey], fbBase),
        flatGrowthCost: J.BASE.Helpers.parsePluginInt(p[flatKey], fbFlat),
        multGrowthCost: J_SdpPluginMetadata.#parsePositiveFloatOr(p[multKey], fbMult),
      };
    };

    /**
     * Indexed **0–5** matching {@link PanelRarity} Common..Godlike.
     * @type {Array<{ baseCost: number, flatGrowthCost: number, multGrowthCost: number }>}
     */
    this.panelCostDefaultsByRarity =
      [
        row('sdpDefaultCommonBase', 'sdpDefaultCommonFlat', 'sdpDefaultCommonMult', 0, 70, 1.06),
        row('sdpDefaultMagicalBase', 'sdpDefaultMagicalFlat', 'sdpDefaultMagicalMult', 0, 235, 1.06),
        row('sdpDefaultRareBase', 'sdpDefaultRareFlat', 'sdpDefaultRareMult', 0, 1180, 1.06),
        row('sdpDefaultEpicBase', 'sdpDefaultEpicFlat', 'sdpDefaultEpicMult', 0, 4320, 1.06),
        row('sdpDefaultLegendaryBase', 'sdpDefaultLegendaryFlat', 'sdpDefaultLegendaryMult', 0, 11900, 1.06),
        row('sdpDefaultGodlikeBase', 'sdpDefaultGodlikeFlat', 'sdpDefaultGodlikeMult', 0, 30500, 1.06),
      ];
  }

  /**
   * @param {string|number|undefined|null} value
   * @param {number} fallback
   * @returns {number}
   */
  static #parsePositiveFloatOr(value, fallback)
  {
    if (value === undefined || value === null || value === '')
    {
      return fallback;
    }

    const parsed = Number.parseFloat(String(value));

    if (Number.isFinite(parsed) && parsed > 0)
    {
      return parsed;
    }

    return fallback;
  }

  /**
   * Effective rank-up cost knobs after combining rarity defaults with per-panel overrides from `config.sdp.json`.
   *
   * @param {StatDistributionPanel} panel
   * @returns {{ baseCost: number, flatGrowthCost: number, multGrowthCost: number }}
   */
  resolveEffectiveRankUpCostParts(panel)
  {
    const rarityIndex = PanelRarity.normalizeRarityFromJson(panel.rarity);
    const row = this.panelCostDefaultsByRarity[rarityIndex];
    const scale = panel.multGrowthCost;

    // zero or negative panel scale would collapse growth; treat as neutral **1.0** so rarity **mult** still applies.
    const safeScale = (scale > 0)
      ? scale
      : 1.0;

    return {
      baseCost: row.baseCost + panel.baseCost,
      flatGrowthCost: row.flatGrowthCost + panel.flatGrowthCost,
      multGrowthCost: row.multGrowthCost * safeScale,
    };
  }

  /**
   * Initializes the SDPs that exist in the SDP configuration.
   */
  initializePanels()
  {
    // classify each panel.
    const canLogLoadInfo = J_SdpPluginMetadata.#hasMinimumBaseVersion();
    const classifiedPanels = ExternalJsonConfigLoader.load(
      J_SdpPluginMetadata.CONFIG_PATH,
      ExternalJsonConfigLoaderOptions.Builder()
        .pluginName('J-SDP')
        .configName('sdp configuration')
        .mapper(parsed => J_SdpPluginMetadata.classifyPanels(parsed.sdps))
        .logSummary(canLogLoadInfo
          ? result => [ `- ${result.length} panels` ]
          : null)
        .build()
    );

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
  }

  initializeMetadata()
  {
    /**
     * The id of a switch that represents whether or not this system is accessible
     * in the menu.
     * @type {number}
     */
    this.menuSwitchId = J.BASE.Helpers.parsePluginInt(this.parsedPluginParameters['menuSwitch'], 0);

    /**
     * The icon index that represents the system itself.
     * Used as the icon for costs and currency.
     * @type {number}
     */
    this.sdpIconIndex = J.BASE.Helpers.parsePluginInt(this.parsedPluginParameters['sdpIcon'], 0);

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
    this.commandIconIndex = J.BASE.Helpers.parsePluginInt(this.parsedPluginParameters['menuCommandIcon'], 0);

    /**
     * When JABS is enabled, this menu is removed from the main menu and added instead
     * to the quick menu. If this is set to true, then access to the menu will be re-added
     * to the main menu again.<br>
     *
     * Both menus are shown/hidden by the menu switch id.
     * @type {boolean}
     */
    this.jabsShowInBothMenus = this.parsedPluginParameters['showInBoth'] === 'true';

    /**
     * Singular player-facing name for one SDP row (confirmation copy, future labels).
     * @type {string}
     */
    this.unitSingular = this.parsedPluginParameters['sdpUnitSingular'] ?? 'panel';

    /**
     * Plural player-facing name for counts such as “4 upgrades on 2 …”.
     * @type {string}
     */
    this.unitPlural = this.parsedPluginParameters['sdpUnitPlural'] ?? 'panels';

    /**
     * Short label for spendable currency (“Remaining …”, cart wallet chip, {@link TextManager#sdpPoints}).
     * @type {string}
     */
    this.sdpPointsDisplayName = this.parsedPluginParameters['sdpPointsDisplayName'] ?? 'SDP';
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
      .patch('1')
      .build();
  }
}

//endregion plugin metadata