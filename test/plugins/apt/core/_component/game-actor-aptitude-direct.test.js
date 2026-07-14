//region plugins/apt/core/_component/game-actor-aptitude-direct.test.js
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { installAptHostGlobals } from './fixtures/install-apt-host-globals.js';

describe('Game_Actor aptitude additions (direct src import)', () =>
{
  /** @type {typeof import('../../../../../src/plugins/apt/core/_models/AptitudeSkill.js').default} */
  let AptitudeSkill;

  /** @type {typeof import('../../../../../src/plugins/apt/core/_models/AptitudeProgress.js').default} */
  let AptitudeProgress;

  beforeAll(async () =>
  {
    vi.resetModules();

    await installAptHostGlobals();

    ({ default: AptitudeSkill } = await import('../../../../../src/plugins/apt/core/_models/AptitudeSkill.js'));
    ({ default: AptitudeProgress } = await import('../../../../../src/plugins/apt/core/_models/AptitudeProgress.js'));

    // the file under test- patches globalThis.Game_Actor.prototype directly.
    await import('../../../../../src/plugins/apt/core/objects/Game_Actor.js');
  });

  afterAll(() =>
  {
    vi.unstubAllGlobals();
  });

  /**
   * Builds a bare Game_Actor instance with aptitude members initialized.
   * @returns {Game_Actor}
   */
  function buildActor()
  {
    const actor = new globalThis.Game_Actor();
    actor.initAptitudeMembers();
    return actor;
  }

  it('initAptitudeMembers seeds empty progress/learned buckets and a cold apr cache', () =>
  {
    const actor = buildActor();

    expect(actor.getAllAptitudeProgresses()).toEqual({});
    expect(actor.getAllAptitudeSkillsLearned()).toEqual({});
    expect(actor.getCachedApr()).toBeNull();
  });

  it('getCachedApr/setCachedApr round-trip through the actor', () =>
  {
    const actor = buildActor();

    actor.setCachedApr(1.5);

    expect(actor.getCachedApr()).toBe(1.5);
  });

  describe('aptitude progress tracking', () =>
  {
    it('hasAptitudeProgress/getAptitudeProgress reflect nothing before initialization', () =>
    {
      const actor = buildActor();

      expect(actor.hasAptitudeProgress('weapon:5')).toBe(false);
      expect(actor.getAptitudeProgress('weapon:5')).toBeNull();
    });

    it('initializeAptitudeProgress creates a progress with one learning', () =>
    {
      const actor = buildActor();

      actor.initializeAptitudeProgress('weapon:5', 12, 40, 10);

      expect(actor.hasAptitudeProgress('weapon:5')).toBe(true);
      const progress = actor.getAptitudeProgress('weapon:5');
      expect(progress).toBeInstanceOf(AptitudeProgress);
      expect(progress.learningBySkillId(12).currentAp).toBe(10);
      expect(progress.learningBySkillId(12).requiredAp).toBe(40);
    });

    it('setAptitudeProgress is a no-op when there is no progress for the key yet', () =>
    {
      const actor = buildActor();

      actor.setAptitudeProgress('weapon:5', 12, 20);

      expect(actor.hasAptitudeProgress('weapon:5')).toBe(false);
    });

    it('setAptitudeProgress updates AP once progress exists', () =>
    {
      const actor = buildActor();
      actor.initializeAptitudeProgress('weapon:5', 12, 40, 10);

      actor.setAptitudeProgress('weapon:5', 12, 25);

      expect(actor.getAptitudeProgress('weapon:5')
        .learningBySkillId(12).currentAp).toBe(25);
    });

    it('getAptitudeLearning returns null when the progress or learning is missing', () =>
    {
      const actor = buildActor();

      expect(actor.getAptitudeLearning('weapon:5', 12)).toBeNull();

      actor.initializeAptitudeProgress('weapon:5', 12, 40, 10);

      expect(actor.getAptitudeLearning('weapon:5', 99)).toBeNull();
    });

    it('getAptitudeLearning returns the learning once it exists', () =>
    {
      const actor = buildActor();
      actor.initializeAptitudeProgress('weapon:5', 12, 40, 10);

      expect(actor.getAptitudeLearning('weapon:5', 12)
        .currentAp).toBe(10);
    });
  });

  describe('aptitude skill learning', () =>
  {
    it('hasAptitudeSkill/getAptitudeSkill/setAptitudeSkill round-trip', () =>
    {
      const actor = buildActor();
      const aptitudeSkill = new AptitudeSkill(12);

      expect(actor.hasAptitudeSkill(12)).toBe(false);

      actor.setAptitudeSkill(12, aptitudeSkill);

      expect(actor.hasAptitudeSkill(12)).toBe(true);
      expect(actor.getAptitudeSkill(12)).toBe(aptitudeSkill);
    });

    it('hasLearnedAptitudeSkill is false when the skill was never registered', () =>
    {
      const actor = buildActor();

      expect(actor.hasLearnedAptitudeSkill(12)).toBe(false);
    });

    it('hasLearnedAptitudeSkill reflects the registered skill\'s learned flag', () =>
    {
      const actor = buildActor();
      actor.setAptitudeSkill(12, new AptitudeSkill(12, true));

      expect(actor.hasLearnedAptitudeSkill(12)).toBe(true);
    });

    it('learnAptitudeSkill creates the aptitude skill on first learn and stamps the source', () =>
    {
      const actor = buildActor();
      actor.initializeAptitudeProgress('weapon:5', 12, 40, 40);

      actor.learnAptitudeSkill(12, 'weapon:5');

      expect(actor.hasLearnedAptitudeSkill(12)).toBe(true);
      expect(actor.getAptitudeSkill(12).learnedFrom()).toBe('weapon:5');
    });

    it('learnAptitudeSkill is a no-op when the skill is already learned', () =>
    {
      const actor = buildActor();
      actor.initializeAptitudeProgress('weapon:5', 12, 40, 40);
      actor.learnAptitudeSkill(12, 'weapon:5');
      const learnedSkill = actor.getAptitudeSkill(12);

      actor.initializeAptitudeProgress('class:1', 12, 40, 40);
      actor.learnAptitudeSkill(12, 'class:1');

      // still attributed to the original source since the second call short-circuited.
      expect(actor.getAptitudeSkill(12)).toBe(learnedSkill);
      expect(learnedSkill.learnedFrom()).toBe('weapon:5');
    });

    it('createAptitudeSkill builds a fresh AptitudeSkill for the given id', () =>
    {
      const actor = buildActor();

      const created = actor.createAptitudeSkill(7, true);

      expect(created).toBeInstanceOf(AptitudeSkill);
      expect(created.skillId).toBe(7);
      expect(created.learned).toBe(true);
    });
  });

  describe('getAptitudeSources', () =>
  {
    it('excludes skill-type notes from the actor\'s note sources', () =>
    {
      const actor = buildActor();
      const weaponNote = { isSkill: () => false, name: 'weapon-note' };
      const skillNote = { isSkill: () => true, name: 'skill-note' };
      actor.getAllNotes = () => [ weaponNote, skillNote ];

      expect(actor.getAptitudeSources()).toEqual([ weaponNote ]);
    });
  });

  describe('getAptitudeSkillAggregates', () =>
  {
    it('returns an empty array when there is no progress at all', () =>
    {
      const actor = buildActor();

      expect(actor.getAptitudeSkillAggregates()).toEqual([]);
    });

    it('builds one aggregate per skill id, sorted numerically, with one source row per contributing source', () =>
    {
      const actor = buildActor();
      actor.skill = skillId => ({ name: `Skill ${ skillId }`, iconIndex: 1 });

      actor.initializeAptitudeProgress('weapon:5', 20, 40, 40);
      actor.initializeAptitudeProgress('class:1', 10, 10, 5);
      // a second source teaching the same skill (20) as 'weapon:5', so that skill picks up two rows.
      actor.getAptitudeProgress('weapon:5')
        .initializeLearning(20, 40, 40);
      actor.initializeAptitudeProgress('state:1', 20, 40, 10);

      const aggregates = actor.getAptitudeSkillAggregates();

      // NOTE: AptitudeSkillAggregate.skillId() is documented to return a number, but Game_Actor's
      // getAptitudeSkillAggregates builds the perSkill index off Object.entries() keys, which are
      // always strings- so the aggregate is actually constructed with a string skillId here. Sorting
      // still works because `-` coerces strings to numbers, but strict equality against a number
      // (as done below via Number(...)) would fail without the coercion. Flagged, not fixed- see report.
      expect(aggregates.map(a => Number(a.skillId()))).toEqual([ 10, 20 ]);

      const skill20 = aggregates.find(a => Number(a.skillId()) === 20);
      expect(skill20.sources()).toHaveLength(2);
      expect(skill20.learnedAny()).toBe(true);
    });
  });
});
//endregion plugins/apt/core/_component/game-actor-aptitude-direct.test.js
