//region plugins/_base/_component/game-action-methods.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installJBaseHostGlobals } from './fixtures/install-j-base-host-globals.js';

describe('J-Base Game_Action methods (direct src import)', () =>
{
  let originalMakeDamageValue;

  beforeAll(async () =>
  {
    vi.resetModules();

    installJBaseHostGlobals();

    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    // vanilla RMMZ Game_Action#makeDamageValue this file aliases- stubbed bare so
    // J.BASE.Aliased captures a real function rather than undefined.
    originalMakeDamageValue = vi.fn(() => -10);
    globalThis.Game_Action.prototype.makeDamageValue = originalMakeDamageValue;

    globalThis.$gameVariables = { _data: [ 0, 0, 0 ] };

    await import('../../../../src/plugins/_base/objects/Game_Action.js');
  });

  afterAll(() =>
  {
    vi.unstubAllGlobals();
  });

  beforeEach(() =>
  {
    originalMakeDamageValue.mockClear();
  });

  function buildAction()
  {
    return Object.create(globalThis.Game_Action.prototype);
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

    it('defaults each trigger damage getter to 0 when never stamped', () =>
    {
      // Arrange
      const action = buildAction();

      // Act & Assert
      expect(action.getTriggerHpDamage()).toBe(0);
      expect(action.getTriggerMpDamage()).toBe(0);
      expect(action.getTriggerTpDamage()).toBe(0);
    });
  });

  describe('makeDamageValue', () =>
  {
    it('applies the caster\'s HAR when the original result is a heal (negative)', () =>
    {
      // Arrange
      originalMakeDamageValue.mockReturnValue(-10);
      const action = buildAction();
      action.subject = () => ({ har: 1.5 });

      // Act
      const result = action.makeDamageValue({}, false);

      // Assert
      expect(result).toBe(-15);
    });

    it('leaves the original result unchanged when it is not a heal (non-negative)', () =>
    {
      // Arrange
      originalMakeDamageValue.mockReturnValue(10);
      const action = buildAction();
      action.subject = () => { throw new Error('should not be called'); };

      // Act
      const result = action.makeDamageValue({}, false);

      // Assert
      expect(result).toBe(10);
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
