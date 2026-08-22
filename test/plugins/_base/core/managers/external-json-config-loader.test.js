//region plugins/_base/managers/external-json-config-loader.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('ExternalJsonConfigLoader (direct src import)', () =>
{
  let ExternalJsonConfigLoader;
  let ExternalJsonConfigLoaderOptions;

  beforeAll(async () =>
  {
    String.empty = '';

    ({ default: ExternalJsonConfigLoaderOptions } = await import('../../../../../src/plugins/_base/core/models/ExternalJsonConfigLoaderOptions.js'));
    ({ default: ExternalJsonConfigLoader } = await import('../../../../../src/plugins/_base/core/managers/ExternalJsonConfigLoader.js'));
  });

  beforeEach(() =>
  {
    globalThis.J = { BASE: { Metadata: { ShowExternalFileLoadInfo: false } } };
    globalThis.StorageManager = { fsReadFile: () => '{}' };
  });

  afterEach(() =>
  {
    delete globalThis.J;
    delete globalThis.StorageManager;
  });

  describe('missing config handling', () =>
  {
    it('throws when the file read returns null', () =>
    {
      // Arrange
      globalThis.StorageManager.fsReadFile = () => null;

      // Act
      const attempt = () => ExternalJsonConfigLoader.load('data/config.test.json');

      // Assert- anchored at both ends, because no plugin or config name was provided and the message
      // must therefore carry no bracketed context prefix at all, not merely an empty one.
      expect(attempt).toThrow(/^missing configuration file at data\/config\.test\.json\.$/);
    });

    it('throws when the file read returns an empty string', () =>
    {
      // Arrange
      globalThis.StorageManager.fsReadFile = () => '';

      // Act
      const attempt = () => ExternalJsonConfigLoader.load('data/config.test.json');

      // Assert
      expect(attempt).toThrow('missing configuration file at data/config.test.json.');
    });

    it('throws when the parsed JSON is the literal value null', () =>
    {
      // Arrange
      globalThis.StorageManager.fsReadFile = () => 'null';

      // Act
      const attempt = () => ExternalJsonConfigLoader.load('data/config.test.json');

      // Assert
      expect(attempt).toThrow('missing configuration file at data/config.test.json.');
    });

    it('uses the configName as the missing-file label when one is provided', () =>
    {
      // Arrange
      globalThis.StorageManager.fsReadFile = () => null;
      const options = new ExternalJsonConfigLoaderOptions(null, 'SDP Panels');

      // Act
      const attempt = () => ExternalJsonConfigLoader.load('data/config.test.json', options);

      // Assert- anchored, because the absent pluginName must contribute no segment to the prefix
      // rather than an empty one beside the config name.
      expect(attempt).toThrow(/^\[SDP Panels] missing SDP Panels file at data\/config\.test\.json\.$/);
    });

    it('prefixes the error with only the pluginName when no configName is provided', () =>
    {
      // Arrange
      globalThis.StorageManager.fsReadFile = () => null;
      const options = new ExternalJsonConfigLoaderOptions('J-SDP', null);

      // Act
      const attempt = () => ExternalJsonConfigLoader.load('data/config.test.json', options);

      // Assert- the absent configName contributes no prefix segment, and the missing-file label
      // falls back to the generic word rather than borrowing the plugin name.
      expect(attempt).toThrow(/^\[J-SDP] missing configuration file at data\/config\.test\.json\.$/);
    });

    it('prefixes the error with pluginName and configName when both are provided', () =>
    {
      // Arrange
      globalThis.StorageManager.fsReadFile = () => null;
      const options = new ExternalJsonConfigLoaderOptions('J-SDP', 'SDP Panels');

      // Act
      const attempt = () => ExternalJsonConfigLoader.load('data/config.test.json', options);

      // Assert
      expect(attempt).toThrow('[J-SDP::SDP Panels] missing SDP Panels file at data/config.test.json.');
    });
  });

  describe('JSON parse failures', () =>
  {
    it('wraps a JSON.parse failure with the config path and underlying message', () =>
    {
      // Arrange
      globalThis.StorageManager.fsReadFile = () => '{ not valid json';

      // Act
      const attempt = () => ExternalJsonConfigLoader.load('data/config.test.json');

      // Assert
      expect(attempt).toThrow(/failed to parse JSON at data\/config\.test\.json/);
    });

    it('prefixes a JSON.parse failure with pluginName/configName when provided', () =>
    {
      // Arrange
      globalThis.StorageManager.fsReadFile = () => '{ not valid json';
      const options = new ExternalJsonConfigLoaderOptions('J-SDP', 'SDP Panels');

      // Act
      const attempt = () => ExternalJsonConfigLoader.load('data/config.test.json', options);

      // Assert
      expect(attempt).toThrow(/^\[J-SDP::SDP Panels] failed to parse JSON/);
    });
  });

  describe('validation', () =>
  {
    it('returns the parsed blob unchanged when no validator is provided', () =>
    {
      // Arrange
      globalThis.StorageManager.fsReadFile = () => '{"a":1}';

      // Act
      const result = ExternalJsonConfigLoader.load('data/config.test.json');

      // Assert
      expect(result).toEqual({ a: 1 });
    });

    it('passes the parsed blob through when the validator does not throw', () =>
    {
      // Arrange
      globalThis.StorageManager.fsReadFile = () => '{"a":1}';
      const validator = vi.fn();
      const options = ExternalJsonConfigLoaderOptions.Builder()
        .validator(validator)
        .build();

      // Act
      const result = ExternalJsonConfigLoader.load('data/config.test.json', options);

      // Assert
      expect(validator).toHaveBeenCalledWith({ a: 1 });
      expect(result).toEqual({ a: 1 });
    });

    it('wraps a validator failure with the config path and underlying message', () =>
    {
      // Arrange
      globalThis.StorageManager.fsReadFile = () => '{"a":1}';
      const options = ExternalJsonConfigLoaderOptions.Builder()
        .validator(() => { throw new Error('bad shape'); })
        .build();

      // Act
      const attempt = () => ExternalJsonConfigLoader.load('data/config.test.json', options);

      // Assert
      expect(attempt).toThrow('invalid JSON config at data/config.test.json: bad shape');
    });

    it('prefixes a validator failure with pluginName/configName when provided', () =>
    {
      // Arrange
      globalThis.StorageManager.fsReadFile = () => '{"a":1}';
      const options = ExternalJsonConfigLoaderOptions.Builder()
        .pluginName('J-SDP')
        .configName('SDP Panels')
        .validator(() => { throw new Error('bad shape'); })
        .build();

      // Act
      const attempt = () => ExternalJsonConfigLoader.load('data/config.test.json', options);

      // Assert
      expect(attempt).toThrow('[J-SDP::SDP Panels] invalid JSON config at data/config.test.json: bad shape');
    });
  });

  describe('mapping', () =>
  {
    it('returns the parsed blob unchanged when no mapper is provided', () =>
    {
      // Arrange
      globalThis.StorageManager.fsReadFile = () => '{"a":1}';

      // Act
      const result = ExternalJsonConfigLoader.load('data/config.test.json');

      // Assert
      expect(result).toEqual({ a: 1 });
    });

    it('applies the mapper to the parsed blob when one is provided', () =>
    {
      // Arrange
      globalThis.StorageManager.fsReadFile = () => '{"a":1}';
      const options = ExternalJsonConfigLoaderOptions.Builder()
        .mapper((parsed) => ({ mapped: parsed.a * 2 }))
        .build();

      // Act
      const result = ExternalJsonConfigLoader.load('data/config.test.json', options);

      // Assert
      expect(result).toEqual({ mapped: 2 });
    });
  });

  describe('logging', () =>
  {
    it('does not log anything when ShowExternalFileLoadInfo is false', () =>
    {
      // Arrange
      globalThis.J.BASE.Metadata.ShowExternalFileLoadInfo = false;
      globalThis.StorageManager.fsReadFile = () => '{"a":1}';
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Act
      ExternalJsonConfigLoader.load('data/config.test.json');

      // Assert
      expect(logSpy).not.toHaveBeenCalled();
      logSpy.mockRestore();
    });

    it('logs a minimal single-line message when enabled with no logSummary', () =>
    {
      // Arrange
      globalThis.J.BASE.Metadata.ShowExternalFileLoadInfo = true;
      globalThis.StorageManager.fsReadFile = () => '{"a":1}';
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Act
      ExternalJsonConfigLoader.load('data/config.test.json');

      // Assert
      expect(logSpy).toHaveBeenCalledWith('loaded external JSON from file data/config.test.json.');
      logSpy.mockRestore();
    });

    it('logs each line of an array-returning logSummary', () =>
    {
      // Arrange
      globalThis.J.BASE.Metadata.ShowExternalFileLoadInfo = true;
      globalThis.StorageManager.fsReadFile = () => '{"a":1}';
      const options = ExternalJsonConfigLoaderOptions.Builder()
        .logSummary(() => [ 'line one', 'line two' ])
        .build();
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Act
      ExternalJsonConfigLoader.load('data/config.test.json', options);

      // Assert
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('line one'));
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('line two'));
      logSpy.mockRestore();
    });

    it('wraps a single string-returning logSummary into a one-line array', () =>
    {
      // Arrange
      globalThis.J.BASE.Metadata.ShowExternalFileLoadInfo = true;
      globalThis.StorageManager.fsReadFile = () => '{"a":1}';
      const options = ExternalJsonConfigLoaderOptions.Builder()
        .logSummary(() => 'single summary line')
        .build();
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Act
      ExternalJsonConfigLoader.load('data/config.test.json', options);

      // Assert
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('single summary line'));
      logSpy.mockRestore();
    });
  });
});
//endregion plugins/_base/managers/external-json-config-loader.test.js
