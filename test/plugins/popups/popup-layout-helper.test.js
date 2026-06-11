//region plugins/popups/popup-layout-helper.test.js
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

import { describe, expect, it } from 'vitest';

import { repoRoot } from '../../setup/repo-root.js';

/**
 * Evaluates {@link PopupLayoutHelper} from source with minimal J.POPUPS layout stubs.
 *
 * @returns {object} VM sandbox with PopupLayoutHelper.
 */
function loadPopupLayoutHelperVm()
{
  const helperPath = path.join(
    repoRoot,
    'src/plugins/popups/core/helpers/PopupLayoutHelper.js',
  );

  const helperSource = fs.readFileSync(helperPath, 'utf8')
    .replace(/import Map_TextPop from '\.\/\.\.\/_models\/Map_TextPop\.js';\r?\n/, '')
    .replace(/\nexport default PopupLayoutHelper;\r?\n/, '\n');

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
    `${helperSource}\nPopupLayoutHelper.initializeRingLayouts();\nthis.PopupLayoutHelper = PopupLayoutHelper;`,
    sandbox,
  );

  return sandbox.PopupLayoutHelper;
}

describe('PopupLayoutHelper.resolveMotionOffset (core)', () =>
{
  it('keeps harm resource pops on one row and staggers heal resource pops vertically', () =>
  {
    const PopupLayoutHelper = loadPopupLayoutHelperVm();

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

    expect(hpHarm).toEqual({ x: 24, y: 0 });
    expect(mpHarm).toEqual({ x: 24, y: 0 });
    expect(tpHarm).toEqual({ x: 24, y: 0 });
    expect(hpHeal).toEqual({ x: -24, y: -16 });
    expect(tpHeal).toEqual({ x: -24, y: 16 });
  });
});
//endregion plugins/popups/popup-layout-helper.test.js