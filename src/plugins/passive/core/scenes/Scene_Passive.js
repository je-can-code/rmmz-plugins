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
 * Layout is inherited rather than declared. {@link Scene_ActorFacetBase} supplies the help window
 * across the top, the actor ribbon beneath it, and the control legend across the bottom, and hands
 * down {@link Scene_ActorFacetBase.contentAreaRect} as the region left over. This scene therefore
 * describes only what is particular to it, within that region:
 *
 * - a tab header strip across the top of the content area
 * - left column: scrollable state list, filtered by the active tab
 * - right column: detail panel for the currently highlighted state
 *
 * Before this it positioned all of that against `Graphics.boxWidth`/`boxHeight` directly, with a
 * hardcoded 480px list column and its own ribbon height- which is precisely the drift the shared base
 * exists to end.
 */
class Scene_Passive
  extends Scene_ActorFacetBase
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
    this.tabRegistry().push(config);
  }

  /**
   * Gets all registered tab configurations in registration order.
   * @returns {Array<{key: string, label: string, filter: Function|null}>}
   */
  static registeredTabs()
  {
    return this.tabRegistry();
  }

  //endregion static tab registry

  //region init
  /**
   * Constructor.
   *
   * No explicit `initialize()` call: the engine's own scene constructor performs one, so making a
   * second was running the whole initialization twice.
   */
  constructor()
  {
    super();
  }

  /**
   * Extends {@link Scene_ActorFacetBase.initMembers}.<br/>
   * Also initializes the properties particular to the passive viewer.
   */
  initMembers()
  {
    // perform original logic, which seeds the shared namespace and the facet skeleton's own members.
    super.initMembers();

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

  //region properties
  /**
   * Gets the tab registry.
   * @returns {*} The tabRegistry.
   */
  static tabRegistry()
  {
    // hand back the tab registry.
    return this._tabRegistry;
  }

  /**
   * Gets the j.
   * @returns {*} The j.
   */
  j()
  {
    // hand back the j.
    return this._j;
  }
  //endregion properties

  //endregion init

  //region create
  /**
   * Extends {@link Scene_ActorFacetBase.create}.<br/>
   * Also creates the windows particular to this scene.
   */
  create()
  {
    // perform original logic, which builds the control legend and the actor ribbon.
    super.create();

    // build the help window describing whatever is highlighted.
    this.createHelpWindow();

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
    this.createPassiveDetailWindow();

    // create the interactive list window last so it draws on top.
    this.createPassiveListWindow();

    // perform the initial render of all windows.
    this.onPassiveHoveredChange();
  }

  /**
   * Overrides {@link Scene_ActorFacetBase.buildActorRibbonWindow}.<br/>
   * Supplies a ribbon that names the actor as well as showing their face.
   *
   * This is the extension point rather than building a ribbon and placing it by hand: the base owns
   * where the ribbon sits and how tall it is, and only the contents differ.
   * @param {Rectangle} rectangle The rectangle to build the window within.
   * @returns {Window_PassiveActorRibbon}
   */
  buildActorRibbonWindow(rectangle)
  {
    return new Window_PassiveActorRibbon(rectangle);
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
    return this.calcWindowHeight(1, false);
  }

  /**
   * The proportion of the content area given to the state list.
   *
   * A ratio rather than the 480px this used to hardcode, so the split holds at any resolution- and so
   * that the detail panel can be defined as the remainder instead of a second number that has to be
   * kept in agreement with the first.
   * @returns {number}
   */
  passiveListRatio()
  {
    return 0.4;
  }

  /**
   * The pixel width of the passive state list column.
   * @returns {number}
   */
  passiveListWidth()
  {
    return Math.round(this.contentAreaRect().width * this.passiveListRatio());
  }

  /**
   * Implements {@link Scene_MenuFacetBase.controlLegendEntries}.<br/>
   * Describes the controls this scene responds to.
   *
   * Note that there is no `ok` entry: nothing in here is chosen, only read. Teaching a button that does
   * nothing would be worse than teaching nothing.
   * @returns {{semantic: (string|string[]), label: string}[]}
   */
  controlLegendEntries()
  {
    return [
      {
        semantic: [ 'content-prev', 'content-next' ],
        label: 'switch tab',
      },
      {
        semantic: [ 'actor-prev', 'actor-next' ],
        label: 'switch character',
      },
      {
        semantic: 'cancel',
        label: 'back',
      },
    ];
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
   *
   * Spans the full width across the top of the content area. It used to sit only above the detail
   * panel, tucked beside the ribbon- but the ribbon now spans the full width itself, and the tab
   * names which subset of the list is showing, so it belongs over both columns rather than one.
   * @returns {Rectangle}
   */
  passiveTabHeaderRectangle()
  {
    // start from the region left over beneath the ribbon.
    const contentArea = this.contentAreaRect();

    return new Rectangle(contentArea.x, contentArea.y, contentArea.width, this.passiveTabHeaderHeight());
  }

  /**
   * Gets the tracked tab header window.
   * @returns {Window_PassiveTabHeader}
   */
  getPassiveTabHeaderWindow()
  {
    return this.j()._passive._windows._tabHeader;
  }

  /**
   * Sets the tracked tab header window.
   * @param {Window_PassiveTabHeader} tabHeaderWindow The window to track.
   */
  setPassiveTabHeaderWindow(tabHeaderWindow)
  {
    this.j()._passive._windows._tabHeader = tabHeaderWindow;
  }

  //endregion tab header window

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
   * Occupies the left of the content area, beneath the tab header.
   * @returns {Rectangle}
   */
  passiveListRectangle()
  {
    // start from the region left over beneath the ribbon.
    const contentArea = this.contentAreaRect();

    // the tab header sits above both columns.
    const y = contentArea.y + this.passiveTabHeaderHeight();

    return new Rectangle(
      contentArea.x,
      y,
      this.passiveListWidth(),
      contentArea.height - this.passiveTabHeaderHeight());
  }

  /**
   * Gets the tracked passive list window.
   * @returns {Window_PassiveList}
   */
  getPassiveListWindow()
  {
    return this.j()._passive._windows._list;
  }

  /**
   * Sets the tracked passive list window.
   * @param {Window_PassiveList} listWindow The window to track.
   */
  setPassiveListWindow(listWindow)
  {
    this.j()._passive._windows._list = listWindow;
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
   *
   * Occupies the right of the content area beside the list, and is defined as the *remainder* of that
   * width rather than its own fraction- so the two columns cannot drift apart or leave a seam between
   * them however the ratio is tuned.
   * @returns {Rectangle}
   */
  passiveDetailRectangle()
  {
    // the list has already claimed its share; take what is left beside it.
    const listRect = this.passiveListRectangle();
    const contentArea = this.contentAreaRect();

    return new Rectangle(
      listRect.x + listRect.width,
      listRect.y,
      contentArea.width - listRect.width,
      listRect.height);
  }

  /**
   * Gets the tracked passive detail window.
   * @returns {Window_PassiveDetail}
   */
  getPassiveDetailWindow()
  {
    return this.j()._passive._windows._detail;
  }

  /**
   * Sets the tracked passive detail window.
   * @param {Window_PassiveDetail} detailWindow The window to track.
   */
  setPassiveDetailWindow(detailWindow)
  {
    this.j()._passive._windows._detail = detailWindow;
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
    return this.constructor._tabRegistry[this.j()._passive._tabIndex];
  }

  /**
   * Advances to the next tab in the registry, wrapping around from the last to the first.
   */
  cycleTabRight()
  {
    // increment the index modularly.
    const tabCount = this.constructor._tabRegistry.length;
    this.j()._passive._tabIndex = (this.j()._passive._tabIndex + 1) % tabCount;

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
    this.j()._passive._tabIndex = (this.j()._passive._tabIndex - 1 + tabCount) % tabCount;

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

    // describe it across the top, in the strip the base reserves for exactly this.
    this.helpWindow()
      .setText(this.describeHoveredPassive(state));
  }

  /**
   * Describes the highlighted passive state for the help window.
   * @param {?RPG_State} state The highlighted state, or null when the list is empty.
   * @returns {string}
   */
  describeHoveredPassive(state)
  {
    // an empty list has nothing to describe, and says so rather than leaving a blank strip.
    if (state === null) return 'No passive states are currently applied.';

    return state.description;
  }

  /**
   * Extends {@link Scene_ActorFacetBase.onActorChange}.<br/>
   * Refreshes this scene's actor-driven windows whenever the party's menu actor changes.
   *
   * The ribbon is no longer updated here- the base owns it, and does that itself.
   */
  onActorChange()
  {
    // perform original logic, which repoints the actor ribbon.
    super.onActorChange();

    // the current menu actor after the change.
    const actor = $gameParty.menuActor();

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