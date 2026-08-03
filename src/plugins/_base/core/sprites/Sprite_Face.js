//region Sprite_Face
/**
 * A sprite that displays a single face.
 */
class Sprite_Face
  extends Sprite
{
  /**
   * Constructor.
   * @param {string} faceName The name of the face file.
   * @param {number} faceIndex The index of the face.
   */
  constructor(faceName, faceIndex)
  {
    super();
    this.initialize(faceName, faceIndex);
  }

  /**
   * Runs after {@link Sprite.prototype.initialize}.
   * @param {string} faceName The name of the face file.
   * @param {number} faceIndex The index of the face.
   */
  initialize(faceName, faceIndex)
  {
    // perform original logic.
    super.initialize();
    this.initMembers(faceName, faceIndex);
    this.loadBitmap();
  }

  /**
   * Initializes the properties associated with this sprite.
   * @param {string} faceName The name of the face file.
   * @param {number} faceIndex The index of the face.
   */
  initMembers(faceName, faceIndex)
  {
    this._j = {
      _faceName: faceName,
      _faceIndex: faceIndex,
    };
  }

  //region properties
  /**
   * Gets the j.
   * @returns {{_faceName: string, _faceIndex: number}} The j.
   */
  j()
  {
    // hand back the j.
    return this._j;
  }
  //endregion properties

  /**
   * Loads the bitmap into the sprite.
   */
  loadBitmap()
  {
    this.bitmap = ImageManager.loadFace(this.j()._faceName);
    const pw = ImageManager.faceWidth;
    const ph = ImageManager.faceHeight;
    const width = pw;
    const height = ph;
    const sw = Math.min(width, pw);
    const sh = Math.min(height, ph);
    const sx = Math.floor((this.j()._faceIndex % 4) * pw + (pw - sw) / 2);
    const sy = Math.floor(Math.floor(this.j()._faceIndex / 4) * ph + (ph - sh) / 2);
    this.setFrame(sx, sy, pw, ph);
  }
}

export default Sprite_Face;
//endregion Sprite_Face