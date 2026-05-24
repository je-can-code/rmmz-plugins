//region Scene_JaftingRefine
import RefinementWorkflowSession from './../__models/RefinementWorkflowSession.js';
import JaftingManager from './../managers/JaftingManager.js';
import Window_RefinableList from '../windows/Window_RefinableList.js';
import Window_RefinementConfirmation from '../windows/Window_RefinementConfirmation.js';
import Window_RefinementDescription from '../windows/Window_RefinementDescription.js';
import Window_RefinementDetails from '../windows/Window_RefinementDetails.js';
import Window_RefinementStepHint from '../windows/Window_RefinementStepHint.js';

class Scene_JaftingRefine
  extends Scene_MenuBase
{
  /**
   * Whether Refinement can open: inventory includes at least one equip enterable as a refinement base.
   * @returns {boolean}
   */
  static isAccessible()
  {
    return JaftingManager.partyHasEnterableRefinementBase();
  }

  /**
   * Whether the JAFTING hub should show Refinement as selectable (menu switch plus content eligibility).
   * @returns {boolean}
   */
  static isRefineCommandEnabled()
  {
    return $gameSwitches.value(J.JAFTING.EXT.REFINE.Metadata.menuSwitchId)
      && Scene_JaftingRefine.isAccessible();
  }

  /**
   * Pushes this current scene onto the stack, forcing it into action.
   */
  static callScene()
  {
    if (Scene_JaftingRefine.isAccessible() === false)
    {
      SoundManager.playBuzzer();
      return;
    }

    SceneManager.push(this);
  }

  /**
   * The symbol representing the command for this scene from other menus.
   * @type {string}
   */
  static KEY = 'jafting-refine';

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

  //region init
  /**
   * Initialize the window and all properties required by the scene.
   */
  initialize()
  {
    // perform original logic.
    super.initialize();

    // also initialize our scene properties.
    this.initMembers();
  }

  /**
   * Initialize all properties for the Refinement scene.
   */
  initMembers()
  {
    // initialize the root-namespace definition members.
    this.initCoreMembers();

    // initialize the Refinement windows and state bucket.
    this.initPrimaryMembers();
  }

  /**
   * The core properties of this scene are the root namespace definitions for this plugin.
   */
  initCoreMembers()
  {
    /**
     * The shared root namespace for all of J's plugin data.
     */
    this._j ||= {};

    /**
     * A grouping of all properties associated with this JAFTING scene.
     */
    this._j._crafting = {};
  }

  /**
   * Primary state for Refinement: base and material lists, details, confirmation, and selections.
   */
  initPrimaryMembers()
  {
    /**
     * A grouping of all properties associated with the jafting type of refinement.
     * Refinement is a subcategory of the jafting system.
     */
    this._j._crafting._refine = {};

    /**
     * Phase tracking and atomic refine commit (keeps confirmation handler thin).
     * @type {RefinementWorkflowSession}
     */
    this._j._crafting._refine._session = new RefinementWorkflowSession();

    /**
     * Explains the current refinement step above the left-hand lists.
     * @type {Window_RefinementStepHint}
     */
    this._j._crafting._refine._refinementStepHint = null;

    /**
     * The window that shows the tertiary information about a refinable.
     * @type {Window_RefinementDescription}
     */
    this._j._crafting._refine._refinementDescription = null;

    /**
     * The window that shows the list of equips that can be used as a base for refinement.
     * @type {Window_RefinableList}
     */
    this._j._crafting._refine._baseRefinableList = null;

    /**
     * The window that shows the list of equips that can be used as fodder for refinement.
     * @type {Window_RefinableList}
     */
    this._j._crafting._refine._consumedRefinableList = null;

    /**
     * The window that shows the details of the refinement given the selected entries.
     * @type {Window_RefinementDetails}
     */
    this._j._crafting._refine._refinementDetails = null;

    /**
     * Confirms or cancels the pending refinement.
     * @type {Window_RefinementConfirmation|null}
     */
    this._j._crafting._refine._confirmationPrompt = null;

    /**
     * The base equip currently selected for refinement.
     * @type {Game_Item|null}
     */
    this._j._crafting._refine._baseSelected = null;

    /**
     * The material equip currently selected for refinement.
     * @type {Game_Item|null}
     */
    this._j._crafting._refine._consumedSelected = null;

    /**
     * Ordinal of the chosen base row when stacks expand (matches {@link Window_RefinableList} extension data).
     * @type {number|null}
     */
    this._j._crafting._refine._baseSelectedUnitOrdinal = null;

    /**
     * Lazily computed outer height for {@link Window_RefinementStepHint} (one text line).
     * @type {number|undefined}
     */
    this._cachedRefinementStepHintHeight = undefined;
  }

  /**
   * @returns {RefinementWorkflowSession}
   */
  refinementSession()
  {
    return this._j._crafting._refine._session;
  }

  getBaseSelected()
  {
    return this._j._crafting._refine._baseSelected;
  }

  setBaseSelected(equip)
  {
    this._j._crafting._refine._baseSelected = equip;
  }

  getBaseSelectedUnitOrdinal()
  {
    return this._j._crafting._refine._baseSelectedUnitOrdinal;
  }

  setBaseSelectedUnitOrdinal(value)
  {
    this._j._crafting._refine._baseSelectedUnitOrdinal = value;
  }

  getConsumedSelected()
  {
    return this._j._crafting._refine._consumedSelected;
  }

  setConsumedSelected(equip)
  {
    this._j._crafting._refine._consumedSelected = equip;
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

    // configure window relations and such now that they are all created.
    this.configureAllWindows();
  }

  /**
   * Creates all windows in this scene.
   */
  createAllWindows()
  {
    // create all the windows.
    this.createRefinementStepHintWindow();
    this.createRefinementDescriptionWindow();
    this.createBaseRefinableListWindow();
    this.createConsumableRefinableListWindow();
    this.createRefinementDetailsWindow();
    this.createRefinementConfirmationWindow();
  }

  /**
   * Configures all windows.
   */
  configureAllWindows()
  {
    const listWindow = this.getBaseRefinableListWindow();

    listWindow.refresh();

    // also update with the currently selected item, if one exists.
    this.getRefinementDescriptionWindow()
      .setText(listWindow.currentHelpText() ?? String.empty);

    const selected = listWindow.currentExt();
    const detailsWindow = this.getRefinementDetailsWindow();

    if (selected === undefined || selected === null)
    {
      this.setBaseSelected(null);
      this.setBaseSelectedUnitOrdinal(null);
      detailsWindow.primaryEquip = null;
      this.refreshRefinementStepHint();
      return;
    }

    this.setBaseSelected(selected.data);
    this.setBaseSelectedUnitOrdinal(
      selected.unitOrdinal === undefined || selected.unitOrdinal === null
        ? null
        : selected.unitOrdinal,
    );
    detailsWindow.primaryEquip = selected.data;

    this.refreshRefinementStepHint();
  }

  /**
   * Overrides {@link Scene_MenuBase.prototype.createBackground}.<br>
   * Changes the filter to a different type from {@link PIXI.filters}.<br>
   */
  createBackground()
  {
    this._backgroundFilter = new PIXI.filters.AlphaFilter(0.1);
    this._backgroundSprite = new Sprite();
    this._backgroundSprite.bitmap = SceneManager.backgroundBitmap();
    this._backgroundSprite.filters = [ this._backgroundFilter ];
    this.addChild(this._backgroundSprite);
    //this.setBackgroundOpacity(220);
  }

  /**
   * Overrides {@link #createButtons}.<br>
   * Disables the creation of the buttons.
   * @override
   */
  createButtons()
  {
  }

  //endregion create

  //region refinement step hint
  /**
   * @returns {number} Outer height for {@link Window_RefinementStepHint} (single menu line).
   */
  getRefinementStepHintHeight()
  {
    if (this._cachedRefinementStepHintHeight !== undefined)
    {
      return this._cachedRefinementStepHintHeight;
    }

    const probe = new Window_RefinementStepHint(new Rectangle(0, 0, 400, 48));
    this._cachedRefinementStepHintHeight = probe.fittingHeight(1);
    probe.destroy();

    return this._cachedRefinementStepHintHeight;
  }

  /**
   * @returns {number} Width shared by the left refinable lists (~10% wider than the original 350px column).
   */
  getBaseRefinableListColumnWidth()
  {
    return Math.round(350 * 1.1);
  }

  /**
   * @returns {Rectangle}
   */
  getRefinementStepHintRectangle()
  {
    const [ ox, oy ] = Graphics.boxOrigin;
    const x = ox + Graphics.horizontalPadding;
    const width = Graphics.boxWidth - Graphics.horizontalPadding * 2;
    const height = this.getRefinementStepHintHeight();

    return new Rectangle(x, oy, width, height);
  }

  /**
   * Updates the step hint from {@link RefinementWorkflowSession#getPhase}.
   */
  refreshRefinementStepHint()
  {
    const hintWindow = this.getRefinementStepHintWindow();
    const phase = this.refinementSession().getPhase();
    let text = String.empty;

    if (phase === RefinementWorkflowSession.Phase.PickingBase)
    {
      text = J.JAFTING.EXT.REFINE.Messages.RefinementStepHintPickingBase;
    }
    else if (phase === RefinementWorkflowSession.Phase.PickingMaterial)
    {
      text = J.JAFTING.EXT.REFINE.Messages.RefinementStepHintPickingMaterial;
    }
    else if (phase === RefinementWorkflowSession.Phase.Confirming)
    {
      text = J.JAFTING.EXT.REFINE.Messages.RefinementStepHintConfirming;
    }

    hintWindow.setText(text);
  }

  /**
   * Creates the step hint window.
   */
  createRefinementStepHintWindow()
  {
    const window = this.buildRefinementStepHintWindow();

    this.setRefinementStepHintWindow(window);
    this.addWindow(window);
  }

  buildRefinementStepHintWindow()
  {
    const rectangle = this.getRefinementStepHintRectangle();

    return new Window_RefinementStepHint(rectangle);
  }

  /**
   * @returns {Window_RefinementStepHint}
   */
  getRefinementStepHintWindow()
  {
    return this._j._crafting._refine._refinementStepHint;
  }

  /**
   * @param {Window_RefinementStepHint} someWindow
   */
  setRefinementStepHintWindow(someWindow)
  {
    this._j._crafting._refine._refinementStepHint = someWindow;
  }

  //endregion refinement step hint

  //region refinement description
  /**
   * Creates the RefinementDescription window.
   */
  createRefinementDescriptionWindow()
  {
    // create the window.
    const window = this.buildRefinementDescriptionWindow();

    // update the tracker with the new window.
    this.setRefinementDescriptionWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  buildRefinementDescriptionWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.getRefinementDescriptionRectangle();

    // create the window with the rectangle.
    const window = new Window_RefinementDescription(rectangle);

    // return the built and configured window.
    return window;
  }

  /**
   * Gets the rectangle associated with this window.
   * @returns {Rectangle}
   */
  getRefinementDescriptionRectangle()
  {
    const listRect = this.getBaseRefinableListRectangle();
    const [ ox ] = Graphics.boxOrigin;
    const x = listRect.x + listRect.width + Graphics.horizontalPadding;
    const {y} = listRect;
    const width = ox + Graphics.boxWidth - x - Graphics.horizontalPadding;
    const height = 100;

    return new Rectangle(x, y, width, height);
  }

  /**
   * Gets the RefinementDescription window being tracked.
   */
  getRefinementDescriptionWindow()
  {
    return this._j._crafting._refine._refinementDescription;
  }

  /**
   * Sets the RefinementDescription window tracking.
   */
  setRefinementDescriptionWindow(someWindow)
  {
    this._j._crafting._refine._refinementDescription = someWindow;
  }

  //endregion refinement description

  //region base refinable list
  /**
   * Creates the base RefinableList window.
   */
  createBaseRefinableListWindow()
  {
    // create the window.
    const window = this.buildRefinableListWindow();

    // update the tracker with the new window.
    this.setBaseRefinableListWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  buildRefinableListWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.getBaseRefinableListRectangle();

    // create the window with the rectangle.
    const window = new Window_RefinableList(rectangle);

    // designate this refinable list window as the primary.
    window.isPrimary = true;

    // assign cancel functionality.
    window.setHandler('cancel', this.onBaseRefinableListCancel.bind(this));

    // assign on-select functionality.
    window.setHandler('ok', this.onBaseRefinableListSelection.bind(this));

    // overwrite the onIndexChange hook with our local hook.
    window.onIndexChange = this.onBaseRefinableListIndexChange.bind(this);

    // return the built and configured window.
    return window;
  }

  /**
   * Gets the rectangle associated with this window.
   * @returns {Rectangle}
   */
  getBaseRefinableListRectangle()
  {
    const [ ox, oy ] = Graphics.boxOrigin;
    const hintHeight = this.getRefinementStepHintHeight();
    const width = this.getBaseRefinableListColumnWidth();
    const height = Graphics.boxHeight - Graphics.verticalPadding - hintHeight;

    return new Rectangle(ox, oy + hintHeight, width, height);
  }

  /**
   * Gets the RefinableList window being tracked.
   */
  getBaseRefinableListWindow()
  {
    return this._j._crafting._refine._baseRefinableList;
  }

  /**
   * Sets the RefinableList window tracking.
   */
  setBaseRefinableListWindow(someWindow)
  {
    this._j._crafting._refine._baseRefinableList = someWindow;
  }

  selectBaseRefinableListWindow()
  {
    // grab the window.
    const listWindow = this.getBaseRefinableListWindow();

    // reveal the window.
    listWindow.show();
    listWindow.activate();

    this.getRefinementDescriptionWindow()
      .setText(listWindow.currentHelpText());

    this.refreshRefinementStepHint();
  }

  deselectBaseRefinableListWindow()
  {
    // grab the window.
    const listWindow = this.getBaseRefinableListWindow();

    // reveal the window.
    listWindow.hide();
    listWindow.deactivate();
  }

  onBaseRefinableListIndexChange()
  {
    const listWindow = this.getBaseRefinableListWindow();

    const helpText = listWindow.currentHelpText();
    this.getRefinementDescriptionWindow()
      .setText(helpText ?? String.empty);

    const baseRefinable = listWindow.currentExt();
    this.getRefinementDetailsWindow().primaryEquip = baseRefinable?.data;
  }

  onBaseRefinableListCancel()
  {
    // revert to the previous scene.
    SceneManager.pop();
  }

  onBaseRefinableListSelection()
  {
    this.refinementSession().beginMaterialSelection();

    const baseRefinableListWindow = this.getBaseRefinableListWindow();

    const baseRefinable = baseRefinableListWindow.currentExt();
    this.setBaseSelected(baseRefinable.data);
    this.setBaseSelectedUnitOrdinal(
      baseRefinable.unitOrdinal === undefined || baseRefinable.unitOrdinal === null
        ? null
        : baseRefinable.unitOrdinal,
    );

    this.deselectBaseRefinableListWindow();
    this.selectConsumableRefinableListWindow();
  }

  //endregion base refinable list

  //region consumable refinable list
  /**
   * Creates the consumable RefinableList window.
   */
  createConsumableRefinableListWindow()
  {
    // create the window.
    const window = this.buildConsumableRefinableListWindow();

    // update the tracker with the new window.
    this.setConsumableRefinableListWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  buildConsumableRefinableListWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.getConsumableRefinableListRectangle();

    // create the window with the rectangle.
    const window = new Window_RefinableList(rectangle);

    // assign cancel functionality.
    window.setHandler('cancel', this.onConsumableRefinableListCancel.bind(this));

    // assign on-select functionality.
    window.setHandler('ok', this.onConsumableRefinableListSelection.bind(this));

    // overwrite the onIndexChange hook with our local hook.
    window.onIndexChange = this.onConsumableRefinableListIndexChange.bind(this);

    // also put the window away.
    window.hide();
    window.deactivate();

    // return the built and configured window.
    return window;
  }

  /**
   * Gets the rectangle associated with this window.
   * @returns {Rectangle}
   */
  getConsumableRefinableListRectangle()
  {
    return this.getBaseRefinableListRectangle();
  }

  /**
   * Gets the consumable RefinableList window being tracked.
   */
  getConsumableRefinableListWindow()
  {
    return this._j._crafting._refine._consumedRefinableList;
  }

  /**
   * Sets the consumable RefinableList window tracking.
   */
  setConsumableRefinableListWindow(someWindow)
  {
    this._j._crafting._refine._consumedRefinableList = someWindow;
  }

  selectConsumableRefinableListWindow()
  {
    // grab the window.
    const listWindow = this.getConsumableRefinableListWindow();

    // reveal the window.
    listWindow.baseSelection = this.getBaseSelected();
    listWindow.baseSelectionUnitOrdinal = this.getBaseSelectedUnitOrdinal();
    listWindow.refresh();
    listWindow.show();
    listWindow.activate();

    const selected = listWindow.currentExt()?.data;
    this.setConsumedSelected(selected);
    this.getRefinementDetailsWindow().secondaryEquip = selected;

    this.getRefinementDescriptionWindow()
      .setText(listWindow.currentHelpText());

    this.refreshRefinementStepHint();
  }

  deselectConsumableRefinableListWindow()
  {
    // grab the window.
    const listWindow = this.getConsumableRefinableListWindow();

    // reveal the window.
    listWindow.hide();
    listWindow.deactivate();
  }

  onConsumableRefinableListIndexChange()
  {
    const listWindow = this.getConsumableRefinableListWindow();

    const helpText = listWindow.currentHelpText();
    this.getRefinementDescriptionWindow()
      .setText(helpText ?? String.empty);

    const consumedRefinable = listWindow.currentExt();
    this.getRefinementDetailsWindow().secondaryEquip = consumedRefinable.data;
  }

  onConsumableRefinableListCancel()
  {
    this.refinementSession().returnToBaseSelection();

    this.deselectConsumableRefinableListWindow();

    this.selectBaseRefinableListWindow();
  }

  onConsumableRefinableListSelection()
  {
    this.refinementSession().beginConfirmation();

    const listWindow = this.getConsumableRefinableListWindow();

    const consumedRefinable = listWindow.currentExt().data;
    this.setConsumedSelected(consumedRefinable);

    this.selectRefinementConfirmationWindow();
  }

  //endregion consumable refinable list

  //region refinement details
  /**
   * Creates the RefinementDetails window.
   */
  createRefinementDetailsWindow()
  {
    // create the window.
    const window = this.buildRefinementDetailsWindow();

    // update the tracker with the new window.
    this.setRefinementDetailsWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  buildRefinementDetailsWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.getRefinementDetailsRectangle();

    // create the window with the rectangle.
    const window = new Window_RefinementDetails(rectangle);

    // return the built and configured window.
    return window;
  }

  /**
   * Gets the rectangle associated with this window.
   * @returns {Rectangle}
   */
  getRefinementDetailsRectangle()
  {
    const [ ox, oy ] = Graphics.boxOrigin;
    const listRect = this.getBaseRefinableListRectangle();
    const descWindow = this.getRefinementDescriptionWindow();

    const x = listRect.x + listRect.width + Graphics.horizontalPadding;
    const y = listRect.y + descWindow.height + Graphics.verticalPadding;
    const width = ox + Graphics.boxWidth - x - Graphics.horizontalPadding;
    const height = oy + Graphics.boxHeight - y - Graphics.verticalPadding;

    return new Rectangle(x, y, width, height);
  }

  /**
   * Gets the RefinementDetails window being tracked.
   */
  getRefinementDetailsWindow()
  {
    return this._j._crafting._refine._refinementDetails;
  }

  /**
   * Sets the RefinementDetails window tracking.
   */
  setRefinementDetailsWindow(someWindow)
  {
    this._j._crafting._refine._refinementDetails = someWindow;
  }

  //endregion refinement details

  //region confirmation prompt
  /**
   * Creates the RefinementConfirmation window.
   */
  createRefinementConfirmationWindow()
  {
    // create the window.
    const window = this.buildRefinementConfirmationWindow();

    // update the tracker with the new window.
    this.setRefinementConfirmationWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  buildRefinementConfirmationWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.getRefinementConfirmationRectangle();

    // create the window with the rectangle.
    const window = new Window_RefinementConfirmation(rectangle);

    // assign cancel functionality.
    window.setHandler('cancel', this.onRefinementConfirmationCancel.bind(this));

    // assign on-select functionality.
    window.setHandler('ok', this.onRefinementConfirmationSelection.bind(this));

    // also put the window away.
    window.hide();
    window.deactivate();

    // return the built and configured window.
    return window;
  }

  /**
   * Gets the rectangle associated with this window.
   * @returns {Rectangle}
   */
  getRefinementConfirmationRectangle()
  {
    const [ ox, oy ] = Graphics.boxOrigin;
    const width = this.getBaseRefinableListColumnWidth();
    const height = 120;
    const x = ox + Math.floor((Graphics.boxWidth - width) / 2);
    const y = oy + Math.floor((Graphics.boxHeight - height) / 2);

    return new Rectangle(x, y, width, height);
  }

  /**
   * Gets the RefinementConfirmation window being tracked.
   */
  getRefinementConfirmationWindow()
  {
    return this._j._crafting._refine._confirmationPrompt;
  }

  selectRefinementConfirmationWindow()
  {
    // grab the window.
    const listWindow = this.getRefinementConfirmationWindow();

    // reveal the window.
    listWindow.show();
    listWindow.activate();

    this.refreshRefinementStepHint();
  }

  deselectRefinementConfirmationWindow()
  {
    // grab the window.
    const listWindow = this.getRefinementConfirmationWindow();

    // reveal the window.
    listWindow.hide();
    listWindow.deactivate();
  }

  /**
   * Sets the RefinementConfirmation window tracking.
   */
  setRefinementConfirmationWindow(someWindow)
  {
    this._j._crafting._refine._confirmationPrompt = someWindow;
  }

  onRefinementConfirmationCancel()
  {
    this.refinementSession().returnToMaterialSelection();

    this.deselectRefinementConfirmationWindow();
    this.selectConsumableRefinableListWindow();
  }

  onRefinementConfirmationSelection()
  {
    const detailsWindow = this.getRefinementDetailsWindow();
    const output = detailsWindow.outputEquip;
    const outcome = this.refinementSession().commitRefinement(
      this.getBaseSelected(),
      this.getConsumedSelected(),
      output,
    );

    if (outcome.ok === false)
    {
      return;
    }

    detailsWindow.primaryEquip = null;
    detailsWindow.secondaryEquip = null;

    this.deselectConsumableRefinableListWindow();
    this.deselectRefinementConfirmationWindow();
    this.selectBaseRefinableListWindow();

    this.setBaseSelected(null);
    this.setBaseSelectedUnitOrdinal(null);
    this.setConsumedSelected(null);

    const listWindow = this.getBaseRefinableListWindow();
    listWindow.refresh();
    listWindow.select(0);

    this.getConsumableRefinableListWindow()
      .refresh();
  }

  //endregion confirmation prompt
}

export default Scene_JaftingRefine;

//endregion