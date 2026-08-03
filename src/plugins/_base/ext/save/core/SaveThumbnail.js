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
   * The width of the aspect the crop holds to.
   *
   * This describes a *shape*, not a size. The picture is stored at whatever the crop actually measured
   * rather than resampled to fixed dimensions - see {@link SaveThumbnail.encode}.
   * @type {number}
   */
  static aspectWidth = 16;

  /**
   * The height of the aspect the crop holds to.
   * @type {number}
   */
  static aspectHeight = 9;

  /**
   * The height the picture will actually be drawn at, or zero when nobody has said.
   * @type {number}
   */
  static #requestedHeight = 0;

  /**
   * Gets the height the picture will actually be drawn at.
   * @returns {number} The height in pixels, or zero when nobody has said.
   */
  static requestedHeight()
  {
    return SaveThumbnail.#requestedHeight;
  }

  /**
   * Declares the size the picture will actually be drawn at.
   *
   * Every scaling step costs sharpness, and there are only ever two available: the crop can be resized
   * on the way in, and it can be resized again on the way out. Told what the display needs, this takes
   * exactly that many pixels and neither step happens at all - the file is a lossless slice of the
   * screen and the row draws it one for one.
   *
   * The alternative was for this file to work the layout out for itself, which means a second copy of
   * a chain running from the screen size through the help window and the control legend into a row
   * height. Two copies of that drift, and the day they disagree the pictures go quietly soft.
   *
   * Left unset, the crop falls back to {@link SaveThumbnail.cropScale}, which is what a save triggered
   * from somewhere with no list to draw into gets.
   * @param {number} height The height in pixels the picture will be drawn at.
   */
  static requestSize(height)
  {
    SaveThumbnail.#requestedHeight = height;
  }

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
   * The format the picture is stored in.
   *
   * PNG rather than JPEG, and the content is why. JPEG's transform is built for photographs, where
   * neighbouring pixels mostly resemble one another; tile art is the opposite, all hard boundaries
   * between flat colours, and it is exactly those boundaries JPEG spends its error budget on. Every
   * tile edge in a map picks up a halo, and no quality setting removes them so much as makes them
   * smaller in exchange for the size advantage that was the only reason to be there.
   *
   * PNG is lossless, so the stored picture is precisely what was on the screen. It costs perhaps five
   * times the bytes, which against a format that already declares size a non-goal is nothing.
   * @type {string}
   */
  static format = 'image/png';

  /**
   * The aspect the crop and the stored image both hold to.
   * @returns {number}
   */
  static aspectRatio()
  {
    return SaveThumbnail.aspectWidth / SaveThumbnail.aspectHeight;
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
    // start from the share of the source's height being kept, never asking for more than exists. a
    // consumer that has said what size it draws at wins outright, because a crop that measures exactly
    // what will be drawn is never resampled by anybody - see `requestSize`.
    const preferredHeight = SaveThumbnail.requestedHeight() === 0
      ? Math.round(sourceHeight * SaveThumbnail.cropScale)
      : SaveThumbnail.requestedHeight();

    const requestedHeight = Math.min(sourceHeight, preferredHeight);

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
   *
   * **Stored at exactly the size it was cropped at, deliberately.** Resampling to fixed dimensions here
   * would resample the picture twice: once down to whatever number was chosen, and then back up by the
   * row that draws it, which is wider than any number small enough to feel like a thumbnail. The first
   * pass throws detail away and the second magnifies what survived, and the result is soft in a way no
   * amount of JPEG quality recovers.
   *
   * Storing the crop untouched means the picture can never be the bottleneck: a row scaling it *down*
   * stays sharp at any size, and the size it needs is a property of the window's layout and the screen
   * resolution, neither of which this file can see.
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

    canvas.width = sw;
    canvas.height = sh;

    // `Bitmap.canvas` lazily builds a 2D canvas backing the texture, which is what makes this readable
    // at all. Drawing into our own canvas rather than the source's is the whole of the "never draw
    // onto it" rule.
    canvas.getContext('2d')
      .drawImage(source.canvas, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/png');
  }
}

export default SaveThumbnail;
//endregion SaveThumbnail