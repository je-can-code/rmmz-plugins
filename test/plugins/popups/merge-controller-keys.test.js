//region plugins/popups/merge-controller-keys.test.js
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

import { describe, expect, it } from 'vitest';

import { repoRoot } from '../../setup/repo-root.js';

/**
 * Reads merge-controller source for VM eval (strips ESM export the browser ship does not use in isolation).
 *
 * @returns {string}
 */
function readMergeControllerSourceForVm()
{
  const mergePath = path.join(
    repoRoot,
    'src/plugins/popups/ext/abs/managers/JABS_PopupMergeController.js',
  );

  return fs.readFileSync(mergePath, 'utf8')
    .replace(/\nexport default JABS_PopupMergeController;\r?\n/, '\n');
}

/**
 * Minimal host surface so {@link src/plugins/popups/ext/abs/managers/JABS_PopupMergeController.js}
 * evaluates in isolation (merge key helpers + `start()` wiring).
 *
 * @param {object} sandbox VM global object.
 */
function installMergeControllerHarness(sandbox)
{
  sandbox.Graphics = {
    frameCount: 0,
  };
  sandbox.TextPopManager = {
    show()
    {
    },
  };
  sandbox.TextPopSpriteManager = {
    convert()
    {
      return {
        releaseAccumulatePhase: null,
        destroyed: false,
        refreshDisplayedValue: null,
        _j: {
          _popups: {
            _sourcePopup: {
              value: '',
            },
          },
        },
      };
    },
  };

  sandbox.J = {
    POPUPS: {
      Helpers: {
        PopupEmitter: {
          on()
          {
          },
        },
      },
      EventNames: {
        MergeFlushAll: 'popups/merge-flush-all',
        ComboChainCleared: 'popups/combo-chain-cleared',
      },
      EXT: {
        ABS: {
          Metadata: {
            mergeParams: {
              idleFlushFrames: 90,
            },
          },
        },
      },
      Layout: {
        Motion: {
          Enabled: false,
        },
      },
      resolveMotionOffset()
      {
        return {
          x: 0,
          y: 0,
        };
      },
      consumeLayoutRingOffset()
      {
        return {
          x: 0,
          y: 0,
        };
      },
      findSpriteCharacterForGameCharacter()
      {
        return null;
      },
    },
  };
}

describe('JABS_PopupMergeController (evaluated from src)', () =>
{
  it('buildStrikeMergeKey groups one aggregate lane per popup type + heal/harm', () =>
  {
    const sandbox = {
      console,
    };

    installMergeControllerHarness(sandbox);
    vm.createContext(sandbox);

    const code = `${readMergeControllerSourceForVm()
    }\nglobalThis.__jabsMergeControllerExport = JABS_PopupMergeController;\n`;

    vm.runInContext(code, sandbox, {
      filename: path.join(repoRoot, 'src/plugins/popups/ext/abs/managers/JABS_PopupMergeController.js'),
    });

    const Merge = sandbox.__jabsMergeControllerExport;

    expect(Merge.buildStrikeMergeKey({ popupType: 'hp-damage', healing: false })).toBe(
      'strike|hp-damage|harm',
    );
    expect(Merge.buildStrikeMergeKey({ popupType: 'hp-damage', healing: true })).toBe(
      'strike|hp-damage|heal',
    );
    expect(Merge.buildStrikeMergeKey({ popupType: 'mp-damage', healing: false })).toBe(
      'strike|mp-damage|harm',
    );
  });

  it('buildSlipMergeKey mirrors strike polarity split on slip streams', () =>
  {
    const sandbox = {
      console,
    };

    installMergeControllerHarness(sandbox);
    vm.createContext(sandbox);

    const code = `${readMergeControllerSourceForVm()
    }\nglobalThis.__jabsMergeControllerExport = JABS_PopupMergeController;\n`;

    vm.runInContext(code, sandbox, {
      filename: path.join(repoRoot, 'src/plugins/popups/ext/abs/managers/JABS_PopupMergeController.js'),
    });

    const Merge = sandbox.__jabsMergeControllerExport;

    expect(Merge.buildSlipMergeKey({ popupType: 'slip', healing: false })).toBe('slip|slip|harm');
    expect(Merge.buildSlipMergeKey({ popupType: 'slip', healing: true })).toBe('slip|slip|heal');
  });

  it('buildMitigationMergeKey and buildRewardMergeKey are stable stream ids', () =>
  {
    const sandbox = {
      console,
    };

    installMergeControllerHarness(sandbox);
    vm.createContext(sandbox);

    const code = `${readMergeControllerSourceForVm()
    }\nglobalThis.__jabsMergeControllerExport = JABS_PopupMergeController;\n`;

    vm.runInContext(code, sandbox, {
      filename: path.join(repoRoot, 'src/plugins/popups/ext/abs/managers/JABS_PopupMergeController.js'),
    });

    const Merge = sandbox.__jabsMergeControllerExport;

    expect(Merge.buildMitigationMergeKey('parry')).toBe('mitigation|parry');
    expect(Merge.buildRewardMergeKey('sdp')).toBe('reward|sdp');
  });
});
//endregion plugins/popups/merge-controller-keys.test.js