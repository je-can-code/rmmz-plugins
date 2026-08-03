//region plugins/abs/core/_component/game-battler-on-chance-effects.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

/**
 * Builds a real Game_Battler-backed instance with a note-source override.
 * @param {string[]} notes Raw note strings, one per source.
 * @returns {object}
 */
function buildBattler(notes = [])
{
  const battler = Object.create(globalThis.Game_Battler.prototype);
  battler.initMembers();
  battler.__testNoteSources = notes.map(note => ({ note }));
  battler.name = () => 'TestBattler';
  return battler;
}

describe('J-ABS Game_Battler on-chance effects (direct src import)', () =>
{
  let JABS_AiManager;

  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');
    await import('../../../../../src/plugins/_base/core/objects/Game_Battler.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));

    setPluginContextToJAbs();
    await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');

    // patches globalThis.Game_Battler.prototype directly, no vm involved.
    await import('../../../../../src/plugins/abs/core/objects/Game_Battler.js');

    // RPGManager.getOnChanceEffectsFromDatabaseObjects constructs this as a bare global.
    ({ default: globalThis.JABS_OnChanceEffect } = await import('../../../../../src/plugins/abs/core/models/JABS_OnChanceEffect.js'));

    // Game_Battler.js's onEvade imports this for real (not via globalThis)- register test
    // doubles directly on its real static `battlers` Map rather than stubbing a global.
    ({ default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js'));
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
  });

  describe('note-driven on-chance effect getters', () =>
  {
    it('retaliationSkills parses <retaliate:[id, chance]> tags into effects', () =>
    {
      // Arrange
      const battler = buildBattler([ '<retaliate:[12, 50]>' ]);

      // Act
      const effects = battler.retaliationSkills();

      // Assert
      expect(effects).toHaveLength(1);
      expect(effects[0].skillId).toBe(12);
      expect(effects[0].chance).toBe(50);
    });

    it('retaliationSkills is empty with no matching tags', () =>
    {
      expect(buildBattler().retaliationSkills()).toEqual([]);
    });

    it('onOwnDefeatSkillIds parses <onOwnDefeat:[id, chance]> tags', () =>
    {
      // Arrange
      const battler = buildBattler([ '<onOwnDefeat:[3, 100]>' ]);

      // Act
      const effects = battler.onOwnDefeatSkillIds();

      // Assert
      expect(effects).toHaveLength(1);
      expect(effects[0].skillId).toBe(3);
    });

    it('onTargetDefeatSkillIds parses <onTargetDefeat:[id, chance]> tags', () =>
    {
      // Arrange
      const battler = buildBattler([ '<onTargetDefeat:[4, 25]>' ]);

      // Act
      const effects = battler.onTargetDefeatSkillIds();

      // Assert
      expect(effects).toHaveLength(1);
      expect(effects[0].skillId).toBe(4);
    });

    it('onEvadeApplySelfEffects parses <onEvadeApplySelf:[id, chance]> tags', () =>
    {
      // Arrange
      const battler = buildBattler([ '<onEvadeApplySelf:[5, 10]>' ]);

      // Act
      const effects = battler.onEvadeApplySelfEffects();

      // Assert
      expect(effects).toHaveLength(1);
      expect(effects[0].skillId).toBe(5);
    });

    it('onEvadeApplyAttackerEffects parses <onEvadeApply:[id, chance]> tags', () =>
    {
      // Arrange
      const battler = buildBattler([ '<onEvadeApply:[6, 20]>' ]);

      // Act
      const effects = battler.onEvadeApplyAttackerEffects();

      // Assert
      expect(effects).toHaveLength(1);
      expect(effects[0].skillId).toBe(6);
    });

    it('onEvadeExecuteEffects parses <onEvadeExecute:[id, chance]> tags', () =>
    {
      // Arrange
      const battler = buildBattler([ '<onEvadeExecute:[7, 30]>' ]);

      // Act
      const effects = battler.onEvadeExecuteEffects();

      // Assert
      expect(effects).toHaveLength(1);
      expect(effects[0].skillId).toBe(7);
    });
  });

  describe('processOnEvadeStateSelf', () =>
  {
    it('does nothing when there are no self-targeting evade effects', () =>
    {
      // Arrange
      const battler = buildBattler();
      const addStateSpy = vi.spyOn(battler, 'addState');

      // Act
      battler.processOnEvadeStateSelf();

      // Assert
      expect(addStateSpy).not.toHaveBeenCalled();
      addStateSpy.mockRestore();
    });

    it('applies the state to self once per resolved proc count', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.onEvadeApplySelfEffects = () => [
        {
          skillId: 20,
          baseSkill: () => ({ id: 20 }),
          resolveProcCount: () => 2,
        },
      ];
      battler.getPositiveRollsForSkill = () => 0;
      battler.getNegativeRollsForSkill = () => 0;
      const addStateSpy = vi.spyOn(battler, 'addState')
        .mockImplementation(() => {});

      // Act
      battler.processOnEvadeStateSelf();

      // Assert
      expect(addStateSpy).toHaveBeenCalledTimes(2);
      expect(addStateSpy).toHaveBeenCalledWith(20);
      addStateSpy.mockRestore();
    });
  });

  describe('processOnEvadeStateAttacker', () =>
  {
    it('does nothing when there are no attacker-targeting evade effects', () =>
    {
      // Arrange
      const battler = buildBattler();
      const attacker = { addState: vi.fn() };

      // Act
      battler.processOnEvadeStateAttacker(attacker);

      // Assert
      expect(attacker.addState).not.toHaveBeenCalled();
    });

    it('applies the state to the attacker once per resolved proc count', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.onEvadeApplyAttackerEffects = () => [
        {
          skillId: 21,
          baseSkill: () => ({ id: 21 }),
          resolveProcCount: () => 3,
        },
      ];
      battler.getPositiveRollsForSkill = () => 0;
      const attacker = { addState: vi.fn(), getNegativeRolls: () => 0 };

      // Act
      battler.processOnEvadeStateAttacker(attacker);

      // Assert
      expect(attacker.addState).toHaveBeenCalledTimes(3);
      expect(attacker.addState).toHaveBeenCalledWith(21);
    });
  });

  describe('onEvade', () =>
  {
    it('runs both self and attacker evade processing, then no-ops when the evader has no JABS_Battler', () =>
    {
      // Arrange
      const battler = buildBattler();
      const selfSpy = vi.spyOn(battler, 'processOnEvadeStateSelf')
        .mockImplementation(() => {});
      const attackerSpy = vi.spyOn(battler, 'processOnEvadeStateAttacker')
        .mockImplementation(() => {});
      const attacker = { getUuid: () => 'attacker-uuid' };

      // Act & Assert- nothing registered on JABS_AiManager.battlers, so the lookup misses.
      expect(() => battler.onEvade(attacker, {})).not.toThrow();
      expect(selfSpy).toHaveBeenCalledTimes(1);
      expect(attackerSpy).toHaveBeenCalledTimes(1);
      selfSpy.mockRestore();
      attackerSpy.mockRestore();
    });

    it('delegates skill execution to the evader\'s JABS_Battler when one is found on the map', () =>
    {
      // Arrange
      const battler = buildBattler();
      vi.spyOn(battler, 'processOnEvadeStateSelf')
        .mockImplementation(() => {});
      vi.spyOn(battler, 'processOnEvadeStateAttacker')
        .mockImplementation(() => {});
      const attacker = { getUuid: () => 'attacker-uuid' };
      const jabsAttacker = { id: 'attacker-jabs' };
      const jabsEvader = { handleOnEvadeSkills: vi.fn() };
      JABS_AiManager.battlers.set(battler.getUuid(), jabsEvader);
      JABS_AiManager.battlers.set('attacker-uuid', jabsAttacker);

      // Act
      battler.onEvade(attacker, {});

      // Assert
      expect(jabsEvader.handleOnEvadeSkills).toHaveBeenCalledWith(jabsAttacker);
      JABS_AiManager.battlers.clear();
    });
  });
});
//endregion plugins/abs/core/_component/game-battler-on-chance-effects.test.js
