//region plugins/sdp/core/core/register-sdp-parameters.test.js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import NaturalParameterBinding from '../../../../../src/plugins/_base/core/models/NaturalParameterBinding.js';
import ParameterDefinition from '../../../../../src/plugins/_base/core/models/ParameterDefinition.js';
import ParameterDisplayPolicy from '../../../../../src/plugins/_base/core/core/ParameterDisplayPolicy.js';
import ParameterFormat from '../../../../../src/plugins/_base/core/core/ParameterFormat.js';
import ParameterGroups from '../../../../../src/plugins/_base/core/core/ParameterGroups.js';
import ParameterRegistry from '../../../../../src/plugins/_base/core/core/ParameterRegistry.js';
import SdpParameterBinding from '../../../../../src/plugins/_base/core/models/SdpParameterBinding.js';

describe('SdpParameterRegistration.registerAll (sdp core, direct src import)', () =>
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
    globalThis.TextManager = { sdpMultiplier: () => 'Node Points UP', sdpMultiplierDescription: () => [ 'line1', 'line2' ] };
    globalThis.IconManager = { sdpMultiplier: () => 2229 };

    // stand-in tags, each its own object, so a binding can be checked by identity against the right one.
    globalThis.J = {
      SDP: {
        RegExp: {
          SdpRateBuffPlus: /<sdrBuffPlus>/,
          SdpRateBuffRate: /<sdrBuffRate>/,
          SdpRateGrowthPlus: /<sdrGrowthPlus>/,
          SdpRateGrowthRate: /<sdrGrowthRate>/,
        },
      },
    };

    const { default: SdpParameterRegistration } =
      await import('../../../../../src/plugins/sdp/core/core/registerSdpParameters.js');

    SdpParameterRegistration.registerAll();
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

  it('registers sdr in the FATE group with reward-rate display policy', () =>
  {
    const definition = ParameterRegistry.get('sdr');

    expect(definition.group).toBe(ParameterGroups.FATE);
    expect(definition.sortOrder).toBe(5);
    expect(definition.format).toBe(ParameterFormat.PERCENT_CENTERED);
    expect(definition.displayPolicy).toBe(ParameterDisplayPolicy.REWARD_RATE);
  });

  it('wires label/description/icon through to TextManager/IconManager', () =>
  {
    const definition = ParameterRegistry.get('sdr');

    expect(definition.label()).toBe('Node Points UP');
    expect(definition.description()).toEqual([ 'line1', 'line2' ]);
    expect(definition.iconIndex()).toBe(2229);
  });

  it('resolves the live value via battler.sdpMultiplier', () =>
  {
    const definition = ParameterRegistry.get('sdr');
    const battler = { sdpMultiplier: 1.5 };

    expect(definition.resolveValue(battler)).toBe(1.5);
  });

  it('resolves 0 SDP panel bonus when J.SDP is not loaded', () =>
  {
    // the stand-in tags hang off J.SDP, so the namespace comes down once registration has read them.
    delete globalThis.J.SDP;
    const definition = ParameterRegistry.get('sdr');
    const actor = { sdpMultiplier: 1 };

    expect(definition.sdpBinding.getPanelBonus(actor, 1)).toBe(0);
    expect(definition.sdpBinding.getBaseForSdp(actor)).toBe(1);
  });

  it('binds natural growth to the four SDP multiplier tags', () =>
  {
    // Arrange- four distinct stand-ins, so a transposed pair would be caught.
    const { RegExp: tags } = globalThis.J.SDP;

    // Act
    const binding = ParameterRegistry.naturalBinding('sdr');

    // Assert
    expect(binding.buffPlus).toBe(tags.SdpRateBuffPlus);
    expect(binding.buffRate).toBe(tags.SdpRateBuffRate);
    expect(binding.growthPlus).toBe(tags.SdpRateGrowthPlus);
    expect(binding.growthRate).toBe(tags.SdpRateGrowthRate);
  });

  it('grows against the factor the SDP multiplier tags produce, not the finished multiplier', () =>
  {
    // Arrange- the finished multiplier would include natural bonuses, which are what the base feeds.
    const battler = { baseSdpMultiplier: () => 1.1, sdpMultiplier: 9 };
    const binding = ParameterRegistry.naturalBinding('sdr');

    // Act
    const result = binding.getBase(battler);

    // Assert
    expect(result).toBe(1.1);
  });
});
//endregion plugins/sdp/core/core/register-sdp-parameters.test.js
