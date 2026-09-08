//region Scene_Questopedia
import QuestManager from './../managers/QuestManager.js';
import Window_QuestopediaList from '../windows/Window_QuestopediaList.js';
import Window_QuestopediaDescription from '../windows/Window_QuestopediaDescription.js';
import Window_QuestopediaObjectives from '../windows/Window_QuestopediaObjectives.js';

/**
 * A scene for perusing the quests the player knows about, and choosing which to track.
 *
 * Built on the facet skeleton rather than laid out from scratch, so it shares the control legend and
 * the bounded region every other menu in the ecosystem draws inside. The left column is a strip
 * naming the category being browsed with the quests of that category beneath it; the right side is
 * the highlighted quest's description above its objectives. The shoulder triggers walk the
 * categories, and confirming a quest toggles whether it is tracked on the map.
 */
class Scene_Questopedia
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

  //region init
  /**
   * Extends {@link #initMembers}.<br/>
   * Also initializes the questopedia's own members.
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
     * A grouping of all properties associated with the questopedia.
     * The questopedia is a subcategory of the omnipedia.
     */
    this._j._omni._quest = {};

    /**
     * The L2/R2 ring of quest categories this scene pages through.
     * @type {FilterCycle}
     */
    this._j._omni._quest._categoryFilter = new FilterCycle(this.buildCategoryPositions());

    /**
     * The strip naming whichever category is currently being browsed.
     * @type {Window_FilterStrip}
     */
    this._j._omni._quest._categoryStrip = null;

    /**
     * The window that shows the list of known quests.
     * @type {Window_QuestopediaList}
     */
    this._j._omni._quest._pediaList = null;

    /**
     * The window that shows the description of the selected quest.
     * @type {Window_QuestopediaDescription}
     */
    this._j._omni._quest._pediaDescription = null;

    /**
     * The window that shows the objectives of the selected quest.
     * @type {Window_QuestopediaObjectives}
     */
    this._j._omni._quest._pediaObjectives = null;
  }

  /**
   * The positions of the category ring, in the order the categories were authored.
   *
   * A category already carries a key, a name and an icon, which is exactly what a ring position is.
   * @returns {{key: string, name: string, iconIndex: number}[]}
   */
  buildCategoryPositions()
  {
    return QuestManager.categories(false);
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

    // build the column of quests and the panes describing the highlighted one.
    this.createCategoryStripWindow();
    this.createQuestopediaListWindow();
    this.createQuestopediaDescriptionWindow();
    this.createQuestopediaObjectivesWindow();

    // point everything at whichever category the ring starts on.
    this.applyActiveCategory();

    // the quest list is the only thing here that takes input.
    this.getQuestopediaListWindow()
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
   * The description pane is this scene's help; a strip across the top would only repeat it.
   * @returns {boolean}
   */
  hasHelpWindow()
  {
    return false;
  }

  /**
   * Overrides {@link #commandColumnRatio}.<br/>
   * Quest names run long, so the column is wider than the base's default.
   * @returns {number}
   */
  commandColumnRatio()
  {
    return 0.28;
  }

  /**
   * How many lines of text the description pane is sized for: the name, the level, the tag icons,
   * and room for the overview to wrap beneath them.
   *
   * The longest authored overview runs to about seven wrapped lines at this pane's width in the
   * game's monospace font, and the overview lines are drawn tighter than a full line, so seven fit
   * inside the seven full lines left after the three header lines.
   * @returns {number}
   */
  descriptionLineCount()
  {
    return 10;
  }

  /**
   * The rectangle for the category strip, crowning the left column.
   * @returns {Rectangle}
   */
  categoryStripRectangle()
  {
    const facetArea = this.facetAreaRect();
    const height = this.calcWindowHeight(1, false);

    return new Rectangle(facetArea.x, facetArea.y, this.commandColumnWidth(), height);
  }

  /**
   * The rectangle for the quest list, filling the left column beneath the strip.
   * @returns {Rectangle}
   */
  questopediaListRectangle()
  {
    const facetArea = this.facetAreaRect();
    const stripRectangle = this.categoryStripRectangle();
    const y = stripRectangle.y + stripRectangle.height;
    const height = facetArea.y + facetArea.height - y;

    return new Rectangle(facetArea.x, y, this.commandColumnWidth(), height);
  }

  /**
   * The rectangle for the description pane, across the top of the right side.
   * @returns {Rectangle}
   */
  questopediaDescriptionRectangle()
  {
    const facetArea = this.facetAreaRect();
    const x = facetArea.x + this.commandColumnWidth();
    const width = facetArea.x + facetArea.width - x;
    const height = this.calcWindowHeight(this.descriptionLineCount(), false);

    return new Rectangle(x, facetArea.y, width, height);
  }

  /**
   * The rectangle for the objectives pane, filling whatever the description left of the right side.
   * @returns {Rectangle}
   */
  questopediaObjectivesRectangle()
  {
    const facetArea = this.facetAreaRect();
    const descriptionRectangle = this.questopediaDescriptionRectangle();
    const y = descriptionRectangle.y + descriptionRectangle.height;
    const height = facetArea.y + facetArea.height - y;

    return new Rectangle(descriptionRectangle.x, y, descriptionRectangle.width, height);
  }

  /**
   * Implements {@link #controlLegendEntries}.<br/>
   * Teaches the two controls that leave no mark on screen until pressed: the shoulder triggers that
   * walk the categories, and confirm, which tracks a quest rather than opening anything.
   * @returns {{semantic: (string|string[]), label: string}[]}
   */
  controlLegendEntries()
  {
    return [
      {
        semantic: [ 'content-prev', 'content-next' ],
        label: 'category',
      },
      {
        semantic: 'ok',
        label: 'track',
      },
    ];
  }

  //endregion layout

  //region category strip
  /**
   * Creates the strip naming the active category.
   */
  createCategoryStripWindow()
  {
    const window = this.buildCategoryStripWindow();

    this.setCategoryStripWindow(window);
    this.addWindow(window);
  }

  /**
   * Sets up and defines the category strip window.
   * @returns {Window_FilterStrip}
   */
  buildCategoryStripWindow()
  {
    const rectangle = this.categoryStripRectangle();

    return new Window_FilterStrip(rectangle);
  }

  /**
   * Gets the currently tracked category strip window.
   * @returns {Window_FilterStrip}
   */
  getCategoryStripWindow()
  {
    return this._j._omni._quest._categoryStrip;
  }

  /**
   * Sets the currently tracked category strip window.
   * @param {Window_FilterStrip} stripWindow The category strip window to track.
   */
  setCategoryStripWindow(stripWindow)
  {
    this._j._omni._quest._categoryStrip = stripWindow;
  }

  //endregion category strip

  //region list window
  /**
   * Creates the list of quests the player can potentially complete.
   */
  createQuestopediaListWindow()
  {
    const window = this.buildQuestopediaListWindow();

    this.setQuestopediaListWindow(window);
    this.addWindow(window);
  }

  /**
   * Sets up and defines the questopedia listing window.
   * @returns {Window_QuestopediaList}
   */
  buildQuestopediaListWindow()
  {
    const rectangle = this.questopediaListRectangle();
    const window = new Window_QuestopediaList(rectangle);

    // confirming a quest toggles whether it is tracked; cancel leaves the scene.
    window.setHandler('ok', this.onQuestopediaListSelection.bind(this));
    window.setHandler('cancel', this.onCancelQuestopedia.bind(this));

    // the shoulder triggers walk the category ring in either direction.
    window.setHandler('content-next', this.cycleQuestCategories.bind(this, true));
    window.setHandler('content-prev', this.cycleQuestCategories.bind(this, false));

    // the panes on the right follow whatever the cursor lands on.
    window.onIndexChange = this.onQuestopediaIndexChange.bind(this);

    return window;
  }

  /**
   * Gets the currently tracked questopedia list window.
   * @returns {Window_QuestopediaList}
   */
  getQuestopediaListWindow()
  {
    return this._j._omni._quest._pediaList;
  }

  /**
   * Sets the currently tracked questopedia list window to the given window.
   * @param {Window_QuestopediaList} listWindow The questopedia list window to track.
   */
  setQuestopediaListWindow(listWindow)
  {
    this._j._omni._quest._pediaList = listWindow;
  }

  //endregion list window

  //region description window
  /**
   * Creates the pane describing the highlighted quest.
   */
  createQuestopediaDescriptionWindow()
  {
    const window = this.buildQuestopediaDescriptionWindow();

    this.setQuestopediaDescriptionWindow(window);
    this.addWindow(window);
  }

  /**
   * Sets up and defines the questopedia description window.
   * @returns {Window_QuestopediaDescription}
   */
  buildQuestopediaDescriptionWindow()
  {
    const rectangle = this.questopediaDescriptionRectangle();

    return new Window_QuestopediaDescription(rectangle);
  }

  /**
   * Gets the currently tracked questopedia description window.
   * @returns {Window_QuestopediaDescription}
   */
  getQuestopediaDescriptionWindow()
  {
    return this._j._omni._quest._pediaDescription;
  }

  /**
   * Sets the currently tracked questopedia description window to the given window.
   * @param {Window_QuestopediaDescription} descriptionWindow The questopedia description window to track.
   */
  setQuestopediaDescriptionWindow(descriptionWindow)
  {
    this._j._omni._quest._pediaDescription = descriptionWindow;
  }

  //endregion description window

  //region objectives window
  /**
   * Creates the pane listing the highlighted quest's known objectives.
   */
  createQuestopediaObjectivesWindow()
  {
    const window = this.buildQuestopediaObjectivesWindow();

    this.setQuestopediaObjectivesWindow(window);
    this.addWindow(window);
  }

  /**
   * Sets up and defines the questopedia objectives window.
   * @returns {Window_QuestopediaObjectives}
   */
  buildQuestopediaObjectivesWindow()
  {
    const rectangle = this.questopediaObjectivesRectangle();
    const window = new Window_QuestopediaObjectives(rectangle);

    // the objectives are read, never driven. deactivating stops the pane taking input but leaves the
    // cursor sitting on row zero, which draws as a selection bar over a row nobody is choosing.
    window.deactivate();
    window.deselect();

    return window;
  }

  /**
   * Gets the currently tracked questopedia objectives window.
   * @returns {Window_QuestopediaObjectives}
   */
  getQuestopediaObjectivesWindow()
  {
    return this._j._omni._quest._pediaObjectives;
  }

  /**
   * Sets the currently tracked questopedia objectives window to the given window.
   * @param {Window_QuestopediaObjectives} objectivesWindow The questopedia objectives window to track.
   */
  setQuestopediaObjectivesWindow(objectivesWindow)
  {
    this._j._omni._quest._pediaObjectives = objectivesWindow;
  }

  //endregion objectives window

  //region actions
  /**
   * The category ring this scene pages through.
   * @returns {FilterCycle}
   */
  getCategoryFilter()
  {
    return this._j._omni._quest._categoryFilter;
  }

  /**
   * Points the strip and the list at whichever category is now selected, then the panes at whatever
   * the list lands on.
   */
  applyActiveCategory()
  {
    const categoryFilter = this.getCategoryFilter();
    const activePosition = categoryFilter.activePosition();

    this.getCategoryStripWindow()
      .setPosition(activePosition);

    const listWindow = this.getQuestopediaListWindow();
    listWindow.setCurrentCategoryKey(activePosition.key);
    listWindow.refresh();

    // a category with fewer quests than the one before it would otherwise leave the cursor past the end.
    listWindow.select(0);

    this.onQuestopediaIndexChange();
  }

  /**
   * Walks the category ring, wrapping at either end.
   * @param {boolean} isForward Whether to walk forwards.
   */
  cycleQuestCategories(isForward)
  {
    const categoryFilter = this.getCategoryFilter();
    const listWindow = this.getQuestopediaListWindow();

    // a single category is not a ring; pressing the trigger would land exactly where the player already is.
    if (!categoryFilter.canCycle())
    {
      SoundManager.playBuzzer();
      listWindow.activate();
      return;
    }

    if (isForward)
    {
      categoryFilter.next();
    }
    else
    {
      categoryFilter.previous();
    }

    SoundManager.playCursor();
    this.applyActiveCategory();

    // a handled input deactivates the window, so it has to be handed back its own input.
    listWindow.activate();
  }

  /**
   * Synchronizes the description and objectives panes with the highlighted quest.
   */
  onQuestopediaIndexChange()
  {
    const listWindow = this.getQuestopediaListWindow();
    const descriptionWindow = this.getQuestopediaDescriptionWindow();
    const objectivesWindow = this.getQuestopediaObjectivesWindow();

    // grab the highlighted quest, which is null when the category holds nothing.
    const highlightedQuest = listWindow.currentExt();

    if (highlightedQuest === null)
    {
      // empty the panes rather than leave the previous category's quest described.
      descriptionWindow.setCurrentQuest(null);
      descriptionWindow.refresh();
      objectivesWindow.setCurrentObjectives([]);
      objectivesWindow.refresh();
      return;
    }

    // sync the description with the currently-highlighted quest.
    descriptionWindow.setCurrentQuest(highlightedQuest);
    descriptionWindow.refresh();

    // sync the objectives with the currently-highlighted quest.
    objectivesWindow.setCurrentObjectives(highlightedQuest.objectives);
    objectivesWindow.refresh();
  }

  /**
   * Toggles whether the highlighted quest is tracked on the map.
   *
   * The quest is never null here: a row that cannot be tracked is disabled, and an empty list has no
   * current item, so in both cases the engine buzzes instead of calling this handler.
   */
  onQuestopediaListSelection()
  {
    const listWindow = this.getQuestopediaListWindow();

    /** @type {TrackedOmniQuest} */
    const highlightedQuest = listWindow.currentExt();

    highlightedQuest.toggleTracked();

    // the list re-reads itself so the tracking marker appears or disappears, then takes the cursor back.
    listWindow.refresh();
    listWindow.activate();
  }

  /**
   * Closes the questopedia and returns to the omnipedia.
   */
  onCancelQuestopedia()
  {
    SceneManager.pop();
  }

  //endregion actions
}

export default Scene_Questopedia;
//endregion Scene_Questopedia