//region Scene_JaftingCreate
import CraftingCreationSession from './../__models/CraftingCreationSession.js';
import RecipeSpendResolver from '../managers/RecipeSpendResolver.js';
import Window_CreationDescription from '../windows/Window_CreationDescription.js';
import Window_IngredientSelection from '../windows/Window_IngredientSelection.js';
import Window_CraftConfirmation from '../windows/Window_CraftConfirmation.js';
import Window_RecipeDetails from '../windows/Window_RecipeDetails.js';
import Window_RecipeIngredientList from '../windows/Window_RecipeIngredientList.js';
import Window_RecipeList from '../windows/Window_RecipeList.js';
import Window_RecipeOutputList from '../windows/Window_RecipeOutputList.js';
import Window_RecipeToolList from '../windows/Window_RecipeToolList.js';

class Scene_JaftingCreate
  extends Scene_MenuFacetBase
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
     * @type {Window_FilterStrip}
     */
    this._j._crafting._create._creationCategoryBadge = null;

    /**
     * The window that shows the list of unlocked categories.
     * @type {FilterCycle}
     */
    this._j._crafting._create._categoryFilter = new FilterCycle();

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
     * The window asking how many of the pending recipe to craft.
     * @type {Window_CraftConfirmation|null}
     */
    this._j._crafting._create._craftConfirmation = null;

    /**
     * The legend teaching how to change the craft quantity.
     * @type {Window_ControlLegend|null}
     */
    this._j._crafting._create._craftLegend = null;

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
   * Gets the CraftConfirmation window being tracked.
   * @returns {Window_CraftConfirmation}
   */
  getCraftConfirmationWindow()
  {
    return this._j._crafting._create._craftConfirmation;
  }

  /**
   * Sets the CraftConfirmation window tracking.
   * @param {Window_CraftConfirmation} someWindow The window to track.
   */
  setCraftConfirmationWindow(someWindow)
  {
    this._j._crafting._create._craftConfirmation = someWindow;
  }

  /**
   * Creates the CraftConfirmation window.
   */
  createCraftConfirmationWindow()
  {
    // create the window.
    const window = this.buildCraftConfirmationWindow();

    // update the tracker with the new window.
    this.setCraftConfirmationWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  /**
   * Builds and configures the CraftConfirmation window.
   * @returns {Window_CraftConfirmation}
   */
  buildCraftConfirmationWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.getCraftConfirmationRectangle();

    // create the window with the rectangle.
    const window = new Window_CraftConfirmation(rectangle);

    window.setHandler('craft-confirm', this.onCraftConfirmed.bind(this));
    window.setHandler('craft-cancel', this.onCraftCancelled.bind(this));
    window.setHandler('cancel', this.onCraftCancelled.bind(this));

    // pageup and pagedown are deliberately left unhandled: the window reads the shoulders itself to step the count
    // coarsely, and the engine only routes them to the cursor hooks while no handler has claimed them.

    // also put the window away.
    window.hide();
    window.deactivate();

    // return the built and configured window.
    return window;
  }

  /**
   * Gets the craft quantity legend being tracked.
   * @returns {Window_ControlLegend}
   */
  getCraftLegendWindow()
  {
    return this._j._crafting._create._craftLegend;
  }

  /**
   * Sets the craft quantity legend tracking.
   * @param {Window_ControlLegend} someWindow The window to track.
   */
  setCraftLegendWindow(someWindow)
  {
    this._j._crafting._create._craftLegend = someWindow;
  }

  /**
   * Creates the legend that teaches how to change the craft quantity.
   */
  createCraftLegendWindow()
  {
    // create the window.
    const window = this.buildCraftLegendWindow();

    // update the tracker with the new window.
    this.setCraftLegendWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  /**
   * Builds and configures the craft quantity legend.
   *
   * A real {@link Window_ControlLegend} rather than a line of prose inside the prompt. It resolves each control
   * through whatever owns the input mapping, so the glyphs follow the player's own remapping and the device
   * currently in their hands - and quietly fall back to readable words when no mapping plugin is installed. Saying
   * "L1" in a sentence would be a guess that goes wrong for anyone on a keyboard.
   * @returns {Window_ControlLegend}
   */
  buildCraftLegendWindow()
  {
    const rectangle = this.getCraftLegendRectangle();

    const window = new Window_ControlLegend(rectangle);

    window.setEntries(this.craftLegendEntries());

    // also put the window away.
    window.hide();

    // return the built and configured window.
    return window;
  }

  /**
   * The controls the craft quantity prompt teaches.
   *
   * Only the quantity controls. Confirming and cancelling are named by the two answers themselves, so a legend
   * repeating them would be spending a line to say what is already on screen.
   * @returns {{semantic: (string|string[]), label: string}[]}
   */
  craftLegendEntries()
  {
    return [
      {
        semantic: [ 'cart-dec', 'cart-inc' ],
        label: 'by one',
      },
      {
        semantic: [ 'cart-dec-bulk', 'cart-inc-bulk' ],
        label: `by ${Window_CraftConfirmation.CoarseStep}`,
      },
    ];
  }

  /**
   * The rectangle for the craft quantity legend.
   *
   * A placeholder shape only. The prompt above it resizes to whatever the chosen recipe spends, so the legend is
   * repositioned against the prompt's finished geometry each time it opens.
   * @returns {Rectangle}
   */
  getCraftLegendRectangle()
  {
    const width = Math.min(620, Graphics.boxWidth - 160);
    const height = this.calcWindowHeight(1, false);
    const x = (Graphics.boxWidth - width) / 2;

    return new Rectangle(x, 0, width, height);
  }

  /**
   * Parks the legend directly beneath the prompt, wherever the prompt has settled.
   *
   * The prompt centers itself around a height that depends on the recipe, so neither window's position is knowable
   * until the bill has been handed over.
   */
  positionCraftLegendWindow()
  {
    const confirmationWindow = this.getCraftConfirmationWindow();
    const legendWindow = this.getCraftLegendWindow();

    const y = confirmationWindow.y + confirmationWindow.height;

    legendWindow.move(confirmationWindow.x, y, confirmationWindow.width, legendWindow.height);
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
   * The rectangle for the window asking how many of a recipe to craft.
   *
   * Centered, and sized to its contents rather than to any of the scene's columns. It interrupts the whole scene
   * rather than belonging to one part of it, and a prompt wearing a column's geometry reads as that column having
   * failed to draw rather than as a question being asked.
   * @returns {Rectangle}
   */
  getCraftConfirmationRectangle()
  {
    // wide enough for the control legend to stay on one line, without spanning the whole scene.
    const width = Math.min(620, Graphics.boxWidth - 160);

    // the two answers are selectable rows, which are eight pixels taller than a line of text; the quantity and the
    // legend beneath them are plain lines. Measuring each in its own unit is what makes the readout land exactly
    // on the bottom of the contents rather than floating short of it or drawing past it.
    const answerRows = this.calcWindowHeight(2, true);
    const readoutLines = Window_Base.prototype.lineHeight() * 2;
    const height = answerRows + readoutLines + Window_CraftConfirmation.DividerGap;

    const x = (Graphics.boxWidth - width) / 2;
    const y = (Graphics.boxHeight - height) / 2;

    return new Rectangle(x, y, width, height);
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

    // seed the tab ring from whatever categories the station unlocked, then open on the first of them.
    this.categoryFilter()
      .setPositions(this.availableCategories());
    this.applyActiveCategory();

    // the recipe list is where the player lands; there is no category step to pass through first.
    this.selectRecipeListWindow();
  }

  /**
   * Creates all windows in this scene.
   */
  createAllWindows()
  {
    // create all the windows.
    this.createCreationDescriptionWindow();
    this.createCreationCategoryBadgeWindow();
    this.createRecipeListWindow();
    this.createRecipeDetailsWindow();
    this.createRecipeIngredientListWindow();
    this.createRecipeToolListWindow();
    this.createRecipeOutputListWindow();
    this.createIngredientSelectionWindow();
    this.createCraftConfirmationWindow();

    // last, so it draws above the prompt it belongs to.
    this.createCraftLegendWindow();
  }

  /**
   * Configures all windows.
   */
  /**
   * The categories this station deals in, which the calling event decided before opening the scene.
   * @returns {CraftingCategory[]}
   */
  availableCategories()
  {
    return $gameParty.getUnlockedCategories();
  }

  /**
   * The L2/R2 ring of categories this station deals in.
   * @returns {FilterCycle}
   */
  categoryFilter()
  {
    return this._j._crafting._create._categoryFilter;
  }

  /**
   * Points the strip and the recipe list at whichever category is now selected.
   */
  applyActiveCategory()
  {
    const categoryFilter = this.categoryFilter();

    // a CraftingCategory already carries a key, a name and an icon, so it is a ring position as it stands.
    this.getCreationCategoryBadgeWindow()
      .setPosition(categoryFilter.activePosition());

    this.getRecipeListWindow()
      .setCurrentCategory(categoryFilter.activeKey());
  }

  /**
   * Walks the category ring, wrapping at either end.
   *
   * Categories with nothing in them are stepped onto rather than skipped, matching the study shop: a
   * shoulder button that sometimes moves one place and sometimes three reads as broken, and an empty lane
   * says "go learn some dairy recipes" rather than that dairy does not exist.
   * @param {boolean} isForward Whether to walk forwards.
   */
  cycleCategories(isForward)
  {
    const categoryFilter = this.categoryFilter();
    const listWindow = this.getRecipeListWindow();

    // a ring of one is not a ring- moving would land exactly where the player already is.
    if (categoryFilter.canCycle() === false)
    {
      SoundManager.playBuzzer();
      listWindow.activate();
      return;
    }

    if (isForward)
    {
      categoryFilter.next();
    }
    else
    {
      categoryFilter.previous();
    }

    SoundManager.playCursor();
    this.applyActiveCategory();
    this.clampRecipeListSelection();
    this.onRecipeListIndexChange();
    listWindow.activate();
  }

  /**
   * Flips the craftable-only filter and keeps the cursor somewhere real.
   */
  onToggleCraftableOnly()
  {
    const listWindow = this.getRecipeListWindow();

    listWindow.toggleActionableOnly();

    this.clampRecipeListSelection();
    this.onRecipeListIndexChange();
    listWindow.activate();
  }

  /**
   * Keeps the recipe list selection in bounds after the rows underneath it change.
   */
  clampRecipeListSelection()
  {
    const listWindow = this.getRecipeListWindow();
    const commandCount = listWindow.commandList().length;

    if (commandCount === 0)
    {
      listWindow.deselect();
      return;
    }

    const index = listWindow.index();

    // after a filter that matched nothing (deselect leaves -1), the next populated tab must pick a row again.
    if (index < 0 || index >= commandCount)
    {
      listWindow.select(Math.max(0, Math.min(index, commandCount - 1)));
    }
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
   * Overrides {@link Scene_MenuFacetBase.controlLegendEntries}.<br/>
   * Teaches the controls that have no other way of being found.
   *
   * The tab cycle and the craftable-only filter are the two that need saying: neither leaves a mark on
   * screen until it is pressed, so a player who never tries them never learns the menu has lanes at all.
   * Confirm and cancel are named by what they land on and are left out.
   * @returns {{semantic: (string|string[]), label: string}[]}
   */
  controlLegendEntries()
  {
    return [
      {
        semantic: [ 'content-prev', 'content-next' ],
        label: 'category',
      },
      {
        semantic: 'context',
        label: 'craftable only',
      },
    ];
  }

  /**
   * Shared height for the help band and the category badge (recipe browsing chrome).
   * @returns {number}
   */
  creationHeaderBandHeight()
  {
    return this.calcWindowHeight(1, false);
  }

  /**
   * Width of the left column shared by category list, recipe list, and category badge windows.
   * @returns {number}
   */
  getCreationListColumnWidth()
  {
    return this.commandColumnWidth();
  }

  /**
   * Gets the rectangle associated with this window.
   * @returns {Rectangle}
   */
  getCreationDescriptionRectangle()
  {
    return new Rectangle(0, this.helpAreaTop(), Graphics.boxWidth, this.helpAreaHeight());
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
   * @returns {Window_FilterStrip}
   */
  buildCreationCategoryBadgeWindow()
  {
    const rectangle = this.getCreationCategoryBadgeRectangle();

    return new Window_FilterStrip(rectangle);
  }

  /**
   * Top-left slot beside the help window: same width as the list column; height matches
   * {@link #creationHeaderBandHeight}.
   * @returns {Rectangle}
   */
  getCreationCategoryBadgeRectangle()
  {
    const facetArea = this.facetAreaRect();

    return new Rectangle(
      facetArea.x,
      facetArea.y,
      this.getCreationListColumnWidth(),
      this.creationHeaderBandHeight());
  }

  /**
   * @returns {Window_FilterStrip}
   */
  getCreationCategoryBadgeWindow()
  {
    return this._j._crafting._create._creationCategoryBadge;
  }

  /**
   * @param {Window_FilterStrip} someWindow The some window driving this step.
   */
  setCreationCategoryBadgeWindow(someWindow)
  {
    this._j._crafting._create._creationCategoryBadge = someWindow;
  }

  //endregion creation description

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

    // L2/R2 walk the category tabs; the context button hides what cannot be cooked right now.
    window.setHandler('content-next', this.cycleCategories.bind(this, true));
    window.setHandler('content-prev', this.cycleCategories.bind(this, false));
    window.setHandler('context', this.onToggleCraftableOnly.bind(this));

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
    const facetArea = this.facetAreaRect();
    const y = facetArea.y + this.creationHeaderBandHeight();

    return new Rectangle(
      facetArea.x,
      y,
      this.getCreationListColumnWidth(),
      facetArea.y + facetArea.height - y);
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

    // the three component columns are separate windows sitting inside the details frame, so the frame
    // appearing without them is a set of headings over nothing. They are built hidden, and this is the
    // one place that reveals them.
    const ingredientListWindow = this.getRecipeIngredientListWindow();
    ingredientListWindow.show();
    ingredientListWindow.deselect();

    const toolListWindow = this.getRecipeToolListWindow();
    toolListWindow.show();
    toolListWindow.deselect();

    const outputListWindow = this.getRecipeOutputListWindow();
    outputListWindow.show();
    outputListWindow.deselect();

    // the strip is pointed at the active tab by applyActiveCategory, so revealing it is all that is left.
    this.getCreationCategoryBadgeWindow()
      .show();
  }

  onRecipeListIndexChange()
  {
    // grab the this list window.
    const recipeListWindow = this.getRecipeListWindow();

    // shorthand the currently-selected recipe. `currentExt` answers null whenever nothing is highlighted,
    // which is a reachable state rather than a broken one- see the guard below.
    /** @type {CraftingRecipe|null} */
    const currentRecipe = recipeListWindow.currentExt();

    // a lane with nothing in it is a place the player can legitimately stand, so there may be no recipe
    // to describe. `currentExt` answers null for an empty list or the -1 index a cleared filter leaves
    // behind, and every panel below reads the recipe, so there is nothing to show until one exists.
    if (currentRecipe === null)
    {
      this.clearRecipeDetailWindows();
      return;
    }

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

  /**
   * Blanks every panel that describes a recipe, for when no recipe is highlighted.
   *
   * Reachable now that empty lanes are stepped onto rather than skipped: cycling into a lane the player
   * has learned nothing in leaves the list with no rows and the cursor with nothing under it.
   */
  clearRecipeDetailWindows()
  {
    this.getCreationDescriptionWindow()
      .setText(String.empty);

    const detailsWindow = this.getRecipeDetailsWindow();
    detailsWindow.setCurrentRecipe(null);
    detailsWindow.refresh();

    const ingredientListWindow = this.getRecipeIngredientListWindow();
    ingredientListWindow.setComponents([]);
    ingredientListWindow.refresh();

    const toolListWindow = this.getRecipeToolListWindow();
    toolListWindow.setComponents([]);
    toolListWindow.refresh();

    const outputListWindow = this.getRecipeOutputListWindow();
    outputListWindow.setComponents([]);
    outputListWindow.refresh();
  }

  onRecipeListCancel()
  {
    SceneManager.pop();
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

    // an unaffordable recipe still reports itself, rather than opening a prompt offering a craft of zero.
    if (recipe === null || !recipe.canCraft())
    {
      this.executeCraft(recipe);

      return;
    }

    this.setPendingRecipe(recipe);
    this.beginCraftConfirmation(recipe);
  }

  /**
   * Opens the confirmation, asking how many of this recipe to craft.
   * @param {CraftingRecipe} recipe The recipe about to be crafted.
   */
  beginCraftConfirmation(recipe)
  {
    const selections = this.craftingCreationSession()
      .getSelections();
    const confirmationWindow = this.getCraftConfirmationWindow();

    confirmationWindow.setMaximum(recipe.maxCraftableCount(selections));

    // the bill goes in last, because taking it reshapes the window around however many entries it names.
    const spendLines = RecipeSpendResolver.aggregated(recipe.ingredients, selections);
    confirmationWindow.setSpendLines(spendLines);

    confirmationWindow.select(0);
    confirmationWindow.show();
    confirmationWindow.activate();

    this.positionCraftLegendWindow();

    // a ceiling of one leaves nothing to adjust, and a legend for controls that do nothing is worse than no legend.
    const legendWindow = this.getCraftLegendWindow();

    if (confirmationWindow.maximum() > 1) legendWindow.show();

    // the panel behind the prompt describes the same craft, so it stops guessing at the categorical slots too.
    this.getRecipeIngredientListWindow()
      .setSelections(selections);
  }

  /**
   * Crafts the pending recipe as many times as was asked for.
   */
  onCraftConfirmed()
  {
    const confirmationWindow = this.getCraftConfirmationWindow();
    const count = confirmationWindow.count();

    this.closeCraftConfirmationWindow();

    this.executeCraft(this.getPendingRecipe(), count);

    this.setPendingRecipe(null);
  }

  /**
   * Abandons the craft, spending nothing.
   */
  onCraftCancelled()
  {
    this.closeCraftConfirmationWindow();

    // the selections were only ever gathered for this craft, so they leave with it.
    this.craftingCreationSession()
      .cancelIngredientSelection();
    this.setPendingRecipe(null);

    const listWindow = this.getRecipeListWindow();

    listWindow.activate();
  }

  /**
   * Puts the confirmation away.
   */
  closeCraftConfirmationWindow()
  {
    const confirmationWindow = this.getCraftConfirmationWindow();

    confirmationWindow.hide();
    confirmationWindow.deactivate();

    this.getCraftLegendWindow()
      .hide();

    // the choices belonged to the craft being answered, so they leave with the question.
    this.getRecipeIngredientListWindow()
      .clearSelections();
  }

  /**
   * Executes a craft and returns the recipe column to its resting state.
   * @param {CraftingRecipe|null} recipe The recipe being crafted.
   * @param {number} count How many times to craft it.
   */
  executeCraft(recipe, count = 1)
  {
    const outcome = this.craftingCreationSession()
      .tryCraftRecipe(recipe, count);

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
   * Asks how many to craft, now that every categorical slot has an entry against it.
   */
  finishIngredientSelection()
  {
    this.closeIngredientSelectionWindow();

    this.beginCraftConfirmation(this.getPendingRecipe());
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
    const facetArea = this.facetAreaRect();
    const x = facetArea.x + this.getCreationListColumnWidth();

    return new Rectangle(
      x,
      facetArea.y,
      facetArea.x + facetArea.width - x,
      facetArea.height);
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