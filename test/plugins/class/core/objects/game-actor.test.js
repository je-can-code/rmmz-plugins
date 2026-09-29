//region plugins/class/core/objects/game-actor.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installClassCoreRealm } from '../_component/fixtures/install-class-core-realm.js';

/**
 * The unlocked classes each actor carries, on real actors under J-Base.
 */
describe('Game_Actor (J-Classes)', () =>
{
  beforeAll(async () =>
  {
    await installClassCoreRealm();
  });

  beforeEach(() =>
  {
    // every test starts with nothing unlocked.
    globalThis.$gameActors.actor(1)
      .initClassMembers();
  });

  describe('initMembers()', () =>
  {
    it('seeds an empty set of unlocked classes on every actor the game builds', () =>
    {
      // Arrange
      // Act- a fresh actor, built through the engine's own constructor and the aliased initMembers.
      const actor = new globalThis.Game_Actor(2);

      // Assert
      expect(actor.unlockedClassIds())
        .toEqual([]);
    });

    it('still runs the original initMembers, so the engine\'s own members exist', () =>
    {
      // Arrange
      // Act
      const actor = new globalThis.Game_Actor(2);

      // Assert- a class the engine assigned in setup proves the chain reached the original.
      expect(actor.currentClass().id)
        .toBe(5);
    });
  });

  describe('setUnlockedClassIds()', () =>
  {
    it('replaces the unlocked classes outright', () =>
    {
      // Arrange
      const actor = globalThis.$gameActors.actor(1);
      actor.unlockClass(4);

      // Act
      actor.setUnlockedClassIds([ 2, 3 ]);

      // Assert
      expect(actor.unlockedClassIds())
        .toEqual([ 2, 3 ]);
    });
  });

  describe('isClassUnlocked()', () =>
  {
    it('answers yes for a class that was unlocked', () =>
    {
      // Arrange
      const actor = globalThis.$gameActors.actor(1);
      actor.unlockClass(3);

      // Act
      const isUnlocked = actor.isClassUnlocked(3);

      // Assert
      expect(isUnlocked)
        .toBe(true);
    });

    it('answers no for a class that was not, even beside one that was', () =>
    {
      // Arrange
      const actor = globalThis.$gameActors.actor(1);
      actor.unlockClass(3);

      // Act
      const isUnlocked = actor.isClassUnlocked(2);

      // Assert
      expect(isUnlocked)
        .toBe(false);
    });
  });

  describe('unlockClass()', () =>
  {
    it('records a new class after the ones unlocked before it', () =>
    {
      // Arrange
      const actor = globalThis.$gameActors.actor(1);
      actor.unlockClass(3);

      // Act
      actor.unlockClass(2);

      // Assert
      expect(actor.unlockedClassIds())
        .toEqual([ 3, 2 ]);
    });

    it('changes nothing when the class was already unlocked, so an event can repeat it safely', () =>
    {
      // Arrange
      const actor = globalThis.$gameActors.actor(1);
      actor.unlockClass(3);
      actor.unlockClass(2);

      // Act
      actor.unlockClass(3);

      // Assert
      expect(actor.unlockedClassIds())
        .toEqual([ 3, 2 ]);
    });

    it('keeps each actor\'s unlocks to themselves', () =>
    {
      // Arrange
      const first = globalThis.$gameActors.actor(1);
      const second = globalThis.$gameActors.actor(2);
      second.initClassMembers();

      // Act
      first.unlockClass(3);

      // Assert
      expect(second.isClassUnlocked(3))
        .toBe(false);
    });

    it('unlocks a class set aside for this very actor', () =>
    {
      // Arrange- Pathfinder is set aside for actor 1.
      const actor = globalThis.$gameActors.actor(1);

      // Act
      actor.unlockClass(6);

      // Assert
      expect(actor.unlockedClassIds())
        .toEqual([ 6 ]);
    });

    it('refuses a class set aside for somebody else, and says so', () =>
    {
      // Arrange- Warden is set aside for actor 2, and actor 1 has never unlocked it, so only whose it is can
      // refuse it.
      const actor = globalThis.$gameActors.actor(1);
      actor.unlockClass(3);
      const warn = vi.spyOn(globalThis.Diagnostics, 'warn')
        .mockImplementation(() => {});

      // Act
      actor.unlockClass(7);

      // Assert
      expect(actor.unlockedClassIds())
        .toEqual([ 3 ]);
      expect(warn)
        .toHaveBeenCalledWith('J-Classes', 'class 7 is set aside for other actors, not actor 1.');

      warn.mockRestore();
    });
  });
});
//endregion plugins/class/core/objects/game-actor.test.js