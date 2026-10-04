//region plugins/_base/core/core/tile-path-search.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

/**
 * J-Base's tile path search, driven over small grids drawn as pictures.
 *
 * Every grid below is a list of rows where `#` is a wall and anything else is open floor, with x
 * running along a row and y down the list. The search is handed the same three questions a character
 * asks it in the game - where a step lands, whether it may be taken, how far apart two tiles are - so
 * these tests exercise exactly the surface the engine's searches use.
 *
 * The last block is a parity check against the engine's own search, the one this replaces. That is
 * not the implementation checked against itself: it is the old algorithm, transcribed from
 * `rmmz_objects.js`, run beside the new one over a few hundred seeded grids. The promise this class
 * makes is that it answers exactly what the engine answers, ties included, and that is the only way
 * to hold it to that across more cases than anybody would draw by hand.
 */
describe('TilePathSearch', () =>
{
  /** @type {typeof import('../../../../../src/plugins/_base/core/core/TilePathSearch.js').default} */
  let TilePathSearch;

  beforeAll(async () =>
  {
    ({ default: TilePathSearch } = await import('../../../../../src/plugins/_base/core/core/TilePathSearch.js'));
  });

  const FOUR_WAY = [ 2, 4, 6, 8 ];
  const EIGHT_WAY = [ 1, 2, 3, 4, 6, 7, 8, 9 ];

  /**
   * Moves a tile one step in a numpad direction.
   * @param {number} x The x tile.
   * @param {number} y The y tile.
   * @param {number} direction The numpad direction.
   * @returns {{x: number, y: number}} The tile one step away.
   */
  const stepFrom = (x, y, direction) =>
  {
    const dx = [ 3, 6, 9 ].includes(direction) ? 1 : 0;
    const dxLeft = [ 1, 4, 7 ].includes(direction) ? -1 : 0;
    const dy = [ 1, 2, 3 ].includes(direction) ? 1 : 0;
    const dyUp = [ 7, 8, 9 ].includes(direction) ? -1 : 0;

    return {
      x: x + dx + dxLeft,
      y: y + dy + dyUp,
    };
  };

  /**
   * Builds a search request over a grid drawn as rows of text.
   * @param {Object} options The search to build.
   * @param {string[]} options.rows The grid, where `#` is a wall.
   * @param {number[]} options.start The start tile as `[x, y]`.
   * @param {number[]} options.goal The goal tile as `[x, y]`.
   * @param {number[]} options.directions The directions a step may take.
   * @param {number} options.searchLimit How far from the start a node may be and still be expanded.
   * @param {function(number, number, number): boolean} options.canStep Overrides the wall check, if given.
   * @returns {Object} The request.
   */
  const aRequest = ({ rows, start, goal, directions = FOUR_WAY, searchLimit = 12, canStep }) =>
  {
    const isOpen = (x, y) => y >= 0 && y < rows.length && x >= 0 && x < rows[y].length && rows[y][x] !== '#';

    return {
      startX: start[0],
      startY: start[1],
      goalX: goal[0],
      goalY: goal[1],
      searchLimit,
      mapWidth: rows[0].length,
      directions,
      stepFrom,
      canStep: canStep ?? ((x, y, direction) =>
      {
        const { x: x2, y: y2 } = stepFrom(x, y, direction);
        return isOpen(x2, y2);
      }),
      distance: (x1, y1, x2, y2) => Math.abs(x2 - x1) + Math.abs(y2 - y1),
    };
  };

  describe('firstStep', () =>
  {
    it('steps straight toward a goal with nothing in the way', () =>
    {
      // Arrange
      const request = aRequest({
        rows: [
          '.....',
        ],
        start: [ 0, 0 ],
        goal: [ 4, 0 ],
      });

      // Act
      const step = TilePathSearch.firstStep(request);

      // Assert
      expect(step).toEqual({ x: 1, y: 0, reachedGoal: true });
    });

    it('detours around a wall standing between the start and the goal', () =>
    {
      // Arrange - the wall runs two rows deep, so the only way through is along the bottom row. Left
      // looks just as promising to the estimate, and is a dead end.
      const request = aRequest({
        rows: [
          '..#..',
          '..#..',
          '.....',
        ],
        start: [ 1, 0 ],
        goal: [ 3, 0 ],
      });

      // Act
      const step = TilePathSearch.firstStep(request);

      // Assert - down toward the gap, not left.
      expect(step).toEqual({ x: 1, y: 1, reachedGoal: true });
    });

    it('breaks a tie between equally short routes in favor of the tile opened first', () =>
    {
      // Arrange - down-then-right and right-then-down cost the same. Down is opened first, since it
      // is first among the directions, and the engine expands the earlier of two equals.
      const request = aRequest({
        rows: [
          '..',
          '..',
        ],
        start: [ 0, 0 ],
        goal: [ 1, 1 ],
      });

      // Act
      const step = TilePathSearch.firstStep(request);

      // Assert
      expect(step).toEqual({ x: 0, y: 1, reachedGoal: true });
    });

    it('answers with the start itself when no step can be taken at all', () =>
    {
      // Arrange - boxed in on every side.
      const request = aRequest({
        rows: [
          '###',
          '#.#',
          '###',
        ],
        start: [ 1, 1 ],
        goal: [ 0, 0 ],
      });

      // Act
      const step = TilePathSearch.firstStep(request);

      // Assert - and it says it never got there.
      expect(step).toEqual({ x: 1, y: 1, reachedGoal: false });
    });

    it('heads for the explored tile closest to a goal it cannot reach', () =>
    {
      // Arrange - standing mid-corridor with the goal sealed off past the wall. The whole corridor is
      // explored, the left end last of all, so only the closest-tile rule points right.
      const request = aRequest({
        rows: [
          '.......#.',
        ],
        start: [ 3, 0 ],
        goal: [ 8, 0 ],
      });

      // Act
      const step = TilePathSearch.firstStep(request);

      // Assert - toward x 6, the nearest anybody can get, without having arrived.
      expect(step).toEqual({ x: 4, y: 0, reachedGoal: false });
    });

    it('expands nothing past the search limit', () =>
    {
      // Arrange - a limit of zero settles the start and stops there.
      const canStep = vi.fn(() => true);
      const request = aRequest({
        rows: [
          '.....',
        ],
        start: [ 0, 0 ],
        goal: [ 4, 0 ],
        searchLimit: 0,
        canStep,
      });

      // Act
      const step = TilePathSearch.firstStep(request);

      // Assert - nobody was asked about a step, so the answer is the start.
      expect(canStep).not.toHaveBeenCalled();
      expect(step).toEqual({ x: 0, y: 0, reachedGoal: false });
    });

    it('never asks again about a step into a tile it has already expanded', () =>
    {
      // Arrange - a corridor two tiles long, walked to the goal at its end.
      const canStep = vi.fn(() => true);
      const request = aRequest({
        rows: [
          '...',
        ],
        start: [ 0, 0 ],
        goal: [ 2, 0 ],
        directions: [ 4, 6 ],
        canStep,
      });

      // Act
      TilePathSearch.firstStep(request);

      // Assert - out of the start both ways, then only rightward out of x 1: the step back to the
      // start is skipped before anybody is asked, since the start is already expanded.
      expect(canStep.mock.calls).toEqual([ [ 0, 0, 4 ], [ 0, 0, 6 ], [ 1, 0, 6 ] ]);
    });

    it('takes a cheaper route to a tile that is already open', () =>
    {
      // Arrange - with diagonals, the distance estimate overrates diagonal steps, so the straight
      // detour round the walls opens (2, -1) first and the diagonal route reaches it more cheaply
      // afterward. That cheaper route is what makes the first step the diagonal one.
      const request = aRequest({
        rows: [
          '.....',
          '.#.#.',
        ],
        start: [ 0, 1 ],
        goal: [ 4, 1 ],
        directions: EIGHT_WAY,
        searchLimit: 20,
      });

      // Act
      const step = TilePathSearch.firstStep(request);

      // Assert
      expect(step).toEqual({ x: 1, y: 0, reachedGoal: true });
    });

    it('works its way down a long open search without losing the cheapest tile', () =>
    {
      // Arrange - a wide open field and a far goal, so the frontier grows large enough to exercise
      // every way an entry can sink through the heap.
      const request = aRequest({
        rows: Array.from({ length: 12 }, () => '............'),
        start: [ 0, 0 ],
        goal: [ 11, 11 ],
        directions: EIGHT_WAY,
        searchLimit: 30,
      });

      // Act
      const step = TilePathSearch.firstStep(request);

      // Assert - straight down the diagonal.
      expect(step).toEqual({ x: 1, y: 1, reachedGoal: true });
    });
  });

  describe('parity with the engine search it replaces', () =>
  {
    /**
     * The engine's own search, transcribed from `Game_Character.findDirectionTo` in `rmmz_objects.js`
     * and generalized only in taking the same callbacks as the search under test. It keeps its frontier
     * in arrays exactly as the engine does, linear scans and all.
     * @param {Object} request The same request the search under test receives.
     * @returns {{x: number, y: number}} The engine's first step.
     */
    const engineFirstStep = request =>
    {
      const { startX, startY, goalX, goalY, searchLimit, mapWidth, directions, canStep, distance } = request;
      const nodeList = [];
      const openList = [];
      const closedList = [];
      const start = { parent: null, x: startX, y: startY, g: 0, f: distance(startX, startY, goalX, goalY) };
      let best = start;
      nodeList.push(start);
      openList.push(start.y * mapWidth + start.x);

      while (nodeList.length > 0)
      {
        let bestIndex = 0;
        for (let i = 0; i < nodeList.length; i++)
        {
          if (nodeList[i].f < nodeList[bestIndex].f) bestIndex = i;
        }

        const current = nodeList[bestIndex];
        const pos1 = current.y * mapWidth + current.x;
        nodeList.splice(bestIndex, 1);
        openList.splice(openList.indexOf(pos1), 1);
        closedList.push(pos1);

        if (current.x === goalX && current.y === goalY)
        {
          best = current;
          break;
        }

        if (current.g >= searchLimit) continue;

        directions.forEach(direction =>
        {
          const { x: x2, y: y2 } = stepFrom(current.x, current.y, direction);
          const pos2 = y2 * mapWidth + x2;
          if (closedList.includes(pos2)) return;
          if (!canStep(current.x, current.y, direction)) return;

          const g2 = current.g + 1;
          const index2 = openList.indexOf(pos2);
          if (index2 < 0 || g2 < nodeList[index2].g)
          {
            let neighbor;
            if (index2 >= 0)
            {
              neighbor = nodeList[index2];
            }
            else
            {
              neighbor = {};
              nodeList.push(neighbor);
              openList.push(pos2);
            }
            neighbor.parent = current;
            neighbor.x = x2;
            neighbor.y = y2;
            neighbor.g = g2;
            neighbor.f = g2 + distance(x2, y2, goalX, goalY);
            if (neighbor.f - neighbor.g < best.f - best.g) best = neighbor;
          }
        });
      }

      let node = best;
      while (node.parent && node.parent !== start) node = node.parent;

      return { x: node.x, y: node.y };
    };

    /**
     * A small seeded generator, so a failure names a grid that can be rebuilt exactly.
     * @param {number} seed The seed.
     * @returns {function(): number} The next number in [0, 1) on every call.
     */
    const seeded = seed =>
    {
      let state = seed;
      return () =>
      {
        state = (state * 1103515245 + 12345) % 2147483648;
        return state / 2147483648;
      };
    };

    /**
     * Builds a random grid, about a quarter wall, with an open start and goal.
     * @param {number} seed The seed.
     * @returns {{rows: string[], start: number[], goal: number[]}} The grid.
     */
    const aRandomGrid = seed =>
    {
      const next = seeded(seed);
      const width = 6 + Math.floor(next() * 10);
      const height = 6 + Math.floor(next() * 10);
      const start = [ Math.floor(next() * width), Math.floor(next() * height) ];
      const goal = [ Math.floor(next() * width), Math.floor(next() * height) ];
      const rows = Array.from({ length: height }, (_, y) => Array.from({ length: width }, (__, x) =>
      {
        const isEnd = (x === start[0] && y === start[1]) || (x === goal[0] && y === goal[1]);
        return isEnd || next() > 0.27 ? '.' : '#';
      }).join(''));

      return { rows, start, goal };
    };

    it.each([
      [ 'four ways', FOUR_WAY ],
      [ 'eight ways', EIGHT_WAY ],
    ])('answers exactly as the engine does, stepping %s, across 300 grids', (_, directions) =>
    {
      // Arrange - the same requests for both, including limits short enough to strand the goal.
      const requests = Array.from({ length: 300 }, (__, seed) =>
      {
        const grid = aRandomGrid(seed + 1);
        return aRequest({ ...grid, directions, searchLimit: 4 + (seed % 12) });
      });

      // Act
      const mismatches = requests.filter(request =>
      {
        const ours = TilePathSearch.firstStep(request);
        const engines = engineFirstStep(request);
        return ours.x !== engines.x || ours.y !== engines.y;
      });

      // Assert
      expect(mismatches).toHaveLength(0);
    });

    it('expands every tile once, even one a cheaper route reached a second time, across 300 grids', () =>
    {
      // Arrange - stepping eight ways, where the estimate's overrating of diagonals keeps finding
      // cheaper routes to tiles already open, and leaves an entry behind every time it does.
      const requests = Array.from({ length: 300 }, (__, seed) =>
      {
        const request = aRequest({ ...aRandomGrid(seed + 1), directions: EIGHT_WAY, searchLimit: 4 + (seed % 12) });
        request.canStep = vi.fn(request.canStep);
        return request;
      });

      // Act
      requests.forEach(request => TilePathSearch.firstStep(request));

      // Assert - no search asked about the same step twice, which expanding a tile again would do.
      const askedTwice = requests.filter(request =>
      {
        const asked = request.canStep.mock.calls.map(([ x, y, direction ]) => `${x},${y},${direction}`);
        return new Set(asked).size !== asked.length;
      });
      const totalAsked = requests.reduce((sum, request) => sum + request.canStep.mock.calls.length, 0);
      expect(totalAsked)
        .toBeGreaterThan(0);
      expect(askedTwice)
        .toHaveLength(0);
    });
  });
});
//endregion plugins/_base/core/core/tile-path-search.test.js
