//region plugins/level/_component/growth-curve-formula.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installLevelHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJLevel,
} from './fixtures/install-level-host-globals.js';

/**
 * The authored growth curves that decide what a parameter is worth past level 99.
 *
 * Levels 1-99 come off the class's baked `params` array, so this only matters in the range the
 * editor cannot bake - and it is the source of truth there. A curve that silently evaluates to the
 * wrong thing produces a character whose stats are simply wrong at high level, with nothing anywhere
 * reporting a problem, which is why the failure path here returns a sentinel rather than throwing.
 */
describe('GrowthCurveFormula', () =>
{
  /** @type {typeof import('../../../../src/plugins/level/core/managers/GrowthCurveFormula.js').default} */
  let GrowthCurveFormula;

  beforeAll(async () =>
  {
    vi.resetModules();

    installLevelHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../src/plugins/_base/core/managers/RPGManager.js'));

    setPluginContextToJLevel();
    await import('../../../../src/plugins/level/core/_metadata/initialization.js');

    ({ default: GrowthCurveFormula } = await import(
      '../../../../src/plugins/level/core/managers/GrowthCurveFormula.js'));
  });

  beforeEach(() =>
  {
    vi.restoreAllMocks();
  });

  //region the static-class contract
  describe('constructor', () =>
  {
    it('refuses to be instantiated, because there is no instance state to hold', () =>
    {
      // Arrange
      // Act
      // Assert
      expect(() => new GrowthCurveFormula())
        .toThrow('This is a static class.');
    });
  });
  //endregion the static-class contract

  //region reading the tags
  describe('readForClass()', () =>
  {
    it('reads the curve a class tagged for a specific base parameter', () =>
    {
      // Arrange
      const dataClass = { note: '<atkGrowthCurve:[a.level * 3]>' };

      // Act
      const formula = GrowthCurveFormula.readForClass(dataClass, 2);

      // Assert
      expect(formula)
        .toBe('a.level * 3');
    });

    it('answers null for a parameter the class never tagged', () =>
    {
      // Arrange: null rather than an empty string is deliberate - it is what lets the caller fall
      // straight through to its slope-extrapolation fallback instead of evaluating nothing.
      const dataClass = { note: '<atkGrowthCurve:[a.level * 3]>' };

      // Act
      const formula = GrowthCurveFormula.readForClass(dataClass, 3);

      // Assert
      expect(formula)
        .toBeNull();
    });
  });

  describe('readMtpForClass()', () =>
  {
    it('reads the max-tp curve a class tagged', () =>
    {
      // Arrange
      const dataClass = { note: '<mtpGrowthCurve:[a.level + 5]>' };

      // Act
      const formula = GrowthCurveFormula.readMtpForClass(dataClass);

      // Assert
      expect(formula)
        .toBe('a.level + 5');
    });

    it('answers null for a class with no max-tp curve', () =>
    {
      // Arrange
      const dataClass = { note: '<atkGrowthCurve:[a.level * 3]>' };

      // Act
      const formula = GrowthCurveFormula.readMtpForClass(dataClass);

      // Assert
      expect(formula)
        .toBeNull();
    });
  });
  //endregion reading the tags

  //region evaluating them
  describe('evaluate()', () =>
  {
    it('evaluates a formula against the level it was handed', () =>
    {
      // Arrange
      // Act
      const value = GrowthCurveFormula.evaluate('a.level * 3', 120);

      // Assert
      expect(value)
        .toBe(360);
    });

    it('exposes the level as `a.level`, matching what the editor previews against', () =>
    {
      // Arrange: the editor's own `GrowthParser.evaluateFormula` builds the same one-key context, and
      // a mismatch there means the number an author previews is not the number the game uses.
      // Act
      const value = GrowthCurveFormula.evaluate('Math.floor(Math.pow(a.level, 1.5))', 100);

      // Assert
      expect(value)
        .toBe(1000);
    });

    it('falls back to zero rather than crashing on a formula that will not compile', () =>
    {
      // Arrange
      const logged = vi.spyOn(console, 'error')
        .mockImplementation(() => {});

      // Act
      const value = GrowthCurveFormula.evaluate('a.level *', 120);

      // Assert: an author typo in a notetag should cost a wrong stat, never a game that will not boot.
      expect(value)
        .toBe(0);

      logged.mockRestore();
    });

    it('falls back to zero on a formula that compiles but throws when run', () =>
    {
      // Arrange
      const logged = vi.spyOn(console, 'error')
        .mockImplementation(() => {});

      // Act
      const value = GrowthCurveFormula.evaluate('a.nothing.level', 120);

      // Assert
      expect(value)
        .toBe(0);

      logged.mockRestore();
    });

    it('names the offending formula when one fails, so the tag can be found again', () =>
    {
      // Arrange
      const logged = vi.spyOn(console, 'error')
        .mockImplementation(() => {});

      // Act
      GrowthCurveFormula.evaluate('a.level *', 120);

      // Assert
      expect(logged.mock.calls[0][0])
        .toContain('a.level *');

      logged.mockRestore();
    });
  });
  //endregion evaluating them
});
//endregion plugins/level/_component/growth-curve-formula.test.js