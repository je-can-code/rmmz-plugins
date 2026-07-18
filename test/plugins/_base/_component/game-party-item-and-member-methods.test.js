//region plugins/_base/_component/game-party-item-and-member-methods.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installJabsOnChanceEffectGlobalStub } from './fixtures/install-jabs-onchance-stub.js';
import { installJBaseHostGlobals } from './fixtures/install-j-base-host-globals.js';

describe('Game_Party item/member methods (direct src import)', () =>
{
  let RPGManager;

  beforeAll(async () =>
  {
    // fresh module registry so re-running this file doesn't double-apply J.BASE setup.
    vi.resetModules();

    installJBaseHostGlobals();

    // vanilla RMMZ core prototype extension (rmmz_core.js), not part of this plugin- stubbed
    // explicitly rather than relying on another test file having already mutated the prototype.
    Number.prototype.clamp = function(min, max)
    {
      return Math.min(Math.max(this, min), max);
    };

    // getOnChanceEffectsFromDatabaseObject() instantiates JABS_OnChanceEffect, which lives in JABS, not J-Base.
    installJabsOnChanceEffectGlobalStub(globalThis);

    // real production code- sets up J.BASE.RegExp.MaxItems and J.BASE.Aliased maps.
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: RPGManager } = await import('../../../../src/plugins/_base/managers/RPGManager.js'));
    globalThis.RPGManager = RPGManager;

    // patches globalThis.Game_Party.prototype directly, no vm involved.
    await import('../../../../src/plugins/_base/objects/Game_Party.js');
  });

  afterAll(() =>
  {
    RPGManager.clearCache();
    vi.unstubAllGlobals();
  });

  beforeEach(() =>
  {
    RPGManager.clearCache();
  });

  /**
   * Builds a Game_Party instance with instance-level stubs for the vanilla RMMZ methods
   * (itemContainer/discardMembersEquip/members/allItems) that Game_Party.js's overwritten
   * methods call- these live in rmmz_objects.js, not J-Base, so aren't part of this file.
   */
  function buildParty(overrides = {})
  {
    const party = new globalThis.Game_Party();
    party.itemContainer = overrides.itemContainer ?? (() => null);
    party.discardMembersEquip = overrides.discardMembersEquip ?? vi.fn();
    party.members = overrides.members ?? (() => []);
    party.allItems = overrides.allItems ?? (() => []);

    return party;
  }

  function buildItem(index)
  {
    return { name: `item-${index}`, _key: () => index };
  }

  describe('gainItem', () =>
  {
    it('does nothing when the item is falsy', () =>
    {
      // Arrange- unequipping in vanilla RMMZ can pass null for the item.
      const itemContainer = vi.fn();
      const party = buildParty({ itemContainer });

      // Act
      party.gainItem(null, 1, false);

      // Assert
      expect(itemContainer).not.toHaveBeenCalled();
    });

    it('routes to processItemGain when a container exists for the item', () =>
    {
      // Arrange
      const container = {};
      const party = buildParty({ itemContainer: () => container });
      const item = buildItem(1);

      // Act
      party.gainItem(item, 3, false);

      // Assert
      expect(container[1]).toBe(3);
    });

    it('routes to processContainerlessItemGain when no container exists for the item', () =>
    {
      // Arrange
      const party = buildParty({ itemContainer: () => null });
      const item = buildItem(1);
      const warnSpy = vi.spyOn(console, 'warn')
        .mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error')
        .mockImplementation(() => {});

      // Act
      party.gainItem(item, 3, false);

      // Assert
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining(item.name));
      expect(errorSpy).toHaveBeenCalledWith(item, 3, false);
      warnSpy.mockRestore();
      errorSpy.mockRestore();
    });
  });

  describe('processItemGain', () =>
  {
    it('adds the amount to the existing quantity and stores it under the item key', () =>
    {
      // Arrange
      const container = { 1: 2 };
      const party = buildParty({ itemContainer: () => container });
      const item = buildItem(1);

      // Act
      party.processItemGain(item, 3, false);

      // Assert
      expect(container[1]).toBe(5);
    });

    it('clamps the new quantity to the max for the item', () =>
    {
      // Arrange
      const container = { 1: 990 };
      const party = buildParty({ itemContainer: () => container });
      const item = buildItem(1);

      // Act
      party.processItemGain(item, 100, false);

      // Assert- default max is 999.
      expect(container[1]).toBe(999);
    });

    it('removes the key from the container once the quantity drops to zero', () =>
    {
      // Arrange
      const container = { 1: 2 };
      const party = buildParty({ itemContainer: () => container });
      const item = buildItem(1);

      // Act
      party.processItemGain(item, -2, false);

      // Assert
      expect(container[1]).toBeUndefined();
      expect(Object.hasOwn(container, 1)).toBe(false);
    });

    it('discards the member equip when includeEquip is true and the new count goes negative', () =>
    {
      // Arrange
      const container = { 1: 2 };
      const discardMembersEquip = vi.fn();
      const party = buildParty({ itemContainer: () => container, discardMembersEquip });
      const item = buildItem(1);

      // Act
      party.processItemGain(item, -5, true);

      // Assert- newNumber is 2 + (-5) = -3, so discard is called with the overdraw amount.
      expect(discardMembersEquip).toHaveBeenCalledWith(item, 3);
    });

    it('does not discard member equip when includeEquip is true but the new count stays non-negative', () =>
    {
      // Arrange
      const container = { 1: 5 };
      const discardMembersEquip = vi.fn();
      const party = buildParty({ itemContainer: () => container, discardMembersEquip });
      const item = buildItem(1);

      // Act
      party.processItemGain(item, -2, true);

      // Assert
      expect(discardMembersEquip).not.toHaveBeenCalled();
    });

    it('does not discard member equip when includeEquip is false even if the new count goes negative', () =>
    {
      // Arrange
      const container = { 1: 2 };
      const discardMembersEquip = vi.fn();
      const party = buildParty({ itemContainer: () => container, discardMembersEquip });
      const item = buildItem(1);

      // Act
      party.processItemGain(item, -5, false);

      // Assert
      expect(discardMembersEquip).not.toHaveBeenCalled();
    });

    it('requests a map refresh', () =>
    {
      // Arrange
      const container = { 1: 2 };
      const party = buildParty({ itemContainer: () => container });
      const item = buildItem(1);
      const refreshSpy = vi.spyOn(globalThis.$gameMap, 'requestRefresh');

      // Act
      party.processItemGain(item, 1, false);

      // Assert
      expect(refreshSpy).toHaveBeenCalled();
      refreshSpy.mockRestore();
    });
  });

  describe('numItems', () =>
  {
    it('returns the quantity stored in the container for the item', () =>
    {
      // Arrange
      const container = { 1: 4 };
      const party = buildParty({ itemContainer: () => container });
      const item = buildItem(1);

      // Act
      const result = party.numItems(item);

      // Assert
      expect(result).toBe(4);
    });

    it('returns 0 when the container exists but has no entry for the item', () =>
    {
      // Arrange
      const container = {};
      const party = buildParty({ itemContainer: () => container });
      const item = buildItem(1);

      // Act
      const result = party.numItems(item);

      // Assert
      expect(result).toBe(0);
    });

    it('returns 0 when there is no container for the item', () =>
    {
      // Arrange
      const party = buildParty({ itemContainer: () => null });
      const item = buildItem(1);

      // Act
      const result = party.numItems(item);

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('allItemsQuantified', () =>
  {
    it('repeats each distinct item once per unit of quantity held', () =>
    {
      // Arrange
      const container = { 1: 2, 2: 1 };
      const itemOne = buildItem(1);
      const itemTwo = buildItem(2);
      const party = buildParty({
        itemContainer: () => container,
        allItems: () => [ itemOne, itemTwo ],
      });

      // Act
      const result = party.allItemsQuantified();

      // Assert
      expect(result).toEqual([ itemOne, itemOne, itemTwo ]);
    });

    it('omits an item entirely when its quantity is zero', () =>
    {
      // Arrange
      const container = {};
      const itemOne = buildItem(1);
      const party = buildParty({
        itemContainer: () => container,
        allItems: () => [ itemOne ],
      });

      // Act
      const result = party.allItemsQuantified();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('recoverAllMembers', () =>
  {
    it('calls recoverAll on every party member', () =>
    {
      // Arrange
      const memberOne = { recoverAll: vi.fn() };
      const memberTwo = { recoverAll: vi.fn() };
      const party = buildParty({ members: () => [ memberOne, memberTwo ] });

      // Act
      party.recoverAllMembers();

      // Assert
      expect(memberOne.recoverAll).toHaveBeenCalled();
      expect(memberTwo.recoverAll).toHaveBeenCalled();
    });
  });

  describe('maxBattleMembers', () =>
  {
    it('returns 8', () =>
    {
      // Arrange
      const party = buildParty();

      // Act
      const result = party.maxBattleMembers();

      // Assert
      expect(result).toBe(8);
    });
  });

  describe('setLevel', () =>
  {
    it('sets every member to the requested level when it is within their max', () =>
    {
      // Arrange
      const member = { maxLevel: () => 99, setLevel: vi.fn() };
      const party = buildParty({ members: () => [ member ] });

      // Act
      party.setLevel(50);

      // Assert
      expect(member.setLevel).toHaveBeenCalledWith(50);
    });

    it('clamps the requested level down to a member\'s max level when it exceeds it', () =>
    {
      // Arrange
      const member = { maxLevel: () => 30, setLevel: vi.fn() };
      const party = buildParty({ members: () => [ member ] });

      // Act
      party.setLevel(99);

      // Assert
      expect(member.setLevel).toHaveBeenCalledWith(30);
    });

    it('clamps the requested level up to 1 when given a level below the minimum', () =>
    {
      // Arrange
      const member = { maxLevel: () => 99, setLevel: vi.fn() };
      const party = buildParty({ members: () => [ member ] });

      // Act
      party.setLevel(0);

      // Assert
      expect(member.setLevel).toHaveBeenCalledWith(1);
    });
  });
});
//endregion plugins/_base/_component/game-party-item-and-member-methods.test.js
