//region plugins/abs/core/jabs-state-stacking.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { clearRpgManagerCacheInVm } from '../../../setup/shipped-plugin-vm.js';
import { loadAbsPluginVm } from '../abs-vm.js';

const STATE_ID = 70;
const CONVERTED_STATE_ID = 71;

/**
 * Hydrates a state database row for stacking/duration tests.
 *
 * @param {object} sandbox
 * @param {number} stateId
 * @param {string} note
 * @returns {object}
 */
function registerStateRow(sandbox, stateId, note = '')
{
  const row = Object.create(sandbox.RPG_State.prototype);

  row.id = stateId;
  row.note = note;
  row.meta = {};
  row.name = `State ${stateId}`;
  row.iconIndex = 0;

  // RPG_Base#original is a private field set only via the constructor.
  // Objects created with Object.create() skip the constructor, so _original() would throw.
  row._original = function() { return this; };

  sandbox.$dataStates[stateId] = row;

  return row;
}

/**
 * Builds a minimal {@link Game_Battler} stand-in for stacking/duration tests.
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

describe('J-ABS state stacking (out/abs/J-ABS.js)', () =>
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
  });

  describe('duration-based stack decay (no <stackOnExpire>)', () =>
  {
    beforeEach(() =>
    {
      sandbox.$jabsEngine = {
        absEnabled: true,
        getJabsStatesByUuid: () => new Map(),
        checkStackConversion: vi.fn(),
      };
    });

    it('removes the state once its only stack is lost and duration is spent', () =>
    {
      registerStateRow(sandbox, STATE_ID, '');
      const battler = buildGameBattler(sandbox, 'carrier');
      battler._states = [ STATE_ID ];

      const jabsState = new sandbox.JABS_State(battler, STATE_ID, 0, 2, 1);

      jabsState.update();
      jabsState.update();

      expect(jabsState.stackCount).toBe(0);
      expect(battler.removeState).toHaveBeenCalledWith(STATE_ID);
      expect(jabsState.expired).toBe(true);
    });

    it('loses one stack and refreshes duration when stacks remain', () =>
    {
      registerStateRow(sandbox, STATE_ID, '');
      const battler = buildGameBattler(sandbox, 'carrier');

      const jabsState = new sandbox.JABS_State(battler, STATE_ID, 0, 2, 3);

      jabsState.update();
      jabsState.update();

      expect(jabsState.stackCount).toBe(2);
      expect(jabsState.duration).toBe(2);
      expect(battler.removeState).not.toHaveBeenCalled();
    });

    it('loses all stacks at once when <loseAllStacksAtOnce> is present', () =>
    {
      registerStateRow(sandbox, STATE_ID, '<loseAllStacksAtOnce>');
      const battler = buildGameBattler(sandbox, 'carrier');
      battler._states = [ STATE_ID ];

      const jabsState = new sandbox.JABS_State(battler, STATE_ID, 0, 2, 3);

      jabsState.update();
      jabsState.update();

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
      sandbox.$jabsEngine = {
        absEnabled: true,
        getJabsStatesByUuid: () => new Map(),
        checkStackConversion,
      };
    });

    it('gains exactly one stack per interval, not per frame', () =>
    {
      registerStateRow(sandbox, STATE_ID, '<stackOnExpire><stackMax:99>');
      const battler = buildGameBattler(sandbox, 'carrier');

      const duration = 10;
      const jabsState = new sandbox.JABS_State(battler, STATE_ID, 0, duration, 1);

      // run exactly one full interval's worth of frames- should gain exactly one stack.
      for (let frame = 0; frame < duration; frame++)
      {
        jabsState.update();
      }

      expect(jabsState.stackCount).toBe(2);

      // run a second full interval- should gain exactly one more, not a frame's worth.
      for (let frame = 0; frame < duration; frame++)
      {
        jabsState.update();
      }

      expect(jabsState.stackCount).toBe(3);
      expect(checkStackConversion).toHaveBeenCalledTimes(2);
    });

    it('never removes the state from the battler while self-accumulating', () =>
    {
      registerStateRow(sandbox, STATE_ID, '<stackOnExpire><stackMax:99>');
      const battler = buildGameBattler(sandbox, 'carrier');

      const duration = 5;
      const jabsState = new sandbox.JABS_State(battler, STATE_ID, 0, duration, 1);

      for (let frame = 0; frame < duration * 10; frame++)
      {
        jabsState.update();
      }

      expect(battler.removeState).not.toHaveBeenCalled();
      expect(jabsState.expired).toBe(false);
    });

    it('stops gaining stacks at the state stack cap but keeps ticking without runaway', () =>
    {
      registerStateRow(sandbox, STATE_ID, '<stackOnExpire><stackMax:2>');
      const battler = buildGameBattler(sandbox, 'carrier');

      const duration = 4;
      const jabsState = new sandbox.JABS_State(battler, STATE_ID, 0, duration, 1);

      // three full intervals: one to hit the cap, two more that would runaway if duration
      // ever got stuck at zero instead of being refreshed on every tick.
      for (let frame = 0; frame < duration * 3; frame++)
      {
        jabsState.update();
      }

      expect(jabsState.stackCount).toBe(2);
      expect(checkStackConversion).toHaveBeenCalledTimes(3);
    });
  });

  describe('external reapplication via JABS_Engine', () =>
  {
    let engine;

    beforeEach(() =>
    {
      sandbox.$jabsEngine = {
        absEnabled: true,
        getJabsStatesByUuid: () => new Map(),
        // applyStackGain() reaches for the global $jabsEngine directly, not `this`, so this
        // needs to live here rather than being spied on the local `engine` object below.
        checkStackConversion: vi.fn(),
      };

      // Object.create bypasses the constructor (which needs a fuller plugin-param/config
      // boot environment than this test cares about) while keeping all prototype methods.
      engine = Object.create(sandbox.JABS_Engine.prototype);
    });

    it('refreshJabsState resets duration to the newly-applied duration', () =>
    {
      registerStateRow(sandbox, STATE_ID, '');
      const battler = buildGameBattler(sandbox, 'carrier');

      const existing = new sandbox.JABS_State(battler, STATE_ID, 0, 1, 1);
      const incoming = new sandbox.JABS_State(battler, STATE_ID, 0, 300, 1);

      engine.refreshJabsState(existing, incoming);

      expect(existing.duration).toBe(300);
      expect(existing.expired).toBe(false);
    });

    it('extendJabsState adds duration up to the configured max', () =>
    {
      registerStateRow(sandbox, STATE_ID, '<stackExtendAmount:100><stackExtendMax:150>');
      const battler = buildGameBattler(sandbox, 'carrier');

      const existing = new sandbox.JABS_State(battler, STATE_ID, 0, 100, 1);
      const incoming = new sandbox.JABS_State(battler, STATE_ID, 0, 100, 1);

      engine.extendJabsState(existing, incoming);

      // 100 + 100 = 200, capped at 150.
      expect(existing.duration).toBe(150);
    });

    it('stackJabsState increments stacks, updates base duration, and rolls conversion', () =>
    {
      registerStateRow(sandbox, STATE_ID, '');
      const battler = buildGameBattler(sandbox, 'carrier');

      const existing = new sandbox.JABS_State(battler, STATE_ID, 0, 50, 1);
      const incoming = new sandbox.JABS_State(battler, STATE_ID, 0, 200, 2);

      engine.stackJabsState(existing, incoming);

      expect(existing.stackCount).toBe(3);
      expect(existing.baseDurationFrames).toBe(200);
      expect(existing.duration).toBe(200);
      expect(sandbox.$jabsEngine.checkStackConversion).toHaveBeenCalledWith(existing);
    });
  });

  describe('stack-conversion threshold (checkStackConversion)', () =>
  {
    let engine;

    beforeEach(() =>
    {
      sandbox.$jabsEngine = {
        absEnabled: true,
        getJabsStatesByUuid: () => new Map(),
      };

      // Object.create bypasses the constructor (which needs a fuller plugin-param/config
      // boot environment than this test cares about) while keeping all prototype methods.
      engine = Object.create(sandbox.JABS_Engine.prototype);
    });

    it('converts to the configured state once the stack threshold is reached', () =>
    {
      registerStateRow(sandbox, STATE_ID, `<stacksConvertToState:[${CONVERTED_STATE_ID}, 3]>`);
      registerStateRow(sandbox, CONVERTED_STATE_ID, '');
      const battler = buildGameBattler(sandbox, 'carrier');

      const jabsState = new sandbox.JABS_State(battler, STATE_ID, 0, 100, 3);

      engine.checkStackConversion(jabsState);

      expect(battler.addState).toHaveBeenCalledWith(CONVERTED_STATE_ID, battler);
    });

    it('does not convert before the stack threshold is reached', () =>
    {
      registerStateRow(sandbox, STATE_ID, `<stacksConvertToState:[${CONVERTED_STATE_ID}, 3]>`);
      registerStateRow(sandbox, CONVERTED_STATE_ID, '');
      const battler = buildGameBattler(sandbox, 'carrier');

      const jabsState = new sandbox.JABS_State(battler, STATE_ID, 0, 100, 2);

      engine.checkStackConversion(jabsState);

      expect(battler.addState).not.toHaveBeenCalled();
    });

    it('removes the source state on conversion when <removeOnConvert> is present', () =>
    {
      registerStateRow(
        sandbox,
        STATE_ID,
        `<stacksConvertToState:[${CONVERTED_STATE_ID}, 3]><removeOnConvert>`,
      );
      registerStateRow(sandbox, CONVERTED_STATE_ID, '');
      const battler = buildGameBattler(sandbox, 'carrier');

      const jabsState = new sandbox.JABS_State(battler, STATE_ID, 0, 100, 3);

      engine.checkStackConversion(jabsState);

      expect(battler.removeState).toHaveBeenCalledWith(STATE_ID);
      expect(jabsState.expired).toBe(true);
    });

    it('reaching the threshold via self-accumulation triggers conversion', () =>
    {
      registerStateRow(
        sandbox,
        STATE_ID,
        `<stackOnExpire><stackMax:99><stacksConvertToState:[${CONVERTED_STATE_ID}, 2]>`,
      );
      registerStateRow(sandbox, CONVERTED_STATE_ID, '');
      const battler = buildGameBattler(sandbox, 'carrier');

      sandbox.$jabsEngine.checkStackConversion = engine.checkStackConversion.bind(engine);

      const duration = 3;
      const jabsState = new sandbox.JABS_State(battler, STATE_ID, 0, duration, 1);

      // one interval takes it to 2 stacks, meeting the conversion threshold.
      for (let frame = 0; frame < duration; frame++)
      {
        jabsState.update();
      }

      expect(jabsState.stackCount).toBe(2);
      expect(battler.addState).toHaveBeenCalledWith(CONVERTED_STATE_ID, battler);
    });
  });
});
//endregion plugins/abs/core/jabs-state-stacking.test.js
