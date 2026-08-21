//region plugins/abs/ext/juice/_metadata/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../../_component/fixtures/install-abs-host-globals.js';
import {
  installJuiceExternalConfig,
  SAMPLE_JUICE_CONFIG,
  setPluginContextToJabsJuice,
} from '../_component/fixtures/install-abs-juice-host-globals.js';
import { installPluginManagerWithParams } from '../../../../../setup/install-plugin-manager-with-params.js';

describe('J-ABS-Juice metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJAbs();
    await import('../../../../../../src/plugins/abs/core/_metadata/initialization.js');

    installPluginManagerWithParams(globalThis, 'J-ABS-Juice', {});

    // this extension reads its tuning out of J-ABS's parsed external configuration rather than its
    // own plugin parameters, and J-ABS guarantees that config is present before extensions run.
    installJuiceExternalConfig();

    setPluginContextToJabsJuice();
    await import('../../../../../../src/plugins/abs/ext/juice/_metadata/initialization.js');
  });

  describe('external configuration translation', () =>
  {
    it('carries the target squish intensities straight across', () =>
    {
      // Arrange & Act
      const { Metadata } = globalThis.J.ABS.EXT.JUICE;

      // Assert
      expect(Metadata.targetPhysicalSquishIntensity).toBe(SAMPLE_JUICE_CONFIG.target.physicalSquishIntensity);
      expect(Metadata.targetMagicalSquishIntensity).toBe(SAMPLE_JUICE_CONFIG.target.magicalSquishIntensity);
    });

    it('truncates frame counts, because a fractional frame cannot be waited out', () =>
    {
      // Arrange & Act
      const { Metadata } = globalThis.J.ABS.EXT.JUICE;

      // Assert: the config carries 8.7 and 6.9, and both have to land on whole frames.
      expect(Metadata.targetSquishFrames).toBe(8);
      expect(Metadata.dodgeSquishFrames).toBe(6);
    });

    it('truncates the flurry decay percent as well', () =>
    {
      // Arrange & Act & Assert
      expect(globalThis.J.ABS.EXT.JUICE.Metadata.flurryDecayPercent).toBe(50);
    });

    it('reduces each weapon profile to just its tilt and swing multipliers', () =>
    {
      // Arrange & Act
      const { Metadata } = globalThis.J.ABS.EXT.JUICE;

      // Assert: profiles are keyed by weapon style tag, and only these two factors are consumed-
      // anything else the editor writes into a profile is deliberately dropped here.
      expect(Metadata.weaponStyleMultipliers.axe).toEqual({ tiltMul: 1.4, swingMul: 1.6 });
    });

    it('keeps a profile per configured weapon style rather than collapsing them', () =>
    {
      // Arrange & Act & Assert
      expect(Object.keys(globalThis.J.ABS.EXT.JUICE.Metadata.weaponStyleMultipliers))
        .toEqual([ 'sword', 'axe' ]);
    });
  });

  it('declares an aliased-method map for every class the plugin patches', () =>
  {
    // Arrange & Act
    const { Aliased } = globalThis.J.ABS.EXT.JUICE;

    // Assert- a missing map surfaces later as "cannot read set of undefined" at patch time.
    expect(Aliased.JABS_Engine).toBeInstanceOf(Map);
    expect(Aliased.JABS_Battler).toBeInstanceOf(Map);
    expect(Aliased.Scene_Map).toBeInstanceOf(Map);
    expect(Aliased.Sprite_Character).toBeInstanceOf(Map);
  });

  it('starts every alias map empty so the patching code owns each entry', () =>
  {
    // Arrange & Act
    const { Aliased } = globalThis.J.ABS.EXT.JUICE;

    // Assert
    expect(Aliased.JABS_Engine.size).toBe(0);
    expect(Aliased.JABS_Battler.size).toBe(0);
    expect(Aliased.Scene_Map.size).toBe(0);
    expect(Aliased.Sprite_Character.size).toBe(0);
  });

  it('completes the base plugin metadata initialization it extends', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.ABS.EXT.JUICE.Metadata.parsedPluginParameters).toBeDefined();
  });

  describe('host version requirements', () =>
  {
    it('throws when J-Base does not satisfy the minimum required version', async () =>
    {
      // Arrange: drop the already-installed J-Base metadata below this extension's floor.
      vi.resetModules();
      const originalVersion = globalThis.J.BASE.Metadata.Version;
      globalThis.J.BASE.Metadata.Version = '0.0.1';
      setPluginContextToJabsJuice();

      // Act & Assert
      await expect(import('../../../../../../src/plugins/abs/ext/juice/_metadata/initialization.js'))
        .rejects.toThrow(/missing J-Base/);

      // restore the satisfying version so later tests in this file are unaffected.
      globalThis.J.BASE.Metadata.Version = originalVersion;
    });

    it('throws when J-ABS does not satisfy the minimum required version', async () =>
    {
      // Arrange: J-Base has to keep passing so the J-ABS check is the one that trips.
      vi.resetModules();
      const originalVersion = globalThis.J.ABS.Metadata.version.version;
      globalThis.J.ABS.Metadata.version.version = () => '0.0.1';
      setPluginContextToJabsJuice();

      // Act & Assert
      await expect(import('../../../../../../src/plugins/abs/ext/juice/_metadata/initialization.js'))
        .rejects.toThrow(/missing J-ABS/);

      // restore the real accessor rather than relying on restoreAllMocks.
      globalThis.J.ABS.Metadata.version.version = originalVersion;
    });
  });
});
//endregion plugins/abs/ext/juice/_metadata/metadata.test.js
