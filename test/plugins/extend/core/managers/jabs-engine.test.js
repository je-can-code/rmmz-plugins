//region plugins/extend/core/managers/jabs-engine.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-Extend JABS_Engine (unit, all downstream dependencies mocked)', () =>
{
  /**
   * J-ABS's own on-cast hook, standing in for whatever the hook does before this plugin's effects run.
   * @type {import('vitest').Mock}
   */
  let originalHandleOnCastStateEffects;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { EXTEND: { Aliased: { JABS_Engine: new Map() } } };

    function JABS_Engine()
    {
    }

    originalHandleOnCastStateEffects = vi.fn();
    JABS_Engine.prototype.handleOnCastStateEffects = originalHandleOnCastStateEffects;
    globalThis.JABS_Engine = JABS_Engine;

    await import('../../../../../src/plugins/extend/core/managers/JABS_Engine.js');
  });

  beforeEach(() =>
  {
    originalHandleOnCastStateEffects.mockReset();
  });

  /**
   * Builds a JABS action whose Game_Action records, in one shared log, every on-cast effect it is asked to apply and
   * what it was handed, alongside the original hook's own entry.
   * @param {string[][]} callLog The log every call appends its name and arguments to.
   * @returns {object}
   */
  function buildLoggingAction(callLog)
  {
    const effectNames = [
      'applyOnCastSelfStates',
      'applyOnCastSelfStatesIfAfflicted',
      'applyOnCastLoseStates',
      'applyToggleOnExecuteStates',
      'applyToggleGroupOnExecuteStates',
      'applyOnCastExecuteSkills',
      'applyOnCastExecuteSkillsIfAfflicted',
    ];

    const gameAction = {};
    effectNames.forEach(effectName =>
    {
      gameAction[effectName] = (...args) => callLog.push([ effectName, ...args ]);
    });

    return { getAction: () => gameAction };
  }

  describe('handleOnCastStateEffects', () =>
  {
    it('performs the original logic with the same caster and action', () =>
    {
      // Arrange
      const engine = Object.create(globalThis.JABS_Engine.prototype);
      const caster = { id: 'caster' };
      const action = buildLoggingAction([]);

      // Act
      engine.handleOnCastStateEffects(caster, action);

      // Assert
      expect(originalHandleOnCastStateEffects).toHaveBeenCalledWith(caster, action);
    });

    it('applies the seven on-cast effects after the original, in order, handing the caster to the two executes', () =>
    {
      // Arrange
      const callLog = [];
      originalHandleOnCastStateEffects.mockImplementation(() => callLog.push([ 'original' ]));
      const engine = Object.create(globalThis.JABS_Engine.prototype);
      const caster = { id: 'caster' };
      const action = buildLoggingAction(callLog);

      // Act
      engine.handleOnCastStateEffects(caster, action);

      // Assert- each effect runs once for the action, and only the two execute-skill families are handed the caster.
      expect(callLog).toEqual([
        [ 'original' ],
        [ 'applyOnCastSelfStates' ],
        [ 'applyOnCastSelfStatesIfAfflicted' ],
        [ 'applyOnCastLoseStates' ],
        [ 'applyToggleOnExecuteStates' ],
        [ 'applyToggleGroupOnExecuteStates' ],
        [ 'applyOnCastExecuteSkills', caster ],
        [ 'applyOnCastExecuteSkillsIfAfflicted', caster ],
      ]);
    });
  });
});
//endregion plugins/extend/core/managers/jabs-engine.test.js