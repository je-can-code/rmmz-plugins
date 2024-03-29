//region Window_RecipeToolList
class Window_RecipeToolList extends Window_Command
{
  /**
   * Constructor.
   * @param {Rectangle} rect The rectangle that represents this window.
   */
  constructor(rect)
  {
    super(rect);

    // this background is layered ontop of another window, so it should be invisibile.
    this.opacity = 0;
  }

  /**
   * Extends {@link #initialize}.<br>
   * Initializes some additional window properies.
   */
  initialize(rect)
  {
    /**
     * The list of components this window should render.
     * @type {CraftingComponent[]}
     */
    this._components = [];

    super.initialize(rect);
  }

  setComponents(components)
  {
    this._components = components;
  }

  /**
   * Implements {@link #makeCommandList}.<br>
   * Creates the command list of unlocked crafting categories.
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
   * Builds all commands for this command window.
   * Adds all categories to the list that are unlocked.
   * @returns {BuiltWindowCommand[]}
   */
  buildCommands()
  {
    // grab all recipes in the list.
    const components = this._components;

    // compile the list of commands.
    const commands = components.map(this.buildCommand, this);

    // return the compiled list of commands.
    return commands;
  }

  /**
   * Builds a {@link BuiltWindowCommand} based on the component data.
   * @param {CraftingComponent} component The component data.
   * @returns {BuiltWindowCommand} The built command based on this enemy.
   */
  buildCommand(component)
  {
    // determine how many we need vs have on-hand.
    const need = component.quantity();
    const have = component.getHandledQuantity();
    const haveTextColor = (have >= need) ? 24 : 18;
    const needQuantity = `x${need}`;

    const subtexts = [];

    // determine the subtext messages for the command.
    let missingMessage = `(have: ${have})`;
    if (have < need)
    {
      missingMessage += ` (missing: ${(need - have)})`;
    }

    subtexts.push(missingMessage);

    // build a command based on the component.
    return new WindowCommandBuilder(component.getName())
      .setSymbol(`${component.getName()}-${this.index()}`)
      .setExtensionData(component)
      .setIconIndex(component.getIconIndex())
      .setHelpText(component.getName())

      // TODO: when i/w/a rarity is implemented, add it here.
      //.setColorIndex(rarityColorIndex)

      .setRightText(needQuantity)
      .setRightColorIndex(haveTextColor)
      .setSubtextLines(subtexts)
      .build();
  }

  /**
   * Overrides {@link #itemHeight}.<br>
   * Makes the command rows bigger so there can be additional lines.
   * @returns {number}
   */
  itemHeight()
  {
    return this.lineHeight() * 1.5;
  }

  /**
   * Overrides {@link #drawBackgroundRect}.<br>
   * Prevents the rendering of the backdrop of each line in the window.
   * @param {Rectangle} _ The rectangle to draw the background for.
   * @override
   */
  drawBackgroundRect(_)
  {
  }
}
//endregion Window_RecipeToolList