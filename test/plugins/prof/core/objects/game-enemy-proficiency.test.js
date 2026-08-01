//region plugins/prof/core/objects/game-enemy-proficiency.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  initializeProficiencies,
  installProfHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJProf,
} from '../../_component/fixtures/install-prof-host-globals.js';

/**
 * Enemies keep proficiencies too, which is what lets them scale their own skill usage over a long
 * fight or across a playthrough. The store is lazily built: a proficiency is created on first use
 * rather than seeded from the database, so the read path has to be safe to call for a skill the
 * enemy has never used and the write path has to refuse to shadow an existing record.
 */
describe('J-Proficiency Game_Enemy (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installProfHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/managers/RPGManager.js'));

    await import('../../../../../src/plugins/_base/objects/Game_BattlerBase.js');
    await import('../../../../../src/plugins/_base/objects/Game_Battler.js');
    await import('../../../../../src/plugins/_base/objects/Game_Action.js');
    await import('../../../../../src/plugins/_base/objects/Game_Actor.js');

    setPluginContextToJProf();
    await import('../../../../../src/plugins/prof/core/_metadata/initialization.js');

    globalThis.$dataActors = [];
    initializeProficiencies();

    await import('../../../../../src/plugins/prof/core/objects/Game_Battler.js');
    await import('../../../../../src/plugins/prof/core/objects/Game_Actor.js');
    await import('../../../../../src/plugins/prof/core/objects/Game_Enemy.js');
  });

  let enemy;

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();

    enemy = new globalThis.Game_Enemy();
    enemy.initMembers();
  });

  //region reading
  describe('skillProficiencies', () =>
  {
    it('starts an enemy with no proficiencies recorded', () =>
    {
      // Arrange & Act
      const proficiencies = enemy.skillProficiencies();

      // Assert
      expect(proficiencies).toEqual([]);
    });
  });

  describe('skillProficiencyBySkillId', () =>
  {
    it('finds a recorded proficiency by its skill', () =>
    {
      // Arrange
      enemy.addSkillProficiency(10, 5);

      // Act
      const proficiency = enemy.skillProficiencyBySkillId(10);

      // Assert
      expect(proficiency.proficiency).toBe(5);
    });

    it('finds nothing for a skill the enemy has never used', () =>
    {
      // Arrange & Act
      const proficiency = enemy.skillProficiencyBySkillId(99);

      // Assert
      expect(proficiency).toBeUndefined();
    });
  });
  //endregion reading

  //region creating
  describe('addSkillProficiency', () =>
  {
    it('records a new proficiency at the requested starting value', () =>
    {
      // Arrange & Act
      const proficiency = enemy.addSkillProficiency(10, 25);

      // Assert
      expect(proficiency.proficiency).toBe(25);
    });

    it('starts a proficiency at nothing when no value is given', () =>
    {
      // Arrange & Act
      const proficiency = enemy.addSkillProficiency(10);

      // Assert
      expect(proficiency.proficiency).toBe(0);
    });

    it('refuses to shadow an existing record', () =>
    {
      // Arrange: re-creating would silently discard whatever the enemy had already earned.
      const warn = vi.spyOn(console, 'warn')
        .mockImplementation(() => {});
      enemy.addSkillProficiency(10, 25);

      // Act
      const second = enemy.addSkillProficiency(10, 99);

      // Assert
      expect(second.proficiency).toBe(25);

      // restore manually so the spy cannot leak into whichever test runs next in this file.
      warn.mockRestore();
    });

    it('reports the duplicate attempt rather than swallowing it', () =>
    {
      // Arrange
      const warn = vi.spyOn(console, 'warn')
        .mockImplementation(() => {});
      enemy.addSkillProficiency(10, 25);

      // Act
      enemy.addSkillProficiency(10, 99);

      // Assert
      expect(warn).toHaveBeenCalled();

      warn.mockRestore();
    });
  });

  describe('tryGetSkillProficiencyBySkillId', () =>
  {
    it('returns the existing record when there is one', () =>
    {
      // Arrange
      enemy.addSkillProficiency(10, 7);

      // Act
      const proficiency = enemy.tryGetSkillProficiencyBySkillId(10);

      // Assert
      expect(proficiency.proficiency).toBe(7);
    });

    it('creates a record on demand for an unused skill', () =>
    {
      // Arrange: enemies never explicitly learn skills the way actors do, so the first use of
      // one has to be able to mint its record rather than finding nothing.
      // Act
      const proficiency = enemy.tryGetSkillProficiencyBySkillId(11);

      // Assert
      expect(proficiency.proficiency).toBe(0);
    });

    it('keeps the created record for later lookups', () =>
    {
      // Arrange
      enemy.tryGetSkillProficiencyBySkillId(11);

      // Act
      const proficiency = enemy.skillProficiencyBySkillId(11);

      // Assert
      expect(proficiency).toBeTruthy();
    });
  });
  //endregion creating

  //region improving
  describe('increaseSkillProficiency', () =>
  {
    it('improves an existing proficiency by the given amount', () =>
    {
      // Arrange
      enemy.addSkillProficiency(10, 5);

      // Act
      enemy.increaseSkillProficiency(10, 3);

      // Assert
      expect(enemy.skillProficiencyBySkillId(10).proficiency).toBe(8);
    });

    it('improves by one when no amount is given', () =>
    {
      // Arrange
      enemy.addSkillProficiency(10, 5);

      // Act
      enemy.increaseSkillProficiency(10);

      // Assert
      expect(enemy.skillProficiencyBySkillId(10).proficiency).toBe(6);
    });

    it('creates the record first when improving an unused skill', () =>
    {
      // Arrange & Act
      enemy.increaseSkillProficiency(12, 4);

      // Assert
      expect(enemy.skillProficiencyBySkillId(12).proficiency).toBe(4);
    });
  });
  //endregion improving
});
//endregion plugins/prof/core/objects/game-enemy-proficiency.test.js