//region plugins/apt/core/_component/game-battler-objects-direct.test.js
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { installAptHostGlobals } from './fixtures/install-apt-host-globals.js';

describe('Game_BattlerBase / Game_Battler / Game_Troop aptitude additions (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    await installAptHostGlobals();

    // Game_Actor#apr (tested below) reads/writes the apr cache via initAptitudeMembers/getCachedApr/
    // setCachedApr, which live in Game_Actor.js rather than Game_BattlerBase.js.
    await import('../../../../../src/plugins/apt/core/objects/Game_Actor.js');

    // the files under test- patch globalThis.Game_BattlerBase/Game_Battler/Game_Troop.prototype directly.
    await import('../../../../../src/plugins/apt/core/objects/Game_BattlerBase.js');
    await import('../../../../../src/plugins/apt/core/objects/Game_Battler.js');
    await import('../../../../../src/plugins/apt/core/objects/Game_Troop.js');
  });

  afterAll(() =>
  {
    vi.unstubAllGlobals();
  });

  describe('Game_BattlerBase#apr', () =>
  {
    it('returns 1 for a plain Game_BattlerBase (no override, no notes)', () =>
    {
      const battler = new globalThis.Game_BattlerBase();

      expect(battler.apr).toBe(1);
    });
  });

  describe('Game_Actor#apr', () =>
  {
    /**
     * Builds a bare actor with no note-derived bonus and no SDP hook.
     * @returns {Game_Actor}
     */
    function buildActor()
    {
      const actor = new globalThis.Game_Actor();
      actor.initAptitudeMembers();
      actor.getAllNotes = () => [];
      return actor;
    }

    it('computes 1.0 (100/100) when there is no note bonus or SDP bonus', () =>
    {
      const actor = buildActor();

      expect(actor.apr).toBe(1);
    });

    it('caches the computed value after first access', () =>
    {
      const actor = buildActor();

      // prime the cache.
      // eslint-disable-next-line no-unused-expressions
      actor.apr;

      expect(actor.getCachedApr()).toBe(1);
    });

    it('returns the cached value on subsequent access without recomputing notes', () =>
    {
      const actor = buildActor();
      actor.setCachedApr(2.5);

      expect(actor.apr).toBe(2.5);
    });

    it('adds the note-derived AptMultiplier bonus as a percent', () =>
    {
      const actor = buildActor();
      actor.getAllNotes = () => [ { note: '<aptMultiplier:25>' } ];

      // (100 + 25) / 100
      expect(actor.apr).toBe(1.25);
    });

    it('adds the SDP bonus via getSdpBonusForParameterKey when present', () =>
    {
      const actor = buildActor();
      actor.getSdpBonusForParameterKey = (key, fallback) => (key === 'apr' ? 10 : fallback);

      // (100 + 0 + 10) / 100
      expect(actor.apr).toBe(1.1);
    });

    it('layers on the natural bonus bound to apr, already in factor units', () =>
    {
      // Arrange- the bonus answers only for apr, so asking for any other key would miss it.
      const actor = buildActor();
      actor.getAllNotes = () => [ { note: '<aptMultiplier:25>' } ];
      actor.naturalBonus = key => (key === 'apr' ? 0.05 : 3);

      // Act
      const result = actor.apr;

      // Assert
      expect(result).toBeCloseTo(1.3, 10);
    });

    it('keeps the natural bonus out of the cache, so growth shows without waiting for a data change', () =>
    {
      // Arrange- warm the cache first, then grow.
      const actor = buildActor();
      actor.getAllNotes = () => [ { note: '<aptMultiplier:25>' } ];
      // eslint-disable-next-line no-unused-expressions
      actor.apr;
      actor.naturalBonus = key => (key === 'apr' ? 0.05 : 3);

      // Act
      const result = actor.apr;

      // Assert
      expect(actor.getCachedApr()).toBe(1.25);
      expect(result).toBeCloseTo(1.3, 10);
    });
  });

  describe('Game_BattlerBase#baseAptFactor', () =>
  {
    it('answers the neutral factor for a battler that earns no aptitude', () =>
    {
      // Arrange
      const battler = new globalThis.Game_BattlerBase();

      // Act
      const result = battler.baseAptFactor();

      // Assert
      expect(result).toBe(1);
    });
  });

  describe('Game_Battler#apPoints', () =>
  {
    it('delegates to databaseData().apPoints', () =>
    {
      const battler = new globalThis.Game_Battler();
      battler.databaseData = () => ({ apPoints: 42 });

      expect(battler.apPoints()).toBe(42);
    });
  });

  describe('Game_Troop#aptitudeApTotal', () =>
  {
    it('sums apPoints across all dead members', () =>
    {
      const troop = new globalThis.Game_Troop();
      troop.deadMembers = () => [ { apPoints: 5 }, { apPoints: 7 } ];

      expect(troop.aptitudeApTotal()).toBe(12);
    });

    it('returns 0 when there are no dead members', () =>
    {
      const troop = new globalThis.Game_Troop();
      troop.deadMembers = () => [];

      expect(troop.aptitudeApTotal()).toBe(0);
    });
  });
});
//endregion plugins/apt/core/_component/game-battler-objects-direct.test.js
