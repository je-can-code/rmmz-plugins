//region plugins/abs/core/_component/game-battler-death-reentry-real-engine.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';
import { installRealRmmzEngine } from '../../../../setup/rmmz-engine-loader.js';

/**
 * The death state, as vanilla numbers it.
 * @type {number}
 */
const DEATH_STATE_ID = 1;

/**
 * The two ordinary states the dying battler carries. Two rather than one, because the defect this
 * file guards against costs one extra death per tracked state- with a single state, "one extra" and
 * "one per state" are the same number and no assertion could tell them apart.
 * @type {number[]}
 */
const TRACKED_STATE_IDS = [ 5, 6 ];

/**
 * Builds a state row carrying everything the real engine and J-ABS read off one on the way to a death:
 * traits and turn counts for vanilla, the type classifiers for J-ABS's immunity gate.
 * @param {number} id The state id.
 * @returns {object}
 */
function buildStateRow(id)
{
  return {
    id,
    name: `state-${id}`,
    note: String.empty,
    traits: [],
    restriction: 0,
    priority: 50,
    minTurns: 1,
    maxTurns: 1,
    removeByRestriction: false,
    isNegativeType: () => false,
    types: () => [],
  };
}

/**
 * Proves, against the real RMMZ engine, that a battler dies exactly once.
 *
 * Vanilla `addNewState` calls `die()` before it records the death state, `die()` clears states, and
 * J-ABS's `clearStates` hands each tracked state to `removeState`, whose vanilla body ends in
 * `refresh()`. Inside that window the battler has no hp and no death state, so an unguarded refresh
 * re-adds the death state and re-enters `die()`. That ordering lives only in the engine's own source,
 * which is why this file runs the engine rather than a hand-written stand-in for it: a stub would
 * have to reimplement the very ordering under test, and could only ever agree with itself.
 */
describe('J-ABS clearStates during death (real engine)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    // the host globals J-Base and J-ABS read at import time.
    installAbsHostGlobals();

    // the host fixture lays placeholder engine classes down; swap the real engine in over them. The
    // engine loader brings its own minimal PIXI shape, so the fixture's is set aside for the load and
    // its extra members restored afterward for the plugin metadata that reads them.
    const fixturePixi = globalThis.PIXI;
    delete globalThis.PIXI;
    installRealRmmzEngine();
    globalThis.PIXI = { ...fixturePixi, ...globalThis.PIXI };

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');
    await import('../../../../../src/plugins/_base/core/objects/Game_Battler.js');
    await import('../../../../../src/plugins/_base/core/objects/Game_BattlerBase.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));

    setPluginContextToJAbs();
    await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');
    await import('../../../../../src/plugins/abs/core/objects/Game_Battler.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();

    // the death state and both tracked states, as the engine will look them up.
    globalThis.$dataStates = [];
    [ DEATH_STATE_ID, ...TRACKED_STATE_IDS ].forEach(id =>
    {
      globalThis.$dataStates[id] = buildStateRow(id);
    });
  });

  /**
   * Builds a living battler on the real engine, carrying both tracked states, with the JABS engine
   * reporting both as tracked for it.
   * @returns {object}
   */
  function buildDoomedBattler()
  {
    // initMembers clears states, which J-ABS routes through the tracker by uuid- so the engine has to
    // answer, and the uuid needs a name, before the battler is built.
    globalThis.$jabsEngine = { absEnabled: true, getJabsStatesByUuid: () => new Map() };
    const battler = Object.create(globalThis.Game_Battler.prototype);
    battler.name = () => 'Doomed';
    battler.initMembers();

    // the engine's own bookkeeping for two states already applied.
    TRACKED_STATE_IDS.forEach(id =>
    {
      battler.addNewState(id);
    });

    // the JABS tracker holds both, live, under this battler's uuid.
    const trackers = new Map(TRACKED_STATE_IDS.map(id => [ id, { stateId: id, expired: false } ]));
    globalThis.$jabsEngine = {
      absEnabled: true,
      getJabsStatesByUuid: () => trackers,
      getJabsStateByUuidAndStateId: (_uuid, stateId) => trackers.get(stateId),
      removeJabsStateByUuid: vi.fn((_uuid, stateId) => trackers.delete(stateId)),
    };

    return battler;
  }

  it('dies exactly once when the killing blow lands on a battler carrying tracked states', () =>
  {
    // Arrange- a battler holding two tracked states, its deaths counted at the method vanilla calls.
    const battler = buildDoomedBattler();
    const dieSpy = vi.spyOn(battler, 'die');

    // Act- the killing blow, exactly as damage delivers it.
    battler.setHp(0);

    // Assert- one death, and the battler is recorded as dead with nothing else left on it.
    expect(dieSpy).toHaveBeenCalledTimes(1);
    expect(battler.isDeathStateAffected()).toBe(true);
    expect(battler._states).toEqual([ DEATH_STATE_ID ]);
  });

  it('still purges every tracked state from the JABS tracker as the battler dies', () =>
  {
    // Arrange
    const battler = buildDoomedBattler();

    // Act
    battler.setHp(0);

    // Assert- both trackers were handed back, so neither is orphaned ticking on a dead battler.
    const purged = globalThis.$jabsEngine.removeJabsStateByUuid.mock.calls.map(([ , stateId ]) => stateId);
    expect(purged).toEqual(TRACKED_STATE_IDS);
  });

  it('leaves the death state addable once the walk is over', () =>
  {
    // Arrange
    const battler = buildDoomedBattler();

    // Act
    battler.setHp(0);

    // Assert- the guard is raised only for the walk; a later death check must not find it stuck up.
    expect(battler.isClearingStates()).toBe(false);
  });
});
//endregion plugins/abs/core/_component/game-battler-death-reentry-real-engine.test.js