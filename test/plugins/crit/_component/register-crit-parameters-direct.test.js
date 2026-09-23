//region plugins/crit/_component/register-crit-parameters-direct.test.js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import NaturalParameterBinding from '../../../../src/plugins/_base/core/models/NaturalParameterBinding.js';
import ParameterDefinition from '../../../../src/plugins/_base/core/models/ParameterDefinition.js';
import ParameterFormat from '../../../../src/plugins/_base/core/core/ParameterFormat.js';
import ParameterGroups from '../../../../src/plugins/_base/core/core/ParameterGroups.js';
import ParameterRegistry from '../../../../src/plugins/_base/core/core/ParameterRegistry.js';
import SdpParameterBinding from '../../../../src/plugins/_base/core/models/SdpParameterBinding.js';

/**
 * registerCritParameters.js is not itself an ES module consumer of these classes- in the
 * concatenated plugin build they're bare host globals, just like Game_Battler. This suite imports
 * the real _base classes (pure, no host globals of their own) and hangs them off globalThis so the
 * registration file under test resolves them exactly as it would in the shipped bundle, then verifies
 * the resulting ParameterRegistry entries end-to-end. Mirrors resources/register-resources-parameters-direct.test.js.
 */
describe('CritParameterRegistration.registerAll (crit core, direct src import)', () =>
{
  beforeEach(async () =>
  {
    vi.resetModules();
    ParameterRegistry._definitions.clear();
    ParameterRegistry._groupCache.clear();
    ParameterRegistry._naturalBindings.clear();

    globalThis.NaturalParameterBinding = NaturalParameterBinding;
    globalThis.ParameterDefinition = ParameterDefinition;
    globalThis.ParameterGroups = ParameterGroups;
    globalThis.ParameterFormat = ParameterFormat;
    globalThis.ParameterRegistry = ParameterRegistry;
    globalThis.SdpParameterBinding = SdpParameterBinding;
    globalThis.TextManager = {
      critParam: id => (id === 0 ? 'Crit Amp' : 'Crit Block'),
      critParamDescription: id => (id === 0 ? [ 'cdm-line1', 'cdm-line2' ] : [ 'ctr-line1', 'ctr-line2' ]),
    };
    globalThis.IconManager = { critParam: id => (id === 0 ? 976 : 977) };

    // stand-in tags, each its own object, so a binding can be checked by identity against the right one.
    globalThis.J = {
      CRIT: {
        RegExp: {
          CritDamageMultiplierBuffPlus: /<cdmBuffPlus>/,
          CritDamageMultiplierBuffRate: /<cdmBuffRate>/,
          CritDamageMultiplierGrowthPlus: /<cdmGrowthPlus>/,
          CritDamageMultiplierGrowthRate: /<cdmGrowthRate>/,
          CritTakenRateBuffPlus: /<ctrBuffPlus>/,
          CritTakenRateBuffRate: /<ctrBuffRate>/,
          CritTakenRateGrowthPlus: /<ctrGrowthPlus>/,
          CritTakenRateGrowthRate: /<ctrGrowthRate>/,
        },
      },
    };

    const { default: CritParameterRegistration } =
      await import('../../../../src/plugins/crit/core/core/registerCritParameters.js');

    CritParameterRegistration.registerAll();
  });

  afterEach(() =>
  {
    delete globalThis.NaturalParameterBinding;
    delete globalThis.ParameterDefinition;
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

  describe('cdm', () =>
  {
    it('registers in the PRECISION group at sort order 6', () =>
    {
      const definition = ParameterRegistry.get('cdm');

      expect(definition.group).toBe(ParameterGroups.PRECISION);
      expect(definition.sortOrder).toBe(6);
      expect(definition.format).toBe(ParameterFormat.PERCENT_SUFFIX);
    });

    it('wires label/description/icon through to TextManager/IconManager', () =>
    {
      const definition = ParameterRegistry.get('cdm');

      expect(definition.label()).toBe('Crit Amp');
      expect(definition.description()).toEqual([ 'cdm-line1', 'cdm-line2' ]);
      expect(definition.iconIndex()).toBe(976);
    });

    it('resolves the live value via battler.cdm', () =>
    {
      const definition = ParameterRegistry.get('cdm');
      const battler = { cdm: 0.4 };

      expect(definition.resolveValue(battler)).toBe(0.4);
    });

    it('binds its SDP base to actor.baseCriticalMultiplier()', () =>
    {
      const definition = ParameterRegistry.get('cdm');
      const actor = { baseCriticalMultiplier: () => 0.5 };

      expect(definition.sdpBinding.getBaseForSdp(actor)).toBe(0.5);
    });

    it('binds natural growth to the four crit damage tags', () =>
    {
      // Arrange- ctr's tags are bound in the same pass, so a crossed wire would pick up one of those.
      const { RegExp: tags } = globalThis.J.CRIT;

      // Act
      const binding = ParameterRegistry.naturalBinding('cdm');

      // Assert
      expect(binding.buffPlus).toBe(tags.CritDamageMultiplierBuffPlus);
      expect(binding.buffRate).toBe(tags.CritDamageMultiplierBuffRate);
      expect(binding.growthPlus).toBe(tags.CritDamageMultiplierGrowthPlus);
      expect(binding.growthRate).toBe(tags.CritDamageMultiplierGrowthRate);
    });

    it('grows against the base crit multiplier every battler starts from', () =>
    {
      // Arrange- the battler answers differently for the two crit bases, so the right one is visible.
      const battler = { baseCriticalMultiplier: () => 0.5, baseCriticalReduction: () => 0.2 };
      const binding = ParameterRegistry.naturalBinding('cdm');

      // Act
      const result = binding.getBase(battler);

      // Assert
      expect(result).toBe(0.5);
    });
  });

  describe('ctr', () =>
  {
    it('registers in the PRECISION group at sort order 7', () =>
    {
      const definition = ParameterRegistry.get('ctr');

      expect(definition.group).toBe(ParameterGroups.PRECISION);
      expect(definition.sortOrder).toBe(7);
      expect(definition.format).toBe(ParameterFormat.PERCENT_SUFFIX);
    });

    it('wires label/description/icon through to TextManager/IconManager', () =>
    {
      const definition = ParameterRegistry.get('ctr');

      expect(definition.label()).toBe('Crit Block');
      expect(definition.description()).toEqual([ 'ctr-line1', 'ctr-line2' ]);
      expect(definition.iconIndex()).toBe(977);
    });

    it('resolves the live value via battler.ctr', () =>
    {
      const definition = ParameterRegistry.get('ctr');
      const battler = { ctr: 0.25 };

      expect(definition.resolveValue(battler)).toBe(0.25);
    });

    it('binds its SDP base to actor.baseCriticalReduction()', () =>
    {
      const definition = ParameterRegistry.get('ctr');
      const actor = { baseCriticalReduction: () => 0.5 };

      expect(definition.sdpBinding.getBaseForSdp(actor)).toBe(0.5);
    });

    it('binds natural growth to the four crit taken tags', () =>
    {
      // Arrange- cdm's tags are bound in the same pass, so a crossed wire would pick up one of those.
      const { RegExp: tags } = globalThis.J.CRIT;

      // Act
      const binding = ParameterRegistry.naturalBinding('ctr');

      // Assert
      expect(binding.buffPlus).toBe(tags.CritTakenRateBuffPlus);
      expect(binding.buffRate).toBe(tags.CritTakenRateBuffRate);
      expect(binding.growthPlus).toBe(tags.CritTakenRateGrowthPlus);
      expect(binding.growthRate).toBe(tags.CritTakenRateGrowthRate);
    });

    it('grows against the base crit reduction every battler starts from', () =>
    {
      // Arrange- the battler answers differently for the two crit bases, so the right one is visible.
      const battler = { baseCriticalMultiplier: () => 0.5, baseCriticalReduction: () => 0.2 };
      const binding = ParameterRegistry.naturalBinding('ctr');

      // Act
      const result = binding.getBase(battler);

      // Assert
      expect(result).toBe(0.2);
    });
  });
});
//endregion plugins/crit/_component/register-crit-parameters-direct.test.js
