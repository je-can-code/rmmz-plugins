//region Scene_JabsLoadout
import Window_LoadoutActorHeader from './../windows/Window_LoadoutActorHeader.js';
import Window_LoadoutBoard from './../windows/Window_LoadoutBoard.js';
import Window_LoadoutPicker from './../windows/Window_LoadoutPicker.js';

/**
 * The scene for reviewing and changing what each party member has bound to each combat input.
 *
 * This replaces five separate assign flows that previously lived on the JABS quick menu, each of
 * which opened a pair of on-map windows and every one of which operated on the party leader only-
 * meaning an ally's loadout could not be touched without first making them the leader.
 *
 * Unlike the other actor-scoped scenes this one extends the plain facet base rather than the
 * actor-scoped one. It has no single actor to put in a ribbon: the board shows every member at once,
 * which it can afford because its picker opens as a modal over the board instead of occupying a
 * column beside it.
 */
class Scene_JabsLoadout
  extends Scene_MenuFacetBase
{
  /**
   * Pushes this scene onto the scene stack.
   */
  static callScene()
  {
    SceneManager.push(Scene_JabsLoadout);
  }

  /**
   * Extends {@link #initMembers}.<br/>
   * Also initializes this scene's members.
   */
  initMembers()
  {
    // perform original logic.
    super.initMembers();

    /**
     * A grouping of all properties associated with the loadout.
     */
    this._j._loadout = {};

    /**
     * The headers naming each column's party member.
     * @type {Window_LoadoutActorHeader|null}
     */
    this._j._loadout._header = null;

    /**
     * The board of every member's every slot.
     * @type {Window_LoadoutBoard|null}
     */
    this._j._loadout._board = null;

    /**
     * The modal list of things eligible for the slot being filled.
     * @type {Window_LoadoutPicker|null}
     */
    this._j._loadout._picker = null;
  }

  //region create
  /**
   * Extends {@link #create}.<br/>
   * Also creates this scene's own windows.
   */
  create()
  {
    // perform original logic, which builds the shared chrome.
    super.create();

    // build the help window describing the highlighted slot.
    this.createHelpWindow();

    // build this scene's own contents. the board comes first because the headers take their column
    // geometry from it rather than deriving their own.
    this.createBoardWindow();
    this.createActorHeaderWindow();
    this.createPickerWindow();

    // begin on the first slot of the first member.
    this.boardWindow()
      .select(0);
    this.boardWindow()
      .activate();
  }

  /**
   * Creates the column headers and adds them to tracking.
   */
  createActorHeaderWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.actorHeaderWindowRect();

    // create the window with the rectangle.
    const window = new Window_LoadoutActorHeader(rectangle);

    // adopt the board's column geometry so each name sits over its own column.
    window.setColumnGeometry(this.boardWindow()
      .actorColumnWidth(), this.boardWindow()
      .slotSpineWidth());

    // update the tracker with the new window.
    this._j._loadout._header = window;

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  /**
   * Creates the loadout board and adds it to tracking.
   */
  createBoardWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.boardWindowRect();

    // create the window with the rectangle.
    const window = new Window_LoadoutBoard(rectangle);

    // choosing a slot opens the list of things eligible for it.
    window.setHandler('ok', this.onSlotSelected.bind(this));

    // the context action empties a slot without opening anything.
    window.setHandler('context', this.onSlotCleared.bind(this));

    // backing out of the board leaves the scene.
    window.setHandler('cancel', this.popScene.bind(this));

    // the board describes its highlighted slot into the help window.
    window.setHelpWindow(this.helpWindow());

    // update the tracker with the new window.
    this._j._loadout._board = window;

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  /**
   * Gets the loadout board.
   * @returns {Window_LoadoutBoard}
   */
  boardWindow()
  {
    return this._j._loadout._board;
  }

  /**
   * Creates the picker and adds it to tracking.
   */
  createPickerWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.pickerWindowRect();

    // create the window with the rectangle.
    const window = new Window_LoadoutPicker(rectangle);

    // choosing a candidate commits it to the slot.
    window.setHandler('candidate', this.onCandidateSelected.bind(this));

    // backing out abandons the assignment and returns to the board.
    window.setHandler('cancel', this.onPickerCancelled.bind(this));

    // the picker describes its highlighted candidate into the same help window as the board.
    window.setHelpWindow(this.helpWindow());

    // the picker is dormant until a slot is chosen.
    window.hide();
    window.deactivate();

    // update the tracker with the new window.
    this._j._loadout._picker = window;

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  /**
   * Gets the picker.
   * @returns {Window_LoadoutPicker}
   */
  pickerWindow()
  {
    return this._j._loadout._picker;
  }

  //endregion create

  //region layout
  /**
   * Builds the rectangle for the column headers, capping the board.
   * @returns {Rectangle}
   */
  actorHeaderWindowRect()
  {
    // start from the region this scene is allowed to fill.
    const facetArea = this.facetAreaRect();

    // a single line naming each column.
    const height = this.calcWindowHeight(1, false);

    // return the built rectangle.
    return new Rectangle(facetArea.x, facetArea.y, facetArea.width, height);
  }

  /**
   * Builds the rectangle for the board, filling whatever the headers leave.
   * @returns {Rectangle}
   */
  boardWindowRect()
  {
    // start from the region this scene is allowed to fill.
    const facetArea = this.facetAreaRect();

    // the headers consume the top of it.
    const headerHeight = this.actorHeaderWindowRect().height;

    // return whatever remains beneath the headers.
    return new Rectangle(
      facetArea.x,
      facetArea.y + headerHeight,
      facetArea.width,
      facetArea.height - headerHeight);
  }

  /**
   * Builds the rectangle for the picker, overlaying the board.
   *
   * It deliberately covers the board rather than sitting beside it- a permanent side panel is exactly
   * what forces every other actor-scoped scene down to one actor at a time.
   * @returns {Rectangle}
   */
  pickerWindowRect()
  {
    return this.boardWindowRect();
  }

  //endregion layout

  //region actions
  /**
   * Handles a slot being chosen on the board, opening the list of things eligible for it.
   */
  onSlotSelected()
  {
    // grab what the board says is highlighted.
    const slotData = this.boardWindow()
      .currentSlotData();

    // stand the board down while the picker is up.
    this.boardWindow()
      .deactivate();

    // point the picker at this actor's slot and reveal it.
    this.pickerWindow()
      .setTarget($gameActors.actor(slotData.actorId), slotData.slotKey);
    this.pickerWindow()
      .show();
    this.pickerWindow()
      .activate();
  }

  /**
   * Handles a candidate being chosen in the picker, committing it to the slot.
   */
  onCandidateSelected()
  {
    // the chosen candidate's id rides on the command.
    const chosenId = this.pickerWindow()
      .currentExt();

    // commit the assignment to the slot the picker was opened for.
    this.pickerWindow()
      .actor()
      .setEquippedSkill(this.pickerWindow()
        .slotKey(), chosenId);

    // return to the board, which must redraw to show what changed.
    this.closePicker();
  }

  /**
   * Handles the picker being backed out of without choosing anything.
   */
  onPickerCancelled()
  {
    this.closePicker();
  }

  /**
   * Dismisses the picker and returns focus to the board.
   */
  closePicker()
  {
    // hide the picker away again.
    this.pickerWindow()
      .hide();
    this.pickerWindow()
      .deactivate();

    // the board may now be showing stale assignments, so rebuild it.
    this.boardWindow()
      .refresh();
    this.boardWindow()
      .activate();
  }

  /**
   * Handles the context action on the board, emptying the highlighted slot.
   */
  onSlotCleared()
  {
    // grab what the board says is highlighted.
    const slotData = this.boardWindow()
      .currentSlotData();

    // an empty slot has nothing to clear, so say so rather than pretending something happened.
    if (slotData.skillId === 0)
    {
      SoundManager.playBuzzer();
      this.boardWindow()
        .activate();
      return;
    }

    // emptying a slot is assigning nothing to it.
    $gameActors.actor(slotData.actorId)
      .setEquippedSkill(slotData.slotKey, 0);

    // acknowledge the change and redraw to show it.
    SoundManager.playEquip();
    this.boardWindow()
      .refresh();
    this.boardWindow()
      .activate();
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
        label: 'assign',
      },
      {
        semantic: 'context',
        label: 'clear slot',
      },
      {
        semantic: 'cancel',
        label: 'back',
      },
    ];
  }
}

export default Scene_JabsLoadout;
//endregion Scene_JabsLoadout
