//region WeatherDirector
import MapWeatherResolver from './../core/MapWeatherResolver.js';
import PlayerTravel from './../core/PlayerTravel.js';
import WeatherAudioChannel from './WeatherAudioChannel.js';
import WeatherPresets from './../core/WeatherPresets.js';
import WeatherVariables from './../core/WeatherVariables.js';

/**
 * Decides what the weather is, and tells anybody who asks.
 *
 * One director rather than state scattered across the map and the spriteset, because the answer has
 * exactly two consumers with very different lifetimes: the sprites that draw it, which are thrown
 * away and rebuilt every time the player opens the menu, and the game variables events branch on,
 * which must outlive all of that. Resolving once and letting both read from here is what keeps them
 * from ever disagreeing.
 *
 * **Nothing is remembered between maps.** The weather is re-resolved on arrival from the map's own
 * note, so it can never depend on where the player came from. That also means a save load needs no
 * special handling at all: loading a game arrives at a map, arriving at a map resolves its weather,
 * and the answer is the same one it would be after walking in.
 */
class WeatherDirector
{
  /**
   * What the weather currently is, or null when there is none.
   * @type {?{preset: string, intensity: string}}
   */
  static #current = null;

  /**
   * What the sky is currently doing, or null when nothing is driving one.
   *
   * Null is the ordinary state of this plugin running by itself: a sky that changes over the course
   * of a day is J-Weather-Time's business, and without it installed a map has whatever its note says
   * and nothing else.
   * @type {?{preset: string, intensity: string}}
   */
  static #sky = null;

  /**
   * How far the player is moving, for the motions that spawn relative to it.
   *
   * Held here rather than on the emitter because the emitter is rebuilt on every menu close while
   * the player keeps walking through all of it, and because a per-layer copy would have each layer
   * sampling the same frame and all but the first seeing no movement at all.
   * @type {PlayerTravel}
   */
  static #travel = new PlayerTravel();

  /**
   * How many times the weather has actually become something else.
   *
   * **A counter rather than a flag, and the difference is a visible bug.** Something has to clear a
   * flag, and the only thing positioned to is the emitter's own update - which runs *after* the
   * spriteset is built. So on every ordinary arrival the sky is declared, the flag goes up, the
   * plane is built correctly from the new weather, and then the first frame tears it down and
   * rebuilds it again. A generation recorded at build time and compared afterwards has no such
   * window: the number the plane was built against is the number it compares to.
   * @type {number}
   */
  static #generation = 0;

  /**
   * Re-reads the weather for the map the player has just arrived on.
   *
   * Called on arrival rather than on a timer, because everything it reads - the map's note, the sky -
   * only changes when the player goes somewhere or when the hour turns over, and the hour turning
   * over announces itself.
   */
  static refresh()
  {
    // arriving somewhere is not walking there, so the distance covered getting here is not a speed.
    WeatherDirector.#travel.forget();

    const declaration = MapWeatherResolver.declarationFor($dataMap);
    const resolved = MapWeatherResolver.resolve(declaration, WeatherDirector.#sky);

    // the emitter watches this number to know when it has the wrong thing on screen, so it moves
    // only when the answer genuinely differs - never merely because it was asked again.
    if (WeatherDirector.isSameWeather(WeatherDirector.#current, resolved) === false)
    {
      WeatherDirector.#generation++;
    }

    WeatherDirector.#current = resolved;

    const { weatherConfig } = J.WEATHER.Metadata;

    // events branch on this, so it is written whether the weather changed or not - a map that turns
    // out to have none still has to say so, or the last map's answer stands.
    WeatherVariables.sync(weatherConfig, WeatherDirector.#current);

    // the channel decides for itself whether this is actually a change of sound, so walking between
    // two lightly-raining maps does not restart the rain at every boundary.
    //
    // nothing about the player's volume needs saying here: a sound starting reads the slider as it
    // starts, and a slider moving is caught at the property itself.
    WeatherAudioChannel.play(weatherConfig, WeatherDirector.#current);
  }

  /**
   * What the weather currently is.
   * @returns {?{preset: string, intensity: string}} The current weather, or null for none.
   */
  static current()
  {
    // hand back what the weather is doing.
    return WeatherDirector.#current;
  }

  /**
   * Whether two resolutions describe the same weather.
   *
   * **Compared by value, and that is load-bearing.** `MapWeatherResolver.resolve` builds a fresh
   * object every call, so an identity check is always false and the emitter would tear itself down
   * and rebuild sixty times a second.
   * @param {?{preset: string, intensity: string}} left One resolution, or null for none.
   * @param {?{preset: string, intensity: string}} right The other, or null for none.
   * @returns {boolean}
   */
  static isSameWeather(left, right)
  {
    // nothing and nothing are the same nothing - walking between two bare interiors is not a change.
    if (left === null) return right === null;

    if (right === null) return false;

    if (left.preset !== right.preset) return false;

    return left.intensity === right.intensity;
  }

  /**
   * How many times the weather has become something else.
   *
   * Recorded by the emitter when it builds, and compared afterwards. See the field's own note for
   * why this is a number rather than a flag.
   * @returns {number}
   */
  static generation()
  {
    // hand back how many changes have happened.
    return WeatherDirector.#generation;
  }

  /**
   * Whether the weather has become something else since a given generation was recorded.
   * @param {number} generation The generation the asker last built against.
   * @returns {boolean}
   */
  static hasChangedSince(generation)
  {
    return generation !== WeatherDirector.#generation;
  }

  /**
   * Tells the director what the sky is doing.
   *
   * The seam J-Weather-Time reaches through. Handing the sky in rather than reaching for it is what
   * lets this plugin work perfectly well with nothing driving one.
   * @param {?{preset: string, intensity: string}} sky What the sky is doing, or null.
   */
  static setSky(sky)
  {
    WeatherDirector.#sky = sky;

    // the sky moving is a reason to re-read, since a map with no note of its own follows it.
    WeatherDirector.refresh();
  }

  /**
   * Takes this frame's reading of where the player is.
   *
   * Driven from the map scene's own update rather than from the emitter, so that exactly one
   * reading is taken per frame no matter how many layers are drawing.
   */
  static trackPlayer()
  {
    WeatherDirector.#travel.sample($gamePlayer.x, $gamePlayer.y);
  }

  /**
   * How far the player moved across the last frame, per axis.
   * @returns {{x: number, y: number}}
   */
  static travel()
  {
    // hand back the most recent reading.
    return WeatherDirector.#travel.perFrame();
  }

  /**
   * The layers that draw the current weather.
   * @returns {object[]} Emitter-ready layers, empty when there is no weather.
   */
  static layers()
  {
    const current = WeatherDirector.current();

    if (current === null) return [];

    return WeatherPresets.layersFor(J.WEATHER.Metadata.weatherConfig, current.preset, current.intensity);
  }
}

export default WeatherDirector;
//endregion WeatherDirector