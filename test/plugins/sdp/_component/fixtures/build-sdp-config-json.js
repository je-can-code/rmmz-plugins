//region plugins/sdp/_component/fixtures/build-sdp-config-json.js
/**
 * Builds `data/config.sdp.json` text for Vitest using the real {@link StatDistributionPanel.Builder}/
 * {@link PanelParameter}/{@link PanelRarity} classes (direct ESM import, no vm) so this fixture's data
 * shape always matches what {@link J_SdpPluginMetadata.classifyConfiguration} actually expects after
 * `JSON.parse`, and so Builder/toConfigJson() coverage isn't hidden behind a vm sandbox.
 *
 * @param {typeof import('../../../../../src/plugins/sdp/core/models/StatDistributionPanel.js').default} StatDistributionPanel
 * @param {typeof import('../../../../../src/plugins/sdp/core/models/PanelParameter.js').default} PanelParameter
 * @param {typeof import('../../../../../src/plugins/sdp/core/models/PanelRarity.js').default} PanelRarity
 * @returns {string}
 */
export function buildVitestSdpConfigJson(StatDistributionPanel, PanelParameter, PanelRarity)
{
  // converts a built panel back into the config.sdp.json row shape (identity/progression/mastery nested).
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

  return JSON.stringify({
    subgroups: [],
    sdps: allPanels.map(panelToConfigRow),
  });
}
//endregion plugins/sdp/_component/fixtures/build-sdp-config-json.js
