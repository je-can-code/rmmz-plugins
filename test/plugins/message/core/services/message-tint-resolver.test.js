//region plugins/message/core/services/message-tint-resolver.test.js
import { describe, expect, it } from 'vitest';

import MessageTintResolver
  from '../../../../../src/plugins/message/core/services/MessageTintResolver.js';

/**
 * Every colour a message glyph is ever drawn in passes through here, so the expectations are pinned
 * to exact integers rather than to "something reddish". The hue cases below deliberately walk all
 * six sectors of the wheel plus a boundary between each pair - a conversion that got one sector's
 * channel order wrong would still look like a rainbow in motion, and would be wrong for a sixth of
 * every cycle forever.
 */
describe('J-Message MessageTintResolver (direct src import)', () =>
{
  it('converts a CSS colour string into the integer PIXI tints with', () =>
  {
    // Arrange
    const cssColor = '#c0ffee';

    // Act
    const tint = MessageTintResolver.fromCssColor(cssColor);

    // Assert
    expect(tint).toBe(0xc0ffee);
  });

  it('converts pure black without collapsing it to a falsy nothing', () =>
  {
    // Arrange
    const cssColor = '#000000';

    // Act
    const tint = MessageTintResolver.fromCssColor(cssColor);

    // Assert
    expect(tint).toBe(0);
  });

  it('converts pure white', () =>
  {
    // Arrange
    const cssColor = '#ffffff';

    // Act
    const tint = MessageTintResolver.fromCssColor(cssColor);

    // Assert
    expect(tint).toBe(0xffffff);
  });

  it('resolves hue zero to red', () =>
  {
    // Arrange & Act
    const tint = MessageTintResolver.fromHue(0);

    // Assert
    expect(tint).toBe(0xff0000);
  });

  it('resolves hue sixty to yellow', () =>
  {
    // Arrange & Act
    const tint = MessageTintResolver.fromHue(60);

    // Assert
    expect(tint).toBe(0xffff00);
  });

  it('resolves hue one hundred twenty to green', () =>
  {
    // Arrange & Act
    const tint = MessageTintResolver.fromHue(120);

    // Assert
    expect(tint).toBe(0x00ff00);
  });

  it('resolves hue one hundred eighty to cyan', () =>
  {
    // Arrange & Act
    const tint = MessageTintResolver.fromHue(180);

    // Assert
    expect(tint).toBe(0x00ffff);
  });

  it('resolves hue two hundred forty to blue', () =>
  {
    // Arrange & Act
    const tint = MessageTintResolver.fromHue(240);

    // Assert
    expect(tint).toBe(0x0000ff);
  });

  it('resolves hue three hundred to magenta', () =>
  {
    // Arrange & Act
    const tint = MessageTintResolver.fromHue(300);

    // Assert
    expect(tint).toBe(0xff00ff);
  });

  it('ramps the rising channel partway through a sector', () =>
  {
    // Arrange & Act
    // halfway from red toward yellow, so green is at half and the other two are pinned.
    const tint = MessageTintResolver.fromHue(30);

    // Assert
    expect(tint).toBe(0xff8000);
  });

  it('ramps the falling channel partway through an odd sector', () =>
  {
    // Arrange & Act
    // halfway from yellow toward green, so red is falling rather than green rising.
    const tint = MessageTintResolver.fromHue(90);

    // Assert
    expect(tint).toBe(0x80ff00);
  });

  it('wraps a full turn back onto the start of the wheel', () =>
  {
    // Arrange & Act
    const tint = MessageTintResolver.fromHue(360);

    // Assert
    expect(tint).toBe(0xff0000);
  });

  it('wraps a hue past a full turn rather than running off the sector table', () =>
  {
    // Arrange & Act
    const tint = MessageTintResolver.fromHue(480);

    // Assert
    // 480 is 120 into the second turn, which is green.
    expect(tint).toBe(0x00ff00);
  });

  it('wraps a negative hue forward into the wheel', () =>
  {
    // Arrange & Act
    const tint = MessageTintResolver.fromHue(-60);

    // Assert
    // sixty degrees back from red is magenta.
    expect(tint).toBe(0xff00ff);
  });
});
//endregion plugins/message/core/services/message-tint-resolver.test.js