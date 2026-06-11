//region plugins/popups/abs/combat-resource-popup-layout.test.js
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

import { describe, expect, it } from 'vitest';

import { repoRoot } from '../../../setup/repo-root.js';

/**
 * Loads core {@link PopupLayoutHelper} then applies the ABS combat stagger augment.
 *
 * @returns {object} VM sandbox globals.
 */
function loadCombatResourcePopupLayoutVm()
{
  const coreHelperPath = path.join(
    repoRoot,
    'src/plugins/popups/core/helpers/PopupLayoutHelper.js',
  );
  const augmentPath = path.join(
    repoRoot,
    'src/plugins/popups/ext/abs/helpers/CombatResourcePopupLayout.js',
  );

  const coreHelperSource = fs.readFileSync(coreHelperPath, 'utf8')
    .replace(/import Map_TextPop from '\.\/\.\.\/_models\/Map_TextPop\.js';\r?\n/, '')
    .replace(/\nexport default PopupLayoutHelper;\r?\n/, '\n');
  const augmentSource = fs.readFileSync(augmentPath, 'utf8')
    .replace(/\nexport default CombatResourcePopupLayout;\r?\n/, '\n');

  const sandbox = {
    console,
    Map_TextPop: {
      Types: {
        HpDamage: 'hp-damage',
        MpDamage: 'mp-damage',
        TpDamage: 'tp-damage',
      },
      LayoutRings: {},
    },
    J: {
      POPUPS: {
        EXT: {
          ABS: {
            Aliased: {
              PopupLayoutHelper: new Map(),
            },
          },
        },
        Layout: {
          PaddingX: 24,
          PaddingY: 0,
          VerticalOffset: 0,
          RingStepX: 8,
          RingStepY: 8,
          ResetDuration: 120,
        },
      },
    },
    Graphics: {
      frameCount: 0,
    },
  };

  vm.createContext(sandbox);
  vm.runInContext(
    `${coreHelperSource}\nPopupLayoutHelper.initializeRingLayouts();\nthis.PopupLayoutHelper = PopupLayoutHelper;`,
    sandbox,
  );
  vm.runInContext(augmentSource, sandbox);

  return sandbox;
}

describe('CombatResourcePopupLayout', () =>
{
  it('staggers HP/MP/TP vertically for harm and heal combat resource streams', () =>
  {
    const { PopupLayoutHelper } = loadCombatResourcePopupLayoutVm();

    const hpHarm = PopupLayoutHelper.resolveMotionOffset({
      healing: false,
      popupType: 'hp-damage',
    });
    const mpHarm = PopupLayoutHelper.resolveMotionOffset({
      healing: false,
      popupType: 'mp-damage',
    });
    const tpHarm = PopupLayoutHelper.resolveMotionOffset({
      healing: false,
      popupType: 'tp-damage',
    });
    const hpHeal = PopupLayoutHelper.resolveMotionOffset({
      healing: true,
      popupType: 'hp-damage',
    });
    const tpHeal = PopupLayoutHelper.resolveMotionOffset({
      healing: true,
      popupType: 'tp-damage',
    });

    expect(hpHarm).toEqual({ x: 24, y: -16 });
    expect(mpHarm).toEqual({ x: 24, y: 0 });
    expect(tpHarm).toEqual({ x: 24, y: 16 });
    expect(hpHeal).toEqual({ x: -24, y: -16 });
    expect(tpHeal).toEqual({ x: -24, y: 16 });
  });
});
//endregion plugins/popups/abs/combat-resource-popup-layout.test.js