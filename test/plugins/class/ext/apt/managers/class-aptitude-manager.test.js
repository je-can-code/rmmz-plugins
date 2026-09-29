//region plugins/class/ext/apt/managers/class-aptitude-manager.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { installClassAptRealm, loadSkillSlotsNamespace } from '../_component/fixtures/install-class-apt-realm.js';

/**
 * What the class scene asks about a class's learnings, against real actors under J-Aptitude.
 */
describe('ClassAptitudeManager', () =>
{
  let ClassAptitudeManager;
  let skillSlotsNamespace;

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

  beforeAll(async () =>
  {
    await installClassAptRealm();
    skillSlotsNamespace = await loadSkillSlotsNamespace();

    ({ default: ClassAptitudeManager } = await import(
      '../../../../../../src/plugins/class/ext/apt/managers/ClassAptitudeManager.js'));
  });

  beforeEach(() =>
  {
    // every test starts with nothing learned and nothing unlocked.
    const actor = globalThis.$gameActors.actor(1);
    actor.initAptitudeMembers();
    actor.initClassMembers();
  });

  afterEach(() =>
  {
    // every test that installed J-SkillSlots takes it away again.
    delete globalThis.J.SKS;
  });

  it('refuses to be constructed, since everything it knows is static', () =>
  {
    // Arrange
    // Act
    const construct = () => new ClassAptitudeManager();

    // Assert
    expect(construct)
      .toThrow('This is a static class.');
  });

  describe('learnedCount()', () =>
  {
    it('counts only the teachables the actor has learned', () =>
    {
      // Arrange- one of Brawler's two skills learned, beside one that is not.
      const actor = globalThis.$gameActors.actor(1);
      learn(actor, 1);

      // Act
      const count = ClassAptitudeManager.learnedCount(actor, 2);

      // Assert
      expect(count)
        .toBe(1);
    });

    it('counts a skill learned from another class that teaches it too', () =>
    {
      // Arrange- Ponder is learned, which only Scholar teaches, so it counts for Scholar and not Brawler.
      const actor = globalThis.$gameActors.actor(1);
      learn(actor, 3);

      // Act
      const scholarCount = ClassAptitudeManager.learnedCount(actor, 3);
      const brawlerCount = ClassAptitudeManager.learnedCount(actor, 2);

      // Assert
      expect(scholarCount)
        .toBe(1);
      expect(brawlerCount)
        .toBe(0);
    });
  });

  describe('isMastered()', () =>
  {
    it('never masters a class that teaches nothing', () =>
    {
      // Arrange- Hermit teaches nothing, so "everything learned" would be vacuously true.
      const actor = globalThis.$gameActors.actor(1);

      // Act
      const isMastered = ClassAptitudeManager.isMastered(actor, 4);

      // Assert
      expect(isMastered)
        .toBe(false);
    });

    it('masters a class once every teachable is learned', () =>
    {
      // Arrange
      const actor = globalThis.$gameActors.actor(1);
      learn(actor, 1);
      learn(actor, 2);

      // Act
      const isMastered = ClassAptitudeManager.isMastered(actor, 2);

      // Assert
      expect(isMastered)
        .toBe(true);
    });

    it('does not master a class with a teachable still unlearned', () =>
    {
      // Arrange
      const actor = globalThis.$gameActors.actor(1);
      learn(actor, 1);

      // Act
      const isMastered = ClassAptitudeManager.isMastered(actor, 2);

      // Assert
      expect(isMastered)
        .toBe(false);
    });
  });

  describe('progressText()', () =>
  {
    it('shows nothing for a class the actor has yet to unlock, whatever they have learned', () =>
    {
      // Arrange- one of Brawler's two skills learned, which would read 1/2 were Brawler unlocked.
      const actor = globalThis.$gameActors.actor(1);
      learn(actor, 2);

      // Act
      const text = ClassAptitudeManager.progressText(actor, 2);

      // Assert
      expect(text)
        .toBe('');
    });

    it('shows nothing for a class that teaches nothing', () =>
    {
      // Arrange- Hermit is unlocked, so only its having nothing to teach can leave it blank.
      const actor = globalThis.$gameActors.actor(1);
      actor.unlockClass(4);

      // Act
      const text = ClassAptitudeManager.progressText(actor, 4);

      // Assert
      expect(text)
        .toBe('');
    });

    it('shows MASTERED once everything the class teaches is learned', () =>
    {
      // Arrange
      const actor = globalThis.$gameActors.actor(1);
      actor.unlockClass(2);
      learn(actor, 1);
      learn(actor, 2);

      // Act
      const text = ClassAptitudeManager.progressText(actor, 2);

      // Assert
      expect(text)
        .toBe('MASTERED');
    });

    it('shows learned over total while the class still has something to teach', () =>
    {
      // Arrange
      const actor = globalThis.$gameActors.actor(1);
      actor.unlockClass(2);
      learn(actor, 2);

      // Act
      const text = ClassAptitudeManager.progressText(actor, 2);

      // Assert
      expect(text)
        .toBe('1/2');
    });
  });

  describe('alwaysKnownSkillIds()', () =>
  {
    it('lists nothing without J-SkillSlots, whatever the class carries', () =>
    {
      // Arrange- Brawler carries two <unslottedSkills> tags, which mean nothing without J-SkillSlots.
      // Act
      const skillIds = ClassAptitudeManager.alwaysKnownSkillIds(2);

      // Assert
      expect(skillIds)
        .toEqual([]);
    });

    it('lists each skill the class keeps unslotted once, in database order, and only for that class', () =>
    {
      // Arrange- Brawler's two tags share Wide Swing, and list Ponder first; Scholar keeps Stomp.
      globalThis.J.SKS = skillSlotsNamespace;

      // Act
      const brawler = ClassAptitudeManager.alwaysKnownSkillIds(2);
      const scholar = ClassAptitudeManager.alwaysKnownSkillIds(3);
      const hermit = ClassAptitudeManager.alwaysKnownSkillIds(4);

      // Assert
      expect(brawler)
        .toEqual([ 1, 3 ]);
      expect(scholar)
        .toEqual([ 2 ]);
      expect(hermit)
        .toEqual([]);
    });
  });
});
//endregion plugins/class/ext/apt/managers/class-aptitude-manager.test.js