//region plugins/regions/ext/states/_component/region-states-jabs-add-path.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../../../abs/_component/fixtures/install-abs-host-globals.js';
import { buildFateBattlerStub } from '../../../../_base/core/_component/fixtures/install-jabs-fate.js';

/**
 * The region a walker stands on.
 * @type {number}
 */
const REGION_ID = 7;

/**
 * The state the region applies.
 * @type {number}
 */
const STATE_ID = 12;

/**
 * A region state lands through the walker's own add, so what happens to a walker already carrying the state- and to
 * one that cannot take it at all- is J-ABS's to decide. This realm loads J-ABS's real `addState` and
 * `handleAddingJabsState`, and the region's real `applyRegionStates` and shared roll, so the region's landings are
 * followed all the way into J-ABS's tracking. Only the tracking itself is recorded rather than performed.
 */
describe('J-Regions-States landings through J-ABS\'s add path (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import(
      '../../../../../../src/plugins/_base/core/managers/RPGManager.js'));

    setPluginContextToJAbs();
    await import('../../../../../../src/plugins/abs/core/_metadata/initialization.js');

    // J-ABS's Game_Battler.js lays down the add a credited state application goes through.
    await import('../../../../../../src/plugins/abs/core/objects/Game_Battler.js');

    // the region rolls through J-ABS's shared state roll as a bare global, as it does once J-ABS has loaded.
    ({ default: globalThis.JABS_Fate } = await import('../../../../../../src/plugins/abs/core/managers/JABS_Fate.js'));

    // the region extension's own alias map, the one piece of its bootstrap the file below reads as it loads.
    globalThis.J.REGIONS = { EXT: { STATES: { Aliased: { Game_Character: new Map() } } } };
    await import('../../../../../../src/plugins/regions/ext/states/objects/Game_Character.js');
  });

  beforeEach(() =>
  {
    globalThis.$jabsEngine = { absEnabled: true };

    // region 7 applies the state at 100%, with no animation.
    globalThis.$gameMap.getRegionStatesByRegionId = regionId => (regionId === REGION_ID
      ? [ { regionId: REGION_ID, stateId: STATE_ID, chance: 100, animationId: 0 } ]
      : []);
  });

  /**
   * Builds the walker: a battler already carrying the region's state, whose add is J-ABS's real one. It rolls in
   * Accumulate Mode with one lucky roll, so a 100% region state lands on it twice in one proc. J-ABS's tracking, and
   * the vanilla bookkeeping beside it, are recorded rather than performed.
   * @param {object} [overrides] Members to replace on the walker.
   * @returns {object}
   */
  function buildCarryingWalker(overrides = {})
  {
    const walker = buildFateBattlerStub({
      isAccumulating: () => true,
      getPositiveRolls: () => 1,
      isStateAddable: () => true,
      isStateAffected: stateId => stateId === STATE_ID,
      addNewState: vi.fn(),
      refresh: vi.fn(),
      resetStateCounts: vi.fn(),
      addJabsState: vi.fn(),
      onJabsStateInflicted: vi.fn(),
      cancelLinedUpActionIfForbidden: vi.fn(),
      flagSkillSlotsForRefresh: vi.fn(),
      _result: { pushAddedState: vi.fn() },
      ...overrides,
    });

    // vanilla's accessor for the action result J-ABS records each landing in.
    walker.result = () => walker._result;

    // J-ABS's real add: a credited application hands off to its own state handling.
    walker.addState = globalThis.Game_Battler.prototype.addState;
    walker.handleAddingJabsState = globalThis.Game_Battler.prototype.handleAddingJabsState;

    return walker;
  }

  /**
   * Builds the character standing on the region, carrying the given walker.
   * @param {object} walker The battler standing on the region.
   * @returns {object}
   */
  function buildCharacter(walker)
  {
    const character = Object.create(globalThis.Game_Character.prototype);
    character.regionId = () => REGION_ID;
    character.getJabsBattler = () => ({ getBattler: () => walker });
    character.requestAnimation = vi.fn();

    return character;
  }

  it('reapplies a state the walker already carries through J-ABS\'s tracking, once for every landing', () =>
  {
    // Arrange
    const walker = buildCarryingWalker();
    const character = buildCharacter(walker);

    // Act
    character.applyRegionStates();

    // Assert- both landings reach J-ABS's tracker, credited to the walker itself, as reapplications of a state it
    // already carries rather than fresh ones.
    expect(walker.addJabsState.mock.calls).toEqual([
      [ STATE_ID, walker, null, null ],
      [ STATE_ID, walker, null, null ],
    ]);
    expect(walker.addNewState).not.toHaveBeenCalled();
  });

  it('lets the walker\'s immunity refuse every landing, even of a state it already carries', () =>
  {
    // Arrange- the walker can no longer take the state it carries, through any immunity it has since gained.
    const walker = buildCarryingWalker({ isStateAddable: () => false });
    const character = buildCharacter(walker);

    // Act
    character.applyRegionStates();

    // Assert- neither landing touches the state: no reapplication, and not even vanilla's count reset.
    expect(walker.addJabsState).not.toHaveBeenCalled();
    expect(walker.resetStateCounts).not.toHaveBeenCalled();
    expect(walker.onJabsStateInflicted).not.toHaveBeenCalled();
  });
});
//endregion plugins/regions/ext/states/_component/region-states-jabs-add-path.test.js