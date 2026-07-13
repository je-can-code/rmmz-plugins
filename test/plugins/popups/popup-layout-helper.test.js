//region plugins/popups/popup-layout-helper.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('PopupLayoutHelper.resolveMotionOffset (direct src import)', () =>
{
  let PopupLayoutHelper;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = globalThis.J || {};
    globalThis.J.POPUPS = {
      Layout: {
        PaddingX: 24,
        PaddingY: 0,
        VerticalOffset: 0,
        RingStepX: 8,
        RingStepY: 8,
        ResetDuration: 120,
      },
    };
    globalThis.Graphics = globalThis.Graphics || { frameCount: 0 };

    // the real Map_TextPop.js patches its own prototype from _base globals we don't need here-
    // this helper only reads Map_TextPop.Types/.LayoutRings, so a minimal stand-in is enough and
    // matches this file's pre-existing convention of not booting the whole J-Base/J-Popups stack.
    globalThis.Map_TextPop = {
      Types: {
        HpDamage: 'hp-damage',
        MpDamage: 'mp-damage',
        TpDamage: 'tp-damage',
      },
      LayoutRings: {},
    };

    ({ default: PopupLayoutHelper } = await import('../../../src/plugins/popups/core/helpers/PopupLayoutHelper.js'));
    PopupLayoutHelper.initializeRingLayouts();
  });

  describe('resolveMotionOffset', () =>
  {
    it('keeps hp harm pops on the base row', () =>
    {
      // Arrange
      const params = { healing: false, popupType: 'hp-damage' };

      // Act
      const result = PopupLayoutHelper.resolveMotionOffset(params);

      // Assert
      expect(result).toEqual({ x: 24, y: 0 });
    });

    it('keeps mp harm pops on the base row', () =>
    {
      // Arrange
      const params = { healing: false, popupType: 'mp-damage' };

      // Act
      const result = PopupLayoutHelper.resolveMotionOffset(params);

      // Assert
      expect(result).toEqual({ x: 24, y: 0 });
    });

    it('keeps tp harm pops on the base row', () =>
    {
      // Arrange
      const params = { healing: false, popupType: 'tp-damage' };

      // Act
      const result = PopupLayoutHelper.resolveMotionOffset(params);

      // Assert
      expect(result).toEqual({ x: 24, y: 0 });
    });

    it('staggers hp heal pops upward off the base row', () =>
    {
      // Arrange
      const params = { healing: true, popupType: 'hp-damage' };

      // Act
      const result = PopupLayoutHelper.resolveMotionOffset(params);

      // Assert
      expect(result).toEqual({ x: -24, y: -16 });
    });

    it('staggers tp heal pops downward off the base row', () =>
    {
      // Arrange
      const params = { healing: true, popupType: 'tp-damage' };

      // Act
      const result = PopupLayoutHelper.resolveMotionOffset(params);

      // Assert
      expect(result).toEqual({ x: -24, y: 16 });
    });
  });
});
//endregion plugins/popups/popup-layout-helper.test.js
