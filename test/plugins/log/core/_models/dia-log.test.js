//region plugins/log/core/_models/dia-log.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('DiaLog (direct src import)', () =>
{
  let DiaLog;

  beforeAll(async () =>
  {
    String.empty = '';
    ({ default: DiaLog } = await import('../../../../../src/plugins/log/core/_models/DiaLog.js'));
  });

  describe('constructor defaults', () =>
  {
    it('defaults to empty lines, empty face name, and -1 face index', () =>
    {
      // Arrange/Act
      const log = new DiaLog();

      // Assert
      expect(log.lines()).toEqual([]);
      expect(log.faceName()).toEqual('');
      expect(log.faceIndex()).toEqual(-1);
    });
  });

  describe('constructor with explicit values', () =>
  {
    it('stores the provided lines/faceName/faceIndex', () =>
    {
      // Arrange/Act
      const log = new DiaLog([ 'hello', 'world' ], 'Actor1', 3);

      // Assert
      expect(log.lines()).toEqual([ 'hello', 'world' ]);
      expect(log.faceName()).toEqual('Actor1');
      expect(log.faceIndex()).toEqual(3);
    });

    it('warns but still stores a non-array value passed for lines', () =>
    {
      // Arrange
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Act
      const log = new DiaLog('not-an-array', 'Actor1', 0);

      // Assert
      expect(warnSpy).toHaveBeenCalled();
      expect(log.lines()).toEqual('not-an-array');
      warnSpy.mockRestore();
    });
  });
});
//endregion plugins/log/core/_models/dia-log.test.js
