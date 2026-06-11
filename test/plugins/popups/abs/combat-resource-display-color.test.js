//region plugins/popups/abs/combat-resource-display-color.test.js
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

import { describe, expect, it } from 'vitest';

import { repoRoot } from '../../../setup/repo-root.js';

/**
 * Evaluates {@link PopupResourceDisplayColor} from the ABS extension source.
 *
 * @returns {object} VM sandbox globals.
 */
function loadPopupResourceDisplayColorVm()
{
  const helperPath = path.join(
    repoRoot,
    'src/plugins/popups/ext/abs/helpers/PopupResourceDisplayColor.js',
  );

  const helperSource = fs.readFileSync(helperPath, 'utf8')
    .replace(/\nexport default PopupResourceDisplayColor;\r?\n/, '\n');

  const sandbox = {
    console,
    Map_TextPop: {
      Types: {
        HpDamage: 'hp-damage',
        MpDamage: 'mp-damage',
        TpDamage: 'tp-damage',
      },
    },
    ColorManager: {
      textColor(n)
      {
        return `#${String(n).padStart(2, '0')}aaaa`;
      },
      normalColor()
      {
        return '#ffffff';
      },
      hpGaugeColor2()
      {
        return '#ffcc22';
      },
      mpGaugeColor2()
      {
        return '#00ccff';
      },
      tpGaugeColor2()
      {
        return '#44dd66';
      },
    },
    J: {
      POPUPS: {
        EXT: {
          ABS: {
            Metadata: {
              damageOutlineWidth: 2,
              healingOutlineWidth: 4,
            },
          },
        },
      },
    },
  };

  vm.createContext(sandbox);
  vm.runInContext(`${helperSource}\nthis.PopupResourceDisplayColor = PopupResourceDisplayColor;`, sandbox);

  return sandbox;
}

describe('PopupResourceDisplayColor (J-Popups-ABS)', () =>
{
  it('keeps harm HP white and tints harm MP/TP toward their heal gauge colors', () =>
  {
    const { PopupResourceDisplayColor, Map_TextPop } = loadPopupResourceDisplayColorVm();

    const hpHarm = PopupResourceDisplayColor.resolvePopupFillColor({
      healing: false,
      popupType: Map_TextPop.Types.HpDamage,
    }, 0);
    const mpHarm = PopupResourceDisplayColor.resolvePopupFillColor({
      healing: false,
      popupType: Map_TextPop.Types.MpDamage,
    }, 5);
    const tpHarm = PopupResourceDisplayColor.resolvePopupFillColor({
      healing: false,
      popupType: Map_TextPop.Types.TpDamage,
    }, 19);
    const mpHeal = PopupResourceDisplayColor.resolvePopupFillColor({
      healing: true,
      popupType: Map_TextPop.Types.MpDamage,
    }, 23);

    expect(hpHarm).toBe('#ffffff');
    expect(mpHarm).toBe('rgb(173, 239, 255)');
    expect(tpHarm).toBe('rgb(195, 244, 206)');
    expect(mpHeal).toBe('#23aaaa');
  });

  it('uses slimmer harm outlines tinted black-ish toward each resource gauge color', () =>
  {
    const { PopupResourceDisplayColor, Map_TextPop } = loadPopupResourceDisplayColorVm();

    const hpHarmOutline = PopupResourceDisplayColor.resolvePopupOutlineColor({
      healing: false,
      popupType: Map_TextPop.Types.HpDamage,
    });
    const mpHarmOutline = PopupResourceDisplayColor.resolvePopupOutlineColor({
      healing: false,
      popupType: Map_TextPop.Types.MpDamage,
    });
    const tpHarmOutline = PopupResourceDisplayColor.resolvePopupOutlineColor({
      healing: false,
      popupType: Map_TextPop.Types.TpDamage,
    });
    const harmWidth = PopupResourceDisplayColor.resolvePopupOutlineWidth({
      healing: false,
      popupType: Map_TextPop.Types.HpDamage,
    }, true);
    const healWidth = PopupResourceDisplayColor.resolvePopupOutlineWidth({
      healing: true,
      popupType: Map_TextPop.Types.HpDamage,
    }, true);

    expect(hpHarmOutline).toBe('rgb(102, 82, 14)');
    expect(mpHarmOutline).toBe('rgb(0, 82, 102)');
    expect(tpHarmOutline).toBe('rgb(27, 88, 41)');
    expect(harmWidth).toBe(2);
    expect(healWidth).toBe(4);
  });
});
//endregion plugins/popups/abs/combat-resource-display-color.test.js