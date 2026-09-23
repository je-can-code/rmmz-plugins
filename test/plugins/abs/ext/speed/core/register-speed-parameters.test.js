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
    globalThis.ParameterGroups = { SUPPORT: 'support' };
    globalThis.ParameterFormat = { FLAT: 'flat' };
    globalThis.ParameterRegistry = { register: vi.fn(), bindNatural: vi.fn() };

    globalThis.SdpParameterBinding = { byKey: vi.fn((key, fallback) => ({ key, fallback })) };

    // the real binding model, which is plain data and needs nothing of its own.
    ({ default: globalThis.NaturalParameterBinding } = await import('../../../../../../src/plugins/_base/core/models/NaturalParameterBinding.js'));

    // stand-in tags, each its own object, so a binding can be checked by identity against the right one.
    globalThis.J = {
      ABS: {
        EXT: {
          SPEED: {
            RegExp: {
              WalkSpeedBoostBuffPlus: /<msbBuffPlus>/,
              WalkSpeedBoostBuffRate: /<msbBuffRate>/,
              WalkSpeedBoostGrowthPlus: /<msbGrowthPlus>/,
              WalkSpeedBoostGrowthRate: /<msbGrowthRate>/,
            },
          },
        },
      },
    };

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
    globalThis.ParameterRegistry.bindNatural.mockReset();
  });

  describe('registerAll', () =>
  {
    it('registers the msb parameter in the SUPPORT group at sort order 2', () =>
    {
      // Act
      SpeedParameterRegistration.registerAll();

      // Assert: movement joined the support group when the two-stat "Haste" group was dissolved, and
      // takes sort order 2 so it falls in behind the shield pair already sitting at 0 and 1.
      expect(captured.key).toBe('msb');
      expect(captured.group).toBe('support');
      expect(captured.sortOrder).toBe(2);
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

    it('defaults the msb sdp binding fallback to 0', () =>
    {
      // Act
      SpeedParameterRegistration.registerAll();

      // Assert
      expect(captured.sdpBinding.fallback()).toBe(0);
    });

    it('binds msb natural growth to the four move speed tags', () =>
    {
      // Arrange- four distinct stand-ins, so a transposed pair would be caught.
      const { RegExp: tags } = globalThis.J.ABS.EXT.SPEED;

      // Act
      SpeedParameterRegistration.registerAll();

      // Assert
      const [ [ key, binding ] ] = globalThis.ParameterRegistry.bindNatural.mock.calls;
      expect(key).toBe('msb');
      expect(binding.buffPlus).toBe(tags.WalkSpeedBoostBuffPlus);
      expect(binding.buffRate).toBe(tags.WalkSpeedBoostBuffRate);
      expect(binding.growthPlus).toBe(tags.WalkSpeedBoostGrowthPlus);
      expect(binding.growthRate).toBe(tags.WalkSpeedBoostGrowthRate);
    });

    it('grows msb against the boost its own tags produce, not the finished speed', () =>
    {
      // Arrange- the finished speed would include natural bonuses, which are what the base feeds.
      const battler = { walkSpeedBoost: () => 20, msb: 99 };

      // Act
      SpeedParameterRegistration.registerAll();

      // Assert
      const [ [ , binding ] ] = globalThis.ParameterRegistry.bindNatural.mock.calls;
      expect(binding.getBase(battler)).toBe(20);
    });
  });
});
//endregion plugins/abs/ext/speed/core/register-speed-parameters.test.js
