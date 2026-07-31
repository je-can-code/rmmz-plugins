//region plugins/abs/ext/input/managers/input-legend-resolver.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-InputManager legend resolver (direct src import)', () =>
{
  /** @type {object} the J-Base registry this extension registers itself into. */
  let InputLegendResolver;

  /** @type {object} the input symbol constants the semantic map points at. */
  let JabsInputSymbols;

  beforeAll(async () =>
  {
    vi.resetModules();

    String.empty = '';

    ({ default: InputLegendResolver } =
      await import('../../../../../../src/plugins/_base/managers/InputLegendResolver.js'));
    ({ default: JabsInputSymbols } =
      await import('../../../../../../src/plugins/abs/ext/input/_models/JabsInputSymbols.js'));

    // both the registry and the icon manager are bare globals in the concatenated bundle.
    globalThis.InputLegendResolver = InputLegendResolver;
    globalThis.IconManager = {
      jabsInputTextForSymbol: symbol => `glyph:${symbol}`,
    };

    await import('../../../../../../src/plugins/abs/ext/input/managers/InputLegendResolver.js');
  });

  beforeEach(() =>
  {
    globalThis.IconManager.jabsInputTextForSymbol = symbol => `glyph:${symbol}`;
  });

  it('registers itself as the resolver at import time', () =>
  {
    // Arrange & Act & Assert- J-Base owns the registry but never knows who fills it; this
    // extension owns the input mapping, so it is the one that can answer.
    expect(InputLegendResolver.hasResolver()).toBe(true);
  });

  describe('face and shoulder semantics', () =>
  {
    it('resolves the confirm semantic to the mainhand input', () =>
    {
      // Arrange & Act & Assert
      expect(InputLegendResolver.resolve('ok', 'Confirm'))
        .toBe(`glyph:${JabsInputSymbols.Mainhand}`);
    });

    it('resolves the cancel semantic to the offhand input', () =>
    {
      // Arrange & Act & Assert
      expect(InputLegendResolver.resolve('cancel', 'Cancel'))
        .toBe(`glyph:${JabsInputSymbols.Offhand}`);
    });

    it('resolves the context semantic to the tool input', () =>
    {
      // Arrange & Act & Assert
      expect(InputLegendResolver.resolve('context', 'Use'))
        .toBe(`glyph:${JabsInputSymbols.Tool}`);
    });

    it('resolves content cycling to the trigger inputs', () =>
    {
      // Arrange & Act & Assert
      expect(InputLegendResolver.resolve('content-prev', 'Prev'))
        .toBe(`glyph:${JabsInputSymbols.StrafeTrigger}`);
      expect(InputLegendResolver.resolve('content-next', 'Next'))
        .toBe(`glyph:${JabsInputSymbols.MobilitySkill}`);
    });
  });

  describe('directional semantics', () =>
  {
    it('resolves focus movement to the directional pad', () =>
    {
      // Arrange & Act & Assert- moving focus is directional, and deliberately distinct from
      // content cycling: one moves where the player is, the other what they are looking at.
      expect(InputLegendResolver.resolve('focus-prev', 'Left'))
        .toBe(`glyph:${JabsInputSymbols.DirLeft}`);
      expect(InputLegendResolver.resolve('focus-next', 'Right'))
        .toBe(`glyph:${JabsInputSymbols.DirRight}`);
    });

    it('resolves quantity adjustment to the same directional pair as focus movement', () =>
    {
      // Arrange & Act & Assert- one input serving two meanings in two different scenes is the
      // arrangement working, not a collision.
      expect(InputLegendResolver.resolve('cart-dec', 'Less'))
        .toBe(`glyph:${JabsInputSymbols.DirLeft}`);
      expect(InputLegendResolver.resolve('cart-inc', 'More'))
        .toBe(`glyph:${JabsInputSymbols.DirRight}`);
    });
  });

  describe('semantics it cannot describe', () =>
  {
    it('falls back to the caller wording for an unmapped semantic', () =>
    {
      // Arrange & Act & Assert- the resolver reports "I cannot describe this" with an empty
      // string, and the registry turns that back into the caller's own readable label.
      expect(InputLegendResolver.resolve('not-a-real-semantic', 'Do The Thing'))
        .toBe('Do The Thing');
    });

    it('falls back to the caller wording when the icon registry has no glyph for the symbol', () =>
    {
      // Arrange
      globalThis.IconManager.jabsInputTextForSymbol = () => String.empty;

      // Act & Assert
      expect(InputLegendResolver.resolve('ok', 'Confirm')).toBe('Confirm');
    });
  });
});
//endregion plugins/abs/ext/input/managers/input-legend-resolver.test.js
