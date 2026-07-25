//region plugins/jafting/ext/refine/database/rpg-base.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('RPG_Base ext/refine augments (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { JAFTING: { EXT: { REFINE: { Aliased: { RPG_Base: new Map() } } } } };

    function StubRPGBase()
    {
    }

    StubRPGBase.prototype._generate = vi.fn();
    globalThis.RPG_Base = StubRPGBase;

    await import('../../../../../../src/plugins/jafting/ext/refine/database/RPG_Base.js');
  });

  describe('_generate', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const base = new globalThis.RPG_Base();
      const overrides = { jaftingRefinedCount: 2 };
      globalThis.J.JAFTING.EXT.REFINE.Aliased.RPG_Base.get('_generate').mockReturnValue({});

      // Act
      base._generate(overrides, 5);

      // Assert
      expect(globalThis.J.JAFTING.EXT.REFINE.Aliased.RPG_Base.get('_generate')).toHaveBeenCalledWith(overrides, 5);
    });

    it('mirrors jaftingRefinedCount from the overrides onto the generated object', () =>
    {
      // Arrange
      const base = new globalThis.RPG_Base();
      const overrides = { jaftingRefinedCount: 3 };
      globalThis.J.JAFTING.EXT.REFINE.Aliased.RPG_Base.get('_generate').mockReturnValue({});

      // Act
      const result = base._generate(overrides, 5);

      // Assert
      expect(result.jaftingRefinedCount).toEqual(3);
    });
  });
});
//endregion plugins/jafting/ext/refine/database/rpg-base.test.js
