//region sdp-config-json
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

import { repoRoot } from '../../../setup/repo-root.js';

import { stripEsmForVm } from './strip-esm-for-vm.js';

const SDP_MODELS_DIR = path.join(repoRoot, 'src/plugins/sdp/core/models');

/**
 * Reads an SDP `__models` source file and strips ESM for VM evaluation.
 *
 * @param {string} filename
 * @returns {string}
 */
function readSdpModelSource(filename)
{
  const source = fs.readFileSync(path.join(SDP_MODELS_DIR, filename), 'utf8');
  return stripEsmForVm(source);
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
        key: p.key,
        identity: p.identity.toConfigJson(),
        progression: p.progression.toConfigJson(),
        panelParameters: p.panelParameters.map(pp => ({
          parameterKey: pp.parameterKey,
          perRank: String(pp.perRank),
          isFlat: pp.isFlat,
          isCore: pp.isCore,
        })),
        panelRewards: p.panelRewards.map(r => ({
          rewardName: r.rewardName,
          rankRequired: String(r.rankRequired),
          effect: r.effect,
        })),
        mastery: p.mastery.toConfigJson(),
      };
    }

    const basePanel = StatDistributionPanel.Builder()
      .name('Vitest Panel')
      .key('vitest_panel')
      .iconIndex(1)
      .rarity(PanelRarity.RARITY_COMMON)
      .unlockedByDefault(true)
      .description('test')
      .flavorText('test')
      .maxRank(3)
      .baseCost(0)
      .flatGrowth(0)
      .multGrowth(1)
      .parameters([ new PanelParameter('mhp', 1, true, true) ])
      .rewards([])
      .build();

    const atkFlat = StatDistributionPanel.Builder()
      .name('Vitest ATK flat')
      .key('vitest_atk_flat')
      .iconIndex(1)
      .rarity(PanelRarity.RARITY_COMMON)
      .unlockedByDefault(true)
      .description('test')
      .flavorText('test')
      .maxRank(5)
      .baseCost(0)
      .flatGrowth(0)
      .multGrowth(1)
      .parameters([ new PanelParameter('atk', 4, true, false) ])
      .rewards([])
      .build();

    const atkPct = StatDistributionPanel.Builder()
      .name('Vitest ATK percent')
      .key('vitest_atk_pct')
      .iconIndex(1)
      .rarity(PanelRarity.RARITY_COMMON)
      .unlockedByDefault(true)
      .description('test')
      .flavorText('test')
      .maxRank(5)
      .baseCost(0)
      .flatGrowth(0)
      .multGrowth(1)
      .parameters([ new PanelParameter('atk', 10, false, false) ])
      .rewards([])
      .build();

    const atkFlatNeg = StatDistributionPanel.Builder()
      .name('Vitest ATK flat neg')
      .key('vitest_atk_flat_neg')
      .iconIndex(1)
      .rarity(PanelRarity.RARITY_COMMON)
      .unlockedByDefault(true)
      .description('test')
      .flavorText('test')
      .maxRank(5)
      .baseCost(0)
      .flatGrowth(0)
      .multGrowth(1)
      .parameters([ new PanelParameter('atk', -3, true, false) ])
      .rewards([])
      .build();

    const atkPctNeg = StatDistributionPanel.Builder()
      .name('Vitest ATK percent neg')
      .key('vitest_atk_pct_neg')
      .iconIndex(1)
      .rarity(PanelRarity.RARITY_COMMON)
      .unlockedByDefault(true)
      .description('test')
      .flavorText('test')
      .maxRank(5)
      .baseCost(0)
      .flatGrowth(0)
      .multGrowth(1)
      .parameters([ new PanelParameter('atk', -8, false, false) ])
      .rewards([])
      .build();

    const atkCrush = StatDistributionPanel.Builder()
      .name('Vitest ATK crush')
      .key('vitest_atk_crush')
      .iconIndex(1)
      .rarity(PanelRarity.RARITY_COMMON)
      .unlockedByDefault(true)
      .description('test')
      .flavorText('test')
      .maxRank(10)
      .baseCost(0)
      .flatGrowth(0)
      .multGrowth(1)
      .parameters([ new PanelParameter('atk', -50, false, false) ])
      .rewards([])
      .build();

    const mhpCrush = StatDistributionPanel.Builder()
      .name('Vitest MHP crush')
      .key('vitest_mhp_crush')
      .iconIndex(1)
      .rarity(PanelRarity.RARITY_COMMON)
      .unlockedByDefault(true)
      .description('test')
      .flavorText('test')
      .maxRank(10)
      .baseCost(0)
      .flatGrowth(0)
      .multGrowth(1)
      .parameters([ new PanelParameter('mhp', -50, false, false) ])
      .rewards([])
      .build();

    const allPanels = [ basePanel, atkFlat, atkPct, atkFlatNeg, atkPctNeg, atkCrush, mhpCrush ];

    globalThis.__vitestSdpConfigJson = JSON.stringify({
      subgroups: [],
      sdps: allPanels.map(panelToConfigRow),
    });
  `;

  const bundle = [
    `String.empty = '';`,
    readSdpModelSource('PanelIdentity.js'),
    readSdpModelSource('PanelMastery.js'),
    readSdpModelSource('PanelParameter.js'),
    readSdpModelSource('PanelRankupReward.js'),
    readSdpModelSource('PanelRarity.js'),
    readSdpModelSource('PanelProgression.js'),
    readSdpModelSource('StatDistributionPanel.js'),
    readSdpModelSource('StatDistributionPanelBuilder.js'),
    snippet,
  ].join('\n\n');

  vm.runInContext(bundle, sandbox);

  return sandbox.__vitestSdpConfigJson;
}
//endregion sdp-config-json
