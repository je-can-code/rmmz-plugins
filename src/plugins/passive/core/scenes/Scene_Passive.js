//region Scene_Passive
import Window_PassiveActorRibbon from '../windows/Window_PassiveActorRibbon.js';
import Window_PassiveDetail from '../windows/Window_PassiveDetail.js';
import Window_PassiveList from '../windows/Window_PassiveList.js';
import Window_PassiveTabHeader from '../windows/Window_PassiveTabHeader.js';

/**
 * The dedicated viewer scene for all passive states applied to an actor.
 *
 * Passive states are grouped into tabs registered via {@link Scene_Passive.registerTab}.
 * The core always provides an "All" tab; extensions register additional tabs during
 * their own initialization phases (e.g. the OTIB ext registers an "Item Boosts" tab).
 *
 * Layout (top to bottom, left to right):
 * - Full-width tab header strip at the top
 * - Left column: scrollable state list (filtered by active tab)
 * - Right column: detail panel for the currently highlighted state
 */
class Scene_Passive
  extends Scene_MenuBase
{
  /**
   * Tab configurations in registration order; the core seeds the "All" tab first.
   * @type {Array<{key: string, label: string, filter: Function|null}>}
   */
  static _tabRegistry = [
    {
      key: 'all',
      label: 'All',
      filter: null,
    },
  ];

  static callScene()
  {
    SceneManager.push(this);
  }

  //region static tab registry
  /**
   * Registers a tab configuration with the passive viewer.
   * Tabs are displayed in registration order; "All" is always first.
   *
   * Config shape:
   * {
   *   key:    {string}            unique identifier for this tab
   *   label:  {string}            display label shown in the tab header
   *   filter: {Function|null}     (stateId, actor) => boolean, or null to show everything
   * }
   *
   * @param {{key: string, label: string, filter: Function|null}} config Tab configuration.
   */
  static registerTab(config)
  {
    this._tabRegistry.push(config);
  }

  /**
   * Gets all registered tab configurations in registration order.
   * @returns {Array<{key: string, label: string, filter: Function|null}>}
   */
  static registeredTabs()
  {
    return this._tabRegistry;
  }

  //endregion static tab registry

  //region init
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
   * Initializes all properties for this scene.
   */
  initMembers()
  {
    // perform original logic.
    super.initMembers();

    this._j ||= {};

    /**
     * A grouping of all properties associated with the passive viewer.
     */
    this._j._passive = {};

    /**
     * A grouping of all windows associated with this scene.
     */
    this._j._passive._windows = {};

    /**
     * The tab header strip window.
     * @type {Window_PassiveTabHeader}
     */
    this._j._passive._windows._tabHeader = null;

    /**
     * The actor identity ribbon above the state list.
     * @type {Window_PassiveActorRibbon}
     */
    this._j._passive._windows._actorRibbon = null;

    /**
     * The scrollable list of passive states for the active tab.
     * @type {Window_PassiveList}
     */
    this._j._passive._windows._list = null;

    /**
     * The detail panel for the currently highlighted passive state.
     * @type {Window_PassiveDetail}
     */
    this._j._passive._windows._detail = null;

    /**
     * The index of the currently active tab in the registry.
     * Index 0 is always the built-in "All" tab.
     * @type {number}
     */
    this._j._passive._tabIndex = 0;
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

  /**
   * Creates all windows associated with the passive viewer scene.
   */
  createAllWindows()
  {
    // create non-interactive display windows first.
    this.createPassiveTabHeaderWindow();
    this.createPassiveActorRibbonWindow();
    this.createPassiveDetailWindow();

    // create the interactive list window last so it draws on top.
    this.createPassiveListWindow();

    // perform the initial render of all windows.
    this.onPassiveHoveredChange();
  }

  //endregion create

  //region layout
  /**
   * The pixel height of the tab header strip.
   * Matches one text row including window padding.
   * @returns {number}
   */
  passiveTabHeaderHeight()
  {
    return Window_Base.prototype.lineHeight() + $gameSystem.windowPadding() * 2;
  }

  /**
   * The pixel height of the actor ribbon strip above the state list.
   * Sized to fit a cropped face (40px) plus two text rows and window padding.
   * @returns {number}
   */
  passiveActorRibbonHeight()
  {
    return 72;
  }

  /**
   * The pixel width of the passive state list column.
   * @returns {number}
   */
  passiveListWidth()
  {
    return 480;
  }

  //endregion layout

  //region windows
  //region tab header window
  /**
   * Creates the tab header strip window.
   */
  createPassiveTabHeaderWindow()
  {
    // build the window.
    const window = this.buildPassiveTabHeaderWindow();

    // track the reference.
    this.setPassiveTabHeaderWindow(window);

    // register with the scene manager.
    this.addWindow(window);
  }

  /**
   * Builds the tab header window.
   * @returns {Window_PassiveTabHeader}
   */
  buildPassiveTabHeaderWindow()
  {
    // define the rectangle for this window.
    const rectangle = this.passiveTabHeaderRectangle();

    // create the window with the rectangle.
    return new Window_PassiveTabHeader(rectangle);
  }

  /**
   * Gets the rectangle for the tab header strip.
   * Sits above the detail panel in the right column — same x and width as the detail window,
   * so it does not overlap the actor ribbon and list on the left.
   * @returns {Rectangle}
   */
  passiveTabHeaderRectangle()
  {
    const x = this.passiveListWidth();
    const y = 0;
    const width = Graphics.boxWidth - this.passiveListWidth();
    const height = this.passiveTabHeaderHeight();

    return new Rectangle(x, y, width, height);
  }

  /**
   * Gets the tracked tab header window.
   * @returns {Window_PassiveTabHeader}
   */
  getPassiveTabHeaderWindow()
  {
    return this._j._passive._windows._tabHeader;
  }

  /**
   * Sets the tracked tab header window.
   * @param {Window_PassiveTabHeader} tabHeaderWindow The window to track.
   */
  setPassiveTabHeaderWindow(tabHeaderWindow)
  {
    this._j._passive._windows._tabHeader = tabHeaderWindow;
  }

  //endregion tab header window

  //region actor ribbon window
  /**
   * Creates the actor ribbon window.
   */
  createPassiveActorRibbonWindow()
  {
    // build the window.
    const window = this.buildPassiveActorRibbonWindow();

    // track the reference.
    this.setPassiveActorRibbonWindow(window);

    // register with the scene manager.
    this.addWindow(window);
  }

  /**
   * Builds the actor ribbon window.
   * @returns {Window_PassiveActorRibbon}
   */
  buildPassiveActorRibbonWindow()
  {
    // define the rectangle for this window.
    const rectangle = this.passiveActorRibbonRectangle();

    // create the window with the rectangle.
    const window = new Window_PassiveActorRibbon(rectangle);

    // load the initial actor.
    window.setActor($gameParty.menuActor());

    // return the built window.
    return window;
  }

  /**
   * Gets the rectangle for the actor ribbon.
   * Sits at the top of the left column — flush to y=0 because the tab header
   * now lives above the detail panel (right column) only.
   * @returns {Rectangle}
   */
  passiveActorRibbonRectangle()
  {
    const x = 0;
    const y = 0;
    const width = this.passiveListWidth();
    const height = this.passiveActorRibbonHeight();

    return new Rectangle(x, y, width, height);
  }

  /**
   * Gets the tracked actor ribbon window.
   * @returns {Window_PassiveActorRibbon}
   */
  getPassiveActorRibbonWindow()
  {
    return this._j._passive._windows._actorRibbon;
  }

  /**
   * Sets the tracked actor ribbon window.
   * @param {Window_PassiveActorRibbon} ribbonWindow The window to track.
   */
  setPassiveActorRibbonWindow(ribbonWindow)
  {
    this._j._passive._windows._actorRibbon = ribbonWindow;
  }
  //endregion actor ribbon window

  //region list window
  /**
   * Creates the passive state list window.
   */
  createPassiveListWindow()
  {
    // build the window.
    const window = this.buildPassiveListWindow();

    // track the reference BEFORE activating so onPassiveHoveredChange can safely resolve it.
    this.setPassiveListWindow(window);

    // register with the scene manager.
    this.addWindow(window);

    // select and activate after tracking so the first onIndexChange fires with everything wired up.
    window.select(0);
    window.activate();
  }

  /**
   * Builds and configures the passive state list window.
   * @returns {Window_PassiveList}
   */
  buildPassiveListWindow()
  {
    // define the rectangle for this window.
    const rectangle = this.passiveListRectangle();

    // create the window with the rectangle.
    const window = new Window_PassiveList(rectangle);

    // wire up input handlers.
    window.setHandler('cancel', this.popScene.bind(this));
    window.setHandler('content-prev', this.cycleTabLeft.bind(this));
    window.setHandler('content-next', this.cycleTabRight.bind(this));
    window.setHandler('actor-next', this.nextActor.bind(this));
    window.setHandler('actor-prev', this.previousActor.bind(this));

    // wire up the hover-change callback to keep the detail window in sync.
    window.onIndexChange = this.onPassiveHoveredChange.bind(this);

    // load the initial actor.
    window.setActor($gameParty.menuActor());

    // return the built and configured window.
    return window;
  }

  /**
   * Gets the rectangle for the passive state list column.
   * Sits below the actor ribbon in the left column.
   * @returns {Rectangle}
   */
  passiveListRectangle()
  {
    const x = 0;
    const y = this.passiveActorRibbonHeight();
    const width = this.passiveListWidth();
    const height = Graphics.boxHeight - y;

    return new Rectangle(x, y, width, height);
  }

  /**
   * Gets the tracked passive list window.
   * @returns {Window_PassiveList}
   */
  getPassiveListWindow()
  {
    return this._j._passive._windows._list;
  }

  /**
   * Sets the tracked passive list window.
   * @param {Window_PassiveList} listWindow The window to track.
   */
  setPassiveListWindow(listWindow)
  {
    this._j._passive._windows._list = listWindow;
  }

  //endregion list window

  //region detail window
  /**
   * Creates the passive state detail window.
   */
  createPassiveDetailWindow()
  {
    // build the window.
    const window = this.buildPassiveDetailWindow();

    // track the reference.
    this.setPassiveDetailWindow(window);

    // register with the scene manager.
    this.addWindow(window);
  }

  /**
   * Builds the passive state detail window.
   * @returns {Window_PassiveDetail}
   */
  buildPassiveDetailWindow()
  {
    // define the rectangle for this window.
    const rectangle = this.passiveDetailRectangle();

    // create the window with the rectangle.
    const window = new Window_PassiveDetail(rectangle);

    // seed the initial actor so contributors have context on first render.
    window.setActor($gameParty.menuActor());

    // detail panel is display-only; deactivate immediately.
    window.deactivate();

    // return the built window.
    return window;
  }

  /**
   * Gets the rectangle for the detail panel.
   * Occupies the right column beside the list, below the tab header.
   * @returns {Rectangle}
   */
  passiveDetailRectangle()
  {
    const listWidth = this.passiveListWidth();
    const x = listWidth;
    const y = this.passiveTabHeaderHeight();
    const width = Graphics.boxWidth - listWidth;
    const height = Graphics.boxHeight - y;

    return new Rectangle(x, y, width, height);
  }

  /**
   * Gets the tracked passive detail window.
   * @returns {Window_PassiveDetail}
   */
  getPassiveDetailWindow()
  {
    return this._j._passive._windows._detail;
  }

  /**
   * Sets the tracked passive detail window.
   * @param {Window_PassiveDetail} detailWindow The window to track.
   */
  setPassiveDetailWindow(detailWindow)
  {
    this._j._passive._windows._detail = detailWindow;
  }

  //endregion detail window
  //endregion windows

  //region tab management
  /**
   * Gets the tab configuration at the current tab index.
   * @returns {{key: string, label: string, filter: Function|null}}
   */
  currentTab()
  {
    return this.constructor._tabRegistry[this._j._passive._tabIndex];
  }

  /**
   * Advances to the next tab in the registry, wrapping around from the last to the first.
   */
  cycleTabRight()
  {
    // increment the index modularly.
    const tabCount = this.constructor._tabRegistry.length;
    this._j._passive._tabIndex = (this._j._passive._tabIndex + 1) % tabCount;

    // apply the new tab.
    this.applyCurrentTab();
  }

  /**
   * Retreats to the previous tab in the registry, wrapping from the first to the last.
   */
  cycleTabLeft()
  {
    // decrement the index modularly.
    const tabCount = this.constructor._tabRegistry.length;
    this._j._passive._tabIndex = (this._j._passive._tabIndex - 1 + tabCount) % tabCount;

    // apply the new tab.
    this.applyCurrentTab();
  }

  /**
   * Applies the current tab's filter to the list and refreshes all affected windows.
   */
  applyCurrentTab()
  {
    const {
      filter,
      label
    } = this.currentTab();

    // push the new filter into the list window.
    this.getPassiveListWindow()
      .setTabFilter(filter);

    // reset the selection to the top of the newly filtered list.
    this.getPassiveListWindow()
      .select(0);

    // update the header to reflect the new tab name.
    this.getPassiveTabHeaderWindow()
      .setLabel(label);

    // re-activate the list window to accept input again.
    this.getPassiveListWindow()
      .activate();

    // trigger a detail refresh for the new top item.
    this.onPassiveHoveredChange();
  }

  //endregion tab management

  //region actions
  /**
   * Refreshes the detail window whenever the highlighted state in the list changes.
   */
  onPassiveHoveredChange()
  {
    // grab the currently highlighted state (may be null if the list is empty).
    const state = this.getPassiveListWindow()
      .currentPassiveState();

    // push the state (or null) into the detail window.
    this.getPassiveDetailWindow()
      .setState(state);
  }

  /**
   * Extends {@link #onActorChange}.<br/>
   * Refreshes all actor-driven windows whenever the party's menu actor changes.
   */
  onActorChange()
  {
    // perform original logic.
    super.onActorChange();

    // the current menu actor after the change.
    const actor = $gameParty.menuActor();

    // push the updated actor into the ribbon.
    this.getPassiveActorRibbonWindow()
      .setActor(actor);

    // push the updated actor into the list.
    this.getPassiveListWindow()
      .setActor(actor);

    // push the updated actor into the detail window for contributor context.
    this.getPassiveDetailWindow()
      .setActor(actor);

    // reset the selection to the top.
    this.getPassiveListWindow()
      .select(0);

    // re-activate the list for input.
    this.getPassiveListWindow()
      .activate();

    // refresh the detail for the new actor's top item.
    this.onPassiveHoveredChange();
  }

  //endregion actions
}

export default Scene_Passive;
//endregion Scene_Passive