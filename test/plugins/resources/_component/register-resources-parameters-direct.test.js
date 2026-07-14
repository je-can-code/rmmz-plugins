//region plugins/resources/_component/register-resources-parameters-direct.test.js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ParameterDefinition from '../../../../src/plugins/_base/models/ParameterDefinition.js';
import ParameterDisplayPolicy from '../../../../src/plugins/_base/core/ParameterDisplayPolicy.js';
import ParameterFormat from '../../../../src/plugins/_base/core/ParameterFormat.js';
import ParameterGroups from '../../../../src/plugins/_base/core/ParameterGroups.js';
import ParameterRegistry from '../../../../src/plugins/_base/core/ParameterRegistry.js';
import SdpParameterBinding from '../../../../src/plugins/_base/models/SdpParameterBinding.js';

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

    globalThis.ParameterDefinition = ParameterDefinition;
    globalThis.ParameterGroups = ParameterGroups;
    globalThis.ParameterFormat = ParameterFormat;
    globalThis.ParameterDisplayPolicy = ParameterDisplayPolicy;
    globalThis.ParameterRegistry = ParameterRegistry;
    globalThis.SdpParameterBinding = SdpParameterBinding;
    globalThis.TextManager = { hcr: () => 'Life Cost', hcrDescription: () => [ 'line1', 'line2' ] };
    globalThis.IconManager = { hcr: () => 964 };
    globalThis.J = {};

    const { default: ResourcesParameterRegistration } =
      await import('../../../../src/plugins/resources/core/core/registerResourcesParameters.js');

    ResourcesParameterRegistration.registerAll();
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
});
//endregion plugins/resources/_component/register-resources-parameters-direct.test.js
