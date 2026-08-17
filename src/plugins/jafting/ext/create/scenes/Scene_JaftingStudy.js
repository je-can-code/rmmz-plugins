//region Scene_JaftingStudy
import StudyPurchaseService from '../managers/StudyPurchaseService.js';
import Window_CreationDescription from '../windows/Window_CreationDescription.js';
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
 */
class Scene_JaftingStudy
  extends Scene_MenuBase
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
    const [ ox, oy ] = Graphics.boxOrigin;
    const listColumnWidth = this.getStudyListColumnWidth();
    const x = ox + listColumnWidth + Graphics.horizontalPadding;
    const width = ox + Graphics.boxWidth - x - Graphics.horizontalPadding;

    return new Rectangle(x, oy, width, this.studyHeaderBandHeight());
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
    const [ ox, oy ] = Graphics.boxOrigin;

    return new Rectangle(ox, oy, this.getStudyListColumnWidth(), this.studyHeaderBandHeight());
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
    const [ ox, oy ] = Graphics.boxOrigin;
    const y = oy + this.studyHeaderBandHeight() + Graphics.verticalPadding;
    const height = oy + Graphics.boxHeight - y - Graphics.verticalPadding;

    return new Rectangle(ox, y, this.getStudyListColumnWidth(), height);
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

    // no command functionality despite being a command window.
    window.deactivate();

    return window;
  }

  /**
   * Gets the rectangle for the price tag.
   * @returns {Rectangle}
   */
  getStudyCostListRectangle()
  {
    const description = this.getStudyDescriptionRectangle();
    const recipeList = this.getStudyRecipeListRectangle();

    return new Rectangle(description.x, recipeList.y, description.width, recipeList.height);
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

  //region layout
  /**
   * The shared height of the description band and the category badge beside it.
   * @returns {number}
   */
  studyHeaderBandHeight()
  {
    return 100;
  }

  /**
   * The width of the left column the shelf and its badge share.
   * @returns {number}
   */
  getStudyListColumnWidth()
  {
    return Math.round(300 * 1.1);
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
   * @returns {CraftingCategory[]}
   */
  availableCategories()
  {
    return $gameParty.getUnlockedCategories();
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

    const costListWindow = this.getStudyCostListWindow();
    const descriptionWindow = this.getStudyDescriptionWindow();

    // an empty shelf leaves nothing highlighted, and a price tag for nothing is a blank price tag.
    if (currentRecipe === null || currentRecipe === undefined)
    {
      costListWindow.setComponents([]);
      descriptionWindow.setText(String.empty);
      return;
    }

    costListWindow.setComponents(currentRecipe.cost);
    descriptionWindow.setText(currentRecipe.getRecipeDescription());
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