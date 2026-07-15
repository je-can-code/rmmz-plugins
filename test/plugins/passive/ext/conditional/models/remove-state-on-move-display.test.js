//region plugins/passive/ext/conditional/models/remove-state-on-move-display.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('RemoveStateOnMoveDisplay (direct src import)', () =>
{
  let RemoveStateOnMoveDisplay;

  beforeAll(async () =>
  {
    vi.resetModules();

    ({ default: RemoveStateOnMoveDisplay } = await import('../../../../../../src/plugins/passive/ext/conditional/models/RemoveStateOnMoveDisplay.js'));
  });

  beforeEach(() =>
  {
    globalThis.J = { PASSIVE: { EXT: { CONDITIONAL: { RegExp: { RemoveStateOnMove: /<removeStateOnMove:(\d+)>/gi } } } } };
    globalThis.RPGManager = { getArraysFromNotesByRegex: vi.fn().mockReturnValue([]) };
  });

  function makeWindow()
  {
    return {
      colorizeText: vi.fn((colorIndex, text) => `[color${colorIndex}]${text}`),
      boldenText: vi.fn(text => `[bold]${text}`),
    };
  }

  describe('formatProse', () =>
  {
    it('builds the moving-removes-stacks prose for a state id', () =>
    {
      // Arrange
      const window = makeWindow();

      // Act
      const result = RemoveStateOnMoveDisplay.formatProse(5, window);

      // Assert
      expect(result).toEqual('Moving removes all [color14][bold]\\state[5] stacks.');
    });
  });

  describe('collectProseLines', () =>
  {
    it('returns an empty array when J.PASSIVE is not loaded', () =>
    {
      // Arrange
      globalThis.J = {};
      const window = makeWindow();

      // Act
      const result = RemoveStateOnMoveDisplay.collectProseLines({}, window);

      // Assert
      expect(result).toEqual([]);
    });

    it('returns an empty array when J.PASSIVE.EXT.CONDITIONAL is not loaded', () =>
    {
      // Arrange
      globalThis.J = { PASSIVE: { EXT: {} } };
      const window = makeWindow();

      // Act
      const result = RemoveStateOnMoveDisplay.collectProseLines({}, window);

      // Assert
      expect(result).toEqual([]);
    });

    it('builds one prose line per valid parsed tuple', () =>
    {
      // Arrange
      globalThis.RPGManager.getArraysFromNotesByRegex.mockReturnValue([ [ 5 ], [ 7 ] ]);
      const window = makeWindow();
      const dataRow = {};

      // Act
      const result = RemoveStateOnMoveDisplay.collectProseLines(dataRow, window);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toContain('\\state[5]');
      expect(result[1]).toContain('\\state[7]');
    });

    it('skips a tuple whose state id is invalid or less than 1', () =>
    {
      // Arrange
      globalThis.RPGManager.getArraysFromNotesByRegex.mockReturnValue([ [ 0 ], [ 'not-a-number' ] ]);
      const window = makeWindow();

      // Act
      const result = RemoveStateOnMoveDisplay.collectProseLines({}, window);

      // Assert
      expect(result).toEqual([]);
    });
  });
});
//endregion plugins/passive/ext/conditional/models/remove-state-on-move-display.test.js
