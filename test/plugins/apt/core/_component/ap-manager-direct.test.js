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

    it('canGainAp gate prevents applying AP for dead actors', () =>
    {
      const actor = buildActor({ isDead: () => true });

      ApManager.gainAp(actor, 5, 'test');

      expect(actor.setAptitudeProgress).not.toHaveBeenCalled();
    });

    it('scales the award by actor.apr and skips entirely when the scaled amount is zero', () =>
    {
      const actor = buildActor({ apr: 0 });

      ApManager.gainAp(actor, 5, 'test');

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
});
//endregion plugins/apt/core/_component/ap-manager-direct.test.js
