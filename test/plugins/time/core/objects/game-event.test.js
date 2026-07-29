//region plugins/time/core/objects/game-event.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installTimeHostGlobals } from '../../_component/fixtures/install-time-host-globals.js';

/**
 * The end-to-end behavior of each page tag- an event page appearing or not at a given moment- lives
 * in the component test that drives real tags through the whole chain. What is covered here is the
 * dispatch machinery underneath: the early exits, every arm of the tag-to-conditional switch, and
 * the range arithmetic that only fires when a range wraps past midnight or past the hour.
 */
describe('Game_Event ext/time augments (direct src import)', () =>
{
  let Game_Time;

  beforeAll(async () =>
  {
    vi.resetModules();

    installTimeHostGlobals();

    await import('../../../../../src/plugins/time/core/_metadata/initialization.js');

    ({ default: Game_Time } = await import('../../../../../src/plugins/time/core/_models/Game_Time.js'));

    await import('../../../../../src/plugins/time/core/objects/Game_Event.js');

    globalThis.$gameTime = new Game_Time();
  });

  beforeEach(() =>
  {
    // by default the non-time page conditions are satisfied, so time gets to decide on its own.
    globalThis.J.TIME.Aliased.Game_Event.set('meetsConditions', () => true);

    globalThis.$gameTime.setTime(0, 0, 9, 1, 1, 2020);
  });

  /**
   * Wraps a comment string in the event command shape RMMZ produces for it.
   */
  const comment = text => ({
    code: 108,
    indent: 0,
    parameters: [ text ],
  });

  /**
   * Builds an event page whose command list holds the given comments.
   */
  const pageWith = (...comments) => ({ list: comments.map(comment) });

  describe('meetsConditions', () =>
  {
    it('refuses the page when the non-time conditions were already unmet', () =>
    {
      // Arrange
      globalThis.J.TIME.Aliased.Game_Event.set('meetsConditions', () => false);
      const event = new globalThis.Game_Event();

      // Act
      const result = event.meetsConditions(pageWith('<hourPage:9>'));

      // Assert
      // time conditions are an additional restriction, never a way to override an earlier refusal.
      expect(result).toBe(false);
    });

    it('accepts a page carrying no comments at all', () =>
    {
      // Arrange
      const event = new globalThis.Game_Event();

      // Act
      const result = event.meetsConditions({ list: [] });

      // Assert
      expect(result).toBe(true);
    });

    it('accepts a page whose comments hold no time tags', () =>
    {
      // Arrange
      const event = new globalThis.Game_Event();

      // Act
      const result = event.meetsConditions(pageWith('just a note to self'));

      // Assert
      expect(result).toBe(true);
    });

    it('accepts a page whose every time tag is satisfied', () =>
    {
      // Arrange
      const event = new globalThis.Game_Event();

      // Act
      const result = event.meetsConditions(pageWith('<hourPage:9>', '<dayPage:1>'));

      // Assert
      expect(result).toBe(true);
    });

    it('refuses a page when any one of its time tags is unsatisfied', () =>
    {
      // Arrange
      const event = new globalThis.Game_Event();

      // Act
      const result = event.meetsConditions(pageWith('<hourPage:9>', '<dayPage:17>'));

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('toTimeConditionals', () =>
  {
    it('produces nothing when no comment carries a time tag', () =>
    {
      // Arrange
      const commands = [ comment('an ordinary comment') ];

      // Act
      const result = globalThis.Game_Event.toTimeConditionals(commands);

      // Assert
      expect(result).toEqual([]);
    });

    it('produces one conditional per time-tagged comment', () =>
    {
      // Arrange
      const commands = [ comment('<hourPage:9>'), comment('nothing here'), comment('<dayPage:1>') ];

      // Act
      const result = globalThis.Game_Event.toTimeConditionals(commands);

      // Assert
      expect(result).toHaveLength(2);
    });
  });

  describe('filterCommentCommandsByEventTimeConditional', () =>
  {
    it('rejects a command holding an empty comment', () =>
    {
      // Arrange
      // Act
      const result = globalThis.Game_Event.filterCommentCommandsByEventTimeConditional(comment(''));

      // Assert
      expect(result).toBe(false);
    });

    it('rejects a comment that is not a time tag', () =>
    {
      // Arrange
      // Act
      const result = globalThis.Game_Event.filterCommentCommandsByEventTimeConditional(comment('<someOtherTag:1>'));

      // Assert
      expect(result).toBe(false);
    });

    it('accepts a comment carrying a page time tag', () =>
    {
      // Arrange
      // Act
      const result = globalThis.Game_Event.filterCommentCommandsByEventTimeConditional(comment('<hourPage:9>'));

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('filterCommentCommandsByChoiceTimeConditional', () =>
  {
    it('rejects a command holding an empty comment', () =>
    {
      // Arrange
      // Act
      const result = globalThis.Game_Event.filterCommentCommandsByChoiceTimeConditional(comment(''));

      // Assert
      expect(result).toBe(false);
    });

    it('accepts a comment carrying a choice time tag', () =>
    {
      // Arrange
      // Act
      const result = globalThis.Game_Event.filterCommentCommandsByChoiceTimeConditional(comment('<hourChoice:9>'));

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('toTimeConditional', () =>
  {
    // every tag the switch knows about, paired with the conditional field it is expected to populate
    // and the value it should land there. this is what holds the dispatch table honest- an arm wired
    // to the wrong mapper or the wrong regex shows up here as a mismatched field.
    const scalarTags = [
      [ '<minutePage:42>', 'minutes', 42 ],
      [ '<hourPage:9>', 'hours', 9 ],
      [ '<dayPage:12>', 'days', 12 ],
      [ '<monthPage:6>', 'months', 6 ],
      [ '<yearPage:2021>', 'years', 2021 ],
      [ '<timeOfDayPage:3>', 'timeOfDay', 3 ],
      [ '<timeOfDayPage:twilight>', 'timeOfDay', 5 ],
      [ '<seasonOfYearPage:2>', 'seasonOfYear', 2 ],
      [ '<seasonOfYearPage:winter>', 'seasonOfYear', 3 ],
      [ '<minuteChoice:42>', 'minutes', 42 ],
      [ '<hourChoice:9>', 'hours', 9 ],
      [ '<dayChoice:12>', 'days', 12 ],
      [ '<monthChoice:6>', 'months', 6 ],
      [ '<yearChoice:2021>', 'years', 2021 ],
      [ '<timeOfDayChoice:3>', 'timeOfDay', 3 ],
      [ '<timeOfDayChoice:evening>', 'timeOfDay', 4 ],
      [ '<seasonOfYearChoice:2>', 'seasonOfYear', 2 ],
      [ '<seasonOfYearChoice:summer>', 'seasonOfYear', 1 ],
    ];

    scalarTags.forEach(([ tag, field, expected ]) =>
    {
      it(`maps ${tag} onto the ${field} of a conditional`, () =>
      {
        // Arrange
        // Act
        const conditional = globalThis.Game_Event.toTimeConditional(comment(tag));

        // Assert
        expect(conditional[field]).toBe(expected);
      });
    });

    const timeRangeTags = [
      '<timeRangePage:9:30-17:45>',
      '<timeRangeChoice:9:30-17:45>',
      '<minuteRangePage:10-50>',
      '<minuteRangeChoice:10-50>',
      '<hourRangePage:9-17>',
      '<hourRangeChoice:9-17>',
    ];

    timeRangeTags.forEach(tag =>
    {
      it(`maps ${tag} onto a time-range conditional`, () =>
      {
        // Arrange
        // Act
        const conditional = globalThis.Game_Event.toTimeConditional(comment(tag));

        // Assert
        expect(conditional.isTimeRange).toBe(true);
      });
    });

    const fullDateRangeTags = [
      '<fullDateRangePage:[0, 0, 1, 1, 2020]-[0, 0, 1, 1, 2021]>',
      '<fullDateRangeChoice:[0, 0, 1, 1, 2020]-[0, 0, 1, 1, 2021]>',
      '<dayRangePage:5-20>',
      '<dayRangeChoice:5-20>',
      '<monthRangePage:3-9>',
      '<monthRangeChoice:3-9>',
      '<yearRangePage:2020-2021>',
      '<yearRangeChoice:2020-2021>',
    ];

    fullDateRangeTags.forEach(tag =>
    {
      it(`maps ${tag} onto a full-date-range conditional`, () =>
      {
        // Arrange
        // Act
        const conditional = globalThis.Game_Event.toTimeConditional(comment(tag));

        // Assert
        expect(conditional.isFullDateRange).toBe(true);
      });
    });

    it('warns and hands back an empty conditional for a comment no arm recognizes', () =>
    {
      // Arrange
      const warn = vi.spyOn(console, 'warn')
        .mockImplementation(() =>
        {
        });

      // Act
      const conditional = globalThis.Game_Event.toTimeConditional(comment('<notATimeTagAtAll:1>'));
      warn.mockRestore();

      // Assert
      // an empty conditional has every field at the ignore sentinel, so it is satisfied by any time.
      expect(conditional.hours).toBe(-1);
      expect(globalThis.Game_Event.timeConditionalMet(conditional)).toBe(true);
    });
  });

  describe('_timeConditionalDirectMet', () =>
  {
    /**
     * Builds a conditional that ignores everything except the one field under test.
     */
    const conditionalOf = overrides =>
    {
      const conditional = globalThis.Game_Event.toTimeConditional(comment('<notATimeTagAtAll:1>'));

      return Object.assign(conditional, overrides);
    };

    beforeEach(() =>
    {
      vi.spyOn(console, 'warn')
        .mockImplementation(() =>
        {
        });
    });

    it('is satisfied when every specified field matches the clock', () =>
    {
      // Arrange
      const conditional = conditionalOf({ hours: 9 });

      // Act
      const result = globalThis.Game_Event._timeConditionalDirectMet(conditional);

      // Assert
      expect(result).toBe(true);
    });

    it('is unsatisfied on a mismatched year', () =>
    {
      // Arrange
      const conditional = conditionalOf({ years: 1999 });

      // Act
      const result = globalThis.Game_Event._timeConditionalDirectMet(conditional);

      // Assert
      expect(result).toBe(false);
    });

    it('is unsatisfied on a mismatched month', () =>
    {
      // Arrange
      const conditional = conditionalOf({ months: 7 });

      // Act
      const result = globalThis.Game_Event._timeConditionalDirectMet(conditional);

      // Assert
      expect(result).toBe(false);
    });

    it('is unsatisfied on a mismatched day', () =>
    {
      // Arrange
      const conditional = conditionalOf({ days: 17 });

      // Act
      const result = globalThis.Game_Event._timeConditionalDirectMet(conditional);

      // Assert
      expect(result).toBe(false);
    });

    it('is unsatisfied on a mismatched hour', () =>
    {
      // Arrange
      const conditional = conditionalOf({ hours: 17 });

      // Act
      const result = globalThis.Game_Event._timeConditionalDirectMet(conditional);

      // Assert
      expect(result).toBe(false);
    });

    it('is unsatisfied on a mismatched minute', () =>
    {
      // Arrange
      const conditional = conditionalOf({ minutes: 30 });

      // Act
      const result = globalThis.Game_Event._timeConditionalDirectMet(conditional);

      // Assert
      expect(result).toBe(false);
    });

    it('is unsatisfied on a mismatched second', () =>
    {
      // Arrange
      const conditional = conditionalOf({ seconds: 30 });

      // Act
      const result = globalThis.Game_Event._timeConditionalDirectMet(conditional);

      // Assert
      expect(result).toBe(false);
    });

    it('is unsatisfied on a mismatched time of day', () =>
    {
      // Arrange
      const conditional = conditionalOf({ timeOfDay: 0 });

      // Act
      const result = globalThis.Game_Event._timeConditionalDirectMet(conditional);

      // Assert
      expect(result).toBe(false);
    });

    it('is unsatisfied on a mismatched season of year', () =>
    {
      // Arrange
      const conditional = conditionalOf({ seasonOfYear: 0 });

      // Act
      const result = globalThis.Game_Event._timeConditionalDirectMet(conditional);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('_timeConditionalTimeRangeMet', () =>
  {
    it('is satisfied inside a range that sits within one day', () =>
    {
      // Arrange
      globalThis.$gameTime.setTime(0, 0, 12, 1, 1, 2020);
      const conditional = globalThis.Game_Event.toTimeConditional(comment('<hourRangePage:9-17>'));

      // Act
      const result = globalThis.Game_Event.timeConditionalMet(conditional);

      // Assert
      expect(result).toBe(true);
    });

    it('is unsatisfied outside a range that sits within one day', () =>
    {
      // Arrange
      globalThis.$gameTime.setTime(0, 0, 20, 1, 1, 2020);
      const conditional = globalThis.Game_Event.toTimeConditional(comment('<hourRangePage:9-17>'));

      // Act
      const result = globalThis.Game_Event.timeConditionalMet(conditional);

      // Assert
      expect(result).toBe(false);
    });

    it('carries the end of an overnight range into the following day', () =>
    {
      // Arrange
      globalThis.$gameTime.setTime(0, 0, 23, 1, 1, 2020);
      // a range from 10pm round to 6am ends on a lower hour than it starts, which is what marks it
      // as spanning midnight rather than as an empty range.
      const conditional = globalThis.Game_Event.toTimeConditional(comment('<hourRangePage:22-6>'));

      // Act
      const result = globalThis.Game_Event.timeConditionalMet(conditional);

      // Assert
      expect(result).toBe(true);
    });

    it('carries the end of a range that wraps past the top of the hour', () =>
    {
      // Arrange
      globalThis.$gameTime.setTime(0, 55, 9, 1, 1, 2020);
      const conditional = globalThis.Game_Event.toTimeConditional(comment('<timeRangePage:9:50-9:10>'));

      // Act
      const result = globalThis.Game_Event.timeConditionalMet(conditional);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('_timeConditionalFullDateRangeMet', () =>
  {
    it('is satisfied inside the full date range', () =>
    {
      // Arrange
      globalThis.$gameTime.setTime(0, 0, 9, 1, 6, 2020);
      const conditional = globalThis.Game_Event.toTimeConditional(comment('<yearRangePage:2019-2021>'));

      // Act
      const result = globalThis.Game_Event.timeConditionalMet(conditional);

      // Assert
      expect(result).toBe(true);
    });

    it('is unsatisfied outside the full date range', () =>
    {
      // Arrange
      globalThis.$gameTime.setTime(0, 0, 9, 1, 6, 2025);
      const conditional = globalThis.Game_Event.toTimeConditional(comment('<yearRangePage:2019-2021>'));

      // Act
      const result = globalThis.Game_Event.timeConditionalMet(conditional);

      // Assert
      expect(result).toBe(false);
    });
  });
});
//endregion plugins/time/core/objects/game-event.test.js
