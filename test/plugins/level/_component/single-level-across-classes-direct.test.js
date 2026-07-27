//region plugins/level/_component/single-level-across-classes-direct.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Faithful, minimal vanilla RMMZ `Game_Actor` exp/level/learning behavior (mirroring
 * `rmmz_objects.js`), used as the "aliased original" that `src/plugins/level/core/objects/Game_Actor.js`
 * wraps. This lets the useSharedActorLevel=false branch exercise genuine vanilla per-class behavior,
 * and the useSharedActorLevel=true branch exercise the real new logic on top of a real base.
 */
function installVanillaFaithfulGameActor()
{
  function Game_Actor()
  {
    this.initMembers();
  }

  Game_Actor.prototype.initMembers = function()
  {
    this._classId = 1;
    this._level = 1;
    this._exp = {};
    this._skills = [];
  };

  Game_Actor.prototype.currentClass = function()
  {
    return globalThis.$dataClasses[this._classId];
  };

  Game_Actor.prototype.expForLevel = function(level)
  {
    const [ basis, extra, accA, accB ] = this.currentClass().expParams;
    return Math.round(
      (basis * Math.pow(level - 1, 0.9 + accA / 250) * level * (level + 1)) /
      (6 + Math.pow(level, 2) / 50 / accB) +
      (level - 1) * extra);
  };

  Game_Actor.prototype.initExp = function()
  {
    this._exp[this._classId] = this.currentLevelExp();
  };

  Game_Actor.prototype.currentExp = function()
  {
    return this._exp[this._classId];
  };

  Game_Actor.prototype.currentLevelExp = function()
  {
    return this.expForLevel(this._level);
  };

  Game_Actor.prototype.nextLevelExp = function()
  {
    return this.expForLevel(this._level + 1);
  };

  Game_Actor.prototype.maxLevel = function()
  {
    return 99;
  };

  Game_Actor.prototype.isMaxLevel = function()
  {
    return this._level >= this.maxLevel();
  };

  Game_Actor.prototype.learnSkill = function(skillId)
  {
    if (!this._skills.includes(skillId))
    {
      this._skills.push(skillId);
    }
  };

  Game_Actor.prototype.isLearnedSkill = function(skillId)
  {
    return this._skills.includes(skillId);
  };

  Game_Actor.prototype.skills = function()
  {
    return [ ...this._skills ];
  };

  Game_Actor.prototype.findNewSkills = function(lastSkills)
  {
    return this._skills.filter(id => !lastSkills.includes(id));
  };

  Game_Actor.prototype.displayLevelUp = function()
  {
    // no-op for tests.
  };

  Game_Actor.prototype.refresh = function()
  {
    // no-op for tests.
  };

  Game_Actor.prototype.onClassChange = vi.fn();

  Game_Actor.prototype.levelUp = function()
  {
    this._level++;
    this.currentClass().learnings.forEach(learning =>
    {
      if (learning.level === this._level)
      {
        this.learnSkill(learning.skillId);
      }
    });
  };

  Game_Actor.prototype.levelDown = function()
  {
    this._level--;
  };

  Game_Actor.prototype.changeExp = function(exp, show)
  {
    this._exp[this._classId] = Math.max(exp, 0);
    const lastLevel = this._level;
    const lastSkills = this.skills();
    while (!this.isMaxLevel() && this.currentExp() >= this.nextLevelExp())
    {
      this.levelUp();
    }
    while (this.currentExp() < this.currentLevelExp())
    {
      this.levelDown();
    }
    if (show && this._level > lastLevel)
    {
      this.displayLevelUp(this.findNewSkills(lastSkills));
    }
    this.refresh();
  };

  Game_Actor.prototype.changeClass = function(classId, keepExp)
  {
    if (keepExp)
    {
      this._exp[classId] = this.currentExp();
    }
    this._classId = classId;
    this._level = 0;
    this.changeExp(this._exp[this._classId] || 0, false);
    this.refresh();
    this.onClassChange(classId, keepExp);
  };

  globalThis.Game_Actor = Game_Actor;
}

describe('single level across classes (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installVanillaFaithfulGameActor();

    // two classes with distinct exp curves and distinct learnings, to prove cross-class behavior.
    globalThis.$dataClasses = [
      null,
      {
        id: 1,
        expParams: [ 30, 20, 30, 30 ],
        learnings: [
          { level: 1, skillId: 101 },
          { level: 5, skillId: 105 },
        ],
      },
      {
        id: 2,
        expParams: [ 50, 10, 20, 40 ],
        learnings: [
          { level: 1, skillId: 201 },
          { level: 3, skillId: 203 },
        ],
      },
    ];

    globalThis.J = { LEVEL: { Aliased: { Game_Actor: new Map() } } };

    // the file under test patches globalThis.Game_Actor.prototype directly.
    await import('../../../../src/plugins/level/core/objects/Game_Actor.js');
  });

  afterAll(() =>
  {
    delete globalThis.Game_Actor;
    delete globalThis.$dataClasses;
    delete globalThis.J;
  });

  beforeEach(() =>
  {
    globalThis.J.LEVEL.Metadata = {
      useSharedActorLevel: true,
      canonicalExpBasis: 30,
      canonicalExpExtra: 20,
      canonicalExpAccA: 30,
      canonicalExpAccB: 30,
    };
    globalThis.Game_Actor.prototype.onClassChange.mockClear();
  });

  it('changeClass does not reset level/exp when shared level is enabled', () =>
  {
    const actor = new globalThis.Game_Actor();
    actor.initExp();

    // grind class 1 up to level 5.
    actor.changeExp(actor.expForLevel(5), false);
    expect(actor._level).toBe(5);

    // switch to class 2 without keepExp; shared level means nothing should reset.
    actor.changeClass(2, false);

    expect(actor._classId).toBe(2);
    expect(actor._level).toBe(5);
  });

  it('backfills the destination class\'s learnings up to the current level on class change', () =>
  {
    const actor = new globalThis.Game_Actor();
    actor.initExp();
    // mirrors vanilla setup() calling initSkills() right after initExp() for the starting class.
    actor.backfillLearningsForCurrentLevel();

    actor.changeExp(actor.expForLevel(5), false);
    expect(actor.skills()).toEqual([ 101, 105 ]);

    actor.changeClass(2, false);

    // class 2's level-1 and level-3 learnings should both be granted immediately, despite never
    // having "leveled up" while class 2 was active- and class 1's learnings are never lost.
    expect(actor.skills()).toEqual(expect.arrayContaining([ 101, 105, 201, 203 ]));
  });

  it('does not backfill learnings above the current level', () =>
  {
    const actor = new globalThis.Game_Actor();
    actor.initExp();

    // stay at level 1 in class 1.
    actor.changeClass(2, false);

    // class 2's level-3 learning should not be granted yet at level 1.
    expect(actor.skills()).toContain(201);
    expect(actor.skills()).not.toContain(203);
  });

  it('keeps every class\'s exp slot in sync after any exp change', () =>
  {
    const actor = new globalThis.Game_Actor();
    actor.initExp();

    actor.changeExp(actor.expForLevel(5), false);

    // even though class 2 was never active, its slot should already agree with class 1's.
    expect(actor._exp[1]).toBe(actor._exp[2]);
    expect(actor._exp[2]).toBe(actor.currentExp());
  });

  it('still fires onClassChange for other plugins to hook, even though vanilla changeClass is bypassed', () =>
  {
    const actor = new globalThis.Game_Actor();
    actor.initExp();

    actor.changeClass(2, false);

    expect(globalThis.Game_Actor.prototype.onClassChange).toHaveBeenCalledWith(2, false);
  });

  it('expForLevel uses the canonical curve regardless of which class is active when shared', () =>
  {
    const actorInClassOne = new globalThis.Game_Actor();
    const actorInClassTwo = new globalThis.Game_Actor();
    actorInClassTwo._classId = 2;

    // both actors should get the identical canonical curve result for the same level, despite
    // class 1 and class 2 having very different expParams in $dataClasses.
    expect(actorInClassOne.expForLevel(10)).toBe(actorInClassTwo.expForLevel(10));
  });

  it('falls back to true vanilla per-class exp/level behavior when the toggle is off', () =>
  {
    globalThis.J.LEVEL.Metadata.useSharedActorLevel = false;

    const actor = new globalThis.Game_Actor();
    actor.initExp();

    actor.changeExp(actor.expForLevel(5), false);
    expect(actor._level).toBe(5);

    // switching to a fresh class with vanilla behavior resets down to level 1, since class 2 has
    // no exp banked for it yet.
    actor.changeClass(2, false);
    expect(actor._level).toBe(1);
  });

  it('falls back to vanilla exp curve per-class when the toggle is off', () =>
  {
    globalThis.J.LEVEL.Metadata.useSharedActorLevel = false;

    const actor = new globalThis.Game_Actor();

    const classOneCurve = actor.expForLevel(10);

    actor._classId = 2;
    const classTwoCurve = actor.expForLevel(10);

    expect(classOneCurve).not.toBe(classTwoCurve);
  });
});
//endregion plugins/level/_component/single-level-across-classes-direct.test.js
