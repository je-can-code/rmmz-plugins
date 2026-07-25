//region plugins/_base/models/plugin-metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('PluginMetadata (direct src import)', () =>
{
  let PluginMetadata;

  beforeAll(async () =>
  {
    String.empty = '';

    globalThis.PluginManager = {
      parameters: (name) => `params-for-${name}`,
    };

    ({ default: PluginMetadata } = await import('../../../../src/plugins/_base/models/PluginMetadata.js'));
  });

  describe('constructor', () =>
  {
    it('throws when name is missing', () =>
    {
      // Arrange
      const traceSpy = vi.spyOn(console, 'trace').mockImplementation(() => {});

      // Act
      const attempt = () => new PluginMetadata('', '1.0.0');

      // Assert
      expect(attempt).toThrow(/Erroneous plugin metadata provided/);
      traceSpy.mockRestore();
    });

    it('throws when version is missing', () =>
    {
      // Arrange
      const traceSpy = vi.spyOn(console, 'trace').mockImplementation(() => {});

      // Act
      const attempt = () => new PluginMetadata('J-Test-1', '');

      // Assert
      expect(attempt).toThrow(/Erroneous plugin metadata provided/);
      traceSpy.mockRestore();
    });

    it('parses the version and assigns the name', () =>
    {
      // Arrange & Act
      const metadata = new PluginMetadata('J-Test-2', '1.2.3');

      // Assert
      expect(metadata.name).toBe('J-Test-2');
      expect(metadata.version.major).toBe(1);
      expect(metadata.version.minor).toBe(2);
      expect(metadata.version.patch).toBe(3);
    });

    it('registers the plugin so hasPlugin/getPlugin can find it afterward', () =>
    {
      // Arrange & Act
      const metadata = new PluginMetadata('J-Test-3', '1.0.0');

      // Assert
      expect(PluginMetadata.hasPlugin('J-Test-3')).toBe(true);
      expect(PluginMetadata.getPlugin('J-Test-3')).toBe(metadata);
    });

    it('throws when the same plugin name is registered twice', () =>
    {
      // Arrange
      const first = new PluginMetadata('J-Test-4', '1.0.0');
      expect(first).toBeInstanceOf(PluginMetadata);

      // Act
      const attempt = () => new PluginMetadata('J-Test-4', '1.0.0');

      // Assert
      expect(attempt).toThrow('Duplicate plugin entry detected: [J-Test-4] !');
    });

    it('pulls raw plugin parameters from PluginManager.parameters(name)', () =>
    {
      // Arrange & Act
      const metadata = new PluginMetadata('J-Test-5', '1.0.0');

      // Assert
      expect(metadata.rawPluginParameters).toBe('params-for-J-Test-5');
    });
  });

  describe('hasPlugin', () =>
  {
    it('returns false for a plugin name that was never registered', () =>
    {
      // Arrange & Act & Assert
      expect(PluginMetadata.hasPlugin('J-Never-Registered')).toBe(false);
    });
  });
});
//endregion plugins/_base/models/plugin-metadata.test.js
