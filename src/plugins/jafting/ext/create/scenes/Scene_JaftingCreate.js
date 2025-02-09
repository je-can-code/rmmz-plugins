//region Scene_JaftingCreate
class Scene_JaftingCreate
  extends Scene_MenuBase
{
  /**
   * Pushes this current scene onto the stack, forcing it into action.
   */
  static callScene()
  {
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
   * Initialize all properties for our omnipedia.
   */
  initMembers()
  {
    // initialize the root-namespace definition members.
    this.initCoreMembers();

    // initialize the monsterpedia members.
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
     * A grouping of all properties associated with the omnipedia.
     */
    this._j._crafting = {};
  }

  /**
   * The primary properties of the scene are the initial properties associated with
   * the main list containing all pedias unlocked by the player along with some subtext of
   * what the pedia entails.
   */
  initPrimaryMembers()
  {
    /**
     * A grouping of all properties associated with the jafting type of creation.
     * Creation is a subcategory of the jafting system.
     */
    this._j._crafting._create = {};

    /**
     * The window that shows the tertiary information about a recipe or category.
     * @type {Window_CreationDescription}
     */
    this._j._crafting._create._creationDescription = null;

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
    this.createCategoryListWindow();
    this.createRecipeListWindow();
    this.createRecipeDetailsWindow();
    this.createRecipeIngredientListWindow();
    this.createRecipeToolListWindow();
    this.createRecipeOutputListWindow();
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
   * Overrides {@link Scene_MenuBase.prototype.createBackground}.<br>
   * Changes the filter to a different type from {@link PIXI.filters}.<br>
   */
  createBackground()
  {
    this._backgroundFilter = new PIXI.filters.AlphaFilter(0.1);
    this._backgroundSprite = new Sprite();
    this._backgroundSprite.bitmap = SceneManager.backgroundBitmap();
    this._backgroundSprite.filters = [ this._backgroundFilter ];
    this.addChild(this._backgroundSprite);
    //this.setBackgroundOpacity(220);
  }

  /**
   * Overrides {@link #createButtons}.<br>
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
   * Gets the rectangle associated with this window.
   * @returns {Rectangle}
   */
  getCreationDescriptionRectangle()
  {
    // grab the rect for the recipe list this should be next to.
    const listWindow = this.getRecipeListRectangle();

    // the description should live at the right side of the list.
    const x = listWindow.width + Graphics.horizontalPadding;

    // the window's origin coordinates are the box window's origin as well.
    const [ _, y ] = Graphics.boxOrigin;

    // define the width of the window.
    const width = Graphics.boxWidth - listWindow.width - Graphics.horizontalPadding;

    // define the height of the window.
    const height = 100;

    // build the rectangle to return.
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

    // define the width of the window.
    const width = 300;

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
    // the window's origin coordinates are the box window's origin as well.
    const [ x, y ] = Graphics.boxOrigin;

    // define the width of the window.
    const width = this.getCategoryListRectangle().width;

    // define the height of the window.
    const height = Graphics.boxHeight - (Graphics.verticalPadding * 2);

    // build the rectangle to return.
    return new Rectangle(x, y, width, height);
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

    this.getCreationDescriptionWindow()
      .setText(recipeListWindow.currentHelpText() ?? String.empty);
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

    // set the help text to the recipe's description, which is the help text.
    this.getCreationDescriptionWindow()
      .setText(recipeListWindow.currentHelpText() ?? String.empty);

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
    this.deselectRecipeListWindow();

    this.selectCategoryListWindow();
  }

  onRecipeListSelection()
  {
    // craft the recipe.
    this.craftSelection();

    // refresh all the windows.
    this.onRecipeListIndexChange();

    // redirect to the recipe list again.
    const listWindow = this.getRecipeListWindow();
    listWindow.refresh();
    listWindow.activate();
    console.log('recipe crafted:', listWindow.currentExt());
  }

  craftSelection()
  {
    const currentRecipe = this.getRecipeListWindow()
      .currentExt();

    currentRecipe.craft();

    SoundManager.playShop();
  }

  //endregion recipe list

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
    const widthReduction = this.getRecipeListRectangle().width + Graphics.horizontalPadding;
    const x = 0 + widthReduction;

    const heightReduction = (this.getCreationDescriptionRectangle().height + Graphics.verticalPadding);
    const y = 0 + heightReduction;

    // define the width of the window.
    const width = Graphics.boxWidth - widthReduction;

    // define the height of the window.
    const height = Graphics.boxHeight - heightReduction;

    // build the rectangle to return.
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
   * Gets the rectangle associated with this window.
   * @returns {Rectangle}
   */
  getRecipeIngredientListRectangle()
  {
    // the window's origin coordinates are the box window's origin as well.
    const widthReduction = this.getRecipeListRectangle().right;
    const x = 0 + widthReduction - 20;

    const y = this.getCreationDescriptionRectangle().bottom + 70;

    // define the width of the window.
    const width = 350;

    // define the height of the window.
    const height = Graphics.boxHeight - y - Graphics.verticalPadding;

    // build the rectangle to return.
    return new Rectangle(x, y, width, height);
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
    // the window's origin coordinates are the box window's origin as well.
    const x = this.getRecipeIngredientListRectangle().right - 20;

    const y = this.getCreationDescriptionRectangle().bottom + 70;

    // define the width of the window.
    const width = 350;

    // define the height of the window.
    const height = Graphics.boxHeight - y - Graphics.verticalPadding;

    // build the rectangle to return.
    return new Rectangle(x, y, width, height);
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
    // the window's origin coordinates are the box window's origin as well.
    const x = this.getRecipeToolListRectangle().right - 20;
    const y = this.getCreationDescriptionRectangle().bottom + 70;

    // define the width of the window.
    const width = 350;

    // define the height of the window.
    const height = Graphics.boxHeight - y - Graphics.verticalPadding;

    // build the rectangle to return.
    return new Rectangle(x, y, width, height);
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

//endregion Scene_JaftingCreate