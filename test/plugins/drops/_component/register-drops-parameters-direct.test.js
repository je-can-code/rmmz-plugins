//region plugins/drops/_component/register-drops-parameters-direct.test.js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import NaturalParameterBinding from '../../../../src/plugins/_base/core/models/NaturalParameterBinding.js';
import ParameterDefinition from '../../../../src/plugins/_base/core/models/ParameterDefinition.js';
import ParameterDisplayPolicy from '../../../../src/plugins/_base/core/core/ParameterDisplayPolicy.js';
import ParameterFormat from '../../../../src/plugins/_base/core/core/ParameterFormat.js';
import ParameterGroups from '../../../../src/plugins/_base/core/core/ParameterGroups.js';
import ParameterRegistry from '../../../../src/plugins/_base/core/core/ParameterRegistry.js';
import SdpParameterBinding from '../../../../src/plugins/_base/core/models/SdpParameterBinding.js';

/**
 * registerDropsParameters.js is not itself an ES module consumer of these classes- in the
 * concatenated plugin build they're bare host globals, just like Game_Battler. This suite imports
 * the real _base classes (pure, no host globals of their own) and hangs them off globalThis so the
 * registration file under test resolves them exactly as it would in the shipped bundle, then verifies
 * the resulting ParameterRegistry entries end-to-end. Mirrors crit/register-crit-parameters-direct.test.js.
 */
describe('DropsParameterRegistration.registerAll (drops core, direct src import)', () =>
{
  beforeEach(async () =>
  {
    vi.resetModules();
    ParameterRegistry._definitions.clear();
    ParameterRegistry._groupCache.clear();
    ParameterRegistry._naturalBindings.clear();

    globalThis.NaturalParameterBinding = NaturalParameterBinding;
    globalThis.ParameterDefinition = ParameterDefinition;
    globalThis.ParameterDisplayPolicy = ParameterDisplayPolicy;
    globalThis.ParameterGroups = ParameterGroups;
    globalThis.ParameterFormat = ParameterFormat;
    globalThis.ParameterRegistry = ParameterRegistry;
    globalThis.SdpParameterBinding = SdpParameterBinding;
    globalThis.TextManager = {
      goldRate: () => 'Gold Rate',
      goldRateDescription: () => [ 'gdr-line1', 'gdr-line2' ],
      dropRate: () => 'Drop Rate',
      dropRateDescription: () => [ 'dor-line1', 'dor-line2' ],
    };
    globalThis.IconManager = { goldRate: () => 970, dropRate: () => 971 };

    // stand-in tags, each its own object, so a binding can be checked by identity against the right one.
    globalThis.J = {
      DROPS: {
        RegExp: {
          GoldRateBuffPlus: /<gdrBuffPlus>/,
          GoldRateBuffRate: /<gdrBuffRate>/,
          GoldRateGrowthPlus: /<gdrGrowthPlus>/,
          GoldRateGrowthRate: /<gdrGrowthRate>/,
          DropRateBuffPlus: /<dorBuffPlus>/,
          DropRateBuffRate: /<dorBuffRate>/,
          DropRateGrowthPlus: /<dorGrowthPlus>/,
          DropRateGrowthRate: /<dorGrowthRate>/,
        },
      },
    };

    const { default: DropsParameterRegistration } =
      await import('../../../../src/plugins/drops/core/core/registerDropsParameters.js');

    DropsParameterRegistration.registerAll();
  });

  afterEach(() =>
  {
    delete globalThis.NaturalParameterBinding;
    delete globalThis.ParameterDefinition;
    delete globalThis.ParameterDisplayPolicy;
    delete globalThis.ParameterGroups;
    delete globalThis.ParameterFormat;
    delete globalThis.ParameterRegistry;
    delete globalThis.SdpParameterBinding;
    delete globalThis.TextManager;
    delete globalThis.IconManager;
    delete globalThis.J;
    ParameterRegistry._definitions.clear();
    ParameterRegistry._groupCache.clear();
    ParameterRegistry._naturalBindings.clear();
  });

  describe('gdr', () =>
  {
    it('registers in the FATE group at sort order 3', () =>
    {
      const definition = ParameterRegistry.get('gdr');

      expect(definition.group).toBe(ParameterGroups.FATE);
      expect(definition.sortOrder).toBe(3);
      expect(definition.format).toBe(ParameterFormat.MULTIPLIER_PERCENT);
      expect(definition.displayPolicy).toBe(ParameterDisplayPolicy.REWARD_RATE);
    });

    it('wires label/description/icon through to TextManager/IconManager', () =>
    {
      const definition = ParameterRegistry.get('gdr');

      expect(definition.label()).toBe('Gold Rate');
      expect(definition.description()).toEqual([ 'gdr-line1', 'gdr-line2' ]);
      expect(definition.iconIndex()).toBe(970);
    });

    it('resolves the live value via battler.gdr', () =>
    {
      const definition = ParameterRegistry.get('gdr');
      const battler = { gdr: 1.5 };

      expect(definition.resolveValue(battler)).toBe(1.5);
    });

    it('binds its SDP base to a flat 1', () =>
    {
      const definition = ParameterRegistry.get('gdr');
      const actor = {};

      expect(definition.sdpBinding.getBaseForSdp(actor)).toBe(1);
    });

    it('binds natural growth to the four gold rate tags', () =>
    {
      // Arrange- dor's tags are bound in the same pass, so a crossed wire would pick up one of those.
      const { RegExp: tags } = globalThis.J.DROPS;

      // Act
      const binding = ParameterRegistry.naturalBinding('gdr');

      // Assert
      expect(binding.buffPlus).toBe(tags.GoldRateBuffPlus);
      expect(binding.buffRate).toBe(tags.GoldRateBuffRate);
      expect(binding.growthPlus).toBe(tags.GoldRateGrowthPlus);
      expect(binding.growthRate).toBe(tags.GoldRateGrowthRate);
    });

    it('grows against the gold multiplier its own tags produce', () =>
    {
      // Arrange- the battler answers differently for gold and drops, so the right base is visible.
      const battler = { baseGoldMultiplier: () => 0.3, baseDropMultiplier: () => 0.7 };
      const binding = ParameterRegistry.naturalBinding('gdr');

      // Act
      const result = binding.getBase(battler);

      // Assert
      expect(result).toBe(0.3);
    });
  });

  describe('dor', () =>
  {
    it('registers in the FATE group at sort order 6', () =>
    {
      const definition = ParameterRegistry.get('dor');

      expect(definition.group).toBe(ParameterGroups.FATE);
      expect(definition.sortOrder).toBe(6);
      expect(definition.format).toBe(ParameterFormat.MULTIPLIER_PERCENT);
      expect(definition.displayPolicy).toBe(ParameterDisplayPolicy.REWARD_RATE);
    });

    it('wires label/description/icon through to TextManager/IconManager', () =>
    {
      const definition = ParameterRegistry.get('dor');

      expect(definition.label()).toBe('Drop Rate');
      expect(definition.description()).toEqual([ 'dor-line1', 'dor-line2' ]);
      expect(definition.iconIndex()).toBe(971);
    });

    it('resolves the live value via battler.dor', () =>
    {
      const definition = ParameterRegistry.get('dor');
      const battler = { dor: 2 };

      expect(definition.resolveValue(battler)).toBe(2);
    });

    it('binds its SDP base to a flat 1', () =>
    {
      const definition = ParameterRegistry.get('dor');
      const actor = {};

      expect(definition.sdpBinding.getBaseForSdp(actor)).toBe(1);
    });

    it('binds natural growth to the four drop rate tags', () =>
    {
      // Arrange- gdr's tags are bound in the same pass, so a crossed wire would pick up one of those.
      const { RegExp: tags } = globalThis.J.DROPS;

      // Act
      const binding = ParameterRegistry.naturalBinding('dor');

      // Assert
      expect(binding.buffPlus).toBe(tags.DropRateBuffPlus);
      expect(binding.buffRate).toBe(tags.DropRateBuffRate);
      expect(binding.growthPlus).toBe(tags.DropRateGrowthPlus);
      expect(binding.growthRate).toBe(tags.DropRateGrowthRate);
    });

    it('grows against the drop multiplier its own tags produce', () =>
    {
      // Arrange- the battler answers differently for gold and drops, so the right base is visible.
      const battler = { baseGoldMultiplier: () => 0.3, baseDropMultiplier: () => 0.7 };
      const binding = ParameterRegistry.naturalBinding('dor');

      // Act
      const result = binding.getBase(battler);

      // Assert
      expect(result).toBe(0.7);
    });
  });
});
//endregion plugins/drops/_component/register-drops-parameters-direct.test.js
