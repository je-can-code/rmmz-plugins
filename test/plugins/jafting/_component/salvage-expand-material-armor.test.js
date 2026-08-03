//region plugins/jafting/_component/salvage-expand-material-armor.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import JaftingSalvageManager from '../../../../src/plugins/jafting/core/managers/JaftingSalvageManager.js';
import RPG_Armor from '../../../../src/plugins/_base/core/database/implementations/RPG_Armor.js';

/**
 * Direct-import coverage for JaftingSalvageManager.expandWeaponArmorRowsForSalvage's material-armor
 * branch. JaftingSalvageLedger.getMaterialArmorTypeId() (real ESM import inside JaftingSalvageManager)
 * reads J.JAFTING.Metadata.materialArmorTypeId as a bare global, so that's stubbed directly rather than
 * booting the whole plugin- nothing here needs Window/Scene chrome.
 */
describe('JaftingSalvageManager.expandWeaponArmorRowsForSalvage (material armor, direct src import)', () =>
{
  beforeAll(() =>
  {
    globalThis.$gameParty = { _items: {} };
    JaftingSalvageManager.initPartySalvageStorage();
  });

  beforeEach(() =>
  {
    globalThis.J = { JAFTING: { Metadata: { materialArmorTypeId: 5 } } };
    globalThis.$dataArmors = globalThis.$dataArmors || {};
  });

  afterEach(() =>
  {
    delete globalThis.J;
  });

  function buildArmorRow(overrides = {})
  {
    return new RPG_Armor({
      id: 211,
      atypeId: 5,
      etypeId: 2,
      params: [ 0, 0, 0, 0, 0, 0, 0, 0 ],
      price: 0,
      traits: [],
      description: '',
      iconIndex: 0,
      name: 'Vitest Monster Part',
      note: '',
      meta: {},
      ...overrides,
    }, overrides.id ?? 211);
  }

  it('keeps a bare armor ledger row when the template is ingredient-class and has no nested ledger', () =>
  {
    // Arrange
    globalThis.$dataArmors[211] = buildArmorRow();

    // Act
    const rows = JaftingSalvageManager.expandWeaponArmorRowsForSalvage([ { t: 'a', id: 211, n: 1 } ], {});

    // Assert
    const armorRows = rows.filter(r => r.t === 'a' && r.id === 211);
    expect(armorRows.length).toBe(1);
  });

  it('preserves the row count when keeping an ingredient-class bare armor row', () =>
  {
    // Arrange
    globalThis.$dataArmors[211] = buildArmorRow();

    // Act
    const rows = JaftingSalvageManager.expandWeaponArmorRowsForSalvage([ { t: 'a', id: 211, n: 1 } ], {});

    // Assert
    const armorRows = rows.filter(r => r.t === 'a' && r.id === 211);
    expect(armorRows[0].n).toBe(1);
  });

  it('still drops vendor armor rows that are not ingredient-class when there is no nested ledger', () =>
  {
    // Arrange
    globalThis.$dataArmors[99] = buildArmorRow({ id: 99, atypeId: 1, name: 'Vitest Vendor Armor' });

    // Act
    const rows = JaftingSalvageManager.expandWeaponArmorRowsForSalvage([ { t: 'a', id: 99, n: 1 } ], {});

    // Assert
    expect(rows.some(r => r.t === 'a' && r.id === 99)).toBe(false);
  });
});
//endregion plugins/jafting/_component/salvage-expand-material-armor.test.js
