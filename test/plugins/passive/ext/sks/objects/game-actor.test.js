//region plugins/passive/ext/sks/objects/game-actor.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Game_Actor ext/sks (passive) augments (direct src import)', () =>
{
  let Game_Actor;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { PASSIVE: { EXT: { SKS: { Aliased: { Game_Actor: new Map() } } } } };

    function StubGameActor()
    {
    }

    // pre-alias stand-in for the real passive/core base implementation this extension wraps.
    StubGameActor.prototype.getPassiveStateSourcedSkills = vi.fn();
    globalThis.Game_Actor = StubGameActor;

    await import('../../../../../../src/plugins/passive/ext/sks/objects/Game_Actor.js');
    ({ Game_Actor } = globalThis);
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
  });

  /**
   * Builds a stub actor exposing just the surface this extension reads:
   * `equippedSkills()` and `forcedUnslottedSkillIds()`.
   * @param {object} [overrides] Instance-level overrides.
   * @returns {object}
   */
  function buildActor(overrides = {})
  {
    const actor = new Game_Actor();

    Object.assign(actor, {
      equippedSkills: () => [],
      forcedUnslottedSkillIds: () => new Set(),
      ...overrides,
    });

    return actor;
  }

  describe('getPassiveStateSourcedSkills', () =>
  {
    it('includes a learned, SKS-equipped skill', () =>
    {
      // Arrange
      const skill = { id: 1, unslotted: false };
      const actor = buildActor({ equippedSkills: () => [ skill ] });
      globalThis.J.PASSIVE.EXT.SKS.Aliased.Game_Actor.get('getPassiveStateSourcedSkills')
        .mockReturnValue([ skill ]);

      // Act
      const result = actor.getPassiveStateSourcedSkills();

      // Assert
      expect(result).toEqual([ skill ]);
    });

    it('excludes a learned, known-but-unequipped skill', () =>
    {
      // Arrange
      const skill = { id: 1, unslotted: false };
      const actor = buildActor({ equippedSkills: () => [] });
      globalThis.J.PASSIVE.EXT.SKS.Aliased.Game_Actor.get('getPassiveStateSourcedSkills')
        .mockReturnValue([ skill ]);

      // Act
      const result = actor.getPassiveStateSourcedSkills();

      // Assert
      expect(result).toEqual([]);
    });

    it('includes a learned skill tagged unslotted even when never equipped', () =>
    {
      // Arrange
      const skill = { id: 1, unslotted: true };
      const actor = buildActor({ equippedSkills: () => [] });
      globalThis.J.PASSIVE.EXT.SKS.Aliased.Game_Actor.get('getPassiveStateSourcedSkills')
        .mockReturnValue([ skill ]);

      // Act
      const result = actor.getPassiveStateSourcedSkills();

      // Assert
      expect(result).toEqual([ skill ]);
    });

    it('includes a learned skill listed in forcedUnslottedSkillIds even when never equipped', () =>
    {
      // Arrange- the skill itself is not globally unslotted, only exempt for this battler.
      const skill = { id: 1, unslotted: false };
      const actor = buildActor({
        equippedSkills: () => [],
        forcedUnslottedSkillIds: () => new Set([ 1 ]),
      });
      globalThis.J.PASSIVE.EXT.SKS.Aliased.Game_Actor.get('getPassiveStateSourcedSkills')
        .mockReturnValue([ skill ]);

      // Act
      const result = actor.getPassiveStateSourcedSkills();

      // Assert
      expect(result).toEqual([ skill ]);
    });

    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const actor = buildActor();
      globalThis.J.PASSIVE.EXT.SKS.Aliased.Game_Actor.get('getPassiveStateSourcedSkills')
        .mockReturnValue([]);

      // Act
      actor.getPassiveStateSourcedSkills();

      // Assert
      expect(globalThis.J.PASSIVE.EXT.SKS.Aliased.Game_Actor.get('getPassiveStateSourcedSkills')).toHaveBeenCalled();
    });
  });
});
//endregion plugins/passive/ext/sks/objects/game-actor.test.js
