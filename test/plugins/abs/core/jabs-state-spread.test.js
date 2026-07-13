//region plugins/abs/core/jabs-state-spread.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../fixtures/install-abs-host-globals.js';

const SPREAD_STATE_ID = 50;
const PLAIN_STATE_ID = 51;

/**
 * Hydrates a state database row for spread tag parsing tests.
 * @param {number} stateId
 * @param {string} note
 * @returns {object}
 */
function registerStateRow(stateId, note)
{
  const row = Object.create(globalThis.RPG_State.prototype);

  row.id = stateId;
  row.note = note;
  row.meta = {};
  row.name = `State ${stateId}`;
  row.iconIndex = 0;

  // RPG_Base#original is a private field set only via the constructor.
  // Objects created with Object.create() skip the constructor, so _original() would throw.
  // Shadow it at the instance level so RPGManager's cache key resolves to this mock object.
  row._original = function() { return this; };

  globalThis.$dataStates[stateId] = row;

  return row;
}

/**
 * Builds a minimal {@link Game_Battler} stand-in for spread tests.
 * @param {string} uuid
 * @returns {object}
 */
function buildGameBattler(uuid)
{
  const battler = Object.create(globalThis.Game_Battler.prototype);

  battler.initMembers();
  battler._uuid = uuid;
  battler.getUuid = function()
  {
    return this._uuid;
  };
  battler._states = [];
  battler.isStateAffected = function(stateId)
  {
    return this._states.includes(stateId);
  };
  battler.isStateAddable = function()
  {
    return true;
  };
  battler.deathStateId = function()
  {
    return 1;
  };
  battler.removeState = vi.fn();
  battler.addState = vi.fn();
  battler.state = function(stateId)
  {
    return globalThis.$dataStates[stateId];
  };

  return battler;
}

/**
 * Builds a minimal map battler wrapper for {@link JABS_AiManager} mocks.
 * @param {object} gameBattler
 * @param {number} distance
 * @returns {object}
 */
function buildJabsBattler(gameBattler, distance)
{
  return {
    getBattler()
    {
      return gameBattler;
    },
    // slip/regen ticks now route through the map battler wrapper; spread tests don't assert
    // on slip application, but the carrier must expose this so ticking doesn't throw.
    processStateTick: vi.fn(),
    __distance: distance,
  };
}

describe('J-ABS state spread (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../src/plugins/_base/managers/RPGManager.js'));
    ({ default: globalThis.RPG_State } = await import('../../../../src/plugins/_base/database/implementations/RPG_State.js'));

    // patches globalThis.Game_Battler.prototype with getAllNotes()- abs's own Game_Battler.js
    // (below) and JABS_State construction both rely on this already being present.
    await import('../../../../src/plugins/_base/objects/Game_Battler.js');

    setPluginContextToJAbs();
    await import('../../../../src/plugins/abs/core/_metadata/initialization.js');

    // patches globalThis.Game_Battler.prototype directly, no vm involved.
    await import('../../../../src/plugins/abs/core/objects/Game_Battler.js');

    // patches globalThis.RPG_State.prototype with the spread tag getters under test.
    await import('../../../../src/plugins/abs/core/database/RPG_State.js');

    // real classes, not prototype patches.
    ({ default: globalThis.JABS_AiManager } = await import('../../../../src/plugins/abs/core/managers/JABS_AiManager.js'));
    ({ default: globalThis.JABS_State } = await import('../../../../src/plugins/abs/core/models/JABS_State.js'));
  });

  afterAll(() =>
  {
    delete globalThis.$jabsEngine;
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
    globalThis.$dataStates = [ null ];
    globalThis.$jabsEngine = {
      absEnabled: true,
      // JABS_State construction now resolves its own tick interval, which reads battler-wide
      // tick speed modifiers via Game_Battler#getAllNotes() -> #states() -> this stub.
      getJabsStatesByUuid: () => new Map(),
    };
    globalThis.RPGManager.chanceIn100 = globalThis.RPGManager.chanceIn100.bind(globalThis.RPGManager);
    vi.restoreAllMocks();
  });

  describe('RPG_State spread getters', () =>
  {
    it('parses spread, viral, spreadTick, spreadPerTick, spreadPreferUnafflicted, and spreadSkipAfflicted', () =>
    {
      // Arrange
      const row = registerStateRow(
        SPREAD_STATE_ID,
        '<spread:[40, 3]><viral><spreadTick:60><spreadPerTick:1><spreadPreferUnafflicted><spreadSkipAfflicted>',
      );

      // Act & Assert
      expect(row.jabsSpreadRule).toEqual({ chance: 40, range: 3 });
      expect(row.jabsViral).toBe(true);
      expect(row.jabsSpreadTickFrames).toBe(60);
      expect(row.jabsSpreadPerTick).toBe(1);
      expect(row.jabsSpreadPreferUnafflicted).toBe(true);
      expect(row.jabsSpreadSkipAfflicted).toBe(true);
    });
  });

  describe('JABS_State spread cadence', () =>
  {
    it('decrements the spread counter without addState when the state row has no spread tag', () =>
    {
      // Arrange
      registerStateRow(PLAIN_STATE_ID, '');
      const carrier = buildGameBattler('carrier');
      const source = buildGameBattler('source');
      const jabsState = new globalThis.JABS_State(carrier, PLAIN_STATE_ID, 0, 300, 1, source);

      // Act
      for (let frame = 0; frame < 30; frame++)
      {
        jabsState.update();
      }

      // Assert
      expect(carrier.addState).not.toHaveBeenCalled();
      expect(jabsState.getSpreadTickInterval()).toBe(30);
    });

    it('getSpreadTickInterval falls back to the metadata default when the state has no spreadTick tag', () =>
    {
      // Arrange
      registerStateRow(PLAIN_STATE_ID, '');
      const plain = new globalThis.JABS_State(buildGameBattler('a'), PLAIN_STATE_ID, 0, 60);

      // Act
      const result = plain.getSpreadTickInterval();

      // Assert
      expect(result).toBe(30);
    });

    it('getSpreadTickInterval reads an explicit spreadTick tag override', () =>
    {
      // Arrange
      registerStateRow(SPREAD_STATE_ID, '<spread:[50, 2]><spreadTick:60>');
      const spread = new globalThis.JABS_State(buildGameBattler('b'), SPREAD_STATE_ID, 0, 60);

      // Act
      const result = spread.getSpreadTickInterval();

      // Assert
      expect(result).toBe(60);
    });
  });

  describe('JABS_State handleSpreading', () =>
  {
    function setupSpreadPulse(options = {})
    {
      const {
        note = '<spread:[100, 5]>',
        alliedCandidates = [],
        viral = false,
        chanceResults = [ true ],
        spreadTickFrames = 0,
      } = options;

      const fullNote = spreadTickFrames > 0
        ? `${note}<spreadTick:${spreadTickFrames}>`
        : note;
      const viralNote = viral === true
        ? `${fullNote}<viral>`
        : fullNote;

      registerStateRow(SPREAD_STATE_ID, viralNote);

      const carrierGame = buildGameBattler('carrier');
      const sourceGame = buildGameBattler('source');
      const carrierJabs = {
        processStateTick: vi.fn(),
        getBattler()
        {
          return carrierGame;
        },
        distanceToDesignatedTarget(other)
        {
          return other.__distance;
        },
      };

      globalThis.JABS_AiManager.getBattlerByUuid = vi.fn(() => carrierJabs);
      globalThis.JABS_AiManager.getAlliedBattlersWithinRange = vi.fn(() => alliedCandidates);
      globalThis.JABS_AiManager.getAllBattlersWithinRangeSortedByDistance = vi.fn(() => alliedCandidates);

      let chanceIndex = 0;
      globalThis.RPGManager.chanceIn100 = vi.fn(() =>
      {
        const result = chanceResults[chanceIndex];
        chanceIndex++;
        return result ?? false;
      });

      const jabsState = new globalThis.JABS_State(
        carrierGame,
        SPREAD_STATE_ID,
        0,
        600,
        1,
        sourceGame,
      );

      const tickInterval = jabsState.getSpreadTickInterval();

      for (let frame = 0; frame < tickInterval; frame++)
      {
        jabsState.update();
      }

      return {
        jabsState,
        carrierGame,
        sourceGame,
        carrierJabs,
      };
    }

    it('calls addState(stateId, source) on a successful spread pulse', () =>
    {
      // Arrange
      const target = buildGameBattler('target');
      const jabsTarget = buildJabsBattler(target, 1);

      // Act
      setupSpreadPulse({ alliedCandidates: [ jabsTarget ] });

      // Assert
      expect(target.addState).toHaveBeenCalledWith(SPREAD_STATE_ID, expect.objectContaining({ _uuid: 'source' }));
    });

    it('uses source battler as attacker, not the afflicted carrier', () =>
    {
      // Arrange
      const target = buildGameBattler('target');
      const jabsTarget = buildJabsBattler(target, 1);

      // Act
      const { sourceGame, carrierGame } = setupSpreadPulse({ alliedCandidates: [ jabsTarget ] });

      // Assert
      expect(target.addState).toHaveBeenCalledWith(SPREAD_STATE_ID, sourceGame);
      expect(target.addState).not.toHaveBeenCalledWith(SPREAD_STATE_ID, carrierGame);
    });

    it('rolls chance independently per candidate', () =>
    {
      // Arrange
      const first = buildGameBattler('first');
      const second = buildGameBattler('second');
      const jabsFirst = buildJabsBattler(first, 1);
      const jabsSecond = buildJabsBattler(second, 2);

      // Act
      setupSpreadPulse({
        alliedCandidates: [ jabsFirst, jabsSecond ],
        chanceResults: [ false, true ],
      });

      // Assert
      expect(first.addState).not.toHaveBeenCalled();
      expect(second.addState).toHaveBeenCalledTimes(1);
      expect(globalThis.RPGManager.chanceIn100).toHaveBeenCalledTimes(2);
    });

    it('uses viral candidate pool when the state row has viral', () =>
    {
      // Arrange
      const target = buildGameBattler('target');
      const jabsTarget = buildJabsBattler(target, 1);

      // Act
      setupSpreadPulse({
        viral: true,
        alliedCandidates: [ jabsTarget ],
      });

      // Assert
      expect(globalThis.JABS_AiManager.getAllBattlersWithinRangeSortedByDistance).toHaveBeenCalled();
      expect(globalThis.JABS_AiManager.getAlliedBattlersWithinRange).not.toHaveBeenCalled();
    });

    it('honors spreadPerTick as a cap on successful spreads only', () =>
    {
      // Arrange
      registerStateRow(SPREAD_STATE_ID, '<spread:[100, 5]><spreadPerTick:1>');
      const first = buildGameBattler('first');
      const second = buildGameBattler('second');
      const third = buildGameBattler('third');
      const carrierGame = buildGameBattler('carrier');
      const sourceGame = buildGameBattler('source');
      const carrierJabs = {
        processStateTick: vi.fn(),
        getBattler()
        {
          return carrierGame;
        },
        distanceToDesignatedTarget(other)
        {
          return other.__distance;
        },
      };
      globalThis.JABS_AiManager.getBattlerByUuid = vi.fn(() => carrierJabs);
      globalThis.JABS_AiManager.getAlliedBattlersWithinRange = vi.fn(() => [
        buildJabsBattler(first, 1),
        buildJabsBattler(second, 2),
        buildJabsBattler(third, 3),
      ]);
      globalThis.RPGManager.chanceIn100 = vi.fn(() => true);
      const jabsState = new globalThis.JABS_State(carrierGame, SPREAD_STATE_ID, 0, 600, 1, sourceGame);

      // Act
      for (let frame = 0; frame < 30; frame++)
      {
        jabsState.update();
      }

      // Assert
      const spreadCalls = first.addState.mock.calls.length
        + second.addState.mock.calls.length
        + third.addState.mock.calls.length;
      expect(spreadCalls).toBe(1);
    });

    it('prefers unafflicted targets before reapplying on neighbors who already have this state', () =>
    {
      // Arrange
      registerStateRow(SPREAD_STATE_ID, '<spread:[100, 5]><spreadPerTick:1><spreadPreferUnafflicted>');
      const nearAfflicted = buildGameBattler('near');
      nearAfflicted._states = [ SPREAD_STATE_ID ];
      const farClean = buildGameBattler('far');
      const carrierGame = buildGameBattler('carrier');
      const sourceGame = buildGameBattler('source');
      const carrierJabs = {
        processStateTick: vi.fn(),
        getBattler()
        {
          return carrierGame;
        },
        distanceToDesignatedTarget(other)
        {
          return other.__distance;
        },
      };
      globalThis.JABS_AiManager.getBattlerByUuid = vi.fn(() => carrierJabs);
      globalThis.JABS_AiManager.getAlliedBattlersWithinRange = vi.fn(() => [
        buildJabsBattler(nearAfflicted, 1),
        buildJabsBattler(farClean, 5),
      ]);
      globalThis.RPGManager.chanceIn100 = vi.fn(() => true);
      const jabsState = new globalThis.JABS_State(carrierGame, SPREAD_STATE_ID, 0, 600, 1, sourceGame);

      // Act
      for (let frame = 0; frame < 30; frame++)
      {
        jabsState.update();
      }

      // Assert
      expect(farClean.addState).toHaveBeenCalled();
      expect(nearAfflicted.addState).not.toHaveBeenCalled();
    });

    it('skips spread onto battlers who already have this state when spreadSkipAfflicted is set', () =>
    {
      // Arrange
      registerStateRow(SPREAD_STATE_ID, '<spread:[100, 5]><spreadSkipAfflicted>');
      const afflicted = buildGameBattler('afflicted');
      afflicted._states = [ SPREAD_STATE_ID ];
      const carrierGame = buildGameBattler('carrier');
      const sourceGame = buildGameBattler('source');
      const carrierJabs = {
        processStateTick: vi.fn(),
        getBattler()
        {
          return carrierGame;
        },
        distanceToDesignatedTarget(other)
        {
          return other.__distance;
        },
      };
      globalThis.JABS_AiManager.getBattlerByUuid = vi.fn(() => carrierJabs);
      globalThis.JABS_AiManager.getAlliedBattlersWithinRange = vi.fn(() => [
        buildJabsBattler(afflicted, 1),
      ]);
      globalThis.RPGManager.chanceIn100 = vi.fn(() => true);
      const jabsState = new globalThis.JABS_State(carrierGame, SPREAD_STATE_ID, 0, 600, 1, sourceGame);

      // Act
      for (let frame = 0; frame < 30; frame++)
      {
        jabsState.update();
      }

      // Assert
      expect(afflicted.addState).not.toHaveBeenCalled();
      expect(globalThis.RPGManager.chanceIn100).not.toHaveBeenCalled();
    });
  });
});
//endregion plugins/abs/core/jabs-state-spread.test.js
