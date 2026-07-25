//region plugins/_base/models/parameter-definition-builder.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('ParameterDefinitionBuilder (direct src import)', () =>
{
  let ParameterDefinitionBuilder;
  let ParameterDefinition;
  let ParameterFormat;
  let ParameterDisplayPolicy;
  let SdpParameterBinding;

  beforeAll(async () =>
  {
    // String.empty is a J-Base sentinel augmentation this builder's field defaults rely on.
    String.empty = '';

    ({ default: ParameterFormat } = await import('../../../../src/plugins/_base/core/ParameterFormat.js'));
    ({ default: ParameterDisplayPolicy } = await import('../../../../src/plugins/_base/core/ParameterDisplayPolicy.js'));
    ({ default: SdpParameterBinding } = await import('../../../../src/plugins/_base/models/SdpParameterBinding.js'));
    ({ default: ParameterDefinition } = await import('../../../../src/plugins/_base/models/ParameterDefinition.js'));
    ({ default: ParameterDefinitionBuilder } = await import('../../../../src/plugins/_base/models/ParameterDefinitionBuilder.js'));
  });

  describe('build', () =>
  {
    it('returns a ParameterDefinition instance', () =>
    {
      // Arrange
      const builder = new ParameterDefinitionBuilder();

      // Act
      const result = builder.build();

      // Assert
      expect(result).toBeInstanceOf(ParameterDefinition);
    });

    it('defaults key/group to empty strings and sortOrder to 0 when unset', () =>
    {
      // Arrange
      const builder = new ParameterDefinitionBuilder();

      // Act
      const definition = builder.build();

      // Assert
      expect(definition.key).toBe('');
      expect(definition.group).toBe('');
      expect(definition.sortOrder).toBe(0);
    });

    it('defaults label/description to empty-string producers when unset', () =>
    {
      // Arrange
      const builder = new ParameterDefinitionBuilder();

      // Act
      const definition = builder.build();

      // Assert
      expect(definition.label()).toBe('');
      expect(definition.description()).toEqual([ '' ]);
    });

    it('defaults iconIndex/colorIndex to zero-producers when unset', () =>
    {
      // Arrange
      const builder = new ParameterDefinitionBuilder();

      // Act
      const definition = builder.build();

      // Assert
      expect(definition.iconIndex()).toBe(0);
      expect(definition.colorIndex()).toBe(0);
    });

    it('defaults format/displayPolicy to FLAT/NONE when unset', () =>
    {
      // Arrange
      const builder = new ParameterDefinitionBuilder();

      // Act
      const definition = builder.build();

      // Assert
      expect(definition.format).toBe(ParameterFormat.FLAT);
      expect(definition.displayPolicy).toBe(ParameterDisplayPolicy.NONE);
    });

    it('defaults getValue to a zero-producer when unset', () =>
    {
      // Arrange
      const builder = new ParameterDefinitionBuilder();

      // Act
      const definition = builder.build();

      // Assert
      expect(definition.resolveValue({})).toBe(0);
    });

    it('defaults sdpBinding to SdpParameterBinding.none() when unset', () =>
    {
      // Arrange
      const builder = new ParameterDefinitionBuilder();

      // Act
      const definition = builder.build();

      // Assert
      expect(definition.sdpBinding.getPanelBonus({}, 10)).toBe(0);
    });

    it('applies every fluently-chained override to the built definition', () =>
    {
      // Arrange
      const label = () => 'ATK';
      const description = () => [ 'Attack power' ];
      const iconIndex = () => 931;
      const colorIndex = () => 3;
      const getValue = (battler) => battler.atk;
      const sdpBinding = SdpParameterBinding.custom(() => 5);
      const builder = new ParameterDefinitionBuilder();

      // Act
      const definition = builder
        .key('atk')
        .group('combat')
        .sortOrder(2)
        .label(label)
        .description(description)
        .iconIndex(iconIndex)
        .colorIndex(colorIndex)
        .format(ParameterFormat.PERCENT)
        .displayPolicy(ParameterDisplayPolicy.SIGNED)
        .getValue(getValue)
        .sdpBinding(sdpBinding)
        .build();

      // Assert
      expect(definition.key).toBe('atk');
      expect(definition.group).toBe('combat');
      expect(definition.sortOrder).toBe(2);
      expect(definition.label).toBe(label);
      expect(definition.description).toBe(description);
      expect(definition.iconIndex).toBe(iconIndex);
      expect(definition.colorIndex).toBe(colorIndex);
      expect(definition.format).toBe(ParameterFormat.PERCENT);
      expect(definition.displayPolicy).toBe(ParameterDisplayPolicy.SIGNED);
      expect(definition.resolveValue({ atk: 42 })).toBe(42);
      expect(definition.sdpBinding).toBe(sdpBinding);
    });

    it('returns the builder itself from each setter to support chaining', () =>
    {
      // Arrange
      const builder = new ParameterDefinitionBuilder();

      // Act & Assert
      expect(builder.key('k')).toBe(builder);
      expect(builder.group('g')).toBe(builder);
      expect(builder.sortOrder(1)).toBe(builder);
      expect(builder.label(() => '')).toBe(builder);
      expect(builder.description(() => [])).toBe(builder);
      expect(builder.iconIndex(() => 0)).toBe(builder);
      expect(builder.colorIndex(() => 0)).toBe(builder);
      expect(builder.format(ParameterFormat.FLAT)).toBe(builder);
      expect(builder.displayPolicy(ParameterDisplayPolicy.NONE)).toBe(builder);
      expect(builder.getValue(() => 0)).toBe(builder);
      expect(builder.sdpBinding(SdpParameterBinding.none())).toBe(builder);
    });
  });
});
//endregion plugins/_base/models/parameter-definition-builder.test.js
