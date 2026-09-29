//region plugins/class/ext/apt/windows/window-class-list.test.js
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { installClassAptRealm } from '../_component/fixtures/install-class-apt-realm.js';

/**
 * The class list's right edge, where J-Classes-Aptitude shows each class's progress.
 */
describe('Window_ClassList (J-Classes-Aptitude)', () =>
{
  /**
   * Builds a list for actor 1.
   * @returns {Window_ClassList} The built window.
   */
  const buildList = () =>
  {
    const window = new globalThis.Window_ClassList(new globalThis.Rectangle(0, 0, 400, 400));
    window.setActor(globalThis.$gameActors.actor(1));

    return window;
  };

  /**
   * Marks a skill as learned through aptitude, the way J-Aptitude records it.
   * @param {Game_Actor} actor The actor who learned it.
   * @param {number} skillId The skill learned.
   */
  const learn = (actor, skillId) =>
  {
    const aptitudeSkill = actor.createAptitudeSkill(skillId, true);
    actor.setAptitudeSkill(skillId, aptitudeSkill);
  };

  /**
   * Answers for whatever sits beneath this extension in the alias chain, standing in for another extension
   * that already had something to say, so "left as it was" is a value that could not have come from here.
   * @param {string} methodName The aliased method to stand in beneath.
   * @param {function(): *} answer What the chain beneath answers.
   * @returns {function(): void} Puts the real chain back.
   */
  const standInBeneath = (methodName, answer) =>
  {
    const aliased = globalThis.J.CLASS.EXT.APT.Aliased.Window_ClassList;
    const original = aliased.get(methodName);
    aliased.set(methodName, answer);

    return () => aliased.set(methodName, original);
  };

  beforeAll(async () =>
  {
    await installClassAptRealm();

    await import('../../../../../../src/plugins/class/ext/apt/windows/Window_ClassList.js');
  });

  beforeEach(() =>
  {
    // Brawler, which teaches two skills, and Hermit, which teaches none, are both unlocked.
    const actor = globalThis.$gameActors.actor(1);
    actor.initAptitudeMembers();
    actor.initClassMembers();
    actor.unlockClass(2);
    actor.unlockClass(4);
  });

  describe('classRightText()', () =>
  {
    it('shows learned over total for a class that teaches something', () =>
    {
      // Arrange
      learn(globalThis.$gameActors.actor(1), 1);
      const window = buildList();

      // Act
      const rightText = window.classRightText(globalThis.$dataClasses[2]);

      // Assert
      expect(rightText)
        .toBe('1/2');
    });

    it('leaves the row as it was for a class that teaches nothing', () =>
    {
      // Arrange
      const window = buildList();
      const restore = standInBeneath('classRightText', () => 'from beneath');

      // Act
      const rightText = window.classRightText(globalThis.$dataClasses[4]);
      restore();

      // Assert
      expect(rightText)
        .toBe('from beneath');
    });
  });

  describe('classRightColorIndex()', () =>
  {
    it('marks a mastered class in the green the ladder marks a learned skill DONE in', () =>
    {
      // Arrange
      const actor = globalThis.$gameActors.actor(1);
      learn(actor, 1);
      learn(actor, 2);
      const window = buildList();

      // Act
      const rightColorIndex = window.classRightColorIndex(globalThis.$dataClasses[2]);

      // Assert
      expect(rightColorIndex)
        .toBe(11);
    });

    it('leaves the color as it was for a class short of mastery', () =>
    {
      // Arrange- one of Brawler's two skills learned.
      learn(globalThis.$gameActors.actor(1), 1);
      const window = buildList();
      const restore = standInBeneath('classRightColorIndex', () => 5);

      // Act
      const rightColorIndex = window.classRightColorIndex(globalThis.$dataClasses[2]);
      restore();

      // Assert
      expect(rightColorIndex)
        .toBe(5);
    });
  });
});
//endregion plugins/class/ext/apt/windows/window-class-list.test.js