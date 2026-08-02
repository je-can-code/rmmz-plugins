//region plugins/_base/core/parameter-keys.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('ParameterKeys (direct src import)', () =>
{
  let ParameterKeys;

  beforeAll(async () =>
  {
    ({ default: ParameterKeys } = await import('../../../../../src/plugins/_base/core/core/ParameterKeys.js'));
  });

  describe('bparamKey', () =>
  {
    it('resolves the registry key for a valid b-param id', () =>
    {
      // Arrange & Act
      const result = ParameterKeys.bparamKey(2);

      // Assert
      expect(result).toBe('atk');
    });

    it('returns null for an out-of-range b-param id', () =>
    {
      // Arrange & Act
      const result = ParameterKeys.bparamKey(99);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('xparamKey', () =>
  {
    it('resolves the registry key for a valid x-param id', () =>
    {
      // Arrange & Act
      const result = ParameterKeys.xparamKey(0);

      // Assert
      expect(result).toBe('hit');
    });

    it('returns null for an out-of-range x-param id', () =>
    {
      // Arrange & Act
      const result = ParameterKeys.xparamKey(99);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('sparamKey', () =>
  {
    it('resolves the registry key for a valid s-param id', () =>
    {
      // Arrange & Act
      const result = ParameterKeys.sparamKey(0);

      // Assert
      expect(result).toBe('tgr');
    });

    it('returns null for an out-of-range s-param id', () =>
    {
      // Arrange & Act
      const result = ParameterKeys.sparamKey(99);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('legacyLongParamKey', () =>
  {
    it('resolves the registry key for a valid legacy long-param id', () =>
    {
      // Arrange & Act
      const result = ParameterKeys.legacyLongParamKey(28);

      // Assert
      expect(result).toBe('cdm');
    });

    it('returns null for an unmapped legacy long-param id', () =>
    {
      // Arrange & Act
      const result = ParameterKeys.legacyLongParamKey(34);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('bparamId', () =>
  {
    it('resolves the b-param id for a known registry key', () =>
    {
      // Arrange & Act
      const result = ParameterKeys.bparamId('atk');

      // Assert
      expect(result).toBe(2);
    });

    it('returns -1 for a key that is not a b-param', () =>
    {
      // Arrange & Act
      const result = ParameterKeys.bparamId('hit');

      // Assert
      expect(result).toBe(-1);
    });
  });

  describe('xparamId', () =>
  {
    it('resolves the x-param id for a known registry key', () =>
    {
      // Arrange & Act
      const result = ParameterKeys.xparamId('hit');

      // Assert
      expect(result).toBe(0);
    });

    it('returns -1 for a key that is not an x-param', () =>
    {
      // Arrange & Act
      const result = ParameterKeys.xparamId('atk');

      // Assert
      expect(result).toBe(-1);
    });
  });

  describe('sparamId', () =>
  {
    it('resolves the s-param id for a known registry key', () =>
    {
      // Arrange & Act
      const result = ParameterKeys.sparamId('tgr');

      // Assert
      expect(result).toBe(0);
    });

    it('returns -1 for a key that is not an s-param', () =>
    {
      // Arrange & Act
      const result = ParameterKeys.sparamId('atk');

      // Assert
      expect(result).toBe(-1);
    });
  });
});
//endregion plugins/_base/core/parameter-keys.test.js
