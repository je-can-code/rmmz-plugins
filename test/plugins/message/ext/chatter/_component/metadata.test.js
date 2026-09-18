//region plugins/message/ext/chatter/_component/metadata.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installMessageHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJMessageChatter,
} from '../../../_component/fixtures/install-message-host-globals.js';
import { installPluginManagerWithParams } from '../../../../../setup/install-plugin-manager-with-params.js';

describe('J-Message-Chatter metadata (direct src import)', () =>
{
  /** @type {object} the J umbrella as J-Base built it; J-Base's bootstrap is once-per-realm. */
  let realJ;

  /** @type {string} the ship's own bootstrap, which every case here imports. */
  const initializationPath = '../../../../../../src/plugins/message/ext/chatter/_metadata/initialization.js';

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

    // this extension gates on three plugins, so a minimal umbrella for each has to exist before it
    // will load at all.
    globalThis.J.MESSAGE = {
      Metadata: { version: { version: () => '2.0.0' } },
      EXT: {
        BUBBLES: { Metadata: { version: { version: () => '1.2.1' } } },
      },
    };

    // PluginMetadata's registry is a private static that throws on a duplicate name; re-importing
    // the class after the module reset hands each test a private, empty registry.
    const { default: FreshPluginMetadata } = await import(
      '../../../../../../src/plugins/_base/core/models/PluginMetadata.js');
    globalThis.PluginMetadata = FreshPluginMetadata;

    // the ship declares no plugin parameters at all, so this is what "the manager has heard of it
    // and it asked for nothing" looks like.
    installPluginManagerWithParams(globalThis, 'J-Message-Chatter', {});

    setPluginContextToJMessageChatter();
  });

  describe('version gates', () =>
  {
    it('initializes when all three of its bases satisfy their required versions', async () =>
    {
      // Arrange & Act
      await import(initializationPath);

      // Assert- the alias surface is declared after the version gates, so its presence is what proves
      // initialization ran all the way through rather than throwing partway.
      expect(Object.keys(globalThis.J.MESSAGE.EXT.CHATTER.Aliased))
        .toEqual([ 'Game_Event', 'Game_Map', 'Scene_Map', 'Window_Message' ]);
    });

    it('throws when J-Base is below the required version', async () =>
    {
      // Arrange
      globalThis.J.BASE.Metadata.Version = '1.0.0';

      // Act & Assert
      await expect(import(initializationPath))
        .rejects.toThrow('Either missing J-Base or has a lower version than the required: 3.0.0');
    });

    it('throws when J-Message is below the required version', async () =>
    {
      // Arrange- a chatter line is laid out by a J-Message layout pass, which older versions of that
      // plugin have no seam for at all.
      globalThis.J.MESSAGE.Metadata.version.version = () => '1.0.0';

      // Act & Assert
      await expect(import(initializationPath))
        .rejects.toThrow('Either missing J-Message or has a lower version than the required: 2.0.0');
    });

    it('throws when J-Message-Bubbles is below the required version', async () =>
    {
      // Arrange- chatter draws its lines as that plugin's bubbles and resolves its targets with that
      // plugin's grammar, so it is a base rather than a nice-to-have.
      globalThis.J.MESSAGE.EXT.BUBBLES.Metadata.version.version = () => '0.1.0';

      // Act & Assert
      await expect(import(initializationPath))
        .rejects.toThrow('Either missing J-Message-Bubbles or has a lower version than the required: 1.2.1');
    });

    it('throws when J-Base has not been loaded at all', async () =>
    {
      // Arrange- the falsy side of `globalThis.J ||= {}` creates a bare object with no BASE on it,
      // which is what a wrong plugin load order looks like in the editor.
      delete globalThis.J;

      // Act & Assert
      await expect(import(initializationPath))
        .rejects.toThrow(TypeError);
    });

    it('reuses the existing J umbrella rather than replacing it', async () =>
    {
      // Arrange
      const umbrellaBeforeImport = globalThis.J;

      // Act
      await import(initializationPath);

      // Assert- the truthy side of `globalThis.J ||= {}` keeps every J plugin sharing one namespace.
      expect(globalThis.J).toBe(umbrellaBeforeImport);
    });

    it('preserves an existing message-extension namespace rather than replacing it', async () =>
    {
      // Arrange- `J.MESSAGE.EXT ||= {}` is what lets this ship load beside the bubbles ship rather
      // than on top of it, and bubbles is always already there.
      globalThis.J.MESSAGE.EXT.BUBBLES.placedEarlier = true;

      // Act
      await import(initializationPath);

      // Assert
      expect(globalThis.J.MESSAGE.EXT.BUBBLES.placedEarlier).toBe(true);
      expect(globalThis.J.MESSAGE.EXT.CHATTER.Metadata).toBeDefined();
    });
  });

  describe('J.MESSAGE.EXT.CHATTER namespace', () =>
  {
    beforeEach(async () =>
    {
      await import(initializationPath);
    });

    it('creates an aliased-method map for every class the plugin patches', () =>
    {
      // Arrange & Act
      const { Aliased } = globalThis.J.MESSAGE.EXT.CHATTER;

      // Assert- a missing map surfaces later as "cannot read set of undefined" at patch time.
      expect(Aliased.Game_Event).toBeInstanceOf(Map);
      expect(Aliased.Game_Map).toBeInstanceOf(Map);
      expect(Aliased.Scene_Map).toBeInstanceOf(Map);
      expect(Aliased.Window_Message).toBeInstanceOf(Map);
    });

    it('still performs the base PluginMetadata initialization it extends', () =>
    {
      // Arrange & Act
      const metadata = globalThis.J.MESSAGE.EXT.CHATTER.Metadata;

      // Assert- the ship declares no parameters of its own, so the parent's parsing having run is
      // the only evidence that extending PluginMetadata did anything at all.
      expect(metadata.parsedPluginParameters).toBeDefined();
      expect(metadata.name).toBe('J-Message-Chatter');
    });
  });

  describe('the tag patterns', () =>
  {
    beforeEach(async () =>
    {
      await import(initializationPath);
    });

    it('captures a line out of a chatter tag', () =>
    {
      // Arrange
      const { Chatter } = globalThis.J.MESSAGE.EXT.CHATTER.RegExp;

      // Act
      const [ , line ] = Chatter.exec('<chatter:Anything I can get you?>');

      // Assert
      expect(line).toBe('Anything I can get you?');
    });

    it('does not read a tuning tag as a line', () =>
    {
      // Arrange- every tuning tag begins with the same word the line tag is spelled with, so the
      // colon is the only thing telling them apart.
      const { Chatter } = globalThis.J.MESSAGE.EXT.CHATTER.RegExp;

      // Act
      const matched = Chatter.test('<chatterRadius:5>');

      // Assert
      expect(matched).toBe(false);
    });

    it('captures a radius', () =>
    {
      // Arrange
      const { ChatterRadius } = globalThis.J.MESSAGE.EXT.CHATTER.RegExp;

      // Act
      const [ , tiles ] = ChatterRadius.exec('<chatterRadius:5>');

      // Assert
      expect(tiles).toBe('5');
    });

    it('captures a backdrop', () =>
    {
      // Arrange
      const { ChatterBackground } = globalThis.J.MESSAGE.EXT.CHATTER.RegExp;

      // Act
      const [ , word ] = ChatterBackground.exec('<chatterBackground:dim>');

      // Assert
      expect(word).toBe('dim');
    });

    it('refuses a backdrop that is not one of the three words', () =>
    {
      // Arrange- an author reaching for a look the engine does not have gets the ordinary bubble
      // rather than an invisible one.
      const { ChatterBackground } = globalThis.J.MESSAGE.EXT.CHATTER.RegExp;

      // Act
      const matched = ChatterBackground.test('<chatterBackground:frosted>');

      // Assert
      expect(matched).toBe(false);
    });

    it('refuses a position that is not one of the three words', () =>
    {
      // Arrange- an author reaching for something the grammar does not offer gets the default rather
      // than a bubble somewhere nobody asked for.
      const { ChatterPosition } = globalThis.J.MESSAGE.EXT.CHATTER.RegExp;

      // Act
      const matched = ChatterPosition.test('<chatterPosition:sideways>');

      // Assert
      expect(matched).toBe(false);
    });
  });
});
//endregion plugins/message/ext/chatter/_component/metadata.test.js