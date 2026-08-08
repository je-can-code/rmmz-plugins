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
   * Builds a minimal RPG datum carrying both halves of a row's identity.
   *
   * `id` says what the row is OF and `index` says which instance it is; `_key()` hands back the index, which is what
   * real containers and datastores are keyed by. The two coincide here by default because that is true of every row
   * authored in the database editor - see {@link dynamicDatum} for the case where they diverge.
   * @param {'i'|'w'|'a'} kind The datum kind.
   * @param {number} id The database id.
   * @param {object} [extra] Additional properties such as atypeId.
   * @returns {object}
   */
  function fakeDatum(kind, id, extra = {})
  {
    return {
      id,
      index: id,
      _key()
      {
        return this.index;
      },
      isItem: () => kind === 'i',
      isWeapon: () => kind === 'w',
      isArmor: () => kind === 'a',
      ...extra,
    };
  }

  /**
   * Builds a dynamic instance: a clone of some base row that has been moved into its own datastore slot.
   *
   * This is the shape refinement actually produces, and the shape that matters - `stampRefinedOutput` moves only the
   * index, so the row keeps reporting its base's `id` forever. A fixture where the two agree cannot tell whether
   * production code asked the right question.
   * @param {'i'|'w'|'a'} kind The datum kind.
   * @param {number} baseId The id of the row this was cloned from.
   * @param {number} slot The dynamic datastore slot it now occupies.
   * @param {object} [extra] Additional properties such as atypeId.
   * @returns {object}
   */
  function dynamicDatum(kind, baseId, slot, extra = {})
  {
    return fakeDatum(kind, baseId, {
      index: slot,
      ...extra,
    });
  }

  /**
   * The key a real `Game_Party` container uses for a datum: its kind plus its instance slot.
   *
   * J-Base overwrites `numItems` and `gainItem` to key on `_key()`, so a stub keyed on `id` would report a refined
   * instance and the base stack it was cloned from as the same holding.
   * @param {object} datum The datum to key.
   * @returns {string}
   */
  function instanceKey(datum)
  {
    if (datum.isItem()) return `i:${datum._key()}`;

    if (datum.isWeapon()) return `w:${datum._key()}`;

    return `a:${datum._key()}`;
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
        return this._counts[instanceKey(datum)] ?? 0;
      },
      setCount(datum, n)
      {
        this._counts[instanceKey(datum)] = n;
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

    // the reclaim path asks the actor roster whether anybody is wearing the slot.
    globalThis.$gameActors = { existingActors: () => [] };

    globalThis.$dataWeapons = {};
    globalThis.$dataArmors = {};
    globalThis.$dataItems = {};
    globalThis.RPG_Weapon = { createEmpty: id => ({ id, empty: true }) };
    globalThis.RPG_Armor = { createEmpty: id => ({ id, empty: true }) };

    // collection and per-copy sizing both ask who is wearing what; an empty cast is the neutral baseline, and the
    // cases that care about worn gear install their own roster.
    globalThis.$gameActors = { existingActors: () => [] };

    JaftingSalvageManager.initPartySalvageStorage();
  });

  afterEach(() =>
  {
    delete globalThis.J;
    delete globalThis.CraftingComponent;
    delete globalThis.$gameParty;
    delete globalThis.$gameActors;
    delete globalThis.$dataWeapons;
    delete globalThis.$dataArmors;
    delete globalThis.$dataItems;
    delete globalThis.RPG_Weapon;
    delete globalThis.RPG_Armor;
    delete globalThis.$gameActors;
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
      const weapon = dynamicDatum('w', 5, JaftingSalvageManager.DynamicEquipIndexMin);
      $gameParty._refinedWeapons = [ { index: weapon.index }, { index: weapon.index + 1 } ];

      // Act
      JaftingSalvageManager.reclaimDynamicWeaponSlot(weapon);

      // Assert
      expect($gameParty._refinedWeapons.map(entry => entry.index)).toEqual([ weapon.index + 1 ]);
    });

    it('blanks its own slot rather than the base row it was cloned from', () =>
    {
      // Arrange: the instance lives in slot 2001 while still reporting the base weapon's id of 5. Reading the id
      // here would hand back slot 5, which is a weapon the player may well still be carrying.
      const weapon = dynamicDatum('w', 5, JaftingSalvageManager.DynamicEquipIndexMin);
      $dataWeapons[5] = { id: 5, name: 'Iron Sword' };

      // Act
      JaftingSalvageManager.reclaimDynamicWeaponSlot(weapon);

      // Assert
      expect($dataWeapons[weapon.index].empty).toBe(true);
      expect($dataWeapons[5].name).toBe('Iron Sword');
    });

    it('leaves unrelated refinement entries alone', () =>
    {
      // Arrange
      const weapon = dynamicDatum('w', 5, JaftingSalvageManager.DynamicEquipIndexMin);
      $gameParty._refinedWeapons = [ { index: weapon.index + 5 } ];

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
      const weapon = dynamicDatum('w', 5, JaftingSalvageManager.DynamicEquipIndexMin);
      const doomed = JaftingRefinementLineage.refinement(
        weapon.index,
        JaftingRefinementLineage.leaf('w', 5),
        JaftingRefinementLineage.leaf('w', 9),
        null);
      const survivor = JaftingRefinementLineage.refinement(
        weapon.index + 1,
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
      JaftingSalvageManager.reclaimDynamicWeaponSlot(dynamicDatum('w', 5, donor.index));

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
      const armor = dynamicDatum('a', 7, JaftingSalvageManager.DynamicEquipIndexMin);
      $gameParty._refinedArmors = [ { index: armor.index }, { index: armor.index + 1 } ];

      // Act
      JaftingSalvageManager.reclaimDynamicArmorSlot(armor);

      // Assert
      expect($gameParty._refinedArmors.map(entry => entry.index)).toEqual([ armor.index + 1 ]);
    });

    it('blanks its own slot rather than the base row it was cloned from', () =>
    {
      // Arrange: twin of the weapon case - the instance reports base armor id 7 while living in slot 2001.
      const armor = dynamicDatum('a', 7, JaftingSalvageManager.DynamicEquipIndexMin);
      $dataArmors[7] = { id: 7, name: 'Leather Vest' };

      // Act
      JaftingSalvageManager.reclaimDynamicArmorSlot(armor);

      // Assert
      expect($dataArmors[armor.index].empty).toBe(true);
      expect($dataArmors[7].name).toBe('Leather Vest');
    });

    it('leaves unrelated refinement entries alone', () =>
    {
      // Arrange
      const armor = dynamicDatum('a', 7, JaftingSalvageManager.DynamicEquipIndexMin);
      $gameParty._refinedArmors = [ { index: armor.index + 5 } ];

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

    it('sizes a short unit array back to the stack while copies remain', () =>
    {
      // Arrange: this hook's whole job on a surviving stack is keeping the bag sized to what it describes, and a
      // bag can arrive lagging behind - a copy coming back from an equip slot is held again without the array
      // having grown for it. one stamped copy keeps the bag alive so the sizing is what is being observed.
      const datum = fakeDatum('i', 1);
      $gameParty.setCount(datum, 1);
      JaftingSalvageManager.appendStampedUnitsToPartyStack(datum, snapshotOf(7), 1);
      $gameParty.setCount(datum, 2);

      // Act
      JaftingSalvageManager.afterPartyLostItem(datum, 1);

      // Assert
      expect($gameParty._j._jafting._salvageLedgers['i:1'].unitLedgers).toHaveLength(2);
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

    it('reclaims no weapon slot, because leaving the bag is not leaving the game', () =>
    {
      // Arrange: this hook fires mid-equip too, when the row is briefly held nowhere at all.
      const weapon = dynamicDatum('w', 5, JaftingSalvageManager.DynamicEquipIndexMin);
      $gameParty._refinedWeapons = [ { index: weapon.index } ];

      // Act
      JaftingSalvageManager.afterPartyLostItem(weapon, 1);

      // Assert
      expect($gameParty._refinedWeapons).toHaveLength(1);
    });

    it('reclaims no armor slot either', () =>
    {
      // Arrange
      const armor = dynamicDatum('a', 7, JaftingSalvageManager.DynamicEquipIndexMin);
      $gameParty._refinedArmors = [ { index: armor.index } ];

      // Act
      JaftingSalvageManager.afterPartyLostItem(armor, 1);

      // Assert
      expect($gameParty._refinedArmors).toHaveLength(1);
    });

    it('leaves the base row\'s salvage bag alone when a refined clone of it is discarded', () =>
    {
      // Arrange: the refined sword reports base id 5, so anything keying the party bag off its id would delete the
      // bag belonging to the plain Iron Swords still in the player's inventory - stripping their dismantle refunds
      // as a side effect of throwing away something else entirely.
      const baseWeapon = fakeDatum('w', 5);
      $gameParty.setCount(baseWeapon, 3);
      JaftingSalvageManager.appendStampedUnitsToPartyStack(baseWeapon, snapshotOf(31), 3);
      const refined = dynamicDatum('w', 5, JaftingSalvageManager.DynamicEquipIndexMin);
      $gameParty._refinedWeapons = [ { index: refined.index } ];

      // Act
      JaftingSalvageManager.afterPartyLostItem(refined, 1);

      // Assert
      expect(JaftingSalvageManager.getLedgerForDatum(baseWeapon)).toBeTruthy();
    });

    it('does nothing for a datum of no recognizable kind', () =>
    {
      // Arrange: without a container key there is no bag to prune.
      const datum = {
        id: 1,
        index: 1,
        _key: () => 1,
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
  //region collecting unreferenced slots
  /**
   * Collection is a garbage collector rather than an allocator: the refinement counter only counts upward, so no
   * future refinement waits on a freed slot. That is what lets it run from a quiet moment instead of from the
   * middle of an equip - and the whole burden of correctness lands on one question, "does anything still hold
   * this row", which has two answers and both of them have burned this code before.
   */
  describe('reclaimUnreferencedDynamicSlots', () =>
  {
    /**
     * Registers a tracked refined weapon occupying a dynamic slot.
     * @param {number} slot The dynamic slot it occupies.
     * @returns {object} The datum written into the datastore.
     */
    function trackedWeapon(slot)
    {
      const row = dynamicDatum('w', 5, slot);
      $dataWeapons[slot] = row;
      $gameParty._refinedWeapons.push({ index: slot });

      return row;
    }

    /**
     * Installs a roster of actors, each wearing whatever equips are handed over.
     * @param {object[][]} equipsPerActor One array of equipped rows per actor.
     */
    function actorsWearing(equipsPerActor)
    {
      globalThis.$gameActors = {
        existingActors: () => equipsPerActor.map(equips => ({ equips: () => equips })),
      };
    }

    beforeEach(() =>
    {
      actorsWearing([]);
    });

    afterEach(() =>
    {
      delete globalThis.$gameActors;
    });

    it('collects a slot nothing holds any more', () =>
    {
      // Arrange
      const row = trackedWeapon(JaftingSalvageManager.DynamicEquipIndexMin);
      $gameParty.setCount(row, 0);

      // Act
      JaftingSalvageManager.reclaimUnreferencedDynamicSlots();

      // Assert
      expect($gameParty._refinedWeapons).toEqual([]);
      expect($dataWeapons[row.index].empty).toBe(true);
    });

    it('spares a slot still sitting in the bag', () =>
    {
      // Arrange
      const row = trackedWeapon(JaftingSalvageManager.DynamicEquipIndexMin);
      $gameParty.setCount(row, 1);

      // Act
      JaftingSalvageManager.reclaimUnreferencedDynamicSlots();

      // Assert
      expect($gameParty._refinedWeapons).toHaveLength(1);
    });

    it('spares a slot somebody is wearing', () =>
    {
      // Arrange: equipped rows are not in any container, so the bag reads zero while the sword is in a hand.
      const row = trackedWeapon(JaftingSalvageManager.DynamicEquipIndexMin);
      $gameParty.setCount(row, 0);
      actorsWearing([ [ row ] ]);

      // Act
      JaftingSalvageManager.reclaimUnreferencedDynamicSlots();

      // Assert
      expect($gameParty._refinedWeapons).toHaveLength(1);
      expect($dataWeapons[row.index]).toBe(row);
    });

    it('spares a slot worn by an actor who is not in the party right now', () =>
    {
      // Arrange: Chef Adventure splits its two leads across halves of a dungeon, so the character who is not
      // currently travelling with you still has their gear on. `existingActors` is read rather than the party
      // roster precisely so that sword survives the sweep.
      const row = trackedWeapon(JaftingSalvageManager.DynamicEquipIndexMin);
      $gameParty.setCount(row, 0);
      $gameParty._actors = [];
      actorsWearing([ [], [ row ] ]);

      // Act
      JaftingSalvageManager.reclaimUnreferencedDynamicSlots();

      // Assert
      expect($gameParty._refinedWeapons).toHaveLength(1);
    });

    it('reads past an empty equip slot rather than tripping over it', () =>
    {
      // Arrange: an unfilled equip slot resolves to null by contract, so the list genuinely holds gaps.
      const row = trackedWeapon(JaftingSalvageManager.DynamicEquipIndexMin);
      $gameParty.setCount(row, 0);
      actorsWearing([ [ null, row ] ]);

      // Act
      const act = () => JaftingSalvageManager.reclaimUnreferencedDynamicSlots();

      // Assert
      expect(act).not.toThrow();
      expect($gameParty._refinedWeapons).toHaveLength(1);
    });

    it('collects every dead slot in one pass without losing its place', () =>
    {
      // Arrange: collection splices the list being walked, so the slots are snapshotted up front. Without that,
      // the second entry shifts into the index already visited and survives.
      const first = trackedWeapon(JaftingSalvageManager.DynamicEquipIndexMin);
      const second = trackedWeapon(JaftingSalvageManager.DynamicEquipIndexMin + 1);
      $gameParty.setCount(first, 0);
      $gameParty.setCount(second, 0);

      // Act
      JaftingSalvageManager.reclaimUnreferencedDynamicSlots();

      // Assert
      expect($gameParty._refinedWeapons).toEqual([]);
    });

    it('collects a dead armor slot alongside the weapons', () =>
    {
      // Arrange
      const armorSlot = JaftingSalvageManager.DynamicEquipIndexMin;
      const armor = dynamicDatum('a', 7, armorSlot);
      $dataArmors[armorSlot] = armor;
      $gameParty._refinedArmors.push({ index: armorSlot });
      $gameParty.setCount(armor, 0);

      // Act
      JaftingSalvageManager.reclaimUnreferencedDynamicSlots();

      // Assert
      expect($gameParty._refinedArmors).toEqual([]);
      expect($dataArmors[armorSlot].empty).toBe(true);
    });

    it('changes nothing on a second pass over the same state', () =>
    {
      // Arrange: a sweep runs on every map entry, so it has to be safe to run when there is nothing to do.
      const row = trackedWeapon(JaftingSalvageManager.DynamicEquipIndexMin);
      $gameParty.setCount(row, 0);
      JaftingSalvageManager.reclaimUnreferencedDynamicSlots();

      // Act
      const act = () => JaftingSalvageManager.reclaimUnreferencedDynamicSlots();

      // Assert
      expect(act).not.toThrow();
      expect($gameParty._refinedWeapons).toEqual([]);
    });
  });
  //endregion collecting unreferenced slots
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

  //region only collecting slots nothing is holding
  describe('reclaimWeaponSlotWhenUnreferenced / reclaimArmorSlotWhenUnreferenced', () =>
  {
    it('leaves a weapon slot alone while a copy is still held', () =>
    {
      // Arrange- collecting a slot somebody still owns would swap the item out from under them, and
      // the row it points at would be reused by the next refinement.
      const weapon = dynamicDatum('w', 5, JaftingSalvageManager.DynamicEquipIndexMin);
      globalThis.$dataWeapons = [];
      globalThis.$dataWeapons[weapon.index] = weapon;
      $gameParty._refinedWeapons = [ { index: weapon.index } ];
      $gameParty.setCount(weapon, 1);

      // Act
      JaftingSalvageManager.reclaimWeaponSlotWhenUnreferenced(weapon.index);

      // Assert
      expect($gameParty._refinedWeapons.map(entry => entry.index)).toEqual([ weapon.index ]);
    });

    it('collects a weapon slot once nothing holds it', () =>
    {
      // Arrange
      const weapon = dynamicDatum('w', 5, JaftingSalvageManager.DynamicEquipIndexMin);
      globalThis.$dataWeapons = [];
      globalThis.$dataWeapons[weapon.index] = weapon;
      $gameParty._refinedWeapons = [ { index: weapon.index } ];

      // Act
      JaftingSalvageManager.reclaimWeaponSlotWhenUnreferenced(weapon.index);

      // Assert
      expect($gameParty._refinedWeapons).toEqual([]);
    });

    it('leaves an armor slot alone while a copy is still held', () =>
    {
      // Arrange
      const armor = dynamicDatum('a', 5, JaftingSalvageManager.DynamicEquipIndexMin);
      globalThis.$dataArmors = [];
      globalThis.$dataArmors[armor.index] = armor;
      $gameParty._refinedArmors = [ { index: armor.index } ];
      $gameParty.setCount(armor, 1);

      // Act
      JaftingSalvageManager.reclaimArmorSlotWhenUnreferenced(armor.index);

      // Assert
      expect($gameParty._refinedArmors.map(entry => entry.index)).toEqual([ armor.index ]);
    });

    it('collects an armor slot once nothing holds it', () =>
    {
      // Arrange
      const armor = dynamicDatum('a', 5, JaftingSalvageManager.DynamicEquipIndexMin);
      globalThis.$dataArmors = [];
      globalThis.$dataArmors[armor.index] = armor;
      $gameParty._refinedArmors = [ { index: armor.index } ];

      // Act
      JaftingSalvageManager.reclaimArmorSlotWhenUnreferenced(armor.index);

      // Assert
      expect($gameParty._refinedArmors).toEqual([]);
    });
  });
  //endregion only collecting slots nothing is holding
});
//endregion plugins/jafting/core/managers/salvage-refinement-lineage.test.js