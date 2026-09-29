//region plugins/hud/ext/target/helpers/target-name-layout.test.js
import { describe, expect, it } from 'vitest';

import TargetNameLayout from '../../../../../../src/plugins/hud/ext/target/helpers/TargetNameLayout.js';

/**
 * How the target's name fits its row, now that the target's icons and level lead the row and leave the name
 * only what is left of it.
 *
 * A name that did not fit used to run off the frame's edge- "*Deposit (Iron) of Purity" read "*Deposit (Iron)
 * of Pur"- so a long name shrinks a size at a time until it fits, and moves down to stay centered on the row.
 */
describe('TargetNameLayout', () =>
{
  /**
   * A stand-in for measuring a name: ten pixels of width for every point of font size.
   * @param {number} fontSize The size being measured.
   * @returns {number}
   */
  const tenPerPoint = fontSize => fontSize * 10;

  it('refuses to be constructed, since everything it knows is static', () =>
  {
    // Arrange
    // Act
    const construct = () => new TargetNameLayout();

    // Assert
    expect(construct)
      .toThrow('This is a static class.');
  });

  describe('fittingFontSize()', () =>
  {
    it('keeps a name that fits at the full size', () =>
    {
      // Arrange- 240 wide at 24, with exactly 240 to fill.
      // Act
      const fontSize = TargetNameLayout.fittingFontSize(tenPerPoint, 240);

      // Assert
      expect(fontSize)
        .toBe(24);
    });

    it('shrinks a long name to the largest size that fits', () =>
    {
      // Arrange- 239 is a pixel short of 24's width, and 200 is exactly 20's.
      // Act
      const justShort = TargetNameLayout.fittingFontSize(tenPerPoint, 239);
      const room = TargetNameLayout.fittingFontSize(tenPerPoint, 200);

      // Assert- one size down, and the size that exactly fits.
      expect(justShort)
        .toBe(23);
      expect(room)
        .toBe(20);
    });

    it('stops at the smallest size for a name that fits at none', () =>
    {
      // Arrange- even the smallest size, 160 wide, is too wide for 100.
      // Act
      const fontSize = TargetNameLayout.fittingFontSize(tenPerPoint, 100);

      // Assert
      expect(fontSize)
        .toBe(16);
    });
  });

  describe('offsetY()', () =>
  {
    it('moves a smaller name down by half the size it lost, to the whole pixel', () =>
    {
      // Arrange
      // Act
      const fullSize = TargetNameLayout.offsetY(24);
      const oddStep = TargetNameLayout.offsetY(23);
      const fourSmaller = TargetNameLayout.offsetY(20);

      // Assert- nothing at full size, nothing for a single point, and two for four.
      expect(fullSize)
        .toBe(0);
      expect(oddStep)
        .toBe(0);
      expect(fourSmaller)
        .toBe(2);
    });
  });
});
//endregion plugins/hud/ext/target/helpers/target-name-layout.test.js
