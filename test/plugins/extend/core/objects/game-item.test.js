//region plugins/extend/core/objects/game-item.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

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
    // vanilla's own setObject, faithfully: it names a data class by *identity* against each
    // database, and leaves the class empty for anything it does not find there. That empty string
    // is the signal the extension under test reads, so a stub that assigns nothing would let the
    // guard pass on `undefined` and never exercise the branch that matters.
    StubGameItem.prototype.setObject = vi.fn(function(item)
    {
      if (item && globalThis.$dataSkills.includes(item)) this._dataClass = 'skill';
      else if (item && globalThis.$dataItems.includes(item)) this._dataClass = 'item';
      else if (item && globalThis.$dataWeapons.includes(item)) this._dataClass = 'weapon';
      else if (item && globalThis.$dataArmors.includes(item)) this._dataClass = 'armor';
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

    // each database holds one real row, so "found by identity" and "shaped like one but absent"
    // are distinguishable- with an empty database every object looks synthetic and the guard
    // under test would pass for the wrong reason.
    globalThis.$dataSkills = [ null, { id: 1, stypeId: 1 } ];
    globalThis.$dataItems = [ null, { id: 1, itypeId: 1 } ];
    globalThis.$dataWeapons = [ null, { id: 1, wtypeId: 1 } ];
    globalThis.$dataArmors = [ null, { id: 1, atypeId: 1 } ];
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
      const obj = { stypeId: 1 };

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

    it('binds a skill-shaped object (stypeId) the database does not hold', () =>
    {
      // Arrange- an extended skill is built by merging overlays, so it is a fresh object that no
      // identity check against $dataSkills can find. Carrying it is the whole point of this file.
      const item = new Game_Item();
      const obj = { id: 1, stypeId: 1 };

      // Act
      item.setObject(obj);

      // Assert
      expect(item._dataClass).toEqual('skill');
      expect(item._item).toBe(obj);
    });

    it('binds an item-shaped object (itypeId) the database does not hold', () =>
    {
      // Arrange
      const item = new Game_Item();
      const obj = { id: 1, itypeId: 1 };

      // Act
      item.setObject(obj);

      // Assert
      expect(item._dataClass).toEqual('item');
      expect(item._item).toBe(obj);
    });

    it('carries nothing for a skill the database already holds', () =>
    {
      // Arrange- the engine found this row, so it round-trips through a save as a class plus an id.
      const item = new Game_Item();
      const [ , obj ] = globalThis.$dataSkills;

      // Act
      item.setObject(obj);

      // Assert- the class still lands, proving the engine ran and the early return is what stopped
      // the copy rather than the whole method bailing out.
      expect(item._dataClass).toEqual('skill');
      expect(item._item).toEqual(undefined);
    });

    it('carries nothing for an item the database already holds', () =>
    {
      // Arrange- the shape this crashed on: $gameParty._lastItem holding an ordinary consumable.
      const item = new Game_Item();
      const [ , obj ] = globalThis.$dataItems;

      // Act
      item.setObject(obj);

      // Assert
      expect(item._dataClass).toEqual('item');
      expect(item._item).toEqual(undefined);
    });

    it('carries nothing for a weapon, which is neither skill- nor item-shaped', () =>
    {
      // Arrange- equipment reaches setObject constantly and has no business being copied either.
      const item = new Game_Item();
      const [ , obj ] = globalThis.$dataWeapons;

      // Act
      item.setObject(obj);

      // Assert
      expect(item._dataClass).toEqual('weapon');
      expect(item._item).toEqual(undefined);
    });

    it('does not bind an object with neither stypeId nor itypeId', () =>
    {
      // Arrange
      const item = new Game_Item();
      const obj = {};

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
