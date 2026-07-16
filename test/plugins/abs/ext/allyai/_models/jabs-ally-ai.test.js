//region plugins/abs/ext/allyai/_models/jabs-ally-ai.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * JABS_AllyAI.js is a genuine ES `class` extending the bare-global `JABS_AI` (the shipped runtime
 * concatenates core/abs ahead of this ext pack, so it's a bare global here, not an import).
 * `JABS_Battler`, `RPGManager`, and `SerializableRegistry` are also bare globals this file reads,
 * stubbed directly per the unit-tier convention.
 */
describe('JABS_AllyAI (unit, JABS_AI/JABS_Battler/RPGManager stubbed)', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/allyai/_models/JABS_AllyAI.js').default} */
  let JABS_AllyAI;

  beforeAll(async () =>
  {
    vi.resetModules();

    function JABS_AI()
    {
    }
    JABS_AI.prototype.filterUncastableSkills = function(_user, skills)
    {
      return skills;
    };
    JABS_AI.prototype.shouldFollowWithCombo = function()
    {
      return false;
    };
    JABS_AI.prototype.followWithCombo = function()
    {
      return 0;
    };
    JABS_AI.prototype.decideCleansing = function()
    {
      return 0;
    };
    JABS_AI.prototype.decideHealing = function()
    {
      return 0;
    };
    JABS_AI.prototype.decideBuffing = function()
    {
      return 0;
    };
    JABS_AI.prototype.determineStrongestSkill = function()
    {
      return 0;
    };
    JABS_AI.prototype.filterMemoriesByEffectiveness = function(skills)
    {
      return skills;
    };
    JABS_AI.prototype.isSkillIdValid = function(skillId)
    {
      return !!skillId && !Array.isArray(skillId);
    };
    globalThis.JABS_AI = JABS_AI;

    globalThis.JABS_Battler = { closeDistance: 1.5, farDistance: 3.5 };
    globalThis.RPGManager = { chanceIn100: vi.fn(() => false) };
    globalThis.Math.randomInt = vi.fn(() => 0);
    globalThis.SerializableRegistry = { register: vi.fn() };

    ({ default: JABS_AllyAI } = await import('../../../../../../src/plugins/abs/ext/allyai/_models/JABS_AllyAI.js'));
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.chanceIn100.mockReset().mockReturnValue(false);
    globalThis.Math.randomInt.mockReset().mockReturnValue(0);
  });

  /**
   * Builds a fake battler test double with sane defaults.
   * @param {object} [overrides] Overrides.
   * @returns {object} A fake battler.
   */
  function buildBattler(overrides = {})
  {
    return {
      setWaitCountdown: vi.fn(),
      getAllNearbyAllies: () => [],
      getBattlerId: () => 1,
      ...overrides,
    };
  }

  describe('registration', () =>
  {
    it('registers itself with the serializable registry on load', () =>
    {
      expect(globalThis.SerializableRegistry.register).toHaveBeenCalledWith(JABS_AllyAI);
    });
  });

  describe('static presets', () =>
  {
    it('getPresets() returns all ten presets', () =>
    {
      expect(JABS_AllyAI.getPresets()).toHaveLength(10);
    });

    it('getPresetByKey() finds a preset by key', () =>
    {
      expect(JABS_AllyAI.getPresetByKey('medic').name).toEqual('Medic');
    });

    it('getPresetByKey() returns null for an unknown key', () =>
    {
      expect(JABS_AllyAI.getPresetByKey('unknown')).toBeNull();
    });

    it('validatePreset() is true for a known key', () =>
    {
      expect(JABS_AllyAI.validatePreset('wizard')).toEqual(true);
    });

    it('validatePreset() is false for an unknown key', () =>
    {
      expect(JABS_AllyAI.validatePreset('unknown')).toEqual(false);
    });
  });

  describe('constructor/initialize()/initMembers()', () =>
  {
    it('defaults to balanced axes and the generalist preset with no starting preset', () =>
    {
      const ai = new JABS_AllyAI();

      expect(ai.isDoNothing()).toEqual(false);
      expect(ai.getRisk()).toEqual(JABS_AllyAI.Risk.BALANCED);
      expect(ai.getSupport()).toEqual(JABS_AllyAI.Support.BALANCED);
      expect(ai.getSpacing()).toEqual(JABS_AllyAI.Spacing.MIDLINE);
      expect(ai.getPresetKey()).toEqual('generalist');
    });

    it('applies a starting preset when given', () =>
    {
      const ai = new JABS_AllyAI('medic');

      expect(ai.getPresetKey()).toEqual('medic');
      expect(ai.getRisk()).toEqual(JABS_AllyAI.Risk.CAREFUL);
    });
  });

  describe('isDoNothing()/setDoNothing()', () =>
  {
    it('toggles the do-nothing flag', () =>
    {
      const ai = new JABS_AllyAI();
      ai.setDoNothing(true);

      expect(ai.isDoNothing()).toEqual(true);
    });
  });

  describe('applyPreset()', () =>
  {
    it('updates all three axes and the preset key for a valid preset', () =>
    {
      const ai = new JABS_AllyAI();

      ai.applyPreset('berserker');

      expect(ai.getRisk()).toEqual(JABS_AllyAI.Risk.RECKLESS);
      expect(ai.getSupport()).toEqual(JABS_AllyAI.Support.OFFENSE);
      expect(ai.getSpacing()).toEqual(JABS_AllyAI.Spacing.FRONTLINE);
      expect(ai.getPresetKey()).toEqual('berserker');
    });

    it('logs an error and leaves axes untouched for an invalid preset', () =>
    {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const ai = new JABS_AllyAI();
      const riskBefore = ai.getRisk();

      ai.applyPreset('not-a-real-preset');

      expect(console.error).toHaveBeenCalled();
      expect(ai.getRisk()).toEqual(riskBefore);

      console.error.mockRestore();
    });
  });

  describe('spacing helpers', () =>
  {
    it('getCloseDistance() returns the do-nothing distance when active', () =>
    {
      const ai = new JABS_AllyAI();
      ai.setDoNothing(true);

      expect(ai.getCloseDistance()).toEqual(JABS_AllyAI.DoNothingCloseDistance);
    });

    it('getCloseDistance() returns the spacing-mapped distance otherwise', () =>
    {
      const ai = new JABS_AllyAI();
      ai.applyPreset('berserker'); // frontline

      expect(ai.getCloseDistance()).toEqual(1.0);
    });

    it('getFarDistance() returns the do-nothing distance when active', () =>
    {
      const ai = new JABS_AllyAI();
      ai.setDoNothing(true);

      expect(ai.getFarDistance()).toEqual(JABS_AllyAI.DoNothingFarDistance);
    });

    it('getFarDistance() returns the spacing-mapped distance otherwise', () =>
    {
      const ai = new JABS_AllyAI();
      ai.applyPreset('artillery'); // backline

      expect(ai.getFarDistance()).toEqual(7.0);
    });

    it('getLeashMultiplier() returns the do-nothing multiplier when active', () =>
    {
      const ai = new JABS_AllyAI();
      ai.setDoNothing(true);

      expect(ai.getLeashMultiplier()).toEqual(JABS_AllyAI.DoNothingLeashMultiplier);
    });

    it('getLeashMultiplier() returns the spacing-mapped multiplier otherwise', () =>
    {
      const ai = new JABS_AllyAI();
      ai.applyPreset('medic'); // backline

      expect(ai.getLeashMultiplier()).toEqual(0.6);
    });

    // _spacing can only ever be 0/1/2 through this class's own public API (applyPreset/initMembers
    // always assign a valid Spacing enum value), so these `?? fallback` branches are unreachable
    // through normal usage- but this class is JsonEx-serialized into actor save data, so a
    // corrupted or stale save could plausibly restore an out-of-range value directly onto the
    // instance property. Testing the defensive fallback itself, not a normal-usage path.
    it('getCloseDistance() falls back to the JABS_Battler default for an out-of-range spacing value', () =>
    {
      const ai = new JABS_AllyAI();
      ai._spacing = 99;

      expect(ai.getCloseDistance()).toEqual(1.5);
    });

    it('getFarDistance() falls back to the JABS_Battler default for an out-of-range spacing value', () =>
    {
      const ai = new JABS_AllyAI();
      ai._spacing = 99;

      expect(ai.getFarDistance()).toEqual(3.5);
    });

    it('getLeashMultiplier() falls back to a neutral 1.0 for an out-of-range spacing value', () =>
    {
      const ai = new JABS_AllyAI();
      ai._spacing = 99;

      expect(ai.getLeashMultiplier()).toEqual(1.0);
    });
  });

  describe('wrapSupportSkillId()', () =>
  {
    it('wraps a truthy skill id', () =>
    {
      const ai = new JABS_AllyAI();

      expect(ai.wrapSupportSkillId(5)).toEqual([ 5 ]);
    });

    it('returns empty for a falsy skill id', () =>
    {
      const ai = new JABS_AllyAI();

      expect(ai.wrapSupportSkillId(0)).toEqual([]);
    });
  });

  describe('decideAction()', () =>
  {
    it('does nothing and waits when do-nothing is active', () =>
    {
      const ai = new JABS_AllyAI();
      ai.setDoNothing(true);
      const user = buildBattler();

      expect(ai.decideAction(user, buildBattler(), [])).toEqual([]);
      expect(user.setWaitCountdown).toHaveBeenCalledWith(20);
    });

    it('follows a pending combo before any axis logic', () =>
    {
      const ai = new JABS_AllyAI();
      vi.spyOn(ai, 'shouldFollowWithCombo').mockReturnValue(true);
      vi.spyOn(ai, 'followWithCombo').mockReturnValue(42);

      expect(ai.decideAction(buildBattler(), buildBattler(), [])).toEqual([ 42 ]);
    });

    it('routes to decideSupportFirst for the SUPPORT axis', () =>
    {
      const ai = new JABS_AllyAI();
      ai.applyPreset('medic');
      const spy = vi.spyOn(ai, 'decideSupportFirst').mockReturnValue([ 1 ]);

      expect(ai.decideAction(buildBattler(), buildBattler(), [ 1 ])).toEqual([ 1 ]);
      expect(spy).toHaveBeenCalled();
    });

    it('routes to decideBalancedSupport for the BALANCED axis', () =>
    {
      const ai = new JABS_AllyAI();
      ai.applyPreset('generalist');
      const spy = vi.spyOn(ai, 'decideBalancedSupport').mockReturnValue([ 1 ]);

      expect(ai.decideAction(buildBattler(), buildBattler(), [ 1 ])).toEqual([ 1 ]);
      expect(spy).toHaveBeenCalled();
    });

    it('routes to decideOffense for the OFFENSE axis', () =>
    {
      const ai = new JABS_AllyAI();
      ai.applyPreset('berserker');
      const spy = vi.spyOn(ai, 'decideOffense').mockReturnValue([ 1 ]);

      expect(ai.decideAction(buildBattler(), buildBattler(), [ 1 ])).toEqual([ 1 ]);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('decideSupportFirst()', () =>
  {
    it('picks cleansing when available', () =>
    {
      const ai = new JABS_AllyAI();
      vi.spyOn(ai, 'decideCleansing').mockReturnValue(1);

      expect(ai.decideSupportFirst([ 1 ], buildBattler(), buildBattler())).toEqual([ 1 ]);
    });

    it('falls through to healing when no cleansing is needed', () =>
    {
      const ai = new JABS_AllyAI();
      vi.spyOn(ai, 'decideCleansing').mockReturnValue(0);
      vi.spyOn(ai, 'decideHealing').mockReturnValue(2);

      expect(ai.decideSupportFirst([ 1 ], buildBattler(), buildBattler())).toEqual([ 2 ]);
    });

    it('falls through to buffing when no cleansing or healing is needed', () =>
    {
      const ai = new JABS_AllyAI();
      vi.spyOn(ai, 'decideCleansing').mockReturnValue(0);
      vi.spyOn(ai, 'decideHealing').mockReturnValue(0);
      vi.spyOn(ai, 'decideBuffing').mockReturnValue(3);

      expect(ai.decideSupportFirst([ 1 ], buildBattler(), buildBattler())).toEqual([ 3 ]);
    });

    it('falls through to cautious offense when nothing needs support', () =>
    {
      const ai = new JABS_AllyAI();
      vi.spyOn(ai, 'decideCleansing').mockReturnValue(0);
      vi.spyOn(ai, 'decideHealing').mockReturnValue(0);
      vi.spyOn(ai, 'decideBuffing').mockReturnValue(0);
      const offenseSpy = vi.spyOn(ai, 'decideCautiousOffense').mockReturnValue([ 9 ]);

      expect(ai.decideSupportFirst([ 1 ], buildBattler(), buildBattler())).toEqual([ 9 ]);
      expect(offenseSpy).toHaveBeenCalled();
    });
  });

  describe('decideBalancedSupport()', () =>
  {
    it('goes straight to offense when no ally is in danger', () =>
    {
      const ai = new JABS_AllyAI();
      const user = buildBattler({ getAllNearbyAllies: () => [] });
      const offenseSpy = vi.spyOn(ai, 'decideOffense').mockReturnValue([ 9 ]);

      expect(ai.decideBalancedSupport([ 1 ], user, buildBattler())).toEqual([ 9 ]);
      expect(offenseSpy).toHaveBeenCalled();
    });

    it('goes straight to offense when in danger but the RNG roll fails', () =>
    {
      const ai = new JABS_AllyAI();
      const ally = { getBattler: () => ({ currentHpPercent: () => 0.1 }) };
      const user = buildBattler({ getAllNearbyAllies: () => [ ally ] });
      globalThis.RPGManager.chanceIn100.mockReturnValue(false);
      const offenseSpy = vi.spyOn(ai, 'decideOffense').mockReturnValue([ 9 ]);

      expect(ai.decideBalancedSupport([ 1 ], user, buildBattler())).toEqual([ 9 ]);
      expect(offenseSpy).toHaveBeenCalled();
    });

    it('supports when in danger and the RNG roll succeeds', () =>
    {
      const ai = new JABS_AllyAI();
      const ally = { getBattler: () => ({ currentHpPercent: () => 0.1 }) };
      const user = buildBattler({ getAllNearbyAllies: () => [ ally ] });
      globalThis.RPGManager.chanceIn100.mockReturnValue(true);
      vi.spyOn(ai, 'decideSupportFirst').mockReturnValue([ 5 ]);

      expect(ai.decideBalancedSupport([ 1 ], user, buildBattler())).toEqual([ 5 ]);
    });

    it('falls through to offense when the support roll succeeds but nothing is picked', () =>
    {
      const ai = new JABS_AllyAI();
      const ally = { getBattler: () => ({ currentHpPercent: () => 0.1 }) };
      const user = buildBattler({ getAllNearbyAllies: () => [ ally ] });
      globalThis.RPGManager.chanceIn100.mockReturnValue(true);
      vi.spyOn(ai, 'decideSupportFirst').mockReturnValue([]);
      const offenseSpy = vi.spyOn(ai, 'decideOffense').mockReturnValue([ 9 ]);

      expect(ai.decideBalancedSupport([ 1 ], user, buildBattler())).toEqual([ 9 ]);
      expect(offenseSpy).toHaveBeenCalled();
    });
  });

  describe('decideOffense()', () =>
  {
    it('returns empty when there are no usable skills', () =>
    {
      const ai = new JABS_AllyAI();

      expect(ai.decideOffense([], buildBattler(), buildBattler())).toEqual([]);
    });

    it('routes to reckless offense for the RECKLESS risk axis', () =>
    {
      const ai = new JABS_AllyAI();
      ai.applyPreset('berserker');
      const spy = vi.spyOn(ai, 'decideRecklessOffense').mockReturnValue([ 1 ]);

      expect(ai.decideOffense([ 1 ], buildBattler(), buildBattler())).toEqual([ 1 ]);
      expect(spy).toHaveBeenCalled();
    });

    it('routes to cautious offense for the CAREFUL risk axis', () =>
    {
      const ai = new JABS_AllyAI();
      ai.applyPreset('guardian');
      const spy = vi.spyOn(ai, 'decideCautiousOffense').mockReturnValue([ 1 ]);

      expect(ai.decideOffense([ 1 ], buildBattler(), buildBattler())).toEqual([ 1 ]);
      expect(spy).toHaveBeenCalled();
    });

    it('routes to balanced offense for the BALANCED risk axis', () =>
    {
      const ai = new JABS_AllyAI();
      ai.applyPreset('vanguard');
      const spy = vi.spyOn(ai, 'decideBalancedOffense').mockReturnValue([ 1 ]);

      expect(ai.decideOffense([ 1 ], buildBattler(), buildBattler())).toEqual([ 1 ]);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('decideRecklessOffense()', () =>
  {
    it('uses the strongest skill when there are no memories of the target', () =>
    {
      const ai = new JABS_AllyAI();
      vi.spyOn(ai, 'determineStrongestSkill').mockReturnValue(7);

      expect(ai.decideRecklessOffense([ 7 ], buildBattler(), buildBattler())).toEqual([ 7 ]);
    });

    it('returns empty when the strongest skill is invalid and there are no memories', () =>
    {
      const ai = new JABS_AllyAI();
      vi.spyOn(ai, 'determineStrongestSkill').mockReturnValue(0);

      expect(ai.decideRecklessOffense([], buildBattler(), buildBattler())).toEqual([]);
    });

    it('picks between the strongest and the sole effective memory 50/50 (RNG true -> strongest)', () =>
    {
      const ai = new JABS_AllyAI();
      ai.memory = [ { battlerId: 1, skillId: 2, wasEffective: () => true } ];
      vi.spyOn(ai, 'determineStrongestSkill').mockReturnValue(9);
      vi.spyOn(ai, 'filterMemoriesByEffectiveness').mockReturnValue([ 2 ]);
      globalThis.RPGManager.chanceIn100.mockReturnValue(true);

      expect(ai.decideRecklessOffense([ 2, 9 ], buildBattler(), buildBattler())).toEqual([ 9 ]);
    });

    it('picks between the strongest and the sole effective memory 50/50 (RNG false -> memory pick)', () =>
    {
      const ai = new JABS_AllyAI();
      ai.memory = [ { battlerId: 1, skillId: 2, wasEffective: () => true } ];
      vi.spyOn(ai, 'determineStrongestSkill').mockReturnValue(9);
      vi.spyOn(ai, 'filterMemoriesByEffectiveness').mockReturnValue([ 2 ]);
      globalThis.RPGManager.chanceIn100.mockReturnValue(false);

      expect(ai.decideRecklessOffense([ 2, 9 ], buildBattler(), buildBattler())).toEqual([ 2 ]);
    });

    it('does not offer a choice when the sole effective memory equals the strongest skill', () =>
    {
      const ai = new JABS_AllyAI();
      ai.memory = [ { battlerId: 1, skillId: 9, wasEffective: () => true } ];
      vi.spyOn(ai, 'determineStrongestSkill').mockReturnValue(9);
      vi.spyOn(ai, 'filterMemoriesByEffectiveness').mockReturnValue([ 9 ]);

      expect(ai.decideRecklessOffense([ 9 ], buildBattler(), buildBattler())).toEqual([ 9 ]);
    });

    it('picks randomly among multiple effective memories', () =>
    {
      const ai = new JABS_AllyAI();
      ai.memory = [ { battlerId: 1, skillId: 2, wasEffective: () => true } ];
      vi.spyOn(ai, 'determineStrongestSkill').mockReturnValue(9);
      vi.spyOn(ai, 'filterMemoriesByEffectiveness').mockReturnValue([ 2, 3 ]);
      globalThis.Math.randomInt.mockReturnValue(1);

      expect(ai.decideRecklessOffense([ 2, 3, 9 ], buildBattler(), buildBattler())).toEqual([ 3 ]);
    });

    it('returns empty when the single-effective-memory 50/50 pick resolves to an invalid skill id', () =>
    {
      const ai = new JABS_AllyAI();
      ai.memory = [ { battlerId: 1, skillId: 0, wasEffective: () => true } ];
      vi.spyOn(ai, 'determineStrongestSkill').mockReturnValue(9);
      vi.spyOn(ai, 'filterMemoriesByEffectiveness').mockReturnValue([ 0 ]);
      globalThis.RPGManager.chanceIn100.mockReturnValue(false);

      expect(ai.decideRecklessOffense([ 0, 9 ], buildBattler(), buildBattler())).toEqual([]);
    });

    it('returns empty when the multiple-effective-memories random pick resolves to an invalid skill id', () =>
    {
      const ai = new JABS_AllyAI();
      ai.memory = [ { battlerId: 1, skillId: 0, wasEffective: () => true } ];
      vi.spyOn(ai, 'determineStrongestSkill').mockReturnValue(9);
      vi.spyOn(ai, 'filterMemoriesByEffectiveness').mockReturnValue([ 0, 0 ]);
      globalThis.Math.randomInt.mockReturnValue(0);

      expect(ai.decideRecklessOffense([ 0, 9 ], buildBattler(), buildBattler())).toEqual([]);
    });
  });

  describe('decideBalancedOffense()', () =>
  {
    it('picks randomly among all usable skills when memories filter out everything', () =>
    {
      const ai = new JABS_AllyAI();
      ai.memory = [ { battlerId: 1, skillId: 99, wasEffective: () => true } ];
      vi.spyOn(ai, 'filterMemoriesByEffectiveness').mockReturnValue([]);
      globalThis.Math.randomInt.mockReturnValue(0);

      expect(ai.decideBalancedOffense([ 5, 6 ], buildBattler(), buildBattler())).toEqual([ 5 ]);
    });

    it('picks randomly among all usable skills when there are no memories at all', () =>
    {
      const ai = new JABS_AllyAI();
      globalThis.Math.randomInt.mockReturnValue(1);

      expect(ai.decideBalancedOffense([ 5, 6 ], buildBattler(), buildBattler())).toEqual([ 6 ]);
    });

    it('picks the sole filtered skill 50/50 against a random pick (RNG true)', () =>
    {
      const ai = new JABS_AllyAI();
      ai.memory = [ { battlerId: 1, skillId: 5, wasEffective: () => true } ];
      vi.spyOn(ai, 'filterMemoriesByEffectiveness').mockReturnValue([ 5 ]);
      globalThis.RPGManager.chanceIn100.mockReturnValue(true);

      expect(ai.decideBalancedOffense([ 5, 6 ], buildBattler(), buildBattler())).toEqual([ 5 ]);
    });

    it('picks a random usable skill 50/50 against the sole filtered skill (RNG false)', () =>
    {
      const ai = new JABS_AllyAI();
      ai.memory = [ { battlerId: 1, skillId: 5, wasEffective: () => true } ];
      vi.spyOn(ai, 'filterMemoriesByEffectiveness').mockReturnValue([ 5 ]);
      globalThis.RPGManager.chanceIn100.mockReturnValue(false);
      globalThis.Math.randomInt.mockReturnValue(1);

      expect(ai.decideBalancedOffense([ 5, 6 ], buildBattler(), buildBattler())).toEqual([ 6 ]);
    });

    it('picks randomly among multiple filtered skills', () =>
    {
      const ai = new JABS_AllyAI();
      ai.memory = [ { battlerId: 1, skillId: 5, wasEffective: () => true } ];
      vi.spyOn(ai, 'filterMemoriesByEffectiveness').mockReturnValue([ 5, 6 ]);
      globalThis.Math.randomInt.mockReturnValue(1);

      expect(ai.decideBalancedOffense([ 5, 6, 7 ], buildBattler(), buildBattler())).toEqual([ 6 ]);
    });

    it('returns empty when the chosen skill id is invalid', () =>
    {
      const ai = new JABS_AllyAI();
      globalThis.Math.randomInt.mockReturnValue(0);

      expect(ai.decideBalancedOffense([ 0 ], buildBattler(), buildBattler())).toEqual([]);
    });
  });

  describe('decideCautiousOffense()', () =>
  {
    it('returns empty when there are no usable skills', () =>
    {
      const ai = new JABS_AllyAI();

      expect(ai.decideCautiousOffense([], buildBattler(), buildBattler())).toEqual([]);
    });

    it('falls back to a random pick when there are no memories', () =>
    {
      const ai = new JABS_AllyAI();
      globalThis.Math.randomInt.mockReturnValue(1);

      expect(ai.decideCautiousOffense([ 5, 6 ], buildBattler(), buildBattler())).toEqual([ 6 ]);
    });

    it('falls back to a random pick when memories exist but filter out everything', () =>
    {
      const ai = new JABS_AllyAI();
      ai.memory = [ { battlerId: 1, skillId: 99, wasEffective: () => true } ];
      vi.spyOn(ai, 'filterMemoriesByEffectiveness').mockReturnValue([]);
      globalThis.Math.randomInt.mockReturnValue(0);

      expect(ai.decideCautiousOffense([ 5, 6 ], buildBattler(), buildBattler())).toEqual([ 5 ]);
    });

    it('picks randomly among the remembered-effective skills when present', () =>
    {
      const ai = new JABS_AllyAI();
      ai.memory = [ { battlerId: 1, skillId: 5, wasEffective: () => true } ];
      vi.spyOn(ai, 'filterMemoriesByEffectiveness').mockReturnValue([ 5 ]);
      globalThis.Math.randomInt.mockReturnValue(0);

      expect(ai.decideCautiousOffense([ 5, 6 ], buildBattler(), buildBattler())).toEqual([ 5 ]);
    });

    it('returns empty when the remembered-effective pick resolves to an invalid skill id', () =>
    {
      const ai = new JABS_AllyAI();
      ai.memory = [ { battlerId: 1, skillId: 0, wasEffective: () => true } ];
      vi.spyOn(ai, 'filterMemoriesByEffectiveness').mockReturnValue([ 0 ]);
      globalThis.Math.randomInt.mockReturnValue(0);

      expect(ai.decideCautiousOffense([ 0 ], buildBattler(), buildBattler())).toEqual([]);
    });

    it('returns empty when the random fallback pick resolves to an invalid skill id', () =>
    {
      const ai = new JABS_AllyAI();
      globalThis.Math.randomInt.mockReturnValue(0);

      expect(ai.decideCautiousOffense([ 0 ], buildBattler(), buildBattler())).toEqual([]);
    });
  });
});
//endregion plugins/abs/ext/allyai/_models/jabs-ally-ai.test.js
