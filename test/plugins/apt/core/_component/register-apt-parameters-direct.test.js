//region plugins/apt/core/_component/register-apt-parameters-direct.test.js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import NaturalParameterBinding from '../../../../../src/plugins/_base/core/models/NaturalParameterBinding.js';
import ParameterDefinition from '../../../../../src/plugins/_base/core/models/ParameterDefinition.js';
import ParameterDisplayPolicy from '../../../../../src/plugins/_base/core/core/ParameterDisplayPolicy.js';
import ParameterFormat from '../../../../../src/plugins/_base/core/core/ParameterFormat.js';
import ParameterGroups from '../../../../../src/plugins/_base/core/core/ParameterGroups.js';
import ParameterRegistry from '../../../../../src/plugins/_base/core/core/ParameterRegistry.js';
import SdpParameterBinding from '../../../../../src/plugins/_base/core/models/SdpParameterBinding.js';

/**
 * registerAptParameters.js is not itself an ES module consumer of these classes — in the concatenated
 * plugin build they're bare host globals, just like Game_Battler. This suite imports the real _base
 * classes (pure, no host globals of their own) and hangs them off globalThis so the registration file
 * under test resolves them exactly as it would in the shipped bundle, then verifies the resulting
 * ParameterRegistry entry end-to-end. Mirrors resources/register-resources-parameters-direct.test.js.
 */
describe('AptParameterRegistration.registerAll (apt core, direct src import)', () =>
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
    globalThis.TextManager = { aptRate: () => 'Aptitude UP', aptRateDescription: () => [ 'line1', 'line2' ] };
    globalThis.IconManager = { aptRate: () => 79 };

    // stand-in tags, each its own object, so a binding can be checked by identity against the right one.
    globalThis.J = {
      APT: {
        RegExp: {
          AptRateBuffPlus: /<aprBuffPlus>/,
          AptRateBuffRate: /<aprBuffRate>/,
          AptRateGrowthPlus: /<aprGrowthPlus>/,
          AptRateGrowthRate: /<aprGrowthRate>/,
        },
      },
    };

    const { default: AptParameterRegistration } =
      await import('../../../../../src/plugins/apt/core/core/registerAptParameters.js');

    AptParameterRegistration.registerAll();
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

  it('registers apr in the FATE group with reward-rate display policy', () =>
  {
    const definition = ParameterRegistry.get('apr');

    expect(definition.group).toBe(ParameterGroups.FATE);
    expect(definition.sortOrder).toBe(7);
    expect(definition.format).toBe(ParameterFormat.PERCENT_CENTERED);
    expect(definition.displayPolicy).toBe(ParameterDisplayPolicy.REWARD_RATE);
  });

  it('wires label/description/icon through to TextManager/IconManager', () =>
  {
    const definition = ParameterRegistry.get('apr');

    expect(definition.label()).toBe('Aptitude UP');
    expect(definition.description()).toEqual([ 'line1', 'line2' ]);
    expect(definition.iconIndex()).toBe(79);
  });

  it('resolves the live value via battler.apr', () =>
  {
    const definition = ParameterRegistry.get('apr');
    const battler = { apr: 1.25 };

    expect(definition.resolveValue(battler)).toBe(1.25);
  });

  it('resolves 0 SDP panel bonus when J.SDP is not loaded', () =>
  {
    const definition = ParameterRegistry.get('apr');
    const actor = { apr: 1 };

    expect(definition.sdpBinding.getPanelBonus(actor, 1)).toBe(0);
    // sdpBinding.byKey('apr', () => 1) supplies a fixed getBaseForSdp of 1.
    expect(definition.sdpBinding.getBaseForSdp(actor)).toBe(1);
  });

  it('binds natural growth to the four aptitude rate tags', () =>
  {
    // Arrange- four distinct stand-ins, so a transposed pair would be caught.
    const { RegExp: tags } = globalThis.J.APT;

    // Act
    const binding = ParameterRegistry.naturalBinding('apr');

    // Assert
    expect(binding.buffPlus).toBe(tags.AptRateBuffPlus);
    expect(binding.buffRate).toBe(tags.AptRateBuffRate);
    expect(binding.growthPlus).toBe(tags.AptRateGrowthPlus);
    expect(binding.growthRate).toBe(tags.AptRateGrowthRate);
  });

  it('grows against the factor aptitude rate\'s own tags produce, not the finished rate', () =>
  {
    // Arrange- the finished rate would include natural bonuses, which are what the base feeds.
    const battler = { baseAptFactor: () => 1.2, apr: 9 };
    const binding = ParameterRegistry.naturalBinding('apr');

    // Act
    const result = binding.getBase(battler);

    // Assert
    expect(result).toBe(1.2);
  });
});
//endregion plugins/apt/core/_component/register-apt-parameters-direct.test.js
