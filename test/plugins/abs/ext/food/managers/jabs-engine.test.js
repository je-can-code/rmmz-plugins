//region plugins/abs/ext/food/managers/jabs-engine.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Food JABS_Engine (unit, all downstream dependencies mocked)', () =>
{
  let originalInitialize;
  let originalOnExecuteMapAction;
  let resolveEndFoodChainSpy;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { FOOD: { Aliased: { JABS_Engine: new Map() } } } } };

    function JABS_Engine()
    {
    }

    originalInitialize = vi.fn();
    JABS_Engine.prototype.initialize = originalInitialize;
    originalOnExecuteMapAction = vi.fn();
    JABS_Engine.prototype.onExecuteMapAction = originalOnExecuteMapAction;
    globalThis.JABS_Engine = JABS_Engine;

    resolveEndFoodChainSpy = vi.fn();
    vi.doMock('../../../../../../src/plugins/abs/ext/food/models/JABS_FoodChainResolver.js', () => ({
      default: { resolveEndFoodChain: resolveEndFoodChainSpy },
    }));

    await import('../../../../../../src/plugins/abs/ext/food/managers/JABS_Engine.js');
  });

  beforeEach(() =>
  {
    originalInitialize.mockReset();
    originalOnExecuteMapAction.mockReset();
    resolveEndFoodChainSpy.mockReset();
  });

  describe('onExecuteMapAction', () =>
  {
    /**
     * Builds a caster/action pair for the alias, where the action's base skill declares
     * whether it ends a food chain.
     * @param {boolean} endsFoodChain What the executed skill's tag reads as.
     * @returns {{engine: object, caster: object, action: object, battler: object}}
     */
    function buildExecution(endsFoodChain)
    {
      const engine = Object.create(globalThis.JABS_Engine.prototype);
      const battler = { id: 'the-battler' };
      const caster = { getBattler: () => battler };
      const action = { getBaseSkill: () => ({ jabsEndsFoodChain: endsFoodChain }) };
      return {
        engine,
        caster,
        action,
        battler,
      };
    }

    it('performs the original logic for every executed action', () =>
    {
      // Arrange- an ordinary skill that has nothing to do with food.
      const { engine, caster, action } = buildExecution(false);

      // Act
      engine.onExecuteMapAction(caster, action);

      // Assert
      expect(originalOnExecuteMapAction).toHaveBeenCalledWith(caster, action);
    });

    it('leaves the chain alone when the executed skill is not tagged', () =>
    {
      // Arrange
      const { engine, caster, action } = buildExecution(false);

      // Act
      engine.onExecuteMapAction(caster, action);

      // Assert- the overwhelming majority of actions pass through here, so an untagged skill
      // reaching the resolver at all would end arcs on every sword swing in the game.
      expect(resolveEndFoodChainSpy).not.toHaveBeenCalled();
    });

    it('hands the caster\'s battler to the resolver when the executed skill is tagged', () =>
    {
      // Arrange
      const { engine, caster, action, battler } = buildExecution(true);

      // Act
      engine.onExecuteMapAction(caster, action);

      // Assert- the underlying battler is what gets passed, not the JABS wrapper; the resolver
      // reads notes and states off it.
      expect(resolveEndFoodChainSpy).toHaveBeenCalledWith(battler);
    });
  });

  describe('initialize', () =>
  {
    it('performs the original logic then creates a fresh plan map on a non-transfer init', () =>
    {
      const engine = Object.create(globalThis.JABS_Engine.prototype);
      engine.initialize(false);
      expect(originalInitialize).toHaveBeenCalledWith(false);
      expect(engine._foodChainPlans).toBeInstanceOf(Map);
      expect(engine._foodChainPlans.size).toBe(0);
    });

    it('preserves an existing plan map across a map-transfer init', () =>
    {
      const engine = Object.create(globalThis.JABS_Engine.prototype);
      engine.initialize(false);
      engine.setFoodChainPlanByUuid('uuid-1', { id: 'plan' });

      engine.initialize(true);

      expect(engine.getFoodChainPlanByUuid('uuid-1')).toEqual({ id: 'plan' });
    });

    it('creates a plan map on the first-ever map-transfer init (no prior map to preserve)', () =>
    {
      const engine = Object.create(globalThis.JABS_Engine.prototype);
      engine.initialize(true);
      expect(engine._foodChainPlans).toBeInstanceOf(Map);
    });
  });

  describe('getFoodChainPlanByUuid / setFoodChainPlanByUuid', () =>
  {
    it('returns null for an unregistered uuid', () =>
    {
      const engine = Object.create(globalThis.JABS_Engine.prototype);
      engine.initialize(false);
      expect(engine.getFoodChainPlanByUuid('missing')).toBeNull();
    });

    it('stores and retrieves a plan by uuid, replacing any prior value', () =>
    {
      const engine = Object.create(globalThis.JABS_Engine.prototype);
      engine.initialize(false);
      engine.setFoodChainPlanByUuid('uuid-1', { id: 'first' });
      engine.setFoodChainPlanByUuid('uuid-1', { id: 'second' });
      expect(engine.getFoodChainPlanByUuid('uuid-1')).toEqual({ id: 'second' });
    });
  });
});
//endregion plugins/abs/ext/food/managers/jabs-engine.test.js
