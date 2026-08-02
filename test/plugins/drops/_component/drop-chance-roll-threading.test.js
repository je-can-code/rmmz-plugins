//region plugins/drops/_component/drop-chance-roll-threading.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installDropsHostGlobals, setPluginContextToJBase, setPluginContextToJDrops } from './fixtures/install-drops-host-globals.js';

describe('J-DropsControl killer roll threading (direct src import)', () =>
{
  let originalChanceIn100;

  beforeAll(async () =>
  {
    vi.resetModules();

    installDropsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../src/plugins/_base/core/managers/RPGManager.js'));

    await import('../../../../src/plugins/_base/core/objects/Game_BattlerBase.js');
    await import('../../../../src/plugins/_base/core/objects/Game_Battler.js');

    setPluginContextToJDrops();
    await import('../../../../src/plugins/drops/core/_metadata/initialization.js');

    await import('../../../../src/plugins/drops/core/objects/Game_Battler.js');
    await import('../../../../src/plugins/drops/core/objects/Game_Actor.js');
    await import('../../../../src/plugins/drops/core/objects/Game_Party.js');
    await import('../../../../src/plugins/drops/core/objects/Game_Enemy.js');
  });

  let originalRandomInt;

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
    originalChanceIn100 = globalThis.RPGManager.chanceIn100;
    originalRandomInt = Math.randomInt;
  });

  afterEach(() =>
  {
    globalThis.RPGManager.chanceIn100 = originalChanceIn100;
    Math.randomInt = originalRandomInt;
  });

  /**
   * Pins the dice so every roll lands on the given face. Counting-mode results come from
   * `countSuccessesIn100` rather than `chanceIn100`, so stubbing the manager method would leave
   * the accumulate path running on real randomness- the dice themselves are the seam.
   * @param {number} face The 1-100 face every roll should land on.
   */
  function alwaysRoll(face)
  {
    Math.randomInt = () => face - 1;
  }

  function stubChanceIn100(outcome)
  {
    const calls = [];
    globalThis.RPGManager.chanceIn100 = function(percent, rollForPositive, rollForNegative)
    {
      calls.push({ percent, rollForPositive, rollForNegative });
      return outcome;
    };
    return calls;
  }

  it('defaults to a plain roll (no bonus) when no killer is provided', () =>
  {
    // Arrange
    const calls = stubChanceIn100(true);
    const enemy = new globalThis.Game_Enemy();
    enemy.initMembers();

    // Act
    enemy.didFindLoot(40);

    // Assert
    expect(calls).toEqual([ { percent: 40, rollForPositive: 1, rollForNegative: 0 } ]);
  });

  /**
   * Builds a killer stand-in carrying the roll-modifying traits a real battler exposes.
   * @param {object} [overrides] Individual trait overrides.
   * @returns {object}
   */
  function makeKiller(overrides = {})
  {
    return {
      getPositiveRolls: () => 2,
      getNegativeRolls: () => 3,
      isVeryLucky: () => false,
      isVeryCursed: () => false,
      isAccumulating: () => false,
      getEncoreRepeats: () => 0,
      ...overrides,
    };
  }

  it('feeds the killer\'s own positive and negative rolls- the killer is both the roller and the recipient', () =>
  {
    // Arrange
    const calls = stubChanceIn100(true);
    const enemy = new globalThis.Game_Enemy();
    enemy.initMembers();

    // Act
    enemy.didFindLoot(40, makeKiller());

    // Assert
    expect(calls).toEqual([ { percent: 40, rollForPositive: 3, rollForNegative: 3 } ]);
  });

  it('yields a single copy for an ordinary killer who found the loot', () =>
  {
    // Arrange: without Accumulate Mode a success is a success, however many rolls it took.
    alwaysRoll(1);
    const enemy = new globalThis.Game_Enemy();
    enemy.initMembers();

    // Act
    const found = enemy.howMuchLootFound(40, makeKiller());

    // Assert
    expect(found).toBe(1);
  });

  it('yields a copy per landed roll for a killer in Accumulate Mode', () =>
  {
    // Arrange: a drop is a repeatable outcome, so every positive roll that lands earns another
    // copy rather than the extras being wasted on an already-won roll.
    alwaysRoll(1);
    const enemy = new globalThis.Game_Enemy();
    enemy.initMembers();

    // Act: two bonus positive rolls plus the base one, all landing.
    const found = enemy.howMuchLootFound(40, makeKiller({ isAccumulating: () => true }));

    // Assert
    expect(found).toBe(3);
  });

  it('echoes each found copy again for a killer carrying Encore', () =>
  {
    // Arrange
    alwaysRoll(1);
    const enemy = new globalThis.Game_Enemy();
    enemy.initMembers();

    // Act: one success, echoed once more.
    const found = enemy.howMuchLootFound(40, makeKiller({ getEncoreRepeats: () => 1 }));

    // Assert
    expect(found).toBe(2);
  });

  it('multiplies accumulated copies by the encore echo', () =>
  {
    // Arrange
    alwaysRoll(1);
    const enemy = new globalThis.Game_Enemy();
    enemy.initMembers();

    // Act: three landed rolls, each echoed once.
    const found = enemy.howMuchLootFound(40, makeKiller({
      isAccumulating: () => true,
      getEncoreRepeats: () => 1,
    }));

    // Assert
    expect(found).toBe(6);
  });

  it('yields nothing at all to a cursed killer, however many rolls they carry', () =>
  {
    // Arrange: an absolute curse overrides the roll entirely rather than merely worsening it.
    alwaysRoll(1);
    const enemy = new globalThis.Game_Enemy();
    enemy.initMembers();

    // Act
    const found = enemy.howMuchLootFound(40, makeKiller({ isVeryCursed: () => true }));

    // Assert
    expect(found).toBe(0);
  });
});
//endregion plugins/drops/_component/drop-chance-roll-threading.test.js
