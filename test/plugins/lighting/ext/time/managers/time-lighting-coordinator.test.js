//region plugins/lighting/ext/time/managers/time-lighting-coordinator.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { installLightingTimeGlobals } from '../fixtures/install-lighting-time-globals.js';
import { installLightingHostGlobals } from '../../../fixtures/install-lighting-host-globals.js';

describe('TimeLightingCoordinator', () =>
{
  let TimeLightingCoordinator;
  let ScreenLightingComposer;

  // the colour curve J-TIME shipped with, and a darkness curve where every phase differs so a test
  // cannot pass by reading the wrong phase.
  const toneSequence = [
    [ -68, -68, 0, 68 ],
    [ -100, -100, -30, 100 ],
    [ -30, -15, 15, 64 ],
    [ 0, 0, 0, 0 ],
    [ 10, 10, 10, 10 ],
    [ 0, -30, -30, -30 ],
    [ -68, -68, 0, 68 ], ];
  const darknessSequence = [ 0.5, 0.9, 0.4, 0, 0, 0.2, 0.5 ];

  beforeAll(async () =>
  {
    vi.resetModules();
    installLightingHostGlobals();
    installLightingTimeGlobals();
    globalThis.Graphics = { frameCount: 0 };

    ({ default: globalThis.ToneDeclaration } =
      await import('../../../../../../src/plugins/lighting/core/models/ToneDeclaration.js'));
    ({ default: globalThis.AmbientDeclaration } =
      await import('../../../../../../src/plugins/lighting/core/models/AmbientDeclaration.js'));
    ({ default: globalThis.ScreenLightingComposer } =
      await import('../../../../../../src/plugins/lighting/core/managers/ScreenLightingComposer.js'));
    ({ ScreenLightingComposer } = globalThis);

    ({ default: TimeLightingCoordinator } =
      await import('../../../../../../src/plugins/lighting/ext/time/managers/TimeLightingCoordinator.js'));

    globalThis.J.LIGHTING.EXT = { TIME: { Metadata: { toneSequence, darknessSequence } } };
    globalThis.J.TIME = { Metadata: { UseRealTime: false } };
  });

  beforeEach(() =>
  {
    // the world has to exist before the coordinator is asked anything - unlocking re-declares, and
    // re-declaring reads the clock.
    Graphics.frameCount = 100;
    globalThis.$dataMap = { meta: {} };
    globalThis.$gameTime = { hours: () => 2 };
    J.TIME.Metadata.UseRealTime = false;

    ScreenLightingComposer.reset();
    TimeLightingCoordinator.refreshMapSuppression();
    TimeLightingCoordinator.unlock($gameTime);
    ScreenLightingComposer.reset();
  });

  describe('declareForCurrentTime', () =>
  {
    it('declares the colour belonging to the current hour', () =>
    {
      // Arrange
      TimeLightingCoordinator.refreshMapSuppression();

      // Act
      TimeLightingCoordinator.declareForCurrentTime($gameTime);
      Graphics.frameCount += 1;
      const result = ScreenLightingComposer.compose();

      // Assert
      // hour 2 sits three quarters of the way through the night-to-moontide fade.
      expect(result.tone()).not.toEqual([ 0, 0, 0, 0 ]);
    });

    it('declares the darkness belonging to the current hour', () =>
    {
      // Arrange
      globalThis.$gameTime = { hours: () => 4 };
      TimeLightingCoordinator.refreshMapSuppression();

      // Act
      TimeLightingCoordinator.declareForCurrentTime($gameTime);
      Graphics.frameCount += 1;
      const result = ScreenLightingComposer.compose();

      // Assert
      // hour 4 opens a phase, so it sits on that phase's darkness exactly rather than partway there.
      expect(result.darkness()).toBeCloseTo(0.9, 10);
    });

    it('states no colour of its own for the dark, so a place keeps its own', () =>
    {
      // Arrange
      globalThis.$gameTime = { hours: () => 3 };
      TimeLightingCoordinator.refreshMapSuppression();

      // Act
      TimeLightingCoordinator.declareForCurrentTime($gameTime);
      Graphics.frameCount += 1;
      const result = ScreenLightingComposer.compose();

      // Assert
      // the sky knows how dark night is and has nothing to say about the colour of a cave.
      expect(result.ambientColor()).toEqual([ 0, 0, 0 ]);
    });

    it('reads the wall clock rather than the game clock when running on real time', () =>
    {
      // Arrange
      J.TIME.Metadata.UseRealTime = true;
      globalThis.$gameTime = { hours: () => 3 };
      TimeLightingCoordinator.refreshMapSuppression();

      // Act
      const result = TimeLightingCoordinator.currentHour($gameTime);

      // Assert
      expect(result).toBe(new Date().getHours());
    });

    it('withdraws entirely on a map that has no sky', () =>
    {
      // Arrange
      globalThis.$dataMap = { meta: { noToneChange: true } };
      TimeLightingCoordinator.refreshMapSuppression();

      // Act
      TimeLightingCoordinator.declareForCurrentTime($gameTime);
      Graphics.frameCount += 1;
      const result = ScreenLightingComposer.compose();

      // Assert
      expect(result.tone()).toEqual([ 0, 0, 0, 0 ]);
      expect(result.darkness()).toBe(0);
    });

    it('leaves a tint an event applied to an interior exactly where it is', () =>
    {
      // Arrange
      globalThis.$dataMap = { meta: { noToneChange: true } };
      TimeLightingCoordinator.refreshMapSuppression();
      const cutsceneTint = new ToneDeclaration([ 68, -34, -34, 0 ], 1, 'command');
      ScreenLightingComposer.declareTone('command', cutsceneTint);

      // Act
      TimeLightingCoordinator.declareForCurrentTime($gameTime);
      Graphics.frameCount += 1;
      const result = ScreenLightingComposer.compose();

      // Assert
      // withdrawing rather than declaring neutral is what stops the sky erasing somebody else's tint.
      expect(result.tone()).toEqual([ 68, -34, -34, 0 ]);
    });

    it('takes the sky back when leaving a map that had none', () =>
    {
      // Arrange
      globalThis.$dataMap = { meta: { noToneChange: true } };
      TimeLightingCoordinator.refreshMapSuppression();
      TimeLightingCoordinator.declareForCurrentTime($gameTime);

      // Act
      globalThis.$dataMap = { meta: {} };
      TimeLightingCoordinator.refreshMapSuppression();
      TimeLightingCoordinator.declareForCurrentTime($gameTime);
      Graphics.frameCount += 1;
      const result = ScreenLightingComposer.compose();

      // Assert
      expect(result.tone()).not.toEqual([ 0, 0, 0, 0 ]);
    });
  });

  describe('locking', () =>
  {
    it('reports unfrozen by default', () =>
    {
      // Arrange
      // Act
      const result = TimeLightingCoordinator.isLocked();

      // Assert
      expect(result).toBe(false);
    });

    it('reports frozen once locked', () =>
    {
      // Arrange
      // Act
      TimeLightingCoordinator.lock($gameTime);

      // Assert
      expect(TimeLightingCoordinator.isLocked()).toBe(true);
    });

    it('withdraws the sky while frozen, even somewhere that has one', () =>
    {
      // Arrange
      TimeLightingCoordinator.refreshMapSuppression();
      TimeLightingCoordinator.declareForCurrentTime($gameTime);

      // Act
      TimeLightingCoordinator.lock($gameTime);
      Graphics.frameCount += 1;
      const result = ScreenLightingComposer.compose();

      // Assert
      expect(result.tone()).toEqual([ 0, 0, 0, 0 ]);
    });

    it('brings the sky back on unfreezing', () =>
    {
      // Arrange
      TimeLightingCoordinator.refreshMapSuppression();
      TimeLightingCoordinator.lock($gameTime);

      // Act
      TimeLightingCoordinator.unlock($gameTime);
      Graphics.frameCount += 1;
      const result = ScreenLightingComposer.compose();

      // Assert
      expect(result.tone()).not.toEqual([ 0, 0, 0, 0 ]);
    });
  });

  describe('isActive', () =>
  {
    it('is active on an ordinary map with the sky unfrozen', () =>
    {
      // Arrange
      TimeLightingCoordinator.refreshMapSuppression();

      // Act
      const result = TimeLightingCoordinator.isActive();

      // Assert
      expect(result).toBe(true);
    });

    it('is inactive on a map that opted out of the sky', () =>
    {
      // Arrange
      globalThis.$dataMap = { meta: { noToneChange: true } };
      TimeLightingCoordinator.refreshMapSuppression();

      // Act
      const result = TimeLightingCoordinator.isActive();

      // Assert
      expect(result).toBe(false);
    });

    it('is inactive while frozen, wherever the player is standing', () =>
    {
      // Arrange
      TimeLightingCoordinator.refreshMapSuppression();
      TimeLightingCoordinator.lock($gameTime);

      // Act
      const result = TimeLightingCoordinator.isActive();

      // Assert
      expect(result).toBe(false);
    });
  });
});
//endregion plugins/lighting/ext/time/managers/time-lighting-coordinator.test.js