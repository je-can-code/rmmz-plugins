//region plugins/apt/core/aptitude-learning-progress-skill-direct.test.js
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

describe('AptitudeLearning / AptitudeProgress / AptitudeSkill (direct src import)', () =>
{
  /** @type {typeof import('../../../../src/plugins/apt/core/_models/AptitudeLearning.js').default} */
  let AptitudeLearning;

  /** @type {typeof import('../../../../src/plugins/apt/core/_models/AptitudeProgress.js').default} */
  let AptitudeProgress;

  /** @type {typeof import('../../../../src/plugins/apt/core/_models/AptitudeSkill.js').default} */
  let AptitudeSkill;

  beforeAll(async () =>
  {
    // each of these models calls SerializableRegistry.register(...) as an import-time side effect
    // (so JsonEx restores keep prototype methods after a save load). Stub it before the dynamic
    // imports evaluate the modules, since a static import would be hoisted ahead of any setup.
    globalThis.SerializableRegistry = { register: vi.fn() };

    // AptitudeSkill.forgetSkill/constructor reference String.empty, a J-Base polyfill normally
    // installed by _base/_metadata/initialization.js. Define it directly here rather than pulling
    // in the whole of J-Base's boot sequence just for one sentinel constant.
    if (Object.getOwnPropertyDescriptor(String, 'empty') === undefined)
    {
      Object.defineProperty(String, 'empty', { value: '', writable: false });
    }

    ({ default: AptitudeLearning } = await import('../../../../src/plugins/apt/core/_models/AptitudeLearning.js'));
    ({ default: AptitudeProgress } = await import('../../../../src/plugins/apt/core/_models/AptitudeProgress.js'));
    ({ default: AptitudeSkill } = await import('../../../../src/plugins/apt/core/_models/AptitudeSkill.js'));
  });

  afterAll(() =>
  {
    delete globalThis.SerializableRegistry;
  });

  describe('AptitudeLearning', () =>
  {
    it('registers itself with SerializableRegistry on import', () =>
    {
      expect(globalThis.SerializableRegistry.register).toHaveBeenCalledWith(AptitudeLearning);
    });

    it('stores skillId/requiredAp/currentAp from the constructor', () =>
    {
      const learning = new AptitudeLearning(12, 40, 10);

      expect(learning.skillId).toBe(12);
      expect(learning.requiredAp).toBe(40);
      expect(learning.currentAp).toBe(10);
    });

    it('gainAp accumulates onto the current AP', () =>
    {
      const learning = new AptitudeLearning(1, 10, 3);

      learning.gainAp(4);

      expect(learning.currentAp).toBe(7);
    });

    it('setAp overwrites the current AP outright', () =>
    {
      const learning = new AptitudeLearning(1, 10, 3);

      learning.setAp(9);

      expect(learning.currentAp).toBe(9);
    });

    it('isLearned is true once currentAp reaches requiredAp, false below it', () =>
    {
      const learning = new AptitudeLearning(1, 10, 9);

      expect(learning.isLearned()).toBe(false);

      learning.gainAp(1);

      expect(learning.isLearned()).toBe(true);
    });

    it('isLearned is true when currentAp exceeds requiredAp', () =>
    {
      const learning = new AptitudeLearning(1, 10, 99);

      expect(learning.isLearned()).toBe(true);
    });
  });

  describe('AptitudeProgress', () =>
  {
    it('registers itself with SerializableRegistry on import', () =>
    {
      expect(globalThis.SerializableRegistry.register).toHaveBeenCalledWith(AptitudeProgress);
    });

    it('defaults to an empty learnings map when none is provided', () =>
    {
      const progress = new AptitudeProgress('weapon:5');

      expect(progress.key).toBe('weapon:5');
      expect(progress.learnings()).toEqual({});
    });

    it('learningBySkillId returns null when the skill has no learning yet', () =>
    {
      const progress = new AptitudeProgress('weapon:5');

      expect(progress.learningBySkillId(12)).toBeNull();
      expect(progress.hasLearning(12)).toBe(false);
    });

    it('initializeLearning creates a new AptitudeLearning under the skill id', () =>
    {
      const progress = new AptitudeProgress('weapon:5');

      progress.initializeLearning(12, 40, 5);

      expect(progress.hasLearning(12)).toBe(true);
      const learning = progress.learningBySkillId(12);
      expect(learning).toBeInstanceOf(AptitudeLearning);
      expect(learning.skillId).toBe(12);
      expect(learning.requiredAp).toBe(40);
      expect(learning.currentAp).toBe(5);
    });

    it('setLearning updates AP on an existing learning', () =>
    {
      const progress = new AptitudeProgress('weapon:5');
      progress.initializeLearning(12, 40, 5);

      progress.setLearning(12, 20);

      expect(progress.learningBySkillId(12).currentAp).toBe(20);
    });

    it('setLearning is a no-op when the learning does not exist yet', () =>
    {
      const progress = new AptitudeProgress('weapon:5');

      progress.setLearning(12, 20);

      expect(progress.hasLearning(12)).toBe(false);
    });
  });

  describe('AptitudeSkill', () =>
  {
    it('registers itself with SerializableRegistry on import', () =>
    {
      expect(globalThis.SerializableRegistry.register).toHaveBeenCalledWith(AptitudeSkill);
    });

    it('defaults to unlearned with no source when constructed with just a skillId', () =>
    {
      const skill = new AptitudeSkill(8);

      expect(skill.skillId).toBe(8);
      expect(skill.learned).toBe(false);
      expect(skill.learnedFrom()).toBe(String.empty);
    });

    it('learnSkill flags learned and records the source key', () =>
    {
      const skill = new AptitudeSkill(8);
      const progress = new AptitudeProgress('class:1');

      skill.learnSkill(progress);

      expect(skill.learned).toBe(true);
      expect(skill.learnedFrom()).toBe('class:1');
    });

    it('forgetSkill clears learned and the source key', () =>
    {
      const skill = new AptitudeSkill(8);
      const progress = new AptitudeProgress('class:1');
      skill.learnSkill(progress);

      skill.forgetSkill();

      expect(skill.learned).toBe(false);
      expect(skill.learnedFrom()).toBe(String.empty);
    });
  });
});
//endregion plugins/apt/core/aptitude-learning-progress-skill-direct.test.js
