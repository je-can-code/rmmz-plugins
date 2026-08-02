//region plugins/sdp/_component/sdp-metadata-panels.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installSdpHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJSdp,
} from './fixtures/install-sdp-host-globals.js';
import { buildVitestSdpConfigJson } from './fixtures/build-sdp-config-json.js';

describe('J-SDP metadata panels (direct src import)', () =>
{
  let panel;

  beforeAll(async () =>
  {
    vi.resetModules();

    const { default: StatDistributionPanel } = await import('../../../../src/plugins/sdp/core/models/StatDistributionPanel.js');
    const { default: PanelParameter } = await import('../../../../src/plugins/sdp/core/models/PanelParameter.js');
    const { default: PanelRarity } = await import('../../../../src/plugins/sdp/core/models/PanelRarity.js');
    const sdpConfigJson = buildVitestSdpConfigJson(StatDistributionPanel, PanelParameter, PanelRarity);

    installSdpHostGlobals(globalThis, sdpConfigJson);

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJSdp();
    await import('../../../../src/plugins/sdp/core/_metadata/initialization.js');

    panel = globalThis.J.SDP.Metadata.panelsMap.get('vitest_panel');
  });

  describe('vitest_panel classification', () =>
  {
    it('sets maxRank from progression', () =>
    {
      // Arrange & Act & Assert
      expect(panel.maxRank).toBe(3);
    });

    it('sets baseCost from progression', () =>
    {
      // Arrange & Act & Assert
      expect(panel.baseCost).toBe(0);
    });

    it('sets flatGrowthCost from progression', () =>
    {
      // Arrange & Act & Assert
      expect(panel.flatGrowthCost).toBe(0);
    });

    it('sets multGrowthCost from progression', () =>
    {
      // Arrange & Act & Assert
      expect(panel.multGrowthCost).toBe(1);
    });

    it('parses exactly one panel parameter', () =>
    {
      // Arrange & Act & Assert
      expect(panel.panelParameters.length).toBe(1);
    });

    it('parses the panel parameter key', () =>
    {
      // Arrange & Act & Assert
      expect(panel.panelParameters[0].parameterKey).toBe('mhp');
    });

    it('parses the panel parameter perRank', () =>
    {
      // Arrange & Act & Assert
      expect(panel.panelParameters[0].perRank).toBe(1);
    });

    it('parses the panel parameter isCore flag', () =>
    {
      // Arrange & Act & Assert
      expect(panel.panelParameters[0].isCore).toBe(true);
    });

    it('does not participate in the mastery program', () =>
    {
      // Arrange & Act & Assert
      expect(panel.mastery.participates()).toBe(false);
    });
  });

  describe('rankUpCost (rarity defaults layered with per-panel offsets)', () =>
  {
    const flat = 70;
    const mult = 1.06;

    it('computes rank 0 -> 1 cost from the common rarity flat/mult defaults', () =>
    {
      // Arrange & Act & Assert
      expect(panel.rankUpCost(0)).toBe(Math.floor(flat * (mult ** 1)));
    });

    it('computes rank 1 -> 2 cost from the common rarity flat/mult defaults', () =>
    {
      // Arrange & Act & Assert
      expect(panel.rankUpCost(1)).toBe(Math.floor(flat * (mult ** 2)));
    });

    it('computes rank 2 -> 3 cost from the common rarity flat/mult defaults', () =>
    {
      // Arrange & Act & Assert
      expect(panel.rankUpCost(2)).toBe(Math.floor(flat * (mult ** 3)));
    });

    it('returns 0 once the panel is already at max rank', () =>
    {
      // Arrange & Act & Assert
      expect(panel.rankUpCost(3)).toBe(0);
    });
  });

  describe('panelsMap organizational row filtering', () =>
  {
    it('excludes organizational rows (keys starting with __) from panelsMap', () =>
    {
      // Arrange
      const keys = [ ...globalThis.J.SDP.Metadata.panelsMap.keys() ];

      // Act & Assert
      expect(keys.some(k => k.startsWith('__'))).toBe(false);
    });

    it('still includes vitest_panel in panelsMap', () =>
    {
      // Arrange
      const keys = [ ...globalThis.J.SDP.Metadata.panelsMap.keys() ];

      // Act & Assert
      expect(keys).toContain('vitest_panel');
    });
  });
});
//endregion plugins/sdp/_component/sdp-metadata-panels.test.js
