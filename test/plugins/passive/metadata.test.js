//region plugins/passive/metadata.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadPassivePluginVm } from './passive-vm.js';

describe('J-Passive metadata and regex (out/J-Passive.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadPassivePluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('exposes J.PASSIVE namespace and versioned metadata', () =>
  {
    expect(sandbox.J.PASSIVE.Metadata.Name).toBe('J-Passive');
    expect(sandbox.J.PASSIVE.Metadata.Version).toBe('2.0.1');
  });

  it('passive tag regex captures bracketed id lists', () =>
  {
    const m = sandbox.J.PASSIVE.RegExp.PassiveStateIds.exec('<passive:[12, 13]>');
    expect(m[1]).toBe('[12, 13]');
  });

  it('unique passive and equipped variants parse consistently', () =>
  {
    const u = sandbox.J.PASSIVE.RegExp.UniquePassiveStateIds.exec('<uniquePassive:[7]>');
    expect(u[1]).toBe('[7]');
    const e = sandbox.J.PASSIVE.RegExp.EquippedPassiveStateIds.exec('<equippedPassive:[3, 4]>');
    expect(e[1]).toBe('[3, 4]');
  });
});
//endregion plugins/passive/metadata.test.js
