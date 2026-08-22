//region plugins/abs/core/models/jabs-guard-data.test.js
import { beforeAll, describe, expect, it } from 'vitest';

/**
 * JABS_GuardData.js has zero imports- a pure, self-contained value object- so this file dynamically
 * imports it directly with no mocking required.
 */
describe('JABS_GuardData (unit, pure/no dependencies)', () =>
{
  /** @type {typeof import('../../../../../src/plugins/abs/core/models/JABS_GuardData.js').default} */
  let JABS_GuardData;

  beforeAll(async () =>
  {
    ({ default: JABS_GuardData } = await import('../../../../../src/plugins/abs/core/models/JABS_GuardData.js'));
  });

  describe('canGuard()', () =>
  {
    it('returns true when flat reduction is nonzero', () =>
    {
      const data = new JABS_GuardData(1, 10, 0, [], [], 0, 0);

      expect(data.canGuard()).toEqual(true);
    });

    it('returns true when percent reduction is nonzero', () =>
    {
      const data = new JABS_GuardData(1, 0, 0.5, [], [], 0, 0);

      expect(data.canGuard()).toEqual(true);
    });

    it('returns true when only a guard interval is set', () =>
    {
      const data = new JABS_GuardData(1, 0, 0, [], [], 0, 60);

      expect(data.canGuard()).toEqual(true);
    });

    it('returns false when neither reduction nor interval is set', () =>
    {
      const data = new JABS_GuardData(1, 0, 0, [], [], 0, 0);

      expect(data.canGuard()).toEqual(false);
    });
  });

  describe('canRefire()', () =>
  {
    it('returns true when the guard interval is positive', () =>
    {
      const data = new JABS_GuardData(1, 10, 0, [], [], 0, 60);

      expect(data.canRefire()).toEqual(true);
    });

    it('returns false when the guard interval is zero', () =>
    {
      const data = new JABS_GuardData(1, 10, 0, [], [], 0, 0);

      expect(data.canRefire()).toEqual(false);
    });
  });

  describe('canParry()', () =>
  {
    it('returns true when parry duration is positive', () =>
    {
      const data = new JABS_GuardData(1, 0, 0, [], [], 10);

      expect(data.canParry()).toEqual(true);
    });

    it('returns false when parry duration is zero', () =>
    {
      const data = new JABS_GuardData(1, 0, 0, [], [], 0);

      expect(data.canParry()).toEqual(false);
    });
  });

  describe('canCounter()', () =>
  {
    it('returns true when there are counterguard ids', () =>
    {
      const data = new JABS_GuardData(1, 0, 0, [ 2 ], [], 0);

      expect(data.canCounter()).toEqual(true);
    });

    it('returns true when there are counterparry ids', () =>
    {
      const data = new JABS_GuardData(1, 0, 0, [], [ 3 ], 0);

      expect(data.canCounter()).toEqual(true);
    });

    it('returns false when there are neither counterguard nor counterparry ids', () =>
    {
      const data = new JABS_GuardData(1, 0, 0, [], [], 0);

      expect(data.canCounter()).toEqual(false);
    });
  });
});
//endregion plugins/abs/core/models/jabs-guard-data.test.js
