//region plugins/regions/ext/skills/_component/region-skill-data-save-codec.test.js
import { beforeAll, describe, expect, it } from 'vitest';

/**
 * A map's region skills through the real save pipeline.
 *
 * `Game_Map` holds one {@link RegionSkillData} per `<regionSkill>` tag for as long as its map is loaded, so
 * every save made on such a map encodes them. An unregistered model makes that encode throw, and the throw
 * leaves the save scene before its catch is attached, which takes the game to the error screen.
 */
describe('RegionSkillData through the save codecs', () =>
{
  let RegionSkillData;
  let SaveEncoder;
  let SaveDecoder;

  beforeAll(async () =>
  {
    Object.defineProperty(String, 'empty', {
      enumerable: true,
      configurable: true,
      get: () => '',
    });

    ({ default: globalThis.SerializableRegistry } = await import(
      '../../../../../../src/plugins/_base/core/core/SerializableRegistry.js'));
    ({ default: SaveEncoder } = await import('../../../../../../src/plugins/_base/ext/save/core/SaveEncoder.js'));
    ({ default: SaveDecoder } = await import('../../../../../../src/plugins/_base/ext/save/core/SaveDecoder.js'));

    ({ default: RegionSkillData } = await import(
      '../../../../../../src/plugins/regions/ext/skills/models/RegionSkillData.js'));
  });

  /**
   * Runs region skill data out to plain data and back.
   * @param {RegionSkillData} regionSkillData The data to round-trip.
   * @returns {RegionSkillData}
   */
  const roundTrip = regionSkillData => SaveDecoder.decode(
    SaveEncoder.encode(regionSkillData, '$.regionSkill'),
    null,
    '$.regionSkill');

  it('comes back from a save as region skill data with every field intact', () =>
  {
    // Arrange
    const regionSkillData = new RegionSkillData(2, 432, 75, 101, true);

    // Act
    const decoded = roundTrip(regionSkillData);

    // Assert
    expect(Object.getPrototypeOf(decoded)).toBe(RegionSkillData.prototype);
    expect(decoded.regionId).toBe(2);
    expect(decoded.skillId).toBe(432);
    expect(decoded.chance).toBe(75);
    expect(decoded.casterId).toBe(101);
    expect(decoded.isFriendly).toBe(true);
  });
});
//endregion plugins/regions/ext/skills/_component/region-skill-data-save-codec.test.js