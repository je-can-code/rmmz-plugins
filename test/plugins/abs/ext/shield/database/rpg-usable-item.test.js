//region plugins/abs/ext/shield/database/rpg-usable-item.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Shield RPG_UsableItem (unit, all downstream dependencies mocked)', () =>
{
  const BYPASS_REGEX = Symbol('Bypass');
  const SHIELD_DAMAGE_REGEX = Symbol('ShieldDamage');

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { SHIELD: { RegExp: { Bypass: BYPASS_REGEX, ShieldDamage: SHIELD_DAMAGE_REGEX } } } } };
    globalThis.RPGManager = {
      getArrayFromNotesByRegex: vi.fn(),
      checkForBooleanFromNoteByRegex: vi.fn(),
      getStringsFromNoteByRegex: vi.fn(),
    };

    function RPG_UsableItem()
    {
    }

    globalThis.RPG_UsableItem = RPG_UsableItem;

    await import('../../../../../../src/plugins/abs/ext/shield/database/RPG_UsableItem.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.getArrayFromNotesByRegex.mockReset();
    globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReset();
    globalThis.RPGManager.getStringsFromNoteByRegex.mockReset();
  });

  function buildItem()
  {
    return Object.create(globalThis.RPG_UsableItem.prototype);
  }

  describe('hasShieldBypass', () =>
  {
    it('reflects the tag check result', () =>
    {
      globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReturnValue(true);
      expect(buildItem().hasShieldBypass).toBe(true);
    });
  });

  describe('shieldBypassElements', () =>
  {
    it('returns null when there is no bypass tag at all', () =>
    {
      globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReturnValue(false);
      expect(buildItem().shieldBypassElements).toBeNull();
    });

    it('returns null for the universal (parameterless) bypass form', () =>
    {
      // Arrange (mirror RPGManager's nullIfEmpty contract so the two call shapes differ; with both
      // returning null, the universal short-circuit and the parse path are indistinguishable)
      globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReturnValue(true);
      globalThis.RPGManager.getArrayFromNotesByRegex.mockImplementation((data, structure, nullIfEmpty) => (nullIfEmpty === true
        ? null
        : []));

      // Act/Assert
      expect(buildItem().shieldBypassElements).toBeNull();
    });

    it('returns the parsed element id array for a typed bypass', () =>
    {
      globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReturnValue(true);
      globalThis.RPGManager.getArrayFromNotesByRegex.mockReturnValue([ 1, 5, 7 ]);
      expect(buildItem().shieldBypassElements).toEqual([ 1, 5, 7 ]);
    });
  });

  describe('isShieldBypassUniversal', () =>
  {
    it('is false when there is no bypass tag at all', () =>
    {
      // Arrange (RPGManager hands back null for an absent tag under nullIfEmpty, which is exactly
      // what the parameterless check reads as "universal" - so the tag guard is load-bearing)
      globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReturnValue(false);
      globalThis.RPGManager.getArrayFromNotesByRegex.mockReturnValue(null);

      // Act/Assert
      expect(buildItem().isShieldBypassUniversal).toBe(false);
    });

    it('is true when the tag is parameterless', () =>
    {
      globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReturnValue(true);
      globalThis.RPGManager.getArrayFromNotesByRegex.mockReturnValue(null);
      expect(buildItem().isShieldBypassUniversal).toBe(true);
    });

    it('is false when the tag carries a typed element list', () =>
    {
      globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReturnValue(true);
      globalThis.RPGManager.getArrayFromNotesByRegex.mockReturnValue([ 1 ]);
      expect(buildItem().isShieldBypassUniversal).toBe(false);
    });
  });

  describe('shieldBonusFormulas', () =>
  {
    it('returns the parsed formula strings', () =>
    {
      globalThis.RPGManager.getStringsFromNoteByRegex.mockReturnValue([ 'a.atk*0.2' ]);
      expect(buildItem().shieldBonusFormulas).toEqual([ 'a.atk*0.2' ]);
    });

    it('defaults to an empty array when the result is not an array', () =>
    {
      globalThis.RPGManager.getStringsFromNoteByRegex.mockReturnValue(null);
      expect(buildItem().shieldBonusFormulas).toEqual([]);
    });
  });
});
//endregion plugins/abs/ext/shield/database/rpg-usable-item.test.js
