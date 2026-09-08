//region plugins/extend/core/objects/game-item.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Builds a database-row stand-in carrying the semantic predicates {@link RPG_Base} defines.
 *
 * Every predicate defaults to false there and the owning implementation flips exactly one to true,
 * so a row built here answers the way a hydrated model does. The file under test asks these rather
 * than inspecting fields, and the shape keys are kept alongside because vanilla's setObject still
 * classifies by shape through J-Base's DataManager.
 * @param {object} fields The row's own data, including its id and its type-bearing key.
 * @param {string} truePredicate The single predicate this row answers true to.
 * @returns {object}
 */
function buildRow(fields, truePredicate)
{
  const row = {
    ...fields,
    isSkill: () => false,
    isItem: () => false,
    isWeapon: () => false,
    isArmor: () => false,
  };

  row[truePredicate] = () => true;

  return row;
}

describe('Game_Item ext/extend augments (direct src import)', () =>
{
  let Game_Item;

  beforeAll(async () =>
  {
    vi.resetModules();

    // RMMZ's core adds this to the String constructor and nothing in a node realm does. The file
    // under test compares a data class against it, so without this every comparison reads as a
    // mismatch and the branch that carries an object is never reached.
    Object.defineProperty(String, 'empty', {
      enumerable: true,
      configurable: true,
      get: () => '',
    });

    globalThis.J = { EXTEND: { Aliased: { Game_Item: new Map() } } };

    function StubGameItem()
    {
    }

    StubGameItem.prototype.initMembers = vi.fn();

    // J-Base calls the hook from `initialize`; this file aliases both, so the stub has to reach the
    // hook the way the real chain does.
    StubGameItem.prototype.initialize = vi.fn(function()
    {
      this.initMembers();
    });
    // J-Base replaces the engine's DataManager type checks wholesale, and these are its real
    // implementations. They matter here because vanilla's setObject delegates its entire
    // classification to them: J-Base names a class by *shape*, so a merged clone of a skill is
    // classified 'skill' exactly like the row it came from. A fixture that classified by identity
    // against $dataSkills instead would let a clone fall through as unclassified and would report
    // this file working for a reason the shipped game does not have.
    globalThis.DataManager = {
      isSkill: unidentified => unidentified && ('stypeId' in unidentified),
      isItem: unidentified => unidentified && ('itypeId' in unidentified),
      isWeapon: unidentified => unidentified && ('wtypeId' in unidentified),
      isArmor: unidentified => unidentified && ('atypeId' in unidentified),
    };

    // vanilla's own setObject, verbatim from rmmz_objects.js: it delegates every classification
    // decision to DataManager above rather than making one itself.
    StubGameItem.prototype.setObject = vi.fn(function(item)
    {
      if (globalThis.DataManager.isSkill(item)) this._dataClass = 'skill';
      else if (globalThis.DataManager.isItem(item)) this._dataClass = 'item';
      else if (globalThis.DataManager.isWeapon(item)) this._dataClass = 'weapon';
      else if (globalThis.DataManager.isArmor(item)) this._dataClass = 'armor';
      else this._dataClass = '';

      this._itemId = item ? item.id : 0;
    });
    StubGameItem.prototype.object = vi.fn();

    // J-Base owns the data class accessors this file writes through.
    StubGameItem.prototype.setDataClass = function(newDataClass) { this._dataClass = newDataClass; };
    StubGameItem.prototype.dataClass = function() { return this._dataClass; };
    globalThis.Game_Item = StubGameItem;

    await import('../../../../../src/plugins/extend/core/objects/Game_Item.js');
    ({ Game_Item } = globalThis);
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();

    // each database holds two real rows, so "the row this database holds at this id" is a stricter
    // claim than "a row this database holds somewhere". With a single row those two are the same
    // statement, and a lookup that ignored the id entirely would still pass every assertion here.
    globalThis.$dataSkills = [
      null,
      buildRow({ id: 1, stypeId: 1 }, 'isSkill'),
      buildRow({ id: 2, stypeId: 1 }, 'isSkill'),
    ];
    globalThis.$dataItems = [
      null,
      buildRow({ id: 1, itypeId: 1 }, 'isItem'),
      buildRow({ id: 2, itypeId: 1 }, 'isItem'),
    ];
    globalThis.$dataWeapons = [ null, buildRow({ id: 1, wtypeId: 1 }, 'isWeapon') ];
    globalThis.$dataArmors = [ null, buildRow({ id: 1, atypeId: 1 }, 'isArmor') ];
  });

  describe('initMembers/underlyingObject', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const item = new Game_Item();
      const dbItem = {};

      // Act
      item.initialize(dbItem);

      // Assert
      expect(globalThis.J.EXTEND.Aliased.Game_Item.get('initialize')).toHaveBeenCalledWith(dbItem);
    });

    it('assigns the underlying item when provided', () =>
    {
      // Arrange
      const item = new Game_Item();
      const dbItem = {};

      // Act
      item.initialize(dbItem);

      // Assert
      expect(item.underlyingObject()).toBe(dbItem);
    });

    it('defaults the underlying item to null when none is provided', () =>
    {
      // Arrange- the default lives in the hook, which is the half a decode can run.
      const item = new Game_Item();

      // Act
      item.initMembers();

      // Assert
      expect(item.underlyingObject()).toEqual(null);
    });

    it('leaves the default in place when initialized with no item at all', () =>
    {
      // Arrange- vanilla constructs a bare `Game_Item` in several places and fills it in later, so
      // arriving with nothing is ordinary. Assigning the absent argument would overwrite the hook's
      // null with `undefined`, which reads differently everywhere downstream.
      const item = new Game_Item();

      // Act
      item.initialize();

      // Assert
      expect(item.underlyingObject()).toEqual(null);
    });
  });

  describe('setObject', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const item = new Game_Item();
      const obj = buildRow({ id: 1, stypeId: 1 }, 'isSkill');

      // Act
      item.setObject(obj);

      // Assert
      expect(globalThis.J.EXTEND.Aliased.Game_Item.get('setObject')).toHaveBeenCalledWith(obj);
    });

    it('does nothing further when obj is falsy', () =>
    {
      // Arrange
      const item = new Game_Item();

      // Act/Assert (no throw)
      expect(() => item.setObject(null)).not.toThrow();
      expect(item._dataClass).toEqual('');
      expect(item._item).toEqual(undefined);
    });

    it('carries a skill the database does not hold at that id', () =>
    {
      // Arrange- an extended skill is built by merging overlays onto a clone, so it answers isSkill
      // exactly like a real row while being an object $dataSkills has never heard of. Carrying it is
      // the whole reason this file exists: nothing else can look it up again.
      const item = new Game_Item();
      const obj = buildRow({ id: 3, stypeId: 1 }, 'isSkill');

      // Act
      item.setObject(obj);

      // Assert
      expect(item._dataClass).toEqual('skill');
      expect(item._item).toBe(obj);
    });

    it('carries an item the database does not hold at that id', () =>
    {
      // Arrange
      const item = new Game_Item();
      const obj = buildRow({ id: 3, itypeId: 1 }, 'isItem');

      // Act
      item.setObject(obj);

      // Assert
      expect(item._dataClass).toEqual('item');
      expect(item._item).toBe(obj);
    });

    it('carries a skill whose id collides with a real row but is a different object', () =>
    {
      // Arrange- the case the whole fix turns on. An overlay-merged skill keeps the base skill's id,
      // so id equality is satisfied while the object is not the database's own. Anything that
      // decided provenance from the id alone, or from the data class the engine stamped, would call
      // this a database row and silently drop the merge.
      const item = new Game_Item();
      const merged = buildRow({ id: 1, stypeId: 1 }, 'isSkill');

      // Act
      item.setObject(merged);

      // Assert
      expect(item._dataClass).toEqual('skill');
      expect(item._item).toBe(merged);
    });

    it('carries nothing for the skill the database holds at that id', () =>
    {
      // Arrange- the engine can find this one again, so it round-trips a save as a class plus an id
      // rather than as a frozen copy that would never see a rebalance.
      const item = new Game_Item();
      const [ , , obj ] = globalThis.$dataSkills;

      // Act
      item.setObject(obj);

      // Assert- the class still lands, proving the engine ran and that carrying is what was declined
      // rather than the whole method bailing out early.
      expect(item._dataClass).toEqual('skill');
      expect(item._item).toBeNull();
    });

    it('carries nothing for the item the database holds at that id', () =>
    {
      // Arrange- the shape this crashed on: $gameParty._lastItem holding an ordinary consumable.
      const item = new Game_Item();
      const [ , , obj ] = globalThis.$dataItems;

      // Act
      item.setObject(obj);

      // Assert
      expect(item._dataClass).toEqual('item');
      expect(item._item).toBeNull();
    });

    it('clears a carry left behind when a real row is bound after a synthetic one', () =>
    {
      // Arrange- one wrapper outlives every skill bound to it, so the two bindings below are the
      // ordinary life of a battler casting an extended skill and then a plain one. Without the
      // clear, the second binding reports the first skill forever.
      const item = new Game_Item();
      const synthetic = buildRow({ id: 3, stypeId: 1 }, 'isSkill');
      const [ , realRow ] = globalThis.$dataSkills;
      item.setObject(synthetic);

      // Act
      item.setObject(realRow);

      // Assert
      expect(item._item).toBeNull();
    });

    it('carries nothing for a weapon, which answers neither predicate', () =>
    {
      // Arrange- equipment reaches setObject constantly and has no business being copied either.
      const item = new Game_Item();
      const [ , obj ] = globalThis.$dataWeapons;

      // Act
      item.setObject(obj);

      // Assert- untouched rather than cleared, because no branch claimed it at all.
      expect(item._dataClass).toEqual('weapon');
      expect(item._item).toEqual(undefined);
    });

    it('carries nothing for a row that answers false to every predicate', () =>
    {
      // Arrange- RPG_Base defaults every predicate to false, so a row whose implementation flips
      // none of them is the honest floor case rather than a malformed object.
      const item = new Game_Item();
      const obj = buildRow({ id: 1 }, 'isState');

      // Act
      item.setObject(obj);

      // Assert
      expect(item._dataClass).toEqual('');
      expect(item._item).toEqual(undefined);
    });
  });

  describe('object', () =>
  {
    it('returns the custom underlying item when one was assigned', () =>
    {
      // Arrange
      const item = new Game_Item();
      const customObj = {};
      item._item = customObj;

      // Act
      const result = item.object();

      // Assert
      expect(result).toBe(customObj);
      expect(globalThis.J.EXTEND.Aliased.Game_Item.get('object')).not.toHaveBeenCalled();
    });

    it('falls back to the original implementation when no custom item was assigned', () =>
    {
      // Arrange
      const item = new Game_Item();
      item._item = null;
      const originalResult = {};
      globalThis.J.EXTEND.Aliased.Game_Item.get('object').mockReturnValue(originalResult);

      // Act
      const result = item.object();

      // Assert
      expect(result).toBe(originalResult);
    });
  });
});
//endregion plugins/extend/core/objects/game-item.test.js
