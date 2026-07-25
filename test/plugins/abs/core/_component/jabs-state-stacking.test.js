//region plugins/abs/core/_component/jabs-state-stacking.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

const STATE_ID = 70;
const CONVERTED_STATE_ID = 71;

/**
 * Hydrates a state database row for stacking/duration tests.
 * @param {number} stateId
 * @param {string} note
 * @returns {object}
 */
function registerStateRow(stateId, note = '')
{
  const row = Object.create(globalThis.RPG_State.prototype);

  row.id = stateId;
  row.note = note;
  row.meta = {};
  row.name = `State ${stateId}`;
  row.iconIndex = 0;

  // RPG_Base#original is a private field set only via the constructor.
  // Objects created with Object.create() skip the constructor, so _original() would throw.
  row._original = function() { return this; };

  globalThis.$dataStates[stateId] = row;

  return row;
}

/**
 * Builds a minimal {@link Game_Battler} stand-in for stacking/duration tests.
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

describe('J-ABS state stacking (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/managers/RPGManager.js'));
    ({ default: globalThis.RPG_State } = await import('../../../../../src/plugins/_base/database/implementations/RPG_State.js'));

    // patches globalThis.Game_Battler.prototype with setCachedTraitObjects/onBattlerDataChange, which
    // JABS_State's stack-gain path relies on already being present.
    await import('../../../../../src/plugins/_base/objects/Game_BattlerBase.js');
    await import('../../../../../src/plugins/_base/objects/Game_Battler.js');

    setPluginContextToJAbs();
    await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');

    await import('../../../../../src/plugins/abs/core/objects/Game_Battler.js');
    await import('../../../../../src/plugins/abs/core/database/RPG_State.js');

    ({ default: globalThis.JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js'));
    ({ default: globalThis.JABS_State } = await import('../../../../../src/plugins/abs/core/models/JABS_State.js'));
    ({ default: globalThis.JABS_Engine } = await import('../../../../../src/plugins/abs/core/managers/JABS_Engine.js'));
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
    globalThis.$dataStates = [ null ];
  });

  describe('duration-based stack decay (no <stackOnExpire>)', () =>
  {
    beforeEach(() =>
    {
      globalThis.$jabsEngine = {
        absEnabled: true,
        getJabsStatesByUuid: () => new Map(),
        checkStackConversion: vi.fn(),
      };
    });

    it('removes the state once its only stack is lost and duration is spent', () =>
    {
      // Arrange
      registerStateRow(STATE_ID, '');
      const battler = buildGameBattler('carrier');
      battler._states = [ STATE_ID ];
      const jabsState = new globalThis.JABS_State(battler, STATE_ID, 0, 2, 1);

      // Act
      jabsState.update();
      jabsState.update();

      // Assert
      expect(jabsState.stackCount).toBe(0);
      expect(battler.removeState).toHaveBeenCalledWith(STATE_ID);
      expect(jabsState.expired).toBe(true);
    });

    it('loses one stack and refreshes duration when stacks remain', () =>
    {
      // Arrange
      registerStateRow(STATE_ID, '');
      const battler = buildGameBattler('carrier');
      const jabsState = new globalThis.JABS_State(battler, STATE_ID, 0, 2, 3);

      // Act
      jabsState.update();
      jabsState.update();

      // Assert
      expect(jabsState.stackCount).toBe(2);
      expect(jabsState.duration).toBe(2);
      expect(battler.removeState).not.toHaveBeenCalled();
    });

    it('loses all stacks at once when <loseAllStacksAtOnce> is present', () =>
    {
      // Arrange
      registerStateRow(STATE_ID, '<loseAllStacksAtOnce>');
      const battler = buildGameBattler('carrier');
      battler._states = [ STATE_ID ];
      const jabsState = new globalThis.JABS_State(battler, STATE_ID, 0, 2, 3);

      // Act
      jabsState.update();
      jabsState.update();

      // Assert
      expect(jabsState.stackCount).toBe(0);
      expect(battler.removeState).toHaveBeenCalledWith(STATE_ID);
    });
  });

  describe('self-accumulating stacks via <stackOnExpire>', () =>
  {
    let checkStackConversion;

    beforeEach(() =>
    {
      checkStackConversion = vi.fn();
      globalThis.$jabsEngine = {
        absEnabled: true,
        getJabsStatesByUuid: () => new Map(),
        checkStackConversion,
      };
    });

    it('gains exactly one stack per interval, not per frame', () =>
    {
      // Arrange
      registerStateRow(STATE_ID, '<stackOnExpire><stackMax:99>');
      const battler = buildGameBattler('carrier');
      const duration = 10;
      const jabsState = new globalThis.JABS_State(battler, STATE_ID, 0, duration, 1);

      // Act- run exactly one full interval's worth of frames.
      for (let frame = 0; frame < duration; frame++)
      {
        jabsState.update();
      }

      // Assert
      expect(jabsState.stackCount).toBe(2);
    });

    it('gains exactly one more stack over a second full interval, not a frame\'s worth', () =>
    {
      // Arrange
      registerStateRow(STATE_ID, '<stackOnExpire><stackMax:99>');
      const battler = buildGameBattler('carrier');
      const duration = 10;
      const jabsState = new globalThis.JABS_State(battler, STATE_ID, 0, duration, 1);
      for (let frame = 0; frame < duration; frame++)
      {
        jabsState.update();
      }

      // Act
      for (let frame = 0; frame < duration; frame++)
      {
        jabsState.update();
      }

      // Assert
      expect(jabsState.stackCount).toBe(3);
      expect(checkStackConversion).toHaveBeenCalledTimes(2);
    });

    it('never removes the state from the battler while self-accumulating', () =>
    {
      // Arrange
      registerStateRow(STATE_ID, '<stackOnExpire><stackMax:99>');
      const battler = buildGameBattler('carrier');
      const duration = 5;
      const jabsState = new globalThis.JABS_State(battler, STATE_ID, 0, duration, 1);

      // Act
      for (let frame = 0; frame < duration * 10; frame++)
      {
        jabsState.update();
      }

      // Assert
      expect(battler.removeState).not.toHaveBeenCalled();
      expect(jabsState.expired).toBe(false);
    });

    it('stops gaining stacks at the state stack cap but keeps ticking without runaway', () =>
    {
      // Arrange- three full intervals: one to hit the cap, two more that would runaway if
      // duration ever got stuck at zero instead of being refreshed on every tick.
      registerStateRow(STATE_ID, '<stackOnExpire><stackMax:2>');
      const battler = buildGameBattler('carrier');
      const duration = 4;
      const jabsState = new globalThis.JABS_State(battler, STATE_ID, 0, duration, 1);

      // Act
      for (let frame = 0; frame < duration * 3; frame++)
      {
        jabsState.update();
      }

      // Assert
      expect(jabsState.stackCount).toBe(2);
      expect(checkStackConversion).toHaveBeenCalledTimes(3);
    });
  });

  describe('external reapplication via JABS_Engine', () =>
  {
    let engine;

    beforeEach(() =>
    {
      globalThis.$jabsEngine = {
        absEnabled: true,
        getJabsStatesByUuid: () => new Map(),
        // applyStackGain() reaches for the global $jabsEngine directly, not `this`, so this
        // needs to live here rather than being spied on the local `engine` object below.
        checkStackConversion: vi.fn(),
      };

      // Object.create bypasses the constructor (which needs a fuller plugin-param/config
      // boot environment than this test cares about) while keeping all prototype methods.
      engine = Object.create(globalThis.JABS_Engine.prototype);
    });

    it('refreshJabsState resets duration to the newly-applied duration', () =>
    {
      // Arrange
      registerStateRow(STATE_ID, '');
      const battler = buildGameBattler('carrier');
      const existing = new globalThis.JABS_State(battler, STATE_ID, 0, 1, 1);
      const incoming = new globalThis.JABS_State(battler, STATE_ID, 0, 300, 1);

      // Act
      engine.refreshJabsState(existing, incoming);

      // Assert
      expect(existing.duration).toBe(300);
      expect(existing.expired).toBe(false);
    });

    it('extendJabsState adds duration up to the configured max', () =>
    {
      // Arrange- 100 + 100 = 200, capped at 150.
      registerStateRow(STATE_ID, '<stackExtendAmount:100><stackExtendMax:150>');
      const battler = buildGameBattler('carrier');
      const existing = new globalThis.JABS_State(battler, STATE_ID, 0, 100, 1);
      const incoming = new globalThis.JABS_State(battler, STATE_ID, 0, 100, 1);

      // Act
      engine.extendJabsState(existing, incoming);

      // Assert
      expect(existing.duration).toBe(150);
    });

    it('stackJabsState increments stacks, updates base duration, and rolls conversion', () =>
    {
      // Arrange
      registerStateRow(STATE_ID, '');
      const battler = buildGameBattler('carrier');
      const existing = new globalThis.JABS_State(battler, STATE_ID, 0, 50, 1);
      const incoming = new globalThis.JABS_State(battler, STATE_ID, 0, 200, 2);

      // Act
      engine.stackJabsState(existing, incoming);

      // Assert
      expect(existing.stackCount).toBe(3);
      expect(existing.baseDurationFrames).toBe(200);
      expect(existing.duration).toBe(200);
      expect(globalThis.$jabsEngine.checkStackConversion).toHaveBeenCalledWith(existing);
    });
  });

  describe('stack cap boosts (stackMaxBoost / thisStackMaxBoost)', () =>
  {
    beforeEach(() =>
    {
      globalThis.$jabsEngine = {
        absEnabled: true,
        getJabsStatesByUuid: () => new Map(),
        checkStackConversion: vi.fn(),
      };
    });

    it('adds <thisStackMaxBoost:VAL> from the state\'s own note to the cap', () =>
    {
      // Arrange- base cap of 2, boosted by 4 from the state's own note, for a cap of 6.
      registerStateRow(STATE_ID, '<stackMax:2><thisStackMaxBoost:4>');
      const battler = buildGameBattler('carrier');
      const jabsState = new globalThis.JABS_State(battler, STATE_ID, 0, 100, 1);

      // Act
      jabsState.incrementStacks(10);

      // Assert
      expect(jabsState.stackCount).toBe(6);
    });

    it('adds <stackMaxBoost:VAL> summed from the source battler\'s note sources to the cap', () =>
    {
      // Arrange- base cap of 2, boosted by 3 from the caster's equipment/passives, for a cap of 5.
      registerStateRow(STATE_ID, '<stackMax:2>');
      const battler = buildGameBattler('carrier');
      battler.__testNoteSources = [ { note: '<stackMaxBoost:3>' } ];
      const jabsState = new globalThis.JABS_State(battler, STATE_ID, 0, 100, 1);

      // Act
      jabsState.incrementStacks(10);

      // Assert
      expect(jabsState.stackCount).toBe(5);
    });

    it('combines <thisStackMaxBoost:VAL> and <stackMaxBoost:VAL> additively', () =>
    {
      // Arrange- base cap of 2, +1 from the state's own note, +2 from the caster's sources, for 5.
      registerStateRow(STATE_ID, '<stackMax:2><thisStackMaxBoost:1>');
      const battler = buildGameBattler('carrier');
      battler.__testNoteSources = [ { note: '<stackMaxBoost:2>' } ];
      const jabsState = new globalThis.JABS_State(battler, STATE_ID, 0, 100, 1);

      // Act
      jabsState.incrementStacks(10);

      // Assert
      expect(jabsState.stackCount).toBe(5);
    });

    it('leaves the cap at its base value when neither boost tag is present', () =>
    {
      // Arrange- no boost tags anywhere, so the cap stays at the state's own <stackMax:2>.
      registerStateRow(STATE_ID, '<stackMax:2>');
      const battler = buildGameBattler('carrier');
      battler.__testNoteSources = [];
      const jabsState = new globalThis.JABS_State(battler, STATE_ID, 0, 100, 1);

      // Act
      jabsState.incrementStacks(10);

      // Assert
      expect(jabsState.stackCount).toBe(2);
    });
  });

  describe('stack-conversion threshold (checkStackConversion)', () =>
  {
    let engine;

    beforeEach(() =>
    {
      globalThis.$jabsEngine = {
        absEnabled: true,
        getJabsStatesByUuid: () => new Map(),
      };

      // Object.create bypasses the constructor (which needs a fuller plugin-param/config
      // boot environment than this test cares about) while keeping all prototype methods.
      engine = Object.create(globalThis.JABS_Engine.prototype);
    });

    it('converts to the configured state once the stack threshold is reached', () =>
    {
      // Arrange
      registerStateRow(STATE_ID, `<stacksConvertToState:[${CONVERTED_STATE_ID}, 3]>`);
      registerStateRow(CONVERTED_STATE_ID, '');
      const battler = buildGameBattler('carrier');
      const jabsState = new globalThis.JABS_State(battler, STATE_ID, 0, 100, 3);

      // Act
      engine.checkStackConversion(jabsState);

      // Assert
      expect(battler.addState).toHaveBeenCalledWith(CONVERTED_STATE_ID, battler, null);
    });

    it('does not convert before the stack threshold is reached', () =>
    {
      // Arrange
      registerStateRow(STATE_ID, `<stacksConvertToState:[${CONVERTED_STATE_ID}, 3]>`);
      registerStateRow(CONVERTED_STATE_ID, '');
      const battler = buildGameBattler('carrier');
      const jabsState = new globalThis.JABS_State(battler, STATE_ID, 0, 100, 2);

      // Act
      engine.checkStackConversion(jabsState);

      // Assert
      expect(battler.addState).not.toHaveBeenCalled();
    });

    it('removes the source state on conversion when <removeOnConvert> is present', () =>
    {
      // Arrange
      registerStateRow(STATE_ID, `<stacksConvertToState:[${CONVERTED_STATE_ID}, 3]><removeOnConvert>`);
      registerStateRow(CONVERTED_STATE_ID, '');
      const battler = buildGameBattler('carrier');
      const jabsState = new globalThis.JABS_State(battler, STATE_ID, 0, 100, 3);

      // Act
      engine.checkStackConversion(jabsState);

      // Assert
      expect(battler.removeState).toHaveBeenCalledWith(STATE_ID);
      expect(jabsState.expired).toBe(true);
    });

    it('reaching the threshold via self-accumulation triggers conversion', () =>
    {
      // Arrange- one interval takes it to 2 stacks, meeting the conversion threshold.
      registerStateRow(
        STATE_ID,
        `<stackOnExpire><stackMax:99><stacksConvertToState:[${CONVERTED_STATE_ID}, 2]>`,
      );
      registerStateRow(CONVERTED_STATE_ID, '');
      const battler = buildGameBattler('carrier');
      globalThis.$jabsEngine.checkStackConversion = engine.checkStackConversion.bind(engine);
      const duration = 3;
      const jabsState = new globalThis.JABS_State(battler, STATE_ID, 0, duration, 1);

      // Act
      for (let frame = 0; frame < duration; frame++)
      {
        jabsState.update();
      }

      // Assert
      expect(jabsState.stackCount).toBe(2);
      expect(battler.addState).toHaveBeenCalledWith(CONVERTED_STATE_ID, battler, null);
    });
  });
});
//endregion plugins/abs/core/_component/jabs-state-stacking.test.js
