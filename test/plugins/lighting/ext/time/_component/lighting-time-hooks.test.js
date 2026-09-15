//region plugins/lighting/ext/time/_component/lighting-time-hooks.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  defaultLightingConfig,
  defaultLightingTimeConfig,
  installLightingComponentGlobals,
  setLightingConfig,
  setPluginContextToJBase,
  setPluginContextToJLighting,
  setPluginContextToJLightingTime,
} from '../../../_component/fixtures/install-lighting-component-globals.js';

describe('J-Lighting-Time hooks (direct src import)', () =>
{
  let ScreenLightingComposer;
  let TimeLightingCoordinator;

  // the registered plugin command handlers, captured as they register.
  const handlers = {};

  beforeAll(async () =>
  {
    vi.resetModules();

    installLightingComponentGlobals();
    setLightingConfig(defaultLightingConfig());

    globalThis.PluginManager.registerCommand = (pluginName, commandName, handler) =>
    {
      handlers[commandName] = handler;
    };

    // the real shape of the clock, not a convenient one. J-TIME's own constructor announces the
    // starting hour before it returns, which means the very first announcement of a new game happens
    // while `$gameTime` is still null - and a stub that skipped that let an augment reaching for the
    // global pass here and crash on the title screen.
    globalThis.Game_Time = function(hours = 9)
    {
      this._hours = hours;
      this.onTimeChanged();
    };
    globalThis.Game_Time.prototype.hours = function()
    {
      return this._hours;
    };
    globalThis.Game_Time.prototype.onTimeChanged = function()
    {
      this.announcementRan = true;
    };

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJLighting();
    await import('../../../../../../src/plugins/lighting/core/_metadata/initialization.js');
    ({ default: globalThis.ToneDeclaration } =
      await import('../../../../../../src/plugins/lighting/core/models/ToneDeclaration.js'));
    ({ default: globalThis.AmbientDeclaration } =
      await import('../../../../../../src/plugins/lighting/core/models/AmbientDeclaration.js'));
    ({ default: globalThis.ScreenLightingComposer } =
      await import('../../../../../../src/plugins/lighting/core/managers/ScreenLightingComposer.js'));
    ({ ScreenLightingComposer } = globalThis);

    ({ default: globalThis.TimePhases } =
      await import('../../../../../../src/plugins/time/core/managers/TimePhases.js'));
    globalThis.J.TIME = { Metadata: { UseRealTime: false, version: { version: () => '1.0.0' } } };

    setPluginContextToJLightingTime();
    setLightingConfig(defaultLightingTimeConfig());
    await import('../../../../../../src/plugins/lighting/ext/time/_metadata/initialization.js');
    await import('../../../../../../src/plugins/lighting/ext/time/managers/TimeToneResolver.js');
    ({ default: TimeLightingCoordinator } =
      await import('../../../../../../src/plugins/lighting/ext/time/managers/TimeLightingCoordinator.js'));
    await import('../../../../../../src/plugins/lighting/ext/time/objects/Game_Time.js');
    await import('../../../../../../src/plugins/lighting/ext/time/_metadata/pluginCommands.js');
  });

  beforeEach(() =>
  {
    Graphics.frameCount = 100;
    globalThis.$dataMap = { meta: {} };
    globalThis.$gameTime = { hours: () => 3 };
    J.TIME.Metadata.UseRealTime = false;

    ScreenLightingComposer.reset();
    TimeLightingCoordinator.refreshMapSuppression();
    TimeLightingCoordinator.unlock($gameTime);
    ScreenLightingComposer.reset();
  });

  describe('metadata', () =>
  {
    it('reads the colour curve out of configuration in cycle order', () =>
    {
      // Arrange
      // Act
      const result = J.LIGHTING.EXT.TIME.Metadata.toneSequence;

      // Assert
      // the curve opens on the phase the clock calls id 0 - night - so a phase's own colour is the
      // one it starts on. night is repeated at the end because the last phase travels back toward
      // it, which is what lets one lookup serve every hour with no wraparound case.
      expect(result.at(0)).toEqual([ -100, -100, -30, 100 ]);
      expect(result.at(1)).toEqual([ -30, -15, 15, 64 ]);
      expect(result.at(-1)).toEqual([ -100, -100, -30, 100 ]);
    });

    it('ships the darkness curve flat, so installing it changes nothing on day one', () =>
    {
      // Arrange
      // Act
      const result = J.LIGHTING.EXT.TIME.Metadata.darknessSequence;

      // Assert
      // deciding what night's darkness should be is an art pass, separate from this migration.
      expect(result).toEqual([ 0, 0, 0, 0, 0, 0, 0 ]);
    });

    it('claims its namespace beneath the plugin that owns it', () =>
    {
      // Arrange
      // Act
      const result = J.LIGHTING.EXT.TIME.Metadata.name;

      // Assert
      expect(result).toBe('J-Lighting-Time');
    });
  });

  describe('Game_Time#onTimeChanged', () =>
  {
    it('still performs the announcement the clock was making', () =>
    {
      // Arrange
      const clock = new globalThis.Game_Time();

      // Act
      clock.onTimeChanged();

      // Assert
      expect(clock.announcementRan).toBe(true);
    });

    it('survives the announcement that happens before the clock global exists', () =>
    {
      // Arrange
      // this is the very first thing a new game does: `Game_Time`'s constructor announces the
      // starting hour, and `$gameTime` is not assigned until that constructor returns. Anything in
      // the announcement path that reaches for the global instead of taking the clock it was handed
      // crashes here, on the title screen, before a single frame is drawn.
      globalThis.$gameTime = null;

      // Act
      const build = () => new globalThis.Game_Time();

      // Assert
      expect(build).not.toThrow();
      expect(build().announcementRan).toBe(true);
    });

    it('declares the sky from the clock it was handed, not from the global', () =>
    {
      // Arrange
      globalThis.$gameTime = null;

      // Act
      const clock = new globalThis.Game_Time();
      Graphics.frameCount += 1;
      const result = ScreenLightingComposer.compose();

      // Assert
      // hour 9 is one hour into the morning-to-afternoon fade, so the sky carries a real colour
      // rather than the neutral one a withdrawal would have left behind.
      expect(clock.hours()).toBe(9);
      expect(result.tone()).not.toEqual([ 0, 0, 0, 0 ]);
      expect(result.tone()
        .at(0)).toBeCloseTo(3 / 300, 10);
    });

    it('sets the sky travelling toward the hour just announced, without snapping to it', () =>
    {
      // Arrange
      const clock = new globalThis.Game_Time(0);

      // Act
      clock.onTimeChanged();
      Graphics.frameCount += 1;
      const result = ScreenLightingComposer.compose();

      // Assert
      // the sky is the one thing on screen that should never be seen to change, so a single frame
      // of a three-hundred frame journey has barely moved.
      expect(result.tone()
        .at(0)).toBeCloseTo(-1 / 3, 10);
    });

    it('arrives at the colour of the hour once the whole transition has run', () =>
    {
      // Arrange
      const clock = new globalThis.Game_Time(0);
      clock.onTimeChanged();

      // Act
      for (let frame = 0; frame < 300; frame++)
      {
        Graphics.frameCount += 1;
        ScreenLightingComposer.compose();
      }

      // Assert
      // hour 0 opens the night phase, so it settles on deep night exactly.
      expect(ScreenLightingComposer.compose()
        .tone()).toEqual([ -100, -100, -30, 100 ]);
    });

    it('says nothing about the sky on a map that has none', () =>
    {
      // Arrange
      globalThis.$dataMap = { meta: { noToneChange: true } };
      TimeLightingCoordinator.refreshMapSuppression();
      const clock = new globalThis.Game_Time();

      // Act
      clock.onTimeChanged();
      Graphics.frameCount += 1;
      const result = ScreenLightingComposer.compose();

      // Assert
      expect(result.tone()).toEqual([ 0, 0, 0, 0 ]);
    });
  });

  describe('plugin commands', () =>
  {
    it('registers both of its commands under the J-Lighting-Time plugin name', () =>
    {
      // Arrange
      // Act
      const registered = Object.keys(handlers);

      // Assert
      expect(registered).toEqual([ 'unlockTone', 'lockTone' ]);
    });

    it('freezes the sky where it is', () =>
    {
      // Arrange
      TimeLightingCoordinator.declareForCurrentTime($gameTime);

      // Act
      handlers.lockTone();
      Graphics.frameCount += 1;
      const result = ScreenLightingComposer.compose();

      // Assert
      expect(TimeLightingCoordinator.isLocked()).toBe(true);
      expect(result.tone()).toEqual([ 0, 0, 0, 0 ]);
    });

    it('lets the sky resume following the clock', () =>
    {
      // Arrange
      handlers.lockTone();

      // Act
      handlers.unlockTone();
      Graphics.frameCount += 1;
      const result = ScreenLightingComposer.compose();

      // Assert
      expect(TimeLightingCoordinator.isLocked()).toBe(false);
      expect(result.tone()
        .at(0)).toBeLessThan(0);
    });
  });
});
//endregion plugins/lighting/ext/time/_component/lighting-time-hooks.test.js