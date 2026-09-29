//region Scene_Difficulty
import DifficultyManager from './../managers/DifficultyManager.js';
import DifficultyEffects from './../services/DifficultyEffects.js';
import Window_DifficultyEffectList from '../windows/Window_DifficultyEffectList.js';
import Window_DifficultyList from '../windows/Window_DifficultyList.js';
import Window_DifficultyPoints from '../windows/Window_DifficultyPoints.js';

/**
 * The difficulty scene, where the player turns difficulty layers on and off.
 *
 * Built on {@link Scene_MenuFacetBase}, which owns the chrome: the help strip across the top describes the
 * highlighted layer, and the control legend across the bottom teaches the controls. In the region between
 * them, the command column holds the layer points above the list of layers, and the rest is split down the
 * middle between the two sides of every fight, each listing what the highlighted layer does to it.
 *
 * The first row of the list is the applied difficulty, which stands for every layer in force at once, so
 * highlighting it lists everything the player currently has on, merged into one row per stat.
 */
class Scene_Difficulty
  extends Scene_MenuFacetBase
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
   *
   * No explicit `initialize()` call: the engine's own scene constructor performs one, and a second would run
   * the whole initialization twice.
   */
  constructor()
  {
    super();
  }

  /**
   * Extends {@link Scene_MenuFacetBase.initMembers}.<br/>
   * Also initializes the windows this scene tracks.
   */
  initMembers()
  {
    // perform original logic, which seeds the shared namespace and the facet skeleton's own members.
    super.initMembers();

    /**
     * A grouping of all properties associated with the difficulty scene.
     */
    this._j._difficulty = {};

    /**
     * The window showing the layer point budget, and what the highlighted layer would cost.
     * @type {Window_DifficultyPoints|null}
     */
    this._j._difficulty._pointsWindow = null;

    /**
     * The list of difficulty layers the player may see.
     * @type {Window_DifficultyList|null}
     */
    this._j._difficulty._listWindow = null;

    /**
     * The list of what the highlighted layer does to the party.
     * @type {Window_DifficultyEffectList|null}
     */
    this._j._difficulty._actorEffectsWindow = null;

    /**
     * The list of what the highlighted layer does to the enemies.
     * @type {Window_DifficultyEffectList|null}
     */
    this._j._difficulty._enemyEffectsWindow = null;
  }

  //region create
  /**
   * Extends {@link Scene_MenuFacetBase.create}.<br/>
   * Also creates the help strip and this scene's own windows.
   */
  create()
  {
    // perform original logic, which builds the control legend.
    super.create();

    // the strip across the top describes whichever layer is highlighted.
    this.createHelpWindow();

    // everything within the region between the help strip and the legend.
    this.createAllWindows();
  }

  /**
   * Creates all windows associated with the difficulty scene, then shows the highlighted layer in them.
   */
  createAllWindows()
  {
    // the windows that only display, first.
    this.createPointsWindow();
    this.createActorEffectsWindow();
    this.createEnemyEffectsWindow();

    // the list last, since it is the one holding the cursor.
    this.createListWindow();

    // show the row the list opens on, which is the applied difficulty.
    this.onHoverChange();
  }

  /**
   * Implements {@link Scene_MenuFacetBase.controlLegendEntries}.<br/>
   * Describes the controls this scene responds to.
   * @returns {{semantic: string, label: string}[]}
   */
  controlLegendEntries()
  {
    return [
      {
        semantic: 'ok',
        label: 'toggle layer',
      },
      {
        semantic: 'cancel',
        label: 'back',
      },
    ];
  }
  //endregion create

  //region layout
  /**
   * The height of the points window, which draws a header and one row.
   * @returns {number}
   */
  pointsWindowHeight()
  {
    return this.calcWindowHeight(2, false);
  }

  /**
   * The width of each effects list: half of what the command column leaves over.
   * @returns {number}
   */
  effectsListWidth()
  {
    const facetArea = this.facetAreaRect();
    const leftOver = facetArea.width - this.commandColumnWidth();

    return Math.floor(leftOver / 2);
  }

  /**
   * Gets the rectangle for the points window, atop the command column.
   * @returns {Rectangle}
   */
  pointsWindowRect()
  {
    const facetArea = this.facetAreaRect();
    const width = this.commandColumnWidth();
    const height = this.pointsWindowHeight();

    return new Rectangle(facetArea.x, facetArea.y, width, height);
  }

  /**
   * Gets the rectangle for the list of layers, filling the command column beneath the points window.
   * @returns {Rectangle}
   */
  listWindowRect()
  {
    const facetArea = this.facetAreaRect();
    const pointsHeight = this.pointsWindowHeight();
    const y = facetArea.y + pointsHeight;
    const width = this.commandColumnWidth();
    const height = facetArea.height - pointsHeight;

    return new Rectangle(facetArea.x, y, width, height);
  }

  /**
   * Gets the rectangle for the party's effects, beside the command column and the full height of the region.
   * @returns {Rectangle}
   */
  actorEffectsWindowRect()
  {
    const facetArea = this.facetAreaRect();
    const x = facetArea.x + this.commandColumnWidth();
    const width = this.effectsListWidth();

    return new Rectangle(x, facetArea.y, width, facetArea.height);
  }

  /**
   * Gets the rectangle for the enemies' effects, from the party's list to the edge of the region.
   *
   * Its width is the remainder rather than a second half, so rounding can never leave a seam of unclaimed
   * pixels at the right edge.
   * @returns {Rectangle}
   */
  enemyEffectsWindowRect()
  {
    const facetArea = this.facetAreaRect();
    const x = facetArea.x + this.commandColumnWidth() + this.effectsListWidth();
    const width = facetArea.x + facetArea.width - x;

    return new Rectangle(x, facetArea.y, width, facetArea.height);
  }
  //endregion layout

  //region points window
  /**
   * Creates the points window and adds it to tracking.
   */
  createPointsWindow()
  {
    // create the window.
    const window = this.buildPointsWindow();

    // update the tracker with the new window.
    this.setPointsWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  /**
   * Sets up and defines the points window.
   * @returns {Window_DifficultyPoints}
   */
  buildPointsWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.pointsWindowRect();

    // create the window with the rectangle.
    return new Window_DifficultyPoints(rectangle);
  }

  /**
   * Get the currently tracked points window.
   * @returns {Window_DifficultyPoints}
   */
  getPointsWindow()
  {
    return this._j._difficulty._pointsWindow;
  }

  /**
   * Set the currently tracked points window to the given window.
   * @param {Window_DifficultyPoints} pointsWindow The points window to track.
   */
  setPointsWindow(pointsWindow)
  {
    this._j._difficulty._pointsWindow = pointsWindow;
  }
  //endregion points window

  //region list window
  /**
   * Creates the list of difficulties available to the player.
   */
  createListWindow()
  {
    // create the window.
    const window = this.buildListWindow();

    // update the tracker with the new window.
    this.setDifficultyListWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  /**
   * Sets up and defines the difficulty list window.
   * @returns {Window_DifficultyList}
   */
  buildListWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.listWindowRect();

    // create the window with the rectangle.
    const window = new Window_DifficultyList(rectangle);

    // assign cancel functionality.
    window.setHandler('cancel', this.popScene.bind(this));

    // assign on-select functionality.
    window.setHandler('ok', this.onSelectDifficulty.bind(this));

    // overwrite the onIndexChange hook with our local onHoverChange hook.
    window.onIndexChange = this.onHoverChange.bind(this);

    // return the built and configured difficulty list window.
    return window;
  }

  /**
   * Get the currently tracked difficulty list window.
   * @returns {Window_DifficultyList}
   */
  getDifficultyListWindow()
  {
    return this._j._difficulty._listWindow;
  }

  /**
   * Set the currently tracked difficulty list window to the given window.
   * @param {Window_DifficultyList} difficultyListWindow The difficulty list window to track.
   */
  setDifficultyListWindow(difficultyListWindow)
  {
    this._j._difficulty._listWindow = difficultyListWindow;
  }
  //endregion list window

  //region effects windows
  /**
   * Creates the list of what the highlighted layer does to the party.
   */
  createActorEffectsWindow()
  {
    // create the window.
    const window = this.buildActorEffectsWindow();

    // update the tracker with the new window.
    this.setActorEffectsWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  /**
   * Sets up and defines the party's effects list.
   * @returns {Window_DifficultyEffectList}
   */
  buildActorEffectsWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.actorEffectsWindowRect();

    // create the window for the party's side.
    return this.buildEffectsWindow(rectangle, DifficultyEffects.Sides.ACTOR);
  }

  /**
   * Creates the list of what the highlighted layer does to the enemies.
   */
  createEnemyEffectsWindow()
  {
    // create the window.
    const window = this.buildEnemyEffectsWindow();

    // update the tracker with the new window.
    this.setEnemyEffectsWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  /**
   * Sets up and defines the enemies' effects list.
   * @returns {Window_DifficultyEffectList}
   */
  buildEnemyEffectsWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.enemyEffectsWindowRect();

    // create the window for the enemies' side.
    return this.buildEffectsWindow(rectangle, DifficultyEffects.Sides.ENEMY);
  }

  /**
   * Builds an effects list for one side of every fight.
   * @param {Rectangle} rectangle The rectangle of the window.
   * @param {string} side One of {@link DifficultyEffects.Sides}.
   * @returns {Window_DifficultyEffectList}
   */
  buildEffectsWindow(rectangle, side)
  {
    // create the window with the rectangle.
    const window = new Window_DifficultyEffectList(rectangle);

    // tell it which side of the fight it describes.
    window.setSide(side);

    // return the built window.
    return window;
  }

  /**
   * Get the currently tracked list of the party's effects.
   * @returns {Window_DifficultyEffectList}
   */
  getActorEffectsWindow()
  {
    return this._j._difficulty._actorEffectsWindow;
  }

  /**
   * Set the currently tracked list of the party's effects.
   * @param {Window_DifficultyEffectList} actorEffectsWindow The list to track.
   */
  setActorEffectsWindow(actorEffectsWindow)
  {
    this._j._difficulty._actorEffectsWindow = actorEffectsWindow;
  }

  /**
   * Get the currently tracked list of the enemies' effects.
   * @returns {Window_DifficultyEffectList}
   */
  getEnemyEffectsWindow()
  {
    return this._j._difficulty._enemyEffectsWindow;
  }

  /**
   * Set the currently tracked list of the enemies' effects.
   * @param {Window_DifficultyEffectList} enemyEffectsWindow The list to track.
   */
  setEnemyEffectsWindow(enemyEffectsWindow)
  {
    this._j._difficulty._enemyEffectsWindow = enemyEffectsWindow;
  }
  //endregion effects windows

  /**
   * Gets the difficulty being hovered over in the difficulty list.
   * @returns {DifficultyLayer}
   */
  hoveredDifficulty()
  {
    // grab the list window.
    const listWindow = this.getDifficultyListWindow();

    // pull the item the cursor is hovering over from the list window.
    return listWindow.hoveredDifficulty();
  }

  //region on-hover
  /**
   * Refreshes everything that describes the highlighted layer, whenever the highlight moves.
   */
  onHoverChange()
  {
    // update the points window.
    this.onHoverUpdatePoints();

    // update the help window.
    this.onHoverUpdateHelp();

    // update both effects lists.
    this.onHoverUpdateEffects();
  }

  /**
   * Updates the points window when the hovered difficulty changes.
   */
  onHoverUpdatePoints()
  {
    // grab the hovered difficulty.
    const hoveredDifficulty = this.hoveredDifficulty();

    // grab the points window.
    const pointsWindow = this.getPointsWindow();

    // update the hovered difficulty for the points window.
    pointsWindow.setHoveredDifficulty(hoveredDifficulty);

    // also refresh the points window.
    pointsWindow.refresh();
  }

  /**
   * Updates the help window when the hovered difficulty changes.
   */
  onHoverUpdateHelp()
  {
    // grab the hovered difficulty.
    const hoveredDifficulty = this.hoveredDifficulty();

    // grab the help window.
    const helpWindow = this.helpWindow();

    // set the text of the hovered difficulty for the help window.
    helpWindow.setText(hoveredDifficulty.description);
  }

  /**
   * Updates both effects lists when the hovered difficulty changes.
   */
  onHoverUpdateEffects()
  {
    // grab the hovered difficulty.
    const hoveredDifficulty = this.hoveredDifficulty();

    // what it does to each side of every fight.
    const actorRows = DifficultyEffects.rowsFor(hoveredDifficulty, DifficultyEffects.Sides.ACTOR);
    const enemyRows = DifficultyEffects.rowsFor(hoveredDifficulty, DifficultyEffects.Sides.ENEMY);

    // hand each list its side.
    const actorEffectsWindow = this.getActorEffectsWindow();
    const enemyEffectsWindow = this.getEnemyEffectsWindow();
    actorEffectsWindow.setRows(actorRows);
    enemyEffectsWindow.setRows(enemyRows);
  }
  //endregion on-hover

  //region on-select
  /**
   * Runs when the user chooses one of the items in the difficulty list.
   */
  onSelectDifficulty()
  {
    // grab the hovered difficulty.
    const hovered = this.hoveredDifficulty();

    // check if the hovered difficulty is currently enabled.
    if (hovered.isEnabled())
    {
      // disable this difficulty.
      DifficultyManager.disableDifficulty(hovered.key);

      // run the disable difficulty hook.
      this.onDisableDifficulty(hovered);
    }
    else
    {
      // enable this difficulty.
      DifficultyManager.enableDifficulty(hovered.key);

      // run the enable difficulty hook.
      this.onEnableDifficulty(hovered);
    }

    // refresh the difficulty windows.
    this.refreshCoreDifficultyWindows();

    // grab the list window to activate.
    const listWindow = this.getDifficultyListWindow();

    // redirect the player back to enable/disable another item.
    listWindow.activate();
  }

  /**
   * A hook for performing logic when a difficulty layer is disabled.
   * @param {DifficultyLayer} difficulty The difficulty layer being disabled.
   */
  onDisableDifficulty(difficulty)
  {
    // refund the difficulty cost.
    this.refundDifficultyCost(difficulty);

    // play a sound to indicate cancellation of the layer.
    SoundManager.playActorDamage();
  }

  /**
   * Refunds a disabled layer's cost back into the player's layer points.
   * @param {DifficultyLayer} difficulty The difficulty layer being disabled.
   */
  refundDifficultyCost(difficulty)
  {
    // the refund is the inverse of the cost.
    const refund = (difficulty.cost * -1);

    // refund the layer points back.
    $gameSystem.modLayerPoints(refund);
  }

  /**
   * A hook for performing logic when a difficulty layer is enabled.
   * @param {DifficultyLayer} difficulty The difficulty layer being enabled.
   */
  onEnableDifficulty(difficulty)
  {
    // apply the difficulty cost.
    this.applyDifficultyCost(difficulty);

    // play a sound to indicate acceptance of the layer.
    SoundManager.playUseSkill();
  }

  /**
   * Spends an enabled layer's cost out of the player's layer points.
   * @param {DifficultyLayer} difficulty The difficulty layer being enabled.
   */
  applyDifficultyCost(difficulty)
  {
    // modify the layer points by the difficulty layer's cost.
    $gameSystem.modLayerPoints(difficulty.cost);
  }
  //endregion on-select

  /**
   * Refreshes the list, then everything describing the highlighted layer.
   */
  refreshCoreDifficultyWindows()
  {
    // the list first: a toggle changes its icons, which layers are affordable, and the applied row.
    const listWindow = this.getDifficultyListWindow();
    listWindow.refresh();

    // then everything describing the highlighted layer, read against the refreshed list.
    this.onHoverChange();
  }
}

export default Scene_Difficulty;
//endregion Scene_Difficulty