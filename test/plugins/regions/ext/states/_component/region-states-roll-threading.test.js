//region plugins/regions/ext/states/_component/region-states-roll-threading.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildFateBattlerStub } from '../../../../_base/core/_component/fixtures/install-jabs-fate.js';
import {
  installRegionsStatesStackHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJRegions,
  setPluginContextToJRegionsStates,
} from '../../../_component/fixtures/install-regions-host-globals.js';

/**
 * A region's state is one the battler standing there gives itself, so the walker is both the roller and the
 * recipient of J-ABS's shared state roll: the tag's chance meets the walker's own resistances, its fate counts once,
 * and it holds no luck over itself. The map parsing, the region lookup and the shared roll are all the real ones; only
 * the dice at the very end are recorded instead of thrown.
 */
describe('J-Regions-States roll threading (direct src import)', () =>
{
  /**
   * J-Base's own proc count, put back after every test so a recording never outlives the test that installed it.
   * @type {Function}
   */
  let originalResolveProcCount;

  beforeAll(async () =>
  {
    vi.resetModules();

    installRegionsStatesStackHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import(
      '../../../../../../src/plugins/_base/core/managers/RPGManager.js'));

    setPluginContextToJRegions();
    await import('../../../../../../src/plugins/regions/core/_metadata/initialization.js');
    await import('../../../../../../src/plugins/regions/core/objects/Game_Map.js');

    setPluginContextToJRegionsStates();
    await import('../../../../../../src/plugins/regions/ext/states/_metadata/initialization.js');
    await import('../../../../../../src/plugins/regions/ext/states/objects/Game_Map.js');
    await import('../../../../../../src/plugins/regions/ext/states/objects/Game_Character.js');
  });

  beforeEach(() =>
  {
    originalResolveProcCount = globalThis.RPGManager.resolveProcCount;
  });

  afterEach(() =>
  {
    globalThis.RPGManager.resolveProcCount = originalResolveProcCount;
  });

  it('rolls each tag as a state the walker gives itself, against its own resistances and with its fate once', () =>
  {
    // Arrange: region 7 carries two tags. State 12 at 40% meets the walker's State Rate of 0.5 and a
    // <stateTypeResist:[cc, 25]> of 0.75 for it, while state 13 at 80% meets no resistance at all- so a roll that
    // read the wrong state's rates, or a chance converted as though it were a fraction, shows on one of the two.
    globalThis.$dataMap = { note: '<regionAddState:[7, 12, 40, 0]>\n<regionAddState:[7, 13, 80, 0]>' };
    const map = new globalThis.Game_Map();
    map.initialize();
    map.setup(1);
    globalThis.$gameMap = map;

    // the walker's luck is far from nothing and its battler-wide fate differs from anything a skill would add, so a
    // roll that held luck over itself or read a skill's rolls shows in what reaches the dice. One state reads as harm
    // and the other as help, so a curse weighed a second time as the recipient shows on either side of the roll.
    const battler = buildFateBattlerStub({
      luk: 110,
      stateRate: stateId => (stateId === 12
        ? 0.5
        : 1),
      stateTypeResistRate: stateId => (stateId === 12
        ? 0.75
        : 1),
      state: stateId => ({
        id: stateId,
        isNegativeType: () => stateId === 12,
        isImmuneToFate: () => false,
      }),
      getPositiveRolls: () => 4,
      getNegativeRolls: () => 2,
      getPositiveRollsForSkill: () => 7,
      getNegativeRollsForSkill: () => 9,
    });

    const character = new globalThis.Game_Character();
    character.initMembers();
    character.hasJabsBattler = () => true;
    character.getJabsBattler = () => ({ getBattler: () => battler });
    character.regionId = () => 7;
    character.requestAnimation = () => {};

    // the dice are J-Base's and covered there; a count of zero keeps either roll from applying anything.
    const resolveProcCount = vi.fn(() => 0);
    globalThis.RPGManager.resolveProcCount = resolveProcCount;

    // Act
    character.applyRegionStates();

    // Assert: 40 x 0.5 x 0.75 rounds to 15 while 80 meets nothing, and each is the walker's one chance plus its four
    // lucky rolls, then its two curses.
    expect(resolveProcCount.mock.calls)
      .toEqual([
        [ battler, 15, 5, 2 ],
        [ battler, 80, 5, 2 ],
      ]);

    // the walker's own fate overrides, Accumulate Mode and Encore count the landings, not a lookalike's.
    const [ [ firstPositiveRoller ], [ secondPositiveRoller ] ] = resolveProcCount.mock.calls;
    expect(firstPositiveRoller)
      .toBe(battler);
    expect(secondPositiveRoller)
      .toBe(battler);
  });
});
//endregion plugins/regions/ext/states/_component/region-states-roll-threading.test.js
