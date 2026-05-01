//region Window_DiaLog
/**
 * An extension/modification of the base {@link Window_MapLog}.<br/>
 * The {@link Window_DiaLog} is used for the chatter log.
 */
class Window_DiaLog
  extends Window_MapLog
{
  /**
   * The height of one row; 64.<br/>
   * This is intended to be equivalent to four regular log lines.
   * @type {number}
   */
  static rowHeight = 64;

  /**
   * Constructor.
   * @param {Rectangle} rect The rectangle that represents this window.
   * @param {MapLogManager} logManager the manager that this window leverages to get logs from.
   */
  constructor(rect, logManager)
  {
    super(rect, logManager);
  }

  //region overwrites
  /**
   * Overrides {@link drawFace}.<br/>
   * Blits the face image at a size fitted to each row instead of the full image size.
   */
  drawFace(faceName, faceIndex, x, y, width, height)
  {
    // copy pasta of the original face drawing techniques.
    const actualWidth = width || ImageManager.faceWidth;
    const actualHeight = height || ImageManager.faceHeight;
    const bitmap = ImageManager.loadFace(faceName);
    const pw = ImageManager.faceWidth;
    const ph = ImageManager.faceHeight;
    const sw = Math.min(actualWidth, pw);
    const sh = Math.min(actualHeight, ph);
    const dx = Math.floor(x + Math.max(actualWidth - pw, 0) / 2);
    const dy = Math.floor(y + Math.max(actualHeight - ph, 0) / 2);
    const sx = Math.floor((faceIndex % 4) * pw + (pw - sw) / 2);
    const sy = Math.floor(Math.floor(faceIndex / 4) * ph + (ph - sh) / 2);

    // designate that the image should be rendered at a smaller w:h size.
    const widthHeight = Window_DiaLog.rowHeight;
    this.contents.blt(bitmap, sx, sy, sw, sh, dx, dy, widthHeight, widthHeight);
  }

  /**
   * Overrides {@link #itemHeight}.<br>
   * Reduces the item height further to allow for more rows to be visible at once
   * within a smaller window.
   * @returns {number} The adjusted height of each row.
   * @override
   */
  itemHeight()
  {
    return Window_DiaLog.rowHeight;
  }

  /**
   * Overrides {@link Window_Command#drawItem}.<br>
   * Draws all lines top-down from the row's natural y position at a reduced font size,
   * avoiding the base class's centering-around-rectY approach which clips the first
   * line when the entry sits near the top of the content area.
   * Lines are spaced by the row height divided evenly among them.
   * @param {number} index The index of the command to draw.
   * @override
   */
  drawItem(index)
  {
    // handle color and opacity setup.
    this.preDrawItem(index);

    const { x: rectX, y: rectY, width: rectWidth } = this.itemLineRect(index);

    // gather the command name and any additional dialog lines.
    const commandName = this.commandName(index);
    const extraLines  = this.commandLines(index);
    const allLines    = extraLines.length > 0
      ? [ commandName, ...extraLines ]
      : [ commandName ];

    // reduce the font a couple notches so both lines sit comfortably in the row.
    const fontPrefix = `\\FS[18]`;

    // center the text block vertically within the row.
    // each line is approximately 22px tall at FS[18]; space them by that amount
    // and offset the block so it lands in the middle of the 64px row.
    const lineHeight  = 22;
    const blockHeight = allLines.length * lineHeight;
    const startY      = rectY + Math.floor((Window_DiaLog.rowHeight - blockHeight) / 2);

    allLines.forEach((line, i) =>
    {
      this.drawTextEx(`${fontPrefix}${line}`, rectX + 4, startY + (i * lineHeight), rectWidth);
    });
  }

  //endregion overwrites

  /**
   * Builds all commands for this dialog window.
   * @returns {BuiltWindowCommand[]}
   */
  buildCommands()
  {
    // do nothing if the log manager is not yet set.
    if (!this.logManager) return [];

    // build all the commands from the dia logs.
    // return the built commands.
    return this.logManager.getLogs()
      .map((log, index) =>
      {
        /** @type {DiaLog} */
        const currentLog = log;

        // use the first line for the "main" line of the message.
        const commandName = currentLog.lines()
          .at(0);

        // use everything after the first line for the rest of the message.
        const dialogLines = currentLog.lines()
          .slice(1);

        // build the new "command".
        return new WindowCommandBuilder(commandName)
          .setSymbol(`log-${index}`)
          .setEnabled(true)
          .setTextLines(dialogLines)
          .flagAsMultiline()
          .setFaceName(currentLog.faceName())
          .setFaceIndex(currentLog.faceIndex())
          .build();
      });
  }
}

//endregion Window_DiaLog