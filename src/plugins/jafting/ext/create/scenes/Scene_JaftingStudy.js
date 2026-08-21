//region Scene_JaftingStudy
import StudyPurchaseService from '../managers/StudyPurchaseService.js';
import Window_CreationDescription from '../windows/Window_CreationDescription.js';
import Window_RecipeDetails from '../windows/Window_RecipeDetails.js';
import Window_RecipeIngredientList from '../windows/Window_RecipeIngredientList.js';
import Window_RecipeOutputList from '../windows/Window_RecipeOutputList.js';
import Window_RecipeToolList from '../windows/Window_RecipeToolList.js';
import Window_StudyCostList from '../windows/Window_StudyCostList.js';
import Window_StudyRecipeList from '../windows/Window_StudyRecipeList.js';

/**
 * A scene for buying the knowledge of a recipe from somebody who already has it.
 *
 * Deliberately a shorter scene than crafting's. Crafting has to ask which of several eligible entries
 * to spend and how many times to run; buying asks one question, which is whether to buy the thing being
 * looked at. So there is no selection flow and no quantity prompt- a recipe is bought once or not.
 *
 * Which categories are on offer is decided before the scene opens, exactly as the crafting stations
 * decide it: the event unlocks what its vendor deals in, opens this, then locks it again. That is why
 * nothing here filters by vendor- the caller already did.
 *
 * The panels describing a recipe are the same windows the crafting scene uses, deliberately. What a
 * recipe consumes is how a player decides which one to buy- a surplus of one ingredient is the whole
 * reason to prefer one dish over another- so a shop that only quotes a price is asking for a decision
 * while withholding what the decision is made of.
 */
class Scene_JaftingStudy
  extends Scene_MenuFacetBase
{
  /**
   * The symbol representing the command for this scene from other menus.
   * @type {string}
   */
  static KEY = 'jafting-study';

  /**
   * Whether there is anything at all for sale right now.
   *
   * Note this cannot lean on {@link CraftingCategory.hasAnyRecipes}, which counts what is *unlocked*-
   * the opposite of what a shop stocks.
   * @returns {boolean}
   */
  static isAccessible()
  {
    const categories = $gameParty.getUnlockedCategories();

    return categories.some(category => $gameParty.getPurchasableRecipesByCategory(category.key).length > 0);
  }

  /**
   * Opens the scene, refusing audibly when there is nothing to sell.
   */
  static callScene()
  {
    if (Scene_JaftingStudy.isAccessible() === false)
    {
      SoundManager.playBuzzer();
      return;
    }

    SceneManager.push(this);
  }

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

  /**
   * Extends {@link #initialize}.
   */
  initialize()
  {
    // perform original logic.
    super.initialize();

    // also initialize our scene properties.
    this.initMembers();
  }

  /**
   * Initializes all properties for this scene.
   */
  initMembers()
  {
    // perform original logic.
    super.initMembers();

    /**
     * The shared root namespace for all of J's plugin data.
     */
    this._j ||= {};

    /**
     * A grouping of all properties associated with the crafting system.
     */
    this._j._crafting ||= {};

    /**
     * A grouping of all properties associated with studying recipes.
     */
    this._j._crafting._study = {};

    /**
     * The window explaining whatever is currently highlighted.
     * @type {Window_CreationDescription|null}
     */
    this._j._crafting._study._description = null;

    /**
     * The badge naming the category currently being browsed.
     * @type {Window_FilterStrip|null}
     */
    this._j._crafting._study._categoryBadge = null;

    /**
     * The shelf of recipes for sale.
     * @type {Window_StudyRecipeList|null}
     */
    this._j._crafting._study._recipeList = null;

    /**
     * The price of whatever is highlighted on the shelf.
     * @type {Window_StudyCostList|null}
     */
    this._j._crafting._study._costList = null;

    /**
     * The frame describing whatever is highlighted, and the headings its columns sit under.
     * @type {Window_RecipeDetails|null}
     */
    this._j._crafting._study._recipeDetails = null;

    /**
     * What the highlighted recipe consumes.
     * @type {Window_RecipeIngredientList|null}
     */
    this._j._crafting._study._ingredientList = null;

    /**
     * What the highlighted recipe requires but does not consume.
     * @type {Window_RecipeToolList|null}
     */
    this._j._crafting._study._toolList = null;

    /**
     * What the highlighted recipe produces.
     * @type {Window_RecipeOutputList|null}
     */
    this._j._crafting._study._outputList = null;

    /**
     * The L2/R2 ring of categories this vendor is dealing in.
     * @type {FilterCycle}
     */
    this._j._crafting._study._categoryFilter = new FilterCycle();
  }

  /**
   * Extends {@link #create}.
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

    // point everything at whichever category we opened on.
    this.categoryFilter()
      .setPositions(this.availableCategories());
    this.refreshCategory();
  }

  /**
   * Creates all windows in this scene.
   */
  createAllWindows()
  {
    this.createStudyDescriptionWindow();
    this.createStudyCategoryBadgeWindow();
    this.createStudyRecipeListWindow();
    this.createStudyCostListWindow();

    // the detail frame is built after the list, because its columns are measured from the frame and the
    // frame is measured from the column the list occupies.
    this.createStudyRecipeDetailWindows();
  }

  /**
   * Overwrites {@link #createBackground}.<br/>
   * Keeps the map faintly visible behind the shop, as the crafting scene does.
   */
  createBackground()
  {
    this.setBackgroundFilter(new PIXI.filters.AlphaFilter(0.1));
    this.setBackgroundSprite(new Sprite());
    this.backgroundSprite().bitmap = SceneManager.backgroundBitmap();
    this.backgroundSprite().filters = [ this.backgroundFilter() ];
    this.addChild(this.backgroundSprite());
  }

  /**
   * Overwrites {@link #createButtons}.<br/>
   * The scene is driven entirely by the shelf, so the touch buttons have nothing to point at.
   */
  createButtons()
  {
  }

  //region description window
  /**
   * Creates the description window.
   */
  createStudyDescriptionWindow()
  {
    const window = this.buildStudyDescriptionWindow();

    this.setStudyDescriptionWindow(window);

    this.addWindow(window);
  }

  /**
   * Builds the description window.
   * @returns {Window_CreationDescription}
   */
  buildStudyDescriptionWindow()
  {
    const rectangle = this.getStudyDescriptionRectangle();

    return new Window_CreationDescription(rectangle);
  }

  /**
   * Gets the rectangle for the description window.
   * @returns {Rectangle}
   */
  getStudyDescriptionRectangle()
  {
    // this scene's description is the base's help band rather than a panel of its own, which is what
    // keeps the strip from being reserved across the top and then left empty.
    return new Rectangle(0, this.helpAreaTop(), Graphics.boxWidth, this.helpAreaHeight());
  }

  /**
   * Gets the description window being tracked.
   * @returns {Window_CreationDescription}
   */
  getStudyDescriptionWindow()
  {
    return this._j._crafting._study._description;
  }

  /**
   * Sets the description window being tracked.
   * @param {Window_CreationDescription} window The window to track.
   */
  setStudyDescriptionWindow(window)
  {
    this._j._crafting._study._description = window;
  }
  //endregion description window

  //region category badge window
  /**
   * Creates the category badge window.
   */
  createStudyCategoryBadgeWindow()
  {
    const window = this.buildStudyCategoryBadgeWindow();

    this.setStudyCategoryBadgeWindow(window);

    this.addWindow(window);
  }

  /**
   * Builds the category badge window.
   * @returns {Window_FilterStrip}
   */
  buildStudyCategoryBadgeWindow()
  {
    const rectangle = this.getStudyCategoryBadgeRectangle();

    return new Window_FilterStrip(rectangle);
  }

  /**
   * Gets the rectangle for the category badge.
   * @returns {Rectangle}
   */
  getStudyCategoryBadgeRectangle()
  {
    const facetArea = this.facetAreaRect();

    return new Rectangle(
      facetArea.x,
      facetArea.y,
      this.getStudyListColumnWidth(),
      this.studyHeaderBandHeight());
  }

  /**
   * Gets the category badge window being tracked.
   * @returns {Window_FilterStrip}
   */
  getStudyCategoryBadgeWindow()
  {
    return this._j._crafting._study._categoryBadge;
  }

  /**
   * Sets the category badge window being tracked.
   * @param {Window_FilterStrip} window The window to track.
   */
  setStudyCategoryBadgeWindow(window)
  {
    this._j._crafting._study._categoryBadge = window;
  }
  //endregion category badge window

  //region recipe list window
  /**
   * Creates the shelf of recipes for sale.
   */
  createStudyRecipeListWindow()
  {
    const window = this.buildStudyRecipeListWindow();

    this.setStudyRecipeListWindow(window);

    this.addWindow(window);
  }

  /**
   * Builds the shelf of recipes for sale.
   * @returns {Window_StudyRecipeList}
   */
  buildStudyRecipeListWindow()
  {
    const rectangle = this.getStudyRecipeListRectangle();

    const window = new Window_StudyRecipeList(rectangle);

    // assign cancel functionality.
    window.setHandler('cancel', this.onStudyCancel.bind(this));

    // assign on-select functionality.
    window.setHandler('ok', this.onStudySelection.bind(this));

    // the shoulder buttons walk the categories, which is what J-Base wires these two symbols to.
    window.setHandler('content-prev', this.onPreviousCategory.bind(this));
    window.setHandler('content-next', this.onNextCategory.bind(this));

    // overwrite the onIndexChange hook with our local hook.
    window.onIndexChange = this.onStudyIndexChange.bind(this);

    window.activate();

    return window;
  }

  /**
   * Gets the rectangle for the shelf.
   * @returns {Rectangle}
   */
  getStudyRecipeListRectangle()
  {
    const facetArea = this.facetAreaRect();
    const y = facetArea.y + this.studyHeaderBandHeight();

    // the shelf gives up its foot to the price, which is the one fact a shopper needs beside the name.
    const height = facetArea.y + facetArea.height - y - this.studyPriceBandHeight();

    return new Rectangle(facetArea.x, y, this.getStudyListColumnWidth(), height);
  }

  /**
   * Gets the shelf window being tracked.
   * @returns {Window_StudyRecipeList}
   */
  getStudyRecipeListWindow()
  {
    return this._j._crafting._study._recipeList;
  }

  /**
   * Sets the shelf window being tracked.
   * @param {Window_StudyRecipeList} window The window to track.
   */
  setStudyRecipeListWindow(window)
  {
    this._j._crafting._study._recipeList = window;
  }
  //endregion recipe list window

  //region cost list window
  /**
   * Creates the price tag.
   */
  createStudyCostListWindow()
  {
    const window = this.buildStudyCostListWindow();

    this.setStudyCostListWindow(window);

    this.addWindow(window);
  }

  /**
   * Builds the price tag.
   * @returns {Window_StudyCostList}
   */
  buildStudyCostListWindow()
  {
    const rectangle = this.getStudyCostListRectangle();

    const window = new Window_StudyCostList(rectangle);

    // no command functionality despite being a command window, and no cursor either - deactivating
    // alone would leave row zero highlighted as though the price were something you pick.
    window.deactivate();
    window.deselect();

    return window;
  }

  /**
   * Gets the rectangle for the price tag.
   * @returns {Rectangle}
   */
  getStudyCostListRectangle()
  {
    const recipeList = this.getStudyRecipeListRectangle();

    return new Rectangle(
      recipeList.x,
      recipeList.y + recipeList.height,
      recipeList.width,
      this.studyPriceBandHeight());
  }

  /**
   * Gets the price tag window being tracked.
   * @returns {Window_StudyCostList}
   */
  getStudyCostListWindow()
  {
    return this._j._crafting._study._costList;
  }

  /**
   * Sets the price tag window being tracked.
   * @param {Window_StudyCostList} window The window to track.
   */
  setStudyCostListWindow(window)
  {
    this._j._crafting._study._costList = window;
  }
  //endregion cost list window

  //region recipe detail windows
  /**
   * Creates the frame describing the highlighted recipe, and the three columns inside it.
   *
   * The columns are separate windows sitting within the frame's headings, so they are created together
   * and revealed together; a heading over nothing is worse than no heading.
   */
  createStudyRecipeDetailWindows()
  {
    const detailsWindow = new Window_RecipeDetails(this.getStudyRecipeDetailsRectangle());
    this.setStudyRecipeDetailsWindow(detailsWindow);
    this.addWindow(detailsWindow);

    // these are read, never driven. deactivating stops them taking input but leaves the cursor sitting
    // on row zero, which draws as a selection bar over a column nobody is in.
    const ingredientListWindow = new Window_RecipeIngredientList(this.getStudyIngredientListRectangle());
    ingredientListWindow.deactivate();
    ingredientListWindow.deselect();
    this.setStudyIngredientListWindow(ingredientListWindow);
    this.addWindow(ingredientListWindow);

    const toolListWindow = new Window_RecipeToolList(this.getStudyToolListRectangle());
    toolListWindow.deactivate();
    toolListWindow.deselect();
    this.setStudyToolListWindow(toolListWindow);
    this.addWindow(toolListWindow);

    const outputListWindow = new Window_RecipeOutputList(this.getStudyOutputListRectangle());
    outputListWindow.deactivate();
    outputListWindow.deselect();
    this.setStudyOutputListWindow(outputListWindow);
    this.addWindow(outputListWindow);
  }

  /**
   * Gets the rectangle for the details frame, which fills the facet area beside the shelf.
   * @returns {Rectangle}
   */
  getStudyRecipeDetailsRectangle()
  {
    const facetArea = this.facetAreaRect();
    const x = facetArea.x + this.getStudyListColumnWidth();

    return new Rectangle(x, facetArea.y, facetArea.x + facetArea.width - x, facetArea.height);
  }

  /**
   * Gets the rectangle for the ingredient column.
   * @returns {Rectangle}
   */
  getStudyIngredientListRectangle()
  {
    const layout = this.getStudyLowerPanelLayout();

    return new Rectangle(layout.leftX, layout.y, layout.colW, layout.height);
  }

  /**
   * Gets the rectangle for the tool column.
   * @returns {Rectangle}
   */
  getStudyToolListRectangle()
  {
    const layout = this.getStudyLowerPanelLayout();

    return new Rectangle(layout.leftX + layout.colW, layout.y, layout.colW, layout.height);
  }

  /**
   * Gets the rectangle for the output column.
   * @returns {Rectangle}
   */
  getStudyOutputListRectangle()
  {
    const layout = this.getStudyLowerPanelLayout();
    const x = layout.leftX + layout.colW * 2;

    return new Rectangle(x, layout.y, layout.colW + layout.remainder, layout.height);
  }

  /**
   * @returns {Window_RecipeDetails}
   */
  getStudyRecipeDetailsWindow()
  {
    return this._j._crafting._study._recipeDetails;
  }

  /**
   * @param {Window_RecipeDetails} window The window to track.
   */
  setStudyRecipeDetailsWindow(window)
  {
    this._j._crafting._study._recipeDetails = window;
  }

  /**
   * @returns {Window_RecipeIngredientList}
   */
  getStudyIngredientListWindow()
  {
    return this._j._crafting._study._ingredientList;
  }

  /**
   * @param {Window_RecipeIngredientList} window The window to track.
   */
  setStudyIngredientListWindow(window)
  {
    this._j._crafting._study._ingredientList = window;
  }

  /**
   * @returns {Window_RecipeToolList}
   */
  getStudyToolListWindow()
  {
    return this._j._crafting._study._toolList;
  }

  /**
   * @param {Window_RecipeToolList} window The window to track.
   */
  setStudyToolListWindow(window)
  {
    this._j._crafting._study._toolList = window;
  }

  /**
   * @returns {Window_RecipeOutputList}
   */
  getStudyOutputListWindow()
  {
    return this._j._crafting._study._outputList;
  }

  /**
   * @param {Window_RecipeOutputList} window The window to track.
   */
  setStudyOutputListWindow(window)
  {
    this._j._crafting._study._outputList = window;
  }
  //endregion recipe detail windows

  //region layout
  /**
   * Overrides {@link Scene_MenuFacetBase.controlLegendEntries}.<br/>
   * Teaches the one control that leaves no mark on screen until it is pressed.
   *
   * The shelf binds nothing else of its own- confirm buys what is under the cursor and cancel leaves,
   * both of which are named by what they land on. Listing a filter this scene does not bind would be
   * worse than listing nothing, so the legend stays honest and short.
   * @returns {{semantic: (string|string[]), label: string}[]}
   */
  controlLegendEntries()
  {
    return [
      {
        semantic: [ 'content-prev', 'content-next' ],
        label: 'category',
      },
    ];
  }

  /**
   * The height of the category badge crowning the shelf.
   * @returns {number}
   */
  studyHeaderBandHeight()
  {
    return this.calcWindowHeight(1, false);
  }

  /**
   * The height of the price band beneath the shelf, sized for three parts of a price.
   * @returns {number}
   */
  studyPriceBandHeight()
  {
    return this.calcWindowHeight(3 * 1.5, false);
  }

  /**
   * The width of the left column the shelf, its badge and its price share.
   * @returns {number}
   */
  getStudyListColumnWidth()
  {
    return this.commandColumnWidth();
  }

  /**
   * Positions the ingredient, tool and output columns inside the details frame, below the headings the
   * frame draws for them.
   * @returns {{ leftX: number, y: number, colW: number, remainder: number, height: number }}
   */
  getStudyLowerPanelLayout()
  {
    const detailsR = this.getStudyRecipeDetailsRectangle();
    const detailsWindow = this.getStudyRecipeDetailsWindow();
    const pad = detailsWindow.padding;
    const innerW = detailsR.width - pad * 2;
    const {
      cw,
      remainder
    } = Window_RecipeDetails.componentColumnWidths(innerW);
    const leftX = detailsR.x + pad;
    const rowInset = Window_RecipeIngredientList.recipeComponentRowTopInsetPx();
    const listInnerTop = detailsR.y + pad + detailsWindow.componentListRowsInnerStartY() - rowInset;
    const height = detailsR.y + detailsR.height - listInnerTop - pad;

    return {
      leftX,
      y: listInnerTop,
      colW: cw,
      remainder,
      height
    };
  }
  //endregion layout

  //region categories
  /**
   * Which of the unlocked categories is currently being browsed.
   * @returns {number}
   */
  categoryFilter()
  {
    return this._j._crafting._study._categoryFilter;
  }

  /**
   * The categories this vendor is dealing in, which the calling event decided before opening the scene.
   *
   * A category nothing was ever priced in is dropped rather than shown empty. That is a static fact -
   * the filter asks whether a recipe here has a cost at all, not whether the player still lacks it - so
   * a lane bought out over the course of a game keeps its tab and reports itself empty, while alchemy,
   * which prices nothing by design, never appears at all.
   * @returns {CraftingCategory[]}
   */
  availableCategories()
  {
    return $gameParty.getUnlockedCategories()
      .filter(category => $gameParty.getPurchasableRecipesByCategory(category.key).length > 0);
  }

  /**
   * Moves to the previous category, wrapping around the end.
   */
  onPreviousCategory()
  {
    this.stepCategoryBy(-1);
  }

  /**
   * Moves to the next category, wrapping around the end.
   */
  onNextCategory()
  {
    this.stepCategoryBy(1);
  }

  /**
   * Walks the category selection by a given number of places.
   *
   * Categories with nothing for sale are stepped onto rather than skipped. A shoulder button that
   * sometimes moves one place and sometimes three reads as broken, and an empty shelf is information-
   * it says to come back later rather than that nothing exists.
   * @param {number} step How many places to move, which may be negative.
   */
  stepCategoryBy(step)
  {
    const categoryFilter = this.categoryFilter();

    if (step > 0)
    {
      categoryFilter.next();
    }
    else
    {
      categoryFilter.previous();
    }

    this.refreshCategory();

    SoundManager.playCursor();
  }

  /**
   * Points every window at whichever category is now selected.
   */
  refreshCategory()
  {
    const categoryFilter = this.categoryFilter();

    // a CraftingCategory already carries a key, a name and an icon, which is exactly a ring position.
    this.getStudyCategoryBadgeWindow()
      .setPosition(categoryFilter.activePosition());

    const recipeListWindow = this.getStudyRecipeListWindow();
    recipeListWindow.setCurrentCategory(categoryFilter.activeKey());
    recipeListWindow.select(0);

    this.onStudyIndexChange();
  }
  //endregion categories

  //region handlers
  /**
   * Repoints the price tag and the description at whatever is now highlighted.
   */
  onStudyIndexChange()
  {
    const recipeListWindow = this.getStudyRecipeListWindow();

    /** @type {CraftingRecipe|null} */
    const currentRecipe = recipeListWindow.currentExt();

    // an empty shelf leaves nothing highlighted, and every panel below describes a recipe.
    if (currentRecipe === null || currentRecipe === undefined)
    {
      this.clearStudyDetailWindows();
      return;
    }

    const {
      ingredients,
      tools,
      outputs
    } = currentRecipe;

    this.getStudyDescriptionWindow()
      .setText(currentRecipe.getRecipeDescription());

    const costListWindow = this.getStudyCostListWindow();
    costListWindow.setComponents(currentRecipe.cost);
    costListWindow.show();

    // nothing on this shelf has been crafted, so masking would hide every recipe on offer from the
    // person deciding whether to buy it.
    const detailsWindow = this.getStudyRecipeDetailsWindow();
    detailsWindow.setNeedsMasking(false);
    detailsWindow.setCurrentRecipe(currentRecipe);
    detailsWindow.refresh();
    detailsWindow.show();

    const ingredientListWindow = this.getStudyIngredientListWindow();
    ingredientListWindow.setComponents(ingredients);
    ingredientListWindow.refresh();
    ingredientListWindow.show();

    const toolListWindow = this.getStudyToolListWindow();
    toolListWindow.setComponents(tools);
    toolListWindow.refresh();
    toolListWindow.show();

    const outputListWindow = this.getStudyOutputListWindow();
    outputListWindow.setNeedsMasking(false);
    outputListWindow.setComponents(outputs);
    outputListWindow.refresh();
    outputListWindow.show();
  }

  /**
   * Hides every panel that describes a recipe, for when the shelf is empty.
   *
   * Hidden rather than blanked, or an empty category presents three column headings over nothing.
   * Paired with the reveals in {@link #onStudyIndexChange}, the only other place these change.
   */
  clearStudyDetailWindows()
  {
    this.getStudyDescriptionWindow()
      .setText(String.empty);

    this.getStudyCostListWindow()
      .hide();
    this.getStudyRecipeDetailsWindow()
      .hide();
    this.getStudyIngredientListWindow()
      .hide();
    this.getStudyToolListWindow()
      .hide();
    this.getStudyOutputListWindow()
      .hide();
  }

  /**
   * Buys whatever is highlighted, if it can be bought.
   */
  onStudySelection()
  {
    const recipeListWindow = this.getStudyRecipeListWindow();

    // never null here, unlike everywhere else `currentExt` is read: `Window_Command.isCurrentItemEnabled`
    // answers false when nothing is highlighted, so the engine buzzes rather than calling this handler.
    /** @type {CraftingRecipe} */
    const currentRecipe = recipeListWindow.currentExt();

    const outcome = StudyPurchaseService.tryPurchase(currentRecipe);

    if (outcome.purchased === true)
    {
      SoundManager.playShop();
    }

    // the shelf re-reads itself either way: what was just bought greys out and drops to the bottom.
    recipeListWindow.refresh();
    this.onStudyIndexChange();
    recipeListWindow.activate();
  }

  /**
   * Leaves the shop.
   */
  onStudyCancel()
  {
    SceneManager.pop();
  }
  //endregion handlers
}

export default Scene_JaftingStudy;
//endregion Scene_JaftingStudy