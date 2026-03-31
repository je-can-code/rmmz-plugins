//region sdp-config-json
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

import { repoRoot } from '../../../setup/repo-root.js';

const SDP_MODELS_DIR = path.join(repoRoot, 'src/plugins/sdp/__models');

/**
 * Reads a bundled SDP `__models` source file (plugin layer is plain concatenated JS, not Node modules).
 *
 * @param {string} filename
 * @returns {string}
 */
function readSdpModelSource(filename)
{
  return fs.readFileSync(path.join(SDP_MODELS_DIR, filename), 'utf8');
}

/**
 * Builds `data/config.sdp.json` text for Vitest by running {@link StatDistributionPanel.Builder} in a VM
 * (same shape {@link J_SdpPluginMetadata.classifyPanels} expects after `JSON.parse`).
 *
 * @returns {string}
 */
export function buildVitestSdpConfigJson()
{
  const sandbox = { console };

  vm.createContext(sandbox);

  const snippet = `
    function panelToConfigRow(p)
    {
      return {
        name: p.name,
        key: p.key,
        iconIndex: String(p.iconIndex),
        rarity: p.rarity,
        unlockedByDefault: p.unlockedByDefault,
        description: p.description,
        topFlavorText: p.topFlavorText,
        maxRank: String(p.maxRank),
        baseCost: String(p.baseCost),
        flatGrowthCost: String(p.flatGrowthCost),
        multGrowthCost: String(p.multGrowthCost),
        panelParameters: p.panelParameters.map(pp => ({
          parameterId: String(pp.parameterId),
          perRank: String(pp.perRank),
          isFlat: pp.isFlat,
          isCore: pp.isCore,
        })),
        panelRewards: p.panelRewards.map(r => ({
          rewardName: r.rewardName,
          rankRequired: String(r.rankRequired),
          effect: r.effect,
        })),
      };
    }

    const basePanel = StatDistributionPanel.Builder()
      .name('Vitest Panel')
      .key('vitest_panel')
      .iconIndex(1)
      .rarity(PanelRarity.Common)
      .unlockedByDefault(true)
      .description('test')
      .flavorText('test')
      .maxRank(3)
      .baseCost(1)
      .flatGrowth(1)
      .multGrowth(1)
      .parameters([ new PanelParameter(0, 1, true, true) ])
      .rewards([])
      .build();

    const atkFlat = StatDistributionPanel.Builder()
      .name('Vitest ATK flat')
      .key('vitest_atk_flat')
      .iconIndex(1)
      .rarity(PanelRarity.Common)
      .unlockedByDefault(true)
      .description('test')
      .flavorText('test')
      .maxRank(5)
      .baseCost(1)
      .flatGrowth(1)
      .multGrowth(1)
      .parameters([ new PanelParameter(2, 4, true, false) ])
      .rewards([])
      .build();

    const atkPct = StatDistributionPanel.Builder()
      .name('Vitest ATK percent')
      .key('vitest_atk_pct')
      .iconIndex(1)
      .rarity(PanelRarity.Common)
      .unlockedByDefault(true)
      .description('test')
      .flavorText('test')
      .maxRank(5)
      .baseCost(1)
      .flatGrowth(1)
      .multGrowth(1)
      .parameters([ new PanelParameter(2, 10, false, false) ])
      .rewards([])
      .build();

    const atkFlatNeg = StatDistributionPanel.Builder()
      .name('Vitest ATK flat neg')
      .key('vitest_atk_flat_neg')
      .iconIndex(1)
      .rarity(PanelRarity.Common)
      .unlockedByDefault(true)
      .description('test')
      .flavorText('test')
      .maxRank(5)
      .baseCost(1)
      .flatGrowth(1)
      .multGrowth(1)
      .parameters([ new PanelParameter(2, -3, true, false) ])
      .rewards([])
      .build();

    const atkPctNeg = StatDistributionPanel.Builder()
      .name('Vitest ATK percent neg')
      .key('vitest_atk_pct_neg')
      .iconIndex(1)
      .rarity(PanelRarity.Common)
      .unlockedByDefault(true)
      .description('test')
      .flavorText('test')
      .maxRank(5)
      .baseCost(1)
      .flatGrowth(1)
      .multGrowth(1)
      .parameters([ new PanelParameter(2, -8, false, false) ])
      .rewards([])
      .build();

    const allPanels = [ basePanel, atkFlat, atkPct, atkFlatNeg, atkPctNeg ];

    globalThis.__vitestSdpConfigJson = JSON.stringify({
      sdps: allPanels.map(panelToConfigRow),
    });
  `;

  const bundle = [
    `String.empty = '';`,
    readSdpModelSource('PanelParameter.js'),
    readSdpModelSource('PanelRankupReward.js'),
    readSdpModelSource('PanelRarity.js'),
    readSdpModelSource('StatDistributionPanel.js'),
    readSdpModelSource('StatDistributionPanelBuilder.js'),
    snippet,
  ].join('\n\n');

  vm.runInContext(bundle, sandbox);

  return sandbox.__vitestSdpConfigJson;
}
//endregion sdp-config-json
