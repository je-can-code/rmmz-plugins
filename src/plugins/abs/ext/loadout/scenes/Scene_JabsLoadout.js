//region Scene_JabsLoadout
import Window_LoadoutActorHeader from './../windows/Window_LoadoutActorHeader.js';
import Window_LoadoutPicker from './../windows/Window_LoadoutPicker.js';
import Window_LoadoutSlots from './../windows/Window_LoadoutSlots.js';
import Window_LoadoutSpine from './../windows/Window_LoadoutSpine.js';
import LoadoutSlotCatalog from './../_models/LoadoutSlotCatalog.js';

/**
 * The scene for reviewing and changing what each party member has bound to each combat input.
 *
 * This replaces five separate assign flows that previously lived on the JABS quick menu, each of
 * which opened a pair of on-map windows and every one of which operated on the party leader only-
 * meaning an ally's loadout could not be touched without first making them the leader.
 *
 * Every member gets a column of slots, and those columns move together: choosing a row selects that
 * slot for everyone at once, and only the focused column animates its highlight. The candidate lists
 * beneath follow the same row, so "who has what in this slot, and what could they have" is answered
 * without navigating anywhere. Left and right change whose column is focused, and mean exactly that
 * everywhere in the scene.
 *
 * Unlike the other actor-scoped scenes this extends the plain facet base rather than the actor-scoped
 * one. It has no single actor to name in a ribbon.
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
     * The labels naming each row's slot.
     * @type {Window_LoadoutSpine|null}
     */
    this._j._loadout._spine = null;

    /**
     * Each member's column of slots, in party order.
     * @type {Window_LoadoutSlots[]}
     */
    this._j._loadout._slotColumns = [];

    /**
     * Each member's list of candidates for the selected slot, in party order.
     * @type {Window_LoadoutPicker[]}
     */
    this._j._loadout._pickers = [];

    /**
     * Which member's column is currently focused.
     * @type {number}
     */
    this._j._loadout._focusedColumn = 0;
  }

  //region properties
  /**
   * Gets the party members this scene presents, in column order.
   * @returns {Game_Actor[]}
   */
  members()
  {
    return $gameParty.members();
  }

  /**
   * Gets every member's slot column.
   * @returns {Window_LoadoutSlots[]}
   */
  slotColumns()
  {
    return this._j._loadout._slotColumns;
  }

  /**
   * Gets every member's candidate list.
   * @returns {Window_LoadoutPicker[]}
   */
  pickers()
  {
    return this._j._loadout._pickers;
  }

  /**
   * Gets which member's column is currently focused.
   * @returns {number} The focusedColumn.
   */
  focusedColumn()
  {
    // hand back the focused column.
    return this._j._loadout._focusedColumn;
  }

  /**
   * Sets which member's column is currently focused.
   * @param {number} newFocusedColumn The new focusedColumn.
   */
  setFocusedColumn(newFocusedColumn)
  {
    // assign the focused column.
    this._j._loadout._focusedColumn = newFocusedColumn;
  }

  /**
   * Gets the slot column currently focused.
   * @returns {Window_LoadoutSlots}
   */
  focusedSlotColumn()
  {
    return this.slotColumns()[this.focusedColumn()];
  }

  /**
   * Gets the candidate list belonging to the focused column.
   * @returns {Window_LoadoutPicker}
   */
  focusedPicker()
  {
    return this.pickers()[this.focusedColumn()];
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

    // build the help window describing the highlighted slot.
    this.createHelpWindow();

    // build this scene's own contents.
    this.createActorHeaderWindow();
    this.createSlotColumnWindows();
    this.createSpineWindow();
    this.createPickerWindows();

    // begin on the first slot of the first member.
    this.syncSlotSelection(0);
    this.focusedSlotColumn()
      .activate();
    this.refreshPickers();
  }

  /**
   * Creates the column headers and adds them to tracking.
   */
  createActorHeaderWindow()
  {
    // create the window with the rectangle.
    const window = new Window_LoadoutActorHeader(this.actorHeaderWindowRect());

    // adopt this scene's column geometry so each name sits over its own column.
    window.setColumnGeometry(this.actorColumnWidth(), this.spineWidth());

    // update the tracker with the new window.
    this._j._loadout._header = window;

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  /**
   * Creates one slot column per party member.
   */
  createSlotColumnWindows()
  {
    this.members()
      .forEach((actor, index) =>
      {
        // create the window with its column's rectangle.
        const window = new Window_LoadoutSlots(this.slotColumnRect(index));

        // point it at the member it represents.
        window.setActor(actor);

        // every column is wired identically; only the focused one is ever active.
        window.setHandler('ok', this.onSlotChosen.bind(this));
        window.setHandler('context', this.onSlotCleared.bind(this));
        window.setHandler('cancel', this.popScene.bind(this));
        window.setHandler('focus-prev', this.onFocusPreviousColumn.bind(this));
        window.setHandler('focus-next', this.onFocusNextColumn.bind(this));

        // it describes its highlighted slot into the shared help window.
        window.setHelpWindow(this.helpWindow());

        // columns other than the first begin dormant.
        window.deactivate();

        // track and register the window.
        this.slotColumns()
          .push(window);
        this.addWindow(window);
      });
  }

  /**
   * Creates the spine of slot labels and adds it to tracking.
   */
  createSpineWindow()
  {
    // create the window with the rectangle.
    const window = new Window_LoadoutSpine(this.spineWindowRect());

    // adopt the slot columns' row height so each label sits beside the row it names.
    window.setRowHeight(this.slotColumns()[0].itemHeight());

    // update the tracker with the new window.
    this._j._loadout._spine = window;

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  /**
   * Creates one candidate list per party member.
   */
  createPickerWindows()
  {
    this.members()
      .forEach((actor, index) =>
      {
        // create the window with its half of the space below.
        const window = new Window_LoadoutPicker(this.pickerRect(index));

        // choosing a candidate commits it; clearing empties the slot.
        window.setHandler('candidate', this.onCandidateChosen.bind(this));
        window.setHandler('clear', this.onCandidateCleared.bind(this));
        window.setHandler('cancel', this.onPickerCancelled.bind(this));

        // it describes its highlighted candidate into the same help window.
        window.setHelpWindow(this.helpWindow());

        // candidate lists are visible from the outset but never focused until asked for.
        window.deactivate();
        window.deselect();

        // track and register the window.
        this.pickers()
          .push(window);
        this.addWindow(window);
      });
  }

  //endregion create

  //region layout
  /**
   * The proportion of the width given to the spine of slot labels.
   *
   * Narrower than either member's column because it carries a short fixed label rather than a skill
   * name, and because the assignments are the content- the spine only says which row you are on.
   * @returns {number}
   */
  spineRatio()
  {
    return 0.24;
  }

  /**
   * The width of the spine of slot labels.
   * @returns {number}
   */
  spineWidth()
  {
    return Math.floor(this.facetAreaRect().width * this.spineRatio());
  }

  /**
   * The width of a single member's column.
   *
   * An even share of whatever the spine does not claim, so the columns always match each other
   * regardless of how wide the spine is configured to be.
   * @returns {number}
   */
  actorColumnWidth()
  {
    return Math.floor((this.facetAreaRect().width - this.spineWidth()) / this.members().length);
  }

  /**
   * The left edge of a given member's column.
   * @param {number} index The column being placed.
   * @returns {number}
   */
  actorColumnX(index)
  {
    // everything past the first column is pushed clear of the spine between them.
    const spineOffset = index === 0
      ? 0
      : this.spineWidth();

    return (this.actorColumnWidth() * index) + spineOffset;
  }

  /**
   * Builds the rectangle for the column headers, capping the slot columns.
   * @returns {Rectangle}
   */
  actorHeaderWindowRect()
  {
    const facetArea = this.facetAreaRect();

    return new Rectangle(facetArea.x, facetArea.y, facetArea.width, this.calcWindowHeight(1, false));
  }

  /**
   * The height of the slot columns, being exactly the rows they contain.
   * @returns {number}
   */
  slotColumnHeight()
  {
    return this.calcWindowHeight(LoadoutSlotCatalog.slotCount(), true);
  }

  /**
   * The vertical position the slot columns begin at.
   * @returns {number}
   */
  slotColumnY()
  {
    return this.facetAreaRect().y + this.actorHeaderWindowRect().height;
  }

  /**
   * Builds the rectangle for a given member's slot column.
   * @param {number} index The column being placed.
   * @returns {Rectangle}
   */
  slotColumnRect(index)
  {
    return new Rectangle(
      this.actorColumnX(index),
      this.slotColumnY(),
      this.actorColumnWidth(),
      this.slotColumnHeight());
  }

  /**
   * Builds the rectangle for the spine of slot labels, sat between the columns.
   * @returns {Rectangle}
   */
  spineWindowRect()
  {
    return new Rectangle(this.actorColumnWidth(), this.slotColumnY(), this.spineWidth(), this.slotColumnHeight());
  }

  /**
   * Builds the rectangle for a given member's candidate list.
   *
   * These claim everything between the slot columns and the control legend, which is the space the
   * scene previously left empty while opening its picker as a modal over the board instead.
   * @param {number} index The list being placed.
   * @returns {Rectangle}
   */
  pickerRect(index)
  {
    const facetArea = this.facetAreaRect();

    // each list takes an even share of the full width, ignoring the spine that divides the columns
    // above- there is nothing down here for a spine to separate.
    const width = Math.floor(facetArea.width / this.members().length);

    // begin immediately beneath the slot columns.
    const y = this.slotColumnY() + this.slotColumnHeight();

    // claim everything remaining.
    const height = facetArea.y + facetArea.height - y;

    return new Rectangle(width * index, y, width, height);
  }

  //endregion layout

  //region actions
  /**
   * Points every slot column at the same row, so a slot is selected for the whole party at once.
   *
   * Columns that are not focused stay selected rather than being deselected, which leaves their
   * highlight drawn without animating it- the player can see which slot they are on for everyone,
   * while it stays unambiguous whose slot they are about to change.
   * @param {number} index The row to select.
   */
  syncSlotSelection(index)
  {
    this.slotColumns()
      .forEach(column => column.select(index));
  }

  /**
   * Rebuilds every candidate list to reflect the currently selected slot.
   */
  refreshPickers()
  {
    // the slot is shared across columns, so any of them can name it.
    const slotKey = this.focusedSlotColumn()
      .currentSlotKey();

    // each list shows its own member's candidates for that same slot.
    this.pickers()
      .forEach((picker, index) => picker.setTarget(this.members()[index], slotKey));

    // a list nobody is choosing from should not look like it is awaiting a choice.
    this.pickers()
      .forEach(picker => picker.deselect());
  }

  /**
   * Extends {@link #update}.<br/>
   * Also keeps the unfocused columns and the candidate lists following the focused column.
   */
  update()
  {
    // perform original logic.
    super.update();

    // nothing to follow while the player is choosing a candidate rather than a slot.
    if (this.focusedPicker()
      .active) return;

    // the focused column is the only one the player can move, so it is the source of truth.
    const index = this.focusedSlotColumn()
      .index();

    // when it has moved, bring everything else along with it.
    if (this.slotColumns()
      .some(column => column.index() !== index))
    {
      this.syncSlotSelection(index);
      this.refreshPickers();
    }
  }

  /**
   * Moves focus to the previous member's column.
   */
  onFocusPreviousColumn()
  {
    this.focusColumn(this.focusedColumn() - 1);
  }

  /**
   * Moves focus to the next member's column.
   */
  onFocusNextColumn()
  {
    this.focusColumn(this.focusedColumn() + 1);
  }

  /**
   * Focuses a member's column, wrapping around the ends of the party.
   * @param {number} index The column to focus.
   */
  focusColumn(index)
  {
    // wrap rather than stopping, so holding a direction cycles the party.
    const count = this.slotColumns().length;
    const wrapped = ((index % count) + count) % count;

    // stand the old column down, leaving its selection drawn but no longer animated.
    this.focusedSlotColumn()
      .deactivate();

    // remember whose column now has focus.
    this.setFocusedColumn(wrapped);

    // wake the new one and let it describe its slot.
    this.focusedSlotColumn()
      .activate();
    this.focusedSlotColumn()
      .updateHelp();
  }

  /**
   * Handles a slot being chosen, focusing that member's candidate list.
   */
  onSlotChosen()
  {
    // stand the columns down while a candidate is being chosen.
    this.focusedSlotColumn()
      .deactivate();

    // wake this member's list at the top.
    this.focusedPicker()
      .activate();
    this.focusedPicker()
      .select(0);
  }

  /**
   * Handles a candidate being chosen, committing it to the slot.
   */
  onCandidateChosen()
  {
    // the chosen candidate's id rides on the command.
    const chosenId = this.focusedPicker()
      .currentExt();

    // commit it to the slot the list was built for.
    this.commitAssignment(chosenId);
  }

  /**
   * Handles the clear entry being chosen, emptying the slot.
   */
  onCandidateCleared()
  {
    // emptying a slot is assigning nothing to it.
    this.commitAssignment(0);
  }

  /**
   * Assigns something to the focused member's selected slot and returns to the columns.
   * @param {number} skillId The id to assign, or zero to empty the slot.
   */
  commitAssignment(skillId)
  {
    // commit the assignment.
    this.focusedPicker()
      .actor()
      .setEquippedSkill(this.focusedPicker()
        .slotKey(), skillId);

    // acknowledge the change.
    SoundManager.playEquip();

    // the column now shows a stale assignment, so rebuild it.
    this.focusedSlotColumn()
      .refresh();

    // return focus to the columns.
    this.closePicker();
  }

  /**
   * Handles the candidate list being backed out of without choosing anything.
   */
  onPickerCancelled()
  {
    this.closePicker();
  }

  /**
   * Returns focus from a candidate list to the slot columns.
   */
  closePicker()
  {
    // the list is no longer awaiting a choice.
    this.focusedPicker()
      .deactivate();
    this.focusedPicker()
      .deselect();

    // hand focus back to the column the player came from.
    this.focusedSlotColumn()
      .activate();
  }

  /**
   * Handles the context action on a slot column, emptying the highlighted slot outright.
   */
  onSlotCleared()
  {
    // grab the column doing the clearing.
    const column = this.focusedSlotColumn();

    // an already-empty slot has nothing to clear, so say so rather than pretending otherwise.
    if (column.slottedEntry(column.currentSlotKey()) === null)
    {
      SoundManager.playBuzzer();
      column.activate();
      return;
    }

    // emptying a slot is assigning nothing to it.
    column.actor()
      .setEquippedSkill(column.currentSlotKey(), 0);

    // acknowledge the change and redraw to show it.
    SoundManager.playEquip();
    column.refresh();
    column.activate();
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
        semantic: [ 'focus-prev', 'focus-next' ],
        label: 'switch character',
      },
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
