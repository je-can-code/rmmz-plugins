//region plugins/utils/core/objects/game-actor.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Game_Actor ext/utils augments (direct src import)', () =>
{
  let Game_Actor;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { UTILS: { Aliased: { Game_Actor: new Map() } } };

    function StubGameActor()
    {
    }

    StubGameActor.prototype.onLearnNewSkill = vi.fn();
    StubGameActor.prototype.onForgetSkill = vi.fn();
    globalThis.Game_Actor = StubGameActor;

    await import('../../../../../src/plugins/utils/core/objects/Game_Actor.js');
    ({ Game_Actor } = globalThis);
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
  });

  describe('onLearnNewSkill', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const actor = new Game_Actor();
      actor.skill = vi.fn().mockReturnValue({ name: 'Fireball' });

      // Act
      actor.onLearnNewSkill(5);

      // Assert
      expect(globalThis.J.UTILS.Aliased.Game_Actor.get('onLearnNewSkill')).toHaveBeenCalledWith(5);
    });

    it('returns a human-readable log line naming the learned skill', () =>
    {
      // Arrange
      const actor = new Game_Actor();
      actor.skill = vi.fn().mockReturnValue({ name: 'Fireball' });

      // Act
      const result = actor.onLearnNewSkill(5);

      // Assert
      expect(result).toEqual('[5] {Fireball} was learned.');
    });
  });

  describe('onForgetSkill', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const actor = new Game_Actor();
      actor.skill = vi.fn().mockReturnValue({ name: 'Fireball' });

      // Act
      actor.onForgetSkill(5);

      // Assert
      expect(globalThis.J.UTILS.Aliased.Game_Actor.get('onForgetSkill')).toHaveBeenCalledWith(5);
    });

    it('returns a human-readable log line naming the forgotten skill', () =>
    {
      // Arrange
      const actor = new Game_Actor();
      actor.skill = vi.fn().mockReturnValue({ name: 'Fireball' });

      // Act
      const result = actor.onForgetSkill(5);

      // Assert
      expect(result).toEqual('[5] {Fireball} was not learned.');
    });
  });
});
//endregion plugins/utils/core/objects/game-actor.test.js
