//region Window_IngredientList
import RecipeSpendResolver from '../managers/RecipeSpendResolver.js';

class Window_RecipeIngredientList
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

  /**
   * Gets the entries the player named for the categorical slots.
   * @returns {Map<number, RPG_Item|RPG_Weapon|RPG_Armor>} The chosen entries, keyed by ingredient index.
   */
  selections()
  {
    return this._selections;
  }

  /**
   * Points the categorical slots at the entries the player actually chose.
   *
   * Until this is called a categorical slot describes itself, which means the category's name and the biggest
   * eligible stack the party holds. That is a fair preview while browsing and a lie once a choice exists - pick
   * three Big Gelatin while holding twenty-six Small Gel and the untold panel still reads "Small Gel, have 26".
   * @param {Map<number, RPG_Item|RPG_Weapon|RPG_Armor>} selections The chosen entries, keyed by ingredient index.
   */
  setSelections(selections)
  {
    this._selections = selections;

    this.refresh();
  }

  /**
   * Forgets the chosen entries, returning every categorical slot to describing its category.
   *
   * Called whenever the craft those choices belonged to ends, one way or another. Choices outliving their craft
   * would have the panel describing a decision the player has already walked away from.
   */
  clearSelections()
  {
    this.setSelections(new Map());
  }
  //endregion properties

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
   * Extends {@link #initialize}.<br/>
   * Initializes some additional window properies.
   */
  initialize(rect)
  {
    /**
     * The list of components this window should render.
     * @type {CraftingComponent[]}
     */
    this._components = [];

    /**
     * The entries the player named for the categorical slots, keyed by ingredient index.
     * @type {Map<number, RPG_Item|RPG_Weapon|RPG_Armor>}
     */
    this._selections = new Map();

    super.initialize(rect);
  }

  setComponents(components)
  {
    this._components = components;

    // selections are keyed by position in the array being replaced, so they mean nothing against a new one. keeping
    // them would have a slot from the previous recipe silently renaming whatever now sits at that index.
    this.clearSelections();
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
  buildCommand(component, index)
  {
    // resolved through the same path the confirmation prompt uses, so the panel and the prompt can never disagree
    // about which entry a categorical slot is spending.
    const chosen = RecipeSpendResolver.chosenFor(this.selections(), index);
    const line = RecipeSpendResolver.lineFor(component, chosen);

    // determine how many we need vs have on-hand.
    const need = line.perCraft;
    const have = line.held;
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

    // build a command based on the component.
    return new WindowCommandBuilder(line.name)
      .setSymbol(`${line.name}-${index}`)
      .setExtensionData(component)
      .setIconIndex(line.iconIndex)
      .setHelpText(line.name)

    // TODO: when i/w/a rarity is implemented, add it here.
    //.setColorIndex(rarityColorIndex)

      .setRightText(needQuantity)
      .setRightColorIndex(haveTextColor)
      .setTextLines(subtexts)
      .build();
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
   * Pixel inset for the first row so {@link Window_Command.prototype.drawItem} subtext name lift does not clip.
   * Matches {@link Window_RecipeDetails} list band and scene list height math.
   * @returns {number}
   */
  static recipeComponentRowTopInsetPx()
  {
    return 30;
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

export default Window_RecipeIngredientList;

//endregion Window_IngredientList