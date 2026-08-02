//region Scene_Aptitude
import AptitudeSkillAggregate from './../_models/AptitudeSkillAggregate.js';
import Window_AptitudeAggregateDetails from '../windows/Window_AptitudeAggregateDetails.js';
import Window_AptitudeAggregateList from '../windows/Window_AptitudeAggregateList.js';
import Window_AptitudeRibbon from '../windows/Window_AptitudeRibbon.js';
import Window_AptitudeSourceDetails from '../windows/Window_AptitudeSourceDetails.js';
import Window_AptitudeSourceList from '../windows/Window_AptitudeSourceList.js';

/**
 * The scene for viewing aptitude progress.
 *
 * Layout is inherited from {@link Scene_ActorFacetBase}, which supplies the actor ribbon and the
 * control legend and hands down {@link Scene_ActorFacetBase.contentAreaRect} as the region left over.
 * This scene positions only its lists and detail panels within that region.
 */
class Scene_Aptitude
  extends Scene_ActorFacetBase
{
  /**
   * Pushes this current scene onto the stack, forcing it into action.
   */
  static callScene()
  {
    SceneManager.push(this);
  }

  /**
   * The available view modes for the aptitude windows.
   */
  static viewMode = {
    /**
     * The view mode for viewing aggregates of aptitudes.
     */
    AGGREGATE: 'aggregate',

    /**
     * The view mode for viewing aptitude sources.
     */
    SOURCE: 'source'
  };

  //region init
  /**
   * Extends {@link #initMembers}.<br/>
   * Also initializes the aptitude members.
   */
  initMembers()
  {
    // perform original logic.
    super.initMembers();

    // initialize the core aptitude namespace.
    this.initCoreMembers();

    // initialize the primary members for the scene.
    this.initPrimaryMembers();
  }

  //region properties
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

  /**
   * Initializes the core aptitude members.
   */
  initCoreMembers()
  {
    /**
     * The shared root namespace for all of J's plugin data.
     */
    this._j ||= {};

    /**
     * A grouping of all properties associated with the aptitude system.
     */
    this._j._aptitude = {};
  }

  /**
   * Initializes the primary members for the scene.
   */
  initPrimaryMembers()
  {
    /**
     * The last index tracked in the aggregate list window, per-actor.
     * Keyed by actorId → number.
     * @type {{[actorId:number]: number}}
     */
    this._j._aptitude._lastAggregateIndexByActor = {};

    /**
     * The last index tracked in the source list window, per-actor.
     * Keyed by actorId → number.
     * @type {{[actorId:number]: number}}
     */
    this._j._aptitude._lastSourceIndexByActor = {};

    /**
     * The current view mode for the aptitude windows.
     * Toggle between "aggregate" and "source" views.
     * @type {string}
     */
    this._j._aptitude._viewMode = Scene_Aptitude.viewMode.AGGREGATE;

    /**
     * The aptitude aggregates for the current actor.
     * @type {AptitudeSkillAggregate[]}
     */
    this._j._aptitude._aggregates = [];

    /**
     * The aptitude sources for the current actor.
     * @type {(RPG_Actor|RPG_Class|RPG_EquipItem|RPG_Weapon|RPG_Armor|RPG_Skill|RPG_State)[]}
     */
    this._j._aptitude._sources = [];

    /**
     * A grouping of all windows for this scene.
     */
    this._j._aptitude._windows = {};

    /**
     * The list window that displays the per-skill aggregates.
     * @type {Window_AptitudeAggregateList|null}
     */
    this._j._aptitude._windows._aggregateList = null;

    /**
     * The list window that displays the actor's sources.
     * @type {Window_AptitudeSourceList|null}
     */
    this._j._aptitude._windows._sourceList = null;

    /**
     * The details window that displays all sources and respective progress towards learning the skill.
     * @type {Window_AptitudeAggregateDetails|null}
     */
    this._j._aptitude._windows._aggregateDetails = null;

    /**
     * The details window that displays what this aptitude source is teaching.
     * @type {Window_AptitudeSourceDetails|null}
     */
    this._j._aptitude._windows._sourceDetails = null;
  }

  /**
   * Applies initial visibility and selection to match the current view mode.
   * Ensures index 0 is selected (or the remembered index) and details are set.
   */
  initializeView()
  {
    // ensure we have selection trackers for this actor.
    this.resetSelectionTrackers();

    // decide which index to start from based on the active view.
    const startIndex = this.viewMode() === Scene_Aptitude.viewMode.AGGREGATE
      ? this.lastAggregateIndex()
      : this.lastSourceIndex();

    // align visibility and selections with the current view mode.
    if (this.viewMode() === Scene_Aptitude.viewMode.AGGREGATE)
    {
      // hide the source pair and show the aggregate pair.
      this.hideSourceWindows();
      this.showAggregateWindows();

      // select/activate and push selection into details.
      this.refreshSelectionForCurrentView(startIndex);
    }
    else
    {
      // hide the aggregate pair and show the source pair.
      this.hideAggregateWindows();
      this.showSourceWindows();

      // select/activate and push selection into details.
      this.refreshSelectionForCurrentView(startIndex);
    }
  }

  //endregion init

  //region accessors
  /**
   * Gets the last index tracked in the aggregate list window for the current actor.
   * @returns {number}
   */
  lastAggregateIndex()
  {
    // get the current actor id.
    const actorId = this.actor()
      .actorId();

    // pull from the map; default to 0 if not yet set.
    const map = this.j()._aptitude._lastAggregateIndexByActor;
    if (map[actorId] === undefined)
    {
      map[actorId] = 0;
    }

    // return the remembered index.
    return map[actorId];
  }

  /**
   * Sets the last index tracked in the aggregate list window for the current actor.
   * @param {number} index - The new index to track.
   */
  setLastAggregateIndex(index)
  {
    // get the current actor id.
    const actorId = this.actor()
      .actorId();

    // update the remembered index for this actor.
    this.j()._aptitude._lastAggregateIndexByActor[actorId] = index;
  }

  /**
   * Gets the last index tracked in the source list window for the current actor.
   * @returns {number}
   */
  lastSourceIndex()
  {
    // get the current actor id.
    const actorId = this.actor()
      .actorId();

    // pull from the map; default to 0 if not yet set.
    const map = this.j()._aptitude._lastSourceIndexByActor;
    if (map[actorId] === undefined)
    {
      map[actorId] = 0;
    }

    // return the remembered index.
    return map[actorId];
  }

  /**
   * Sets the last index tracked in the source list window for the current actor.
   * @param {number} index - The new index to track.
   */
  setLastSourceIndex(index)
  {
    // get the current actor id.
    const actorId = this.actor()
      .actorId();

    // update the remembered index for this actor.
    this.j()._aptitude._lastSourceIndexByActor[actorId] = index;
  }

  /**
   * Ensures selection tracker indices exist for the current actor without overwriting them.
   * This initializes to 0 only if the current actor does not yet have entries.
   */
  resetSelectionTrackers()
  {
    // get the current actor id.
    const actorId = this.actor()
      .actorId();

    // ensure aggregate index exists.
    const aggMap = this.j()._aptitude._lastAggregateIndexByActor;
    if (aggMap[actorId] === undefined)
    {
      aggMap[actorId] = 0;
    }

    // ensure source index exists.
    const srcMap = this.j()._aptitude._lastSourceIndexByActor;
    if (srcMap[actorId] === undefined)
    {
      srcMap[actorId] = 0;
    }
  }

  /**
   * Gets the cached list of per‑skill aggregates for the current actor.
   * @returns {AptitudeSkillAggregate[]}
   */
  aggregates()
  {
    // return the cached aggregates.
    return this.j()._aptitude._aggregates;
  }

  /**
   * Sets the cached list of per‑skill aggregates for the current actor.
   * @param {AptitudeSkillAggregate[]} aggregates The new aggregates.
   */
  setAggregates(aggregates)
  {
    this.j()._aptitude._aggregates = aggregates;
  }

  /**
   * Rebuilds the aggregates cache for the current actor.
   */
  rebuildAggregatesForActor()
  {
    // compute new aggregates from the actor.
    const next = this.actor()
      .getAptitudeSkillAggregates();

    // replace the cache.
    this.setAggregates(next);
  }

  /**
   * Gets the aptitude sources for the current actor.
   * @returns {(RPG_Actor|RPG_Class|RPG_EquipItem|RPG_Weapon|RPG_Armor|RPG_Skill|RPG_State)[]}
   */
  sources()
  {
    return this.j()._aptitude._sources;
  }

  /**
   * Sets the aptitude sources for the current actor.
   * @param {(RPG_Actor|RPG_Class|RPG_EquipItem|RPG_Weapon|RPG_Armor|RPG_Skill|RPG_State)[]} sources The new sources.
   */
  setSources(sources)
  {
    this.j()._aptitude._sources = sources;
  }

  /**
   * Rebuilds the sources cache for the current actor.
   */
  rebuildSourcesForActor()
  {
    // compute new sources from the actor.
    const next = this.actor()
      .getAptitudeSources();

    // replace the cache.
    this.setSources(next);
  }

  /**
   * Gets the current view mode for the aptitude windows.
   * Should be one of {@link Scene_Aptitude.viewMode}.
   * @returns {string}
   */
  viewMode()
  {
    return this.j()._aptitude._viewMode;
  }

  /**
   * Sets the current view mode to the aggregate view.
   */
  setViewModeToAggregate()
  {
    this.j()._aptitude._viewMode = Scene_Aptitude.viewMode.AGGREGATE;
  }

  /**
   * Sets the current view mode to the source view.
   */
  setViewModeToSource()
  {
    this.j()._aptitude._viewMode = Scene_Aptitude.viewMode.SOURCE;
  }

  /**
   * Gets the current active list window for the view mode.
   * @returns {Window_AptitudeAggregateList|Window_AptitudeSourceList|null} - The active list window.
   */
  currentListWindow()
  {
    // return the list window based on the current view mode.
    if (this.viewMode() === Scene_Aptitude.viewMode.AGGREGATE)
    {
      return this.aptitudeAggregateListWindow();
    }
    else if (this.viewMode() === Scene_Aptitude.viewMode.SOURCE)
    {
      return this.aptitudeSourceListWindow();
    }

    return null;
  }

  /**
   * Gets the currently inactive list window for the view mode.
   * @returns {Window_AptitudeAggregateList|Window_AptitudeSourceList|null} - The inactive list window.
   */
  inactiveListWindow()
  {
    // return the opposite list window based on the current view mode.
    if (this.viewMode() === Scene_Aptitude.viewMode.AGGREGATE)
    {
      return this.aptitudeSourceListWindow();
    }
    else if (this.viewMode() === Scene_Aptitude.viewMode.SOURCE)
    {
      return this.aptitudeAggregateListWindow();
    }

    return null;
  }

  /**
   * Gets the current active details window for the view mode.
   * @returns {Window_AptitudeAggregateDetails|Window_AptitudeSourceDetails|null} - The active details window.
   */
  currentDetailsWindow()
  {
    // return the details window based on the current view mode.
    if (this.viewMode() === Scene_Aptitude.viewMode.AGGREGATE)
    {
      return this.aptitudeAggregateDetailsWindow();
    }
    else if (this.viewMode() === Scene_Aptitude.viewMode.SOURCE)
    {
      return this.aptitudeSourceDetailsWindow();
    }

    return null;
  }

  //endregion accessors

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
   * Creates all windows for this scene.
   */
  createAllWindows()
  {
    // rebuild aggregates once for the initial actor.
    this.rebuildAggregatesForActor();

    // rebuild sources once for the initial actor.
    this.rebuildSourcesForActor();

    // create the list window for aptitudes aggregations.
    this.createAptitudeAggregateListWindow();

    // create the list window for aptitudes sources.
    this.createAptitudeSourceListWindow();

    // create the details window that responds to aggregate selection.
    this.createAptitudeAggregateDetailsWindow();

    // create the details window that responds to source selection.
    this.createAptitudeSourceDetailsWindow();

    // initialize the view mode.
    this.initializeView();
  }

  //region ribbon
  /**
   * Overrides {@link Scene_ActorFacetBase.buildActorRibbonWindow}.<br/>
   * Supplies the aptitude ribbon, which shows the actor plus a hint about the view toggle.
   *
   * Only the contents differ from the default ribbon; the base decides where it sits and how tall it is.
   * @param {Rectangle} rectangle The rectangle to build the window within.
   * @returns {Window_AptitudeRibbon}
   */
  buildActorRibbonWindow(rectangle)
  {
    return new Window_AptitudeRibbon(rectangle);
  }

  /**
   * Gets the actor ribbon window under the name this scene refers to it by.
   * @returns {Window_AptitudeRibbon}
   */
  aptitudeRibbonWindow()
  {
    return this.getActorRibbonWindow();
  }

  //endregion ribbon

  //region aggregate list
  /**
   * Creates the aptitude aggregate list window.
   */
  createAptitudeAggregateListWindow()
  {
    // build the rectangle for the list window.
    const rect = this.aptitudeAggregateListWindowRect();

    // create the list window instance.
    const win = new Window_AptitudeAggregateList(rect);

    // set the actor for the list.
    win.setActor(this.actor());

    // provide the prebuilt aggregates.
    win.setAggregates(this.aggregates());

    // wire basic handlers.
    win.setHandler('ok', this.onListOk.bind(this));
    win.setHandler('cancel', this.popScene.bind(this));
    win.setHandler('context', this.toggleViewMode.bind(this));
    win.setHandler('actor-prev', this.onCycleActorLeft.bind(this));
    win.setHandler('actor-next', this.onCycleActorRight.bind(this));

    // store and add to the scene.
    this.j()._aptitude._windows._aggregateList = win;
    this.addWindow(win);
  }

  /**
   * Builds the rectangle for the aptitude aggregate list window.
   * @returns {Rectangle}
   */
  aptitudeAggregateListWindowRect()
  {
    // start from the region the base leaves beneath the ribbon.
    const contentArea = this.contentAreaRect();

    // return the rectangle for the list down the left of that region.
    return new Rectangle(contentArea.x, contentArea.y, this.listColumnWidth(), contentArea.height);
  }

  /**
   * Gets the aptitude aggregate list window.
   * @returns {Window_AptitudeAggregateList|null}
   */
  aptitudeAggregateListWindow()
  {
    // return the list window or null.
    return this.j()._aptitude._windows._aggregateList;
  }

  //endregion aggregate list

  //region source list
  /**
   * Creates the aptitude source list window.
   */
  createAptitudeSourceListWindow()
  {
    // build the rectangle for the list window.
    const rect = this.aptitudeSourceListWindowRect();

    // create the list window instance.
    const win = new Window_AptitudeSourceList(rect);

    // set the actor for the list.
    win.setActor(this.actor());

    // provide the prebuilt sources.
    win.setSources(this.sources());

    // wire basic handlers.
    win.setHandler('ok', this.onListOk.bind(this));
    win.setHandler('cancel', this.popScene.bind(this));
    win.setHandler('context', this.toggleViewMode.bind(this));
    win.setHandler('actor-prev', this.onCycleActorLeft.bind(this));
    win.setHandler('actor-next', this.onCycleActorRight.bind(this));

    // hide this window initially.
    win.hide();
    win.deactivate();

    // store and add to the scene.
    this.j()._aptitude._windows._sourceList = win;
    this.addWindow(win);
  }

  /**
   * Builds the rectangle for the aptitude source list window.
   * @returns {Rectangle}
   */
  aptitudeSourceListWindowRect()
  {
    return this.aptitudeAggregateListWindowRect();
  }

  /**
   * Gets the aptitude source list window.
   * @returns {Window_AptitudeSourceList|null}
   */
  aptitudeSourceListWindow()
  {
    return this.j()._aptitude._windows._sourceList;
  }

  //endregion source list

  //region aggregate details
  /**
   * Creates the aptitude aggregate details window.
   */
  createAptitudeAggregateDetailsWindow()
  {
    // build the rectangle for the details window.
    const rect = this.aptitudeAggregateDetailsWindowRect();

    // create the details window instance.
    const win = new Window_AptitudeAggregateDetails(rect);

    // set the actor for the details window.
    win.setActor(this.actor());

    // store and add to the scene.
    this.j()._aptitude._windows._aggregateDetails = win;
    this.addWindow(win);
  }

  /**
   * Builds the rectangle for the aptitude aggregate details window.
   * @returns {Rectangle}
   */
  aptitudeAggregateDetailsWindowRect()
  {
    // the list has already claimed its share of the content area.
    const listRect = this.aptitudeAggregateListWindowRect();
    const contentArea = this.contentAreaRect();

    // take what remains beside it, defined as the remainder rather than its own fraction so the two
    // cannot drift apart.
    return new Rectangle(
      listRect.x + listRect.width,
      listRect.y,
      contentArea.width - listRect.width,
      listRect.height);
  }

  /**
   * Gets the aptitude aggregate details window.
   * @returns {Window_AptitudeAggregateDetails|null}
   */
  aptitudeAggregateDetailsWindow()
  {
    // return the details window or null.
    return this.j()._aptitude._windows._aggregateDetails;
  }

  //endregion aggregate details

  //region source details
  /**
   * Creates the aptitude source details window.
   */
  createAptitudeSourceDetailsWindow()
  {
    // build the rectangle for the details window.
    const rect = this.aptitudeSourceDetailsWindowRect();

    // create the details window instance.
    const win = new Window_AptitudeSourceDetails(rect);

    // set the actor for the details window.
    win.setActor(this.actor());

    // hide this window initially.
    win.hide();

    // store and add to the scene.
    this.j()._aptitude._windows._sourceDetails = win;
    this.addWindow(win);
  }

  /**
   * Builds the rectangle for the aptitude source details window.
   * @returns {Rectangle}
   */
  aptitudeSourceDetailsWindowRect()
  {
    return this.aptitudeAggregateDetailsWindowRect();
  }

  /**
   * Gets the aptitude source details window.
   * @returns {Window_AptitudeSourceDetails|null}
   */
  aptitudeSourceDetailsWindow()
  {
    return this.j()._aptitude._windows._sourceDetails;
  }

  //endregion source details

  /**
   * The proportion of the content area allotted to the list column.
   *
   * Wide enough that long skill and source names do not collide with their right-aligned AP counts.
   * @returns {number}
   */
  listColumnWidthPercent()
  {
    return 0.36;
  }

  /**
   * The width of the list column.
   * @returns {number}
   */
  listColumnWidth()
  {
    return Math.round(this.contentAreaRect().width * this.listColumnWidthPercent());
  }

  /**
   * Overrides {@link Scene_MenuFacetBase.hasHelpWindow}.<br/>
   * Declines the help strip across the top.
   *
   * Both view modes already devote most of the screen to a detail panel describing whatever is
   * highlighted, and the list commands carry no help text of their own to put in a second one. Reserving
   * the strip would have left a blank band above the ribbon.
   * @returns {boolean}
   */
  hasHelpWindow()
  {
    return false;
  }

  /**
   * Implements {@link Scene_MenuFacetBase.controlLegendEntries}.<br/>
   * Describes the controls this scene responds to.
   * @returns {{semantic: (string|string[]), label: string}[]}
   */
  controlLegendEntries()
  {
    return [
      {
        semantic: 'context',
        label: 'skills / sources',
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

  //endregion create

  //region update
  /**
   * Extends {@link #update}.<br/>
   * Also updates the details window when the list selection changes.
   */
  update()
  {
    // grab the previous view mode.
    const previousViewMode = this.viewMode();

    // perform original logic.
    super.update();

    // if the list is not present, do nothing.
    const list = this.aptitudeAggregateListWindow();
    if (!list) return;

    // manage the details content based on whether or not the list index changed.
    this.updateDetails();

    // manage visibility based on view mode.
    this.updateVisibility(previousViewMode);
  }

  /**
   * Updates the aptitude details window based on the current list selection.
   */
  updateDetails()
  {
    switch (this.viewMode())
    {
      case Scene_Aptitude.viewMode.AGGREGATE:
      {
        const previousIndex = this.lastAggregateIndex();
        this.updateAggregateDetails(previousIndex);
        break;
      }
      case Scene_Aptitude.viewMode.SOURCE:
      {
        const previousIndex = this.lastSourceIndex();
        this.updateSourceDetails(previousIndex);
        break;
      }
    }
  }

  /**
   * Updates the aptitude aggregate details window.
   * @param {number} previousIndex The previous index of the list.
   */
  updateAggregateDetails(previousIndex)
  {
    // grab the list window.
    const listWindow = this.aptitudeAggregateListWindow();

    // if the index has not changed, do nothing.
    if (previousIndex === listWindow.index()) return;

    // acquire the selected entry if available.
    const aggregate = listWindow.currentExt();

    // update the details window context.
    const details = this.aptitudeAggregateDetailsWindow();

    // update both actor and entry for completeness.
    details.setActor(this.actor());
    details.setAggregate(aggregate);

    // update our tracker.
    this.setLastAggregateIndex(listWindow.index());
  }

  /**
   * Updates the aptitude source details window.
   * @param {number} previousIndex The previous index of the list.
   */
  updateSourceDetails(previousIndex)
  {
    // grab the list window.
    const listWindow = this.aptitudeSourceListWindow();

    // if the index has not changed, do nothing.
    if (previousIndex === listWindow.index()) return;

    // grab the source from the list window.
    const source = listWindow.currentExt();

    // update the details window context.
    const details = this.aptitudeSourceDetailsWindow();
    details.setActor(this.actor());
    details.setSource(source);

    // update our tracker.
    this.setLastSourceIndex(listWindow.index());
  }

  /**
   * Updates the visibility of the aptitude windows based on the current view mode.
   * @param {string} previousViewMode The previous view mode.
   */
  updateVisibility(previousViewMode)
  {
    // grab the current view mode.
    const currentViewMode = this.viewMode();

    // if the view mode hasn't changed, do nothing.
    if (currentViewMode === previousViewMode) return;

    // pivot on the current view mode to display the appropriate windows.
    switch (currentViewMode)
    {
      case Scene_Aptitude.viewMode.AGGREGATE:
        this.hideSourceWindows();
        this.showAggregateWindows();
        break;
      case Scene_Aptitude.viewMode.SOURCE:
        this.hideAggregateWindows();
        this.showSourceWindows();
        break;
    }
  }

  /**
   * Shows the aptitude aggregate windows.
   * Also refreshes the list and details windows with the current actor.
   */
  showAggregateWindows()
  {
    const list = this.aptitudeAggregateListWindow();
    const details = this.aptitudeAggregateDetailsWindow();

    this.rebuildAggregatesForActor();

    list.show();
    list.setActor(this.actor());
    list.setAggregates(this.aggregates());
    list.select(this.lastAggregateIndex());
    list.activate();

    details.show();
    details.setActor(this.actor());
    list.currentExt()
      ? details.setAggregate(list.currentExt())
      : details.setAggregate(null);
  }

  /**
   * Hides the aptitude aggregate windows.
   */
  hideAggregateWindows()
  {
    const list = this.aptitudeAggregateListWindow();
    const details = this.aptitudeAggregateDetailsWindow();

    list.hide();
    list.deactivate();
    details.hide();
  }

  /**
   * Shows the aptitude source windows.
   * Also refreshes the list and details windows with the current actor.
   */
  showSourceWindows()
  {
    const list = this.aptitudeSourceListWindow();
    const details = this.aptitudeSourceDetailsWindow();

    list.show();
    list.setActor(this.actor());
    list.setSources(this.sources());
    list.select(this.lastSourceIndex());
    list.activate();

    details.show();
    details.setActor(this.actor());
    list.currentExt()
      ? details.setSource(list.currentExt())
      : details.setSource(null);
  }

  /**
   * Hides the aptitude source windows.
   */
  hideSourceWindows()
  {
    const list = this.aptitudeSourceListWindow();
    const details = this.aptitudeSourceDetailsWindow();

    list.hide();
    list.deactivate();
    details.hide();
  }

  //endregion update

  //region actions
  /**
   * Swaps between the per-skill aggregate view and the per-source view.
   *
   * Bound to the `context` semantic, which is what the control legend resolves its glyph from.
   */
  toggleViewMode()
  {
    switch (this.viewMode())
    {
      case Scene_Aptitude.viewMode.AGGREGATE:
        this.setViewModeToSource();
        break;
      case Scene_Aptitude.viewMode.SOURCE:
        this.setViewModeToAggregate();
        break;
      default:
        throw new Error(`Invalid view mode: ${this.viewMode()}`);
    }
  }

  /**
   * Extends {@link #onActorChange}.<br/>
   * Also refreshes the aptitude windows when the actor changes.
   */
  onActorChange()
  {
    // perform original logic.
    super.onActorChange();

    // rebuild the cached aggregates for the new actor.
    this.rebuildAggregatesForActor();

    // rebuild the cached sources for the new actor.
    this.rebuildSourcesForActor();

    // get the updated actor reference.
    const updatedActor = this.actor();

    // rebind all windows to the new actor (ribbon, lists, details).
    this.rebindAllWindowsToActor(updatedActor);

    // refresh the list contents for the new actor (aggregates/sources).
    this.refreshListsForActor();

    // reset the per-view selection trackers back to the first index.
    this.resetSelectionTrackers();

    // choose the remembered index for the active view.
    const startIndex = this.viewMode() === Scene_Aptitude.viewMode.AGGREGATE
      ? this.lastAggregateIndex()
      : this.lastSourceIndex();

    // select and activate the current view, and push selection into details.
    this.refreshSelectionForCurrentView(startIndex);
  }

  /**
   * Rebinds all scene windows to the provided actor.
   * @param {Game_Actor} actor - The actor to bind to all windows.
   */
  rebindAllWindowsToActor(actor)
  {
    // the ribbon is deliberately absent from this list; the base repoints it in onActorChange, and
    // doing it again here would only be a second assignment of the same value.

    // update both list windows with the new actor.
    this.aptitudeAggregateListWindow()
      .setActor(actor);
    this.aptitudeSourceListWindow()
      .setActor(actor);

    // update both details windows with the new actor.
    this.aptitudeAggregateDetailsWindow()
      .setActor(actor);
    this.aptitudeSourceDetailsWindow()
      .setActor(actor);
  }

  /**
   * Refreshes the list contents for the currently bound actor.
   * This pulls from the scene’s cached aggregates and sources.
   */
  refreshListsForActor()
  {
    // refresh the aggregate list with the current aggregates cache.
    this.aptitudeAggregateListWindow()
      .setAggregates(this.aggregates());

    // refresh the source list with the current sources cache.
    this.aptitudeSourceListWindow()
      .setSources(this.sources());
  }

  /**
   * Selects and activates the current list view and updates its details.
   * @param {number} startIndex - The index to select in the active list.
   */
  refreshSelectionForCurrentView(startIndex)
  {
    // grab the active and inactive list windows.
    const activeList = this.currentListWindow();
    const inactiveList = this.inactiveListWindow();

    // select the desired index on the active list.
    activeList.select(startIndex);

    // activate the active list to accept input.
    activeList.activate();

    // deactivate the other list to avoid input conflicts.
    inactiveList.deactivate();

    // push the active list’s current selection into the correct details window.
    this.setDetailsFromCurrentSelection();
  }

  /**
   * Applies the active list selection to the corresponding details window.
   */
  setDetailsFromCurrentSelection()
  {
    // check what view we are currently in.
    switch (this.viewMode())
    {
      case Scene_Aptitude.viewMode.AGGREGATE:
      {
        // grab the aggregate list/details windows.
        const list = this.aptitudeAggregateListWindow();
        const details = this.aptitudeAggregateDetailsWindow();

        // update the details window with the selected aggregate or null.
        const selected = list.currentExt();
        if (selected)
        {
          details.setAggregate(selected);
        }
        else
        {
          details.setAggregate(null);
        }
        break;
      }
      case Scene_Aptitude.viewMode.SOURCE:
      {
        // grab the source list/details windows.
        const list = this.aptitudeSourceListWindow();
        const details = this.aptitudeSourceDetailsWindow();

        // update the details window with the selected source or null.
        const selected = list.currentExt();
        if (selected)
        {
          details.setSource(selected);
        }
        else
        {
          details.setSource(null);
        }
        break;
      }
      default:
      {
        // an invalid view mode was encountered.
        throw new Error(`Invalid view mode: ${this.viewMode()}`);
      }
    }
  }

  /**
   * Handles the OK action from the aptitude list.
   * (Reserved for future behaviors; currently a no‑op.)
   */
  onListOk()
  {
    // no special OK behavior in v1; just play a sound.
    SoundManager.playOk();

    // reselect the list to ensure it remains active.
    this.currentListWindow()
      .activate();
  }

  //endregion actions

}

export default Scene_Aptitude;
//endregion Scene_Aptitude