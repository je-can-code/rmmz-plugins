//region plugins/class/ext/apt/objects/game-actor.test.js
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { installClassAptRealm } from '../_component/fixtures/install-class-apt-realm.js';

/**
 * The mastery question events ask by script, on real actors under J-Aptitude.
 */
describe('Game_Actor (J-Classes-Aptitude)', () =>
{
  beforeAll(async () =>
  {
    await installClassAptRealm();

    await import('../../../../../../src/plugins/class/ext/apt/objects/Game_Actor.js');
  });

  beforeEach(() =>
  {
    globalThis.$gameActors.actor(1)
      .initAptitudeMembers();
  });

  describe('isClassMastered()', () =>
  {
    it('answers yes once everything the class teaches is learned', () =>
    {
      // Arrange
      const actor = globalThis.$gameActors.actor(1);
      actor.setAptitudeSkill(3, actor.createAptitudeSkill(3, true));

      // Act
      const isMastered = actor.isClassMastered(3);

      // Assert
      expect(isMastered)
        .toBe(true);
    });

    it('answers no while something the class teaches is still unlearned', () =>
    {
      // Arrange- one of Brawler's two skills learned.
      const actor = globalThis.$gameActors.actor(1);
      actor.setAptitudeSkill(1, actor.createAptitudeSkill(1, true));

      // Act
      const isMastered = actor.isClassMastered(2);

      // Assert
      expect(isMastered)
        .toBe(false);
    });
  });
});
//endregion plugins/class/ext/apt/objects/game-actor.test.js