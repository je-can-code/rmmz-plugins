//region plugins/_base/_component/game-action-methods.test.js
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { installJBaseHostGlobals } from './fixtures/install-j-base-host-globals.js';

describe('J-Base Game_Action methods (direct src import)', () =>
{
  let originalClear;

  beforeAll(async () =>
  {
    vi.resetModules();

    installJBaseHostGlobals();

    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    // vanilla RMMZ Game_Action#clear this file aliases to seed the trigger damages- stubbed bare so
    // J.BASE.Aliased captures a real function rather than undefined.
    originalClear = vi.fn();
    globalThis.Game_Action.prototype.clear = originalClear;

    globalThis.$gameVariables = { _data: [ 0, 0, 0 ] };

    await import('../../../../../src/plugins/_base/core/objects/Game_Action.js');
  });

  afterAll(() =>
  {
    vi.unstubAllGlobals();
  });

  function buildAction()
  {
    return Object.create(globalThis.Game_Action.prototype);
  }

  // an action whose damage roll is scripted step by step, so each step of J-Base's makeDamageValue
  // leaves its own mark on the number it returns: variance adds 1, guard takes 2, a critical triples,
  // and HAR throws unless something hands the action a subject.
  function buildDamageRollAction(formulaValue, elementRate, damageRate)
  {
    const action = buildAction();
    action.item = () => ({ damage: { variance: 20 } });
    action.evalDamageFormula = () => formulaValue;
    action.calcElementRate = () => elementRate;
    action.damageRateAgainst = vi.fn(() => damageRate);
    action.applyCritical = vi.fn(value => value * 3);
    action.applyVariance = vi.fn(value => value + 1);
    action.applyGuard = vi.fn(value => value - 2);
    action.subject = () =>
    {
      throw new Error('HAR was read on a roll that is not a heal');
    };
    return action;
  }

  describe('registerFormulaContext', () =>
  {
    it('appends a new provider entry to formulaContextProviders', () =>
    {
      // Arrange
      const before = globalThis.Game_Action.formulaContextProviders.length;
      const getter = () => 42;

      // Act
      globalThis.Game_Action.registerFormulaContext('custom', getter);

      // Assert
      const last = globalThis.Game_Action.formulaContextProviders.at(-1);
      expect(globalThis.Game_Action.formulaContextProviders).toHaveLength(before + 1);
      expect(last).toEqual({ name: 'custom', getter });

      // Cleanup- avoid leaking this provider into later tests in this file.
      globalThis.Game_Action.formulaContextProviders.pop();
    });
  });

  describe('evalFormulaWithContext', () =>
  {
    it('evaluates a formula against the attacker (a) and target (b)', () =>
    {
      // Arrange
      const action = buildAction();
      const a = { atk: 10 };
      const b = { def: 4 };

      // Act
      const result = action.evalFormulaWithContext('a.atk - b.def', a, b);

      // Assert
      expect(result).toBe(6);
    });

    it('exposes $gameVariables._data as v', () =>
    {
      // Arrange
      const action = buildAction();
      globalThis.$gameVariables._data = [ 0, 100 ];

      // Act
      const result = action.evalFormulaWithContext('v[1]', {}, {});

      // Assert
      expect(result).toBe(100);
    });

    it('exposes registered formula context providers (d/m/t) reflecting setTriggerDamage', () =>
    {
      // Arrange
      const action = buildAction();
      action.setTriggerDamage(5, 6, 7);

      // Act
      const result = action.evalFormulaWithContext('d + m + t', {}, {});

      // Assert
      expect(result).toBe(18);
    });

    it('passes the action instance, a, and b into each provider getter', () =>
    {
      // Arrange
      const action = buildAction();
      const getter = vi.fn(() => 1);
      globalThis.Game_Action.registerFormulaContext('probe', getter);
      const a = { id: 'a' };
      const b = { id: 'b' };

      // Act
      action.evalFormulaWithContext('probe', a, b);

      // Assert
      expect(getter).toHaveBeenCalledWith(action, a, b);
      globalThis.Game_Action.formulaContextProviders.pop();
    });
  });

  describe('setTriggerDamage / getTriggerHpDamage / getTriggerMpDamage / getTriggerTpDamage', () =>
  {
    it('stamps and reads back all three trigger damage values', () =>
    {
      // Arrange
      const action = buildAction();

      // Act
      action.setTriggerDamage(1, 2, 3);

      // Assert
      expect(action.getTriggerHpDamage()).toBe(1);
      expect(action.getTriggerMpDamage()).toBe(2);
      expect(action.getTriggerTpDamage()).toBe(3);
    });

    it('seeds each trigger damage to 0 when the action is cleared', () =>
    {
      // Arrange
      const action = buildAction();

      // Act
      action.clear();

      // Assert
      expect(action.getTriggerHpDamage()).toBe(0);
      expect(action.getTriggerMpDamage()).toBe(0);
      expect(action.getTriggerTpDamage()).toBe(0);
    });
  });

  describe('makeDamageValue', () =>
  {
    it('scales a harmful hit by its element and the seam\'s rate, skips REC and HAR, and rounds', () =>
    {
      // Arrange
      const action = buildDamageRollAction(101, 1.5, 0.5);
      const target = { rec: 4 };

      // Act
      const result = action.makeDamageValue(target, false);

      // Assert
      expect(result).toBe(75);
      expect(action.damageRateAgainst).toHaveBeenCalledWith(target, true);
      expect(action.applyVariance).toHaveBeenCalledWith(75.75, 20);
      expect(action.applyCritical).not.toHaveBeenCalled();
    });

    it('hands the seam an absorbed hit as not harmful, and applies HAR to what it heals', () =>
    {
      // Arrange
      const action = buildDamageRollAction(100, -1, 0.5);
      action.subject = () => ({ har: 1.5 });
      const target = { rec: 4 };

      // Act
      const result = action.makeDamageValue(target, false);

      // Assert
      expect(result).toBe(-76.5);
      expect(action.damageRateAgainst).toHaveBeenCalledWith(target, false);
    });

    it('scales a heal by the target\'s REC and the caster\'s HAR, telling the seam it is not harmful', () =>
    {
      // Arrange
      const action = buildDamageRollAction(-40, 1, 1);
      action.subject = () => ({ har: 2 });
      const target = { rec: 1.5 };

      // Act
      const result = action.makeDamageValue(target, false);

      // Assert
      expect(result).toBe(-122);
      expect(action.damageRateAgainst).toHaveBeenCalledWith(target, false);
    });

    it('amplifies a critical hit', () =>
    {
      // Arrange
      const action = buildDamageRollAction(10, 1, 1);
      const target = { rec: 4 };

      // Act
      const result = action.makeDamageValue(target, true);

      // Assert
      expect(result).toBe(29);
      expect(action.applyCritical).toHaveBeenCalledWith(10);
    });
  });

  describe('damageRateAgainst', () =>
  {
    it('takes a physical hit at the target\'s PDR', () =>
    {
      // Arrange
      const action = buildAction();
      action.isPhysical = () => true;
      action.isMagical = () => false;
      const target = { pdr: 0.5, mdr: 2 };

      // Act
      const result = action.damageRateAgainst(target, true);

      // Assert
      expect(result).toBe(0.5);
    });

    it('takes a magical hit at the target\'s MDR', () =>
    {
      // Arrange
      const action = buildAction();
      action.isPhysical = () => false;
      action.isMagical = () => true;
      const target = { pdr: 0.5, mdr: 2 };

      // Act
      const result = action.damageRateAgainst(target, true);

      // Assert
      expect(result).toBe(2);
    });

    it('takes a certain hit at an even 1, whatever the target\'s rates', () =>
    {
      // Arrange
      const action = buildAction();
      action.isPhysical = () => false;
      action.isMagical = () => false;
      const target = { pdr: 0.5, mdr: 2 };

      // Act
      const result = action.damageRateAgainst(target, true);

      // Assert
      expect(result).toBe(1);
    });
  });

  describe('itemEffectRecoverHp', () =>
  {
    it('applies REC and HAR (but not PHA) for a non-item skill', () =>
    {
      // Arrange
      const action = buildAction();
      action.subject = () => ({ har: 2, pha: 3 });
      action.isItem = () => false;
      action.makeSuccess = vi.fn();
      const target = { mhp: 100, rec: 1, gainHp: vi.fn() };
      const effect = { value1: 0.1, value2: 0 };

      // Act
      action.itemEffectRecoverHp(target, effect);

      // Assert- floor(100 * 0.1 * 1 * 2) = 20, PHA not applied since not an item.
      expect(target.gainHp).toHaveBeenCalledWith(20);
    });

    it('additionally applies PHA for an item-based recovery', () =>
    {
      // Arrange
      const action = buildAction();
      action.subject = () => ({ har: 1, pha: 2 });
      action.isItem = () => true;
      action.makeSuccess = vi.fn();
      const target = { mhp: 100, rec: 1, gainHp: vi.fn() };
      const effect = { value1: 0.1, value2: 0 };

      // Act
      action.itemEffectRecoverHp(target, effect);

      // Assert- floor(100 * 0.1 * 1 * 1 * 2) = 20.
      expect(target.gainHp).toHaveBeenCalledWith(20);
    });

    it('does not gain hp or trigger success when the resulting value is 0', () =>
    {
      // Arrange
      const action = buildAction();
      action.subject = () => ({ har: 1, pha: 1 });
      action.isItem = () => false;
      action.makeSuccess = vi.fn();
      const target = { mhp: 0, rec: 1, gainHp: vi.fn() };
      const effect = { value1: 0, value2: 0 };

      // Act
      action.itemEffectRecoverHp(target, effect);

      // Assert
      expect(target.gainHp).not.toHaveBeenCalled();
      expect(action.makeSuccess).not.toHaveBeenCalled();
    });
  });

  describe('itemEffectRecoverMp', () =>
  {
    it('applies REC and HAR (but not PHA) for a non-item skill', () =>
    {
      // Arrange
      const action = buildAction();
      action.subject = () => ({ har: 2, pha: 3 });
      action.isItem = () => false;
      action.makeSuccess = vi.fn();
      const target = { mmp: 50, rec: 1, gainMp: vi.fn() };
      const effect = { value1: 0.2, value2: 0 };

      // Act
      action.itemEffectRecoverMp(target, effect);

      // Assert- floor(50 * 0.2 * 1 * 2) = 20, PHA not applied since not an item.
      expect(target.gainMp).toHaveBeenCalledWith(20);
    });

    it('additionally applies PHA for an item-based recovery', () =>
    {
      // Arrange
      const action = buildAction();
      action.subject = () => ({ har: 1, pha: 2 });
      action.isItem = () => true;
      action.makeSuccess = vi.fn();
      const target = { mmp: 50, rec: 1, gainMp: vi.fn() };
      const effect = { value1: 0.2, value2: 0 };

      // Act
      action.itemEffectRecoverMp(target, effect);

      // Assert- floor(50 * 0.2 * 1 * 1 * 2) = 20.
      expect(target.gainMp).toHaveBeenCalledWith(20);
    });

    it('does not gain mp or trigger success when the resulting value is 0', () =>
    {
      // Arrange
      const action = buildAction();
      action.subject = () => ({ har: 1, pha: 1 });
      action.isItem = () => false;
      action.makeSuccess = vi.fn();
      const target = { mmp: 0, rec: 1, gainMp: vi.fn() };
      const effect = { value1: 0, value2: 0 };

      // Act
      action.itemEffectRecoverMp(target, effect);

      // Assert
      expect(target.gainMp).not.toHaveBeenCalled();
      expect(action.makeSuccess).not.toHaveBeenCalled();
    });
  });
});
//endregion plugins/_base/_component/game-action-methods.test.js
