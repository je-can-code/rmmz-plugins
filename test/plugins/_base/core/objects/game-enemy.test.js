//region plugins/_base/core/objects/game-enemy.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Game_Enemy.js is a prototype-patch file (aliases and adds methods onto the real RMMZ `Game_Enemy.prototype`), so
 * this file direct-imports it against a bare placeholder engine global rather than nesting a vm context.
 *
 * What it guards above all is that learning is personal. Every enemy of one id reads the same database entry, so a
 * skill written into that entry is known by all of them at once, including every one spawned later in the session-
 * the boss who learns a skill halfway through a fight would open the retry already knowing it.
 */
describe('J-Base Game_Enemy (direct src import)', () =>
{
  let originalInitMembers;

  beforeAll(async () =>
  {
    globalThis.J = {
      BASE: {
        Aliased: { Game_Enemy: new Map() },
        Traits: { ADD_SKILL: 35 },
        Metadata: { BaseTpMaxEnemies: 100 },
      },
    };

    function Game_Enemy()
    {
    }

    // the originals this file aliases have to exist before the import, or each alias captures undefined.
    originalInitMembers = vi.fn();
    Game_Enemy.prototype.initMembers = originalInitMembers;
    Game_Enemy.prototype.setup = vi.fn();
    Game_Enemy.prototype.die = vi.fn();

    globalThis.Game_Enemy = Game_Enemy;

    await import('../../../../../src/plugins/_base/core/objects/Game_Enemy.js');
  });

  beforeEach(() =>
  {
    originalInitMembers.mockClear();
  });

  /**
   * Builds an enemy that has been through `initMembers`, reading the given database entry, as every real one has.
   * Skills resolve to plain `{ id }` rows and no trait adds any, so the actions are the only source of skills.
   * @param {{ actions: Object[] }} databaseEntry The database entry the enemy reads, shared by whoever is handed it.
   * @returns {Game_Enemy}
   */
  function buildEnemy(databaseEntry)
  {
    const enemy = new globalThis.Game_Enemy();
    enemy.initMembers();
    enemy.enemy = () => databaseEntry;
    enemy.skill = skillId => ({ id: skillId });
    enemy.traitObjects = () => [];
    return enemy;
  }

  describe('initMembers()', () =>
  {
    it('calls through to the original, then gives the enemy an empty list of learned actions of its own', () =>
    {
      // Arrange: a virgin object, so nothing but initMembers could have built the namespace being read.
      const first = new globalThis.Game_Enemy();
      const second = new globalThis.Game_Enemy();

      // Act
      first.initMembers();
      second.initMembers();

      // Assert
      expect(originalInitMembers).toHaveBeenCalledTimes(2);
      expect(first.learnedActions()).toEqual([]);
      expect(first.learnedActions()).not.toBe(second.learnedActions());
    });
  });

  describe('enemyActions()', () =>
  {
    it('lists the database entry\'s actions followed by the learned ones, without touching the entry', () =>
    {
      // Arrange
      const databaseEntry = { actions: [ { skillId: 10 } ] };
      const enemy = buildEnemy(databaseEntry);
      enemy.setLearnedActions([ { skillId: 12 } ]);

      // Act
      const actions = enemy.enemyActions();

      // Assert
      expect(actions.map(action => action.skillId)).toEqual([ 10, 12 ]);
      expect(databaseEntry.actions).toHaveLength(1);
    });
  });

  describe('learnSkill()', () =>
  {
    it('learns nothing and reports false for a skill the enemy already knows', () =>
    {
      // Arrange
      const databaseEntry = { actions: [ { skillId: 10 } ] };
      const enemy = buildEnemy(databaseEntry);

      // Act
      const learned = enemy.learnSkill(10);

      // Assert
      expect(learned).toBe(false);
      expect(enemy.learnedActions()).toEqual([]);
      expect(databaseEntry.actions).toHaveLength(1);
    });

    it('teaches a new skill to this enemy alone, leaving its database entry and its kin untouched', () =>
    {
      // Arrange: two enemies of one id, sharing one database entry, exactly as the engine hands it out.
      const databaseEntry = { actions: [ { skillId: 10 } ] };
      const learner = buildEnemy(databaseEntry);
      const kin = buildEnemy(databaseEntry);

      // Act
      const learned = learner.learnSkill(12);

      // Assert
      expect(learned).toBe(true);
      expect(learner.hasSkill(12)).toBe(true);
      expect(kin.hasSkill(12)).toBe(false);
      expect(databaseEntry.actions).toHaveLength(1);
      expect(learner.learnedActions()).toHaveLength(1);
      expect(learner.learnedActions()[0]).toMatchObject({
        skillId: 12,
        rating: 5,
        conditionType: 0,
        conditionParam1: 0,
        conditionParam2: 0,
      });
    });
  });

  describe('skills() / skillIds()', () =>
  {
    it('counts a learned skill among the enemy\'s skills and skill ids', () =>
    {
      // Arrange
      const enemy = buildEnemy({ actions: [ { skillId: 10 } ] });
      enemy.learnSkill(12);

      // Act
      const skillIds = enemy.skillIds();
      const skills = enemy.skills()
        .map(skill => skill.id);

      // Assert
      expect(skillIds).toEqual([ 10, 12 ]);
      expect(skills).toEqual([ 10, 12 ]);
    });
  });
});
//endregion plugins/_base/core/objects/game-enemy.test.js