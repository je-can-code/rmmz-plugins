//region ForecastPlaces
/**
 * What the forecast knows about the places it reports on.
 *
 * **A place is a map id and nothing else.** The alternative - restating each destination's weather
 * in the config - would mean every place authored twice, and the two copies drifting the first
 * time somebody retags a map and forgets this list exists. So the forecast reads the same note the
 * map itself reads, through the same resolver, and cannot disagree with what the player will
 * actually walk into.
 *
 * That is possible because `StorageManager.fsReadFile` is synchronous and a map's note lives in a
 * file sitting right there. Reading the five largest maps in Chef Adventure costs about four
 * milliseconds all told, and the results are held for the session, so the whole exercise happens
 * once.
 *
 * **It does mean the forecast cannot work without a filesystem**, which is a constraint this whole
 * ecosystem already lives under: every external config is loaded the same way.
 */
class ForecastPlaces
{
  /**
   * How many digits a map file's number is padded to, matching how RPG Maker names them.
   * @type {number}
   */
  static IdDigits = 3;

  /**
   * Declarations already read this session, keyed by map id.
   *
   * Held because a map's note cannot change while the game is running, and because the forecast
   * scene is something a player may open repeatedly.
   * @type {Map<number, ?object>}
   */
  static #known = new Map();

  /**
   * Where a given map's data file lives, relative to the project.
   * @param {number} mapId The map being read.
   * @returns {string}
   */
  static pathFor(mapId)
  {
    const padded = String(mapId)
      .padStart(ForecastPlaces.IdDigits, '0');

    return `data/Map${padded}.json`;
  }

  /**
   * Reads one map's own weather declaration off disk.
   *
   * `extractMetadata` is the engine's own, and running it here is what makes the loaded object
   * indistinguishable from the `$dataMap` the resolver normally sees - notes parsed into `meta`,
   * exactly as a real map load would leave it.
   * @param {number} mapId The map being read.
   * @returns {?object} What that map declared, or null when there is no such map file.
   */
  static declarationOf(mapId)
  {
    if (ForecastPlaces.#known.has(mapId) === true) return ForecastPlaces.#known.get(mapId);

    const declaration = ForecastPlaces.readDeclaration(mapId);

    ForecastPlaces.#known.set(mapId, declaration);

    return declaration;
  }

  /**
   * Reads and parses one map, without consulting or updating what is already known.
   * @param {number} mapId The map being read.
   * @returns {?object} What that map declared, or null when there is no such map file.
   */
  static readDeclaration(mapId)
  {
    const path = ForecastPlaces.pathFor(mapId);
    const raw = StorageManager.fsReadFile(path);

    // a place pointed at a map that does not exist is a content error rather than a crash: the
    // forecast simply has nothing to say about it, and says which one out loud.
    if (raw === null)
    {
      Diagnostics.warn(__PLUGIN_NAME__, `forecast names a map that does not exist: [ ${path} ]!`);

      return null;
    }

    const dataMap = JSON.parse(raw);

    DataManager.extractMetadata(dataMap);

    return MapWeatherResolver.declarationFor(dataMap);
  }

  /**
   * Every configured place, paired with what its map declared.
   *
   * A place whose map could not be read is dropped rather than shown blank, because a row that
   * says nothing is worse than a row that is not there - it reads as "clear" to anybody scanning.
   * @param {object[]} places The `places` block of the sky configuration.
   * @returns {{name: string, declaration: object}[]}
   */
  static resolveAll(places)
  {
    if (places === undefined) return [];

    return places
      .map(place => ({
        name: place.name,
        declaration: ForecastPlaces.declarationOf(place.mapId),
      }))
      .filter(place => place.declaration !== null);
  }

  /**
   * Forgets every map read so far.
   *
   * For tests, and for the plugin command that exists so somebody retagging a map can see the
   * change without restarting the game.
   */
  static forget()
  {
    ForecastPlaces.#known.clear();
  }
}

export default ForecastPlaces;
//endregion ForecastPlaces