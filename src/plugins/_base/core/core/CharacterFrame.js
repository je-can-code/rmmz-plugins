//region CharacterFrame
/**
 * Where one frame of one character sits on its sheet, and how large to draw it, worked out as plain
 * arithmetic so every window that shows a character away from the map can share it.
 *
 * Character sheets come in two layouts. A sheet whose name carries a `$` holds a single character in
 * a 3x4 grid of frames: three walk frames across, four facings down. An ordinary sheet holds eight
 * characters in a 12x8 grid, each owning a 3x4 block of its own, four blocks across and two down. A
 * menu portrait and a pedia page both want the same frame out of either layout, so it is chosen here
 * once rather than re-derived beside every blit.
 */
class CharacterFrame
{
  /**
   * The rectangle of a character's neutral standing frame, facing the player.<br/>
   * That is the middle of the three walk frames on the first of the four facings: the same frame the
   * engine's own {@link Window_Base.drawCharacter} chooses, and the one that reads as the character at
   * rest rather than mid-stride.
   * @param {string} characterName The sheet's filename, prefix symbols included.
   * @param {number} characterIndex Which of an ordinary sheet's eight characters to take.
   * @param {number} sheetWidth The full width of the sheet's bitmap.
   * @param {number} sheetHeight The full height of the sheet's bitmap.
   * @returns {{x: number, y: number, width: number, height: number}}
   */
  static standing(characterName, characterIndex, sheetWidth, sheetHeight)
  {
    // a "$" sheet holds a single character in a 3x4 grid; an ordinary sheet holds eight in a 12x8 one.
    const isBig = ImageManager.isBigCharacter(characterName);
    const width = sheetWidth / (isBig ? 3 : 12);
    const height = sheetHeight / (isBig ? 4 : 8);

    // a big sheet's lone occupant always sits at position zero, whatever index it was given.
    const position = isBig ? 0 : characterIndex;

    // the middle of the three walk frames, inside whichever block the character owns.
    const x = ((position % 4) * 3 + 1) * width;

    // the first of the block's four facings, which is the one looking at the player.
    const y = Math.floor(position / 4) * 4 * height;

    // the frame, measured in the sheet's own pixels.
    return { x, y, width, height };
  }

  /**
   * How many times larger than native to draw a frame, so it shows at a preferred size without ever
   * spilling out of the space reserved for it.<br/>
   * The preferred scale applies to every frame alike, so a small creature still reads as small beside a
   * large one. Only a frame too large for the box is shrunk, and only as far as it has to be.
   * @param {number} frameWidth The frame's native width.
   * @param {number} frameHeight The frame's native height.
   * @param {number} boxWidth The width available to draw into.
   * @param {number} boxHeight The height available to draw into.
   * @param {number} preferredScale The scale to draw at whenever it fits.
   * @returns {number}
   */
  static fitScale(frameWidth, frameHeight, boxWidth, boxHeight, preferredScale)
  {
    // the largest scale at which the frame still fits, measured each way.
    const widthLimit = boxWidth / frameWidth;
    const heightLimit = boxHeight / frameHeight;

    // the preferred scale, unless the box is too small to hold it.
    return Math.min(preferredScale, widthLimit, heightLimit);
  }
}

export default CharacterFrame;
//endregion CharacterFrame