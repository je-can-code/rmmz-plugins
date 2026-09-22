//region PlayerTravel
/**
 * How far the player moved across the last frame, measured rather than inferred.
 *
 * Weather asks this so that walking into a snowfall throws snow at the face rather than past the
 * back of the head. The obvious place to read it from is the engine's own pair of coordinates -
 * `_x` is the tile a character is heading for and `_realX` is where the sprite has got to, so the
 * gap between them is the direction of travel and closes the instant they stop.
 *
 * **That gap does not exist under pixel movement.** A plugin that moves characters in continuous
 * space writes the two together on every frame of movement, so they are always identical and the
 * inferred travel is permanently zero. Weather reading it concludes the player is standing still
 * forever, and the whole effect quietly turns itself off with nothing to show that it has.
 *
 * So the measurement is taken the one way that cannot be argued with: remember where the player was
 * last frame and subtract. That is a true velocity under either movement model, it needs to know
 * nothing about which one is installed, and it costs two numbers.
 */
class PlayerTravel
{
  /**
   * Whether a previous position has been recorded to measure against.
   *
   * The first sample of a run has nothing to subtract from, and guessing zero is not the same as
   * knowing it - without this, the first frame after a teleport reports the whole jump as one
   * frame of travel, which is a sprint in whichever direction the player happened to land.
   * @type {boolean}
   */
  #tracking = false;

  /**
   * Where the player was when last sampled.
   * @type {number}
   */
  #lastX = 0;

  /**
   * Where the player was when last sampled.
   * @type {number}
   */
  #lastY = 0;

  /**
   * How far the player moved on the most recent sample.
   * @type {number}
   */
  #movedX = 0;

  /**
   * How far the player moved on the most recent sample.
   * @type {number}
   */
  #movedY = 0;

  /**
   * Records where the player is now, and works out how far that is from last time.
   * @param {number} x Where the player is now, horizontally.
   * @param {number} y Where the player is now, vertically.
   */
  sample(x, y)
  {
    // nothing to measure against yet; this sample establishes the baseline instead.
    if (this.#tracking === false)
    {
      this.#beginAt(x, y);

      return;
    }

    this.#movedX = x - this.#lastX;
    this.#movedY = y - this.#lastY;
    this.#lastX = x;
    this.#lastY = y;
  }

  /**
   * Starts measuring afresh from wherever the player currently is.
   * @param {number} x Where the player is now, horizontally.
   * @param {number} y Where the player is now, vertically.
   */
  #beginAt(x, y)
  {
    this.#tracking = true;
    this.#lastX = x;
    this.#lastY = y;
    this.#movedX = 0;
    this.#movedY = 0;
  }

  /**
   * How far the player moved on the most recent sample, per axis.
   *
   * A fresh object each time rather than a shared one, because the caller is at liberty to hold on
   * to it and a shared object would change under them on the next frame.
   * @returns {{x: number, y: number}}
   */
  perFrame()
  {
    return {
      x: this.#movedX,
      y: this.#movedY,
    };
  }

  /**
   * Forgets where the player was, so the next sample measures from there instead.
   *
   * Called when the player arrives somewhere rather than walks somewhere. A transfer moves them an
   * arbitrary distance in no time at all, and a difference taken across that is not a speed.
   */
  forget()
  {
    this.#tracking = false;
    this.#movedX = 0;
    this.#movedY = 0;
  }
}

export default PlayerTravel;
//endregion PlayerTravel