//region plugins/abs/core/jabs-state-spread.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { clearRpgManagerCacheInVm } from '../../../setup/shipped-plugin-vm.js';
import { loadAbsPluginVm } from '../abs-vm.js';

const SPREAD_STATE_ID = 50;
const PLAIN_STATE_ID = 51;

/**
 * Hydrates a state database row for spread tag parsing tests.
 *
 * @param {object} sandbox
 * @param {number} stateId
 * @param {string} note
 * @returns {object}
 */
function registerStateRow(sandbox, stateId, note)
{
  const row = Object.create(sandbox.RPG_State.prototype);

  row.id = stateId;
  row.note = note;
  row.meta = {};
  row.name = `State ${stateId}`;
  row.iconIndex = 0;

  // RPG_Base#original is a private field set only via the constructor.
  // Objects created with Object.create() skip the constructor, so _original() would throw.
  // Shadow it at the instance level so RPGManager's cache key resolves to this mock object.
  row._original = function() { return this; };

  sandbox.$dataStates[stateId] = row;

  return row;
}

/**
 * Builds a minimal {@link Game_Battler} stand-in for spread tests.
 *
 * @param {object} sandbox
 * @param {string} uuid
 * @returns {object}
 */
function buildGameBattler(sandbox, uuid)
{
  const battler = Object.create(sandbox.Game_Battler.prototype);

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
    return sandbox.$dataStates[stateId];
  };

  return battler;
}

/**
 * Builds a minimal map battler wrapper for {@link JABS_AiManager} mocks.
 *
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
    __distance: distance,
  };
}

describe('J-ABS state spread (out/abs/J-ABS.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadAbsPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  beforeEach(() =>
  {
    clearRpgManagerCacheInVm(sandbox);
    sandbox.$dataStates = [ null ];
    sandbox.$jabsEngine = { absEnabled: true };
    sandbox.RPGManager.chanceIn100 = sandbox.RPGManager.chanceIn100.bind(sandbox.RPGManager);
    vi.restoreAllMocks();
  });

  describe('RPG_State spread getters', () =>
  {
    it('parses spread, viral, spreadTick, spreadPerTick, spreadPreferUnafflicted, and spreadSkipAfflicted', () =>
    {
      const row = registerStateRow(
        sandbox,
        SPREAD_STATE_ID,
        '<spread:[40, 3]><viral><spreadTick:60><spreadPerTick:1><spreadPreferUnafflicted><spreadSkipAfflicted>',
      );

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
      registerStateRow(sandbox, PLAIN_STATE_ID, '');
      const carrier = buildGameBattler(sandbox, 'carrier');
      const source = buildGameBattler(sandbox, 'source');
      const jabsState = new sandbox.JABS_State(carrier, PLAIN_STATE_ID, 0, 300, 1, source);

      for (let frame = 0; frame < 30; frame++)
      {
        jabsState.update();
      }

      expect(carrier.addState).not.toHaveBeenCalled();
      expect(jabsState.getSpreadTickInterval()).toBe(30);
    });

    it('getSpreadTickInterval respects metadata default vs spreadTick tag', () =>
    {
      registerStateRow(sandbox, PLAIN_STATE_ID, '');
      registerStateRow(sandbox, SPREAD_STATE_ID, '<spread:[50, 2]><spreadTick:60>');

      const plain = new sandbox.JABS_State(
        buildGameBattler(sandbox, 'a'),
        PLAIN_STATE_ID,
        0,
        60,
      );
      const spread = new sandbox.JABS_State(
        buildGameBattler(sandbox, 'b'),
        SPREAD_STATE_ID,
        0,
        60,
      );

      expect(plain.getSpreadTickInterval()).toBe(30);
      expect(spread.getSpreadTickInterval()).toBe(60);
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

      registerStateRow(sandbox, SPREAD_STATE_ID, viralNote);

      const carrierGame = buildGameBattler(sandbox, 'carrier');
      const sourceGame = buildGameBattler(sandbox, 'source');
      const carrierJabs = {
        getBattler()
        {
          return carrierGame;
        },
        distanceToDesignatedTarget(other)
        {
          return other.__distance;
        },
      };

      sandbox.JABS_AiManager.getBattlerByUuid = vi.fn(() => carrierJabs);
      sandbox.JABS_AiManager.getAlliedBattlersWithinRange = vi.fn(() => alliedCandidates);
      sandbox.JABS_AiManager.getAllBattlersWithinRangeSortedByDistance = vi.fn(() => alliedCandidates);

      let chanceIndex = 0;
      sandbox.RPGManager.chanceIn100 = vi.fn(() =>
      {
        const result = chanceResults[chanceIndex];
        chanceIndex++;
        return result ?? false;
      });

      const jabsState = new sandbox.JABS_State(
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
      const target = buildGameBattler(sandbox, 'target');
      const jabsTarget = buildJabsBattler(target, 1);

      setupSpreadPulse({ alliedCandidates: [ jabsTarget ] });

      expect(target.addState).toHaveBeenCalledWith(SPREAD_STATE_ID, expect.objectContaining({ _uuid: 'source' }));
    });

    it('uses source battler as attacker, not the afflicted carrier', () =>
    {
      const target = buildGameBattler(sandbox, 'target');
      const jabsTarget = buildJabsBattler(target, 1);
      const { sourceGame, carrierGame } = setupSpreadPulse({ alliedCandidates: [ jabsTarget ] });

      expect(target.addState).toHaveBeenCalledWith(SPREAD_STATE_ID, sourceGame);
      expect(target.addState).not.toHaveBeenCalledWith(SPREAD_STATE_ID, carrierGame);
    });

    it('rolls chance independently per candidate', () =>
    {
      const first = buildGameBattler(sandbox, 'first');
      const second = buildGameBattler(sandbox, 'second');
      const jabsFirst = buildJabsBattler(first, 1);
      const jabsSecond = buildJabsBattler(second, 2);

      setupSpreadPulse({
        alliedCandidates: [ jabsFirst, jabsSecond ],
        chanceResults: [ false, true ],
      });

      expect(first.addState).not.toHaveBeenCalled();
      expect(second.addState).toHaveBeenCalledTimes(1);
      expect(sandbox.RPGManager.chanceIn100).toHaveBeenCalledTimes(2);
    });

    it('uses viral candidate pool when the state row has viral', () =>
    {
      const target = buildGameBattler(sandbox, 'target');
      const jabsTarget = buildJabsBattler(target, 1);

      setupSpreadPulse({
        viral: true,
        alliedCandidates: [ jabsTarget ],
      });

      expect(sandbox.JABS_AiManager.getAllBattlersWithinRangeSortedByDistance).toHaveBeenCalled();
      expect(sandbox.JABS_AiManager.getAlliedBattlersWithinRange).not.toHaveBeenCalled();
    });

    it('honors spreadPerTick as a cap on successful spreads only', () =>
    {
      registerStateRow(
        sandbox,
        SPREAD_STATE_ID,
        '<spread:[100, 5]><spreadPerTick:1>',
      );

      const first = buildGameBattler(sandbox, 'first');
      const second = buildGameBattler(sandbox, 'second');
      const third = buildGameBattler(sandbox, 'third');
      const carrierGame = buildGameBattler(sandbox, 'carrier');
      const sourceGame = buildGameBattler(sandbox, 'source');
      const carrierJabs = {
        getBattler()
        {
          return carrierGame;
        },
        distanceToDesignatedTarget(other)
        {
          return other.__distance;
        },
      };

      sandbox.JABS_AiManager.getBattlerByUuid = vi.fn(() => carrierJabs);
      sandbox.JABS_AiManager.getAlliedBattlersWithinRange = vi.fn(() => [
        buildJabsBattler(first, 1),
        buildJabsBattler(second, 2),
        buildJabsBattler(third, 3),
      ]);
      sandbox.RPGManager.chanceIn100 = vi.fn(() => true);

      const jabsState = new sandbox.JABS_State(
        carrierGame,
        SPREAD_STATE_ID,
        0,
        600,
        1,
        sourceGame,
      );

      for (let frame = 0; frame < 30; frame++)
      {
        jabsState.update();
      }

      const spreadCalls = first.addState.mock.calls.length
        + second.addState.mock.calls.length
        + third.addState.mock.calls.length;

      expect(spreadCalls).toBe(1);
    });

    it('prefers unafflicted targets before reapplying on neighbors who already have this state', () =>
    {
      registerStateRow(
        sandbox,
        SPREAD_STATE_ID,
        '<spread:[100, 5]><spreadPerTick:1><spreadPreferUnafflicted>',
      );

      const nearAfflicted = buildGameBattler(sandbox, 'near');
      nearAfflicted._states = [ SPREAD_STATE_ID ];
      const farClean = buildGameBattler(sandbox, 'far');
      const carrierGame = buildGameBattler(sandbox, 'carrier');
      const sourceGame = buildGameBattler(sandbox, 'source');
      const carrierJabs = {
        getBattler()
        {
          return carrierGame;
        },
        distanceToDesignatedTarget(other)
        {
          return other.__distance;
        },
      };

      sandbox.JABS_AiManager.getBattlerByUuid = vi.fn(() => carrierJabs);
      sandbox.JABS_AiManager.getAlliedBattlersWithinRange = vi.fn(() => [
        buildJabsBattler(nearAfflicted, 1),
        buildJabsBattler(farClean, 5),
      ]);
      sandbox.RPGManager.chanceIn100 = vi.fn(() => true);

      const jabsState = new sandbox.JABS_State(
        carrierGame,
        SPREAD_STATE_ID,
        0,
        600,
        1,
        sourceGame,
      );

      for (let frame = 0; frame < 30; frame++)
      {
        jabsState.update();
      }

      expect(farClean.addState).toHaveBeenCalled();
      expect(nearAfflicted.addState).not.toHaveBeenCalled();
    });

    it('skips spread onto battlers who already have this state when spreadSkipAfflicted is set', () =>
    {
      registerStateRow(
        sandbox,
        SPREAD_STATE_ID,
        '<spread:[100, 5]><spreadSkipAfflicted>',
      );

      const afflicted = buildGameBattler(sandbox, 'afflicted');
      afflicted._states = [ SPREAD_STATE_ID ];
      const carrierGame = buildGameBattler(sandbox, 'carrier');
      const sourceGame = buildGameBattler(sandbox, 'source');
      const carrierJabs = {
        getBattler()
        {
          return carrierGame;
        },
        distanceToDesignatedTarget(other)
        {
          return other.__distance;
        },
      };

      sandbox.JABS_AiManager.getBattlerByUuid = vi.fn(() => carrierJabs);
      sandbox.JABS_AiManager.getAlliedBattlersWithinRange = vi.fn(() => [
        buildJabsBattler(afflicted, 1),
      ]);
      sandbox.RPGManager.chanceIn100 = vi.fn(() => true);

      const jabsState = new sandbox.JABS_State(
        carrierGame,
        SPREAD_STATE_ID,
        0,
        600,
        1,
        sourceGame,
      );

      for (let frame = 0; frame < 30; frame++)
      {
        jabsState.update();
      }

      expect(afflicted.addState).not.toHaveBeenCalled();
      expect(sandbox.RPGManager.chanceIn100).not.toHaveBeenCalled();
    });
  });
});
//endregion plugins/abs/core/jabs-state-spread.test.js
