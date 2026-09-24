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

    it('describes two rows of bare, full-size icons until a host asks for the compact layout', () =>
    {
      // Arrange/Act
      const spec = new StateAfflictionHudLayoutSpec();

      // Assert
      expect(spec.singleRow).toEqual(false);
      expect(spec.iconScale).toEqual(1);
      expect(spec.polarityBacking).toEqual(false);
      expect(spec.backingPadding).toEqual(2);
      expect(spec.backingOpacity).toEqual(192);
      expect(spec.timerOffsetY).toEqual(20);
      expect(spec.timerFontSizeReduction).toEqual(6);
      expect(spec.stackFontSizeReduction).toEqual(4);
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
    it('offsets originY by the drawn icon height plus the row gap', () =>
    {
      // Arrange- a half-size icon, so the offset has to come from the height the icon is drawn at.
      const spec = new StateAfflictionHudLayoutSpec();
      spec.originY = 100;
      spec.rowGap = 8;
      spec.iconScale = 0.5;

      // Act
      const result = spec.positiveRowY();

      // Assert
      expect(result).toEqual(124);
    });

    it('sits level with the negative row when both share one row', () =>
    {
      // Arrange
      const spec = new StateAfflictionHudLayoutSpec();
      spec.originY = 100;
      spec.rowGap = 8;
      spec.singleRow = true;

      // Act
      const result = spec.positiveRowY();

      // Assert
      expect(result).toEqual(100);
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

  describe('positiveSlotX', () =>
  {
    it('starts the buffs back at the left on a row of their own', () =>
    {
      // Arrange
      const spec = new StateAfflictionHudLayoutSpec();
      spec.originX = 10;
      spec.iconPitch = 34;

      // Act
      const result = spec.positiveSlotX(1, 2);

      // Assert
      expect(result).toEqual(44);
    });

    it('continues the buffs on past the debuffs when both share one row', () =>
    {
      // Arrange
      const spec = new StateAfflictionHudLayoutSpec();
      spec.originX = 10;
      spec.iconPitch = 34;
      spec.singleRow = true;

      // Act
      const result = spec.positiveSlotX(1, 2);

      // Assert
      expect(result).toEqual(112);
    });
  });

  describe('scaledIconWidth / scaledIconHeight', () =>
  {
    it('scales the iconset width, not its height', () =>
    {
      // Arrange- width and height differ, so a mix-up between the two cannot hide.
      globalThis.ImageManager = { iconWidth: 32, iconHeight: 40 };
      const spec = new StateAfflictionHudLayoutSpec();
      spec.iconScale = 0.5;

      // Act
      const result = spec.scaledIconWidth();

      // Assert
      expect(result).toEqual(16);
    });

    it('scales the iconset height, not its width', () =>
    {
      // Arrange
      globalThis.ImageManager = { iconWidth: 32, iconHeight: 40 };
      const spec = new StateAfflictionHudLayoutSpec();
      spec.iconScale = 0.5;

      // Act
      const result = spec.scaledIconHeight();

      // Assert
      expect(result).toEqual(20);
    });
  });

  describe('slotCenterX', () =>
  {
    it('lands halfway across the icon as it is drawn', () =>
    {
      // Arrange
      const spec = new StateAfflictionHudLayoutSpec();
      spec.iconScale = 0.5;

      // Act
      const result = spec.slotCenterX(10);

      // Assert
      expect(result).toEqual(18);
    });
  });

  describe('backingSize', () =>
  {
    it('reaches past the drawn icon by the padding on both sides', () =>
    {
      // Arrange
      const spec = new StateAfflictionHudLayoutSpec();
      spec.iconScale = 0.5;
      spec.backingPadding = 3;

      // Act
      const result = spec.backingSize();

      // Assert
      expect(result).toEqual(22);
    });
  });
});
//endregion plugins/hud/core/models/state-affliction-hud-layout-spec.test.js
