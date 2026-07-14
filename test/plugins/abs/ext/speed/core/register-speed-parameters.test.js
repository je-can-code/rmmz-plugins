//region plugins/abs/ext/speed/core/register-speed-parameters.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Speed SpeedParameterRegistration (unit, all downstream dependencies mocked)', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/speed/core/registerSpeedParameters.js').default} */
  let SpeedParameterRegistration;

  /** captures every value chained onto the mocked ParameterDefinition.Builder(). */
  let captured;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.TextManager = { movespeed: vi.fn(() => 'Move Boost'), moveSpeedDescription: vi.fn(() => [ 'line' ]) };
    globalThis.IconManager = { movespeed: vi.fn(() => 978) };
    globalThis.ParameterGroups = { MOBILITY: 'mobility' };
    globalThis.ParameterFormat = { FLAT: 'flat' };
    globalThis.ParameterRegistry = { register: vi.fn() };

    globalThis.SdpParameterBinding = { byKey: vi.fn((key, fallback) => ({ key, fallback })) };

    globalThis.ParameterDefinition = {
      Builder: () =>
      {
        const builder = {};
        [ 'key', 'group', 'sortOrder', 'label', 'description', 'iconIndex', 'format', 'getValue', 'sdpBinding' ]
          .forEach(method =>
          {
            builder[method] = vi.fn((value) =>
            {
              captured[method] = value;
              return builder;
            });
          });
        builder.build = vi.fn(() => ({ built: true, ...captured }));
        return builder;
      },
    };

    ({ default: SpeedParameterRegistration } = await import('../../../../../../src/plugins/abs/ext/speed/core/registerSpeedParameters.js'));
  });

  beforeEach(() =>
  {
    captured = {};
    globalThis.ParameterRegistry.register.mockReset();
  });

  describe('registerAll', () =>
  {
    it('registers the msb parameter in the MOBILITY group at sort order 0', () =>
    {
      // Act
      SpeedParameterRegistration.registerAll();

      // Assert
      expect(captured.key).toBe('msb');
      expect(captured.group).toBe('mobility');
      expect(captured.sortOrder).toBe(0);
      expect(captured.format).toBe('flat');
      expect(globalThis.SdpParameterBinding.byKey).toHaveBeenCalledWith('msb', expect.any(Function));
      expect(globalThis.ParameterRegistry.register).toHaveBeenCalledWith(expect.objectContaining({ built: true }));
    });

    it('sources its label/description/icon from TextManager/IconManager', () =>
    {
      // Act
      SpeedParameterRegistration.registerAll();

      // Assert
      expect(captured.label()).toBe('Move Boost');
      expect(captured.description()).toEqual([ 'line' ]);
      expect(captured.iconIndex()).toBe(978);
    });

    it('reads the msb property directly from the battler for getValue', () =>
    {
      // Act
      SpeedParameterRegistration.registerAll();

      // Assert
      expect(captured.getValue({ msb: 42 })).toBe(42);
    });
  });
});
//endregion plugins/abs/ext/speed/core/register-speed-parameters.test.js
