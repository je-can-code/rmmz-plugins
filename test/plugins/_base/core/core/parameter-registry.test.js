//region plugins/_base/core/parameter-registry.test.js
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

describe('ParameterRegistry (direct src import)', () =>
{
  let ParameterRegistry;
  let ParameterDefinition;

  beforeAll(async () =>
  {
    ({ default: ParameterDefinition } = await import('../../../../../src/plugins/_base/core/models/ParameterDefinition.js'));
    ({ default: ParameterRegistry } = await import('../../../../../src/plugins/_base/core/core/ParameterRegistry.js'));
  });

  beforeEach(() =>
  {
    // registry state is held on static class fields, so each test starts from a clean slate.
    ParameterRegistry._definitions.clear();
    ParameterRegistry._groupCache.clear();
    ParameterRegistry._naturalBindings.clear();
  });

  /**
   * Builds a minimal ParameterDefinition- fields the registry itself doesn't consult
   * (label/description/icon/color/format/displayPolicy) are stubbed as no-ops.
   */
  function buildDefinition(key, group, sortOrder, getValue = () => 0, sdpBinding = null)
  {
    return new ParameterDefinition(
      key,
      group,
      sortOrder,
      () => '',
      () => [],
      () => 0,
      () => 0,
      'flat',
      'none',
      getValue,
      sdpBinding,
    );
  }

  describe('register', () =>
  {
    it('throws when the definition is not a ParameterDefinition instance', () =>
    {
      // Arrange
      const notADefinition = { key: 'atk' };

      // Act
      const attempt = () => ParameterRegistry.register(notADefinition);

      // Assert
      expect(attempt).toThrow('ParameterRegistry.register requires a ParameterDefinition instance.');
    });

    it('throws when the key is already registered', () =>
    {
      // Arrange
      const first = buildDefinition('atk', 'combat', 0);
      const duplicate = buildDefinition('atk', 'combat', 1);
      ParameterRegistry.register(first);

      // Act
      const attempt = () => ParameterRegistry.register(duplicate);

      // Assert
      expect(attempt).toThrow('ParameterRegistry: duplicate key "atk".');
    });

    it('stores the definition under its key for later lookup', () =>
    {
      // Arrange
      const definition = buildDefinition('atk', 'combat', 0);

      // Act
      ParameterRegistry.register(definition);

      // Assert
      expect(ParameterRegistry.get('atk')).toBe(definition);
    });

    it('clears the group cache so a stale byGroup result is not served after a new registration', () =>
    {
      // Arrange- prime the cache for "combat" while it's still empty.
      ParameterRegistry.byGroup('combat');
      const definition = buildDefinition('atk', 'combat', 0);

      // Act
      ParameterRegistry.register(definition);

      // Assert- the post-registration lookup recomputes rather than returning the stale empty array.
      expect(ParameterRegistry.byGroup('combat')).toEqual([ definition ]);
    });
  });

  describe('get', () =>
  {
    it('returns the registered definition for a known key', () =>
    {
      // Arrange
      const definition = buildDefinition('atk', 'combat', 0);
      ParameterRegistry.register(definition);

      // Act
      const result = ParameterRegistry.get('atk');

      // Assert
      expect(result).toBe(definition);
    });

    it('returns null for an unknown key', () =>
    {
      // Arrange & Act
      const result = ParameterRegistry.get('missing');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('has', () =>
  {
    it('returns true for a registered key', () =>
    {
      // Arrange
      ParameterRegistry.register(buildDefinition('atk', 'combat', 0));

      // Act
      const result = ParameterRegistry.has('atk');

      // Assert
      expect(result).toBe(true);
    });

    it('returns false for an unregistered key', () =>
    {
      // Arrange & Act
      const result = ParameterRegistry.has('missing');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('all', () =>
  {
    it('returns every registered definition as an array', () =>
    {
      // Arrange
      const atk = buildDefinition('atk', 'combat', 0);
      const def = buildDefinition('def', 'defensive', 0);
      ParameterRegistry.register(atk);
      ParameterRegistry.register(def);

      // Act
      const result = ParameterRegistry.all();

      // Assert
      expect(result).toEqual([ atk, def ]);
    });

    it('returns an empty array when nothing is registered', () =>
    {
      // Arrange & Act
      const result = ParameterRegistry.all();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('byGroup', () =>
  {
    it('filters to only definitions in the requested group, sorted by sortOrder', () =>
    {
      // Arrange- register out of sortOrder to prove the sort, plus a definition in another group.
      const second = buildDefinition('def', 'combat', 1);
      const first = buildDefinition('atk', 'combat', 0);
      const other = buildDefinition('mov', 'mobility', 0);
      ParameterRegistry.register(second);
      ParameterRegistry.register(first);
      ParameterRegistry.register(other);

      // Act
      const result = ParameterRegistry.byGroup('combat');

      // Assert
      expect(result).toEqual([ first, second ]);
    });

    it('returns the cached array on a repeat call instead of recomputing', () =>
    {
      // Arrange
      ParameterRegistry.register(buildDefinition('atk', 'combat', 0));
      const firstCall = ParameterRegistry.byGroup('combat');

      // Act
      const secondCall = ParameterRegistry.byGroup('combat');

      // Assert- same array reference proves the cache branch was taken, not a recompute.
      expect(secondCall).toBe(firstCall);
    });
  });

  describe('resolveValue', () =>
  {
    it('returns 0 when the key is not registered', () =>
    {
      // Arrange & Act
      const result = ParameterRegistry.resolveValue({}, 'missing');

      // Assert
      expect(result).toBe(0);
    });

    it('delegates to the definition\'s resolveValue for a registered key', () =>
    {
      // Arrange
      const battler = { atk: 42 };
      ParameterRegistry.register(buildDefinition('atk', 'combat', 0, (b) => b.atk));

      // Act
      const result = ParameterRegistry.resolveValue(battler, 'atk');

      // Assert
      expect(result).toBe(42);
    });
  });

  describe('resolveSdpPanelBonus', () =>
  {
    it('returns 0 when the key is not registered', () =>
    {
      // Arrange & Act
      const result = ParameterRegistry.resolveSdpPanelBonus({}, 'missing');

      // Assert
      expect(result).toBe(0);
    });

    it('uses sdpBinding.getBaseForSdp for the base value when the binding provides one', () =>
    {
      // Arrange
      const actor = { id: 1 };
      const sdpBinding = {
        getBaseForSdp: (a) => (a === actor ? 10 : -1),
        getPanelBonus: (a, base) => base * 2,
      };
      ParameterRegistry.register(buildDefinition('atk', 'combat', 0, () => -999, sdpBinding));

      // Act
      const result = ParameterRegistry.resolveSdpPanelBonus(actor, 'atk');

      // Assert- base came from getBaseForSdp (10), not from getValue (-999).
      expect(result).toBe(20);
    });

    it('falls back to definition.resolveValue for the base value when the binding has no getBaseForSdp', () =>
    {
      // Arrange
      const actor = { atk: 7 };
      const sdpBinding = {
        getPanelBonus: (a, base) => base + 100,
      };
      ParameterRegistry.register(buildDefinition('atk', 'combat', 0, (a) => a.atk, sdpBinding));

      // Act
      const result = ParameterRegistry.resolveSdpPanelBonus(actor, 'atk');

      // Assert- base came from resolveValue/getValue (7), not from a getBaseForSdp that doesn't exist.
      expect(result).toBe(107);
    });
  });

  describe('bindNatural', () =>
  {
    it('throws when the key was never registered', () =>
    {
      // Arrange- a binding with nowhere to attach, since no definition exists for the key.
      const binding = { getBase: () => 0 };

      // Act
      const attempt = () => ParameterRegistry.bindNatural('lst', binding);

      // Assert
      expect(attempt).toThrow('ParameterRegistry: cannot bind natural growth to unregistered key "lst".');
    });

    it('throws when the key already carries a natural binding', () =>
    {
      // Arrange
      ParameterRegistry.register(buildDefinition('lst', 'combat', 0));
      ParameterRegistry.bindNatural('lst', { getBase: () => 1 });

      // Act
      const attempt = () => ParameterRegistry.bindNatural('lst', { getBase: () => 2 });

      // Assert
      expect(attempt).toThrow('ParameterRegistry: duplicate natural binding for key "lst".');
    });

    it('stores the binding under its key for later lookup', () =>
    {
      // Arrange- a sibling key is bound too, so the lookup has to find the right one of two.
      ParameterRegistry.register(buildDefinition('lst', 'combat', 0));
      ParameterRegistry.register(buildDefinition('mst', 'combat', 1));
      const lifesteal = { getBase: () => 1 };
      const manasteal = { getBase: () => 2 };

      // Act
      ParameterRegistry.bindNatural('lst', lifesteal);
      ParameterRegistry.bindNatural('mst', manasteal);

      // Assert
      expect(ParameterRegistry.naturalBinding('lst')).toBe(lifesteal);
    });
  });

  describe('naturalBinding', () =>
  {
    it('throws for a key nothing bound, naming the key so the missing binding can be found', () =>
    {
      // Arrange- registered, but never bound.
      ParameterRegistry.register(buildDefinition('lst', 'combat', 0));

      // Act
      const attempt = () => ParameterRegistry.naturalBinding('lst');

      // Assert
      expect(attempt).toThrow('ParameterRegistry: no natural binding for key "lst"; bind it with bindNatural at boot.');
    });

    it('returns the binding bound to a key', () =>
    {
      // Arrange
      ParameterRegistry.register(buildDefinition('sar', 'support', 0));
      const binding = { getBase: () => 1 };
      ParameterRegistry.bindNatural('sar', binding);

      // Act
      const result = ParameterRegistry.naturalBinding('sar');

      // Assert
      expect(result).toBe(binding);
    });
  });

  describe('naturallyBoundKeys', () =>
  {
    it('lists only the bound keys, in the order they were bound', () =>
    {
      // Arrange- three registered, two bound, and bound out of registration order.
      ParameterRegistry.register(buildDefinition('lst', 'combat', 0));
      ParameterRegistry.register(buildDefinition('mst', 'combat', 1));
      ParameterRegistry.register(buildDefinition('tst', 'combat', 2));
      ParameterRegistry.bindNatural('tst', { getBase: () => 0 });
      ParameterRegistry.bindNatural('lst', { getBase: () => 0 });

      // Act
      const result = ParameterRegistry.naturallyBoundKeys();

      // Assert
      expect(result).toEqual([ 'tst', 'lst' ]);
    });

    it('lists nothing when nothing is bound', () =>
    {
      // Arrange
      ParameterRegistry.register(buildDefinition('lst', 'combat', 0));

      // Act
      const result = ParameterRegistry.naturallyBoundKeys();

      // Assert
      expect(result).toEqual([]);
    });
  });
});
//endregion plugins/_base/core/parameter-registry.test.js
