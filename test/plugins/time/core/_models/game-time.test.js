//region plugins/time/core/_models/game-time.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installTimeHostGlobals } from '../../_component/fixtures/install-time-host-globals.js';

describe('Game_Time', () =>
{
  let Game_Time;

  /**
   * The metadata values the fixture ships with, captured once so each test can restore whatever it
   * flipped. TIME's behavior forks heavily on these three flags, and the shipped game runs two of
   * them opposite to the fixture defaults, so tests must be free to toggle them.
   */
  let defaultMetadata;

  beforeAll(async () =>
  {
    vi.resetModules();

    installTimeHostGlobals();

    await import('../../../../../src/plugins/time/core/_metadata/initialization.js');

    ({ default: Game_Time } = await import('../../../../../src/plugins/time/core/_models/Game_Time.js'));

    defaultMetadata = {
      UseRealTime: J.TIME.Metadata.UseRealTime,
      ChangeToneByTime: J.TIME.Metadata.ChangeToneByTime,
      UseVariableAssignment: J.TIME.Metadata.UseVariableAssignment,
    };
  });

  beforeEach(() =>
  {
    // restore the three forking flags so a test that enabled tone or variables cannot leak into the next.
    J.TIME.Metadata.UseRealTime = defaultMetadata.UseRealTime;
    J.TIME.Metadata.ChangeToneByTime = defaultMetadata.ChangeToneByTime;
    J.TIME.Metadata.UseVariableAssignment = defaultMetadata.UseVariableAssignment;

    Graphics.frameCount = 0;
    $dataMap = { meta: {} };
  });

  describe('constructor', () =>
  {
    it('initializes the members from plugin metadata', () =>
    {
      // Arrange
      // Act
      const t = new Game_Time();

      // Assert
      expect(t.hours()).toBe(J.TIME.Metadata.StartingHour);
      expect(t.days()).toBe(J.TIME.Metadata.StartingDay);
      expect(t.years()).toBe(J.TIME.Metadata.StartingYear);
    });

    it('primes the current tone during construction', () =>
    {
      // Arrange
      // Act
      const t = new Game_Time();

      // Assert
      expect(Array.isArray(t.getCurrentTone())).toBe(true);
    });
  });

  describe('initMembers', () =>
  {
    it('keeps an already-assigned value rather than reapplying the metadata default', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.setHours(17);

      // Act
      t.initMembers();

      // Assert
      expect(t.hours()).toBe(17);
    });

    it('always resets the tone-change flag regardless of prior state', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.setNeedsToneChange(true);

      // Act
      t.initMembers();

      // Assert
      expect(t._needsToneChange).toBe(false);
    });

    it('always resets the current tone regardless of prior state', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.setCurrentTone([ 1, 2, 3, 4 ]);

      // Act
      t.initMembers();

      // Assert
      expect(t.getCurrentTone()).toEqual([]);
    });
  });

  describe('accessors', () =>
  {
    it('round-trips the seconds', () =>
    {
      // Arrange
      const t = new Game_Time();

      // Act
      t.setSeconds(42);

      // Assert
      expect(t.seconds()).toBe(42);
    });

    it('round-trips the minutes', () =>
    {
      // Arrange
      const t = new Game_Time();

      // Act
      t.setMinutes(31);

      // Assert
      expect(t.minutes()).toBe(31);
    });

    it('round-trips the hours', () =>
    {
      // Arrange
      const t = new Game_Time();

      // Act
      t.setHours(13);

      // Assert
      expect(t.hours()).toBe(13);
    });

    it('round-trips the days', () =>
    {
      // Arrange
      const t = new Game_Time();

      // Act
      t.setDays(7);

      // Assert
      expect(t.days()).toBe(7);
    });

    it('round-trips the months', () =>
    {
      // Arrange
      const t = new Game_Time();

      // Act
      t.setMonths(11);

      // Assert
      expect(t.months()).toBe(11);
    });

    it('round-trips the years', () =>
    {
      // Arrange
      const t = new Game_Time();

      // Act
      t.setYears(1999);

      // Assert
      expect(t.years()).toBe(1999);
    });

    it('round-trips the tick frames', () =>
    {
      // Arrange
      const t = new Game_Time();

      // Act
      t.setTickFrames(5);

      // Assert
      expect(t.tickFrames()).toBe(5);
    });

    it('round-trips the visibility', () =>
    {
      // Arrange
      const t = new Game_Time();

      // Act
      t.setVisible(false);

      // Assert
      expect(t.isVisible()).toBe(false);
    });

    it('round-trips the has-been-updated flag', () =>
    {
      // Arrange
      const t = new Game_Time();

      // Act
      t.setHasBeenUpdated(true);

      // Assert
      expect(t.hasBeenUpdated()).toBe(true);
    });

    it('exposes the per-tick increments sourced from metadata', () =>
    {
      // Arrange
      const t = new Game_Time();

      // Act
      // Assert
      expect(t.minutesPerTick()).toBe(J.TIME.Metadata.MinutesPerIncrement);
      expect(t.hoursPerTick()).toBe(J.TIME.Metadata.HoursPerIncrement);
      expect(t.daysPerTick()).toBe(J.TIME.Metadata.DaysPerIncrement);
      expect(t.monthsPerTick()).toBe(J.TIME.Metadata.MonthsPerIncrement);
      expect(t.yearsPerTick()).toBe(J.TIME.Metadata.YearsPerIncrement);
    });
  });

  describe('setTickSpeed', () =>
  {
    it('clamps a multiplier above 10 down to 10', () =>
    {
      // Arrange
      const t = new Game_Time();

      // Act
      t.setTickSpeed(100);

      // Assert
      expect(t.getTickSpeed()).toBe(Math.ceil(60 / 10));
    });

    it('clamps a multiplier below 0.1 up to 0.1', () =>
    {
      // Arrange
      const t = new Game_Time();

      // Act
      t.setTickSpeed(0.01);

      // Assert
      expect(t.getTickSpeed()).toBe(Math.ceil(60 / 0.1));
    });

    it('honors a multiplier already inside the permitted range', () =>
    {
      // Arrange
      const t = new Game_Time();

      // Act
      t.setTickSpeed(2);

      // Assert
      expect(t.getTickSpeed()).toBe(30);
    });
  });

  describe('activation and blocking', () =>
  {
    it('reports active state after activating', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.deactivate();

      // Act
      t.activate();

      // Assert
      expect(t.isActive()).toBe(true);
    });

    it('reports inactive state after deactivating', () =>
    {
      // Arrange
      const t = new Game_Time();

      // Act
      t.deactivate();

      // Assert
      expect(t.isActive()).toBe(false);
    });

    it('reports blocked after blocking', () =>
    {
      // Arrange
      const t = new Game_Time();

      // Act
      t.block();

      // Assert
      expect(t.isBlocked()).toBe(true);
    });

    it('reports unblocked after unblocking', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.block();

      // Act
      t.unblock();

      // Assert
      expect(t.isBlocked()).toBe(false);
    });
  });

  describe('tone locking', () =>
  {
    it('reports locked after locking the tone', () =>
    {
      // Arrange
      const t = new Game_Time();

      // Act
      t.lockTone();

      // Assert
      expect(t.isToneLocked()).toBe(true);
    });

    it('reports unlocked after unlocking the tone', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.lockTone();

      // Act
      t.unlockTone();

      // Assert
      expect(t.isToneLocked()).toBe(false);
    });
  });

  describe('map window visibility', () =>
  {
    it('reports the window visible through the map-window alias', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.setVisible(true);

      // Act
      const result = t.isMapWindowVisible();

      // Assert
      expect(result).toBe(true);
    });

    it('hides the window', () =>
    {
      // Arrange
      const t = new Game_Time();

      // Act
      t.hideMapWindow();

      // Assert
      expect(t.isVisible()).toBe(false);
    });

    it('shows the window', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.hideMapWindow();

      // Act
      t.showMapWindow();

      // Assert
      expect(t.isVisible()).toBe(true);
    });

    it('toggles a visible window to hidden', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.setVisible(true);

      // Act
      t.toggleMapWindow();

      // Assert
      expect(t.isVisible()).toBe(false);
    });

    it('toggles a hidden window to visible', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.setVisible(false);

      // Act
      t.toggleMapWindow();

      // Assert
      expect(t.isVisible()).toBe(true);
    });
  });

  describe('hud update flagging', () =>
  {
    it('flags itself as updated', () =>
    {
      // Arrange
      const t = new Game_Time();

      // Act
      t.flagForHudUpdate();

      // Assert
      expect(t.hasBeenUpdated()).toBe(true);
    });

    it('acknowledges the update', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.flagForHudUpdate();

      // Act
      t.acknowledgeHudUpdate();

      // Assert
      expect(t.hasBeenUpdated()).toBe(false);
    });

    it('reports that a hud update is needed once flagged', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.flagForHudUpdate();

      // Act
      const result = t.needsHudUpdate();

      // Assert
      expect(result).toBe(true);
    });

    it('reports that no hud update is needed once acknowledged', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.flagForHudUpdate();
      t.acknowledgeHudUpdate();

      // Act
      const result = t.needsHudUpdate();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('canUpdateTime', () =>
  {
    it('returns true when the frame count divides evenly by the tick speed', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.setTickFrames(60);
      Graphics.frameCount = 120;

      // Act
      const result = t.canUpdateTime();

      // Assert
      expect(result).toBe(true);
    });

    it('returns false when the frame count does not divide evenly by the tick speed', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.setTickFrames(60);
      Graphics.frameCount = 121;

      // Act
      const result = t.canUpdateTime();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('update', () =>
  {
    it('advances time when the tick aligns', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.setTickFrames(60);
      Graphics.frameCount = 60;
      const before = t.seconds();

      // Act
      t.update();

      // Assert
      expect(t.seconds()).not.toBe(before);
    });

    it('leaves time alone when the tick does not align', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.setTickFrames(60);
      Graphics.frameCount = 61;
      const before = t.seconds();

      // Act
      t.update();

      // Assert
      expect(t.seconds()).toBe(before);
    });

    it('processes a pending tone change when one is needed', () =>
    {
      // Arrange
      const t = new Game_Time();
      J.TIME.Metadata.ChangeToneByTime = true;
      Graphics.frameCount = 1;
      t.setTickFrames(60);
      t.setCurrentTone([ 1, 2, 3, 4 ]);
      t.setNeedsToneChange(true);
      const tint = vi.spyOn($gameScreen, 'startTint');

      // Act
      t.update();
      tint.mockRestore();

      // Assert
      expect(t.getNeedsToneChange()).toBe(false);
    });

    it('skips tone processing when none is pending', () =>
    {
      // Arrange
      const t = new Game_Time();
      J.TIME.Metadata.ChangeToneByTime = true;
      Graphics.frameCount = 1;
      t.setTickFrames(60);
      t.setNeedsToneChange(false);
      const tint = vi.spyOn($gameScreen, 'startTint');

      // Act
      t.update();
      const called = tint.mock.calls.length;
      tint.mockRestore();

      // Assert
      expect(called).toBe(0);
    });
  });

  describe('getNeedsToneChange', () =>
  {
    it('returns false when tone changes are disabled in metadata', () =>
    {
      // Arrange
      const t = new Game_Time();
      J.TIME.Metadata.ChangeToneByTime = false;
      t.setNeedsToneChange(true);

      // Act
      const result = t.getNeedsToneChange();

      // Assert
      expect(result).toBe(false);
    });

    it('returns false and warns when there is no map data to inspect', () =>
    {
      // Arrange
      const t = new Game_Time();
      J.TIME.Metadata.ChangeToneByTime = true;
      t.setNeedsToneChange(true);
      $dataMap = null;
      const warn = vi.spyOn(console, 'warn').mockImplementation(() =>
      {
      });

      // Act
      const result = t.getNeedsToneChange();
      warn.mockRestore();

      // Assert
      expect(result).toBe(false);
    });

    it('returns false when the map data carries no meta block', () =>
    {
      // Arrange
      const t = new Game_Time();
      J.TIME.Metadata.ChangeToneByTime = true;
      t.setNeedsToneChange(true);
      $dataMap = {};
      const warn = vi.spyOn(console, 'warn').mockImplementation(() =>
      {
      });

      // Act
      const result = t.getNeedsToneChange();
      warn.mockRestore();

      // Assert
      expect(result).toBe(false);
    });

    it('still reports a pending change on a map that opts out of the tone cycle', () =>
    {
      // Arrange
      const t = new Game_Time();
      J.TIME.Metadata.ChangeToneByTime = true;
      t.setNeedsToneChange(true);
      $dataMap = { meta: { noToneChange: true } };

      // Act
      const result = t.getNeedsToneChange();

      // Assert
      // suppressing the change here is what used to strand the previous map's tone on screen; the
      // opt-out now resolves to a neutral target tone that this pipeline goes on to apply.
      expect(result).toBe(true);
    });

    it('returns the pending flag when nothing blocks the tone change', () =>
    {
      // Arrange
      const t = new Game_Time();
      J.TIME.Metadata.ChangeToneByTime = true;
      t.setNeedsToneChange(true);

      // Act
      const result = t.getNeedsToneChange();

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('setNeedsToneChange', () =>
  {
    it('defaults to flagging a change as needed', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.setNeedsToneChange(false);

      // Act
      t.setNeedsToneChange();

      // Assert
      expect(t._needsToneChange).toBe(true);
    });

    it('accepts an explicit false', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.setNeedsToneChange(true);

      // Act
      t.setNeedsToneChange(false);

      // Assert
      expect(t._needsToneChange).toBe(false);
    });
  });

  describe('canUpdateTone', () =>
  {
    it('returns false when tone changes are disabled in metadata', () =>
    {
      // Arrange
      const t = new Game_Time();
      J.TIME.Metadata.ChangeToneByTime = false;

      // Act
      const result = t.canUpdateTone();

      // Assert
      expect(result).toBe(false);
    });

    it('returns false when the tone is locked', () =>
    {
      // Arrange
      const t = new Game_Time();
      J.TIME.Metadata.ChangeToneByTime = true;
      t.lockTone();

      // Act
      const result = t.canUpdateTone();

      // Assert
      expect(result).toBe(false);
    });

    it('returns true when enabled and unlocked', () =>
    {
      // Arrange
      const t = new Game_Time();
      J.TIME.Metadata.ChangeToneByTime = true;
      t.unlockTone();

      // Act
      const result = t.canUpdateTone();

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('updateCurrentTone', () =>
  {
    it('does nothing when the tone cannot be updated', () =>
    {
      // Arrange
      const t = new Game_Time();
      J.TIME.Metadata.ChangeToneByTime = false;
      t.setCurrentTone([ 9, 9, 9, 9 ]);

      // Act
      t.updateCurrentTone();

      // Assert
      expect(t.getCurrentTone()).toEqual([ 9, 9, 9, 9 ]);
    });

    it('adopts the target tone and flags a change when the tone differs', () =>
    {
      // Arrange
      const t = new Game_Time();
      J.TIME.Metadata.ChangeToneByTime = true;
      t.unlockTone();
      t.setHours(3);
      t.setCurrentTone([ 9, 9, 9, 9 ]);

      // Act
      t.updateCurrentTone();

      // Assert
      expect(t.getCurrentTone()).toEqual(t.translateHourToTone());
      expect(t._needsToneChange).toBe(true);
    });

    it('leaves the flag alone when the tone already matches', () =>
    {
      // Arrange
      const t = new Game_Time();
      J.TIME.Metadata.ChangeToneByTime = true;
      t.unlockTone();
      t.setHours(3);
      t.setCurrentTone(t.translateHourToTone().clone());
      t.setNeedsToneChange(false);

      // Act
      t.updateCurrentTone();

      // Assert
      expect(t._needsToneChange).toBe(false);
    });
  });

  describe('targetTone', () =>
  {
    it('resolves to the tone of the current hour on an ordinary map', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.setHours(3);
      $dataMap = { meta: {} };

      // Act
      const result = t.targetTone();

      // Assert
      expect(result).toEqual(t.translateHourToTone());
    });

    it('resolves to a neutral tone on a map that opts out of the tone cycle', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.setHours(3);
      $dataMap = { meta: { noToneChange: true } };

      // Act
      const result = t.targetTone();

      // Assert
      expect(result).toEqual([ 0, 0, 0, 0 ]);
    });
  });

  describe('isToneSuppressedByMap', () =>
  {
    it('reports no suppression when there is no map loaded', () =>
    {
      // Arrange
      const t = new Game_Time();
      $dataMap = null;

      // Act
      const result = t.isToneSuppressedByMap();

      // Assert
      expect(result).toBe(false);
    });

    it('reports no suppression when the map carries no meta block', () =>
    {
      // Arrange
      const t = new Game_Time();
      $dataMap = {};

      // Act
      const result = t.isToneSuppressedByMap();

      // Assert
      expect(result).toBe(false);
    });

    it('reports no suppression on a map without the opt-out tag', () =>
    {
      // Arrange
      const t = new Game_Time();
      $dataMap = { meta: {} };

      // Act
      const result = t.isToneSuppressedByMap();

      // Assert
      expect(result).toBe(false);
    });

    it('reports suppression on a map carrying the opt-out tag', () =>
    {
      // Arrange
      const t = new Game_Time();
      $dataMap = { meta: { noToneChange: true } };

      // Act
      const result = t.isToneSuppressedByMap();

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('updateCurrentTone on a tone-suppressed map', () =>
  {
    it('adopts the neutral tone so the previous map\'s tone cannot linger', () =>
    {
      // Arrange
      const t = new Game_Time();
      J.TIME.Metadata.ChangeToneByTime = true;
      t.unlockTone();
      t.setHours(3);
      // arrive carrying the deep night tone the outdoor map left behind.
      t.setCurrentTone([ -100, -100, -30, 100 ]);
      $dataMap = { meta: { noToneChange: true } };

      // Act
      t.updateCurrentTone();

      // Assert
      expect(t.getCurrentTone()).toEqual([ 0, 0, 0, 0 ]);
      expect(t.getNeedsToneChange()).toBe(true);
    });
  });

  describe('isSameTone', () =>
  {
    it('returns false when the current tone is not a full rgba quad', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.setCurrentTone([ 1, 2 ]);

      // Act
      const result = t.isSameTone([ 1, 2, 3, 4 ]);

      // Assert
      expect(result).toBe(false);
    });

    it('returns false when the red channel differs', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.setCurrentTone([ 1, 2, 3, 4 ]);

      // Act
      const result = t.isSameTone([ 9, 2, 3, 4 ]);

      // Assert
      expect(result).toBe(false);
    });

    it('returns false when the green channel differs', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.setCurrentTone([ 1, 2, 3, 4 ]);

      // Act
      const result = t.isSameTone([ 1, 9, 3, 4 ]);

      // Assert
      expect(result).toBe(false);
    });

    it('returns false when the blue channel differs', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.setCurrentTone([ 1, 2, 3, 4 ]);

      // Act
      const result = t.isSameTone([ 1, 2, 9, 4 ]);

      // Assert
      expect(result).toBe(false);
    });

    it('returns false when the grey channel differs', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.setCurrentTone([ 1, 2, 3, 4 ]);

      // Act
      const result = t.isSameTone([ 1, 2, 3, 9 ]);

      // Assert
      expect(result).toBe(false);
    });

    it('returns true when every channel matches', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.setCurrentTone([ 1, 2, 3, 4 ]);

      // Act
      const result = t.isSameTone([ 1, 2, 3, 4 ]);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('translateHourToTone', () =>
  {
    // the full 24-hour table, captured from the shipped switch. this doubles as the regression net
    // for collapsing that switch into a phase/quarter lookup- every hour must keep its exact tone.
    const expectedByHour = [
      [ -76, -76, -8, 76 ],
      [ -84, -84, -15, 84 ],
      [ -92, -92, -23, 92 ],
      [ -100, -100, -30, 100 ],
      [ -82, -79, -19, 91 ],
      [ -65, -57, -7, 82 ],
      [ -47, -36, 4, 73 ],
      [ -30, -15, 15, 64 ],
      [ -22, -11, 11, 48 ],
      [ -15, -7, 7, 32 ],
      [ -7, -4, 4, 16 ],
      [ 0, 0, 0, 0 ],
      [ 3, 3, 3, 3 ],
      [ 5, 5, 5, 5 ],
      [ 8, 8, 8, 8 ],
      [ 10, 10, 10, 10 ],
      [ 7, 0, 0, 0 ],
      [ 5, -10, -10, -10 ],
      [ 2, -20, -20, -20 ],
      [ 0, -30, -30, -30 ],
      [ -17, -40, -22, -5 ],
      [ -34, -49, -15, 19 ],
      [ -51, -59, -7, 44 ],
      [ -68, -68, 0, 68 ],
    ];

    expectedByHour.forEach((expected, hour) =>
    {
      it(`maps hour ${hour} to its designated tone`, () =>
      {
        // Arrange
        const t = new Game_Time();
        t.setHours(hour);

        // Act
        const result = t.translateHourToTone();

        // Assert
        expect(result).toEqual(expected);
      });
    });

    it('reads the real-world hour when real time is enabled', () =>
    {
      // Arrange
      const t = new Game_Time();
      J.TIME.Metadata.UseRealTime = true;
      t.setHours(3);
      const realHour = new Date().getHours();

      // Act
      const result = t.translateHourToTone();

      // Assert
      expect(result).toEqual(expectedByHour[realHour]);
    });
  });

  describe('processToneChange', () =>
  {
    it('tints over the standard transition by default', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.setCurrentTone([ 1, 2, 3, 4 ]);
      const tint = vi.spyOn($gameScreen, 'startTint');

      // Act
      t.processToneChange();
      const [ call ] = tint.mock.calls;
      tint.mockRestore();

      // Assert
      expect(call).toEqual([ [ 1, 2, 3, 4 ], 300 ]);
    });

    it('tints near-instantly when told to skip the transition', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.setCurrentTone([ 1, 2, 3, 4 ]);
      const tint = vi.spyOn($gameScreen, 'startTint');

      // Act
      t.processToneChange(true);
      const [ call ] = tint.mock.calls;
      tint.mockRestore();

      // Assert
      expect(call).toEqual([ [ 1, 2, 3, 4 ], 1 ]);
    });
  });

  describe('timeOfDay', () =>
  {
    it('maps the small hours to the night bucket', () =>
    {
      // Arrange
      const t = new Game_Time();

      // Act
      // Assert
      expect(t.timeOfDay(0)).toBe(0);
    });

    it('maps the early morning to the dawn bucket', () =>
    {
      // Arrange
      const t = new Game_Time();

      // Act
      // Assert
      expect(t.timeOfDay(5)).toBe(1);
    });

    it('maps mid-morning to the morning bucket', () =>
    {
      // Arrange
      const t = new Game_Time();

      // Act
      // Assert
      expect(t.timeOfDay(9)).toBe(2);
    });

    it('maps midday to the afternoon bucket', () =>
    {
      // Arrange
      const t = new Game_Time();

      // Act
      // Assert
      expect(t.timeOfDay(12)).toBe(3);
    });

    it('maps late day to the evening bucket', () =>
    {
      // Arrange
      const t = new Game_Time();

      // Act
      // Assert
      expect(t.timeOfDay(17)).toBe(4);
    });

    it('maps the late hours to the twilight bucket', () =>
    {
      // Arrange
      const t = new Game_Time();

      // Act
      // Assert
      expect(t.timeOfDay(22)).toBe(5);
    });

    it('returns the unknown sentinel when the hour is not a comparable number', () =>
    {
      // Arrange
      const t = new Game_Time();

      // Act
      // Assert
      expect(t.timeOfDay(Number.NaN)).toBe(-1);
    });
  });

  describe('startOfTimeOfDay', () =>
  {
    it('converts a time-of-day id into the hour it begins on', () =>
    {
      // Arrange
      const t = new Game_Time();

      // Act
      const result = t.startOfTimeOfDay(3);

      // Assert
      expect(result).toBe(12);
    });
  });

  describe('seasonOfYear', () =>
  {
    it('maps a spring month to the spring bucket', () =>
    {
      // Arrange
      const t = new Game_Time();

      // Act
      // Assert
      expect(t.seasonOfYear(4)).toBe(0);
    });

    it('maps a summer month to the summer bucket', () =>
    {
      // Arrange
      const t = new Game_Time();

      // Act
      // Assert
      expect(t.seasonOfYear(6)).toBe(1);
    });

    it('maps an autumn month to the autumn bucket', () =>
    {
      // Arrange
      const t = new Game_Time();

      // Act
      // Assert
      expect(t.seasonOfYear(10)).toBe(2);
    });

    it('maps a winter month to the winter bucket', () =>
    {
      // Arrange
      const t = new Game_Time();

      // Act
      // Assert
      expect(t.seasonOfYear(12)).toBe(3);
    });

    it('returns the unknown sentinel for a month outside the calendar', () =>
    {
      // Arrange
      const t = new Game_Time();

      // Act
      // Assert
      expect(t.seasonOfYear(13)).toBe(-1);
    });
  });

  describe('snapshots', () =>
  {
    it('builds an artificial snapshot from the current clock', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.setTime(1, 2, 3, 4, 5, 2020);

      // Act
      const snapshot = t.determineArtificialTime();

      // Assert
      expect([ snapshot.seconds, snapshot.minutes, snapshot.hours ]).toEqual([ 1, 2, 3 ]);
      expect([ snapshot.days, snapshot.months, snapshot.years ]).toEqual([ 4, 5, 2020 ]);
    });

    it('builds a real snapshot from the wall clock', () =>
    {
      // Arrange
      const t = new Game_Time();
      const now = new Date();

      // Act
      const snapshot = t.determineRealTime();

      // Assert
      expect(snapshot.years).toBe(now.getFullYear());
      expect(snapshot.months).toBe(now.getMonth() + 1);
    });

    it('routes the snapshot through artificial time when real time is disabled', () =>
    {
      // Arrange
      const t = new Game_Time();
      J.TIME.Metadata.UseRealTime = false;
      t.setTime(1, 2, 3, 4, 5, 2020);

      // Act
      const snapshot = t.getTimeSnapshot();

      // Assert
      expect(snapshot.years).toBe(2020);
    });

    it('routes the snapshot through real time when real time is enabled', () =>
    {
      // Arrange
      const t = new Game_Time();
      J.TIME.Metadata.UseRealTime = true;

      // Act
      const snapshot = t.getTimeSnapshot();

      // Assert
      expect(snapshot.years).toBe(new Date().getFullYear());
    });

    it('exposes the snapshot through the currentTime alias', () =>
    {
      // Arrange
      const t = new Game_Time();
      J.TIME.Metadata.UseRealTime = false;
      t.setTime(1, 2, 3, 4, 5, 2020);

      // Act
      const snapshot = t.currentTime();

      // Assert
      expect(snapshot.years).toBe(2020);
    });

    it('builds a snapshot from a raw six-part array', () =>
    {
      // Arrange
      const t = new Game_Time();

      // Act
      const snapshot = t.toTimeSnapshot([ 1, 2, 3, 4, 6, 2020 ]);

      // Assert
      expect(snapshot.hours).toBe(3);
      expect(snapshot._seasonOfYearId).toBe(1);
    });
  });

  describe('updateVariables', () =>
  {
    it('writes nothing when variable assignment is disabled', () =>
    {
      // Arrange
      const t = new Game_Time();
      J.TIME.Metadata.UseVariableAssignment = false;
      const setValue = vi.spyOn($gameVariables, 'setValue');

      // Act
      t.updateVariables();
      const called = setValue.mock.calls.length;
      setValue.mockRestore();

      // Assert
      expect(called).toBe(0);
    });

    it('writes every time component out when variable assignment is enabled', () =>
    {
      // Arrange
      const t = new Game_Time();
      J.TIME.Metadata.UseVariableAssignment = true;
      const setValue = vi.spyOn($gameVariables, 'setValue');

      // Act
      t.updateVariables();
      const called = setValue.mock.calls.length;
      setValue.mockRestore();

      // Assert
      expect(called).toBe(10);
    });

    it('writes nothing by snapshot when variable assignment is disabled', () =>
    {
      // Arrange
      const t = new Game_Time();
      J.TIME.Metadata.UseVariableAssignment = false;
      const snapshot = t.determineArtificialTime();
      const setValue = vi.spyOn($gameVariables, 'setValue');

      // Act
      t.updateVariablesBySnapshot(snapshot);
      const called = setValue.mock.calls.length;
      setValue.mockRestore();

      // Assert
      expect(called).toBe(0);
    });

    it('writes the supplied snapshot to the configured variable ids', () =>
    {
      // Arrange
      const t = new Game_Time();
      J.TIME.Metadata.UseVariableAssignment = true;
      t.setTime(1, 2, 3, 4, 5, 2020);
      const snapshot = t.determineArtificialTime();
      const setValue = vi.spyOn($gameVariables, 'setValue');

      // Act
      t.updateVariablesBySnapshot(snapshot);
      const { calls } = setValue.mock;
      setValue.mockRestore();

      // Assert
      expect(calls[0]).toEqual([ J.TIME.Metadata.SecondsVariable, 1 ]);
      expect(calls[5]).toEqual([ J.TIME.Metadata.YearsVariable, 2020 ]);
    });
  });

  describe('setTime', () =>
  {
    it('assigns every component when using artificial time', () =>
    {
      // Arrange
      const t = new Game_Time();
      J.TIME.Metadata.UseRealTime = false;

      // Act
      t.setTime(1, 2, 3, 4, 5, 2020);

      // Assert
      expect([ t.seconds(), t.minutes(), t.hours(), t.days(), t.months(), t.years() ])
        .toEqual([ 1, 2, 3, 4, 5, 2020 ]);
    });

    it('refuses to assign anything when using real time', () =>
    {
      // Arrange
      const t = new Game_Time();
      J.TIME.Metadata.UseRealTime = true;
      const before = t.hours();

      // Act
      t.setTime(1, 2, 3, 4, 5, 2020);

      // Assert
      expect(t.hours()).toBe(before);
    });
  });

  describe('jumpToTimeOfDay', () =>
  {
    it('rolls into the following day when the target has already passed', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.setTime(30, 30, 20, 1, 1, 2020);

      // Act
      t.jumpToTimeOfDay(1);

      // Assert
      expect(t.hours()).toBe(4);
      expect(t.days()).toBe(2);
      expect([ t.seconds(), t.minutes() ]).toEqual([ 0, 0 ]);
    });

    it('advances within the same day when the target is still ahead', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.setTime(30, 30, 2, 1, 1, 2020);

      // Act
      t.jumpToTimeOfDay(3);

      // Assert
      expect(t.hours()).toBe(12);
      expect(t.days()).toBe(1);
    });
  });

  describe('tickTime', () =>
  {
    it('advances the clock by the configured seconds-per-tick', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.setTime(0, 0, 9, 1, 1, 2020);

      // Act
      t.tickTime();

      // Assert
      expect(t.seconds()).toBe(J.TIME.Metadata.SecondsPerIncrement);
    });
  });

  describe('addSeconds', () =>
  {
    it('accumulates below the sixty-second rollover', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.setTime(0, 0, 9, 1, 1, 2020);

      // Act
      t.addSeconds(59);

      // Assert
      expect(t.seconds()).toBe(59);
    });

    it('carries into the minutes at the sixty-second rollover', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.setTime(0, 0, 9, 1, 1, 2020);

      // Act
      t.addSeconds(65);

      // Assert
      expect(t.seconds()).toBe(5);
      expect(t.minutes()).toBe(J.TIME.Metadata.MinutesPerIncrement);
    });

    it('produces a negative second count when handed a negative amount', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.setTime(10, 5, 9, 1, 1, 2020);

      // Act
      t.addSeconds(-30);

      // Assert
      // KNOWN DEFECT, characterized rather than endorsed: the rollover only carries upward, so the
      // "lose time" plugin command drives the clock negative instead of borrowing from the minutes.
      expect(t.seconds()).toBe(-20);
      expect(t.minutes()).toBe(5);
    });

    it('defaults to the configured seconds-per-tick when given no amount', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.setTime(0, 0, 9, 1, 1, 2020);

      // Act
      t.addSeconds();

      // Assert
      expect(t.seconds()).toBe(J.TIME.Metadata.SecondsPerIncrement);
    });
  });

  describe('addMinutes', () =>
  {
    it('accumulates below the sixty-minute rollover', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.setTime(0, 0, 9, 1, 1, 2020);

      // Act
      t.addMinutes(59);

      // Assert
      expect(t.minutes()).toBe(59);
    });

    it('carries into the hours at the sixty-minute rollover', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.setTime(0, 0, 9, 1, 1, 2020);

      // Act
      t.addMinutes(65);

      // Assert
      expect(t.minutes()).toBe(5);
      expect(t.hours()).toBe(9 + J.TIME.Metadata.HoursPerIncrement);
    });

    it('defaults to the configured minutes-per-tick when given no amount', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.setTime(0, 0, 9, 1, 1, 2020);

      // Act
      t.addMinutes();

      // Assert
      expect(t.minutes()).toBe(J.TIME.Metadata.MinutesPerIncrement);
    });
  });

  describe('addHours', () =>
  {
    it('accumulates below the twenty-four-hour rollover', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.setTime(0, 0, 0, 1, 1, 2020);

      // Act
      t.addHours(23);

      // Assert
      expect(t.hours()).toBe(23);
    });

    it('carries into the days at the twenty-four-hour rollover', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.setTime(0, 0, 0, 1, 1, 2020);

      // Act
      t.addHours(26);

      // Assert
      expect(t.hours()).toBe(2);
      expect(t.days()).toBe(1 + J.TIME.Metadata.DaysPerIncrement);
    });

    it('defaults to the configured hours-per-tick when given no amount', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.setTime(0, 0, 0, 1, 1, 2020);

      // Act
      t.addHours();

      // Assert
      expect(t.hours()).toBe(J.TIME.Metadata.HoursPerIncrement);
    });
  });

  describe('addDays', () =>
  {
    it('accumulates below the thirty-day rollover', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.setTime(0, 0, 0, 1, 1, 2020);

      // Act
      t.addDays(29);

      // Assert
      expect(t.days()).toBe(30);
    });

    it('carries into the months past the thirty-day rollover', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.setTime(0, 0, 0, 1, 1, 2020);

      // Act
      t.addDays(31);

      // Assert
      expect(t.days()).toBe(2);
      expect(t.months()).toBe(1 + J.TIME.Metadata.MonthsPerIncrement);
    });

    it('defaults to the configured days-per-tick when given no amount', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.setTime(0, 0, 0, 1, 1, 2020);

      // Act
      t.addDays();

      // Assert
      expect(t.days()).toBe(1 + J.TIME.Metadata.DaysPerIncrement);
    });
  });

  describe('addMonths', () =>
  {
    it('accumulates below the twelve-month rollover', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.setTime(0, 0, 0, 1, 1, 2020);

      // Act
      t.addMonths(11);

      // Assert
      expect(t.months()).toBe(12);
    });

    it('carries into the years past the twelve-month rollover', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.setTime(0, 0, 0, 1, 1, 2020);

      // Act
      t.addMonths(13);

      // Assert
      expect(t.months()).toBe(2);
      expect(t.years()).toBe(2020 + J.TIME.Metadata.YearsPerIncrement);
    });

    it('defaults to the configured months-per-tick when given no amount', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.setTime(0, 0, 0, 1, 1, 2020);

      // Act
      t.addMonths();

      // Assert
      expect(t.months()).toBe(1 + J.TIME.Metadata.MonthsPerIncrement);
    });
  });

  describe('addYears', () =>
  {
    it('adds the requested number of years', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.setTime(0, 0, 0, 1, 1, 2020);

      // Act
      t.addYears(5);

      // Assert
      expect(t.years()).toBe(2025);
    });

    it('defaults to the configured years-per-tick when given no amount', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.setTime(0, 0, 0, 1, 1, 2020);

      // Act
      t.addYears();

      // Assert
      expect(t.years()).toBe(2020 + J.TIME.Metadata.YearsPerIncrement);
    });
  });
});
//endregion plugins/time/core/_models/game-time.test.js
