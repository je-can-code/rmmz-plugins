//region plugins/omni/ext/stats/managers/statistopedia-service.test.js
import { beforeEach, describe, expect, it } from 'vitest';

import {
  installOmniStatsHostGlobals,
  SAMPLE_METRIC_VARIABLE_IDS
} from '../_component/fixtures/install-omni-stats-host-globals.js';

import StatistopediaService
  from '../../../../../../src/plugins/omni/ext/stats/managers/StatistopediaService.js';

describe('StatistopediaService', () =>
{
  /**
   * Builds a stand-in for the party's records, answering only what the service asks it.
   * @param {object=} overrides The readings this record should report.
   * @returns {object} The stubbed records.
   */
  const buildRecords = (overrides = {}) =>
  {
    const {
      hitsLanded = 0,
      hitsTaken = 0,
      longestKillStreak = 0,
      currentKillStreak = 0,
      biggestOverkill = 0,
      lowestHpSurvived = 0,
      damageByWeaponId = new Map(),
      usageBySkillId = new Map(),
      killsByEnemyId = new Map(),
      killsByMapId = new Map(),
      deathsByMapId = new Map(),
      visitedMapIds = new Set(),
    } = overrides;

    return {
      hitsLanded: () => hitsLanded,
      hitsTaken: () => hitsTaken,
      longestKillStreak: () => longestKillStreak,
      currentKillStreak: () => currentKillStreak,
      biggestOverkill: () => biggestOverkill,
      lowestHpSurvived: () => lowestHpSurvived,
      damageByWeaponId: () => damageByWeaponId,
      usageBySkillId: () => usageBySkillId,
      killsByEnemyId: () => killsByEnemyId,
      killsByMapId: () => killsByMapId,
      deathsByMapId: () => deathsByMapId,
      visitedMapIds: () => visitedMapIds,
    };
  };

  /**
   * Finds one row by its label.
   * @param {Array<{label: string, value: string}>} rows The rows to search.
   * @param {string} label The label to find.
   * @returns {{label: string, value: string}} The row found.
   */
  const rowFor = (rows, label) => rows.find(row => row.label === label);

  beforeEach(() =>
  {
    installOmniStatsHostGlobals({ records: buildRecords() });
  });

  describe('sections', () =>
  {
    it('presents the sections in a fixed order', () =>
    {
      // Arrange.
      const expectedKeys = [ 'combat', 'defense', 'usage', 'records', 'world' ];

      // Act.
      const keys = StatistopediaService.sections()
        .map(section => section.key);

      // Assert.
      expect(keys).toEqual(expectedKeys);
    });
  });

  describe('rowsFor', () =>
  {
    it('builds nothing for a key no section owns', () =>
    {
      // Arrange.
      const unknownKey = 'not-a-section';

      // Act.
      const rows = StatistopediaService.rowsFor(unknownKey);

      // Assert.
      expect(rows).toEqual([]);
    });

    it('routes every declared section to rows of its own', () =>
    {
      // Arrange.
      const sections = StatistopediaService.sections();

      // Act.
      const rowCounts = sections.map(section => StatistopediaService.rowsFor(section.key).length);

      // Assert: no declared section may route to the empty default arm.
      expect(rowCounts.every(count => count > 0)).toBe(true);
    });
  });

  describe('combatRows', () =>
  {
    it('reads each lifetime counter out of the variable it was assigned', () =>
    {
      // Arrange.
      installOmniStatsHostGlobals({
        records: buildRecords({ hitsLanded: 200 }),
        variables: {
          [SAMPLE_METRIC_VARIABLE_IDS.enemiesDefeated]: 1234,
          [SAMPLE_METRIC_VARIABLE_IDS.totalDamageDealt]: 56789,
          [SAMPLE_METRIC_VARIABLE_IDS.highestDamageDealt]: 4200,
          [SAMPLE_METRIC_VARIABLE_IDS.numberOfCritsDealt]: 50,
          [SAMPLE_METRIC_VARIABLE_IDS.biggestCritDealt]: 8100,
        },
      });

      // Act.
      const rows = StatistopediaService.rowsFor('combat');

      // Assert.
      expect(rowFor(rows, 'Enemies Defeated').value).toBe('1,234');
      expect(rowFor(rows, 'Total Damage Dealt').value).toBe('56,789');
      expect(rowFor(rows, 'Biggest Hit').value).toBe('4,200');
      expect(rowFor(rows, 'Critical Hits Landed').value).toBe('50');
      expect(rowFor(rows, 'Biggest Critical').value).toBe('8,100');
    });

    it('divides crits by landed hits for the critical rate', () =>
    {
      // Arrange.
      installOmniStatsHostGlobals({
        records: buildRecords({ hitsLanded: 200 }),
        variables: { [SAMPLE_METRIC_VARIABLE_IDS.numberOfCritsDealt]: 50 },
      });

      // Act.
      const rows = StatistopediaService.rowsFor('combat');

      // Assert.
      expect(rowFor(rows, 'Critical Rate').value).toBe('25.0%');
    });

    it('divides landed hits by every swing for accuracy', () =>
    {
      // Arrange: 150 landed against 50 evaded is 200 swings.
      installOmniStatsHostGlobals({
        records: buildRecords({ hitsLanded: 150 }),
        variables: { [SAMPLE_METRIC_VARIABLE_IDS.attacksEvadedByEnemies]: 50 },
      });

      // Act.
      const rows = StatistopediaService.rowsFor('combat');

      // Assert.
      expect(rowFor(rows, 'Accuracy').value).toBe('75.0%');
    });

    it('reports no rate at all when nothing has been swung yet', () =>
    {
      // Arrange: a player who has never swung has no rate, and zero percent would be a claim.
      installOmniStatsHostGlobals({ records: buildRecords({ hitsLanded: 0 }) });

      // Act.
      const rows = StatistopediaService.rowsFor('combat');

      // Assert.
      expect(rowFor(rows, 'Critical Rate').value).toBe('n/a');
      expect(rowFor(rows, 'Accuracy').value).toBe('n/a');
    });

    it('averages damage across kills, rounded', () =>
    {
      // Arrange: 1000 damage across 3 kills is 333.33, which presents as 333.
      installOmniStatsHostGlobals({
        records: buildRecords(),
        variables: {
          [SAMPLE_METRIC_VARIABLE_IDS.totalDamageDealt]: 1000,
          [SAMPLE_METRIC_VARIABLE_IDS.enemiesDefeated]: 3,
        },
      });

      // Act.
      const rows = StatistopediaService.rowsFor('combat');

      // Assert.
      expect(rowFor(rows, 'Damage per Kill').value).toBe('333');
    });

    it('reports no average when nothing has been killed', () =>
    {
      // Arrange.
      installOmniStatsHostGlobals({
        records: buildRecords(),
        variables: {
          [SAMPLE_METRIC_VARIABLE_IDS.totalDamageDealt]: 1000,
          [SAMPLE_METRIC_VARIABLE_IDS.enemiesDefeated]: 0,
        },
      });

      // Act.
      const rows = StatistopediaService.rowsFor('combat');

      // Assert.
      expect(rowFor(rows, 'Damage per Kill').value).toBe('n/a');
    });
  });

  describe('defenseRows', () =>
  {
    it('derives lucky parries by taking the deliberate ones out of the total', () =>
    {
      // Arrange: the precise tally is a subset of the total, so 30 of 110 leaves 80 by luck.
      installOmniStatsHostGlobals({
        records: buildRecords(),
        variables: {
          [SAMPLE_METRIC_VARIABLE_IDS.numberOfParries]: 110,
          [SAMPLE_METRIC_VARIABLE_IDS.numberOfPreciseParries]: 30,
        },
      });

      // Act.
      const rows = StatistopediaService.rowsFor('defense');

      // Assert.
      expect(rowFor(rows, 'Parries').value).toBe('110');
      expect(rowFor(rows, 'Parries on Purpose').value).toBe('30');
      expect(rowFor(rows, 'Parries by Luck').value).toBe('80');
    });

    it('averages damage stopped across the hits that were guarded', () =>
    {
      // Arrange.
      installOmniStatsHostGlobals({
        records: buildRecords(),
        variables: {
          [SAMPLE_METRIC_VARIABLE_IDS.damagePreventedByGuarding]: 900,
          [SAMPLE_METRIC_VARIABLE_IDS.numberOfGuardedHits]: 4,
        },
      });

      // Act.
      const rows = StatistopediaService.rowsFor('defense');

      // Assert.
      expect(rowFor(rows, 'Stopped per Guarded Hit').value).toBe('225');
    });

    it('divides crits taken by hits taken for the rate against you', () =>
    {
      // Arrange.
      installOmniStatsHostGlobals({
        records: buildRecords({ hitsTaken: 40 }),
        variables: { [SAMPLE_METRIC_VARIABLE_IDS.numberOfCritsTaken]: 4 },
      });

      // Act.
      const rows = StatistopediaService.rowsFor('defense');

      // Assert.
      expect(rowFor(rows, 'Critical Rate Against You').value).toBe('10.0%');
    });
  });

  describe('usageRows', () =>
  {
    it('reads each usage counter out of the variable it was assigned', () =>
    {
      // Arrange.
      installOmniStatsHostGlobals({
        records: buildRecords(),
        variables: {
          [SAMPLE_METRIC_VARIABLE_IDS.mainhandSkillUsage]: 4000,
          [SAMPLE_METRIC_VARIABLE_IDS.dodgeSkillUsage]: 611,
          [SAMPLE_METRIC_VARIABLE_IDS.toolUsage]: 7,
        },
      });

      // Act.
      const rows = StatistopediaService.rowsFor('usage');

      // Assert.
      expect(rowFor(rows, 'Mainhand Swings').value).toBe('4,000');
      expect(rowFor(rows, 'Dodges').value).toBe('611');
      expect(rowFor(rows, 'Tools Used').value).toBe('7');
    });
  });

  describe('recordsRows', () =>
  {
    it('reports the streaks and the overkill record as they stand', () =>
    {
      // Arrange.
      installOmniStatsHostGlobals({
        records: buildRecords({
          longestKillStreak: 47,
          currentKillStreak: 3,
          biggestOverkill: 2400,
        }),
      });

      // Act.
      const rows = StatistopediaService.rowsFor('records');

      // Assert.
      expect(rowFor(rows, 'Longest Kill Streak').value).toBe('47');
      expect(rowFor(rows, 'Current Kill Streak').value).toBe('3');
      expect(rowFor(rows, 'Biggest Overkill').value).toBe('2,400');
    });

    it('reports no closest call before the first one happens', () =>
    {
      // Arrange: zero is the model saying nothing is recorded, not a survival at zero hp.
      installOmniStatsHostGlobals({ records: buildRecords({ lowestHpSurvived: 0 }) });

      // Act.
      const rows = StatistopediaService.rowsFor('records');

      // Assert.
      expect(rowFor(rows, 'Closest Call').value).toBe('n/a');
    });

    it('reports the closest call once one has been recorded', () =>
    {
      // Arrange.
      installOmniStatsHostGlobals({ records: buildRecords({ lowestHpSurvived: 7 }) });

      // Act.
      const rows = StatistopediaService.rowsFor('records');

      // Assert.
      expect(rowFor(rows, 'Closest Call').value).toBe('7 hp');
    });

    it('names the weapon with the most damage against a rival that has less', () =>
    {
      // Arrange: the rival has to lose, which a single-entry fixture could never prove.
      const damageByWeaponId = new Map([ [ 12, 500 ], [ 13, 9000 ] ]);
      installOmniStatsHostGlobals({ records: buildRecords({ damageByWeaponId }) });

      // Act.
      const rows = StatistopediaService.rowsFor('records');

      // Assert.
      expect(rowFor(rows, 'Favorite Weapon').value).toBe('Iron Ladle (9,000)');
    });

    it('reports no favorite weapon before any damage is attributed', () =>
    {
      // Arrange.
      installOmniStatsHostGlobals({ records: buildRecords({ damageByWeaponId: new Map() }) });

      // Act.
      const rows = StatistopediaService.rowsFor('records');

      // Assert.
      expect(rowFor(rows, 'Favorite Weapon').value).toBe('n/a');
    });

    it('names the most-used skill against a rival that was used less', () =>
    {
      // Arrange.
      const usageBySkillId = new Map([ [ 41, 300 ], [ 42, 12 ] ]);
      installOmniStatsHostGlobals({ records: buildRecords({ usageBySkillId }) });

      // Act.
      const rows = StatistopediaService.rowsFor('records');

      // Assert.
      expect(rowFor(rows, 'Most-Used Skill').value).toBe('Sear (300)');
    });

    it('reports no most-used skill before any skill is used', () =>
    {
      // Arrange.
      installOmniStatsHostGlobals({ records: buildRecords({ usageBySkillId: new Map() }) });

      // Act.
      const rows = StatistopediaService.rowsFor('records');

      // Assert.
      expect(rowFor(rows, 'Most-Used Skill').value).toBe('n/a');
    });

    it('names the most-slain enemy against a near-identical sibling', () =>
    {
      // Arrange: two enemies from the same family, only one of which may win.
      const killsByEnemyId = new Map([ [ 88, 40 ], [ 89, 847 ] ]);
      installOmniStatsHostGlobals({ records: buildRecords({ killsByEnemyId }) });

      // Act.
      const rows = StatistopediaService.rowsFor('records');

      // Assert.
      expect(rowFor(rows, 'Most Slain').value).toBe('Bearcat Alpha (847)');
    });

    it('reports nothing most-slain before anything is killed', () =>
    {
      // Arrange.
      installOmniStatsHostGlobals({ records: buildRecords({ killsByEnemyId: new Map() }) });

      // Act.
      const rows = StatistopediaService.rowsFor('records');

      // Assert.
      expect(rowFor(rows, 'Most Slain').value).toBe('n/a');
    });
  });

  describe('worldRows', () =>
  {
    it('counts places seen rather than times arrived', () =>
    {
      // Arrange.
      const visitedMapIds = new Set([ 7, 8, 19 ]);
      installOmniStatsHostGlobals({
        records: buildRecords({ visitedMapIds }),
        steps: 48210,
        variables: { [SAMPLE_METRIC_VARIABLE_IDS.destructiblesDestroyed]: 92 },
      });

      // Act.
      const rows = StatistopediaService.rowsFor('world');

      // Assert.
      expect(rowFor(rows, 'Places Visited').value).toBe('3');
      expect(rowFor(rows, 'Steps Taken').value).toBe('48,210');
      expect(rowFor(rows, 'Things Broken').value).toBe('92');
    });

    it('names the deadliest place against a map that killed you less', () =>
    {
      // Arrange.
      const deathsByMapId = new Map([ [ 7, 2 ], [ 8, 11 ] ]);
      installOmniStatsHostGlobals({
        records: buildRecords({ deathsByMapId }),
        mapId: 1,
      });

      // Act.
      const rows = StatistopediaService.rowsFor('world');

      // Assert.
      expect(rowFor(rows, 'Deadliest Place').value).toBe('Salt Flats (11)');
    });

    it('reports no deadliest place before the first death', () =>
    {
      // Arrange.
      installOmniStatsHostGlobals({ records: buildRecords({ deathsByMapId: new Map() }) });

      // Act.
      const rows = StatistopediaService.rowsFor('world');

      // Assert.
      expect(rowFor(rows, 'Deadliest Place').value).toBe('n/a');
    });

    it('names the busiest hunting ground against a quieter map', () =>
    {
      // Arrange.
      const killsByMapId = new Map([ [ 7, 900 ], [ 8, 30 ] ]);
      installOmniStatsHostGlobals({
        records: buildRecords({ killsByMapId }),
        mapId: 1,
      });

      // Act.
      const rows = StatistopediaService.rowsFor('world');

      // Assert.
      expect(rowFor(rows, 'Busiest Hunting Ground').value).toBe('Sunken Larder (900)');
    });

    it('reports no busiest hunting ground before anything is killed', () =>
    {
      // Arrange.
      installOmniStatsHostGlobals({ records: buildRecords({ killsByMapId: new Map() }) });

      // Act.
      const rows = StatistopediaService.rowsFor('world');

      // Assert.
      expect(rowFor(rows, 'Busiest Hunting Ground').value).toBe('n/a');
    });

    it('prefers the display name for the map the player is standing on', () =>
    {
      // Arrange: only the loaded map has a display name in memory to prefer.
      const killsByMapId = new Map([ [ 7, 900 ] ]);
      installOmniStatsHostGlobals({
        records: buildRecords({ killsByMapId }),
        mapId: 7,
        displayName: 'The Sunken Larder',
      });

      // Act.
      const rows = StatistopediaService.rowsFor('world');

      // Assert.
      expect(rowFor(rows, 'Busiest Hunting Ground').value).toBe('The Sunken Larder (900)');
    });

    it('falls back to the editor name when the current map sets no display name', () =>
    {
      // Arrange.
      const killsByMapId = new Map([ [ 7, 900 ] ]);
      installOmniStatsHostGlobals({
        records: buildRecords({ killsByMapId }),
        mapId: 7,
        displayName: '',
      });

      // Act.
      const rows = StatistopediaService.rowsFor('world');

      // Assert.
      expect(rowFor(rows, 'Busiest Hunting Ground').value).toBe('Sunken Larder (900)');
    });
    it('does not lend the current map display name to a different map', () =>
    {
      // Arrange: the player is standing somewhere named, while the leader is somewhere else entirely.
      const killsByMapId = new Map([ [ 7, 900 ] ]);
      installOmniStatsHostGlobals({
        records: buildRecords({ killsByMapId }),
        mapId: 1,
        displayName: 'Home Kitchen',
      });

      // Act.
      const rows = StatistopediaService.rowsFor('world');

      // Assert: the display name in memory belongs to map 1, and map 7 must not borrow it.
      expect(rowFor(rows, 'Busiest Hunting Ground').value).toBe('Sunken Larder (900)');
    });

  });

  describe('largestEntry', () =>
  {
    it('hands back nothing for a tally with no entries', () =>
    {
      // Arrange.
      const tally = new Map();

      // Act.
      const leader = StatistopediaService.largestEntry(tally);

      // Assert.
      expect(leader).toBeNull();
    });

    it('keeps the first of two entries that tie', () =>
    {
      // Arrange.
      const tally = new Map([ [ 88, 5 ], [ 89, 5 ] ]);

      // Act.
      const leader = StatistopediaService.largestEntry(tally);

      // Assert.
      expect(leader.key).toBe(88);
    });

    it('takes a later entry that beats the leader', () =>
    {
      // Arrange.
      const tally = new Map([ [ 88, 5 ], [ 89, 6 ] ]);

      // Act.
      const leader = StatistopediaService.largestEntry(tally);

      // Assert.
      expect(leader.key).toBe(89);
      expect(leader.value).toBe(6);
    });
  });

  describe('constructor', () =>
  {
    it('refuses to be built, being a static class', () =>
    {
      // Arrange.
      const build = () => new StatistopediaService();

      // Act & Assert.
      expect(build).toThrow('This is a static class.');
    });
  });
});
//endregion plugins/omni/ext/stats/managers/statistopedia-service.test.js
