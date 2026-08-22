//region plugins/popups/ext/abs/_metadata/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installPopupsHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPopups,
  setPluginContextToJPopupsAbs,
} from '../../../_component/fixtures/install-popups-host-globals.js';
import { installPluginManagerWithParams } from '../../../../../setup/install-plugin-manager-with-params.js';

describe('J-Popups-ABS metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installPopupsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    // J_EventEmitter extends PIXI.utils.EventEmitter at module-evaluation time, so it can only be
    // imported once the fixture's PIXI stub is already standing.
    ({ default: globalThis.J_EventEmitter } =
      await import('../../../../../../src/plugins/_base/core/models/J_EventEmitter.js'));

    setPluginContextToJPopups();
    await import('../../../../../../src/plugins/popups/core/_metadata/initialization.js');

    setPluginContextToJPopupsAbs();
    await import('../../../../../../src/plugins/popups/ext/abs/_metadata/initialization.js');
  });

  describe('unconfigured defaults', () =>
  {
    it('leaves skill-used popups enabled when the disable flag is absent', () =>
    {
      // Arrange & Act & Assert: the flag is opt-in, so absence must read as "not disabled".
      expect(globalThis.J.POPUPS.EXT.ABS.Metadata.disableSkillUsedPopups).toBe(false);
    });

    it('enables combat merging by default', () =>
    {
      // Arrange & Act & Assert: merge toggles are opt-out, so absence must read as enabled.
      expect(globalThis.J.POPUPS.EXT.ABS.Metadata.mergeParams.enableCombat).toBe(true);
    });

    it('enables slip merging by default', () =>
    {
      // Arrange & Act & Assert
      expect(globalThis.J.POPUPS.EXT.ABS.Metadata.mergeParams.enableSlip).toBe(true);
    });

    it('enables reward merging by default', () =>
    {
      // Arrange & Act & Assert
      expect(globalThis.J.POPUPS.EXT.ABS.Metadata.mergeParams.enableRewards).toBe(true);
    });

    it('enables mitigation merging by default', () =>
    {
      // Arrange & Act & Assert
      expect(globalThis.J.POPUPS.EXT.ABS.Metadata.mergeParams.enableMitigation).toBe(true);
    });

    it('falls back to the default idle flush window', () =>
    {
      // Arrange & Act & Assert
      expect(globalThis.J.POPUPS.EXT.ABS.Metadata.mergeParams.idleFlushFrames).toBe(90);
    });

    it('falls back to the default damage outline width', () =>
    {
      // Arrange & Act & Assert
      expect(globalThis.J.POPUPS.EXT.ABS.Metadata.damageOutlineWidth).toBe(2);
    });

    it('falls back to a thicker default healing outline width', () =>
    {
      // Arrange & Act & Assert: heals are deliberately outlined heavier than harm.
      expect(globalThis.J.POPUPS.EXT.ABS.Metadata.healingOutlineWidth).toBe(4);
    });
  });

  describe('configured values', () =>
  {
    // PluginMetadata's static registry rejects a duplicate name, so each additional configuration
    // introduces itself under a name of its own. Only the parameter lookup keys off the name.
    const buildWith = async (name, params) =>
    {
      const { default: PopupsAbsPluginMetadata } =
        await import('../../../../../../src/plugins/popups/ext/abs/_metadata/_pluginMetadata.js');
      installPluginManagerWithParams(globalThis, name, params);
      return new PopupsAbsPluginMetadata(name, '1.3.0');
    };

    it('disables skill-used popups when the flag is explicitly true', async () =>
    {
      // Arrange & Act
      const metadata = await buildWith('J-Popups-ABS-SkillOff', { disableSkillUsedPopups: 'true' });

      // Assert
      expect(metadata.disableSkillUsedPopups).toBe(true);
    });

    it('disables a merge toggle only when it is explicitly the string false', async () =>
    {
      // Arrange & Act
      const metadata = await buildWith('J-Popups-ABS-NoCombatMerge', { enableMergeCombat: 'false' });

      // Assert
      expect(metadata.mergeParams.enableCombat).toBe(false);
    });

    it('leaves a merge toggle enabled for any value that is not the string false', async () =>
    {
      // Arrange & Act
      const metadata = await buildWith('J-Popups-ABS-OddMergeValue', { enableMergeSlip: 'yes' });

      // Assert
      expect(metadata.mergeParams.enableSlip).toBe(true);
    });

    it('disables slip merging on its own toggle', async () =>
    {
      // Arrange & Act- each toggle reads its own parameter, so turning one off must be the only
      // thing it turns off.
      const metadata = await buildWith('J-Popups-ABS-NoSlipMerge', { enableMergeSlip: 'false' });

      // Assert
      expect(metadata.mergeParams.enableSlip).toBe(false);
      expect(metadata.mergeParams.enableCombat).toBe(true);
    });

    it('disables reward merging on its own toggle', async () =>
    {
      // Arrange & Act
      const metadata = await buildWith('J-Popups-ABS-NoRewardMerge', { enableMergeRewards: 'false' });

      // Assert
      expect(metadata.mergeParams.enableRewards).toBe(false);
      expect(metadata.mergeParams.enableCombat).toBe(true);
    });

    it('disables mitigation merging on its own toggle', async () =>
    {
      // Arrange & Act
      const metadata = await buildWith('J-Popups-ABS-NoMitigationMerge', { enableMergeMitigation: 'false' });

      // Assert
      expect(metadata.mergeParams.enableMitigation).toBe(false);
      expect(metadata.mergeParams.enableCombat).toBe(true);
    });

    it('parses a configured idle flush window', async () =>
    {
      // Arrange & Act
      const metadata = await buildWith('J-Popups-ABS-Flush', { mergeIdleFlushFrames: '30' });

      // Assert
      expect(metadata.mergeParams.idleFlushFrames).toBe(30);
    });

    it('accepts a zero outline width as a deliberate choice rather than a missing value', async () =>
    {
      // Arrange & Act
      const metadata = await buildWith('J-Popups-ABS-NoOutline', { damageOutlineWidth: '0' });

      // Assert
      expect(metadata.damageOutlineWidth).toBe(0);
    });

    it('rejects a negative outline width in favor of the default', async () =>
    {
      // Arrange & Act
      const metadata = await buildWith('J-Popups-ABS-NegOutline', { damageOutlineWidth: '-5' });

      // Assert: a negative stroke would render as garbage, so the guard falls back.
      expect(metadata.damageOutlineWidth).toBe(2);
    });

    it('rejects a non-numeric outline width in favor of the default', async () =>
    {
      // Arrange & Act
      const metadata = await buildWith('J-Popups-ABS-NaNOutline', { healingOutlineWidth: 'thick' });

      // Assert
      expect(metadata.healingOutlineWidth).toBe(4);
    });

    it('accepts a configured healing outline width in place of the default', async () =>
    {
      // Arrange & Act- the heal width has its own parameter and its own fallback, so a configured
      // value has to reach the metadata rather than being quietly swapped for the default 4.
      const metadata = await buildWith('J-Popups-ABS-ThinHealOutline', { healingOutlineWidth: '9' });

      // Assert
      expect(metadata.healingOutlineWidth).toBe(9);
    });

    it('rejects a negative healing outline width in favor of the default', async () =>
    {
      // Arrange & Act
      const metadata = await buildWith('J-Popups-ABS-NegHealOutline', { healingOutlineWidth: '-3' });

      // Assert: a negative stroke would render as garbage, so the guard falls back.
      expect(metadata.healingOutlineWidth).toBe(4);
    });
  });

  describe('slip popup suppression notetags', () =>
  {
    it('matches the hp slip suppression tag', () =>
    {
      // Arrange & Act & Assert
      expect(globalThis.J.POPUPS.EXT.ABS.RegExp.NoHpSlipPopup.test('<noHpPopup>')).toBe(true);
    });

    it('matches the mp slip suppression tag', () =>
    {
      // Arrange & Act & Assert
      expect(globalThis.J.POPUPS.EXT.ABS.RegExp.NoMpSlipPopup.test('<noMpPopup>')).toBe(true);
    });

    it('matches the tp slip suppression tag', () =>
    {
      // Arrange & Act & Assert
      expect(globalThis.J.POPUPS.EXT.ABS.RegExp.NoTpSlipPopup.test('<noTpPopup>')).toBe(true);
    });

    it('matches the blanket slip suppression tag', () =>
    {
      // Arrange & Act & Assert
      expect(globalThis.J.POPUPS.EXT.ABS.RegExp.NoAnySlipPopup.test('<noSlipPopup>')).toBe(true);
    });

    it('does not let the blanket tag match a single-resource suppression tag', () =>
    {
      // Arrange & Act & Assert: suppressing hp slip alone must not silence mp and tp too.
      expect(globalThis.J.POPUPS.EXT.ABS.RegExp.NoAnySlipPopup.test('<noHpPopup>')).toBe(false);
    });
  });
});
//endregion plugins/popups/ext/abs/_metadata/metadata.test.js
