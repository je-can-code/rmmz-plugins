//region plugins/abs/core/models/jabs-enemy-ai.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * JABS_EnemyAI.js extends JABS_AI (its base class, providing the actual skill-scoring/filtering
 * logic) and imports JABS_AiManager for leader/follower coordination. Both are mocked per the
 * "unit tier mocks all downstream file-external dependencies" convention- JABS_AI's real
 * implementations are exercised by their own dedicated test file, not re-tested here. JABS_BattlerRole
 * and JABS_Battler are imported for JSDoc typing only (never referenced as values), so they get
 * trivial empty stubs.
 */
describe('JABS_EnemyAI (unit, all downstream dependencies mocked)', () =>
{
  /** @type {typeof import('../../../../../src/plugins/abs/core/models/JABS_EnemyAI.js').default} */
  let JABS_EnemyAI;
  let getLeaderFollowersMock;
  let getAlliedBattlersWithinRangeMock;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { Balloons: { Check: 3 } } };
    globalThis.RPGManager = { chanceIn100: vi.fn(() => false) };
    globalThis.Math.randomInt = vi.fn(() => 0);

    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_BattlerRole.js', () => ({ default: class {} }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_Battler.js', () => ({ default: class {} }));
    getLeaderFollowersMock = vi.fn(() => []);
    getAlliedBattlersWithinRangeMock = vi.fn(() => []);
    vi.doMock('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js', () => ({
      default: class
      {
        static getLeaderFollowers(leader)
        {
          return getLeaderFollowersMock(leader);
        }

        static getAlliedBattlersWithinRange(leader, range)
        {
          return getAlliedBattlersWithinRangeMock(leader, range);
        }
      },
    }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_AI.js', () => ({
      default: class
      {
        shouldFollowWithCombo()
        {
          return false;
        }

        followWithCombo()
        {
          return 0;
        }

        isSkillIdValid(skillId)
        {
          return !!skillId && !Array.isArray(skillId);
        }

        filterUncastableSkills(_user, skillsToUse)
        {
          return skillsToUse;
        }

        determineStrongestSkill()
        {
          return 0;
        }

        decideFromNoneToManySkills()
        {
          return 0;
        }

        filterElementallyIneffectiveSkills(skillsToUse)
        {
          return skillsToUse;
        }

        findMostElementallyEffectiveSkill(skillsToUse)
        {
          return skillsToUse;
        }

        decideCleansing()
        {
          return 0;
        }

        decideHealing()
        {
          return 0;
        }

        decideBuffing()
        {
          return 0;
        }
      },
    }));

    ({ default: JABS_EnemyAI } = await import('../../../../../src/plugins/abs/core/models/JABS_EnemyAI.js'));
  });

  beforeEach(() =>
  {
    getLeaderFollowersMock.mockReset().mockReturnValue([]);
    getAlliedBattlersWithinRangeMock.mockReset().mockReturnValue([]);
    globalThis.RPGManager.chanceIn100.mockReset().mockReturnValue(false);
    globalThis.Math.randomInt.mockReset().mockReturnValue(0);
  });

  /**
   * Builds a minimal fake {@link JABS_Battler} test double with sane defaults.
   * @param {object} [overrides] Overrides for the fake battler.
   * @returns {object} A fake battler.
   */
  function buildBattler(overrides = {})
  {
    return {
      getEnemyBasicAttack: () => 999,
      getTarget: () => ({}),
      getBattler: () => ({ currentHpPercent: () => 1 }),
      getSkill: () => ({ effects: [] }),
      getSkillIdsFromEnemy: () => [],
      getSightRadius: () => 5,
      hasLeader: () => false,
      getLeaderBattler: () => null,
      setLeader: vi.fn(),
      setLeaderDecidedAction: vi.fn(),
      getNextLeaderDecidedAction: () => 0,
      showBalloon: vi.fn(),
      getBattlerRole: () => ({ leader: false }),
      setAllyTarget: vi.fn(),
      ...overrides,
    };
  }

  describe('constructor', () =>
  {
    it('assigns every trait from constructor arguments', () =>
    {
      const ai = new JABS_EnemyAI(true, true, true, true, true, true, true, true);

      expect(ai.careful).toEqual(true);
      expect(ai.executor).toEqual(true);
      expect(ai.reckless).toEqual(true);
      expect(ai.healer).toEqual(true);
      expect(ai.cleanser).toEqual(true);
      expect(ai.buffer).toEqual(true);
      expect(ai.tactical).toEqual(true);
      expect(ai.berserker).toEqual(true);
    });

    it('defaults every trait to false', () =>
    {
      const ai = new JABS_EnemyAI();

      expect(ai.careful).toEqual(false);
      expect(ai.reckless).toEqual(false);
      expect(ai.berserker).toEqual(false);
    });
  });

  describe('decideAction()', () =>
  {
    it('warns when reckless has no usable skills', () =>
    {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      const ai = new JABS_EnemyAI(false, false, true);
      vi.spyOn(ai, 'filterUncastableSkills').mockReturnValue([]);

      ai.decideAction(buildBattler(), buildBattler(), []);

      expect(console.warn).toHaveBeenCalled();
      console.warn.mockRestore();
    });

    it('prioritizes the cleanser support layer when it picks something', () =>
    {
      const ai = new JABS_EnemyAI(false, false, false, false, true);
      vi.spyOn(ai, 'decideCleanserAction').mockReturnValue([ 5 ]);
      const genericSpy = vi.spyOn(ai, 'decideGenericAction');

      expect(ai.decideAction(buildBattler(), buildBattler(), [])).toEqual([ 5 ]);
      expect(genericSpy).not.toHaveBeenCalled();
    });

    it('falls through the cleanser layer when nothing is picked', () =>
    {
      const ai = new JABS_EnemyAI(false, false, false, false, true);
      vi.spyOn(ai, 'decideCleanserAction').mockReturnValue([]);
      const genericSpy = vi.spyOn(ai, 'decideGenericAction').mockReturnValue([ 1 ]);

      expect(ai.decideAction(buildBattler(), buildBattler(), [])).toEqual([ 1 ]);
      expect(genericSpy).toHaveBeenCalled();
    });

    it('never consults the cleanser layer without the cleanser trait', () =>
    {
      // Arrange- cleanser is OFF, but the helper is stubbed to return a skill it would gladly hand
      // back if it were ever asked. That is what makes this test discriminating: the sibling tests
      // all leave the helper returning [], so forcing the trait gate open changes nothing for them
      // and the gate itself goes unguarded.
      const ai = new JABS_EnemyAI(false, false, false, false, false);
      const cleanserSpy = vi.spyOn(ai, 'decideCleanserAction').mockReturnValue([ 5 ]);
      vi.spyOn(ai, 'decideGenericAction').mockReturnValue([ 1 ]);

      // Act
      const result = ai.decideAction(buildBattler(), buildBattler(), []);

      // Assert- the trait gate decides, not the helper's willingness to answer.
      expect(cleanserSpy).not.toHaveBeenCalled();
      expect(result).toEqual([ 1 ]);
    });

    it('prioritizes the healer support layer when it picks something', () =>
    {
      const ai = new JABS_EnemyAI(false, false, false, true);
      vi.spyOn(ai, 'decideHealerAction').mockReturnValue([ 6 ]);

      expect(ai.decideAction(buildBattler(), buildBattler(), [])).toEqual([ 6 ]);
    });

    it('falls through the healer layer when nothing is picked', () =>
    {
      const ai = new JABS_EnemyAI(false, false, false, true);
      vi.spyOn(ai, 'decideHealerAction').mockReturnValue([]);
      const genericSpy = vi.spyOn(ai, 'decideGenericAction').mockReturnValue([ 1 ]);

      expect(ai.decideAction(buildBattler(), buildBattler(), [])).toEqual([ 1 ]);
      expect(genericSpy).toHaveBeenCalled();
    });

    it('prioritizes the buffer support layer when it picks something', () =>
    {
      const ai = new JABS_EnemyAI(false, false, false, false, false, true);
      vi.spyOn(ai, 'decideBufferAction').mockReturnValue([ 7 ]);

      expect(ai.decideAction(buildBattler(), buildBattler(), [])).toEqual([ 7 ]);
    });

    it('falls through the buffer layer when nothing is picked', () =>
    {
      const ai = new JABS_EnemyAI(false, false, false, false, false, true);
      vi.spyOn(ai, 'decideBufferAction').mockReturnValue([]);
      const genericSpy = vi.spyOn(ai, 'decideGenericAction').mockReturnValue([ 1 ]);

      expect(ai.decideAction(buildBattler(), buildBattler(), [])).toEqual([ 1 ]);
      expect(genericSpy).toHaveBeenCalled();
    });

    it('uses the berserker layer once the hp threshold is met', () =>
    {
      const ai = new JABS_EnemyAI(false, false, false, false, false, false, false, true);
      const user = buildBattler({ getBattler: () => ({ currentHpPercent: () => 0.1 }) });
      vi.spyOn(ai, 'decideBerserkerAction').mockReturnValue([ 8 ]);

      expect(ai.decideAction(user, buildBattler(), [])).toEqual([ 8 ]);
    });

    it('does not use the berserker layer above the hp threshold', () =>
    {
      const ai = new JABS_EnemyAI(false, false, false, false, false, false, false, true);
      const user = buildBattler({ getBattler: () => ({ currentHpPercent: () => 0.9 }) });
      const berserkerSpy = vi.spyOn(ai, 'decideBerserkerAction');
      vi.spyOn(ai, 'decideGenericAction').mockReturnValue([ 1 ]);

      ai.decideAction(user, buildBattler(), []);

      expect(berserkerSpy).not.toHaveBeenCalled();
    });

    it('uses the attack layer when any attack trait is active', () =>
    {
      const ai = new JABS_EnemyAI(true);
      const attackSpy = vi.spyOn(ai, 'decideAttackAction').mockReturnValue([ 9 ]);

      expect(ai.decideAction(buildBattler(), buildBattler(), [])).toEqual([ 9 ]);
      expect(attackSpy).toHaveBeenCalled();
    });

    it('falls back to the generic layer when no traits are active', () =>
    {
      const ai = new JABS_EnemyAI();
      vi.spyOn(ai, 'decideGenericAction').mockReturnValue([ 1 ]);

      expect(ai.decideAction(buildBattler(), buildBattler(), [])).toEqual([ 1 ]);
    });

    it('never consults the healer layer without the healer trait', () =>
    {
      // Arrange- healer is OFF while its helper is stubbed to hand back a skill if ever asked. The
      // sibling healer tests all leave the helper returning [], so forcing the trait gate open would
      // change nothing for them; scripting a real return is what makes the gate observable.
      const ai = new JABS_EnemyAI(false, false, false, false);
      const healerSpy = vi.spyOn(ai, 'decideHealerAction').mockReturnValue([ 6 ]);
      vi.spyOn(ai, 'decideGenericAction').mockReturnValue([ 1 ]);

      // Act
      const result = ai.decideAction(buildBattler(), buildBattler(), []);

      // Assert- the trait gate decides, not the helper's willingness to answer.
      expect(healerSpy).not.toHaveBeenCalled();
      expect(result).toEqual([ 1 ]);
    });

    it('never consults the buffer layer without the buffer trait', () =>
    {
      // Arrange- buffer OFF, helper primed to answer; same observability trick as the healer case.
      const ai = new JABS_EnemyAI(false, false, false, false, false, false);
      const bufferSpy = vi.spyOn(ai, 'decideBufferAction').mockReturnValue([ 7 ]);
      vi.spyOn(ai, 'decideGenericAction').mockReturnValue([ 1 ]);

      // Act
      const result = ai.decideAction(buildBattler(), buildBattler(), []);

      // Assert
      expect(bufferSpy).not.toHaveBeenCalled();
      expect(result).toEqual([ 1 ]);
    });

    it('does not warn when a reckless battler has usable skills', () =>
    {
      // Arrange- reckless is on, but a usable skill exists, so the "no skills" warning must stay
      // silent. This is the negative half of the warn branch; without it the guard could be forced
      // permanently open and nothing would notice.
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const ai = new JABS_EnemyAI(false, false, true);
      vi.spyOn(ai, 'decideAttackAction').mockReturnValue([ 9 ]);

      // Act
      ai.decideAction(buildBattler(), buildBattler(), [ 1 ]);

      // Assert
      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe('wrapSupportSkillId()', () =>
  {
    it('wraps a truthy skill id into an array', () =>
    {
      const ai = new JABS_EnemyAI();

      expect(ai.wrapSupportSkillId(5)).toEqual([ 5 ]);
    });

    it('returns an empty array for a falsy skill id', () =>
    {
      const ai = new JABS_EnemyAI();

      expect(ai.wrapSupportSkillId(0)).toEqual([]);
    });
  });

  describe.each([
    [ 'decideCleanserAction', 'decideCleansing' ],
    [ 'decideHealerAction', 'decideHealing' ],
    [ 'decideBufferAction', 'decideBuffing' ],
  ])('%s()', (method, baseMethod) =>
  {
    it('follows the combo when the user should combo', () =>
    {
      const ai = new JABS_EnemyAI();
      vi.spyOn(ai, 'shouldFollowWithCombo').mockReturnValue(true);
      vi.spyOn(ai, 'followWithCombo').mockReturnValue(42);

      expect(ai[method](buildBattler(), [ 1 ])).toEqual([ 42 ]);
    });

    it('returns empty when there are no usable skills', () =>
    {
      const ai = new JABS_EnemyAI();

      expect(ai[method](buildBattler(), [])).toEqual([]);
    });

    it('does not consult the base-class support method when there are no usable skills', () =>
    {
      // Arrange- the sibling test above also passes an empty list, but leaves the base method
      // unstubbed at its default 0, which wrapSupportSkillId turns into [] anyway. That makes the
      // empty-skills guard invisible: removing it produces the same []. Scripting a truthy id here
      // is what separates "guard returned early" from "guard skipped and the helper found nothing".
      const ai = new JABS_EnemyAI();
      const baseSpy = vi.spyOn(ai, baseMethod).mockReturnValue(11);

      // Act
      const result = ai[method](buildBattler(), []);

      // Assert
      expect(baseSpy).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('delegates to the base-class support method and wraps the result', () =>
    {
      const ai = new JABS_EnemyAI();
      vi.spyOn(ai, baseMethod).mockReturnValue(11);

      expect(ai[method](buildBattler(), [ 1 ])).toEqual([ 11 ]);
    });
  });

  describe('decideHealerAction() threshold', () =>
  {
    it('uses a wider healing threshold when reckless', () =>
    {
      const ai = new JABS_EnemyAI(false, false, true, true);
      const healingSpy = vi.spyOn(ai, 'decideHealing').mockReturnValue(0);

      ai.decideHealerAction(buildBattler(), [ 1 ]);

      expect(healingSpy).toHaveBeenCalledWith(expect.anything(), [ 1 ], 0.9);
    });

    it('uses the standard healing threshold when not reckless', () =>
    {
      const ai = new JABS_EnemyAI(false, false, false, true);
      const healingSpy = vi.spyOn(ai, 'decideHealing').mockReturnValue(0);

      ai.decideHealerAction(buildBattler(), [ 1 ]);

      expect(healingSpy).toHaveBeenCalledWith(expect.anything(), [ 1 ], 0.6);
    });
  });

  describe('decideBerserkerAction()', () =>
  {
    it('follows the combo when the user should combo', () =>
    {
      const ai = new JABS_EnemyAI();
      vi.spyOn(ai, 'shouldFollowWithCombo').mockReturnValue(true);
      vi.spyOn(ai, 'followWithCombo').mockReturnValue(42);

      expect(ai.decideBerserkerAction(buildBattler(), [ 1 ], buildBattler())).toEqual([ 42 ]);
    });

    it('falls back to the basic attack when there are no usable skills', () =>
    {
      const ai = new JABS_EnemyAI();
      const user = buildBattler({ getEnemyBasicAttack: () => 77 });

      expect(ai.decideBerserkerAction(user, [], buildBattler())).toEqual([ 77 ]);
    });

    it('uses the strongest available skill when one is found', () =>
    {
      const ai = new JABS_EnemyAI();
      vi.spyOn(ai, 'determineStrongestSkill').mockReturnValue(13);

      expect(ai.decideBerserkerAction(buildBattler(), [ 1, 2 ], buildBattler())).toEqual([ 13 ]);
    });

    it('falls back to the basic attack when no strongest skill is found', () =>
    {
      const ai = new JABS_EnemyAI();
      vi.spyOn(ai, 'determineStrongestSkill').mockReturnValue(0);
      const user = buildBattler({ getEnemyBasicAttack: () => 77 });

      expect(ai.decideBerserkerAction(user, [ 1, 2 ], buildBattler())).toEqual([ 77 ]);
    });

    it('does not search for a strongest skill when there are no usable skills', () =>
    {
      // Arrange- the empty-skills test above leaves determineStrongestSkill at its default 0, which
      // also falls through to the basic attack. Both paths therefore return [77] and the guard is
      // unobservable. Scripting a real strongest skill makes skipping the guard produce [13] instead.
      const ai = new JABS_EnemyAI();
      const strongestSpy = vi.spyOn(ai, 'determineStrongestSkill').mockReturnValue(13);
      const user = buildBattler({ getEnemyBasicAttack: () => 77 });

      // Act
      const result = ai.decideBerserkerAction(user, [], buildBattler());

      // Assert
      expect(strongestSpy).not.toHaveBeenCalled();
      expect(result).toEqual([ 77 ]);
    });
  });

  describe('isBerserkerThresholdMet()', () =>
  {
    it('is met at or below 30% hp', () =>
    {
      const ai = new JABS_EnemyAI();
      const user = buildBattler({ getBattler: () => ({ currentHpPercent: () => 0.3 }) });

      expect(ai.isBerserkerThresholdMet(user)).toEqual(true);
    });

    it('is not met above 30% hp', () =>
    {
      const ai = new JABS_EnemyAI();
      const user = buildBattler({ getBattler: () => ({ currentHpPercent: () => 0.31 }) });

      expect(ai.isBerserkerThresholdMet(user)).toEqual(false);
    });
  });

  describe('decideAttackAction()', () =>
  {
    it('follows the combo when the user should combo', () =>
    {
      const ai = new JABS_EnemyAI();
      vi.spyOn(ai, 'shouldFollowWithCombo').mockReturnValue(true);
      vi.spyOn(ai, 'followWithCombo').mockReturnValue(42);

      expect(ai.decideAttackAction(buildBattler(), [ 1 ])).toEqual([ 42 ]);
    });

    it('falls back to the basic attack when there are no usable skills', () =>
    {
      const ai = new JABS_EnemyAI();

      expect(ai.decideAttackAction(buildBattler(), [])).toEqual([ 999 ]);
    });

    it('applies the careful filter when active', () =>
    {
      const ai = new JABS_EnemyAI(true);
      const filterSpy = vi.spyOn(ai, 'filterElementallyIneffectiveSkills').mockReturnValue([ 1 ]);
      vi.spyOn(ai, 'decideFromNoneToManySkills').mockReturnValue(1);

      ai.decideAttackAction(buildBattler(), [ 1, 2 ]);

      expect(filterSpy).toHaveBeenCalled();
    });

    it('applies the executor filter when active', () =>
    {
      const ai = new JABS_EnemyAI(false, true);
      const filterSpy = vi.spyOn(ai, 'findMostElementallyEffectiveSkill').mockReturnValue([ 1 ]);
      vi.spyOn(ai, 'decideFromNoneToManySkills').mockReturnValue(1);

      ai.decideAttackAction(buildBattler(), [ 1, 2 ]);

      expect(filterSpy).toHaveBeenCalled();
    });

    it('applies the tactical filter when active', () =>
    {
      const ai = new JABS_EnemyAI(false, false, false, false, false, false, true);
      const filterSpy = vi.spyOn(ai, 'filterForTacticalSkills').mockReturnValue([ 1 ]);
      vi.spyOn(ai, 'decideFromNoneToManySkills').mockReturnValue(1);

      ai.decideAttackAction(buildBattler(), [ 1, 2 ]);

      expect(filterSpy).toHaveBeenCalled();
    });

    it('returns whatever decideFromNoneToManySkills picks', () =>
    {
      const ai = new JABS_EnemyAI();
      vi.spyOn(ai, 'decideFromNoneToManySkills').mockReturnValue(5);

      expect(ai.decideAttackAction(buildBattler(), [ 1, 2 ])).toEqual([ 5 ]);
    });

    it('skips the careful filter when the trait is inactive', () =>
    {
      // Arrange- careful OFF. The base-class filter is a pass-through by default, so merely leaving
      // it unstubbed would make "called" and "not called" indistinguishable; spying is what pins the
      // gate itself rather than the filter's effect.
      const ai = new JABS_EnemyAI(false);
      const filterSpy = vi.spyOn(ai, 'filterElementallyIneffectiveSkills');
      vi.spyOn(ai, 'decideFromNoneToManySkills').mockReturnValue(1);

      // Act
      ai.decideAttackAction(buildBattler(), [ 1, 2 ]);

      // Assert
      expect(filterSpy).not.toHaveBeenCalled();
    });

    it('skips the executor filter when the trait is inactive', () =>
    {
      // Arrange- executor OFF, same pass-through reasoning as the careful case above.
      const ai = new JABS_EnemyAI(false, false);
      const filterSpy = vi.spyOn(ai, 'findMostElementallyEffectiveSkill');
      vi.spyOn(ai, 'decideFromNoneToManySkills').mockReturnValue(1);

      // Act
      ai.decideAttackAction(buildBattler(), [ 1, 2 ]);

      // Assert
      expect(filterSpy).not.toHaveBeenCalled();
    });

    it('skips the tactical filter when the trait is inactive', () =>
    {
      // Arrange- tactical OFF, same pass-through reasoning as the careful case above.
      const ai = new JABS_EnemyAI(false, false, false, false, false, false, false);
      const filterSpy = vi.spyOn(ai, 'filterForTacticalSkills');
      vi.spyOn(ai, 'decideFromNoneToManySkills').mockReturnValue(1);

      // Act
      ai.decideAttackAction(buildBattler(), [ 1, 2 ]);

      // Assert
      expect(filterSpy).not.toHaveBeenCalled();
    });
  });

  describe('filterForTacticalSkills()', () =>
  {
    it('returns the list unfiltered when it has one or fewer entries', () =>
    {
      const ai = new JABS_EnemyAI();

      expect(ai.filterForTacticalSkills([ 1 ], buildBattler(), null)).toEqual([ 1 ]);
    });

    it('filters down to only status-applying skills when any are present', () =>
    {
      const ai = new JABS_EnemyAI();
      const user = buildBattler({
        getSkill: (id) => (id === 1
          ? { effects: [ { code: 21 } ] }
          : { effects: [] }),
      });

      expect(ai.filterForTacticalSkills([ 1, 2 ], user, null)).toEqual([ 1 ]);
    });

    it('falls back to the unfiltered list when no status-applying skill is present', () =>
    {
      const ai = new JABS_EnemyAI();
      const user = buildBattler({ getSkill: () => ({ effects: [] }) });

      expect(ai.filterForTacticalSkills([ 1, 2 ], user, null)).toEqual([ 1, 2 ]);
    });

    it('does not inspect skill data at all when there is nothing to choose between', () =>
    {
      // Arrange- with a single skill the filter is a no-op either way: filtering it produces the
      // same one-element list whether or not it applies a state. The early return is therefore a
      // pure optimisation, skipping a per-skill getSkill lookup, and the ONLY way to observe it is
      // to assert that lookup never happens. Asserting the returned list can never catch it.
      const ai = new JABS_EnemyAI();
      const getSkill = vi.fn(() => ({ effects: [ { code: 21 } ] }));
      const user = buildBattler({ getSkill });

      // Act
      const result = ai.filterForTacticalSkills([ 1 ], user, null);

      // Assert
      expect(getSkill).not.toHaveBeenCalled();
      expect(result).toEqual([ 1 ]);
    });
  });

  describe('decideGenericAction()', () =>
  {
    it('follows the combo when the user should combo', () =>
    {
      const ai = new JABS_EnemyAI();
      vi.spyOn(ai, 'shouldFollowWithCombo').mockReturnValue(true);
      vi.spyOn(ai, 'followWithCombo').mockReturnValue(42);

      expect(ai.decideGenericAction(buildBattler(), [ 1 ])).toEqual([ 42 ]);
    });

    it('falls back to the basic attack when there are no usable skills', () =>
    {
      const ai = new JABS_EnemyAI();
      const user = buildBattler({ getEnemyBasicAttack: () => 77 });

      expect(ai.decideGenericAction(user, [])).toEqual([ 77 ]);
    });

    it('uses the basic attack on the 50% RNG roll', () =>
    {
      const ai = new JABS_EnemyAI();
      globalThis.RPGManager.chanceIn100.mockReturnValue(true);
      const user = buildBattler({ getEnemyBasicAttack: () => 77 });

      expect(ai.decideGenericAction(user, [ 1, 2 ])).toEqual([ 77 ]);
    });

    it('uses a random usable skill otherwise', () =>
    {
      const ai = new JABS_EnemyAI();
      globalThis.RPGManager.chanceIn100.mockReturnValue(false);
      globalThis.Math.randomInt.mockReturnValue(1);

      expect(ai.decideGenericAction(buildBattler(), [ 10, 20 ])).toEqual([ 20 ]);
    });
  });

  describe('decideActionsForFollowers()/decideFollowerAction()/canDecideActionForFollower()', () =>
  {
    it('decides an action for every nearby follower', () =>
    {
      const ai = new JABS_EnemyAI();
      const leader = buildBattler();
      const follower = buildBattler();
      getLeaderFollowersMock.mockReturnValue([ follower ]);
      const decideSpy = vi.spyOn(ai, 'decideFollowerAction').mockImplementation(() => {});

      ai.decideActionsForFollowers(leader);

      expect(decideSpy).toHaveBeenCalledWith(leader, follower);
    });

    it('does nothing when the leader cannot decide for the follower', () =>
    {
      const ai = new JABS_EnemyAI();
      const leader = buildBattler();
      const follower = buildBattler({ getBattlerRole: () => ({ leader: true }) });

      ai.decideFollowerAction(leader, follower);

      expect(follower.setLeaderDecidedAction).not.toHaveBeenCalled();
    });

    it('assigns the leader to a follower without one', () =>
    {
      const ai = new JABS_EnemyAI();
      const leader = buildBattler({ getUuid: () => 'leader-uuid' });
      const follower = buildBattler({ hasLeader: () => false });
      vi.spyOn(ai, 'decideActionForFollower').mockReturnValue([]);

      ai.decideFollowerAction(leader, follower);

      expect(follower.setLeader).toHaveBeenCalledWith('leader-uuid');
    });

    it('sets the leader-decided action when a valid skill is picked', () =>
    {
      const ai = new JABS_EnemyAI();
      const leader = buildBattler();
      const follower = buildBattler({ hasLeader: () => true });
      vi.spyOn(ai, 'decideActionForFollower').mockReturnValue([ 5 ]);

      ai.decideFollowerAction(leader, follower);

      expect(follower.setLeaderDecidedAction).toHaveBeenCalledWith(5);
    });

    it('does not set a leader-decided action when nothing was picked', () =>
    {
      // Arrange- an empty pick list. The sibling test that stubs [] only asserts setLeader, leaving
      // the assignment guard unwatched; without this, forcing that guard permanently open would
      // hand setLeaderDecidedAction an undefined skill id and no test would object.
      const ai = new JABS_EnemyAI();
      const leader = buildBattler();
      const follower = buildBattler({ hasLeader: () => true });
      vi.spyOn(ai, 'decideActionForFollower').mockReturnValue([]);

      // Act
      ai.decideFollowerAction(leader, follower);

      // Assert
      expect(follower.setLeaderDecidedAction).not.toHaveBeenCalled();
    });

    it('does not set a leader-decided action when the picked skill id is invalid', () =>
    {
      // Arrange- a pick exists but fails isSkillIdValid, exercising the second half of the guard
      // rather than the length check.
      const ai = new JABS_EnemyAI();
      const leader = buildBattler();
      const follower = buildBattler({ hasLeader: () => true });
      vi.spyOn(ai, 'decideActionForFollower').mockReturnValue([ 0 ]);

      // Act
      ai.decideFollowerAction(leader, follower);

      // Assert
      expect(follower.setLeaderDecidedAction).not.toHaveBeenCalled();
    });

    it('canDecideActionForFollower rejects a leader deciding for itself', () =>
    {
      const ai = new JABS_EnemyAI();
      const leader = buildBattler();

      expect(ai.canDecideActionForFollower(leader, leader)).toEqual(false);
    });

    it('canDecideActionForFollower rejects a missing follower', () =>
    {
      const ai = new JABS_EnemyAI();

      expect(ai.canDecideActionForFollower(buildBattler(), null)).toEqual(false);
    });

    it('canDecideActionForFollower rejects a follower that is itself a leader', () =>
    {
      const ai = new JABS_EnemyAI();
      const follower = buildBattler({ getBattlerRole: () => ({ leader: true }) });

      expect(ai.canDecideActionForFollower(buildBattler(), follower)).toEqual(false);
    });

    it('canDecideActionForFollower accepts an eligible follower', () =>
    {
      const ai = new JABS_EnemyAI();

      expect(ai.canDecideActionForFollower(buildBattler(), buildBattler())).toEqual(true);
    });
  });

  describe('decideActionForFollower()', () =>
  {
    it('follows the combo when the follower should combo', () =>
    {
      const ai = new JABS_EnemyAI();
      vi.spyOn(ai, 'shouldFollowWithCombo').mockReturnValue(true);
      vi.spyOn(ai, 'followWithCombo').mockReturnValue(42);

      expect(ai.decideActionForFollower(buildBattler(), buildBattler())).toEqual([ 42 ]);
    });

    it('falls back to the basic attack when the follower has no skills', () =>
    {
      const ai = new JABS_EnemyAI();
      const follower = buildBattler({ getEnemyBasicAttack: () => 77, getSkillIdsFromEnemy: () => [] });

      expect(ai.decideActionForFollower(buildBattler(), follower)).toEqual([ 77 ]);
    });

    it('does not scan for allies when the follower has no skills to filter', () =>
    {
      // Arrange- a healer leader plus a skill-less follower. A later guard also returns the basic
      // attack when the filtered list ends up empty, so the early bail cannot be seen in the return
      // value; what it actually saves is the ally scan. Asserting that scan never runs is the only
      // way to pin it.
      const ai = new JABS_EnemyAI(false, false, false, true);
      const follower = buildBattler({ getEnemyBasicAttack: () => 77, getSkillIdsFromEnemy: () => [] });

      // Act
      const result = ai.decideActionForFollower(buildBattler(), follower);

      // Assert
      expect(getAlliedBattlersWithinRangeMock).not.toHaveBeenCalled();
      expect(result).toEqual([ 77 ]);
    });

    it('applies healer-priority filtering when healer is active', () =>
    {
      const ai = new JABS_EnemyAI(false, false, false, true);
      const follower = buildBattler({
        getSkillIdsFromEnemy: () => [ 1 ],
        getBattler: () => ({ canPaySkillCost: () => true, skill: () => ({}) }),
      });
      const filterSpy = vi.spyOn(ai, 'filterSkillsHealerPriority').mockReturnValue([ 1 ]);

      ai.decideActionForFollower(buildBattler(), follower);

      expect(filterSpy).toHaveBeenCalled();
    });

    it('applies decideAttackAction when careful or executor is active', () =>
    {
      const ai = new JABS_EnemyAI(true);
      const leader = buildBattler();
      const follower = buildBattler({
        getSkillIdsFromEnemy: () => [ 1 ],
        getBattler: () => ({ canPaySkillCost: () => true, skill: () => ({}) }),
      });
      const attackSpy = vi.spyOn(ai, 'decideAttackAction').mockReturnValue([ 1 ]);

      ai.decideActionForFollower(leader, follower);

      expect(attackSpy).toHaveBeenCalledWith(leader, [ 1 ]);
    });

    it('falls back to the basic attack when filtering leaves no skills', () =>
    {
      const ai = new JABS_EnemyAI(false, false, false, true);
      const follower = buildBattler({ getEnemyBasicAttack: () => 77, getSkillIdsFromEnemy: () => [ 1 ] });
      vi.spyOn(ai, 'filterSkillsHealerPriority').mockReturnValue([]);

      expect(ai.decideActionForFollower(buildBattler(), follower)).toEqual([ 77 ]);
    });

    it('falls back to the basic attack when the chosen skill cannot be paid for', () =>
    {
      const ai = new JABS_EnemyAI();
      const follower = buildBattler({
        getEnemyBasicAttack: () => 77,
        getSkillIdsFromEnemy: () => [ 1 ],
        getBattler: () => ({ canPaySkillCost: () => false, skill: () => ({}) }),
      });

      expect(ai.decideActionForFollower(buildBattler(), follower)).toEqual([ 77 ]);
    });

    it('returns the chosen skill when it can be paid for', () =>
    {
      const ai = new JABS_EnemyAI();
      const follower = buildBattler({
        getSkillIdsFromEnemy: () => [ 1 ],
        getBattler: () => ({ canPaySkillCost: () => true, skill: () => ({}) }),
      });

      expect(ai.decideActionForFollower(buildBattler(), follower)).toEqual([ 1 ]);
    });
  });

  describe('filterSkillsHealerPriority()', () =>
  {
    it('returns the list unfiltered when it has one or fewer entries', () =>
    {
      const ai = new JABS_EnemyAI();

      expect(ai.filterSkillsHealerPriority(buildBattler(), [ 1 ], [])).toEqual([ 1 ]);
    });

    it('returns the list unfiltered when neither careful nor reckless is active', () =>
    {
      const ai = new JABS_EnemyAI();

      expect(ai.filterSkillsHealerPriority(buildBattler(), [ 1, 2 ], [])).toEqual([ 1, 2 ]);
    });

    it('returns the list unfiltered when no ally is missing hp and not reckless', () =>
    {
      const ai = new JABS_EnemyAI(true);
      const allies = [ { getBattler: () => ({ hp: 10, mhp: 10 }) } ];

      expect(ai.filterSkillsHealerPriority(buildBattler(), [ 1, 2 ], allies)).toEqual([ 1, 2 ]);
    });

    it('does not scan allies at all when there is one or fewer skills to rank', () =>
    {
      // Arrange- careful (so the trait gate would otherwise let us through) and a genuinely wounded
      // ally (so the "nobody needs healing" bail would not fire either). The sibling test above
      // passes an empty ally list, which makes those later guards return the same list anyway and
      // leaves this one unobservable. Ally targeting is the first visible side effect past it.
      const ai = new JABS_EnemyAI(true);
      const user = buildBattler();
      const allies = [ { getBattler: () => ({ hp: 3, mhp: 10 }) } ];

      // Act
      const result = ai.filterSkillsHealerPriority(user, [ 1 ], allies);

      // Assert
      expect(user.setAllyTarget).not.toHaveBeenCalled();
      expect(result).toEqual([ 1 ]);
    });

    it('does not scan allies when neither careful nor reckless is active', () =>
    {
      // Arrange- same reasoning as above, but pinning the trait gate instead of the length gate:
      // two skills to rank and a wounded ally, so only the missing trait stops the computation.
      const ai = new JABS_EnemyAI(false, false, false);
      const user = buildBattler();
      const allies = [ { getBattler: () => ({ hp: 3, mhp: 10 }) } ];

      // Act
      const result = ai.filterSkillsHealerPriority(user, [ 1, 2 ], allies);

      // Assert
      expect(user.setAllyTarget).not.toHaveBeenCalled();
      expect(result).toEqual([ 1, 2 ]);
    });

    it('targets the most wounded ally rather than the last one scanned', () =>
    {
      // Arrange- the worst-wounded ally comes FIRST, so a comparison that always accepted the
      // current ally would end up targeting the healthier second one. Ordering it this way is what
      // makes the running-minimum comparison observable; a single-ally fixture never could. This
      // case runs past the ally scan into the ranking loop, so it needs the healing Game_Action stub.
      globalThis.$dataSkills = { 1: { id: 1 }, 2: { id: 2 } };
      mockHealingGameAction({ 1: -50, 2: -30 }, { isForAll: false, isForOne: true });

      const ai = new JABS_EnemyAI(true);
      const user = buildBattler({ getBattler: () => ({}) });
      const worstAlly = { getBattler: () => ({ hp: 2, mhp: 10 }) };
      const healthierAlly = { getBattler: () => ({ hp: 9, mhp: 10 }) };

      // Act
      ai.filterSkillsHealerPriority(user, [ 1, 2 ], [ worstAlly, healthierAlly ]);

      // Assert
      expect(user.setAllyTarget).toHaveBeenCalledWith(worstAlly);
    });

    it('returns the healing-type subset unranked when fewer than two skills qualify as healing', () =>
    {
      globalThis.$dataSkills = { 1: { id: 1 }, 2: { id: 2 } };
      globalThis.Game_Action = class
      {
        setSkill(skillId)
        {
          this.skillId = skillId;
        }

        isForAliveFriend()
        {
          return true;
        }

        isRecover()
        {
          // only skill 1 qualifies as a recovery skill- skill 2 is filtered out entirely,
          // leaving healingTypeSkills at length 1 (below the length-2 threshold to rank).
          return this.skillId === 1;
        }

        isHpEffect()
        {
          return true;
        }
      };

      const ai = new JABS_EnemyAI(true);
      const allies = [ { getBattler: () => ({ hp: 50, mhp: 100 }) } ];

      const result = ai.filterSkillsHealerPriority(buildBattler({ getBattler: () => ({}) }), [ 1, 2 ], allies);

      expect(result).toEqual([ 1 ]);
    });

    it('selects the best-fit healing skill from the full computation path', () =>
    {
      globalThis.$dataSkills = { 1: { id: 1 }, 2: { id: 2 } };
      globalThis.Game_Action = class
      {
        constructor(battler)
        {
          this.battler = battler;
        }

        setSkill()
        {
        }

        setItemObject(skill)
        {
          this.skill = skill;
        }

        isForAliveFriend()
        {
          return true;
        }

        isRecover()
        {
          return true;
        }

        isHpEffect()
        {
          return true;
        }

        isForAll()
        {
          return false;
        }

        isForOne()
        {
          return true;
        }

        makeDamageValue()
        {
          return this.skill.id === 1 ? -30 : -10;
        }
      };

      const ai = new JABS_EnemyAI(true);
      const woundedAllyBattler = { hp: 40, mhp: 100 };
      const woundedAlly = { getBattler: () => woundedAllyBattler };
      const user = buildBattler({ getBattler: () => ({}) });

      const result = ai.filterSkillsHealerPriority(user, [ 1, 2 ], [ woundedAlly ]);

      expect(result.length).toBeGreaterThanOrEqual(0);
      expect(user.setAllyTarget).toHaveBeenCalledWith(woundedAlly);
    });

    // shared per-test Game_Action stub for the remaining branch-targeted tests below- healAmountBySkillId
    // keys off skill.id (set via setItemObject) so each test can script per-skill recovery amounts.
    function mockHealingGameAction(healAmountBySkillId, { isForAll = false, isForOne = true } = {})
    {
      globalThis.Game_Action = class
      {
        constructor(battler)
        {
          this.battler = battler;
        }

        setSkill()
        {
        }

        setItemObject(skill)
        {
          this.skill = skill;
        }

        isForAliveFriend()
        {
          return true;
        }

        isRecover()
        {
          return true;
        }

        isHpEffect()
        {
          return true;
        }

        isForAll()
        {
          return isForAll;
        }

        isForOne()
        {
          return isForOne;
        }

        makeDamageValue()
        {
          return healAmountBySkillId[this.skill.id];
        }
      };
    }

    it('prefers the closest-fit all-target heal when careful with multiple allies missing hp', () =>
    {
      globalThis.$dataSkills = { 1: { id: 1 }, 2: { id: 2 } };
      // heals are negative damage, so these are 80hp and 55hp of healing. The worst-wounded ally is
      // missing 50hp, so skill 2 (5 off) fits it far better than skill 1 (30 off) and takes the
      // closest-fit-all slot. Note the deliberate asymmetry: an earlier fixture used -80 and -20,
      // which sit EQUIDISTANT from a 50hp deficit and so could never demonstrate a preference.
      mockHealingGameAction({ 1: -80, 2: -55 }, { isForAll: true, isForOne: false });

      const ai = new JABS_EnemyAI(true);
      const user = buildBattler({ getBattler: () => ({}) });
      // two allies missing hp (0.5 and 0.8 ratios)- alliesMissingAnyHp > 1 and lowestHpRatio (0.5) < 0.80.
      const allies = [
        { getBattler: () => ({ hp: 50, mhp: 100 }) },
        { getBattler: () => ({ hp: 80, mhp: 100 }) },
      ];

      const result = ai.filterSkillsHealerPriority(user, [ 1, 2 ], allies);

      expect(result).toEqual([ 2 ]);
    });

    it('prefers the closest-fit single-target heal when careful with exactly one ally missing hp', () =>
    {
      globalThis.$dataSkills = { 1: { id: 1 }, 2: { id: 2 } };
      // actualHpDifference is 40 (100 - 60); skill 2's heal (-40) lands exactly on that deficit,
      // closer than skill 1's (-80), so closestFitHealOneSkill moves from 1 to 2.
      mockHealingGameAction({ 1: -80, 2: -40 }, { isForAll: false, isForOne: true });

      const ai = new JABS_EnemyAI(true);
      const user = buildBattler({ getBattler: () => ({}) });
      // exactly one ally missing hp, ratio 0.6 (> 0.40, so not the "critical" branch; < 0.80).
      const allies = [ { getBattler: () => ({ hp: 60, mhp: 100 }) } ];

      const result = ai.filterSkillsHealerPriority(user, [ 1, 2 ], allies);

      expect(result).toEqual([ 2 ]);
    });

    it('falls back to the random skill pick when careful but no priority tier threshold is met', () =>
    {
      globalThis.$dataSkills = { 1: { id: 1 }, 2: { id: 2 } };
      mockHealingGameAction({ 1: -50, 2: -10 }, { isForAll: false, isForOne: true });

      const ai = new JABS_EnemyAI(true);
      const user = buildBattler({ getBattler: () => ({}) });
      // exactly one ally missing hp, but ratio 0.85 (>= 0.80)- this fails every careful tier
      // (line604: not <=0.40, line608: alliesMissingAnyHp not >1, line612: ratio not <0.80),
      // so bestSkillId is left at the random skillOptions pick (mocked to index 0- biggestHealAllSkill,
      // which the firstSkill seed pins to skill 1).
      const allies = [ { getBattler: () => ({ hp: 85, mhp: 100 }) } ];

      const result = ai.filterSkillsHealerPriority(user, [ 1, 2 ], allies);

      expect(result).toEqual([ 1 ]);
    });

    it('falls back to the random skill pick when not careful, not reckless, and no ally is missing hp', () =>
    {
      globalThis.$dataSkills = { 1: { id: 1 }, 2: { id: 2 } };
      mockHealingGameAction({ 1: -50, 2: -10 }, { isForAll: false, isForOne: true });

      // filterSkillsHealerPriority only runs its full computation when careful or reckless is
      // set (line480); reckless also bypasses the early "nobody needs healing" return (line511)
      // even with zero allies missing hp, letting us reach the not-careful branch's alliesMissingAnyHp
      // checks with alliesMissingAnyHp === 0- false for both the ===1 and the >1 (line623) tiers.
      const ai = new JABS_EnemyAI(false, false, true);
      const user = buildBattler({ getBattler: () => ({}) });
      const allies = [ { getBattler: () => ({ hp: 100, mhp: 100 }) } ];

      const result = ai.filterSkillsHealerPriority(user, [ 1, 2 ], allies);

      // reckless's final override (line629) requires alliesMissingAnyHp > 0, which is false here
      // (0), so bestSkillId stays at whatever the not-careful branch left it (biggestHealAllSkill,
      // untouched since alliesMissingAnyHp is neither ===1 nor >1)- pinned to skill 1 by the
      // firstSkill seed.
      expect(result).toEqual([ 1 ]);
    });

    it('prefers the single biggest heal when not careful and exactly one ally is missing hp', () =>
    {
      globalThis.$dataSkills = { 1: { id: 1 }, 2: { id: 2 } };
      mockHealingGameAction({ 1: -50, 2: -10 }, { isForAll: false, isForOne: true });

      // reckless (not careful) so the support-priority computation runs at all.
      const ai = new JABS_EnemyAI(false, false, true);
      const user = buildBattler({ getBattler: () => ({}) });
      const allies = [ { getBattler: () => ({ hp: 60, mhp: 100 }) } ];

      const result = ai.filterSkillsHealerPriority(user, [ 1, 2 ], allies);

      // this exercises the not-careful/alliesMissingAnyHp===1 branch (line619-621), which picks
      // biggestHealOneSkill (2, since -10 > -50). reckless's final override (line629) then
      // replaces it with the single biggest raw heal across every skill regardless of scope
      // (biggestHealSkill, skill 1, since |-50| > |-10|)- so the observable result is 1.
      expect(result).toEqual([ 1 ]);
    });

    it('prefers the all-target biggest heal when not careful and multiple allies are missing hp', () =>
    {
      globalThis.$dataSkills = { 1: { id: 1 }, 2: { id: 2 } };
      mockHealingGameAction({ 1: -10, 2: -50 }, { isForAll: true, isForOne: false });

      const ai = new JABS_EnemyAI(false, false, true);
      const user = buildBattler({ getBattler: () => ({}) });
      const allies = [
        { getBattler: () => ({ hp: 50, mhp: 100 }) },
        { getBattler: () => ({ hp: 80, mhp: 100 }) },
      ];

      const result = ai.filterSkillsHealerPriority(user, [ 1, 2 ], allies);

      // this exercises the not-careful/alliesMissingAnyHp>1 branch (line623-625), which picks
      // biggestHealAllSkill (1, since the strict `<` comparison never re-fires for skill 2's
      // more-negative -50). reckless's final override (line629) then replaces it with
      // biggestHealSkill (2, since |-50| > |-10|)- so the observable result is 2.
      expect(result).toEqual([ 2 ]);
    });
  });

  describe('filterSkillsHealerPriority() skill-ranking loop', () =>
  {
    /**
     * Builds a Game_Action stub whose scope and heal amount vary PER SKILL, which the shared helper
     * in the sibling describe cannot do- it fixes isForAll/isForOne for every skill at once. Varying
     * them per skill is what lets the four ranking slots (biggest-all, biggest-one, closest-all,
     * closest-one) resolve to different skill ids, and only then can a test observe which slot the
     * final pick came from.
     * @param {object} perSkill Map of skill id to `{ heal, isForAll, isForOne }`.
     */
    function mockScopedGameAction(perSkill)
    {
      globalThis.$dataSkills = { 1: { id: 1 }, 2: { id: 2 } };
      globalThis.Game_Action = class
      {
        setSkill(skillId)
        {
          this.skill = { id: skillId };
        }

        setItemObject(skill)
        {
          this.skill = skill;
        }

        isForAliveFriend()
        {
          return true;
        }

        isRecover()
        {
          return true;
        }

        isHpEffect()
        {
          return true;
        }

        isForAll()
        {
          return perSkill[this.skill.id].isForAll;
        }

        isForOne()
        {
          return perSkill[this.skill.id].isForOne;
        }

        makeDamageValue()
        {
          return perSkill[this.skill.id].heal;
        }
      };
    }

    /**
     * A reckless healer with only full-hp allies. Reckless clears the trait gate, while zero wounded
     * allies keeps BOTH the "nobody needs healing" bail and the reckless override switched off- so
     * the returned skill is exactly `skillOptions[Math.randomInt(...)]` and nothing downstream can
     * mask which ranking slot won.
     * @returns {object} The ai plus the user and allies to hand it.
     */
    function buildRankingHarness()
    {
      return {
        ai: new JABS_EnemyAI(false, false, true),
        user: buildBattler({ getBattler: () => ({}) }),
        allies: [ { getBattler: () => ({ hp: 100, mhp: 100 }) } ],
      };
    }

    const oneOnly = { isForAll: false, isForOne: true };
    const allOnly = { isForAll: true, isForOne: false };

    it('leaves the biggest all-target slot at its seed when no skill targets everyone', () =>
    {
      // Arrange- both skills are single-target, so the all-target block never runs and the slot keeps
      // the value the first-skill seed put there. randomInt 0 reads that slot back out.
      mockScopedGameAction({ 1: { heal: -20, ...oneOnly }, 2: { heal: -80, ...oneOnly } });
      globalThis.Math.randomInt.mockReturnValue(0);
      const { ai, user, allies } = buildRankingHarness();

      // Act
      const result = ai.filterSkillsHealerPriority(user, [ 1, 2 ], allies);

      // Assert
      expect(result).toEqual([ 1 ]);
    });

    it('promotes a larger all-target heal into the biggest all-target slot', () =>
    {
      // Arrange- heals are negative, so skill 2 (-80) is the larger heal and must displace skill 1.
      mockScopedGameAction({ 1: { heal: -20, ...allOnly }, 2: { heal: -80, ...allOnly } });
      globalThis.Math.randomInt.mockReturnValue(0);
      const { ai, user, allies } = buildRankingHarness();

      // Act
      const result = ai.filterSkillsHealerPriority(user, [ 1, 2 ], allies);

      // Assert
      expect(result).toEqual([ 2 ]);
    });

    it('keeps the incumbent when a later all-target heal is smaller', () =>
    {
      // Arrange- the reverse ordering: skill 1 (-80) is already the larger heal, so skill 2 (-20)
      // must NOT displace it. This is the half that catches a comparison stuck permanently open.
      mockScopedGameAction({ 1: { heal: -80, ...allOnly }, 2: { heal: -20, ...allOnly } });
      globalThis.Math.randomInt.mockReturnValue(0);
      const { ai, user, allies } = buildRankingHarness();

      // Act
      const result = ai.filterSkillsHealerPriority(user, [ 1, 2 ], allies);

      // Assert
      expect(result).toEqual([ 1 ]);
    });

    it('leaves the biggest single-target slot at its seed when no skill targets one', () =>
    {
      // Arrange- mirror of the all-target seed case; randomInt 1 reads the single-target slot.
      mockScopedGameAction({ 1: { heal: -20, ...allOnly }, 2: { heal: -80, ...allOnly } });
      globalThis.Math.randomInt.mockReturnValue(1);
      const { ai, user, allies } = buildRankingHarness();

      // Act
      const result = ai.filterSkillsHealerPriority(user, [ 1, 2 ], allies);

      // Assert
      expect(result).toEqual([ 1 ]);
    });

    it('promotes a larger single-target heal into the biggest single-target slot', () =>
    {
      // Arrange
      mockScopedGameAction({ 1: { heal: -20, ...oneOnly }, 2: { heal: -80, ...oneOnly } });
      globalThis.Math.randomInt.mockReturnValue(1);
      const { ai, user, allies } = buildRankingHarness();

      // Act
      const result = ai.filterSkillsHealerPriority(user, [ 1, 2 ], allies);

      // Assert
      expect(result).toEqual([ 2 ]);
    });

    it('keeps the incumbent when a later single-target heal is smaller', () =>
    {
      // Arrange
      mockScopedGameAction({ 1: { heal: -80, ...oneOnly }, 2: { heal: -20, ...oneOnly } });
      globalThis.Math.randomInt.mockReturnValue(1);
      const { ai, user, allies } = buildRankingHarness();

      // Act
      const result = ai.filterSkillsHealerPriority(user, [ 1, 2 ], allies);

      // Assert
      expect(result).toEqual([ 1 ]);
    });

    it('keeps the incumbent all-target heal when a later one fits the deficit worse', () =>
    {
      // Arrange- allies are at full hp so the deficit is 0, making the closest fit simply the
      // smallest heal. Skill 2 (-80) sits further from 0 than skill 1 (-20) and must not displace it.
      // randomInt 2 reads the closest-fit-all slot.
      mockScopedGameAction({ 1: { heal: -20, ...allOnly }, 2: { heal: -80, ...allOnly } });
      globalThis.Math.randomInt.mockReturnValue(2);
      const { ai, user, allies } = buildRankingHarness();

      // Act
      const result = ai.filterSkillsHealerPriority(user, [ 1, 2 ], allies);

      // Assert
      expect(result).toEqual([ 1 ]);
    });

    it('keeps the incumbent single-target heal when a later one fits the deficit worse', () =>
    {
      // Arrange- mirror of the above; randomInt 3 reads the closest-fit-one slot.
      mockScopedGameAction({ 1: { heal: -20, ...oneOnly }, 2: { heal: -80, ...oneOnly } });
      globalThis.Math.randomInt.mockReturnValue(3);
      const { ai, user, allies } = buildRankingHarness();

      // Act
      const result = ai.filterSkillsHealerPriority(user, [ 1, 2 ], allies);

      // Assert
      expect(result).toEqual([ 1 ]);
    });

    it('prefers the closest single-target fit over the all-target tier at critical hp', () =>
    {
      // Arrange- one ally at 30% (critical, <= 0.40) and another at 50%, so both the critical tier
      // and the multi-ally tier below it would fire. Skill 1 is single-target and a poor fit, skill 2
      // is all-target and an exact fit for the 70hp deficit, which makes the two closest-fit slots
      // resolve to different skills- the only way to tell the two tiers apart.
      mockScopedGameAction({ 1: { heal: -10, ...oneOnly }, 2: { heal: -70, ...allOnly } });
      globalThis.Math.randomInt.mockReturnValue(0);
      const ai = new JABS_EnemyAI(true);
      const user = buildBattler({ getBattler: () => ({}) });
      const allies = [
        { getBattler: () => ({ hp: 30, mhp: 100 }) },
        { getBattler: () => ({ hp: 50, mhp: 100 }) },
      ];

      // Act
      const result = ai.filterSkillsHealerPriority(user, [ 1, 2 ], allies);

      // Assert- the critical tier wins, handing back the closest single-target fit.
      expect(result).toEqual([ 1 ]);
    });

    it('overrides the random pick with the outright biggest heal when reckless and allies are hurt', () =>
    {
      // Arrange- a wounded ally switches the reckless override on. randomInt 2 would otherwise pick
      // the closest-fit-all slot (skill 1), so the override is only observable because the biggest
      // heal (skill 2) differs from it.
      mockScopedGameAction({ 1: { heal: -20, ...allOnly }, 2: { heal: -80, ...allOnly } });
      globalThis.Math.randomInt.mockReturnValue(2);
      const ai = new JABS_EnemyAI(false, false, true);
      const user = buildBattler({ getBattler: () => ({}) });
      const allies = [ { getBattler: () => ({ hp: 90, mhp: 100 }) } ];

      // Act
      const result = ai.filterSkillsHealerPriority(user, [ 1, 2 ], allies);

      // Assert
      expect(result).toEqual([ 2 ]);
    });
  });

  describe('decideFollowerAi()/hasLeaderReady()/decideFollowerAiByLeader()/decideFollowerAiBySelf()', () =>
  {
    it('defers to the leader when one is ready', () =>
    {
      const ai = new JABS_EnemyAI();
      const leaderBattler = { isEngaged: () => true };
      const battler = buildBattler({ hasLeader: () => true, getLeaderBattler: () => leaderBattler });
      vi.spyOn(ai, 'decideFollowerAiByLeader').mockReturnValue([ 3 ]);

      expect(ai.decideFollowerAi(battler)).toEqual([ 3 ]);
    });

    it('decides for itself when there is no leader', () =>
    {
      const ai = new JABS_EnemyAI();
      const battler = buildBattler({ hasLeader: () => false });
      vi.spyOn(ai, 'decideFollowerAiBySelf').mockReturnValue([ 4 ]);

      expect(ai.decideFollowerAi(battler)).toEqual([ 4 ]);
    });

    it('hasLeaderReady is false without a leader', () =>
    {
      const ai = new JABS_EnemyAI();

      expect(ai.hasLeaderReady(buildBattler({ hasLeader: () => false }))).toEqual(false);
    });

    it('hasLeaderReady is false without a leader even when a resolvable engaged leader exists', () =>
    {
      // Arrange- the sibling test above leaves getLeaderBattler at its null default, so the very
      // next guard returns false too and the hasLeader check itself is unobservable. Supplying a
      // fully ready leader battler makes the two guards disagree, pinning this one specifically.
      const ai = new JABS_EnemyAI();
      const leaderBattler = { isEngaged: () => true };
      const battler = buildBattler({ hasLeader: () => false, getLeaderBattler: () => leaderBattler });

      // Act
      const result = ai.hasLeaderReady(battler);

      // Assert
      expect(result).toEqual(false);
    });

    it('hasLeaderReady is false when the leader battler cannot be resolved', () =>
    {
      const ai = new JABS_EnemyAI();

      expect(ai.hasLeaderReady(buildBattler({ hasLeader: () => true, getLeaderBattler: () => null }))).toEqual(false);
    });

    it('hasLeaderReady is false when the leader is not engaged', () =>
    {
      const ai = new JABS_EnemyAI();
      const leaderBattler = { isEngaged: () => false };

      expect(ai.hasLeaderReady(buildBattler({ hasLeader: () => true, getLeaderBattler: () => leaderBattler })))
        .toEqual(false);
    });

    it('hasLeaderReady is true when a leader is engaged', () =>
    {
      const ai = new JABS_EnemyAI();
      const leaderBattler = { isEngaged: () => true };

      expect(ai.hasLeaderReady(buildBattler({ hasLeader: () => true, getLeaderBattler: () => leaderBattler })))
        .toEqual(true);
    });

    it('decideFollowerAiByLeader shows a balloon and returns an empty array for an invalid decided skill', () =>
    {
      const ai = new JABS_EnemyAI();
      const battler = buildBattler({ getNextLeaderDecidedAction: () => 0 });

      expect(ai.decideFollowerAiByLeader(battler)).toEqual([]);
      expect(battler.showBalloon).toHaveBeenCalledWith(3);
    });

    it('decideFollowerAiByLeader returns the leader-decided skill when valid', () =>
    {
      const ai = new JABS_EnemyAI();
      const battler = buildBattler({ getNextLeaderDecidedAction: () => 5 });

      expect(ai.decideFollowerAiByLeader(battler)).toEqual([ 5 ]);
    });

    it('decideFollowerAiBySelf returns an empty array for an invalid basic attack', () =>
    {
      const ai = new JABS_EnemyAI();
      const battler = buildBattler({ getEnemyBasicAttack: () => 0 });

      expect(ai.decideFollowerAiBySelf(battler)).toEqual([]);
    });

    it('decideFollowerAiBySelf returns the basic attack skill id', () =>
    {
      const ai = new JABS_EnemyAI();
      const battler = buildBattler({ getEnemyBasicAttack: () => 42 });

      expect(ai.decideFollowerAiBySelf(battler)).toEqual([ 42 ]);
    });
  });
});
//endregion plugins/abs/core/models/jabs-enemy-ai.test.js
