//region Window_RecipeOutputList
import Window_RecipeIngredientList from './Window_RecipeIngredientList.js';

class Window_RecipeOutputList
  extends Window_Command
{

  //region properties
  /**
   * Gets the components.
   * @returns {CraftingComponent[]} The components.
   */
  components()
  {
    // hand back the components.
    return this._components;
  }
  //endregion properties

  /**
   * Constructor.
   * @param {Rectangle} rect The rectangle that represents this window.
   */
  constructor(rect)
  {
    // perform original logic, which seeds this window's members before building the list.
    super(rect);

    // this background is layered ontop of another window, so it should be invisibile.
    this.opacity = 0;
  }

  /**
   * Implements {@link Window_Command.initMembers}.<br/>
   * Initializes the members of this window.
   *
   * `needsMasking` cannot be a class field: JavaScript applies those only after `super()` returns, by
   * which point the command list has already been built from them.
   */
  initMembers()
  {
    /**
     * The list of components this window should render.
     * @type {CraftingComponent[]}
     */
    this._components = [];

    /**
     * True if the text of this list should be masked, false otherwise.
     * @type {boolean}
     */
    this.needsMasking = false;
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
   * Implements {@link #makeCommandList}.<br/>
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
    const components = this.components();

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
    const subTextLine = `(have: ${have})`;

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
   * Overwrites {@link #itemHeight}.<br/>
   * Makes the command rows bigger so there can be additional lines.
   * @returns {number}
   */
  itemHeight()
  {
    return this.lineHeight() * 1.5;
  }

  /**
   * @returns {number}
   */
  recipeComponentRowTopInset()
  {
    return Window_RecipeIngredientList.recipeComponentRowTopInsetPx();
  }

  /**
   * @param {number} index The index driving this step.
   * @returns {Rectangle}
   */
  itemLineRect(index)
  {
    const rect = Window_Selectable.prototype.itemLineRect.call(this, index);

    rect.y += this.recipeComponentRowTopInset();

    return rect;
  }

  /**
   * Overwrites {@link #drawBackgroundRect}.<br/>
   * Prevents the rendering of the backdrop of each line in the window.
   * @param {Rectangle} _ The rectangle to draw the background for.
   * @override
   */
  drawBackgroundRect(_)
  {
  }
}

export default Window_RecipeOutputList;

//endregion Window_RecipeOutputList