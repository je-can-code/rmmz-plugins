//region plugins/time/event-page-and-choice-conditionals.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadTimePluginVm, makeGameTime } from './time-vm.js';

describe('J-TIME event page + choice conditionals (out/J-TIME.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadTimePluginVm(sandbox);
    makeGameTime(sandbox);

    // provide a default implementation for non-time page conditions.
    sandbox.J.TIME.Aliased.Game_Event.set('meetsConditions', function()
    {
      return true;
    });

    // provide a default implementation for non-time choice visibility.
    sandbox.J.TIME.Aliased.Game_Interpreter.set('shouldHideChoiceBranch', function()
    {
      return false;
    });
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  function pageWithComments(comments)
  {
    return {
      list: comments.map(c => ({ code: 108, indent: 0, parameters: [ c ] })),
    };
  }

  it('Game_Event.meetsConditions respects timeRangePage tag', () =>
  {
    const ev = new sandbox.Game_Event();

    // 08:30 inside the range.
    sandbox.$gameTime.setTime(0, 30, 8, 1, 6, 2024);
    const page = pageWithComments([ '<timeRangePage:8:00-9:00>' ]);
    expect(ev.meetsConditions(page)).toBe(true);

    // 07:59 outside the range.
    sandbox.$gameTime.setTime(0, 59, 7, 1, 6, 2024);
    expect(ev.meetsConditions(page)).toBe(false);
  });

  it('Game_Event.meetsConditions respects seasonOfYearPage tag', () =>
  {
    const ev = new sandbox.Game_Event();

    // june should be summer in the shipped mapping.
    sandbox.$gameTime.setTime(0, 0, 12, 1, 6, 2024);
    const page = pageWithComments([ '<seasonOfYearPage:summer>' ]);
    expect(ev.meetsConditions(page)).toBe(true);

    // january should not be summer.
    sandbox.$gameTime.setTime(0, 0, 12, 1, 1, 2024);
    expect(ev.meetsConditions(page)).toBe(false);
  });

  it('Game_Interpreter.shouldHideChoiceBranch hides when choice conditional not met', () =>
  {
    const interp = new sandbox.Game_Interpreter();

    sandbox.$gameTime.setTime(0, 0, 12, 1, 6, 2024);

    // build a stub branch list: index 0 is the choice comment; the method expects a page list from $gameMap or common.
    const commands = [
      { code: 108, indent: 0, parameters: [ '<hourChoice:7>' ] },
    ];

    // emulate map lookup used by base MESSAGE-like choice parser in TIME file.
    sandbox.$gameMap = {
      event()
      {
        return { page: () => ({ list: commands }) };
      },
    };
    interp.eventId = () => 1;
    interp.currentCommand = () => ({ indent: 0 });

    // choice branch index points at the first command in list.
    expect(interp.shouldHideChoiceBranch(0)).toBe(true);

    // now meet the condition.
    sandbox.$gameTime.setTime(0, 0, 7, 1, 6, 2024);
    expect(interp.shouldHideChoiceBranch(0)).toBe(false);
  });
});
//endregion plugins/time/event-page-and-choice-conditionals.test.js

