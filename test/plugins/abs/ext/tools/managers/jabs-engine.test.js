//region plugins/abs/ext/tools/managers/jabs-engine.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Tools JABS_Engine augments (direct src import)', () =>
{
  let JABS_Engine;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { TOOLS: { Aliased: { JABS_Engine: new Map() } } } } };

    function StubJABSEngine()
    {
    }

    StubJABSEngine.prototype.processOnHitEffects = vi.fn();
    StubJABSEngine.prototype.canBeKnockedBack = vi.fn();
    globalThis.JABS_Engine = StubJABSEngine;

    await import('../../../../../../src/plugins/abs/ext/tools/managers/JABS_Engine.js');
    ({ JABS_Engine } = globalThis);
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
  });

  describe('processOnHitEffects', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      vi.spyOn(engine, 'handlePullForward').mockImplementation(() => {});
      vi.spyOn(engine, 'handleGapClose').mockImplementation(() => {});
      const action = {};
      const target = {};

      // Act
      engine.processOnHitEffects(action, target);

      // Assert
      expect(globalThis.J.ABS.EXT.TOOLS.Aliased.JABS_Engine.get('processOnHitEffects')).toHaveBeenCalledWith(action, target);
    });

    it('handles pull-forward before gap close', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      const calls = [];
      vi.spyOn(engine, 'handlePullForward').mockImplementation(() => calls.push('pull'));
      vi.spyOn(engine, 'handleGapClose').mockImplementation(() => calls.push('gap'));
      const action = {};
      const target = {};

      // Act
      engine.processOnHitEffects(action, target);

      // Assert
      expect(calls).toEqual([ 'pull', 'gap' ]);
    });
  });

  describe('handleGapClose', () =>
  {
    it('does nothing when the target cannot be gap closed to', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      vi.spyOn(engine, 'canGapClose').mockReturnValue(false);
      const caster = { gapCloseToTarget: vi.fn() };
      const action = { getCaster: () => caster };
      const target = {};

      // Act
      engine.handleGapClose(action, target);

      // Assert
      expect(caster.gapCloseToTarget).not.toHaveBeenCalled();
    });

    it('gap closes the caster to the target when permitted', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      vi.spyOn(engine, 'canGapClose').mockReturnValue(true);
      const caster = { gapCloseToTarget: vi.fn() };
      const action = { getCaster: () => caster };
      const target = {};

      // Act
      engine.handleGapClose(action, target);

      // Assert
      expect(caster.gapCloseToTarget).toHaveBeenCalledWith(action, target);
    });
  });

  describe('handlePullForward', () =>
  {
    it('does nothing when the target cannot be forcibly displaced', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      engine.canBeKnockedBack.mockReturnValue(false);
      const target = { pullToCaster: vi.fn() };
      const action = { getBaseSkill: () => ({ jabsPullForward: 3 }) };

      // Act
      engine.handlePullForward(action, target);

      // Assert
      expect(target.pullToCaster).not.toHaveBeenCalled();
    });

    it('does nothing when the skill carries no pull-forward tag', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      engine.canBeKnockedBack.mockReturnValue(true);
      const target = { pullToCaster: vi.fn() };
      const action = { getBaseSkill: () => ({ jabsPullForward: null }) };

      // Act
      engine.handlePullForward(action, target);

      // Assert
      expect(target.pullToCaster).not.toHaveBeenCalled();
    });

    it('pulls the target toward the caster when both gates pass', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      engine.canBeKnockedBack.mockReturnValue(true);
      const target = { pullToCaster: vi.fn() };
      const caster = {};
      const action = { getBaseSkill: () => ({ jabsPullForward: 3 }), getCaster: () => caster };

      // Act
      engine.handlePullForward(action, target);

      // Assert
      expect(target.pullToCaster).toHaveBeenCalledWith(action, caster);
    });
  });

  describe('canGapClose', () =>
  {
    /**
     * Builds a minimal duck-typed target for canGapClose, with all gates defaulting to permissive.
     * @param {object} [overrides]
     * @returns {object}
     */
    function buildTarget(overrides = {})
    {
      return {
        getBattler: () => ({ isGapCloseBlocked: () => false }),
        isGapClosable: () => 'foo',
        ...overrides,
      };
    }

    it('is false when the target is blocked from gap close outright', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      const target = buildTarget({ getBattler: () => ({ isGapCloseBlocked: () => true }) });
      const action = { getBaseSkill: () => ({ jabsGapCloseAny: false, jabsGapClose: 'foo' }) };

      // Act & Assert
      expect(engine.canGapClose(action, target)).toBe(false);
    });

    it('is true when the skill carries <gapCloseAny>, even if the target is blocked from key-matching', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      const target = buildTarget({ isGapClosable: () => null });
      const action = { getBaseSkill: () => ({ jabsGapCloseAny: true, jabsGapClose: null }) };

      // Act & Assert
      expect(engine.canGapClose(action, target)).toBe(true);
    });

    it('is false when the skill has no gap close key', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      const target = buildTarget();
      const action = { getBaseSkill: () => ({ jabsGapCloseAny: false, jabsGapClose: null }) };

      // Act & Assert
      expect(engine.canGapClose(action, target)).toBe(false);
    });

    it('is false when the target has no gap close key', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      const target = buildTarget({ isGapClosable: () => null });
      const action = { getBaseSkill: () => ({ jabsGapCloseAny: false, jabsGapClose: 'foo' }) };

      // Act & Assert
      expect(engine.canGapClose(action, target)).toBe(false);
    });

    it('is false when the skill and target keys do not match', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      const target = buildTarget({ isGapClosable: () => 'bar' });
      const action = { getBaseSkill: () => ({ jabsGapCloseAny: false, jabsGapClose: 'foo' }) };

      // Act & Assert
      expect(engine.canGapClose(action, target)).toBe(false);
    });

    it('is true when the skill and target keys match', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      const target = buildTarget({ isGapClosable: () => 'foo' });
      const action = { getBaseSkill: () => ({ jabsGapCloseAny: false, jabsGapClose: 'foo' }) };

      // Act & Assert
      expect(engine.canGapClose(action, target)).toBe(true);
    });
  });
});
//endregion plugins/abs/ext/tools/managers/jabs-engine.test.js
