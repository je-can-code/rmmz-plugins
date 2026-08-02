//region Window_MenuActorCommand
import Window_MenuSectionCommand from './Window_MenuSectionCommand.js';

/**
 * The left column of the main menu, listing every scene scoped to a single actor.
 */
class Window_MenuActorCommand
  extends Window_MenuSectionCommand
{
  /**
   * Implements {@link Window_MenuSectionCommand.menuSection}.<br/>
   * @returns {string}
   */
  menuSection()
  {
    return MenuSection.Actor;
  }
}

export default Window_MenuActorCommand;
//endregion Window_MenuActorCommand
