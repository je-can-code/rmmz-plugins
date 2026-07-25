//region plugins/extend/core/objects/game-actor.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Game_Actor ext/extend augments (direct src import)', () =>
{
  let Game_Actor;
  let FakeOverlayManager;

  beforeAll(async () =>
  {
    vi.resetModules();

    FakeOverlayManager = { invalidate: vi.fn() };
    vi.doMock('../../../../../src/plugins/extend/core/managers/OverlayManager.js', () => ({ default: FakeOverlayManager }));

    globalThis.J = { EXTEND: { Aliased: { Game_Actor: new Map() } } };

    function StubGameActor()
    {
    }

    StubGameActor.prototype.skills = vi.fn();
    StubGameActor.prototype.hasSkill = vi.fn();
    StubGameActor.prototype.learnSkill = vi.fn();
    StubGameActor.prototype.forgetSkill = vi.fn();
    globalThis.Game_Actor = StubGameActor;

    await import('../../../../../src/plugins/extend/core/objects/Game_Actor.js');
    ({ Game_Actor } = globalThis);
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
  });

  describe('skills', () =>
  {
    it('remaps every base skill through this.skill() for overlay resolution', () =>
    {
      // Arrange
      const actor = new Game_Actor();
      globalThis.J.EXTEND.Aliased.Game_Actor.get('skills').mockReturnValue([ { id: 1 }, { id: 2 } ]);
      const resolvedSkills = { 1: { id: 1, extended: true }, 2: { id: 2, extended: true } };
      actor.skill = vi.fn(id => resolvedSkills[id]);

      // Act
      const result = actor.skills();

      // Assert
      expect(actor.skill).toHaveBeenCalledWith(1);
      expect(actor.skill).toHaveBeenCalledWith(2);
      expect(result).toEqual([ resolvedSkills[1], resolvedSkills[2] ]);
    });
  });

  describe('hasSkill', () =>
  {
    it('is true when a known skill matches by id', () =>
    {
      // Arrange
      const actor = new Game_Actor();
      actor.skills = vi.fn().mockReturnValue([ { id: 5 } ]);

      // Act
      const result = actor.hasSkill(5);

      // Assert
      expect(result).toEqual(true);
    });

    it('is false when no known skill matches by id', () =>
    {
      // Arrange
      const actor = new Game_Actor();
      actor.skills = vi.fn().mockReturnValue([ { id: 5 } ]);

      // Act
      const result = actor.hasSkill(6);

      // Assert
      expect(result).toEqual(false);
    });
  });

  describe('learnSkill', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const actor = new Game_Actor();

      // Act
      actor.learnSkill(5);

      // Assert
      expect(globalThis.J.EXTEND.Aliased.Game_Actor.get('learnSkill')).toHaveBeenCalledWith(5);
    });

    it('invalidates the overlay cache for this actor', () =>
    {
      // Arrange
      const actor = new Game_Actor();

      // Act
      actor.learnSkill(5);

      // Assert
      expect(FakeOverlayManager.invalidate).toHaveBeenCalledWith(actor);
    });
  });

  describe('forgetSkill', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const actor = new Game_Actor();

      // Act
      actor.forgetSkill(5);

      // Assert
      expect(globalThis.J.EXTEND.Aliased.Game_Actor.get('forgetSkill')).toHaveBeenCalledWith(5);
    });

    it('invalidates the overlay cache for this actor', () =>
    {
      // Arrange
      const actor = new Game_Actor();

      // Act
      actor.forgetSkill(5);

      // Assert
      expect(FakeOverlayManager.invalidate).toHaveBeenCalledWith(actor);
    });
  });
});
//endregion plugins/extend/core/objects/game-actor.test.js
