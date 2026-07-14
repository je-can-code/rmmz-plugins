//region plugins/abs/ext/shield/objects/game-battler.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Shield Game_Battler (unit, all downstream dependencies mocked)', () =>
{
  let originalInitMembers;
  let originalOnBattlerDataChange;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      ABS: {
        EXT: {
          SHIELD: {
            Aliased: { Game_Battler: new Map() },
            RegExp: { ShieldAmplification: Symbol('ShieldAmplification'), ShieldEffectiveness: Symbol('ShieldEffectiveness') },
          },
        },
      },
    };
    globalThis.RPGManager = { getSumFromAllNotesByRegex: vi.fn(() => 0) };

    function Game_BattlerBase()
    {
    }

    function Game_Battler()
    {
    }

    originalInitMembers = vi.fn();
    originalOnBattlerDataChange = vi.fn();
    Game_Battler.prototype.initMembers = originalInitMembers;
    Game_Battler.prototype.onBattlerDataChange = originalOnBattlerDataChange;
    Game_Battler.prototype.getAllNotes = () => [];
    globalThis.Game_BattlerBase = Game_BattlerBase;
    globalThis.Game_Battler = Game_Battler;

    await import('../../../../../../src/plugins/abs/ext/shield/objects/Game_Battler.js');
  });

  beforeEach(() =>
  {
    originalInitMembers.mockReset();
    originalOnBattlerDataChange.mockReset();
    globalThis.RPGManager.getSumFromAllNotesByRegex.mockReset().mockReturnValue(0);
  });

  function buildBattler(overrides = {})
  {
    const battler = Object.create(globalThis.Game_Battler.prototype);
    battler.initMembers();
    return Object.assign(battler, overrides);
  }

  describe('initMembers', () =>
  {
    it('calls the original then defaults both caches to cold (null)', () =>
    {
      const battler = Object.create(globalThis.Game_Battler.prototype);
      battler.initMembers();
      expect(originalInitMembers).toHaveBeenCalledTimes(1);
      expect(battler.getCachedSarFactor()).toBeNull();
      expect(battler.getCachedSerFactor()).toBeNull();
    });
  });

  describe('cached factor getters/setters', () =>
  {
    it('track the sar cache independently of the ser cache', () =>
    {
      const battler = buildBattler();
      battler.setCachedSarFactor(1.5);
      expect(battler.getCachedSarFactor()).toBe(1.5);
      expect(battler.getCachedSerFactor()).toBeNull();
    });
  });

  describe('onBattlerDataChange', () =>
  {
    it('performs the original logic then invalidates both caches', () =>
    {
      const battler = buildBattler();
      battler.setCachedSarFactor(1.5);
      battler.setCachedSerFactor(0.8);

      battler.onBattlerDataChange();

      expect(originalOnBattlerDataChange).toHaveBeenCalledTimes(1);
      expect(battler.getCachedSarFactor()).toBeNull();
      expect(battler.getCachedSerFactor()).toBeNull();
    });
  });

  describe('Game_BattlerBase sar / ser', () =>
  {
    it('both default to 1.0 baseline', () =>
    {
      const base = Object.create(globalThis.Game_BattlerBase.prototype);
      expect(base.sar).toBe(1.0);
      expect(base.ser).toBe(1.0);
    });
  });

  describe('Game_Battler sar / ser', () =>
  {
    it('sar adds the SDP bonus on top of the base factor when available', () =>
    {
      const battler = buildBattler({ getSdpBonusForParameterKey: () => 0.2 });
      battler.baseSarFactor = () => 1.5;
      expect(battler.sar).toBeCloseTo(1.7);
    });

    it('sar is just the base factor when there is no SDP bonus hook', () =>
    {
      const battler = buildBattler();
      battler.baseSarFactor = () => 1.5;
      expect(battler.sar).toBe(1.5);
    });

    it('ser adds the SDP bonus on top of the base factor when available', () =>
    {
      const battler = buildBattler({ getSdpBonusForParameterKey: () => 0.1 });
      battler.baseSerFactor = () => 1.2;
      expect(battler.ser).toBeCloseTo(1.3);
    });
  });

  describe('baseSarFactor', () =>
  {
    it('computes and caches from the summed shield-amplification notes', () =>
    {
      globalThis.RPGManager.getSumFromAllNotesByRegex.mockReturnValue(25);
      const battler = buildBattler();

      const result = battler.baseSarFactor();

      expect(result).toBeCloseTo(1.25);
      expect(battler.getCachedSarFactor()).toBeCloseTo(1.25);
    });

    it('returns the cached value without recomputing on a second call', () =>
    {
      globalThis.RPGManager.getSumFromAllNotesByRegex.mockReturnValue(25);
      const battler = buildBattler();
      battler.baseSarFactor();

      globalThis.RPGManager.getSumFromAllNotesByRegex.mockReturnValue(999);
      const second = battler.baseSarFactor();

      expect(second).toBeCloseTo(1.25);
    });
  });

  describe('baseSerFactor', () =>
  {
    it('computes and caches from the summed shield-effectiveness notes', () =>
    {
      globalThis.RPGManager.getSumFromAllNotesByRegex.mockReturnValue(-10);
      const battler = buildBattler();

      const result = battler.baseSerFactor();

      expect(result).toBeCloseTo(0.9);
      expect(battler.getCachedSerFactor()).toBeCloseTo(0.9);
    });

    it('returns the cached value without recomputing on a second call', () =>
    {
      globalThis.RPGManager.getSumFromAllNotesByRegex.mockReturnValue(-10);
      const battler = buildBattler();
      battler.baseSerFactor();

      globalThis.RPGManager.getSumFromAllNotesByRegex.mockReturnValue(999);
      const second = battler.baseSerFactor();

      expect(second).toBeCloseTo(0.9);
    });
  });
});
//endregion plugins/abs/ext/shield/objects/game-battler.test.js
