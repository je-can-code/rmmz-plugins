//region Window_StudyCostList
/**
 * The price tag: what the highlighted recipe asks in exchange for being taught.
 *
 * Deliberately the same shape as the tool and ingredient columns of the crafting scene, down to the
 * colours. A player who has learned to read "x3" in green as *enough* and in red as *short* should not
 * have to learn it a second time because this is a different screen.
 */
class Window_StudyCostList
  extends Window_Command
{
  /**
   * Implements {@link Window_Command.initMembers}.
   *
   * Seeded here because `Window_Command.initialize` refreshes before a constructor body would run.
   */
  initMembers()
  {
    /**
     * The components making up the price currently shown.
     * @type {CraftingComponent[]}
     */
    this._components = [];
  }

  /**
   * The components making up the price currently shown.
   * @returns {CraftingComponent[]}
   */
  components()
  {
    return this._components;
  }

  /**
   * Shows the price of a different recipe.
   * @param {CraftingComponent[]} components The components making up the new price.
   */
  setComponents(components)
  {
    this._components = components;

    this.refresh();
  }

  /**
   * Implements {@link Window_Command.makeCommandList}.
   */
  makeCommandList()
  {
    // empty the current list.
    this.clearCommandList();

    // grab all the listings available.
    const commands = this.buildCommands();

    // build all the commands.
    commands.forEach(this.addBuiltCommand, this);
  }

  /**
   * Builds a command for every part of the price.
   * @returns {BuiltWindowCommand[]}
   */
  buildCommands()
  {
    return this.components()
      .map(this.buildCommand, this);
  }

  /**
   * Builds a single line of the price tag.
   * @param {CraftingComponent} component One part of what the recipe costs.
   * @returns {BuiltWindowCommand}
   */
  buildCommand(component)
  {
    // determine how many we need vs have on-hand.
    const need = component.quantity();
    const have = component.getHandledQuantity();
    const haveTextColor = (have >= need)
      ? 24
      : 18;
    const needQuantity = `x${need}`;

    const subtexts = [];

    // determine the subtext messages for the command.
    let missingMessage = `(have: ${have})`;
    if (have < need)
    {
      missingMessage += ` (missing: ${(need - have)})`;
    }

    // Append the row to the working collection.
    subtexts.push(missingMessage);

    const name = component.getName();

    // build a command based on the component.
    return new WindowCommandBuilder(name)
      .setSymbol(`${name}-${this.index()}`)
      .setExtensionData(component)
      .setIconIndex(component.getIconIndex())
      .setHelpText(name)
      .setRightText(needQuantity)
      .setRightColorIndex(haveTextColor)
      .setTextLines(subtexts)
      .build();
  }

  /**
   * Extends {@link #drawAllItems}.<br/>
   * Also says so plainly when there is no recipe highlighted to have a price.
   */
  drawAllItems()
  {
    if (this.components().length === 0)
    {
      this.resetFontSettings();
      this.changeTextColor(ColorManager.normalColor());

      this.drawText('Nothing selected.', 0, 0, this.innerWidth, Window_Base.TextAlignments.Center);

      // exit early without a payload.
      return;
    }

    // Invoke the aliased body with the original receiver.
    Window_Command.prototype.drawAllItems.call(this);
  }

  /**
   * Overwrites {@link #itemHeight}.<br/>
   * Leaves room beneath each part of the price for the line saying how much of it the party holds.
   * @returns {number}
   */
  itemHeight()
  {
    return this.lineHeight() * 1.5;
  }

  /**
   * Overwrites {@link #drawBackgroundRect}.<br/>
   * A price tag is read, not chosen from, so its rows want no selection backdrop.
   * @param {Rectangle} _ The rectangle that would have been drawn into.
   */
  drawBackgroundRect(_)
  {
  }
}

export default Window_StudyCostList;
//endregion Window_StudyCostList