//region TraitManager
import { IconManager } from './IconManager.js';

/**
 * A static class that centralizes display data (name and icon) for traits and
 * notetag-driven effects across the ecosystem.
 *
 * The goal is a single authoritative place where Jeremy can adjust how any
 * given tag or trait type presents itself, so every window that renders trait
 * data stays consistent without needing updates in multiple files.
 */
class TraitManager
{
  /**
   * The constructor is not designed to be called.
   * This is a static class.
   */
  constructor()
  {
    throw new Error('This is a static class.');
  }

  /**
   * Returns the display name for a slip effect.
   * In JABS convention, negative values are healing and positive values are damage.
   * @param {'hp'|'mp'|'tp'} type The resource type the slip affects.
   * @param {number} evaluatedValue The resolved slip amount; sign determines direction.
   * @returns {string}
   */
  static slipName(type, evaluatedValue)
  {
    const isDamage = Number(evaluatedValue) > 0;
    switch (type)
    {
      case 'hp':
        // positive HP slip is damage; negative is regeneration.
        return isDamage ? 'HP Poison' : TextManager.xparam(7);
      case 'mp':
        // positive MP slip drains Magi; negative restores it.
        return isDamage ? 'MP Leak' : TextManager.xparam(8);
      case 'tp':
        // positive TP slip drains Tech; negative charges it.
        return isDamage ? 'TP Drain' : TextManager.xparam(9);
    }

    // fallback for any future slip resource types.
    return 'Slip';
  }

  /**
   * Returns the icon index for a slip effect.
   * In JABS convention, positive values use damage icons; negative values use the stat's regen icon.
   * @param {'hp'|'mp'|'tp'} type The resource type the slip affects.
   * @param {number} evaluatedValue The resolved slip amount; sign determines direction.
   * @returns {number}
   */
  static slipIcon(type, evaluatedValue)
  {
    const isDamage = Number(evaluatedValue) > 0;
    switch (type)
    {
      case 'hp':
        // positive = poison/damage icon; negative = hp regen icon.
        return isDamage ? 2 : IconManager.xparam(7);
      case 'mp':
        // positive = mp drain icon; negative = mp regen icon.
        return isDamage ? 67 : IconManager.xparam(8);
      case 'tp':
        // positive = tp drain icon; negative = tp regen icon.
        return isDamage ? 11 : IconManager.xparam(9);
    }

    // no icon for unknown slip types.
    return 0;
  }
}

export default TraitManager;
//endregion TraitManager