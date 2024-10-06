//region DiaLogBuilder
/**
 * A fluent-builder for building chat-related logs for the {@link Window_DiaLog}.
 */
class DiaLogBuilder
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
   * Builds the log in its current state and clears it.
   * @returns {ActionLog}
   */
  build()
  {
    // build the log.
    const log = new DiaLog(
      // copy the lines over.
      [...this.#lines],
      // assign the face information.
      this.#faceName,
      this.#faceIndex);

    // empty out the data from the builder.
    this.clear();

    // return what was built.
    return log;
  }

  /**
   * Clears the log data to a blank slate.
   * @returns {DiaLogBuilder}
   */
  clear()
  {
    this.#lines = [];
    this.#faceIndex = -1;
    this.#faceName = String.empty;
    return this;
  }

  /**
   * Adds a line to this dialog builder.
   * @param {string} line The line to add.
   * @returns {this}
   */
  addLine(line)
  {
    this.#lines.push(line);
    return this;
  }

  /**
   * Sets the lines for this dialog builder.
   * @param {string[]} lines The lines to set.
   * @returns {this} This builder for fluent chaining.
   */
  setLines(lines)
  {
    this.#lines = lines;
    return this;
  }

  /**
   * Sets the filename (without the extension) for the face image of this dialog builder.
   * @param {string} faceName The filename.
   * @returns {this}
   */
  setFaceName(faceName)
  {
    this.#faceName = faceName;
    return this;
  }

  /**
   * Sets the index for which face to use in the face sheet.
   * @param {number} faceIndex The index of the face.
   * @returns {this}
   */
  setFaceIndex(faceIndex)
  {
    this.#faceIndex = faceIndex;
    return this;
  }
}
//endregion DiaLogBuilder