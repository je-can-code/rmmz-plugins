//region plugins/drops/_component/register-drops-parameters-direct.test.js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
    globalThis.J = {};

    const { default: DropsParameterRegistration } =
      await import('../../../../src/plugins/drops/core/core/registerDropsParameters.js');

    DropsParameterRegistration.registerAll();
  });

  afterEach(() =>
  {
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
  });
});
//endregion plugins/drops/_component/register-drops-parameters-direct.test.js
