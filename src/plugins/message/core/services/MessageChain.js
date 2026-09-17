//region MessageChain
/**
 * The rules governing how many messages weld into one window, and how tall that window becomes.
 *
 * A message carrying `\more` is not finished when its Show Text command is - the next one joins it,
 * and the pair reveals as a single uninterrupted utterance. Welding continues for as long as each
 * message in turn asks for it, which lets a long speech be authored as the short, separate Show Text
 * commands the editor is comfortable with while the player reads one continuous thing.
 *
 * **The ceiling is the screen, and it is computed rather than configured.** A welded message has to
 * fit somewhere, and the only honest answer to "how much is too much" is "more than there is room
 * for". A number instead would be a number that is wrong at the first resolution nobody tested, and
 * an author who hit it would have no way to tell a deliberate limit from a bug.
 *
 * Everything here is arithmetic on rows and pixels, and it deliberately holds no opinion about where
 * those numbers came from. The interpreter measures a chain before welding one; the window sizes
 * itself once the welding is done; both ask the same questions of this. That shared answer is what
 * stops the cap the interpreter enforced and the height the window built from disagreeing.
 */
class MessageChain
{
  /**
   * How many whole rows of text a window of a given height can show.
   * @param {number} height The window's full height, frame included.
   * @param {number} lineHeight How tall a single row of text is.
   * @param {number} padding How much space the frame occupies along one edge.
   * @returns {number} The number of rows that fit.
   */
  static rowsFor(height, lineHeight, padding)
  {
    // both edges, because a window is framed top and bottom.
    const available = height - (padding * 2);

    // a partial row is not a row anybody can read, so the remainder is dropped rather than rounded.
    return Math.floor(available / lineHeight);
  }

  /**
   * How tall a window must be to show a given number of rows.
   *
   * Grown from the height the scene built rather than recalculated from the row count, because that
   * height is not simply four rows and a frame - the scene adds a handful of pixels of its own on
   * top. A window rebuilt from arithmetic would quietly lose them and sit a hair tighter than every
   * other message in the game.
   * @param {number} rows How many rows the message needs.
   * @param {number} defaultHeight The height the scene built the window at.
   * @param {number} defaultRows How many rows that height already shows.
   * @param {number} lineHeight How tall a single row of text is.
   * @returns {number} The height the window should be.
   */
  static heightFor(rows, defaultHeight, defaultRows, lineHeight)
  {
    // the ordinary case by an enormous margin - almost every message ever written is a line or two -
    // and the reason a window never shrinks below what the scene asked for.
    if (rows <= defaultRows) return defaultHeight;

    return defaultHeight + ((rows - defaultRows) * lineHeight);
  }

  /**
   * How many rows a welded message may hold before it runs out of screen.
   *
   * Derived from the same growing the window performs rather than from the bare screen height, and
   * that is the entire point of it. Rows counted one way and grown another agree only where the
   * arithmetic happens to leave slack, and at a great many resolutions it leaves none: counting rows
   * straight off a 816 pixel screen answers twenty-two, and twenty-two rows grown from a 176 pixel
   * box stand 824 pixels tall. Asked this way instead, the height for this many rows is never taller
   * than the screen, by construction rather than by luck.
   * @param {number} screenHeight How tall the screen is.
   * @param {number} defaultHeight The height the scene built the window at.
   * @param {number} defaultRows How many rows that height already shows.
   * @param {number} lineHeight How tall a single row of text is.
   * @returns {number} The most rows a welded message may hold.
   */
  static maxRows(screenHeight, defaultHeight, defaultRows, lineHeight)
  {
    // what the window has left to grow into, once it already occupies the box the scene laid out.
    const growth = screenHeight - defaultHeight;

    return defaultRows + Math.floor(growth / lineHeight);
  }

  /**
   * Whether a chain can take another message without outgrowing the room it has.
   *
   * Asked before a message is welded rather than after, so a chain stops one message short of the
   * ceiling instead of crossing it and being trimmed back. A message half-welded is a message whose
   * author wrote lines the player never sees.
   * @param {number} currentRows How many rows the chain holds already.
   * @param {number} incomingRows How many rows the next message would add.
   * @param {number} maxRows How many rows there is room for.
   * @returns {boolean}
   */
  static fits(currentRows, incomingRows, maxRows)
  {
    return (currentRows + incomingRows) <= maxRows;
  }
}

export default MessageChain;
//endregion MessageChain