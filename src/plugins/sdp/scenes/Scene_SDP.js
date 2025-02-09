//region Scene_SDP
/**
 * The scene for managing SDPs that the player has acquired.
 */
class Scene_SDP
  extends Scene_MenuBase
{
  /**
   * Calls this scene.
   */
  static callScene()
  {
    SceneManager.push(this);
  }

  //region init
  constructor()
  {
    // call super when having extended constructors.
    super();

    // jumpstart initialization on creation.
    this.initialize();
  }

  /**
   * Initializes all properties for this scene.
   */
  initMembers()
  {
    // perform original logic.
    super.initMembers();

    this._j ||= {};

    /**
     * A grouping of all properties associated with the sdp system.
     */
    this._j._sdp = {};

    /**
     * A grouping of all windows associated with this scene.
     */
    this._j._sdp._windows = {};

    /**
     * All panels that are unlocked by the party and available for ranking up.
     * @type {Window_SdpList}
     */
    this._j._sdp._windows._sdpList = null;

    /**
     * The list of parameters associated with the currently selected SDP.
     * @type {Window_SdpParameterList}
     */
    this._j._sdp._windows._sdpParameterList = null;

    /**
     * The list of rewards associated with the currently selected SDP.
     * @type {Window_SdpRewardList}
     */
    this._j._sdp._windows._sdpRewardList = null;

    /**
     * The confirmation window that allows the user to confirm the rankup of a panel.
     * @type {Window_SdpPoints}
     */
    this._j._sdp._windows._sdpConfirmation = null;

    /**
     * The points window that displays the current menu actor's SDP points.
     * @type {Window_SdpPoints}
     */
    this._j._sdp._windows._sdpPoints = null;

    /**
     * The help window that displays the description of the currently hovered SDP.
     * @type {Window_SdpHelp}
     */
    this._j._sdp._windows._sdpHelp = null;

    /**
     * The rank data window that displays the varioud rank-related details for
     * the currently hovered SDP.
     * @type {Window_SdpRankData}
     */
    this._j._sdp._windows._sdpRankData = null;
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
   * Overrides {@link #createButtons}.<br>
   * Removes the rendering of buttons from this scene.
   */
  createButtons()
  {
  }

  //endregion create

  //region windows
  /**
   * Creates all windows associated with the SDP scene.
   */
  createAllWindows()
  {
    // display data windows.
    this.createSdpPointsWindow();
    this.createSdpHelpWindow();
    this.createSdpRankDataWindow();

    // selectable data windows.
    this.createSdpListWindow();
    this.createSdpParameterListWindow();
    this.createSdpRewardListWindow();

    // this is last to ensure it shows up above other windows.
    this.createSdpConfirmationWindow();

    // the initial refresh to load all windows.
    this.onPanelHoveredChange();
  }

  //region sdp list window
  /**
   * Creates the list of SDPs available to the player.
   */
  createSdpListWindow()
  {
    // create the window.
    const window = this.buildSdpListWindow();

    // update the tracker with the new window.
    this.setSdpListWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  /**
   * Sets up and defines the sdp listing window.
   * @returns {Window_SdpList}
   */
  buildSdpListWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.sdpListRectangle();

    // create the window with the rectangle.
    const window = new Window_SdpList(rectangle);

    // configure the window input handlers.
    window.setHandler('cancel', this.popScene.bind(this));
    window.setHandler('ok', this.onSelectPanel.bind(this));
    window.setHandler('more', this.onFilterPanels.bind(this));
    window.setHandler('pagedown', this.cycleMembers.bind(this, true));
    window.setHandler('pageup', this.cycleMembers.bind(this, false));
    window.onIndexChange = this.onPanelHoveredChange.bind(this);

    // initialize with the current menu actor.
    window.setActor($gameParty.menuActor());

    // return the built and configured window.
    return window;
  }

  /**
   * Gets the rectangle associated with the sdp list command window.
   * @returns {Rectangle}
   */
  sdpListRectangle()
  {
    // grab the points rectangle for reference.
    const pointsRectangle = this.sdpPointsRectangle();

    // arbitrarily define the width.
    const width = 400;

    // determine the modifier of the height for fitting properly..
    const heightFit = (pointsRectangle.height + this.sdpHelpRectangle().height) + 8;
    const height = Graphics.height - heightFit;

    // determine the x:y coordinates.
    const x = 0;
    const y = pointsRectangle.height;

    // return the built rectangle.
    return new Rectangle(x, y, width, height);
  }

  /**
   * Gets the currently tracked sdp list window.
   * @returns {Window_SdpList}
   */
  getSdpListWindow()
  {
    return this._j._sdp._windows._sdpList;
  }

  /**
   * Set the currently tracked parameter list window to the given window.
   * @param {Window_SdpList} listWindow The parameter list window to track.
   */
  setSdpListWindow(listWindow)
  {
    this._j._sdp._windows._sdpList = listWindow;
  }

  //endregion sdp list window

  //region parameter list window
  /**
   * Creates the window for all parameters associated with the hovered SDP.
   */
  createSdpParameterListWindow()
  {
    // create the window.
    const window = this.buildSdpParameterListWindow();

    // update the tracker with the new window.
    this.setSdpParameterListWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  /**
   * Sets up and defines the sdp parameter listing window.
   * @returns {Window_SdpParameterList}
   */
  buildSdpParameterListWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.sdpParameterListRectangle();

    // create the window with the rectangle.
    const window = new Window_SdpParameterList(rectangle);

    window.deselect();
    window.deactivate();
    window.setActor($gameParty.menuActor());

    // return the built and configured omnipedia list window.
    return window;
  }

  /**
   * Gets the rectangle associated with the parameter list command window.
   * @returns {Rectangle}
   */
  sdpParameterListRectangle()
  {
    // define the width of the list.
    const width = 600;

    // calculate the X for where the origin of the list window should be.
    const x = this.sdpListRectangle().width;

    // define the height of the list.
    const height = Graphics.boxHeight - this.sdpHelpRectangle().height;

    // calculate the Y for where the origin of the list window should be.
    const y = 0;

    // build the rectangle to return.
    return new Rectangle(x, y, width, height);
  }

  /**
   * Gets the currently tracked parameter list window.
   * @returns {Window_SdpParameterList}
   */
  getSdpParameterListWindow()
  {
    return this._j._sdp._windows._sdpParameterList;
  }

  /**
   * Set the currently tracked parameter list window to the given window.
   * @param {Window_SdpParameterList} listWindow The parameter list window to track.
   */
  setSdpParameterListWindow(listWindow)
  {
    this._j._sdp._windows._sdpParameterList = listWindow;
  }

  //endregion parameter list window

  //region reward list window
  /**
   * Creates the window for all rewards associated with the hovered SDP.
   */
  createSdpRewardListWindow()
  {
    // create the window.
    const window = this.buildSdpRewardListWindow();

    // update the tracker with the new window.
    this.setSdpRewardListWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  /**
   * Sets up and defines the sdp reward listing window.
   * @returns {Window_SdpParameterList}
   */
  buildSdpRewardListWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.sdpRewardListRectangle();

    // create the window with the rectangle.
    const window = new Window_SdpRewardList(rectangle);

    window.deselect();
    window.deactivate();

    // return the built and configured omnipedia list window.
    return window;
  }

  /**
   * Gets the rectangle associated with the reward list command window.
   * @returns {Rectangle}
   */
  sdpRewardListRectangle()
  {
    const sdpListRect = this.sdpListRectangle();
    const parameterListRect = this.sdpParameterListRectangle();
    const helpRect = this.sdpHelpRectangle();

    // define the width of the list.
    const width = Graphics.boxWidth - parameterListRect.width - sdpListRect.width;

    // the rewards should render on the right side of the parameters.
    const x = parameterListRect.x + parameterListRect.width;

    // the shared modifier defining the height and y of this rectangle.
    const ymod = 200;

    // define the height of the list.
    const height = Graphics.boxHeight - helpRect.height - ymod;

    // calculate the Y for where the origin of the list window should be.
    const y = ymod;

    // build the rectangle to return.
    return new Rectangle(x, y, width, height);
  }

  /**
   * Gets the currently tracked reward list window.
   * @returns {Window_SdpRewardList}
   */
  getSdpRewardListWindow()
  {
    return this._j._sdp._windows._sdpRewardList;
  }

  /**
   * Set the currently tracked reward list window to the given window.
   * @param {Window_SdpRewardList} listWindow The reward list window to track.
   */
  setSdpRewardListWindow(listWindow)
  {
    this._j._sdp._windows._sdpRewardList = listWindow;
  }

  //endregion reward list window

  //region rank data window
  /**
   * Creates the rank data window that displays data related to the current
   * menu actor's ranking in the hovered SDP..
   */
  createSdpRankDataWindow()
  {
    // create the window.
    const window = this.buildSdpRankDataWindow();

    // update the tracker with the new window.
    this.setSdpRankDataWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  /**
   * Sets up and defines the sdp rank data window.
   * @returns {Window_SdpRankData}
   */
  buildSdpRankDataWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.sdpRankDataRectangle();

    // create the window with the rectangle.
    const window = new Window_SdpRankData(rectangle);

    // return the built and configured window.
    return window;
  }

  /**
   * Gets the rectangle associated with the rank data window.
   * @returns {Rectangle}
   */
  sdpRankDataRectangle()
  {
    const parametersRect = this.sdpParameterListRectangle();

    const width = Graphics.boxWidth - (parametersRect.x + parametersRect.width);
    const height = Graphics.boxHeight - (this.sdpHelpRectangle().height + this.sdpRewardListRectangle().height);
    const x = (parametersRect.x + parametersRect.width);
    const y = 0;
    return new Rectangle(x, y, width, height);
  }

  /**
   * Gets the currently tracked rank data window.
   * @returns {Window_SdpRankData}
   */
  getSdpRankDataWindow()
  {
    return this._j._sdp._windows._sdpRankData;
  }

  /**
   * Set the currently tracked rank data window to the given window.
   * @param {Window_SdpRankData} rankDataWindow The rank data window to track.
   */
  setSdpRankDataWindow(rankDataWindow)
  {
    this._j._sdp._windows._sdpRankData = rankDataWindow;
  }

  //endregion rank data window

  //region help window
  /**
   * Creates the help window that provides contextual details to the player about the panel.
   */
  createSdpHelpWindow()
  {
    // create the window.
    const window = this.buildSdpHelpWindow();

    // update the tracker with the new window.
    this.setSdpHelpWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  /**
   * Sets up and defines the sdp listing window.
   * @returns {Window_SdpHelp}
   */
  buildSdpHelpWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.sdpHelpRectangle();

    // create the window with the rectangle.
    const window = new Window_SdpHelp(rectangle);

    // return the built and configured window.
    return window;
  }

  /**
   * Gets the rectangle associated with the sdp help window.
   * @returns {Rectangle}
   */
  sdpHelpRectangle()
  {
    const width = Graphics.boxWidth;
    const height = 100;
    const x = 0;
    const y = Graphics.boxHeight - height;
    return new Rectangle(x, y, width, height);
  }

  /**
   * Gets the currently tracked sdp help window.
   * @returns {Window_SdpHelp}
   */
  getSdpHelpWindow()
  {
    return this._j._sdp._windows._sdpHelp;
  }

  /**
   * Set the currently tracked help window to the given window.
   * @param {Window_SdpHelp} helpWindow The help window to track.
   */
  setSdpHelpWindow(helpWindow)
  {
    this._j._sdp._windows._sdpHelp = helpWindow;
  }

  // endregion help window

  //region points window
  /**
   * Creates the points window for displaying how many points the current actor has.
   */
  createSdpPointsWindow()
  {
    // create the window.
    const window = this.buildSdpPointsWindow();

    // update the tracker with the new window.
    this.setSdpPointsWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  /**
   * Sets up and defines the sdp points window.
   * @returns {Window_SdpPoints}
   */
  buildSdpPointsWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.sdpPointsRectangle();

    // create the window with the rectangle.
    const window = new Window_SdpPoints(rectangle);

    // also set the menu actor.
    window.setActor($gameParty.menuActor());

    // return the built and configured window.
    return window;
  }

  /**
   * Gets the rectangle associated with the sdp confirmation window.
   * @returns {Rectangle}
   */
  sdpPointsRectangle()
  {
    // the sdp points window sits in the upper-right-most corner.
    const width = 400;
    const height = 60;
    const x = 0;
    const y = 0;
    return new Rectangle(x, y, width, height);
  }

  /**
   * Gets the currently tracked sdp points window.
   * @returns {Window_SdpPoints}
   */
  getSdpPointsWindow()
  {
    return this._j._sdp._windows._sdpPoints;
  }

  /**
   * Set the currently tracked sdp points window to the given window.
   * @param {Window_SdpPoints} pointsWindow The window to track.
   */
  setSdpPointsWindow(pointsWindow)
  {
    this._j._sdp._windows._sdpPoints = pointsWindow;
  }

  //endregion points window

  //region confirmation window
  /**
   * Creates the confirmation window for confirming the rankup of an SDP.
   */
  createSdpConfirmationWindow()
  {
    // create the window.
    const window = this.buildSdpConfirmationWindow();

    // update the tracker with the new window.
    this.setSdpConfirmationWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  /**
   * Sets up and defines the sdp listing window.
   * @returns {Window_SdpConfirmation}
   */
  buildSdpConfirmationWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.sdpConfirmationRectangle();

    // create the window with the rectangle.
    const window = new Window_SdpConfirmation(rectangle);

    // configure the window input handlers.
    window.setHandler('cancel', this.onUpgradeCancel.bind(this));
    window.setHandler('ok', this.onUpgradeConfirm.bind(this));

    // hide it by default.
    window.hide();

    // return the built and configured window.
    return window;
  }

  /**
   * Gets the rectangle associated with the sdp confirmation window.
   * @returns {Rectangle}
   */
  sdpConfirmationRectangle()
  {
    const width = 350;
    const height = 120;
    const x = (Graphics.boxWidth - width) / 2;
    const y = (Graphics.boxHeight - height) / 2;
    return new Rectangle(x, y, width, height);
  }

  /**
   * Gets the currently tracked sdp confirmation window.
   * @returns {Window_SdpConfirmation}
   */
  getSdpConfirmationWindow()
  {
    return this._j._sdp._windows._sdpConfirmation;
  }

  /**
   * Set the currently tracked sdp confirmation window to the given window.
   * @param {Window_SdpConfirmation} confirmationWindow The window to track.
   */
  setSdpConfirmationWindow(confirmationWindow)
  {
    this._j._sdp._windows._sdpConfirmation = confirmationWindow;
  }

  //endregion confirmation window
  //endregion windows

  //region actions
  /**
   * When selecting a panel, bring up the confirmation window.
   */
  onSelectPanel()
  {
    // grab the confirmation window.
    const window = this.getSdpConfirmationWindow();

    // enable interaction with it.
    window.show();
    window.open();
    window.activate();
  }

  /**
   * Toggle the filtering out of already-maxed panels.
   */
  onFilterPanels()
  {
    // grab the window with the list of sdps.
    const sdpListWindow = this.getSdpListWindow();

    // toggle the filter.
    sdpListWindow.toggleNoMaxPanelsFilter();

    // trigger a refresh of windows.
    this.onPanelHoveredChange();

    // check if the index became out of bounds.
    if (sdpListWindow.index() >= sdpListWindow.commandList().length)
    {
      // correct the index to the last item.
      sdpListWindow.select(sdpListWindow.commandList().length - 1);
    }
  }

  /**
   * Refreshes all windows in this scene on change of index in the list.
   */
  onPanelHoveredChange()
  {
    // validate panels are present before updating everything.
    const hasPanels = this.getSdpListWindow()
      .hasCommands();
    if (!hasPanels) return;

    // grab the current panel.
    /** @type {StatDistributionPanel} */
    const currentPanel = this.getSdpListWindow()
      .currentExt();

    // grab the current actor of the menu.
    const currentActor = $gameParty.menuActor();

    // update the actor associated with the sdp listing.
    this.getSdpListWindow()
      .setActor(currentActor);

    // update the actor associated with the sdp point tracking.
    this.getSdpPointsWindow()
      .setActor(currentActor);

    // update the parameter list with the latest panel parameters.
    const parameterListWindow = this.getSdpParameterListWindow();
    parameterListWindow.setActor(currentActor);
    parameterListWindow.setParameters(currentPanel.panelParameters);
    parameterListWindow.refresh();

    // update the reward list with the latest panel rewards.
    const rewardListWindow = this.getSdpRewardListWindow();
    rewardListWindow.setRewards(currentPanel.panelRewards);
    rewardListWindow.refresh();

    // update the text in the help window to reflect the description of the panel.
    this.getSdpHelpWindow()
      .setText(currentPanel.description);

    // update the cost data window.
    const panelRanking = currentActor.getSdpByKey(currentPanel.key);
    this.getSdpRankDataWindow()
      .setRankData(
        currentPanel.getPanelRarityColorIndex(),
        currentPanel.getPanelRarityText(),
        panelRanking.currentRank,
        currentPanel.maxRank,
        currentPanel.rankUpCost(panelRanking.currentRank),
        currentActor.getSdpPoints());
    this.getSdpRankDataWindow()
      .refresh();
  }

  /**
   * Cycles the currently selected member to the next in the party.
   * @param {boolean} isForward Whether or not to cycle to the next member or previous.
   */
  cycleMembers(isForward = true)
  {
    // cycle the menu actors either forward or backward.
    isForward
      ? $gameParty.makeMenuActorNext()
      : $gameParty.makeMenuActorPrevious();

    // refresh everything.
    this.onPanelHoveredChange();

    // re-activate the list window.
    this.getSdpListWindow()
      .activate();
  }

  /**
   * If the player opts to upgrade the existing panel, remove the points and rank up the panel.
   */
  onUpgradeConfirm()
  {
    // grab the panel we're working with.
    const panel = this.getSdpListWindow()
      .currentExt();

    // grab the actor we're working with.
    const actor = $gameParty.menuActor();

    // get the panel ranking from the actor.
    const panelRanking = actor.getSdpByKey(panel.key);

    // determine the cost to rank up the panel.
    const panelRankupCost = panel.rankUpCost(panelRanking.currentRank);

    // reduce the points by a negative variant of the amount.
    actor.modSdpPoints(-panelRankupCost);

    // rank up the panel.
    actor.rankUpPanel(panel.key);

    // update the total spent points for this actor.
    actor.modAccumulatedSpentSdpPoints(panelRankupCost);

    // refresh all the windows after upgrading the panel.
    this.onPanelHoveredChange();

    // close the confirmation window.
    this.getSdpConfirmationWindow()
      .close();

    // refocus back to the list window.
    this.getSdpListWindow()
      .activate();
  }

  /**
   * If the player opts to cancel the upgrade process, return to the list window.
   */
  onUpgradeCancel()
  {
    // grab the confirmation window.
    const window = this.getSdpConfirmationWindow();

    // disable it from interaction.
    window.close();
    window.hide();

    // re-activate the main list window.
    this.getSdpListWindow()
      .activate();
  }

  //endregion actions
}

//endregion Scene_SDP