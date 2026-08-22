//region plugins/apt/core/_component/ap-manager-direct.test.js
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

describe('ApManager (direct src import)', () =>
{
  /** @type {typeof import('../../../../../src/plugins/apt/core/managers/ApManager.js').default} */
  let ApManager;

  /** @type {typeof import('../../../../../src/plugins/apt/core/_models/AptitudeTeachable.js').default} */
  let AptitudeTeachable;

  beforeAll(async () =>
  {
    // the J namespace always exists in-game via J-Base; without J-Log in it, learns simply go
    // unannounced, which keeps these tests focused on the AP math rather than the dia log.
    globalThis.J = {};

    ({ default: AptitudeTeachable } = await import('../../../../../src/plugins/apt/core/_models/AptitudeTeachable.js'));
    ({ default: ApManager } = await import('../../../../../src/plugins/apt/core/managers/ApManager.js'));
  });

  afterEach(() =>
  {
    delete globalThis.$dataSkills;
    delete globalThis.$dataWeapons;
    delete globalThis.$dataArmors;
    delete globalThis.$dataStates;
    delete globalThis.$dataClasses;
    delete globalThis.$dataActors;
    delete globalThis.$dataItems;
  });

  describe('canGainAp', () =>
  {
    it('rejects dead actors', () =>
    {
      const actor = { isDead: () => true };

      expect(ApManager.canGainAp(actor, 5)).toBe(false);
    });

    it('rejects a zero amount', () =>
    {
      const actor = { isDead: () => false };

      expect(ApManager.canGainAp(actor, 0)).toBe(false);
    });

    it('allows a living actor gaining a nonzero amount', () =>
    {
      const actor = { isDead: () => false };

      expect(ApManager.canGainAp(actor, 1)).toBe(true);
    });
  });

  describe('deriveKey', () =>
  {
    it('joins implementationType() and id with a colon', () =>
    {
      const source = { implementationType: () => '@base:usable:skill', id: 17 };

      expect(ApManager.deriveKey(source)).toBe('@base:usable:skill:17');
    });
  });

  describe('parseKey', () =>
  {
    it('splits the type chain from the trailing numeric id', () =>
    {
      const parsed = ApManager.parseKey('@base:traited:equip:weapon:12');

      expect(parsed.types).toEqual([ '@base', 'traited', 'equip', 'weapon' ]);
      expect(parsed.id).toBe(12);
    });

    it('falls back to an empty type chain and NaN id when there is no colon', () =>
    {
      const parsed = ApManager.parseKey('bad');

      expect(parsed.types).toEqual([]);
      expect(Number.isNaN(parsed.id)).toBe(true);
    });

    it('refuses to read a bare number as an id, since a key without a type chain names nothing', () =>
    {
      // Arrange & Act- 'bad' already reads as NaN by accident of not being numeric; a bare '5'
      // is the case where dropping the segment-count guard would happily hand back id 5 attached
      // to no type at all, and every downstream table lookup would then be aimed by guesswork.
      const parsed = ApManager.parseKey('5');

      // Assert
      expect(parsed.types).toEqual([]);
      expect(Number.isNaN(parsed.id)).toBe(true);
    });
  });

  describe('resolveStaticSourceByKey', () =>
  {
    it('resolves a skill key against $dataSkills', () =>
    {
      globalThis.$dataSkills = [ null, { id: 1, name: 'Test' } ];

      expect(ApManager.resolveStaticSourceByKey('@base:usable:skill:1').name).toBe('Test');
    });

    it('resolves a weapon key against $dataWeapons', () =>
    {
      globalThis.$dataWeapons = [ null, { id: 1, name: 'Sword' } ];

      expect(ApManager.resolveStaticSourceByKey('@base:traited:equip:weapon:1').name).toBe('Sword');
    });

    it('resolves an armor key against $dataArmors', () =>
    {
      globalThis.$dataArmors = [ null, { id: 1, name: 'Shield' } ];

      expect(ApManager.resolveStaticSourceByKey('@base:traited:equip:armor:1').name).toBe('Shield');
    });

    it('resolves a state key against $dataStates', () =>
    {
      globalThis.$dataStates = [ null, { id: 1, name: 'Poison' } ];

      expect(ApManager.resolveStaticSourceByKey('@base:traited:state:1').name).toBe('Poison');
    });

    it('resolves a class key against $dataClasses', () =>
    {
      globalThis.$dataClasses = [ null, { id: 1, name: 'Warrior' } ];

      expect(ApManager.resolveStaticSourceByKey('@base:class:1').name).toBe('Warrior');
    });

    it('resolves an actor key against $dataActors', () =>
    {
      globalThis.$dataActors = [ null, { id: 1, name: 'Hero' } ];

      expect(ApManager.resolveStaticSourceByKey('@base:actor:1').name).toBe('Hero');
    });

    it('resolves an item key against $dataItems', () =>
    {
      globalThis.$dataItems = [ null, { id: 1, name: 'Potion' } ];

      expect(ApManager.resolveStaticSourceByKey('@base:usable:item:1').name).toBe('Potion');
    });

    it('returns null for an unrecognized terminal type', () =>
    {
      expect(ApManager.resolveStaticSourceByKey('@base:mystery:1')).toBe(null);
    });

    // a savefile keeps source keys by id, and a database row can be deleted between builds - so
    // every table lookup has to answer null rather than handing back a hole in the array. The
    // resync pass downstream reads that null as "nothing to resync against" and moves on.
    [
      [ 'skill', '$dataSkills', '@base:usable:skill:99' ],
      [ 'weapon', '$dataWeapons', '@base:traited:equip:weapon:99' ],
      [ 'armor', '$dataArmors', '@base:traited:equip:armor:99' ],
      [ 'state', '$dataStates', '@base:traited:state:99' ],
      [ 'class', '$dataClasses', '@base:class:99' ],
      [ 'actor', '$dataActors', '@base:actor:99' ],
      [ 'item', '$dataItems', '@base:usable:item:99' ],
    ].forEach(([ label, table, key ]) =>
    {
      it(`answers null for a ${label} key whose row is gone from the database`, () =>
      {
        // Arrange
        globalThis[table] = [ null ];

        // Act
        const resolved = ApManager.resolveStaticSourceByKey(key);

        // Assert
        expect(resolved).toBe(null);
      });
    });

    it('returns null for a key with no numeric id', () =>
    {
      expect(ApManager.resolveStaticSourceByKey('bad')).toBe(null);
    });

    it('returns null when the database array has no entry at that id', () =>
    {
      globalThis.$dataSkills = [ null ];

      expect(ApManager.resolveStaticSourceByKey('@base:usable:skill:99')).toBe(null);
    });
  });

  describe('resolveSourceByKey', () =>
  {
    it('returns null when given no actor', () =>
    {
      expect(ApManager.resolveSourceByKey(null, 'anything')).toBe(null);
    });

    it('returns null when no source matches the key', () =>
    {
      const actor = { getAptitudeSources: () => [] };

      expect(ApManager.resolveSourceByKey(actor, '@base:weapon:5')).toBe(null);
    });

    it('returns the matching non-skill source as-is', () =>
    {
      const weaponSource = {
        id: 5,
        implementationType: () => '@base:weapon',
        isSkill: () => false,
      };
      const actor = { getAptitudeSources: () => [ weaponSource ] };

      expect(ApManager.resolveSourceByKey(actor, '@base:weapon:5')).toBe(weaponSource);
    });

    it('resolves a matching skill source to the actor\'s live skill entry', () =>
    {
      const skillSource = {
        id: 9,
        implementationType: () => '@base:usable:skill',
        isSkill: () => true,
      };
      const liveSkill = { id: 9, name: 'Live' };
      const actor = {
        getAptitudeSources: () => [ skillSource ],
        skill: id => (id === 9 ? liveSkill : null),
      };

      expect(ApManager.resolveSourceByKey(actor, '@base:usable:skill:9')).toBe(liveSkill);
    });
  });

  describe('isSourceActive', () =>
  {
    it('returns false when given no actor', () =>
    {
      expect(ApManager.isSourceActive(null, 'x')).toBe(false);
    });

    it('returns true when a source with a matching key is active', () =>
    {
      const source = { id: 5, implementationType: () => '@base:weapon' };
      const actor = { getAptitudeSources: () => [ source ] };

      expect(ApManager.isSourceActive(actor, '@base:weapon:5')).toBe(true);
    });

    it('returns false when no active source matches the key', () =>
    {
      const actor = { getAptitudeSources: () => [] };

      expect(ApManager.isSourceActive(actor, '@base:weapon:5')).toBe(false);
    });
  });

  describe('resolveAllSourcesByKeys', () =>
  {
    it('maps each key through resolveSourceByKey, preserving order', () =>
    {
      const weaponSource = { id: 5, implementationType: () => '@base:weapon', isSkill: () => false };
      const actor = { getAptitudeSources: () => [ weaponSource ] };

      const resolved = ApManager.resolveAllSourcesByKeys(actor, [ '@base:weapon:5', 'missing:1' ]);

      expect(resolved).toEqual([ weaponSource, null ]);
    });

    it('coerces a non-array sourceKeys argument to an empty result', () =>
    {
      const actor = { getAptitudeSources: () => [] };

      expect(ApManager.resolveAllSourcesByKeys(actor, undefined)).toEqual([]);
    });
  });

  describe('activeTeachables', () =>
  {
    it('excludes sources with no teachables', () =>
    {
      const source = {
        id: 1,
        implementationType: () => '@base:weapon',
        isSkill: () => false,
        aptitudeTeachings: [],
      };
      const actor = { getAptitudeSources: () => [ source ] };

      expect(ApManager.activeTeachables(actor)).toEqual([]);
    });

    it('includes sources with at least one teachable, keyed by deriveKey', () =>
    {
      const teach = new AptitudeTeachable(10, 5);
      const source = {
        id: 1,
        implementationType: () => '@base:weapon',
        isSkill: () => false,
        aptitudeTeachings: [ teach ],
      };
      const actor = { getAptitudeSources: () => [ source ] };

      const result = ApManager.activeTeachables(actor);

      expect(result).toEqual([ { key: '@base:weapon:1', teachables: [ teach ] } ]);
    });

    it('resolves skill sources to the actor\'s live skill entry for teachables', () =>
    {
      const teach = new AptitudeTeachable(10, 5);
      const skillSource = { id: 9, implementationType: () => '@base:usable:skill', isSkill: () => true };
      const liveSkill = { aptitudeTeachings: [ teach ] };
      const actor = {
        getAptitudeSources: () => [ skillSource ],
        skill: () => liveSkill,
      };

      const result = ApManager.activeTeachables(actor);

      expect(result).toEqual([ { key: '@base:usable:skill:9', teachables: [ teach ] } ]);
    });

    it('deduplicates sources that resolve to the same key', () =>
    {
      const teach = new AptitudeTeachable(10, 5);
      const source = {
        id: 1,
        implementationType: () => '@base:weapon',
        isSkill: () => false,
        aptitudeTeachings: [ teach ],
      };
      const actor = { getAptitudeSources: () => [ source, source ] };

      expect(ApManager.activeTeachables(actor)).toHaveLength(1);
    });
  });

  describe('gainAp / applyApToSource', () =>
  {
    /**
     * Builds a minimal fake actor with the aptitude progress storage ApManager relies on.
     * @param {object} overrides Fields to override on the base actor.
     * @returns {object}
     */
    function buildActor(overrides = {})
    {
      const progresses = {};
      const learned = new Set();

      return {
        isDead: () => false,
        apr: 1,
        getAptitudeSources: () => [],
        hasLearnedAptitudeSkill: skillId => learned.has(skillId),
        hasAptitudeProgress: key => progresses[key] !== undefined,
        initializeAptitudeProgress: (key, skillId, requiredAp, currentAp) =>
        {
          progresses[key] = {
            hasLearning: () => false,
            initializeLearning: vi.fn(),
            learningBySkillId: () => ({ currentAp, isLearned: () => false, setRequiredAp: vi.fn() }),
          };
        },
        getAptitudeProgress: key => progresses[key],
        setAptitudeProgress: vi.fn(),
        learnAptitudeSkill: skillId => learned.add(skillId),
        isLearnedSkill: () => false,
        learnSkill: vi.fn(),
        ...overrides,
      };
    }

    /**
     * Builds a source teaching a single skill, so a gainAp scenario has something to actually
     * distribute into. Without one, `activeTeachables` answers empty and every "nothing happened"
     * assertion passes for reasons that have nothing to do with the gate under test.
     * @returns {object} A fake aptitude source carrying one teachable.
     */
    function buildTeachingSource()
    {
      return {
        id: 1,
        implementationType: () => '@base:weapon',
        isSkill: () => false,
        aptitudeTeachings: [ new AptitudeTeachable(10, 40) ],
      };
    }

    it('canGainAp gate prevents applying AP for dead actors', () =>
    {
      // Arrange- the actor is loaded with a source that would otherwise bank AP, so the only thing
      // left holding the award back is the death check itself. A nonzero amount likewise keeps the
      // scaled-to-zero early return from quietly doing this test's job.
      const actor = buildActor({
        isDead: () => true,
        getAptitudeSources: () => [ buildTeachingSource() ],
      });

      // Act
      ApManager.gainAp(actor, 5, 'test');

      // Assert
      expect(actor.setAptitudeProgress).not.toHaveBeenCalled();
    });

    it('awards AP through that same loaded source once the actor is alive', () =>
    {
      // Arrange- the proof that the fixture above is capable of banking AP at all; without it the
      // death test would read identically against a source that teaches nothing.
      const actor = buildActor({
        isDead: () => false,
        getAptitudeSources: () => [ buildTeachingSource() ],
      });

      // Act
      ApManager.gainAp(actor, 5, 'test');

      // Assert
      expect(actor.setAptitudeProgress).toHaveBeenCalledWith('@base:weapon:1', 10, 5);
    });

    it('scales the award by actor.apr and skips entirely when the scaled amount is zero', () =>
    {
      // Arrange- the actor carries the same source that banks AP in the test above, so the zero
      // multiplier is the only thing left that can hold the award back.
      const actor = buildActor({
        apr: 0,
        getAptitudeSources: () => [ buildTeachingSource() ],
      });

      // Act
      ApManager.gainAp(actor, 5, 'test');

      // Assert
      expect(actor.setAptitudeProgress).not.toHaveBeenCalled();
    });

    it('applies AP toward a teachable and learns the skill once the threshold is crossed', () =>
    {
      const teach = new AptitudeTeachable(10, 5);
      const source = {
        id: 1,
        implementationType: () => '@base:weapon',
        isSkill: () => false,
        aptitudeTeachings: [ teach ],
      };

      let currentAp = 0;
      const progress = {
        hasLearning: () => true,
        learningBySkillId: () => ({
          currentAp,
          isLearned: () => currentAp >= 5,
          setRequiredAp: vi.fn(),
        }),
      };

      const learnAptitudeSkill = vi.fn();
      const learnSkill = vi.fn();

      const actor = buildActor({
        getAptitudeSources: () => [ source ],
        hasAptitudeProgress: () => true,
        getAptitudeProgress: () => progress,
        setAptitudeProgress: (key, skillId, ap) =>
        {
          currentAp = ap;
        },
        learnAptitudeSkill,
        learnSkill,
      });

      ApManager.gainAp(actor, 5, 'on-kill');

      expect(currentAp).toBe(5);
      expect(learnAptitudeSkill).toHaveBeenCalledWith(10, '@base:weapon:1');
      expect(learnSkill).toHaveBeenCalledWith(10);
    });

    it('skips teachables that are already permanently learned', () =>
    {
      const teach = new AptitudeTeachable(10, 5);
      const source = {
        id: 1,
        implementationType: () => '@base:weapon',
        isSkill: () => false,
        aptitudeTeachings: [ teach ],
      };
      const actor = buildActor({
        getAptitudeSources: () => [ source ],
        hasLearnedAptitudeSkill: () => true,
      });

      ApManager.gainAp(actor, 5, 'test');

      expect(actor.setAptitudeProgress).not.toHaveBeenCalled();
    });

    it('opens a learning for every skill a source teaches, not just the one that made the progress', () =>
    {
      // Arrange- one source routinely teaches several skills, and the progress bag is created by
      // whichever teachable is reached first. Every later skill therefore arrives at a progress
      // that already exists but holds no learning of its own, and has to have one opened for it.
      const source = {
        id: 1,
        implementationType: () => '@base:weapon',
        isSkill: () => false,
        aptitudeTeachings: [ new AptitudeTeachable(10, 40), new AptitudeTeachable(11, 60) ],
      };

      // a progress that answers honestly about which learnings it holds, the way the real
      // AptitudeProgress does- a fixture that always claims to have one hides the whole branch.
      const learnings = {};
      const progress = {
        hasLearning: skillId => learnings[skillId] !== undefined,
        initializeLearning: (skillId, requiredAp, amount) =>
        {
          learnings[skillId] = {
            currentAp: amount,
            isLearned: () => false,
            setRequiredAp: vi.fn(),
          };
        },
        learningBySkillId: skillId => learnings[skillId] ?? null,
      };

      const setAptitudeProgress = vi.fn();
      const actor = buildActor({
        getAptitudeSources: () => [ source ],
        hasAptitudeProgress: () => true,
        getAptitudeProgress: () => progress,
        setAptitudeProgress,
      });

      // Act
      ApManager.gainAp(actor, 5, 'test');

      // Assert
      expect(setAptitudeProgress).toHaveBeenNthCalledWith(1, '@base:weapon:1', 10, 5);
      expect(setAptitudeProgress).toHaveBeenNthCalledWith(2, '@base:weapon:1', 11, 5);
    });

    it('does not re-learn the engine skill when it is already known', () =>
    {
      const teach = new AptitudeTeachable(10, 5);
      const source = {
        id: 1,
        implementationType: () => '@base:weapon',
        isSkill: () => false,
        aptitudeTeachings: [ teach ],
      };

      const progress = {
        hasLearning: () => true,
        learningBySkillId: () => ({ currentAp: 5, isLearned: () => true, setRequiredAp: vi.fn() }),
      };

      const learnSkill = vi.fn();
      const actor = buildActor({
        getAptitudeSources: () => [ source ],
        hasAptitudeProgress: () => true,
        getAptitudeProgress: () => progress,
        isLearnedSkill: () => true,
        learnSkill,
      });

      ApManager.gainAp(actor, 5, 'test');

      expect(learnSkill).not.toHaveBeenCalled();
    });
  });

  describe('gainAp scaling', () =>
  {
    it('awards nothing when a low multiplier rounds the whole award away', () =>
    {
      // Arrange- an actor with a heavy aptitude penalty can scale a small award below half a point.
      // Proceeding with zero would walk every active source and persist a no-op progress write on
      // every single kill.
      const activeTeachables = vi.spyOn(ApManager, 'activeTeachables')
        .mockReturnValue([]);
      const actor = {
        isDead: () => false,
        apr: 0.01,
        getAptitudeSources: () => [],
      };

      // Act
      ApManager.gainAp(actor, 5, 'test');

      // Assert
      expect(activeTeachables).not.toHaveBeenCalled();

      activeTeachables.mockRestore();
    });

    it('awards the raw amount for an actor sitting at the identity multiplier', () =>
    {
      // Arrange- an actor with no aptitude tags still reports an `apr` of 1 off the prototype getter,
      // which is the overwhelmingly common case; the award has to land at exactly its authored value.
      const source = {
        id: 1,
        implementationType: () => '@base:weapon',
        isSkill: () => false,
        aptitudeTeachings: [ new AptitudeTeachable(10, 40) ],
      };
      const setAptitudeProgress = vi.fn();
      const actor = {
        isDead: () => false,
        apr: 1,
        getAptitudeSources: () => [ source ],
        hasLearnedAptitudeSkill: () => false,
        hasAptitudeProgress: () => true,
        getAptitudeProgress: () => ({
          hasLearning: () => true,
          learningBySkillId: () => ({
            currentAp: 0,
            isLearned: () => false,
            setRequiredAp: vi.fn(),
          }),
        }),
        setAptitudeProgress,
      };

      // Act
      ApManager.gainAp(actor, 5, 'test');

      // Assert
      expect(setAptitudeProgress).toHaveBeenCalledWith('@base:weapon:1', 10, 5);
    });

    it('banks the scaled amount when the multiplier is anything other than the identity', () =>
    {
      // Arrange- a doubled multiplier lands somewhere the raw award never could, so the banked
      // value alone tells the scaled path apart from the pass-through one.
      const source = {
        id: 1,
        implementationType: () => '@base:weapon',
        isSkill: () => false,
        aptitudeTeachings: [ new AptitudeTeachable(10, 40) ],
      };
      const setAptitudeProgress = vi.fn();
      const actor = {
        isDead: () => false,
        apr: 2,
        getAptitudeSources: () => [ source ],
        hasLearnedAptitudeSkill: () => false,
        hasAptitudeProgress: () => true,
        getAptitudeProgress: () => ({
          hasLearning: () => true,
          learningBySkillId: () => ({
            currentAp: 0,
            isLearned: () => false,
            setRequiredAp: vi.fn(),
          }),
        }),
        setAptitudeProgress,
      };

      // Act
      ApManager.gainAp(actor, 5, 'test');

      // Assert
      expect(setAptitudeProgress).toHaveBeenCalledWith('@base:weapon:1', 10, 10);
    });
  });

  describe('isSourceActive over several sources', () =>
  {
    it('keeps scanning past a source whose key does not match', () =>
    {
      // Arrange- an actor carries a weapon, an armor and any number of states at once, so the
      // wanted key is routinely not the first one in the list.
      const wrongSource = { id: 1, implementationType: () => '@base:weapon' };
      const rightSource = { id: 5, implementationType: () => '@base:weapon' };
      const actor = { getAptitudeSources: () => [ wrongSource, rightSource ] };

      // Act
      const isActive = ApManager.isSourceActive(actor, '@base:weapon:5');

      // Assert
      expect(isActive).toBe(true);
    });

    it('answers false for an unequipped key while other sources are still active', () =>
    {
      // Arrange- the interesting question is asked about a source the actor no longer carries, and
      // an actor is never sourceless when it is asked. Near-miss neighbors that share the type
      // chain are what force the comparison to be about the whole key rather than merely having
      // found something to compare against.
      const weapon = { id: 1, implementationType: () => '@base:weapon' };
      const armor = { id: 5, implementationType: () => '@base:armor' };
      const actor = { getAptitudeSources: () => [ weapon, armor ] };

      // Act
      const isActive = ApManager.isSourceActive(actor, '@base:weapon:5');

      // Assert
      expect(isActive).toBe(false);
    });
  });

  describe('refreshRequiredAp', () =>
  {
    it('resyncs a persisted learning to the notetag\'s current requirement', () =>
    {
      // Arrange- normal AP gain only resyncs the next time that source grants AP, so a save that
      // started a learning before a retune would otherwise honor the stale number forever.
      const setRequiredAp = vi.fn();
      const progress = {
        hasLearning: () => true,
        learningBySkillId: () => ({ setRequiredAp }),
      };
      globalThis.$dataSkills = [ null, { id: 1, aptitudeTeachings: [ { skillId: 7, requiredAp: 250 } ] } ];
      const actor = { getAllAptitudeProgresses: () => ({ '@base:usable:skill:1': progress }) };

      // Act
      ApManager.refreshRequiredAp(actor);

      // Assert
      expect(setRequiredAp).toHaveBeenCalledWith(250);
    });

    it('skips a source whose database row no longer exists', () =>
    {
      // Arrange- the key outlives the row, and a deleted skill must not take the whole resync down.
      globalThis.$dataSkills = [ null ];
      const progress = {
        hasLearning: vi.fn(() => true),
        learningBySkillId: vi.fn(),
      };
      const actor = { getAllAptitudeProgresses: () => ({ '@base:usable:skill:99': progress }) };

      // Act
      ApManager.refreshRequiredAp(actor);

      // Assert
      expect(progress.hasLearning).not.toHaveBeenCalled();
    });

    it('skips a teachable the actor never started learning', () =>
    {
      // Arrange- a source teaches several skills and the actor may have begun only one of them;
      // there is nothing persisted to resync for the others.
      const learningBySkillId = vi.fn();
      const progress = {
        hasLearning: () => false,
        learningBySkillId,
      };
      globalThis.$dataSkills = [ null, { id: 1, aptitudeTeachings: [ { skillId: 7, requiredAp: 250 } ] } ];
      const actor = { getAllAptitudeProgresses: () => ({ '@base:usable:skill:1': progress }) };

      // Act
      ApManager.refreshRequiredAp(actor);

      // Assert
      expect(learningBySkillId).not.toHaveBeenCalled();
    });
  });
});
//endregion plugins/apt/core/_component/ap-manager-direct.test.js
