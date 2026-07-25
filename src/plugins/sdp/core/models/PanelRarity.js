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
   * Coerces a numeric rarity value from config.sdp.json into {@link PanelRarity.RARITY_COMMON} .. {@link PanelRarity.RARITY_GODLIKE}.
   * The editor always writes rarity as a number; string inputs are not a supported format.
   *
   * @param {number} raw Integer from parsed JSON; 0–5 canonical or legacy window-color codes.
   * @returns {number}
   */
  static normalizeRarityFromJson(raw)
  {
    // legacy window-color codes that predate the 0–5 canonical range.
    switch (raw)
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

    // canonical 0–5 range passes through directly.
    if (raw >= PanelRarity.RARITY_COMMON && raw <= PanelRarity.RARITY_MAX)
    {
      return raw;
    }

    // anything else is a misauthored config; surface it and fall back to Common.
    console.warn(`PanelRarity.normalizeRarityFromJson: out-of-range rarity [ ${raw} ]; clamped to Common.`);
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