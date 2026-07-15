//region plugins/extend/core/objects/game-party.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('Game_Party ext/extend augments (direct src import)', () =>
{
  let Game_Party;

  beforeAll(async () =>
  {
    vi.resetModules();

    function StubGameParty()
    {
    }

    globalThis.Game_Party = StubGameParty;

    await import('../../../../../src/plugins/extend/core/objects/Game_Party.js');
    ({ Game_Party } = globalThis);
  });

  describe('extraOnHitSelfStateSources', () =>
  {
    it('returns an empty array when J.PASSIVE is not in use', () =>
    {
      // Arrange
      globalThis.J = { PASSIVE: false };
      const party = new Game_Party();

      // Act
      const result = party.extraOnHitSelfStateSources();

      // Assert
      expect(result).toEqual([]);
    });

    it('collects allStates() from every battle party member when J.PASSIVE is in use', () =>
    {
      // Arrange
      globalThis.J = { PASSIVE: true };
      const stateA = {};
      const stateB = {};
      const memberA = { allStates: () => [ stateA ] };
      const memberB = { allStates: () => [ stateB ] };
      globalThis.$gameParty = { battleMembers: () => [ memberA, memberB ] };
      const party = new Game_Party();

      // Act
      const result = party.extraOnHitSelfStateSources();

      // Assert
      expect(result).toEqual([ stateA, stateB ]);
    });
  });

  describe('extraOnCastSelfStateSources', () =>
  {
    it('returns an empty array when J.PASSIVE is not in use', () =>
    {
      // Arrange
      globalThis.J = { PASSIVE: false };
      const party = new Game_Party();

      // Act
      const result = party.extraOnCastSelfStateSources();

      // Assert
      expect(result).toEqual([]);
    });

    it('collects allStates() from every battle party member when J.PASSIVE is in use', () =>
    {
      // Arrange
      globalThis.J = { PASSIVE: true };
      const state = {};
      const member = { allStates: () => [ state ] };
      globalThis.$gameParty = { battleMembers: () => [ member ] };
      const party = new Game_Party();

      // Act
      const result = party.extraOnCastSelfStateSources();

      // Assert
      expect(result).toEqual([ state ]);
    });
  });
});
//endregion plugins/extend/core/objects/game-party.test.js
