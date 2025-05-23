/**
 * An implementation of a class surrounding the data for a singular window command.
 */
class BuiltWindowCommand
{
  //region properties
  /**
   * The name of the command.
   * This is what visibly shows up in the list of commands.
   * @type {string}
   */
  #name = String.empty;

  /**
   * Additional lines of text to render below the main command name.
   * @type {string[]}
   */
  #lines = [];

  /**
   * Whether or not the additional lines are actually subtext.<br/>
   * Additional lines are classified as subtext by default.
   * @type {boolean}
   */
  #isSubtext = true;

  /**
   * The text that will be right-aligned for this command.
   * @type {string}
   */
  #rightText = String.empty;

  /**
   * The text color index the right-aligned text will be rendered with.
   * @type {number}
   */
  #rightColorIndex = 0;

  /**
   * The symbol of this command.
   * This is normally invisible and used for connecting this command
   * to an event hook for logical processing.
   * @type {string}
   */
  #key = String.empty;

  /**
   * Whether or not this command is enabled.
   * @type {boolean}
   */
  #enabled = true;

  /**
   * The underlying data associated with this command.
   * Usually populated with whatever this command represents data-wise.
   * @type {null|any}
   */
  #extensionData = null;

  /**
   * Any special help text associated with this command.
   * @type {string}
   */
  #helpText = String.empty;

  /**
   * The index of the icon that will be rendered on the left side of this command.
   * @type {number}
   */
  #iconIndex = 0;

  /**
   * The text color index this command will be rendered with.
   * @type {number}
   */
  #colorIndex = 0;

  /**
   * The filename of the face image associated with this log.
   * @type {string|String.empty}
   */
  #faceName = String.empty;

  /**
   * The index of the face image associated with this log.
   * @type {number}
   */
  #faceIndex = -1;

  //endregion properties

  constructor(
    name,
    symbol,
    enabled = true,
    extensionData = null,
    iconIndex = 0,
    colorIndex = 0,
    rightText = String.empty,
    rightColorIndex = 0,
    lines = [],
    helpText = String.empty,
    isSubtext = true,
    faceData = [ String.empty, -1 ])
  {
    this.#name = name;
    this.#key = symbol;
    this.#enabled = enabled;
    this.#extensionData = extensionData;
    this.#iconIndex = iconIndex;
    this.#colorIndex = colorIndex;
    this.#rightText = rightText;
    this.#rightColorIndex = rightColorIndex;
    this.#lines = lines;
    this.#helpText = helpText;
    this.#isSubtext = isSubtext;

    const [ faceName, faceIndex ] = faceData;
    this.#faceName = faceName;
    this.#faceIndex = faceIndex;
  }

  //region getters
  /**
   * Gets the name for this command.
   * @returns {string}
   */
  get name()
  {
    return this.#name;
  }

  /**
   * Gets the extra lines that provide subtext to this command.
   * @returns {string[]}
   */
  get subText()
  {
    // if this is a command without subtext, then the subtext should be empty.
    if (!this.isSubtext) return [];

    // the additional lines are subtext, just return them.
    return this.#lines;
  }

  /**
   * Gets the extra lines that make up this multiline command.
   * @returns {string[]}
   */
  get lines()
  {
    // if this is a command with subtext, then lines should be empty.
    if (this.isSubtext) return [];

    // the additional lines are part of a multiline command, just return them.
    return this.#lines;
  }

  /**
   * Gets whether or not this command's additional lines were actually subtext.
   * @returns {boolean}
   */
  get isSubtext()
  {
    return this.#isSubtext;
  }

  /**
   * Gets the right-aligned text for this command.
   * @returns {string}
   */
  get rightText()
  {
    return this.#rightText;
  }

  /**
   * Gets the right-aligned color index of this command, if one is available.
   * @returns {number}
   */
  get rightColor()
  {
    return this.#rightColorIndex;
  }

  /**
   * Gets the symbol for this command.
   * @returns {string}
   */
  get symbol()
  {
    return this.#key;
  }

  /**
   * Gets whether or not this command is enabled.
   * @returns {boolean}
   */
  get enabled()
  {
    return this.#enabled;
  }

  /**
   * Gets the underlying extension data for this command, if any is available.
   * @returns {*|null}
   */
  get ext()
  {
    return this.#extensionData;
  }

  /**
   * Gets the icon index of this command, if one is available.
   * @returns {number}
   */
  get icon()
  {
    return this.#iconIndex;
  }

  /**
   * Gets the color index of this command, if one is available.
   * @returns {number}
   */
  get color()
  {
    return this.#colorIndex;
  }

  /**
   * Gets the help text of this command, if any is available.
   * @returns {string}
   */
  get helpText()
  {
    return this.#helpText;
  }

  get faceData()
  {
    return [ this.#faceName, this.#faceIndex ];
  }

  //endregion getters
}