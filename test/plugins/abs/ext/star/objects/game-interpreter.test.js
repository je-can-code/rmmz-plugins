//region plugins/abs/ext/star/objects/game-interpreter.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Star Game_Interpreter (unit, all downstream dependencies mocked)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {};

    function Game_Interpreter()
    {
    }

    globalThis.Game_Interpreter = Game_Interpreter;

    await import('../../../../../../src/plugins/abs/ext/star/objects/Game_Interpreter.js');
  });

  beforeEach(() =>
  {
    globalThis.$gameParty = { inBattle: () => false };
    globalThis.$dataTroops = { 4: { id: 4 } };
    globalThis.BattleManager = { setup: vi.fn(), setEventCallback: vi.fn() };
    globalThis.$gamePlayer = { makeEncounterCount: vi.fn(), makeEncounterTroopId: vi.fn(() => 4) };
    globalThis.$gameVariables = { value: vi.fn(() => 4) };
  });

  function buildInterpreter()
  {
    const interpreter = Object.create(globalThis.Game_Interpreter.prototype);
    interpreter._branch = {};
    interpreter._indent = 0;
    return interpreter;
  }

  describe('command301', () =>
  {
    it('returns true immediately without engaging when already in battle', () =>
    {
      // Arrange
      globalThis.$gameParty.inBattle = () => true;
      const interpreter = buildInterpreter();

      // Act
      const result = interpreter.command301([ 0, 4, false, false ]);

      // Assert
      expect(result).toBe(true);
      expect(globalThis.BattleManager.setup).not.toHaveBeenCalled();
    });

    it('sets up battle when the resolved troop exists', () =>
    {
      // Arrange
      const interpreter = buildInterpreter();

      // Act
      const result = interpreter.command301([ 0, 4, true, true ]);

      // Assert
      expect(globalThis.BattleManager.setup).toHaveBeenCalledWith(4, true, true);
      expect(globalThis.BattleManager.setEventCallback).toHaveBeenCalledWith(expect.any(Function));
      expect(globalThis.$gamePlayer.makeEncounterCount).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
    });

    it('does not set up battle when the resolved troop does not exist', () =>
    {
      // Arrange
      globalThis.$dataTroops = {};
      const interpreter = buildInterpreter();

      // Act
      const result = interpreter.command301([ 0, 999, true, true ]);

      // Assert
      expect(globalThis.BattleManager.setup).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('command301convertToTroopId', () =>
  {
    it('directly returns the identifier for designation type 0', () =>
    {
      const interpreter = buildInterpreter();
      expect(interpreter.command301convertToTroopId(0, 7)).toBe(7);
    });

    it('resolves via a game variable for designation type 1', () =>
    {
      const interpreter = buildInterpreter();
      globalThis.$gameVariables.value.mockReturnValue(12);
      expect(interpreter.command301convertToTroopId(1, 3)).toBe(12);
      expect(globalThis.$gameVariables.value).toHaveBeenCalledWith(3);
    });

    it('resolves via a random encounter for designation type 2', () =>
    {
      const interpreter = buildInterpreter();
      globalThis.$gamePlayer.makeEncounterTroopId.mockReturnValue(8);
      expect(interpreter.command301convertToTroopId(2, null)).toBe(8);
    });

    it('throws on an unrecognized designation type', () =>
    {
      const interpreter = buildInterpreter();
      vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => interpreter.command301convertToTroopId(99, 1)).toThrow('borked');
      console.error.mockRestore();
    });
  });
});
//endregion plugins/abs/ext/star/objects/game-interpreter.test.js
