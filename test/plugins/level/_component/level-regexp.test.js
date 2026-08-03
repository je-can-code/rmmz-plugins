//region plugins/level/_component/level-regexp.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installLevelHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJLevel,
} from './fixtures/install-level-host-globals.js';

describe('J-LevelMaster J.LEVEL.RegExp (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installLevelHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJLevel();
    await import('../../../../src/plugins/level/core/_metadata/initialization.js');
  });

  describe('Level', () =>
  {
    it('accepts the "level" key', () =>
    {
      // Arrange
      const { Level } = globalThis.J.LEVEL.RegExp;

      // Act
      const result = Level.exec('<level:5>');

      // Assert
      expect(result[1]).toBe('5');
    });

    it('accepts the "lvl" key with an explicit positive sign', () =>
    {
      // Arrange
      const { Level } = globalThis.J.LEVEL.RegExp;

      // Act
      const result = Level.exec('<lvl:+12>');

      // Assert
      expect(result[1]).toBe('+12');
    });

    it('accepts the "LV" key case-insensitively with a negative sign', () =>
    {
      // Arrange
      const { Level } = globalThis.J.LEVEL.RegExp;

      // Act
      const result = Level.exec('<LV:-3>');

      // Assert
      expect(result[1]).toBe('-3');
    });
  });

  describe('Learning', () =>
  {
    it('captures a bracket pair of ids', () =>
    {
      // Arrange
      const { Learning } = globalThis.J.LEVEL.RegExp;

      // Act
      const result = Learning.exec('<learning:[99, 10]>');

      // Assert
      expect(result[1]).toBe('[99, 10]');
    });
  });

  describe('MaxLevelBoost', () =>
  {
    it('captures an explicit positive signed integer', () =>
    {
      // Arrange
      const { MaxLevelBoost } = globalThis.J.LEVEL.RegExp;

      // Act
      const result = MaxLevelBoost.exec('<maxLevelBoost:+25>');

      // Assert
      expect(result[1]).toBe('+25');
    });

    it('captures a negative signed integer with surrounding whitespace', () =>
    {
      // Arrange
      const { MaxLevelBoost } = globalThis.J.LEVEL.RegExp;

      // Act
      const result = MaxLevelBoost.exec('<maxLevelBoost: -7>');

      // Assert
      expect(result[1]).toBe('-7');
    });
  });

  describe('HideLevel', () =>
  {
    it('matches the lowercase tag name', () =>
    {
      // Arrange
      const { HideLevel } = globalThis.J.LEVEL.RegExp;

      // Act
      const result = HideLevel.test('<hideLevel>');

      // Assert
      expect(result).toBe(true);
    });

    it('matches the tag name case-insensitively', () =>
    {
      // Arrange
      const { HideLevel } = globalThis.J.LEVEL.RegExp;

      // Act
      const result = HideLevel.test('<HideLevel>');

      // Assert
      expect(result).toBe(true);
    });

    it('does not match an unrelated tag', () =>
    {
      // Arrange
      const { HideLevel } = globalThis.J.LEVEL.RegExp;

      // Act
      const result = HideLevel.test('<level:1>');

      // Assert
      expect(result).toBe(false);
    });
  });
});
//endregion plugins/level/_component/level-regexp.test.js
