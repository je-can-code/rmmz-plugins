//region plugins/resources/rpg-traited-direct.test.js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('RPG_Traited hcr (resources core, direct src import)', () =>
{
  beforeEach(async () =>
  {
    // fresh module registry so re-running this file doesn't re-apply the prototype patch onto
    // a leftover class instance from a previous test file.
    vi.resetModules();

    // RPG_Traited is a bare host global in the concatenated build; provide a trivial placeholder
    // class for the module under test to patch .prototype.hcr onto.
    function RPG_Traited()
    {
    }

    globalThis.RPG_Traited = RPG_Traited;

    globalThis.J = { RESOURCES: { RegExp: { HpCostReduction: {} } } };
    globalThis.RPGManager = { getResultFromNoteByRegex: vi.fn(() => 0) };

    // the file under test — patches globalThis.RPG_Traited.prototype directly, no vm involved.
    await import('../../../src/plugins/resources/core/database/RPG_Traited.js');
  });

  afterEach(() =>
  {
    delete globalThis.RPG_Traited;
    delete globalThis.J;
    delete globalThis.RPGManager;
  });

  it('delegates to RPGManager.getResultFromNoteByRegex with a 0 fallback, using the HpCostReduction regex', () =>
  {
    globalThis.RPGManager.getResultFromNoteByRegex.mockReturnValue(15);

    const traited = new globalThis.RPG_Traited();

    expect(traited.hcr()).toBe(15);
    expect(globalThis.RPGManager.getResultFromNoteByRegex)
      .toHaveBeenCalledWith(traited, globalThis.J.RESOURCES.RegExp.HpCostReduction, 0);
  });
});
//endregion plugins/resources/rpg-traited-direct.test.js
