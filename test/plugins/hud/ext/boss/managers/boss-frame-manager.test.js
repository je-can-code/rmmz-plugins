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

    // a hide request is the only way to stand the frame down; the acknowledgement below clears the request.
    BossFrameManager.requestHideBossFrame();
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
      // Arrange/Act/Assert- the message is pinned because every one of these validations also has a
      // crash waiting one line further down. A bare toThrow() cannot tell the deliberate refusal
      // apart from the TypeError it exists to prevent, and those two are the whole difference.
      expect(() => BossFrameManager.setBossByEventId(0)).toThrow('Failed to create boss for boss frame.');
    });

    it('throws when the event has no JABS battler', () =>
    {
      // Arrange
      globalThis.$gameMap.event.mockReturnValue({ getJabsBattler: () => null });

      // Act/Assert
      expect(() => BossFrameManager.setBossByEventId(5)).toThrow('Failed to create boss for boss frame.');
    });

    it('throws when the event id points at a slot nothing occupies', () =>
    {
      // Arrange- an id that is out of range, or that names a slot vacated by a despawned action or
      // loot event, resolves to nothing. Chaining off that is what used to turn this validation into
      // the very crash it exists to prevent.
      globalThis.$gameMap.event.mockReturnValue(undefined);

      // Act/Assert
      expect(() => BossFrameManager.setBossByEventId(5)).toThrow('Failed to create boss for boss frame.');
    });

    it('builds and sets a boss FramedTarget from the event JABS battler', () =>
    {
      // Arrange
      const battler = { name: () => 'Dragon', currentHpPercent100: vi.fn() };
      const jabsBattler = { getBattler: () => battler, decorateFramedTarget: vi.fn() };
      globalThis.$gameMap.event.mockReturnValue({ getJabsBattler: () => jabsBattler });

      // Act
      BossFrameManager.setBossByEventId(5);

      // Assert
      const boss = BossFrameManager.getBossFrame();
      expect(boss.name).toEqual('Dragon');
      expect(boss.battler).toBe(battler);
      expect(BossFrameManager.needsBossFrameRefresh()).toEqual(true);
    });

    it('runs the boss through the same decoration a framed target gets, and keeps what it adds', () =>
    {
      // Arrange- a decorator standing in for J-Passive-Affix, adding a tier the way it would.
      const battler = { name: () => 'Hard Syrup', currentHpPercent100: vi.fn() };
      const decorateFramedTarget = vi.fn((framedTarget) =>
      {
        framedTarget.name = `Prime ${framedTarget.name}`;
        framedTarget.nameIconIndices = [ 5 ];
        framedTarget.nameColorHex = '#1e3a8a';
      });
      const jabsBattler = { getBattler: () => battler, decorateFramedTarget };
      globalThis.$gameMap.event.mockReturnValue({ getJabsBattler: () => jabsBattler });

      // Act
      BossFrameManager.setBossByEventId(5);

      // Assert
      const boss = BossFrameManager.getBossFrame();
      expect(decorateFramedTarget).toHaveBeenCalledWith(boss, jabsBattler);
      expect(boss.name).toEqual('Prime Hard Syrup');
      expect(boss.nameIconIndices).toEqual([ 5 ]);
      expect(boss.nameColorHex).toEqual('#1e3a8a');
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

  describe('isBossFrameActive', () =>
  {
    it('reports the boss frame inactive until it is shown', () =>
    {
      // Arrange/Act
      const result = BossFrameManager.isBossFrameActive();

      // Assert
      expect(result).toEqual(false);
    });

    it('reports the boss frame active once it is shown', () =>
    {
      // Arrange
      BossFrameManager.requestShowBossFrame();

      // Act
      const result = BossFrameManager.isBossFrameActive();

      // Assert
      expect(result).toEqual(true);
    });

    it('keeps the boss frame active after the show request is acknowledged', () =>
    {
      // Arrange- the request clears the moment the frame acts on it; the frame being up does not.
      BossFrameManager.requestShowBossFrame();
      BossFrameManager.acknowledgeBossFrameShown();

      // Act
      const result = BossFrameManager.isBossFrameActive();

      // Assert
      expect(result).toEqual(true);
    });

    it('reports the boss frame inactive once it is asked to hide', () =>
    {
      // Arrange
      BossFrameManager.requestShowBossFrame();
      BossFrameManager.requestHideBossFrame();

      // Act
      const result = BossFrameManager.isBossFrameActive();

      // Assert
      expect(result).toEqual(false);
    });
  });

  describe('isFramingBattler', () =>
  {
    it('frames nobody while the boss frame is not up, even the assigned boss', () =>
    {
      // Arrange
      BossFrameManager.setBossFrame(makeBoss(100));
      const bossJabsBattler = { getUuid: () => 'boss-uuid' };

      // Act
      const result = BossFrameManager.isFramingBattler(bossJabsBattler);

      // Assert
      expect(result).toEqual(false);
    });

    it('frames nobody when the boss frame is up with no boss assigned', () =>
    {
      // Arrange
      BossFrameManager.requestShowBossFrame();
      const jabsBattler = { getUuid: () => 'boss-uuid' };

      // Act
      const result = BossFrameManager.isFramingBattler(jabsBattler);

      // Assert
      expect(result).toEqual(false);
    });

    it('frames the assigned boss while the boss frame is up', () =>
    {
      // Arrange
      BossFrameManager.setBossFrame(makeBoss(100));
      BossFrameManager.requestShowBossFrame();
      const bossJabsBattler = { getUuid: () => 'boss-uuid' };

      // Act
      const result = BossFrameManager.isFramingBattler(bossJabsBattler);

      // Assert
      expect(result).toEqual(true);
    });

    it('does not frame some other battler fighting alongside the boss', () =>
    {
      // Arrange
      BossFrameManager.setBossFrame(makeBoss(100));
      BossFrameManager.requestShowBossFrame();
      const addJabsBattler = { getUuid: () => 'add-uuid' };

      // Act
      const result = BossFrameManager.isFramingBattler(addJabsBattler);

      // Assert
      expect(result).toEqual(false);
    });
  });

  describe('targetFrameY', () =>
  {
    it('rests the target frame where it usually sits while no boss is framed', () =>
    {
      // Arrange/Act
      const result = BossFrameManager.targetFrameY(20, 120);

      // Assert
      expect(result).toEqual(20);
    });

    it('drops the target frame to just below the boss frame while it is up', () =>
    {
      // Arrange
      BossFrameManager.requestShowBossFrame();

      // Act
      const result = BossFrameManager.targetFrameY(20, 120);

      // Assert
      expect(result).toEqual(120);
    });
  });
});
//endregion plugins/hud/ext/boss/managers/boss-frame-manager.test.js
