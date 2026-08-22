//region plugins/regions/ext/skills/objects/_component/game-map.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installRegionsSkillsStackHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJRegions,
  setPluginContextToJRegionsSkills,
} from '../../../../_component/fixtures/install-regions-host-globals.js';

/**
 * The map's side of region skills: the per-region table, and where it comes from.
 *
 * The table is rebuilt from the map's notes on every `setup`, which is what makes the clear-then-
 * refresh order load-bearing - a map entered twice would otherwise accumulate two copies of every
 * tag and fire each region skill twice.
 */
describe('J-Regions-Skills Game_Map', () =>
{
  /**
   * Builds a map already set up against whatever note is currently staged.
   * @returns {Game_Map} The map under test.
   */
  const buildMap = () =>
  {
    const map = new globalThis.Game_Map();
    map.initialize();
    map.setup(1);

    return map;
  };

  beforeAll(async () =>
  {
    vi.resetModules();

    installRegionsSkillsStackHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import(
      '../../../../../../../src/plugins/_base/core/managers/RPGManager.js'));

    setPluginContextToJRegions();
    await import('../../../../../../../src/plugins/regions/core/_metadata/initialization.js');
    await import('../../../../../../../src/plugins/regions/core/objects/Game_Map.js');

    setPluginContextToJRegionsSkills();
    await import('../../../../../../../src/plugins/regions/ext/skills/_metadata/initialization.js');

    await import('../../../../../../../src/plugins/regions/ext/skills/objects/Game_Map.js');
  });

  beforeEach(() =>
  {
    globalThis.$dataMap = { note: '' };
  });

  //region reading the table
  describe('getRegionSkillsByRegionId()', () =>
  {
    it('finds the skills tagged to a region', () =>
    {
      // Arrange
      globalThis.$dataMap = { note: '<regionSkill:[1, 2, 100, 7, true]>' };

      // Act
      const found = buildMap()
        .getRegionSkillsByRegionId(1);

      // Assert
      expect(found.length)
        .toBe(1);
    });

    it('answers with an empty list for a region nothing is tagged to', () =>
    {
      // Arrange: every character asks this every cadence, so an untagged region is the common case
      // and it has to answer with something iterable rather than nothing.
      globalThis.$dataMap = { note: '<regionSkill:[1, 2, 100, 7, true]>' };

      // Act
      const found = buildMap()
        .getRegionSkillsByRegionId(9);

      // Assert
      expect(found)
        .toEqual([]);
    });
  });
  //endregion reading the table

  //region building the table
  describe('addRegionSkillDataByRegionId()', () =>
  {
    it('starts a region\'s list with the first skill tagged to it', () =>
    {
      // Arrange
      const map = buildMap();

      // Act
      map.addRegionSkillDataByRegionId(4, { skillId: 11 });

      // Assert
      expect(map.getRegionSkillsByRegionId(4)
        .map(data => data.skillId))
        .toEqual([ 11 ]);
    });

    it('stacks a second skill onto a region that already has one', () =>
    {
      // Arrange: stacking is deliberate - a region tagged twice fires both, because that is how an
      // author layers a damaging floor with a slowing one.
      const map = buildMap();
      map.addRegionSkillDataByRegionId(4, { skillId: 11 });

      // Act
      map.addRegionSkillDataByRegionId(4, { skillId: 12 });

      // Assert
      expect(map.getRegionSkillsByRegionId(4)
        .map(data => data.skillId))
        .toEqual([ 11, 12 ]);
    });
  });

  describe('clearRegionSkills()', () =>
  {
    it('empties the table so a re-entered map does not fire everything twice', () =>
    {
      // Arrange
      const map = buildMap();
      map.addRegionSkillDataByRegionId(4, { skillId: 11 });

      // Act
      map.clearRegionSkills();

      // Assert
      expect(map.getRegionSkillsByRegionId(4))
        .toEqual([]);
    });
  });
  //endregion building the table

  //region where the table comes from
  describe('refreshRegionSkills()', () =>
  {
    it('parses every tagged region off the map\'s notes', () =>
    {
      // Arrange
      globalThis.$dataMap = { note: '<regionSkill:[1, 2, 100, 7, true]>\n<regionSkill:[2, 3, 50, 8, false]>' };

      // Act
      const map = buildMap();

      // Assert
      expect(map.getRegionSkillsByRegionId(1).length)
        .toBe(1);
      expect(map.getRegionSkillsByRegionId(2).length)
        .toBe(1);
    });

    it('leaves the table alone on a map carrying no region skill tags', () =>
    {
      // Arrange
      globalThis.$dataMap = { note: '<someOtherTag>' };

      // Act
      const map = buildMap();

      // Assert
      expect(map.getRegionSkills().size)
        .toBe(0);
    });

    it('does nothing at all when there is no map data to read yet', () =>
    {
      // Arrange: `setup` runs before the map data lands during a load, and reading a note off
      // nothing would take the whole map transfer down.
      const map = buildMap();
      globalThis.$dataMap = null;

      // Act
      map.refreshRegionSkills();

      // Assert
      expect(map.getRegionSkills().size)
        .toBe(0);
    });

    it('honors a refusal from the shared region-effects gate even with tags waiting to be read', () =>
    {
      // Arrange: the sibling test above finds nothing whether the gate is consulted or not, because
      // an absent map reads as a blank note either way. Staging a genuinely tagged note leaves the
      // gate as the only thing standing between the map and a table full of region skills.
      const map = buildMap();
      globalThis.$dataMap = { note: '<regionSkill:[1, 2, 100, 7, true]>' };
      map.canRefreshRegionEffects = () => false;

      // Act
      map.refreshRegionSkills();

      // Assert
      expect(map.getRegionSkills().size)
        .toBe(0);
    });
  });
  //endregion where the table comes from
});
//endregion plugins/regions/ext/skills/objects/_component/game-map.test.js