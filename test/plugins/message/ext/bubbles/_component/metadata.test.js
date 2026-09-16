//region plugins/message/ext/bubbles/_component/metadata.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installMessageHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJMessageBubbles,
} from '../../../_component/fixtures/install-message-host-globals.js';
import { installPluginManagerWithParams } from '../../../../../setup/install-plugin-manager-with-params.js';

describe('J-Message-Bubbles metadata (direct src import)', () =>
{
  /** @type {object} the J umbrella as J-Base built it; J-Base's bootstrap is once-per-realm. */
  let realJ;

  beforeAll(async () =>
  {
    installMessageHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    realJ = globalThis.J;
  });

  beforeEach(async () =>
  {
    vi.resetModules();

    globalThis.J = realJ;
    globalThis.J.BASE.Metadata.Version = '3.2.0';

    // this extension gates on J-Message as well as J-Base, so a minimal parent umbrella has to exist
    // before the extension will load at all.
    globalThis.J.MESSAGE = {
      Metadata: { version: { version: () => '1.3.1' } },
      EXT: {},
    };

    // PluginMetadata's registry is a private static that throws on a duplicate name; re-importing
    // the class after the module reset hands each test a private, empty registry.
    const { default: FreshPluginMetadata } = await import(
      '../../../../../../src/plugins/_base/core/models/PluginMetadata.js');
    globalThis.PluginMetadata = FreshPluginMetadata;

    // the ship declares no plugin parameters at all, so this is what "the manager has heard of it
    // and it asked for nothing" looks like.
    installPluginManagerWithParams(globalThis, 'J-Message-Bubbles', {});

    setPluginContextToJMessageBubbles();
  });

  describe('version gates', () =>
  {
    it('initializes when both J-Base and J-Message satisfy their required versions', async () =>
    {
      // Arrange & Act
      await import('../../../../../../src/plugins/message/ext/bubbles/_metadata/initialization.js');

      // Assert: the alias surface is declared after the version gate, so its presence is what proves
      // initialization ran all the way through rather than throwing partway.
      expect(Object.keys(globalThis.J.MESSAGE.EXT.BUBBLES.Aliased))
        .toEqual([ 'Game_Interpreter', 'Game_Message', 'Scene_Map', 'Window_Message' ]);
    });

    it('throws when J-Base is below the required version', async () =>
    {
      // Arrange
      globalThis.J.BASE.Metadata.Version = '1.0.0';

      // Act & Assert
      await expect(import('../../../../../../src/plugins/message/ext/bubbles/_metadata/initialization.js'))
        .rejects.toThrow('Either missing J-Base or has a lower version than the required: 3.0.0');
    });

    it('throws when J-Message is below the required version', async () =>
    {
      // Arrange- the bubble is drawn around glyph sprites that only a current J-Message emits, so an
      // older parent would hand this ship a message made of baked pixels with nothing to wrap.
      globalThis.J.MESSAGE.Metadata.version.version = () => '1.0.0';

      // Act & Assert
      await expect(import('../../../../../../src/plugins/message/ext/bubbles/_metadata/initialization.js'))
        .rejects.toThrow('Either missing J-Message or has a lower version than the required: 1.3.0');
    });

    it('throws when J-Base has not been loaded at all', async () =>
    {
      // Arrange- the falsy side of `globalThis.J ||= {}` creates a bare object with no BASE on it,
      // which is what a wrong plugin load order looks like in the editor.
      delete globalThis.J;

      // Act & Assert
      await expect(import('../../../../../../src/plugins/message/ext/bubbles/_metadata/initialization.js'))
        .rejects.toThrow(TypeError);
    });

    it('reuses the existing J umbrella rather than replacing it', async () =>
    {
      // Arrange
      const umbrellaBeforeImport = globalThis.J;

      // Act
      await import('../../../../../../src/plugins/message/ext/bubbles/_metadata/initialization.js');

      // Assert- the truthy side of `globalThis.J ||= {}` keeps every J plugin sharing one namespace.
      expect(globalThis.J).toBe(umbrellaBeforeImport);
    });

    it('preserves an existing message-extension namespace rather than replacing it', async () =>
    {
      // Arrange- `J.MESSAGE.EXT ||= {}` lets a sibling extension stake out the namespace first, and
      // chatter is expected to be sitting there eventually.
      globalThis.J.MESSAGE.EXT = { CHATTER: { placedEarlier: true } };

      // Act
      await import('../../../../../../src/plugins/message/ext/bubbles/_metadata/initialization.js');

      // Assert
      expect(globalThis.J.MESSAGE.EXT.CHATTER.placedEarlier).toBe(true);
      expect(globalThis.J.MESSAGE.EXT.BUBBLES.Metadata).toBeDefined();
    });
  });

  describe('J.MESSAGE.EXT.BUBBLES namespace', () =>
  {
    beforeEach(async () =>
    {
      await import('../../../../../../src/plugins/message/ext/bubbles/_metadata/initialization.js');
    });

    it('creates an aliased-method map for every class the plugin patches', () =>
    {
      // Arrange & Act
      const { Aliased } = globalThis.J.MESSAGE.EXT.BUBBLES;

      // Assert- a missing map surfaces later as "cannot read set of undefined" at patch time.
      expect(Aliased.Game_Interpreter).toBeInstanceOf(Map);
      expect(Aliased.Game_Message).toBeInstanceOf(Map);
      expect(Aliased.Scene_Map).toBeInstanceOf(Map);
      expect(Aliased.Window_Message).toBeInstanceOf(Map);
    });

    it('still performs the base PluginMetadata initialization it extends', () =>
    {
      // Arrange & Act
      const metadata = globalThis.J.MESSAGE.EXT.BUBBLES.Metadata;

      // Assert- the ship declares no parameters of its own, so the parent's parsing having run is
      // the only evidence that extending PluginMetadata did anything at all.
      expect(metadata.parsedPluginParameters).toBeDefined();
      expect(metadata.name).toBe('J-Message-Bubbles');
    });
  });

  describe('the pop text code', () =>
  {
    beforeEach(async () =>
    {
      await import('../../../../../../src/plugins/message/ext/bubbles/_metadata/initialization.js');
    });

    it('captures the target out of a pop code', () =>
    {
      // Arrange
      const { PopTarget } = globalThis.J.MESSAGE.EXT.BUBBLES.RegExp;

      // Act
      const [ , target ] = PopTarget.exec('Nice weather today.\\pop[a1]');

      // Assert
      expect(target).toBe('a1');
    });

    it('captures an empty target rather than failing to match', () =>
    {
      // Arrange- an author who typed the code and forgot the target still gets a plain message,
      // which means the code has to be found so it can be stripped out of the text.
      const { PopTarget } = globalThis.J.MESSAGE.EXT.BUBBLES.RegExp;

      // Act
      const [ , target ] = PopTarget.exec('\\pop[]Nice weather today.');

      // Assert
      expect(target).toBe('');
    });

    it('ignores a longer word that merely starts the same way', () =>
    {
      // Arrange
      const { PopTarget } = globalThis.J.MESSAGE.EXT.BUBBLES.RegExp;

      // Act
      const matched = PopTarget.test('\\popup[a1]');

      // Assert
      expect(matched).toBe(false);
    });
  });
});
//endregion plugins/message/ext/bubbles/_component/metadata.test.js