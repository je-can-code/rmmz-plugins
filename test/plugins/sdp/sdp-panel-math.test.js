//region plugins/sdp/sdp-panel-math.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadSdpPanelModelsOnlyVm } from './sdp-models-only-vm.js';

describe('J-SDP StatDistributionPanel math (__models only)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadSdpPanelModelsOnlyVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('maps panel rarity (0–5) to window color indices for SDP chrome', () =>
  {
    const { PanelRarity } = sandbox;
    expect(PanelRarity.rarityIndexToColorIndex(PanelRarity.RARITY_COMMON)).toBe(0);
    expect(PanelRarity.rarityIndexToColorIndex(PanelRarity.RARITY_MAGICAL)).toBe(PanelRarity.WindowColorMagical);
    expect(PanelRarity.rarityIndexToColorIndex(PanelRarity.RARITY_RARE)).toBe(PanelRarity.WindowColorRare);
    expect(PanelRarity.rarityIndexToColorIndex(PanelRarity.RARITY_EPIC)).toBe(PanelRarity.WindowColorEpic);
    expect(PanelRarity.rarityIndexToColorIndex(PanelRarity.RARITY_LEGENDARY)).toBe(PanelRarity.WindowColorLegendary);
    expect(PanelRarity.rarityIndexToColorIndex(PanelRarity.RARITY_GODLIKE)).toBe(PanelRarity.WindowColorGodlike);
  });

  it('normalizeRarityFromJson coerces legacy window-color codes and out-of-range integers to 0–5', () =>
  {
    const { PanelRarity } = sandbox;
    expect(PanelRarity.normalizeRarityFromJson(PanelRarity.WindowColorRare)).toBe(PanelRarity.RARITY_RARE);
    expect(PanelRarity.normalizeRarityFromJson(PanelRarity.WindowColorEpic)).toBe(PanelRarity.RARITY_EPIC);
    expect(PanelRarity.normalizeRarityFromJson(6)).toBe(PanelRarity.RARITY_COMMON);
  });

  it('rankUpCost adds exponential growth (flat * mult^(rank+1)); max rank returns 0', () =>
  {
    const { PanelParameter, StatDistributionPanel } = sandbox;
    const param = new PanelParameter('atk', 5, true, false);
    const panel = StatDistributionPanel.Builder()
      .name('Cost')
      .key('cost_panel')
      .iconIndex(0)
      .rarity(0)
      .unlockedByDefault(true)
      .description('')
      .flavorText('')
      .maxRank(4)
      .baseCost(10)
      .flatGrowth(5)
      .multGrowth(2)
      .parameters([ param ])
      .rewards([])
      .build();

    expect(panel.rankUpCost(0)).toBe(10 + Math.floor(5 * Math.pow(2, 1)));
    expect(panel.rankUpCost(1)).toBe(10 + Math.floor(5 * Math.pow(2, 2)));
    expect(panel.rankUpCost(2)).toBe(10 + Math.floor(5 * Math.pow(2, 3)));
    expect(panel.rankUpCost(3)).toBe(10 + Math.floor(5 * Math.pow(2, 4)));
    expect(panel.rankUpCost(4)).toBe(0);
  });

  it('calculateBonusByRank handles flat and percent; fractional divides by 100', () =>
  {
    const { PanelParameter, StatDistributionPanel } = sandbox;
    const flat = new PanelParameter('atk', 7, true, false);
    const pct = new PanelParameter('atk', 50, false, false);
    const panel = StatDistributionPanel.Builder()
      .name('Bonus')
      .key('bonus_panel')
      .iconIndex(0)
      .rarity(0)
      .unlockedByDefault(true)
      .description('')
      .flavorText('')
      .maxRank(5)
      .baseCost(0)
      .flatGrowth(0)
      .multGrowth(1)
      .parameters([ flat, pct ])
      .rewards([])
      .build();

    expect(panel.calculateBonusByRank('atk', 4, 0, false)).toBe(4 * 7 + 0);

    const baseAtk = 80;
    const percentPart = (4 * 50) / 100;
    expect(panel.calculateBonusByRank('atk', 4, baseAtk, false)).toBeCloseTo(4 * 7 + baseAtk * percentPart);

    const frac = panel.calculateBonusByRank('atk', 2, 100, true);
    expect(frac).toBe((2 * 7 + 100 * ((2 * 50) / 100)) / 100);
  });

  it('getPanelParameterByKey and getPanelRewardsByRank filter correctly', () =>
  {
    const { PanelParameter, PanelRankupReward, StatDistributionPanel } = sandbox;
    const p0 = new PanelParameter('mhp', 1, true, false);
    const p1 = new PanelParameter('atk', 2, true, false);
    const r1 = new PanelRankupReward('A', 1, '');
    const r2 = new PanelRankupReward('B', 2, '');
    const panel = StatDistributionPanel.Builder()
      .name('Filters')
      .key('filter_panel')
      .iconIndex(0)
      .rarity(0)
      .unlockedByDefault(true)
      .description('')
      .flavorText('')
      .maxRank(3)
      .baseCost(0)
      .flatGrowth(0)
      .multGrowth(1)
      .parameters([ p0, p1 ])
      .rewards([ r1, r2 ])
      .build();

    expect(panel.getPanelParameterByKey('atk').length).toBe(1);
    expect(panel.getPanelParameterByKey('atk')[0].perRank).toBe(2);
    expect(panel.getPanelRewardsByRank(2).map(x => x.rewardName)).toEqual([ 'B' ]);
  });

  it('getPanelRarityText matches panel rarity and JSON loader normalization', () =>
  {
    const { PanelParameter, PanelRarity, StatDistributionPanel } = sandbox;
    const mk = rarity =>
    {
      return StatDistributionPanel.Builder()
        .name('R')
        .key('r')
        .iconIndex(0)
        .rarity(rarity)
        .unlockedByDefault(true)
        .description('')
        .flavorText('')
        .maxRank(1)
        .baseCost(0)
        .flatGrowth(0)
        .multGrowth(1)
        .parameters([ new PanelParameter('mhp', 0, true, false) ])
        .rewards([])
        .build();
    };

    expect(mk(0).getPanelRarityText()).toBe('Common');
    expect(mk(PanelRarity.RARITY_EPIC).getPanelRarityText()).toBe('Epic');
    expect(mk(PanelRarity.WindowColorRare).getPanelRarityText()).toBe('Rare');
    expect(mk(PanelRarity.WindowColorRare).rarity).toBe(PanelRarity.RARITY_RARE);

    expect(mk(99).rarity).toBe(PanelRarity.RARITY_COMMON);
    expect(mk(99).getPanelRarityText()).toBe('Common');
  });
});
//endregion plugins/sdp/sdp-panel-math.test.js