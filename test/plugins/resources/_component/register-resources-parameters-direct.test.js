//region plugins/resources/_component/register-resources-parameters-direct.test.js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import NaturalParameterBinding from '../../../../src/plugins/_base/core/models/NaturalParameterBinding.js';
import ParameterDefinition from '../../../../src/plugins/_base/core/models/ParameterDefinition.js';
import ParameterDisplayPolicy from '../../../../src/plugins/_base/core/core/ParameterDisplayPolicy.js';
import ParameterFormat from '../../../../src/plugins/_base/core/core/ParameterFormat.js';
import ParameterGroups from '../../../../src/plugins/_base/core/core/ParameterGroups.js';
import ParameterRegistry from '../../../../src/plugins/_base/core/core/ParameterRegistry.js';
import SdpParameterBinding from '../../../../src/plugins/_base/core/models/SdpParameterBinding.js';

/**
 * registerResourcesParameters.js is not itself an ES module consumer of these classes — in the
 * concatenated plugin build they're bare host globals, just like Game_Battler. This suite imports
 * the real _base classes (pure, no host globals of their own) and hangs them off globalThis so the
 * registration file under test resolves them exactly as it would in the shipped bundle, then verifies
 * the resulting ParameterRegistry entry end-to-end.
 */
describe('ResourcesParameterRegistration.registerAll (resources core, direct src import)', () =>
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
    globalThis.ParameterDisplayPolicy = ParameterDisplayPolicy;
    globalThis.ParameterRegistry = ParameterRegistry;
    globalThis.SdpParameterBinding = SdpParameterBinding;
    globalThis.TextManager = { hcr: () => 'Life Cost', hcrDescription: () => [ 'line1', 'line2' ] };
    globalThis.IconManager = { hcr: () => 964 };

    // stand-in tags, each its own object, so a binding can be checked by identity against the right one.
    globalThis.J = {
      RESOURCES: {
        RegExp: {
          HpCostRateBuffPlus: /<hcrBuffPlus>/,
          HpCostRateBuffRate: /<hcrBuffRate>/,
          HpCostRateGrowthPlus: /<hcrGrowthPlus>/,
          HpCostRateGrowthRate: /<hcrGrowthRate>/,
        },
      },
    };

    const { default: ResourcesParameterRegistration } =
      await import('../../../../src/plugins/resources/core/core/registerResourcesParameters.js');

    ResourcesParameterRegistration.registerAll();
  });

  afterEach(() =>
  {
    delete globalThis.NaturalParameterBinding;
    delete globalThis.ParameterDefinition;
    delete globalThis.ParameterGroups;
    delete globalThis.ParameterFormat;
    delete globalThis.ParameterDisplayPolicy;
    delete globalThis.ParameterRegistry;
    delete globalThis.SdpParameterBinding;
    delete globalThis.TextManager;
    delete globalThis.IconManager;
    delete globalThis.J;
    ParameterRegistry._definitions.clear();
    ParameterRegistry._groupCache.clear();
    ParameterRegistry._naturalBindings.clear();
  });

  it('registers hcr in the COMBAT group with cost-rate display policy', () =>
  {
    const definition = ParameterRegistry.get('hcr');

    expect(definition.group).toBe(ParameterGroups.COMBAT);
    expect(definition.sortOrder).toBe(5);
    expect(definition.format).toBe(ParameterFormat.PERCENT_CENTERED);
    expect(definition.displayPolicy).toBe(ParameterDisplayPolicy.COST_RATE);
  });

  it('wires label/description/icon through to TextManager/IconManager', () =>
  {
    const definition = ParameterRegistry.get('hcr');

    expect(definition.label()).toBe('Life Cost');
    expect(definition.description()).toEqual([ 'line1', 'line2' ]);
    expect(definition.iconIndex()).toBe(964);
  });

  it('resolves the live value via battler.hcrFactor()', () =>
  {
    const definition = ParameterRegistry.get('hcr');
    const battler = { hcrFactor: () => 0.75 };

    expect(definition.resolveValue(battler)).toBe(0.75);
  });

  it('resolves 0 SDP panel bonus when J.SDP is not loaded', () =>
  {
    const definition = ParameterRegistry.get('hcr');
    const actor = { hcrFactor: () => 1 };

    expect(definition.sdpBinding.getPanelBonus(actor, 1)).toBe(0);
    // sdpBinding.byKey('hcr', () => 100) supplies a fixed getBaseForSdp of 100.
    expect(definition.sdpBinding.getBaseForSdp(actor)).toBe(100);
  });

  it('binds natural growth to the four life cost tags', () =>
  {
    // Arrange- four distinct stand-ins, so a transposed pair would be caught.
    const { RegExp: tags } = globalThis.J.RESOURCES;

    // Act
    const binding = ParameterRegistry.naturalBinding('hcr');

    // Assert
    expect(binding.buffPlus).toBe(tags.HpCostRateBuffPlus);
    expect(binding.buffRate).toBe(tags.HpCostRateBuffRate);
    expect(binding.growthPlus).toBe(tags.HpCostRateGrowthPlus);
    expect(binding.growthRate).toBe(tags.HpCostRateGrowthRate);
  });

  it('grows against the cost factor the life cost tags produce, not the finished factor', () =>
  {
    // Arrange- the finished factor would include natural bonuses, which are what the base feeds.
    const battler = { baseHcrFactor: () => 0.9, hcrFactor: () => 0.5 };
    const binding = ParameterRegistry.naturalBinding('hcr');

    // Act
    const result = binding.getBase(battler);

    // Assert
    expect(result).toBe(0.9);
  });
});
//endregion plugins/resources/_component/register-resources-parameters-direct.test.js
