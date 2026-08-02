//region plugins/sdp/core/models/panel-rarity.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

/**
 * Rarity is stored on a panel as a small integer, but it arrives from three different places: a
 * word typed by tooling, a canonical 0-5 number from the editor, and legacy window-colour codes
 * left over from before the canonical range existed. Each entry point has its own coercion, and
 * these tests pin all three plus the chrome colour each rarity draws with.
 */
describe('PanelRarity (direct src import)', () =>
{
  let PanelRarity;

  beforeAll(async () =>
  {
    ({ default: PanelRarity } = await import('../../../../../src/plugins/sdp/core/models/PanelRarity.js'));
  });

  //region rarityLabelToIndex
  describe('rarityLabelToIndex', () =>
  {
    it.each([
      [ 'Common', 'RARITY_COMMON' ],
      [ 'Magical', 'RARITY_MAGICAL' ],
      [ 'Rare', 'RARITY_RARE' ],
      [ 'Epic', 'RARITY_EPIC' ],
      [ 'Legendary', 'RARITY_LEGENDARY' ],
      [ 'Godlike', 'RARITY_GODLIKE' ],
    ])('maps the %s label onto its stored index', (labelKey, indexKey) =>
    {
      // Arrange & Act
      const result = PanelRarity.rarityLabelToIndex(PanelRarity[labelKey]);

      // Assert
      expect(result).toBe(PanelRarity[indexKey]);
    });

    it('treats an unrecognized label as Common rather than refusing it', () =>
    {
      // Arrange: a typo in tooling should downgrade the panel, not break panel loading.
      // Act
      const result = PanelRarity.rarityLabelToIndex('Mythic');

      // Assert
      expect(result).toBe(PanelRarity.RARITY_COMMON);
    });
  });
  //endregion rarityLabelToIndex

  //region rarityIndexToColorIndex
  describe('rarityIndexToColorIndex', () =>
  {
    it('draws Common with the default window colour', () =>
    {
      // Arrange & Act
      const result = PanelRarity.rarityIndexToColorIndex(PanelRarity.RARITY_COMMON);

      // Assert
      expect(result).toBe(0);
    });

    it.each([
      [ 'RARITY_MAGICAL', 'WindowColorMagical' ],
      [ 'RARITY_RARE', 'WindowColorRare' ],
      [ 'RARITY_EPIC', 'WindowColorEpic' ],
      [ 'RARITY_LEGENDARY', 'WindowColorLegendary' ],
      [ 'RARITY_GODLIKE', 'WindowColorGodlike' ],
    ])('draws %s with its own chrome colour', (indexKey, colorKey) =>
    {
      // Arrange & Act
      const result = PanelRarity.rarityIndexToColorIndex(PanelRarity[indexKey]);

      // Assert
      expect(result).toBe(PanelRarity[colorKey]);
    });

    it('falls back to the default colour for an index outside the known range', () =>
    {
      // Arrange: an unknown index means the panel data disagrees with this table, which is worth
      // surfacing rather than silently drawing something arbitrary.
      const warn = vi.spyOn(console, 'warn')
        .mockImplementation(() => {});

      // Act
      const result = PanelRarity.rarityIndexToColorIndex(99);

      // Assert
      expect(result).toBe(0);

      // restore manually rather than relying on a global reset, so the spy cannot leak into
      // whichever test happens to run next in this file.
      warn.mockRestore();
    });

    it('warns about an index outside the known range', () =>
    {
      // Arrange
      const warn = vi.spyOn(console, 'warn')
        .mockImplementation(() => {});

      // Act
      PanelRarity.rarityIndexToColorIndex(99);

      // Assert
      expect(warn).toHaveBeenCalled();

      warn.mockRestore();
    });
  });
  //endregion rarityIndexToColorIndex

  //region normalizeRarityFromJson
  describe('normalizeRarityFromJson', () =>
  {
    it.each([
      [ 'WindowColorRare', 'RARITY_RARE' ],
      [ 'WindowColorEpic', 'RARITY_EPIC' ],
      [ 'WindowColorLegendary', 'RARITY_LEGENDARY' ],
      [ 'WindowColorGodlike', 'RARITY_GODLIKE' ],
    ])('translates the legacy %s code into its canonical index', (legacyKey, indexKey) =>
    {
      // Arrange: panels authored before the canonical range existed stored the window colour
      // itself as the rarity, so those values still have to be understood on load.
      // Act
      const result = PanelRarity.normalizeRarityFromJson(PanelRarity[legacyKey]);

      // Assert
      expect(result).toBe(PanelRarity[indexKey]);
    });

    it.each([
      [ 0 ],
      [ 1 ],
      [ 2 ],
      [ 5 ],
    ])('passes the canonical value %i straight through', (raw) =>
    {
      // Arrange & Act
      const result = PanelRarity.normalizeRarityFromJson(raw);

      // Assert
      expect(result).toBe(raw);
    });

    it('clamps an out-of-range value to Common', () =>
    {
      // Arrange
      const warn = vi.spyOn(console, 'warn')
        .mockImplementation(() => {});

      // Act
      const result = PanelRarity.normalizeRarityFromJson(404);

      // Assert
      expect(result).toBe(PanelRarity.RARITY_COMMON);

      warn.mockRestore();
    });

    it('warns about an out-of-range value, since it means the config is misauthored', () =>
    {
      // Arrange
      const warn = vi.spyOn(console, 'warn')
        .mockImplementation(() => {});

      // Act
      PanelRarity.normalizeRarityFromJson(404);

      // Assert
      expect(warn).toHaveBeenCalled();

      warn.mockRestore();
    });

    it('clamps a negative value to Common', () =>
    {
      // Arrange
      const warn = vi.spyOn(console, 'warn')
        .mockImplementation(() => {});

      // Act
      const result = PanelRarity.normalizeRarityFromJson(-1);

      // Assert
      expect(result).toBe(PanelRarity.RARITY_COMMON);

      warn.mockRestore();
    });
  });
  //endregion normalizeRarityFromJson

  //region fromRarityToColor
  describe('fromRarityToColor', () =>
  {
    it('resolves a rarity word straight through to its chrome colour', () =>
    {
      // Arrange & Act
      const result = PanelRarity.fromRarityToColor(PanelRarity.Legendary);

      // Assert
      expect(result).toBe(PanelRarity.WindowColorLegendary);
    });

    it('resolves an unrecognized word to the Common chrome colour', () =>
    {
      // Arrange & Act
      const result = PanelRarity.fromRarityToColor('Mythic');

      // Assert
      expect(result).toBe(0);
    });
  });
  //endregion fromRarityToColor
});
//endregion plugins/sdp/core/models/panel-rarity.test.js