//region plugins/omni/ext/stats/__models/statistopedia-records.test.js
import { beforeEach, describe, expect, it } from 'vitest';

import { installSaveRegistrationRealm } from '../../../../../setup/install-save-registration-realm.js';

describe('StatistopediaRecords', () =>
{
  /**
   * The class under test, re-imported per test so the registry it registers into stays fresh.
   * @type {Function}
   */
  let StatistopediaRecords;

  /**
   * A fresh record to act upon.
   * @type {object}
   */
  let records;

  beforeEach(async () =>
  {
    await installSaveRegistrationRealm();

    const imported = await import('../../../../../../src/plugins/omni/ext/stats/__models/StatistopediaRecords.js');

    StatistopediaRecords = imported.default;
    records = new StatistopediaRecords();
  });

  describe('registration', () =>
  {
    it('registers itself as a serializable type', async () =>
    {
      // Arrange.
      const { SerializableRegistry } = await installSaveRegistrationRealm();

      // Act.
      const imported = await import('../../../../../../src/plugins/omni/ext/stats/__models/StatistopediaRecords.js');

      // Assert.
      expect(SerializableRegistry.registrations()
        .has(imported.default)).toBe(true);
    });
  });

  describe('killsByEnemyId', () =>
  {
    it('starts a tally for an enemy never killed before', () =>
    {
      // Arrange.
      records.addKillForEnemy(88);

      // Act.
      const kills = records.killsByEnemyId();

      // Assert.
      expect(kills.get(88)).toBe(1);
    });

    it('adds onto the tally for an enemy already killed', () =>
    {
      // Arrange: a near-miss sibling that has to survive the increment untouched.
      records.addKillForEnemy(88);
      records.addKillForEnemy(89);

      // Act.
      records.addKillForEnemy(88);

      // Assert.
      const kills = records.killsByEnemyId();
      expect(kills.get(88)).toBe(2);
      expect(kills.get(89)).toBe(1);
    });
  });

  describe('damageByWeaponId', () =>
  {
    it('starts a total for a weapon that has never dealt damage', () =>
    {
      // Arrange.
      records.addDamageForWeapon(12, 340);

      // Act.
      const damage = records.damageByWeaponId();

      // Assert.
      expect(damage.get(12)).toBe(340);
    });

    it('adds onto the total for a weapon that has dealt damage before', () =>
    {
      // Arrange: a sibling weapon whose total must not move.
      records.addDamageForWeapon(12, 340);
      records.addDamageForWeapon(13, 700);

      // Act.
      records.addDamageForWeapon(12, 60);

      // Assert.
      const damage = records.damageByWeaponId();
      expect(damage.get(12)).toBe(400);
      expect(damage.get(13)).toBe(700);
    });
  });

  describe('usageBySkillId', () =>
  {
    it('starts a count for a skill never used before', () =>
    {
      // Arrange.
      records.addUsageForSkill(41);

      // Act.
      const usage = records.usageBySkillId();

      // Assert.
      expect(usage.get(41)).toBe(1);
    });

    it('adds onto the count for a skill used before', () =>
    {
      // Arrange: a sibling skill whose count must not move.
      records.addUsageForSkill(41);
      records.addUsageForSkill(42);

      // Act.
      records.addUsageForSkill(41);

      // Assert.
      const usage = records.usageBySkillId();
      expect(usage.get(41)).toBe(2);
      expect(usage.get(42)).toBe(1);
    });
  });

  describe('killsByMapId', () =>
  {
    it('starts a tally for a map with no kills yet', () =>
    {
      // Arrange.
      records.addKillForMap(7);

      // Act.
      const kills = records.killsByMapId();

      // Assert.
      expect(kills.get(7)).toBe(1);
    });

    it('adds onto the tally for a map with kills already', () =>
    {
      // Arrange: a sibling map whose tally must not move.
      records.addKillForMap(7);
      records.addKillForMap(8);

      // Act.
      records.addKillForMap(7);

      // Assert.
      const kills = records.killsByMapId();
      expect(kills.get(7)).toBe(2);
      expect(kills.get(8)).toBe(1);
    });
  });

  describe('deathsByMapId', () =>
  {
    it('starts a tally for a map with no deaths yet', () =>
    {
      // Arrange.
      records.addDeathForMap(7);

      // Act.
      const deaths = records.deathsByMapId();

      // Assert.
      expect(deaths.get(7)).toBe(1);
    });

    it('adds onto the tally for a map with deaths already', () =>
    {
      // Arrange: a sibling map whose tally must not move.
      records.addDeathForMap(7);
      records.addDeathForMap(8);

      // Act.
      records.addDeathForMap(7);

      // Assert.
      const deaths = records.deathsByMapId();
      expect(deaths.get(7)).toBe(2);
      expect(deaths.get(8)).toBe(1);
    });
  });

  describe('visitedMapIds', () =>
  {
    it('remembers a map the party has entered', () =>
    {
      // Arrange.
      records.addVisitedMap(19);
      records.addVisitedMap(20);

      // Act.
      records.addVisitedMap(19);

      // Assert: revisiting is not a second place seen.
      const visited = records.visitedMapIds();
      expect(visited.size).toBe(2);
      expect(visited.has(19)).toBe(true);
      expect(visited.has(20)).toBe(true);
    });
  });

  describe('hitsLanded', () =>
  {
    it('counts a landed hit', () =>
    {
      // Arrange.
      records.addHitLanded();

      // Act.
      records.addHitLanded();

      // Assert.
      expect(records.hitsLanded()).toBe(2);
    });

    it('accepts a total being set outright', () =>
    {
      // Arrange.
      records.setHitsLanded(37);

      // Act.
      const landed = records.hitsLanded();

      // Assert.
      expect(landed).toBe(37);
    });
  });

  describe('hitsTaken', () =>
  {
    it('counts a hit taken', () =>
    {
      // Arrange.
      records.addHitTaken();

      // Act.
      records.addHitTaken();

      // Assert.
      expect(records.hitsTaken()).toBe(2);
    });

    it('accepts a total being set outright', () =>
    {
      // Arrange.
      records.setHitsTaken(23);

      // Act.
      const taken = records.hitsTaken();

      // Assert.
      expect(taken).toBe(23);
    });
  });

  describe('kill streaks', () =>
  {
    it('promotes the running streak to the record when it passes it', () =>
    {
      // Arrange.
      records.setLongestKillStreak(1);
      records.setCurrentKillStreak(1);

      // Act.
      records.extendKillStreak();

      // Assert.
      expect(records.currentKillStreak()).toBe(2);
      expect(records.longestKillStreak()).toBe(2);
    });

    it('leaves the record alone when the running streak has not passed it', () =>
    {
      // Arrange.
      records.setLongestKillStreak(9);
      records.setCurrentKillStreak(3);

      // Act.
      records.extendKillStreak();

      // Assert.
      expect(records.currentKillStreak()).toBe(4);
      expect(records.longestKillStreak()).toBe(9);
    });

    it('ends the running streak without disturbing the record', () =>
    {
      // Arrange.
      records.setLongestKillStreak(9);
      records.setCurrentKillStreak(4);

      // Act.
      records.breakKillStreak();

      // Assert.
      expect(records.currentKillStreak()).toBe(0);
      expect(records.longestKillStreak()).toBe(9);
    });
  });

  describe('recordOverkill', () =>
  {
    it('takes the record when the candidate beats it', () =>
    {
      // Arrange.
      records.setBiggestOverkill(120);

      // Act.
      records.recordOverkill(400);

      // Assert.
      expect(records.biggestOverkill()).toBe(400);
    });

    it('leaves the record alone when the candidate ties it', () =>
    {
      // Arrange.
      records.setBiggestOverkill(400);

      // Act.
      records.recordOverkill(400);

      // Assert.
      expect(records.biggestOverkill()).toBe(400);
    });

    it('leaves the record alone when the candidate falls short', () =>
    {
      // Arrange.
      records.setBiggestOverkill(400);

      // Act.
      records.recordOverkill(399);

      // Assert.
      expect(records.biggestOverkill()).toBe(400);
    });
  });

  describe('recordHpSurvived', () =>
  {
    it('ignores a reading that did not leave the player standing', () =>
    {
      // Arrange.
      records.setLowestHpSurvived(15);

      // Act.
      records.recordHpSurvived(0);

      // Assert.
      expect(records.lowestHpSurvived()).toBe(15);
    });

    it('takes the first record regardless of how comfortable it was', () =>
    {
      // Arrange: zero is the model's "nothing recorded", which no real reading could ever beat.
      records.setLowestHpSurvived(0);

      // Act.
      records.recordHpSurvived(950);

      // Assert.
      expect(records.lowestHpSurvived()).toBe(950);
    });

    it('takes the record when the reading is closer than the one standing', () =>
    {
      // Arrange.
      records.setLowestHpSurvived(60);

      // Act.
      records.recordHpSurvived(12);

      // Assert.
      expect(records.lowestHpSurvived()).toBe(12);
    });

    it('leaves the record alone when the reading ties it', () =>
    {
      // Arrange.
      records.setLowestHpSurvived(12);

      // Act.
      records.recordHpSurvived(12);

      // Assert.
      expect(records.lowestHpSurvived()).toBe(12);
    });

    it('leaves the record alone when the reading was more comfortable', () =>
    {
      // Arrange.
      records.setLowestHpSurvived(12);

      // Act.
      records.recordHpSurvived(13);

      // Assert.
      expect(records.lowestHpSurvived()).toBe(12);
    });
  });
});
//endregion plugins/omni/ext/stats/__models/statistopedia-records.test.js
