//region plugins/abs/core/models/jabs-action-builder.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * JABS_ActionBuilder.js imports JABS_Battler and JABS_ActionOptions for JSDoc typing only (never
 * referenced as values at runtime), and constructs a real JABS_Action on build(). Only JABS_Action
 * is mocked with a behavior-preserving stub; the other two get empty stubs, per the "unit tier mocks
 * all downstream file-external dependencies" convention.
 */
describe('JABS_ActionBuilder (unit, all downstream dependencies mocked)', () =>
{
  /** @type {typeof import('../../../../../src/plugins/abs/core/models/JABS_ActionBuilder.js').default} */
  let JABS_ActionBuilder;

  beforeAll(async () =>
  {
    vi.resetModules();
    globalThis.J = {
      ABS: {
        Directions: { DOWN: 2 },
        Globals: { GlobalCooldownKey: 'gcd' },
      },
    };
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_Battler.js', () => ({ default: class {} }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_ActionOptions.js', () => ({ default: class {} }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_Action.js', () => ({
      default: class
      {
        constructor(gameAction, caster, isRetaliation, initialDirection, cooldownKey, isTerrainDamage)
        {
          this.gameAction = gameAction;
          this.caster = caster;
          this.isRetaliation = isRetaliation;
          this.initialDirection = initialDirection;
          this.cooldownKey = cooldownKey;
          this.isTerrainDamage = isTerrainDamage;
        }

        setActionOptions(actionOptions)
        {
          this.actionOptions = actionOptions;
        }
      },
    }));

    ({ default: JABS_ActionBuilder } =
      await import('../../../../../src/plugins/abs/core/models/JABS_ActionBuilder.js'));
  });

  let builder;
  beforeEach(() =>
  {
    builder = new JABS_ActionBuilder();
  });

  describe('build()', () =>
  {
    it('builds a JABS_Action with the default field values', () =>
    {
      const built = builder.build();

      expect(built.isRetaliation).toEqual(false);
      expect(built.initialDirection).toEqual(2);
      expect(built.cooldownKey).toEqual('gcd');
      expect(built.isTerrainDamage).toEqual(false);
    });

    it('builds a JABS_Action reflecting every fluent setter', () =>
    {
      const gameAction = {};
      const caster = {};
      const built = builder
        .setGameAction(gameAction)
        .setCaster(caster)
        .setIsRetaliation(true)
        .setInitialDirection(8)
        .setCooldownKey('custom-key')
        .setIsTerrainDamage(true)
        .build();

      expect(built.gameAction).toEqual(gameAction);
      expect(built.caster).toEqual(caster);
      expect(built.isRetaliation).toEqual(true);
      expect(built.initialDirection).toEqual(8);
      expect(built.cooldownKey).toEqual('custom-key');
      expect(built.isTerrainDamage).toEqual(true);
    });

    it('attaches action options onto the built action when provided', () =>
    {
      const actionOptions = {
        isActionRetaliation: () => false,
        getCooldownKey: () => 'gcd',
        isTerrainDamage: () => false,
      };
      const built = builder.setActionOptions(actionOptions).build();

      expect(built.actionOptions).toEqual(actionOptions);
    });

    it('resets the builder back to defaults after building', () =>
    {
      builder.setIsRetaliation(true).setCooldownKey('custom-key');
      builder.build();
      const secondBuild = builder.build();

      expect(secondBuild.isRetaliation).toEqual(false);
      expect(secondBuild.cooldownKey).toEqual('gcd');
    });
  });

  describe('clear()', () =>
  {
    it('resets every field back to its default', () =>
    {
      builder.setGameAction({}).setCaster({}).setIsRetaliation(true).setInitialDirection(8)
        .setCooldownKey('custom-key').setIsTerrainDamage(true);

      builder.clear();
      const built = builder.build();

      expect(built.gameAction).toBeNull();
      expect(built.caster).toBeNull();
      expect(built.isRetaliation).toEqual(false);
      expect(built.initialDirection).toEqual(2);
      expect(built.cooldownKey).toEqual('gcd');
      expect(built.isTerrainDamage).toEqual(false);
    });
  });

  describe('setActionOptions()', () =>
  {
    it('extracts and caches the retaliation, cooldown key, and terrain damage flags', () =>
    {
      const actionOptions = {
        isActionRetaliation: () => true,
        getCooldownKey: () => 'options-key',
        isTerrainDamage: () => true,
      };
      const built = builder.setActionOptions(actionOptions).build();

      expect(built.isRetaliation).toEqual(true);
      expect(built.cooldownKey).toEqual('options-key');
      expect(built.isTerrainDamage).toEqual(true);
    });

    it('returns the builder itself for fluent chaining', () =>
    {
      const actionOptions = {
        isActionRetaliation: () => false,
        getCooldownKey: () => 'gcd',
        isTerrainDamage: () => false,
      };

      expect(builder.setActionOptions(actionOptions)).toEqual(builder);
    });
  });
});
//endregion plugins/abs/core/models/jabs-action-builder.test.js
