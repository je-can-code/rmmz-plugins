//region plugins/abs/ext/food/managers/jabs-engine.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Food JABS_Engine (unit, all downstream dependencies mocked)', () =>
{
  let originalInitialize;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { FOOD: { Aliased: { JABS_Engine: new Map() } } } } };

    function JABS_Engine()
    {
    }

    originalInitialize = vi.fn();
    JABS_Engine.prototype.initialize = originalInitialize;
    globalThis.JABS_Engine = JABS_Engine;

    await import('../../../../../../src/plugins/abs/ext/food/managers/JABS_Engine.js');
  });

  beforeEach(() =>
  {
    originalInitialize.mockReset();
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
