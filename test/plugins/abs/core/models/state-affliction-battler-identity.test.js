//region plugins/abs/core/models/state-affliction-battler-identity.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

/**
 * The cache identity every affliction sprite is filed under.
 *
 * Three sprites per state per battler share one uuid and differ only by their prefix, and the HUD
 * looks each of them up by the string this builds. Two battlers colliding on a key would have one
 * enemy's poison timer rendering over another's, and nothing about that failure reads as a cache
 * problem - it reads as the HUD being haunted.
 */
describe('StateAfflictionBattlerIdentity', () =>
{
  /** @type {typeof import('../../../../../src/plugins/abs/core/models/StateAfflictionBattlerIdentity.js').default} */
  let StateAfflictionBattlerIdentity;

  beforeAll(async () =>
  {
    vi.resetModules();

    // the J-Base sentinel the uuid field defaults to.
    if (Object.getOwnPropertyDescriptor(String, 'empty') === undefined)
    {
      Object.defineProperty(String, 'empty', { value: '' });
    }

    ({ default: StateAfflictionBattlerIdentity } = await import(
      '../../../../../src/plugins/abs/core/models/StateAfflictionBattlerIdentity.js'));
  });

  describe('fromBattler()', () =>
  {
    it('takes its identity from the battler\'s own uuid', () =>
    {
      // Arrange
      const battler = { getUuid: () => 'battler-uuid' };

      // Act
      const identity = StateAfflictionBattlerIdentity.fromBattler(battler);

      // Assert
      expect(identity.uuid)
        .toBe('battler-uuid');
    });

    it('starts empty before a battler has been read', () =>
    {
      // Arrange
      // Act
      const identity = new StateAfflictionBattlerIdentity();

      // Assert
      expect(identity.uuid)
        .toBe(String.empty);
    });
  });

  describe('the three cache keys', () =>
  {
    /**
     * Builds an identity for a named battler.
     * @param {string} uuid The battler's uuid.
     * @returns {StateAfflictionBattlerIdentity} The identity.
     */
    const identityFor = uuid => StateAfflictionBattlerIdentity.fromBattler({ getUuid: () => uuid });

    it('builds an icon key from the state and the battler', () =>
    {
      // Arrange
      const identity = identityFor('battler-uuid');

      // Act
      const key = identity.buildIconKey(4);

      // Assert
      expect(key)
        .toBe('affliction-icon-4-battler-uuid');
    });

    it('builds a timer key from the state and the battler', () =>
    {
      // Arrange
      const identity = identityFor('battler-uuid');

      // Act
      const key = identity.buildTimerKey(4);

      // Assert
      expect(key)
        .toBe('affliction-timer-4-battler-uuid');
    });

    it('builds a stack key from the state and the battler', () =>
    {
      // Arrange
      const identity = identityFor('battler-uuid');

      // Act
      const key = identity.buildStackKey(4);

      // Assert
      expect(key)
        .toBe('affliction-stack-4-battler-uuid');
    });

    it('keeps the three sprites of one affliction apart from each other', () =>
    {
      // Arrange: all three describe the same state on the same battler and are cached side by side.
      const identity = identityFor('battler-uuid');

      // Act
      const keys = [ identity.buildIconKey(4), identity.buildTimerKey(4), identity.buildStackKey(4) ];

      // Assert
      expect(new Set(keys).size)
        .toBe(3);
    });

    it('keeps two battlers carrying the same state apart from each other', () =>
    {
      // Arrange: this is the collision that matters - the same poison on two enemies at once.
      const first = identityFor('first-uuid');
      const second = identityFor('second-uuid');

      // Act
      // Assert
      expect(first.buildIconKey(4))
        .not.toBe(second.buildIconKey(4));
    });
  });
});
//endregion plugins/abs/core/models/state-affliction-battler-identity.test.js