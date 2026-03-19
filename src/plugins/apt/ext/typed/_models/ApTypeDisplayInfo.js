// #region ApTypeDisplayInfo
/**
 * Represents the display information for a typed AP key: a user-facing
 * `name` and an `icon` index. This is a simple runtime record.
 */
class ApTypeDisplayInfo
{
  /**
   * The display name.
   * @type {string}
   */
  name = String.empty;

  /**
   * The icon index for this display.
   * @type {number}
   */
  icon = 0;

  /**
   * Constructs a new display info.
   * @param {string} name - The user-facing name to display
   * @param {number} icon - The icon index corresponding to the key
   */
  constructor(name, icon)
  {
    // assign the display name.
    this.name = String(name);

    // assign the icon index.
    this.icon = Number(icon);
  }
}
// #endregion ApTypeDisplayInfo