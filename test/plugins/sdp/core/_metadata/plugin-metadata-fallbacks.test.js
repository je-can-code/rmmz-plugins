//region plugins/sdp/core/_metadata/plugin-metadata-fallbacks.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installSdpHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJSdp,
} from '../../_component/fixtures/install-sdp-host-globals.js';
import { installPluginManagerWithParams } from '../../../../setup/install-plugin-manager-with-params.js';

/**
 * config.sdp.json is written by the data editor, but the files in the wild predate several of its
 * shapes: the oldest are a bare array of panels with no subgroup wrapper at all, and individual
 * rows can be missing fields the current editor always writes. Boot has to absorb every one of
 * those without dropping the rest of the config on the floor, so each fallback is pinned here.
 * The companion component file covers a fully-populated config; this one covers the absences.
 */
describe('J_SdpPluginMetadata config fallbacks (direct src import)', () =>
{
  let J_SdpPluginMetadata;
  let scenarioCounter = 0;

  beforeAll(async () =>
  {
    vi.resetModules();

    installSdpHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJSdp();
    await import('../../../../../src/plugins/sdp/core/_metadata/initialization.js');

    ({ default: J_SdpPluginMetadata } = await import('../../../../../src/plugins/sdp/core/_metadata/_pluginMetadata.js'));
  });

  /**
   * Builds a metadata instance from the given plugin parameters. Each call uses a distinct plugin
   * name, because the plugin metadata registry is append-only and keyed by name- reusing one would
   * collide with the scenario before it.
   * @param {Record<string, string>} params The plugin parameters to boot against.
   * @returns {object}
   */
  function buildMetadata(params)
  {
    scenarioCounter += 1;

    const name = `J-SDP-fallback-${scenarioCounter}`;
    installPluginManagerWithParams(globalThis, name, params);

    return new J_SdpPluginMetadata(name, '2.0.0');
  }

  //region legacy bare-array config
  describe('classifyConfiguration with a legacy bare array', () =>
  {
    it('reads the array itself as the panel list', () =>
    {
      // Arrange: the oldest configs are just a list of panels, with no wrapper object.
      const legacy = [ { key: 'panel_a', name: 'Panel A', panelParameters: [] } ];

      // Act
      const configuration = J_SdpPluginMetadata.classifyConfiguration(legacy);

      // Assert
      expect(configuration.panels().length).toBe(1);
    });

    it('reports no subgroups for a config that predates them', () =>
    {
      // Arrange
      const legacy = [ { key: 'panel_a', name: 'Panel A', panelParameters: [] } ];

      // Act
      const configuration = J_SdpPluginMetadata.classifyConfiguration(legacy);

      // Assert
      expect(configuration.subgroups()).toEqual([]);
    });

    it('reports no families for a config that predates them', () =>
    {
      // Arrange
      const legacy = [ { key: 'panel_a', name: 'Panel A', panelParameters: [] } ];

      // Act
      const configuration = J_SdpPluginMetadata.classifyConfiguration(legacy);

      // Assert
      expect(configuration.families()).toEqual([]);
    });
  });
  //endregion legacy bare-array config

  //region subgroups and families
  describe('parseSubgroups', () =>
  {
    it('falls back to a blank name for a subgroup missing one', () =>
    {
      // Arrange
      const subgroups = J_SdpPluginMetadata.parseSubgroups([ { key: 'resilience' } ]);

      // Act
      const [ subgroup ] = subgroups;

      // Assert
      expect(subgroup.name).toBe(String.empty);
    });

    it('falls back to a blank key for a subgroup missing one', () =>
    {
      // Arrange
      const subgroups = J_SdpPluginMetadata.parseSubgroups([ { name: 'Resilience' } ]);

      // Act
      const [ subgroup ] = subgroups;

      // Assert
      expect(subgroup.key).toBe(String.empty);
    });
  });

  describe('parseFamilies', () =>
  {
    it('falls back to a blank name for a family missing one', () =>
    {
      // Arrange
      const families = J_SdpPluginMetadata.parseFamilies([ { key: 'offense' } ]);

      // Act
      const [ family ] = families;

      // Assert
      expect(family.name).toBe(String.empty);
    });

    it('falls back to a blank key for a family missing one', () =>
    {
      // Arrange
      const families = J_SdpPluginMetadata.parseFamilies([ { name: 'Offense' } ]);

      // Act
      const [ family ] = families;

      // Assert
      expect(family.key).toBe(String.empty);
    });
  });
  //endregion subgroups and families

  //region panels
  describe('classifyPanels', () =>
  {
    it('tolerates a legacy panel row carrying no name at all', () =>
    {
      // Arrange: the name is only read to spot the editor's organizational rows, so a missing
      // one simply means the panel is real.
      const panels = J_SdpPluginMetadata.classifyPanels([ { key: 'panel_a', panelParameters: [] } ]);

      // Act & Assert
      expect(panels.length).toBe(1);
    });

    it('falls back to a blank key for a panel row missing one', () =>
    {
      // Arrange
      const panels = J_SdpPluginMetadata.classifyPanels([ { name: 'Panel A', panelParameters: [] } ]);

      // Act
      const [ panel ] = panels;

      // Assert
      expect(panel.key).toBe(String.empty);
    });

    it('accepts a panel authored with no rewards', () =>
    {
      // Arrange: most panels grant only stat bonuses and have no rank-up scripts at all.
      const panels = J_SdpPluginMetadata.classifyPanels([ { key: 'panel_a', name: 'Panel A', panelParameters: [] } ]);

      // Act
      const [ panel ] = panels;

      // Assert
      expect(panel.panelRewards).toEqual([]);
    });

    it('skips the editor-only organizational rows', () =>
    {
      // Arrange: rows whose names start with the marker prefixes exist to group the editor view.
      const rows = [
        { key: 'header', name: '__ORGANIZATIONAL', panelParameters: [] },
        { key: 'divider', name: '--divider--', panelParameters: [] },
        { key: 'panel_a', name: 'Panel A', panelParameters: [] },
      ];

      // Act
      const panels = J_SdpPluginMetadata.classifyPanels(rows);

      // Assert
      expect(panels.map(panel => panel.key)).toEqual([ 'panel_a' ]);
    });
  });
  //endregion panels

  //region rank up cost
  describe('resolveEffectiveRankUpCostParts', () =>
  {
    it('treats a non-positive panel scale as neutral', () =>
    {
      // Arrange: a zero or negative scale would collapse growth to nothing, so the rarity
      // multiplier is allowed to stand on its own instead.
      const metadata = buildMetadata({});
      const panel = { rarity: 0, multGrowthCost: 0, baseCost: 10, flatGrowthCost: 2 };
      const neutral = { rarity: 0, multGrowthCost: 1.0, baseCost: 10, flatGrowthCost: 2 };

      // Act
      const zeroScaled = metadata.resolveEffectiveRankUpCostParts(panel);
      const neutralScaled = metadata.resolveEffectiveRankUpCostParts(neutral);

      // Assert
      expect(zeroScaled).toEqual(neutralScaled);
    });

    it('honors a positive panel scale', () =>
    {
      // Arrange
      const metadata = buildMetadata({});
      const panel = { rarity: 0, multGrowthCost: 2.0, baseCost: 10, flatGrowthCost: 2 };
      const neutral = { rarity: 0, multGrowthCost: 1.0, baseCost: 10, flatGrowthCost: 2 };

      // Act
      const scaled = metadata.resolveEffectiveRankUpCostParts(panel);
      const neutralScaled = metadata.resolveEffectiveRankUpCostParts(neutral);

      // Assert
      expect(scaled).not.toEqual(neutralScaled);
    });
  });
  //endregion rank up cost

  //region plugin parameter defaults
  describe('plugin parameter defaults', () =>
  {
    it('names the menu command Distribute when the parameter is unset', () =>
    {
      // Arrange: a fresh install has saved no parameters yet, so every label needs a default
      // that reads correctly on screen rather than rendering as undefined.
      const metadata = buildMetadata({});

      // Act & Assert
      expect(metadata.commandName).toBe('Distribute');
    });

    it('calls a single panel a panel when the parameter is unset', () =>
    {
      // Arrange
      const metadata = buildMetadata({});

      // Act & Assert
      expect(metadata.unitSingular).toBe('panel');
    });

    it('calls several panels panels when the parameter is unset', () =>
    {
      // Arrange
      const metadata = buildMetadata({});

      // Act & Assert
      expect(metadata.unitPlural).toBe('panels');
    });

    it('labels the points SDP when the parameter is unset', () =>
    {
      // Arrange
      const metadata = buildMetadata({});

      // Act & Assert
      expect(metadata.sdpPointsDisplayName).toBe('SDP');
    });
  });
  //endregion plugin parameter defaults
});
//endregion plugins/sdp/core/_metadata/plugin-metadata-fallbacks.test.js