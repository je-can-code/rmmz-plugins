//region plugins/abs/core/models/jabs-global-cooldown.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * JABS_GlobalCooldown.js imports JABS_Battler for JSDoc typing only (never referenced as a value
 * at runtime); mocked with an empty stub per the "unit tier mocks all downstream file-external
 * dependencies" convention. All J.ABS.Metadata/Globals reads are stubbed directly.
 */
describe('JABS_GlobalCooldown (unit, all downstream dependencies mocked)', () =>
{
  /** @type {typeof import('../../../../../src/plugins/abs/core/models/JABS_GlobalCooldown.js').default} */
  let JABS_GlobalCooldown;

  beforeAll(async () =>
  {
    vi.resetModules();
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_Battler.js', () => ({ default: class {} }));

    ({ default: JABS_GlobalCooldown } =
      await import('../../../../../src/plugins/abs/core/models/JABS_GlobalCooldown.js'));
  });

  beforeEach(() =>
  {
    globalThis.J = {
      ABS: {
        Metadata: {
          EnableGlobalCooldown: true,
          GlobalCooldownSkillTypeSet: new Set([ 1, 2 ]),
          GlobalCooldownFrames: 60,
        },
        Globals: { GlobalCooldownKey: 'gcd' },
      },
    };
    globalThis.$dataSkills = [];
  });

  describe('constructor', () =>
  {
    it('throws because this is a static-only class', () =>
    {
      expect(() => new JABS_GlobalCooldown()).toThrow();
    });
  });

  describe('isSystemEnabled()', () =>
  {
    it('returns true when the plugin parameter is enabled', () =>
    {
      expect(JABS_GlobalCooldown.isSystemEnabled()).toEqual(true);
    });

    it('returns false when the plugin parameter is disabled', () =>
    {
      globalThis.J.ABS.Metadata.EnableGlobalCooldown = false;

      expect(JABS_GlobalCooldown.isSystemEnabled()).toEqual(false);
    });
  });

  describe('skillIsSubjectToGlobalCooldown()', () =>
  {
    it('returns false when the system is disabled', () =>
    {
      globalThis.J.ABS.Metadata.EnableGlobalCooldown = false;

      expect(JABS_GlobalCooldown.skillIsSubjectToGlobalCooldown({ stypeId: 1 })).toEqual(false);
    });

    it('returns false when no skill is given', () =>
    {
      expect(JABS_GlobalCooldown.skillIsSubjectToGlobalCooldown(null)).toEqual(false);
    });

    it('returns false when the skill explicitly ignores the global cooldown', () =>
    {
      const skill = { stypeId: 1, jabsIgnoresGlobalCooldown: true };

      expect(JABS_GlobalCooldown.skillIsSubjectToGlobalCooldown(skill)).toEqual(false);
    });

    it('returns false when the skill type is not in the whitelist', () =>
    {
      const skill = { stypeId: 99 };

      expect(JABS_GlobalCooldown.skillIsSubjectToGlobalCooldown(skill)).toEqual(false);
    });

    it('returns true when the skill type is whitelisted and not exempt', () =>
    {
      const skill = { stypeId: 1 };

      expect(JABS_GlobalCooldown.skillIsSubjectToGlobalCooldown(skill)).toEqual(true);
    });
  });

  describe('framesForSkill()', () =>
  {
    it('returns the plugin default when no skill is given', () =>
    {
      expect(JABS_GlobalCooldown.framesForSkill(null)).toEqual(60);
    });

    it('returns the plugin default when the skill has no override', () =>
    {
      expect(JABS_GlobalCooldown.framesForSkill({})).toEqual(60);
    });

    it('returns the floored override when the skill has a valid positive override', () =>
    {
      const skill = { jabsGlobalCooldownOverride: 45.9 };

      expect(JABS_GlobalCooldown.framesForSkill(skill)).toEqual(45);
    });

    it('falls back to the plugin default when the override is not a finite positive number', () =>
    {
      const skill = { jabsGlobalCooldownOverride: -5 };

      expect(JABS_GlobalCooldown.framesForSkill(skill)).toEqual(60);
    });
  });

  describe('isGlobalBlockingSkillId()', () =>
  {
    it('returns false when the skill is not subject to the global cooldown', () =>
    {
      globalThis.$dataSkills[5] = { stypeId: 99 };
      const battler = { getCooldown: vi.fn() };

      expect(JABS_GlobalCooldown.isGlobalBlockingSkillId(battler, 5)).toEqual(false);
      expect(battler.getCooldown).not.toHaveBeenCalled();
    });

    it('returns false when the battler has no active global cooldown', () =>
    {
      globalThis.$dataSkills[5] = { stypeId: 1 };
      const battler = { getCooldown: vi.fn(() => null) };

      expect(JABS_GlobalCooldown.isGlobalBlockingSkillId(battler, 5)).toEqual(false);
    });

    it('returns false when the global cooldown is already base-ready', () =>
    {
      globalThis.$dataSkills[5] = { stypeId: 1 };
      const battler = { getCooldown: vi.fn(() => ({ isBaseReady: () => true })) };

      expect(JABS_GlobalCooldown.isGlobalBlockingSkillId(battler, 5)).toEqual(false);
    });

    it('returns true when the global cooldown is active and not yet ready', () =>
    {
      globalThis.$dataSkills[5] = { stypeId: 1 };
      const battler = { getCooldown: vi.fn(() => ({ isBaseReady: () => false })) };

      expect(JABS_GlobalCooldown.isGlobalBlockingSkillId(battler, 5)).toEqual(true);
    });
  });

  describe('jabsBattlerForActor()', () =>
  {
    it('returns null when no actor is given', () =>
    {
      expect(JABS_GlobalCooldown.jabsBattlerForActor(null)).toBeNull();
    });

    it('returns the player jabs battler when the actor is the party leader', () =>
    {
      const actor = {};
      const playerJabsBattler = {};
      globalThis.$gameParty = { leader: () => actor };
      globalThis.$gamePlayer = {
        getJabsBattler: () => playerJabsBattler,
        followers: () => ({ visibleFollowers: () => [] }),
      };

      expect(JABS_GlobalCooldown.jabsBattlerForActor(actor)).toEqual(playerJabsBattler);
    });

    it('returns the matching visible follower jabs battler when the actor is not the leader', () =>
    {
      const actor = {};
      const followerJabsBattler = {};
      const follower = { actor: () => actor, getJabsBattler: () => followerJabsBattler };
      globalThis.$gameParty = { leader: () => ({}) };
      globalThis.$gamePlayer = {
        getJabsBattler: () => null,
        followers: () => ({ visibleFollowers: () => [ follower ] }),
      };

      expect(JABS_GlobalCooldown.jabsBattlerForActor(actor)).toEqual(followerJabsBattler);
    });

    it('returns null when the actor is neither the leader nor a visible follower', () =>
    {
      const actor = {};
      globalThis.$gameParty = { leader: () => ({}) };
      globalThis.$gamePlayer = {
        getJabsBattler: () => null,
        followers: () => ({ visibleFollowers: () => [] }),
      };

      expect(JABS_GlobalCooldown.jabsBattlerForActor(actor)).toBeNull();
    });
  });

  describe('reducedFramesForCaster()', () =>
  {
    it('reduces the base frames by the caster CDR percentage', () =>
    {
      const jabsBattler = { getBattler: () => ({ cdr: 0.15 }) };

      expect(JABS_GlobalCooldown.reducedFramesForCaster(jabsBattler, 100)).toEqual(85);
    });

    it('clamps the result to a minimum of 0 frames when cdr reaches 100%', () =>
    {
      const jabsBattler = { getBattler: () => ({ cdr: 1 }) };

      expect(JABS_GlobalCooldown.reducedFramesForCaster(jabsBattler, 100)).toEqual(0);
    });

    it('lengthens the cooldown for negative cdr', () =>
    {
      const jabsBattler = { getBattler: () => ({ cdr: -0.5 }) };

      expect(JABS_GlobalCooldown.reducedFramesForCaster(jabsBattler, 10)).toEqual(15);
    });
  });
});
//endregion plugins/abs/core/models/jabs-global-cooldown.test.js
