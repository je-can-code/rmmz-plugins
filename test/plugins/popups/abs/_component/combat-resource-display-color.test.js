//region plugins/popups/abs/_component/combat-resource-display-color.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('PopupResourceDisplayColor (direct src import)', () =>
{
  let PopupResourceDisplayColor;

  beforeAll(async () =>
  {
    vi.resetModules();

    // minimal host surface so this file evaluates in isolation (pure color-math helper),
    // matching this family's pre-existing convention of not booting the whole J-Base/J-Popups stack.
    globalThis.Map_TextPop = {
      Types: {
        HpDamage: 'hp-damage',
        MpDamage: 'mp-damage',
        TpDamage: 'tp-damage',
      },
    };

    globalThis.ColorManager = {
      textColor(n)
      {
        return `#${String(n).padStart(2, '0')}aaaa`;
      },
      normalColor()
      {
        return '#ffffff';
      },
      hpGaugeColor2()
      {
        return '#ffcc22';
      },
      mpGaugeColor2()
      {
        return '#00ccff';
      },
      tpGaugeColor2()
      {
        return '#44dd66';
      },
    };

    globalThis.J = {
      POPUPS: {
        EXT: {
          ABS: {
            Metadata: {
              damageOutlineWidth: 2,
              healingOutlineWidth: 4,
            },
          },
        },
      },
    };

    ({ default: PopupResourceDisplayColor } = await import(
      '../../../../../src/plugins/popups/ext/abs/helpers/PopupResourceDisplayColor.js'
    ));
  });

  describe('resolvePopupFillColor', () =>
  {
    it('keeps harm HP white', () =>
    {
      // Arrange
      const sourcePopup = { healing: false, popupType: Map_TextPop.Types.HpDamage };

      // Act
      const result = PopupResourceDisplayColor.resolvePopupFillColor(sourcePopup, 0);

      // Assert
      expect(result).toBe('#ffffff');
    });

    it('tints harm MP toward the mp gauge color', () =>
    {
      // Arrange
      const sourcePopup = { healing: false, popupType: Map_TextPop.Types.MpDamage };

      // Act
      const result = PopupResourceDisplayColor.resolvePopupFillColor(sourcePopup, 5);

      // Assert
      expect(result).toBe('rgb(173, 239, 255)');
    });

    it('tints harm TP toward the tp gauge color', () =>
    {
      // Arrange
      const sourcePopup = { healing: false, popupType: Map_TextPop.Types.TpDamage };

      // Act
      const result = PopupResourceDisplayColor.resolvePopupFillColor(sourcePopup, 19);

      // Assert
      expect(result).toBe('rgb(195, 244, 206)');
    });

    it('falls back to the windowskin text color for a healing popup', () =>
    {
      // Arrange
      const sourcePopup = { healing: true, popupType: Map_TextPop.Types.MpDamage };

      // Act
      const result = PopupResourceDisplayColor.resolvePopupFillColor(sourcePopup, 23);

      // Assert
      expect(result).toBe('#23aaaa');
    });

    it('falls back to the windowskin text color when there is no source popup', () =>
    {
      // Arrange & Act
      const result = PopupResourceDisplayColor.resolvePopupFillColor(null, 7);

      // Assert
      expect(result).toBe('#07aaaa');
    });

    it('falls back to the windowskin text color for a non-resource popup type', () =>
    {
      // Arrange
      const sourcePopup = { healing: false, popupType: 'gold' };

      // Act
      const result = PopupResourceDisplayColor.resolvePopupFillColor(sourcePopup, 3);

      // Assert
      expect(result).toBe('#03aaaa');
    });
  });

  describe('resolvePopupOutlineColor', () =>
  {
    it('darkens the hp gauge color toward black for a harm hp popup', () =>
    {
      // Arrange
      const sourcePopup = { healing: false, popupType: Map_TextPop.Types.HpDamage };

      // Act
      const result = PopupResourceDisplayColor.resolvePopupOutlineColor(sourcePopup);

      // Assert
      expect(result).toBe('rgb(102, 82, 14)');
    });

    it('darkens the mp gauge color toward black for a harm mp popup', () =>
    {
      // Arrange
      const sourcePopup = { healing: false, popupType: Map_TextPop.Types.MpDamage };

      // Act
      const result = PopupResourceDisplayColor.resolvePopupOutlineColor(sourcePopup);

      // Assert
      expect(result).toBe('rgb(0, 82, 102)');
    });

    it('darkens the tp gauge color toward black for a harm tp popup', () =>
    {
      // Arrange
      const sourcePopup = { healing: false, popupType: Map_TextPop.Types.TpDamage };

      // Act
      const result = PopupResourceDisplayColor.resolvePopupOutlineColor(sourcePopup);

      // Assert
      expect(result).toBe('rgb(27, 88, 41)');
    });

    it('falls back to a translucent black outline when there is no source popup', () =>
    {
      // Arrange & Act
      const result = PopupResourceDisplayColor.resolvePopupOutlineColor(null);

      // Assert
      expect(result).toBe('rgba(0, 0, 0, 0.7)');
    });

    it('falls back to a translucent black outline for a non-resource popup type', () =>
    {
      // Arrange
      const sourcePopup = { healing: false, popupType: 'gold' };

      // Act
      const result = PopupResourceDisplayColor.resolvePopupOutlineColor(sourcePopup);

      // Assert
      expect(result).toBe('rgba(0, 0, 0, 0.7)');
    });
  });

  describe('resolvePopupOutlineWidth', () =>
  {
    it('uses the slimmer damage outline width for a harm damage popup', () =>
    {
      // Arrange
      const sourcePopup = { healing: false, popupType: Map_TextPop.Types.HpDamage };

      // Act
      const result = PopupResourceDisplayColor.resolvePopupOutlineWidth(sourcePopup, true);

      // Assert
      expect(result).toBe(2);
    });

    it('uses the healing outline width for a healing popup', () =>
    {
      // Arrange
      const sourcePopup = { healing: true, popupType: Map_TextPop.Types.HpDamage };

      // Act
      const result = PopupResourceDisplayColor.resolvePopupOutlineWidth(sourcePopup, true);

      // Assert
      expect(result).toBe(4);
    });

    it('falls back to the default width when there is no source popup', () =>
    {
      // Arrange & Act
      const result = PopupResourceDisplayColor.resolvePopupOutlineWidth(null, true);

      // Assert
      expect(result).toBe(4);
    });

    it('falls back to the default width when isDamagePopup is false and the popup is not healing', () =>
    {
      // Arrange
      const sourcePopup = { healing: false, popupType: Map_TextPop.Types.HpDamage };

      // Act
      const result = PopupResourceDisplayColor.resolvePopupOutlineWidth(sourcePopup, false);

      // Assert
      expect(result).toBe(4);
    });
  });

  describe('parseCssColor', () =>
  {
    it('reads the three channels out of a full hex color', () =>
    {
      // Arrange
      // Act
      const parsed = PopupResourceDisplayColor.parseCssColor('#ff8000');

      // Assert
      expect(parsed).toEqual({ r: 255, g: 128, b: 0 });
    });

    it('reads the three channels out of an rgb() color', () =>
    {
      // Arrange- `ColorManager.textColor` answers in hex, but the engine's own gauge colors and
      // anything a plugin parameter supplies arrive as rgb(), so both forms reach here.
      // Act
      const parsed = PopupResourceDisplayColor.parseCssColor('rgb(12, 34, 56)');

      // Assert
      expect(parsed).toEqual({ r: 12, g: 34, b: 56 });
    });

    it('tolerates the whitespace an rgb() string is allowed to carry', () =>
    {
      // Arrange
      // Act
      const parsed = PopupResourceDisplayColor.parseCssColor('rgb(1,2,3)');

      // Assert
      expect(parsed).toEqual({ r: 1, g: 2, b: 3 });
    });

    it('falls back to white for a color string in neither form', () =>
    {
      // Arrange- white is the safe fallback because the channels are only ever used to dim a color,
      // so an unparseable one renders at full brightness rather than as an invisible black pop.
      // Act
      const parsed = PopupResourceDisplayColor.parseCssColor('rebeccapurple');

      // Assert
      expect(parsed).toEqual({ r: 255, g: 255, b: 255 });
    });

    it('falls back to white for a shorthand hex it cannot split into channels', () =>
    {
      // Arrange
      // Act
      const parsed = PopupResourceDisplayColor.parseCssColor('#f80');

      // Assert
      expect(parsed).toEqual({ r: 255, g: 255, b: 255 });
    });
  });
});
//endregion plugins/popups/abs/_component/combat-resource-display-color.test.js
