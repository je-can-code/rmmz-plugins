//region plugins/abs/ext/formula/managers/jabs-engine.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Formula JABS_Engine (unit, all downstream dependencies mocked)', () =>
{
  /** @type {import('vitest').Mock} the "original" (aliased) prototype methods this file wraps- kept
   *  as stable variables and mutated in place, never reassigned, since the Aliased map captures a
   *  fixed reference to whichever function object sat on the prototype at import time. */
  let originalApplyOnExecutionEffects;
  let originalForceMapAction;

  beforeAll(async () =>
  {
    vi.resetModules();

    // minimal J.ABS.EXT.FORMULA namespace- only the shape this one file reads/writes.
    globalThis.J = {
      ABS: {
        EXT: {
          FORMULA: {
            Aliased: {},
            Context: { activeTrigger: null, suppressCascades: false },
          },
        },
      },
    };

    // FormulaEffect is a downstream dependency (a sibling model file); mock its Trigger constants.
    vi.doMock('../../../../../../src/plugins/abs/ext/formula/__models/FormulaEffect.js', () => ({
      default: { Trigger: { HIT: 'hit', USE: 'use' } },
    }));

    // JABS_Location/JABS_ActionOptions are downstream builder dependencies; mock their fluent API.
    globalThis.JABS_Location = {
      Builder: () => ({
        setX: vi.fn().mockReturnThis(),
        setY: vi.fn().mockReturnThis(),
        build: vi.fn(() => ({ x: 'built-x', y: 'built-y' })),
      }),
    };
    globalThis.JABS_ActionOptions = {
      Builder: () => ({
        setIsRetaliation: vi.fn().mockReturnThis(),
        setLocation: vi.fn().mockReturnThis(),
        setIsTerrainDamage: vi.fn().mockReturnThis(),
        build: vi.fn(() => ({ options: 'built' })),
      }),
    };

    // JABS_Engine.prototype.<method> is aliased ("original") before this file overwrites each;
    // stub each with a bare mock rather than pulling in the real JABS_Engine chain.
    function JABS_Engine()
    {
    }

    originalApplyOnExecutionEffects = vi.fn();
    originalForceMapAction = vi.fn();
    JABS_Engine.prototype.applyOnExecutionEffects = originalApplyOnExecutionEffects;
    JABS_Engine.prototype.forceMapAction = originalForceMapAction;
    globalThis.JABS_Engine = JABS_Engine;

    // the file under test- patches globalThis.JABS_Engine.prototype directly, no vm involved.
    await import('../../../../../../src/plugins/abs/ext/formula/managers/JABS_Engine.js');
  });

  beforeEach(() =>
  {
    originalApplyOnExecutionEffects.mockReset();
    originalForceMapAction.mockReset();
    globalThis.J.ABS.EXT.FORMULA.Context.activeTrigger = null;
    globalThis.J.ABS.EXT.FORMULA.Context.suppressCascades = false;
  });

  function buildEngine()
  {
    return Object.create(globalThis.JABS_Engine.prototype);
  }

  describe('applyOnExecutionEffects', () =>
  {
    it('performs the original logic then fires on-use packets', () =>
    {
      // Arrange
      const engine = buildEngine();
      engine.applyOnUseFormulaPackets = vi.fn();
      const caster = { id: 'caster' };
      const primaryAction = { id: 'action' };

      // Act
      engine.applyOnExecutionEffects(caster, primaryAction);

      // Assert
      expect(originalApplyOnExecutionEffects).toHaveBeenCalledWith(caster, primaryAction);
      expect(engine.applyOnUseFormulaPackets).toHaveBeenCalledWith(caster, primaryAction);
    });
  });

  describe('applyOnUseFormulaPackets', () =>
  {
    it('does nothing when the primary action has no underlying Game_Action', () =>
    {
      // Arrange
      const engine = buildEngine();
      const caster = { id: 'caster' };
      const primaryAction = { getAction: () => null };

      // Act
      engine.applyOnUseFormulaPackets(caster, primaryAction);

      // Assert- Context is untouched since the guard exits before anything else.
      expect(globalThis.J.ABS.EXT.FORMULA.Context.activeTrigger).toBeNull();
    });

    it('sets the use-trigger context, applies formula packets, then restores context even on error', () =>
    {
      // Arrange
      const engine = buildEngine();
      const applyFormulaPackets = vi.fn(() =>
      {
        // capture context state during the call to prove it was set before invoking.
        expect(globalThis.J.ABS.EXT.FORMULA.Context.activeTrigger).toBe('use');
        expect(globalThis.J.ABS.EXT.FORMULA.Context.suppressCascades).toBe(false);
        throw new Error('boom');
      });
      const gameAction = { applyFormulaPackets };
      const caster = { id: 'caster' };
      const primaryAction = { getAction: () => gameAction };
      globalThis.J.ABS.EXT.FORMULA.Context.activeTrigger = 'previous-trigger';
      globalThis.J.ABS.EXT.FORMULA.Context.suppressCascades = true;

      // Act / Assert- the thrown error propagates (no swallowing), but context still restores.
      expect(() => engine.applyOnUseFormulaPackets(caster, primaryAction)).toThrow('boom');
      expect(applyFormulaPackets).toHaveBeenCalledWith('use', null);
      expect(globalThis.J.ABS.EXT.FORMULA.Context.activeTrigger).toBe('previous-trigger');
      expect(globalThis.J.ABS.EXT.FORMULA.Context.suppressCascades).toBe(true);
    });
  });

  describe('forceMapAction', () =>
  {
    it('does not execute or fire on-use packets when map actions cannot be executed', () =>
    {
      // Arrange
      const engine = buildEngine();
      engine.canExecuteMapActions = () => false;
      engine.applyOnUseFormulaPackets = vi.fn();
      const previewAction = { id: 'preview' };
      const caster = { createJabsActionFromSkill: vi.fn(() => [ previewAction ]) };

      // Act
      engine.forceMapAction(caster, 5);

      // Assert
      expect(engine.applyOnUseFormulaPackets).not.toHaveBeenCalled();
      expect(originalForceMapAction).not.toHaveBeenCalled();
    });

    it('fires on-use packets for the preview action then delegates to the original logic', () =>
    {
      // Arrange
      const engine = buildEngine();
      engine.canExecuteMapActions = () => true;
      engine.applyOnUseFormulaPackets = vi.fn();
      const previewAction = { id: 'preview' };
      const caster = { createJabsActionFromSkill: vi.fn(() => [ previewAction ]) };

      // Act
      engine.forceMapAction(caster, 5, true, 3, 4, true);

      // Assert
      expect(engine.applyOnUseFormulaPackets).toHaveBeenCalledWith(caster, previewAction);
      expect(originalForceMapAction).toHaveBeenCalledWith(caster, 5, true, 3, 4, true);
    });
  });
});
//endregion plugins/abs/ext/formula/managers/jabs-engine.test.js
