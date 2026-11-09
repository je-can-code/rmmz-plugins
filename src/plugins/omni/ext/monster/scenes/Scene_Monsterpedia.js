//region Scene_Monsterpedia
import MonsterpediaTypes from '../managers/MonsterpediaTypes.js';
import Window_MonsterpediaList from '../windows/Window_MonsterpediaList.js';
import Window_MonsterpediaDetail from '../windows/Window_MonsterpediaDetail.js';

/**
 * A scene for perusing the monsters the player has perceived.
 *
 * Built on the facet skeleton rather than laid out from scratch, so it shares the control legend and
 * the bounded region every other menu in the ecosystem draws inside. The left column lists every
 * entry that can be observed on the open page, beneath a strip naming that page; the right side
 * details whichever entry is highlighted. Each page lists one kind of entry, ordinary enemies or
 * destructibles or whatever else the omnipedia's configuration authors, and L2/R2 flips between them.
 * There is nothing to confirm here, only to read.
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
     * The L2/R2 ring of pages this scene flips between, one per kind of entry.
     * @type {FilterCycle}
     */
    this._j._omni._monster._typeFilter = new FilterCycle(this.buildTypePositions());

    /**
     * The strip naming whichever page is currently open.
     * @type {Window_FilterStrip}
     */
    this._j._omni._monster._typeStrip = null;

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

  /**
   * The positions of the page ring, in the order the kinds of entry were authored.
   * @returns {{key: string, name: string, iconIndex: number, showsStats: boolean}[]}
   */
  buildTypePositions()
  {
    return MonsterpediaTypes.positions();
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

    // build the strip naming the page, the column of entries, and the pane detailing the highlighted one.
    this.createTypeStripWindow();
    this.createMonsterpediaListWindow();
    this.createMonsterpediaDetailWindow();

    // point everything at whichever page the ring starts on.
    this.applyActiveType();

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
   * The rectangle for the page strip, crowning the left column.
   * @returns {Rectangle}
   */
  typeStripRectangle()
  {
    const facetArea = this.facetAreaRect();
    const height = this.calcWindowHeight(1, false);

    return new Rectangle(facetArea.x, facetArea.y, this.commandColumnWidth(), height);
  }

  /**
   * The rectangle for the monster list, filling the left column beneath the strip.
   * @returns {Rectangle}
   */
  monsterpediaListRectangle()
  {
    const facetArea = this.facetAreaRect();
    const stripRectangle = this.typeStripRectangle();
    const y = stripRectangle.y + stripRectangle.height;
    const height = facetArea.y + facetArea.height - y;

    return new Rectangle(facetArea.x, y, this.commandColumnWidth(), height);
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
   * Teaches the one control that leaves no mark on screen until pressed: the shoulder triggers that
   * flip between pages. Moving the cursor is self-evident and cancel is named by what it lands on.
   * @returns {{semantic: (string|string[]), label: string}[]}
   */
  controlLegendEntries()
  {
    return [
      {
        semantic: [ 'content-prev', 'content-next' ],
        label: 'pedia',
      },
    ];
  }

  //endregion layout

  //region type strip
  /**
   * Creates the strip naming the open page.
   */
  createTypeStripWindow()
  {
    const window = this.buildTypeStripWindow();

    this.setTypeStripWindow(window);
    this.addWindow(window);
  }

  /**
   * Sets up and defines the page strip window.
   * @returns {Window_FilterStrip}
   */
  buildTypeStripWindow()
  {
    const rectangle = this.typeStripRectangle();

    return new Window_FilterStrip(rectangle);
  }

  /**
   * Gets the currently tracked page strip window.
   * @returns {Window_FilterStrip}
   */
  getTypeStripWindow()
  {
    return this._j._omni._monster._typeStrip;
  }

  /**
   * Sets the currently tracked page strip window.
   * @param {Window_FilterStrip} stripWindow The page strip window to track.
   */
  setTypeStripWindow(stripWindow)
  {
    this._j._omni._monster._typeStrip = stripWindow;
  }

  //endregion type strip

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

    // the shoulder triggers walk the page ring in either direction.
    window.setHandler('content-next', this.cycleMonsterTypes.bind(this, true));
    window.setHandler('content-prev', this.cycleMonsterTypes.bind(this, false));

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
   * The page ring this scene flips through.
   * @returns {FilterCycle}
   */
  getTypeFilter()
  {
    return this._j._omni._monster._typeFilter;
  }

  /**
   * Points the strip and the list at whichever page is now open, then the detail at whatever the list
   * lands on.
   */
  applyActiveType()
  {
    const typeFilter = this.getTypeFilter();
    const activePosition = typeFilter.activePosition();

    this.getTypeStripWindow()
      .setPosition(activePosition);

    const listWindow = this.getMonsterpediaListWindow();
    listWindow.setCurrentTypeKey(activePosition.key);
    listWindow.refresh();

    // a page with fewer entries than the one before it would otherwise leave the cursor past the end.
    listWindow.select(0);

    this.onMonsterpediaIndexChange();
  }

  /**
   * Walks the page ring, wrapping at either end.
   * @param {boolean} isForward Whether to walk forwards.
   */
  cycleMonsterTypes(isForward)
  {
    const typeFilter = this.getTypeFilter();
    const listWindow = this.getMonsterpediaListWindow();

    // a single page is not a ring; pressing the trigger would land exactly where the player already is.
    if (!typeFilter.canCycle())
    {
      SoundManager.playBuzzer();
      listWindow.activate();
      return;
    }

    if (isForward)
    {
      typeFilter.next();
    }
    else
    {
      typeFilter.previous();
    }

    SoundManager.playCursor();
    this.applyActiveType();

    // a handled input deactivates the window, so it has to be handed back its own input.
    listWindow.activate();
  }

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