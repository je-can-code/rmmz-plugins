//region plugins/abs/ext/danger/objects/game-battler.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Danger Game_Battler (unit, all downstream dependencies mocked)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      ABS: {
        EXT: {
          DANGER: {
            DangerIndicatorIcons: {
              Worthless: 1,
              Simple: 2,
              Easy: 3,
              Average: 4,
              Hard: 5,
              Grueling: 6,
              Deadly: 7,
            },
          },
        },
      },
    };

    function Game_Battler()
    {
    }

    globalThis.Game_Battler = Game_Battler;

    await import('../../../../../../src/plugins/abs/ext/danger/objects/Game_Battler.js');
  });

  beforeEach(() =>
  {
    globalThis.$jabsEngine = { getPlayer1: vi.fn() };
  });

  /** Builds a duck-typed Game_Battler with controllable param/xparam/sparam/level. */
  function buildBattler(overrides = {})
  {
    const battler = Object.create(globalThis.Game_Battler.prototype);
    battler.param = () => 10;
    battler.xparam = () => 0.01;
    battler.sparam = (id) => (id === 1 ? 0.02 : 1);
    battler.level = 5;

    return Object.assign(battler, overrides);
  }

  describe('getPowerLevel', () =>
  {
    it('sums base/ex/sp params and level squared into a single rounded power level', () =>
    {
      // Arrange- 6 base params @10 = 60; 7 xparams @0.01*100*5 = 35; GRD @0.02*100*5 = 10;
      // PDR/MDR @1 (100%, no reduction) contribute 0 each; level(5)^2 = 25. Total = 130.
      const battler = buildBattler();

      // Act
      const result = battler.getPowerLevel();

      // Assert
      expect(result).toBe(130);
    });

    it('rewards damage-reduction (sub-100% PDR/MDR) with additional power level', () =>
    {
      // Arrange- sparam(6)/(7) at 0.9 (90%, i.e. 10% reduction) contribute (0.9*100-100)*-1*10 = 100 each.
      const battler = buildBattler({ sparam: (id) => (id === 1 ? 0.02 : 0.9) });

      // Act
      const result = battler.getPowerLevel();

      // Assert- 130 base total + 200 from the two damage-reduction params (100 each).
      expect(result).toBe(330);
    });

    it('rounds the final result', () =>
    {
      // Arrange
      const battler = buildBattler({ level: 5.5 });

      // Act
      const result = battler.getPowerLevel();

      // Assert- level^2 becomes 30.25, so the 130 baseline shifts to 135.25, rounded to 135.
      expect(result).toBe(135);
    });
  });

  describe('getDangerIndicatorIcon', () =>
  {
    /** Builds a player battler and wires $jabsEngine to return it. */
    function withPlayer(playerBattler)
    {
      globalThis.$jabsEngine.getPlayer1.mockReturnValue({ getBattler: () => playerBattler });
    }

    it('returns -1 when this battler is the player itself', () =>
    {
      // Arrange
      const battler = buildBattler();
      withPlayer(battler);

      // Act
      const result = battler.getDangerIndicatorIcon();

      // Assert
      expect(result).toBe(-1);
    });

    it.each([
      [ 0.4, 'Worthless' ],
      [ 0.6, 'Simple' ],
      [ 0.8, 'Easy' ],
      [ 1.0, 'Average' ],
      [ 1.2, 'Hard' ],
      [ 1.4, 'Grueling' ],
      [ 1.6, 'Deadly' ],
    ])('maps a power-level ratio of %s to the %s icon', (ratio, iconKey) =>
    {
      // Arrange
      const playerPowerLevel = 100;
      const battler = buildBattler();
      battler.getPowerLevel = () => Math.round(playerPowerLevel * ratio);
      const player = buildBattler();
      player.getPowerLevel = () => playerPowerLevel;
      withPlayer(player);

      // Act
      const result = battler.getDangerIndicatorIcon();

      // Assert
      expect(result).toBe(globalThis.J.ABS.EXT.DANGER.DangerIndicatorIcons[iconKey]);
    });
  });
});
//endregion plugins/abs/ext/danger/objects/game-battler.test.js
