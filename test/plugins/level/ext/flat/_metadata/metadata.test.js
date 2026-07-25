//region plugins/level/ext/flat/_metadata/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installLevelHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJLevel,
  setPluginContextToJLevelFlat,
} from '../../../_component/fixtures/install-level-host-globals.js';

describe('J-LEVEL-Flat metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installLevelHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJLevel();
    await import('../../../../../../src/plugins/level/core/_metadata/initialization.js');

    setPluginContextToJLevelFlat();
    await import('../../../../../../src/plugins/level/ext/flat/_metadata/initialization.js');
  });

  it('exposes plugin name on J.LEVEL.EXT.FLAT.Metadata', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.LEVEL.EXT.FLAT.Metadata.name).toBe('J-LEVEL-Flat');
  });

  it('exposes plugin version on J.LEVEL.EXT.FLAT.Metadata', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.LEVEL.EXT.FLAT.Metadata.version).toMatchObject({ major: 1, minor: 0, patch: 0 });
  });

  it('falls back to the default flat experience per level when unconfigured', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.LEVEL.EXT.FLAT.Metadata.expPerLevel).toBe(1000);
  });

  it('falls back to the default policy multiplier when unconfigured', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.LEVEL.EXT.FLAT.Metadata.policyMultiplier).toBe(1.0);
  });

  it('initializes an empty aliased map for Game_Troop', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.LEVEL.EXT.FLAT.Aliased.Game_Troop).toBeInstanceOf(Map);
    expect(globalThis.J.LEVEL.EXT.FLAT.Aliased.Game_Troop.size).toBe(0);
  });
});
//endregion plugins/level/ext/flat/_metadata/metadata.test.js
