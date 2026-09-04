//region plugins/abs/core/models/jabs-action-options.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('JABS_Location / JABS_ActionOptions / JABS_ActionOptionsBuilder (direct src import)', () =>
{
  let JABS_Location;
  let JABS_ActionOptions;
  let JABS_ActionOptionsBuilder;

  beforeAll(async () =>
  {
    globalThis.J = { ABS: { Globals: { GlobalCooldownKey: 'global' } } };

    // JABS_ActionOptions.js imports JABS_Action.js purely for a JSDoc @link reference- mocked
    // here so this file doesn't have to drag in JABS_Action's full real dependency tree
    // (sprites, RMMZ core classes, etc.) just to test options/builder data-holder logic.
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_Action.js', () => ({ default: class {} }));

    ({ default: JABS_Location } = await import('../../../../../src/plugins/abs/core/models/JABS_Location.js'));
    ({ default: JABS_ActionOptions } = await import('../../../../../src/plugins/abs/core/models/JABS_ActionOptions.js'));
    ({ default: JABS_ActionOptionsBuilder } = await import(
      '../../../../../src/plugins/abs/core/models/JABS_ActionOptionsBuilder.js'
    ));
  });

  describe('JABS_Location', () =>
  {
    it('getX/getY/getD reflect the constructed coordinates and direction', () =>
    {
      // Arrange
      const location = new JABS_Location(3, 4, 6);

      // Act & Assert
      expect(location.getX()).toBe(3);
      expect(location.getY()).toBe(4);
      expect(location.getD()).toBe(6);
    });

    it('Clone copies x/y/d from another instance', () =>
    {
      // Arrange
      const source = new JABS_Location(1, 2, 8);

      // Act
      const clone = JABS_Location.Clone(source);

      // Assert
      expect(clone).not.toBe(source);
      expect(clone.x).toBe(1);
      expect(clone.y).toBe(2);
      expect(clone.d).toBe(8);
    });

    it('Builder returns a fresh JABS_LocationBuilder', () =>
    {
      const builder = JABS_Location.Builder();
      expect(builder.build()).toBeInstanceOf(JABS_Location);
    });
  });

  describe('JABS_ActionOptions', () =>
  {
    it('every getter reflects the value provided at construction', () =>
    {
      // Arrange
      const location = new JABS_Location(1, 1, 2);
      const retaliationTarget = { tag: 'battler' };

      // Act
      const options = new JABS_ActionOptions(true, 'special', location, true, 2, 3, 45, retaliationTarget);

      // Assert
      expect(options.isActionRetaliation()).toBe(true);
      expect(options.getCooldownKey()).toBe('special');
      expect(options.getTargetLocation()).toBe(location);
      expect(options.isTerrainDamage()).toBe(true);
      expect(options.getSpawnOffsetX()).toBe(2);
      expect(options.getSpawnOffsetY()).toBe(3);
      expect(options.getProjectileTravelAngleDegrees()).toBe(45);
      expect(options.getRetaliationTarget()).toBe(retaliationTarget);
    });

    it('defaults spawn offsets, travel angle, and retaliation target when omitted', () =>
    {
      // Act
      const options = new JABS_ActionOptions(false, 'global', new JABS_Location(), false);

      // Assert
      expect(options.getSpawnOffsetX()).toBe(0);
      expect(options.getSpawnOffsetY()).toBe(0);
      expect(options.getProjectileTravelAngleDegrees()).toBeNull();
      expect(options.getRetaliationTarget()).toBeNull();
    });

    it('Default builds an all-default instance via the builder', () =>
    {
      // Act
      const options = JABS_ActionOptions.Default();

      // Assert
      expect(options.isActionRetaliation()).toBe(false);
      expect(options.getCooldownKey()).toBe('global');
      expect(options.isTerrainDamage()).toBe(false);
    });

    it('Builder returns a fresh JABS_ActionOptionsBuilder', () =>
    {
      expect(JABS_ActionOptions.Builder()).toBeInstanceOf(JABS_ActionOptionsBuilder);
    });

    it('withLocation swaps the location while preserving every other option', () =>
    {
      // Arrange- every field is given a distinctive non-default value, so any one of them being
      // dropped by the rebuild is visible rather than hiding behind a matching default.
      const retaliationTarget = { tag: 'battler' };
      const original = new JABS_ActionOptions(
        true,
        'special',
        new JABS_Location(1, 1, 2),
        true,
        2,
        3,
        45,
        retaliationTarget);

      // Act
      const swapped = original.withLocation(new JABS_Location(9, 8, 6));

      // Assert
      expect(swapped.getTargetLocation()).toMatchObject({ x: 9, y: 8, d: 6 });
      expect(swapped.isActionRetaliation()).toBe(true);
      expect(swapped.getCooldownKey()).toBe('special');
      expect(swapped.isTerrainDamage()).toBe(true);
      expect(swapped.getSpawnOffsetX()).toBe(2);
      expect(swapped.getSpawnOffsetY()).toBe(3);
      expect(swapped.getProjectileTravelAngleDegrees()).toBe(45);
      expect(swapped.getRetaliationTarget()).toBe(retaliationTarget);
    });

    it('withLocation leaves the original options untouched', () =>
    {
      // Arrange- options are immutable once built; the swap must produce a copy rather than
      // reach back into the instance it was called on.
      const original = new JABS_ActionOptions(false, 'global', new JABS_Location(1, 1, 2), false);

      // Act
      const swapped = original.withLocation(new JABS_Location(9, 8, 6));

      // Assert
      expect(swapped).not.toBe(original);
      expect(original.getTargetLocation()).toMatchObject({ x: 1, y: 1, d: 2 });
    });
  });

  describe('JABS_ActionOptionsBuilder', () =>
  {
    it('builds options from every fluent setter', () =>
    {
      // Arrange
      const location = new JABS_Location(5, 6, 4);
      const retaliationTarget = { tag: 'battler' };
      const builder = new JABS_ActionOptionsBuilder();

      // Act
      const options = builder
        .setIsRetaliation(true)
        .setCooldownKey('custom')
        .setLocation(location)
        .setIsTerrainDamage(true)
        .setSpawnOffset(1, 2)
        .setProjectileTravelAngleDegrees(90)
        .setRetaliationTarget(retaliationTarget)
        .build();

      // Assert
      expect(options.isActionRetaliation()).toBe(true);
      expect(options.getCooldownKey()).toBe('custom');
      expect(options.getTargetLocation()).not.toBe(location);
      expect(options.getTargetLocation()).toMatchObject({ x: 5, y: 6, d: 4 });
      expect(options.isTerrainDamage()).toBe(true);
      expect(options.getSpawnOffsetX()).toBe(1);
      expect(options.getSpawnOffsetY()).toBe(2);
      expect(options.getProjectileTravelAngleDegrees()).toBe(90);
      expect(options.getRetaliationTarget()).toBe(retaliationTarget);
    });

    it('defaults to an empty location when none is set', () =>
    {
      // Arrange
      const builder = new JABS_ActionOptionsBuilder();

      // Act
      const options = builder.build();

      // Assert
      expect(options.getTargetLocation()).toMatchObject({ x: null, y: null, d: null });
    });

    it('clears the internal state after building', () =>
    {
      // Arrange
      const builder = new JABS_ActionOptionsBuilder();
      builder.setIsRetaliation(true)
        .setCooldownKey('custom');
      builder.build();

      // Act
      const second = builder.build();

      // Assert
      expect(second.isActionRetaliation()).toBe(false);
      expect(second.getCooldownKey()).toBe('global');
    });

    it('clear resets the builder for re-use', () =>
    {
      // Arrange
      const builder = new JABS_ActionOptionsBuilder();
      builder.setIsRetaliation(true)
        .setIsTerrainDamage(true);

      // Act
      builder.clear();
      const options = builder.build();

      // Assert
      expect(options.isActionRetaliation()).toBe(false);
      expect(options.isTerrainDamage()).toBe(false);
    });
  });
});
//endregion plugins/abs/core/models/jabs-action-options.test.js
