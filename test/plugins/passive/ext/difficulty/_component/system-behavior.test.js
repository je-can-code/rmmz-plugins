//region plugins/passive/ext/difficulty/_component/system-behavior.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { VITEST_DIFF_KEY, VITEST_HARD_KEY, VITEST_SOFT_KEY } from './fixtures/diff-config-json.js';
import { installDiffHostGlobals, setPluginContextToJBase, setPluginContextToJDiff } from './fixtures/install-diff-host-globals.js';

/**
 * What the enabled layers turn into once the player has chosen them.
 *
 * A layer no longer scales anything itself. It names a state for actors and a state for enemies, and
 * everything here is the plumbing that turns "these layers are enabled" into "every battler carries these
 * states": which layers are in force, which state ids they grant each side, the one passive source per
 * side carrying those ids, and the refresh that hands them to every living battler.
 */
describe('J-Passive-Difficulty applied difficulty (direct src import)', () =>
{
  let DifficultyAffixManager;

  beforeAll(async () =>
  {
    vi.resetModules();

    installDiffHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJDiff();
    await import('../../../../../../src/plugins/passive/ext/difficulty/_metadata/initialization.js');

    // patches globalThis.Game_System/Game_Temp prototypes directly.
    await import('../../../../../../src/plugins/passive/ext/difficulty/objects/Game_System.js');
    await import('../../../../../../src/plugins/passive/ext/difficulty/objects/Game_Temp.js');

    ({ default: globalThis.DifficultyManager } =
      await import('../../../../../../src/plugins/passive/ext/difficulty/managers/DifficultyManager.js'));
    ({ default: DifficultyAffixManager } =
      await import('../../../../../../src/plugins/passive/ext/difficulty/managers/DifficultyAffixManager.js'));
  });

  beforeEach(() =>
  {
    // neither optional sibling is installed unless a test says so, and no battler is alive.
    delete globalThis.J.ABS;
    delete globalThis.J.PASSIVE.EXT.AFFIX;
    globalThis.$gameActors = { existingActors: () => [] };
    globalThis.$gameTroop = { members: () => [] };
  });

  /**
   * A fresh system and temp, with the config's layers set up from their authored flags: the default and
   * hard layers enabled, the soft layer disabled.
   */
  function bootstrapDifficultyRuntime()
  {
    globalThis.$gameSystem = new globalThis.Game_System();
    globalThis.$gameSystem.initialize();
    globalThis.$gameTemp = new globalThis.Game_Temp();
    globalThis.$gameTemp.initMembers();
    globalThis.$gameTemp.setupDifficultySystem();
  }

  /**
   * Turns every layer off.
   */
  function disableEveryLayer()
  {
    globalThis.$gameSystem.getAllDifficultyConfigs()
      .forEach(config =>
      {
        config.enabled = false;
      });
  }

  /**
   * A battler stand-in that records being asked to rebuild its passives.
   * @param {boolean} isEnemy Which side of the fight this battler is on.
   * @returns {{isEnemy: Function, refreshPassiveStates: Function}}
   */
  function refreshableBattler(isEnemy)
  {
    return {
      isEnemy: () => isEnemy,
      refreshPassiveStates: vi.fn(),
    };
  }

  //region the applied difficulty
  describe('buildAppliedDifficulty()', () =>
  {
    it('applies the default layer outright when the player has enabled nothing', () =>
    {
      // Arrange- a fresh game and a fully-cleared difficulty menu both land here.
      bootstrapDifficultyRuntime();
      disableEveryLayer();

      // Act
      const applied = globalThis.$gameTemp.buildAppliedDifficulty();

      // Assert
      expect(applied.key).toBe(VITEST_DIFF_KEY);
    });

    it('builds a summary layer carrying the combined cost of every enabled layer', () =>
    {
      // Arrange- default (0) and hard (3) are enabled; the disabled soft layer (2) would make it 5.
      bootstrapDifficultyRuntime();

      // Act
      const applied = globalThis.$gameTemp.buildAppliedDifficulty();

      // Assert
      expect(applied.key).toBe('000_applied-difficulty');
      expect(applied.cost).toBe(3);
    });
  });
  //endregion the applied difficulty

  //region layers in force
  describe('difficultyLayersInForce()', () =>
  {
    it('answers the default layer alone when nothing is enabled', () =>
    {
      // Arrange
      bootstrapDifficultyRuntime();
      disableEveryLayer();

      // Act
      const keys = globalThis.$gameTemp.difficultyLayersInForce()
        .map(layer => layer.key);

      // Assert
      expect(keys).toEqual([ VITEST_DIFF_KEY ]);
    });

    it('answers exactly the enabled layers otherwise', () =>
    {
      // Arrange- the soft layer is present and disabled, the near-miss that must stay out.
      bootstrapDifficultyRuntime();

      // Act
      const keys = globalThis.$gameTemp.difficultyLayersInForce()
        .map(layer => layer.key);

      // Assert
      expect(keys).toEqual([ VITEST_DIFF_KEY, VITEST_HARD_KEY ]);
    });
  });
  //endregion layers in force

  //region state ids
  describe('actorDifficultyStateIds() / enemyDifficultyStateIds()', () =>
  {
    it('collects the actor states of the layers in force, skipping a layer that grants none', () =>
    {
      // Arrange- default grants actors 0, hard grants 501, and the disabled soft layer's 503 stays out.
      bootstrapDifficultyRuntime();

      // Act
      const stateIds = globalThis.$gameTemp.actorDifficultyStateIds();

      // Assert
      expect(stateIds).toEqual([ 501 ]);
    });

    it('collects the enemy states of the layers in force from their own field', () =>
    {
      // Arrange
      bootstrapDifficultyRuntime();

      // Act
      const stateIds = globalThis.$gameTemp.enemyDifficultyStateIds();

      // Assert- the hard layer's actor state 501 must not leak across.
      expect(stateIds).toEqual([ 502 ]);
    });
  });
  //endregion state ids

  //region passive sources
  describe('buildDifficultyPassiveSources()', () =>
  {
    it('builds no source for a side nothing is granted to', () =>
    {
      // Arrange
      bootstrapDifficultyRuntime();

      // Act
      const sources = globalThis.$gameTemp.buildDifficultyPassiveSources([]);

      // Assert
      expect(sources).toEqual([]);
    });

    it('builds one source carrying every granted state as a unique passive', () =>
    {
      // Arrange
      bootstrapDifficultyRuntime();

      // Act
      const sources = globalThis.$gameTemp.buildDifficultyPassiveSources([ 501, 503 ]);

      // Assert
      expect(sources).toHaveLength(1);
      expect(sources[0].note).toBe('<uniquePassive:[501,503]>');
    });
  });

  describe('refreshDifficultyPassiveSources()', () =>
  {
    it('hands each side the source for its own states', () =>
    {
      // Arrange & Act- setting the system up refreshes everything once.
      bootstrapDifficultyRuntime();

      // Assert
      expect(globalThis.$gameTemp.actorDifficultySources()[0].note).toBe('<uniquePassive:[501]>');
      expect(globalThis.$gameTemp.enemyDifficultySources()[0].note).toBe('<uniquePassive:[502]>');
    });

    it('empties both sides once no layer in force grants anything', () =>
    {
      // Arrange- with everything off only the default layer is in force, and it grants no one.
      bootstrapDifficultyRuntime();
      disableEveryLayer();

      // Act
      globalThis.$gameTemp.refreshDifficultyPassiveSources();

      // Assert
      expect(globalThis.$gameTemp.actorDifficultySources()).toEqual([]);
      expect(globalThis.$gameTemp.enemyDifficultySources()).toEqual([]);
    });
  });
  //endregion passive sources

  //region refreshing battlers
  describe('refreshDifficultyPassives()', () =>
  {
    it('rebuilds the passives of every built actor and every troop member', () =>
    {
      // Arrange
      bootstrapDifficultyRuntime();
      const actor = refreshableBattler(false);
      const troopMember = refreshableBattler(true);
      globalThis.$gameActors = { existingActors: () => [ actor ] };
      globalThis.$gameTroop = { members: () => [ troopMember ] };

      // Act
      globalThis.$gameTemp.refreshDifficultyPassives();

      // Assert
      expect(actor.refreshPassiveStates).toHaveBeenCalledTimes(1);
      expect(troopMember.refreshPassiveStates).toHaveBeenCalledTimes(1);
    });

    it('rebuilds every enemy on the map when J-ABS is installed, and no ally there', () =>
    {
      // Arrange- an ally on the map is an actor, already refreshed through the actor list.
      bootstrapDifficultyRuntime();
      const mapEnemy = refreshableBattler(true);
      const mapAlly = refreshableBattler(false);
      globalThis.J.ABS = {};
      globalThis.JABS_AiManager = {
        getAllBattlers: () => [ { getBattler: () => mapEnemy }, { getBattler: () => mapAlly } ],
      };

      // Act
      globalThis.$gameTemp.refreshDifficultyPassives();

      // Assert
      expect(mapEnemy.refreshPassiveStates).toHaveBeenCalledTimes(1);
      expect(mapAlly.refreshPassiveStates).not.toHaveBeenCalled();
    });

    it('never asks J-ABS for map battlers when it is not installed', () =>
    {
      // Arrange
      bootstrapDifficultyRuntime();
      globalThis.JABS_AiManager = { getAllBattlers: vi.fn(() => []) };

      // Act
      globalThis.$gameTemp.refreshDifficultyPassives();

      // Assert
      expect(globalThis.JABS_AiManager.getAllBattlers).not.toHaveBeenCalled();
    });
  });
  //endregion refreshing battlers

  //region the refresh seam
  describe('refreshAppliedDifficulty()', () =>
  {
    it('rebuilds the affix pools when J-Passive-Affix is installed', () =>
    {
      // Arrange
      bootstrapDifficultyRuntime();
      globalThis.J.PASSIVE.EXT.AFFIX = {};
      const buildPools = vi.spyOn(DifficultyAffixManager, 'buildEffectivePools')
        .mockImplementation(() => {});

      // Act
      globalThis.$gameTemp.refreshAppliedDifficulty();

      // Assert
      expect(buildPools).toHaveBeenCalledTimes(1);

      buildPools.mockRestore();
    });

    it('leaves the affix pools alone when J-Passive-Affix is not installed', () =>
    {
      // Arrange
      bootstrapDifficultyRuntime();
      const buildPools = vi.spyOn(DifficultyAffixManager, 'buildEffectivePools')
        .mockImplementation(() => {});

      // Act
      globalThis.$gameTemp.refreshAppliedDifficulty();

      // Assert
      expect(buildPools).not.toHaveBeenCalled();

      buildPools.mockRestore();
    });

    it('carries a toggle into the applied layer, the sources and every battler at once', () =>
    {
      // Arrange
      bootstrapDifficultyRuntime();
      const actor = refreshableBattler(false);
      globalThis.$gameActors = { existingActors: () => [ actor ] };
      globalThis.$gameSystem.getDifficultyConfigByKey(VITEST_SOFT_KEY).enabled = true;

      // Act
      globalThis.$gameTemp.refreshAppliedDifficulty();

      // Assert- the soft layer's cost (2) joins the hard layer's (3), and its actor state joins too.
      expect(globalThis.$gameTemp.getAppliedDifficulty().cost).toBe(5);
      expect(globalThis.$gameTemp.actorDifficultySources()[0].note).toBe('<uniquePassive:[501,503]>');
      expect(actor.refreshPassiveStates).toHaveBeenCalledTimes(1);
    });
  });
  //endregion the refresh seam

  it('lists registered difficulty layers through DifficultyManager', () =>
  {
    // Arrange
    bootstrapDifficultyRuntime();

    // Act
    const keys = globalThis.DifficultyManager.allDifficulties()
      .map(layer => layer.key)
      .sort();

    // Assert
    expect(keys).toEqual([ VITEST_DIFF_KEY, VITEST_HARD_KEY, VITEST_SOFT_KEY ].sort());
  });
});
//endregion plugins/passive/ext/difficulty/_component/system-behavior.test.js
