//region plugins/prof/ext/knowledge/_component/knowledge-economy.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { initializeProficiencies, setPluginContextToJBase, setPluginContextToJProf } from '../../../_component/fixtures/install-prof-host-globals.js';
import { freshParty, installKnowledgeHostGlobals, setPluginContextToJKnowledge } from './fixtures/install-knowledge-host-globals.js';

/**
 * Knowledge is a ledger of what the party has learned by playing, and the whole point of it is that
 * nobody has to remember to write to it. These tests cover the three seams that keep that true: the
 * party holding a balance per tag, the actor crediting it whenever proficiency is earned, and the
 * exchange spending it down without ever losing the remainder.
 *
 * The remainder is the part worth guarding. It is not recorded anywhere- the balance simply is whatever
 * was too small to spend- so an exchange that debited the wrong amount would quietly rob the player of
 * progress they had already made.
 */
describe('J-Proficiency-Knowledge economy (direct src import)', () =>
{
  let KnowledgeExchangeManager;

  beforeAll(async () =>
  {
    vi.resetModules();

    installKnowledgeHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../../src/plugins/_base/core/managers/RPGManager.js'));

    await import('../../../../../../src/plugins/_base/core/objects/Game_BattlerBase.js');
    await import('../../../../../../src/plugins/_base/core/objects/Game_Battler.js');
    await import('../../../../../../src/plugins/_base/core/objects/Game_Action.js');
    await import('../../../../../../src/plugins/_base/core/objects/Game_Actor.js');

    setPluginContextToJProf();

    // the extension gates on the version prof reports, and the shared fixture speaks for an older one.
    globalThis.__PLUGIN_VERSION__ = '2.3.0';
    await import('../../../../../../src/plugins/prof/core/_metadata/initialization.js');

    globalThis.$dataActors = [];
    initializeProficiencies();

    await import('../../../../../../src/plugins/prof/core/objects/Game_Battler.js');
    await import('../../../../../../src/plugins/prof/core/objects/Game_Actor.js');

    setPluginContextToJKnowledge();
    await import('../../../../../../src/plugins/prof/ext/knowledge/_metadata/initialization.js');
    await import('../../../../../../src/plugins/prof/ext/knowledge/objects/Game_Party.js');
    await import('../../../../../../src/plugins/prof/ext/knowledge/objects/Game_Actor.js');

    ({ default: KnowledgeExchangeManager } =
      await import('../../../../../../src/plugins/prof/ext/knowledge/managers/KnowledgeExchangeManager.js'));

    // skill 10 is offense-only, 11 credits both, 12's type is mapped to nothing.
    globalThis.$dataSkills = [ null ];
    globalThis.$dataSkills[10] = {
      id: 10,
      stypeId: 7,
    };
    globalThis.$dataSkills[11] = {
      id: 11,
      stypeId: 9,
    };
    globalThis.$dataSkills[12] = {
      id: 12,
      stypeId: 5,
    };
  });

  beforeEach(() =>
  {
    freshParty();
  });

  /**
   * Builds an actor able to earn proficiency in the fixture's skills.
   * @returns {Game_Actor}
   */
  function makeActor()
  {
    const actor = new globalThis.Game_Actor();

    actor.initMembers();
    actor.learnSkill(10);
    actor.learnSkill(11);
    actor.learnSkill(12);

    return actor;
  }

  describe('the party ledger', () =>
  {
    it('reads a tag never earned against as zero', () =>
    {
      // Arrange- a fresh party has earned nothing.

      // Act
      const points = globalThis.$gameParty.knowledgePoints('vitest_offense');

      // Assert- and reading it must not have started tracking it.
      expect(points).toBe(0);
      expect(globalThis.$gameParty.knowledgePointsMap()
        .has('vitest_offense')).toBe(false);
    });

    it('adds to the balance of the tag named, and only that one', () =>
    {
      // Arrange
      globalThis.$gameParty.gainKnowledgePoints('vitest_offense', 30);

      // Act
      globalThis.$gameParty.gainKnowledgePoints('vitest_offense', 12);

      // Assert- the sibling tag must not have moved.
      expect(globalThis.$gameParty.knowledgePoints('vitest_offense')).toBe(42);
      expect(globalThis.$gameParty.knowledgePoints('vitest_defense')).toBe(0);
    });

    it('subtracts from the balance of the tag named', () =>
    {
      // Arrange
      globalThis.$gameParty.gainKnowledgePoints('vitest_offense', 30);

      // Act
      globalThis.$gameParty.loseKnowledgePoints('vitest_offense', 12);

      // Assert
      expect(globalThis.$gameParty.knowledgePoints('vitest_offense')).toBe(18);
    });

    it('floors a balance at zero rather than letting it go owing', () =>
    {
      // Arrange
      globalThis.$gameParty.gainKnowledgePoints('vitest_offense', 5);

      // Act
      globalThis.$gameParty.loseKnowledgePoints('vitest_offense', 500);

      // Assert
      expect(globalThis.$gameParty.knowledgePoints('vitest_offense')).toBe(0);
    });
  });

  describe('earning knowledge by using skills', () =>
  {
    it('credits the tag its skill type is mapped to', () =>
    {
      // Arrange
      const actor = makeActor();

      // Act
      actor.increaseSkillProficiency(10, 3);

      // Assert- offense is mapped to skill type 7; defense is not.
      expect(globalThis.$gameParty.knowledgePoints('vitest_offense')).toBe(3);
      expect(globalThis.$gameParty.knowledgePoints('vitest_defense')).toBe(0);
    });

    it('credits every tag when its skill type is mapped to several', () =>
    {
      // Arrange
      const actor = makeActor();

      // Act
      actor.increaseSkillProficiency(11, 4);

      // Assert
      expect(globalThis.$gameParty.knowledgePoints('vitest_offense')).toBe(4);
      expect(globalThis.$gameParty.knowledgePoints('vitest_defense')).toBe(4);
    });

    it('credits nothing when its skill type is mapped to nothing', () =>
    {
      // Arrange
      const actor = makeActor();

      // Act
      actor.increaseSkillProficiency(12, 7);

      // Assert- the proficiency still went up; only the knowledge did not.
      expect(actor.skillProficiencyBySkillId(12).proficiency).toBe(7);
      expect(globalThis.$gameParty.knowledgePoints('vitest_offense')).toBe(0);
      expect(globalThis.$gameParty.knowledgePoints('vitest_defense')).toBe(0);
    });

    it('leaves banked knowledge alone when proficiency is taken away', () =>
    {
      // Arrange- the points may already have been spent, so a debit has nothing to take back.
      const actor = makeActor();
      actor.increaseSkillProficiency(10, 50);

      // Act
      actor.increaseSkillProficiency(10, -20);

      // Assert
      expect(globalThis.$gameParty.knowledgePoints('vitest_offense')).toBe(50);
    });

    it('credits nothing for an award of zero', () =>
    {
      // Arrange
      const actor = makeActor();
      actor.increaseSkillProficiency(10, 8);

      // Act
      actor.increaseSkillProficiency(10, 0);

      // Assert
      expect(globalThis.$gameParty.knowledgePoints('vitest_offense')).toBe(8);
    });
  });

  describe('exchanging knowledge', () =>
  {
    it('buys every whole unit the balance affords and banks the remainder', () =>
    {
      // Arrange- 250 offense at 100 a unit buys two, with 50 left over.
      globalThis.$gameParty.gainKnowledgePoints('vitest_offense', 250);

      // Act
      const result = KnowledgeExchangeManager.exchange('vitest_blueprints');

      // Assert
      expect(result.units).toBe(2);
      expect(result.granted).toBe(2);
      expect(globalThis.$gameParty.knowledgePoints('vitest_offense')).toBe(50);
      expect(globalThis.$gameParty.__gainedItems[0].item.id).toBe(501);
      expect(globalThis.$gameParty.__gainedItems[0].amount).toBe(2);
    });

    it('multiplies the yield by what a single unit produces', () =>
    {
      // Arrange- patterns cost 50 and yield two apiece.
      globalThis.$gameParty.gainKnowledgePoints('vitest_defense', 150);

      // Act
      const result = KnowledgeExchangeManager.exchange('vitest_patterns');

      // Assert- three units bought, six things handed over.
      expect(result.units).toBe(3);
      expect(result.granted).toBe(6);
      expect(globalThis.$gameParty.__gainedItems[0].item.id).toBe(502);
      expect(globalThis.$gameParty.__gainedItems[0].amount).toBe(6);
    });

    it('hands over nothing and takes nothing when the balance is short of a unit', () =>
    {
      // Arrange- 99 is one short of a blueprint.
      globalThis.$gameParty.gainKnowledgePoints('vitest_offense', 99);

      // Act
      const result = KnowledgeExchangeManager.exchange('vitest_blueprints');

      // Assert- the balance survives intact for the next visit.
      expect(result.units).toBe(0);
      expect(result.granted).toBe(0);
      expect(globalThis.$gameParty.knowledgePoints('vitest_offense')).toBe(99);
      expect(globalThis.$gameParty.__gainedItems).toBeUndefined();
    });

    it('spends only the tag its exchange names', () =>
    {
      // Arrange
      globalThis.$gameParty.gainKnowledgePoints('vitest_offense', 100);
      globalThis.$gameParty.gainKnowledgePoints('vitest_defense', 100);

      // Act
      KnowledgeExchangeManager.exchange('vitest_blueprints');

      // Assert
      expect(globalThis.$gameParty.knowledgePoints('vitest_offense')).toBe(0);
      expect(globalThis.$gameParty.knowledgePoints('vitest_defense')).toBe(100);
    });
  });

  describe('the manager itself', () =>
  {
    it('refuses to be instantiated, being a static class', () =>
    {
      // Arrange- nothing; the constructor is the whole subject.

      // Act & Assert
      expect(() => new KnowledgeExchangeManager())
        .toThrow('The KnowledgeExchangeManager is a static class.');
    });
  });

  describe('reporting the outcome', () =>
  {
    it('writes how many were handed over into the variable named', () =>
    {
      // Arrange
      const result = {
        units: 2,
        granted: 6,
      };

      // Act
      KnowledgeExchangeManager.report(result, 21, 0);

      // Assert
      expect(globalThis.$gameVariables.value(21)).toBe(6);
    });

    it('records that something was handed over in the switch named', () =>
    {
      // Arrange
      const result = {
        units: 2,
        granted: 6,
      };

      // Act
      KnowledgeExchangeManager.report(result, 0, 31);

      // Assert
      expect(globalThis.$gameSwitches.value(31)).toBe(true);
    });

    it('records that nothing was handed over in the switch named', () =>
    {
      // Arrange
      const result = {
        units: 0,
        granted: 0,
      };

      // Act
      KnowledgeExchangeManager.report(result, 0, 32);

      // Assert
      expect(globalThis.$gameSwitches.value(32)).toBe(false);
    });

    it('leaves a variable nobody asked for entirely alone', () =>
    {
      // Arrange- variable zero is a real slot in RMMZ, and writing to it would stomp on whatever is there.
      globalThis.$gameVariables.setValue(0, 'untouched');
      const result = {
        units: 1,
        granted: 1,
      };

      // Act
      KnowledgeExchangeManager.report(result, 0, 0);

      // Assert
      expect(globalThis.$gameVariables.value(0)).toBe('untouched');
    });

    it('leaves a switch nobody asked for entirely alone', () =>
    {
      // Arrange
      globalThis.$gameSwitches.setValue(0, 'untouched');
      const result = {
        units: 1,
        granted: 1,
      };

      // Act
      KnowledgeExchangeManager.report(result, 0, 0);

      // Assert
      expect(globalThis.$gameSwitches.value(0)).toBe('untouched');
    });
  });
});
//endregion plugins/prof/ext/knowledge/_component/knowledge-economy.test.js