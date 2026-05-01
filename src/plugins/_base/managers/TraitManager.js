//region TraitManager
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
   * Negative values are draining (poison/damage); positive values are restoring (regen).
   * @param {'hp'|'mp'|'tp'} type The resource type the slip affects.
   * @param {number} evaluatedValue The resolved slip amount; sign determines direction.
   * @returns {string}
   */
  static slipName(type, evaluatedValue)
  {
    const isDrain = Number(evaluatedValue) < 0;
    switch (type)
    {
      case 'hp':
        // negative HP slip is poison; positive is regeneration.
        return isDrain ? 'Poison' : TextManager.xparam(7);
      case 'mp':
        // negative MP slip drains Magi; positive restores it.
        return isDrain ? 'MP Drain' : TextManager.xparam(8);
      case 'tp':
        // negative TP slip drains Tech; positive charges it.
        return isDrain ? 'Tech Drain' : TextManager.xparam(9);
    }

    // fallback for any future slip resource types.
    return 'Slip';
  }

  /**
   * Returns the icon index for a slip effect.
   * Negative values use drain/poison icons; positive values use the stat's regen icon.
   * @param {'hp'|'mp'|'tp'} type The resource type the slip affects.
   * @param {number} evaluatedValue The resolved slip amount; sign determines direction.
   * @returns {number}
   */
  static slipIcon(type, evaluatedValue)
  {
    const isDrain = Number(evaluatedValue) < 0;
    switch (type)
    {
      case 'hp':
        // poison icon for drain; hp regen xparam icon for restoration.
        return isDrain ? 48 : IconManager.xparam(7);
      case 'mp':
        // mp drain icon; mp regen xparam icon for restoration.
        return isDrain ? 72 : IconManager.xparam(8);
      case 'tp':
        // tech drain icon; tp regen xparam icon for restoration.
        return isDrain ? 73 : IconManager.xparam(9);
    }

    // no icon for unknown slip types.
    return 0;
  }
}
//endregion TraitManager