//region plugins/abs/ext/food/_component/food-chain-expiry.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../../_component/fixtures/install-abs-host-globals.js';
import { setPluginContextToJabsFood } from './fixtures/install-abs-food-host-globals.js';
import { installPluginManagerWithParams } from '../../../../../setup/install-plugin-manager-with-params.js';

/**
 * A food chain's phase, expiring into the next one.
 * @type {number}
 */
const FOOD_PHASE_STATE_ID = 251;

/**
 * The next phase of the same arc, typed as crowd control so a matching `<stateTypeResist>` weighs on it.
 * @type {number}
 */
const NEXT_PHASE_STATE_ID = 252;

/**
 * A state outside any food chain, carrying the very same expiry tag as the food chain's phase.
 * @type {number}
 */
const PLAIN_STATE_ID = 60;

/**
 * Registers a real RPG_State row whose note carries the given tags, one to a line, so the J-ABS expiry and type tags
 * and the J-ABS-Food chain tag all parse.
 * @param {number} stateId The id to register the row under.
 * @param {string[]} tags The tags the note carries.
 * @returns {object}
 */
function registerStateRow(stateId, tags)
{
  const row = Object.create(globalThis.RPG_State.prototype);

  row.id = stateId;
  row.note = tags.join('\n');
  row.meta = {};
  row.name = `State ${stateId}`;
  row.iconIndex = 0;

  // RPG_Base#original is a private field set only by the constructor, which Object.create() skips.
  row._original = function() { return this; };

  globalThis.$dataStates[stateId] = row;

  return row;
}

/**
 * Builds the battler a state expires on: a real Game_Battler-backed battler stacked against every roll a follow-up
 * could make. It resists every state completely through State Rate and crowd control by a quarter through
 * `<stateTypeResist>`, it is `<veryCursed>`, and it rolls in Accumulate Mode with three lucky rolls and two Encore
 * repeats, so any roll at all would land nothing- and a count read off the roll's machinery would be far more than one.
 * Vanilla's LUK and State Rate are not loaded in this realm, so both are given outright; every state is addable to it,
 * and its adds are recorded rather than performed.
 * @returns {object}
 */
function buildStackedBearer()
{
  const battler = Object.create(globalThis.Game_Battler.prototype);
  battler.initMembers();
  battler.getUuid = () => 'bearer';
  battler.luk = 50;
  battler.stateRate = () => 0;
  battler.__testNoteSources = [
    '<stateTypeResist:[cc, 25]>',
    '<veryCursed>',
    '<accumulate>',
    '<encoreRepeats:[2]>',
  ].map(note => ({ note }));
  battler.setPositiveRolls(3);
  battler.setNegativeRolls(0);
  battler.isStateAddable = () => true;
  battler.addState = vi.fn();

  return battler;
}

describe('J-ABS-Food food chain expiry (direct src import, the real J-ABS expiry and roll)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import(
      '../../../../../../src/plugins/_base/core/managers/RPGManager.js'));
    ({ default: globalThis.RPG_State } = await import(
      '../../../../../../src/plugins/_base/core/database/implementations/RPG_State.js'));

    // J-Base's Game_Battler.js lays down the state() accessor a battler reads its states through.
    await import('../../../../../../src/plugins/_base/core/objects/Game_BattlerBase.js');
    await import('../../../../../../src/plugins/_base/core/objects/Game_Battler.js');

    setPluginContextToJAbs();
    await import('../../../../../../src/plugins/abs/core/_metadata/initialization.js');

    // J-ABS's Game_Battler.js lays down the type resistance, lucky and cursed rolls, fate overrides, Accumulate Mode
    // and Encore the roll reads; its RPG_State.js lays down the expiry tag and the negative classifier.
    await import('../../../../../../src/plugins/abs/core/objects/Game_Battler.js');
    await import('../../../../../../src/plugins/abs/core/database/RPG_State.js');

    ({ default: globalThis.JABS_AiManager } = await import(
      '../../../../../../src/plugins/abs/core/managers/JABS_AiManager.js'));
    ({ default: globalThis.JABS_State } = await import('../../../../../../src/plugins/abs/core/models/JABS_State.js'));

    // J-ABS-Food's own bootstrap, its food chain tag on states, and its extension of the expiry's landing count.
    installPluginManagerWithParams(globalThis, 'J-ABS-FOOD', {});
    setPluginContextToJabsFood();
    await import('../../../../../../src/plugins/abs/ext/food/_metadata/initialization.js');
    await import('../../../../../../src/plugins/abs/ext/food/database/RPG_State.js');
    await import('../../../../../../src/plugins/abs/ext/food/models/JABS_State.js');
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
      getJabsStatesByUuid: () => new Map(),
    };

    // the arc's next phase, which both expiring states name at the same 40%.
    registerStateRow(NEXT_PHASE_STATE_ID, [ '<foodChain:protein>', '<type:cc>' ]);
  });

  it('lands a food chain\'s next phase exactly once, with no roll, whatever the bearer resists or its fate', () =>
  {
    // Arrange- the bearer ate the meal itself, so it is its own source: the roller whose fate would decide any roll.
    const expiryTag = `<applyStateOnExpire:[${NEXT_PHASE_STATE_ID}, 40]>`;
    registerStateRow(FOOD_PHASE_STATE_ID, [ '<foodChain:protein>', expiryTag ]);
    const bearer = buildStackedBearer();
    const jabsState = new globalThis.JABS_State(bearer, FOOD_PHASE_STATE_ID, 0, 50, 1);
    const procSpy = vi.spyOn(globalThis.RPGManager, 'resolveProcCount');

    // Act
    jabsState.handleApplyStateOnExpire();

    // Assert- nothing was rolled, and the next phase landed once, from the bearer, with no skill behind it.
    expect(procSpy).not.toHaveBeenCalled();
    expect(bearer.addState.mock.calls).toEqual([ [ NEXT_PHASE_STATE_ID, bearer, null ] ]);
    procSpy.mockRestore();
  });

  it('still rolls the same follow-up out of a state in no food chain, where it fails against the same bearer', () =>
  {
    // Arrange- the very same expiry tag and the very same bearer, on a state carrying no food chain type.
    registerStateRow(PLAIN_STATE_ID, [ `<applyStateOnExpire:[${NEXT_PHASE_STATE_ID}, 40]>` ]);
    const bearer = buildStackedBearer();
    const jabsState = new globalThis.JABS_State(bearer, PLAIN_STATE_ID, 0, 50, 1);
    const procSpy = vi.spyOn(globalThis.RPGManager, 'resolveProcCount');

    // Act
    jabsState.handleApplyStateOnExpire();

    // Assert- the roll ran: 40 x 0 x 0.75 is a chance of nothing, against the bearer's one chance plus its three lucky
    // rolls, counted once. it never landed.
    expect(procSpy.mock.calls).toEqual([ [ bearer, 0, 4, 0 ] ]);
    expect(bearer.addState).not.toHaveBeenCalled();
    procSpy.mockRestore();
  });
});
//endregion plugins/abs/ext/food/_component/food-chain-expiry.test.js