//region plugins/hud/ext/boss/_models/jabs-battler.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Whether the battler in the boss frame may open the target frame as well- it may not.
 *
 * The two frames share the top of the screen, and the boss frame already shows everything the target
 * frame would for that battler. The manager is the real one, so each test arranges the boss frame exactly
 * as the game's boss setup does: a boss assigned, then shown.
 */
describe('J-HUD-BossFrame JABS_Battler (direct src import)', () =>
{
  let BossFrameManager;
  let originalCanShowTargetFrame;

  beforeAll(async () =>
  {
    vi.resetModules();

    String.empty = '';

    globalThis.J = { HUD: { EXT: { BOSS: { Aliased: { JABS_Battler: new Map() } } } } };

    function JABS_Battler()
    {
    }

    originalCanShowTargetFrame = vi.fn()
      .mockReturnValue(true);
    JABS_Battler.prototype.canShowTargetFrame = originalCanShowTargetFrame;
    globalThis.JABS_Battler = JABS_Battler;

    ({ default: BossFrameManager } = await import(
      '../../../../../../src/plugins/hud/ext/boss/managers/BossFrameManager.js'
    ));
    await import('../../../../../../src/plugins/hud/ext/boss/_models/JABS_Battler.js');
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();

    // static-only class: stand the boss frame down and clear every request between tests.
    BossFrameManager.boss = null;
    BossFrameManager.requestHideBossFrame();
    BossFrameManager.acknowledgeBossFrameRefresh();
    BossFrameManager.acknowledgeBossFrameHidden();
    BossFrameManager.acknowledgeBossFrameShown();
  });

  /**
   * Builds a JABS battler carrying the given uuid.
   * @param {string} uuid The battler's uuid.
   * @returns {JABS_Battler}
   */
  function buildJabsBattler(uuid)
  {
    const jabsBattler = Object.create(globalThis.JABS_Battler.prototype);
    jabsBattler.getUuid = () => uuid;

    return jabsBattler;
  }

  /**
   * Puts a boss in the boss frame and shows it, as the game's boss setup does.
   */
  function frameBoss()
  {
    BossFrameManager.setBossFrame({ battler: { getUuid: () => 'boss-uuid' } });
    BossFrameManager.requestShowBossFrame();
  }

  describe('canShowTargetFrame', () =>
  {
    it('keeps the target frame closed for the boss in the boss frame', () =>
    {
      // Arrange
      frameBoss();
      const boss = buildJabsBattler('boss-uuid');

      // Act
      const result = boss.canShowTargetFrame();

      // Assert
      expect(result).toBe(false);
      expect(originalCanShowTargetFrame).not.toHaveBeenCalled();
    });

    it('leaves anyone else to the target frame\'s own rules while the boss is framed', () =>
    {
      // Arrange- the boss frame is up, so the add gets through only because it is not the boss.
      frameBoss();
      const add = buildJabsBattler('add-uuid');

      // Act
      const result = add.canShowTargetFrame();

      // Assert
      expect(result).toBe(true);
      expect(originalCanShowTargetFrame).toHaveBeenCalledTimes(1);
    });
  });
});
//endregion plugins/hud/ext/boss/_models/jabs-battler.test.js
