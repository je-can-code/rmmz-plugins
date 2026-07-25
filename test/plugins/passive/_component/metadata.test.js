//region plugins/passive/_component/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installPassiveHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPassive,
} from './fixtures/install-passive-host-globals.js';

describe('J-Passive metadata and regex (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installPassiveHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJPassive();
    await import('../../../../src/plugins/passive/core/_metadata/initialization.js');
  });

  describe('J.PASSIVE namespace and versioned metadata', () =>
  {
    it('exposes the plugin name', () =>
    {
      // Arrange & Act
      const result = globalThis.J.PASSIVE.Metadata.name;

      // Assert
      expect(result).toBe('J-Passive');
    });

    it('exposes the plugin version', () =>
    {
      // Arrange & Act
      const result = globalThis.J.PASSIVE.Metadata.version.version();

      // Assert
      expect(result).toBe('2.1.0');
    });
  });

  describe('passive tag regex', () =>
  {
    it('PassiveStateIds captures a bracketed id list', () =>
    {
      // Arrange
      const { PassiveStateIds } = globalThis.J.PASSIVE.RegExp;

      // Act
      const result = PassiveStateIds.exec('<passive:[12, 13]>');

      // Assert
      expect(result[1]).toBe('[12, 13]');
    });

    it('UniquePassiveStateIds captures a bracketed id list', () =>
    {
      // Arrange
      const { UniquePassiveStateIds } = globalThis.J.PASSIVE.RegExp;

      // Act
      const result = UniquePassiveStateIds.exec('<uniquePassive:[7]>');

      // Assert
      expect(result[1]).toBe('[7]');
    });

    it('EquippedPassiveStateIds captures a bracketed id list', () =>
    {
      // Arrange
      const { EquippedPassiveStateIds } = globalThis.J.PASSIVE.RegExp;

      // Act
      const result = EquippedPassiveStateIds.exec('<equippedPassive:[3, 4]>');

      // Assert
      expect(result[1]).toBe('[3, 4]');
    });
  });
});
//endregion plugins/passive/_component/metadata.test.js
