//region plugins/abs/core/models/jabs-skill-execution.test.js
import { beforeAll, describe, expect, it } from 'vitest';

/**
 * JABS_SkillExecution.js has zero imports- a pure, self-contained value object- so this file
 * dynamically imports it directly with no mocking required.
 */
describe('JABS_SkillExecution (unit, pure/no dependencies)', () =>
{
  /** @type {typeof import('../../../../../src/plugins/abs/core/models/JABS_SkillExecution.js').default} */
  let JABS_SkillExecution;

  beforeAll(async () =>
  {
    ({ default: JABS_SkillExecution } =
      await import('../../../../../src/plugins/abs/core/models/JABS_SkillExecution.js'));
  });

  describe('constructor', () =>
  {
    it('assigns skillId and skillTypeId, and starts age at 0', () =>
    {
      const entry = new JABS_SkillExecution(10, 2);

      expect(entry.skillId).toEqual(10);
      expect(entry.skillTypeId).toEqual(2);
      expect(entry.age).toEqual(0);
    });
  });

  describe('tick()', () =>
  {
    it('increments the age by one', () =>
    {
      const entry = new JABS_SkillExecution(10, 2);
      entry.tick();
      entry.tick();

      expect(entry.age).toEqual(2);
    });
  });

  describe('isExpired()', () =>
  {
    it('returns false when age is within the window', () =>
    {
      const entry = new JABS_SkillExecution(10, 2);
      entry.age = 5;

      expect(entry.isExpired(10)).toEqual(false);
    });

    it('returns false when age exactly equals the window', () =>
    {
      const entry = new JABS_SkillExecution(10, 2);
      entry.age = 10;

      expect(entry.isExpired(10)).toEqual(false);
    });

    it('returns true when age exceeds the window', () =>
    {
      const entry = new JABS_SkillExecution(10, 2);
      entry.age = 11;

      expect(entry.isExpired(10)).toEqual(true);
    });
  });

  describe('isWithinWindow()', () =>
  {
    it('returns true when age is within the window', () =>
    {
      const entry = new JABS_SkillExecution(10, 2);
      entry.age = 5;

      expect(entry.isWithinWindow(10)).toEqual(true);
    });

    it('returns false when age exceeds the window', () =>
    {
      const entry = new JABS_SkillExecution(10, 2);
      entry.age = 11;

      expect(entry.isWithinWindow(10)).toEqual(false);
    });
  });

  describe('matchesSkillId()', () =>
  {
    it('matches any skill when the filter is the sentinel 0', () =>
    {
      const entry = new JABS_SkillExecution(10, 2);

      expect(entry.matchesSkillId(0)).toEqual(true);
    });

    it('matches when the filter equals the entry skill id', () =>
    {
      const entry = new JABS_SkillExecution(10, 2);

      expect(entry.matchesSkillId(10)).toEqual(true);
    });

    it('does not match a different skill id', () =>
    {
      const entry = new JABS_SkillExecution(10, 2);

      expect(entry.matchesSkillId(99)).toEqual(false);
    });
  });

  describe('matchesTypeId()', () =>
  {
    it('matches any type when the filter is the sentinel 0', () =>
    {
      const entry = new JABS_SkillExecution(10, 2);

      expect(entry.matchesTypeId(0)).toEqual(true);
    });

    it('matches when the filter equals the entry skill type id', () =>
    {
      const entry = new JABS_SkillExecution(10, 2);

      expect(entry.matchesTypeId(2)).toEqual(true);
    });

    it('does not match a different skill type id', () =>
    {
      const entry = new JABS_SkillExecution(10, 2);

      expect(entry.matchesTypeId(99)).toEqual(false);
    });
  });
});
//endregion plugins/abs/core/models/jabs-skill-execution.test.js
