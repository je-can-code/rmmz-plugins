//region plugins/jafting/core/managers/salvage-refinement-lineage.test.js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// the refinement lineage is a J-JAFTING-Refinement type, and this file is testing J-JAFTING core -
// which is the point of the two cases that import it below. The model registers itself with the save
// registry at module scope, so both globals that registration reads have to exist before the import
// graph is evaluated.
vi.hoisted(() =>
{
  globalThis.SerializableRegistry = { register: () => {} };
  globalThis.JaftingSalvageLedgerSnapshot = class JaftingSalvageLedgerSnapshot {};
  globalThis.String.empty = '';
});

import JaftingRefinementLineage from '../../../../../src/plugins/jafting/ext/refine/__models/JaftingRefinementLineage.js';
import JaftingSalvageManager from '../../../../../src/plugins/jafting/core/managers/JaftingSalvageManager.js';
import JaftingSalvageLedger from '../../../../../src/plugins/jafting/core/__models/JaftingSalvageLedger.js';
import JaftingSalvageLedgerRow from '../../../../../src/plugins/jafting/core/__models/JaftingSalvageLedgerRow.js';
import JaftingSalvageLedgerSnapshot from '../../../../../src/plugins/jafting/core/__models/JaftingSalvageLedgerSnapshot.js';

/**
 * Refining consumes a donor into a base, and the output has to remember what went into it so that
 * dismantling later refunds the right things. The policy is deliberately uneven, because the donors
 * are: a previously crafted piece hands over its whole lineage, an ingredient-class part contributes
 * a single row for itself, and a plain shop-bought weapon contributes nothing at all - it is a gold
 * sink by design. Getting those apart wrong either duplicates materials into the economy or quietly
 * eats the player's rare drops.
 *
 * Refined equipment also occupies a dynamically allocated datastore slot, which has to be handed
 * back once the last copy leaves inventory or the id space leaks across a long playthrough.
 */
describe('JaftingSalvageManager refinement lineage (direct src import)', () =>
{
  // the ledger reads these straight off plugin metadata, which only exists once the plugin has
  // booted; these are the values the material-type checks are configured with.
  const materialArmorTypeId = 4;
  const materialWeaponTypeId = 5;

  /**
   * Builds a minimal RPG datum with just the surface the manager reads.
   * @param {'i'|'w'|'a'} kind The datum kind.
   * @param {number} id The database id.
   * @param {object} [extra] Additional properties such as atypeId.
   * @returns {object}
   */
  function fakeDatum(kind, id, extra = {})
  {
    return {
      id,
      isItem: () => kind === 'i',
      isWeapon: () => kind === 'w',
      isArmor: () => kind === 'a',
      ...extra,
    };
  }

  /**
   * Builds a ledger snapshot refunding a single item row.
   * @param {number} itemId The item id refunded.
   * @param {number} [count] How many are refunded.
   * @returns {JaftingSalvageLedgerSnapshot}
   */
  function snapshotOf(itemId, count = 1)
  {
    return new JaftingSalvageLedgerSnapshot([ new JaftingSalvageLedgerRow('i', itemId, count) ]);
  }

  beforeEach(() =>
  {
    globalThis.J = {
      JAFTING: {
        Metadata: {
          materialArmorTypeId,
          materialWeaponTypeId,
        },
      },
    };

    globalThis.$gameParty = {
      _counts: {},
      _refinedWeapons: [],
      _refinedArmors: [],
      numItems(datum)
      {
        const key = JaftingSalvageManager.containerKeyFromDatum(datum) ?? `?:${datum.id}`;

        return this._counts[key] ?? 0;
      },
      setCount(datum, n)
      {
        this._counts[JaftingSalvageManager.containerKeyFromDatum(datum)] = n;
      },
      getRefinedWeapons()
      {
        return this._refinedWeapons;
      },
      getRefinedArmors()
      {
        return this._refinedArmors;
      },
      gainItem: () => {},
      loseItem: () => {},
      gainGold: () => {},
      members: () => [],
    };

    // the ledger reads these letters off the bare CraftingComponent global when stamping rows.
    globalThis.CraftingComponent = {
      Types: { Item: 'i', Weapon: 'w', Armor: 'a', Gold: 'g', SDP: 's' },
    };

    globalThis.$dataWeapons = {};
    globalThis.$dataArmors = {};
    globalThis.$dataItems = {};
    globalThis.RPG_Weapon = { createEmpty: id => ({ id, empty: true }) };
    globalThis.RPG_Armor = { createEmpty: id => ({ id, empty: true }) };

    JaftingSalvageManager.initPartySalvageStorage();
  });

  afterEach(() =>
  {
    delete globalThis.J;
    delete globalThis.CraftingComponent;
    delete globalThis.$gameParty;
    delete globalThis.$dataWeapons;
    delete globalThis.$dataArmors;
    delete globalThis.$dataItems;
    delete globalThis.RPG_Weapon;
    delete globalThis.RPG_Armor;
  });

  //region donor classification
  describe('refinementMaterialHasNoRecoverableRows', () =>
  {
    it('recovers from a crafted donor carrying its own stamp', () =>
    {
      // Arrange
      const donor = fakeDatum('w', 5);
      donor._jaftingSalvageLedger = snapshotOf(1);

      // Act
      const noRows = JaftingSalvageManager.refinementMaterialHasNoRecoverableRows(donor);

      // Assert
      expect(noRows).toBe(false);
    });

    it('recovers from an ingredient-class armor even with no crafting history', () =>
    {
      // Arrange: monster parts are materials in their own right, not vendor goods.
      const donor = fakeDatum('a', 6, { atypeId: materialArmorTypeId });

      // Act
      const noRows = JaftingSalvageManager.refinementMaterialHasNoRecoverableRows(donor);

      // Assert
      expect(noRows).toBe(false);
    });

    it('recovers nothing from a plain shop-bought weapon', () =>
    {
      // Arrange: bare vendor equipment is a gold sink by design.
      const donor = fakeDatum('w', 7);

      // Act
      const noRows = JaftingSalvageManager.refinementMaterialHasNoRecoverableRows(donor);

      // Assert
      expect(noRows).toBe(true);
    });

    it('recovers nothing from a plain shop-bought armor', () =>
    {
      // Arrange
      const donor = fakeDatum('a', 8, { atypeId: materialArmorTypeId + 1 });

      // Act
      const noRows = JaftingSalvageManager.refinementMaterialHasNoRecoverableRows(donor);

      // Assert
      expect(noRows).toBe(true);
    });

    it('treats a plain stack item as recoverable rather than a vendor shell', () =>
    {
      // Arrange: the vendor-shell rule is scoped to equipment; items fall through it.
      const donor = fakeDatum('i', 9);

      // Act
      const noRows = JaftingSalvageManager.refinementMaterialHasNoRecoverableRows(donor);

      // Assert
      expect(noRows).toBe(false);
    });
  });
  //endregion donor classification

  //region output lineage
  describe('buildRefinementOutputLedger', () =>
  {
    it('carries the base lineage through when the donor contributes nothing', () =>
    {
      // Arrange: refining with a vendor weapon must not erase what the base already remembered.
      const base = fakeDatum('w', 3);
      base._jaftingSalvageLedger = snapshotOf(1, 2);

      // Act
      const output = JaftingSalvageManager.buildRefinementOutputLedger(base, fakeDatum('w', 7));

      // Assert
      expect(output.rows.length).toBe(1);
      expect(output.rows[0].n).toBe(2);
    });

    it('produces an empty lineage from an unstamped base and a vendor donor', () =>
    {
      // Arrange
      const base = fakeDatum('w', 3);

      // Act
      const output = JaftingSalvageManager.buildRefinementOutputLedger(base, fakeDatum('w', 7));

      // Assert
      expect(output.rows).toEqual([]);
    });

    it('folds a crafted donor\'s whole lineage into the output', () =>
    {
      // Arrange: refining two crafted pieces together should refund both histories later.
      const base = fakeDatum('w', 3);
      base._jaftingSalvageLedger = snapshotOf(1);
      const donor = fakeDatum('w', 5);
      donor._jaftingSalvageLedger = snapshotOf(2);

      // Act
      const output = JaftingSalvageManager.buildRefinementOutputLedger(base, donor);

      // Assert
      expect(output.rows.map(row => row.id).sort()).toEqual([ 1, 2 ]);
    });

    it('collapses duplicate materials from the two lineages into one row', () =>
    {
      // Arrange: both pieces built from the same material should read as a single stacked row.
      const base = fakeDatum('w', 3);
      base._jaftingSalvageLedger = snapshotOf(1, 2);
      const donor = fakeDatum('w', 5);
      donor._jaftingSalvageLedger = snapshotOf(1, 3);

      // Act
      const output = JaftingSalvageManager.buildRefinementOutputLedger(base, donor);

      // Assert
      expect(output.rows.length).toBe(1);
      expect(output.rows[0].n).toBe(5);
    });

    it('synthesizes a row for an ingredient-class armor donor', () =>
    {
      // Arrange: the part itself becomes refundable even though it was never crafted.
      const base = fakeDatum('w', 3);
      const donor = fakeDatum('a', 6, { atypeId: materialArmorTypeId });

      // Act
      const output = JaftingSalvageManager.buildRefinementOutputLedger(base, donor);

      // Assert
      expect(output.rows).toEqual([ expect.objectContaining({ t: 'a', id: 6, n: 1 }) ]);
    });

    it('synthesizes a row for an ingredient-class weapon donor', () =>
    {
      // Arrange
      const base = fakeDatum('w', 3);
      const donor = fakeDatum('w', 11, { wtypeId: materialWeaponTypeId });

      // Act
      const output = JaftingSalvageManager.buildRefinementOutputLedger(base, donor);

      // Assert
      expect(output.rows).toEqual([ expect.objectContaining({ t: 'w', id: 11, n: 1 }) ]);
    });

    it('adds nothing beyond the base lineage for a plain item donor', () =>
    {
      // Arrange: stack items consumed as material are not themselves refundable equipment.
      const base = fakeDatum('w', 3);
      base._jaftingSalvageLedger = snapshotOf(1, 2);

      // Act
      const output = JaftingSalvageManager.buildRefinementOutputLedger(base, fakeDatum('i', 9));

      // Assert
      expect(output.rows.length).toBe(1);
      expect(output.rows[0].n).toBe(2);
    });
  });
  //endregion output lineage

  //region reclaiming dynamic slots
  describe('reclaimDynamicWeaponSlot', () =>
  {
    it('drops the tracked refinement entry for the reclaimed weapon', () =>
    {
      // Arrange: refined rows are tracked for save hydration, so a stale reference would
      // resurrect a weapon that no longer exists on the next load.
      const weapon = fakeDatum('w', JaftingSalvageManager.DynamicEquipIndexMin);
      $gameParty._refinedWeapons = [ { index: weapon.id }, { index: weapon.id + 1 } ];

      // Act
      JaftingSalvageManager.reclaimDynamicWeaponSlot(weapon);

      // Assert
      expect($gameParty._refinedWeapons.map(entry => entry.index)).toEqual([ weapon.id + 1 ]);
    });

    it('blanks the datastore row so the id can be handed out again', () =>
    {
      // Arrange
      const weapon = fakeDatum('w', JaftingSalvageManager.DynamicEquipIndexMin);

      // Act
      JaftingSalvageManager.reclaimDynamicWeaponSlot(weapon);

      // Assert
      expect($dataWeapons[weapon.id].empty).toBe(true);
    });

    it('leaves unrelated refinement entries alone', () =>
    {
      // Arrange
      const weapon = fakeDatum('w', JaftingSalvageManager.DynamicEquipIndexMin);
      $gameParty._refinedWeapons = [ { index: weapon.id + 5 } ];

      // Act
      JaftingSalvageManager.reclaimDynamicWeaponSlot(weapon);

      // Assert
      expect($gameParty._refinedWeapons.length).toBe(1);
    });

    it('splices a real lineage node, which is what the tracking list actually holds', () =>
    {
      // Arrange: this is the one place core reaches into the refinement extension's storage, and it
      // matches on a field name. The list holds provenance rather than equips, so the match has to
      // keep landing on the node's own datastore slot.
      const weapon = fakeDatum('w', JaftingSalvageManager.DynamicEquipIndexMin);
      const doomed = JaftingRefinementLineage.refinement(
        weapon.id,
        JaftingRefinementLineage.leaf('w', 5),
        JaftingRefinementLineage.leaf('w', 9),
        null);
      const survivor = JaftingRefinementLineage.refinement(
        weapon.id + 1,
        JaftingRefinementLineage.leaf('w', 5),
        JaftingRefinementLineage.leaf('w', 9),
        null);
      $gameParty._refinedWeapons = [ doomed, survivor ];

      // Act
      JaftingSalvageManager.reclaimDynamicWeaponSlot(weapon);

      // Assert
      expect($gameParty._refinedWeapons).toEqual([ survivor ]);
    });

    it('leaves a reclaimed node nested inside a surviving lineage intact', () =>
    {
      // Arrange: a refined donor is reclaimed the moment it is consumed, so the output that consumed
      // it is the only remaining record of what it was. Splicing the top-level entry must not reach
      // into the tree that nests it, or replaying the survivor loses its own base.
      const donor = JaftingRefinementLineage.refinement(
        JaftingSalvageManager.DynamicEquipIndexMin,
        JaftingRefinementLineage.leaf('w', 5),
        JaftingRefinementLineage.leaf('w', 9),
        null);
      const output = JaftingRefinementLineage.refinement(
        JaftingSalvageManager.DynamicEquipIndexMin + 1,
        donor,
        JaftingRefinementLineage.leaf('w', 9),
        null);
      $gameParty._refinedWeapons = [ donor, output ];

      // Act
      JaftingSalvageManager.reclaimDynamicWeaponSlot(fakeDatum('w', donor.index));

      // Assert
      expect($gameParty._refinedWeapons).toEqual([ output ]);
      expect(output.base).toBe(donor);
      expect(output.base.base.id).toBe(5);
    });
  });

  describe('reclaimDynamicArmorSlot', () =>
  {
    it('drops the tracked refinement entry for the reclaimed armor', () =>
    {
      // Arrange
      const armor = fakeDatum('a', JaftingSalvageManager.DynamicEquipIndexMin);
      $gameParty._refinedArmors = [ { index: armor.id }, { index: armor.id + 1 } ];

      // Act
      JaftingSalvageManager.reclaimDynamicArmorSlot(armor);

      // Assert
      expect($gameParty._refinedArmors.map(entry => entry.index)).toEqual([ armor.id + 1 ]);
    });

    it('blanks the datastore row so the id can be handed out again', () =>
    {
      // Arrange
      const armor = fakeDatum('a', JaftingSalvageManager.DynamicEquipIndexMin);

      // Act
      JaftingSalvageManager.reclaimDynamicArmorSlot(armor);

      // Assert
      expect($dataArmors[armor.id].empty).toBe(true);
    });

    it('leaves unrelated refinement entries alone', () =>
    {
      // Arrange
      const armor = fakeDatum('a', JaftingSalvageManager.DynamicEquipIndexMin);
      $gameParty._refinedArmors = [ { index: armor.id + 5 } ];

      // Act
      JaftingSalvageManager.reclaimDynamicArmorSlot(armor);

      // Assert
      expect($gameParty._refinedArmors.length).toBe(1);
    });
  });

  describe('afterPartyLostItem', () =>
  {
    it('ignores a missing datum', () =>
    {
      // Arrange & Act
      const act = () => JaftingSalvageManager.afterPartyLostItem(null, 1);

      // Assert
      expect(act).not.toThrow();
    });

    it('ignores a loss of nothing', () =>
    {
      // Arrange & Act
      const act = () => JaftingSalvageManager.afterPartyLostItem(fakeDatum('i', 1), 0);

      // Assert
      expect(act).not.toThrow();
    });

    it('leaves the ledger alone while copies remain in the stack', () =>
    {
      // Arrange: a stack still holding copies must keep its bookkeeping.
      const datum = fakeDatum('i', 1);
      $gameParty.setCount(datum, 2);
      JaftingSalvageManager.appendStampedUnitsToPartyStack(datum, snapshotOf(7), 1);

      // Act
      JaftingSalvageManager.afterPartyLostItem(datum, 1);

      // Assert
      expect(JaftingSalvageManager.getLedgerForDatum(datum)).toBeTruthy();
    });

    it('scrubs the ledger once the final copy leaves', () =>
    {
      // Arrange
      const datum = fakeDatum('i', 1);
      $gameParty.setCount(datum, 1);
      JaftingSalvageManager.appendStampedUnitsToPartyStack(datum, snapshotOf(7), 1);
      $gameParty.setCount(datum, 0);

      // Act
      JaftingSalvageManager.afterPartyLostItem(datum, 1);

      // Assert
      expect(JaftingSalvageManager.getLedgerForDatum(datum)).toBe(null);
    });

    it('reclaims the datastore slot when a refined weapon is fully gone', () =>
    {
      // Arrange
      const weapon = fakeDatum('w', JaftingSalvageManager.DynamicEquipIndexMin);
      $gameParty._refinedWeapons = [ { index: weapon.id } ];

      // Act
      JaftingSalvageManager.afterPartyLostItem(weapon, 1);

      // Assert
      expect($gameParty._refinedWeapons).toEqual([]);
    });

    it('reclaims the datastore slot when a refined armor is fully gone', () =>
    {
      // Arrange
      const armor = fakeDatum('a', JaftingSalvageManager.DynamicEquipIndexMin);
      $gameParty._refinedArmors = [ { index: armor.id } ];

      // Act
      JaftingSalvageManager.afterPartyLostItem(armor, 1);

      // Assert
      expect($gameParty._refinedArmors).toEqual([]);
    });

    it('does nothing for a datum of no recognizable kind', () =>
    {
      // Arrange: without a container key there is no bag to prune.
      const datum = {
        id: 1,
        isItem: () => false,
        isWeapon: () => false,
        isArmor: () => false,
      };

      // Act
      const act = () => JaftingSalvageManager.afterPartyLostItem(datum, 1);

      // Assert
      expect(act).not.toThrow();
    });

    it('reclaims nothing for an ordinary weapon leaving inventory', () =>
    {
      // Arrange: only dynamically allocated refinement rows own a reclaimable slot.
      const weapon = fakeDatum('w', 4);
      $gameParty._refinedWeapons = [ { index: 4 } ];

      // Act
      JaftingSalvageManager.afterPartyLostItem(weapon, 1);

      // Assert
      expect($gameParty._refinedWeapons.length).toBe(1);
    });
  });
  //endregion reclaiming dynamic slots

  //region row and component vocabulary
  describe('row type vocabulary', () =>
  {
    it('refunds nothing for a row type it does not recognize', () =>
    {
      // Arrange: an unknown letter means the ledger and the refund switch have drifted apart,
      // and silently paying out the wrong currency would be worse than paying out nothing.
      const paid = [];
      $gameParty.gainItem = () => paid.push('item');
      $gameParty.gainGold = () => paid.push('gold');
      const ledger = new JaftingSalvageLedgerSnapshot([ new JaftingSalvageLedgerRow('?', 1, 5) ]);

      // Act
      JaftingSalvageManager.refundLedgerRows(ledger, 1);

      // Assert
      expect(paid).toEqual([]);
    });
  });

  describe('tryPushMaterialEquipmentPassThrough', () =>
  {
    it('passes an ingredient-class weapon row straight through', () =>
    {
      // Arrange: material weapons refund as themselves rather than unpacking further, the same
      // way ingredient armors do.
      const flat = [];
      const row = new JaftingSalvageLedgerRow('w', 11, 1);
      const equip = fakeDatum('w', 11, { wtypeId: materialWeaponTypeId });

      // Act
      const pushed = JaftingSalvageManager.tryPushMaterialEquipmentPassThrough(flat, row, equip);

      // Assert
      expect(pushed).toBe(true);
    });

    it('declines a weapon row whose equipment is not ingredient-class', () =>
    {
      // Arrange
      const flat = [];
      const row = new JaftingSalvageLedgerRow('w', 12, 1);
      const equip = fakeDatum('w', 12, { wtypeId: materialWeaponTypeId + 1 });

      // Act
      const pushed = JaftingSalvageManager.tryPushMaterialEquipmentPassThrough(flat, row, equip);

      // Assert
      expect(pushed).toBe(false);
    });
  });

  describe('applyCraftRecipeOutputs', () =>
  {
    /**
     * Builds a crafting component stand-in with the surface the manager reads.
     * @param {object} overrides The behavior to pin.
     * @returns {object}
     */
    function fakeComponent(overrides)
    {
      return {
        isDatabaseEntry: () => true,
        isGold: () => false,
        isSdp: () => false,
        isWeapon: () => false,
        isArmor: () => false,
        quantity: () => 1,
        getItem: () => fakeDatum('i', 1),
        ...overrides,
      };
    }

    it('stamps lineage onto a database-entry output', () =>
    {
      // Arrange
      const datum = fakeDatum('i', 1);
      $gameParty.setCount(datum, 1);
      const recipe = {
        outputs: [ fakeComponent({ getItem: () => datum }) ],
        ingredients: [ fakeComponent({ getItem: () => fakeDatum('i', 7) }) ],
        tools: [],
      };

      // Act
      JaftingSalvageManager.applyCraftRecipeOutputs(recipe);

      // Assert
      expect(JaftingSalvageManager.getLedgerForDatum(datum)).toBeTruthy();
    });

    it('stamps nothing for an output that is not a database entry', () =>
    {
      // Arrange: a recipe paying out gold has no row to attach dismantle lineage to.
      const recipe = {
        outputs: [ fakeComponent({ isDatabaseEntry: () => false, isGold: () => true }) ],
        ingredients: [],
        tools: [],
      };

      // Act
      const act = () => JaftingSalvageManager.applyCraftRecipeOutputs(recipe);

      // Assert
      expect(act).not.toThrow();
    });
  });

  describe('rowsFromCraftingComponents', () =>
  {
    /**
     * Builds a crafting component stand-in.
     * @param {object} overrides The behavior to pin.
     * @returns {object}
     */
    function fakeComponent(overrides)
    {
      return {
        isDatabaseEntry: () => false,
        isGold: () => false,
        isSdp: () => false,
        isWeapon: () => false,
        isArmor: () => false,
        quantity: () => 1,
        getItem: () => fakeDatum('i', 1),
        ...overrides,
      };
    }

    it('records a gold ingredient as a gold row', () =>
    {
      // Arrange & Act
      const rows = JaftingSalvageLedger.rowsFromCraftingComponents([
        fakeComponent({ isGold: () => true, quantity: () => 250 }),
      ]);

      // Assert
      expect(rows).toEqual([ expect.objectContaining({ t: 'g', n: 250 }) ]);
    });

    it('records an SDP ingredient as an SDP row', () =>
    {
      // Arrange: spending panel points to craft should refund them on dismantle.
      // Act
      const rows = JaftingSalvageLedger.rowsFromCraftingComponents([
        fakeComponent({ isSdp: () => true, quantity: () => 15 }),
      ]);

      // Assert
      expect(rows).toEqual([ expect.objectContaining({ t: 's', n: 15 }) ]);
    });

    it('records nothing for an ingredient of no recognized kind', () =>
    {
      // Arrange: an ingredient that is neither a database row, gold, nor panel points has no
      // refundable form, so it contributes no lineage rather than an unresolvable one.
      // Act
      const rows = JaftingSalvageLedger.rowsFromCraftingComponents([ fakeComponent({}) ]);

      // Assert
      expect(rows).toEqual([]);
    });

    it('records a weapon ingredient under the weapon letter', () =>
    {
      // Arrange & Act
      const rows = JaftingSalvageLedger.rowsFromCraftingComponents([
        fakeComponent({
          isDatabaseEntry: () => true,
          isWeapon: () => true,
          getItem: () => fakeDatum('w', 4),
          quantity: () => 2,
        }),
      ]);

      // Assert
      expect(rows).toEqual([ expect.objectContaining({ t: 'w', id: 4, n: 2 }) ]);
    });
  });
  //endregion row and component vocabulary
});
//endregion plugins/jafting/core/managers/salvage-refinement-lineage.test.js