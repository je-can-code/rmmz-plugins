//region plugins/sdp/sdp-panel-math.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installJBaseHostGlobals } from '../_base/fixtures/install-j-base-host-globals.js';

describe('J-SDP StatDistributionPanel math (models only, direct src import)', () =>
{
  let PanelParameter;
  let PanelRankupReward;
  let PanelRarity;
  let StatDistributionPanel;

  beforeAll(async () =>
  {
    vi.resetModules();

    // real _base sets String.empty at import time; PanelIdentity.fromConfigPanel() falls back to it.
    installJBaseHostGlobals();
    await import('../../../src/plugins/_base/_metadata/initialization.js');

    // this suite exercises panel math in isolation (no J-SDP plugin boot, no $gameParty), so
    // rankUpCost() just needs a minimal J.SDP.Metadata stand-in for resolveEffectiveRankUpCostParts.
    globalThis.J.SDP = {
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
    };

    ({ default: PanelParameter } = await import('../../../src/plugins/sdp/core/models/PanelParameter.js'));
    ({ default: PanelRankupReward } = await import('../../../src/plugins/sdp/core/models/PanelRankupReward.js'));
    ({ default: PanelRarity } = await import('../../../src/plugins/sdp/core/models/PanelRarity.js'));
    ({ default: StatDistributionPanel } = await import('../../../src/plugins/sdp/core/models/StatDistributionPanel.js'));
  });

  describe('PanelRarity.rarityIndexToColorIndex', () =>
  {
    it('maps common (0) to window color index 0', () =>
    {
      // Arrange & Act & Assert
      expect(PanelRarity.rarityIndexToColorIndex(PanelRarity.RARITY_COMMON)).toBe(0);
    });

    it('maps magical to its window color index', () =>
    {
      // Arrange & Act & Assert
      expect(PanelRarity.rarityIndexToColorIndex(PanelRarity.RARITY_MAGICAL)).toBe(PanelRarity.WindowColorMagical);
    });

    it('maps rare to its window color index', () =>
    {
      // Arrange & Act & Assert
      expect(PanelRarity.rarityIndexToColorIndex(PanelRarity.RARITY_RARE)).toBe(PanelRarity.WindowColorRare);
    });

    it('maps epic to its window color index', () =>
    {
      // Arrange & Act & Assert
      expect(PanelRarity.rarityIndexToColorIndex(PanelRarity.RARITY_EPIC)).toBe(PanelRarity.WindowColorEpic);
    });

    it('maps legendary to its window color index', () =>
    {
      // Arrange & Act & Assert
      expect(PanelRarity.rarityIndexToColorIndex(PanelRarity.RARITY_LEGENDARY)).toBe(PanelRarity.WindowColorLegendary);
    });

    it('maps godlike to its window color index', () =>
    {
      // Arrange & Act & Assert
      expect(PanelRarity.rarityIndexToColorIndex(PanelRarity.RARITY_GODLIKE)).toBe(PanelRarity.WindowColorGodlike);
    });
  });

  describe('PanelRarity.normalizeRarityFromJson', () =>
  {
    it('coerces a legacy window-color code for rare into the rarity index', () =>
    {
      // Arrange & Act & Assert
      expect(PanelRarity.normalizeRarityFromJson(PanelRarity.WindowColorRare)).toBe(PanelRarity.RARITY_RARE);
    });

    it('coerces a legacy window-color code for epic into the rarity index', () =>
    {
      // Arrange & Act & Assert
      expect(PanelRarity.normalizeRarityFromJson(PanelRarity.WindowColorEpic)).toBe(PanelRarity.RARITY_EPIC);
    });

    it('falls back to common for an out-of-range integer', () =>
    {
      // Arrange & Act & Assert
      expect(PanelRarity.normalizeRarityFromJson(6)).toBe(PanelRarity.RARITY_COMMON);
    });
  });

  describe('rankUpCost', () =>
  {
    function buildCostPanel()
    {
      const param = new PanelParameter('atk', 5, true, false);
      return StatDistributionPanel.Builder()
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
    }

    it('adds exponential growth for rank 0 -> 1', () =>
    {
      // Arrange
      const panel = buildCostPanel();

      // Act & Assert
      expect(panel.rankUpCost(0)).toBe(10 + Math.floor(5 * Math.pow(2, 1)));
    });

    it('adds exponential growth for rank 1 -> 2', () =>
    {
      // Arrange
      const panel = buildCostPanel();

      // Act & Assert
      expect(panel.rankUpCost(1)).toBe(10 + Math.floor(5 * Math.pow(2, 2)));
    });

    it('adds exponential growth for rank 2 -> 3', () =>
    {
      // Arrange
      const panel = buildCostPanel();

      // Act & Assert
      expect(panel.rankUpCost(2)).toBe(10 + Math.floor(5 * Math.pow(2, 3)));
    });

    it('adds exponential growth for rank 3 -> 4', () =>
    {
      // Arrange
      const panel = buildCostPanel();

      // Act & Assert
      expect(panel.rankUpCost(3)).toBe(10 + Math.floor(5 * Math.pow(2, 4)));
    });

    it('returns 0 once the panel is already at max rank', () =>
    {
      // Arrange
      const panel = buildCostPanel();

      // Act & Assert
      expect(panel.rankUpCost(4)).toBe(0);
    });
  });

  describe('calculateBonusByRank', () =>
  {
    function buildBonusPanel()
    {
      const flat = new PanelParameter('atk', 7, true, false);
      const pct = new PanelParameter('atk', 50, false, false);
      return StatDistributionPanel.Builder()
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
    }

    it('sums the flat contribution with the percent contribution against a 0 base', () =>
    {
      // Arrange
      const panel = buildBonusPanel();

      // Act & Assert
      expect(panel.calculateBonusByRank('atk', 4, 0, false)).toBe(4 * 7 + 0);
    });

    it('scales the percent contribution off a nonzero base', () =>
    {
      // Arrange
      const panel = buildBonusPanel();
      const baseAtk = 80;
      const percentPart = (4 * 50) / 100;

      // Act & Assert
      expect(panel.calculateBonusByRank('atk', 4, baseAtk, false)).toBeCloseTo(4 * 7 + baseAtk * percentPart);
    });

    it('divides the fractional result by 100 when fractional is true', () =>
    {
      // Arrange
      const panel = buildBonusPanel();

      // Act
      const frac = panel.calculateBonusByRank('atk', 2, 100, true);

      // Assert
      expect(frac).toBe((2 * 7 + 100 * ((2 * 50) / 100)) / 100);
    });
  });

  describe('getPanelParameterByKey / getPanelRewardsByRank', () =>
  {
    function buildFilterPanel()
    {
      const p0 = new PanelParameter('mhp', 1, true, false);
      const p1 = new PanelParameter('atk', 2, true, false);
      const r1 = new PanelRankupReward('A', 1, '');
      const r2 = new PanelRankupReward('B', 2, '');
      return StatDistributionPanel.Builder()
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
    }

    it('filters getPanelParameterByKey down to matching parameter keys', () =>
    {
      // Arrange
      const panel = buildFilterPanel();

      // Act & Assert
      expect(panel.getPanelParameterByKey('atk').length).toBe(1);
    });

    it('preserves perRank on the filtered parameter', () =>
    {
      // Arrange
      const panel = buildFilterPanel();

      // Act & Assert
      expect(panel.getPanelParameterByKey('atk')[0].perRank).toBe(2);
    });

    it('filters getPanelRewardsByRank down to rewards required at that rank', () =>
    {
      // Arrange
      const panel = buildFilterPanel();

      // Act & Assert
      expect(panel.getPanelRewardsByRank(2).map(x => x.rewardName)).toEqual([ 'B' ]);
    });
  });

  describe('getPanelRarityText', () =>
  {
    function buildRarityPanel(rarity)
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
    }

    it('labels rarity index 0 as Common', () =>
    {
      // Arrange & Act & Assert
      expect(buildRarityPanel(0).getPanelRarityText()).toBe('Common');
    });

    it('labels the epic rarity index as Epic', () =>
    {
      // Arrange & Act & Assert
      expect(buildRarityPanel(PanelRarity.RARITY_EPIC).getPanelRarityText()).toBe('Epic');
    });

    it('labels a legacy rare window-color code as Rare', () =>
    {
      // Arrange & Act & Assert
      expect(buildRarityPanel(PanelRarity.WindowColorRare).getPanelRarityText()).toBe('Rare');
    });

    it('normalizes a legacy rare window-color code to the rarity index on construction', () =>
    {
      // Arrange & Act & Assert
      expect(buildRarityPanel(PanelRarity.WindowColorRare).rarity).toBe(PanelRarity.RARITY_RARE);
    });

    it('normalizes an out-of-range rarity to common on construction', () =>
    {
      // Arrange & Act & Assert
      expect(buildRarityPanel(99).rarity).toBe(PanelRarity.RARITY_COMMON);
    });

    it('labels an out-of-range rarity as Common text', () =>
    {
      // Arrange & Act & Assert
      expect(buildRarityPanel(99).getPanelRarityText()).toBe('Common');
    });
  });
});
//endregion plugins/sdp/sdp-panel-math.test.js
