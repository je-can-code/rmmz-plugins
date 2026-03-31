//region plugins/popups/text-pop-sprite-manager.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadPopupsPluginVm } from './popups-vm.js';

describe('J-TextPops TextPopSpriteManager (out/J-TextPops.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadPopupsPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('convert() maps popup fields onto Sprite_Damage', () =>
  {
    const { TextPopBuilder, TextPopSpriteManager, Map_TextPop } = sandbox;

    const popup = new TextPopBuilder(5)
      .setPopupType(Map_TextPop.Types.Gold)
      .setIconIndex(9)
      .setTextColorIndex(4)
      .setXVariance(2)
      .setYVariance(3)
      .build();

    const sprite = TextPopSpriteManager.convert(popup);
    expect(sprite._j._popups._xVariance).toBe(2);
    expect(sprite._j._popups._yVariance).toBe(3);
    expect(sprite._j._popups._damageColor).toBe(4);
    expect(sprite._j._popups._isDamage).toBe(false);
    expect(sprite._duration).toBe(120);
  });
});
//endregion plugins/popups/text-pop-sprite-manager.test.js
