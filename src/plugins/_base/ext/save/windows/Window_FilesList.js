//region Window_FilesList
/**
 * The list of things the chosen command can be pointed at.
 *
 * Slots for three of the four commands and generations for the fourth, drawn identically either way -
 * a picture of where you were, and four lines saying what "there" meant. Two rows at a time rather than
 * a scrolling column of thin ones, because the picture is the part a player actually recognizes and a
 * picture needs room to be recognized.
 *
 * **Every drawn value comes off the entry's manifest.** Not one of them comes off a `$game*` global,
 * and that is not a style preference: this scene is reachable from the title screen, where a throwaway
 * new game is already standing by. A row that reached for `$gameParty` there would draw the wrong party
 * without erroring, over the right thumbnail, which is the worst available outcome.
 */
class Window_FilesList
  extends Window_Command
{
  /**
   * Implements {@link Window_Command.initMembers}.<br/>
   * Seeds the rows and their cache before the command list is first built from them.
   */
  initMembers()
  {
    /**
     * The rows currently listed.
     * @type {SaveFileEntry[]}
     */
    this._entries = [];

    /**
     * The mode deciding what a row means and how it reads.
     * @type {SaveFileMode|null}
     */
    this._mode = null;

    /**
     * Pictures already asked for, by the path they were asked for by.
     *
     * `Bitmap.load` is asynchronous, so a row drawn before its picture arrives has to be drawn again
     * once it does. Caching by path is what stops that redraw from starting a fresh load and looping
     * forever - and because a path carries its generation, a new save is a new path and therefore
     * never shows a stale picture.
     * @type {Map<string, Bitmap>}
     */
    this._thumbnails = new Map();
  }

  //region properties
  /**
   * Gets the rows currently listed.
   * @returns {SaveFileEntry[]}
   */
  entries()
  {
    return this._entries;
  }

  /**
   * Sets the rows currently listed.
   * @param {SaveFileEntry[]} entries The rows to list.
   */
  setEntries(entries)
  {
    this._entries = entries;
  }

  /**
   * Gets the mode deciding what a row means.
   * @returns {SaveFileMode|null}
   */
  mode()
  {
    return this._mode;
  }

  /**
   * Gets the pictures already asked for, by the path they were asked for by.
   * @returns {Map<string, Bitmap>}
   */
  thumbnails()
  {
    return this._thumbnails;
  }

  /**
   * Points this list at a mode and rebuilds it from that mode's rows.
   * @param {SaveFileMode} mode The mode now driving the list.
   */
  setMode(mode)
  {
    this._mode = mode;

    this.setEntries(mode.entries());

    this.refresh();
  }

  /**
   * Gets the row currently highlighted.
   * @returns {SaveFileEntry|null} The row, or null while nothing is highlighted.
   */
  currentEntry()
  {
    return this.entries()
      .at(this.index()) ?? null;
  }

  //endregion properties

  //region layout
  /**
   * How many rows are visible at once.
   *
   * Two, which with the facet area's height is what makes a 16:9 picture comfortable rather than a
   * squeeze. A plugin parameter eventually; a constant deliberately for now.
   * @returns {number}
   */
  visibleRowCount()
  {
    return 2;
  }

  /**
   * Overwrites {@link Window_Selectable.itemHeight}.<br/>
   * Divides the window evenly among the rows it shows, rather than using a line height.
   * @returns {number}
   */
  itemHeight()
  {
    return Math.floor(this.innerHeight / this.visibleRowCount());
  }

  /**
   * The height of the picture drawn in a row.
   * @returns {number}
   */
  thumbnailHeight()
  {
    return this.itemHeight() - (this.rowPadding() * 2);
  }

  /**
   * The width of the picture drawn in a row, holding it to 16:9.
   * @returns {number}
   */
  thumbnailWidth()
  {
    return Math.floor(this.thumbnailHeight() * (16 / 9));
  }

  /**
   * The breathing room between a row's edges and its contents.
   * @returns {number}
   */
  rowPadding()
  {
    return 8;
  }

  /**
   * Where a row's text block begins, clear of the picture.
   * @returns {number}
   */
  textOffsetX()
  {
    return this.thumbnailWidth() + (this.rowPadding() * 2);
  }

  //endregion layout

  //region drawing
  /**
   * Implements {@link Window_Command.makeCommandList}.<br/>
   * Adds one command per row, enabled according to what this mode can act on.
   */
  makeCommandList()
  {
    // grab all the rows available.
    const commands = this.buildCommands();

    // build all the commands.
    commands.forEach(this.addBuiltCommand, this);
  }

  /**
   * Builds all commands for this command window.
   * One per row the active mode is listing, in the order the mode gave them.
   * @returns {BuiltWindowCommand[]}
   */
  buildCommands()
  {
    // built once during construction before the scene has chosen a mode, and no mode means no rows.
    if (this.mode() === null) return [];

    // compile the list of commands.
    return this.entries()
      .map(this.buildCommand, this);
  }

  /**
   * Builds a {@link BuiltWindowCommand} for one row.
   *
   * The name is empty because nothing about a row is a label- the picture, the map, the party and the
   * timestamp are all drawn by {@link #drawItem}. The index rides along as extension data so that
   * drawing can find its way back to the entry it belongs to.
   * @param {SaveFileEntry} entry The row being built.
   * @param {number} index The row's position in the list.
   * @returns {BuiltWindowCommand}
   */
  buildCommand(entry, index)
  {
    const selectable = this.mode()
      .isEntrySelectable(entry);

    return new WindowCommandBuilder(String.empty)
      .setSymbol('entry')
      .setEnabled(selectable)
      .setExtensionData(index)
      .build();
  }

  /**
   * Overwrites {@link Window_Command.drawItem}.<br/>
   * Renders a whole file rather than a line of text.
   * @param {number} index The row being drawn.
   */
  drawItem(index)
  {
    const entry = this.entries()[index];

    const rectangle = this.itemRect(index);

    // an unselectable row is drawn dimmed, which is what tells an empty slot apart from a full one in
    // a mode that cannot use it, without a second visual language for the same idea.
    this.changePaintOpacity(this.isCommandEnabled(index));

    if (entry.hasSave())
    {
      this.drawFilledRow(entry, rectangle);
    }
    else
    {
      this.drawEmptyRow(entry, rectangle);
    }

    // leave the canvas as we found it for whatever draws next.
    this.changePaintOpacity(true);
  }

  /**
   * Draws a row describing something that is actually on disk.
   * @param {SaveFileEntry} entry The row's data.
   * @param {Rectangle} rectangle The row's bounds.
   */
  drawFilledRow(entry, rectangle)
  {
    this.drawThumbnail(entry, rectangle);

    const x = rectangle.x + this.textOffsetX();

    const width = rectangle.width - this.textOffsetX() - this.rowPadding();

    // the lead line is the mode's call: where you were for most commands, how long ago for rewind.
    this.textLines(entry)
      .forEach((line, lineIndex) =>
      {
        this.drawTextEx(line, x, rectangle.y + this.rowPadding() + (lineIndex * this.lineHeight()), width);
      });
  }

  /**
   * Builds the lines of text a filled row carries.
   * @param {SaveFileEntry} entry The row's data.
   * @returns {string[]}
   */
  textLines(entry)
  {
    const display = entry.display();

    return [
      this.mode()
        .leadText(entry),
      `${display.leaderName}  \\C[6]Lv.${display.level}\\C[0]`,
      `${display.playtime}   \\C[17]${display.gold}\\C[0] ${TextManager.currencyUnit}`,
      this.describeTimestamp(display.timestamp),
    ];
  }

  /**
   * Draws a row for a slot nobody has saved to.
   *
   * Its number and nothing else. There is no data to be coy about, and inventing a placeholder picture
   * would make an empty slot look like a broken one.
   * @param {SaveFileEntry} entry The row's data.
   * @param {Rectangle} rectangle The row's bounds.
   */
  drawEmptyRow(entry, rectangle)
  {
    const y = rectangle.y + Math.floor((rectangle.height - this.lineHeight()) / 2);

    this.drawTextEx(`Slot ${entry.savefileId()} - Empty`, rectangle.x + this.rowPadding(), y, rectangle.width);
  }

  /**
   * Draws the picture taken when this row was written.
   * @param {SaveFileEntry} entry The row's data.
   * @param {Rectangle} rectangle The row's bounds.
   */
  drawThumbnail(entry, rectangle)
  {
    const x = rectangle.x + this.rowPadding();
    const y = rectangle.y + this.rowPadding();

    const width = this.thumbnailWidth();
    const height = this.thumbnailHeight();

    // a save written before pictures existed, or one whose picture was lost, simply has none - which
    // is a supported state everywhere, because losing a picture must never cost somebody a save.
    if (entry.hasThumbnail() === false)
    {
      this.drawMissingThumbnail(x, y, width, height);

      return;
    }

    const bitmap = this.thumbnailFor(entry);

    // still in flight; the load listener attached when it was cached will redraw the list.
    if (bitmap.isReady() === false) return;

    this.contents.blt(bitmap, 0, 0, bitmap.width, bitmap.height, x, y, width, height);
  }

  /**
   * Draws the space a picture would have occupied, so the text does not shift when one is absent.
   * @param {number} x The left edge of the space.
   * @param {number} y The top edge of the space.
   * @param {number} width The width of the space.
   * @param {number} height The height of the space.
   */
  drawMissingThumbnail(x, y, width, height)
  {
    this.contents.fillRect(x, y, width, height, ColorManager.gaugeBackColor());
  }

  /**
   * Gets the picture for a row, loading it the first time it is asked for.
   *
   * The load listener refreshes the whole window rather than the one row, which is both simpler and
   * cheap at two rows - and it attaches exactly once, at the moment the picture enters the cache, so a
   * redraw cannot stack listeners or start a second load.
   * @param {SaveFileEntry} entry The row wanting its picture.
   * @returns {Bitmap}
   */
  thumbnailFor(entry)
  {
    const url = entry.thumbnailUrl();

    if (this.thumbnails()
      .has(url))
    {
      return this.thumbnails()
        .get(url);
    }

    // `Bitmap.load` assigns the url straight onto an `<img>`, so there is no decoding to do on the way
    // back in - only the scheme, which `thumbnailUrl` has already put on the front.
    const bitmap = Bitmap.load(url);

    this.thumbnails()
      .set(url, bitmap);

    bitmap.addLoadListener(() => this.refresh());

    return bitmap;
  }

  /**
   * Renders when a row was written, in the player's own locale.
   * @param {number} timestamp The moment of writing, as milliseconds since the epoch.
   * @returns {string}
   */
  describeTimestamp(timestamp)
  {
    const written = new Date(timestamp);

    return `\\C[7]${written.toLocaleDateString()} ${written.toLocaleTimeString()}\\C[0]`;
  }

  //endregion drawing
}

export default Window_FilesList;
//endregion Window_FilesList