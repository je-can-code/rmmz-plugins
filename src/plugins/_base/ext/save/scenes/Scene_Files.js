//region Scene_Files
import Window_FilesCommand from './../windows/Window_FilesCommand.js';
import Window_FilesList from './../windows/Window_FilesList.js';
import Window_FilesConfirm from './../windows/Window_FilesConfirm.js';
import SaveFileEntryMode from './../core/SaveFileEntryMode.js';

/**
 * One scene for saving, loading, deleting and rewinding.
 *
 * Vanilla's `Scene_Save` and `Scene_Load` differ by six methods - `mode`, `helpWindowText`,
 * `firstSavefileId`, `onSavefileOk`, and their execute/success/failure trio - which is already a
 * strategy pattern wearing inheritance as a disguise. Delete has no home in vanilla at all despite
 * needing the identical list of slots, and Rewind needs it too. So: one scene, one list, and a mode
 * that decides what selecting a row means.
 *
 * **What it offers depends entirely on where it was opened from.** A save platform offers Save, Load
 * and Rewind; the menu drops Save; the title screen offers Load and Delete. Commands that do not apply
 * are omitted rather than greyed - a greyed Rewind on the title screen is an invitation to wonder what
 * you did wrong, while an absent one just reads as a different screen. The player should never learn
 * that these are the same scene.
 *
 * It is a `Scene_MenuBase` descendant reached from the title screen, which looks unsafe and is not:
 * `Scene_Boot.startNormalGame` calls `DataManager.setupNewGame`, so a throwaway new game is already
 * standing by the time the title draws and Continue simply discards it. Vanilla's own `Scene_Load`
 * relies on exactly this. The rule it leaves behind is that nothing in this scene may *read* those
 * globals to describe a save - see {@link Window_FilesList}.
 */
class Scene_Files
  extends Scene_MenuFacetBase
{
  //region entry points
  /**
   * Opens the files scene from a save platform in the world.
   *
   * The three entry points are static methods rather than three copies of the same two lines because
   * the engine's own preparation helper operates on `_nextScene`, so `prepare` must be called *after*
   * the push - the reverse of what reads naturally. Wrapping it here means nobody has to remember that.
   */
  static callFromSavePoint()
  {
    SceneManager.push(Scene_Files);
    SceneManager.prepareNextScene(SaveFileEntryMode.Platform);
  }

  /**
   * Opens the files scene from the main menu.
   */
  static callFromMenu()
  {
    SceneManager.push(Scene_Files);
    SceneManager.prepareNextScene(SaveFileEntryMode.Menu);
  }

  /**
   * Opens the files scene from the title screen's Continue command.
   */
  static callFromTitle()
  {
    SceneManager.push(Scene_Files);
    SceneManager.prepareNextScene(SaveFileEntryMode.Title);
  }

  /**
   * Receives where this scene was opened from.
   * @param {string} entryMode One of {@link SaveFileEntryMode}.
   */
  prepare(entryMode)
  {
    this.setEntryMode(entryMode);
  }

  //endregion entry points

  /**
   * Extends {@link #initMembers}.<br/>
   * Also initializes this scene's members.
   */
  initMembers()
  {
    // perform original logic.
    super.initMembers();

    /**
     * A grouping of all properties associated with the files scene.
     */
    this._j._files = {};

    /**
     * Where this scene was opened from, which decides what it offers.
     * @type {string}
     */
    this._j._files._entryMode = SaveFileEntryMode.Title;

    /**
     * The column of things that can be done.
     * @type {Window_FilesCommand|null}
     */
    this._j._files._command = null;

    /**
     * The list of files or generations the chosen command acts on.
     * @type {Window_FilesList|null}
     */
    this._j._files._list = null;

    /**
     * The prompt shown before anything irreversible or expensive.
     * @type {Window_FilesConfirm|null}
     */
    this._j._files._confirm = null;

    /**
     * Whether a load or rewind succeeded, which decides what {@link terminate} owes the new game.
     * @type {boolean}
     */
    this._j._files._loadSuccess = false;
  }

  //region properties
  /**
   * Gets where this scene was opened from.
   * @returns {string}
   */
  entryMode()
  {
    return this._j._files._entryMode;
  }

  /**
   * Sets where this scene was opened from.
   * @param {string} entryMode One of {@link SaveFileEntryMode}.
   */
  setEntryMode(entryMode)
  {
    this._j._files._entryMode = entryMode;
  }

  /**
   * Gets the column of things that can be done.
   * @returns {Window_FilesCommand}
   */
  commandWindow()
  {
    return this._j._files._command;
  }

  /**
   * Sets the column of things that can be done.
   * @param {Window_FilesCommand} window The window to track.
   */
  setCommandWindow(window)
  {
    this._j._files._command = window;
  }

  /**
   * Gets the list of files the chosen command acts on.
   * @returns {Window_FilesList}
   */
  listWindow()
  {
    return this._j._files._list;
  }

  /**
   * Sets the list of files the chosen command acts on.
   * @param {Window_FilesList} window The window to track.
   */
  setListWindow(window)
  {
    this._j._files._list = window;
  }

  /**
   * Gets the prompt shown before anything irreversible or expensive.
   * @returns {Window_FilesConfirm}
   */
  confirmWindow()
  {
    return this._j._files._confirm;
  }

  /**
   * Sets the prompt shown before anything irreversible or expensive.
   * @param {Window_FilesConfirm} window The window to track.
   */
  setConfirmWindow(window)
  {
    this._j._files._confirm = window;
  }

  /**
   * Gets whether a load or rewind succeeded in this scene.
   * @returns {boolean}
   */
  hasLoadSucceeded()
  {
    return this._j._files._loadSuccess;
  }

  /**
   * Records that a load or rewind succeeded in this scene.
   */
  flagLoadSucceeded()
  {
    this._j._files._loadSuccess = true;
  }

  /**
   * Gets the mode currently driving the list.
   * @returns {SaveFileMode|null}
   */
  currentMode()
  {
    return this.listWindow()
      .mode();
  }

  //endregion properties

  //region create
  /**
   * Extends {@link #create}.<br/>
   * Also creates this scene's own windows.
   */
  create()
  {
    // perform original logic, which builds the shared chrome.
    super.create();

    // build the help window describing the highlighted command.
    this.createHelpWindow();

    // build this scene's own contents.
    this.createFilesCommandWindow();
    this.createFilesListWindow();
    this.createFilesConfirmWindow();
  }

  /**
   * Creates the column of commands and adds it to tracking.
   */
  createFilesCommandWindow()
  {
    // create the window with the rectangle.
    const window = new Window_FilesCommand(this.filesCommandWindowRect());

    // wire one handler per mode, so a command the origin does not offer simply never fires.
    window.modes()
      .forEach(mode => window.setHandler(mode.key(), this.onModeChosen.bind(this, mode)));

    window.setHandler(window.backSymbol(), this.popScene.bind(this));
    window.setHandler('cancel', this.popScene.bind(this));

    // it describes its highlighted command into the shared help window.
    window.setHelpWindow(this.helpWindow());

    // telling it where the player came from is what builds its commands for real.
    window.setEntryMode(this.entryMode());

    // update the tracker with the new window.
    this.setCommandWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  /**
   * Creates the list of files and adds it to tracking.
   */
  createFilesListWindow()
  {
    // create the window with the rectangle.
    const window = new Window_FilesList(this.filesListWindowRect());

    window.setHandler('entry', this.onEntryChosen.bind(this));
    window.setHandler('cancel', this.onListCancelled.bind(this));

    // the list is visible from the outset but never focused until a command is chosen.
    window.deactivate();
    window.deselect();

    // update the tracker with the new window.
    this.setListWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  /**
   * Creates the confirmation prompt and adds it to tracking.
   */
  createFilesConfirmWindow()
  {
    // create the window with the rectangle.
    const window = new Window_FilesConfirm(this.filesConfirmWindowRect());

    window.setHandler(window.confirmSymbol(), this.onConfirmed.bind(this));
    window.setHandler(window.denySymbol(), this.onDenied.bind(this));
    window.setHandler('cancel', this.onDenied.bind(this));

    // it exists from the start but stays out of the way until there is something to ask.
    window.hide();
    window.deactivate();

    // update the tracker with the new window.
    this.setConfirmWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  //endregion create

  //region layout
  /**
   * Builds the rectangle for the column of commands.
   * @returns {Rectangle}
   */
  filesCommandWindowRect()
  {
    const facetArea = this.facetAreaRect();

    return new Rectangle(facetArea.x, facetArea.y, this.commandColumnWidth(), facetArea.height);
  }

  /**
   * Builds the rectangle for the list of files, claiming everything the command column does not.
   * @returns {Rectangle}
   */
  filesListWindowRect()
  {
    const facetArea = this.facetAreaRect();

    const x = facetArea.x + this.commandColumnWidth();

    return new Rectangle(x, facetArea.y, facetArea.width - this.commandColumnWidth(), facetArea.height);
  }

  /**
   * Builds the rectangle for the confirmation prompt, centred over the list.
   *
   * Over the list rather than over the whole scene, so the row being asked about stays visible beside
   * the question rather than behind it.
   * @returns {Rectangle}
   */
  filesConfirmWindowRect()
  {
    const listArea = this.filesListWindowRect();

    const width = Math.floor(listArea.width * this.confirmWidthRatio());

    const height = this.calcWindowHeight(this.confirmLineCount(), true);

    const x = listArea.x + Math.floor((listArea.width - width) / 2);
    const y = listArea.y + Math.floor((listArea.height - height) / 2);

    return new Rectangle(x, y, width, height);
  }

  /**
   * The proportion of the list's width the confirmation prompt takes.
   * @returns {number}
   */
  confirmWidthRatio()
  {
    return 0.8;
  }

  /**
   * How many lines the confirmation prompt is tall: the question, then the two answers.
   * @returns {number}
   */
  confirmLineCount()
  {
    return 4;
  }

  //endregion layout

  //region actions
  /**
   * Handles a command being chosen, pointing the list at that mode's rows.
   * @param {SaveFileMode} mode The mode chosen.
   */
  onModeChosen(mode)
  {
    // rebuild the list from whatever this mode considers a row.
    this.listWindow()
      .setMode(mode);

    // stand the command column down while the player is choosing a row.
    this.commandWindow()
      .deactivate();

    this.listWindow()
      .activate();
    this.listWindow()
      .select(0);
  }

  /**
   * Handles the list being backed out of, returning focus to the commands.
   */
  onListCancelled()
  {
    this.listWindow()
      .deactivate();
    this.listWindow()
      .deselect();

    this.commandWindow()
      .activate();
  }

  /**
   * Handles a row being chosen, either asking first or acting immediately.
   */
  onEntryChosen()
  {
    // the mode decides whether this is worth a question. Loading from the title screen is the one case
    // that is not: there is no game in memory for it to cost, and confirming would ask the player to
    // agree to the thing they opened the menu to do.
    if (this.currentMode()
      .requiresConfirmation(this.entryMode()) === false)
    {
      this.executeCurrentMode();

      return;
    }

    this.openConfirmation();
  }

  /**
   * Raises the confirmation prompt over the list.
   */
  openConfirmation()
  {
    const mode = this.currentMode();

    const entry = this.listWindow()
      .currentEntry();

    const window = this.confirmWindow();

    window.setPrompt(mode.confirmText(entry));

    window.show();
    window.activate();

    // only the irreversible command opens on the safe answer.
    window.select(mode.confirmDefaultsToNo()
      ? 1
      : 0);

    this.listWindow()
      .deactivate();
  }

  /**
   * Handles the confirmation being accepted.
   */
  onConfirmed()
  {
    this.closeConfirmation();

    this.executeCurrentMode();
  }

  /**
   * Handles the confirmation being declined, returning the player to the list.
   */
  onDenied()
  {
    this.closeConfirmation();

    this.listWindow()
      .activate();
  }

  /**
   * Puts the confirmation prompt away.
   */
  closeConfirmation()
  {
    this.confirmWindow()
      .hide();
    this.confirmWindow()
      .deactivate();
  }

  /**
   * Runs whatever the current mode does to the highlighted row.
   */
  executeCurrentMode()
  {
    const mode = this.currentMode();

    const entry = this.listWindow()
      .currentEntry();

    // every mode answers with a promise, even the synchronous ones, so there is one success path and
    // one failure path here rather than a branch per command.
    mode.execute(entry)
      .then(() => this.onExecuteSuccess(mode))
      .catch(error => this.onExecuteFailure(error));
  }

  /**
   * Handles a command succeeding.
   * @param {SaveFileMode} mode The mode that ran.
   */
  onExecuteSuccess(mode)
  {
    // the mode owns which chime this was, because the engine's sounds are named for their actions.
    mode.playSuccessSound();

    // loading and rewinding both end with the scene going away and a map coming up.
    if (mode.resumesGame())
    {
      this.onLoadSuccess();

      return;
    }

    this.onListChangeSuccess(mode);
  }

  /**
   * Handles a command that leaves the player in this scene succeeding.
   *
   * Vanilla pops the scene after a save; this deliberately does not. The player is standing on a save
   * platform, and having the screen close itself the moment they use it means anything else they wanted
   * to do here costs them a walk back onto the platform.
   * @param {SaveFileMode} mode The mode that ran.
   */
  onListChangeSuccess(mode)
  {
    // the disk changed underneath the list, so its rows are now describing a state that is gone - a
    // new generation with a new picture and a new timestamp, or a slot that is no longer there.
    this.listWindow()
      .setMode(mode);

    this.listWindow()
      .deactivate();
    this.listWindow()
      .deselect();

    this.commandWindow()
      .refresh();
    this.commandWindow()
      .activate();
  }

  /**
   * Handles a load or rewind succeeding.
   *
   * Copied from `Scene_Load` deliberately rather than by feel, because every step of it is load-bearing
   * somewhere: `reloadMapIfUpdated` is what J-ABS aliases to force a map rebuild, and the flag is what
   * {@link terminate} reads to decide whether the new game is owed an `onAfterLoad`.
   */
  onLoadSuccess()
  {
    this.fadeOutAll();

    this.reloadMapIfUpdated();

    SceneManager.goto(Scene_Map);

    this.flagLoadSucceeded();
  }

  /**
   * Handles a command failing, leaving the player where they were to try something else.
   * @param {Error} error Why it failed.
   */
  onExecuteFailure(error)
  {
    console.error(error);

    SoundManager.playBuzzer();

    this.listWindow()
      .activate();
  }

  /**
   * Transfers the player to a fresh copy of the map when the game's data has moved on since the save.
   *
   * Identical to `Scene_Load`'s, and separate for the same reason it is separate there: J-ABS replaces
   * it outright while JABS is enabled, because the enemies on a map do not survive a load without a
   * rebuild.
   */
  reloadMapIfUpdated()
  {
    if ($gameSystem.versionId() !== $dataSystem.versionId)
    {
      const mapId = $gameMap.mapId();
      const { x } = $gamePlayer;
      const { y } = $gamePlayer;
      const direction = $gamePlayer.direction();

      $gamePlayer.reserveTransfer(mapId, x, y, direction, 0);
      $gamePlayer.requestMapReload();
    }
  }

  /**
   * Extends {@link #terminate}.<br/>
   * Also gives the freshly loaded game the after-load pass a great deal of plugin state re-applies in.
   *
   * `Scene_Load` does this and `Scene_Files` does not inherit from it, so without this the state that
   * re-seeds itself in `onAfterLoad` simply never would - silently, and only after a load.
   */
  terminate()
  {
    // perform original logic.
    super.terminate();

    if (this.hasLoadSucceeded())
    {
      $gameSystem.onAfterLoad();
    }
  }

  //endregion actions

  /**
   * Implements {@link Scene_MenuFacetBase.controlLegendEntries}.<br/>
   * @returns {{semantic: string, label: string}[]}
   */
  controlLegendEntries()
  {
    return [
      {
        semantic: 'ok',
        label: 'choose',
      },
      {
        semantic: 'cancel',
        label: 'back',
      },
    ];
  }
}

export default Scene_Files;
//endregion Scene_Files