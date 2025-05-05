//region Scene_JaftingRefine
class Scene_JaftingRefine
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
  static KEY = 'jafting-refine';

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
     * A grouping of all properties associated with the jafting type of refinement.
     * Refinement is a subcategory of the jafting system.
     */
    this._j._crafting._refine = {};

    /**
     * The window that shows the tertiary information about a refinable.
     * @type {Window_RefinementDescription}
     */
    this._j._crafting._refine._refinementDescription = null;

    /**
     * The window that shows the list of equips that can be used as a base for refinement.
     * @type {Window_RefinableList}
     */
    this._j._crafting._refine._baseRefinableList = null;

    /**
     * The window that shows the list of equips that can be used as fodder for refinement.
     * @type {Window_RefinableList}
     */
    this._j._crafting._refine._consumedRefinableList = null;

    /**
     * The window that shows the details of the refinement given the selected entries.
     * @type {Window_RefinementDetails}
     */
    this._j._crafting._refine._refinementDetails = null;

    /**
     * The window that shows the list of ingredients on the currently selected recipe.
     * @type {Window_RecipeIngredientList}
     */
    this._j._crafting._refine._confirmationPrompt = null;


    /**
     * The window that shows the list of tools on the currently selected recipe.
     * @type {Window_RecipeToolList}
     */
    this._j._crafting._refine._baseSelected = null;

    /**
     * The window that shows the list of outputs on the currently selected recipe.
     * @type {Window_RecipeOutputList}
     */
    this._j._crafting._refine._consumedSelected = null;
  }

  getBaseSelected()
  {
    return this._j._crafting._refine._baseSelected;
  }

  setBaseSelected(equip)
  {
    this._j._crafting._refine._baseSelected = equip;
  }

  getConsumedSelected()
  {
    return this._j._crafting._refine._consumedSelected;
  }

  setConsumedSelected(equip)
  {
    this._j._crafting._refine._consumedSelected = equip;
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
    this.createRefinementDescriptionWindow();
    this.createBaseRefinableListWindow();
    this.createConsumableRefinableListWindow();
    this.createRefinementDetailsWindow();
    this.createRefinementConfirmationWindow();
  }

  /**
   * Configures all windows.
   */
  configureAllWindows()
  {
    const listWindow = this.getBaseRefinableListWindow();

    // also update with the currently selected item, if one exists.
    this.getRefinementDescriptionWindow()
      .setText(listWindow.currentHelpText() ?? String.empty);

    const selected = listWindow.currentExt();
    this.setBaseSelected(selected.data);

    const detailsWindow = this.getRefinementDetailsWindow();
    detailsWindow.primaryEquip = selected?.data;
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

  //region refinement description
  /**
   * Creates the RefinementDescription window.
   */
  createRefinementDescriptionWindow()
  {
    // create the window.
    const window = this.buildRefinementDescriptionWindow();

    // update the tracker with the new window.
    this.setRefinementDescriptionWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  buildRefinementDescriptionWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.getRefinementDescriptionRectangle();

    // create the window with the rectangle.
    const window = new Window_RefinementDescription(rectangle);

    // return the built and configured window.
    return window;
  }

  /**
   * Gets the rectangle associated with this window.
   * @returns {Rectangle}
   */
  getRefinementDescriptionRectangle()
  {
    // grab the rect for the recipe list this should be next to.
    const listWindow = this.getBaseRefinableListRectangle();

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
   * Gets the RefinementDescription window being tracked.
   */
  getRefinementDescriptionWindow()
  {
    return this._j._crafting._refine._refinementDescription;
  }

  /**
   * Sets the RefinementDescription window tracking.
   */
  setRefinementDescriptionWindow(someWindow)
  {
    this._j._crafting._refine._refinementDescription = someWindow;
  }

  //endregion refinement description

  //region base refinable list
  /**
   * Creates the base RefinableList window.
   */
  createBaseRefinableListWindow()
  {
    // create the window.
    const window = this.buildRefinableListWindow();

    // update the tracker with the new window.
    this.setBaseRefinableListWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  buildRefinableListWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.getBaseRefinableListRectangle();

    // create the window with the rectangle.
    const window = new Window_RefinableList(rectangle);

    // designate this refinable list window as the primary.
    window.isPrimary = true;

    // assign cancel functionality.
    window.setHandler('cancel', this.onBaseRefinableListCancel.bind(this));

    // assign on-select functionality.
    window.setHandler('ok', this.onBaseRefinableListSelection.bind(this));

    // overwrite the onIndexChange hook with our local hook.
    window.onIndexChange = this.onBaseRefinableListIndexChange.bind(this);

    // return the built and configured window.
    return window;
  }

  /**
   * Gets the rectangle associated with this window.
   * @returns {Rectangle}
   */
  getBaseRefinableListRectangle()
  {
    // the window's origin coordinates are the box window's origin as well.
    const [ x, y ] = Graphics.boxOrigin;

    // define the width of the window.
    const width = 350;

    // define the height of the window.
    const height = Graphics.boxHeight - (Graphics.verticalPadding);

    // build the rectangle to return.
    return new Rectangle(x, y, width, height);
  }

  /**
   * Gets the RefinableList window being tracked.
   */
  getBaseRefinableListWindow()
  {
    return this._j._crafting._refine._baseRefinableList;
  }

  /**
   * Sets the RefinableList window tracking.
   */
  setBaseRefinableListWindow(someWindow)
  {
    this._j._crafting._refine._baseRefinableList = someWindow;
  }

  selectBaseRefinableListWindow()
  {
    // grab the window.
    const listWindow = this.getBaseRefinableListWindow();

    // reveal the window.
    listWindow.show();
    listWindow.activate();

    this.getRefinementDescriptionWindow()
      .setText(listWindow.currentHelpText());
  }

  deselectBaseRefinableListWindow()
  {
    // grab the window.
    const listWindow = this.getBaseRefinableListWindow();

    // reveal the window.
    listWindow.hide();
    listWindow.deactivate();
  }

  onBaseRefinableListIndexChange()
  {
    const listWindow = this.getBaseRefinableListWindow();

    const helpText = listWindow.currentHelpText();
    this.getRefinementDescriptionWindow()
      .setText(helpText ?? String.empty);

    const baseRefinable = listWindow.currentExt();
    this.getRefinementDetailsWindow().primaryEquip = baseRefinable?.data;
  }

  onBaseRefinableListCancel()
  {
    // revert to the previous scene.
    SceneManager.pop();
  }

  onBaseRefinableListSelection()
  {
    const baseRefinableListWindow = this.getBaseRefinableListWindow();

    const baseRefinable = baseRefinableListWindow.currentExt().data;
    this.setBaseSelected(baseRefinable);

    this.deselectBaseRefinableListWindow();
    this.selectConsumableRefinableListWindow();
  }

  //endregion base refinable list

  //region consumable refinable list
  /**
   * Creates the consumable RefinableList window.
   */
  createConsumableRefinableListWindow()
  {
    // create the window.
    const window = this.buildConsumableRefinableListWindow();

    // update the tracker with the new window.
    this.setConsumableRefinableListWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  buildConsumableRefinableListWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.getConsumableRefinableListRectangle();

    // create the window with the rectangle.
    const window = new Window_RefinableList(rectangle);

    // assign cancel functionality.
    window.setHandler('cancel', this.onConsumableRefinableListCancel.bind(this));

    // assign on-select functionality.
    window.setHandler('ok', this.onConsumableRefinableListSelection.bind(this));

    // overwrite the onIndexChange hook with our local hook.
    window.onIndexChange = this.onConsumableRefinableListIndexChange.bind(this);

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
  getConsumableRefinableListRectangle()
  {
    // the window's origin coordinates are the box window's origin as well.
    const [ x, y ] = Graphics.boxOrigin;

    // define the width of the window.
    const width = 350;

    // define the height of the window.
    const height = Graphics.boxHeight - (Graphics.verticalPadding);

    // build the rectangle to return.
    return new Rectangle(x, y, width, height);
  }

  /**
   * Gets the consumable RefinableList window being tracked.
   */
  getConsumableRefinableListWindow()
  {
    return this._j._crafting._refine._consumedRefinableList;
  }

  /**
   * Sets the consumable RefinableList window tracking.
   */
  setConsumableRefinableListWindow(someWindow)
  {
    this._j._crafting._refine._consumedRefinableList = someWindow;
  }

  selectConsumableRefinableListWindow()
  {
    // grab the window.
    const listWindow = this.getConsumableRefinableListWindow();

    // reveal the window.
    listWindow.baseSelection = this.getBaseSelected();
    listWindow.refresh();
    listWindow.show();
    listWindow.activate();

    const selected = listWindow.currentExt()?.data;
    this.setConsumedSelected(selected);
    this.getRefinementDetailsWindow().secondaryEquip = selected;

    this.getRefinementDescriptionWindow()
      .setText(listWindow.currentHelpText());

  }

  deselectConsumableRefinableListWindow()
  {
    // grab the window.
    const listWindow = this.getConsumableRefinableListWindow();

    // reveal the window.
    listWindow.hide();
    listWindow.deactivate();
  }

  onConsumableRefinableListIndexChange()
  {
    const listWindow = this.getConsumableRefinableListWindow();

    const helpText = listWindow.currentHelpText();
    this.getRefinementDescriptionWindow()
      .setText(helpText ?? String.empty);

    const consumedRefinable = listWindow.currentExt();
    this.getRefinementDetailsWindow().secondaryEquip = consumedRefinable.data;
  }

  onConsumableRefinableListCancel()
  {
    this.deselectConsumableRefinableListWindow();

    this.selectBaseRefinableListWindow();
  }

  onConsumableRefinableListSelection()
  {
    const listWindow = this.getConsumableRefinableListWindow();

    const consumedRefinable = listWindow.currentExt().data;
    this.setConsumedSelected(consumedRefinable);

    //this.deselectConsumableRefinableListWindow();
    this.selectRefinementConfirmationWindow();
  }

  //endregion consumable refinable list

  //region refinement details
  /**
   * Creates the RefinementDetails window.
   */
  createRefinementDetailsWindow()
  {
    // create the window.
    const window = this.buildRefinementDetailsWindow();

    // update the tracker with the new window.
    this.setRefinementDetailsWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  buildRefinementDetailsWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.getRefinementDetailsRectangle();

    // create the window with the rectangle.
    const window = new Window_RefinementDetails(rectangle);

    // return the built and configured window.
    return window;
  }

  /**
   * Gets the rectangle associated with this window.
   * @returns {Rectangle}
   */
  getRefinementDetailsRectangle()
  {
    const widthReduction = this.getBaseRefinableListRectangle().width + Graphics.horizontalPadding;
    const x = 0 + widthReduction;

    const heightReduction = (this.getRefinementDescriptionWindow().height + Graphics.verticalPadding);
    const y = 0 + heightReduction;

    // define the width of the window.
    const width = Graphics.boxWidth - widthReduction;

    // define the height of the window.
    const height = Graphics.boxHeight - heightReduction;

    // build the rectangle to return.
    return new Rectangle(x, y, width, height);
  }

  /**
   * Gets the RefinementDetails window being tracked.
   */
  getRefinementDetailsWindow()
  {
    return this._j._crafting._refine._refinementDetails;
  }

  /**
   * Sets the RefinementDetails window tracking.
   */
  setRefinementDetailsWindow(someWindow)
  {
    this._j._crafting._refine._refinementDetails = someWindow;
  }

  //endregion refinement details

  //region confirmation prompt
  /**
   * Creates the RefinementConfirmation window.
   */
  createRefinementConfirmationWindow()
  {
    // create the window.
    const window = this.buildRefinementConfirmationWindow();

    // update the tracker with the new window.
    this.setRefinementConfirmationWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  buildRefinementConfirmationWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.getRefinementConfirmationRectangle();

    // create the window with the rectangle.
    const window = new Window_RefinementConfirmation(rectangle);

    // assign cancel functionality.
    window.setHandler('cancel', this.onRefinementConfirmationCancel.bind(this));

    // assign on-select functionality.
    window.setHandler('ok', this.onRefinementConfirmationSelection.bind(this));

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
  getRefinementConfirmationRectangle()
  {
    // define the width of the window.
    const width = 350;

    // define the height of the window.
    const height = 120;

    // define the window's origin coordinates.
    const x = (Graphics.boxWidth - width) / 2;
    const y = (Graphics.boxHeight - height) / 2;

    // build the rectangle to return.
    return new Rectangle(x, y, width, height);
  }

  /**
   * Gets the RefinementConfirmation window being tracked.
   */
  getRefinementConfirmationWindow()
  {
    return this._j._crafting._refine._confirmationPrompt;
  }

  selectRefinementConfirmationWindow()
  {
    // grab the window.
    const listWindow = this.getRefinementConfirmationWindow();

    // reveal the window.
    listWindow.show();
    listWindow.activate();
  }

  deselectRefinementConfirmationWindow()
  {
    // grab the window.
    const listWindow = this.getRefinementConfirmationWindow();

    // reveal the window.
    listWindow.hide();
    listWindow.deactivate();
  }

  /**
   * Sets the RefinementConfirmation window tracking.
   */
  setRefinementConfirmationWindow(someWindow)
  {
    this._j._crafting._refine._confirmationPrompt = someWindow;
  }

  onRefinementConfirmationCancel()
  {
    this.deselectRefinementConfirmationWindow();
    this.selectConsumableRefinableListWindow();
  }

  onRefinementConfirmationSelection()
  {
    // remove the materials being refined.
    $gameParty.gainItem(this.getBaseSelected(), -1);
    $gameParty.gainItem(this.getConsumedSelected(), -1);

    // generate the output.
    const detailsWindow = this.getRefinementDetailsWindow();
    const output = detailsWindow.outputEquip;
    JaftingManager.createRefinedOutput(output);

    // clear the existing data from the details window.
    detailsWindow.primaryEquip = null;
    detailsWindow.secondaryEquip = null;

    // reselect the original window.
    this.deselectConsumableRefinableListWindow();
    this.deselectRefinementConfirmationWindow();
    this.selectBaseRefinableListWindow();

    // clear the materials that were just used.
    this.setBaseSelected(null);
    this.setConsumedSelected(null);

    const listWindow = this.getBaseRefinableListWindow();
    listWindow.refresh();
    listWindow.select(0);

    this.getConsumableRefinableListWindow()
      .refresh();
  }

  //endregion confirmation prompt
}

//endregion