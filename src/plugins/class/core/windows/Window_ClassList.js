//region Window_ClassList
import ClassManager from '../managers/ClassManager.js';

/**
 * The classes an actor may look at, one row each, with the class they are standing in picked out in color.
 *
 * Every row draws at full strength whether or not it can be confirmed. This list is as much for reading as
 * for choosing- opened from the menu, nothing in it can be confirmed at all- and the engine's dimmed
 * disabled rows would leave a list meant for browsing looking switched off. Whether confirming does anything
 * is answered at the moment of confirming instead, which is where the buzzer belongs.
 */
class Window_ClassList
  extends Window_Command
{
  /**
   * The color the class an actor is standing in is drawn in.
   * @type {number}
   */
  static CURRENT_CLASS_COLOR_INDEX = 6;

  /**
   * The color a class the actor has yet to unlock is drawn in: dimmed, since it is only a hint.
   * @type {number}
   */
  static LOCKED_CLASS_COLOR_INDEX = 7;

  //region init
  /**
   * Constructor.
   * @param {Rectangle} rect The rectangle to draw the window in.
   */
  constructor(rect)
  {
    // call parent ctor, which seeds this window's members via initMembers before building the list.
    super(rect);
  }

  /**
   * Implements {@link Window_Command.initMembers}.<br/>
   * Initializes the members of this window.
   *
   * These cannot be class field declarations: JavaScript applies those only after `super()` returns, by
   * which point the command list has already been built from them and found them undefined.
   */
  initMembers()
  {
    /**
     * The actor whose classes are listed.
     * @type {Game_Actor|null}
     */
    this._actor = null;

    /**
     * Whether confirming a row may change the actor's class.
     * @type {boolean}
     */
    this._isChangingAllowed = false;
  }

  //endregion init

  //region accessors
  /**
   * Gets the actor whose classes are listed.
   * @returns {Game_Actor|null}
   */
  actor()
  {
    return this._actor;
  }

  /**
   * Sets the actor whose classes are listed, and rebuilds the list for them.
   * @param {Game_Actor} actor The actor to list classes for.
   */
  setActor(actor)
  {
    this._actor = actor;

    // a different actor has a different set of classes.
    this.refresh();
  }

  /**
   * Gets whether confirming a row may change the actor's class.
   * @returns {boolean}
   */
  isChangingAllowed()
  {
    return this._isChangingAllowed;
  }

  /**
   * Sets whether confirming a row may change the actor's class.
   * @param {boolean} isChangingAllowed Whether changing classes is allowed.
   */
  setChangingAllowed(isChangingAllowed)
  {
    this._isChangingAllowed = isChangingAllowed;
  }

  //endregion accessors

  //region commands
  /**
   * Implements {@link Window_Command.makeCommandList}.<br/>
   * Lists every class the actor can see.
   */
  makeCommandList()
  {
    // there is nothing to list until an actor is chosen.
    if (this.actor() === null) return;

    // build one row per class and add them in database order.
    const commands = this.buildCommands();
    commands.forEach(this.addBuiltCommand, this);
  }

  /**
   * Builds a row for every class the actor can see.
   * @returns {BuiltWindowCommand[]}
   */
  buildCommands()
  {
    // the service decides which classes belong here.
    const classes = ClassManager.selectableClasses(this.actor());

    return classes.map(this.buildCommand, this);
  }

  /**
   * Builds the row for a single class.
   * @param {RPG_Class} dataClass The class the row names.
   * @returns {BuiltWindowCommand}
   */
  buildCommand(dataClass)
  {
    // the service decides what a row gives away: everything once the class is revealed, "???" until then.
    const name = ClassManager.listedClassName(this.actor(), dataClass);
    const iconIndex = ClassManager.listedClassIconIndex(this.actor(), dataClass);

    // gather what the row shows beside the class's name.
    const colorIndex = this.classColorIndex(dataClass);
    const rightText = this.classRightText(dataClass);
    const rightColorIndex = this.classRightColorIndex(dataClass);

    return new WindowCommandBuilder(name)
      .setSymbol('class')
      .setExtensionData(dataClass)
      .setIconIndex(iconIndex)
      .setColorIndex(colorIndex)
      .setRightText(rightText)
      .setRightColorIndex(rightColorIndex)
      .build();
  }

  /**
   * The color a class's name is drawn in: picked out for the class the actor is standing in, dimmed for a
   * class they have yet to unlock, and plain for every other.
   * @param {RPG_Class} dataClass The class the row names.
   * @returns {number}
   */
  classColorIndex(dataClass)
  {
    // the class being worn is the one the player needs to find at a glance.
    const currentClass = this.actor()
      .currentClass();
    if (dataClass.id === currentClass.id) return Window_ClassList.CURRENT_CLASS_COLOR_INDEX;

    // a class still to unlock is only a hint.
    const isRevealed = ClassManager.isClassRevealed(this.actor(), dataClass.id);
    if (isRevealed === false) return Window_ClassList.LOCKED_CLASS_COLOR_INDEX;

    // every other class draws plain.
    return 0;
  }

  /**
   * The short text drawn at the right edge of a class's row.
   *
   * Empty here. This is the seam an extension aliases to summarize whatever it tracks about each class,
   * such as how much of it has been learned.
   * @param {RPG_Class} dataClass The class the row names.
   * @returns {string}
   */
  // eslint-disable-next-line no-unused-vars
  classRightText(dataClass)
  {
    return String.empty;
  }

  /**
   * The color the text at the right edge of a class's row is drawn in.
   *
   * Plain here. An extension that summarizes something about each class aliases this beside
   * {@link #classRightText}, to mark a summary worth marking- a class fully learned, say.
   * @param {RPG_Class} dataClass The class the row names.
   * @returns {number}
   */
  // eslint-disable-next-line no-unused-vars
  classRightColorIndex(dataClass)
  {
    return 0;
  }

  //endregion commands

  //region confirming
  /**
   * Overrides {@link Window_Command.isCurrentItemEnabled}.<br/>
   * Asks whether confirming the highlighted class would change into it, rather than whether its row is
   * drawn enabled- every row is, for reading.
   * @returns {boolean}
   */
  isCurrentItemEnabled()
  {
    // the row always carries the class it names.
    const dataClass = this.currentExt();

    return ClassManager.canChangeClass(this.actor(), dataClass.id, this.isChangingAllowed());
  }

  //endregion confirming
}

export default Window_ClassList;
//endregion Window_ClassList