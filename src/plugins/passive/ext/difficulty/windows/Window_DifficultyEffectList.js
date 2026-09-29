//region Window_DifficultyEffectList
/**
 * One side of a difficulty layer as a flat list: a title naming the side, then one row per effect.
 *
 * The rows arrive already decided by {@link DifficultyEffects}; this window only lays them out. Each row is the
 * effect's icon and name, with its value on the right in the color of how it reads for the player.
 *
 * A row too long for the list carries on beneath itself rather than running off its edge, and stands as tall as
 * the lines it takes, so everything beneath it moves down to make room.
 *
 * It is a list to read, never one to choose from, so it holds no cursor and takes no input.
 */
class Window_DifficultyEffectList
  extends Window_Command
{
  /**
   * The title row naming each side of every fight, keyed by side.
   *
   * A table on the class rather than a local, so an extension adding a side of its own adds its title beside
   * these.
   * @type {Object<string, {name: string, iconIndex: number, colorIndex: number}>}
   */
  static Titles = {
    actor: {
      name: 'Actor Effects',
      iconIndex: 82,
      colorIndex: 1,
    },
    enemy: {
      name: 'Enemy Effects',
      iconIndex: 14,
      colorIndex: 2,
    },
  };

  /**
   * The text color index for each tone a row can carry: the engine's own power-up and power-down colors, the
   * same ones the passive detail view uses.
   * @type {Object<string, number>}
   */
  static ToneColorIndices = {
    easier: 24,
    harder: 25,
    neutral: 0,
  };

  /**
   * What the list says when the layer leaves its side untouched.
   * @type {string}
   */
  static NoEffectsText = 'No effects.';

  /**
   * Constructor.
   * @param {Rectangle} rect The rectangle that represents this window.
   */
  constructor(rect)
  {
    // perform original logic, which builds the list- still empty, since no side is chosen yet.
    super(rect);

    // a list to read rather than choose from: no cursor, and no input.
    this.deselect();
    this.deactivate();
  }

  /**
   * Implements {@link Window_Command#initMembers}.<br/>
   * Seeds the side and the rows before the command list is first built from them.
   */
  initMembers()
  {
    // perform original logic.
    super.initMembers();

    /**
     * The side of every fight this list describes, or empty before one is chosen.
     * @type {string}
     */
    this._side = String.empty;

    /**
     * The rows describing each effect on this side.
     * @type {Array<{iconIndex: number, name: string, value: string, tone: string}>}
     */
    this._rows = [];
  }

  //region properties
  /**
   * Gets the side of every fight this list describes.
   * @returns {string}
   */
  side()
  {
    return this._side;
  }

  /**
   * Sets the side of every fight this list describes, and lists it.
   * @param {string} side One of {@link DifficultyEffects.Sides}.
   */
  setSide(side)
  {
    this._side = side;
    this.refresh();
  }

  /**
   * Gets the rows describing each effect on this side.
   * @returns {Array<{iconIndex: number, name: string, value: string, tone: string}>}
   */
  rows()
  {
    return this._rows;
  }

  /**
   * Sets the rows describing each effect on this side, and lists them.
   * @param {Array<{iconIndex: number, name: string, value: string, tone: string}>} rows The new rows.
   */
  setRows(rows)
  {
    this._rows = rows;
    this.refresh();
  }
  //endregion properties

  /**
   * Implements {@link #makeCommandList}.<br/>
   * Lists the title, then one row per effect, or a single row saying there are none.
   */
  makeCommandList()
  {
    // before a side is chosen there is nothing to title, and so nothing to list.
    if (this.side() === String.empty) return;

    // the title names the side first.
    this.addBuiltCommand(this.buildTitleCommand());

    // a side the layer leaves alone says so, rather than showing a bare title.
    if (this.rows().length === 0)
    {
      this.addBuiltCommand(this.buildNoEffectsCommand());
      return;
    }

    // one row per effect, in the order they arrived.
    this.rows()
      .forEach(row => this.addBuiltCommand(this.buildEffectCommand(row)));
  }

  /**
   * Builds the title row naming this list's side.
   * @returns {BuiltWindowCommand}
   */
  buildTitleCommand()
  {
    const {
      name,
      iconIndex,
      colorIndex
    } = Window_DifficultyEffectList.Titles[this.side()];

    return new WindowCommandBuilder(name)
      .setIconIndex(iconIndex)
      .setColorIndex(colorIndex)
      .build();
  }

  /**
   * Builds the row saying this side is left untouched.
   * @returns {BuiltWindowCommand}
   */
  buildNoEffectsCommand()
  {
    return new WindowCommandBuilder(Window_DifficultyEffectList.NoEffectsText)
      .build();
  }

  /**
   * Builds the row for one effect.
   * @param {{iconIndex: number, name: string, value: string, tone: string, isProse?: boolean}} row The effect.
   * @returns {BuiltWindowCommand}
   */
  buildEffectCommand(row)
  {
    // a sentence carries its value inside its words, so it is built as one.
    if (row.isProse === true) return this.buildProseCommand(row);

    const {
      iconIndex,
      name,
      value,
      tone
    } = row;

    // the value takes the color of how it reads for the player.
    const valueColorIndex = this.toneColorIndex(tone);

    return this.wrappedRowBuilder(name, iconIndex, value)
      .setRightText(value)
      .setRightColorIndex(valueColorIndex)
      .build();
  }

  /**
   * Builds the row for one effect written as a sentence, its value colored and bolded right where it stands.
   * @param {{iconIndex: number, name: string, value: string, tone: string, isProse: boolean}} row The effect.
   * @returns {BuiltWindowCommand}
   */
  buildProseCommand(row)
  {
    const {
      iconIndex,
      name,
      value,
      tone
    } = row;

    // the value takes the color of how it reads for the player, in its place in the sentence.
    const valueColorIndex = this.toneColorIndex(tone);
    const sentence = NotetagLine.withValueInPlace(name, value, valueColorIndex);

    return this.wrappedRowBuilder(sentence, iconIndex, String.empty)
      .build();
  }

  /**
   * A builder for a row whose words may not fit on one line: its first line as the command's name, and every line
   * after it beneath.
   * @param {string} text The row's words, text codes and all.
   * @param {number} iconIndex The row's icon, or 0 for none.
   * @param {string} rightText What the row shows on its right, or empty for nothing.
   * @returns {WindowCommandBuilder}
   */
  wrappedRowBuilder(text, iconIndex, rightText)
  {
    // the words broken wherever they would run past the row.
    const [ firstLine, ...moreLines ] = this.wrapToRow(text, iconIndex, rightText);

    return new WindowCommandBuilder(firstLine)
      .setTextLines(moreLines)
      .flagAsMultiline()
      .setIconIndex(iconIndex);
  }

  /**
   * The lines a row's words take, none wider than the room the row leaves them, each picking back up whatever color
   * or bold the line before it left open.
   * @param {string} text The row's words, text codes and all.
   * @param {number} iconIndex The row's icon, or 0 for none.
   * @param {string} rightText What the row shows on its right, or empty for nothing.
   * @returns {string[]}
   */
  wrapToRow(text, iconIndex, rightText)
  {
    const width = this.rowTextWidth(iconIndex, rightText);

    return TextWrapper.wrapStyled(text, width, candidate => this.textSizeEx(candidate).width);
  }

  /**
   * The room a row leaves its words: the row's width, less the indent its icon takes and whatever its right text
   * needs.
   * @param {number} iconIndex The row's icon, or 0 for none.
   * @param {string} rightText What the row shows on its right, or empty for nothing.
   * @returns {number}
   */
  rowTextWidth(iconIndex, rightText)
  {
    // every row of this one-column list is as wide as the first.
    const { width } = this.itemLineRect(0);

    // the words start past the icon when there is one, and stop short of the right text.
    const indent = this.commandNameIndent(iconIndex > 0);
    const rightTextWidth = this.textWidth(rightText);

    return width - indent - rightTextWidth;
  }

  //region row heights
  /**
   * Overwrites {@link Window_Command#multilineLineHeight}.<br/>
   * Spaces the lines of a wrapped row a full line apart, since they are one sentence at one size rather than smaller
   * subtext beneath a name.
   * @returns {number}
   */
  multilineLineHeight()
  {
    return this.lineHeight();
  }

  /**
   * Extends {@link Window_Selectable#itemRect}.<br/>
   * Makes each row as tall as its lines: a row that wrapped grows by a line for every line it wrapped onto, and
   * every row beneath it moves down by as much.
   * @param {number} index The row.
   * @returns {Rectangle}
   */
  itemRect(index)
  {
    // perform original logic, which lays every row out one line tall.
    const rect = super.itemRect(index);

    // beneath every taller row above it, and as tall as its own lines.
    rect.y += this.extraHeightAbove(index);
    rect.height += this.extraHeightOf(index);

    return rect;
  }

  /**
   * Extends {@link Window_Selectable#overallHeight}.<br/>
   * Also counts the lines every wrapped row adds, so the list knows how tall its rows really stand.
   * @returns {number}
   */
  overallHeight()
  {
    // perform original logic, which counts every row one line tall.
    const height = super.overallHeight();
    const extraHeight = this.extraHeightAbove(this.maxItems());

    return height + extraHeight;
  }

  /**
   * How much taller than one line the rows above the given one stand, all together.
   * @param {number} index The row.
   * @returns {number}
   */
  extraHeightAbove(index)
  {
    // each row above this one, taller by its own extra lines.
    const extraHeights = Array.from({ length: index }, (_, row) => this.extraHeightOf(row));

    return extraHeights.reduce((total, extraHeight) => total + extraHeight, 0);
  }

  /**
   * How much taller than one line a row stands: a line's height for every line its words wrapped onto.
   * @param {number} index The row.
   * @returns {number}
   */
  extraHeightOf(index)
  {
    const extraLines = this.commandLines(index);

    return extraLines.length * this.multilineLineHeight();
  }
  //endregion row heights

  /**
   * The text color index for a tone.
   *
   * Its own method rather than an inline lookup, so an extension wanting different colors aliases this one
   * answer instead of rebuilding the row.
   * @param {string} tone One of {@link DifficultyEffects.Tones}.
   * @returns {number}
   */
  toneColorIndex(tone)
  {
    return Window_DifficultyEffectList.ToneColorIndices[tone];
  }
}

export default Window_DifficultyEffectList;
//endregion Window_DifficultyEffectList