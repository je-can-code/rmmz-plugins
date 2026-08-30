//region plugins/motion/core/core/motion-target-resolver.test.js
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { installMotionHostGlobals } from '../../fixtures/install-motion-host-globals.js';

describe('MotionTargetResolver', () =>
{
  /** @type {typeof import('../../../../../src/plugins/motion/core/core/MotionTargetResolver.js').default} */
  let MotionTargetResolver;

  beforeAll(async () =>
  {
    installMotionHostGlobals();

    // a literal import path, so Stryker can map mutants in this file back to this test file.
    ({ default: MotionTargetResolver } =
      await import('../../../../../src/plugins/motion/core/core/MotionTargetResolver.js'));
  });

  afterEach(() =>
  {
    delete globalThis.$gamePlayer;
    delete globalThis.$gameMap;
  });

  /**
   * Installs a party and a map holding a handful of distinguishable characters.
   *
   * Several events exist rather than one, because a resolver that ignored its id entirely would
   * still satisfy a fixture holding a single event.
   * @returns {Object} The characters, so a test can assert which one came back.
   */
  const installWorld = () =>
  {
    const player = { name: 'player' };
    const followers = [ { name: 'follower-0' }, { name: 'follower-1' } ];
    const events = {
      3: { name: 'event-3' },
      7: { name: 'event-7' },
    };

    globalThis.$gamePlayer = {
      ...player,
      followers: () => ({ follower: index => followers[index] }),
    };
    globalThis.$gameMap = { event: eventId => events[eventId] };

    return { followers, events };
  };

  describe('the player', () =>
  {
    it('resolves to the player themselves, whatever id it was handed', () =>
    {
      // Arrange- a target id of 3 rather than 1, deliberately. The follower branch sitting directly
      // below this one would also hand back the player for an id of 1, so an id of 1 here cannot
      // tell the two branches apart.
      installWorld();

      // Act
      const resolved = MotionTargetResolver.resolve(MotionTargetResolver.PLAYER, 3, null);

      // Assert
      expect(resolved).toBe(globalThis.$gamePlayer);
    });
  });

  describe('a follower', () =>
  {
    it('treats party slot two as the first follower', () =>
    {
      // Arrange
      const { followers } = installWorld();

      // Act
      const resolved = MotionTargetResolver.resolve(MotionTargetResolver.FOLLOWER, 2, null);

      // Assert
      expect(resolved).toBe(followers[0]);
    });

    it('treats party slot three as the second follower', () =>
    {
      // Arrange
      const { followers } = installWorld();

      // Act
      const resolved = MotionTargetResolver.resolve(MotionTargetResolver.FOLLOWER, 3, null);

      // Assert
      expect(resolved).toBe(followers[1]);
    });

    it('treats party slot one as the player rather than a follower', () =>
    {
      // Arrange
      installWorld();

      // Act
      const resolved = MotionTargetResolver.characterForPartySlot(1);

      // Assert
      expect(resolved).toBe(globalThis.$gamePlayer);
    });

    it('treats a slot below one as the player too, rather than reaching past the party', () =>
    {
      // Arrange
      installWorld();

      // Act
      const resolved = MotionTargetResolver.characterForPartySlot(0);

      // Assert
      expect(resolved).toBe(globalThis.$gamePlayer);
    });
  });

  describe('an event', () =>
  {
    it('resolves the event with the given id', () =>
    {
      // Arrange
      const { events } = installWorld();

      // Act
      const resolved = MotionTargetResolver.resolve(MotionTargetResolver.EVENT, 7, null);

      // Assert
      expect(resolved).toBe(events[7]);
    });

    it('resolves the event running the command when asked for this event', () =>
    {
      // Arrange
      const { events } = installWorld();
      const interpreter = { eventId: () => 3 };

      // Act
      const resolved = MotionTargetResolver.resolve(MotionTargetResolver.THIS_EVENT, 99, interpreter);

      // Assert
      expect(resolved).toBe(events[3]);
    });
  });

  describe('an unrecognised target', () =>
  {
    it('resolves to nothing rather than guessing', () =>
    {
      // Arrange
      installWorld();

      // Act
      const resolved = MotionTargetResolver.resolve('Airship', 1, null);

      // Assert
      expect(resolved).toBeNull();
    });
  });
});
//endregion plugins/motion/core/core/motion-target-resolver.test.js