//region Scene_Questopedia
/**
 * A scene for interacting with the Questopedia.
 */
class Scene_Questopedia extends Scene_MenuBase
{
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
   * Pushes this current scene onto the stack, forcing it into action.
   */
  static callScene()
  {
    SceneManager.push(this);
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

    // initialize the questopedia members.
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
    this._j._omni = {};
  }

  /**
   * The primary properties of the scene are the initial properties associated with
   * the main list containing all pedias unlocked by the player along with some subtext of
   * what the pedia entails.
   */
  initPrimaryMembers()
  {
    /**
     * A grouping of all properties associated with the questopedia.
     * The questopedia is a subcategory of the omnipedia.
     */
    this._j._omni._quest = {};

    /**
     * The window that shows the categories a quest can be associated with.
     * @type {Window_QuestopediaCategories}
     */
    this._j._omni._quest._pediaCategories = null;

    /**
     * The window that shows the list of known quests.
     * @type {Window_QuestopediaList}
     */
    this._j._omni._quest._pediaList = null;

    /**
     * The window that shows the description of the selected quest.
     * @type {Window_QuestopediaDescription}
     */
    this._j._omni._quest._pediaDescription = null;

    /**
     * The window that shows the list of objectives for the selected quest.
     * @type {Window_QuestopediaObjectives}
     */
    this._j._omni._quest._pediaObjectives = null;
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
  }

  /**
   * Creates all questopedia windows.
   */
  createAllWindows()
  {
    // create the list of quest categories.
    this.createQuestopediaCategoriesWindow();

    // create the list of quests that are known.
    this.createQuestopediaListWindow();

    // create the description of the selected quest.
    this.createQuestopediaDescriptionWindow();

    // create the known list of unfinished and completed objectives of the selected quest.
    this.createQuestopediaObjectivesWindow();


    const categoriesWindow = this.getQuestopediaCategoriesWindow();
    categoriesWindow.onIndexChange();

    // grab the list window for refreshing.
    const listWindow = this.getQuestopediaListWindow();

    // initial refresh the detail window by way of force-changing the index.
    listWindow.onIndexChange();
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
  }

  //endregion create

  //region windows
  //region categories window
  /**
   * Creates the quest categories window.
   */
  createQuestopediaCategoriesWindow()
  {
    // create the window.
    const window = this.buildQuestopediaCategoriesWindow();

    // update the tracker with the new window.
    this.setQuestopediaCategoriesWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  /**
   * Sets up and defines the questopedia categories window.
   * @returns {Window_QuestopediaCategories}
   */
  buildQuestopediaCategoriesWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.questopediaCategoriesRectangle();

    // create the window with the rectangle.
    const window = new Window_QuestopediaCategories(rectangle);

    // overwrite the onIndexChange hook with our local onQuestopediaIndexChange hook.
    window.onIndexChange = this.onQuestopediaCategoryChange.bind(this);

    window.deactivate();

    // return the built and configured omnipedia list window.
    return window;
  }

  /**
   * Gets the rectangle associated with the questopedia list command window.
   * @returns {Rectangle}
   */
  questopediaCategoriesRectangle()
  {
    // the list window's origin coordinates are the box window's origin as well.
    const [ x, y ] = Graphics.boxOrigin;

    // define the width of the categories.
    const width = 500;

    // define the height of the categories.
    const height = (Graphics.boxHeight * 0.08) - (Graphics.verticalPadding * 2);

    // build the rectangle to return.
    return new Rectangle(x, y, width, height);
  }

  /**
   * Gets the currently tracked questopedia categories window.
   * @returns {Window_QuestopediaCategories}
   */
  getQuestopediaCategoriesWindow()
  {
    return this._j._omni._quest._pediaCategories;
  }

  /**
   * Set the currently tracked questopedia categories window to the given window.
   * @param {Window_QuestopediaCategories} categoriesWindow The questopedia categories window to track.
   */
  setQuestopediaCategoriesWindow(categoriesWindow)
  {
    this._j._omni._quest._pediaCategories = categoriesWindow;
  }

  //endregion categories window

  //region list window
  /**
   * Creates the list of quests the player can potentially complete.
   */
  createQuestopediaListWindow()
  {
    // create the window.
    const window = this.buildQuestopediaListWindow();

    // update the tracker with the new window.
    this.setQuestopediaListWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  /**
   * Sets up and defines the questopedia listing window.
   * @returns {Window_OmnipediaList}
   */
  buildQuestopediaListWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.questopediaListRectangle();

    // create the window with the rectangle.
    const window = new Window_QuestopediaList(rectangle);

    // assign cancel functionality.
    window.setHandler('cancel', this.onCancelQuestopedia.bind(this));

    // assign on-select functionality.
    window.setHandler('ok', this.onQuestopediaListSelection.bind(this));

    // overwrite the onIndexChange hook with our local onQuestopediaIndexChange hook.
    window.onIndexChange = this.onQuestopediaIndexChange.bind(this);

    window.setHandler('pagedown', this.cycleQuestCategories.bind(this, true));
    window.setHandler('pageup', this.cycleQuestCategories.bind(this, false));

    // return the built and configured omnipedia list window.
    return window;
  }

  /**
   * Gets the rectangle associated with the questopedia list command window.
   * @returns {Rectangle}
   */
  questopediaListRectangle()
  {
    // the list window's origin coordinates are the box window's origin as well.
    const categoriesRectangle = this.questopediaCategoriesRectangle();

    // the list x coordinate is aligned with the categories window.
    const x = categoriesRectangle.x;

    // the list y coordinate is below the categories window.
    const y = categoriesRectangle.height + Graphics.verticalPadding;

    // define the width of the list.
    const width = categoriesRectangle.width;

    // define the height of the list.
    const height = Graphics.boxHeight - Graphics.verticalPadding - y;

    // build the rectangle to return.
    return new Rectangle(x, y, width, height);
  }

  /**
   * Gets the currently tracked questopedia list window.
   * @returns {Window_QuestopediaList}
   */
  getQuestopediaListWindow()
  {
    return this._j._omni._quest._pediaList;
  }

  /**
   * Set the currently tracked questopedia list window to the given window.
   * @param {Window_QuestopediaList} listWindow The questopedia list window to track.
   */
  setQuestopediaListWindow(listWindow)
  {
    this._j._omni._quest._pediaList = listWindow;
  }

  //endregion list window

  //region description window
  /**
   * Creates the description of a single quest the player has discovered.
   */
  createQuestopediaDescriptionWindow()
  {
    // create the window.
    const window = this.buildQuestopediaDetailWindow();

    // update the tracker with the new window.
    this.setQuestopediaDetailWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  /**
   * Sets up and defines the questopedia detail window.
   * @returns {Window_QuestopediaDescription}
   */
  buildQuestopediaDetailWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.questopediaDetailRectangle();

    // create the window with the rectangle.
    const window = new Window_QuestopediaDescription(rectangle);

    // return the built and configured omnipedia list window.
    return window;
  }

  /**
   * Gets the rectangle associated with the questopedia detail command window.
   * @returns {Rectangle}
   */
  questopediaDetailRectangle()
  {
    // grab the questopedia list window.
    const listWindow = this.getQuestopediaListWindow();

    // calculate the X for where the origin of the list window should be.
    const x = listWindow.x + listWindow.width;

    // calculate the Y for where the origin of the list window should be.
    const y = Graphics.verticalPadding;

    // define the width of the list.
    const width = Graphics.boxWidth - listWindow.width - (Graphics.horizontalPadding * 2);

    // define the height of the list.
    const height = Graphics.boxHeight - (Graphics.verticalPadding * 2);

    // build the rectangle to return.
    return new Rectangle(x, y, width, height);
  }

  /**
   * Gets the currently tracked questopedia description window.
   * @returns {Window_QuestopediaDescription}
   */
  getQuestopediaDetailWindow()
  {
    return this._j._omni._quest._pediaDescription;
  }

  /**
   * Set the currently tracked questopedia description window to the given window.
   * @param {Window_QuestopediaDescription} descriptionWindow The questopedia description window to track.
   */
  setQuestopediaDetailWindow(descriptionWindow)
  {
    this._j._omni._quest._pediaDescription = descriptionWindow;
  }

  //endregion description window

  //region objectives window
  /**
   * Creates the list of objectives for the current quest that the player knows about.
   */
  createQuestopediaObjectivesWindow()
  {
    // create the window.
    const window = this.buildQuestopediaObjectivesWindow();

    // update the tracker with the new window.
    this.setQuestopediaObjectivesWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  /**
   * Sets up and defines the questopedia objectives window.
   * @returns {Window_QuestopediaObjectives}
   */
  buildQuestopediaObjectivesWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.questopediaObjectivesRectangle();

    // create the window with the rectangle.
    const window = new Window_QuestopediaObjectives(rectangle);

    window.deactivate();
    window.deselect();

    // assign cancel functionality.
    // window.setHandler('cancel', this.onCancelQuestopediaObjectives.bind(this));

    // assign on-select functionality.
    // TODO: should the player even be able to "select" an objective?
    // window.setHandler('ok', this.onQuestopediaObjectiveSelection.bind(this));

    // overwrite the onIndexChange hook with our local onQuestopediaObjectivesIndexChange hook.
    // TODO: is there even any logic required for perusing objectives?
    // window.onIndexChange = this.onQuestopediaObjectivesIndexChange.bind(this);

    // return the built and configured objectives window.
    return window;
  }

  /**
   * Gets the rectangle associated with the questopedia objectives command window.
   * @returns {Rectangle}
   */
  questopediaObjectivesRectangle()
  {
    // grab the questopedia list window.
    const listWindow = this.getQuestopediaListWindow();

    // calculate the X for where the origin of the list window should be.
    const x = listWindow.x + listWindow.width;

    // calculate the Y for where the origin of the list window should be.
    const y = (Graphics.boxHeight / 2);

    // define the width of the list.
    const width = Graphics.boxWidth - listWindow.width - (Graphics.horizontalPadding * 2);

    // define the height of the list.
    const height = (Graphics.boxHeight / 2) - Graphics.verticalPadding;

    // build the rectangle to return.
    return new Rectangle(x, y, width, height);
  }

  /**
   * Gets the currently tracked questopedia objectives window.
   * @returns {Window_QuestopediaObjectives}
   */
  getQuestopediaObjectivesWindow()
  {
    return this._j._omni._quest._pediaObjectives;
  }

  /**
   * Set the currently tracked questopedia objectives window to the given window.
   * @param {Window_QuestopediaObjectives} listWindow The questopedia objectives window to track.
   */
  setQuestopediaObjectivesWindow(listWindow)
  {
    this._j._omni._quest._pediaObjectives = listWindow;
  }

  //endregion objectives window
  //endregion windows

  /**
   * Synchronize the detail window with the list window of the questopedia.
   */
  onQuestopediaIndexChange()
  {
    // grab the list window.
    const listWindow = this.getQuestopediaListWindow();

    // grab the detail window.
    const detailWindow = this.getQuestopediaDetailWindow();

    // grab the objectives window.
    const objectivesWindow = this.getQuestopediaObjectivesWindow();

    // grab the highlighted enemy's extra data, their observations.
    const highlightedQuestEntry = listWindow.currentExt();

    // check if there was no highlighted option.
    if (!highlightedQuestEntry)
    {
      // empty the contents of the detail and objectives.
      detailWindow.clearContent();
      objectivesWindow.clearContent();
      return;
    }

    // sync the detail window with the currently-highlighted quest.
    detailWindow.setCurrentQuest(highlightedQuestEntry);
    detailWindow.refresh();

    // sync the objectives window with the currently-highlighted quest.
    objectivesWindow.setCurrentObjectives(highlightedQuestEntry.objectives);
    objectivesWindow.refresh();
  }

  onQuestopediaCategoryChange()
  {
    // grab the categories window.
    const categoriesWindow = this.getQuestopediaCategoriesWindow();

    // grab the list window.
    const listWindow = this.getQuestopediaListWindow();

    // update the list window with the new category.
    listWindow.setCurrentCategoryKey(categoriesWindow.currentSymbol());

    listWindow.refresh();

    // trigger a potential questopedia index change.
    this.onQuestopediaIndexChange();

    console.log(`changed to category: ${categoriesWindow.currentSymbol()}`);
  }

  /**
   * Triggered when the player hits the OK button on a quest.<br/>
   * This marks a quest as "tracked".
   */
  onQuestopediaListSelection()
  {
    // grab the list window of quests.
    const listWindow = this.getQuestopediaListWindow();

    // check the currently highlighted quest.
    const highlighted = listWindow.currentExt();

    // validate we have a selection and its not an empty list.
    if (highlighted)
    {
      // toggle whether or not this quest is tracked.
      highlighted.toggleTracked();
      console.log(`quest ${highlighted.key} is tracked: ${highlighted.isTracked()}`);
    }

    // refresh and reactivate the list.
    listWindow.refresh();
    listWindow.activate();
  }

  /**
   * Cycles forward or back through quest categories available.
   * @param {boolean} isForward True if cycling up(right) through the index, false if cycling down(left).
   */
  cycleQuestCategories(isForward = true)
  {
    // do not cycle quest categories if there is only one.
    if (QuestManager.categories().size <= 1) return;

    // grab the categories window.
    const categoriesWindow = this.getQuestopediaCategoriesWindow();
    const currentIndex = categoriesWindow.index();

    // cycle to the next.
    if (isForward)
    {
      // check if we are at the end of the list.
      if (categoriesWindow._list.length === currentIndex + 1)
      {
        categoriesWindow.select(0);
      }
      // this isn't the end of the list, so select the next entry.
      else
      {
        categoriesWindow.select(currentIndex + 1);
      }
    }
    // cycle to the previous.
    else
    {
      // check if we are at the beginning of the list.
      if (currentIndex === 0)
      {
        categoriesWindow.select(categoriesWindow._list.length - 1)
      }
      // this isn't the beginning of the list, so select the previous entry.
      else
      {
        categoriesWindow.select(currentIndex - 1);
      }
    }

    this.getQuestopediaListWindow()
      .activate();

    console.log(`old index: ${currentIndex}; new index: ${categoriesWindow.index()}.`);
  }

  /**
   * Close the questopedia and return to the main omnipedia.
   */
  onCancelQuestopedia()
  {
    // revert to the previous scene.
    SceneManager.pop();
  }
}

//endregion Scene_Questopedia