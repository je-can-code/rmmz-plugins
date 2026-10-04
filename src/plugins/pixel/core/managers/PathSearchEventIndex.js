//region PathSearchEventIndex
/**
 * Which events stand on which tile, built once for the length of a single path search.
 *
 * A search asks whether it can step onto thousands of tiles, and every one of those questions ends in
 * {@link Game_Map#eventsXyNt}, which the engine answers by walking every event on the map. On a map
 * of a hundred and fifty events that is most of a search's cost; on a big map it is nearly all of it.
 * Nothing moves while a search runs, though, so the answer for every tile can be worked out once, up
 * front, and each question then becomes a lookup.
 *
 * **It answers exactly what the engine's walk answers.** An event is listed on a tile when it is not
 * passing through things and its area covers that tile, which is the engine's `posNt` with the area
 * read from {@link Game_Event#areaBounds} - the same rule {@link Game_Event#pos} answers from. Events
 * are listed in the map's own order, and a tile nobody stands on answers with an empty list. Tiles are
 * kept by their own coordinates rather than folded into one number, so an area reaching past the edge
 * of the map is listed where it reaches, exactly as the walk would find it there.
 *
 * Coordinates are whole tiles, which is all a search ever asks about and all {@link Game_Event#pos}
 * promises to understand.
 */
class PathSearchEventIndex
{
  /**
   * The events standing on each tile, by row and then by column, or null when no search is running.
   * @type {Map<number, Map<number, Game_Event[]>>|null}
   */
  static #rows = null;

  /**
   * Determines whether a search is running with its lookup built.
   * @returns {boolean} True if the lookup is answering, false if the engine's walk should.
   */
  static isBuilt()
  {
    return PathSearchEventIndex.#rows !== null;
  }

  /**
   * Builds the lookup from the events currently on the map.
   * @param {Game_Event[]} events Every event on the map, in the map's own order.
   */
  static build(events)
  {
    PathSearchEventIndex.#rows = new Map();

    events.forEach(PathSearchEventIndex.#place);
  }

  /**
   * Lists an event on every tile its area covers, unless it passes through things and so blocks nothing.
   * @param {Game_Event} event The event to list.
   */
  static #place(event)
  {
    // an event passing through things is never one the engine's walk would find.
    if (event.isThrough() === true) return;

    const { left, top, width, height } = event.areaBounds();
    for (let y = top; y < top + height; y++)
    {
      for (let x = left; x < left + width; x++)
      {
        PathSearchEventIndex.#tileAt(x, y)
          .push(event);
      }
    }
  }

  /**
   * Gets the list for a tile, starting an empty one the first time an event is placed on it.
   * @param {number} x The tile's x coordinate.
   * @param {number} y The tile's y coordinate.
   * @returns {Game_Event[]} The events listed on that tile so far.
   */
  static #tileAt(x, y)
  {
    const rows = PathSearchEventIndex.#rows;

    // the row, started the first time anything is placed in it.
    let row = rows.get(y);
    if (row === undefined)
    {
      row = new Map();
      rows.set(y, row);
    }

    // and the tile within it, likewise.
    let tile = row.get(x);
    if (tile === undefined)
    {
      tile = [];
      row.set(x, tile);
    }

    return tile;
  }

  /**
   * Gets the events standing on a tile, as {@link Game_Map#eventsXyNt} would.
   * @param {number} x The tile's x coordinate.
   * @param {number} y The tile's y coordinate.
   * @returns {Game_Event[]} A fresh list of the events there, empty when there are none.
   */
  static eventsAt(x, y)
  {
    const row = PathSearchEventIndex.#rows.get(y);
    if (row === undefined) return [];

    const tile = row.get(x);
    if (tile === undefined) return [];

    // a copy, since the engine's walk hands back a new list every time and callers may treat it as theirs.
    return [ ...tile ];
  }

  /**
   * Throws the lookup away once the search is done, since the next thing to move would make it wrong.
   */
  static clear()
  {
    PathSearchEventIndex.#rows = null;
  }
}

export default PathSearchEventIndex;
//endregion PathSearchEventIndex