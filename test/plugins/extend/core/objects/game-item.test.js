//region plugins/extend/core/objects/game-item.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Game_Item ext/extend augments (direct src import)', () =>
{
  let Game_Item;

  beforeAll(async () =>
  {
    vi.resetModules();

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
    StubGameItem.prototype.setObject = vi.fn();
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
      expect(item._dataClass).toEqual(undefined);
    });

    it('binds a skill-shaped object (stypeId) as the skill data class', () =>
    {
      // Arrange
      const item = new Game_Item();
      const obj = { stypeId: 1 };

      // Act
      item.setObject(obj);

      // Assert
      expect(item._dataClass).toEqual('skill');
      expect(item._item).toBe(obj);
    });

    it('binds an item-shaped object (itypeId) as the item data class', () =>
    {
      // Arrange
      const item = new Game_Item();
      const obj = { itypeId: 1 };

      // Act
      item.setObject(obj);

      // Assert
      expect(item._dataClass).toEqual('item');
      expect(item._item).toBe(obj);
    });

    it('does not bind an object with neither stypeId nor itypeId', () =>
    {
      // Arrange
      const item = new Game_Item();
      const obj = {};

      // Act
      item.setObject(obj);

      // Assert
      expect(item._dataClass).toEqual(undefined);
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
