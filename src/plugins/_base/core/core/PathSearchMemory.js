//region PathSearchMemory
/**
 * Remembers, for a moment, the path searches that could not reach their goal.
 *
 * A search toward a goal it cannot reach is the most expensive search there is: with nothing to arrive
 * at, it explores every tile within its limit before settling for the one closest to the goal. And the
 * character that asked is usually stuck, so it asks again the very next frame, from the same tile toward
 * the same goal, and gets the same answer at the same price. Remembering that answer for a few frames
 * turns a run of expensive searches into one.
 *
 * **The trade is a short delay, and only for a character standing still.** A remembered answer is only
 * reused while the character is on the same tile aiming at the same goal tile, so anybody actually
 * moving searches afresh on every new tile exactly as before. What changes is that a stuck character
 * notices a way opening up - another enemy stepping out of a corridor, say - up to
 * {@link PathSearchMemory.holdFrames} frames later than it otherwise would have.
 *
 * Searches that do reach their goal are never remembered. They are cheap, and the route they found can
 * stop being the best one the moment anything on it moves.
 */
class PathSearchMemory
{
  /**
   * How many frames a search that could not reach its goal is remembered for. Half a second, at sixty
   * frames to the second.
   * @type {number}
   */
  static holdFrames = 30;

  /**
   * The failed searches being remembered: for each character, the latest of each kind.<br/>
   * Held weakly, so a character that leaves the map takes its memories with it, and never saved, since
   * a memory measured in frames means nothing after a load.
   * @type {WeakMap<Object, Map<string, Object>>}
   */
  static #memories = new WeakMap();

  /**
   * Finds a character's first step toward a goal, answering from memory when the same search failed a
   * moment ago, and remembering this one if it fails too.
   * @param {Object} character The character searching.
   * @param {string} kind Which search this is, since searches that step differently can answer
   *   differently between the very same tiles.
   * @param {number} frame The current frame count.
   * @param {Object} request The search to run, in the shape {@link TilePathSearch.firstStep} takes.
   * @param {function(Object): {x: number, y: number, reachedGoal: boolean}} search Runs the search when
   *   there is no answer to remember.
   * @returns {{x: number, y: number, reachedGoal: boolean}} The first step, and whether it leads to the goal.
   */
  static firstStep(character, kind, frame, request, search)
  {
    // a search that failed a moment ago from this tile toward this goal would only fail the same way.
    const remembered = PathSearchMemory.#recall(character, kind, request, frame);
    if (remembered !== null) return remembered;

    const result = search(request);

    // only a failure is worth remembering; see the class's own description for why.
    if (result.reachedGoal === false)
    {
      PathSearchMemory.#remember(character, kind, request, result, frame);
    }

    return result;
  }

  /**
   * Finds the remembered answer to this exact search, if there is one still fresh enough to use.
   * @param {Object} character The character searching.
   * @param {string} kind Which search this is.
   * @param {Object} request The search being asked.
   * @param {number} frame The current frame count.
   * @returns {{x: number, y: number, reachedGoal: boolean}|null} The remembered answer, or null when this
   *   character has not failed this exact search within the last {@link PathSearchMemory.holdFrames} frames.
   */
  static #recall(character, kind, request, frame)
  {
    const memories = PathSearchMemory.#memories.get(character);

    // a character that has never failed a search has nothing to recall.
    if (memories === undefined) return null;

    const memory = memories.get(kind);

    // nor has one that has only ever failed a different kind of search.
    if (memory === undefined) return null;

    // a memory past its moment is ignored, and the search asked again.
    if (frame >= memory.until) return null;

    // the answer only holds from the tile it was found from.
    if (memory.startX !== request.startX || memory.startY !== request.startY) return null;

    // and only toward the goal it was found for.
    if (memory.goalX !== request.goalX || memory.goalY !== request.goalY) return null;

    return memory.result;
  }

  /**
   * Remembers a failed search, replacing whatever this character last failed of the same kind.
   * @param {Object} character The character that searched.
   * @param {string} kind Which search this was.
   * @param {Object} request The search that was asked.
   * @param {{x: number, y: number, reachedGoal: boolean}} result What it answered.
   * @param {number} frame The current frame count.
   */
  static #remember(character, kind, request, result, frame)
  {
    const { startX, startY, goalX, goalY } = request;
    const memories = PathSearchMemory.#memoriesOf(character);

    memories.set(kind, {
      startX,
      startY,
      goalX,
      goalY,
      result,
      until: frame + PathSearchMemory.holdFrames,
    });
  }

  /**
   * Gets the memories held for a character, starting an empty set the first time it fails a search.
   * @param {Object} character The character.
   * @returns {Map<string, Object>} The character's memories, by kind of search.
   */
  static #memoriesOf(character)
  {
    const existing = PathSearchMemory.#memories.get(character);
    if (existing !== undefined) return existing;

    const memories = new Map();
    PathSearchMemory.#memories.set(character, memories);

    return memories;
  }
}

export default PathSearchMemory;
//endregion PathSearchMemory