//region plugin metadata
import PanelFamily from '../models/PanelFamily.js';
import PanelIdentity from '../models/PanelIdentity.js';
import PanelMastery from '../models/PanelMastery.js';
import PanelParameter from '../models/PanelParameter.js';
import PanelProgression from '../models/PanelProgression.js';
import PanelRankupReward from '../models/PanelRankupReward.js';
import PanelRarity from '../models/PanelRarity.js';
import PanelSubgroup from '../models/PanelSubgroup.js';
import SdpConfiguration from '../models/SdpConfiguration.js';
import StatDistributionPanel from '../models/StatDistributionPanel.js';

class J_SdpPluginMetadata
  extends PluginMetadata
{
  /**
   * Project-relative path to the SDP JSON configuration file.
   * @type {string}
   */
  static CONFIG_PATH = 'data/config.sdp.json';

  /**
   * Minimum Max HP after SDP panel downs (0 MHP bricks the actor).
   * @type {number}
   */
  static PanelStatFloorMhp = 1;

  /**
   * Minimum value for every other stat after SDP panel downs.
   * @type {number}
   */
  static PanelStatFloorDefault = 0;

  /**
   * Classifies the anonymous object from the parsed json into panels and subgroups.
   * @param {any} parsedJson The parsed json driving this step.
   * @returns {SdpConfiguration}
   */
  static classifyConfiguration(parsedJson)
  {
    // legacy project configs may be a bare panel array with no subgroups wrapper.
    const sdpsBlob = Array.isArray(parsedJson)
      ? parsedJson
      : parsedJson.sdps;
    const subgroupsBlob = Array.isArray(parsedJson)
      ? []
      : parsedJson.subgroups;
    const familiesBlob = Array.isArray(parsedJson)
      ? []
      : parsedJson.families;

    const subgroups = J_SdpPluginMetadata.parseSubgroups(subgroupsBlob);
    const families = J_SdpPluginMetadata.parseFamilies(familiesBlob);
    const panels = J_SdpPluginMetadata.classifyPanels(sdpsBlob);

    // validate mastery rows and build reverse-lookup maps for runtime reconciliation.
    const subgroupMaps = J_SdpPluginMetadata.validateMasteryMetadata(subgroups, panels);
    const familyMaps = J_SdpPluginMetadata.validateFamilyMetadata(families, subgroupMaps.subgroupsMap);

    return SdpConfiguration.builder
      .panels(panels)
      .subgroups(subgroups)
      .families(families)
      .subgroupsMap(subgroupMaps.subgroupsMap)
      .familiesMap(familyMaps.familiesMap)
      .familyKeyBySubgroupKey(familyMaps.familyKeyBySubgroupKey)
      .panelsBySubgroupKey(subgroupMaps.panelsBySubgroupKey)
      .build();
  }

  /**
   * Converts the JSON-parsed blob into classified {@link PanelSubgroup}s.
   * @param {any[]|undefined|null} parsedSubgroupsBlob The parsed subgroups blob driving this step.
   * @returns {PanelSubgroup[]}
   */
  static parseSubgroups(parsedSubgroupsBlob)
  {
    if (!parsedSubgroupsBlob || parsedSubgroupsBlob.length === 0)
    {
      return [];
    }

    const parsedSubgroups = [];

    parsedSubgroupsBlob.forEach(parsedSubgroup =>
    {
      const subgroupName = parsedSubgroup.name ?? String.empty;

      // skip editor-only organizational rows (same convention as panel names).
      if (subgroupName.startsWith('==')) return;
      if (subgroupName.startsWith('--')) return;
      if (subgroupName.startsWith('__')) return;

      // construct subgroup for the next step in this routine.
      const subgroup = new PanelSubgroup(
        subgroupName,
        parsedSubgroup.key ?? String.empty,
        J.BASE.Helpers.parsePluginInt(parsedSubgroup.iconIndex, -1),
        parsedSubgroup.description ?? String.empty
      );

      // Append the row to the working collection.
      parsedSubgroups.push(subgroup);
    });

    return parsedSubgroups;
  }

  /**
   * Converts the JSON-parsed blob into classified {@link PanelFamily}s.
   * @param {any[]|undefined|null} parsedFamiliesBlob The parsed families blob driving this step.
   * @returns {PanelFamily[]}
   */
  static parseFamilies(parsedFamiliesBlob)
  {
    if (!parsedFamiliesBlob || parsedFamiliesBlob.length === 0)
    {
      return [];
    }

    const parsedFamilies = [];

    parsedFamiliesBlob.forEach(parsedFamily =>
    {
      const familyName = parsedFamily.name ?? String.empty;

      // skip editor-only organizational rows (same convention as panel/subgroup names).
      if (familyName.startsWith('==')) return;
      if (familyName.startsWith('--')) return;
      if (familyName.startsWith('__')) return;

      const subgroupKeys = Array.isArray(parsedFamily.subgroupKeys)
        ? parsedFamily.subgroupKeys.filter(key => key !== String.empty)
        : [];

      // construct family for the next step in this routine.
      const family = new PanelFamily(
        familyName,
        parsedFamily.key ?? String.empty,
        J.BASE.Helpers.parsePluginInt(parsedFamily.iconIndex, -1),
        parsedFamily.description ?? String.empty,
        subgroupKeys
      );

      // Append the row to the working collection.
      parsedFamilies.push(family);
    });

    return parsedFamilies;
  }

  /**
   * Validates family metadata and builds subgroup → family reverse lookup.
   * @param {PanelFamily[]} families The families driving this step.
   * @param {Map<string, PanelSubgroup>} subgroupsMap The subgroups map driving this step.
   * @returns {{ familiesMap: Map<string, PanelFamily>, familyKeyBySubgroupKey: Map<string, string> }}
   */
  static validateFamilyMetadata(families, subgroupsMap)
  {
    const familiesMap = new Map();
    const familyKeyBySubgroupKey = new Map();

    families.forEach(family =>
    {
      if (!family.key)
      {
        throw new Error('J-SDP: every family row must define a non-empty key.');
      }

      if (familiesMap.has(family.key))
      {
        throw new Error(`J-SDP: duplicate family key [${family.key}] in config.sdp.json.`);
      }

      // Register the value on the alias map for runtime lookup.
      familiesMap.set(family.key, family);

      family.subgroupKeys.forEach(subgroupKey =>
      {
        if (subgroupsMap.has(subgroupKey) === false)
        {
          throw new Error(
            `J-SDP: family [${family.key}] references unknown subgroup [${subgroupKey}].`
          );
        }

        if (familyKeyBySubgroupKey.has(subgroupKey))
        {
          const otherFamilyKey = familyKeyBySubgroupKey.get(subgroupKey);

          // abort this pass so the operator sees a hard failure.
          throw new Error(
            `J-SDP: subgroup [${subgroupKey}] is assigned to multiple families `
            + `[${otherFamilyKey}] and [${family.key}].`
          );
        }

        // Register the value on the alias map for runtime lookup.
        familyKeyBySubgroupKey.set(subgroupKey, family.key);
      });
    });

    // TODO: when we hit 1.0.0 Chef Adventure, throw here if any registered subgroup is not assigned to a family.

    return {
      familiesMap,
      familyKeyBySubgroupKey,
    };
  }

  /**
   * Validates mastery metadata and builds subgroup panel groupings for reverse lookup.
   * @param {PanelSubgroup[]} subgroups The subgroups driving this step.
   * @param {StatDistributionPanel[]} panels The panels driving this step.
   * @returns {{ subgroupsMap: Map<string, PanelSubgroup>, panelsBySubgroupKey: Map<string, StatDistributionPanel[]> }}
   */
  static validateMasteryMetadata(subgroups, panels)
  {
    const subgroupsMap = new Map();
    const panelsBySubgroupKey = new Map();
    const tierBySubgroupKey = new Map();

    // first pass: index the subgroup registry so panels can only reference known keys.
    subgroups.forEach(subgroup =>
    {
      if (!subgroup.key)
      {
        throw new Error('J-SDP: every subgroup row must define a non-empty key.');
      }

      if (subgroupsMap.has(subgroup.key))
      {
        throw new Error(`J-SDP: duplicate subgroup key [${subgroup.key}] in config.sdp.json.`);
      }

      // Register the value on the alias map for runtime lookup.
      subgroupsMap.set(subgroup.key, subgroup);
    });

    panels.forEach(panel =>
    {
      const { mastery } = panel;

      if (mastery.hasPartialEnrollment())
      {
        throw new Error(
          `J-SDP: panel [${panel.key}] has incomplete mastery metadata `
          + `(subgroupKey and subgroupTier must be set together; masterySkillId is optional but requires subgroup enrollment).`
        );
      }

      // panels with no subgroup enrollment are outside the hierarchy — skip them.
      if (mastery.enrolledInSubgroup() === false)
      {
        return;
      }

      if (subgroupsMap.has(mastery.subgroupKey) === false)
      {
        throw new Error(
          `J-SDP: panel [${panel.key}] references unknown subgroup [${mastery.subgroupKey}].`
        );
      }

      const tierMap = tierBySubgroupKey.get(mastery.subgroupKey) ?? new Map();

      // two panels must never share the same tier within one subgroup — replacement would be ambiguous.
      if (tierMap.has(mastery.subgroupTier))
      {
        const otherPanelKey = tierMap.get(mastery.subgroupTier);

        // abort this pass so the operator sees a hard failure.
        throw new Error(
          `J-SDP: duplicate subgroup tier ${mastery.subgroupTier} in subgroup [${mastery.subgroupKey}] `
          + `for panels [${otherPanelKey}] and [${panel.key}].`
        );
      }

      // Register the value on the alias map for runtime lookup.
      tierMap.set(mastery.subgroupTier, panel.key);
      tierBySubgroupKey.set(mastery.subgroupKey, tierMap);

      // accumulate mastery panels per subgroup for fast reverse lookup at max-rank time.
      const subgroupPanels = panelsBySubgroupKey.get(mastery.subgroupKey) ?? [];

      // Append the row to the working collection.
      subgroupPanels.push(panel);
      panelsBySubgroupKey.set(mastery.subgroupKey, subgroupPanels);
    });

    // keep each subgroup's panel list sorted ascending by tier for predictable iteration.
    panelsBySubgroupKey.forEach(subgroupPanels =>
    {
      subgroupPanels.sort((left, right) => left.mastery.subgroupTier - right.mastery.subgroupTier);
    });

    return {
      subgroupsMap,
      panelsBySubgroupKey,
    };
  }

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
      const panelName = parsedPanel.identity?.name ?? parsedPanel.name ?? String.empty;
      if (panelName.startsWith('__')) return;
      // if (panelName.startsWith('==')) return;
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
          parsedParameter.parameterKey,
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

      // create the panel from nested config rows (identity / progression / mastery).
      const panel = StatDistributionPanel.Builder()
        .key(parsedPanel.key ?? String.empty)
        .identity(PanelIdentity.fromConfigPanel(parsedPanel))
        .progression(PanelProgression.fromConfigPanel(parsedPanel))
        .parameters(parsedPanelParameters)
        .rewards(parsedPanelRewards)
        // nested mastery object on every panel row — blank/zero means "not enrolled".
        .mastery(PanelMastery.fromConfigPanel(parsedPanel))
        .build();

      // Append the row to the working collection.
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
   * @param {string|number|undefined|null} value The value driving this step.
   * @param {number} fallback The fallback driving this step.
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
   * @param {StatDistributionPanel} panel The panel driving this step.
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
    // classify each panel and subgroup from configuration.
    const canLogLoadInfo = J_SdpPluginMetadata.#hasMinimumBaseVersion();
    const classifiedConfiguration = ExternalJsonConfigLoader.load(
      J_SdpPluginMetadata.CONFIG_PATH,
      ExternalJsonConfigLoaderOptions.Builder()
        .pluginName('J-SDP')
        .configName('sdp configuration')
        .mapper(parsed => J_SdpPluginMetadata.classifyConfiguration(parsed))
        .logSummary(canLogLoadInfo
          ? result => [
            `- ${result.panels().length} panels`,
            `- ${result.subgroups().length} subgroups`,
            `- ${result.families().length} families`,
          ]
          : null)
        .build()
    );

    /**
     * The collection of all defined SDPs.
     * @type {StatDistributionPanel[]}
     */
    this.panels = classifiedConfiguration.panels();

    // construct panel map for the next step in this routine.
    const panelMap = new Map();
    this.panels.forEach(panel => panelMap.set(panel.key, panel));

    /**
     * A key:panel map of all defined SDPs.
     * @type {Map<string, StatDistributionPanel>}
     */
    this.panelsMap = panelMap;

    /**
     * The collection of all defined panel subgroups.
     * @type {PanelSubgroup[]}
     */
    this.subgroups = classifiedConfiguration.subgroups();

    /**
     * A key:subgroup map of all defined panel subgroups.
     * @type {Map<string, PanelSubgroup>}
     */
    this.subgroupsMap = classifiedConfiguration.subgroupsMap();

    /**
     * Panels grouped by subgroup key, sorted ascending by {@link PanelMastery#subgroupTier}.
     * Built at boot so max-rank reconciliation can reverse-lookup without scanning every panel.
     * @type {Map<string, StatDistributionPanel[]>}
     */
    this.panelsBySubgroupKey = classifiedConfiguration.panelsBySubgroupKey();

    /**
     * The collection of all defined panel families.
     * @type {PanelFamily[]}
     */
    this.families = classifiedConfiguration.families();

    /**
     * A key:family map of all defined panel families.
     * @type {Map<string, PanelFamily>}
     */
    this.familiesMap = classifiedConfiguration.familiesMap();

    /**
     * Reverse lookup from subgroup key to owning family key.
     * @type {Map<string, string>}
     */
    this.familyKeyBySubgroupKey = classifiedConfiguration.familyKeyBySubgroupKey();
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
    // assign victory text on this instance for callers.
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

    /**
     * Minimum Max HP after SDP panel downs (0 MHP bricks the actor).
     * @type {number}
     */
    this.panelStatFloorMhp = J_SdpPluginMetadata.PanelStatFloorMhp;

    /**
     * Minimum value for every other stat after SDP panel downs.
     * @type {number}
     */
    this.panelStatFloorDefault = J_SdpPluginMetadata.PanelStatFloorDefault;
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

export default J_SdpPluginMetadata;
//endregion plugin metadata