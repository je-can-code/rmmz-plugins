//region plugins/abs/core/_component/jabs-state-map-duration.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

/**
 * Hydrates a state database row for map-duration getter tests.
 * @param {number} stateId
 * @param {string} note
 * @param {object} [fields]
 * @returns {object}
 */
function registerStateRow(stateId, note, fields = {})
{
  const row = Object.create(globalThis.RPG_State.prototype);

  row.id = stateId;
  row.note = note;
  row.meta = {};
  row.name = `State ${stateId}`;
  row.iconIndex = 0;
  row.removeByWalking = false;
  row.stepsToRemove = 0;
  Object.assign(row, fields);

  globalThis.$dataStates[stateId] = row;

  return row;
}

/**
 * Builds a minimal {@link Game_Battler} for {@link Game_Battler#addJabsState} tests.
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
  battler.getStateDurationBoost = function()
  {
    return 0;
  };

  return battler;
}

describe('J-ABS map state duration (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/managers/RPGManager.js'));
    ({ default: globalThis.RPG_State } = await import('../../../../../src/plugins/_base/database/implementations/RPG_State.js'));

    // patches globalThis.Game_Battler.prototype with getAllNotes()- abs's own Game_Battler.js
    // (below) relies on this already being present, same as the shipped script concatenation order.
    await import('../../../../../src/plugins/_base/objects/Game_Battler.js');

    setPluginContextToJAbs();
    await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');

    // patches globalThis.Game_Battler.prototype directly, no vm involved.
    await import('../../../../../src/plugins/abs/core/objects/Game_Battler.js');

    // patches globalThis.RPG_State.prototype with the map-duration getters under test.
    await import('../../../../../src/plugins/abs/core/database/RPG_State.js');
  });

  beforeEach(() =>
  {
    globalThis.$dataStates = [ null ];
    globalThis.RPGManager.clearCache();
    globalThis.$jabsEngine = {
      addOrUpdateStateByUuid: vi.fn(),
      // JABS_State construction now resolves its own tick interval, which reads battler-wide
      // tick speed modifiers via Game_Battler#getAllNotes() -> #states() -> this stub.
      getJabsStatesByUuid: () => new Map(),
    };
  });

  afterAll(() =>
  {
    delete globalThis.$jabsEngine;
  });

  describe('RPG_State map-timer getters', () =>
  {
    it('jabsStateHasMapTimer is true for a stateDuration tag without removeByWalking', () =>
    {
      // Arrange
      const row = registerStateRow(10, '<stateDuration:300>', {
        removeByWalking: false,
        stepsToRemove: 300,
      });

      // Act
      const result = row.jabsStateHasMapTimer;

      // Assert
      expect(result).toBe(true);
    });

    it('jabsIndefiniteState is false when the state carries no <indefiniteState> tag', () =>
    {
      // Arrange
      const row = registerStateRow(10, '<stateDuration:300>', {
        removeByWalking: false,
        stepsToRemove: 300,
      });

      // Act
      const result = row.jabsIndefiniteState === true;

      // Assert
      expect(result).toBe(false);
    });

    it('jabsStateDurationFrames reads the tagged stateDuration value', () =>
    {
      // Arrange
      const row = registerStateRow(10, '<stateDuration:300>', {
        removeByWalking: false,
        stepsToRemove: 300,
      });

      // Act
      const result = row.jabsStateDurationFrames;

      // Assert
      expect(result).toBe(300);
    });

    it('jabsIndefiniteState is true when the state carries <indefiniteState>', () =>
    {
      // Arrange
      const row = registerStateRow(11, '<indefiniteState>\n<stateDuration:300>');

      // Act
      const result = row.jabsIndefiniteState;

      // Assert
      expect(result).toBe(true);
    });

    it('jabsStateHasMapTimer is false when indefiniteState is set', () =>
    {
      // Arrange
      const row = registerStateRow(11, '<indefiniteState>\n<stateDuration:300>');

      // Act
      const result = row.jabsStateHasMapTimer;

      // Assert
      expect(result).toBe(false);
    });

    it('jabsStateHasMapTimer is false when only the legacy MZ stepsToRemove field is set', () =>
    {
      // Arrange
      const row = registerStateRow(12, '', {
        removeByWalking: true,
        stepsToRemove: 240,
      });

      // Act
      const result = row.jabsStateHasMapTimer;

      // Assert
      expect(result).toBe(false);
    });

    it('jabsStateDurationFrames falls back to the legacy MZ stepsToRemove field when untagged', () =>
    {
      // Arrange
      const row = registerStateRow(12, '', {
        removeByWalking: true,
        stepsToRemove: 240,
      });

      // Act
      const result = row.jabsStateDurationFrames;

      // Assert
      expect(result).toBe(240);
    });

    it('jabsThisStateDurationBoost adds flat frames from its own thisStateDurationFlat tag', () =>
    {
      // Arrange
      const row = registerStateRow(13, '<thisStateDurationFlat:30>');

      // Act
      const result = row.jabsThisStateDurationBoost(100);

      // Assert
      expect(result).toBe(30);
    });

    it('jabsThisStateDurationBoost adds a percent-of-base bonus from its own thisStateDurationPerc tag', () =>
    {
      // Arrange
      const row = registerStateRow(14, '<thisStateDurationPerc:100>');

      // Act
      const result = row.jabsThisStateDurationBoost(100);

      // Assert
      expect(result).toBe(100);
    });

    it('jabsThisStateDurationBoost adds a formula-driven bonus from its own thisStateDurationFormula tag', () =>
    {
      // Arrange
      const row = registerStateRow(15, '<thisStateDurationFormula:[b * 0.5]>');

      // Act
      const result = row.jabsThisStateDurationBoost(100);

      // Assert
      expect(result).toBe(50);
    });

    it('jabsThisStateDurationBoost is zero when the state carries no thisStateDuration tags', () =>
    {
      // Arrange
      const row = registerStateRow(16, '<stateDuration:100>');

      // Act
      const result = row.jabsThisStateDurationBoost(100);

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('Game_Battler.addJabsState', () =>
  {
    it('applies the finite duration from a stateDuration tag without removeByWalking', () =>
    {
      // Arrange
      registerStateRow(20, '<stateDuration:120>', {
        removeByWalking: false,
        stepsToRemove: 120,
      });
      const battler = buildGameBattler('test-uuid');

      // Act
      battler.addJabsState(20, battler);

      // Assert
      expect(globalThis.$jabsEngine.addOrUpdateStateByUuid).toHaveBeenCalledTimes(1);
      const [ [ , jabsState ] ] = globalThis.$jabsEngine.addOrUpdateStateByUuid.mock.calls;
      expect(jabsState.duration).toBe(120);
    });

    it('sets an eternal duration when indefiniteState is present', () =>
    {
      // Arrange
      registerStateRow(21, '<indefiniteState>\n<stateDuration:999>');
      const battler = buildGameBattler('test-uuid-2');

      // Act
      battler.addJabsState(21, battler);

      // Assert
      const [ [ , jabsState ] ] = globalThis.$jabsEngine.addOrUpdateStateByUuid.mock.calls;
      expect(jabsState.duration).toBe(-1);
    });

    it('sets an eternal duration when no map-duration tags exist', () =>
    {
      // Arrange
      registerStateRow(22, '<negative>', {
        removeByWalking: false,
        stepsToRemove: 100,
      });
      const battler = buildGameBattler('test-uuid-3');

      // Act
      battler.addJabsState(22, battler);

      // Assert
      const [ [ , jabsState ] ] = globalThis.$jabsEngine.addOrUpdateStateByUuid.mock.calls;
      expect(jabsState.duration).toBe(-1);
    });

    it('doubles the outgoing duration when the state carries its own thisStateDurationPerc tag', () =>
    {
      // Arrange
      registerStateRow(23, '<stateDuration:100>\n<thisStateDurationPerc:100>', {
        removeByWalking: false,
        stepsToRemove: 100,
      });
      const battler = buildGameBattler('test-uuid-4');

      // Act
      battler.addJabsState(23, battler);

      // Assert
      const [ [ , jabsState ] ] = globalThis.$jabsEngine.addOrUpdateStateByUuid.mock.calls;
      expect(jabsState.duration).toBe(200);
    });
  });

  describe('Game_Battler.addJabsState with JABS_StateOverrides', () =>
  {
    /**
     * Builds a minimal overrides stand-in; only duration/stacks matter here.
     * @param {number|null} duration
     * @param {number|null} stacks
     * @returns {{duration: number|null, stacks: number|null}}
     */
    function buildOverrides(duration = null, stacks = null)
    {
      return { duration, stacks };
    }

    it('a -1 override duration forces eternal despite a finite stateDuration tag', () =>
    {
      // Arrange
      registerStateRow(30, '<stateDuration:120>', {
        removeByWalking: false,
        stepsToRemove: 120,
      });
      const battler = buildGameBattler('test-uuid-override-eternal');

      // Act
      battler.addJabsState(30, battler, buildOverrides(-1));

      // Assert
      const [ [ , jabsState ] ] = globalThis.$jabsEngine.addOrUpdateStateByUuid.mock.calls;
      expect(jabsState.duration).toBe(-1);
    });

    it('a positive override duration forces a finite duration despite an indefiniteState tag', () =>
    {
      // Arrange
      registerStateRow(31, '<indefiniteState>\n<stateDuration:999>');
      const battler = buildGameBattler('test-uuid-override-finite');

      // Act
      battler.addJabsState(31, battler, buildOverrides(240));

      // Assert
      const [ [ , jabsState ] ] = globalThis.$jabsEngine.addOrUpdateStateByUuid.mock.calls;
      expect(jabsState.duration).toBe(240);
    });

    it('a 0 override duration is treated as "no override" and defers to the state\'s own finite tag', () =>
    {
      // Arrange
      registerStateRow(32, '<stateDuration:150>', {
        removeByWalking: false,
        stepsToRemove: 150,
      });
      const battler = buildGameBattler('test-uuid-override-zero-finite');

      // Act
      battler.addJabsState(32, battler, buildOverrides(0));

      // Assert
      const [ [ , jabsState ] ] = globalThis.$jabsEngine.addOrUpdateStateByUuid.mock.calls;
      expect(jabsState.duration).toBe(150);
    });

    it('a 0 override duration is treated as "no override" and defers to the state\'s own indefiniteState tag', () =>
    {
      // Arrange
      registerStateRow(33, '<indefiniteState>\n<stateDuration:999>');
      const battler = buildGameBattler('test-uuid-override-zero-indefinite');

      // Act
      battler.addJabsState(33, battler, buildOverrides(0));

      // Assert
      const [ [ , jabsState ] ] = globalThis.$jabsEngine.addOrUpdateStateByUuid.mock.calls;
      expect(jabsState.duration).toBe(-1);
    });

    it('a positive override duration still layers the attacker\'s state-scoped duration boost on top', () =>
    {
      // Arrange
      registerStateRow(34, '<indefiniteState>\n<thisStateDurationPerc:100>');
      const battler = buildGameBattler('test-uuid-override-boost');

      // Act
      battler.addJabsState(34, battler, buildOverrides(100));

      // Assert
      const [ [ , jabsState ] ] = globalThis.$jabsEngine.addOrUpdateStateByUuid.mock.calls;
      expect(jabsState.duration).toBe(200);
    });

    it('an override stacks value wins over the state\'s own jabsStateStacksApplied default', () =>
    {
      // Arrange
      registerStateRow(35, '<stateDuration:100>', {
        removeByWalking: false,
        stepsToRemove: 100,
      });
      const battler = buildGameBattler('test-uuid-override-stacks');

      // Act
      battler.addJabsState(35, battler, buildOverrides(0, 5));

      // Assert
      const [ [ , jabsState ] ] = globalThis.$jabsEngine.addOrUpdateStateByUuid.mock.calls;
      expect(jabsState.stackCount).toBe(5);
    });
  });
});
//endregion plugins/abs/core/_component/jabs-state-map-duration.test.js
