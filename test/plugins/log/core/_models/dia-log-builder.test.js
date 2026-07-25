//region plugins/log/core/_models/dia-log-builder.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('DiaLogBuilder (direct src import)', () =>
{
  let DiaLogBuilder;
  let DiaLog;

  beforeAll(async () =>
  {
    String.empty = '';
    ({ default: DiaLog } = await import('../../../../../src/plugins/log/core/_models/DiaLog.js'));
    ({ default: DiaLogBuilder } = await import('../../../../../src/plugins/log/core/_models/DiaLogBuilder.js'));
  });

  describe('build', () =>
  {
    it('builds a DiaLog with the accumulated lines/face data', () =>
    {
      // Arrange
      const builder = new DiaLogBuilder();
      builder.addLine('hello').addLine('world').setFaceName('Actor1').setFaceIndex(2);

      // Act
      const log = builder.build();

      // Assert
      expect(log).toBeInstanceOf(DiaLog);
      expect(log.lines()).toEqual([ 'hello', 'world' ]);
      expect(log.faceName()).toEqual('Actor1');
      expect(log.faceIndex()).toEqual(2);
    });

    it('clears the builder state after building', () =>
    {
      // Arrange
      const builder = new DiaLogBuilder();
      builder.addLine('hello').setFaceName('Actor1').setFaceIndex(2);
      builder.build();

      // Act
      const secondLog = builder.build();

      // Assert
      expect(secondLog.lines()).toEqual([]);
      expect(secondLog.faceName()).toEqual('');
      expect(secondLog.faceIndex()).toEqual(-1);
    });
  });

  describe('clear', () =>
  {
    it('resets lines/faceName/faceIndex to their defaults', () =>
    {
      // Arrange
      const builder = new DiaLogBuilder();
      builder.addLine('hello').setFaceName('Actor1').setFaceIndex(2);

      // Act
      builder.clear();
      const log = builder.build();

      // Assert
      expect(log.lines()).toEqual([]);
      expect(log.faceName()).toEqual('');
      expect(log.faceIndex()).toEqual(-1);
    });
  });

  describe('addLine', () =>
  {
    it('appends lines in the order added', () =>
    {
      // Arrange
      const builder = new DiaLogBuilder();

      // Act
      builder.addLine('first').addLine('second');
      const log = builder.build();

      // Assert
      expect(log.lines()).toEqual([ 'first', 'second' ]);
    });
  });

  describe('setLines', () =>
  {
    it('replaces the entire lines array', () =>
    {
      // Arrange
      const builder = new DiaLogBuilder();
      builder.addLine('old');

      // Act
      builder.setLines([ 'new-1', 'new-2' ]);
      const log = builder.build();

      // Assert
      expect(log.lines()).toEqual([ 'new-1', 'new-2' ]);
    });
  });
});
//endregion plugins/log/core/_models/dia-log-builder.test.js
