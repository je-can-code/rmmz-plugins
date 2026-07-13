//region plugins/time/event-page-and-choice-conditionals-direct.test.js
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { installTimeHostGlobals } from './fixtures/install-time-host-globals.js';

/**
 * Direct-import counterpart to event-page-and-choice-conditionals.test.js. That file's assertions are real
 * and pass, but its coverage of Game_Event.js/Game_Interpreter.js is silently dropped: raw V8 coverage
 * (verified via NODE_V8_COVERAGE against a standalone repro) shows real, correct hit counts for every
 * function this test exercises, but vitest's coverage-v8 provider fails to convert that into the istanbul
 * report for functions defined via `Foo.bar = function() {...}` assignment inside a vm.Script-evaluated
 * bundle- confirmed NOT a cross-file merge issue and NOT a worker-pool artifact. Direct-importing the real
 * source (same globalThis-stub technique validated for _base) sidesteps vm.Script entirely, landing this
 * execution inside vitest's own instrumented realm where coverage attributes correctly.
 */
describe('J-TIME event page + choice conditionals (direct src import)', () =>
{
  let Game_Time;

  beforeAll(async () =>
  {
    vi.resetModules();

    installTimeHostGlobals();

    await import('../../../src/plugins/time/core/_metadata/initialization.js');

    ({ default: Game_Time } = await import('../../../src/plugins/time/core/_models/Game_Time.js'));

    // patches globalThis.Game_Event.prototype/statics directly, no vm involved.
    await import('../../../src/plugins/time/core/objects/Game_Event.js');

    // patches globalThis.Game_Interpreter.prototype directly, no vm involved.
    await import('../../../src/plugins/time/core/objects/Game_Interpreter.js');

    globalThis.$gameTime = new Game_Time();

    // provide a default implementation for non-time page conditions.
    globalThis.J.TIME.Aliased.Game_Event.set('meetsConditions', function()
    {
      return true;
    });

    // provide a default implementation for non-time choice visibility.
    globalThis.J.TIME.Aliased.Game_Interpreter.set('shouldHideChoiceBranch', function()
    {
      return false;
    });
  });

  afterAll(() =>
  {
    vi.unstubAllGlobals();
  });

  function pageWithComments(comments)
  {
    return {
      list: comments.map(c => ({ code: 108, indent: 0, parameters: [ c ] })),
    };
  }

  describe('Game_Event.meetsConditions', () =>
  {
    describe('timeRangePage tag', () =>
    {
      it('returns true when the current time is inside the range', () =>
      {
        // Arrange
        const ev = new globalThis.Game_Event();
        const page = pageWithComments([ '<timeRangePage:8:00-9:00>' ]);
        globalThis.$gameTime.setTime(0, 30, 8, 1, 6, 2024);

        // Act
        const result = ev.meetsConditions(page);

        // Assert
        expect(result).toBe(true);
      });

      it('returns false when the current time is outside the range', () =>
      {
        // Arrange
        const ev = new globalThis.Game_Event();
        const page = pageWithComments([ '<timeRangePage:8:00-9:00>' ]);
        globalThis.$gameTime.setTime(0, 59, 7, 1, 6, 2024);

        // Act
        const result = ev.meetsConditions(page);

        // Assert
        expect(result).toBe(false);
      });
    });

    describe('seasonOfYearPage tag', () =>
    {
      it('returns true when the current month falls within the tagged season', () =>
      {
        // Arrange- june should be summer in the shipped mapping.
        const ev = new globalThis.Game_Event();
        const page = pageWithComments([ '<seasonOfYearPage:summer>' ]);
        globalThis.$gameTime.setTime(0, 0, 12, 1, 6, 2024);

        // Act
        const result = ev.meetsConditions(page);

        // Assert
        expect(result).toBe(true);
      });

      it('returns false when the current month does not fall within the tagged season', () =>
      {
        // Arrange- january should not be summer.
        const ev = new globalThis.Game_Event();
        const page = pageWithComments([ '<seasonOfYearPage:summer>' ]);
        globalThis.$gameTime.setTime(0, 0, 12, 1, 1, 2024);

        // Act
        const result = ev.meetsConditions(page);

        // Assert
        expect(result).toBe(false);
      });
    });

    describe('minutePage tag', () =>
    {
      it('returns true when the current minute matches', () =>
      {
        // Arrange
        const ev = new globalThis.Game_Event();
        globalThis.$gameTime.setTime(0, 30, 12, 1, 6, 2024);

        // Act
        const result = ev.meetsConditions(pageWithComments([ '<minutePage:30>' ]));

        // Assert
        expect(result).toBe(true);
      });

      it('returns false when the current minute does not match', () =>
      {
        // Arrange
        const ev = new globalThis.Game_Event();
        globalThis.$gameTime.setTime(0, 30, 12, 1, 6, 2024);

        // Act
        const result = ev.meetsConditions(pageWithComments([ '<minutePage:31>' ]));

        // Assert
        expect(result).toBe(false);
      });
    });

    describe('dayPage tag', () =>
    {
      it('returns true when the current day matches', () =>
      {
        // Arrange
        const ev = new globalThis.Game_Event();
        globalThis.$gameTime.setTime(0, 30, 12, 1, 6, 2024);

        // Act
        const result = ev.meetsConditions(pageWithComments([ '<dayPage:1>' ]));

        // Assert
        expect(result).toBe(true);
      });

      it('returns false when the current day does not match', () =>
      {
        // Arrange
        const ev = new globalThis.Game_Event();
        globalThis.$gameTime.setTime(0, 30, 12, 1, 6, 2024);

        // Act
        const result = ev.meetsConditions(pageWithComments([ '<dayPage:2>' ]));

        // Assert
        expect(result).toBe(false);
      });
    });

    describe('monthPage tag', () =>
    {
      it('returns true when the current month matches', () =>
      {
        // Arrange
        const ev = new globalThis.Game_Event();
        globalThis.$gameTime.setTime(0, 30, 12, 1, 6, 2024);

        // Act
        const result = ev.meetsConditions(pageWithComments([ '<monthPage:6>' ]));

        // Assert
        expect(result).toBe(true);
      });

      it('returns false when the current month does not match', () =>
      {
        // Arrange
        const ev = new globalThis.Game_Event();
        globalThis.$gameTime.setTime(0, 30, 12, 1, 6, 2024);

        // Act
        const result = ev.meetsConditions(pageWithComments([ '<monthPage:7>' ]));

        // Assert
        expect(result).toBe(false);
      });
    });

    describe('yearPage tag', () =>
    {
      it('returns true when the current year matches', () =>
      {
        // Arrange
        const ev = new globalThis.Game_Event();
        globalThis.$gameTime.setTime(0, 30, 12, 1, 6, 2024);

        // Act
        const result = ev.meetsConditions(pageWithComments([ '<yearPage:2024>' ]));

        // Assert
        expect(result).toBe(true);
      });

      it('returns false when the current year does not match', () =>
      {
        // Arrange
        const ev = new globalThis.Game_Event();
        globalThis.$gameTime.setTime(0, 30, 12, 1, 6, 2024);

        // Act
        const result = ev.meetsConditions(pageWithComments([ '<yearPage:2025>' ]));

        // Assert
        expect(result).toBe(false);
      });
    });

    describe('timeOfDayPage tag', () =>
    {
      it('returns true when tagged by numeric time-of-day id', () =>
      {
        // Arrange
        const ev = new globalThis.Game_Event();
        globalThis.$gameTime.setTime(0, 0, 9, 1, 6, 2024);

        // Act
        const result = ev.meetsConditions(pageWithComments([ '<timeOfDayPage:2>' ]));

        // Assert
        expect(result).toBe(true);
      });

      it('returns true when tagged by time-of-day name', () =>
      {
        // Arrange
        const ev = new globalThis.Game_Event();
        globalThis.$gameTime.setTime(0, 0, 9, 1, 6, 2024);

        // Act
        const result = ev.meetsConditions(pageWithComments([ '<timeOfDayPage:morning>' ]));

        // Assert
        expect(result).toBe(true);
      });

      it('returns false when the current time-of-day does not match the tag', () =>
      {
        // Arrange
        const ev = new globalThis.Game_Event();
        globalThis.$gameTime.setTime(0, 0, 9, 1, 6, 2024);

        // Act
        const result = ev.meetsConditions(pageWithComments([ '<timeOfDayPage:night>' ]));

        // Assert
        expect(result).toBe(false);
      });
    });

    describe('hourRangePage tag', () =>
    {
      it('returns true when the current hour is inside the range', () =>
      {
        // Arrange
        const ev = new globalThis.Game_Event();
        const page = pageWithComments([ '<hourRangePage:8-9>' ]);
        globalThis.$gameTime.setTime(0, 30, 8, 1, 6, 2024);

        // Act
        const result = ev.meetsConditions(page);

        // Assert
        expect(result).toBe(true);
      });

      it('returns false when the current hour is outside the range', () =>
      {
        // Arrange
        const ev = new globalThis.Game_Event();
        const page = pageWithComments([ '<hourRangePage:8-9>' ]);
        globalThis.$gameTime.setTime(0, 30, 10, 1, 6, 2024);

        // Act
        const result = ev.meetsConditions(page);

        // Assert
        expect(result).toBe(false);
      });
    });

    describe('fullDateRangePage tag', () =>
    {
      // bracket order is [minutes, hours, days, months, years] per TimeMapper.fullDateRangeToConditional.
      const page = pageWithComments([ '<fullDateRangePage:[0,0,1,1,2024]-[0,0,31,12,2024]>' ]);

      it('returns true when the current date is inside the full range', () =>
      {
        // Arrange
        const ev = new globalThis.Game_Event();
        globalThis.$gameTime.setTime(0, 0, 12, 15, 6, 2024);

        // Act
        const result = ev.meetsConditions(page);

        // Assert
        expect(result).toBe(true);
      });

      it('returns false when the current date is outside the full range', () =>
      {
        // Arrange
        const ev = new globalThis.Game_Event();
        globalThis.$gameTime.setTime(0, 0, 12, 15, 6, 2025);

        // Act
        const result = ev.meetsConditions(page);

        // Assert
        expect(result).toBe(false);
      });
    });
  });

  describe('Game_Interpreter.shouldHideChoiceBranch', () =>
  {
    describe('hourChoice tag', () =>
    {
      function interpreterWithCommand(comment)
      {
        const interp = new globalThis.Game_Interpreter();
        interp.eventId = () => 1;
        interp.currentCommand = () => ({ indent: 0 });
        globalThis.$gameMap = {
          event: () => ({ page: () => ({ list: [ { code: 108, indent: 0, parameters: [ comment ] } ] }) }),
        };

        return interp;
      }

      it('hides the choice branch when the tagged hour does not match the current hour', () =>
      {
        // Arrange
        const interp = interpreterWithCommand('<hourChoice:7>');
        globalThis.$gameTime.setTime(0, 0, 12, 1, 6, 2024);

        // Act
        const result = interp.shouldHideChoiceBranch(0);

        // Assert
        expect(result).toBe(true);
      });

      it('shows the choice branch when the tagged hour matches the current hour', () =>
      {
        // Arrange
        const interp = interpreterWithCommand('<hourChoice:7>');
        globalThis.$gameTime.setTime(0, 0, 7, 1, 6, 2024);

        // Act
        const result = interp.shouldHideChoiceBranch(0);

        // Assert
        expect(result).toBe(false);
      });
    });

    describe('dayChoice tag', () =>
    {
      function interpreterWithDayChoice()
      {
        const interp = new globalThis.Game_Interpreter();
        interp.eventId = () => 1;
        interp.currentCommand = () => ({ indent: 0 });
        globalThis.$gameMap = {
          event: () => ({ page: () => ({ list: [ { code: 108, indent: 0, parameters: [ '<dayChoice:1>' ] } ] }) }),
        };

        return interp;
      }

      it('shows the choice branch when the tagged day matches the current day', () =>
      {
        // Arrange
        const interp = interpreterWithDayChoice();
        globalThis.$gameTime.setTime(0, 0, 12, 1, 6, 2024);

        // Act
        const result = interp.shouldHideChoiceBranch(0);

        // Assert
        expect(result).toBe(false);
      });

      it('hides the choice branch when the tagged day does not match the current day', () =>
      {
        // Arrange
        const interp = interpreterWithDayChoice();
        globalThis.$gameTime.setTime(0, 0, 12, 2, 6, 2024);

        // Act
        const result = interp.shouldHideChoiceBranch(0);

        // Assert
        expect(result).toBe(true);
      });
    });

    describe('seasonOfYearChoice tag', () =>
    {
      function interpreterWithSeasonChoice()
      {
        const interp = new globalThis.Game_Interpreter();
        interp.eventId = () => 1;
        interp.currentCommand = () => ({ indent: 0 });
        globalThis.$gameMap = {
          event: () => ({
            page: () => ({ list: [ { code: 108, indent: 0, parameters: [ '<seasonOfYearChoice:summer>' ] } ] }),
          }),
        };

        return interp;
      }

      it('shows the choice branch when the current month falls within the tagged season', () =>
      {
        // Arrange
        const interp = interpreterWithSeasonChoice();
        globalThis.$gameTime.setTime(0, 0, 12, 1, 6, 2024);

        // Act
        const result = interp.shouldHideChoiceBranch(0);

        // Assert
        expect(result).toBe(false);
      });

      it('hides the choice branch when the current month does not fall within the tagged season', () =>
      {
        // Arrange
        const interp = interpreterWithSeasonChoice();
        globalThis.$gameTime.setTime(0, 0, 12, 1, 1, 2024);

        // Act
        const result = interp.shouldHideChoiceBranch(0);

        // Assert
        expect(result).toBe(true);
      });
    });
  });
});
//endregion plugins/time/event-page-and-choice-conditionals-direct.test.js
