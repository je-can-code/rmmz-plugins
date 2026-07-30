//region plugins/omni/core/_component/metadata.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installOmniHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJOmnipedia,
} from '../../_component/fixtures/install-omni-host-globals.js';

const jBaseInitPath = '../../../../../src/plugins/_base/_metadata/initialization.js';
const omniInitPath = '../../../../../src/plugins/omni/core/_metadata/initialization.js';
const pluginMetadataPath = '../../../../../src/plugins/_base/models/PluginMetadata.js';

/**
 * The J umbrella object as J-Base built it, captured once and restored before every test.
 *
 * J-Base's bootstrap can only ever run *once per realm*: it ends with
 * `Object.defineProperty(Array, "empty", { configurable: false })`, and a second evaluation dies with
 * "Cannot redefine property: empty". So the umbrella is built a single time and handed back to each
 * test by reference, rather than rebuilt- which also means any test that mutates `J.BASE` or deletes
 * `J` outright has to be undone here instead of by re-importing.
 * @type {object}
 */
let realJ;

describe('J-Omnipedia core metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    installOmniHostGlobals();

    setPluginContextToJBase();
    await import(jBaseInitPath);

    realJ = globalThis.J;
  });

  beforeEach(async () =>
  {
    // drop only the *omni* half of the module graph; J-Base's already-evaluated modules stay put.
    vi.resetModules();

    // undo whatever the previous test did to the shared umbrella.
    globalThis.J = realJ;
    globalThis.J.BASE.Metadata.Version = '3.2.0';
    delete globalThis.J.OMNI;

    // PluginMetadata tracks every registered plugin on a private *static* field and `#registerPlugin`
    // throws outright on a duplicate name. Re-importing the class after the module reset gives each
    // test a private, empty registry, so constructing J-Omnipedia's metadata a second time exercises
    // the constructor instead of dying on "Duplicate plugin entry detected".
    const { default: FreshPluginMetadata } = await import(pluginMetadataPath);
    globalThis.PluginMetadata = FreshPluginMetadata;

    setPluginContextToJOmnipedia();
  });

  describe('version gate', () =>
  {
    it('initializes the plugin when J-Base satisfies the required version', async () =>
    {
      // Arrange & Act
      await import(omniInitPath);

      // Assert
      expect(globalThis.J.OMNI.Metadata.name).toBe('J-Omnipedia');
    });

    it('throws when J-Base is present but below the required version', async () =>
    {
      // Arrange- the gate reads J.BASE.Metadata.Version at import time, so lowering it here is
      // indistinguishable from the user actually running an out-of-date J-Base.
      globalThis.J.BASE.Metadata.Version = '1.0.0';

      // Act & Assert
      await expect(import(omniInitPath)).rejects.toThrow(
        'Either missing J-Base or has a lower version than the required: 3.2.0');
    });

    it('throws when J-Base has not been loaded at all', async () =>
    {
      // Arrange- removing the umbrella entirely drives the falsy side of `globalThis.J ||= {}`. The
      // freshly-created empty object has no BASE on it, so the gate cannot even read a version. This
      // is what a wrong plugin load order looks like in the real editor.
      delete globalThis.J;

      // Act & Assert
      await expect(import(omniInitPath)).rejects.toThrow(TypeError);
    });

    it('reuses the existing J umbrella rather than replacing it', async () =>
    {
      // Arrange- capture the object identity that J-Base already installed.
      const umbrellaBeforeImport = globalThis.J;

      // Act
      await import(omniInitPath);

      // Assert- the truthy side of `globalThis.J ||= {}` leaves the original object untouched, which
      // is what lets every J plugin share one namespace instead of clobbering each other.
      expect(globalThis.J).toBe(umbrellaBeforeImport);
      expect(globalThis.J.BASE).toBeDefined();
    });
  });

  describe('J.OMNI namespace', () =>
  {
    beforeEach(async () =>
    {
      await import(omniInitPath);
    });

    it('records the plugin version from the build-time identity', () =>
    {
      // Arrange & Act
      const { version } = globalThis.J.OMNI.Metadata;

      // Assert
      expect(version.major).toBe(1);
      expect(version.minor).toBe(0);
      expect(version.patch).toBe(0);
    });

    it('creates an aliased-method map for every class the plugin patches', () =>
    {
      // Arrange & Act
      const { Aliased } = globalThis.J.OMNI;

      // Assert- each of these is a Map the plugin later writes original method references into; a
      // missing one would surface as a confusing "cannot read set of undefined" at patch time.
      expect(Aliased.Game_Party).toBeInstanceOf(Map);
      expect(Aliased.Scene_Map).toBeInstanceOf(Map);
      expect(Aliased.Scene_Menu).toBeInstanceOf(Map);
      expect(Aliased.Window_MenuCommand).toBeInstanceOf(Map);
    });
  });

  describe('J_Omnipedia_PluginMetadata', () =>
  {
    beforeEach(async () =>
    {
      await import(omniInitPath);
    });

    it('builds the menu command descriptor during postInitialize', () =>
    {
      // Arrange & Act
      const { Command } = globalThis.J.OMNI.Metadata;

      // Assert
      expect(Command).toEqual({
        Name: 'The Omnipedia',
        Symbol: 'omni-menu',
        IconIndex: 232,
        ColorIndex: 5,
      });
    });

    it('exposes the switch ids that gate the command in both menus', () =>
    {
      // Arrange & Act
      const metadata = globalThis.J.OMNI.Metadata;

      // Assert- both currently point at the same switch, which is what lets one in-game toggle hide
      // the Omnipedia from the JABS quick menu and the main menu together.
      expect(metadata.InJabsMenuSwitch).toBe(102);
      expect(metadata.InMainMenuSwitch).toBe(102);
    });

    it('still performs the base PluginMetadata initialization it extends', () =>
    {
      // Arrange & Act
      const metadata = globalThis.J.OMNI.Metadata;

      // Assert- postInitialize is an *extension*, so the parent's parameter parsing has to have run
      // too. An override that forgot its super() call would leave these unset.
      expect(metadata.name).toBe('J-Omnipedia');
      expect(metadata.parsedPluginParameters).toBeDefined();
    });
  });
});
//endregion plugins/omni/core/_component/metadata.test.js
