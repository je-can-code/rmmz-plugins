//region plugins/omni/ext/monster/objects/_component/jabs-battler.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('JABS_Battler ext/monster augments (direct src import)', () =>
{
  let JABS_Battler;

  beforeAll(async () =>
  {
    vi.resetModules();

    // the whole source file is gated behind `if (J.HUD && J.HUD.EXT.TARGET)` at module-load time.
    globalThis.J = { HUD: { EXT: { TARGET: {} } }, OMNI: { EXT: { MONSTER: { Aliased: { JABS_Battler: new Map() } } } } };

    function StubJABSBattler()
    {
    }

    StubJABSBattler.prototype.getTargetFrameIcon = vi.fn();
    globalThis.JABS_Battler = StubJABSBattler;

    await import('../../../../../../../src/plugins/omni/ext/monster/objects/JABS_Battler.js');
    ({ JABS_Battler } = globalThis);
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
  });

  describe('getTargetFrameIcon', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const battler = new JABS_Battler();
      globalThis.J.OMNI.EXT.MONSTER.Aliased.JABS_Battler.get('getTargetFrameIcon').mockReturnValue(0);
      battler.getBattler = vi.fn().mockReturnValue({ enemy: () => ({}) });

      // Act
      battler.getTargetFrameIcon();

      // Assert
      expect(globalThis.J.OMNI.EXT.MONSTER.Aliased.JABS_Battler.get('getTargetFrameIcon')).toHaveBeenCalled();
    });

    it('uses the original icon when one was already provided', () =>
    {
      // Arrange
      const battler = new JABS_Battler();
      globalThis.J.OMNI.EXT.MONSTER.Aliased.JABS_Battler.get('getTargetFrameIcon').mockReturnValue(42);
      battler.getBattler = vi.fn();

      // Act
      const result = battler.getTargetFrameIcon();

      // Assert
      expect(result).toEqual(42);
      expect(battler.getBattler).not.toHaveBeenCalled();
    });

    it("falls back to the enemy's monster family icon when there is no original icon", () =>
    {
      // Arrange
      const battler = new JABS_Battler();
      globalThis.J.OMNI.EXT.MONSTER.Aliased.JABS_Battler.get('getTargetFrameIcon').mockReturnValue(0);
      battler.getBattler = vi.fn().mockReturnValue({ enemy: () => ({ monsterFamilyIcon: 99 }) });

      // Act
      const result = battler.getTargetFrameIcon();

      // Assert
      expect(result).toEqual(99);
    });

    it('returns 0 when there is neither an original icon nor a monster family icon', () =>
    {
      // Arrange
      const battler = new JABS_Battler();
      globalThis.J.OMNI.EXT.MONSTER.Aliased.JABS_Battler.get('getTargetFrameIcon').mockReturnValue(0);
      battler.getBattler = vi.fn().mockReturnValue({ enemy: () => ({ monsterFamilyIcon: 0 }) });

      // Act
      const result = battler.getTargetFrameIcon();

      // Assert
      expect(result).toEqual(0);
    });
  });
});
//endregion plugins/omni/ext/monster/objects/_component/jabs-battler.test.js
