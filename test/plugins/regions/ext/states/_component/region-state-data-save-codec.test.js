//region plugins/regions/ext/states/_component/region-state-data-save-codec.test.js
import { beforeAll, describe, expect, it } from 'vitest';

/**
 * A map's region states through the real save pipeline.
 *
 * `Game_Map` holds one {@link RegionStateData} per `<regionAddState>` tag for as long as its map is loaded,
 * so every save made on such a map encodes them. An unregistered model makes that encode throw, and the
 * throw leaves the save scene before its catch is attached, which takes the game to the error screen.
 */
describe('RegionStateData through the save codecs', () =>
{
  let RegionStateData;
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

    ({ default: RegionStateData } = await import(
      '../../../../../../src/plugins/regions/ext/states/models/RegionStateData.js'));
  });

  /**
   * Runs region state data out to plain data and back.
   * @param {RegionStateData} regionStateData The data to round-trip.
   * @returns {RegionStateData}
   */
  const roundTrip = regionStateData => SaveDecoder.decode(
    SaveEncoder.encode(regionStateData, '$.regionState'),
    null,
    '$.regionState');

  it('comes back from a save as region state data with every field intact', () =>
  {
    // Arrange
    const regionStateData = new RegionStateData(1, 16, 40, 59);

    // Act
    const decoded = roundTrip(regionStateData);

    // Assert
    expect(Object.getPrototypeOf(decoded)).toBe(RegionStateData.prototype);
    expect(decoded.regionId).toBe(1);
    expect(decoded.stateId).toBe(16);
    expect(decoded.chance).toBe(40);
    expect(decoded.animationId).toBe(59);
  });
});
//endregion plugins/regions/ext/states/_component/region-state-data-save-codec.test.js