//region plugins/abs/ext/shield/core/register-shield-parameters.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Shield ShieldParameterRegistration (unit, all downstream dependencies mocked)', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/shield/core/registerShieldParameters.js').default} */
  let ShieldParameterRegistration;

  /** captures every value chained onto the mocked ParameterDefinition.Builder(), per most recent build(). */
  let captures;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.TextManager = {
      sar: vi.fn(() => 'Shield Amp'),
      sarDescription: vi.fn(() => [ 'sar-line' ]),
      ser: vi.fn(() => 'Shield Eff'),
      serDescription: vi.fn(() => [ 'ser-line' ]),
    };
    globalThis.IconManager = { sar: vi.fn(() => 967), ser: vi.fn(() => 968) };
    globalThis.ParameterGroups = { SUPPORT: 'support' };
    globalThis.ParameterFormat = { MULTIPLIER_PERCENT: 'multiplier-percent' };
    globalThis.ParameterRegistry = { register: vi.fn() };
    globalThis.SdpParameterBinding = { byKey: vi.fn((key, fallback) => ({ key, fallback })) };

    globalThis.ParameterDefinition = {
      Builder: () =>
      {
        const captured = {};
        captures.push(captured);
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

    ({ default: ShieldParameterRegistration } = await import('../../../../../../src/plugins/abs/ext/shield/core/registerShieldParameters.js'));
  });

  beforeEach(() =>
  {
    captures = [];
    globalThis.ParameterRegistry.register.mockReset();
  });

  describe('registerAll', () =>
  {
    it('registers both sar and ser in the SUPPORT group', () =>
    {
      ShieldParameterRegistration.registerAll();

      expect(captures).toHaveLength(2);
      expect(captures[0].key).toBe('sar');
      expect(captures[1].key).toBe('ser');
      expect(captures[0].group).toBe('support');
      expect(captures[1].group).toBe('support');
      expect(globalThis.ParameterRegistry.register).toHaveBeenCalledTimes(2);
    });

    it('sorts sar before ser', () =>
    {
      ShieldParameterRegistration.registerAll();

      expect(captures[0].sortOrder).toBe(0);
      expect(captures[1].sortOrder).toBe(1);
    });

    it('sources sar\'s label/description/icon from TextManager/IconManager', () =>
    {
      ShieldParameterRegistration.registerAll();

      expect(captures[0].label()).toBe('Shield Amp');
      expect(captures[0].description()).toEqual([ 'sar-line' ]);
      expect(captures[0].iconIndex()).toBe(967);
    });

    it('sources ser\'s label/description/icon from TextManager/IconManager', () =>
    {
      ShieldParameterRegistration.registerAll();

      expect(captures[1].label()).toBe('Shield Eff');
      expect(captures[1].description()).toEqual([ 'ser-line' ]);
      expect(captures[1].iconIndex()).toBe(968);
    });

    it('reads sar/ser directly off the battler for getValue', () =>
    {
      ShieldParameterRegistration.registerAll();

      expect(captures[0].getValue({ sar: 1.5 })).toBe(1.5);
      expect(captures[1].getValue({ ser: 0.8 })).toBe(0.8);
    });
  });
});
//endregion plugins/abs/ext/shield/core/register-shield-parameters.test.js
