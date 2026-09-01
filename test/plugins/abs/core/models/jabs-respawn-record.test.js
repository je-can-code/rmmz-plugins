//region plugins/abs/core/models/jabs-respawn-record.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

/**
 * JABS_RespawnRecord is a dumb data bag; the only behavior it owns is the permanence check, and
 * the only collaborator it has is the registry it registers its save codec against at import time.
 */
describe('JABS_RespawnRecord (unit, all downstream dependencies mocked)', () =>
{
  /** @type {typeof import('../../../../../src/plugins/abs/core/models/JABS_RespawnRecord.js').default} */
  let JABS_RespawnRecord;

  beforeAll(async () =>
  {
    vi.resetModules();

    // the file registers its save codec at import time, against the registry J-Base hoists as a
    // global. the mock is captured so the declaration itself can be asserted below.
    globalThis.SerializableRegistry = { register: vi.fn() };

    // the seed leans on J-Base's String.empty extension for its cold string values.
    Object.defineProperty(String, 'empty', {
      enumerable: true,
      configurable: true,
      get: () => '',
    });

    ({ default: JABS_RespawnRecord } = await import(
      '../../../../../src/plugins/abs/core/models/JABS_RespawnRecord.js'));
  });

  describe('constructor', () =>
  {
    it('assigns the method, param, and due members', () =>
    {
      // Arrange
      const method = 'seconds';
      const param = '90';
      const due = 6400;

      // Act
      const record = new JABS_RespawnRecord(method, param, due);

      // Assert
      expect(record.method).toBe('seconds');
      expect(record.param).toBe('90');
      expect(record.due).toBe(6400);
    });
  });

  describe('isPermanent', () =>
  {
    it('returns true for the reserved permanent method', () =>
    {
      // Arrange
      const record = new JABS_RespawnRecord('never', '', 0);

      // Act
      const result = record.isPermanent();

      // Assert
      expect(result).toBe(true);
    });

    it('returns false for a scheduled method', () =>
    {
      // Arrange
      const record = new JABS_RespawnRecord('seconds', '90', 6400);

      // Act
      const result = record.isPermanent();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('save codec registration', () =>
  {
    it('registers under its stable save id', () =>
    {
      // Arrange
      const [ [ registeredClass, declaration ] ] = globalThis.SerializableRegistry.register.mock.calls;

      // Act
      const { id, aliases } = declaration;

      // Assert
      expect(registeredClass).toBe(JABS_RespawnRecord);
      expect(id).toBe('jabs-respawn-record');
      expect(aliases).toEqual([ 'JABS_RespawnRecord' ]);
    });

    it('seeds the cold equivalents of an unscheduled record', () =>
    {
      // Arrange
      const [ [ , declaration ] ] = globalThis.SerializableRegistry.register.mock.calls;
      const bareInstance = Object.create(JABS_RespawnRecord.prototype);

      // Act
      declaration.seed(bareInstance);

      // Assert
      expect(bareInstance.method).toBe('');
      expect(bareInstance.param).toBe('');
      expect(bareInstance.due).toBe(0);
    });
  });
});
//endregion plugins/abs/core/models/jabs-respawn-record.test.js