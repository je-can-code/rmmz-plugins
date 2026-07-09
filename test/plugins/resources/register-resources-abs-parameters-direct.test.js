//region plugins/resources/register-resources-abs-parameters-direct.test.js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ParameterDefinition from '../../../src/plugins/_base/models/ParameterDefinition.js';
import ParameterDisplayPolicy from '../../../src/plugins/_base/core/ParameterDisplayPolicy.js';
import ParameterFormat from '../../../src/plugins/_base/core/ParameterFormat.js';
import ParameterGroups from '../../../src/plugins/_base/core/ParameterGroups.js';
import ParameterRegistry from '../../../src/plugins/_base/core/ParameterRegistry.js';
import SdpParameterBinding from '../../../src/plugins/_base/models/SdpParameterBinding.js';

/**
 * Same technique as register-resources-parameters-direct.test.js: real _base classes hung off
 * globalThis so this bare-global-reliant registration file resolves them as it would in the shipped
 * concatenated bundle.
 */
describe('ResourcesAbsParameterRegistration.registerAll (resources ext/abs, direct src import)', () =>
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
    globalThis.TextManager = {
      lst: () => 'Lifesteal',
      lstDescription: () => [ 'lst-line' ],
      mst: () => 'Magisteal',
      mstDescription: () => [ 'mst-line' ],
      tst: () => 'Techsteal',
      tstDescription: () => [ 'tst-line' ],
    };
    globalThis.IconManager = { lst: () => 928, mst: () => 929, tst: () => 930 };
    globalThis.J = {};

    const { default: ResourcesAbsParameterRegistration } =
      await import('../../../src/plugins/resources/ext/abs/core/registerResourcesAbsParameters.js');

    ResourcesAbsParameterRegistration.registerAll();
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

  it('registers lst, mst, and tst in the COMBAT group with distinct sort orders', () =>
  {
    const lst = ParameterRegistry.get('lst');
    const mst = ParameterRegistry.get('mst');
    const tst = ParameterRegistry.get('tst');

    expect(lst.group).toBe(ParameterGroups.COMBAT);
    expect(mst.group).toBe(ParameterGroups.COMBAT);
    expect(tst.group).toBe(ParameterGroups.COMBAT);
    expect([ lst.sortOrder, mst.sortOrder, tst.sortOrder ]).toEqual([ 4, 6, 8 ]);
  });

  it('uses percent-suffix format and reward-rate display policy for all three', () =>
  {
    for (const key of [ 'lst', 'mst', 'tst' ])
    {
      const definition = ParameterRegistry.get(key);
      expect(definition.format).toBe(ParameterFormat.PERCENT_SUFFIX);
      expect(definition.displayPolicy).toBe(ParameterDisplayPolicy.REWARD_RATE);
    }
  });

  it('wires each label/description/icon through to TextManager/IconManager', () =>
  {
    const lst = ParameterRegistry.get('lst');

    expect(lst.label()).toBe('Lifesteal');
    expect(lst.description()).toEqual([ 'lst-line' ]);
    expect(lst.iconIndex()).toBe(928);
  });

  it('resolves each live value directly from the matching battler property', () =>
  {
    const battler = { lst: 0.1, mst: 0.2, tst: 0.3 };

    expect(ParameterRegistry.get('lst').resolveValue(battler)).toBe(0.1);
    expect(ParameterRegistry.get('mst').resolveValue(battler)).toBe(0.2);
    expect(ParameterRegistry.get('tst').resolveValue(battler)).toBe(0.3);
  });
});
//endregion plugins/resources/register-resources-abs-parameters-direct.test.js
