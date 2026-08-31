//region plugins/motion/ext/abs/core/death-motion-resolver.test.js
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { installDeathMetadata, installMotionAbsGlobals } from '../fixtures/install-motion-abs-globals.js';

describe('DeathMotionResolver', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/motion/ext/abs/core/DeathMotionResolver.js').default} */
  let DeathMotionResolver;

  beforeAll(async () =>
  {
    installMotionAbsGlobals();

    // a literal import path, so Stryker can map mutants in this file back to this test file.
    ({ default: DeathMotionResolver } =
      await import('../../../../../../src/plugins/motion/ext/abs/core/DeathMotionResolver.js'));
  });

  beforeEach(() =>
  {
    installDeathMetadata();
  });

  /**
   * Builds a state as the resolver will see it.
   * @param {number} id The state id.
   * @param {string} note Whatever is written in its note box.
   * @param {number} priority The editor's own state priority.
   * @returns {Object}
   */
  const aState = (id, note, priority) => ({ id, note, priority });

  /**
   * Builds a defeated battler carrying a set of states.
   *
   * The enemy always carries a distractor tag in its note, so a resolver that read the wrong field
   * or matched too loosely would be caught rather than accidentally right.
   * @param {string} enemyNote The enemy's own note.
   * @param {Object[]} states The states currently afflicting it.
   * @returns {Object}
   */
  const aBattler = (enemyNote, states = []) => ({
    databaseData: () => ({ note: `<enemyId:12>\n${enemyNote}` }),
    states: () => states,
  });

  describe('the default', () =>
  {
    it('gives an ordinary enemy the configured default death', () =>
    {
      // Arrange
      const battler = aBattler('');

      // Act
      const style = DeathMotionResolver.resolveStyleFor(battler);

      // Assert
      expect(style).toBe('swift');
    });

    it('follows the configuration when the default is something else', () =>
    {
      // Arrange
      installDeathMetadata({ defaultStyle: 'moderate' });
      const battler = aBattler('');

      // Act
      const style = DeathMotionResolver.resolveStyleFor(battler);

      // Assert
      expect(style).toBe('moderate');
    });
  });

  describe('the enemy note', () =>
  {
    it('outranks the configured default', () =>
    {
      // Arrange
      const battler = aBattler('<deathMotion:slow>');

      // Act
      const style = DeathMotionResolver.resolveStyleFor(battler);

      // Assert
      expect(style).toBe('slow');
    });

    it('is ignored when the enemy says nothing about dying', () =>
    {
      // Arrange
      const battler = aBattler('<sight:5>');

      // Act
      const style = DeathMotionResolver.resolveStyleFor(battler);

      // Assert
      expect(style).toBe('swift');
    });
  });

  describe('states', () =>
  {
    it('outrank the enemy note', () =>
    {
      // Arrange
      const affix = aState(301, '<deathMotion:slow>', 50);
      const battler = aBattler('<deathMotion:swift>', [ affix ]);

      // Act
      const style = DeathMotionResolver.resolveStyleFor(battler);

      // Assert
      expect(style).toBe('slow');
    });

    it('fall through to the enemy when none of them mentions dying', () =>
    {
      // Arrange
      const burn = aState(4, '<motion:[flicker]>', 50);
      const battler = aBattler('<deathMotion:moderate>', [ burn ]);

      // Act
      const style = DeathMotionResolver.resolveStyleFor(battler);

      // Assert
      expect(style).toBe('moderate');
    });

    it('hand the decision to whichever has the highest editor priority', () =>
    {
      // Arrange
      const burn = aState(4, '<deathMotion:swift>', 20);
      const champion = aState(301, '<deathMotion:slow>', 90);
      const battler = aBattler('', [ burn, champion ]);

      // Act
      const style = DeathMotionResolver.resolveStyleFor(battler);

      // Assert
      expect(style).toBe('slow');
    });

    it('reach the same answer no matter which order the engine returned them in', () =>
    {
      // Arrange
      const burn = aState(4, '<deathMotion:swift>', 20);
      const champion = aState(301, '<deathMotion:slow>', 90);
      const championFirst = aBattler('', [ champion, burn ]);
      const burnFirst = aBattler('', [ burn, champion ]);

      // Act
      const fromChampionFirst = DeathMotionResolver.resolveStyleFor(championFirst);
      const fromBurnFirst = DeathMotionResolver.resolveStyleFor(burnFirst);

      // Assert
      expect(fromChampionFirst).toBe('slow');
      expect(fromBurnFirst).toBe('slow');
    });

    it('keep the first of two equally important states rather than picking arbitrarily', () =>
    {
      // Arrange
      const first = aState(4, '<deathMotion:moderate>', 50);
      const second = aState(5, '<deathMotion:slow>', 50);
      const battler = aBattler('', [ first, second ]);

      // Act
      const style = DeathMotionResolver.resolveStyleFor(battler);

      // Assert
      expect(style).toBe('moderate');
    });

    it('let a lesser state decide when the important one has no opinion about dying', () =>
    {
      // Arrange- the champion outranks the burn but says nothing about death, which is the ordinary
      // case: most affixes care about combat rather than about how the corpse looks. Picking the
      // highest-priority state outright rather than the highest-priority state *that declares one*
      // would hand the decision to something with nothing to say, and the burn's style would be lost.
      const champion = aState(301, '<attackSpeed:20>', 90);
      const burn = aState(4, '<deathMotion:slow>', 20);
      const battler = aBattler('', [ champion, burn ]);

      // Act
      const style = DeathMotionResolver.resolveStyleFor(battler);

      // Assert
      expect(style).toBe('slow');
    });

    it('ignore a state with a lower priority than one already declaring', () =>
    {
      // Arrange
      const champion = aState(301, '<deathMotion:slow>', 90);
      const chill = aState(6, '<deathMotion:swift>', 10);
      const battler = aBattler('', [ champion, chill ]);

      // Act
      const style = DeathMotionResolver.resolveStyleFor(battler);

      // Assert
      expect(style).toBe('slow');
    });
  });

  describe('opting out', () =>
  {
    it('lets an enemy leave the map the instant it dies', () =>
    {
      // Arrange
      const battler = aBattler('<noDeathMotion>');

      // Act
      const style = DeathMotionResolver.resolveStyleFor(battler);

      // Assert
      expect(style).toBeNull();
    });

    it('lets a state suppress a death the enemy itself asked for', () =>
    {
      // Arrange
      const scripted = aState(400, '<noDeathMotion>', 50);
      const battler = aBattler('<deathMotion:slow>', [ scripted ]);

      // Act
      const style = DeathMotionResolver.resolveStyleFor(battler);

      // Assert
      expect(style).toBeNull();
    });

    it('outranks a state that was asking for a death animation', () =>
    {
      // Arrange
      const champion = aState(301, '<deathMotion:slow>', 90);
      const scripted = aState(400, '<noDeathMotion>', 10);
      const battler = aBattler('', [ champion, scripted ]);

      // Act
      const style = DeathMotionResolver.resolveStyleFor(battler);

      // Assert
      expect(style).toBeNull();
    });

    it('does not fire for an enemy that merely has states', () =>
    {
      // Arrange
      const burn = aState(4, '<motion:[flicker]>', 50);
      const battler = aBattler('', [ burn ]);

      // Act
      const optedOut = DeathMotionResolver.hasOptedOut(battler);

      // Assert
      expect(optedOut).toBe(false);
    });
  });
});
//endregion plugins/motion/ext/abs/core/death-motion-resolver.test.js