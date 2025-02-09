//region Window_RecipeOutputList
class Window_RecipeOutputList
  extends Window_Command
{
  /**
   * True if the text of this list should be masked, false otherwise.
   * @type {boolean}
   */
  needsMasking = false;

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

  setNeedsMasking(needsMasking)
  {
    this.needsMasking = needsMasking;
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
    const have = component.getHandledQuantity();

    // determine the subtext messages for the command.
    let subTextLine = `(have: ${have})`;

    const possiblyMaskedOutput = this.needsMasking
      ? component.getName()
        .replace(/[A-Za-z\-!?',.]/ig, "?")
      : component.getName();

    // build a command based on the component.
    const command = new WindowCommandBuilder(possiblyMaskedOutput)
      .setSymbol(`${component.getName()}-${this.index()}`)
      .setExtensionData(component)
      .setIconIndex(component.getIconIndex())
      .setHelpText(component.getName())
      .setRightText(`+${component.quantity()}`)
      .addTextLine(subTextLine)

      // TODO: when i/w/a rarity is implemented, add it here.
      //.setColorIndex(rarityColorIndex)

      .build();

    return command;
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

//endregion Window_RecipeOutputList