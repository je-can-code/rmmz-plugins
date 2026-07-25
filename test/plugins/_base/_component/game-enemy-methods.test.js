//region plugins/_base/_component/game-enemy-methods.test.js
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { installJBaseHostGlobals } from './fixtures/install-j-base-host-globals.js';

describe('J-Base Game_Enemy methods (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installJBaseHostGlobals();

    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    // vanilla RMMZ Game_Enemy methods this file aliases- stubbed bare so J.BASE.Aliased
    // captures real functions rather than undefined.
    globalThis.Game_Enemy.prototype.setup = function(enemyId)
    {
      this._enemyId = enemyId;
    };
    globalThis.Game_Enemy.prototype.die = function()
    {
      this.hp = 0;
    };

    await import('../../../../src/plugins/_base/objects/Game_BattlerBase.js');
    await import('../../../../src/plugins/_base/objects/Game_Enemy.js');
  });

  afterAll(() =>
  {
    vi.unstubAllGlobals();
  });

  function buildEnemy()
  {
    const enemy = Object.create(globalThis.Game_Enemy.prototype);
    enemy._enemyId = 1;
    enemy._j = { _base: { _cachedTraitObjects: null } };
    return enemy;
  }

  describe('battlerId', () =>
  {
    it('delegates to enemyId()', () =>
    {
      // Arrange
      const enemy = buildEnemy();
      enemy.enemyId = () => 9;

      // Act & Assert
      expect(enemy.battlerId()).toBe(9);
    });
  });

  describe('databaseData', () =>
  {
    it('delegates to enemy()', () =>
    {
      // Arrange
      const enemy = buildEnemy();
      const data = { id: 1 };
      enemy.enemy = () => data;

      // Act & Assert
      expect(enemy.databaseData()).toBe(data);
    });
  });

  describe('getEnemyNotes', () =>
  {
    it('returns a single-element array containing the enemy database entry', () =>
    {
      // Arrange
      const enemy = buildEnemy();
      const data = { id: 1 };
      enemy.enemy = () => data;

      // Act
      const result = enemy.getEnemyNotes();

      // Assert
      expect(result).toEqual([ data ]);
    });
  });

  describe('setup', () =>
  {
    it('fires onSetup with the given enemyId', () =>
    {
      // Arrange
      const enemy = buildEnemy();
      enemy.onSetup = vi.fn();

      // Act
      enemy.setup(3);

      // Assert
      expect(enemy.onSetup).toHaveBeenCalledWith(3);
    });
  });

  describe('onSetup', () =>
  {
    it('flags the battler for a data-change refresh', () =>
    {
      // Arrange
      const enemy = buildEnemy();
      enemy.onBattlerDataChange = vi.fn();

      // Act
      enemy.onSetup(1);

      // Assert
      expect(enemy.onBattlerDataChange).toHaveBeenCalled();
    });
  });

  describe('traitObjects', () =>
  {
    it('routes through the Game_BattlerBase cache wrapper', () =>
    {
      // Arrange
      const enemy = buildEnemy();
      enemy.buildTraitObjects = () => [ { id: 'built' } ];

      // Act
      const result = enemy.traitObjects();

      // Assert
      expect(result).toEqual([ { id: 'built' } ]);
    });
  });

  describe('buildTraitObjects', () =>
  {
    it('combines states with the enemy\'s own database entry', () =>
    {
      // Arrange
      const enemy = buildEnemy();
      enemy.states = () => [ { tag: 'state' } ];
      enemy.enemy = () => ({ tag: 'enemy' });

      // Act
      const result = enemy.buildTraitObjects();

      // Assert
      expect(result.map(r => r.tag)).toEqual([ 'state', 'enemy' ]);
    });
  });

  describe('skills', () =>
  {
    it('resolves skills from mappable actions plus any ADD_SKILL traits, sorted', () =>
    {
      // Arrange
      const enemy = buildEnemy();
      enemy.enemy = () => ({ actions: [ { skillId: 5 }, { skillId: 3 } ] });
      enemy.canMapActionToSkill = () => true;
      enemy.skill = (id) => ({ id, toString: () => String(id) });
      enemy.traitObjects = () => [
        { code: globalThis.J.BASE.Traits.ADD_SKILL, dataId: 1 },
        { code: 999, dataId: 7 },
      ];

      // Act
      const result = enemy.skills();

      // Assert- action skills (5, 3) plus the ADD_SKILL trait skill (1), sorted by default Array#sort.
      expect(result.map(s => s.id)).toEqual([ 1, 3, 5 ]);
    });

    it('excludes actions that fail canMapActionToSkill', () =>
    {
      // Arrange
      const enemy = buildEnemy();
      enemy.enemy = () => ({ actions: [ { skillId: 5 }, { skillId: 3 } ] });
      enemy.canMapActionToSkill = (action) => action.skillId === 5;
      enemy.skill = (id) => ({ id });
      enemy.traitObjects = () => [];

      // Act
      const result = enemy.skills();

      // Assert
      expect(result.map(s => s.id)).toEqual([ 5 ]);
    });
  });

  describe('skillIds', () =>
  {
    it('combines mappable action skill ids with ADD_SKILL trait ids, deduplicated', () =>
    {
      // Arrange
      const enemy = buildEnemy();
      enemy.enemy = () => ({ actions: [ { skillId: 5 }, { skillId: 3 } ] });
      enemy.canMapActionToSkill = () => true;
      enemy.traitObjects = () => [
        { code: globalThis.J.BASE.Traits.ADD_SKILL, dataId: 3 },
        { code: globalThis.J.BASE.Traits.ADD_SKILL, dataId: 1 },
        { code: 999, dataId: 7 },
      ];

      // Act
      const result = enemy.skillIds();

      // Assert- 3 appears in both sources but is deduplicated.
      expect(result.sort()).toEqual([ 1, 3, 5 ]);
    });
  });

  describe('canMapActionToSkill', () =>
  {
    it('returns true by default', () =>
    {
      // Arrange
      const enemy = buildEnemy();

      // Act & Assert
      expect(enemy.canMapActionToSkill({})).toBe(true);
    });
  });

  describe('hasSkill', () =>
  {
    it('returns true when a known skill matches the given id', () =>
    {
      // Arrange
      const enemy = buildEnemy();
      enemy.skills = () => [ { id: 5 } ];

      // Act & Assert
      expect(enemy.hasSkill(5)).toBe(true);
    });

    it('returns false when no known skill matches the given id', () =>
    {
      // Arrange
      const enemy = buildEnemy();
      enemy.skills = () => [ { id: 5 } ];

      // Act & Assert
      expect(enemy.hasSkill(9)).toBe(false);
    });
  });

  describe('learnSkill', () =>
  {
    it('does not add a new action when the skill is already known', () =>
    {
      // Arrange
      const enemy = buildEnemy();
      enemy.hasSkill = () => true;
      const actions = [];
      enemy.enemy = () => ({ actions });

      // Act
      const result = enemy.learnSkill(5);

      // Assert
      expect(result).toBe(false);
      expect(actions).toHaveLength(0);
    });

    it('adds a new rating-5 action and returns true when the skill was not already known', () =>
    {
      // Arrange
      const enemy = buildEnemy();
      enemy.hasSkill = () => false;
      const actions = [];
      enemy.enemy = () => ({ actions });

      // Act
      const result = enemy.learnSkill(5);

      // Assert
      expect(result).toBe(true);
      expect(actions).toEqual([
        { conditionParam1: 0, conditionParam2: 0, conditionType: 0, rating: 5, skillId: 5 },
      ]);
    });
  });

  describe('die', () =>
  {
    it('fires onDeath', () =>
    {
      // Arrange
      const enemy = buildEnemy();
      enemy.onDeath = vi.fn();

      // Act
      enemy.die();

      // Assert
      expect(enemy.onDeath).toHaveBeenCalled();
    });
  });

  describe('onDeath', () =>
  {
    it('flags the battler for a data-change refresh', () =>
    {
      // Arrange
      const enemy = buildEnemy();
      enemy.onBattlerDataChange = vi.fn();

      // Act
      enemy.onDeath();

      // Assert
      expect(enemy.onBattlerDataChange).toHaveBeenCalled();
    });
  });

  describe('getBaseMaxTp', () =>
  {
    it('returns J.BASE.Metadata.BaseTpMaxEnemies', () =>
    {
      // Arrange
      const enemy = buildEnemy();

      // Act
      const result = enemy.getBaseMaxTp();

      // Assert
      expect(result).toBe(globalThis.J.BASE.Metadata.BaseTpMaxEnemies);
    });
  });
});
//endregion plugins/_base/_component/game-enemy-methods.test.js
