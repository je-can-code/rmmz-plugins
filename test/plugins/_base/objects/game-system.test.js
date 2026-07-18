//region plugins/_base/objects/game-system.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('J-Base Game_System (direct src import)', () =>
{
  let originalInitialize;

  beforeAll(async () =>
  {
    globalThis.J = { BASE: { Aliased: { Game_System: new Map() } } };

    function Game_System()
    {
    }

    originalInitialize = vi.fn();
    Game_System.prototype.initialize = originalInitialize;

    globalThis.Game_System = Game_System;

    await import('../../../../src/plugins/_base/objects/Game_System.js');
  });

  function buildSystem()
  {
    return new globalThis.Game_System();
  }

  describe('initialize', () =>
  {
    it('calls the original aliased initialize and then initMembers', () =>
    {
      // Arrange
      const system = Object.create(globalThis.Game_System.prototype);
      const initMembersSpy = vi.spyOn(globalThis.Game_System.prototype, 'initMembers');

      // Act
      system.initialize();

      // Assert
      expect(originalInitialize).toHaveBeenCalled();
      expect(initMembersSpy).toHaveBeenCalled();
      initMembersSpy.mockRestore();
    });
  });

  describe('initMembers', () =>
  {
    it('is a no-op hook that does not throw', () =>
    {
      // Arrange
      const system = buildSystem();

      // Act & Assert
      expect(() => system.initMembers()).not.toThrow();
    });
  });

  describe('gainAllEverything', () =>
  {
    it('delegates to gainAllItems, gainAllWeapons, and gainAllArmors with the given count', () =>
    {
      // Arrange
      const system = buildSystem();
      system.gainAllItems = vi.fn();
      system.gainAllWeapons = vi.fn();
      system.gainAllArmors = vi.fn();

      // Act
      system.gainAllEverything(3);

      // Assert
      expect(system.gainAllItems).toHaveBeenCalledWith(3);
      expect(system.gainAllWeapons).toHaveBeenCalledWith(3);
      expect(system.gainAllArmors).toHaveBeenCalledWith(3);
    });

    it('defaults count to 1 when omitted', () =>
    {
      // Arrange
      const system = buildSystem();
      system.gainAllItems = vi.fn();
      system.gainAllWeapons = vi.fn();
      system.gainAllArmors = vi.fn();

      // Act
      system.gainAllEverything();

      // Assert
      expect(system.gainAllItems).toHaveBeenCalledWith(1);
    });
  });

  describe('gainAllItems', () =>
  {
    it('gains every gainable item from $dataItems into $gameParty', () =>
    {
      // Arrange
      const system = buildSystem();
      const gainableItem = { name: 'Potion' };
      const skippedItem = { name: '' };
      globalThis.$dataItems = [ gainableItem, skippedItem ];
      globalThis.$gameParty = { gainItem: vi.fn() };

      // Act
      system.gainAllItems(2);

      // Assert
      expect(globalThis.$gameParty.gainItem).toHaveBeenCalledWith(gainableItem, 2);
      expect(globalThis.$gameParty.gainItem).toHaveBeenCalledTimes(1);
    });
  });

  describe('gainAllWeapons', () =>
  {
    it('gains every gainable weapon from $dataWeapons into $gameParty', () =>
    {
      // Arrange
      const system = buildSystem();
      const gainableWeapon = { name: 'Sword' };
      globalThis.$dataWeapons = [ gainableWeapon ];
      globalThis.$gameParty = { gainItem: vi.fn() };

      // Act
      system.gainAllWeapons(1);

      // Assert
      expect(globalThis.$gameParty.gainItem).toHaveBeenCalledWith(gainableWeapon, 1);
    });
  });

  describe('gainAllArmors', () =>
  {
    it('gains every gainable armor from $dataArmors into $gameParty', () =>
    {
      // Arrange
      const system = buildSystem();
      const gainableArmor = { name: 'Shield' };
      globalThis.$dataArmors = [ gainableArmor ];
      globalThis.$gameParty = { gainItem: vi.fn() };

      // Act
      system.gainAllArmors(1);

      // Assert
      expect(globalThis.$gameParty.gainItem).toHaveBeenCalledWith(gainableArmor, 1);
    });
  });

  describe('canGainEntry', () =>
  {
    const system = () => buildSystem();

    it('returns false for undefined', () =>
    {
      expect(system().canGainEntry(undefined)).toBe(false);
    });

    it('returns false for null', () =>
    {
      expect(system().canGainEntry(null)).toBe(false);
    });

    it('returns false for an entry with an empty (or whitespace-only) name', () =>
    {
      expect(system().canGainEntry({ name: '   ' })).toBe(false);
    });

    it('returns false for an entry whose name starts with an underscore', () =>
    {
      expect(system().canGainEntry({ name: '_hidden' })).toBe(false);
    });

    it('returns false for an entry whose name starts with a double equals', () =>
    {
      expect(system().canGainEntry({ name: '==separator' })).toBe(false);
    });

    it('returns false for an entry whose name contains the empty-slot marker', () =>
    {
      expect(system().canGainEntry({ name: '-- empty --' })).toBe(false);
    });

    it('returns true for a normal, gainable entry', () =>
    {
      expect(system().canGainEntry({ name: 'Potion' })).toBe(true);
    });
  });
});
//endregion plugins/_base/objects/game-system.test.js
