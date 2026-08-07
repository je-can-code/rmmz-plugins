//region Scene_JaftingCreate
import CraftingCreationSession from './../__models/CraftingCreationSession.js';
import Window_CategoryList from '../windows/Window_CategoryList.js';
import Window_CreationCategoryBadge from '../windows/Window_CreationCategoryBadge.js';
import Window_CreationDescription from '../windows/Window_CreationDescription.js';
import Window_IngredientSelection from '../windows/Window_IngredientSelection.js';
import Window_RecipeDetails from '../windows/Window_RecipeDetails.js';
import Window_RecipeIngredientList from '../windows/Window_RecipeIngredientList.js';
import Window_RecipeList from '../windows/Window_RecipeList.js';
import Window_RecipeOutputList from '../windows/Window_RecipeOutputList.js';
import Window_RecipeToolList from '../windows/Window_RecipeToolList.js';

class Scene_JaftingCreate
  extends Scene_MenuBase
{
  /**
   * Whether Creation can open: at least one unlocked category has recipes the party may craft.
   * @returns {boolean}
   */
  static isAccessible()
  {
    const categories = $gameParty.getUnlockedCategories();

    if (categories.length === 0)
    {
      return false;
    }

    for (let i = 0; i < categories.length; i++)
    {
      if (categories[i].hasAnyRecipes())
      {
        return true;
      }
    }

    return false;
  }

  /**
   * Whether the JAFTING hub should show Creation as selectable (menu switch plus content eligibility).
   * @returns {boolean}
   */
  static isCreateCommandEnabled()
  {
    return $gameSwitches.value(J.JAFTING.EXT.CREATE.Metadata.menuSwitchId)
      && Scene_JaftingCreate.isAccessible();
  }

  /**
   * Pushes this current scene onto the stack, forcing it into action.
   */
  static callScene()
  {
    if (Scene_JaftingCreate.isAccessible() === false)
    {
      SoundManager.playBuzzer();
      return;
    }

    // Append the row to the working collection.
    SceneManager.push(this);
  }

  /**
   * The symbol representing the command for this scene from other menus.
   * @type {string}
   */
  static KEY = 'jafting-create';

  /**
   * Constructor.
   */
  constructor()
  {
    // call super when having extended constructors.
    super();

    // jumpstart initialization on creation.
    this.initialize();
  }

  //region init
  /**
   * Initialize the window and all properties required by the scene.
   */
  initialize()
  {
    // perform original logic.
    super.initialize();

    // also initialize our scene properties.
    this.initMembers();
  }

  /**
   * Extends {@link #initMembers}.<br/>
   * Also initializes all properties for the Creation scene.
   */
  initMembers()
  {
    // perform original logic.
    super.initMembers();

    // initialize the root-namespace definition members.
    this.initCoreMembers();

    // initialize the Creation windows and state bucket.
    this.initPrimaryMembers();
  }

  /**
   * The core properties of this scene are the root namespace definitions for this plugin.
   */
  initCoreMembers()
  {
    /**
     * The shared root namespace for all of J's plugin data.
     */
    this._j ||= {};

    /**
     * A grouping of all properties associated with this JAFTING scene.
     */
    this._j._crafting = {};
  }

  /**
   * Primary state for Creation: category and recipe lists, recipe detail panes, and related windows.
   */
  initPrimaryMembers()
  {
    /**
     * A grouping of all properties associated with the jafting type of creation.
     * Creation is a subcategory of the jafting system.
     */
    this._j._crafting._create = {};

    /**
     * Workflow state and craft attempts for this scene (keeps UI handlers thin).
     * @type {CraftingCreationSession}
     */
    this._j._crafting._create._session = new CraftingCreationSession();

    /**
     * The window that shows the tertiary information about a recipe or category.
     * @type {Window_CreationDescription}
     */
    this._j._crafting._create._creationDescription = null;

    /**
     * Recipe-browsing chrome: icon + name for the active category (aligned with the help band).
     * @type {Window_CreationCategoryBadge}
     */
    this._j._crafting._create._creationCategoryBadge = null;

    /**
     * The window that shows the list of unlocked categories.
     * @type {Window_CategoryList}
     */
    this._j._crafting._create._categoryList = null;

    /**
     * The window that shows the list of unlocked recipes.
     * @type {Window_RecipeList}
     */
    this._j._crafting._create._recipeList = null;

    /**
     * The window that shows the details of the currently-selected recipe.
     * @type {Window_RecipeDetails}
     */
    this._j._crafting._create._recipeDetails = null;

    /**
     * The window that shows the list of ingredients on the currently selected recipe.
     * @type {Window_RecipeIngredientList}
     */
    this._j._crafting._create._recipeIngredientList = null;

    /**
     * The window that shows the list of tools on the currently selected recipe.
     * @type {Window_RecipeToolList}
     */
    this._j._crafting._create._recipeToolList = null;

    /**
     * The window that shows the list of outputs on the currently selected recipe.
     * @type {Window_RecipeOutputList}
     */
    this._j._crafting._create._recipeOutputList = null;

    /**
     * The window for choosing which entry fills a categorical ingredient slot.
     * @type {Window_IngredientSelection|null}
     */
    this._j._crafting._create._ingredientSelection = null;

    /**
     * The recipe awaiting ingredient choices, or null when no craft is mid-flight.
     * @type {CraftingRecipe|null}
     */
    this._j._crafting._create._pendingRecipe = null;

    /**
     * How far through the categorical slots the player has progressed.
     * @type {number}
     */
    this._j._crafting._create._pendingSlotPosition = 0;
  }

  /**
   * Gets the recipe awaiting ingredient choices.
   * @returns {CraftingRecipe|null}
   */
  getPendingRecipe()
  {
    return this._j._crafting._create._pendingRecipe;
  }

  /**
   * Sets the recipe awaiting ingredient choices.
   * @param {CraftingRecipe|null} recipe The recipe being crafted, or null once it is done.
   */
  setPendingRecipe(recipe)
  {
    this._j._crafting._create._pendingRecipe = recipe;
  }

  /**
   * Gets how far through the categorical slots the player has progressed.
   * @returns {number}
   */
  getPendingSlotPosition()
  {
    return this._j._crafting._create._pendingSlotPosition;
  }

  /**
   * Sets how far through the categorical slots the player has progressed.
   * @param {number} position The next slot to ask about.
   */
  setPendingSlotPosition(position)
  {
    this._j._crafting._create._pendingSlotPosition = position;
  }

  /**
   * Gets the IngredientSelection window being tracked.
   * @returns {Window_IngredientSelection}
   */
  getIngredientSelectionWindow()
  {
    return this._j._crafting._create._ingredientSelection;
  }

  /**
   * Sets the IngredientSelection window tracking.
   * @param {Window_IngredientSelection} someWindow The window to track.
   */
  setIngredientSelectionWindow(someWindow)
  {
    this._j._crafting._create._ingredientSelection = someWindow;
  }

  /**
   * Creates the IngredientSelection window.
   */
  createIngredientSelectionWindow()
  {
    // create the window.
    const window = this.buildIngredientSelectionWindow();

    // update the tracker with the new window.
    this.setIngredientSelectionWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  /**
   * Builds and configures the IngredientSelection window.
   * @returns {Window_IngredientSelection}
   */
  buildIngredientSelectionWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.getIngredientSelectionRectangle();

    // create the window with the rectangle.
    const window = new Window_IngredientSelection(rectangle);

    // assign cancel functionality.
    window.setHandler('cancel', this.onIngredientSelectionCancel.bind(this));

    // assign on-select functionality.
    window.setHandler('ok', this.onIngredientSelection.bind(this));

    // also put the window away.
    window.hide();
    window.deactivate();

    // return the built and configured window.
    return window;
  }

  /**
   * Gets the rectangle associated with this window.
   *
   * Shares the recipe column's footprint, since it stands in for that column while a craft is being
   * assembled and the two are never on screen at once.
   * @returns {Rectangle}
   */
  getIngredientSelectionRectangle()
  {
    // sits where the recipe list sits, because it replaces it for the duration of the choice - but it is not the
    // same shape. The recipe column is deliberately narrow and dense so that many recipes fit; this column carries
    // an item name, a held count, and a needed count, so it needs the width to keep them apart.
    const recipeList = this.getRecipeListRectangle();
    const widest = Graphics.boxWidth - recipeList.x - Graphics.horizontalPadding;
    const width = Math.min(recipeList.width * 2, widest);

    return new Rectangle(recipeList.x, recipeList.y, width, recipeList.height);
  }

  /**
   * @returns {CraftingCreationSession}
   */
  craftingCreationSession()
  {
    return this._j._crafting._create._session;
  }

  //endregion init

  //region create
  /**
   * Initialize all resources required for this scene.
   */
  create()
  {
    // perform original logic.
    super.create();

    // create the various display objects on the screen.
    this.createDisplayObjects();
  }

  /**
   * Creates the display objects for this scene.
   */
  createDisplayObjects()
  {
    // create all our windows.
    this.createAllWindows();

    // ensure category commands exist before configure reads help text (empty list is valid).
    this.getCategoryListWindow().refresh();

    // configure window relations and such now that they are all created.
    this.configureAllWindows();
  }

  /**
   * Creates all windows in this scene.
   */
  createAllWindows()
  {
    // create all the windows.
    this.createCreationDescriptionWindow();
    this.createCreationCategoryBadgeWindow();
    this.createCategoryListWindow();
    this.createRecipeListWindow();
    this.createRecipeDetailsWindow();
    this.createRecipeIngredientListWindow();
    this.createRecipeToolListWindow();
    this.createRecipeOutputListWindow();
    this.createIngredientSelectionWindow();
  }

  /**
   * Configures all windows.
   */
  configureAllWindows()
  {
    // also update with the currently selected item, if one exists.
    this.getCreationDescriptionWindow()
      .setText(this.getCategoryListWindow()
        .currentHelpText() ?? String.empty);
  }

  /**
   * Overwrites {@link Scene_MenuBase.prototype.createBackground}.<br/>
   * Changes the filter to a different type from {@link PIXI.filters}.<br>
   */
  createBackground()
  {
    this.setBackgroundFilter(new PIXI.filters.AlphaFilter(0.1));
    this.setBackgroundSprite(new Sprite());
    this.backgroundSprite().bitmap = SceneManager.backgroundBitmap();
    this.backgroundSprite().filters = [ this.backgroundFilter() ];
    this.addChild(this.backgroundSprite());
    //this.setBackgroundOpacity(220);
  }

  /**
   * Overwrites {@link #createButtons}.<br/>
   * Disables the creation of the buttons.
   * @override
   */
  createButtons()
  {
  }

  //endregion create

  //region creation description
  /**
   * Creates the CreationDescription window.
   */
  createCreationDescriptionWindow()
  {
    // create the window.
    const window = this.buildCreationDescriptionWindow();

    // update the tracker with the new window.
    this.setCreationDescriptionWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  buildCreationDescriptionWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.getCreationDescriptionRectangle();

    // create the window with the rectangle.
    const window = new Window_CreationDescription(rectangle);

    // return the built and configured window.
    return window;
  }

  /**
   * Shared height for the help band and the category badge (recipe browsing chrome).
   * @returns {number}
   */
  creationHeaderBandHeight()
  {
    return 100;
  }

  /**
   * Width of the left column shared by category list, recipe list, and category badge windows.
   * @returns {number}
   */
  getCreationListColumnWidth()
  {
    return this.getCategoryListRectangle().width;
  }

  /**
   * Gets the rectangle associated with this window.
   * @returns {Rectangle}
   */
  getCreationDescriptionRectangle()
  {
    const [ ox, oy ] = Graphics.boxOrigin;
    const listColumnWidth = this.getCreationListColumnWidth();
    const x = ox + listColumnWidth + Graphics.horizontalPadding;
    const y = oy;
    const width = ox + Graphics.boxWidth - x - Graphics.horizontalPadding;
    const height = this.creationHeaderBandHeight();

    return new Rectangle(x, y, width, height);
  }

  /**
   * Gets the CreationDescription window being tracked.
   * @returns {Window_CreationDescription}
   */
  getCreationDescriptionWindow()
  {
    return this._j._crafting._create._creationDescription;
  }

  /**
   * Sets the CreationDescription window tracking.
   */
  setCreationDescriptionWindow(someWindow)
  {
    this._j._crafting._create._creationDescription = someWindow;
  }

  /**
   * Creates the category badge window (recipe browsing only).
   */
  createCreationCategoryBadgeWindow()
  {
    const window = this.buildCreationCategoryBadgeWindow();

    this.setCreationCategoryBadgeWindow(window);
    window.hide();
    window.deactivate();
    this.addWindow(window);
  }

  /**
   * @returns {Window_CreationCategoryBadge}
   */
  buildCreationCategoryBadgeWindow()
  {
    const rectangle = this.getCreationCategoryBadgeRectangle();

    return new Window_CreationCategoryBadge(rectangle);
  }

  /**
   * Top-left slot beside the help window: same width as the list column; height matches
   * {@link #creationHeaderBandHeight}.
   * @returns {Rectangle}
   */
  getCreationCategoryBadgeRectangle()
  {
    const [ ox, oy ] = Graphics.boxOrigin;
    const w = this.getCreationListColumnWidth();
    const h = this.creationHeaderBandHeight();

    return new Rectangle(ox, oy, w, h);
  }

  /**
   * @returns {Window_CreationCategoryBadge}
   */
  getCreationCategoryBadgeWindow()
  {
    return this._j._crafting._create._creationCategoryBadge;
  }

  /**
   * @param {Window_CreationCategoryBadge} someWindow The some window driving this step.
   */
  setCreationCategoryBadgeWindow(someWindow)
  {
    this._j._crafting._create._creationCategoryBadge = someWindow;
  }

  //endregion creation description

  //region category list
  /**
   * Creates the CategoryList window.
   */
  createCategoryListWindow()
  {
    // create the window.
    const window = this.buildCategoryListWindow();

    // update the tracker with the new window.
    this.setCategoryListWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  buildCategoryListWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.getCategoryListRectangle();

    // create the window with the rectangle.
    const window = new Window_CategoryList(rectangle);

    // assign cancel functionality.
    window.setHandler('cancel', this.onCategoryListCancel.bind(this));

    // assign on-select functionality.
    window.setHandler('ok', this.onCategoryListSelection.bind(this));

    // overwrite the onIndexChange hook with our local hook.
    window.onIndexChange = this.onCategoryListIndexChange.bind(this);

    // return the built and configured window.
    return window;
  }

  /**
   * Gets the rectangle associated with this window.
   * @returns {Rectangle}
   */
  getCategoryListRectangle()
  {
    // the window's origin coordinates are the box window's origin as well.
    const [ x, y ] = Graphics.boxOrigin;

    const width = Math.round(300 * 1.1);

    // define the height of the window.
    const height = Graphics.boxHeight - (Graphics.verticalPadding * 2);

    // build the rectangle to return.
    return new Rectangle(x, y, width, height);
  }

  /**
   * Gets the CategoryList window being tracked.
   */
  getCategoryListWindow()
  {
    return this._j._crafting._create._categoryList;
  }

  /**
   * Sets the CategoryList window tracking.
   */
  setCategoryListWindow(someWindow)
  {
    this._j._crafting._create._categoryList = someWindow;
  }

  onCategoryListIndexChange()
  {
    const helpText = this.getCategoryListWindow()
      .currentHelpText();

    this.getCreationDescriptionWindow()
      .setText(helpText ?? String.empty);
  }

  onCategoryListCancel()
  {
    // revert to the previous scene.
    SceneManager.pop();
  }

  onCategoryListSelection()
  {
    // grab the category list window we're on.
    const categoryListWindow = this.getCategoryListWindow();

    // the category key is also the symbol of the category commands.
    const currentCategory = categoryListWindow.currentSymbol();

    this.craftingCreationSession().enterRecipeBrowsing(currentCategory);

    // grab the recipe list window.
    const recipeListWindow = this.getRecipeListWindow();

    // set the current category to this new category.
    recipeListWindow.setCurrentCategory(currentCategory);

    // switch attention to the recipe list window instead.
    this.deselectCategoryListWindow();
    this.selectRecipeListWindow();

    // also reveal the ingredient list window.
    const ingredientListWindow = this.getRecipeIngredientListWindow();
    ingredientListWindow.show();
    ingredientListWindow.deselect();

    // also reveal the tool list window.
    const toolListWindow = this.getRecipeToolListWindow();
    toolListWindow.show();
    toolListWindow.deselect();

    // also reveal the tool list window.
    const outputListWindow = this.getRecipeOutputListWindow();
    outputListWindow.show();
    outputListWindow.deselect();
  }

  /**
   * Selects the window by revealing and activating it.
   */
  selectCategoryListWindow()
  {
    // grab the window.
    const categoryListWindow = this.getCategoryListWindow();

    // reveal the window.
    categoryListWindow.show();
    categoryListWindow.activate();

    this.getCreationDescriptionWindow()
      .setText(categoryListWindow.currentHelpText());
  }

  /**
   * Deselects the window by hiding and deactivating it.
   */
  deselectCategoryListWindow()
  {
    // grab the window.
    const window = this.getCategoryListWindow();

    // put the window away.
    window.hide();
    window.deactivate();
  }

  //endregion category list

  //region recipe list
  /**
   * Creates the RecipeList window.
   */
  createRecipeListWindow()
  {
    // create the window.
    const window = this.buildRecipeListWindow();

    // update the tracker with the new window.
    this.setRecipeListWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  buildRecipeListWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.getRecipeListRectangle();

    // create the window with the rectangle.
    const window = new Window_RecipeList(rectangle);

    // assign cancel functionality.
    window.setHandler('cancel', this.onRecipeListCancel.bind(this));

    // assign on-select functionality.
    window.setHandler('ok', this.onRecipeListSelection.bind(this));

    // overwrite the onIndexChange hook with our local hook.
    window.onIndexChange = this.onRecipeListIndexChange.bind(this);

    // also put the window away.
    window.hide();
    window.deactivate();

    // return the built and configured window.
    return window;
  }

  /**
   * Gets the rectangle associated with this window.
   * @returns {Rectangle}
   */
  getRecipeListRectangle()
  {
    const [ ox, oy ] = Graphics.boxOrigin;
    const w = this.getCreationListColumnWidth();
    const header = this.creationHeaderBandHeight();
    const gap = Graphics.verticalPadding;
    const y = oy + header + gap;
    const height = oy + Graphics.boxHeight - y - Graphics.verticalPadding;

    return new Rectangle(ox, y, w, height);
  }

  /**
   * Gets the RecipeList window being tracked.
   * @returns {Window_RecipeList}
   */
  getRecipeListWindow()
  {
    return this._j._crafting._create._recipeList;
  }

  /**
   * Sets the RecipeList window tracking.
   * @param recipeList {Window_RecipeList}
   */
  setRecipeListWindow(recipeList)
  {
    this._j._crafting._create._recipeList = recipeList;
  }

  /**
   * Selects the window by revealing and activating it.
   */
  selectRecipeListWindow()
  {
    // grab the window.
    const recipeListWindow = this.getRecipeListWindow();

    // reveal the window.
    recipeListWindow.show();
    recipeListWindow.activate();
    recipeListWindow.onIndexChange();

    // also grab the details.
    const detailsWindow = this.getRecipeDetailsWindow();

    // reveal that window, too.
    detailsWindow.show();

    const badgeWindow = this.getCreationCategoryBadgeWindow();
    const categoryKey = recipeListWindow.getCurrentCategory();
    const category = $gameParty.getCategoryByKey(categoryKey);

    badgeWindow.setCategory(category);
    badgeWindow.show();
  }

  /**
   * Deselects the window by hiding and deactivating it.
   */
  deselectRecipeListWindow()
  {
    // grab the window.
    const listWindow = this.getRecipeListWindow();

    // put the window away.
    listWindow.select(0);
    listWindow.hide();
    listWindow.deactivate();

    const badgeWindow = this.getCreationCategoryBadgeWindow();

    badgeWindow.hide();
    badgeWindow.clearCategory();

    // hide all those windows.
    this.getRecipeDetailsWindow()
      .hide();
    this.getRecipeIngredientListWindow()
      .hide();
    this.getRecipeToolListWindow()
      .hide();
    this.getRecipeOutputListWindow()
      .hide();
  }

  onRecipeListIndexChange()
  {
    // grab the this list window.
    const recipeListWindow = this.getRecipeListWindow();

    // shorthand the currently-selected recipe.
    /** @type {CraftingRecipe} */
    const currentRecipe = recipeListWindow.currentExt();
    const {
      ingredients,
      tools,
      outputs
    } = currentRecipe;

    // derive description from the recipe model — command.helpText is stale until makeCommandList runs again.
    this.getCreationDescriptionWindow()
      .setText(currentRecipe.getRecipeDescription());

    // grab the details window.
    const detailsWindow = this.getRecipeDetailsWindow();
    detailsWindow.setNeedsMasking(currentRecipe.needsMasking());
    detailsWindow.setCurrentRecipe(recipeListWindow.currentExt());
    detailsWindow.refresh();

    // refresh the ingredients list.
    const ingredientListWindow = this.getRecipeIngredientListWindow();
    ingredientListWindow.setComponents(ingredients);
    ingredientListWindow.refresh();

    // refresh the tools list.
    const toolListWindow = this.getRecipeToolListWindow();
    toolListWindow.setComponents(tools);
    toolListWindow.refresh();

    // refresh the outputs list.
    const outputListWindow = this.getRecipeOutputListWindow();
    outputListWindow.setNeedsMasking(currentRecipe.needsMasking())
    outputListWindow.setComponents(outputs);
    outputListWindow.refresh();
  }

  onRecipeListCancel()
  {
    this.craftingCreationSession().returnToCategoryBrowsing();

    this.deselectRecipeListWindow();

    this.selectCategoryListWindow();
  }

  onRecipeListSelection()
  {
    const recipe = this.getRecipeListWindow().currentExt();

    // a recipe with categorical slots cannot execute until the player says which entries to spend.
    // asking before checking requirements would be rude, so the affordability gate still comes first.
    if (recipe !== null && recipe.needsIngredientSelection() && recipe.canCraft())
    {
      this.beginIngredientSelection(recipe);

      return;
    }

    this.executeCraft(recipe);
  }

  /**
   * Executes a craft and returns the recipe column to its resting state.
   * @param {CraftingRecipe|null} recipe The recipe being crafted.
   */
  executeCraft(recipe)
  {
    const outcome = this.craftingCreationSession()
      .tryCraftRecipe(recipe);

    if (outcome.playedSuccessSound === true)
    {
      SoundManager.playShop();
    }

    const listWindow = this.getRecipeListWindow();

    listWindow.refresh();
    this.onRecipeListIndexChange();
    listWindow.activate();
  }

  //endregion recipe list

  //region ingredient selection
  /**
   * Begins walking the player through one choice per categorical ingredient.
   * @param {CraftingRecipe} recipe The recipe being crafted.
   */
  beginIngredientSelection(recipe)
  {
    const session = this.craftingCreationSession();
    session.beginIngredientSelection();

    // remember what we are choosing for, and how far through the list we are.
    this.setPendingRecipe(recipe);
    this.setPendingSlotPosition(0);

    this.getRecipeListWindow()
      .deactivate();

    this.promptNextIngredientSlot();
  }

  /**
   * Shows the choice for the next unfilled categorical slot, or crafts once they are all filled.
   */
  promptNextIngredientSlot()
  {
    const recipe = this.getPendingRecipe();
    const slots = recipe.categoricalIngredientIndices();
    const position = this.getPendingSlotPosition();

    // every slot has an entry against it, so there is nothing left to ask.
    if (position >= slots.length)
    {
      this.finishIngredientSelection();

      return;
    }

    const ingredientIndex = slots.at(position);
    const component = recipe.ingredients.at(ingredientIndex);
    const selectionWindow = this.getIngredientSelectionWindow();

    // claimed quantities keep an earlier slot's pick from being offered again as though it were free.
    selectionWindow.setSlot(component.eligibleEntries(), component.quantity(), this.claimedSoFar());
    selectionWindow.refresh();
    selectionWindow.select(0);
    selectionWindow.show();
    selectionWindow.activate();
  }

  /**
   * How much of each entry the picks made so far in this craft have already spoken for.
   * @returns {Map<RPG_Item|RPG_Weapon|RPG_Armor, number>}
   */
  claimedSoFar()
  {
    const recipe = this.getPendingRecipe();
    const selections = this.craftingCreationSession()
      .getSelections();

    /** @type {Map<RPG_Item|RPG_Weapon|RPG_Armor, number>} */
    const claimed = new Map();

    selections.forEach((entry, ingredientIndex) =>
    {
      const taken = recipe.ingredients.at(ingredientIndex)
        .quantity();
      const running = claimed.has(entry)
        ? claimed.get(entry)
        : 0;

      claimed.set(entry, running + taken);
    });

    return claimed;
  }

  /**
   * Records the chosen entry and moves to the next slot.
   */
  onIngredientSelection()
  {
    const recipe = this.getPendingRecipe();
    const slots = recipe.categoricalIngredientIndices();
    const position = this.getPendingSlotPosition();
    const chosen = this.getIngredientSelectionWindow()
      .currentExt();

    this.craftingCreationSession()
      .recordSelection(slots.at(position), chosen);

    this.setPendingSlotPosition(position + 1);

    this.promptNextIngredientSlot();
  }

  /**
   * Abandons the craft and hands control back to the recipe column.
   */
  onIngredientSelectionCancel()
  {
    this.craftingCreationSession()
      .cancelIngredientSelection();

    this.closeIngredientSelectionWindow();

    this.getRecipeListWindow()
      .activate();
  }

  /**
   * Executes the craft now that every categorical slot has an entry against it.
   */
  finishIngredientSelection()
  {
    this.closeIngredientSelectionWindow();

    this.executeCraft(this.getPendingRecipe());

    this.setPendingRecipe(null);
  }

  /**
   * Puts the selection window away.
   */
  closeIngredientSelectionWindow()
  {
    const selectionWindow = this.getIngredientSelectionWindow();

    selectionWindow.hide();
    selectionWindow.deactivate();
  }
  //endregion ingredient selection

  //region recipe details
  /**
   * Creates the RecipeDetails window.
   */
  createRecipeDetailsWindow()
  {
    // create the window.
    const window = this.buildRecipeDetailsWindow();

    // update the tracker with the new window.
    this.setRecipeDetailsWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  buildRecipeDetailsWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.getRecipeDetailsRectangle();

    // create the window with the rectangle.
    const window = new Window_RecipeDetails(rectangle);

    // by default, hide the window.
    window.hide();

    // return the built and configured window.
    return window;
  }

  /**
   * Gets the rectangle associated with this window.
   * @returns {Rectangle}
   */
  getRecipeDetailsRectangle()
  {
    const [ ox, oy ] = Graphics.boxOrigin;
    const listRect = this.getRecipeListRectangle();

    const { x: listX, y: listY } = listRect;
    const x = listX + listRect.width + Graphics.horizontalPadding;
    const y = listY;
    const width = ox + Graphics.boxWidth - x - Graphics.horizontalPadding;
    const height = oy + Graphics.boxHeight - y - Graphics.verticalPadding;

    return new Rectangle(x, y, width, height);
  }

  /**
   * Gets the RecipeDetails window being tracked.
   * @returns {Window_RecipeDetails}
   */
  getRecipeDetailsWindow()
  {
    return this._j._crafting._create._recipeDetails;
  }

  /**
   * Sets the RecipeDetails window tracking.
   */
  setRecipeDetailsWindow(someWindow)
  {
    this._j._crafting._create._recipeDetails = someWindow;
  }

  //endregion recipe details

  //region recipe ingredient list
  /**
   * Creates the RecipeIngredientList window.
   */
  createRecipeIngredientListWindow()
  {
    // create the window.
    const window = this.buildRecipeIngredientListWindow();

    // update the tracker with the new window.
    this.setRecipeIngredientListWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  buildRecipeIngredientListWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.getRecipeIngredientListRectangle();

    // create the window with the rectangle.
    const window = new Window_RecipeIngredientList(rectangle);

    // just hide and deactivate it.
    window.hide();
    window.deactivate();

    // no command functionality despite being a command window.

    // return the built and configured window.
    return window;
  }

  /**
   * Positions ingredient / tool / output lists in the first three quarters of {@link #getRecipeDetailsRectangle},
   * below the header block drawn by {@link Window_RecipeDetails}.
   * @returns {{ leftX: number, y: number, colW: number, remainder: number, height: number }}
   */
  getCreationLowerPanelLayout()
  {
    const detailsR = this.getRecipeDetailsRectangle();
    const detailsWindow = this.getRecipeDetailsWindow();
    const pad = detailsWindow.padding;
    const innerW = detailsR.width - pad * 2;
    const { cw, remainder } = Window_RecipeDetails.quarterWidthsFromInner(innerW);
    const leftX = detailsR.x + pad;
    const rowInset = Window_RecipeIngredientList.recipeComponentRowTopInsetPx();
    const listInnerTop = detailsR.y + pad + detailsWindow.componentListRowsInnerStartY() - rowInset;
    const height = detailsR.y + detailsR.height - listInnerTop - pad;

    return { leftX, y: listInnerTop, colW: cw, remainder, height };
  }

  /**
   * Gets the rectangle associated with this window.
   * @returns {Rectangle}
   */
  getRecipeIngredientListRectangle()
  {
    const L = this.getCreationLowerPanelLayout();

    return new Rectangle(L.leftX, L.y, L.colW, L.height);
  }

  /**
   * Gets the RecipeIngredientList window being tracked.
   */
  getRecipeIngredientListWindow()
  {
    return this._j._crafting._create._recipeIngredientList;
  }

  /**
   * Sets the RecipeIngredientList window tracking.
   */
  setRecipeIngredientListWindow(someWindow)
  {
    this._j._crafting._create._recipeIngredientList = someWindow;
  }

  //endregion recipe ingredient list

  //region recipe tool list
  /**
   * Creates the RecipeToolList window.
   */
  createRecipeToolListWindow()
  {
    // create the window.
    const window = this.buildRecipeToolListWindow();

    // update the tracker with the new window.
    this.setRecipeToolListWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  buildRecipeToolListWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.getRecipeToolListRectangle();

    // create the window with the rectangle.
    const window = new Window_RecipeToolList(rectangle);

    // just hide and deactivate it.
    window.hide();
    window.deactivate();

    // no command functionality despite being a command window.

    // return the built and configured window.
    return window;
  }

  /**
   * Gets the rectangle associated with this window.
   * @returns {Rectangle}
   */
  getRecipeToolListRectangle()
  {
    const L = this.getCreationLowerPanelLayout();
    const x = L.leftX + L.colW;

    return new Rectangle(x, L.y, L.colW, L.height);
  }

  /**
   * Gets the RecipeToolList window being tracked.
   * @returns {Window_RecipeToolList}
   */
  getRecipeToolListWindow()
  {
    return this._j._crafting._create._recipeToolList;
  }

  /**
   * Sets the RecipeToolList window tracking.
   */
  setRecipeToolListWindow(someWindow)
  {
    this._j._crafting._create._recipeToolList = someWindow;
  }

  //endregion recipe tool list

  //region recipe output list
  /**
   * Creates the RecipeOutputList window.
   */
  createRecipeOutputListWindow()
  {
    // create the window.
    const window = this.buildRecipeOutputListWindow();

    // update the tracker with the new window.
    this.setRecipeOutputListWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  buildRecipeOutputListWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.getRecipeOutputListRectangle();

    // create the window with the rectangle.
    const window = new Window_RecipeOutputList(rectangle);

    // just hide and deactivate it.
    window.hide();
    window.deactivate();

    // no command functionality despite being a command window.

    // return the built and configured window.
    return window;
  }

  /**
   * Gets the rectangle associated with this window.
   * @returns {Rectangle}
   */
  getRecipeOutputListRectangle()
  {
    const L = this.getCreationLowerPanelLayout();
    const x = L.leftX + L.colW * 2;
    const w = L.colW + L.remainder;

    return new Rectangle(x, L.y, w, L.height);
  }

  /**
   * Gets the RecipeOutputList window being tracked.
   */
  getRecipeOutputListWindow()
  {
    return this._j._crafting._create._recipeOutputList;
  }

  /**
   * Sets the RecipeOutputList window tracking.
   */
  setRecipeOutputListWindow(someWindow)
  {
    this._j._crafting._create._recipeOutputList = someWindow;
  }

  //endregion recipe output list
}

export default Scene_JaftingCreate;

//endregion Scene_JaftingCreate