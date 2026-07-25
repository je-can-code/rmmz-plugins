//region plugins/abs/core/models/state-affliction-map-layout-config.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('StateAfflictionMapLayoutConfig (direct src import)', () =>
{
  let StateAfflictionMapLayoutConfig;

  beforeAll(async () =>
  {
    globalThis.J = { ABS: { Metadata: {
      mapAfflictionIconScale: 0.75,
      mapAfflictionGaugeHeight: 5,
      mapAfflictionGapBelowHpBar: 3,
      mapAfflictionMaxSlots: 10,
    } } };
    globalThis.ImageManager = { iconWidth: 32, iconHeight: 32 };

    ({ default: StateAfflictionMapLayoutConfig } = await import(
      '../../../../../src/plugins/abs/core/models/StateAfflictionMapLayoutConfig.js'
    ));
  });

  describe('defaults', () =>
  {
    it('carries the hardcoded default values', () =>
    {
      // Act
      const config = new StateAfflictionMapLayoutConfig();

      // Assert
      expect(config.iconScale).toBe(0.5);
      expect(config.gaugeHeight).toBe(3);
      expect(config.gapBelowHpBar).toBe(2);
      expect(config.rowGap).toBe(4);
      expect(config.maxSlots).toBe(8);
      expect(config.slotPitch).toBe(18);
    });
  });

  describe('fromMetadata', () =>
  {
    it('builds a config sourced from J.ABS.Metadata', () =>
    {
      // Act
      const config = StateAfflictionMapLayoutConfig.fromMetadata();

      // Assert
      expect(config.iconScale).toBe(0.75);
      expect(config.gaugeHeight).toBe(5);
      expect(config.gapBelowHpBar).toBe(3);
      expect(config.maxSlots).toBe(10);
    });
  });

  describe('iconWidth / iconHeight', () =>
  {
    it('scales and floors the base icon dimensions by iconScale', () =>
    {
      // Arrange
      const config = new StateAfflictionMapLayoutConfig();
      config.iconScale = 0.6;

      // Act & Assert- 32 * 0.6 = 19.2, floored to 19.
      expect(config.iconWidth()).toBe(19);
      expect(config.iconHeight()).toBe(19);
    });
  });

  describe('rowPitchY', () =>
  {
    it('sums the scaled icon height, gauge height, a 1px seam, and the row gap', () =>
    {
      // Arrange- iconHeight(0.5 scale) = floor(32*0.5) = 16.
      const config = new StateAfflictionMapLayoutConfig();

      // Act
      const result = config.rowPitchY();

      // Assert- 16 + 3 + 1 + 4 = 24.
      expect(result).toBe(24);
    });
  });
});
//endregion plugins/abs/core/models/state-affliction-map-layout-config.test.js
