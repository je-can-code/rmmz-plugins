//region plugins/abs/ext/speed/objects/game-battler.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Speed Game_Battler (unit, all downstream dependencies mocked)', () =>
{
  let originalInitMembers;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { SPEED: { Aliased: { Game_Battler: new Map() } } } } };

    function Game_BattlerBase()
    {
    }

    function Game_Battler()
    {
    }

    originalInitMembers = vi.fn();
    Game_Battler.prototype.initMembers = originalInitMembers;
    globalThis.Game_BattlerBase = Game_BattlerBase;
    globalThis.Game_Battler = Game_Battler;

    await import('../../../../../../src/plugins/abs/ext/speed/objects/Game_Battler.js');
  });

  beforeEach(() =>
  {
    originalInitMembers.mockReset();
  });

  function buildBattler(overrides = {})
  {
    const battler = Object.create(globalThis.Game_Battler.prototype);
    battler.getAllNotes = () => [];
    battler.initMembers();
    return Object.assign(battler, overrides);
  }

  describe('initMembers / initSpeedBoosts', () =>
  {
    it('calls the original initMembers then defaults the walk boost to zero', () =>
    {
      // Arrange
      const battler = Object.create(globalThis.Game_Battler.prototype);

      // Act
      battler.initMembers();

      // Assert
      expect(originalInitMembers).toHaveBeenCalledTimes(1);
      expect(battler.msb).toBe(0);
    });
  });

  describe('msb', () =>
  {
    it('defaults to 0 on the bare Game_BattlerBase prototype', () =>
    {
      // Arrange
      const base = Object.create(globalThis.Game_BattlerBase.prototype);

      // Act / Assert
      expect(base.msb).toBe(0);
    });

    it('reads the cached walk boost value on Game_Battler', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.setWalkSpeedBoost(15);

      // Act / Assert
      expect(battler.msb).toBe(15);
    });
  });

  describe('setWalkSpeedBoost', () =>
  {
    it('updates the cached walk boost value', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act
      battler.setWalkSpeedBoost(30);

      // Assert
      expect(battler.msb).toBe(30);
    });
  });

  describe('refreshSpeedBoosts', () =>
  {
    it('sums jabsSpeedBoost across all eligible notes', () =>
    {
      // Arrange
      const battler = buildBattler({
        getAllNotes: () => [ { jabsSpeedBoost: 10 }, { jabsSpeedBoost: 5 }, {} ],
      });

      // Act
      battler.refreshSpeedBoosts();

      // Assert
      expect(battler.msb).toBe(15);
    });

    it('defaults to zero when there are no notes with a speed boost', () =>
    {
      // Arrange
      const battler = buildBattler({ getAllNotes: () => [ {}, { jabsSpeedBoost: 0 } ] });

      // Act
      battler.refreshSpeedBoosts();

      // Assert
      expect(battler.msb).toBe(0);
    });
  });
});
//endregion plugins/abs/ext/speed/objects/game-battler.test.js
