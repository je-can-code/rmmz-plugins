//region plugins/popups/apt/_component/text-pop-builder.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('TextPopBuilder.isAptitude (direct src import)', () =>
{
  let TextPopBuilder;

  beforeAll(async () =>
  {
    vi.resetModules();

    // real core Map_TextPop/TextPopBuilder are needed so build() actually produces a populated
    // Map_TextPop instance to assert against, rather than a bare stub of the builder's own API.
    ({ default: globalThis.Map_TextPop } = await import('../../../../../src/plugins/popups/core/_models/Map_TextPop.js'));

    // apply the apt augment's Ap type registration onto the real Map_TextPop.Types dictionary.
    await import('../../../../../src/plugins/popups/ext/apt/_models/Map_TextPop.js');

    ({ default: TextPopBuilder } = await import('../../../../../src/plugins/popups/core/_models/TextPopBuilder.js'));
    globalThis.TextPopBuilder = TextPopBuilder;

    // apply the apt augment's isAptitude() convenience method onto the real TextPopBuilder prototype.
    await import('../../../../../src/plugins/popups/ext/apt/_models/TextPopBuilder.js');
  });

  describe('isAptitude', () =>
  {
    it('configures the builder with the Ap popup type, color, icon, and reward-up ring', () =>
    {
      // Arrange
      const builder = new TextPopBuilder(42);

      // Act
      const popup = builder.isAptitude()
        .build();

      // Assert
      expect(popup.popupType).toEqual('ap');
      expect(popup.textColorIndex).toEqual(17);
      expect(popup.iconIndex).toEqual(86);
      expect(popup.layoutRing).toEqual(globalThis.Map_TextPop.LayoutRings.RewardUp);
    });

    it('returns the builder itself for fluent chaining', () =>
    {
      // Arrange
      const builder = new TextPopBuilder(42);

      // Act
      const result = builder.isAptitude();

      // Assert
      expect(result).toBe(builder);
    });
  });
});
//endregion plugins/popups/apt/_component/text-pop-builder.test.js
