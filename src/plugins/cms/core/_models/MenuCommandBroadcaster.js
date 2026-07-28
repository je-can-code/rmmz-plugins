//region MenuCommandBroadcaster
/**
 * Stands in for the main menu's single command window now that there are two of them.
 *
 * Six plugins integrate with the main menu by aliasing `Scene_Menu#createCommandWindow` and calling
 * `this._commandWindow.setHandler(...)`. Splitting the menu into two columns would have silently
 * broken every one of them- their commands would still render, but pressing one would do nothing,
 * which is the worst possible failure because it looks like it works.
 *
 * Rather than asking six plugins to learn about columns, `_commandWindow` becomes this: something
 * that accepts a handler and gives it to both columns. A command's section decides which column
 * renders it, so only one column will ever actually fire the handler- registering with both is
 * harmless, and means a plugin retagging its command between sections needs no change at all.
 */
class MenuCommandBroadcaster
{
  /**
   * The command windows receiving everything registered here.
   * @type {Window_MenuCommand[]}
   */
  #windows = [];

  /**
   * @constructor
   * @param {Window_MenuCommand[]} windows The command windows to broadcast to.
   */
  constructor(windows)
  {
    this.#windows = windows;
  }

  /**
   * Registers a handler against every command window.
   * @param {string} symbol The symbol of the command being handled.
   * @param {Function} method The handler to invoke when that command is chosen.
   */
  setHandler(symbol, method)
  {
    // give the handler to each column; only the one rendering this command can ever fire it.
    this.#windows.forEach(window => window.setHandler(symbol, method));
  }

  /**
   * Refreshes every command window.
   */
  refresh()
  {
    this.#windows.forEach(window => window.refresh());
  }

  /**
   * Gets the windows this broadcaster feeds.
   * @returns {Window_MenuCommand[]}
   */
  windows()
  {
    return this.#windows;
  }
}

export default MenuCommandBroadcaster;
//endregion MenuCommandBroadcaster
