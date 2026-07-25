//region plugins/abs/core/_component/game-action-application-and-guard.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

/**
 * Builds a minimal Game_Action stub backed by the real prototype, so aliased methods
 * (apply, makeDamageValue) are reachable, with subject/item overridable per test.
 * @returns {object}
 */
function buildAction()
{
  return Object.create(globalThis.Game_Action.prototype);
}

describe('J-ABS Game_Action application and guard-related damage modification (direct src import)', () =>
{
  let JABS_AiManager;

  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/managers/RPGManager.js'));

    setPluginContextToJAbs();
    await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');

    // patches globalThis.Game_Action.prototype directly, no vm involved.
    await import('../../../../../src/plugins/abs/core/objects/Game_Action.js');

    // Game_Action.js imports this for real (not via globalThis)- register test doubles
    // directly on its real static `battlers` Map rather than stubbing a global.
    ({ default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js'));
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
  });

  describe('subject/setSubject', () =>
  {
    beforeEach(() =>
    {
      globalThis.$gameActors = { actor: vi.fn(id => ({ id, kind: 'actor' })) };
      globalThis.$gameEnemies = { enemy: vi.fn(index => ({ index, kind: 'enemy' })) };
    });

    it('subject resolves an actor when an actor id was stored', () =>
    {
      // Arrange
      const action = buildAction();
      action._subjectActorId = 5;

      // Act
      const result = action.subject();

      // Assert
      expect(result).toEqual({ id: 5, kind: 'actor' });
      expect(globalThis.$gameActors.actor).toHaveBeenCalledWith(5);
    });

    it('subject resolves an enemy when no actor id was stored', () =>
    {
      // Arrange
      const action = buildAction();
      action._subjectActorId = 0;
      action._subjectEnemyIndex = 3;

      // Act
      const result = action.subject();

      // Assert
      expect(result).toEqual({ index: 3, kind: 'enemy' });
      expect(globalThis.$gameEnemies.enemy).toHaveBeenCalledWith(3);
    });

    it('setSubject records actor ids and clears the enemy index for an actor subject', () =>
    {
      // Arrange
      const action = buildAction();
      const subject = { isActor: () => true, isEnemy: () => false, battlerId: () => 7 };

      // Act
      action.setSubject(subject);

      // Assert
      expect(action._subjectActorId).toBe(7);
      expect(action._subjectEnemyIndex).toBe(-1);
    });

    it('setSubject records the enemy index and clears the actor id for an enemy subject', () =>
    {
      // Arrange
      const action = buildAction();
      const subject = { isActor: () => false, isEnemy: () => true, battlerId: () => 9 };

      // Act
      action.setSubject(subject);

      // Assert
      expect(action._subjectEnemyIndex).toBe(9);
      expect(action._subjectActorId).toBe(0);
    });
  });

  describe('apply/applyJabsAction/applyVirtualJabsAction', () =>
  {
    it('apply delegates straight through to applyVirtualJabsAction', () =>
    {
      // Arrange
      const action = buildAction();
      const target = {};
      const spy = vi.spyOn(action, 'applyVirtualJabsAction')
        .mockImplementation(() => {});

      // Act
      action.apply(target);

      // Assert
      expect(spy).toHaveBeenCalledWith(target);
      spy.mockRestore();
    });

    it('executes the action and updates the last target when the hit connects', () =>
    {
      // Arrange
      const action = buildAction();
      action.preApplyAction = vi.fn();
      action.executeJabsAction = vi.fn();
      action.updateLastTarget = vi.fn();
      const target = { result: () => ({ isHit: () => true, isEvaded: () => false }) };

      // Act
      action.applyVirtualJabsAction(target);

      // Assert
      expect(action.executeJabsAction).toHaveBeenCalledWith(target);
      expect(action.updateLastTarget).toHaveBeenCalledWith(target);
    });

    it('fires evasion hooks and still updates the last target when the hit is evaded', () =>
    {
      // Arrange
      const action = buildAction();
      action.preApplyAction = vi.fn();
      action.updateLastTarget = vi.fn();
      action.subject = () => 'the-subject';
      const onEvade = vi.fn();
      const target = { result: () => ({ isHit: () => false, isEvaded: () => true }), onEvade };

      // Act
      action.applyVirtualJabsAction(target);

      // Assert
      expect(onEvade).toHaveBeenCalledWith('the-subject', action);
      expect(action.updateLastTarget).toHaveBeenCalledWith(target);
    });

    it('does nothing extra (no execute, no evade hook) when neither hit nor evaded', () =>
    {
      // Arrange
      const action = buildAction();
      action.preApplyAction = vi.fn();
      action.executeJabsAction = vi.fn();
      action.updateLastTarget = vi.fn();
      const onEvade = vi.fn();
      const target = { result: () => ({ isHit: () => false, isEvaded: () => false }), onEvade };

      // Act
      action.applyVirtualJabsAction(target);

      // Assert
      expect(action.executeJabsAction).not.toHaveBeenCalled();
      expect(onEvade).not.toHaveBeenCalled();
      expect(action.updateLastTarget).toHaveBeenCalledWith(target);
    });
  });

  describe('preApplyAction', () =>
  {
    it('clears the subject\'s result and stamps used/evaded/physical/drain onto the target result', () =>
    {
      // Arrange
      const action = buildAction();
      const clearResult = vi.fn();
      action.subject = () => ({ clearResult });
      action.testApply = () => true;
      action.isHitEvaded = () => false;
      action.isPhysical = () => true;
      action.isDrain = () => false;
      const result = {};
      const target = { result: () => result };

      // Act
      action.preApplyAction(target);

      // Assert
      expect(clearResult).toHaveBeenCalledTimes(1);
      expect(result.used).toBe(true);
      expect(result.evaded).toBe(false);
      expect(result.physical).toBe(true);
      expect(result.drain).toBe(false);
    });
  });

  describe('executeJabsAction', () =>
  {
    function buildDamageAction(overrides = {})
    {
      const action = buildAction();
      action.item = () => ({ damage: { type: 1 }, effects: [] });
      action.isHitCritical = () => false;
      action.makeDamageValue = () => 10;
      action.executeDamage = vi.fn();
      action.applyItemEffect = vi.fn();
      action.applyItemUserEffect = vi.fn();
      action.applyGlobal = vi.fn();
      Object.assign(action, overrides);
      return action;
    }

    it('computes and executes damage when the skill has a damage formula', () =>
    {
      // Arrange
      const action = buildDamageAction();
      const target = { result: () => ({ glancing: false }) };

      // Act
      action.executeJabsAction(target);

      // Assert
      expect(action.executeDamage).toHaveBeenCalledWith(target, 10);
    });

    it('skips damage calculation entirely when the skill has no damage formula', () =>
    {
      // Arrange
      const action = buildDamageAction();
      action.item = () => ({ damage: { type: 0 }, effects: [] });
      const target = { result: () => ({ glancing: false }) };

      // Act
      action.executeJabsAction(target);

      // Assert
      expect(action.executeDamage).not.toHaveBeenCalled();
    });

    it('forces critical to false when the hit is glancing, even if isHitCritical would say true', () =>
    {
      // Arrange
      const action = buildDamageAction({ isHitCritical: () => true });
      const result = { glancing: true };
      const target = { result: () => result };

      // Act
      action.executeJabsAction(target);

      // Assert
      expect(result.critical).toBe(false);
    });

    it('rolls a real critical result when the hit is not glancing', () =>
    {
      // Arrange
      const action = buildDamageAction({ isHitCritical: () => true });
      const result = { glancing: false };
      const target = { result: () => result };

      // Act
      action.executeJabsAction(target);

      // Assert
      expect(result.critical).toBe(true);
    });

    it('reduces the damage value through applyGlancingDamageReduction on a glancing blow', () =>
    {
      // Arrange
      const action = buildDamageAction();
      action.applyGlancingDamageReduction = vi.fn(() => 3);
      const target = { result: () => ({ glancing: true }) };

      // Act
      action.executeJabsAction(target);

      // Assert
      expect(action.applyGlancingDamageReduction).toHaveBeenCalledWith(10);
      expect(action.executeDamage).toHaveBeenCalledWith(target, 3);
    });

    it('applies every item effect, then user effects, then global effects', () =>
    {
      // Arrange
      const effectA = {};
      const effectB = {};
      const action = buildDamageAction();
      action.item = () => ({ damage: { type: 0 }, effects: [ effectA, effectB ] });
      const target = { result: () => ({ glancing: false }) };

      // Act
      action.executeJabsAction(target);

      // Assert
      expect(action.applyItemEffect).toHaveBeenCalledWith(target, effectA);
      expect(action.applyItemEffect).toHaveBeenCalledWith(target, effectB);
      expect(action.applyItemUserEffect).toHaveBeenCalledWith(target);
      expect(action.applyGlobal).toHaveBeenCalledTimes(1);
    });
  });

  describe('isHitEvaded', () =>
  {
    it('is false when the fated roll lands a hit', () =>
    {
      // Arrange
      const action = buildAction();
      action.itemHit = () => 0.9;
      action.itemEva = () => 0.1;
      action.subject = () => ({ getPositiveRollsForSkill: () => 0 });
      action.item = () => 'the-skill';
      const target = { getNegativeRolls: () => 0 };
      const fateSpy = vi.spyOn(globalThis.RPGManager, 'fateOf100')
        .mockReturnValue(true);

      // Act
      const result = action.isHitEvaded(target);

      // Assert
      expect(result).toBe(false);
      fateSpy.mockRestore();
    });

    it('is true when the fated roll misses', () =>
    {
      // Arrange
      const action = buildAction();
      action.itemHit = () => 0.5;
      action.itemEva = () => 0.5;
      action.subject = () => ({ getPositiveRollsForSkill: () => 0 });
      action.item = () => 'the-skill';
      const target = { getNegativeRolls: () => 0 };
      const fateSpy = vi.spyOn(globalThis.RPGManager, 'fateOf100')
        .mockReturnValue(false);

      // Act
      const result = action.isHitEvaded(target);

      // Assert
      expect(result).toBe(true);
      fateSpy.mockRestore();
    });

    it('forwards the attacker\'s positive rolls and the target\'s negative rolls to the fate roll', () =>
    {
      // Arrange
      const action = buildAction();
      action.itemHit = () => 0.9;
      action.itemEva = () => 0.1;
      const subject = { getPositiveRollsForSkill: () => 2 };
      action.subject = () => subject;
      action.item = () => 'the-skill';
      const target = { getNegativeRolls: () => 3 };
      const fateSpy = vi.spyOn(globalThis.RPGManager, 'fateOf100')
        .mockReturnValue(true);

      // Act
      action.isHitEvaded(target);

      // Assert- 1 + 2 positive, 3 negative.
      expect(fateSpy).toHaveBeenCalledWith(subject, expect.any(Number), 3, 3);
      fateSpy.mockRestore();
    });
  });

  describe('isHitCritical', () =>
  {
    it('rolls against the fully-combined crit rate as a percent', () =>
    {
      // Arrange
      const action = buildAction();
      action.itemCri = () => 0.25;
      const subject = { getPositiveRollsForSkill: () => 1 };
      action.subject = () => subject;
      action.item = () => 'the-skill';
      const target = { getNegativeRolls: () => 0 };
      const fateSpy = vi.spyOn(globalThis.RPGManager, 'fateOf100')
        .mockReturnValue(true);

      // Act
      const result = action.isHitCritical(target);

      // Assert
      expect(result).toBe(true);
      expect(fateSpy).toHaveBeenCalledWith(subject, 25, 2, 0);
      fateSpy.mockRestore();
    });
  });

  describe('itemHit', () =>
  {
    it('multiplies the skill\'s success rate by the subject\'s hit stat', () =>
    {
      // Arrange
      const action = buildAction();
      action.item = () => ({ successRate: 80 });
      action.subject = () => ({ hit: 0.5 });

      // Act & Assert- (80 * 0.01) * 0.5 = 0.4.
      expect(action.itemHit()).toBeCloseTo(0.4);
    });
  });

  describe('makeDamageValue', () =>
  {
    it('layers state multipliers, cast-time bonus, guard, and skill history bonus in order', () =>
    {
      // Arrange
      const action = buildAction();
      globalThis.J.ABS.Aliased.Game_Action.set('makeDamageValue', () => 100);
      action.applyStateDamageMultipliers = vi.fn(base => base + 10);
      action.applyCastTimeDamageBonus = vi.fn(base => base + 5);
      action.canHandleGuardEffects = () => false;
      action.applySkillHistoryBonus = vi.fn(base => base + 1);

      // Act
      const result = action.makeDamageValue({}, false);

      // Assert- 100 + 10 + 5 (guard skipped) + 1 = 116.
      expect(result).toBe(116);
    });

    it('routes through guard handling when canHandleGuardEffects is true', () =>
    {
      // Arrange
      const action = buildAction();
      globalThis.J.ABS.Aliased.Game_Action.set('makeDamageValue', () => 100);
      action.applyStateDamageMultipliers = base => base;
      action.applyCastTimeDamageBonus = base => base;
      action.applySkillHistoryBonus = base => base;
      action.canHandleGuardEffects = () => true;
      action.handleGuardEffects = vi.fn(() => 42);
      const target = { getUuid: () => 'target-uuid' };
      const jabsBattler = { id: 'jabs-battler' };
      JABS_AiManager.battlers.set('target-uuid', jabsBattler);

      // Act
      const result = action.makeDamageValue(target, false);

      // Assert
      expect(action.handleGuardEffects).toHaveBeenCalledWith(100, jabsBattler);
      expect(result).toBe(42);
      JABS_AiManager.battlers.clear();
    });
  });

  describe('canHandleGuardEffects', () =>
  {
    it('is false with no target', () =>
    {
      expect(buildAction().canHandleGuardEffects(null)).toBe(false);
    });

    it('is true with a target', () =>
    {
      expect(buildAction().canHandleGuardEffects({})).toBe(true);
    });
  });

  describe('handleGuardEffects', () =>
  {
    /**
     * Builds a minimal duck-typed JABS_Battler carrying only what guard handling touches.
     * @param {object} fields
     * @returns {object}
     */
    function buildJabsBattler(fields = {})
    {
      return {
        parrying: () => false,
        guarding: () => false,
        setParryWindow: vi.fn(),
        setGuardSkillId: vi.fn(),
        getGuardSkillId: () => 1,
        getSkill: () => ({ tpGain: 5 }),
        getBattler: () => ({ gainTp: vi.fn(), result: () => ({ reduced: 0 }) }),
        getCharacter: () => ({ requestAnimation: vi.fn() }),
        flatGuardReduction: () => 0,
        percGuardReduction: () => 0,
        ...fields,
      };
    }

    it('takes the parry branch and fully negates damage when the battler is parrying', () =>
    {
      // Arrange
      const action = buildAction();
      const jabsBattler = buildJabsBattler({ parrying: () => true });

      // Act
      const result = action.handleGuardEffects(100, jabsBattler);

      // Assert
      expect(result).toBe(0);
    });

    it('takes the guard branch and reduces damage when the battler is guarding (not parrying)', () =>
    {
      // Arrange
      const action = buildAction();
      const jabsBattler = buildJabsBattler({ guarding: () => true, percGuardReduction: () => -50 });

      // Act
      const result = action.handleGuardEffects(100, jabsBattler);

      // Assert
      expect(result).toBeLessThan(100);
    });

    it('parrying takes priority over guarding when both would be true', () =>
    {
      // Arrange
      const action = buildAction();
      const jabsBattler = buildJabsBattler({ parrying: () => true, guarding: () => true });

      // Act
      const result = action.handleGuardEffects(100, jabsBattler);

      // Assert
      expect(result).toBe(0);
    });

    it('returns the original damage unchanged when neither parrying nor guarding', () =>
    {
      // Arrange
      const action = buildAction();
      const jabsBattler = buildJabsBattler();

      // Act
      const result = action.handleGuardEffects(100, jabsBattler);

      // Assert
      expect(result).toBe(100);
    });

    describe('processParry / onParry', () =>
    {
      it('marks the result as parried and resets parry window/guard skill', () =>
      {
        // Arrange
        const action = buildAction();
        const result = {};
        const battler = { result: () => result, gainTp: vi.fn() };
        const jabsBattler = buildJabsBattler({ getBattler: () => battler });
        action.onParry = vi.fn();

        // Act
        action.processParry(jabsBattler);

        // Assert
        expect(result.parried).toBe(true);
        expect(action.onParry).toHaveBeenCalledWith(jabsBattler);
        expect(jabsBattler.setParryWindow).toHaveBeenCalledWith(0);
        expect(jabsBattler.setGuardSkillId).toHaveBeenCalledWith(0);
      });

      it('grants 10x the guard skill\'s tp and skips the parry animation when disabled (id 0)', () =>
      {
        // Arrange
        const action = buildAction();
        const gainTp = vi.fn();
        const jabsBattler = buildJabsBattler({ getBattler: () => ({ gainTp }) });
        action.getTpFromGuardSkill = () => 3;
        const originalAnimId = globalThis.J.ABS.Metadata.ParryCharacterAnimationId;
        globalThis.J.ABS.Metadata.ParryCharacterAnimationId = 0;

        // Act
        action.onParry(jabsBattler);

        // Assert
        expect(gainTp).toHaveBeenCalledWith(30);
        globalThis.J.ABS.Metadata.ParryCharacterAnimationId = originalAnimId;
      });

      it('requests the parry animation on the character when an animation id is configured', () =>
      {
        // Arrange
        const action = buildAction();
        const requestAnimation = vi.fn();
        const jabsBattler = buildJabsBattler({
          getBattler: () => ({ gainTp: vi.fn() }),
          getCharacter: () => ({ requestAnimation }),
        });
        action.getTpFromGuardSkill = () => 0;
        const originalAnimId = globalThis.J.ABS.Metadata.ParryCharacterAnimationId;
        globalThis.J.ABS.Metadata.ParryCharacterAnimationId = 122;

        // Act
        action.onParry(jabsBattler);

        // Assert
        expect(requestAnimation).toHaveBeenCalledWith(122);
        globalThis.J.ABS.Metadata.ParryCharacterAnimationId = originalAnimId;
      });
    });

    it('calculateParryDamageReduction always fully negates to zero', () =>
    {
      const action = buildAction();
      expect(action.calculateParryDamageReduction({}, 999)).toBe(0);
    });

    it('applyGlancingDamageReduction scales damage by the configured factor, rounded', () =>
    {
      // Arrange
      const action = buildAction();
      const originalFactor = globalThis.J.ABS.Metadata.GlancingBlowDamageFactor;
      globalThis.J.ABS.Metadata.GlancingBlowDamageFactor = 0.3;

      // Act & Assert- 100 * 0.3 = 30.
      expect(action.applyGlancingDamageReduction(100)).toBe(30);
      globalThis.J.ABS.Metadata.GlancingBlowDamageFactor = originalFactor;
    });

    describe('processGuard / onGuard', () =>
    {
      it('processGuard delegates to onGuard', () =>
      {
        // Arrange
        const action = buildAction();
        const jabsBattler = buildJabsBattler();
        action.onGuard = vi.fn();

        // Act
        action.processGuard(jabsBattler);

        // Assert
        expect(action.onGuard).toHaveBeenCalledWith(jabsBattler);
      });

      it('onGuard grants exactly 100% of the guard skill\'s tp (no 10x multiplier)', () =>
      {
        // Arrange
        const action = buildAction();
        const gainTp = vi.fn();
        const jabsBattler = buildJabsBattler({ getBattler: () => ({ gainTp }) });
        action.getTpFromGuardSkill = () => 4;

        // Act
        action.onGuard(jabsBattler);

        // Assert
        expect(gainTp).toHaveBeenCalledWith(4);
      });
    });

    describe('calculateGuardDamageReduction', () =>
    {
      it('applies percent reduction before flat reduction', () =>
      {
        // Arrange
        const action = buildAction();
        const calls = [];
        action.applyPercentDamageReduction = (base) =>
        {
          calls.push('percent');
          return base - 10;
        };
        action.applyFlatDamageReduction = (base) =>
        {
          calls.push('flat');
          return base - 5;
        };
        const jabsBattler = buildJabsBattler();

        // Act
        const result = action.calculateGuardDamageReduction(jabsBattler, 100);

        // Assert
        expect(calls).toEqual([ 'percent', 'flat' ]);
        expect(result).toBe(85);
      });
    });

    describe('getTpFromGuardSkill', () =>
    {
      it('returns the guard skill\'s tpGain when the skill is found', () =>
      {
        // Arrange
        const action = buildAction();
        const jabsBattler = buildJabsBattler({
          getGuardSkillId: () => 5,
          getSkill: () => ({ tpGain: 7 }),
        });

        // Act & Assert
        expect(action.getTpFromGuardSkill(jabsBattler)).toBe(7);
      });

      it('returns 0 when the timing is off and the guard skill is unavailable', () =>
      {
        // Arrange
        const action = buildAction();
        const jabsBattler = buildJabsBattler({ getSkill: () => null });

        // Act & Assert
        expect(action.getTpFromGuardSkill(jabsBattler)).toBe(0);
      });
    });

    describe('applyFlatDamageReduction', () =>
    {
      it('subtracts the flat reduction and tracks it on the action result', () =>
      {
        // Arrange
        const action = buildAction();
        const result = { reduced: 0 };
        const jabsBattler = buildJabsBattler({
          flatGuardReduction: () => -20,
          getBattler: () => ({ result: () => result }),
        });

        // Act
        const damage = action.applyFlatDamageReduction(100, jabsBattler);

        // Assert
        expect(damage).toBe(80);
        expect(result.reduced).toBe(-20);
      });

      it('never reduces damage below zero (would-be healing clamped)', () =>
      {
        // Arrange
        const action = buildAction();
        const result = { reduced: 0 };
        const jabsBattler = buildJabsBattler({
          flatGuardReduction: () => -500,
          getBattler: () => ({ result: () => result }),
        });

        // Act
        const damage = action.applyFlatDamageReduction(100, jabsBattler);

        // Assert
        expect(damage).toBe(0);
      });
    });

    describe('applyPercentDamageReduction', () =>
    {
      it('reduces damage by the configured percent and tracks it on the action result', () =>
      {
        // Arrange- percGuardReduction -50 means 50% off: 100 - (50/100 * 100) = 50.
        const action = buildAction();
        const result = { reduced: 0 };
        const jabsBattler = buildJabsBattler({
          percGuardReduction: () => -50,
          getBattler: () => ({ result: () => result }),
        });

        // Act
        const damage = action.applyPercentDamageReduction(100, jabsBattler);

        // Assert
        expect(damage).toBeCloseTo(50);
        expect(result.reduced).toBeCloseTo(-50);
      });

      it('never reduces damage below zero (would-be healing clamped)', () =>
      {
        // Arrange
        const action = buildAction();
        const result = { reduced: 0 };
        const jabsBattler = buildJabsBattler({
          percGuardReduction: () => -500,
          getBattler: () => ({ result: () => result }),
        });

        // Act
        const damage = action.applyPercentDamageReduction(100, jabsBattler);

        // Assert
        expect(damage).toBe(0);
      });
    });
  });
});
//endregion plugins/abs/core/_component/game-action-application-and-guard.test.js
