//region DiaLog
/**
 * A single log message designed for the {@link Window_DiaLog} to display.
 */
class DiaLog
{
  /**
   * The lines that make up the text for this log.
   * @type {string[]}
   */
  #lines = [];

  /**
   * The filename of the face image associated with this log.
   * @type {string|String.empty}
   */
  #faceName = String.empty;

  /**
   * The index of the face image associated with this log.
   * @type {number}
   */
  #faceIndex = -1;

  /**
   * Constructor.<br/>
   * All parameters have defaults.
   * @param {string[]=} messageLines The lines that make up the message portion of this log.
   * @param {string=} faceName The filename that contains the face for this log.
   * @param {number=} faceIndex The index that maps to the face for this log.
   */
  constructor(messageLines = [], faceName = "", faceIndex = -1)
  {
    this.#setLines(messageLines);
    this.#setFaceName(faceName);
    this.#setFaceIndex(faceIndex);
  }

  /**
   * Sets the lines that make up this message log.
   * @param {string[]} lines The lines of the message.
   */
  #setLines(lines)
  {
    if (!Array.isArray(lines))
    {
      console.warn('Attempted to set the lines of a DiaLog with a non-array.');
      console.warn(lines);
    }

    this.#lines = lines;
  }

  /**
   * Gets the lines that make up this message log.
   * @returns {string[]}
   */
  lines()
  {
    return this.#lines;
  }

  /**
   * Sets the filename of the face image associated with this message.
   * @param {string} faceName The filename of the face image for this message.
   */
  #setFaceName(faceName)
  {
    this.#faceName = faceName;
  }

  /**
   * Gets the filename of the face associated with this message.
   * @returns {string}
   */
  faceName()
  {
    return this.#faceName;
  }

  /**
   * Sets the face index to the given index.
   * @param {number} faceIndex The face index for this message.
   */
  #setFaceIndex(faceIndex)
  {
    this.#faceIndex = faceIndex;
  }

  /**
   * Gets the face index associated with this message.
   * @returns {number}
   */
  faceIndex()
  {
    return this.#faceIndex;
  }
}

//endregion DiaLog