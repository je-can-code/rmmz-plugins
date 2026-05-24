//region PanelRarity
import StatDistributionPanel from './StatDistributionPanel.js';
/**
 * Panel rarity indices (**0–5**) and helpers for SDP UI drawing.
 */
class PanelRarity
{
  /** Common (`rarity` **0**). */
  static RARITY_COMMON = 0;

  /** Magical (`rarity` **1**). */
  static RARITY_MAGICAL = 1;

  /** Rare (`rarity` **2**). */
  static RARITY_RARE = 2;

  /** Epic (`rarity` **3**). */
  static RARITY_EPIC = 3;

  /** Legendary (`rarity` **4**). */
  static RARITY_LEGENDARY = 4;

  /** Godlike (`rarity` **5**). */
  static RARITY_GODLIKE = 5;

  /** Highest valid {@link StatDistributionPanel.rarity} value ({@link PanelRarity.RARITY_GODLIKE}). */
  static RARITY_MAX = 5;

  /**
   * Common SDPs that bring few pros and many cons.
   * @type {"Common"}
   */
  static Common = "Common";

  /**
   * Magical SDPs that are usually fairly balanced.
   * @type {"Magical"}
   */
  static Magical = "Magical";

  /**
   * Rare SDPs that are skewed in favor of the player granting many positives.
   * @type {"Rare"}
   */
  static Rare = "Rare";

  /**
   * Epic SDPs that make a significant difference if the player chooses to
   * master it.
   * @type {"Epic"}
   */
  static Epic = "Epic";

  /**
   * Legendary SDPs that can easily make-or-break the flow of battle with the
   * immense boons they bring.
   * @type {"Legendary"}
   */
  static Legendary = "Legendary";

  /**
   * Godlike SDPs that are few and far between, because they are tremendously
   * imbalanced in favor of the player. The player would be a fool to not master
   * this as soon as possible.
   * @type {string}
   */
  static Godlike = "Godlike";

  /** Window text color index for Magical rarity chrome. */
  static WindowColorMagical = 3;

  /** Window text color index for Rare rarity chrome. */
  static WindowColorRare = 23;

  /** Window text color index for Epic rarity chrome. */
  static WindowColorEpic = 31;

  /** Window text color index for Legendary rarity chrome. */
  static WindowColorLegendary = 20;

  /** Window text color index for Godlike rarity chrome. */
  static WindowColorGodlike = 25;

  /**
   * Converts a rarity label ("Rare", …) into the integer stored as {@link StatDistributionPanel.rarity}.
   *
   * @param {string} label The rarity word from JSON or tooling.
   * @returns {number} {@link PanelRarity.RARITY_COMMON} .. {@link PanelRarity.RARITY_GODLIKE}.
   */
  static rarityLabelToIndex(label)
  {
    switch (label)
    {
      case PanelRarity.Common:
        return PanelRarity.RARITY_COMMON;
      case PanelRarity.Magical:
        return PanelRarity.RARITY_MAGICAL;
      case PanelRarity.Rare:
        return PanelRarity.RARITY_RARE;
      case PanelRarity.Epic:
        return PanelRarity.RARITY_EPIC;
      case PanelRarity.Legendary:
        return PanelRarity.RARITY_LEGENDARY;
      case PanelRarity.Godlike:
        return PanelRarity.RARITY_GODLIKE;
      default:
        return PanelRarity.RARITY_COMMON;
    }
  }

  /**
   * Window text color index for SDP chrome for this rarity.
   *
   * @param {number} rarityIndex {@link PanelRarity.RARITY_COMMON} .. {@link PanelRarity.RARITY_GODLIKE}.
   * @returns {number}
   */
  static rarityIndexToColorIndex(rarityIndex)
  {
    switch (rarityIndex)
    {
      case PanelRarity.RARITY_COMMON:
        return 0;
      case PanelRarity.RARITY_MAGICAL:
        return PanelRarity.WindowColorMagical;
      case PanelRarity.RARITY_RARE:
        return PanelRarity.WindowColorRare;
      case PanelRarity.RARITY_EPIC:
        return PanelRarity.WindowColorEpic;
      case PanelRarity.RARITY_LEGENDARY:
        return PanelRarity.WindowColorLegendary;
      case PanelRarity.RARITY_GODLIKE:
        return PanelRarity.WindowColorGodlike;
      default:
        console.warn(`PanelRarity.rarityIndexToColorIndex: unknown rarity index [ ${rarityIndex} ].`);
        return 0;
    }
  }

  /**
   * Coerces parsed JSON into {@link PanelRarity.RARITY_COMMON} .. {@link PanelRarity.RARITY_GODLIKE}.
   *
   * @param {string|number} raw Labels, integers **0–5**, or alternate integer encodings accepted by the loader.
   * @returns {number}
   */
  static normalizeRarityFromJson(raw)
  {
    if (typeof raw === "string")
    {
      const trimmed = raw.trim();

      if (trimmed === "")
      {
        return PanelRarity.RARITY_COMMON;
      }

      switch (trimmed)
      {
        case PanelRarity.Common:
          return PanelRarity.RARITY_COMMON;
        case PanelRarity.Magical:
          return PanelRarity.RARITY_MAGICAL;
        case PanelRarity.Rare:
          return PanelRarity.RARITY_RARE;
        case PanelRarity.Epic:
          return PanelRarity.RARITY_EPIC;
        case PanelRarity.Legendary:
          return PanelRarity.RARITY_LEGENDARY;
        case PanelRarity.Godlike:
          return PanelRarity.RARITY_GODLIKE;
        default:
          break;
      }

      const parsedFromString = parseInt(trimmed, 10);

      if (!Number.isNaN(parsedFromString))
      {
        return PanelRarity.normalizeRarityFromJson(parsedFromString);
      }

      console.warn(`PanelRarity.normalizeRarityFromJson: unrecognized string [ ${trimmed} ].`);
      return PanelRarity.RARITY_COMMON;
    }

    const n = parseInt(raw, 10);

    if (Number.isNaN(n))
    {
      return PanelRarity.RARITY_COMMON;
    }

    switch (n)
    {
      case PanelRarity.WindowColorRare:
        return PanelRarity.RARITY_RARE;
      case PanelRarity.WindowColorEpic:
        return PanelRarity.RARITY_EPIC;
      case PanelRarity.WindowColorLegendary:
        return PanelRarity.RARITY_LEGENDARY;
      case PanelRarity.WindowColorGodlike:
        return PanelRarity.RARITY_GODLIKE;
      default:
        break;
    }

    if (n >= PanelRarity.RARITY_COMMON && n <= PanelRarity.RARITY_MAX)
    {
      return n;
    }

    console.warn(`PanelRarity.normalizeRarityFromJson: out-of-range rarity [ ${n} ]; clamped to Common.`);
    return PanelRarity.RARITY_COMMON;
  }

  /**
   * Converts a rarity label string into a window text color index for SDP chrome.
   *
   * @param {string} rarity The rarity word.
   * @returns {number}
   */
  static fromRarityToColor(rarity)
  {
    const rarityIndex = PanelRarity.rarityLabelToIndex(rarity);
    return PanelRarity.rarityIndexToColorIndex(rarityIndex);
  }
}

export default PanelRarity;
//endregion PanelRarity