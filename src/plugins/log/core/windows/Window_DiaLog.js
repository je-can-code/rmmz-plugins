//region Window_DiaLog
import MapLogManager from './../managers/MapLogManager.js';
import Window_MapLog from './_Window_MapLog.js';

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

  static fontAdjustment = 4;

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
   * Overwrites {@link drawFace}.<br/>
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
   * Overwrites {@link #itemHeight}.<br/>
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
   * Overwrites {@link Window_Command#multilineLineHeight}.<br/>
   * Increases line spacing slightly to give multi-line entries more breathing room.
   * @returns {number}
   * @override
   */
  multilineLineHeight()
  {
    return super.multilineLineHeight() + Math.round(Window_DiaLog.fontAdjustment * 1.5);
  }

  /**
   * Overwrites {@link Window_Base#resetFontSize}.<br/>
   * Reduces the font size slightly so multi-line entries fit comfortably
   * within each 64px row without crowding.
   * @override
   */
  resetFontSize()
  {
    // start from the system default then step down a couple notches.
    super.resetFontSize();
    this.contents.fontSize -= Window_DiaLog.fontAdjustment;
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

export default Window_DiaLog;
//endregion Window_DiaLog