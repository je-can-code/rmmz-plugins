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

    await import('../../../../../../src/plugins/abs/ext/input/managers/IconManager.js');
  });

  beforeEach(() =>
  {
    globalThis.IconManager._jabsActionIconRegistry = {};
    globalThis.IconManager._jabsInputTextRegistry = {};
    globalThis.Input.labelForSymbol.mockReset().mockReturnValue(null);
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
      globalThis.IconManager.registerJabsInputText('  OK  ', '  A Button  ');
      expect(globalThis.IconManager.jabsInputTextForSymbol('ok')).toBe('A Button');
    });

    it('throws when the symbol normalizes to empty', () =>
    {
      expect(() => globalThis.IconManager.registerJabsInputText('   ', 'text')).toThrow(/empty symbol/);
    });

    it('throws when the text normalizes to empty', () =>
    {
      expect(() => globalThis.IconManager.registerJabsInputText('ok', '   ')).toThrow(/empty ex-text/);
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

  describe('jabsIconTextForSymbol', () =>
  {
    it('returns "(unbound)" for a falsy symbol', () =>
    {
      expect(globalThis.IconManager.jabsIconTextForSymbol(null)).toBe('(unbound)');
      expect(globalThis.IconManager.jabsIconTextForSymbol('')).toBe('(unbound)');
    });

    it('delegates to jabsInputTextForSymbol for a real symbol', () =>
    {
      globalThis.IconManager.registerJabsInputText('ok', 'A Button');
      expect(globalThis.IconManager.jabsIconTextForSymbol('ok')).toBe('A Button');
    });
  });

  describe('registerJabsInputTexts', () =>
  {
    it('registers ex-text for every JABS input symbol', () =>
    {
      globalThis.IconManager.registerJabsInputTexts();
      expect(globalThis.IconManager.jabsInputTextForSymbol('ok')).toContain('2448');
    });
  });
});
//endregion plugins/abs/ext/input/managers/icon-manager.test.js
