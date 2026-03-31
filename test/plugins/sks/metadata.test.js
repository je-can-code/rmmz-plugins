//region plugins/sks/metadata.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadSksPluginVm } from './sks-vm.js';

describe('J-SkillSlots metadata and regex (out/J-SkillSlots.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadSksPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('exposes J.SKS namespace and versioned metadata', () =>
  {
    expect(sandbox.J.SKS.Metadata.name).toBe('J-SkillSlots');
    expect(sandbox.J.SKS.Metadata.version.major).toBe(1);
    expect(sandbox.J.SKS.Metadata.version.minor).toBe(0);
    expect(sandbox.J.SKS.Metadata.version.patch).toBe(0);
  });

  it('slotCost regex parses signed integers from skill notes', () =>
  {
    const m = sandbox.J.SKS.RegExp.SlotCost.exec('<slotCost:2>');
    expect(m[1]).toBe('2');
  });

  it('defaults equippable type list to empty so all skill types remain eligible', () =>
  {
    expect(sandbox.J.SKS.Metadata.equippableSkillTypeIds.length).toBe(0);
  });
});
//endregion plugins/sks/metadata.test.js
