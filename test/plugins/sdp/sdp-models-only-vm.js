//region plugins/sdp/sdp-models-only-vm.js
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

import { repoRoot } from '../../setup/repo-root.js';

const SDP_MODELS_DIR = path.join(repoRoot, 'src/plugins/sdp/__models');

/**
 * @param {string} filename
 * @returns {string}
 */
function readSdpModelSource(filename)
{
  return fs.readFileSync(path.join(SDP_MODELS_DIR, filename), 'utf8');
}

/**
 * Evaluates SDP `__models` sources into `sandbox` (no J-SDP plugin, no `$gameParty`).
 *
 * @param {object} sandbox
 */
export function loadSdpPanelModelsOnlyVm(sandbox)
{
  vm.createContext(sandbox);

  const bundle = [
    `String.empty = '';`,
    `
    globalThis.J = {
      SDP: {
        Metadata: {
          resolveEffectiveRankUpCostParts(panel)
          {
            return {
              baseCost: panel.baseCost,
              flatGrowthCost: panel.flatGrowthCost,
              multGrowthCost: panel.multGrowthCost,
            };
          },
        },
      },
    };
    `,
    readSdpModelSource('PanelParameter.js'),
    readSdpModelSource('PanelRankupReward.js'),
    readSdpModelSource('PanelRarity.js'),
    readSdpModelSource('StatDistributionPanel.js'),
    readSdpModelSource('StatDistributionPanelBuilder.js'),
    `
    globalThis.__sdpModels = {
      PanelParameter,
      PanelRankupReward,
      PanelRarity,
      StatDistributionPanel,
      StatDistributionPanelBuilder,
    };
    `,
  ].join('\n\n');

  vm.runInContext(bundle, sandbox);
  Object.assign(sandbox, sandbox.__sdpModels);
}
//endregion plugins/sdp/sdp-models-only-vm.js
