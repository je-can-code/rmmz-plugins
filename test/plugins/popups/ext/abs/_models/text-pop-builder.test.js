//region plugins/popups/ext/abs/_models/text-pop-builder.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('TextPopBuilder ext/abs augments (direct src import)', () =>
{
  let TextPopBuilder;

  beforeAll(async () =>
  {
    vi.resetModules();

    ({ default: globalThis.Map_TextPop } = await import('../../../../../../src/plugins/popups/core/_models/Map_TextPop.js'));
    await import('../../../../../../src/plugins/popups/ext/abs/_models/Map_TextPop.js');

    ({ default: TextPopBuilder } = await import('../../../../../../src/plugins/popups/core/_models/TextPopBuilder.js'));
    globalThis.TextPopBuilder = TextPopBuilder;

    await import('../../../../../../src/plugins/popups/ext/abs/_models/TextPopBuilder.js');
  });

  describe('isShieldDamage', () =>
  {
    it('configures a shield-damage popup with the shield type/color/icon and center ring', () =>
    {
      // Arrange
      const builder = new TextPopBuilder('  -5');

      // Act
      const popup = builder.isShieldDamage().build();

      // Assert
      expect(popup.popupType).toEqual('shield');
      expect(popup.textColorIndex).toEqual(8);
      expect(popup.iconIndex).toEqual(448);
      expect(popup.layoutRing).toEqual(globalThis.Map_TextPop.LayoutRings.CenterFocus);
    });
  });

  describe('isShieldBreak', () =>
  {
    it('configures a shield-break popup with the shield type/color/icon and center ring', () =>
    {
      // Arrange
      const builder = new TextPopBuilder('B R E A K');

      // Act
      const popup = builder.isShieldBreak().build();

      // Assert
      expect(popup.popupType).toEqual('shield');
      expect(popup.textColorIndex).toEqual(7);
      expect(popup.iconIndex).toEqual(448);
      expect(popup.layoutRing).toEqual(globalThis.Map_TextPop.LayoutRings.CenterFocus);
    });
  });
});
//endregion plugins/popups/ext/abs/_models/text-pop-builder.test.js
