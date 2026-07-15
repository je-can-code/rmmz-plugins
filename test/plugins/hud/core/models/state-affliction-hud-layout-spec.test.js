//region plugins/hud/core/models/state-affliction-hud-layout-spec.test.js
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

describe('StateAfflictionHudLayoutSpec (direct src import)', () =>
{
  let StateAfflictionHudLayoutSpec;

  beforeAll(async () =>
  {
    ({ default: StateAfflictionHudLayoutSpec } = await import('../../../../../src/plugins/hud/core/models/StateAfflictionHudLayoutSpec.js'));
  });

  beforeEach(() =>
  {
    // iconPitch's class-field default reads these at instantiation time.
    globalThis.ImageManager = { iconWidth: 32, iconHeight: 32 };
  });

  describe('defaults', () =>
  {
    it('derives iconPitch from ImageManager.iconWidth plus a 2px gap', () =>
    {
      // Arrange/Act
      const spec = new StateAfflictionHudLayoutSpec();

      // Assert
      expect(spec.iconPitch).toEqual(34);
      expect(spec.originX).toEqual(0);
      expect(spec.originY).toEqual(0);
      expect(spec.rowGap).toEqual(8);
    });
  });

  describe('negativeRowY', () =>
  {
    it('returns originY unmodified', () =>
    {
      // Arrange
      const spec = new StateAfflictionHudLayoutSpec();
      spec.originY = 100;

      // Act
      const result = spec.negativeRowY();

      // Assert
      expect(result).toEqual(100);
    });
  });

  describe('positiveRowY', () =>
  {
    it('offsets originY by icon height plus the row gap', () =>
    {
      // Arrange
      const spec = new StateAfflictionHudLayoutSpec();
      spec.originY = 100;
      spec.rowGap = 8;

      // Act
      const result = spec.positiveRowY();

      // Assert
      expect(result).toEqual(140);
    });
  });

  describe('slotX', () =>
  {
    it('returns originX for index 0', () =>
    {
      // Arrange
      const spec = new StateAfflictionHudLayoutSpec();
      spec.originX = 10;

      // Act
      const result = spec.slotX(0);

      // Assert
      expect(result).toEqual(10);
    });

    it('offsets originX by the icon pitch for each subsequent index', () =>
    {
      // Arrange
      const spec = new StateAfflictionHudLayoutSpec();
      spec.originX = 10;
      spec.iconPitch = 34;

      // Act
      const result = spec.slotX(3);

      // Assert
      expect(result).toEqual(112);
    });
  });
});
//endregion plugins/hud/core/models/state-affliction-hud-layout-spec.test.js
