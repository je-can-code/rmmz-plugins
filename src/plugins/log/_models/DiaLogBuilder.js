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
   * Builds the log in its current state.
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
    return this;
  }

  addLine(line)
  {
    this.#lines.push(line);
    return this;
  }

  setLines(lines)
  {
    this.#lines = lines;
    return this;
  }

  setFaceName(faceName)
  {
    this.#faceName = faceName;
    return this;
  }

  setFaceIndex(faceIndex)
  {
    this.#faceIndex = faceIndex;
    return this;
  }
}
//endregion DiaLogBuilder