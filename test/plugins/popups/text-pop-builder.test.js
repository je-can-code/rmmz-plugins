//region plugins/popups/text-pop-builder.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadPopupsPluginVm } from './popups-vm.js';

describe('J-TextPops TextPopBuilder (out/J-TextPops.js)', () =>
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

  it('build() returns Map_TextPop with concatenated value and flags', () =>
  {
    const { TextPopBuilder, Map_TextPop } = sandbox;
    const popup = new TextPopBuilder(12.3)
      .setPrefix('+')
      .setSuffix('!')
      .setCritical(true)
      .setHealing(true)
      .setIconIndex(5)
      .setTextColorIndex(7)
      .setPopupType(Map_TextPop.Types.HpDamage)
      .setXVariance(3)
      .setYVariance(-2)
      .build();

    expect(popup.value).toBe('+13!');
    expect(popup.critical).toBe(true);
    expect(popup.healing).toBe(true);
    expect(popup.iconIndex).toBe(5);
    expect(popup.textColorIndex).toBe(7);
    expect(popup.popupType).toBe(Map_TextPop.Types.HpDamage);
    expect(popup.coordinateVariance).toEqual([ 3, -2 ]);
  });

  it('numeric negative values are floored and hyphen is removed from display value', () =>
  {
    const { TextPopBuilder } = sandbox;
    const popup = new TextPopBuilder(-1.2)
      .build();
    expect(popup.value).toBe('2');
    expect(popup.healing).toBe(true);
  });
});
//endregion plugins/popups/text-pop-builder.test.js
