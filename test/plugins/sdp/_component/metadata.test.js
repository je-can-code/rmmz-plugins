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
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJSdp();
    await import('../../../../src/plugins/sdp/core/_metadata/initialization.js');
  });

  describe('plugin parameters', () =>
  {
    it('maps the plugin name', () =>
    {
      // Arrange & Act & Assert
      expect(globalThis.J.SDP.Metadata.name).toBe('J-SDP');
    });

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
});
//endregion plugins/sdp/_component/metadata.test.js
