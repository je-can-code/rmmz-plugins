//region plugins/passive/ext/conditional/managers/skill-execution-state-toggle-manager.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

/**
 * The arm-or-spend rule behind a Red Mage's Dualcast.
 *
 * A hardcast of a rule's type- any skill of it that costs MP- flips the state the rule names: it arms the state when
 * the battler lacks it and spends it when the battler carries it. Free skills, and skills of another type, leave it
 * alone.
 */
describe('SkillExecutionStateToggleManager (direct src import)', () =>
{
  let SkillExecutionStateToggleManager;

  beforeAll(async () =>
  {
    vi.resetModules();

    ({ default: SkillExecutionStateToggleManager } = await import(
      '../../../../../../src/plugins/passive/ext/conditional/managers/SkillExecutionStateToggleManager.js'));
  });

  /**
   * A battler double carrying the given states, each a plain object holding its parsed toggle rules.
   * @param {Array<Array<[number, number]>>} rulesPerState The toggle rules of each state the battler carries.
   * @param {number[]} [carried] The state ids the battler currently carries.
   * @returns {object}
   */
  function makeBattler(rulesPerState, carried = [])
  {
    return {
      allStates: vi.fn(() => rulesPerState.map(rules => ({ toggleStateOnSkillExecutionRules: rules }))),
      isStateAffected: vi.fn(stateId => carried.includes(stateId)),
      addState: vi.fn(),
      removeState: vi.fn(),
    };
  }

  describe('process', () =>
  {
    it('neither arms nor spends anything for a skill that costs no MP', () =>
    {
      // Arrange
      const battler = makeBattler([ [ [ 143, 4 ] ] ]);
      const skill = { id: 475, stypeId: 4, mpCost: 0 };

      // Act
      SkillExecutionStateToggleManager.process(battler, skill);

      // Assert- the rules are never even read.
      expect(battler.allStates).not.toHaveBeenCalled();
      expect(battler.addState).not.toHaveBeenCalled();
      expect(battler.removeState).not.toHaveBeenCalled();
    });

    it('flips every state the battler\'s rules name for a hardcast of that type', () =>
    {
      // Arrange- one state is armed by this cast and the other, already carried, is spent by it.
      const battler = makeBattler([ [ [ 143, 4 ] ], [ [ 144, 4 ] ] ], [ 144 ]);
      const skill = { id: 524, stypeId: 4, mpCost: 100 };

      // Act
      SkillExecutionStateToggleManager.process(battler, skill);

      // Assert
      expect(battler.addState).toHaveBeenCalledTimes(1);
      expect(battler.addState).toHaveBeenCalledWith(143, battler, skill);
      expect(battler.removeState).toHaveBeenCalledTimes(1);
      expect(battler.removeState).toHaveBeenCalledWith(144);
    });
  });

  describe('isHardcast', () =>
  {
    it('treats a skill that costs no MP as no hardcast, however long its cast', () =>
    {
      // Arrange- a cast time on a free skill must not be what counts.
      const skill = { mpCost: 0, jabsCastTime: 30 };

      // Act
      const result = SkillExecutionStateToggleManager.isHardcast(skill);

      // Assert
      expect(result).toBe(false);
    });

    it('treats a skill that costs any MP as a hardcast, instant or not', () =>
    {
      // Arrange- the smallest cost there is, on a skill with no cast time at all.
      const skill = { mpCost: 1, jabsCastTime: null };

      // Act
      const result = SkillExecutionStateToggleManager.isHardcast(skill);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('stateIdsToggledBy', () =>
  {
    it('answers to rules naming the executed skill type, passing over a rule for another type', () =>
    {
      // Arrange
      const battler = makeBattler([ [ [ 143, 4 ], [ 150, 7 ] ] ]);

      // Act
      const stateIds = SkillExecutionStateToggleManager.stateIdsToggledBy(battler, 4);

      // Assert
      expect(stateIds).toEqual([ 143 ]);
    });

    it('answers to a rule naming type 0 whatever the executed skill type, still passing over another type', () =>
    {
      // Arrange
      const battler = makeBattler([ [ [ 146, 0 ], [ 150, 7 ] ] ]);

      // Act
      const stateIds = SkillExecutionStateToggleManager.stateIdsToggledBy(battler, 4);

      // Assert
      expect(stateIds).toEqual([ 146 ]);
    });

    it('names each state once, however many sources or stack copies name it', () =>
    {
      // Arrange- two carried states name 143, and the second is listed twice the way a stacked state would be.
      const battler = makeBattler([ [ [ 143, 4 ] ], [ [ 143, 4 ], [ 145, 4 ] ], [ [ 143, 4 ], [ 145, 4 ] ] ]);

      // Act
      const stateIds = SkillExecutionStateToggleManager.stateIdsToggledBy(battler, 4);

      // Assert
      expect(stateIds).toEqual([ 143, 145 ]);
    });
  });

  describe('toggle', () =>
  {
    it('spends a state the battler carries, without arming anything', () =>
    {
      // Arrange
      const battler = makeBattler([], [ 143 ]);
      const skill = { id: 524 };

      // Act
      SkillExecutionStateToggleManager.toggle(battler, 143, skill);

      // Assert
      expect(battler.removeState).toHaveBeenCalledWith(143);
      expect(battler.addState).not.toHaveBeenCalled();
    });

    it('arms a state the battler lacks, crediting the battler and the skill as its source', () =>
    {
      // Arrange
      const battler = makeBattler([], [ 144 ]);
      const skill = { id: 523 };

      // Act
      SkillExecutionStateToggleManager.toggle(battler, 143, skill);

      // Assert
      expect(battler.addState).toHaveBeenCalledWith(143, battler, skill);
      expect(battler.removeState).not.toHaveBeenCalled();
    });
  });
});
//endregion plugins/passive/ext/conditional/managers/skill-execution-state-toggle-manager.test.js