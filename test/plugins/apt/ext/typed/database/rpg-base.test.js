//region plugins/apt/ext/typed/database/rpg-base.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('RPG_Base ext/typed augments (direct src import)', () =>
{
  let AptitudeTeachable;
  let ApTypeKey;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      APT: {
        EXT: {
          TYPED: {
            Aliased: { RPG_Base: new Map() },
            RegExp: { AptitudeTeachableTyped: /<aptitudeTyped:(.*)>/gi },
          },
        },
      },
    };

    ({ default: AptitudeTeachable } = await import('../../../../../../src/plugins/apt/core/_models/AptitudeTeachable.js'));
    globalThis.AptitudeTeachable = AptitudeTeachable;

    // patches setApTypeKey/apTypeKey/isTyped onto the real AptitudeTeachable prototype;
    // RPG_Base.js calls t.setApTypeKey(key) on the instances it constructs.
    await import('../../../../../../src/plugins/apt/ext/typed/_models/AptitudeTeachable.js');

    ({ default: ApTypeKey } = await import('../../../../../../src/plugins/apt/ext/typed/_models/ApTypeKey.js'));

    globalThis.RPGManager = { getArraysFromNotesByRegex: vi.fn() };
    globalThis.ApManager = { resolveDomainId: vi.fn() };

    function StubRPGBase()
    {
    }

    StubRPGBase.prototype.buildAptitudeTeachings = vi.fn()
      .mockReturnValue([]);
    globalThis.RPG_Base = StubRPGBase;

    await import('../../../../../../src/plugins/apt/ext/typed/database/RPG_Base.js');
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
    globalThis.RPGManager.getArraysFromNotesByRegex.mockReturnValue([]);
    globalThis.J.APT.EXT.TYPED.Aliased.RPG_Base.get('buildAptitudeTeachings')
      .mockReturnValue([]);
  });

  describe('buildAptitudeTeachings', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const base = new globalThis.RPG_Base();

      // Act
      base.buildAptitudeTeachings();

      // Assert
      expect(globalThis.J.APT.EXT.TYPED.Aliased.RPG_Base.get('buildAptitudeTeachings')).toHaveBeenCalled();
    });

    it('returns the untyped base list when there are no typed tuples', () =>
    {
      // Arrange
      const untyped = new AptitudeTeachable(1, 5);
      globalThis.J.APT.EXT.TYPED.Aliased.RPG_Base.get('buildAptitudeTeachings')
        .mockReturnValue([ untyped ]);
      const base = new globalThis.RPG_Base();

      // Act
      const result = base.buildAptitudeTeachings();

      // Assert
      expect(result).toEqual([ untyped ]);
    });

    it('appends a resolved typed teachable for each parsed typed tuple', () =>
    {
      // Arrange
      globalThis.RPGManager.getArraysFromNotesByRegex.mockReturnValue([ [ 10, 20, 'Element', 'fire' ] ]);
      globalThis.ApManager.resolveDomainId.mockReturnValue(1);
      const base = new globalThis.RPG_Base();

      // Act
      const result = base.buildAptitudeTeachings();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].skillId).toEqual(10);
      expect(result[0].requiredAp).toEqual(20);
      expect(result[0].isTyped()).toEqual(true);
      expect(result[0].apTypeKey()).toEqual(new ApTypeKey('element', 1));
    });

    it('skips a typed tuple whose domain/name cannot be resolved', () =>
    {
      // Arrange
      globalThis.RPGManager.getArraysFromNotesByRegex.mockReturnValue([ [ 10, 20, 'bogus', 'nope' ] ]);
      globalThis.ApManager.resolveDomainId.mockReturnValue(NaN);
      const base = new globalThis.RPG_Base();

      // Act
      const result = base.buildAptitudeTeachings();

      // Assert
      expect(result).toEqual([]);
    });

    it('merges resolved typed teachables alongside the untyped base list', () =>
    {
      // Arrange
      const untyped = new AptitudeTeachable(1, 5);
      globalThis.J.APT.EXT.TYPED.Aliased.RPG_Base.get('buildAptitudeTeachings')
        .mockReturnValue([ untyped ]);
      globalThis.RPGManager.getArraysFromNotesByRegex.mockReturnValue([ [ 10, 20, 'element', 'fire' ] ]);
      globalThis.ApManager.resolveDomainId.mockReturnValue(1);
      const base = new globalThis.RPG_Base();

      // Act
      const result = base.buildAptitudeTeachings();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toBe(untyped);
    });
  });
});
//endregion plugins/apt/ext/typed/database/rpg-base.test.js
