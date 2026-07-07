//region plugins/abs/ext/targeting/jabs-targeting-cursor.test.js
import { describe, expect, it } from 'vitest';

import JABS_TargetingCursor from '../../../../../src/plugins/abs/ext/targeting/_models/JABS_TargetingCursor.js';

/**
 * Builds a minimal battler stub for cursor tests; only `getX()`/`getY()` are ever touched.
 * @param {number} x
 * @param {number} y
 * @returns {object}
 */
function buildBattler(x, y)
{
  return {
    getX: () => x,
    getY: () => y,
  };
}

describe('JABS_TargetingCursor', () =>
{
  describe('factories', () =>
  {
    it('Cycle builds a cycle-mode cursor over the given candidates', () =>
    {
      const caster = buildBattler(0, 0);
      const candidates = [ buildBattler(1, 0), buildBattler(-1, 0) ];

      const cursor = JABS_TargetingCursor.Cycle(caster, candidates, 5);

      expect(cursor.isCycleMode()).toBe(true);
      expect(cursor.isFreeRoamMode()).toBe(false);
      expect(cursor.getCaster()).toBe(caster);
      expect(cursor.getCandidates()).toBe(candidates);
      expect(cursor.getRange()).toBe(5);
    });

    it('FreeRoam builds a free-roam cursor starting at the caster\'s own position', () =>
    {
      const caster = buildBattler(3, 4);

      const cursor = JABS_TargetingCursor.FreeRoam(caster, 5);

      expect(cursor.isFreeRoamMode()).toBe(true);
      expect(cursor.isCycleMode()).toBe(false);
      expect(cursor.getX()).toBe(3);
      expect(cursor.getY()).toBe(4);
      expect(cursor.getRange()).toBe(5);
    });
  });

  describe('getSelectedBattler', () =>
  {
    it('returns null when the candidate pool is empty', () =>
    {
      const cursor = JABS_TargetingCursor.Cycle(buildBattler(0, 0), [], 5);

      expect(cursor.getSelectedBattler()).toBeNull();
    });

    it('returns the candidate at the current selected index', () =>
    {
      const second = buildBattler(1, 0);
      const cursor = JABS_TargetingCursor.Cycle(buildBattler(0, 0), [ buildBattler(0, 1), second ], 5);

      cursor.setSelectedIndex(1);

      expect(cursor.getSelectedBattler()).toBe(second);
    });
  });

  describe('setPosition', () =>
  {
    it('updates getX/getY in free-roam mode', () =>
    {
      const cursor = JABS_TargetingCursor.FreeRoam(buildBattler(0, 0), 5);

      cursor.setPosition(2.5, -1.5);

      expect(cursor.getX()).toBe(2.5);
      expect(cursor.getY()).toBe(-1.5);
    });
  });

  describe('selectTowards', () =>
  {
    it('does nothing with zero candidates', () =>
    {
      const cursor = JABS_TargetingCursor.Cycle(buildBattler(0, 0), [], 5);

      cursor.selectTowards(1, 0);

      expect(cursor.getSelectedIndex()).toBe(0);
    });

    it('does nothing with a single candidate', () =>
    {
      const only = buildBattler(1, 0);
      const cursor = JABS_TargetingCursor.Cycle(buildBattler(0, 0), [ only ], 5);

      cursor.selectTowards(1, 0);

      expect(cursor.getSelectedBattler()).toBe(only);
      expect(cursor.getSelectedIndex()).toBe(0);
    });

    it('picks the candidate best-aligned with the pressed direction over one merely closer', () =>
    {
      // current selection sits at the origin; one candidate is directly to the right (perfectly
      // aligned with a rightward press), the other is much closer but directly above (unaligned).
      const current = buildBattler(0, 0);
      const rightAligned = buildBattler(5, 0);
      const closeButWrongDirection = buildBattler(0, 1);
      const cursor = JABS_TargetingCursor.Cycle(
        buildBattler(0, 0),
        [ current, rightAligned, closeButWrongDirection ],
        99);

      // press right (dirX=1, dirY=0).
      cursor.selectTowards(1, 0);

      expect(cursor.getSelectedBattler()).toBe(rightAligned);
    });

    it('breaks ties between similarly-aligned candidates by favoring the closer one', () =>
    {
      const current = buildBattler(0, 0);
      const closer = buildBattler(2, 0);
      const farther = buildBattler(5, 0);
      const cursor = JABS_TargetingCursor.Cycle(buildBattler(0, 0), [ current, farther, closer ], 99);

      cursor.selectTowards(1, 0);

      expect(cursor.getSelectedBattler()).toBe(closer);
    });

    it('ignores a candidate occupying the exact same position as the current selection', () =>
    {
      // zero distance from the current selection would otherwise divide-by-zero in the
      // alignment calculation; this candidate should be skipped entirely, not just deprioritized.
      const current = buildBattler(2, 2);
      const samePosition = buildBattler(2, 2);
      const cursor = JABS_TargetingCursor.Cycle(buildBattler(0, 0), [ current, samePosition ], 99);

      cursor.selectTowards(1, 0);

      expect(cursor.getSelectedBattler()).toBe(current);
    });

    it('ignores candidates that do not align with the pressed direction at all', () =>
    {
      const current = buildBattler(0, 0);
      const behind = buildBattler(-5, 0);
      const cursor = JABS_TargetingCursor.Cycle(buildBattler(0, 0), [ current, behind ], 99);

      // press right; the only other candidate is directly behind (left), so no selection change.
      cursor.selectTowards(1, 0);

      expect(cursor.getSelectedIndex()).toBe(0);
    });
  });

  describe('stepIndex', () =>
  {
    it('does nothing with zero or one candidate', () =>
    {
      const empty = JABS_TargetingCursor.Cycle(buildBattler(0, 0), [], 5);
      empty.stepIndex(1);
      expect(empty.getSelectedIndex()).toBe(0);

      const single = JABS_TargetingCursor.Cycle(buildBattler(0, 0), [ buildBattler(1, 0) ], 5);
      single.stepIndex(1);
      expect(single.getSelectedIndex()).toBe(0);
    });

    it('advances forward by the given delta, regardless of spatial alignment', () =>
    {
      const candidates = [ buildBattler(0, 0), buildBattler(-99, 99), buildBattler(1, 1) ];
      const cursor = JABS_TargetingCursor.Cycle(buildBattler(0, 0), candidates, 99);

      cursor.stepIndex(1);

      expect(cursor.getSelectedIndex()).toBe(1);
    });

    it('wraps forward past the end of the list back to the start', () =>
    {
      const candidates = [ buildBattler(0, 0), buildBattler(1, 1) ];
      const cursor = JABS_TargetingCursor.Cycle(buildBattler(0, 0), candidates, 99);

      cursor.stepIndex(1);
      cursor.stepIndex(1);

      expect(cursor.getSelectedIndex()).toBe(0);
    });

    it('wraps backward past the start of the list to the end', () =>
    {
      const candidates = [ buildBattler(0, 0), buildBattler(1, 1), buildBattler(2, 2) ];
      const cursor = JABS_TargetingCursor.Cycle(buildBattler(0, 0), candidates, 99);

      cursor.stepIndex(-1);

      expect(cursor.getSelectedIndex()).toBe(2);
    });
  });
});
//endregion plugins/abs/ext/targeting/jabs-targeting-cursor.test.js
