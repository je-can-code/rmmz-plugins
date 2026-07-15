//region plugins/cms/status/_models/status-parameter.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('StatusParameter (direct src import)', () =>
{
  let StatusParameter;
  let fakeDefinition;

  beforeAll(async () =>
  {
    vi.resetModules();

    // String.empty is a J-Base runtime augmentation, always present by the time this file's
    // production code runs in-game; stub it here since this test doesn't boot J-Base itself.
    String.empty = '';

    // the real format constant is a pure static-only class with no dependencies of its own.
    ({ default: globalThis.ParameterFormat } = await import('../../../../../src/plugins/_base/core/ParameterFormat.js'));

    // ParameterRegistry itself pulls in the full definition/group machinery; a bare stub of just
    // the `get()` surface StatusParameter actually calls is enough here.
    globalThis.ParameterRegistry = { get: vi.fn() };

    ({ default: StatusParameter } = await import('../../../../../src/plugins/cms/status/_models/StatusParameter.js'));
  });

  beforeEach(() =>
  {
    fakeDefinition = {
      label: vi.fn()
        .mockReturnValue('Attack'),
      iconIndex: vi.fn()
        .mockReturnValue(64),
      resolveDisplayColorIndex: vi.fn()
        .mockReturnValue(2),
      resolveDisplaySentinel: vi.fn()
        .mockReturnValue(false),
      prettyValue: vi.fn()
        .mockReturnValue('100'),
      format: globalThis.ParameterFormat.FLAT,
    };
    globalThis.ParameterRegistry.get.mockReturnValue(fakeDefinition);
  });

  describe('constructor/refresh', () =>
  {
    it('derives name/iconIndex/colorIndex from the registry definition', () =>
    {
      // Arrange/Act
      const parameter = new StatusParameter(100, 'atk');

      // Assert
      expect(parameter.value).toEqual(100);
      expect(parameter.parameterKey).toEqual('atk');
      expect(parameter.name).toEqual('Attack');
      expect(parameter.iconIndex).toEqual(64);
      expect(parameter.colorIndex).toEqual(2);
    });

    it('falls back to the raw key with default icon/color when the registry has no definition', () =>
    {
      // Arrange
      globalThis.ParameterRegistry.get.mockReturnValue(null);

      // Act
      const parameter = new StatusParameter(100, 'unknown-key');

      // Assert
      expect(parameter.name).toEqual('unknown-key');
      expect(parameter.iconIndex).toEqual(0);
      expect(parameter.colorIndex).toEqual(0);
    });

    it('resolves colorIndex based on the current value via the definition', () =>
    {
      // Arrange/Act
      const parameter = new StatusParameter(50, 'atk');

      // Assert
      expect(parameter).toBeInstanceOf(StatusParameter);
      expect(fakeDefinition.resolveDisplayColorIndex).toHaveBeenCalledWith(50);
    });
  });

  describe('usesStyledValue', () =>
  {
    it('returns false when there is no registry definition', () =>
    {
      // Arrange
      globalThis.ParameterRegistry.get.mockReturnValue(null);
      const parameter = new StatusParameter(100, 'unknown-key');

      // Act
      const result = parameter.usesStyledValue();

      // Assert
      expect(result).toEqual(false);
    });

    it('returns false when the definition reports a sentinel display value', () =>
    {
      // Arrange
      fakeDefinition.resolveDisplaySentinel.mockReturnValue(true);
      const parameter = new StatusParameter(100, 'atk');

      // Act
      const result = parameter.usesStyledValue();

      // Assert
      expect(result).toEqual(false);
    });

    it('returns false for regen-per-second formatted parameters', () =>
    {
      // Arrange
      fakeDefinition.format = globalThis.ParameterFormat.REGEN_PER_SECOND;
      const parameter = new StatusParameter(100, 'hpRegen');

      // Act
      const result = parameter.usesStyledValue();

      // Assert
      expect(result).toEqual(false);
    });

    it('returns true for a non-sentinel, non-regen parameter', () =>
    {
      // Arrange
      const parameter = new StatusParameter(100, 'atk');

      // Act
      const result = parameter.usesStyledValue();

      // Assert
      expect(result).toEqual(true);
    });
  });

  describe('prettyValue', () =>
  {
    it('delegates to the definition prettyValue formatter when a definition exists', () =>
    {
      // Arrange
      const parameter = new StatusParameter(100, 'atk');

      // Act
      const result = parameter.prettyValue(true);

      // Assert
      expect(fakeDefinition.prettyValue).toHaveBeenCalledWith(100, true);
      expect(result).toEqual('100');
    });

    it('falls back to the raw value stringified when there is no registry definition', () =>
    {
      // Arrange
      globalThis.ParameterRegistry.get.mockReturnValue(null);
      const parameter = new StatusParameter(100, 'unknown-key');

      // Act
      const result = parameter.prettyValue();

      // Assert
      expect(result).toEqual('100');
    });
  });
});
//endregion plugins/cms/status/_models/status-parameter.test.js
