//region plugins/abs/ext/charge/_metadata/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../../_component/fixtures/install-abs-host-globals.js';
import { setPluginContextToJabsCharge } from '../_component/fixtures/install-abs-charge-host-globals.js';
import { installPluginManagerWithParams } from '../../../../../setup/install-plugin-manager-with-params.js';

describe('J-ABS-Charge metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJAbs();
    await import('../../../../../../src/plugins/abs/core/_metadata/initialization.js');

    installPluginManagerWithParams(globalThis, 'J-ABS-Charge', {
      'defaultChargingAnimId': '120',
      'defaultTierCompleteAnimId': '121',
      'defaultFullyChargedAnimId': '122',
      'tierCompleteSE': 'Skill1',
      'chargeReadySE': 'Skill2',
      'useDefaultChargingSE': 'true',
      'allowTierCompleteSEandAnim': 'false',
    });

    setPluginContextToJabsCharge();
    await import('../../../../../../src/plugins/abs/ext/charge/_metadata/initialization.js');
  });

  it('declares an aliased-method map for every class the plugin patches', () =>
  {
    // Arrange & Act
    const { Aliased } = globalThis.J.ABS.EXT.CHARGE;

    // Assert- a missing map surfaces later as "cannot read set of undefined" at patch time.
    expect(Aliased.Game_Actor).toBeInstanceOf(Map);
    expect(Aliased.Game_Battler).toBeInstanceOf(Map);
    expect(Aliased.Game_BattlerBase).toBeInstanceOf(Map);
    expect(Aliased.Game_Enemy).toBeInstanceOf(Map);
    expect(Aliased.JABS_Action).toBeInstanceOf(Map);
    expect(Aliased.JABS_Battler).toBeInstanceOf(Map);
    expect(Aliased.JABS_StandardController).toBeInstanceOf(Map);
    expect(Aliased.Scene_Boot).toBeInstanceOf(Map);
    expect(Aliased.SoundManager).toBeInstanceOf(Map);
    expect(Aliased.Sprite_Character).toBeInstanceOf(Map);
  });

  it('starts every alias map empty so the patching code owns each entry', () =>
  {
    // Arrange & Act
    const { Aliased } = globalThis.J.ABS.EXT.CHARGE;

    // Assert
    expect(Aliased.Game_Actor.size).toBe(0);
    expect(Aliased.Game_Battler.size).toBe(0);
    expect(Aliased.Game_BattlerBase.size).toBe(0);
    expect(Aliased.Game_Enemy.size).toBe(0);
    expect(Aliased.JABS_Action.size).toBe(0);
    expect(Aliased.JABS_Battler.size).toBe(0);
    expect(Aliased.JABS_StandardController.size).toBe(0);
    expect(Aliased.Scene_Boot.size).toBe(0);
    expect(Aliased.SoundManager.size).toBe(0);
    expect(Aliased.Sprite_Character.size).toBe(0);
  });

  it('completes the base plugin metadata initialization it extends', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.ABS.EXT.CHARGE.Metadata.parsedPluginParameters).toBeDefined();
  });

  describe('plugin parameter translation', () =>
  {
    it('parses each configured animation id into a number', () =>
    {
      // Arrange & Act
      const { Metadata } = globalThis.J.ABS.EXT.CHARGE;

      // Assert
      expect(Metadata.DefaultChargingAnimationId).toBe(120);
      expect(Metadata.DefaultTierCompleteAnimationId).toBe(121);
      expect(Metadata.DefaultFullyChargedAnimationId).toBe(122);
    });

    it('carries the configured sound effect names across as-is', () =>
    {
      // Arrange & Act
      const { Metadata } = globalThis.J.ABS.EXT.CHARGE;

      // Assert
      expect(Metadata.TierCompleteSE).toBe("Skill1");
      expect(Metadata.ChargeReadySE).toBe("Skill2");
    });

    it('treats the stringy true as an enabled toggle', () =>
    {
      // Arrange & Act
      const { Metadata } = globalThis.J.ABS.EXT.CHARGE;

      // Assert- the editor writes booleans as strings, so a raw assignment here would make every value truthy.
      expect(Metadata.UseTierCompleteSE).toBe(true);
    });

    it('treats the stringy false as a disabled toggle', () =>
    {
      // Arrange & Act
      const { Metadata } = globalThis.J.ABS.EXT.CHARGE;

      // Assert
      expect(Metadata.AllowTierCompleteSEandAnimation).toBe(false);
    });

    describe('with both sound toggles flipped', () =>
    {
      /**
       * A second metadata instance built from the opposite pair of toggle strings. Each toggle needs a
       * case on both sides of the `=== "true"` comparison, and the shared instance above can only carry
       * one value per parameter. It registers under its own name because {@link PluginMetadata} throws on
       * a duplicate plugin name, and its registry survives `vi.resetModules()`.
       * @type {J_ChargePluginMetadata}
       */
      let flippedMetadata;

      beforeAll(async () =>
      {
        installPluginManagerWithParams(globalThis, 'J-ABS-Charge-Flipped', {
          'defaultChargingAnimId': '130',
          'defaultTierCompleteAnimId': '131',
          'defaultFullyChargedAnimId': '132',
          'tierCompleteSE': 'Skill3',
          'chargeReadySE': 'Skill4',
          'useDefaultChargingSE': 'false',
          'allowTierCompleteSEandAnim': 'true',
        });

        const { default: J_ChargePluginMetadata } =
          await import('../../../../../../src/plugins/abs/ext/charge/_metadata/_pluginMetadata.js');

        flippedMetadata = new J_ChargePluginMetadata('J-ABS-Charge-Flipped', '1.1.0');
      });

      it('treats the stringy false as a disabled tier-complete sound', () =>
      {
        // Arrange & Act & Assert- anything other than the exact string "true" has to disable this.
        expect(flippedMetadata.UseTierCompleteSE).toBe(false);
      });

      it('treats the stringy true as an enabled sound-with-animation allowance', () =>
      {
        // Arrange & Act & Assert
        expect(flippedMetadata.AllowTierCompleteSEandAnimation).toBe(true);
      });

      it('parses this instance\'s own animation ids rather than reusing the shared ones', () =>
      {
        // Arrange & Act & Assert- proves the flipped parameters actually reached this instance.
        expect(flippedMetadata.DefaultChargingAnimationId).toBe(130);
        expect(flippedMetadata.DefaultTierCompleteAnimationId).toBe(131);
        expect(flippedMetadata.DefaultFullyChargedAnimationId).toBe(132);
      });
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
      setPluginContextToJabsCharge();

      // Act & Assert
      await expect(import('../../../../../../src/plugins/abs/ext/charge/_metadata/initialization.js'))
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
      setPluginContextToJabsCharge();

      // Act & Assert
      await expect(import('../../../../../../src/plugins/abs/ext/charge/_metadata/initialization.js'))
        .rejects.toThrow(/missing J-ABS/);

      // restore the real accessor rather than relying on restoreAllMocks.
      globalThis.J.ABS.Metadata.version.version = originalVersion;
    });
  });
});
//endregion plugins/abs/ext/charge/_metadata/metadata.test.js
