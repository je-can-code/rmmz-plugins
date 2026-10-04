//region TilePathSearch
/**
 * Finds the first step of a shortest walk across the tile grid, by A*.
 *
 * Every path search in the game is this one search with a different idea of which ways a character
 * may step: the engine's four-way {@link Game_Character#findDirectionTo}, which J-Pixelistics routes
 * through here, and J-ABS's eight-way {@link Game_Character#findDiagonalDirectionTo}. Each caller
 * says how a step is taken and whether it is allowed, and this decides which step comes first.
 *
 * **It answers exactly what the engine's own search answers, ties included.** The engine expands the
 * open node with the lowest estimated cost, and between equals it expands whichever was opened first.
 * That second rule is what decides the path whenever two routes cost the same - which on an open
 * field is nearly always - so it is reproduced deliberately: every node remembers the order it was
 * opened in, and the heap breaks ties on that order rather than on wherever the heap happens to keep
 * it. A node reached again by a cheaper route keeps its original place in that order, just as it
 * keeps its place in the engine's list.
 *
 * **What differs is the cost.** The engine keeps its frontier in a plain array, so finding the cheapest
 * node means reading every open node, and every neighbor it looks at is searched for in two more
 * lists. The work grows with the square of the area explored, which is harmless at the engine's
 * default reach of twelve steps and ruinous at J-Pixelistics' forty, where one search toward a goal
 * it cannot reach explores the whole neighborhood. Here the frontier is a binary heap and both
 * lookups are hashed, so the same search costs only a little more than the area it explores.
 */
class TilePathSearch
{
  /**
   * Finds the tile a character should step onto first on the way toward a goal tile.<br/>
   * When the goal is reachable within the search limit, that is the first tile of a shortest path.
   * When it is not, it is the first tile toward the explored node the distance estimate rates
   * closest to the goal, which is the engine's own answer for a goal that is walled off or too far.
   * Keys are formed as `y * mapWidth + x`, held in a map and a set rather than an array sized to the
   * map, so a step that lands off the map is keyed safely; the caller's `canStep` is what refuses it.
   * @param {Object} request What to search for, and how a character may step.
   * @param {number} request.startX The x tile the search starts from.
   * @param {number} request.startY The y tile the search starts from.
   * @param {number} request.goalX The x tile the search is trying to reach.
   * @param {number} request.goalY The y tile the search is trying to reach.
   * @param {number} request.searchLimit How many steps from the start a node may be and still be expanded.
   * @param {number} request.mapWidth The map's width in tiles, which turns a tile into one key.
   * @param {number[]} request.directions Every direction a step may take, in the order they are tried.
   * @param {function(number, number, number): {x: number, y: number}} request.stepFrom The tile a step lands on.
   * @param {function(number, number, number): boolean} request.canStep Whether a step may be taken from a tile.
   * @param {function(number, number, number, number): number} request.distance The estimated steps between tiles.
   * @returns {{x: number, y: number}} The tile to step onto first, or the start's own tile when none gets closer.
   */
  static firstStep(request)
  {
    const { startX, startY, goalX, goalY, mapWidth, distance } = request;

    // the start is open first, so it is the one node every other node is opened after.
    const start = {
      parent: null,
      x: startX,
      y: startY,
      g: 0,
      f: distance(startX, startY, goalX, goalY),
      order: 0,
    };

    const search = {
      request,
      start,
      best: start,
      heap: [],
      open: new Map(),
      closed: new Set(),
      opened: 0,
    };

    TilePathSearch.#push(search.heap, start);
    search.open.set(startY * mapWidth + startX, start);

    // expand the cheapest open node until the goal is expanded or nothing is left to try.
    while (search.heap.length > 0)
    {
      const reachedGoal = TilePathSearch.#expandNext(search);
      if (reachedGoal === true) break;
    }

    return TilePathSearch.#firstStepToward(search.best, start);
  }

  /**
   * Expands the cheapest open node, opening or improving each neighbor it can step to.
   * @param {Object} search The search in progress.
   * @returns {boolean} True if the node expanded was the goal, which ends the search.
   */
  static #expandNext(search)
  {
    const { request, heap, open, closed } = search;
    const { goalX, goalY, searchLimit, mapWidth } = request;
    const { node: current, f } = TilePathSearch.#pop(heap);
    const position = current.y * mapWidth + current.x;

    // an entry left behind when a cheaper route reached the same node carries the old cost. That one
    // test also covers an expanded node, since the entry that expanded it is always its cheapest.
    if (f !== current.f) return false;

    open.delete(position);
    closed.add(position);

    // the goal is the best answer there is, and nothing past it matters.
    if (current.x === goalX && current.y === goalY)
    {
      search.best = current;
      return true;
    }

    // a node at the search limit is settled, but nothing beyond it is explored.
    if (current.g >= searchLimit) return false;

    request.directions.forEach(direction => TilePathSearch.#tryStep(search, current, direction));
    return false;
  }

  /**
   * Considers one step out of the node being expanded, opening the tile it lands on or improving the
   * route to it.<br/>
   * The checks run in the engine's order: a tile already expanded is skipped before anybody is asked
   * whether it can be entered, which is also the cheaper way round.
   * @param {Object} search The search in progress.
   * @param {Object} current The node being expanded.
   * @param {number} direction The direction of the step.
   */
  static #tryStep(search, current, direction)
  {
    const { request, heap, open, closed } = search;
    const { goalX, goalY, mapWidth, stepFrom, canStep, distance } = request;
    const { x, y } = stepFrom(current.x, current.y, direction);
    const position = y * mapWidth + x;

    // an expanded tile already has its shortest route.
    if (closed.has(position) === true) return;

    // a step that cannot be taken opens nothing.
    if (canStep(current.x, current.y, direction) === false) return;

    // a tile already open is only worth touching when this route reaches it more cheaply.
    const g = current.g + 1;
    const known = open.get(position);
    if (known !== undefined && g >= known.g) return;

    // a tile seen for the first time takes the next place in line; a known one keeps its place.
    const node = known ?? TilePathSearch.#openNode(search, position);
    node.parent = current;
    node.x = x;
    node.y = y;
    node.g = g;
    node.f = g + distance(x, y, goalX, goalY);
    TilePathSearch.#push(heap, node);

    // the node the estimate rates closest to the goal is the fallback answer when the goal is never reached.
    if (node.f - node.g < search.best.f - search.best.g)
    {
      search.best = node;
    }
  }

  /**
   * Opens a node for a tile seen for the first time, giving it the next place in the opening order.
   * @param {Object} search The search in progress.
   * @param {number} position The tile's key.
   * @returns {Object} The new, still-empty node.
   */
  static #openNode(search, position)
  {
    search.opened += 1;

    const node = { order: search.opened };
    search.open.set(position, node);

    return node;
  }

  /**
   * Walks back from a node to the tile stepped onto first on the way to it.
   * @param {Object} node The node the search settled on.
   * @param {Object} start The node the search began from.
   * @returns {{x: number, y: number}} The first tile on the route, or the start's own tile.
   */
  static #firstStepToward(node, start)
  {
    let step = node;

    // climb until the next node up is the start itself.
    while (step.parent !== null && step.parent !== start)
    {
      step = step.parent;
    }

    return {
      x: step.x,
      y: step.y,
    };
  }

  /**
   * Determines whether one heap entry belongs ahead of another: lower estimated cost first, and the
   * node opened earlier first between equals, which is the engine's own order.
   * @param {{node: Object, f: number}} left The first entry.
   * @param {{node: Object, f: number}} right The second entry.
   * @returns {boolean} True if the first entry should be expanded before the second.
   */
  static #isAhead(left, right)
  {
    if (left.f !== right.f) return left.f < right.f;

    return left.node.order < right.node.order;
  }

  /**
   * Adds a node to the heap at its current estimated cost.<br/>
   * The cost is copied into the entry rather than read off the node later, because a cheaper route
   * found afterwards lowers the node's cost and leaves this entry behind as stale.
   * @param {{node: Object, f: number}[]} heap The heap.
   * @param {Object} node The node to add.
   */
  static #push(heap, node)
  {
    heap.push({
      node,
      f: node.f,
    });

    // sift the new entry up past every parent it belongs ahead of.
    let index = heap.length - 1;
    while (index > 0)
    {
      const parentIndex = Math.floor((index - 1) / 2);
      if (TilePathSearch.#isAhead(heap[index], heap[parentIndex]) === false) break;

      TilePathSearch.#swap(heap, index, parentIndex);
      index = parentIndex;
    }
  }

  /**
   * Removes and returns the entry that belongs first.
   * @param {{node: Object, f: number}[]} heap The heap, which is never empty when this is asked.
   * @returns {{node: Object, f: number}} The first entry.
   */
  static #pop(heap)
  {
    const [ first ] = heap;
    const last = heap.pop();

    // the last entry fills the hole at the top, then sinks to where it belongs.
    if (heap.length > 0)
    {
      heap[0] = last;
      TilePathSearch.#siftDown(heap);
    }

    return first;
  }

  /**
   * Sinks the entry at the top of the heap below every child that belongs ahead of it.
   * @param {{node: Object, f: number}[]} heap The heap.
   */
  static #siftDown(heap)
  {
    let index = 0;
    let firstIndex = TilePathSearch.#firstOfFamily(heap, index);

    // keep sinking while a child belongs ahead of it.
    while (firstIndex !== index)
    {
      TilePathSearch.#swap(heap, index, firstIndex);
      index = firstIndex;
      firstIndex = TilePathSearch.#firstOfFamily(heap, index);
    }
  }

  /**
   * Finds which of an entry and its two children belongs first.
   * @param {{node: Object, f: number}[]} heap The heap.
   * @param {number} index The index of the parent entry.
   * @returns {number} The index of whichever of the three belongs first.
   */
  static #firstOfFamily(heap, index)
  {
    const leftIndex = (index * 2) + 1;
    const rightIndex = leftIndex + 1;
    let firstIndex = index;

    // the left child, if there is one and it belongs ahead of the parent.
    if (leftIndex < heap.length && TilePathSearch.#isAhead(heap[leftIndex], heap[firstIndex]) === true)
    {
      firstIndex = leftIndex;
    }

    // the right child, if there is one and it belongs ahead of both.
    if (rightIndex < heap.length && TilePathSearch.#isAhead(heap[rightIndex], heap[firstIndex]) === true)
    {
      firstIndex = rightIndex;
    }

    return firstIndex;
  }

  /**
   * Exchanges two entries in the heap.
   * @param {{node: Object, f: number}[]} heap The heap.
   * @param {number} first The index of one entry.
   * @param {number} second The index of the other.
   */
  static #swap(heap, first, second)
  {
    const held = heap[first];
    heap[first] = heap[second];
    heap[second] = held;
  }
}

export default TilePathSearch;
//endregion TilePathSearch