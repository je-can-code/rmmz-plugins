//region plugins/apt/core/_component/aptitude-skill-aggregate.test.js
import { describe, expect, it } from 'vitest';

import AptitudeSkillAggregate from '../../../../../src/plugins/apt/core/_models/AptitudeSkillAggregate.js';
import AptitudeSkillSourceProgress from '../../../../../src/plugins/apt/core/_models/AptitudeSkillSourceProgress.js';

describe('AptitudeSkillSourceProgress', () =>
{
  it('coerces constructor inputs to their declared types', () =>
  {
    const progress = new AptitudeSkillSourceProgress('weapon:5', '12', '10', '40', 0);

    expect(progress.sourceKey()).toBe('weapon:5');
    expect(progress.skillId()).toBe(12);
    expect(progress.currentAp()).toBe(10);
    expect(progress.requiredAp()).toBe(40);
    expect(progress.learned()).toBe(false);
  });

  it('only treats the literal boolean true as learned', () =>
  {
    expect(new AptitudeSkillSourceProgress('k', 1, 0, 1, true).learned()).toBe(true);
    expect(new AptitudeSkillSourceProgress('k', 1, 0, 1, 'true').learned()).toBe(false);
    expect(new AptitudeSkillSourceProgress('k', 1, 0, 1, 1).learned()).toBe(false);
  });

  it('remainingAp is the gap between required and current, clamped at zero', () =>
  {
    expect(new AptitudeSkillSourceProgress('k', 1, 10, 40, false).remainingAp()).toBe(30);
    expect(new AptitudeSkillSourceProgress('k', 1, 40, 40, false).remainingAp()).toBe(0);

    // over-cap current AP should never produce a negative remainder.
    expect(new AptitudeSkillSourceProgress('k', 1, 50, 40, false).remainingAp()).toBe(0);
  });
});

describe('AptitudeSkillAggregate', () =>
{
  /**
   * Builds a minimal fake skill row.
   * @param {object} fields
   * @returns {object}
   */
  function buildSkill(fields = {})
  {
    return { name: 'Test Skill', iconIndex: 64, ...fields };
  }

  it('exposes the skill id, name, and icon from the stored skill row', () =>
  {
    const skill = buildSkill({ name: 'Fireball', iconIndex: 100 });
    const aggregate = new AptitudeSkillAggregate(12, skill);

    expect(aggregate.skillId()).toBe(12);
    expect(aggregate.skill()).toBe(skill);
    expect(aggregate.name()).toBe('Fireball');
    expect(aggregate.iconIndex()).toBe(100);
  });

  it('starts with no sources and learnedAny false', () =>
  {
    const aggregate = new AptitudeSkillAggregate(1, buildSkill());

    expect(aggregate.sources()).toEqual([]);
    expect(aggregate.learnedAny()).toBe(false);
  });

  it('learnedAny is true if any source has been learned', () =>
  {
    const aggregate = new AptitudeSkillAggregate(1, buildSkill());
    aggregate.addSource(new AptitudeSkillSourceProgress('a', 1, 0, 10, false));
    aggregate.addSource(new AptitudeSkillSourceProgress('b', 1, 10, 10, true));

    expect(aggregate.learnedAny()).toBe(true);
  });

  it('cheapestSource picks the not-yet-learned source with the least remaining AP', () =>
  {
    const aggregate = new AptitudeSkillAggregate(1, buildSkill());
    const expensive = new AptitudeSkillSourceProgress('expensive', 1, 0, 100, false);
    const cheap = new AptitudeSkillSourceProgress('cheap', 1, 5, 10, false);
    const learned = new AptitudeSkillSourceProgress('learned', 1, 10, 10, true);

    aggregate.addSource(expensive);
    aggregate.addSource(cheap);
    aggregate.addSource(learned);

    expect(aggregate.cheapestSource()).toBe(cheap);
  });

  it('cheapestSource falls back to the first source when everything is already learned', () =>
  {
    const aggregate = new AptitudeSkillAggregate(1, buildSkill());
    const first = new AptitudeSkillSourceProgress('first', 1, 10, 10, true);
    const second = new AptitudeSkillSourceProgress('second', 1, 10, 10, true);

    aggregate.addSource(first);
    aggregate.addSource(second);

    expect(aggregate.cheapestSource()).toBe(first);
  });

  it('cheapestSource returns null when there are no sources at all', () =>
  {
    const aggregate = new AptitudeSkillAggregate(1, buildSkill());

    expect(aggregate.cheapestSource()).toBeNull();
  });

  it('currentAp/requiredAp delegate to the cheapest source', () =>
  {
    const aggregate = new AptitudeSkillAggregate(1, buildSkill());
    aggregate.addSource(new AptitudeSkillSourceProgress('a', 1, 5, 10, false));

    expect(aggregate.currentAp()).toBe(5);
    expect(aggregate.requiredAp()).toBe(10);
  });

  it('currentAp/requiredAp fall back to safe defaults with no sources (avoids div-by-zero gauges)', () =>
  {
    const aggregate = new AptitudeSkillAggregate(1, buildSkill());

    expect(aggregate.currentAp()).toBe(0);
    expect(aggregate.requiredAp()).toBe(1);
  });
});
//endregion plugins/apt/core/_component/aptitude-skill-aggregate.test.js
