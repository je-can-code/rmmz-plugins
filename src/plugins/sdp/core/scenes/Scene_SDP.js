//region Scene_SDP
import StatDistributionPanel from './../__models/StatDistributionPanel.js';
import SdpFamilyFilter from '../managers/SdpFamilyFilter.js';
import Window_SdpList from '../windows/Window_SdpList.js';
import Window_SdpHeader from '../windows/Window_SdpHeader.js';
import Window_SdpParameterList from '../windows/Window_SdpParameterList.js';
import Window_SdpRewardList from '../windows/Window_SdpRewardList.js';
import Window_SdpMastery from '../windows/Window_SdpMastery.js';
import Window_SdpCart from '../windows/Window_SdpCart.js';
import Window_SdpConfirmation from '../windows/Window_SdpConfirmation.js';
import Window_SdpPoints from '../windows/Window_SdpPoints.js';
import Window_SdpHelp from '../windows/Window_SdpHelp.js';
import Window_SdpControlsHint from '../windows/Window_SdpControlsHint.js';
import Window_SdpFamilyStrip from '../windows/Window_SdpFamilyStrip.js';

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
     * Header strip for the hovered SDP (single-line name/rarity/flavor).
     * @type {Window_SdpHeader}
     */
    this._j._sdp._windows._sdpHeader = null;

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
     * Subgroup mastery summary for the hovered panel (separate from rank rewards).
     * @type {Window_SdpMastery}
     */
    this._j._sdp._windows._sdpMastery = null;

    /**
     * The shopping cart window for planned rank-ups.
     * @type {Window_SdpCart}
     */
    this._j._sdp._windows._sdpCart = null;

    /**
     * The confirmation window that allows the user to confirm the rankup of a panel.
     * @type {Window_SdpConfirmation}
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
     * Family-filter strip above the panel list.
     * @type {Window_SdpFamilyStrip}
     */
    this._j._sdp._windows._sdpFamilyStrip = null;

    /**
     * The controller-first shopping cart of queued rankups by panel key.
     * @type {Map<string, number>}
     */
    this._j._sdp._cart = new Map();

    /**
     * L2/R2 family-filter cycle keys for the current menu actor.
     * @type {string[]}
     */
    this._j._sdp._familyFilterCycle = [];

    /**
     * Index into {@link this._j._sdp._familyFilterCycle}.
     * @type {number}
     */
    this._j._sdp._familyFilterIndex = 0;

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
   * Overwrites {@link #createButtons}.<br/>
   * Removes the rendering of buttons from this scene.
   */
  createButtons()
  {
  }

  //endregion create

  //region windows
  /**
   * Pixel width shared by the center column windows.
   * @returns {number}
   */
  sdpCenterColumnWidth()
  {
    return 720;
  }

  /**
   * Creates all windows associated with the SDP scene.
   */
  createAllWindows()
  {
    // display data windows.
    this.createSdpPointsWindow();
    this.createSdpFamilyStripWindow();
    this.createSdpHeaderWindow();
    this.createSdpControlsHintWindow();
    this.createSdpHelpWindow();

    // selectable data windows.
    this.createSdpListWindow();
    this.createSdpParameterListWindow();
    this.createSdpMasteryWindow();
    this.createSdpRewardListWindow();
    this.createSdpCartWindow();

    // this is last to ensure it shows up above other windows.
    this.createSdpConfirmationWindow();

    // the initial refresh to load all windows.
    this.rebuildFamilyFilterCycle();
    this.applyActiveFamilyFilter(false);
    this.onPanelHoveredChange();
  }

  //region family filter
  /**
   * Pixel height for the family strip above the panel list.
   * @returns {number}
   */
  sdpFamilyStripHeight()
  {
    const lineHeight = Window_Base.prototype.lineHeight();
    const pad = $gameSystem.windowPadding();

    return lineHeight + pad * 2;
  }

  /**
   * Creates the family-filter strip above the panel list.
   */
  createSdpFamilyStripWindow()
  {
    const window = this.buildSdpFamilyStripWindow();

    this.setSdpFamilyStripWindow(window);
    this.addWindow(window);
  }

  /**
   * Builds the family-filter strip window.
   * @returns {Window_SdpFamilyStrip}
   */
  buildSdpFamilyStripWindow()
  {
    const rectangle = this.sdpFamilyStripRectangle();
    return new Window_SdpFamilyStrip(rectangle);
  }

  /**
   * Rectangle for the family strip sitting under the points ribbon.
   * @returns {Rectangle}
   */
  sdpFamilyStripRectangle()
  {
    const pointsRect = this.sdpPointsRectangle();
    const width = pointsRect.width;
    const height = this.sdpFamilyStripHeight();
    const x = 0;
    const y = pointsRect.height;

    return new Rectangle(x, y, width, height);
  }

  /**
   * Gets the tracked family strip window.
   * @returns {Window_SdpFamilyStrip}
   */
  getSdpFamilyStripWindow()
  {
    return this._j._sdp._windows._sdpFamilyStrip;
  }

  /**
   * Sets the tracked family strip window.
   * @param {Window_SdpFamilyStrip} familyStripWindow
   */
  setSdpFamilyStripWindow(familyStripWindow)
  {
    this._j._sdp._windows._sdpFamilyStrip = familyStripWindow;
  }

  /**
   * Rebuilds the L2/R2 family cycle for the current menu actor.
   */
  rebuildFamilyFilterCycle()
  {
    const actor = $gameParty.menuActor();
    const cycle = SdpFamilyFilter.buildCycleForActor(actor);
    const previousKey = this.getActiveFamilyFilterKey();
    let nextIndex = cycle.indexOf(previousKey);

    if (nextIndex < 0)
    {
      nextIndex = 0;
    }

    this._j._sdp._familyFilterCycle = cycle;
    this._j._sdp._familyFilterIndex = nextIndex;
  }

  /**
   * Gets the active family-filter key from scene state.
   * @returns {string}
   */
  getActiveFamilyFilterKey()
  {
    const cycle = this._j._sdp._familyFilterCycle;

    if (cycle.length === 0)
    {
      return SdpFamilyFilter.ALL;
    }

    return cycle[this._j._sdp._familyFilterIndex | 0] ?? SdpFamilyFilter.ALL;
  }

  /**
   * Applies the active family filter to the strip and panel list.
   * @param {boolean} clampSelection When true, clamp list selection after refresh.
   */
  applyActiveFamilyFilter(clampSelection = true)
  {
    const filterKey = this.getActiveFamilyFilterKey();
    const listWindow = this.getSdpListWindow();

    this.getSdpFamilyStripWindow()
      .setFilterKey(filterKey);
    listWindow.setFamilyFilterKey(filterKey);

    if (clampSelection === false)
    {
      return;
    }

    this.clampSdpListSelection();
  }

  /**
   * Keeps the panel list selection in bounds after a filter refresh.
   */
  clampSdpListSelection()
  {
    const listWindow = this.getSdpListWindow();
    const commandCount = listWindow.commandList().length;

    if (commandCount === 0)
    {
      listWindow.deselect();
      return;
    }

    if (listWindow.index() >= commandCount)
    {
      listWindow.select(commandCount - 1);
    }
  }

  /**
   * Cycles the family filter forward or backward.
   * @param {boolean} isForward
   */
  cycleFamilyFilters(isForward = true)
  {
    const cycle = this._j._sdp._familyFilterCycle;

    if (cycle.length <= 1)
    {
      SoundManager.playBuzzer();
      this.getSdpListWindow()
        .activate();
      return;
    }

    const currentIndex = this._j._sdp._familyFilterIndex | 0;
    const delta = isForward
      ? 1
      : -1;
    const nextIndex = (currentIndex + delta + cycle.length) % cycle.length;

    this._j._sdp._familyFilterIndex = nextIndex;
    this.applyActiveFamilyFilter();
    this.onPanelHoveredChange();
    this.getSdpListWindow()
      .activate();
  }
  //endregion family filter

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
    window.setHandler('context', this.onFilterPanels.bind(this));
    window.setHandler('cart-dec', this.onCartLevelDecrease.bind(this));
    window.setHandler('cart-inc', this.onCartLevelIncrease.bind(this));
    window.setHandler('content-next', this.cycleFamilyFilters.bind(this, true));
    window.setHandler('content-prev', this.cycleFamilyFilters.bind(this, false));
    window.setHandler('actor-next', this.cycleMembers.bind(this, true));
    window.setHandler('actor-prev', this.cycleMembers.bind(this, false));
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
    const familyStripHeight = this.sdpFamilyStripHeight();

    // width shares the left ribbon with {@link #sdpPointsRectangle} (scaled up for larger menu fonts).
    const width = 480;

    // determine the modifier of the height for fitting properly..
    const hintH = this.sdpControlsHintHeight();
    const heightFit = (pointsRectangle.height + familyStripHeight + this.sdpHelpRectangle().height + hintH) + 8;
    const height = Graphics.height - heightFit;

    // determine the x:y coordinates.
    const x = 0;
    const y = pointsRectangle.height + familyStripHeight;

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

    return window;
  }

  /**
   * Gets the rectangle associated with the parameter list command window.
   * @returns {Rectangle}
   */
  sdpParameterListRectangle()
  {
    const listRect = this.sdpListRectangle();
    const headerH = this.sdpHeaderRectangle().height;
    const helpH = this.sdpHelpRectangle().height;
    const hintH = this.sdpControlsHintHeight();

    const x = listRect.width;
    const y = headerH;
    const width = this.sdpCenterColumnWidth();
    const height = Graphics.boxHeight - helpH - headerH - hintH;

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
   * @returns {Window_SdpRewardList}
   */
  buildSdpRewardListWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.sdpRewardListRectangle();

    // create the window with the rectangle.
    const window = new Window_SdpRewardList(rectangle);

    window.deselect();
    window.deactivate();

    return window;
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

  //region mastery window
  /**
   * Creates the mastery summary window above rank rewards.
   */
  createSdpMasteryWindow()
  {
    const window = this.buildSdpMasteryWindow();

    this.setSdpMasteryWindow(window);
    this.addWindow(window);
  }

  /**
   * Builds the read-only mastery strip for the hovered panel.
   * @returns {Window_SdpMastery}
   */
  buildSdpMasteryWindow()
  {
    const rectangle = this.sdpMasteryRectangle();
    const window = new Window_SdpMastery(rectangle);

    return window;
  }

  /**
   * Gets the tracked mastery window.
   * @returns {Window_SdpMastery}
   */
  getSdpMasteryWindow()
  {
    return this._j._sdp._windows._sdpMastery;
  }

  /**
   * Sets the tracked mastery window.
   * @param {Window_SdpMastery} masteryWindow The mastery window to track.
   */
  setSdpMasteryWindow(masteryWindow)
  {
    this._j._sdp._windows._sdpMastery = masteryWindow;
  }
  //endregion mastery window

  //region cart window
  /**
   * Creates the window for planned ("cart") panel rankups.
   */
  createSdpCartWindow()
  {
    const window = this.buildSdpCartWindow();

    this.setSdpCartWindow(window);
    this.addWindow(window);
  }

  /**
   * Builds the cart window (shares the right column with rewards).
   * @returns {Window_SdpCart}
   */
  buildSdpCartWindow()
  {
    const rectangle = this.sdpCartRectangle();
    const window = new Window_SdpCart(rectangle);

    // this is display-only; it should never be selected/scrollable via controller.
    window.deselect();
    window.deactivate();

    return window;
  }

  /**
   * Gets the tracked cart window.
   * @returns {Window_SdpCart}
   */
  getSdpCartWindow()
  {
    return this._j._sdp._windows._sdpCart;
  }

  /**
   * Sets the tracked cart window.
   * @param {Window_SdpCart} cartWindow The cart window to track.
   */
  setSdpCartWindow(cartWindow)
  {
    this._j._sdp._windows._sdpCart = cartWindow;
  }
  //endregion cart window

  /**
   * Shared geometry for the right column (mastery, rewards, cart).
   * Cart height and y are pinned to the bottom half and must stay stable.
   * @returns {{ x: number, topY: number, width: number, cartY: number, cartHeight: number, topRegionHeight: number, gap: number }}
   */
  sdpRightColumnMetrics()
  {
    const sdpListRect = this.sdpListRectangle();
    const centerW = this.sdpCenterColumnWidth();
    const { height: headerH } = this.sdpHeaderRectangle();

    const x = sdpListRect.width + centerW;
    const topY = headerH;
    const width = Graphics.boxWidth - x;
    const bottom = this.sdpRightColumnBottom();
    const gap = this.sdpRightColumnSplitGap();
    const fullHeight = bottom - topY;
    const cartHeight = Math.floor((fullHeight - gap) / 2);
    const cartY = bottom - cartHeight;
    const topRegionHeight = cartY - topY - gap;

    return {
      x,
      topY,
      width,
      cartY,
      cartHeight,
      topRegionHeight,
      gap,
    };
  }

  /**
   * Pixel height for the mastery summary strip (two text rows + chrome).
   * @returns {number}
   */
  sdpMasteryWindowHeight()
  {
    // matches {@link Window_SdpHeader} — two full text rows.
    return 108;
  }

  /**
   * Rectangle for the mastery window at the top of the right column.
   * @returns {Rectangle}
   */
  sdpMasteryRectangle()
  {
    const metrics = this.sdpRightColumnMetrics();
    const height = this.sdpMasteryWindowHeight();

    return new Rectangle(metrics.x, metrics.topY, metrics.width, height);
  }

  /**
   * Rectangle for the cart window, occupying the bottom half of the right column.
   * @returns {Rectangle}
   */
  sdpCartRectangle()
  {
    const metrics = this.sdpRightColumnMetrics();

    return new Rectangle(metrics.x, metrics.cartY, metrics.width, metrics.cartHeight);
  }

  /**
   * Rectangle for the rewards window, filling the space between mastery and cart.
   * @returns {Rectangle}
   */
  sdpRewardListRectangle()
  {
    const metrics = this.sdpRightColumnMetrics();
    const masteryHeight = this.sdpMasteryWindowHeight();
    const y = metrics.topY + masteryHeight + metrics.gap;
    const height = metrics.cartY - y - metrics.gap;

    return new Rectangle(metrics.x, y, metrics.width, height);
  }

  /**
   * The bottom boundary for the right column (rewards + cart).
   * @returns {number}
   */
  sdpRightColumnBottom()
  {
    // help is not rendered under the right column; take the full height.
    return Graphics.boxHeight;
  }

  /**
   * The gap between rewards and cart windows.
   * @returns {number}
   */
  sdpRightColumnSplitGap()
  {
    // the window frames already create separation; keep the split tight.
    return 0;
  }

  //region header window
  /**
   * Creates the header window for the hovered SDP.
   */
  createSdpHeaderWindow()
  {
    const window = this.buildSdpHeaderWindow();

    this.setSdpHeaderWindow(window);
    this.addWindow(window);
  }

  /**
   * Builds the header window.
   * @returns {Window_SdpHeader}
   */
  buildSdpHeaderWindow()
  {
    const rectangle = this.sdpHeaderRectangle();
    return new Window_SdpHeader(rectangle);
  }

  /**
   * The rectangle for the header strip spanning the top row (right of points ribbon).
   * @returns {Rectangle}
   */
  sdpHeaderRectangle()
  {
    const pointsRect = this.sdpPointsRectangle();
    const { width: x } = pointsRect;
    const y = 0;
    const width = Graphics.boxWidth - x;
    // this header renders two full text rows; match Window_Base.fittingHeight(2).
    const height = 108;
    return new Rectangle(x, y, width, height);
  }

  /**
   * Gets the tracked header window.
   * @returns {Window_SdpHeader}
   */
  getSdpHeaderWindow()
  {
    return this._j._sdp._windows._sdpHeader;
  }

  /**
   * Sets the tracked header window.
   * @param {Window_SdpHeader} headerWindow The header window to track.
   */
  setSdpHeaderWindow(headerWindow)
  {
    this._j._sdp._windows._sdpHeader = headerWindow;
  }
  //endregion header window

  //region controls hint window
  /**
   * Pixel height reserved for the controller legend strip above {@link Window_SdpHelp}.
   * @returns {number}
   */
  sdpControlsHintHeight()
  {
    // must match {@link Window_Base#fittingHeight}(1): one text row + top/bottom window padding.
    // a height of 36 would leave ~12px of inner space after padding, so the hint text never shows.
    const lineHeight = Window_Base.prototype.lineHeight();
    const pad = $gameSystem.windowPadding();

    return lineHeight + pad * 2;
  }

  /**
   * Creates the controller hint strip (cart/checkout/filter legend).
   */
  createSdpControlsHintWindow()
  {
    const window = this.buildSdpControlsHintWindow();

    this.addWindow(window);
  }

  /**
   * Builds the controller hint window.
   * @returns {Window_SdpControlsHint}
   */
  buildSdpControlsHintWindow()
  {
    const rectangle = this.sdpControlsHintRectangle();
    const window = new Window_SdpControlsHint(rectangle);

    window.refresh();

    return window;
  }

  /**
   * Rectangle for the controller legend strip (left + center columns only).
   * @returns {Rectangle}
   */
  sdpControlsHintRectangle()
  {
    const hintH = this.sdpControlsHintHeight();
    const {
      y: helpY,
      width: helpWidth,
    } = this.sdpHelpRectangle();

    const x = 0;
    const y = helpY - hintH;
    const width = helpWidth;
    const height = hintH;

    return new Rectangle(x, y, width, height);
  }

  //endregion controls hint window

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
   * Sets up and defines the sdp help window.
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
    // help only needs to live under the left+center columns, not under the cart/rewards.
    const { width: ribbonW } = this.sdpPointsRectangle();
    const width = ribbonW + this.sdpCenterColumnWidth();
    // two description lines + padding; add slack so large menu fonts / drawTextEx do not clip the last line.
    const lineHeight = Window_Base.prototype.lineHeight();
    const pad = $gameSystem.windowPadding();
    const height = lineHeight * 2 + pad * 2 + 24;
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
   * Gets the rectangle associated with the sdp points ribbon window.
   * @returns {Rectangle}
   */
  sdpPointsRectangle()
  {
    // upper-left ribbon; width matches {@link #sdpListRectangle} for a single vertical stripe.
    const width = 480;
    // header is now two lines; keep the full top band height.
    const height = 72;
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
    window.setHandler('panel-upgrade-ok', this.onUpgradeConfirm.bind(this));
    window.setHandler('panel-cart-ok', this.onCartCheckoutConfirm.bind(this));
    window.setHandler('panel-upgrade-cancel', this.onUpgradeCancel.bind(this));

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
    // sized for {@link Window_SdpConfirmation}: 4-line summary + 1-row horizontal choices + chrome.
    const windowPad = $gameSystem.windowPadding();
    const lh = Window_Base.prototype.lineHeight();
    const itemPad = 8;
    const summaryBlock = itemPad + lh * 4 + 8;
    const commandBlock = lh;
    const innerSlack = 16;
    const height = windowPad * 2 + summaryBlock + commandBlock + innerSlack;
    // cap leaves margins on the box; widened from legacy 560 so long panel names + "will be upgraded… level(s)." fit.
    const width = Math.min(Graphics.boxWidth - 48, 710);
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
    // if the cart has any planned purchases, confirm checkout.
    if (this._j._sdp._cart.size > 0)
    {
      this.openCartCheckoutConfirmation();
      return;
    }

    // otherwise, confirm a single rank-up of the hovered panel.
    this.openSingleUpgradeConfirmation();
  }

  /**
   * Opens the confirmation window for purchasing the queued cart.
   */
  openCartCheckoutConfirmation()
  {
    const window = this.getSdpConfirmationWindow();
    window.setMode('cart');
    window.setCartSummary(this.buildCartSummary($gameParty.menuActor()));
    window.refresh();
    window.show();
    window.open();
    window.activate();
    this.showModalDimmer(Scene_Base.MODAL_DIMMER_CONTENTS_OPACITY_DEFAULT, this.getSdpConfirmationWindow());
  }

  /**
   * Opens the confirmation window for purchasing a single rank-up.
   */
  openSingleUpgradeConfirmation()
  {
    const actor = $gameParty.menuActor();
    const panel = this.getSdpListWindow()
      .currentExt();
    const { currentRank } = actor.getSdpByKey(panel.key);
    const cost = panel.rankUpCost(currentRank);

    const window = this.getSdpConfirmationWindow();
    window.setMode('single');
    window.setSingleSummary(panel.name, cost, actor.getSdpPoints());
    window.refresh();
    window.show();
    window.open();
    window.activate();
    this.showModalDimmer(Scene_Base.MODAL_DIMMER_CONTENTS_OPACITY_DEFAULT, this.getSdpConfirmationWindow());
  }

  /**
   * Queues one more level for the currently hovered panel.
   */
  onCartLevelIncrease()
  {
    this.modifyHoveredPanelCartLevels(1);
  }

  /**
   * Removes one queued level for the currently hovered panel.
   */
  onCartLevelDecrease()
  {
    this.modifyHoveredPanelCartLevels(-1);
  }

  /**
   * Adds or removes queued levels for the hovered panel.
   * @param {number} delta The amount to adjust by.
   */
  modifyHoveredPanelCartLevels(delta)
  {
    const panel = this.getSdpListWindow()
      .currentExt();
    if (!panel)
    {
      return;
    }

    const actor = $gameParty.menuActor();
    const { key, maxRank } = panel;
    const { currentRank } = actor.getSdpByKey(key);
    const maxQueue = Math.max(0, maxRank - currentRank);

    const cart = this._j._sdp._cart;
    const existing = cart.get(key) ?? 0;
    const next = Math.max(0, Math.min(existing + delta, maxQueue));

    if (next === 0)
    {
      cart.delete(key);
    }
    else
    {
      cart.set(key, next);
    }

    this.onPanelHoveredChange();
    this.getSdpListWindow()
      .activate();
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
    this.clampSdpListSelection();
  }

  /**
   * Attempts to execute all cart rankups in one go.
   * If the total cost cannot be afforded, nothing happens.
   */
  checkoutCart()
  {
    const actor = $gameParty.menuActor();
    const cart = this._j._sdp._cart;
    if (cart.size === 0)
    {
      return false;
    }

    // calculate the total cost of all queued rankups.
    let totalCost = 0;
    cart.forEach((levels, key) =>
    {
      const panel = J.SDP.Metadata.panelsMap.get(key);
      if (!panel)
      {
        return;
      }

      const { currentRank } = actor.getSdpByKey(key);
      for (let i = 0; i < levels; i++)
      {
        totalCost += panel.rankUpCost(currentRank + i);
      }
    });

    // if we can't afford it, do nothing.
    const wallet = actor.getSdpPoints();
    if (totalCost > wallet)
    {
      SoundManager.playBuzzer();
      return false;
    }

    // execute each rankup and track spending.
    cart.forEach((levels, key) =>
    {
      const panel = J.SDP.Metadata.panelsMap.get(key);
      if (!panel)
      {
        return;
      }

      const { currentRank } = actor.getSdpByKey(key);
      for (let i = 0; i < levels; i++)
      {
        const cost = panel.rankUpCost(currentRank + i);
        if (cost === 0)
        {
          return;
        }

        actor.modSdpPoints(-cost);
        actor.rankUpPanel(key);
        actor.modAccumulatedSpentSdpPoints(cost);
      }
    });

    // clear the cart after purchasing.
    this._j._sdp._cart.clear();

    // refresh everything.
    this.onPanelHoveredChange();
    this.getSdpListWindow()
      .activate();

    return true;
  }

  /**
   * Builds a summarized view of the cart for display/confirmation.
   * @param {Game_Actor} actor The actor whose wallet and ranks apply.
   * @returns {{
   *   panelCount: number,
   *   levelCount: number,
   *   totalCost: number,
   *   wallet: number,
   *   remaining: number,
   *   canAfford: boolean,
   *   solePanelName: string|null
   * }}
   */
  buildCartSummary(actor)
  {
    const cart = this._j._sdp._cart;
    const wallet = actor.getSdpPoints();
    let totalCost = 0;
    let levelCount = 0;
    let panelCount = 0;

    cart.forEach((levels, key) =>
    {
      const panel = J.SDP.Metadata.panelsMap.get(key);
      if (!panel)
      {
        return;
      }

      // count the entry.
      panelCount++;
      levelCount += levels;

      // compute the cumulative cost across the queued levels.
      const { currentRank } = actor.getSdpByKey(key);
      for (let i = 0; i < levels; i++)
      {
        totalCost += panel.rankUpCost(currentRank + i);
      }
    });

    const remaining = wallet - totalCost;
    const canAfford = remaining >= 0;

    let solePanelName = null;

    if (panelCount === 1)
    {
      cart.forEach((_levels, key) =>
      {
        const sole = J.SDP.Metadata.panelsMap.get(key);

        if (sole)
        {
          solePanelName = sole.name;
        }
      });
    }

    return {
      panelCount,
      levelCount,
      totalCost,
      wallet,
      remaining,
      canAfford,
      solePanelName,
    };
  }

  /**
   * Refreshes all windows in this scene on change of index in the list.
   */
  onPanelHoveredChange()
  {
    // validate panels are present before updating everything.
    const hasPanels = this.getSdpListWindow()
      .hasCommands();
    if (!hasPanels)
    {
      this.getSdpHeaderWindow()
        .setPanel(null);
      this.getSdpHeaderWindow()
        .refresh();
      this.getSdpMasteryWindow()
        .setPanel(null);
      this.getSdpMasteryWindow()
        .refresh();
      return;
    }

    // grab the current panel.
    /** @type {StatDistributionPanel} */
    const currentPanel = this.getSdpListWindow()
      .currentExt();

    // grab the current actor of the menu.
    const currentActor = $gameParty.menuActor();

    // update the actor associated with the sdp listing.
    this.getSdpListWindow()
      .setActor(currentActor);
    this.getSdpListWindow()
      .setCart(this._j._sdp._cart);

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

    // update the mastery strip — subgroup tier skills, not panelRewards rows.
    this.getSdpMasteryWindow()
      .setPanel(currentPanel);
    this.getSdpMasteryWindow()
      .refresh();

    // update the cart window with current planned purchases.
    this.getSdpCartWindow()
      .setCart(currentActor, this._j._sdp._cart);
    this.getSdpCartWindow()
      .refresh();

    // update the header window with name/rarity/flavor.
    this.getSdpHeaderWindow()
      .setPanel(currentPanel);
    this.getSdpHeaderWindow()
      .refresh();

    // update the text in the help window to reflect the description of the panel.
    // keep this window dedicated to description lines only (often 2 lines with escape codes).
    this.getSdpHelpWindow()
      .setText(currentPanel.description);

  }

  /**
   * Cycles the currently selected member to the next in the party.
   * @param {boolean} isForward Whether or not to cycle to the next member or previous.
   */
  cycleMembers(isForward = true)
  {
    // cart is actor-specific (wallet + rank curve); don't allow swapping while it has contents.
    if (this._j._sdp._cart.size > 0)
    {
      SoundManager.playBuzzer();
      this.getSdpListWindow()
        .activate();
      return;
    }

    // cycle the menu actors either forward or backward.
    isForward
      ? $gameParty.makeMenuActorNext()
      : $gameParty.makeMenuActorPrevious();

    // family cycle depends on which panels this actor has unlocked.
    this.rebuildFamilyFilterCycle();
    this.applyActiveFamilyFilter(false);

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
    this.hideModalDimmer();

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
   * Confirms and executes the queued cart rankups.
   */
  onCartCheckoutConfirm()
  {
    const didCheckout = this.checkoutCart();
    if (didCheckout === false)
    {
      return;
    }

    this.hideModalDimmer();

    // close the confirmation window.
    this.getSdpConfirmationWindow()
      .close();
    this.getSdpConfirmationWindow()
      .hide();

    // refocus back to the list window.
    this.getSdpListWindow()
      .activate();
  }

  /**
   * If the player opts to cancel the upgrade process, return to the list window.
   */
  onUpgradeCancel()
  {
    this.hideModalDimmer();

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

export default Scene_SDP;
//endregion Scene_SDP