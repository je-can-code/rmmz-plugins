//region plugins/_base/core/core/character-frame.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import CharacterFrame from '../../../../../src/plugins/_base/core/core/CharacterFrame.js';

/**
 * The arithmetic behind drawing one frame of one character away from the map.
 *
 * The two sheet layouts are what the cases are chosen around: a `$` sheet that must ignore whatever
 * index it is handed, an ordinary sheet whose index walks across and then down its blocks, and a `!$`
 * object sheet that must still read as a single character. The scale cases each leave exactly one
 * limit in charge, so a sum that consulted the wrong one could not pass.
 */
describe('CharacterFrame', () =>
{
  let originalImageManager;

  beforeAll(() =>
  {
    // the engine decides what counts as a single-character sheet; mirror its rule for the prefixes.
    originalImageManager = globalThis.ImageManager;
    globalThis.ImageManager = { isBigCharacter: name => /^[!$]*\$/.test(name) };
  });

  afterAll(() =>
  {
    globalThis.ImageManager = originalImageManager;
  });

  describe('standing', () =>
  {
    it('takes the middle frame of the top row on a single-character sheet, whatever index it is given', () =>
    {
      // Arrange - a 3x4 sheet of 64x80 frames, handed an index that would matter on an ordinary sheet.
      const sheetWidth = 192;
      const sheetHeight = 320;

      // Act
      const frame = CharacterFrame.standing('$m_slime', 5, sheetWidth, sheetHeight);

      // Assert
      expect(frame).toEqual({ x: 64, y: 0, width: 64, height: 80 });
    });

    it('treats an unshifted object sheet carrying both prefixes as a single character', () =>
    {
      // Arrange - the torch: 144x384, so 48x96 frames.
      const sheetWidth = 144;
      const sheetHeight = 384;

      // Act
      const frame = CharacterFrame.standing('!$o_torch-unlit', 3, sheetWidth, sheetHeight);

      // Assert
      expect(frame).toEqual({ x: 48, y: 0, width: 48, height: 96 });
    });

    it('walks an ordinary sheet\'s index across its blocks and then down to the second row', () =>
    {
      // Arrange - a 12x8 sheet of 48x48 frames; index 5 is the second block of the bottom row.
      const sheetWidth = 576;
      const sheetHeight = 384;

      // Act
      const firstBlock = CharacterFrame.standing('Monster', 0, sheetWidth, sheetHeight);
      const sixthBlock = CharacterFrame.standing('Monster', 5, sheetWidth, sheetHeight);

      // Assert
      expect(firstBlock).toEqual({ x: 48, y: 0, width: 48, height: 48 });
      expect(sixthBlock).toEqual({ x: 192, y: 192, width: 48, height: 48 });
    });
  });

  describe('fitScale', () =>
  {
    it('keeps the preferred scale when the box has room for it', () =>
    {
      // Arrange - 48x48 at 2x needs 96x96, inside a 300x300 box.
      // Act
      const scale = CharacterFrame.fitScale(48, 48, 300, 300, 2);

      // Assert
      expect(scale).toBe(2);
    });

    it('shrinks to the width limit when the frame is too wide for the box', () =>
    {
      // Arrange - 200 wide at 2x is 400, against a 300-wide box that is plenty tall.
      // Act
      const scale = CharacterFrame.fitScale(200, 100, 300, 1000, 2);

      // Assert
      expect(scale).toBe(1.5);
    });

    it('shrinks to the height limit when the frame is too tall for the box', () =>
    {
      // Arrange - 400 tall at 2x is 800, against a 600-tall box that is plenty wide.
      // Act
      const scale = CharacterFrame.fitScale(100, 400, 1000, 600, 2);

      // Assert
      expect(scale).toBe(1.5);
    });
  });
});
//endregion plugins/_base/core/core/character-frame.test.js
