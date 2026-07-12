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

  it('Game_Event.meetsConditions respects timeRangePage tag', () =>
  {
    const ev = new globalThis.Game_Event();

    // 08:30 inside the range.
    globalThis.$gameTime.setTime(0, 30, 8, 1, 6, 2024);
    const page = pageWithComments([ '<timeRangePage:8:00-9:00>' ]);
    expect(ev.meetsConditions(page)).toBe(true);

    // 07:59 outside the range.
    globalThis.$gameTime.setTime(0, 59, 7, 1, 6, 2024);
    expect(ev.meetsConditions(page)).toBe(false);
  });

  it('Game_Event.meetsConditions respects seasonOfYearPage tag', () =>
  {
    const ev = new globalThis.Game_Event();

    // june should be summer in the shipped mapping.
    globalThis.$gameTime.setTime(0, 0, 12, 1, 6, 2024);
    const page = pageWithComments([ '<seasonOfYearPage:summer>' ]);
    expect(ev.meetsConditions(page)).toBe(true);

    // january should not be summer.
    globalThis.$gameTime.setTime(0, 0, 12, 1, 1, 2024);
    expect(ev.meetsConditions(page)).toBe(false);
  });

  it('Game_Event.meetsConditions respects direct minutePage/dayPage/monthPage/yearPage tags', () =>
  {
    const ev = new globalThis.Game_Event();

    // 2024-06-01, minute 30.
    globalThis.$gameTime.setTime(0, 30, 12, 1, 6, 2024);
    expect(ev.meetsConditions(pageWithComments([ '<minutePage:30>' ]))).toBe(true);
    expect(ev.meetsConditions(pageWithComments([ '<minutePage:31>' ]))).toBe(false);

    expect(ev.meetsConditions(pageWithComments([ '<dayPage:1>' ]))).toBe(true);
    expect(ev.meetsConditions(pageWithComments([ '<dayPage:2>' ]))).toBe(false);

    expect(ev.meetsConditions(pageWithComments([ '<monthPage:6>' ]))).toBe(true);
    expect(ev.meetsConditions(pageWithComments([ '<monthPage:7>' ]))).toBe(false);

    expect(ev.meetsConditions(pageWithComments([ '<yearPage:2024>' ]))).toBe(true);
    expect(ev.meetsConditions(pageWithComments([ '<yearPage:2025>' ]))).toBe(false);
  });

  it('Game_Event.meetsConditions respects timeOfDayPage tag by both numeric id and name', () =>
  {
    const ev = new globalThis.Game_Event();

    globalThis.$gameTime.setTime(0, 0, 9, 1, 6, 2024);
    expect(ev.meetsConditions(pageWithComments([ '<timeOfDayPage:2>' ]))).toBe(true);
    expect(ev.meetsConditions(pageWithComments([ '<timeOfDayPage:morning>' ]))).toBe(true);
    expect(ev.meetsConditions(pageWithComments([ '<timeOfDayPage:night>' ]))).toBe(false);
  });

  it('Game_Event.meetsConditions respects range page tags (hourRangePage) across a boundary', () =>
  {
    const ev = new globalThis.Game_Event();
    const page = pageWithComments([ '<hourRangePage:8-9>' ]);

    globalThis.$gameTime.setTime(0, 30, 8, 1, 6, 2024);
    expect(ev.meetsConditions(page)).toBe(true);

    globalThis.$gameTime.setTime(0, 30, 10, 1, 6, 2024);
    expect(ev.meetsConditions(page)).toBe(false);
  });

  it('Game_Event.meetsConditions respects fullDateRangePage tag across the full range', () =>
  {
    const ev = new globalThis.Game_Event();

    // bracket order is [minutes, hours, days, months, years] per TimeMapper.fullDateRangeToConditional.
    const page = pageWithComments([ '<fullDateRangePage:[0,0,1,1,2024]-[0,0,31,12,2024]>' ]);

    globalThis.$gameTime.setTime(0, 0, 12, 15, 6, 2024);
    expect(ev.meetsConditions(page)).toBe(true);

    globalThis.$gameTime.setTime(0, 0, 12, 15, 6, 2025);
    expect(ev.meetsConditions(page)).toBe(false);
  });

  it('Game_Interpreter.shouldHideChoiceBranch hides when choice conditional not met', () =>
  {
    const interp = new globalThis.Game_Interpreter();

    globalThis.$gameTime.setTime(0, 0, 12, 1, 6, 2024);

    const commands = [
      { code: 108, indent: 0, parameters: [ '<hourChoice:7>' ] },
    ];

    globalThis.$gameMap = {
      event()
      {
        return { page: () => ({ list: commands }) };
      },
    };
    interp.eventId = () => 1;
    interp.currentCommand = () => ({ indent: 0 });

    expect(interp.shouldHideChoiceBranch(0)).toBe(true);

    globalThis.$gameTime.setTime(0, 0, 7, 1, 6, 2024);
    expect(interp.shouldHideChoiceBranch(0)).toBe(false);
  });

  it('Game_Interpreter.shouldHideChoiceBranch respects dayChoice and seasonOfYearChoice tags', () =>
  {
    const interp = new globalThis.Game_Interpreter();
    interp.eventId = () => 1;
    interp.currentCommand = () => ({ indent: 0 });

    globalThis.$gameMap = {
      event()
      {
        return { page: () => ({ list: [ { code: 108, indent: 0, parameters: [ '<dayChoice:1>' ] } ] }) };
      },
    };

    globalThis.$gameTime.setTime(0, 0, 12, 1, 6, 2024);
    expect(interp.shouldHideChoiceBranch(0)).toBe(false);

    globalThis.$gameTime.setTime(0, 0, 12, 2, 6, 2024);
    expect(interp.shouldHideChoiceBranch(0)).toBe(true);

    globalThis.$gameMap = {
      event()
      {
        return {
          page: () => ({ list: [ { code: 108, indent: 0, parameters: [ '<seasonOfYearChoice:summer>' ] } ] }),
        };
      },
    };

    globalThis.$gameTime.setTime(0, 0, 12, 1, 6, 2024);
    expect(interp.shouldHideChoiceBranch(0)).toBe(false);

    globalThis.$gameTime.setTime(0, 0, 12, 1, 1, 2024);
    expect(interp.shouldHideChoiceBranch(0)).toBe(true);
  });
});
//endregion plugins/time/event-page-and-choice-conditionals-direct.test.js
