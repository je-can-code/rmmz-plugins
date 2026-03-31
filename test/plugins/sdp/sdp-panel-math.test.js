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

  it('rankUpCost uses base, flat, and multiplicative growth; max rank returns 0', () =>
  {
    const { PanelParameter, StatDistributionPanel } = sandbox;
    const param = new PanelParameter(0, 5, true, false);
    const panel = StatDistributionPanel.Builder()
      .name('Cost')
      .key('cost_panel')
      .iconIndex(0)
      .rarity(0)
      .unlockedByDefault(true)
      .description('')
      .flavorText('')
      .maxRank(3)
      .baseCost(10)
      .flatGrowth(2)
      .multGrowth(1.5)
      .parameters([ param ])
      .rewards([])
      .build();

    const growth0 = Math.floor(1.5 * (2 * 1));
    expect(panel.rankUpCost(0)).toBe(10 + growth0);
    const growth1 = Math.floor(1.5 * (2 * 2));
    expect(panel.rankUpCost(1)).toBe(10 + growth1);
    expect(panel.rankUpCost(3)).toBe(0);
  });

  it('calculateBonusByRank handles flat and percent; fractional divides by 100', () =>
  {
    const { PanelParameter, StatDistributionPanel } = sandbox;
    const flat = new PanelParameter(2, 7, true, false);
    const pct = new PanelParameter(2, 50, false, false);
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

    expect(panel.calculateBonusByRank(2, 4, 0, false)).toBe(4 * 7 + 0);

    const baseAtk = 80;
    const percentPart = (4 * 50) / 100;
    expect(panel.calculateBonusByRank(2, 4, baseAtk, false)).toBeCloseTo(4 * 7 + baseAtk * percentPart);

    const frac = panel.calculateBonusByRank(2, 2, 100, true);
    expect(frac).toBe((2 * 7 + 100 * ((2 * 50) / 100)) / 100);
  });

  it('getPanelParameterById and getPanelRewardsByRank filter correctly', () =>
  {
    const { PanelParameter, PanelRankupReward, StatDistributionPanel } = sandbox;
    const p0 = new PanelParameter(0, 1, true, false);
    const p1 = new PanelParameter(1, 2, true, false);
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

    expect(panel.getPanelParameterById(1).length).toBe(1);
    expect(panel.getPanelParameterById(1)[0].perRank).toBe(2);
    expect(panel.getPanelRewardsByRank(2).map(x => x.rewardName)).toEqual([ 'B' ]);
  });

  it('getPanelRarityText covers known rarity indices', () =>
  {
    const { PanelParameter, StatDistributionPanel } = sandbox;
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
        .parameters([ new PanelParameter(0, 0, true, false) ])
        .rewards([])
        .build();
    };

    expect(mk(0).getPanelRarityText()).toBe('Common');
    expect(mk(23).getPanelRarityText()).toBe('Rare');
    expect(mk(99).getPanelRarityText()).toContain('unknown rarity');
  });
});
//endregion plugins/sdp/sdp-panel-math.test.js
