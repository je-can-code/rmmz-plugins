//region plugins/abs/ext/poses/_metadata/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../../_component/fixtures/install-abs-host-globals.js';
import { setPluginContextToJabsPoses } from '../_component/fixtures/install-abs-poses-host-globals.js';
import { installPluginManagerWithParams } from '../../../../../setup/install-plugin-manager-with-params.js';

const INIT_PATH = '../../../../../../src/plugins/abs/ext/poses/_metadata/initialization.js';

describe('J-ABS-Poses metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJAbs();
    await import('../../../../../../src/plugins/abs/core/_metadata/initialization.js');

    installPluginManagerWithParams(globalThis, 'J-ABS-Poses', {
      'menu-switch': '17',
    });

    setPluginContextToJabsPoses();
    await import(INIT_PATH);
  });

  it('declares an aliased-method map for every class the plugin patches', () =>
  {
    // Arrange & Act
    const { Aliased } = globalThis.J.ABS.EXT.POSES;

    // Assert- a missing map surfaces later as "cannot read set of undefined" at patch time.
    expect(Aliased.JABS_Battler).toBeInstanceOf(Map);
    expect(Aliased.JABS_Engine).toBeInstanceOf(Map);
  });

  it('starts every alias map empty so the patching code owns each entry', () =>
  {
    // Arrange & Act
    const { Aliased } = globalThis.J.ABS.EXT.POSES;

    // Assert
    expect(Aliased.JABS_Battler.size).toBe(0);
    expect(Aliased.JABS_Engine.size).toBe(0);
  });

  it('completes the base plugin metadata initialization it extends', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.ABS.EXT.POSES.Metadata.parsedPluginParameters).toBeDefined();
  });

  describe('gameAssetExists', () =>
  {
    // this helper reaches for Node's real `path` and `fs` through a bare `require`, so it is
    // exercised against the real filesystem rather than a stub. Pointing `process.mainModule` at a
    // file inside this repository makes the repository root stand in for the game project root.
    const anchorProjectRootAt = directory =>
    {
      globalThis.process.mainModule = { filename: `${directory}/index.js` };
    };

    it('reports true when the asset is present on disk', () =>
    {
      // Arrange
      anchorProjectRootAt(process.cwd());

      // Act & Assert
      expect(globalThis.J.ABS.EXT.POSES.Helpers.gameAssetExists('package.json')).toBe(true);
    });

    it('reports false when the asset is missing', () =>
    {
      // Arrange
      anchorProjectRootAt(process.cwd());

      // Act & Assert- a missing pose sheet degrades to the default sprite rather than crashing.
      expect(globalThis.J.ABS.EXT.POSES.Helpers.gameAssetExists('no-such-pose-sheet.png'))
        .toBe(false);
    });

    it('anchors the lookup at the project root rather than the current working directory', () =>
    {
      // Arrange- anchor one directory deeper than the file actually lives.
      anchorProjectRootAt(`${process.cwd()}/src`);

      // Act & Assert- resolving against the entry module's directory (the same anchor
      // StorageManager uses for saves) is what makes asset paths portable; resolving against the
      // working directory instead would have found this file.
      expect(globalThis.J.ABS.EXT.POSES.Helpers.gameAssetExists('package.json')).toBe(false);
    });
  });

  describe('plugin parameter translation', () =>
  {
    it('parses the menu switch id out of the plugin parameters', () =>
    {
      // Arrange & Act
      const { Metadata } = globalThis.J.ABS.EXT.POSES;

      // Assert
      expect(Metadata.menuSwitchId).toBe(17);
    });
  });

  describe('host version requirements', () =>
  {
    it('throws when J-Base does not satisfy the minimum required version', async () =>
    {
      // Arrange: drop the already-installed J-Base metadata below this extension's floor.
      vi.resetModules();
      const originalVersion = globalThis.J.BASE.Metadata.Version;
      globalThis.J.BASE.Metadata.Version = '0.0.1';
      setPluginContextToJabsPoses();

      // Act & Assert
      await expect(import(INIT_PATH)).rejects.toThrow(/missing J-Base/);

      // restore the satisfying version so later tests in this file are unaffected.
      globalThis.J.BASE.Metadata.Version = originalVersion;
    });

    it('throws when J-ABS does not satisfy the minimum required version', async () =>
    {
      // Arrange: J-Base has to keep passing so the J-ABS check is the one that trips.
      vi.resetModules();
      const originalVersion = globalThis.J.ABS.Metadata.version.version;
      globalThis.J.ABS.Metadata.version.version = () => '0.0.1';
      setPluginContextToJabsPoses();

      // Act & Assert
      await expect(import(INIT_PATH)).rejects.toThrow(/missing J-ABS/);

      // restore the real accessor rather than relying on restoreAllMocks.
      globalThis.J.ABS.Metadata.version.version = originalVersion;
    });
  });
});
//endregion plugins/abs/ext/poses/_metadata/metadata.test.js
