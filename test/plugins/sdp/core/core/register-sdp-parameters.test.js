//region plugins/sdp/core/core/register-sdp-parameters.test.js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

    globalThis.ParameterDefinition = ParameterDefinition;
    globalThis.ParameterGroups = ParameterGroups;
    globalThis.ParameterFormat = ParameterFormat;
    globalThis.ParameterDisplayPolicy = ParameterDisplayPolicy;
    globalThis.ParameterRegistry = ParameterRegistry;
    globalThis.SdpParameterBinding = SdpParameterBinding;
    globalThis.TextManager = { sdpMultiplier: () => 'Node Points UP', sdpMultiplierDescription: () => [ 'line1', 'line2' ] };
    globalThis.IconManager = { sdpMultiplier: () => 2229 };
    globalThis.J = {};

    const { default: SdpParameterRegistration } =
      await import('../../../../../src/plugins/sdp/core/core/registerSdpParameters.js');

    SdpParameterRegistration.registerAll();
  });

  afterEach(() =>
  {
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
    const definition = ParameterRegistry.get('sdr');
    const actor = { sdpMultiplier: 1 };

    expect(definition.sdpBinding.getPanelBonus(actor, 1)).toBe(0);
    expect(definition.sdpBinding.getBaseForSdp(actor)).toBe(1);
  });
});
//endregion plugins/sdp/core/core/register-sdp-parameters.test.js
