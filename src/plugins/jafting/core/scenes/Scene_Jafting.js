//region Scene_Jafting
class Scene_Jafting
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
   * Initialize all properties for the root JAFTING hub scene.
   */
  initMembers()
  {
    // perform original logic.
    super.initMembers();

    // initialize the root-namespace definition members.
    this.initCoreMembers();

    // initialize the primary list and header windows.
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
   * The primary properties of the scene: the command list and header windows
   * for the root JAFTING menu.
   */
  initPrimaryMembers()
  {
    /**
     * The window that lists Creation, Refinement, and other registered JAFTING modes.
     * @type {Window_JaftingList}
     */
    this._j._crafting._commandList = null;

    /**
     * The window that displays at the top while the JAFTING list is active.
     * @type {Window_JaftingListHeader}
     */
    this._j._crafting._listHeader = null;
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
   * Creates all windows associated with this scene.
   */
  createAllWindows()
  {
    // create all root windows for the main listing.
    this.createJaftingRootWindows();
  }

  //endregion create

  //region windows
  /**
   * Creates the root-level JAFTING hub windows.
   */
  createJaftingRootWindows()
  {
    this.createJaftingListWindow();

    // create the header window.
    this.createJaftingListHeaderWindow();
  }

  //region header window
  /**
   * Creates a header window for the JAFTING command list.
   */
  createJaftingListHeaderWindow()
  {
    // create the window.
    const window = this.buildJaftingListHeaderWindow();

    // update the tracker with the new window.
    this.setJaftingListHeaderWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  /**
   * Sets up and defines the JAFTING list header window.
   * @returns {Window_JaftingListHeader}
   */
  buildJaftingListHeaderWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.jaftingListHeaderRectangle();

    // create the window with the rectangle.
    const window = new Window_JaftingListHeader(rectangle);

    window.refresh();

    return window;
  }

  /**
   * Gets the rectangle associated with the JAFTING list header window.
   * @returns {Rectangle}
   */
  jaftingListHeaderRectangle()
  {
    // define the width of the list.
    const width = 1000;

    // determine the x based on the width.
    const x = (Graphics.boxWidth / 2) - (width * 0.5);

    // define the height of the rectangle.
    const height = 100;

    // arbitrarily decide the y.
    const y = 100;

    // build the rectangle to return.
    return new Rectangle(x, y, width, height);
  }

  /**
   * Gets the currently tracked JAFTING list header window.
   * @returns {Window_JaftingListHeader}
   */
  getJaftingListHeaderWindow()
  {
    return this._j._crafting._listHeader;
  }

  /**
   * Set the currently tracked JAFTING list header window to the given window.
   * @param {Window_JaftingListHeader} listHeaderWindow The header window to track.
   */
  setJaftingListHeaderWindow(listHeaderWindow)
  {
    this._j._crafting._listHeader = listHeaderWindow;
  }

  /**
   * Opens the root header window.
   */
  openRootHeaderWindow()
  {
    // grab the root header window.
    const rootHeaderWindow = this.getJaftingListHeaderWindow();

    // open and show the root header window.
    rootHeaderWindow.open();
    rootHeaderWindow.show();
  }

  /**
   * Closes the root header window.
   */
  closeRootHeaderWindow()
  {
    // grab the root header window.
    const rootHeaderWindow = this.getJaftingListHeaderWindow();

    // close and hide the root header window.
    rootHeaderWindow.close();
    rootHeaderWindow.hide();
  }

  //endregion header window

  //region list window
  /**
   * Creates the list of JAFTING modes available to the player.
   */
  createJaftingListWindow()
  {
    // create the window.
    const window = this.buildJaftingListWindow();

    // update the tracker with the new window.
    this.setJaftingListWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  /**
   * Sets up and defines the JAFTING command list window.
   * @returns {Window_JaftingList}
   */
  buildJaftingListWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.jaftingListRectangle();

    // create the window with the rectangle.
    const window = new Window_JaftingList(rectangle);

    // assign cancel functionality.
    window.setHandler('cancel', this.popScene.bind(this));

    // assign on-select functionality.
    window.setHandler('ok', this.onRootJaftingSelection.bind(this));

    return window;
  }

  /**
   * Gets the rectangle associated with the JAFTING command list window.
   * @returns {Rectangle}
   */
  jaftingListRectangle()
  {
    // define the width of the list.
    const width = 800;

    // calculate the X for where the origin of the list window should be.
    const x = (Graphics.boxWidth / 2) - (width * 0.5);

    // define the height of the list.
    const height = 240;

    // calculate the Y for where the origin of the list window should be.
    const y = (Graphics.boxHeight / 2) - (height * 0.5);

    // build the rectangle to return.
    return new Rectangle(x, y, width, height);
  }

  /**
   * Gets the currently tracked JAFTING command list window.
   * @returns {Window_JaftingList}
   */
  getJaftingListWindow()
  {
    return this._j._crafting._commandList;
  }

  /**
   * Set the currently tracked JAFTING command list window to the given window.
   * @param {Window_JaftingList} listWindow The list window to track.
   */
  setJaftingListWindow(listWindow)
  {
    this._j._crafting._commandList = listWindow;
  }

  /**
   * Opens the root list window and activates it.
   */
  openRootListWindow()
  {
    const rootListWindow = this.getJaftingListWindow();

    // open, show, and activate the root list window.
    rootListWindow.open();
    rootListWindow.show();
    rootListWindow.activate();
  }

  /**
   * Closes the root list window.
   */
  closeRootListWindow()
  {
    const rootListWindow = this.getJaftingListWindow();

    // close and deactivate the root list window.
    rootListWindow.close();
    rootListWindow.deactivate();
  }

  /**
   * Gets the current symbol of the root JAFTING list (the highlighted command key).
   * @returns {string}
   */
  getRootJaftingKey()
  {
    return this.getJaftingListWindow()
      .currentSymbol();
  }

  //endregion list window

  /**
   * Opens all windows associated with the root JAFTING hub.
   */
  openRootJaftingWindows()
  {
    // open the root list window.
    this.openRootListWindow();

    // open the root header window.
    this.openRootHeaderWindow();
  }

  /**
   * Closes all windows associated with the root JAFTING hub.
   */
  closeRootJaftingWindows()
  {
    // close the list window.
    this.closeRootListWindow();

    // close the header window.
    this.closeRootHeaderWindow();
  }

  //endregion windows

  //region actions
  //region root actions
  /**
   * When a jafting choice is made, execute this logic.
   * This is only implemented/extended by the jafting types.
   */
  onRootJaftingSelection()
  {
  }

  //endregion root actions
  //endregion actions
}

//endregion Scene_Jafting