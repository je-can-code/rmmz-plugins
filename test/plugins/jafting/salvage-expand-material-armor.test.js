//region plugins/jafting/salvage-expand-material-armor.test.js
import vm from 'node:vm';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadJaftingCorePluginVm } from './jafting-core-vm.js';

describe('JaftingSalvageManager.expandWeaponArmorRowsForSalvage (material armor)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadJaftingCorePluginVm(sandbox);
    vm.runInContext(
      `
      $gameParty = { _items: {} };
      JaftingSalvageManager.initPartySalvageStorage();
      `,
      sandbox,
    );
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('keeps a bare armor ledger row when the template is ingredient-class and has no nested ledger', () =>
  {
    const rows = vm.runInContext(
      `
      (() =>
      {
        $dataArmors[211] = new RPG_Armor({
          id: 211,
          atypeId: JaftingSalvageLedger.MaterialArmorTypeId,
          etypeId: 2,
          params: [ 0, 0, 0, 0, 0, 0, 0, 0 ],
          price: 0,
          traits: [],
          description: '',
          iconIndex: 0,
          name: 'Vitest Monster Part',
          note: '',
          meta: {},
        }, 211);

        return JaftingSalvageManager.expandWeaponArmorRowsForSalvage(
          [ { t: 'a', id: 211, n: 1 } ],
          {},
        );
      })()
      `,
      sandbox,
    );

    const armorRows = rows.filter(r => r.t === 'a' && r.id === 211);

    expect(armorRows.length).toBe(1);
    expect(armorRows[0].n).toBe(1);
  });

  it('still drops vendor armor rows that are not ingredient-class when there is no nested ledger', () =>
  {
    vm.runInContext(
      `
      $dataArmors[99] = new RPG_Armor({
        id: 99,
        atypeId: 1,
        etypeId: 2,
        params: [ 0, 0, 0, 0, 0, 0, 0, 0 ],
        price: 0,
        traits: [],
        description: '',
        iconIndex: 0,
        name: 'Vitest Vendor Armor',
        note: '',
        meta: {},
      }, 99);
      `,
      sandbox,
    );

    const { JaftingSalvageManager } = sandbox.__JAFT_VM;
    const rows = JaftingSalvageManager.expandWeaponArmorRowsForSalvage(
      [ { t: 'a', id: 99, n: 1 } ],
      {},
    );

    expect(rows.some(r => r.t === 'a' && r.id === 99)).toBe(false);
  });
});
//endregion plugins/jafting/salvage-expand-material-armor.test.js
