//region plugins/_base/managers/text-manager.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('TextManager (direct src import)', () =>
{
  let ParameterRegistry;

  beforeAll(async () =>
  {
    String.empty = '';

    // vanilla RMMZ TextManager globals this file's rewardParam() reads via `this`.
    globalThis.TextManager = {
      exp: 'Experience',
      currencyUnit: 'Gold',
    };

    globalThis.$dataSystem = {
      armorTypes: [ '', 'Shield', 'Helmet' ],
      weaponTypes: [ '', 'Sword', 'Spear' ],
      skillTypes: [ '', 'Magic', 'Special' ],
      equipTypes: [ '', 'Weapon', 'Shield' ],
      elements: [ 'None', 'Fire', 'Ice' ],
    };

    ({ default: ParameterRegistry } = await import('../../../../../src/plugins/_base/core/core/ParameterRegistry.js'));
    await import('../../../../../src/plugins/_base/core/managers/TextManager.js');
  });

  describe('maxTp', () =>
  {
    it('returns "Max Tech"', () =>
    {
      expect(globalThis.TextManager.maxTp()).toBe('Max Tech');
    });
  });

  describe('har / harDescription', () =>
  {
    it('har returns "Healing Rate"', () =>
    {
      expect(globalThis.TextManager.har()).toBe('Healing Rate');
    });

    it('harDescription returns a two-line description', () =>
    {
      expect(globalThis.TextManager.harDescription()).toHaveLength(2);
    });
  });

  describe('resource', () =>
  {
    it.each([
      [ 0, 'Life' ], [ 1, 'Magi' ], [ 30, 'Tech' ],
    ])('maps paramId %i to %s', (paramId, expected) =>
    {
      expect(globalThis.TextManager.resource(paramId)).toBe(expected);
    });

    it('warns and returns String.empty for an unrecognized paramId', () =>
    {
      // Arrange
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Act
      const result = globalThis.TextManager.resource(999);

      // Assert
      expect(result).toBe('');
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('999'));
      warnSpy.mockRestore();
    });
  });

  describe('rewardParam', () =>
  {
    it.each([
      [ 0, 'Experience' ], [ 1, 'Gold' ], [ 2, 'Drop Rate' ], [ 3, 'Encounter Rate' ], [ 4, 'SDP Point Rate' ],
    ])('maps paramId %i to %s', (paramId, expected) =>
    {
      expect(globalThis.TextManager.rewardParam(paramId)).toBe(expected);
    });

    it('returns undefined for an unmapped paramId', () =>
    {
      expect(globalThis.TextManager.rewardParam(99)).toBeUndefined();
    });
  });

  describe('rewardDescription', () =>
  {
    it.each([ 0, 1, 2, 3, 4 ])('returns a two-line description for paramId %i', (paramId) =>
    {
      expect(globalThis.TextManager.rewardDescription(paramId)).toHaveLength(2);
    });

    it('returns undefined for an unmapped paramId', () =>
    {
      expect(globalThis.TextManager.rewardDescription(99)).toBeUndefined();
    });
  });

  describe('parameterLabel', () =>
  {
    it('returns the key itself when unregistered', () =>
    {
      expect(globalThis.TextManager.parameterLabel('not-a-real-key')).toBe('not-a-real-key');
    });

    it('delegates to the registered definition\'s label() when found', async () =>
    {
      // Arrange
      const { default: ParameterDefinition } = await import('../../../../../src/plugins/_base/core/models/ParameterDefinition.js');
      ParameterRegistry._definitions.clear();
      ParameterRegistry._groupCache.clear();
      ParameterRegistry.register(new ParameterDefinition(
        'probe', 'combat', 0, () => 'Probe Label', () => [], () => 0, () => 0, 'flat', 'none', () => 0, null,
      ));

      // Act & Assert
      expect(globalThis.TextManager.parameterLabel('probe')).toBe('Probe Label');
    });
  });

  describe('parameterDescription', () =>
  {
    it('returns a single empty-string line when unregistered', () =>
    {
      expect(globalThis.TextManager.parameterDescription('not-a-real-key')).toEqual([ '' ]);
    });

    it('delegates to the registered definition\'s description() when found', async () =>
    {
      // Arrange
      const { default: ParameterDefinition } = await import('../../../../../src/plugins/_base/core/models/ParameterDefinition.js');
      ParameterRegistry._definitions.clear();
      ParameterRegistry._groupCache.clear();
      ParameterRegistry.register(new ParameterDefinition(
        'probe', 'combat', 0, () => '', () => [ 'Probe desc' ], () => 0, () => 0, 'flat', 'none', () => 0, null,
      ));

      // Act & Assert
      expect(globalThis.TextManager.parameterDescription('probe')).toEqual([ 'Probe desc' ]);
    });
  });

  describe('bparamDescription', () =>
  {
    it.each([ 0, 1, 2, 3, 4, 5, 6, 7, 30 ])('returns a description for paramId %i', (paramId) =>
    {
      expect(globalThis.TextManager.bparamDescription(paramId)).toBeInstanceOf(Array);
    });

    it('returns undefined for an unmapped paramId', () =>
    {
      expect(globalThis.TextManager.bparamDescription(99)).toBeUndefined();
    });
  });

  describe('xparamDescription', () =>
  {
    it.each([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ])('returns a description for paramId %i', (paramId) =>
    {
      expect(globalThis.TextManager.xparamDescription(paramId)).toBeInstanceOf(Array);
    });

    it('returns undefined for an unmapped paramId', () =>
    {
      expect(globalThis.TextManager.xparamDescription(99)).toBeUndefined();
    });
  });

  describe('sparamDescription', () =>
  {
    it.each([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ])('returns a description for paramId %i', (paramId) =>
    {
      expect(globalThis.TextManager.sparamDescription(paramId)).toBeInstanceOf(Array);
    });

    it('returns undefined for an unmapped paramId', () =>
    {
      expect(globalThis.TextManager.sparamDescription(99)).toBeUndefined();
    });
  });

  describe('sparam', () =>
  {
    it.each([
      [ 0, 'Aggro' ], [ 1, 'Parry' ], [ 2, 'Recovery Rate' ], [ 3, 'Item Effects' ], [ 4, 'Magi Cost' ],
      [ 5, 'Tech Cost' ], [ 6, 'Phys Dmg Rate' ], [ 7, 'Magi Dmg Rate' ], [ 8, 'Env Dmg Rate' ], [ 9, 'Experience UP' ],
    ])('maps sParamId %i to %s', (sParamId, expected) =>
    {
      expect(globalThis.TextManager.sparam(sParamId)).toBe(expected);
    });

    it('returns undefined for an unmapped sParamId', () =>
    {
      expect(globalThis.TextManager.sparam(99)).toBeUndefined();
    });
  });

  describe('xparam', () =>
  {
    it.each([
      [ 0, 'Accuracy' ], [ 1, 'Phys Evade' ], [ 2, 'Crit Rate' ], [ 3, 'Crit Dodge' ], [ 4, 'Magic Evade' ],
      [ 5, 'Magic Reflect' ], [ 6, 'Autocounter' ], [ 7, 'HP Regen' ], [ 8, 'MP Rejuv' ], [ 9, 'TP Restore' ],
    ])('maps xParamId %i to %s', (xParamId, expected) =>
    {
      expect(globalThis.TextManager.xparam(xParamId)).toBe(expected);
    });

    it('returns undefined for an unmapped xParamId', () =>
    {
      expect(globalThis.TextManager.xparam(99)).toBeUndefined();
    });
  });

  describe('armorType / weaponType / skillType / equipType', () =>
  {
    it('armorType resolves from $dataSystem.armorTypes', () =>
    {
      expect(globalThis.TextManager.armorType(1)).toBe('Shield');
    });

    it('weaponType resolves from $dataSystem.weaponTypes', () =>
    {
      expect(globalThis.TextManager.weaponType(1)).toBe('Sword');
    });

    it('skillType resolves from $dataSystem.skillTypes', () =>
    {
      expect(globalThis.TextManager.skillType(1)).toBe('Magic');
    });

    it('equipType resolves from $dataSystem.equipTypes', () =>
    {
      expect(globalThis.TextManager.equipType(1)).toBe('Weapon');
    });
  });

  describe('element', () =>
  {
    it('returns the weapon-elements name for id -1', () =>
    {
      expect(globalThis.TextManager.element(-1)).toBe('(Basic Attack)');
    });

    it('returns the neutral element name for id 0', () =>
    {
      expect(globalThis.TextManager.element(0)).toBe('Neutral');
    });

    it('resolves any other id from $dataSystem.elements', () =>
    {
      expect(globalThis.TextManager.element(1)).toBe('Fire');
    });
  });

  describe('weaponElementsName / neutralElementName', () =>
  {
    it('weaponElementsName returns "(Basic Attack)"', () =>
    {
      expect(globalThis.TextManager.weaponElementsName()).toBe('(Basic Attack)');
    });

    it('neutralElementName returns "Neutral"', () =>
    {
      expect(globalThis.TextManager.neutralElementName()).toBe('Neutral');
    });
  });

  describe('getTypeNameByIdAndType', () =>
  {
    it('returns the type name at a valid id', () =>
    {
      expect(globalThis.TextManager.getTypeNameByIdAndType(1, [ '', 'Sword' ])).toBe('Sword');
    });

    it('returns String.empty for an invalid id', () =>
    {
      expect(globalThis.TextManager.getTypeNameByIdAndType(0, [ '', 'Sword' ])).toBe('');
    });
  });

  describe('isValidTypeId', () =>
  {
    it('returns false and logs when id is 0 on a non-elements type list', () =>
    {
      // Arrange
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      const result = globalThis.TextManager.isValidTypeId(0, [ '', 'Sword' ]);

      // Assert
      expect(result).toBe(false);
      errorSpy.mockRestore();
    });

    it('allows id 0 specifically for the elements type list', () =>
    {
      // Arrange
      const { elements } = globalThis.$dataSystem;

      // Act
      const result = globalThis.TextManager.isValidTypeId(0, elements);

      // Assert
      expect(result).toBe(true);
    });

    it('returns false and logs when id is out of range', () =>
    {
      // Arrange
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      const result = globalThis.TextManager.isValidTypeId(99, [ '', 'Sword' ]);

      // Assert
      expect(result).toBe(false);
      errorSpy.mockRestore();
    });

    it('returns true for a valid non-zero in-range id', () =>
    {
      expect(globalThis.TextManager.isValidTypeId(1, [ '', 'Sword' ])).toBe(true);
    });
  });

  describe('usableEffectByCode', () =>
  {
    it.each([
      [ 11, 'Recover Life' ], [ 12, 'Recover Magi' ], [ 13, 'Recover Tech' ],
      [ 21, 'Add State' ], [ 22, 'Remove State' ],
      [ 31, 'Add Buff' ], [ 32, 'Add Debuff' ], [ 33, 'Remove Buff' ], [ 34, 'Remove Debuff' ],
      [ 41, 'Special' ], [ 42, 'Core Stat Growth' ], [ 43, 'Learn Skill' ], [ 44, 'Execute Common Event' ],
    ])('maps code %i to %s', (code, expected) =>
    {
      expect(globalThis.TextManager.usableEffectByCode(code)).toBe(expected);
    });

    it('warns and returns "UNKNOWN" for an unsupported code', () =>
    {
      // Arrange
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Act
      const result = globalThis.TextManager.usableEffectByCode(999);

      // Assert
      expect(result).toBe('UNKNOWN');
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('999'));
      warnSpy.mockRestore();
    });
  });

  describe('hasParameter', () =>
  {
    it('confirms a key the catalog actually knows', () =>
    {
      // Arrange- this exists so a caller can tell "the registry has no such key" apart from a
      // legitimately falsy result: `parameterLabel`, `parameterIcon` and `parameterColor` each fall
      // back to a plausible-looking default rather than surfacing the miss.
      const known = ParameterRegistry.all()
        .at(0);

      // Act & Assert
      expect(globalThis.TextManager.hasParameter(known.key)).toBe(true);
    });

    it('denies a key nothing ever registered', () =>
    {
      // Arrange & Act & Assert
      expect(globalThis.TextManager.hasParameter('not-a-real-parameter')).toBe(false);
    });
  });
});
//endregion plugins/_base/managers/text-manager.test.js
