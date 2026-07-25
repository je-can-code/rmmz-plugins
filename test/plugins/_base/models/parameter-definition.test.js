//region plugins/_base/models/parameter-definition.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('ParameterDefinition (direct src import)', () =>
{
  let ParameterDefinition;
  let ParameterFormat;
  let ParameterDisplayPolicy;
  let ParameterDisplaySentinel;

  beforeAll(async () =>
  {
    // vanilla RMMZ core prototype extensions (rmmz_core.js), not part of this plugin.
    Number.prototype.padZero = function(length)
    {
      return String(this)
        .padStart(length, '0');
    };
    String.prototype.padZero = function(length)
    {
      return this.padStart(length, '0');
    };

    ({ default: ParameterFormat } = await import('../../../../src/plugins/_base/core/ParameterFormat.js'));
    ({ default: ParameterDisplayPolicy } = await import('../../../../src/plugins/_base/core/ParameterDisplayPolicy.js'));
    ({ default: ParameterDisplaySentinel } = await import('../../../../src/plugins/_base/core/ParameterDisplaySentinel.js'));
    ({ default: ParameterDefinition } = await import('../../../../src/plugins/_base/models/ParameterDefinition.js'));
  });

  /**
   * Builds a definition- fields not under test (label/description/icon) are stubbed as no-ops.
   */
  function buildDefinition(format, displayPolicy, getValue = () => 0, colorIndex = () => 42)
  {
    return new ParameterDefinition(
      'stat',
      'combat',
      0,
      () => '',
      () => [],
      () => 0,
      colorIndex,
      format,
      displayPolicy,
      getValue,
      null,
    );
  }

  describe('Builder (static)', () =>
  {
    it('returns a new ParameterDefinitionBuilder instance', async () =>
    {
      // Arrange
      const { default: ParameterDefinitionBuilder } = await import('../../../../src/plugins/_base/models/ParameterDefinitionBuilder.js');

      // Act
      const result = ParameterDefinition.Builder();

      // Assert
      expect(result).toBeInstanceOf(ParameterDefinitionBuilder);
    });
  });

  describe('resolveValue', () =>
  {
    it('delegates to the getValue resolver with the given battler', () =>
    {
      // Arrange
      const battler = { atk: 42 };
      const definition = buildDefinition(ParameterFormat.FLAT, ParameterDisplayPolicy.NONE, (b) => b.atk);

      // Act
      const result = definition.resolveValue(battler);

      // Assert
      expect(result).toBe(42);
    });
  });

  describe('padSignedMagnitude (static)', () =>
  {
    it('prefixes a minus sign for negative magnitudes', () =>
    {
      // Arrange & Act
      const result = ParameterDefinition.padSignedMagnitude(-5, 3);

      // Assert
      expect(result).toBe('-005');
    });

    it('prefixes a plus sign for positive magnitudes when showPlusForPositive is true', () =>
    {
      // Arrange & Act
      const result = ParameterDefinition.padSignedMagnitude(5, 3, false, true);

      // Assert
      expect(result).toBe('+005');
    });

    it('omits any sign for positive magnitudes when showPlusForPositive is false', () =>
    {
      // Arrange & Act
      const result = ParameterDefinition.padSignedMagnitude(5, 3, false, false);

      // Assert
      expect(result).toBe('005');
    });

    it('reserves a leading space for zero when reserveSignColumn is true', () =>
    {
      // Arrange & Act
      const result = ParameterDefinition.padSignedMagnitude(0, 3, true, false);

      // Assert
      expect(result).toBe(' 000');
    });

    it('does not reserve a leading space for zero when reserveSignColumn is false', () =>
    {
      // Arrange & Act
      const result = ParameterDefinition.padSignedMagnitude(0, 3, false, false);

      // Assert
      expect(result).toBe('000');
    });
  });

  describe('displayMagnitude', () =>
  {
    it('leaves a FLAT value unscaled', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.FLAT, ParameterDisplayPolicy.NONE);

      // Act
      const result = definition.displayMagnitude(42);

      // Assert
      expect(result).toBe(42);
    });

    it('scales a PERCENT value by 100 without centering', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.PERCENT, ParameterDisplayPolicy.NONE);

      // Act
      const result = definition.displayMagnitude(0.5);

      // Assert
      expect(result).toBe(50);
    });

    it('scales and centers a PERCENT_CENTERED value around zero', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.PERCENT_CENTERED, ParameterDisplayPolicy.NONE);

      // Act
      const result = definition.displayMagnitude(1.5);

      // Assert- 1.5 * 100 - 100 = 50.
      expect(result).toBe(50);
    });

    it('scales a PERCENT_SUFFIX value by 100 without centering', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.PERCENT_SUFFIX, ParameterDisplayPolicy.NONE);

      // Act
      const result = definition.displayMagnitude(0.25);

      // Assert
      expect(result).toBe(25);
    });

    it('scales a MULTIPLIER_PERCENT value by 100 without centering', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.MULTIPLIER_PERCENT, ParameterDisplayPolicy.NONE);

      // Act
      const result = definition.displayMagnitude(0.1);

      // Assert
      expect(result).toBe(10);
    });

    it('scales a SCALED_POINTS value by 100 without centering', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.SCALED_POINTS, ParameterDisplayPolicy.NONE);

      // Act
      const result = definition.displayMagnitude(0.95);

      // Assert
      expect(result).toBe(95);
    });

    it('scales and centers a SCALED_OFFSET value around zero', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.SCALED_OFFSET, ParameterDisplayPolicy.NONE);

      // Act
      const result = definition.displayMagnitude(1.05);

      // Assert- 1.05 * 100 - 100 = 5.
      expect(result).toBe(5);
    });

    it('scales a REGEN_PER_SECOND value by 100 without centering', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.REGEN_PER_SECOND, ParameterDisplayPolicy.NONE);

      // Act
      const result = definition.displayMagnitude(0.17);

      // Assert
      expect(result).toBe(17);
    });
  });

  describe('usesSignColumn', () =>
  {
    it('returns true for COST_RATE', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.FLAT, ParameterDisplayPolicy.COST_RATE);

      // Act & Assert
      expect(definition.usesSignColumn()).toBe(true);
    });

    it('returns true for DAMAGE_RATE', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.FLAT, ParameterDisplayPolicy.DAMAGE_RATE);

      // Act & Assert
      expect(definition.usesSignColumn()).toBe(true);
    });

    it('returns true for REWARD_RATE', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.FLAT, ParameterDisplayPolicy.REWARD_RATE);

      // Act & Assert
      expect(definition.usesSignColumn()).toBe(true);
    });

    it('returns true for SIGNED', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.FLAT, ParameterDisplayPolicy.SIGNED);

      // Act & Assert
      expect(definition.usesSignColumn()).toBe(true);
    });

    it('returns false for NONE', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.FLAT, ParameterDisplayPolicy.NONE);

      // Act & Assert
      expect(definition.usesSignColumn()).toBe(false);
    });
  });

  describe('usesPlusOnPositive', () =>
  {
    it('returns true for COST_RATE', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.FLAT, ParameterDisplayPolicy.COST_RATE);

      // Act & Assert
      expect(definition.usesPlusOnPositive()).toBe(true);
    });

    it('returns true for REWARD_RATE', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.FLAT, ParameterDisplayPolicy.REWARD_RATE);

      // Act & Assert
      expect(definition.usesPlusOnPositive()).toBe(true);
    });

    it('returns true for SIGNED', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.FLAT, ParameterDisplayPolicy.SIGNED);

      // Act & Assert
      expect(definition.usesPlusOnPositive()).toBe(true);
    });

    it('returns false for DAMAGE_RATE', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.FLAT, ParameterDisplayPolicy.DAMAGE_RATE);

      // Act & Assert
      expect(definition.usesPlusOnPositive()).toBe(false);
    });
  });

  describe('clampsDisplayAtMinus100', () =>
  {
    it('returns true when the policy uses a sign column', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.FLAT, ParameterDisplayPolicy.SIGNED);

      // Act & Assert
      expect(definition.clampsDisplayAtMinus100()).toBe(true);
    });

    it('returns false when the policy does not use a sign column', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.FLAT, ParameterDisplayPolicy.NONE);

      // Act & Assert
      expect(definition.clampsDisplayAtMinus100()).toBe(false);
    });
  });

  describe('clampDisplayMagnitude', () =>
  {
    it('clamps a below-floor magnitude to -100 when the policy clamps', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.FLAT, ParameterDisplayPolicy.SIGNED);

      // Act
      const result = definition.clampDisplayMagnitude(-150);

      // Assert
      expect(result).toBe(-100);
    });

    it('leaves an above-floor magnitude unchanged when the policy clamps', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.FLAT, ParameterDisplayPolicy.SIGNED);

      // Act
      const result = definition.clampDisplayMagnitude(-50);

      // Assert
      expect(result).toBe(-50);
    });

    it('leaves the magnitude unchanged when the policy does not clamp', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.FLAT, ParameterDisplayPolicy.NONE);

      // Act
      const result = definition.clampDisplayMagnitude(-150);

      // Assert
      expect(result).toBe(-150);
    });
  });

  describe('resolveDisplaySentinel', () =>
  {
    it('returns null when the magnitude is above the floor', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.FLAT, ParameterDisplayPolicy.COST_RATE);

      // Act
      const result = definition.resolveDisplaySentinel(-50);

      // Assert
      expect(result).toBeNull();
    });

    it('returns FREE at the floor for COST_RATE', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.FLAT, ParameterDisplayPolicy.COST_RATE);

      // Act
      const result = definition.resolveDisplaySentinel(-100);

      // Assert
      expect(result).toBe(ParameterDisplaySentinel.FREE);
    });

    it('returns IMMUNE at the floor for DAMAGE_RATE', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.FLAT, ParameterDisplayPolicy.DAMAGE_RATE);

      // Act
      const result = definition.resolveDisplaySentinel(-100);

      // Assert
      expect(result).toBe(ParameterDisplaySentinel.IMMUNE);
    });

    it('returns NONE at the floor for REWARD_RATE', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.FLAT, ParameterDisplayPolicy.REWARD_RATE);

      // Act
      const result = definition.resolveDisplaySentinel(-100);

      // Assert
      expect(result).toBe(ParameterDisplaySentinel.NONE);
    });

    it('returns NONE at the floor for SIGNED', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.FLAT, ParameterDisplayPolicy.SIGNED);

      // Act
      const result = definition.resolveDisplaySentinel(-100);

      // Assert
      expect(result).toBe(ParameterDisplaySentinel.NONE);
    });

    it('returns null at the floor for a policy with no sentinel mapping', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.FLAT, ParameterDisplayPolicy.NONE);

      // Act
      const result = definition.resolveDisplaySentinel(-100);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('resolveDisplayColorIndex', () =>
  {
    it('returns 3 for a FREE sentinel', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.FLAT, ParameterDisplayPolicy.COST_RATE);

      // Act
      const result = definition.resolveDisplayColorIndex(-100);

      // Assert
      expect(result).toBe(3);
    });

    it('returns 7 for an IMMUNE sentinel', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.FLAT, ParameterDisplayPolicy.DAMAGE_RATE);

      // Act
      const result = definition.resolveDisplayColorIndex(-100);

      // Assert
      expect(result).toBe(7);
    });

    it('returns 10 for a NONE sentinel', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.FLAT, ParameterDisplayPolicy.SIGNED);

      // Act
      const result = definition.resolveDisplayColorIndex(-100);

      // Assert
      expect(result).toBe(10);
    });

    it('treats a negative DAMAGE_RATE magnitude as beneficial (3)', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.FLAT, ParameterDisplayPolicy.DAMAGE_RATE);

      // Act
      const result = definition.resolveDisplayColorIndex(-50);

      // Assert
      expect(result).toBe(3);
    });

    it('treats a positive COST_RATE magnitude as harmful (10)', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.FLAT, ParameterDisplayPolicy.COST_RATE);

      // Act
      const result = definition.resolveDisplayColorIndex(50);

      // Assert
      expect(result).toBe(10);
    });

    it('treats a zero DAMAGE_RATE/COST_RATE magnitude as neutral (0)', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.FLAT, ParameterDisplayPolicy.DAMAGE_RATE);

      // Act
      const result = definition.resolveDisplayColorIndex(0);

      // Assert
      expect(result).toBe(0);
    });

    it('treats a positive REWARD_RATE magnitude as beneficial (3)', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.FLAT, ParameterDisplayPolicy.REWARD_RATE);

      // Act
      const result = definition.resolveDisplayColorIndex(50);

      // Assert
      expect(result).toBe(3);
    });

    it('treats a negative REWARD_RATE magnitude as harmful (10)', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.FLAT, ParameterDisplayPolicy.REWARD_RATE);

      // Act
      const result = definition.resolveDisplayColorIndex(-50);

      // Assert
      expect(result).toBe(10);
    });

    it('treats a zero REWARD_RATE magnitude as neutral (0)', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.FLAT, ParameterDisplayPolicy.REWARD_RATE);

      // Act
      const result = definition.resolveDisplayColorIndex(0);

      // Assert
      expect(result).toBe(0);
    });

    it('falls back to the static colorIndex for a policy with no dynamic coloring', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.FLAT, ParameterDisplayPolicy.NONE, () => 0, () => 99);

      // Act
      const result = definition.resolveDisplayColorIndex(50);

      // Assert
      expect(result).toBe(99);
    });
  });

  describe('prettyValue', () =>
  {
    it('returns the sentinel string directly when one applies', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.FLAT, ParameterDisplayPolicy.COST_RATE);

      // Act
      const result = definition.prettyValue(-100);

      // Assert
      expect(result).toBe(ParameterDisplaySentinel.FREE);
    });

    it('renders an integer magnitude without decimals', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.FLAT, ParameterDisplayPolicy.NONE);

      // Act
      const result = definition.prettyValue(42);

      // Assert
      expect(result).toBe('42');
    });

    it('renders a non-integer magnitude to one decimal place', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.FLAT, ParameterDisplayPolicy.NONE);

      // Act
      const result = definition.prettyValue(42.5);

      // Assert
      expect(result).toBe('42.5');
    });

    it('strips a trailing .0 produced by rounding a near-integer magnitude', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.FLAT, ParameterDisplayPolicy.NONE);

      // Act
      const result = definition.prettyValue(42.04);

      // Assert
      expect(result).toBe('42');
    });

    it('appends a percent sign for percent-family formats', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.PERCENT, ParameterDisplayPolicy.NONE);

      // Act
      const result = definition.prettyValue(0.5);

      // Assert
      expect(result).toBe('50%');
    });

    it('omits the padding step when withPadding is false', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.FLAT, ParameterDisplayPolicy.NONE);

      // Act
      const result = definition.prettyValue(5, false);

      // Assert
      expect(result).toBe('5');
    });

    it('applies padding when withPadding is true', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.FLAT, ParameterDisplayPolicy.NONE);

      // Act
      const result = definition.prettyValue(5, true);

      // Assert- FLAT pads to 4 digits with no sign column.
      expect(result).toBe('0005');
    });
  });

  describe('applyPaddedDisplay', () =>
  {
    it('pads a FLAT_LARGE base to 6 digits with padZero', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.FLAT_LARGE, ParameterDisplayPolicy.NONE);

      // Act
      const result = definition.applyPaddedDisplay('42', 42);

      // Assert
      expect(result).toBe('000042');
    });

    it('pads a FLAT base to 4 digits via padSignedMagnitude', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.FLAT, ParameterDisplayPolicy.NONE);

      // Act
      const result = definition.applyPaddedDisplay('42', 42);

      // Assert
      expect(result).toBe('0042');
    });

    it('pads a SCALED_POINTS base to 4 digits via padSignedMagnitude', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.SCALED_POINTS, ParameterDisplayPolicy.NONE);

      // Act
      const result = definition.applyPaddedDisplay('42', 42);

      // Assert
      expect(result).toBe('0042');
    });

    it('pads a SCALED_OFFSET base to 4 digits via padSignedMagnitude', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.SCALED_OFFSET, ParameterDisplayPolicy.NONE);

      // Act
      const result = definition.applyPaddedDisplay('42', 42);

      // Assert
      expect(result).toBe('0042');
    });

    it('pads a PERCENT_CENTERED base to 3 digits, honoring the sign/plus rules of the policy', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.PERCENT_CENTERED, ParameterDisplayPolicy.SIGNED);

      // Act
      const result = definition.applyPaddedDisplay('42', 42);

      // Assert- SIGNED uses a sign column and a leading plus for positives.
      expect(result).toBe('+042');
    });

    it('pads a sign-column PERCENT base to 3 digits with a reserved sign column', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.PERCENT, ParameterDisplayPolicy.SIGNED);

      // Act
      const result = definition.applyPaddedDisplay('42', 42);

      // Assert
      expect(result).toBe('+042');
    });

    it('pads a non-sign-column PERCENT base to 3 digits with a plain absolute value', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.PERCENT, ParameterDisplayPolicy.NONE);

      // Act
      const result = definition.applyPaddedDisplay('42', -42);

      // Assert
      expect(result).toBe('042');
    });

    it('returns the base string unchanged for a format with no padding rule', () =>
    {
      // Arrange
      const definition = buildDefinition(ParameterFormat.REGEN_PER_SECOND, ParameterDisplayPolicy.NONE);

      // Act
      const result = definition.applyPaddedDisplay('4.0/s', 4);

      // Assert
      expect(result).toBe('4.0/s');
    });
  });
});
//endregion plugins/_base/models/parameter-definition.test.js
