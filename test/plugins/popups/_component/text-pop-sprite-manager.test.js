//region plugins/popups/_component/text-pop-sprite-manager.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installPopupsHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPopups,
} from './fixtures/install-popups-host-globals.js';

describe('J-Popups TextPopSpriteManager (direct src import)', () =>
{
  let TextPopBuilder;
  let TextPopSpriteManager;
  let Map_TextPop;
  let Sprite_MapDamage;

  beforeAll(async () =>
  {
    vi.resetModules();

    installPopupsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.J_EventEmitter } = await import('../../../../src/plugins/_base/models/J_EventEmitter.js'));

    setPluginContextToJPopups();
    await import('../../../../src/plugins/popups/core/_metadata/initialization.js');

    ({ default: Map_TextPop } = await import('../../../../src/plugins/popups/core/_models/Map_TextPop.js'));
    ({ default: TextPopBuilder } = await import('../../../../src/plugins/popups/core/_models/TextPopBuilder.js'));
    // patches globalThis.Sprite_Damage.prototype with setXVariance/setYVariance/setDamageColor, which
    // Sprite_MapDamage extends and TextPopSpriteManager.convert() relies on.
    await import('../../../../src/plugins/popups/core/sprites/Sprite_Damage.js');

    ({ default: Sprite_MapDamage } = await import('../../../../src/plugins/popups/core/sprites/Sprite_MapDamage.js'));
    ({ default: TextPopSpriteManager } = await import('../../../../src/plugins/popups/core/_models/TextPopSpriteManager.js'));
  });

  describe('convert()', () =>
  {
    function buildConvertedSprite()
    {
      const popup = new TextPopBuilder(5)
        .setPopupType(Map_TextPop.Types.Gold)
        .setIconIndex(9)
        .setTextColorIndex(4)
        .setXVariance(2)
        .setYVariance(3)
        .build();

      return TextPopSpriteManager.convert(popup);
    }

    it('returns a Sprite_MapDamage instance', () =>
    {
      // Arrange & Act
      const sprite = buildConvertedSprite();

      // Assert
      expect(sprite instanceof Sprite_MapDamage).toBe(true);
    });

    it('maps the x coordinate variance', () =>
    {
      // Arrange & Act
      const sprite = buildConvertedSprite();

      // Assert
      expect(sprite._j._popups._xVariance).toBe(2);
    });

    it('maps the y coordinate variance', () =>
    {
      // Arrange & Act
      const sprite = buildConvertedSprite();

      // Assert
      expect(sprite._j._popups._yVariance).toBe(3);
    });

    it('maps the text color index onto the damage color', () =>
    {
      // Arrange & Act
      const sprite = buildConvertedSprite();

      // Assert
      expect(sprite._j._popups._damageColor).toBe(4);
    });

    it('marks a non-damage popup type as not a damage sprite', () =>
    {
      // Arrange & Act
      const sprite = buildConvertedSprite();

      // Assert
      expect(sprite._j._popups._isDamage).toBe(false);
    });

    it('sets the sprite duration to the standard 60 frames', () =>
    {
      // Arrange & Act
      const sprite = buildConvertedSprite();

      // Assert
      expect(sprite._duration).toBe(60);
    });
  });
});
//endregion plugins/popups/_component/text-pop-sprite-manager.test.js
