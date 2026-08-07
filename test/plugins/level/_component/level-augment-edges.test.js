//region plugins/level/_component/level-augment-edges.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installLevelHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJLevel,
} from './fixtures/install-level-host-globals.js';

/**
 * The edges of J-LevelMaster's augments: the fall-throughs, the opt-outs, and the base defaults.
 *
 * These are gathered rather than split per object because they share one thing - each is the path
 * taken when a level feature is *not* configured. A project that installs this plugin and tags
 * nothing must still get correct vanilla behavior out of every one of them, and that is exactly the
 * path that never runs in a testplay of a fully-tagged game.
 */
describe('J-LevelMaster augment edges', () =>
{
  /** @type {typeof import('../../../../src/plugins/level/core/managers/LevelScaling.js').default} */
  let LevelScaling;

  beforeAll(async () =>
  {
    vi.resetModules();

    installLevelHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../src/plugins/_base/core/managers/RPGManager.js'));
    await import('../../../../src/plugins/_base/core/objects/Game_BattlerBase.js');
    await import('../../../../src/plugins/_base/core/objects/Game_Battler.js');
    await import('../../../../src/plugins/_base/core/objects/Game_Enemy.js');

    setPluginContextToJLevel();
    await import('../../../../src/plugins/level/core/_metadata/initialization.js');

    await import('../../../../src/plugins/level/core/objects/Game_BattlerBase.js');
    await import('../../../../src/plugins/level/core/objects/Game_Battler.js');
    await import('../../../../src/plugins/level/core/objects/Game_Enemy.js');
    await import('../../../../src/plugins/level/core/objects/Game_Actor.js');
    await import('../../../../src/plugins/level/core/objects/Game_Party.js');
    await import('../../../../src/plugins/level/core/objects/Game_Troop.js');
    await import('../../../../src/plugins/level/core/objects/Game_Event.js');

    ({ default: LevelScaling } = await import('../../../../src/plugins/level/core/managers/LevelScaling.js'));
  });

  beforeEach(() =>
  {
    globalThis.$gameVariables._data = [];
    globalThis.RPGManager.clearCache();
  });

  //region the static-class contract
  describe('LevelScaling', () =>
  {
    it('refuses to be instantiated, because there is no instance state to hold', () =>
    {
      // Arrange
      // Act
      // Assert
      expect(() => new LevelScaling())
        .toThrow('This is a static class.');
    });
  });
  //endregion the static-class contract

  //region the base battler defaults every subclass overrides
  describe('Game_Battler level defaults', () =>
  {
    it('offers no level sources, so a battler with no subclass answer reads none', () =>
    {
      // Arrange: actors read their class and enemies read their notes; the base has neither, and
      // answering with an empty array rather than null is what lets callers iterate unconditionally.
      const battler = new globalThis.Game_Battler();

      // Act
      const sources = battler.getLevelSources();

      // Assert
      expect(sources)
        .toEqual([]);
    });

    it('has no base level of its own', () =>
    {
      // Arrange
      const battler = new globalThis.Game_Battler();

      // Act
      const level = battler.getBattlerBaseLevel();

      // Assert
      expect(level)
        .toBe(0);
    });

    it('has no level balancer of its own', () =>
    {
      // Arrange
      const battler = new globalThis.Game_Battler();

      // Act
      const balancer = battler.getLevelBalancer();

      // Assert
      expect(balancer)
        .toBe(0);
    });
  });
  //endregion the base battler defaults every subclass overrides

  //region the party average
  describe('Game_Party.averageActorLevel()', () =>
  {
    it('averages the levels of everyone in the battle party', () =>
    {
      // Arrange
      const party = new globalThis.Game_Party();
      party.battleMembers = () => [ { level: 10 }, { level: 20 } ];

      // Act
      const average = party.averageActorLevel();

      // Assert
      expect(average)
        .toBe(15);
    });

    it('answers zero for an empty party rather than dividing by nothing', () =>
    {
      // Arrange: this is reachable on the title screen and between transfers, where a scaled exp
      // calculation would otherwise divide by zero and poison every reward downstream with NaN.
      const party = new globalThis.Game_Party();
      party.battleMembers = () => [];

      // Act
      const average = party.averageActorLevel();

      // Assert
      expect(average)
        .toBe(0);
    });
  });
  //endregion the party average

  //region scaled experience
  describe('Game_Troop.expTotal()', () =>
  {
    it('scales the reward against the party while level scaling is enabled', () =>
    {
      // Arrange
      const troop = new globalThis.Game_Troop();
      globalThis.$gameSystem = { isLevelScalingEnabled: () => true };
      troop.getScaledExpResult = () => 1234;

      // Act
      const total = troop.expTotal();

      // Assert
      expect(total)
        .toBe(1234);
    });

    it('hands back the engine\'s own total while level scaling is switched off', () =>
    {
      // Arrange: the switch is player-visible in the difficulty menu, so the unscaled path is a
      // supported configuration rather than a fallback.
      const troop = new globalThis.Game_Troop();
      globalThis.$gameSystem = { isLevelScalingEnabled: () => false };
      troop.getScaledExpResult = () => 1234;

      // Act
      const total = troop.expTotal();

      // Assert
      expect(total)
        .not.toBe(1234);
    });
  });
  //endregion scaled experience

  //region the balancer variables
  describe('Game_Actor.getLevelBalancer()', () =>
  {
    it('reads the configured variable when the project set one', () =>
    {
      // Arrange
      const actor = new globalThis.Game_Actor();
      globalThis.J.LEVEL.Metadata.actorBalanceVariable = 12;
      globalThis.$gameVariables._data[12] = -3;

      // Act
      const balancer = actor.getLevelBalancer();

      // Assert
      expect(balancer)
        .toBe(-3);

      globalThis.J.LEVEL.Metadata.actorBalanceVariable = 0;
    });

    it('answers zero when no balancing variable was configured', () =>
    {
      // Arrange: zero rather than undefined, because the result is summed straight into a level.
      const actor = new globalThis.Game_Actor();
      globalThis.J.LEVEL.Metadata.actorBalanceVariable = 0;

      // Act
      const balancer = actor.getLevelBalancer();

      // Assert
      expect(balancer)
        .toBe(0);
    });
  });

  describe('Game_Enemy.getLevelBalancer()', () =>
  {
    it('reads the configured variable when the project set one', () =>
    {
      // Arrange
      const enemy = new globalThis.Game_Enemy();
      globalThis.J.LEVEL.Metadata.enemyBalanceVariable = 13;
      globalThis.$gameVariables._data[13] = 5;

      // Act
      const balancer = enemy.getLevelBalancer();

      // Assert
      expect(balancer)
        .toBe(5);

      globalThis.J.LEVEL.Metadata.enemyBalanceVariable = 0;
    });

    it('answers zero when no balancing variable was configured', () =>
    {
      // Arrange
      const enemy = new globalThis.Game_Enemy();
      globalThis.J.LEVEL.Metadata.enemyBalanceVariable = 0;

      // Act
      const balancer = enemy.getLevelBalancer();

      // Assert
      expect(balancer)
        .toBe(0);
    });
  });
  //endregion the balancer variables

  //region enemy level overrides
  describe('Game_Enemy.hasLevelOverride()', () =>
  {
    it('has no override when JABS is not installed', () =>
    {
      // Arrange: the override is set by a JABS map event, so without JABS there is nothing to set it.
      const enemy = new globalThis.Game_Enemy();
      enemy._enemyDb = { note: '', actions: [] };
      enemy.initMembers();
      const previousJabs = globalThis.J.ABS;
      delete globalThis.J.ABS;

      // Act
      const hasOverride = enemy.hasLevelOverride();

      // Assert
      expect(hasOverride)
        .toBe(false);

      globalThis.J.ABS = previousJabs;
    });

    it('has no override when nothing has cached one', () =>
    {
      // Arrange
      const enemy = new globalThis.Game_Enemy();
      enemy._enemyDb = { note: '', actions: [] };
      enemy.initMembers();
      globalThis.J.ABS = {};
      enemy.setCachedLevelOverride(null);

      // Act
      const hasOverride = enemy.hasLevelOverride();

      // Assert
      expect(hasOverride)
        .toBe(false);
    });

    it('has an override once one has been cached', () =>
    {
      // Arrange
      const enemy = new globalThis.Game_Enemy();
      enemy._enemyDb = { note: '', actions: [] };
      enemy.initMembers();
      globalThis.J.ABS = {};
      enemy.setCachedLevelOverride(42);

      // Act
      const hasOverride = enemy.hasLevelOverride();

      // Assert
      expect(hasOverride)
        .toBe(true);
    });
  });

  describe('Game_Enemy.getBattlerBaseLevel()', () =>
  {
    it('uses the tagged level when nothing has overridden it', () =>
    {
      // Arrange
      const enemy = new globalThis.Game_Enemy();
      enemy._enemyDb = { note: '<level:7>', actions: [] };
      enemy.initMembers();
      globalThis.J.ABS = {};
      enemy.setCachedLevelOverride(null);

      // Act
      const level = enemy.getBattlerBaseLevel();

      // Assert
      expect(level)
        .toBe(7);
    });

    it('prefers the map event\'s override over the tagged level', () =>
    {
      // Arrange: a map event placing this enemy is allowed to say what level it arrives at, which is
      // how one enemy id serves an early dungeon and a late one.
      const enemy = new globalThis.Game_Enemy();
      enemy._enemyDb = { note: '<level:7>', actions: [] };
      enemy.initMembers();
      globalThis.J.ABS = {};
      enemy.setCachedLevelOverride(42);

      // Act
      const level = enemy.getBattlerBaseLevel();

      // Assert
      expect(level)
        .toBe(42);
    });
  });

  describe('Game_Enemy.setupSkillLearnings()', () =>
  {
    it('records each level a skill becomes available at', () =>
    {
      // Arrange
      const enemy = new globalThis.Game_Enemy();
      enemy._enemyDb = { note: '<learning:[101,5]>', actions: [] };
      enemy.initMembers();

      // Act
      enemy.setupSkillLearnings();

      // Assert
      expect(enemy.skillLearnings()[101])
        .toBe(5);
    });

    it('records nothing for an enemy with no learnings tagged', () =>
    {
      // Arrange
      const enemy = new globalThis.Game_Enemy();
      enemy._enemyDb = { note: '', actions: [] };
      enemy.initMembers();

      // Act
      enemy.setupSkillLearnings();

      // Assert
      expect(Object.keys(enemy.skillLearnings()).length)
        .toBe(0);
    });
  });

  describe('Game_Enemy.isLearnedSkillByLevel()', () =>
  {
    it('treats an untagged skill as always available', () =>
    {
      // Arrange: most enemy skills carry no learning tag at all, so the absent case is the common one
      // and gating it off would silence most of an enemy's kit.
      const enemy = new globalThis.Game_Enemy();
      enemy._enemyDb = { note: '', actions: [] };
      enemy.initMembers();

      // Act
      const isLearned = enemy.isLearnedSkillByLevel({ skillId: 101 });

      // Assert
      expect(isLearned)
        .toBe(true);
    });

    it('allows a tagged skill once the enemy reaches its level', () =>
    {
      // Arrange
      const enemy = new globalThis.Game_Enemy();
      enemy._enemyDb = { note: '<level:5>\n<learning:[101,5]>', actions: [] };
      enemy.initMembers();
      enemy.setupSkillLearnings();

      // Act
      const isLearned = enemy.isLearnedSkillByLevel({ skillId: 101 });

      // Assert
      expect(isLearned)
        .toBe(true);
    });

    it('withholds a tagged skill while the enemy is below its level', () =>
    {
      // Arrange
      const enemy = new globalThis.Game_Enemy();
      enemy._enemyDb = { note: '<level:2>\n<learning:[101,5]>', actions: [] };
      enemy.initMembers();
      enemy.setupSkillLearnings();

      // Act
      const isLearned = enemy.isLearnedSkillByLevel({ skillId: 101 });

      // Assert
      expect(isLearned)
        .toBe(false);
    });
  });

  describe('Game_Enemy.canMapActionToSkill()', () =>
  {
    it('refuses outright whatever the engine already refused', () =>
    {
      // Arrange: level gating is an additional restriction, never a way to re-enable something the
      // base rules already ruled out.
      const enemy = new globalThis.Game_Enemy();
      enemy._enemyDb = { note: '', actions: [] };
      enemy.initMembers();
      globalThis.J.LEVEL.Aliased.Game_Enemy.set('canMapActionToSkill', () => false);

      // Act
      const canMap = enemy.canMapActionToSkill({ skillId: 101 });

      // Assert
      expect(canMap)
        .toBe(false);
    });
  });
  //endregion enemy level overrides
});
//endregion plugins/level/_component/level-augment-edges.test.js