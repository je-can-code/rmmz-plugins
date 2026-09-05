//region Scene_Statistopedia
import Window_StatistopediaDetail from './../windows/Window_StatistopediaDetail.js';
import StatistopediaService from './../managers/StatistopediaService.js';

/**
 * A scene reporting how this save has actually been played.
 *
 * Built on the facet skeleton rather than laid out from scratch, so it inherits the same help area,
 * the same control legend across the bottom, and the same bounded region every other menu in the
 * ecosystem draws inside. There is one strip naming the current section and one panel of rows
 * beneath it, and that is the entire scene- there is nothing here to select and nothing to change.
 */
class Scene_Statistopedia
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
   * Also initializes the statistopedia's own members.
   */
  initMembers()
  {
    // perform original logic.
    super.initMembers();

    /**
     * A grouping of all properties associated with the statistopedia.
     */
    this._j._omni = {};
    this._j._omni._stats = {};

    /**
     * The L2/R2 ring of sections this scene pages through.
     * @type {FilterCycle}
     */
    this._j._omni._stats._sectionFilter = new FilterCycle(StatistopediaService.sections());

    /**
     * The strip naming whichever section is currently being read.
     * @type {Window_FilterStrip}
     */
    this._j._omni._stats._sectionStrip = null;

    /**
     * The panel of rows for the current section.
     * @type {Window_StatistopediaDetail}
     */
    this._j._omni._stats._detail = null;
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

    // build the strip and the panel it labels.
    this.createSectionStripWindow();
    this.createDetailWindow();

    // point both of them at whichever section the ring starts on.
    this.applyActiveSection();

    // the panel is the only thing here that takes input.
    this.getDetailWindow()
      .activate();
  }

  //endregion create

  //region layout
  /**
   * Overrides {@link #commandColumnRatio}.<br/>
   * Widens the base's command column to half the screen.
   *
   * The base ratio suits a column of commands standing beside a detail pane. This scene has no such
   * pane- the panel is the whole content- so it needs more than a column and much less than the
   * screen. At full width a row puts its label against the left edge and its value against the right
   * with a runway of nothing between them, and the eye has to travel the whole way to pair the two.
   * @returns {number}
   */
  commandColumnRatio()
  {
    return 0.5;
  }

  /**
   * The horizontal origin that centers this scene's panel in the region it was given.
   * @returns {number}
   */
  panelX()
  {
    const facetArea = this.facetAreaRect();
    const width = this.commandColumnWidth();

    return facetArea.x + Math.floor((facetArea.width - width) / 2);
  }

  /**
   * The number of rows in the largest section.
   *
   * The panel is sized to the section that needs the most room rather than to the one on screen, so
   * that walking the ring resizes nothing. A window that grew and shrank under the player as they
   * pressed a shoulder button would read as the menu flinching.
   * @returns {number}
   */
  largestSectionRowCount()
  {
    const sections = StatistopediaService.sections();
    const rowCounts = sections.map(section => StatistopediaService.rowsFor(section.key).length);

    return Math.max(...rowCounts);
  }

  //endregion layout

  //region section strip
  /**
   * Creates the strip naming the active section.
   */
  createSectionStripWindow()
  {
    const window = this.buildSectionStripWindow();

    this.setSectionStripWindow(window);
    this.addWindow(window);
  }

  /**
   * Sets up and defines the section strip window.
   * @returns {Window_FilterStrip}
   */
  buildSectionStripWindow()
  {
    const rectangle = this.sectionStripRectangle();

    return new Window_FilterStrip(rectangle);
  }

  /**
   * The rectangle for the section strip, pinned across the top of the region this scene owns.
   * @returns {Rectangle}
   */
  sectionStripRectangle()
  {
    const facetArea = this.facetAreaRect();
    const height = this.calcWindowHeight(1, false);

    return new Rectangle(this.panelX(), facetArea.y, this.commandColumnWidth(), height);
  }

  /**
   * Gets the currently tracked section strip window.
   * @returns {Window_FilterStrip}
   */
  getSectionStripWindow()
  {
    return this._j._omni._stats._sectionStrip;
  }

  /**
   * Sets the currently tracked section strip window.
   * @param {Window_FilterStrip} stripWindow The section strip window driving this step.
   */
  setSectionStripWindow(stripWindow)
  {
    this._j._omni._stats._sectionStrip = stripWindow;
  }

  //endregion section strip

  //region detail
  /**
   * Creates the panel of rows for the active section.
   */
  createDetailWindow()
  {
    const window = this.buildDetailWindow();

    this.setDetailWindow(window);
    this.addWindow(window);
  }

  /**
   * Sets up and defines the detail window.
   * @returns {Window_StatistopediaDetail}
   */
  buildDetailWindow()
  {
    const rectangle = this.detailRectangle();
    const window = new Window_StatistopediaDetail(rectangle);

    // there is nothing to confirm here, so cancel is the only way out.
    window.setHandler('cancel', this.onCancelStatistopedia.bind(this));

    // the shoulder triggers walk the section ring in either direction.
    window.setHandler('content-next', this.cycleSections.bind(this, true));
    window.setHandler('content-prev', this.cycleSections.bind(this, false));

    return window;
  }

  /**
   * The rectangle for the detail panel, filling whatever the strip left behind.
   * @returns {Rectangle}
   */
  detailRectangle()
  {
    const facetArea = this.facetAreaRect();
    const stripRectangle = this.sectionStripRectangle();
    const y = stripRectangle.y + stripRectangle.height;

    // the panel wants to be exactly as tall as its longest section, but never taller than the region
    // it was handed- a section that outgrows the screen scrolls instead of overflowing it.
    const available = facetArea.height - stripRectangle.height;
    const wanted = this.calcWindowHeight(this.largestSectionRowCount(), false);
    const height = Math.min(wanted, available);

    return new Rectangle(this.panelX(), y, this.commandColumnWidth(), height);
  }

  /**
   * Gets the currently tracked detail window.
   * @returns {Window_StatistopediaDetail}
   */
  getDetailWindow()
  {
    return this._j._omni._stats._detail;
  }

  /**
   * Sets the currently tracked detail window.
   * @param {Window_StatistopediaDetail} detailWindow The detail window driving this step.
   */
  setDetailWindow(detailWindow)
  {
    this._j._omni._stats._detail = detailWindow;
  }

  //endregion detail

  //region actions
  /**
   * The section ring this scene pages through.
   * @returns {FilterCycle}
   */
  getSectionFilter()
  {
    return this._j._omni._stats._sectionFilter;
  }

  /**
   * Points the strip and the panel at whichever section is now selected.
   */
  applyActiveSection()
  {
    const sectionFilter = this.getSectionFilter();
    const activePosition = sectionFilter.activePosition();

    this.getSectionStripWindow()
      .setPosition(activePosition);

    const detailWindow = this.getDetailWindow();
    detailWindow.setSectionKey(activePosition.key);
    detailWindow.refresh();

    // a section with fewer rows than the one before it would otherwise leave the cursor past the end.
    detailWindow.select(0);
  }

  /**
   * Walks the section ring, wrapping at either end.
   * @param {boolean} isForward Whether to walk forwards.
   */
  cycleSections(isForward)
  {
    const sectionFilter = this.getSectionFilter();

    if (isForward)
    {
      sectionFilter.next();
    }
    else
    {
      sectionFilter.previous();
    }

    this.applyActiveSection();

    // a handled input deactivates the window, so it has to be handed back its own input.
    this.getDetailWindow()
      .activate();
  }

  /**
   * Closes the statistopedia and returns to the omnipedia.
   */
  onCancelStatistopedia()
  {
    SceneManager.pop();
  }

  /**
   * Implements {@link #controlLegendEntries}.<br/>
   * Teaches the one control that leaves no mark on screen until it is pressed.
   *
   * A player who never tries the shoulder triggers never learns there are other sections at all,
   * which is the only thing about this scene that is not self-evident from looking at it.
   * @returns {{semantic: (string|string[]), label: string}[]}
   */
  controlLegendEntries()
  {
    return [
      {
        semantic: [ 'content-prev', 'content-next' ],
        label: 'section',
      },
    ];
  }

  //endregion actions
}

export default Scene_Statistopedia;
//endregion Scene_Statistopedia