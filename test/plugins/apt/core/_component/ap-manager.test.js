//region plugins/apt/core/_component/ap-manager.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installAptHostGlobals } from './fixtures/install-apt-host-globals.js';

describe('J-Aptitude ApManager (direct src import)', () =>
{
  /** @type {typeof import('../../../../../src/plugins/apt/core/managers/ApManager.js').default} */
  let ApManager;

  /** @type {typeof import('../../../../../src/plugins/apt/core/_models/AptitudeTeachable.js').default} */
  let AptitudeTeachable;

  /** @type {typeof import('../../../../../src/plugins/_base/core/database/implementations/RPG_Skill.js').default} */
  let RPG_Skill;

  beforeAll(async () =>
  {
    vi.resetModules();

    await installAptHostGlobals();

    ({ default: RPG_Skill } = await import('../../../../../src/plugins/_base/core/database/implementations/RPG_Skill.js'));
    globalThis.RPG_Skill = RPG_Skill;

    ({ default: AptitudeTeachable } = await import('../../../../../src/plugins/apt/core/_models/AptitudeTeachable.js'));
    ({ default: ApManager } = await import('../../../../../src/plugins/apt/core/managers/ApManager.js'));

    // the file under test- patches globalThis.Game_Actor.prototype directly.
    await import('../../../../../src/plugins/apt/core/objects/Game_Actor.js');

    // vanilla RMMZ Game_Actor methods this test path relies on; not part of J-Base's placeholder set.
    globalThis.Game_Actor.prototype.isDead = function()
    {
      return false;
    };
    globalThis.Game_Actor.prototype.learnSkill = function(skillId)
    {
      if (this._skills.includes(skillId) === false)
      {
        this._skills.push(skillId);
      }
    };
    globalThis.Game_Actor.prototype.isLearnedSkill = function(skillId)
    {
      return this._skills.includes(skillId);
    };
    globalThis.Game_Actor.prototype.skill = function(skillId)
    {
      return globalThis.$dataSkills[skillId];
    };
    globalThis.Game_Battler.prototype.databaseData = function()
    {
      return { apPoints: 0 };
    };
  });

  it('parseKey splits type chain and numeric id', () =>
  {
    // Arrange & Act
    const parsed = ApManager.parseKey('@base:usable:skill:17');

    // Assert
    expect(parsed.types.join(':')).toBe('@base:usable:skill');
    expect(parsed.id).toBe(17);
  });

  it('resolveStaticSourceByKey returns database rows', () =>
  {
    // Arrange
    globalThis.$dataSkills = [ null ];
    globalThis.$dataSkills[9] = { id: 9, name: 'Test' };

    // Act & Assert
    expect(ApManager.resolveStaticSourceByKey('@base:usable:skill:9').id).toBe(9);
    expect(ApManager.resolveStaticSourceByKey('bad')).toBe(null);
  });

  it('gainAp distributes AP and learns at threshold', () =>
  {
    // Arrange
    globalThis.RPGManager.clearCache();
    globalThis.$dataSkills = [ null ];
    globalThis.$dataSkills[10] = Object.assign(Object.create(RPG_Skill.prototype), {
      id: 10, name: 'Teach', note: '', meta: {},
    });
    const actor = new globalThis.Game_Actor();
    actor.initMembers();
    actor._skills = [];
    const teach = new AptitudeTeachable(10, 5);
    const source = {
      id: 1,
      implementationType()
      {
        return '@vitest:class';
      },
      isSkill()
      {
        return false;
      },
      aptitudeTeachings: [ teach ],
    };
    actor.getAptitudeSources = function()
    {
      return [ source ];
    };
    Object.defineProperty(actor, 'apr', { get() { return 1; }, configurable: true });

    // Act
    ApManager.gainAp(actor, 3, 'test');
    ApManager.gainAp(actor, 2, 'test');

    // Assert
    expect(actor.isLearnedSkill(10)).toBe(true);
    expect(actor.hasLearnedAptitudeSkill(10)).toBe(true);
  });

  it('canGainAp rejects dead actors and zero amount', () =>
  {
    // Arrange
    const actor = new globalThis.Game_Actor();
    actor.initMembers();
    actor.isDead = function()
    {
      return true;
    };

    // Act & Assert
    expect(ApManager.canGainAp(actor, 5)).toBe(false);

    actor.isDead = function()
    {
      return false;
    };
    expect(ApManager.canGainAp(actor, 0)).toBe(false);
    expect(ApManager.canGainAp(actor, 1)).toBe(true);
  });
});
//endregion plugins/apt/core/_component/ap-manager.test.js
