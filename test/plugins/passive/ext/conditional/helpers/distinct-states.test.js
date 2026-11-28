//region plugins/passive/ext/conditional/helpers/distinct-states.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

/**
 * Each state once, however many stacks of it J-ABS lists.
 */
describe('DistinctStates (direct src import)', () =>
{
  let DistinctStates;

  beforeAll(async () =>
  {
    vi.resetModules();

    ({ default: DistinctStates } = await import(
      '../../../../../../src/plugins/passive/ext/conditional/helpers/DistinctStates.js'));
  });

  describe('of', () =>
  {
    it('lists each state once, in the order each first appeared, however many stack copies sit between', () =>
    {
      // Arrange- state 7 is stacked three times, with two other states around its copies.
      const stacked = { id: 7 };
      const first = { id: 3 };
      const last = { id: 12 };
      const battler = { states: () => [ first, stacked, stacked, last, stacked ] };

      // Act
      const distinct = DistinctStates.of(battler);

      // Assert
      expect(distinct.map(state => state.id)).toEqual([ 3, 7, 12 ]);
    });
  });
});
//endregion plugins/passive/ext/conditional/helpers/distinct-states.test.js