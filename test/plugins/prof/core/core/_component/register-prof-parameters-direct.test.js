//region plugins/prof/core/core/_component/register-prof-parameters-direct.test.js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ParameterDefinition from '../../../../../../src/plugins/_base/models/ParameterDefinition.js';
import ParameterFormat from '../../../../../../src/plugins/_base/core/ParameterFormat.js';
import ParameterGroups from '../../../../../../src/plugins/_base/core/ParameterGroups.js';
import ParameterRegistry from '../../../../../../src/plugins/_base/core/ParameterRegistry.js';
import SdpParameterBinding from '../../../../../../src/plugins/_base/models/SdpParameterBinding.js';

/**
 * registerProfParameters.js is not itself an ES module consumer of these classes- in the
 * concatenated plugin build they're bare host globals, just like Game_Battler. This suite imports
 * the real _base classes (pure, no host globals of their own) and hangs them off globalThis so the
 * registration file under test resolves them exactly as it would in the shipped bundle, then verifies
 * the resulting ParameterRegistry entry end-to-end. Mirrors crit/register-crit-parameters-direct.test.js.
 */
describe('ProfParameterRegistration.registerAll (prof core, direct src import)', () =>
{
  beforeEach(async () =>
  {
    vi.resetModules();
    ParameterRegistry._definitions.clear();
    ParameterRegistry._groupCache.clear();

    globalThis.ParameterDefinition = ParameterDefinition;
    globalThis.ParameterGroups = ParameterGroups;
    globalThis.ParameterFormat = ParameterFormat;
    globalThis.ParameterRegistry = ParameterRegistry;
    globalThis.SdpParameterBinding = SdpParameterBinding;
    globalThis.TextManager = {
      proficiencyBonus: () => 'Proficiency',
      proficiencyDescription: () => [ 'prof-line1', 'prof-line2' ],
    };
    globalThis.IconManager = { proficiencyBoost: () => 972 };
    globalThis.J = {};

    const { default: ProfParameterRegistration } =
      await import('../../../../../../src/plugins/prof/core/core/registerProfParameters.js');

    ProfParameterRegistration.registerAll();
  });

  afterEach(() =>
  {
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
  });

  it('registers in the FATE group at sort order 4', () =>
  {
    const definition = ParameterRegistry.get('prof');

    expect(definition.group).toBe(ParameterGroups.FATE);
    expect(definition.sortOrder).toBe(4);
    expect(definition.format).toBe(ParameterFormat.FLAT);
  });

  it('wires label/description/icon through to TextManager/IconManager', () =>
  {
    const definition = ParameterRegistry.get('prof');

    expect(definition.label()).toBe('Proficiency');
    expect(definition.description()).toEqual([ 'prof-line1', 'prof-line2' ]);
    expect(definition.iconIndex()).toBe(972);
  });

  it('resolves the live value via battler.prof', () =>
  {
    const definition = ParameterRegistry.get('prof');
    const battler = { prof: 3 };

    expect(definition.resolveValue(battler)).toBe(3);
  });

  it('binds its SDP base to actor.baseSkillProficiencyAmount()', () =>
  {
    const definition = ParameterRegistry.get('prof');
    const actor = { baseSkillProficiencyAmount: () => 7 };

    expect(definition.sdpBinding.getBaseForSdp(actor)).toBe(7);
  });
});
//endregion plugins/prof/core/core/_component/register-prof-parameters-direct.test.js
