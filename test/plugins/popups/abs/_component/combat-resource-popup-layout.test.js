//region plugins/popups/abs/_component/combat-resource-popup-layout.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('CombatResourcePopupLayout (direct src import)', () =>
{
  let PopupLayoutHelper;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.Map_TextPop = {
      Types: {
        HpDamage: 'hp-damage',
        MpDamage: 'mp-damage',
        TpDamage: 'tp-damage',
      },
      LayoutRings: {},
    };

    globalThis.J = {
      POPUPS: {
        EXT: {
          ABS: {
            Aliased: {
              PopupLayoutHelper: new Map(),
            },
          },
        },
        Layout: {
          PaddingX: 24,
          PaddingY: 0,
          VerticalOffset: 0,
          RingStepX: 8,
          RingStepY: 8,
          ResetDuration: 120,
        },
      },
    };

    globalThis.Graphics = { frameCount: 0 };

    // load core PopupLayoutHelper first (bare-global convention: no import statement, patched onto globalThis).
    ({ default: PopupLayoutHelper } = await import('../../../../../src/plugins/popups/core/helpers/PopupLayoutHelper.js'));
    globalThis.PopupLayoutHelper = PopupLayoutHelper;
    PopupLayoutHelper.initializeRingLayouts();

    // the ABS augment overwrites PopupLayoutHelper.resolveMotionOffset with the combat-stagger variant.
    await import('../../../../../src/plugins/popups/ext/abs/helpers/CombatResourcePopupLayout.js');
  });

  describe('resolveMotionOffset', () =>
  {
    it('staggers a harm hp popup upward off the base row', () =>
    {
      // Arrange
      const params = { healing: false, popupType: 'hp-damage' };

      // Act
      const result = PopupLayoutHelper.resolveMotionOffset(params);

      // Assert
      expect(result).toEqual({ x: 24, y: -16 });
    });

    it('keeps a harm mp popup on the base row', () =>
    {
      // Arrange
      const params = { healing: false, popupType: 'mp-damage' };

      // Act
      const result = PopupLayoutHelper.resolveMotionOffset(params);

      // Assert
      expect(result).toEqual({ x: 24, y: 0 });
    });

    it('staggers a harm tp popup downward off the base row', () =>
    {
      // Arrange
      const params = { healing: false, popupType: 'tp-damage' };

      // Act
      const result = PopupLayoutHelper.resolveMotionOffset(params);

      // Assert
      expect(result).toEqual({ x: 24, y: 16 });
    });

    it('staggers a heal hp popup upward off the base row on the opposite side', () =>
    {
      // Arrange
      const params = { healing: true, popupType: 'hp-damage' };

      // Act
      const result = PopupLayoutHelper.resolveMotionOffset(params);

      // Assert
      expect(result).toEqual({ x: -24, y: -16 });
    });

    it('staggers a heal tp popup downward off the base row on the opposite side', () =>
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
//endregion plugins/popups/abs/_component/combat-resource-popup-layout.test.js
