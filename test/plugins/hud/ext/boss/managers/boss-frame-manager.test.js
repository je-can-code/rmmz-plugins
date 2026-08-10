//region plugins/hud/ext/boss/managers/boss-frame-manager.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('BossFrameManager (direct src import)', () =>
{
  let BossFrameManager;
  let FramedTarget;
  let FramedTargetConfiguration;

  beforeAll(async () =>
  {
    vi.resetModules();

    String.empty = '';

    ({ default: FramedTargetConfiguration } = await import('../../../../../../src/plugins/hud/ext/target/_models/FramedTargetConfiguration.js'));
    globalThis.FramedTargetConfiguration = FramedTargetConfiguration;

    ({ default: FramedTarget } = await import('../../../../../../src/plugins/hud/ext/target/_models/FramedTarget.js'));
    globalThis.FramedTarget = FramedTarget;

    // FramedTargetConfiguration's constructor defaults read this at construction time.
    globalThis.J = { HUD: { EXT: { TARGET: { Metadata: { EnableHP: true, EnableMP: true, EnableTP: true } } } } };

    globalThis.JABS_AiManager = { getBattlerByUuid: vi.fn() };
    globalThis.$gameMap = { event: vi.fn() };

    ({ default: BossFrameManager } = await import('../../../../../../src/plugins/hud/ext/boss/managers/BossFrameManager.js'));
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();

    // static-only class: fields persist across tests within this module instance, so reset
    // them by hand rather than re-importing the module for every test.
    BossFrameManager.boss = null;
    BossFrameManager.acknowledgeBossFrameRefresh();
    BossFrameManager.acknowledgeBossFrameHidden();
    BossFrameManager.acknowledgeBossFrameShown();
  });

  function makeBoss(currentHpPercent100)
  {
    const battler = { currentHpPercent100: vi.fn().mockReturnValue(currentHpPercent100), getUuid: () => 'boss-uuid' };
    return new FramedTarget('Boss', String.empty, 0, battler, new FramedTargetConfiguration());
  }

  describe('getBossFrame/setBossFrame', () =>
  {
    it('returns null when no boss has been set', () =>
    {
      // Arrange/Act
      const result = BossFrameManager.getBossFrame();

      // Assert
      expect(result).toEqual(null);
    });

    it('sets the boss and requests a refresh', () =>
    {
      // Arrange
      const boss = makeBoss(100);

      // Act
      BossFrameManager.setBossFrame(boss);

      // Assert
      expect(BossFrameManager.getBossFrame()).toBe(boss);
      expect(BossFrameManager.needsBossFrameRefresh()).toEqual(true);
    });
  });

  describe('setBossByEventId', () =>
  {
    it('throws when the eventId is falsy', () =>
    {
      // Arrange/Act/Assert
      expect(() => BossFrameManager.setBossByEventId(0)).toThrow();
    });

    it('throws when the event has no JABS battler', () =>
    {
      // Arrange
      globalThis.$gameMap.event.mockReturnValue({ getJabsBattler: () => null });

      // Act/Assert
      expect(() => BossFrameManager.setBossByEventId(5)).toThrow();
    });

    it('throws when the event id points at a slot nothing occupies', () =>
    {
      // Arrange- an id that is out of range, or that names a slot vacated by a despawned action or
      // loot event, resolves to nothing. Chaining off that is what used to turn this validation into
      // the very crash it exists to prevent.
      globalThis.$gameMap.event.mockReturnValue(undefined);

      // Act/Assert
      expect(() => BossFrameManager.setBossByEventId(5)).toThrow();
    });

    it('builds and sets a boss FramedTarget from the event JABS battler', () =>
    {
      // Arrange
      const battler = { name: () => 'Dragon', currentHpPercent100: vi.fn() };
      const jabsBattler = { getBattler: () => battler };
      globalThis.$gameMap.event.mockReturnValue({ getJabsBattler: () => jabsBattler });

      // Act
      BossFrameManager.setBossByEventId(5);

      // Assert
      const boss = BossFrameManager.getBossFrame();
      expect(boss.name).toEqual('Dragon');
      expect(boss.battler).toBe(battler);
      expect(BossFrameManager.needsBossFrameRefresh()).toEqual(true);
    });
  });

  describe('getBossGameBattler', () =>
  {
    it('returns null when there is no boss', () =>
    {
      // Arrange/Act
      const result = BossFrameManager.getBossGameBattler();

      // Assert
      expect(result).toEqual(null);
    });

    it("returns the boss's underlying battler", () =>
    {
      // Arrange
      const boss = makeBoss(100);
      BossFrameManager.setBossFrame(boss);

      // Act
      const result = BossFrameManager.getBossGameBattler();

      // Assert
      expect(result).toBe(boss.battler);
    });

    it('defers to a running encounter over whatever frame was set by hand', () =>
    {
      // Arrange- a running encounter is the authority on who the boss is; this frame is a view of
      // that fact rather than the owner of it. J-ABS-Boss is optional, which is why the frame can
      // also stand on its own, but when both exist the encounter wins.
      const encounterBattler = { name: () => 'Gluttonwolf' };
      globalThis.JabsBossManager = {
        hasActiveEncounter: () => true,
        getBossGameBattler: () => encounterBattler,
      };
      BossFrameManager.setBossFrame(makeBoss(100));

      // Act
      const result = BossFrameManager.getBossGameBattler();

      // Assert
      expect(result).toBe(encounterBattler);

      delete globalThis.JabsBossManager;
    });

    it('falls back to its own frame while the boss plugin is installed but idle', () =>
    {
      // Arrange
      globalThis.JabsBossManager = {
        hasActiveEncounter: () => false,
        getBossGameBattler: () => ({ name: () => 'Gluttonwolf' }),
      };
      const boss = makeBoss(100);
      BossFrameManager.setBossFrame(boss);

      // Act
      const result = BossFrameManager.getBossGameBattler();

      // Assert
      expect(result).toBe(boss.battler);

      delete globalThis.JabsBossManager;
    });
  });

  describe('getBossJabsBattler', () =>
  {
    it('returns null when there is no boss', () =>
    {
      // Arrange/Act
      const result = BossFrameManager.getBossJabsBattler();

      // Assert
      expect(result).toEqual(null);
    });

    it('resolves the JABS battler by the boss battler uuid', () =>
    {
      // Arrange
      const boss = makeBoss(100);
      BossFrameManager.setBossFrame(boss);
      const jabsBattler = {};
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue(jabsBattler);

      // Act
      const result = BossFrameManager.getBossJabsBattler();

      // Assert
      expect(globalThis.JABS_AiManager.getBattlerByUuid).toHaveBeenCalledWith('boss-uuid');
      expect(result).toBe(jabsBattler);
    });

    it('defers to a running encounter, which already knows which body is the boss', () =>
    {
      // Arrange
      const encounterJabsBattler = {};
      globalThis.JabsBossManager = {
        hasActiveEncounter: () => true,
        getBossJabsBattler: () => encounterJabsBattler,
      };
      BossFrameManager.setBossFrame(makeBoss(100));

      // Act
      const result = BossFrameManager.getBossJabsBattler();

      // Assert
      expect(result).toBe(encounterJabsBattler);

      delete globalThis.JabsBossManager;
    });

    it('resolves by uuid while the boss plugin is installed but idle', () =>
    {
      // Arrange
      globalThis.JabsBossManager = {
        hasActiveEncounter: () => false,
        getBossJabsBattler: () => ({}),
      };
      BossFrameManager.setBossFrame(makeBoss(100));
      const jabsBattler = {};
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue(jabsBattler);

      // Act
      const result = BossFrameManager.getBossJabsBattler();

      // Assert
      expect(result).toBe(jabsBattler);

      delete globalThis.JabsBossManager;
    });
  });

  describe('getBossHpPercent', () =>
  {
    it('returns 0 when there is no boss', () =>
    {
      // Arrange/Act
      const result = BossFrameManager.getBossHpPercent();

      // Assert
      expect(result).toEqual(0);
    });

    it("returns the boss battler's current hp percent", () =>
    {
      // Arrange
      BossFrameManager.setBossFrame(makeBoss(42));

      // Act
      const result = BossFrameManager.getBossHpPercent();

      // Assert
      expect(result).toEqual(42);
    });
  });

  describe('isBossAboveHpThreshold', () =>
  {
    it('returns false when there is no boss', () =>
    {
      // Arrange/Act
      const result = BossFrameManager.isBossAboveHpThreshold(50);

      // Assert
      expect(result).toEqual(false);
    });

    it('returns true when the boss hp is at or above the threshold', () =>
    {
      // Arrange
      BossFrameManager.setBossFrame(makeBoss(50));

      // Act
      const result = BossFrameManager.isBossAboveHpThreshold(50);

      // Assert
      expect(result).toEqual(true);
    });

    it('returns false when the boss hp is below the threshold', () =>
    {
      // Arrange
      BossFrameManager.setBossFrame(makeBoss(49));

      // Act
      const result = BossFrameManager.isBossAboveHpThreshold(50);

      // Assert
      expect(result).toEqual(false);
    });
  });

  describe('isBossBelowHpThreshold', () =>
  {
    it('returns false when there is no boss', () =>
    {
      // Arrange/Act
      const result = BossFrameManager.isBossBelowHpThreshold(50);

      // Assert
      expect(result).toEqual(false);
    });

    it('returns true when the boss hp is at or below the threshold', () =>
    {
      // Arrange
      BossFrameManager.setBossFrame(makeBoss(50));

      // Act
      const result = BossFrameManager.isBossBelowHpThreshold(50);

      // Assert
      expect(result).toEqual(true);
    });

    it('returns false when the boss hp is above the threshold', () =>
    {
      // Arrange
      BossFrameManager.setBossFrame(makeBoss(51));

      // Act
      const result = BossFrameManager.isBossBelowHpThreshold(50);

      // Assert
      expect(result).toEqual(false);
    });
  });

  describe('isBossWithinHpRange', () =>
  {
    it('returns false when there is no boss', () =>
    {
      // Arrange/Act
      const result = BossFrameManager.isBossWithinHpRange(0, 100);

      // Assert
      expect(result).toEqual(false);
    });

    it('returns true for hp genuinely inside the range', () =>
    {
      // Arrange
      BossFrameManager.setBossFrame(makeBoss(65));

      // Act
      const result = BossFrameManager.isBossWithinHpRange(50, 80);

      // Assert
      expect(result).toEqual(true);
    });

    it('returns false for hp above the range', () =>
    {
      // Arrange
      BossFrameManager.setBossFrame(makeBoss(95));

      // Act
      const result = BossFrameManager.isBossWithinHpRange(50, 80);

      // Assert
      expect(result).toEqual(false);
    });

    it('returns false for hp below the range', () =>
    {
      // Arrange
      BossFrameManager.setBossFrame(makeBoss(20));

      // Act
      const result = BossFrameManager.isBossWithinHpRange(50, 80);

      // Assert
      expect(result).toEqual(false);
    });

    it('returns true for hp exactly at either boundary', () =>
    {
      // Arrange
      BossFrameManager.setBossFrame(makeBoss(50));

      // Act
      const result = BossFrameManager.isBossWithinHpRange(50, 80);

      // Assert
      expect(result).toEqual(true);
    });
  });

  describe('refresh request lifecycle', () =>
  {
    it('reports no refresh needed by default', () =>
    {
      // Arrange/Act
      const result = BossFrameManager.needsBossFrameRefresh();

      // Assert
      expect(result).toEqual(false);
    });

    it('flags a refresh as needed on request', () =>
    {
      // Arrange/Act
      BossFrameManager.requestBossFrameRefresh();

      // Assert
      expect(BossFrameManager.needsBossFrameRefresh()).toEqual(true);
    });

    it('clears the refresh flag on acknowledgement', () =>
    {
      // Arrange
      BossFrameManager.requestBossFrameRefresh();

      // Act
      BossFrameManager.acknowledgeBossFrameRefresh();

      // Assert
      expect(BossFrameManager.needsBossFrameRefresh()).toEqual(false);
    });
  });

  describe('hide request lifecycle', () =>
  {
    it('reports no hide needed by default', () =>
    {
      // Arrange/Act
      const result = BossFrameManager.needsBossFrameHiding();

      // Assert
      expect(result).toEqual(false);
    });

    it('flags a hide as needed on request', () =>
    {
      // Arrange/Act
      BossFrameManager.requestHideBossFrame();

      // Assert
      expect(BossFrameManager.needsBossFrameHiding()).toEqual(true);
    });

    it('clears the hide flag on acknowledgement', () =>
    {
      // Arrange
      BossFrameManager.requestHideBossFrame();

      // Act
      BossFrameManager.acknowledgeBossFrameHidden();

      // Assert
      expect(BossFrameManager.needsBossFrameHiding()).toEqual(false);
    });
  });

  describe('show request lifecycle', () =>
  {
    it('reports no show needed by default', () =>
    {
      // Arrange/Act
      const result = BossFrameManager.needsBossFrameShowing();

      // Assert
      expect(result).toEqual(false);
    });

    it('flags a show as needed on request', () =>
    {
      // Arrange/Act
      BossFrameManager.requestShowBossFrame();

      // Assert
      expect(BossFrameManager.needsBossFrameShowing()).toEqual(true);
    });

    it('clears the show flag on acknowledgement', () =>
    {
      // Arrange
      BossFrameManager.requestShowBossFrame();

      // Act
      BossFrameManager.acknowledgeBossFrameShown();

      // Assert
      expect(BossFrameManager.needsBossFrameShowing()).toEqual(false);
    });
  });
});
//endregion plugins/hud/ext/boss/managers/boss-frame-manager.test.js
