//region Scene_Classes
import ClassManager from '../managers/ClassManager.js';
import Window_ClassDescription from '../windows/Window_ClassDescription.js';
import Window_ClassList from '../windows/Window_ClassList.js';
import Window_ClassParameters from '../windows/Window_ClassParameters.js';

/**
 * The class scene: an actor's classes down the left, and everything about the highlighted one beside them,
 * all on one screen- its description across the top, and its parameters beneath that.
 *
 * Whether a class can be changed into here is decided by whoever opens the scene, never by the scene
 * itself. A game gates changing behind a place, a moment or a switch simply by choosing when to open it
 * with changing allowed. Opened any other way, everything can still be read, and confirming just buzzes.
 *
 * Layout is inherited from {@link Scene_ActorFacetBase}, which supplies the actor ribbon and the control
 * legend and hands down {@link Scene_ActorFacetBase.contentAreaRect} as the region left over. This scene
 * places only the list and the windows beside it within that region.
 *
 * There are two ways to extend it. An extension with more to say about a class's parameters lists it
 * beneath them, by aliasing {@link Window_ClassParameters#drawAfterParameters}. An extension with a window
 * of its own places it beside the parameters, by aliasing {@link Scene_Classes#sideWindowDefinitions}: the
 * parameters then keep the left half, and the side windows share the right. Every window beside the list
 * answers `showClass(actor, classId)`.
 */
class Scene_Classes
  extends Scene_ActorFacetBase
{
  //region entry points
  /**
   * Opens the class scene.
   * @param {boolean} isChangingAllowed Whether confirming a class changes into it.
   */
  static callScene(isChangingAllowed)
  {
    SceneManager.push(this);
    SceneManager.prepareNextScene(isChangingAllowed);
  }

  /**
   * Opens the class scene from the main menu, which changes classes only when the game allows it.
   */
  static callFromMenu()
  {
    // the menu defers to the game's own rule about where classes change.
    const isChangingAllowed = ClassManager.canMenuChangeClasses();

    this.callScene(isChangingAllowed);
  }

  /**
   * Receives whether this scene may change classes.
   * @param {boolean} isChangingAllowed Whether confirming a class changes into it.
   */
  prepare(isChangingAllowed)
  {
    this.setChangingAllowed(isChangingAllowed);
  }

  //endregion entry points

  //region init
  /**
   * Extends {@link #initMembers}.<br/>
   * Also initializes the class scene's members.
   */
  initMembers()
  {
    // perform original logic.
    super.initMembers();

    /**
     * A grouping of all properties associated with the class scene.
     */
    this._j._class = {};

    /**
     * Whether confirming a class changes into it.
     * @type {boolean}
     */
    this._j._class._isChangingAllowed = false;

    /**
     * The list of the actor's classes.
     * @type {Window_ClassList|null}
     */
    this._j._class._classListWindow = null;

    /**
     * The highlighted class's description, across the top of everything beside the list.
     * @type {Window_ClassDescription|null}
     */
    this._j._class._descriptionWindow = null;

    /**
     * The parameters the highlighted class touches, and whatever extensions list beneath them.
     * @type {Window_ClassParameters|null}
     */
    this._j._class._parametersWindow = null;

    /**
     * The windows extensions placed beside the parameters, top to bottom.
     * @type {Window_Base[]}
     */
    this._j._class._sideWindows = [];
  }

  /**
   * The windows this scene places beside the parameters, top to bottom.
   *
   * J-Classes places none. An extension aliases this to add its own- each needs only a way to build its
   * window in the rectangle it is given. Once there is at least one, the parameters keep the left half of
   * the space beneath the description, and these share the right half between them.
   * @returns {Array<{createWindow: function(Rectangle): Window_Base}>}
   */
  sideWindowDefinitions()
  {
    return [];
  }

  //endregion init

  //region accessors
  /**
   * Gets whether confirming a class changes into it.
   * @returns {boolean}
   */
  isChangingAllowed()
  {
    return this._j._class._isChangingAllowed;
  }

  /**
   * Sets whether confirming a class changes into it.
   * @param {boolean} isChangingAllowed Whether changing classes is allowed.
   */
  setChangingAllowed(isChangingAllowed)
  {
    this._j._class._isChangingAllowed = isChangingAllowed;
  }

  /**
   * Gets the list of the actor's classes.
   * @returns {Window_ClassList|null}
   */
  classListWindow()
  {
    return this._j._class._classListWindow;
  }

  /**
   * Sets the list of the actor's classes.
   * @param {Window_ClassList} window The list window to track.
   */
  setClassListWindow(window)
  {
    this._j._class._classListWindow = window;
  }

  /**
   * Gets the window showing the highlighted class's description.
   * @returns {Window_ClassDescription|null}
   */
  descriptionWindow()
  {
    return this._j._class._descriptionWindow;
  }

  /**
   * Sets the window showing the highlighted class's description.
   * @param {Window_ClassDescription} window The description window to track.
   */
  setDescriptionWindow(window)
  {
    this._j._class._descriptionWindow = window;
  }

  /**
   * Gets the window listing the parameters the highlighted class touches.
   * @returns {Window_ClassParameters|null}
   */
  parametersWindow()
  {
    return this._j._class._parametersWindow;
  }

  /**
   * Sets the window listing the parameters the highlighted class touches.
   * @param {Window_ClassParameters} window The parameters window to track.
   */
  setParametersWindow(window)
  {
    this._j._class._parametersWindow = window;
  }

  /**
   * Gets the windows extensions placed beside the parameters, top to bottom.
   * @returns {Window_Base[]}
   */
  sideWindows()
  {
    return this._j._class._sideWindows;
  }

  /**
   * Sets the windows extensions placed beside the parameters.
   * @param {Window_Base[]} windows The side windows to track, top to bottom.
   */
  setSideWindows(windows)
  {
    this._j._class._sideWindows = windows;
  }

  /**
   * Gets every window beside the list, each of which shows the highlighted class.
   * @returns {Window_Base[]}
   */
  detailWindows()
  {
    return [ this.descriptionWindow(), this.parametersWindow(), ...this.sideWindows() ];
  }

  /**
   * Gets the class the list currently has highlighted.
   * @returns {RPG_Class}
   */
  highlightedClass()
  {
    return this.classListWindow()
      .currentExt();
  }

  /**
   * Determines whether any extension places a window beside the parameters.
   * @returns {boolean}
   */
  hasSideWindows()
  {
    return this.sideWindowDefinitions().length > 0;
  }

  //endregion accessors

  //region create
  /**
   * Extends {@link #create}.<br/>
   * Also creates the list and the windows beside it.
   */
  create()
  {
    // perform original logic.
    super.create();

    // create every window this scene places.
    this.createAllWindows();
  }

  /**
   * Creates every window this scene places, and lands on the class the actor is standing in.
   */
  createAllWindows()
  {
    // the list first, since everything beside it is sized from what it leaves.
    this.createClassListWindow();

    // then the description across the top beside it, the parameters beneath that, and any windows
    // extensions place beside the parameters.
    this.createDescriptionWindow();
    this.createParametersWindow();
    this.createSideWindows();

    // finally, highlight the class being worn and show it.
    this.selectCurrentClass();
    this.refreshDetails();
  }

  //region class list
  /**
   * Creates the list of the actor's classes and adds it to tracking.
   */
  createClassListWindow()
  {
    // build the window.
    const window = this.buildClassListWindow();

    // update the tracker with the new window.
    this.setClassListWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  /**
   * Builds and wires the list of the actor's classes.
   * @returns {Window_ClassList}
   */
  buildClassListWindow()
  {
    // define the rectangle for this window.
    const rectangle = this.classListWindowRect();

    // create the window with the rectangle.
    const window = new Window_ClassList(rectangle);

    // the scene decides whether confirming changes anything.
    window.setChangingAllowed(this.isChangingAllowed());

    // list whoever the menu currently considers selected.
    window.setActor(this.actor());

    // wire up input handlers.
    window.setHandler('ok', this.onClassOk.bind(this));
    window.setHandler('cancel', this.popScene.bind(this));
    window.setHandler('actor-prev', this.onCycleActorLeft.bind(this));
    window.setHandler('actor-next', this.onCycleActorRight.bind(this));

    // keep everything beside the list in step with whichever class is highlighted.
    window.onIndexChange = this.onClassHighlighted.bind(this);

    // return the built and configured window.
    return window;
  }

  /**
   * Builds the rectangle for the class list, down the left of the region beneath the ribbon.
   * @returns {Rectangle}
   */
  classListWindowRect()
  {
    // start from the region the base leaves beneath the ribbon.
    const contentArea = this.contentAreaRect();

    // the list is one standard command column wide, and runs the full height.
    return new Rectangle(contentArea.x, contentArea.y, this.commandColumnWidth(), contentArea.height);
  }

  //endregion class list

  //region beside the list
  /**
   * Builds the rectangle for everything beside the list.
   * @returns {Rectangle}
   */
  detailAreaRect()
  {
    // the list has already claimed its column.
    const listRect = this.classListWindowRect();
    const contentArea = this.contentAreaRect();

    // take what remains beside it, defined as the remainder so the two cannot drift apart.
    const x = listRect.x + listRect.width;
    const width = contentArea.width - listRect.width;

    return new Rectangle(x, contentArea.y, width, contentArea.height);
  }

  /**
   * Creates the description window and adds it to tracking.
   */
  createDescriptionWindow()
  {
    // define the rectangle for this window.
    const rectangle = this.descriptionWindowRect();

    // create the window with the rectangle.
    const window = new Window_ClassDescription(rectangle);

    // update the tracker with the new window.
    this.setDescriptionWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  /**
   * Builds the rectangle for the description: two lines across the top of everything beside the list.
   * @returns {Rectangle}
   */
  descriptionWindowRect()
  {
    const detailArea = this.detailAreaRect();

    // two lines, the same as any help text in the menus.
    const height = this.calcWindowHeight(2, false);

    return new Rectangle(detailArea.x, detailArea.y, detailArea.width, height);
  }

  /**
   * Builds the rectangle for everything beside the list beneath the description, which the parameters and
   * the side windows share.
   * @returns {Rectangle}
   */
  detailBodyRect()
  {
    const detailArea = this.detailAreaRect();
    const descriptionRect = this.descriptionWindowRect();

    // everything under the description, defined as the remainder so the two cannot drift apart.
    const y = descriptionRect.y + descriptionRect.height;
    const height = detailArea.height - descriptionRect.height;

    return new Rectangle(detailArea.x, y, detailArea.width, height);
  }

  /**
   * Creates the parameters window and adds it to tracking.
   */
  createParametersWindow()
  {
    // define the rectangle for this window.
    const rectangle = this.parametersWindowRect();

    // create the window with the rectangle.
    const window = new Window_ClassParameters(rectangle);

    // update the tracker with the new window.
    this.setParametersWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  /**
   * Builds the rectangle for the parameters window: everything beneath the description, or its left half once
   * an extension places a window of its own beside it.
   * @returns {Rectangle}
   */
  parametersWindowRect()
  {
    const detailBody = this.detailBodyRect();

    // alone beneath the description, the parameters take all of it.
    if (this.hasSideWindows() === false) return detailBody;

    // otherwise they keep the left half, and the side windows share the right.
    const width = Math.floor(detailBody.width / 2);

    return new Rectangle(detailBody.x, detailBody.y, width, detailBody.height);
  }

  /**
   * Creates every window extensions place beside the parameters, and adds them to tracking.
   */
  createSideWindows()
  {
    const definitions = this.sideWindowDefinitions();

    // build each window in its share of the right half, top to bottom.
    const windows = definitions.map((definition, index) =>
    {
      const rectangle = this.sideWindowRect(index, definitions.length);
      const window = definition.createWindow(rectangle);

      // add the window to the scene manager's tracking.
      this.addWindow(window);

      return window;
    });

    // update the tracker with the new windows.
    this.setSideWindows(windows);
  }

  /**
   * Builds the rectangle for one side window: an equal share of the space beside the parameters.
   * @param {number} index The side window's place, from the top.
   * @param {number} count How many side windows share the space.
   * @returns {Rectangle}
   */
  sideWindowRect(index, count)
  {
    const detailBody = this.detailBodyRect();
    const parametersRect = this.parametersWindowRect();

    // everything the parameters leave, defined as the remainder so the two cannot drift apart.
    const x = parametersRect.x + parametersRect.width;
    const width = detailBody.width - parametersRect.width;

    // shared top to bottom, each window taking an equal slice.
    const height = Math.floor(detailBody.height / count);
    const y = detailBody.y + (index * height);

    return new Rectangle(x, y, width, height);
  }

  //endregion beside the list

  /**
   * Overrides {@link Scene_MenuFacetBase.hasHelpWindow}.<br/>
   * Declines the help strip across the top.
   *
   * Everything beside the list already opens with the highlighted class's own description, which is all a
   * help strip would have to say.
   * @returns {boolean}
   */
  hasHelpWindow()
  {
    return false;
  }

  /**
   * Implements {@link Scene_MenuFacetBase.controlLegendEntries}.<br/>
   * Describes the controls this scene responds to, which depend on how it was opened.
   * @returns {{semantic: (string|string[]), label: string}[]}
   */
  controlLegendEntries()
  {
    const entries = [];

    // confirming only deserves a mention when it can actually change a class.
    if (this.isChangingAllowed())
    {
      entries.push({
        semantic: 'ok',
        label: 'change class',
      });
    }

    // every actor-scoped scene switches characters and backs out the same way.
    entries.push({
      semantic: [ 'actor-prev', 'actor-next' ],
      label: 'switch character',
    });
    entries.push({
      semantic: 'cancel',
      label: 'back',
    });

    return entries;
  }

  //endregion create

  //region actions
  /**
   * Highlights the class the actor is standing in.
   */
  selectCurrentClass()
  {
    // the class being worn is where every visit to this scene starts.
    const currentClass = this.actor()
      .currentClass();

    this.classListWindow()
      .selectExt(currentClass);
  }

  /**
   * Points every window beside the list at the highlighted class- or, for a class the actor has yet to
   * unlock, puts them all away, since a "???" row gives nothing about its class away.
   */
  refreshDetails()
  {
    const highlightedClass = this.highlightedClass();

    // a class still to unlock shows nothing beyond its row.
    if (ClassManager.isClassRevealed(this.actor(), highlightedClass.id) === false)
    {
      this.hideDetails();
      return;
    }

    this.showDetails(highlightedClass);
  }

  /**
   * Shows every window beside the list, each drawing the given class for whichever actor is being viewed.
   * @param {RPG_Class} dataClass The class to show.
   */
  showDetails(dataClass)
  {
    this.detailWindows()
      .forEach(window =>
      {
        window.show();
        window.showClass(this.actor(), dataClass.id);
      });
  }

  /**
   * Puts away every window beside the list.
   */
  hideDetails()
  {
    this.detailWindows()
      .forEach(window => window.hide());
  }

  /**
   * Keeps everything beside the list on whichever class the cursor moved to.
   */
  onClassHighlighted()
  {
    // show the newly highlighted class.
    this.refreshDetails();
  }

  /**
   * Changes the actor into the highlighted class.
   *
   * The list only calls this once it has agreed the class can be changed into, so everything here is the
   * change itself and bringing the screen up to date with it.
   */
  onClassOk()
  {
    // change into whatever is highlighted.
    const highlightedClass = this.highlightedClass();
    ClassManager.changeClass(this.actor(), highlightedClass.id);

    // the list marks the class being worn, and may even have lost the class just left behind.
    const listWindow = this.classListWindow();
    listWindow.refresh();

    // so land back on the class just changed into, and show it as the class now worn.
    listWindow.selectExt(highlightedClass);
    this.refreshDetails();

    // a confirmed command deactivates the window, so it has to be handed back its own input.
    listWindow.activate();
  }

  /**
   * Extends {@link #onActorChange}.<br/>
   * Also lists the new actor's classes, landing on the one they are standing in.
   */
  onActorChange()
  {
    // perform original logic.
    super.onActorChange();

    // list the new actor's classes.
    const listWindow = this.classListWindow();
    listWindow.setActor(this.actor());

    // land on the class they are standing in, and show it.
    this.selectCurrentClass();
    this.refreshDetails();

    // cycling was pressed on the list, which deactivated it, so it has to be handed back its input.
    listWindow.activate();
  }

  //endregion actions
}

export default Scene_Classes;
//endregion Scene_Classes