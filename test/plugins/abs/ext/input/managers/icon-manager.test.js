//region plugins/abs/ext/input/managers/icon-manager.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Input IconManager (unit, all downstream dependencies mocked)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { INPUT: { Symbols: { Mainhand: 'ok', Offhand: 'cancel' } } } } };
    globalThis.Input = { labelForSymbol: vi.fn(() => null) };
    globalThis.IconManager = {};

    // the glyph chosen for a symbol depends on what the player is holding; default to a keyboard.
    globalThis.InputDeviceTracker = { isGamepad: vi.fn(() => false) };

    await import('../../../../../../src/plugins/abs/ext/input/managers/IconManager.js');
  });

  beforeEach(() =>
  {
    globalThis.IconManager._jabsActionIconRegistry = {};
    globalThis.IconManager._jabsInputTextRegistry = {};
    globalThis.Input.labelForSymbol.mockReset().mockReturnValue(null);
    globalThis.InputDeviceTracker.isGamepad.mockReset().mockReturnValue(false);
  });

  describe('registerJabsIcon / jabsIconIndexForSymbol', () =>
  {
    it('registers and retrieves an icon index, normalizing the symbol to lowercase', () =>
    {
      globalThis.IconManager.registerJabsIcon('  OK  ', 76);
      expect(globalThis.IconManager.jabsIconIndexForSymbol('ok')).toBe(76);
    });

    it('throws when the symbol normalizes to empty', () =>
    {
      expect(() => globalThis.IconManager.registerJabsIcon('   ', 1)).toThrow(/empty symbol/);
    });

    it('throws when the icon index is not a valid number', () =>
    {
      expect(() => globalThis.IconManager.registerJabsIcon('ok', 'not-a-number')).toThrow(/Invalid icon index/);
    });

    it('returns 0 for an unmapped symbol', () =>
    {
      expect(globalThis.IconManager.jabsIconIndexForSymbol('unmapped')).toBe(0);
    });

    it('returns 0 for an empty symbol without throwing', () =>
    {
      expect(globalThis.IconManager.jabsIconIndexForSymbol('')).toBe(0);
    });
  });

  describe('registerJabsIcons', () =>
  {
    it('registers icons for every JABS input symbol', () =>
    {
      globalThis.IconManager.registerJabsIcons();
      expect(globalThis.IconManager.jabsIconIndexForSymbol('ok')).toBe(76);
      expect(globalThis.IconManager.jabsIconIndexForSymbol('cancel')).toBe(77);
    });
  });

  describe('registerJabsInputText / jabsInputTextForSymbol', () =>
  {
    it('registers and retrieves ex-text, normalizing the symbol to lowercase', () =>
    {
      globalThis.IconManager.registerJabsInputText('  OK  ', '  Cross  ', '  Z Key  ');
      expect(globalThis.IconManager.jabsInputTextForSymbol('ok')).toBe('Z Key');
    });

    it('throws when the symbol normalizes to empty', () =>
    {
      expect(() => globalThis.IconManager.registerJabsInputText('   ', 'pad', 'key')).toThrow(/empty symbol/);
    });

    it('throws when the gamepad text normalizes to empty', () =>
    {
      // Arrange & Act & Assert: a symbol with no gamepad glyph would render blank for pad players.
      expect(() => globalThis.IconManager.registerJabsInputText('ok', '   ', 'key'))
        .toThrow(/empty gamepad ex-text/);
    });

    it('throws when the keyboard text normalizes to empty', () =>
    {
      // Arrange & Act & Assert: likewise for keyboard players, so both are demanded up front.
      expect(() => globalThis.IconManager.registerJabsInputText('ok', 'pad', '   '))
        .toThrow(/empty keyboard ex-text/);
    });

    it('returns the gamepad glyph while the player is on a gamepad', () =>
    {
      // Arrange: register a pair, then put the player on a pad.
      globalThis.IconManager.registerJabsInputText('ok', 'Cross', 'Z Key');
      globalThis.InputDeviceTracker.isGamepad.mockReturnValue(true);

      // Act.
      const text = globalThis.IconManager.jabsInputTextForSymbol('ok');

      // Assert: the keyboard half is not shown at all.
      expect(text).toBe('Cross');
    });

    it('returns the keyboard glyph while the player is on a keyboard', () =>
    {
      // Arrange: register a pair; the fixture already defaults the player to a keyboard.
      globalThis.IconManager.registerJabsInputText('ok', 'Cross', 'Z Key');

      // Act.
      const text = globalThis.IconManager.jabsInputTextForSymbol('ok');

      // Assert.
      expect(text).toBe('Z Key');
    });

    it('falls back to Input.labelForSymbol when unmapped', () =>
    {
      globalThis.Input.labelForSymbol.mockReturnValue('Z');
      expect(globalThis.IconManager.jabsInputTextForSymbol('unmapped')).toBe('Z');
    });

    it('falls back to the raw symbol when neither the registry nor Input has a label', () =>
    {
      expect(globalThis.IconManager.jabsInputTextForSymbol('unmapped')).toBe('unmapped');
    });
  });

  describe('registerJabsInputIcon', () =>
  {
    it('derives the keyboard icon index from the gamepad one', () =>
    {
      // Arrange: register from a single gamepad index.
      globalThis.IconManager.registerJabsInputIcon('ok', 2448);

      // Act: read both halves of the resulting pair.
      const keyboardText = globalThis.IconManager.jabsInputTextForSymbol('ok');
      globalThis.InputDeviceTracker.isGamepad.mockReturnValue(true);
      const gamepadText = globalThis.IconManager.jabsInputTextForSymbol('ok');

      // Assert: the keyboard glyph sits exactly one sheet row above the gamepad glyph.
      expect(gamepadText).toBe('\\I[2448]');
      expect(keyboardText).toBe('\\I[2432]');
    });
  });

  describe('jabsIconTextForSymbol', () =>
  {
    it('returns "(unbound)" for a falsy symbol', () =>
    {
      expect(globalThis.IconManager.jabsIconTextForSymbol(null)).toBe('(unbound)');
      expect(globalThis.IconManager.jabsIconTextForSymbol('')).toBe('(unbound)');
    });

    it('delegates to jabsInputTextForSymbol for a real symbol', () =>
    {
      globalThis.IconManager.registerJabsInputText('ok', 'Cross', 'Z Key');
      expect(globalThis.IconManager.jabsIconTextForSymbol('ok')).toBe('Z Key');
    });
  });

  describe('registerJabsInputTexts', () =>
  {
    it('registers ex-text for every JABS input symbol', () =>
    {
      // Arrange: put the player on a pad so the registered gamepad indices are the ones read back.
      globalThis.InputDeviceTracker.isGamepad.mockReturnValue(true);

      // Act.
      globalThis.IconManager.registerJabsInputTexts();

      // Assert.
      expect(globalThis.IconManager.jabsInputTextForSymbol('ok')).toContain('2448');
    });
  });
});
//endregion plugins/abs/ext/input/managers/icon-manager.test.js
