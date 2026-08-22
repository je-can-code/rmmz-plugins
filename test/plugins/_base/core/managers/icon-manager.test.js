//region plugins/_base/managers/icon-manager.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('IconManager (direct src import)', () =>
{
  let IconManager;
  let ParameterRegistry;

  beforeAll(async () =>
  {
    ({ default: ParameterRegistry } = await import('../../../../../src/plugins/_base/core/core/ParameterRegistry.js'));
    ({ default: IconManager } = await import('../../../../../src/plugins/_base/core/managers/IconManager.js'));
  });

  describe('constructor', () =>
  {
    it('throws because it is a static class', () =>
    {
      // Arrange & Act
      const attempt = () => new IconManager();

      // Assert
      expect(attempt).toThrow('The IconManager is a static class.');
    });
  });

  describe('level / maxTp / har', () =>
  {
    it('level returns 86', () =>
    {
      expect(IconManager.level()).toBe(86);
    });

    it('maxTp returns 930', () =>
    {
      expect(IconManager.maxTp()).toBe(930);
    });

    it('har returns 7', () =>
    {
      expect(IconManager.har()).toBe(7);
    });
  });

  describe('rewardParam', () =>
  {
    it.each([
      [ 0, 87 ], [ 1, 2048 ], [ 2, 208 ], [ 3, 914 ], [ 4, 445 ],
    ])('maps paramId %i to icon %i', (paramId, expected) =>
    {
      expect(IconManager.rewardParam(paramId)).toBe(expected);
    });

    it('returns undefined for an unmapped paramId', () =>
    {
      expect(IconManager.rewardParam(99)).toBeUndefined();
    });
  });

  describe('param', () =>
  {
    it.each([
      [ 0, 928 ], [ 1, 929 ], [ 2, 931 ], [ 3, 932 ], [ 4, 933 ], [ 5, 934 ], [ 6, 935 ], [ 7, 936 ],
    ])('maps paramId %i to icon %i', (paramId, expected) =>
    {
      expect(IconManager.param(paramId)).toBe(expected);
    });

    it('returns undefined for an unmapped paramId', () =>
    {
      expect(IconManager.param(99)).toBeUndefined();
    });
  });

  describe('xparam', () =>
  {
    it.each([
      [ 0, 944 ], [ 1, 945 ], [ 2, 946 ], [ 3, 947 ], [ 4, 948 ],
      [ 5, 949 ], [ 6, 950 ], [ 7, 951 ], [ 8, 952 ], [ 9, 953 ],
    ])('maps paramId %i to icon %i', (paramId, expected) =>
    {
      expect(IconManager.xparam(paramId)).toBe(expected);
    });

    it('returns undefined for an unmapped paramId', () =>
    {
      expect(IconManager.xparam(99)).toBeUndefined();
    });
  });

  describe('sparam', () =>
  {
    it.each([
      [ 0, 960 ], [ 1, 961 ], [ 2, 962 ], [ 3, 963 ], [ 4, 964 ],
      [ 5, 965 ], [ 6, 966 ], [ 7, 967 ], [ 8, 968 ], [ 9, 969 ],
    ])('maps paramId %i to icon %i', (paramId, expected) =>
    {
      expect(IconManager.sparam(paramId)).toBe(expected);
    });

    it('returns undefined for an unmapped paramId', () =>
    {
      expect(IconManager.sparam(99)).toBeUndefined();
    });
  });

  describe('parameterIcon', () =>
  {
    it('returns 0 when the key is not registered', () =>
    {
      expect(IconManager.parameterIcon('not-a-real-key')).toBe(0);
    });

    it('delegates to the registered definition\'s iconIndex() when found', async () =>
    {
      // Arrange
      const { default: ParameterDefinition } = await import('../../../../../src/plugins/_base/core/models/ParameterDefinition.js');
      ParameterRegistry._definitions.clear();
      ParameterRegistry._groupCache.clear();
      ParameterRegistry.register(new ParameterDefinition(
        'probe', 'combat', 0, () => '', () => [], () => 123, () => 0, 'flat', 'none', () => 0, null,
      ));

      // Act & Assert
      expect(IconManager.parameterIcon('probe')).toBe(123);
    });
  });

  describe('element', () =>
  {
    it.each([
      [ -1, 76 ], [ 0, 70 ], [ 1, 912 ], [ 2, 913 ], [ 3, 914 ], [ 4, 915 ], [ 5, 916 ],
      [ 6, 917 ], [ 7, 918 ], [ 8, 919 ], [ 9, 920 ], [ 10, 127 ], [ 11, 302 ], [ 12, 321 ],
      [ 13, 345 ], [ 14, 342 ], [ 15, 184 ], [ 16, 2112 ], [ 17, 348 ], [ 18, 82 ], [ 19, 83 ],
      [ 20, 2192 ], [ 21, 403 ], [ 22, 364 ], [ 23, 453 ], [ 24, 72 ], [ 25, 200 ], [ 26, 218 ],
      [ 27, 1904 ], [ 28, 119 ],
    ])('maps elementId %i to icon %i', (elementId, expected) =>
    {
      expect(IconManager.element(elementId)).toBe(expected);
    });

    it('returns the fallback question-mark icon for an unknown elementId', () =>
    {
      expect(IconManager.element(999)).toBe(93);
    });
  });

  describe('skillType', () =>
  {
    it.each([
      [ 1, 82 ], [ 2, 2592 ], [ 3, 77 ], [ 4, 79 ], [ 5, 188 ], [ 6, 227 ],
      [ 7, 76 ], [ 8, 2192 ],
    ])('maps skillTypeId %i to icon %i', (skillTypeId, expected) =>
    {
      expect(IconManager.skillType(skillTypeId)).toBe(expected);
    });

    it('returns 0 for an unknown skillTypeId', () =>
    {
      expect(IconManager.skillType(999)).toBe(0);
    });
  });

  describe('weaponType', () =>
  {
    it.each([
      [ 1, 401 ], [ 2, 408 ], [ 3, 438 ], [ 4, 434 ], [ 5, 442 ],
      [ 6, 461 ], [ 7, 2074 ], [ 8, 2077 ], [ 9, 2076 ], [ 10, 2075 ],
    ])('maps weaponTypeId %i to icon %i', (weaponTypeId, expected) =>
    {
      expect(IconManager.weaponType(weaponTypeId)).toBe(expected);
    });

    it('returns the fallback icon for an unknown weaponTypeId', () =>
    {
      expect(IconManager.weaponType(999)).toBe(16);
    });
  });

  describe('armorType', () =>
  {
    it('maps armorTypeId 1 to icon 16', () =>
    {
      expect(IconManager.armorType(1)).toBe(16);
    });

    it('returns the fallback icon for an unknown armorTypeId', () =>
    {
      expect(IconManager.armorType(999)).toBe(16);
    });
  });

  describe('equipType', () =>
  {
    it('maps equipTypeId 1 to icon 16', () =>
    {
      expect(IconManager.equipType(1)).toBe(16);
    });

    it('returns the fallback icon for an unknown equipTypeId', () =>
    {
      expect(IconManager.equipType(999)).toBe(16);
    });
  });

  describe('specialFlag', () =>
  {
    it('maps flagId 1 to icon 16', () =>
    {
      expect(IconManager.specialFlag(1)).toBe(16);
    });

    it('returns the fallback icon for an unknown flagId', () =>
    {
      expect(IconManager.specialFlag(999)).toBe(16);
    });
  });

  describe('partyAbility', () =>
  {
    it('maps partyAbilityId 1 to icon 16', () =>
    {
      expect(IconManager.partyAbility(1)).toBe(16);
    });

    it('returns the fallback icon for an unknown partyAbilityId', () =>
    {
      expect(IconManager.partyAbility(999)).toBe(16);
    });
  });

  describe('trait', () =>
  {
    beforeAll(() =>
    {
      globalThis.$dataStates = [];
      globalThis.$dataStates[5] = { iconIndex: 501 };
      globalThis.$dataSkills = [];
      globalThis.$dataSkills[6] = { iconIndex: 601 };
    });

    it.each([
      // element(2)=913, param(2)=931, xparam(2)=946, sparam(2)=962, skillType(3)=77,
      // weaponType(1)=401, armorType(1)=16, equipType(1)=16, specialFlag(1)=16, partyAbility(1)=16.
      [ 11, 2, 913 ],
      [ 12, 2, 931 ],
      [ 13, 5, 501 ],
      [ 14, 5, 501 ],
      [ 21, 2, 931 ],
      [ 22, 2, 946 ],
      [ 23, 2, 962 ],
      [ 31, 2, 913 ],
      [ 32, 5, 501 ],
      [ 33, 0, 79 ],
      [ 34, 0, 399 ],
      [ 35, 6, 601 ],
      [ 41, 3, 77 ],
      [ 42, 3, 77 ],
      [ 43, 6, 601 ],
      [ 44, 6, 601 ],
      [ 51, 1, 401 ],
      [ 52, 1, 16 ],
      [ 53, 1, 16 ],
      [ 54, 1, 16 ],
      [ 55, 0, 462 ],
      [ 61, 0, 76 ],
      [ 63, 0, 25 ],
      [ 62, 1, 16 ],
      [ 64, 1, 16 ],
    ])('resolves trait code %i (dataId %i) to icon %i', (code, dataId, expected) =>
    {
      const trait = { _code: code, _dataId: dataId };
      expect(IconManager.trait(trait)).toBe(expected);
    });

    it('routes trait code 52 to the armor type table rather than the equip type table', () =>
    {
      // Arrange- armorType and equipType both answer 16 for every input today, so the returned icon
      // cannot tell the two lookups apart. Standing in a sentinel for the armor table is what makes
      // "code 52 consults armor types" an actual claim instead of a coincidence of placeholder data.
      const armorSpy = vi.spyOn(IconManager, 'armorType')
        .mockReturnValue(7001);
      const trait = {
        _code: 52,
        _dataId: 4
      };

      // Act
      const result = IconManager.trait(trait);

      // Assert
      expect(result)
        .toBe(7001);
      expect(armorSpy)
        .toHaveBeenCalledWith(4);

      // restore by hand- a spy on a static of the module under test outlives this test otherwise.
      armorSpy.mockRestore();
    });

    it('routes trait code 62 to the special flag table rather than the party ability table', () =>
    {
      // Arrange- same shape as code 52: specialFlag and partyAbility are both stubbed at 16, so only
      // a sentinel proves a special flag is read as a special flag and not as a party ability.
      const specialFlagSpy = vi.spyOn(IconManager, 'specialFlag')
        .mockReturnValue(7002);
      const trait = {
        _code: 62,
        _dataId: 3
      };

      // Act
      const result = IconManager.trait(trait);

      // Assert
      expect(result)
        .toBe(7002);
      expect(specialFlagSpy)
        .toHaveBeenCalledWith(3);

      // restore by hand- see above.
      specialFlagSpy.mockRestore();
    });

    it('logs an error and returns false for an unrecognized trait code', () =>
    {
      // Arrange
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const trait = { _code: 9999, _dataId: 0 };

      // Act
      const result = IconManager.trait(trait);

      // Assert
      expect(result).toBe(false);
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('9999'));
      errorSpy.mockRestore();
    });
  });

  describe('jabsParameterIcon', () =>
  {
    it.each([
      [ 'bonus-hits', 399 ],
      [ 'speed-boost', 82 ],
      [ 'attack-skill', 76 ],
    ])('maps %s to icon %i', (type, expected) =>
    {
      expect(IconManager.jabsParameterIcon(type)).toBe(expected);
    });

    it('returns undefined for an unrecognized type', () =>
    {
      expect(IconManager.jabsParameterIcon('not-a-real-type')).toBeUndefined();
    });
  });

  describe('jaftingParameterIcon', () =>
  {
    it.each([
      [ 'max-refine-count', 86 ],
      [ 'max-trait-count', 86 ],
      [ 'not-refinement-base', 90 ],
      [ 'not-refinement-material', 90 ],
      [ 'refined-count', 223 ],
      [ 'unrefinable', 90 ],
    ])('maps %s to icon %i', (type, expected) =>
    {
      expect(IconManager.jaftingParameterIcon(type)).toBe(expected);
    });

    it('returns undefined for an unrecognized type', () =>
    {
      expect(IconManager.jaftingParameterIcon('not-a-real-type')).toBeUndefined();
    });
  });

  describe('team', () =>
  {
    it.each([
      [ 0, 38 ], [ 1, 21 ], [ 2, 91 ],
    ])('maps teamId %i to icon %i', (teamId, expected) =>
    {
      expect(IconManager.team(teamId)).toBe(expected);
    });

    it('returns undefined for an unrecognized teamId', () =>
    {
      expect(IconManager.team(999)).toBeUndefined();
    });
  });
});
//endregion plugins/_base/managers/icon-manager.test.js
