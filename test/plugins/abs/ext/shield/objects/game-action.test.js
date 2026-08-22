//region plugins/abs/ext/shield/objects/game-action.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Shield Game_Action (unit, all downstream dependencies mocked)', () =>
{
  let originalExecuteDamage;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      ABS: { EXT: { SHIELD: { Aliased: { Game_Action: new Map() } } } },
    };

    globalThis.ArrayHelper = { hasAnyIntersection: vi.fn() };

    function Game_Action()
    {
    }

    originalExecuteDamage = vi.fn();
    Game_Action.prototype.executeDamage = originalExecuteDamage;
    globalThis.Game_Action = Game_Action;

    vi.doMock('../../../../../../src/plugins/abs/ext/shield/_models/JABS_Shield.js', () => ({ default: class {} }));

    await import('../../../../../../src/plugins/abs/ext/shield/objects/Game_Action.js');
  });

  beforeEach(() =>
  {
    originalExecuteDamage.mockReset();
    globalThis.ArrayHelper.hasAnyIntersection.mockReset().mockReturnValue(false);
  });

  function buildAction(overrides = {})
  {
    const action = Object.create(globalThis.Game_Action.prototype);
    action.item = vi.fn(() => ({ damage: { type: 1, elementId: 5 }, hasShieldBypass: false, shieldBonusFormulas: [] }));
    action.subject = vi.fn(() => ({ attackElements: () => [ 9 ] }));
    action.getApplicableElements = vi.fn(() => [ 3 ]);
    return Object.assign(action, overrides);
  }

  function buildTarget(overrides = {})
  {
    return Object.assign({ getShieldStates: vi.fn(() => []) }, overrides);
  }

  function buildShield(overrides = {})
  {
    return Object.assign({ getShieldTypes: vi.fn(() => []), getCurrent: vi.fn(() => 10), setCurrent: vi.fn(), isProtected: vi.fn(() => false) }, overrides);
  }

  //region executeDamage
  describe('executeDamage', () =>
  {
    it('applies shields to the value then delegates to the original with the updated value', () =>
    {
      // Arrange
      const action = buildAction();
      const target = buildTarget();
      vi.spyOn(action, 'applyShields').mockReturnValue(42);

      // Act
      action.executeDamage(target, 100);

      // Assert
      expect(action.applyShields).toHaveBeenCalledWith(target, 100);
      expect(originalExecuteDamage).toHaveBeenCalledWith(target, 42);
    });
  });
  //endregion executeDamage

  //region applyShields
  describe('applyShields', () =>
  {
    it('returns the value unchanged when the value is zero', () =>
    {
      // Arrange
      const action = buildAction();
      const target = buildTarget();

      // Act
      const result = action.applyShields(target, 0);

      // Assert
      expect(result).toEqual(0);
      expect(target.getShieldStates).not.toHaveBeenCalled();
    });

    it('returns the value unchanged when the damage type is not HP damage or HP drain', () =>
    {
      // Arrange
      const action = buildAction({ item: vi.fn(() => ({ damage: { type: 2 } })) });
      const target = buildTarget();

      // Act
      const result = action.applyShields(target, 50);

      // Assert
      expect(result).toEqual(50);
      expect(target.getShieldStates).not.toHaveBeenCalled();
    });

    it('returns the value unchanged when there are no active shields', () =>
    {
      // Arrange
      const action = buildAction();
      const target = buildTarget({ getShieldStates: vi.fn(() => []) });

      // Act
      const result = action.applyShields(target, 50);

      // Assert
      expect(result).toEqual(50);
    });

    it('runs the value through applyShield for each shield state in order', () =>
    {
      // Arrange
      const action = buildAction();
      const stateA = {};
      const stateB = {};
      const target = buildTarget({ getShieldStates: vi.fn(() => [ stateA, stateB ]) });
      vi.spyOn(action, 'applyShield')
        .mockImplementationOnce(() => 30)
        .mockImplementationOnce(() => 10);

      // Act
      const result = action.applyShields(target, 50);

      // Assert
      expect(action.applyShield).toHaveBeenNthCalledWith(1, stateA, target, 50);
      expect(action.applyShield).toHaveBeenNthCalledWith(2, stateB, target, 30);
      expect(result).toEqual(10);
    });

    it('stops processing further shields once the value reaches zero', () =>
    {
      // Arrange
      const action = buildAction();
      const stateA = {};
      const stateB = {};
      const target = buildTarget({ getShieldStates: vi.fn(() => [ stateA, stateB ]) });
      vi.spyOn(action, 'applyShield').mockReturnValue(0);

      // Act
      const result = action.applyShields(target, 50);

      // Assert
      expect(action.applyShield).toHaveBeenCalledTimes(1);
      expect(result).toEqual(0);
    });

    it('treats damage type 5 (HP Drain) as a valid damage type', () =>
    {
      // Arrange
      const action = buildAction({ item: vi.fn(() => ({ damage: { type: 5 } })) });
      const target = buildTarget({ getShieldStates: vi.fn(() => [ {} ]) });
      vi.spyOn(action, 'applyShield').mockReturnValue(20);

      // Act
      const result = action.applyShields(target, 50);

      // Assert
      expect(result).toEqual(20);
    });
  });
  //endregion applyShields

  //region applyShield
  describe('applyShield', () =>
  {
    it('returns the value unchanged when the state has no shield', () =>
    {
      // Arrange
      const action = buildAction();
      const target = buildTarget();

      // Act
      const result = action.applyShield({ shield: null }, target, 50);

      // Assert
      expect(result).toEqual(50);
    });

    it('returns the value unchanged when the shield is not relevant to the action', () =>
    {
      // Arrange
      const action = buildAction();
      const target = buildTarget();
      const shield = buildShield();
      vi.spyOn(action, 'isShieldRelevantToAction').mockReturnValue(false);

      // Act
      const result = action.applyShield({ shield }, target, 50);

      // Assert
      expect(result).toEqual(50);
    });

    it('returns the value unchanged when the shield should be bypassed', () =>
    {
      // Arrange
      const action = buildAction();
      const target = buildTarget();
      const shield = buildShield();
      vi.spyOn(action, 'isShieldRelevantToAction').mockReturnValue(true);
      vi.spyOn(action, 'shouldBypassShield').mockReturnValue(true);

      // Act
      const result = action.applyShield({ shield }, target, 50);

      // Assert
      expect(result).toEqual(50);
    });

    it('computes the bonus damage and delegates absorption, returning the leftover HP damage', () =>
    {
      // Arrange
      const action = buildAction();
      const target = buildTarget();
      const shield = buildShield();
      const shieldState = { shield };
      vi.spyOn(action, 'isShieldRelevantToAction').mockReturnValue(true);
      vi.spyOn(action, 'shouldBypassShield').mockReturnValue(false);
      vi.spyOn(action, 'calculateShieldBonusDamage').mockReturnValue(15);
      vi.spyOn(action, 'absorbDamageIntoShield').mockReturnValue(5);

      // Act
      const result = action.applyShield(shieldState, target, 50);

      // Assert
      expect(action.calculateShieldBonusDamage).toHaveBeenCalledWith(target, 50);
      expect(action.absorbDamageIntoShield).toHaveBeenCalledWith(shieldState, target, 50, 15);
      expect(result).toEqual(5);
    });
  });
  //endregion applyShield

  //region shouldBypassShield
  describe('shouldBypassShield', () =>
  {
    it('returns false when there is no shield', () =>
    {
      // Arrange (a universal bypass returns true against any real shield, so the missing-shield
      // guard is the only thing left that can produce false here)
      const action = buildAction({ item: vi.fn(() => ({ hasShieldBypass: true, isShieldBypassUniversal: true })) });

      // Act/Assert
      expect(action.shouldBypassShield(null)).toEqual(false);
    });

    it('returns false when the action has no shield bypass tag', () =>
    {
      // Arrange
      const action = buildAction({ item: vi.fn(() => ({ hasShieldBypass: false })) });
      const shield = buildShield();

      // Act/Assert
      expect(action.shouldBypassShield(shield)).toEqual(false);
    });

    it('returns true for a universal bypass tag', () =>
    {
      // Arrange
      const action = buildAction({ item: vi.fn(() => ({ hasShieldBypass: true, isShieldBypassUniversal: true })) });
      const shield = buildShield();

      // Act/Assert
      expect(action.shouldBypassShield(shield)).toEqual(true);
    });

    it('returns false when the typed bypass has no bypass elements configured', () =>
    {
      // Arrange
      const action = buildAction({
        item: vi.fn(() => ({ hasShieldBypass: true, isShieldBypassUniversal: false, shieldBypassElements: [] })),
      });
      const shield = buildShield({ getShieldTypes: vi.fn(() => [ 1 ]) });

      // Act/Assert
      expect(action.shouldBypassShield(shield)).toEqual(false);
    });

    it('returns false when the shield has no typed elements', () =>
    {
      // Arrange
      const action = buildAction({
        item: vi.fn(() => ({ hasShieldBypass: true, isShieldBypassUniversal: false, shieldBypassElements: [ 1 ] })),
      });
      const shield = buildShield({ getShieldTypes: vi.fn(() => []) });

      // Act/Assert
      expect(action.shouldBypassShield(shield)).toEqual(false);
    });

    it('returns false when the typed bypass elements do not intersect the shield types', () =>
    {
      // Arrange
      const action = buildAction({
        item: vi.fn(() => ({ hasShieldBypass: true, isShieldBypassUniversal: false, shieldBypassElements: [ 1 ] })),
      });
      const shield = buildShield({ getShieldTypes: vi.fn(() => [ 2 ]) });
      globalThis.ArrayHelper.hasAnyIntersection.mockReturnValue(false);

      // Act/Assert
      expect(action.shouldBypassShield(shield)).toEqual(false);
    });

    it('returns true when the typed bypass elements intersect the shield types', () =>
    {
      // Arrange
      const action = buildAction({
        item: vi.fn(() => ({ hasShieldBypass: true, isShieldBypassUniversal: false, shieldBypassElements: [ 2 ] })),
      });
      const shield = buildShield({ getShieldTypes: vi.fn(() => [ 2 ]) });
      globalThis.ArrayHelper.hasAnyIntersection.mockReturnValue(true);

      // Act/Assert
      expect(action.shouldBypassShield(shield)).toEqual(true);
    });
  });
  //endregion shouldBypassShield

  //region calculateShieldBonusDamage
  describe('calculateShieldBonusDamage', () =>
  {
    it('returns zero when there are no shield-bonus formulas', () =>
    {
      // Arrange
      const action = buildAction({ item: vi.fn(() => ({ shieldBonusFormulas: [] })) });
      const target = {};

      // Act/Assert
      expect(action.calculateShieldBonusDamage(target, 50)).toEqual(0);
    });

    it('sums the evaluated, rounded, non-negative formula results', () =>
    {
      // Arrange
      const action = buildAction({ item: vi.fn(() => ({ shieldBonusFormulas: [ 'o * 0.1', '5' ] })) });
      const target = {};

      // Act
      const result = action.calculateShieldBonusDamage(target, 50);

      // Assert (round(50*0.1)=5, plus round(5)=5, total 10)
      expect(result).toEqual(10);
    });

    it('clamps a negative formula result to zero', () =>
    {
      // Arrange
      const action = buildAction({ item: vi.fn(() => ({ shieldBonusFormulas: [ '-10' ] })) });
      const target = {};

      // Act/Assert
      expect(action.calculateShieldBonusDamage(target, 50)).toEqual(0);
    });

    it('coerces a non-numeric formula result to zero', () =>
    {
      // Arrange
      const action = buildAction({ item: vi.fn(() => ({ shieldBonusFormulas: [ '"not-a-number"' ] })) });
      const target = {};

      // Act/Assert
      expect(action.calculateShieldBonusDamage(target, 50)).toEqual(0);
    });
  });
  //endregion calculateShieldBonusDamage

  //region absorbDamageIntoShield
  describe('absorbDamageIntoShield', () =>
  {
    it('breaks immediately and returns full remaining damage when the shield reference is missing', () =>
    {
      // Arrange
      const action = buildAction();
      const target = buildTarget();
      const shieldState = { shield: null };

      // Act
      const result = action.absorbDamageIntoShield(shieldState, target, 50, 0);

      // Assert
      expect(result).toEqual(50);
    });

    it('breaks immediately and returns full remaining damage when the shield pool is already empty', () =>
    {
      // Arrange
      const action = buildAction();
      const target = buildTarget();
      const shield = buildShield({ getCurrent: vi.fn(() => 0) });
      const shieldState = { shield };
      vi.spyOn(action, 'onShieldDamageAbsorbed');

      // Act
      const result = action.absorbDamageIntoShield(shieldState, target, 50, 0);

      // Assert (the shield reference is present and there is damage to absorb, so the empty-pool
      // guard is the only thing that can stop the loop before it deducts and pops)
      expect(shield.setCurrent).not.toHaveBeenCalled();
      expect(action.onShieldDamageAbsorbed).not.toHaveBeenCalled();
      expect(result).toEqual(50);
    });

    it('absorbs all HP damage when the pool exceeds the damage and does not break', () =>
    {
      // Arrange
      const action = buildAction();
      const target = buildTarget();
      const shield = buildShield({ getCurrent: vi.fn(() => 100) });
      const shieldState = { shield };
      vi.spyOn(action, 'onShieldDamageAbsorbed');

      // Act
      const result = action.absorbDamageIntoShield(shieldState, target, 50, 0);

      // Assert
      expect(shield.setCurrent).toHaveBeenCalledWith(50);
      expect(action.onShieldDamageAbsorbed).toHaveBeenCalledWith(target, 50);
      expect(result).toEqual(0);
    });

    it('absorbs bonus damage before spilling into HP once the real damage pool is spent', () =>
    {
      // Arrange
      const action = buildAction();
      const target = buildTarget();
      const shield = buildShield({ getCurrent: vi.fn(() => 100) });
      const shieldState = { shield };

      // Act
      const result = action.absorbDamageIntoShield(shieldState, target, 20, 10);

      // Assert (absorbPower = 30, all absorbed by the 100-pool shield in one tick)
      expect(shield.setCurrent).toHaveBeenCalledWith(70);
      expect(result).toEqual(0);
    });

    it('does not show a popup when nothing was absorbed', () =>
    {
      // Arrange
      const action = buildAction();
      const target = buildTarget();
      // getCurrent stays above zero but the loop only runs while damage/bonus remain, so use 0/0 guard
      // via a shield whose pool is nonzero but damage+bonus are both zero to begin with.
      const shield = buildShield({ getCurrent: vi.fn(() => 100) });
      const shieldState = { shield };
      vi.spyOn(action, 'onShieldDamageAbsorbed');

      // Act
      const result = action.absorbDamageIntoShield(shieldState, target, 0, 0);

      // Assert (loop condition is false immediately, nothing happens)
      expect(action.onShieldDamageAbsorbed).not.toHaveBeenCalled();
      expect(result).toEqual(0);
    });

    it('keeps absorbing shield-only bonus damage after the HP damage is spent and the pool refills', () =>
    {
      // Arrange (4 HP damage plus 30 bonus against a 10-point pool that refills to 100 on break)
      const action = buildAction();
      const target = buildTarget();
      let current = 10;
      const shield = buildShield({
        getCurrent: vi.fn(() => current),
        setCurrent: vi.fn(v => { current = v; }),
      });
      const shieldState = { shield, onShieldBreak: vi.fn(() => { current = 100; }) };
      vi.spyOn(action, 'onShieldDamageAbsorbed');

      // Act
      const result = action.absorbDamageIntoShield(shieldState, target, 4, 30);

      // Assert (the first tick eats the pool with 4 real + 6 bonus; the leftover 24 bonus is only
      // absorbed because the loop continues on pending bonus alone, with no HP damage remaining)
      expect(action.onShieldDamageAbsorbed).toHaveBeenNthCalledWith(1, target, 10);
      expect(action.onShieldDamageAbsorbed).toHaveBeenNthCalledWith(2, target, 24);
      expect(shield.setCurrent).toHaveBeenLastCalledWith(76);
      expect(result).toEqual(0);
    });

    it('breaks the shield, shows a break popup, and returns 0 when the broken shield is protected', () =>
    {
      // Arrange
      const action = buildAction();
      const target = buildTarget();
      let current = 30;
      const shield = buildShield({
        getCurrent: vi.fn(() => current),
        setCurrent: vi.fn(v => { current = v; }),
        isProtected: vi.fn(() => true),
      });
      const shieldState = { shield, onShieldBreak: vi.fn() };
      vi.spyOn(action, 'onShieldBroken');

      // Act
      const result = action.absorbDamageIntoShield(shieldState, target, 50, 0);

      // Assert
      expect(shield.setCurrent).toHaveBeenCalledWith(0);
      expect(action.onShieldBroken).toHaveBeenCalledWith(target);
      expect(shieldState.onShieldBreak).toHaveBeenCalled();
      expect(result).toEqual(0);
    });

    it('breaks the shield, refills via onShieldBreak, and continues absorbing remaining damage from the next stack', () =>
    {
      // Arrange
      const action = buildAction();
      const target = buildTarget();
      // first tick: 10-pool shield breaks against 50 damage, leaving 40 remaining.
      // onShieldBreak refills the pool to 100 in this scenario (simulating a remaining stack).
      let current = 10;
      const shield = buildShield({
        getCurrent: vi.fn(() => current),
        setCurrent: vi.fn(v => { current = v; }),
        isProtected: vi.fn(() => false),
      });
      const shieldState = {
        shield,
        onShieldBreak: vi.fn(() => { current = 100; }),
      };

      // Act
      const result = action.absorbDamageIntoShield(shieldState, target, 50, 0);

      // Assert (first tick absorbs 10, second tick absorbs the remaining 40 from the refilled pool)
      expect(shieldState.onShieldBreak).toHaveBeenCalledTimes(1);
      expect(shield.setCurrent).toHaveBeenCalledWith(0);
      expect(shield.setCurrent).toHaveBeenCalledWith(60);
      expect(result).toEqual(0);
    });
  });
  //endregion absorbDamageIntoShield

  //region getActionElementsForShieldChecks
  describe('getActionElementsForShieldChecks', () =>
  {
    it('delegates to getApplicableElements when the elementalistics plugin is active', () =>
    {
      // Arrange
      const action = buildAction();
      globalThis.J.ELEM = { active: true };
      const subject = {};
      const skillOrItem = { damage: { elementId: 5 } };

      // Act
      const result = action.getActionElementsForShieldChecks(subject, skillOrItem);

      // Assert
      expect(action.getApplicableElements).toHaveBeenCalledWith(subject);
      expect(result).toEqual([ 3 ]);

      // Cleanup
      delete globalThis.J.ELEM;
    });

    it('falls back to the subject\'s attack elements when the declared element id is -1 (normal attack)', () =>
    {
      // Arrange
      const action = buildAction();
      const subject = { attackElements: () => [ 7, 8 ] };
      const skillOrItem = { damage: { elementId: -1 } };

      // Act
      const result = action.getActionElementsForShieldChecks(subject, skillOrItem);

      // Assert
      expect(result).toEqual([ 7, 8 ]);
    });

    it('uses the declared element id directly when it is a concrete element', () =>
    {
      // Arrange
      const action = buildAction();
      const subject = {};
      const skillOrItem = { damage: { elementId: 4 } };

      // Act
      const result = action.getActionElementsForShieldChecks(subject, skillOrItem);

      // Assert
      expect(result).toEqual([ 4 ]);
    });
  });
  //endregion getActionElementsForShieldChecks

  //region isShieldRelevantToAction
  describe('isShieldRelevantToAction', () =>
  {
    it('returns true for an untyped shield', () =>
    {
      // Arrange
      const action = buildAction();
      const shield = buildShield({ getShieldTypes: vi.fn(() => []) });

      // Act/Assert
      expect(action.isShieldRelevantToAction(shield, [ 1 ])).toEqual(true);
    });

    it('returns false when a typed shield does not intersect the action elements', () =>
    {
      // Arrange
      const action = buildAction();
      const shield = buildShield({ getShieldTypes: vi.fn(() => [ 1 ]) });
      globalThis.ArrayHelper.hasAnyIntersection.mockReturnValue(false);

      // Act/Assert
      expect(action.isShieldRelevantToAction(shield, [ 2 ])).toEqual(false);
    });

    it('returns true when a typed shield intersects the action elements', () =>
    {
      // Arrange
      const action = buildAction();
      const shield = buildShield({ getShieldTypes: vi.fn(() => [ 1 ]) });
      globalThis.ArrayHelper.hasAnyIntersection.mockReturnValue(true);

      // Act/Assert
      expect(action.isShieldRelevantToAction(shield, [ 1 ])).toEqual(true);
    });
  });
  //endregion isShieldRelevantToAction

  //region lifecycle no-ops
  describe('onShieldDamageAbsorbed / onShieldBroken', () =>
  {
    it('are safe to call and return undefined (extension points for other plugins)', () =>
    {
      // Arrange
      const action = buildAction();

      // Act/Assert
      expect(action.onShieldDamageAbsorbed({}, 10)).toBeUndefined();
      expect(action.onShieldBroken({})).toBeUndefined();
    });
  });
  //endregion lifecycle no-ops
});
//endregion plugins/abs/ext/shield/objects/game-action.test.js
