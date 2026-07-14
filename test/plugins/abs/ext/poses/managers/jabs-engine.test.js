//region plugins/abs/ext/poses/managers/jabs-engine.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Poses JABS_Engine (unit, all downstream dependencies mocked)', () =>
{
  /** @type {import('vitest').Mock} the "original" (aliased) executeMapAction- kept as a stable
   *  variable and mutated in place, never reassigned, since the Aliased map captures a fixed
   *  reference to whichever function object sat on the prototype at import time. */
  let originalExecuteMapAction;

  beforeAll(async () =>
  {
    vi.resetModules();

    // minimal J.ABS.EXT.POSES namespace- only the shape this one file reads/writes.
    globalThis.J = {
      ABS: {
        EXT: {
          POSES: {
            Aliased: { JABS_Engine: new Map() },
          },
        },
      },
    };

    // JABS_Engine.prototype.executeMapAction is aliased ("original") before this file overwrites
    // it; a bare mock is all the "original" needs to be for this file's own logic to be exercised.
    function JABS_Engine()
    {
    }

    originalExecuteMapAction = vi.fn();
    JABS_Engine.prototype.executeMapAction = originalExecuteMapAction;
    globalThis.JABS_Engine = JABS_Engine;

    // the file under test- patches globalThis.JABS_Engine.prototype directly, no vm involved.
    await import('../../../../../../src/plugins/abs/ext/poses/managers/JABS_Engine.js');
  });

  beforeEach(() =>
  {
    originalExecuteMapAction.mockReset();
  });

  describe('handleActionPose', () =>
  {
    it('performs the action pose for the caster using the action base skill', () =>
    {
      // Arrange
      const engine = Object.create(globalThis.JABS_Engine.prototype);
      const baseSkill = { id: 1 };
      const caster = { performActionPose: vi.fn() };
      const action = { getBaseSkill: () => baseSkill };

      // Act
      engine.handleActionPose(caster, action);

      // Assert
      expect(caster.performActionPose).toHaveBeenCalledWith(baseSkill);
    });
  });

  describe('executeMapAction', () =>
  {
    it('performs the original logic then handles the action pose', () =>
    {
      // Arrange
      const engine = Object.create(globalThis.JABS_Engine.prototype);
      engine.handleActionPose = vi.fn();
      const caster = { id: 'caster' };
      const action = { id: 'action' };

      // Act
      engine.executeMapAction(caster, action, 5, 6);

      // Assert
      expect(originalExecuteMapAction).toHaveBeenCalledWith(caster, action, 5, 6);
      expect(engine.handleActionPose).toHaveBeenCalledWith(caster, action);
    });
  });
});
//endregion plugins/abs/ext/poses/managers/jabs-engine.test.js
