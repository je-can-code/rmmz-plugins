//region plugins/class/core/helpers/class-scene-layout.test.js
import { beforeAll, describe, expect, it } from 'vitest';

/**
 * The spacing every window beside the class list shares.
 */
describe('ClassSceneLayout', () =>
{
  let ClassSceneLayout;

  beforeAll(async () =>
  {
    ({ default: ClassSceneLayout } = await import('../../../../../src/plugins/class/core/helpers/ClassSceneLayout.js'));
  });

  it('refuses to be constructed, since everything it knows is static', () =>
  {
    // Arrange
    // Act
    const construct = () => new ClassSceneLayout();

    // Assert
    expect(construct)
      .toThrow('This is a static class.');
  });

  describe('contentInset()', () =>
  {
    it('insets by a tenth of each window\'s own contents width, rounded down to a whole pixel', () =>
    {
      // Arrange- two windows of different widths, so a fixed inset cannot pass for a share of each.
      const narrow = { contentsWidth: () => 725 };
      const wide = { contentsWidth: () => 1376 };

      // Act
      const narrowInset = ClassSceneLayout.contentInset(narrow);
      const wideInset = ClassSceneLayout.contentInset(wide);

      // Assert
      expect(narrowInset)
        .toBe(72);
      expect(wideInset)
        .toBe(137);
    });
  });
});
//endregion plugins/class/core/helpers/class-scene-layout.test.js