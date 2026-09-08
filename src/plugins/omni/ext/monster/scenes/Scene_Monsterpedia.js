//region Scene_Monsterpedia
import Window_MonsterpediaList from '../windows/Window_MonsterpediaList.js';
import Window_MonsterpediaDetail from '../windows/Window_MonsterpediaDetail.js';

/**
 * A scene for perusing the monsters the player has perceived.
 *
 * Built on the facet skeleton rather than laid out from scratch, so it shares the control legend and
 * the bounded region every other menu in the ecosystem draws inside. The left column lists every
 * monster that can be observed; the right side details whichever one is highlighted. There is
 * nothing to confirm here, only to read.
 */
class Scene_Monsterpedia
  extends Scene_MenuFacetBase
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

  /**
   * A debug function that unlocks everything in the monsterpedia.
   */
  static unlockAllMonsterpediaEntries()
  {
    // an iterator function for unlocking all observations associated with all monsters in the database.
    const forEacher = enemy =>
    {
      // skip null enemies.
      if (!enemy) return;

      // grab the database data of the enemy.
      const gameEnemy = $gameEnemies.enemy(enemy.id);

      // update their respective monsterpedia observations.
      gameEnemy.updateMonsterpediaObservation();

      // grab their observations.
      const observations = $gameParty.getOrCreateMonsterpediaObservationsById(enemy.id);

      // grab all drops available from this enemy.
      const allDrops = gameEnemy.getDropItems();

      // iterate over each potential drop and add it as being observed.
      allDrops.forEach(drop => observations.addKnownDrop(drop.kind, drop.dataId), this);

      // iterate over all standard damage-type elements in the context of CA (Cut through Typeless).
      [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ].forEach(id => observations.addKnownElementalistic(id), this);
    };

    // iterate over every enemy.
    $dataEnemies.forEach(forEacher, this);
  }

  //region init
  /**
   * Extends {@link #initMembers}.<br/>
   * Also initializes the monsterpedia's own members.
   */
  initMembers()
  {
    // perform original logic.
    super.initMembers();

    /**
     * A grouping of all properties associated with the omnipedia.
     */
    this._j._omni = {};

    /**
     * A grouping of all properties associated with the monsterpedia.
     * The monsterpedia is a subcategory of the omnipedia.
     */
    this._j._omni._monster = {};

    /**
     * The window that shows the list of perceived monsters.
     * @type {Window_MonsterpediaList}
     */
    this._j._omni._monster._pediaList = null;

    /**
     * The window that shows the details observed of a perceived monster.
     * @type {Window_MonsterpediaDetail}
     */
    this._j._omni._monster._pediaDetail = null;
  }

  //endregion init

  //region create
  /**
   * Extends {@link #create}.<br/>
   * Also creates this scene's own windows.
   */
  create()
  {
    // perform original logic, which builds the chrome shared by every facet scene.
    super.create();

    // build the column of monsters and the pane detailing the highlighted one.
    this.createMonsterpediaListWindow();
    this.createMonsterpediaDetailWindow();

    // point the detail at whatever the cursor starts on.
    this.onMonsterpediaIndexChange();

    // the monster list is the only thing here that takes input.
    this.getMonsterpediaListWindow()
      .activate();
  }

  /**
   * Overwrites {@link Scene_MenuBase.prototype.createBackground}.<br/>
   * Keeps the map faintly visible behind the pedia.
   */
  createBackground()
  {
    this.setBackgroundFilter(new PIXI.filters.AlphaFilter(0.1));
    this.setBackgroundSprite(new Sprite());
    this.backgroundSprite().bitmap = SceneManager.backgroundBitmap();
    this.backgroundSprite().filters = [ this.backgroundFilter() ];
    this.addChild(this.backgroundSprite());
  }

  //endregion create

  //region layout
  /**
   * Overrides {@link #hasHelpWindow}.<br/>
   * The detail pane is this scene's help; a strip across the top would only repeat it.
   * @returns {boolean}
   */
  hasHelpWindow()
  {
    return false;
  }

  /**
   * The rectangle for the monster list, filling the left column of the region.
   * @returns {Rectangle}
   */
  monsterpediaListRectangle()
  {
    const facetArea = this.facetAreaRect();

    return new Rectangle(facetArea.x, facetArea.y, this.commandColumnWidth(), facetArea.height);
  }

  /**
   * The rectangle for the detail pane, filling the region beside the list.
   * @returns {Rectangle}
   */
  monsterpediaDetailRectangle()
  {
    const facetArea = this.facetAreaRect();
    const x = facetArea.x + this.commandColumnWidth();
    const width = facetArea.x + facetArea.width - x;

    return new Rectangle(x, facetArea.y, width, facetArea.height);
  }

  /**
   * Implements {@link #controlLegendEntries}.<br/>
   * There is nothing here that leaves no mark on screen: moving the cursor is self-evident and
   * cancel is named by what it lands on, so the legend has nothing to teach.
   * @returns {{semantic: (string|string[]), label: string}[]}
   */
  controlLegendEntries()
  {
    return [];
  }

  //endregion layout

  //region list window
  /**
   * Creates the list of monsters the player has perceived.
   */
  createMonsterpediaListWindow()
  {
    const window = this.buildMonsterpediaListWindow();

    this.setMonsterpediaListWindow(window);
    this.addWindow(window);
  }

  /**
   * Sets up and defines the monsterpedia listing window.
   * @returns {Window_MonsterpediaList}
   */
  buildMonsterpediaListWindow()
  {
    const rectangle = this.monsterpediaListRectangle();
    const window = new Window_MonsterpediaList(rectangle);

    // cancel is the only way out; there is nothing to confirm.
    window.setHandler('cancel', this.onCancelMonsterpedia.bind(this));

    // the detail pane follows whatever the cursor lands on.
    window.onIndexChange = this.onMonsterpediaIndexChange.bind(this);

    return window;
  }

  /**
   * Gets the currently tracked monsterpedia list window.
   * @returns {Window_MonsterpediaList}
   */
  getMonsterpediaListWindow()
  {
    return this._j._omni._monster._pediaList;
  }

  /**
   * Sets the currently tracked monsterpedia list window to the given window.
   * @param {Window_MonsterpediaList} listWindow The monsterpedia list window to track.
   */
  setMonsterpediaListWindow(listWindow)
  {
    this._j._omni._monster._pediaList = listWindow;
  }

  //endregion list window

  //region detail window
  /**
   * Creates the detail of a single monster the player has perceived.
   */
  createMonsterpediaDetailWindow()
  {
    const window = this.buildMonsterpediaDetailWindow();

    this.setMonsterpediaDetailWindow(window);

    // populate all image sprites used in this window.
    window.populateImageCache();

    this.addWindow(window);
  }

  /**
   * Sets up and defines the monsterpedia detail window.
   * @returns {Window_MonsterpediaDetail}
   */
  buildMonsterpediaDetailWindow()
  {
    const rectangle = this.monsterpediaDetailRectangle();

    return new Window_MonsterpediaDetail(rectangle);
  }

  /**
   * Gets the currently tracked monsterpedia detail window.
   * @returns {Window_MonsterpediaDetail}
   */
  getMonsterpediaDetailWindow()
  {
    return this._j._omni._monster._pediaDetail;
  }

  /**
   * Sets the currently tracked monsterpedia detail window to the given window.
   * @param {Window_MonsterpediaDetail} detailWindow The monsterpedia detail window to track.
   */
  setMonsterpediaDetailWindow(detailWindow)
  {
    this._j._omni._monster._pediaDetail = detailWindow;
  }

  //endregion detail window

  //region actions
  /**
   * Synchronizes the detail pane with the highlighted monster.
   */
  onMonsterpediaIndexChange()
  {
    const listWindow = this.getMonsterpediaListWindow();
    const detailWindow = this.getMonsterpediaDetailWindow();

    // grab the highlighted monster's observations.
    const highlightedEnemyObservations = listWindow.currentExt();

    // sync the detail window with the currently-highlighted monster.
    detailWindow.setObservations(highlightedEnemyObservations);
    detailWindow.refresh();
  }

  /**
   * Closes the monsterpedia and returns to the omnipedia.
   */
  onCancelMonsterpedia()
  {
    SceneManager.pop();
  }

  //endregion actions
}

export default Scene_Monsterpedia;
//endregion Scene_Monsterpedia