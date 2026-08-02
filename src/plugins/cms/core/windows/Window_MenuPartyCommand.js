//region Window_MenuPartyCommand
import Window_MenuSectionCommand from './Window_MenuSectionCommand.js';

/**
 * The right column of the main menu, listing every scene concerning the party or the game as a whole.
 *
 * This column also collects any command that never declared a section at all, which is what allows a
 * plugin written before the menu was split- or one written by someone who never learned it was- to
 * keep appearing rather than silently vanishing.
 */
class Window_MenuPartyCommand
  extends Window_MenuSectionCommand
{
  /**
   * Implements {@link Window_MenuSectionCommand.menuSection}.<br/>
   * @returns {string}
   */
  menuSection()
  {
    return MenuSection.Party;
  }
}

export default Window_MenuPartyCommand;
//endregion Window_MenuPartyCommand
