//region Window_MenuSectionCommand
/**
 * A main menu command window showing only the commands belonging to one section.
 *
 * The main menu is split into two columns- one for scenes about a single actor, one for scenes about
 * the party or the game. Rather than asking every plugin in the ecosystem to register into a new
 * place, both columns extend {@link Window_MenuCommand} and therefore inherit every existing
 * `addOriginalCommands` hook automatically. Each column then keeps only the commands belonging to it.
 *
 * This is why nothing had to change about how commands are registered: the split happens at the point
 * of consumption, not registration. A plugin that has never heard of sections still works, and lands
 * in the party column because that is what an untagged command defaults to.
 */
class Window_MenuSectionCommand
  extends Window_MenuCommand
{

  //region properties
  /**
   * Gets the remembered index.
   * @returns {number} The rememberedIndex.
   */
  rememberedIndex()
  {
    // hand back the remembered index.
    return this._rememberedIndex;
  }

  /**
   * Sets the remembered index.
   * @param {number} newRememberedIndex The new rememberedIndex.
   */
  setRememberedIndex(newRememberedIndex)
  {
    // assign the remembered index.
    this._rememberedIndex = newRememberedIndex;
  }
  //endregion properties

  /**
   * Extends {@link #makeCommandList}.<br/>
   * Also discards every command belonging to a different section.
   */
  makeCommandList()
  {
    // perform original logic, which runs vanilla's commands plus every plugin's additions.
    super.makeCommandList();

    // narrow the assembled list down to this column's section.
    this.filterToSection();
  }

  /**
   * Discards every command in the list that does not belong to this window's section.
   */
  filterToSection()
  {
    // grab the fully assembled list of commands.
    const commands = this.commandList();

    // work out which survive.
    const surviving = commands.filter(command => this.belongsToSection(command));

    // replace the contents in place, since the list itself is owned by the window.
    commands.length = 0;
    commands.push(...surviving);
  }

  /**
   * Determines whether a command belongs in this window.
   *
   * The command list is deliberately heterogeneous- vanilla's {@link Window_Command.addCommand} pushes
   * plain objects while {@link Window_Command.addBuiltCommand} pushes {@link BuiltWindowCommand}
   * instances- so a command may genuinely have no section at all. Those are treated as party
   * commands, which is the same default a built command gets when it never declares one.
   * @param {BuiltWindowCommand|{symbol: string}} command The command to evaluate.
   * @returns {boolean}
   */
  belongsToSection(command)
  {
    // resolve the command's section, treating an undeclared one as the default.
    const section = command.menuSection ?? MenuSection.Party;

    // keep it only if it matches the section this window renders.
    return section === this.menuSection();
  }

  /**
   * The section of commands this window renders.
   * @returns {string} One of {@link MenuSection}.
   */
  menuSection()
  {
    return MenuSection.Party;
  }

  /**
   * Shrinks this window to the height of its contents and centers it vertically.
   *
   * The window sizes itself rather than being handed a height because only it knows how many commands
   * survived filtering- most of this menu is unlocked over the course of the game, so the count is not
   * knowable until the list has actually been built.
   */
  fitToContents()
  {
    // size to exactly the commands present, with at least one row so an empty column is still a shape.
    const desiredHeight = this.fittingHeight(Math.max(1, this.maxItems()));

    // never grow beyond the screen; a fully unlocked menu scrolls rather than overflowing.
    const height = Math.min(desiredHeight, Graphics.boxHeight);

    // center the resulting block vertically.
    const y = Math.floor((Graphics.boxHeight - height) / 2);

    // apply the new shape.
    this.move(this.x, y, this.width, height);
  }


  /**
   * Remembers which command is currently highlighted, so it can be returned to later.
   *
   * Kept separately from the selection itself because a column losing focus is fully deselected- the
   * index is gone the moment the highlight is cleared, so it has to be captured beforehand.
   */
  rememberSelection()
  {
    // only remember a real selection; a deselected column has nothing worth keeping.
    if (this.index() < 0) return;

    this.setRememberedIndex(this.index());
  }

  /**
   * Restores the previously remembered selection, defaulting to the first command.
   */
  restoreSelection()
  {
    // fall back to the top of the list for a column the player has never visited.
    const index = this.rememberedIndex() ?? 0;

    // never restore past the end; the list may have shrunk since the player was last here.
    this.select(Math.min(index, Math.max(0, this.maxItems() - 1)));
  }

}

export default Window_MenuSectionCommand;
//endregion Window_MenuSectionCommand
