//region plugins/sdp/_component/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_SDP_PLUGIN_PARAMS,
  installSdpHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJSdp,
} from './fixtures/install-sdp-host-globals.js';
import { buildVitestSdpConfigJson } from './fixtures/build-sdp-config-json.js';

describe('J-SDP metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    // build the config.sdp.json fixture text from the real model classes (no vm) before booting,
    // since StorageManager.fsReadFile needs the finished string at install time.
    const { default: StatDistributionPanel } = await import('../../../../src/plugins/sdp/core/models/StatDistributionPanel.js');
    const { default: PanelParameter } = await import('../../../../src/plugins/sdp/core/models/PanelParameter.js');
    const { default: PanelRarity } = await import('../../../../src/plugins/sdp/core/models/PanelRarity.js');
    const sdpConfigJson = buildVitestSdpConfigJson(StatDistributionPanel, PanelParameter, PanelRarity);

    installSdpHostGlobals(globalThis, sdpConfigJson);

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJSdp();
    await import('../../../../src/plugins/sdp/core/_metadata/initialization.js');
  });

  describe('plugin parameters', () =>
  {
    it('maps the menu switch id', () =>
    {
      // Arrange & Act & Assert
      expect(globalThis.J.SDP.Metadata.menuSwitchId).toBe(Number(DEFAULT_SDP_PLUGIN_PARAMS.menuSwitch));
    });

    it('maps the sdp icon index', () =>
    {
      // Arrange & Act & Assert
      expect(globalThis.J.SDP.Metadata.sdpIconIndex).toBe(Number(DEFAULT_SDP_PLUGIN_PARAMS.sdpIcon));
    });

    it('maps the victory text', () =>
    {
      // Arrange & Act & Assert
      expect(globalThis.J.SDP.Metadata.victoryText).toBe(DEFAULT_SDP_PLUGIN_PARAMS.victoryText);
    });

    it('maps the command name', () =>
    {
      // Arrange & Act & Assert
      expect(globalThis.J.SDP.Metadata.commandName).toBe(DEFAULT_SDP_PLUGIN_PARAMS.menuCommandName);
    });

    it('maps the unit plural', () =>
    {
      // Arrange & Act & Assert
      expect(globalThis.J.SDP.Metadata.unitPlural).toBe(DEFAULT_SDP_PLUGIN_PARAMS.sdpUnitPlural);
    });

    it('maps the sdp points display name', () =>
    {
      // Arrange & Act & Assert
      expect(globalThis.J.SDP.Metadata.sdpPointsDisplayName).toBe(DEFAULT_SDP_PLUGIN_PARAMS.sdpPointsDisplayName);
    });
  });

  describe('config panels', () =>
  {
    it('classifies the vitest_panel row from config.sdp.json onto panelsMap', () =>
    {
      // Arrange & Act
      const panel = globalThis.J.SDP.Metadata.panelsMap.get('vitest_panel');

      // Assert
      expect(panel).toBeDefined();
    });

    it('preserves the panel key on the classified row', () =>
    {
      // Arrange & Act
      const panel = globalThis.J.SDP.Metadata.panelsMap.get('vitest_panel');

      // Assert
      expect(panel.key).toBe('vitest_panel');
    });
  });

  describe('subgroup classification', () =>
  {
    /** @type {object} the metadata class itself, whose classifiers are static and pure. */
    let SdpMetadata;

    beforeAll(async () =>
    {
      ({ default: SdpMetadata } =
        await import('../../../../src/plugins/sdp/core/_metadata/_pluginMetadata.js'));
    });

    it('returns nothing when the config carries no subgroups at all', () =>
    {
      // Arrange & Act & Assert- subgroups are optional, and a project without them is not broken.
      expect(SdpMetadata.parseSubgroups([])).toEqual([]);
    });

    it('returns nothing when the config omits the subgroups key entirely', () =>
    {
      // Arrange & Act & Assert- a project config object written before subgroups existed has no
      // such property at all, which arrives here as undefined rather than an empty list.
      expect(SdpMetadata.parseSubgroups(undefined)).toEqual([]);
    });

    it('keeps a subgroup whose name is not an editor-only separator', () =>
    {
      // Arrange & Act
      const parsed = SdpMetadata.parseSubgroups([ { name: 'Offense', key: 'offense', iconIndex: 3 } ]);

      // Assert
      expect(parsed.map(subgroup => subgroup.key)).toEqual([ 'offense' ]);
    });

    it('drops a subgroup named with the editor heading marker', () =>
    {
      // Arrange & Act
      const parsed = SdpMetadata.parseSubgroups([ { name: '=== OFFENSE ===', key: 'heading' } ]);

      // Assert
      expect(parsed).toEqual([]);
    });

    it('drops a subgroup named with the editor dash marker', () =>
    {
      // Arrange & Act
      const parsed = SdpMetadata.parseSubgroups([ { name: '-- retired --', key: 'retired' } ]);

      // Assert
      expect(parsed).toEqual([]);
    });

    it('drops a subgroup named with the editor scratch marker', () =>
    {
      // Arrange & Act
      const parsed = SdpMetadata.parseSubgroups([ { name: '__scratch', key: 'scratch' } ]);

      // Assert
      expect(parsed).toEqual([]);
    });
  });

  describe('family classification', () =>
  {
    /** @type {object} the metadata class itself, whose classifiers are static and pure. */
    let SdpMetadata;

    beforeAll(async () =>
    {
      ({ default: SdpMetadata } =
        await import('../../../../src/plugins/sdp/core/_metadata/_pluginMetadata.js'));
    });

    it('returns nothing when the config carries no families at all', () =>
    {
      // Arrange & Act & Assert
      expect(SdpMetadata.parseFamilies([])).toEqual([]);
    });

    it('keeps a family whose name is not an editor-only separator', () =>
    {
      // Arrange & Act
      const parsed = SdpMetadata.parseFamilies(
        [ { name: 'Warrior', key: 'warrior', subgroupKeys: [ 'offense' ] } ]);

      // Assert
      expect(parsed.map(family => family.key)).toEqual([ 'warrior' ]);
    });

    it('drops families named with any of the editor separator markers', () =>
    {
      // Arrange & Act
      const parsed = SdpMetadata.parseFamilies([
        { name: '=== CLASSES ===', key: 'heading' },
        { name: '-- retired --', key: 'retired' },
        { name: '__scratch', key: 'scratch' },
      ]);

      // Assert
      expect(parsed).toEqual([]);
    });

    it('drops a blank entry from a family subgroup key list', () =>
    {
      // Arrange & Act- the editor leaves an empty row behind when a subgroup slot is cleared, and
      // keeping it would fail family validation against a subgroup key that names nothing.
      const [ family ] = SdpMetadata.parseFamilies(
        [ { name: 'Warrior', key: 'warrior', subgroupKeys: [ 'offense', '' ] } ]);

      // Assert
      expect(family.subgroupKeys).toEqual([ 'offense' ]);
    });

    it('treats a missing subgroupKeys list as an empty one', () =>
    {
      // Arrange & Act- a family authored before it had any subgroups assigned is still valid.
      const [ family ] = SdpMetadata.parseFamilies([ { name: 'Warrior', key: 'warrior' } ]);

      // Assert
      expect(family.subgroupKeys).toEqual([]);
    });
  });

  describe('family validation', () =>
  {
    /** @type {object} the metadata class itself, whose validators are static and pure. */
    let SdpMetadata;

    beforeAll(async () =>
    {
      ({ default: SdpMetadata } =
        await import('../../../../src/plugins/sdp/core/_metadata/_pluginMetadata.js'));
    });

    it('refuses a family row with no key at all', () =>
    {
      // Arrange- a keyless family cannot be looked up, so it fails the config loudly rather than
      // vanishing quietly out of the node junction.
      const families = [ { key: String.empty, subgroupKeys: [] } ];

      // Act & Assert
      expect(() => SdpMetadata.validateFamilyMetadata(families, new Map()))
        .toThrow('J-SDP: every family row must define a non-empty key.');
    });

    it('refuses two families claiming the same key', () =>
    {
      // Arrange
      const families = [
        { key: 'warrior', subgroupKeys: [] },
        { key: 'warrior', subgroupKeys: [] },
      ];

      // Act & Assert
      expect(() => SdpMetadata.validateFamilyMetadata(families, new Map()))
        .toThrow('J-SDP: duplicate family key [warrior] in config.sdp.json.');
    });

    it('maps each family by its key when the config is sound', () =>
    {
      // Arrange
      const families = [ { key: 'warrior', subgroupKeys: [] } ];

      // Act
      const { familiesMap } = SdpMetadata.validateFamilyMetadata(families, new Map());

      // Assert
      expect([ ...familiesMap.keys() ]).toEqual([ 'warrior' ]);
    });
  });

  describe('rarity cost defaults', () =>
  {
    /**
     * Builds a second metadata instance against doctored plugin parameters. PluginMetadata keeps a
     * static name registry that rejects duplicates, so each variation registers under its own name.
     * @param {Record<string, string>} overrides Parameters layered over the harness defaults.
     * @param {string} name The plugin name this instance registers under.
     */
    const buildWithParams = async (overrides, name) =>
    {
      const { default: SdpPluginMetadata } =
        await import('../../../../src/plugins/sdp/core/_metadata/_pluginMetadata.js');
      const previous = globalThis.PluginManager;
      globalThis.PluginManager = {
        parameters: requested => (requested === name
          ? { ...DEFAULT_SDP_PLUGIN_PARAMS, ...overrides }
          : previous.parameters(requested)),
        registerCommand() {},
      };

      const metadata = new SdpPluginMetadata(name, '2.0.0');
      globalThis.PluginManager = previous;

      return metadata;
    };

    it('falls back to the built-in growth base when a rarity mult is left unconfigured', async () =>
    {
      // Arrange & Act- an unset parameter arrives as an empty string from the editor.
      const metadata = await buildWithParams({ sdpDefaultCommonMult: '' }, 'J-SDP-BlankMult');

      // Assert
      expect(metadata.panelCostDefaultsByRarity[0].multGrowthCost).toBe(1.06);
    });

    it('falls back to the built-in growth base when a rarity mult is not a positive number', async () =>
    {
      // Arrange & Act- a zero or negative growth base would collapse every rank-up cost curve
      // built on top of it, so it is refused rather than honored.
      const metadata = await buildWithParams({ sdpDefaultRareMult: '0' }, 'J-SDP-ZeroMult');

      // Assert
      expect(metadata.panelCostDefaultsByRarity[2].multGrowthCost).toBe(1.06);
    });

    it('honors a configured rarity mult that is a positive number', async () =>
    {
      // Arrange & Act- the fallbacks must not swallow a legitimately configured curve.
      const metadata = await buildWithParams({ sdpDefaultEpicMult: '1.25' }, 'J-SDP-ConfiguredMult');

      // Assert
      expect(metadata.panelCostDefaultsByRarity[3].multGrowthCost).toBe(1.25);
    });

    it('reports what it loaded when external file load info is enabled', async () =>
    {
      // Arrange
      const logSpy = vi.spyOn(console, 'info')
        .mockImplementation(() => {});
      globalThis.J.BASE.Metadata.ShowExternalFileLoadInfo = true;

      // Act
      await buildWithParams({}, 'J-SDP-Logged');

      // Assert
      const [ [ logged ] ] = logSpy.mock.calls;
      expect(logged).toContain('panels');
      expect(logged).toContain('subgroups');
      expect(logged).toContain('families');

      globalThis.J.BASE.Metadata.ShowExternalFileLoadInfo = false;
      logSpy.mockRestore();
    });

    it('stays silent about the load when J-Base is too old to be asked', async () =>
    {
      // Arrange- the summary reaches for J-Base helpers, so an out-of-date J-Base means the load
      // still happens but reports nothing rather than failing.
      const logSpy = vi.spyOn(console, 'info')
        .mockImplementation(() => {});
      globalThis.J.BASE.Metadata.ShowExternalFileLoadInfo = true;
      const originalVersion = globalThis.J.BASE.Metadata.Version;
      globalThis.J.BASE.Metadata.Version = '0.0.1';

      // Act
      const metadata = await buildWithParams({}, 'J-SDP-OldBase');

      // Assert- the panels still classified; only the reporting went quiet, falling back to the
      // loader's own minimal line rather than the counted summary the previous case produces.
      expect(metadata.panelsMap.size).toBeGreaterThan(0);
      const [ [ logged ] ] = logSpy.mock.calls;

      // the minimal line, and none of the counts the sibling case above asserts are present. the
      // prefix is deliberately not pinned here: the loader is a J-Base file, so a shipped build
      // stamps it "[J-Base]", but a direct-import realm has one __PLUGIN_NAME__ and this one is
      // J-SDP's. Pinning either spelling would be asserting the harness, not the behavior.
      expect(logged).toContain('loaded external JSON from file data/config.sdp.json.');
      expect(logged).not.toContain('panels');

      globalThis.J.BASE.Metadata.Version = originalVersion;
      globalThis.J.BASE.Metadata.ShowExternalFileLoadInfo = false;
      logSpy.mockRestore();
    });
  });

  describe('mastery validation', () =>
  {
    /** @type {object} the metadata class itself, whose validators are static and pure. */
    let SdpMetadata;

    beforeAll(async () =>
    {
      ({ default: SdpMetadata } =
        await import('../../../../src/plugins/sdp/core/_metadata/_pluginMetadata.js'));
    });

    it('refuses a subgroup row with no key at all', () =>
    {
      // Arrange- panels reference subgroups by key, so a keyless subgroup can never be pointed at.
      const subgroups = [ { key: String.empty } ];

      // Act & Assert
      expect(() => SdpMetadata.validateMasteryMetadata(subgroups, []))
        .toThrow('J-SDP: every subgroup row must define a non-empty key.');
    });

    it('refuses two subgroups claiming the same key', () =>
    {
      // Arrange- a duplicate would make which subgroup a panel lands in a coin flip.
      const subgroups = [ { key: 'offense' }, { key: 'offense' } ];

      // Act & Assert
      expect(() => SdpMetadata.validateMasteryMetadata(subgroups, []))
        .toThrow('J-SDP: duplicate subgroup key [offense] in config.sdp.json.');
    });
  });

  describe('panel classification', () =>
  {
    /** @type {object} the metadata class itself, whose classifiers are static and pure. */
    let SdpMetadata;

    /**
     * The minimum shape `classifyPanels` destructures out of a config row.
     * @param {object} overrides Fields layered over the baseline panel row.
     */
    const buildPanelRow = overrides => ({
      name: 'Vitest Classified',
      key: 'vitest_classified',
      iconIndex: 1,
      rarity: 0,
      unlockedByDefault: true,
      description: 'test',
      flavorText: 'test',
      maxRank: 5,
      baseCost: 10,
      flatGrowthCost: 1,
      multGrowthCost: 1,
      toppingIds: [],
      panelParameters: [],
      panelRewards: [],
      ...overrides,
    });

    beforeAll(async () =>
    {
      ({ default: SdpMetadata } =
        await import('../../../../src/plugins/sdp/core/_metadata/_pluginMetadata.js'));
    });

    it('drops a panel named with the editor scratch marker', () =>
    {
      // Arrange & Act
      const classified = SdpMetadata.classifyPanels([ buildPanelRow({ name: '__scratch panel' }) ]);

      // Assert
      expect(classified).toEqual([]);
    });

    it('drops a panel named with the editor dash marker', () =>
    {
      // Arrange & Act
      const classified = SdpMetadata.classifyPanels([ buildPanelRow({ name: '-- retired --' }) ]);

      // Assert
      expect(classified).toEqual([]);
    });

    it('keeps a panel whose name is not an editor-only separator', () =>
    {
      // Arrange & Act
      const classified = SdpMetadata.classifyPanels([ buildPanelRow({}) ]);

      // Assert
      expect(classified.map(panel => panel.key)).toEqual([ 'vitest_classified' ]);
    });

    it('classifies each rank-up reward attached to a panel', () =>
    {
      // Arrange- rewards are what a panel hands over at a given rank, and the harness config ships
      // none of them, so this path had never been walked.
      const row = buildPanelRow({
        panelRewards: [
          { rewardName: 'Unlock Skill', rankRequired: '5', effect: 'a.learnSkill(101)' },
          { rewardName: 'Bonus Points', rankRequired: '10', effect: 'a.modSdpPoints(50)' },
        ],
      });

      // Act
      const [ panel ] = SdpMetadata.classifyPanels([ row ]);

      // Assert
      expect(panel.panelRewards.length).toBe(2);
      expect(panel.panelRewards[0].rankRequired).toBe(5);
      expect(panel.panelRewards[1].effect).toBe('a.modSdpPoints(50)');
    });
  });
});
//endregion plugins/sdp/_component/metadata.test.js
