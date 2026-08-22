//region plugins/abs/core/models/jabs-battler-role.test.js
import { beforeAll, describe, expect, it } from 'vitest';

/**
 * JABS_BattlerRole.js has zero imports- a pure, self-contained value object- so this file dynamically
 * imports it directly with no mocking required.
 */
describe('JABS_BattlerRole (unit, pure/no dependencies)', () =>
{
  /** @type {typeof import('../../../../../src/plugins/abs/core/models/JABS_BattlerRole.js').default} */
  let JABS_BattlerRole;

  beforeAll(async () =>
  {
    ({ default: JABS_BattlerRole } = await import('../../../../../src/plugins/abs/core/models/JABS_BattlerRole.js'));
  });

  describe('constructor/initialize()', () =>
  {
    it('defaults every role flag to false', () =>
    {
      const role = new JABS_BattlerRole();

      expect(role.leader).toEqual(false);
      expect(role.follower).toEqual(false);
      expect(role.guardian).toEqual(false);
      expect(role.ward).toEqual(false);
      expect(role.solo).toEqual(false);
      expect(role.sentinel).toEqual(false);
    });

    it('assigns each provided role flag by position', () =>
    {
      const role = new JABS_BattlerRole(true, false, true, false, true, false);

      expect(role.leader).toEqual(true);
      expect(role.follower).toEqual(false);
      expect(role.guardian).toEqual(true);
      expect(role.ward).toEqual(false);
      expect(role.solo).toEqual(true);
      expect(role.sentinel).toEqual(false);
    });
  });

  describe('hasRole()', () =>
  {
    it('returns false when every role flag is false', () =>
    {
      const role = new JABS_BattlerRole();

      expect(role.hasRole()).toEqual(false);
    });

    // every flag gets its own case on purpose: `hasRole` is a six-operand `||`, which is six
    // independent conditions. Proving it with one flag set leaves the other five free to be
    // stripped out of the chain without a single test noticing the difference.
    it('returns true for a leader with no other role', () =>
    {
      const role = new JABS_BattlerRole(true, false, false, false, false, false);

      expect(role.hasRole()).toEqual(true);
    });

    it('returns true for a follower with no other role', () =>
    {
      const role = new JABS_BattlerRole(false, true, false, false, false, false);

      expect(role.hasRole()).toEqual(true);
    });

    it('returns true for a guardian with no other role', () =>
    {
      const role = new JABS_BattlerRole(false, false, true, false, false, false);

      expect(role.hasRole()).toEqual(true);
    });

    it('returns true for a ward with no other role', () =>
    {
      const role = new JABS_BattlerRole(false, false, false, true, false, false);

      expect(role.hasRole()).toEqual(true);
    });

    it('returns true for a solo battler with no other role', () =>
    {
      const role = new JABS_BattlerRole(false, false, false, false, true, false);

      expect(role.hasRole()).toEqual(true);
    });

    it('returns true for a sentinel with no other role', () =>
    {
      const role = new JABS_BattlerRole(false, false, false, false, false, true);

      expect(role.hasRole()).toEqual(true);
    });
  });
});
//endregion plugins/abs/core/models/jabs-battler-role.test.js
