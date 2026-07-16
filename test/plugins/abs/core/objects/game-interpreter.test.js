//region plugins/abs/core/objects/game-interpreter.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Game_Interpreter.js is a prototype-patch file (aliases and adds methods onto the real RMMZ
 * `Game_Interpreter.prototype`), so this file direct-imports it against a placeholder
 * `Game_Interpreter` global rather than nesting a vm context. It has no ES imports of its own-
 * every dependency (scene classes, managers, `$game*` globals) is a bare global, stubbed directly
 * per the unit-tier convention. Aliased-original hooks are captured as `vi.fn()`s so tests can
 * assert calls without reassigning the prototype after import.
 */
describe('J-ABS Game_Interpreter (unit, all downstream dependencies mocked)', () =>
{
  let originals;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { Aliased: { Game_Interpreter: new Map() } } };

    function Game_Interpreter()
    {
    }
    originals = {};
    [ 'character', 'command201', 'command204', 'command236', 'command301', 'command302', 'command303',
      'command351', 'command352' ]
      .forEach(key =>
      {
        originals[key] = vi.fn(() => `original-${key}`);
        Game_Interpreter.prototype[key] = originals[key];
      });
    globalThis.Game_Interpreter = Game_Interpreter;

    globalThis.Scene_Battle = class {};
    globalThis.Scene_Shop = class {};
    globalThis.Scene_Name = class {};
    globalThis.Scene_Menu = class {};
    globalThis.Scene_Save = class {};
    globalThis.Window_MenuCommand = { initCommandPosition: vi.fn() };

    await import('../../../../../src/plugins/abs/core/objects/Game_Interpreter.js');
  });

  beforeEach(() =>
  {
    Object.values(originals).forEach(fn => fn.mockClear());
    globalThis.Window_MenuCommand.initCommandPosition.mockClear();

    globalThis.$jabsEngine = { absEnabled: true };
    globalThis.$gamePlayer = {
      reserveTransfer: vi.fn(),
      makeEncounterTroopId: vi.fn(() => 5),
      makeEncounterCount: vi.fn(),
    };
    globalThis.$gameMap = {
      event: vi.fn((id) => ({ tag: `event-${id}` })),
      isScrolling: vi.fn(() => false),
      startScroll: vi.fn(),
    };
    globalThis.$gameMessage = { isBusy: vi.fn(() => false) };
    globalThis.$gameVariables = { value: vi.fn((id) => id * 10) };
    globalThis.$gameScreen = { changeWeather: vi.fn() };
    globalThis.$dataTroops = { 5: { id: 5 } };
    globalThis.$dataActors = { 1: { id: 1 } };
    globalThis.BattleManager = { setup: vi.fn(), setEventCallback: vi.fn() };
    globalThis.SceneManager = { push: vi.fn(), prepareNextScene: vi.fn() };
  });

  /**
   * Builds a real Game_Interpreter-prototype-backed instance with sane defaults.
   * @param {object} [overrides] Instance-level overrides.
   * @returns {object} A stubbed interpreter instance.
   */
  function buildInterpreter(overrides = {})
  {
    const interpreter = Object.create(globalThis.Game_Interpreter.prototype);
    Object.assign(interpreter, {
      isOnCurrentMap: () => true,
      _eventId: 7,
      setWaitMode: vi.fn(),
      wait: vi.fn(),
      nextEventCode: () => 0,
      _index: 0,
      currentCommand: () => ({ parameters: [] }),
      _branch: {},
      _indent: 0,
      ...overrides,
    });
    return interpreter;
  }

  describe('character()', () =>
  {
    it('performs original logic when JABS is disabled', () =>
    {
      globalThis.$jabsEngine.absEnabled = false;
      const interpreter = buildInterpreter();

      expect(interpreter.character(5)).toEqual('original-character');
      expect(originals.character).toHaveBeenCalledWith(5);
    });

    it('returns the player for a negative param', () =>
    {
      const interpreter = buildInterpreter();

      expect(interpreter.character(-1)).toBe(globalThis.$gamePlayer);
    });

    it('returns the event by explicit id when on the current map', () =>
    {
      const interpreter = buildInterpreter();

      expect(interpreter.character(3)).toEqual({ tag: 'event-3' });
    });

    it('falls back to this._eventId when param is 0 and on the current map', () =>
    {
      const interpreter = buildInterpreter({ _eventId: 42 });

      expect(interpreter.character(0)).toEqual({ tag: 'event-42' });
    });

    it('returns null when not on the current map', () =>
    {
      const interpreter = buildInterpreter({ isOnCurrentMap: () => false });

      expect(interpreter.character(3)).toBeNull();
    });
  });

  describe('command201() (transfer)', () =>
  {
    it('performs original logic when JABS is disabled', () =>
    {
      globalThis.$jabsEngine.absEnabled = false;
      const interpreter = buildInterpreter();

      expect(interpreter.command201([ 0 ])).toEqual('original-command201');
    });

    it('returns false when the message window is busy', () =>
    {
      globalThis.$gameMessage.isBusy.mockReturnValue(true);
      const interpreter = buildInterpreter();

      expect(interpreter.command201([ 0, 1, 2, 3, 4, 5 ])).toEqual(false);
    });

    it('reads direct-designation coordinates and reserves the transfer', () =>
    {
      const interpreter = buildInterpreter();

      const result = interpreter.command201([ 0, 1, 10, 20, 2, 0 ]);

      expect(result).toEqual(true);
      expect(globalThis.$gamePlayer.reserveTransfer).toHaveBeenCalledWith(1, 10, 20, 2, 0);
      expect(interpreter.setWaitMode).toHaveBeenCalledWith('transfer');
    });

    it('reads variable-designation coordinates and reserves the transfer', () =>
    {
      const interpreter = buildInterpreter();

      interpreter.command201([ 1, 2, 3, 4, 5, 6 ]);

      // $gameVariables.value(id) => id * 10, per the fixture.
      expect(globalThis.$gamePlayer.reserveTransfer).toHaveBeenCalledWith(20, 30, 40, 5, 6);
    });
  });

  describe('command204() (scroll map)', () =>
  {
    it('performs original logic when JABS is disabled', () =>
    {
      globalThis.$jabsEngine.absEnabled = false;
      const interpreter = buildInterpreter();

      expect(interpreter.command204([])).toEqual('original-command204');
    });

    it('waits and returns false when the map is already scrolling', () =>
    {
      globalThis.$gameMap.isScrolling.mockReturnValue(true);
      const interpreter = buildInterpreter();

      expect(interpreter.command204([ 2, 1, 4 ])).toEqual(false);
      expect(interpreter.setWaitMode).toHaveBeenCalledWith('scroll');
    });

    it('starts the scroll and waits when requested', () =>
    {
      const interpreter = buildInterpreter();

      const result = interpreter.command204([ 2, 1, 4, true ]);

      expect(result).toEqual(true);
      expect(globalThis.$gameMap.startScroll).toHaveBeenCalledWith(2, 1, 4);
      expect(interpreter.setWaitMode).toHaveBeenCalledWith('scroll');
    });

    it('starts the scroll without waiting when not requested', () =>
    {
      const interpreter = buildInterpreter();

      interpreter.command204([ 2, 1, 4, false ]);

      expect(interpreter.setWaitMode).not.toHaveBeenCalled();
    });
  });

  describe('command236() (weather)', () =>
  {
    it('performs original logic when JABS is disabled', () =>
    {
      globalThis.$jabsEngine.absEnabled = false;
      const interpreter = buildInterpreter();

      expect(interpreter.command236([])).toEqual('original-command236');
    });

    it('changes the weather and waits when requested', () =>
    {
      const interpreter = buildInterpreter();

      const result = interpreter.command236([ 1, 5, 60, true ]);

      expect(result).toEqual(true);
      expect(globalThis.$gameScreen.changeWeather).toHaveBeenCalledWith(1, 5, 60);
      expect(interpreter.wait).toHaveBeenCalledWith(60);
    });

    it('changes the weather without waiting when not requested', () =>
    {
      const interpreter = buildInterpreter();

      interpreter.command236([ 1, 5, 60, false ]);

      expect(interpreter.wait).not.toHaveBeenCalled();
    });
  });

  describe('command301() (battle)', () =>
  {
    it('performs original logic when JABS is disabled', () =>
    {
      globalThis.$jabsEngine.absEnabled = false;
      const interpreter = buildInterpreter();

      expect(interpreter.command301([])).toEqual('original-command301');
    });

    it('uses direct troop designation', () =>
    {
      const interpreter = buildInterpreter();

      const result = interpreter.command301([ 0, 5, true, true ]);

      expect(result).toEqual(true);
      expect(globalThis.BattleManager.setup).toHaveBeenCalledWith(5, true, true);
      expect(globalThis.SceneManager.push).toHaveBeenCalledWith(globalThis.Scene_Battle);
    });

    it('uses variable troop designation', () =>
    {
      const interpreter = buildInterpreter();

      interpreter.command301([ 1, 0.5, true, true ]);

      // $gameVariables.value(id) => id * 10 per the fixture; 0.5 * 10 = 5.
      expect(globalThis.BattleManager.setup).toHaveBeenCalledWith(5, true, true);
    });

    it('uses the random encounter troop id for any other designation', () =>
    {
      const interpreter = buildInterpreter();

      interpreter.command301([ 2, 0, true, true ]);

      expect(globalThis.$gamePlayer.makeEncounterTroopId).toHaveBeenCalled();
      expect(globalThis.BattleManager.setup).toHaveBeenCalledWith(5, true, true);
    });

    it('does not start a battle for an unknown troop id', () =>
    {
      const interpreter = buildInterpreter();

      interpreter.command301([ 0, 999, true, true ]);

      expect(globalThis.BattleManager.setup).not.toHaveBeenCalled();
    });

    it('registers an event callback that writes to the branch/indent bookkeeping', () =>
    {
      const interpreter = buildInterpreter();

      interpreter.command301([ 0, 5, true, true ]);

      const [ callback ] = globalThis.BattleManager.setEventCallback.mock.calls.at(-1);
      callback(3);
      expect(interpreter._branch[interpreter._indent]).toEqual(3);
    });
  });

  describe('command302() (shop)', () =>
  {
    it('performs original logic when JABS is disabled', () =>
    {
      globalThis.$jabsEngine.absEnabled = false;
      const interpreter = buildInterpreter();

      expect(interpreter.command302([])).toEqual('original-command302');
    });

    it('collects chained shop-goods rows and pushes the shop scene', () =>
    {
      const goodsRow2 = { parameters: [ 'row2' ] };
      let codeCallCount = 0;
      const interpreter = buildInterpreter({
        nextEventCode: () => (codeCallCount++ === 0 ? 605 : 0),
        currentCommand: () => goodsRow2,
      });

      const result = interpreter.command302([ 1, 2, 3, 4, 5 ]);

      expect(result).toEqual(true);
      expect(globalThis.SceneManager.push).toHaveBeenCalledWith(globalThis.Scene_Shop);
      expect(globalThis.SceneManager.prepareNextScene).toHaveBeenCalledWith(
        [ [ 1, 2, 3, 4, 5 ], [ 'row2' ] ], 5
      );
    });

    it('pushes the shop scene with just the initial goods row when there is no chain', () =>
    {
      const interpreter = buildInterpreter({ nextEventCode: () => 0 });

      interpreter.command302([ 1, 2, 3, 4, 5 ]);

      expect(globalThis.SceneManager.prepareNextScene).toHaveBeenCalledWith([ [ 1, 2, 3, 4, 5 ] ], 5);
    });
  });

  describe('command303() (name input)', () =>
  {
    it('performs original logic when JABS is disabled', () =>
    {
      globalThis.$jabsEngine.absEnabled = false;
      const interpreter = buildInterpreter();

      expect(interpreter.command303([ 1, 8 ])).toEqual('original-command303');
    });

    it('pushes the name scene for a known actor id', () =>
    {
      const interpreter = buildInterpreter();

      const result = interpreter.command303([ 1, 8 ]);

      expect(result).toEqual(true);
      expect(globalThis.SceneManager.push).toHaveBeenCalledWith(globalThis.Scene_Name);
      expect(globalThis.SceneManager.prepareNextScene).toHaveBeenCalledWith(1, 8);
    });

    it('does not push the name scene for an unknown actor id', () =>
    {
      const interpreter = buildInterpreter();

      const result = interpreter.command303([ 999, 8 ]);

      expect(result).toEqual(true);
      expect(globalThis.SceneManager.push).not.toHaveBeenCalled();
    });
  });

  describe('command351() (menu)', () =>
  {
    it('performs original logic when JABS is disabled', () =>
    {
      globalThis.$jabsEngine.absEnabled = false;
      const interpreter = buildInterpreter();

      expect(interpreter.command351()).toEqual('original-command351');
    });

    it('pushes the menu scene and resets the command position', () =>
    {
      const interpreter = buildInterpreter();

      const result = interpreter.command351();

      expect(result).toEqual(true);
      expect(globalThis.SceneManager.push).toHaveBeenCalledWith(globalThis.Scene_Menu);
      expect(globalThis.Window_MenuCommand.initCommandPosition).toHaveBeenCalled();
    });
  });

  describe('command352() (save)', () =>
  {
    it('performs original logic when JABS is disabled', () =>
    {
      globalThis.$jabsEngine.absEnabled = false;
      const interpreter = buildInterpreter();

      expect(interpreter.command352()).toEqual('original-command352');
    });

    it('pushes the save scene', () =>
    {
      const interpreter = buildInterpreter();

      const result = interpreter.command352();

      expect(result).toEqual(true);
      expect(globalThis.SceneManager.push).toHaveBeenCalledWith(globalThis.Scene_Save);
    });
  });
});
//endregion plugins/abs/core/objects/game-interpreter.test.js
