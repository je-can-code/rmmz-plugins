//region plugins/_base/models/plugin-version.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('PluginVersion (direct src import)', () =>
{
  let PluginVersion;

  beforeAll(async () =>
  {
    ({ default: PluginVersion } = await import('../../../../src/plugins/_base/models/PluginVersion.js'));
  });

  describe('constructor', () =>
  {
    it('parses a dotted version string into major/minor/patch', () =>
    {
      // Arrange & Act
      const version = new PluginVersion('1.2.3');

      // Assert
      expect(version.major).toBe(1);
      expect(version.minor).toBe(2);
      expect(version.patch).toBe(3);
    });
  });

  describe('version', () =>
  {
    it('joins major/minor/patch back into a dotted string', () =>
    {
      // Arrange
      const version = new PluginVersion('4.5.6');

      // Act
      const result = version.version();

      // Assert
      expect(result).toBe('4.5.6');
    });
  });

  describe('satisfiesPluginVersion', () =>
  {
    it('returns true when the major version is higher', () =>
    {
      // Arrange
      const version = new PluginVersion('2.0.0');
      const target = new PluginVersion('1.9.9');

      // Act & Assert
      expect(version.satisfiesPluginVersion(target)).toBe(true);
    });

    it('returns false when the major version is lower', () =>
    {
      // Arrange
      const version = new PluginVersion('1.9.9');
      const target = new PluginVersion('2.0.0');

      // Act & Assert
      expect(version.satisfiesPluginVersion(target)).toBe(false);
    });

    it('returns true when major is equal and minor is higher', () =>
    {
      // Arrange
      const version = new PluginVersion('1.5.0');
      const target = new PluginVersion('1.4.9');

      // Act & Assert
      expect(version.satisfiesPluginVersion(target)).toBe(true);
    });

    it('returns false when major is equal and minor is lower', () =>
    {
      // Arrange
      const version = new PluginVersion('1.4.9');
      const target = new PluginVersion('1.5.0');

      // Act & Assert
      expect(version.satisfiesPluginVersion(target)).toBe(false);
    });

    it('returns true when major and minor are equal and patch is higher', () =>
    {
      // Arrange
      const version = new PluginVersion('1.5.3');
      const target = new PluginVersion('1.5.2');

      // Act & Assert
      expect(version.satisfiesPluginVersion(target)).toBe(true);
    });

    it('returns false when major and minor are equal and patch is lower', () =>
    {
      // Arrange
      const version = new PluginVersion('1.5.2');
      const target = new PluginVersion('1.5.3');

      // Act & Assert
      expect(version.satisfiesPluginVersion(target)).toBe(false);
    });

    it('returns true when major, minor, and patch are all exactly equal', () =>
    {
      // Arrange
      const version = new PluginVersion('1.5.3');
      const target = new PluginVersion('1.5.3');

      // Act & Assert
      expect(version.satisfiesPluginVersion(target)).toBe(true);
    });
  });

  describe('builder', () =>
  {
    it('builds a PluginVersion from the fluently-set major/minor/patch', () =>
    {
      // Arrange & Act
      const version = PluginVersion.builder
        .major(2)
        .minor(3)
        .patch(4)
        .build();

      // Assert
      expect(version.major).toBe(2);
      expect(version.minor).toBe(3);
      expect(version.patch).toBe(4);
    });

    it('defaults every unset part to 0', () =>
    {
      // Arrange & Act
      const version = PluginVersion.builder.build();

      // Assert
      expect(version.major).toBe(0);
      expect(version.minor).toBe(0);
      expect(version.patch).toBe(0);
    });

    it('clears its internal state after building, so a later build does not leak prior values', () =>
    {
      // Arrange
      PluginVersion.builder.major(9).minor(9).patch(9).build();

      // Act
      const version = PluginVersion.builder.build();

      // Assert
      expect(version.major).toBe(0);
      expect(version.minor).toBe(0);
      expect(version.patch).toBe(0);
    });

    it('parses string-typed version parts into numbers', () =>
    {
      // Arrange & Act
      const version = PluginVersion.builder
        .major('3')
        .minor('4')
        .patch('5')
        .build();

      // Assert
      expect(version.major).toBe(3);
      expect(version.minor).toBe(4);
      expect(version.patch).toBe(5);
    });
  });
});
//endregion plugins/_base/models/plugin-version.test.js
