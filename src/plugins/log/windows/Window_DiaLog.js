//region Window_DiaLog
/**
 * An extension/modification of the base {@link Window_MapLog}.<br/>
 * The {@link Window_DiaLog} is used for the chatter log.
 */
class Window_DiaLog extends Window_MapLog
{
  /**
   * The height of one row; 48.<br/>
   * This is intended to be equivalent to three regular log lines.
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
   * Overrides {@link drawBackgroundRect}.<br/>
   * Re-provides a background to each item in the log window to improve visibility.
   * @param {Rectangle} rect The rectangle of the background image.
   */
  drawBackgroundRect(rect)
  {
    // perform real original logic.
    Window_Selectable.prototype.drawBackgroundRect.call(this, rect);
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
    const commands = this.logManager.getLogs()
      .map((log, index) =>
      {
        /** @type {DiaLog} */
        const currentLog = log;
        // build the new command.
        // use the first line for the "main" line of the message.
        return new WindowCommandBuilder(currentLog.lines().at(0))
          .setSymbol(`log-${index}`)
          .setEnabled(true)
          // use everything after the first line for the rest of the message.
          .setTextLines(currentLog.lines().slice(1))
          .flagAsMultiline()
          .setFaceName(currentLog.faceName())
          .setFaceIndex(currentLog.faceIndex())
          .build();
      });

    // return the built commands.
    return commands;
  }
}
//endregion Window_DiaLog