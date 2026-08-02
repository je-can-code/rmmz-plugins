//region plugins/sdp/core/models/panel-progression.test.js
import { beforeAll, describe, expect, it } from 'vitest';

/**
 * Progression carries the numbers that decide what a panel costs and how far it ranks. Like
 * identity it loads from either the canonical nested shape or the legacy flat root, and every
 * numeric has to survive an absent or unparseable value- a panel whose cost failed to parse must
 * fall back to a defined number rather than poisoning every cost calculation downstream with NaN.
 */
describe('PanelProgression (direct src import)', () =>
{
  let PanelProgression;
  let PanelRarity;

  beforeAll(async () =>
  {
    ({ default: PanelProgression } = await import('../../../../../src/plugins/sdp/core/models/PanelProgression.js'));
    ({ default: PanelRarity } = await import('../../../../../src/plugins/sdp/core/models/PanelRarity.js'));
  });

  //region shapes
  describe('fromConfigPanel', () =>
  {
    it('reads every field off the canonical nested progression object', () =>
    {
      // Arrange
      const parsed = {
        progression: {
          maxRank: 8,
          rarity: PanelRarity.RARITY_EPIC,
          baseCost: 40,
          flatGrowthCost: 5,
          multGrowthCost: 1.5,
        },
      };

      // Act
      const progression = PanelProgression.fromConfigPanel(parsed);

      // Assert
      expect([ progression.maxRank, progression.baseCost, progression.flatGrowthCost, progression.multGrowthCost ])
        .toEqual([ 8, 40, 5, 1.5 ]);
    });

    it('normalizes rarity through the shared rarity coercion', () =>
    {
      // Arrange: a legacy window-colour code still has to resolve to a canonical rarity.
      const parsed = { progression: { rarity: PanelRarity.WindowColorLegendary } };

      // Act
      const progression = PanelProgression.fromConfigPanel(parsed);

      // Assert
      expect(progression.rarity).toBe(PanelRarity.RARITY_LEGENDARY);
    });

    it('reads fields off the panel root when no nested progression exists', () =>
    {
      // Arrange: config files predating the panel-shape migration store these at the root.
      const parsed = {
        maxRank: 3,
        rarity: PanelRarity.RARITY_RARE,
        baseCost: 10,
        flatGrowthCost: 2,
        multGrowthCost: 1.25,
      };

      // Act
      const progression = PanelProgression.fromConfigPanel(parsed);

      // Assert
      expect([ progression.maxRank, progression.baseCost, progression.flatGrowthCost, progression.multGrowthCost ])
        .toEqual([ 3, 10, 2, 1.25 ]);
    });

    it('normalizes rarity on a legacy row too', () =>
    {
      // Arrange
      const parsed = { rarity: PanelRarity.WindowColorRare };

      // Act
      const progression = PanelProgression.fromConfigPanel(parsed);

      // Assert
      expect(progression.rarity).toBe(PanelRarity.RARITY_RARE);
    });
  });
  //endregion shapes

  //region integer coercion
  describe('integer field coercion', () =>
  {
    it.each([
      [ 'undefined', undefined ],
      [ 'null', null ],
      [ 'an empty string', '' ],
    ])('falls back to the default rank when maxRank is %s', (_label, raw) =>
    {
      // Arrange
      const parsed = { progression: { maxRank: raw } };

      // Act
      const progression = PanelProgression.fromConfigPanel(parsed);

      // Assert
      expect(progression.maxRank).toBe(1);
    });

    it('falls back to the default rank when maxRank cannot be parsed', () =>
    {
      // Arrange
      const parsed = { progression: { maxRank: 'many' } };

      // Act
      const progression = PanelProgression.fromConfigPanel(parsed);

      // Assert
      expect(progression.maxRank).toBe(1);
    });

    it('accepts an integer written as a string', () =>
    {
      // Arrange
      const parsed = { progression: { baseCost: '25' } };

      // Act
      const progression = PanelProgression.fromConfigPanel(parsed);

      // Assert
      expect(progression.baseCost).toBe(25);
    });
  });
  //endregion integer coercion

  //region float coercion
  describe('float field coercion', () =>
  {
    it.each([
      [ 'undefined', undefined ],
      [ 'null', null ],
      [ 'an empty string', '' ],
    ])('falls back to a neutral multiplier when multGrowthCost is %s', (_label, raw) =>
    {
      // Arrange: a neutral 1.0 leaves growth driven purely by the flat cost.
      const parsed = { progression: { multGrowthCost: raw } };

      // Act
      const progression = PanelProgression.fromConfigPanel(parsed);

      // Assert
      expect(progression.multGrowthCost).toBe(1.0);
    });

    it('falls back to a neutral multiplier when multGrowthCost cannot be parsed', () =>
    {
      // Arrange
      const parsed = { progression: { multGrowthCost: 'steep' } };

      // Act
      const progression = PanelProgression.fromConfigPanel(parsed);

      // Assert
      expect(progression.multGrowthCost).toBe(1.0);
    });

    it('accepts a fractional multiplier written as a string', () =>
    {
      // Arrange
      const parsed = { progression: { multGrowthCost: '1.75' } };

      // Act
      const progression = PanelProgression.fromConfigPanel(parsed);

      // Assert
      expect(progression.multGrowthCost).toBe(1.75);
    });
  });
  //endregion float coercion

  //region defaults
  describe('defaults', () =>
  {
    it('builds a single-rank common panel that costs nothing', () =>
    {
      // Arrange & Act
      const progression = PanelProgression.defaults();

      // Assert
      expect([ progression.maxRank, progression.rarity, progression.baseCost, progression.multGrowthCost ])
        .toEqual([ 1, PanelRarity.RARITY_COMMON, 0, 1.0 ]);
    });
  });
  //endregion defaults
});
//endregion plugins/sdp/core/models/panel-progression.test.js