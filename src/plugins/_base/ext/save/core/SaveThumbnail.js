//region SaveThumbnail
/**
 * The picture a save takes of where the player was standing.
 *
 * Costs nothing to obtain. `Scene_Map.terminate` already calls `SceneManager.snapForBackground()` on
 * every exit that is not a battle, to build the blurred backdrop the menu draws behind itself - so a
 * full-resolution capture of the map exists before the files scene is ever constructed, and this only
 * has to crop and encode it.
 *
 * **The bitmap is shared, and two rules follow from that.** It is destroyed and replaced by the next
 * `snapForBackground()`, so it is read fresh at every save and never held across the scene. And it is
 * only ever drawn *from*, never onto - it is the live menu backdrop, and scribbling on it would show up
 * behind every menu in the game. Note that it is not blurred despite how the menu looks: the blur is a
 * `PIXI.filters.BlurFilter` on the background *sprite*, and the bitmap underneath is clean.
 */
class SaveThumbnail
{
  /**
   * The width the picture is stored at.
   * @type {number}
   */
  static outputWidth = 640;

  /**
   * The height the picture is stored at, making the stored aspect 16:9.
   * @type {number}
   */
  static outputHeight = 360;

  /**
   * How much of the source's height the crop takes.
   *
   * Half, which reads as a two-times zoom on wherever the player was standing. A full-screen crop would
   * be a shrunken screenshot with the player as an indistinct speck; anything much tighter stops
   * showing enough of the room to be recognizable, which is the entire job.
   * @type {number}
   */
  static cropScale = 0.5;

  /**
   * How hard the JPEG is compressed.
   *
   * JPEG over PNG deliberately: roughly 8-15KB against 40-90KB for a map render, and indistinguishable
   * at the size a row draws it. Save size is explicitly not a goal of this format, but the load menu
   * reads one of these per row every time it opens, so cheap is still better than not.
   * @type {number}
   */
  static quality = 0.7;

  /**
   * The aspect the crop and the stored image both hold to.
   * @returns {number}
   */
  static aspectRatio()
  {
    return SaveThumbnail.outputWidth / SaveThumbnail.outputHeight;
  }

  /**
   * Takes the picture for a save about to be written.
   * @returns {string} The picture as a data URL, or an empty string when there is nothing to capture.
   */
  static capture()
  {
    const source = SceneManager.backgroundBitmap();

    // the engine initializes this to null and only fills it on the first non-battle scene exit, so a
    // save reached without ever having left a map has genuinely nothing to photograph. An absent
    // picture is a supported state everywhere downstream, which is why this is a sentinel rather than
    // a failure.
    if (source === null) return String.empty;

    const { sx, sy, sw, sh } = SaveThumbnail.cropRect(
      $gamePlayer.screenX(),
      $gamePlayer.screenY(),
      source.width,
      source.height);

    return SaveThumbnail.encode(source, sx, sy, sw, sh);
  }

  /**
   * Works out which part of the capture to keep.
   *
   * Centred on the player, at the target aspect, and clamped so it never runs past an edge - which is
   * not a corner case but the ordinary one at a map boundary, where the engine stops scrolling and the
   * player walks toward the edge of a stationary screen instead of staying centred.
   *
   * Kept as a pure function of four numbers on purpose: this is where the clamp lives, the clamp is the
   * part with a bug in it if anything here has one, and none of it needs a canvas to test.
   * @param {number} centerX The x to centre on, in source pixels.
   * @param {number} centerY The y to centre on, in source pixels.
   * @param {number} sourceWidth The capture's full width.
   * @param {number} sourceHeight The capture's full height.
   * @returns {{sx: number, sy: number, sw: number, sh: number}} The rectangle to copy from.
   */
  static cropRect(centerX, centerY, sourceWidth, sourceHeight)
  {
    // start from the share of the source's height being kept, never asking for more than exists.
    const requestedHeight = Math.min(sourceHeight, Math.round(sourceHeight * SaveThumbnail.cropScale));

    // the width that height implies, likewise capped at what the source can supply - which is what
    // bites on a source narrower than 16:9.
    const width = Math.min(sourceWidth, Math.round(requestedHeight * SaveThumbnail.aspectRatio()));

    // if the width was the binding constraint, the height comes back down to keep the aspect honest.
    // stretching instead would put a subtly squashed map behind every row.
    const height = Math.min(requestedHeight, Math.round(width / SaveThumbnail.aspectRatio()));

    // slide the window so it stays inside the capture. at a map edge the player is off-centre in the
    // result, which is exactly what they were looking at.
    const sx = Math.round(centerX - (width / 2)).clamp(0, sourceWidth - width);
    const sy = Math.round(centerY - (height / 2)).clamp(0, sourceHeight - height);

    return {
      sx,
      sy,
      sw: width,
      sh: height,
    };
  }

  /**
   * Copies the chosen region into a canvas of our own and encodes it.
   * @param {Bitmap} source The capture to draw from.
   * @param {number} sx The left edge of the region to copy.
   * @param {number} sy The top edge of the region to copy.
   * @param {number} sw The width of the region to copy.
   * @param {number} sh The height of the region to copy.
   * @returns {string} The picture as a data URL.
   */
  static encode(source, sx, sy, sw, sh)
  {
    const canvas = document.createElement('canvas');

    canvas.width = SaveThumbnail.outputWidth;
    canvas.height = SaveThumbnail.outputHeight;

    // `Bitmap.canvas` lazily builds a 2D canvas backing the texture, which is what makes this readable
    // at all. Drawing into our own canvas rather than the source's is the whole of the "never draw
    // onto it" rule.
    canvas.getContext('2d')
      .drawImage(source.canvas, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', SaveThumbnail.quality);
  }
}

export default SaveThumbnail;
//endregion SaveThumbnail