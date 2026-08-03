//region plugins/cms/core/_metadata/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_CMS_PLUGIN_PARAMS,
  installCmsHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJCms,
} from '../../_component/fixtures/install-cms-host-globals.js';

const CMS_INIT_PATH = '../../../../../src/plugins/cms/core/_metadata/initialization.js';

describe('J-CMS metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installCmsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJCms();
    await import(CMS_INIT_PATH);
  });

  describe('command help text', () =>
  {
    it('maps each configured menu command symbol to its help text', () =>
    {
      // Arrange & Act
      const { commandHelpText } = globalThis.J.CMS.Metadata;

      // Assert
      expect(commandHelpText.get('item')).toBe(DEFAULT_CMS_PLUGIN_PARAMS['help-item']);
      expect(commandHelpText.get('save')).toBe(DEFAULT_CMS_PLUGIN_PARAMS['help-save']);
    });

    it('keys the map by command symbol rather than by parameter name', () =>
    {
      // Arrange & Act
      const { commandHelpText } = globalThis.J.CMS.Metadata;

      // Assert: the window looks these up by the symbol it already has in hand.
      expect([ ...commandHelpText.keys() ]).toEqual([
        'item', 'skill', 'equip', 'status', 'options', 'save', 'gameEnd', 'formation',
      ]);
    });

    it('falls back to an empty string for a symbol left unconfigured', () =>
    {
      // Arrange & Act & Assert: formation ships unconfigured, and an undefined here would render
      // as the literal text "undefined" in the help window.
      expect(globalThis.J.CMS.Metadata.commandHelpText.get('formation')).toBe('');
    });
  });

  describe('helpTextFor', () =>
  {
    it('returns the help text registered against a known symbol', () =>
    {
      // Arrange & Act & Assert
      expect(globalThis.J.CMS.Metadata.helpTextFor('equip'))
        .toBe(DEFAULT_CMS_PLUGIN_PARAMS['help-equip']);
    });

    it('returns an empty string for a symbol it has never heard of', () =>
    {
      // Arrange & Act & Assert: other plugins add their own menu commands, and an unknown symbol
      // has to render as blank rather than crash the help window.
      expect(globalThis.J.CMS.Metadata.helpTextFor('sdp')).toBe('');
    });
  });

  describe('with nothing configured at all', () =>
  {
    it('falls back to an empty string for every command symbol', async () =>
    {
      // Arrange- a fresh install has no help text configured, and every one of these has to render
      // as blank rather than as the literal text "undefined". PluginMetadata's static registry
      // rejects a duplicate name, so this configuration introduces itself under one of its own.
      const { default: CmsPluginMetadata } =
        await import('../../../../../src/plugins/cms/core/_metadata/_pluginMetadata.js');
      const { installPluginManagerWithParams } =
        await import('../../../../setup/install-plugin-manager-with-params.js');
      installPluginManagerWithParams(globalThis, 'J-CMS-Unconfigured', {});

      // Act
      const metadata = new CmsPluginMetadata('J-CMS-Unconfigured', '1.0.0');

      // Assert
      const everySymbol = [ 'item', 'skill', 'equip', 'status', 'options', 'save', 'gameEnd', 'formation' ];
      everySymbol.forEach(symbol => expect(metadata.commandHelpText.get(symbol)).toBe(''));
    });
  });

  describe('host version requirements', () =>
  {
    it('throws when J-Base does not satisfy the minimum required version', async () =>
    {
      // Arrange: drop the already-installed J-Base metadata below the menu's floor.
      vi.resetModules();
      const originalVersion = globalThis.J.BASE.Metadata.Version;
      globalThis.J.BASE.Metadata.Version = '0.0.1';
      setPluginContextToJCms();

      // Act & Assert
      await expect(import(CMS_INIT_PATH)).rejects.toThrow(/missing J-Base/);

      // restore the satisfying version so later tests in this file are unaffected.
      globalThis.J.BASE.Metadata.Version = originalVersion;
    });
  });
});
//endregion plugins/cms/core/_metadata/metadata.test.js
