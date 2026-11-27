//region plugins/resources/_component/jabs-engine-direct.test.js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ResourceHitManager's own behavior is already covered by resource-hit-manager.test.js; this file
// only needs to verify JABS_Engine's gating logic (hit required, hp-damage required for when-hit),
// so the dependency is faked via vi.mock rather than exercised for real.
vi.mock('../../../../src/plugins/resources/ext/abs/managers/ResourceHitManager.js', () => ({
  default: {
    applyOnAttackEffects: vi.fn(),
    applyOnCastEffects: vi.fn(),
    applyWhenHitEffects: vi.fn(),
  },
}));

describe('JABS_Engine.postPrimaryBattleEffects (resources ext/abs, direct src import)', () =>
{
  let ResourceHitManager;
  let basePostPrimaryBattleEffects;
  let basePaySkillCosts;

  beforeEach(async () =>
  {
    vi.resetModules();
    vi.clearAllMocks();

    // JABS_Engine is a bare host global; only postPrimaryBattleEffects and paySkillCosts are aliased here.
    function JABS_Engine()
    {
    }

    basePostPrimaryBattleEffects = vi.fn();
    basePaySkillCosts = vi.fn();
    JABS_Engine.prototype.postPrimaryBattleEffects = basePostPrimaryBattleEffects;
    JABS_Engine.prototype.paySkillCosts = basePaySkillCosts;
    globalThis.JABS_Engine = JABS_Engine;

    globalThis.J = { RESOURCES: { EXT: { ABS: { Aliased: { JABS_Engine: new Map() } } } } };

    await import('../../../../src/plugins/resources/ext/abs/managers/JABS_Engine.js');
    ({ default: ResourceHitManager } =
      await import('../../../../src/plugins/resources/ext/abs/managers/ResourceHitManager.js'));
  });

  afterEach(() =>
  {
    delete globalThis.JABS_Engine;
    delete globalThis.J;
  });

  it('always calls the original postPrimaryBattleEffects first', () =>
  {
    const target = { getBattler: () => ({ result: () => ({ isHit: () => false }) }) };
    const action = {};
    const engine = new globalThis.JABS_Engine();

    engine.postPrimaryBattleEffects(action, target);

    expect(basePostPrimaryBattleEffects).toHaveBeenCalledWith(action, target);
  });

  it('does not apply any resource effects when the action missed', () =>
  {
    const target = { getBattler: () => ({ result: () => ({ isHit: () => false, hpDamage: 0 }) }) };
    const engine = new globalThis.JABS_Engine();

    engine.postPrimaryBattleEffects({}, target);

    expect(ResourceHitManager.applyOnAttackEffects).not.toHaveBeenCalled();
    expect(ResourceHitManager.applyWhenHitEffects).not.toHaveBeenCalled();
  });

  it('applies on-attack effects but not when-hit effects when the hit dealt no hp damage', () =>
  {
    const action = {};
    const target = { getBattler: () => ({ result: () => ({ isHit: () => true, hpDamage: 0 }) }) };
    const engine = new globalThis.JABS_Engine();

    engine.postPrimaryBattleEffects(action, target);

    expect(ResourceHitManager.applyOnAttackEffects).toHaveBeenCalledWith(action, target);
    expect(ResourceHitManager.applyWhenHitEffects).not.toHaveBeenCalled();
  });

  it('applies both on-attack and when-hit effects when a hit dealt positive hp damage', () =>
  {
    const action = {};
    const target = { getBattler: () => ({ result: () => ({ isHit: () => true, hpDamage: 25 }) }) };
    const engine = new globalThis.JABS_Engine();

    engine.postPrimaryBattleEffects(action, target);

    expect(ResourceHitManager.applyOnAttackEffects).toHaveBeenCalledWith(action, target);
    expect(ResourceHitManager.applyWhenHitEffects).toHaveBeenCalledWith(action, target);
  });

  describe('paySkillCosts', () =>
  {
    it('pays the skill\'s own costs first, then applies on-cast gains once for that caster and action', () =>
    {
      // Arrange- record the order the two calls land in.
      const order = [];
      basePaySkillCosts.mockImplementation(() => order.push('costs'));
      ResourceHitManager.applyOnCastEffects.mockImplementation(() => order.push('on-cast'));
      const caster = {};
      const action = {};
      const engine = new globalThis.JABS_Engine();

      // Act
      engine.paySkillCosts(caster, action);

      // Assert
      expect(basePaySkillCosts).toHaveBeenCalledWith(caster, action);
      expect(ResourceHitManager.applyOnCastEffects).toHaveBeenCalledTimes(1);
      expect(ResourceHitManager.applyOnCastEffects).toHaveBeenCalledWith(caster, action);
      expect(order).toEqual([ 'costs', 'on-cast' ]);
    });
  });
});
//endregion plugins/resources/_component/jabs-engine-direct.test.js
