//region plugins/apt/core/rpg-base-enemy-direct.test.js
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { installAptHostGlobals } from './fixtures/install-apt-host-globals.js';

describe('RPG_Base / RPG_Enemy aptitude additions (direct src import)', () =>
{
  /** @type {typeof import('../../../../src/plugins/_base/database/base/RPG_Base.js').default} */
  let RPG_Base;

  /** @type {typeof import('../../../../src/plugins/_base/database/implementations/RPG_Weapon.js').default} */
  let RPG_Weapon;

  /** @type {typeof import('../../../../src/plugins/_base/database/implementations/RPG_Enemy.js').default} */
  let RPG_Enemy;

  beforeAll(async () =>
  {
    vi.resetModules();

    await installAptHostGlobals();

    // apt's RPG_Base.js/RPG_Enemy.js patch these as bare globals (the shipped build exposes real
    // _base database classes ambiently once J-Base loads); wire the real classes in for that reason.
    ({ default: RPG_Base } = await import('../../../../src/plugins/_base/database/base/RPG_Base.js'));
    ({ default: RPG_Weapon } = await import('../../../../src/plugins/_base/database/implementations/RPG_Weapon.js'));
    ({ default: RPG_Enemy } = await import('../../../../src/plugins/_base/database/implementations/RPG_Enemy.js'));
    globalThis.RPG_Base = RPG_Base;
    globalThis.RPG_Weapon = RPG_Weapon;
    globalThis.RPG_Enemy = RPG_Enemy;

    // the files under test- patch globalThis.RPG_Base.prototype / globalThis.RPG_Enemy.prototype directly.
    await import('../../../../src/plugins/apt/core/database/RPG_Base.js');
    await import('../../../../src/plugins/apt/core/database/RPG_Enemy.js');
  });

  afterAll(() =>
  {
    vi.unstubAllGlobals();
  });

  describe('RPG_Base#buildAptitudeTeachings / #aptitudeTeachings', () =>
  {
    it('parses one AptitudeTeachable per <aptitude:[skillId, requiredAp]> tag', () =>
    {
      const weapon = Object.assign(Object.create(RPG_Weapon.prototype), {
        id: 5,
        note: '<aptitude:[12, 40]>',
      });

      const list = weapon.buildAptitudeTeachings();

      expect(list).toHaveLength(1);
      expect(list[0].skillId).toBe(12);
      expect(list[0].requiredAp).toBe(40);
    });

    it('parses multiple tags on the same note', () =>
    {
      const weapon = Object.assign(Object.create(RPG_Weapon.prototype), {
        id: 5,
        note: '<aptitude:[12, 40]>\n<aptitude:[13, 80]>',
      });

      const list = weapon.buildAptitudeTeachings();

      expect(list).toHaveLength(2);
      expect(list.map(t => t.skillId)).toEqual([ 12, 13 ]);
      expect(list.map(t => t.requiredAp)).toEqual([ 40, 80 ]);
    });

    it('returns an empty array when there are no aptitude tags', () =>
    {
      const weapon = Object.assign(Object.create(RPG_Weapon.prototype), {
        id: 5,
        note: 'no tags here',
      });

      expect(weapon.buildAptitudeTeachings()).toEqual([]);
    });

    it('aptitudeTeachings getter delegates to buildAptitudeTeachings', () =>
    {
      const weapon = Object.assign(Object.create(RPG_Weapon.prototype), {
        id: 5,
        note: '<aptitude:[12, 40]>',
      });

      expect(weapon.aptitudeTeachings).toEqual(weapon.buildAptitudeTeachings());
    });
  });

  describe('RPG_Enemy#apPoints', () =>
  {
    it('reads the <ap:AMOUNT> tag from the enemy\'s note', () =>
    {
      const enemy = Object.assign(Object.create(RPG_Enemy.prototype), {
        id: 1,
        note: '<ap:12>',
      });

      expect(enemy.apPoints).toBe(12);
    });

    it('defaults to 0 when there is no <ap:AMOUNT> tag', () =>
    {
      const enemy = Object.assign(Object.create(RPG_Enemy.prototype), {
        id: 1,
        note: 'no tag here',
      });

      expect(enemy.apPoints).toBe(0);
    });
  });
});
//endregion plugins/apt/core/rpg-base-enemy-direct.test.js
