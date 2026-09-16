//region FadingSprites
/**
 * The sprites a layer is still showing on their way out.
 *
 * A plane that syncs itself against a list of records has one awkward moment: the record is gone and
 * the sprite is not, because the sprite has half a second of leaving left to do. Held in the same
 * map it was before, it would be found again by the next sync and read as still current; removed
 * outright, it would blink away, which is the thing being fixed. So it moves here instead - out of
 * the layer's living set and into one that is counting down.
 *
 * It holds sprites and does no drawing, which is what keeps the bookkeeping out of the layers. Two
 * different planes in two different plugins do exactly this, and they have to do it identically or a
 * conversation and the muttering behind it leave the screen at different rates.
 */
class FadingSprites
{
  /**
   * Everything on its way out, by the key it used to be known under.
   * @type {Map<string, {sprite: object, elapsed: number, frames: number}>}
   */
  #departing = new Map();

  /**
   * Starts a sprite fading.
   *
   * The length is taken once, here, rather than asked for on each frame: a config reloaded while
   * something is leaving must not change how long it has left.
   * @param {string} key What the sprite was known as.
   * @param {object} sprite The sprite to fade.
   * @param {number} frames How many frames it should take.
   */
  begin(key, sprite, frames)
  {
    this.#departing.set(key, {
      sprite,
      elapsed: 0,
      frames,
      // where the sprite already was, because not everything that leaves was fully opaque to begin
      // with. A bubble somebody has finished speaking sits dimmed, and a fade that started from full
      // brightness would have it flare up on the frame it was told to go.
      from: sprite.alpha,
    });
  }

  /**
   * Whether a key is currently on its way out.
   * @param {string} key The key in question.
   * @returns {boolean}
   */
  has(key)
  {
    return this.#departing.has(key);
  }

  /**
   * Stops a sprite fading and hands it back.
   *
   * What happens when somebody starts talking again halfway through having stopped. The sprite that
   * was leaving is not reused - it is showing the previous line - so it is handed over to be taken
   * off the plane, and the caller builds a new one.
   * @param {string} key The key that came back.
   * @returns {?object} The sprite that was leaving, or null if nothing was.
   */
  take(key)
  {
    const departing = this.#departing.get(key);

    if (departing === undefined) return null;

    this.#departing.delete(key);

    return departing.sprite;
  }

  /**
   * Advances every fade by one frame.
   * @param {function(number, number): number} alphaAt How opaque a fade is at a given point.
   * @returns {Array<{key: string, sprite: object}>} Everything that finished leaving this frame.
   */
  update(alphaAt)
  {
    const finished = [];

    this.#departing.forEach((departing, key) =>
    {
      departing.elapsed += 1;
      departing.sprite.alpha = departing.from * alphaAt(departing.elapsed, departing.frames);

      if (departing.elapsed < departing.frames) return;

      finished.push({
        key,
        sprite: departing.sprite,
      });
    });

    // deleted after the walk rather than during it, because removing from a map while iterating it
    // is the kind of thing that works until the day two of them finish on the same frame.
    finished.forEach(({ key }) => this.#departing.delete(key));

    return finished;
  }

  /**
   * Everything currently on its way out.
   * @returns {object[]}
   */
  sprites()
  {
    const all = [];

    this.#departing.forEach(departing => all.push(departing.sprite));

    return all;
  }
}

export default FadingSprites;
//endregion FadingSprites