//region plugins/prof/metadata.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadProfPluginVm } from './prof-vm.js';

describe('J-Proficiency metadata and regex (out/prof/J-Proficiency.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadProfPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('exposes J.PROF namespace and loads conditionals from config', () =>
  {
    expect(sandbox.J.PROF.Metadata.name).toBe('J-Proficiency');
    expect(sandbox.J.PROF.Metadata.conditionals.length).toBe(5);
    expect(sandbox.J.PROF.Metadata.conditionals[0].key).toBe('vitest_unlock_skill');
  });

  it('proficiency bonus regex captures integers', () =>
  {
    const m = sandbox.J.PROF.RegExp.ProficiencyBonus.exec('<proficiencyBonus:4>');
    expect(m[1]).toBe('4');
  });
});
//endregion plugins/prof/metadata.test.js
