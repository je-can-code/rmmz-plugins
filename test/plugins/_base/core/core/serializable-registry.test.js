//region plugins/_base/core/serializable-registry.test.js
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

describe('SerializableRegistry (direct src import)', () =>
{
  let SerializableRegistry;

  beforeAll(async () =>
  {
    ({ default: SerializableRegistry } = await import('../../../../../src/plugins/_base/core/core/SerializableRegistry.js'));
  });

  beforeEach(() =>
  {
    SerializableRegistry._constructors.clear();
  });

  describe('register', () =>
  {
    it('uses the constructor\'s own name as the id when no options are given', () =>
    {
      // Arrange
      class Widget {}

      // Act
      SerializableRegistry.register(Widget);

      // Assert
      expect(SerializableRegistry.resolve('Widget')).toBe(Widget);
    });

    it('uses the explicit options.id instead of the constructor name when provided', () =>
    {
      // Arrange
      class Widget {}

      // Act
      SerializableRegistry.register(Widget, { id: 'CustomWidget' });

      // Assert
      expect(SerializableRegistry.resolve('CustomWidget')).toBe(Widget);
      expect(SerializableRegistry.resolve('Widget')).toBeNull();
    });

    it('also registers every alias when options.aliases is provided', () =>
    {
      // Arrange
      class Widget {}

      // Act
      SerializableRegistry.register(Widget, { aliases: [ 'OldWidget', 'LegacyWidget' ] });

      // Assert
      expect(SerializableRegistry.resolve('Widget')).toBe(Widget);
      expect(SerializableRegistry.resolve('OldWidget')).toBe(Widget);
      expect(SerializableRegistry.resolve('LegacyWidget')).toBe(Widget);
    });

    it('registers no aliases when options is provided without an aliases field', () =>
    {
      // Arrange
      class Widget {}

      // Act
      SerializableRegistry.register(Widget, { id: 'Widget' });

      // Assert- only the primary id resolves; nothing else was registered.
      expect(SerializableRegistry._constructors.size).toBe(1);
    });
  });

  describe('resolve', () =>
  {
    it('returns the registered constructor for a known id', () =>
    {
      // Arrange
      class Widget {}
      SerializableRegistry.register(Widget);

      // Act
      const result = SerializableRegistry.resolve('Widget');

      // Assert
      expect(result).toBe(Widget);
    });

    it('returns null for an unregistered id', () =>
    {
      // Arrange & Act
      const result = SerializableRegistry.resolve('NeverRegistered');

      // Assert
      expect(result).toBeNull();
    });
  });
});
//endregion plugins/_base/core/serializable-registry.test.js
