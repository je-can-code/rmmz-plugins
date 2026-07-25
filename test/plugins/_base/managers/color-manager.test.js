//region plugins/_base/managers/color-manager.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('ColorManager (direct src import)', () =>
{
  let ParameterRegistry;

  beforeAll(async () =>
  {
    String.empty = '';

    // vanilla RMMZ ColorManager global this file's textColor()-based helpers read via `this`.
    globalThis.ColorManager = {
      textColor: (index) => `#color${index}`,
    };

    globalThis.PanelRarity = {
      fromRarityToColor: (rarity) => (rarity === 'legendary' ? 17 : 0),
    };

    ({ default: ParameterRegistry } = await import('../../../../src/plugins/_base/core/ParameterRegistry.js'));
    await import('../../../../src/plugins/_base/managers/ColorManager.js');
  });

  describe('parameterColor', () =>
  {
    it('returns 0 when unregistered', () =>
    {
      expect(globalThis.ColorManager.parameterColor('not-a-real-key')).toBe(0);
    });

    it('delegates to the registered definition\'s colorIndex() when found', async () =>
    {
      // Arrange
      const { default: ParameterDefinition } = await import('../../../../src/plugins/_base/models/ParameterDefinition.js');
      ParameterRegistry._definitions.clear();
      ParameterRegistry._groupCache.clear();
      ParameterRegistry.register(new ParameterDefinition(
        'probe', 'combat', 0, () => '', () => [], () => 0, () => 42, 'flat', 'none', () => 0, null,
      ));

      // Act & Assert
      expect(globalThis.ColorManager.parameterColor('probe')).toBe(42);
    });
  });

  describe('elementColorHexcode', () =>
  {
    it.each([
      [ -1, 0 ], [ 0, 17 ], [ 1, 7 ], [ 2, 8 ], [ 3, 25 ], [ 4, 18 ], [ 5, 23 ], [ 6, 8 ], [ 7, 25 ],
      [ 8, 6 ], [ 9, 26 ], [ 10, 0 ], [ 11, 2 ], [ 12, 2 ], [ 13, 2 ], [ 14, 2 ], [ 15, 2 ], [ 16, 2 ],
      [ 17, 2 ], [ 18, 2 ], [ 19, 2 ], [ 20, 2 ], [ 21, 27 ], [ 22, 27 ], [ 23, 27 ], [ 24, 27 ],
      [ 25, 20 ], [ 26, 20 ], [ 27, 20 ], [ 28, 20 ],
    ])('maps elementId %i to textColor(%i)', (elementId, colorIndex) =>
    {
      expect(globalThis.ColorManager.elementColorHexcode(elementId)).toBe(`#color${colorIndex}`);
    });

    it('falls back to textColor(0) for an unrecognized elementId', () =>
    {
      expect(globalThis.ColorManager.elementColorHexcode(999)).toBe('#color0');
    });
  });

  describe('elementColorIndex', () =>
  {
    it.each([
      [ -1, 0 ], [ 0, 17 ], [ 1, 7 ], [ 2, 8 ], [ 3, 25 ], [ 4, 18 ], [ 5, 23 ], [ 6, 8 ], [ 7, 25 ],
      [ 8, 6 ], [ 9, 26 ], [ 10, 0 ], [ 11, 2 ], [ 12, 2 ], [ 13, 2 ], [ 14, 2 ], [ 15, 2 ], [ 16, 2 ],
      [ 17, 2 ], [ 18, 2 ], [ 19, 2 ], [ 20, 2 ], [ 21, 27 ], [ 22, 27 ], [ 23, 27 ], [ 24, 27 ],
      [ 25, 20 ], [ 26, 20 ], [ 27, 20 ], [ 28, 20 ],
    ])('maps elementId %i to color index %i', (elementId, expected) =>
    {
      expect(globalThis.ColorManager.elementColorIndex(elementId)).toBe(expected);
    });

    it('falls back to 0 for an unrecognized elementId', () =>
    {
      expect(globalThis.ColorManager.elementColorIndex(999)).toBe(0);
    });
  });

  describe('skillType / weaponType / armorType / equipType', () =>
  {
    it('skillType uses textColor(1)', () =>
    {
      expect(globalThis.ColorManager.skillType(1)).toBe('#color1');
    });

    it('weaponType uses textColor(2)', () =>
    {
      expect(globalThis.ColorManager.weaponType(1)).toBe('#color2');
    });

    it('armorType uses textColor(3)', () =>
    {
      expect(globalThis.ColorManager.armorType(1)).toBe('#color3');
    });

    it('equipType uses textColor(4)', () =>
    {
      expect(globalThis.ColorManager.equipType(1)).toBe('#color4');
    });
  });

  describe('sdp', () =>
  {
    it('resolves the rarity to a color index via PanelRarity, then samples textColor', () =>
    {
      expect(globalThis.ColorManager.sdp('legendary')).toBe('#color17');
    });

    it('falls back through PanelRarity\'s own default for an unknown rarity', () =>
    {
      expect(globalThis.ColorManager.sdp('unknown-rarity')).toBe('#color0');
    });
  });

  describe('isValidHexColor', () =>
  {
    it('returns false for a falsy value', () =>
    {
      expect(globalThis.ColorManager.isValidHexColor(null)).toBe(false);
    });

    it('returns false for an empty string', () =>
    {
      expect(globalThis.ColorManager.isValidHexColor('')).toBe(false);
    });

    it('returns true for a valid 6-digit hex color', () =>
    {
      expect(globalThis.ColorManager.isValidHexColor('#a1b2c3')).toBe(true);
    });

    it('returns true for a valid 3-digit hex color', () =>
    {
      expect(globalThis.ColorManager.isValidHexColor('#abc')).toBe(true);
    });

    it('returns false for a malformed hex color', () =>
    {
      expect(globalThis.ColorManager.isValidHexColor('#zzzzzz')).toBe(false);
    });
  });

  describe('parseHexStringToRgb', () =>
  {
    it('returns null for a falsy value', () =>
    {
      expect(globalThis.ColorManager.parseHexStringToRgb(null)).toBeNull();
    });

    it('returns null for an empty string', () =>
    {
      expect(globalThis.ColorManager.parseHexStringToRgb('')).toBeNull();
    });

    it('returns null when the string does not start with #', () =>
    {
      expect(globalThis.ColorManager.parseHexStringToRgb('a1b2c3')).toBeNull();
    });

    it('expands a 3-digit shorthand into full RGB components', () =>
    {
      expect(globalThis.ColorManager.parseHexStringToRgb('#abc')).toEqual({ r: 170, g: 187, b: 204 });
    });

    it('parses a 6-digit hex string into RGB components', () =>
    {
      expect(globalThis.ColorManager.parseHexStringToRgb('#a1b2c3')).toEqual({ r: 161, g: 178, b: 195 });
    });

    it('returns null for a length that is neither 3 nor 6 digits', () =>
    {
      expect(globalThis.ColorManager.parseHexStringToRgb('#abcd')).toBeNull();
    });

    it('returns null when a component fails to parse as hex', () =>
    {
      // Arrange- 6 characters but not valid hex digits (parseInt yields NaN).
      expect(globalThis.ColorManager.parseHexStringToRgb('#gggggg')).toBeNull();
    });
  });

  describe('rgbDistanceSquared', () =>
  {
    it('computes the squared Euclidean distance between two RGB triples', () =>
    {
      // Arrange
      const a = { r: 0, g: 0, b: 0 };
      const b = { r: 3, g: 4, b: 0 };

      // Act
      const result = globalThis.ColorManager.rgbDistanceSquared(a, b);

      // Assert
      expect(result).toBe(25);
    });
  });

  describe('colorIndexFromHex', () =>
  {
    it('returns null for an invalid hex string', () =>
    {
      expect(globalThis.ColorManager.colorIndexFromHex('not-a-hex')).toBeNull();
    });

    it('returns null for pure white in 6-digit form', () =>
    {
      expect(globalThis.ColorManager.colorIndexFromHex('#ffffff')).toBeNull();
    });

    it('returns null for pure white in 3-digit form', () =>
    {
      expect(globalThis.ColorManager.colorIndexFromHex('#fff')).toBeNull();
    });

    it('returns the palette index of the closest textColor sample', () =>
    {
      // Arrange- the local ColorManager.textColor stub returns "#colorN", which parseHexStringToRgb
      // cannot parse (not a valid hex string), so every sample is skipped and the initial
      // bestIndex (0) survives untouched- exercising the "sampleRgb === null, continue" branch.
      const result = globalThis.ColorManager.colorIndexFromHex('#123456');

      // Assert
      expect(result).toBe(0);
    });

    it('picks a non-zero palette index when a closer real hex sample exists', () =>
    {
      // Arrange- temporarily swap in a real hex-returning textColor so a genuine distance
      // comparison can select something other than the untouched bestIndex default.
      const original = globalThis.ColorManager.textColor;
      globalThis.ColorManager.textColor = (index) => (index === 5 ? '#000000' : '#ffffff');

      // Act
      const result = globalThis.ColorManager.colorIndexFromHex('#010101');

      // Assert
      expect(result).toBe(5);
      globalThis.ColorManager.textColor = original;
    });
  });
});
//endregion plugins/_base/managers/color-manager.test.js
