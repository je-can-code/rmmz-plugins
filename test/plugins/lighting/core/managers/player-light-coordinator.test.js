//region plugins/lighting/core/managers/player-light-coordinator.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  installLightingHostGlobals,
  installLightingMetadata,
  installRecordingDiagnostics,
} from '../../fixtures/install-lighting-host-globals.js';

describe('PlayerLightCoordinator', () =>
{
  let PlayerLightCoordinator;
  let ScreenLightingComposer;

  /**
   * Builds an actor whose notes carry whatever tags a test wants them to.
   * @param {number} actorId Who this actor is.
   * @param {string[]} notes The note text on each thing they have.
   */
  const anActor = (actorId, notes) => ({
    actorId: () => actorId,
    getAllNotes: () => notes.map(note => ({ note })),
  });

  beforeAll(async () =>
  {
    vi.resetModules();
    installLightingHostGlobals();
    installLightingMetadata();
    installRecordingDiagnostics();
    globalThis.Graphics = { frameCount: 0 };
    globalThis.$gamePlayer = { id: 'player' };

    // the real note reader goes in rather than a stub, because what this class actually does is hand
    // a battler's note objects to it and trust the caching and multi-line handling underneath.
    ({ default: globalThis.RPGManager } =
      await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));

    ({ default: PlayerLightCoordinator } =
      await import('../../../../../src/plugins/lighting/core/managers/PlayerLightCoordinator.js'));
    ({ default: ScreenLightingComposer } =
      await import('../../../../../src/plugins/lighting/core/managers/ScreenLightingComposer.js'));
  });

  beforeEach(() =>
  {
    ScreenLightingComposer.reset();
    PlayerLightCoordinator.reset();
    RPGManager.clearCache();
    Graphics.frameCount = 100;
  });

  describe('refresh', () =>
  {
    it('declares the light a leader is carrying on their equipment', () =>
    {
      // Arrange
      globalThis.$gameParty = { leader: () => anActor(1, [ '<light:[4.5, #ffdca8, flicker]>' ]) };

      // Act
      PlayerLightCoordinator.refresh();
      Graphics.frameCount += 1;
      const result = ScreenLightingComposer.compose();

      // Assert
      expect(result.lights()).toHaveLength(1);
      expect(result.lights()[0].radius()).toBe(4.5);
      expect(result.lights()[0].effect()).toBe('flicker');
    });

    it('attaches the light to the player rather than to the actor', () =>
    {
      // Arrange
      globalThis.$gameParty = { leader: () => anActor(1, [ '<light:[4.5]>' ]) };

      // Act
      PlayerLightCoordinator.refresh();
      Graphics.frameCount += 1;
      const result = ScreenLightingComposer.compose();

      // Assert
      // the light has to follow something with a position on the map, and an actor has none.
      expect(result.lights()[0].character()).toBe($gamePlayer);
    });

    it('declares nothing when the leader carries no light at all', () =>
    {
      // Arrange
      globalThis.$gameParty = { leader: () => anActor(1, [ '<motion:[breathe]>', 'nothing here' ]) };

      // Act
      PlayerLightCoordinator.refresh();
      Graphics.frameCount += 1;
      const result = ScreenLightingComposer.compose();

      // Assert
      // there is no player globe by default; a light that follows the party everywhere makes
      // darkness unreachable.
      expect(result.lights()).toEqual([]);
    });

    it('gathers several lights when more than one thing the leader has glows', () =>
    {
      // Arrange
      const notes = [ '<light:[4.5, #ffdca8]>', '<light:[3, #88ffcc]>' ];
      globalThis.$gameParty = { leader: () => anActor(1, notes) };

      // Act
      PlayerLightCoordinator.refresh();
      Graphics.frameCount += 1;
      const result = ScreenLightingComposer.compose();

      // Assert
      expect(result.lights()).toHaveLength(2);
    });

    it('withdraws the light entirely when there is nobody leading the party', () =>
    {
      // Arrange
      globalThis.$gameParty = { leader: () => anActor(1, [ '<light:[4.5]>' ]) };
      PlayerLightCoordinator.refresh();
      globalThis.$gameParty = { leader: () => undefined };

      // Act
      PlayerLightCoordinator.refresh();
      Graphics.frameCount += 1;
      const result = ScreenLightingComposer.compose();

      // Assert
      // a full party wipe is a real state rather than a broken one.
      expect(result.lights()).toEqual([]);
    });
  });

  describe('refreshIfLeaderChanged', () =>
  {
    it('re-reads when somebody else is now leading the party', () =>
    {
      // Arrange
      globalThis.$gameParty = { leader: () => anActor(1, [ '<light:[4.5]>' ]) };
      PlayerLightCoordinator.refresh();
      globalThis.$gameParty = { leader: () => anActor(2, [ '<light:[8]>' ]) };

      // Act
      PlayerLightCoordinator.refreshIfLeaderChanged();
      Graphics.frameCount += 1;
      const result = ScreenLightingComposer.compose();

      // Assert
      // party cycling changes whose notes to read without changing anybody's data.
      expect(result.lights()[0].radius()).toBe(8);
    });

    it('leaves the declaration alone while the same person is still leading', () =>
    {
      // Arrange
      globalThis.$gameParty = { leader: () => anActor(1, [ '<light:[4.5]>' ]) };
      PlayerLightCoordinator.refresh();
      const readAgain = vi.spyOn(PlayerLightCoordinator, 'refresh');

      // Act
      PlayerLightCoordinator.refreshIfLeaderChanged();
      // the count has to be taken before restoring: `mockRestore` clears the recorded calls as well
      // as putting the original back, so asserting afterwards would pass no matter what happened.
      const timesRead = readAgain.mock.calls.length;
      readAgain.mockRestore();

      // Assert
      expect(timesRead).toBe(0);
    });

    it('re-reads when the party empties out from under it', () =>
    {
      // Arrange
      globalThis.$gameParty = { leader: () => anActor(1, [ '<light:[4.5]>' ]) };
      PlayerLightCoordinator.refresh();
      globalThis.$gameParty = { leader: () => undefined };

      // Act
      PlayerLightCoordinator.refreshIfLeaderChanged();
      Graphics.frameCount += 1;
      const result = ScreenLightingComposer.compose();

      // Assert
      expect(result.lights()).toEqual([]);
    });

    it('re-reads once somebody takes over an empty party', () =>
    {
      // Arrange
      globalThis.$gameParty = { leader: () => undefined };
      PlayerLightCoordinator.refresh();
      globalThis.$gameParty = { leader: () => anActor(3, [ '<light:[3.75]>' ]) };

      // Act
      PlayerLightCoordinator.refreshIfLeaderChanged();
      Graphics.frameCount += 1;
      const result = ScreenLightingComposer.compose();

      // Assert
      expect(result.lights()[0].radius()).toBe(3.75);
    });
  });
});
//endregion plugins/lighting/core/managers/player-light-coordinator.test.js