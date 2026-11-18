//region plugins/abs/core/_component/damage-limits.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

/**
 * Builds a skill row carrying the given note, so tags are parsed for real.
 * @param {string} note The note the row carries.
 * @param {number} id The row's id.
 * @returns {object}
 */
function buildSkill(note, id = 1)
{
  const row = Object.create(globalThis.RPG_Skill.prototype);
  row.id = id;
  row.note = note;
  row.meta = {};
  row._original = function() { return this; };
  return row;
}

/**
 * Builds a real Game_Battler whose note sources are skill rows carrying the given notes.
 * @param {object} options How the battler is set up.
 * @param {string[]} [options.notes] One note per note source.
 * @param {number} [options.hp] The battler's current HP.
 * @param {boolean} [options.actor] Whether the battler is an actor rather than an enemy.
 * @param {string} [options.uuid] The battler's uuid.
 * @returns {object}
 */
function buildBattler({ notes = [], hp = 100, actor = false, uuid = 'battler' } = {})
{
  const battler = Object.create(globalThis.Game_Battler.prototype);
  battler.initMembers();
  battler.hp = hp;
  const sources = notes.map((note, index) => buildSkill(note, 100 + index));
  battler.getAllNotes = () => sources;
  battler.isActor = () => actor;
  battler.getUuid = () => uuid;
  return battler;
}

/**
 * Builds a real Game_Action cast by the given subject with the given skill.
 * @param {object} subject The battler casting the action.
 * @param {object} skill The skill being cast.
 * @returns {object}
 */
function buildAction(subject, skill = buildSkill(''))
{
  const action = Object.create(globalThis.Game_Action.prototype);
  action.subject = () => subject;
  action.item = () => skill;
  return action;
}

/**
 * Registers a stand-in map battler for the given uuid, on the given team.
 * @param {object} JABS_AiManager The real battler manager.
 * @param {string} uuid The uuid the battler answers to.
 * @param {number} team The team the battler stands on.
 * @param {number[]} opposedTeams The teams this battler opposes.
 */
function registerMapBattler(JABS_AiManager, uuid, team, opposedTeams = [])
{
  JABS_AiManager.battlers.set(uuid, {
    getTeam: () => team,
    isOpposingTeam: otherTeam => opposedTeams.includes(otherTeam),
  });
}

describe('J-ABS damage limits: <noDamage>, <noSelfKill> and <noTargetKill> (direct src import)', () =>
{
  let JABS_AiManager;

  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));
    ({ default: globalThis.RPG_Skill } = await import('../../../../../src/plugins/_base/core/database/implementations/RPG_Skill.js'));

    setPluginContextToJAbs();
    await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');

    // patches globalThis.Game_Battler.prototype and globalThis.Game_Action.prototype directly.
    await import('../../../../../src/plugins/abs/core/objects/Game_Battler.js');
    await import('../../../../../src/plugins/abs/core/objects/Game_Action.js');

    // Game_Action.js imports this for real, so map battlers are registered on its real static map.
    ({ default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js'));
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
  });

  afterEach(() =>
  {
    JABS_AiManager.battlers.clear();
  });

  describe('Game_Battler.isImmuneToDamage', () =>
  {
    it('is true when any note source carries <noDamage>', () =>
    {
      // Arrange
      const battler = buildBattler({ notes: [ '<noSelfKill>', '<noDamage>' ] });

      // Act
      const result = battler.isImmuneToDamage();

      // Assert
      expect(result).toBe(true);
    });

    it('is false when the note sources carry only other tags', () =>
    {
      // Arrange
      const battler = buildBattler({ notes: [ '<noSelfKill>', '<noTargetKill>' ] });

      // Act
      const result = battler.isImmuneToDamage();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('Game_Battler.hasNoSelfKill', () =>
  {
    it('is true for any skill when a note source carries <noSelfKill>', () =>
    {
      // Arrange
      const battler = buildBattler({ notes: [ '<noSelfKill>' ] });

      // Act
      const result = battler.hasNoSelfKill(buildSkill(''));

      // Assert
      expect(result).toBe(true);
    });

    it('is true when the skill being cast carries <thisNoSelfKill>', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act
      const result = battler.hasNoSelfKill(buildSkill('<thisNoSelfKill>'));

      // Assert
      expect(result).toBe(true);
    });

    it('is false when only a known skill, not the one being cast, carries <thisNoSelfKill>', () =>
    {
      // Arrange
      const battler = buildBattler({ notes: [ '<thisNoSelfKill>' ] });

      // Act
      const result = battler.hasNoSelfKill(buildSkill('<thisNoTargetKill>'));

      // Assert
      expect(result).toBe(false);
    });

    it('is false when the battler carries only <noTargetKill>', () =>
    {
      // Arrange
      const battler = buildBattler({ notes: [ '<noTargetKill>' ] });

      // Act
      const result = battler.hasNoSelfKill(buildSkill(''));

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('Game_Battler.hasNoTargetKill', () =>
  {
    it('is true for any skill when a note source carries <noTargetKill>', () =>
    {
      // Arrange
      const battler = buildBattler({ notes: [ '<noTargetKill>' ] });

      // Act
      const result = battler.hasNoTargetKill(buildSkill(''));

      // Assert
      expect(result).toBe(true);
    });

    it('is true when the skill being cast carries <thisNoTargetKill>', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act
      const result = battler.hasNoTargetKill(buildSkill('<thisNoTargetKill>'));

      // Assert
      expect(result).toBe(true);
    });

    it('is false when neither the battler nor the skill being cast says so', () =>
    {
      // Arrange
      const battler = buildBattler({ notes: [ '<noSelfKill>', '<thisNoTargetKill>' ] });

      // Act
      const result = battler.hasNoTargetKill(buildSkill('<thisNoSelfKill>'));

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('Game_Action.applyDamageImmunity', () =>
  {
    it('lets a heal through untouched, even onto a target that takes no damage', () =>
    {
      // Arrange
      const target = buildBattler({ notes: [ '<noDamage>' ] });
      const action = buildAction(buildBattler());

      // Act
      const result = action.applyDamageImmunity(target, -25);

      // Assert
      expect(result).toBe(-25);
    });

    it('holds back all of the damage when the target takes no damage', () =>
    {
      // Arrange
      const target = buildBattler({ notes: [ '<noDamage>' ] });
      const action = buildAction(buildBattler());

      // Act
      const result = action.applyDamageImmunity(target, 40);

      // Assert
      expect(result).toBe(0);
    });

    it('lets all of the damage through onto a target that can be hurt', () =>
    {
      // Arrange
      const target = buildBattler({ notes: [ '<noSelfKill>' ] });
      const action = buildAction(buildBattler());

      // Act
      const result = action.applyDamageImmunity(target, 40);

      // Assert
      expect(result).toBe(40);
    });
  });

  describe('Game_Action.applyKillFloor', () =>
  {
    it('lets a heal through untouched, even from a caster that cannot kill itself', () =>
    {
      // Arrange
      const caster = buildBattler({ notes: [ '<noSelfKill>' ], hp: 5 });
      const action = buildAction(caster);

      // Act
      const result = action.applyKillFloor(caster, -30);

      // Assert
      expect(result).toBe(-30);
    });

    it('lets a killing blow land in full when nothing bars it', () =>
    {
      // Arrange
      const caster = buildBattler({ hp: 5 });
      const action = buildAction(caster);

      // Act
      const result = action.applyKillFloor(caster, 30);

      // Assert
      expect(result).toBe(30);
    });

    it('holds a barred blow equal to the target\'s HP one short of killing', () =>
    {
      // Arrange
      const caster = buildBattler({ notes: [ '<noSelfKill>' ], hp: 30 });
      const action = buildAction(caster);

      // Act
      const result = action.applyKillFloor(caster, 30);

      // Assert
      expect(result).toBe(29);
    });

    it('lets a barred blow that leaves exactly one HP land in full', () =>
    {
      // Arrange
      const caster = buildBattler({ notes: [ '<noSelfKill>' ], hp: 30 });
      const action = buildAction(caster);

      // Act
      const result = action.applyKillFloor(caster, 29);

      // Assert
      expect(result).toBe(29);
    });

    it('takes nothing from a barred target already down to one HP', () =>
    {
      // Arrange
      const caster = buildBattler({ notes: [ '<noSelfKill>' ], hp: 1 });
      const action = buildAction(caster);

      // Act
      const result = action.applyKillFloor(caster, 500);

      // Assert
      expect(result).toBe(0);
    });

    it('takes only whole HP above one from a barred target sitting at a fraction', () =>
    {
      // Arrange
      const caster = buildBattler({ notes: [ '<noSelfKill>' ], hp: 7.6 });
      const action = buildAction(caster);

      // Act
      const result = action.applyKillFloor(caster, 500);

      // Assert
      expect(result).toBe(6);
    });

    it('takes nothing from a barred target below one HP, rather than healing it', () =>
    {
      // Arrange
      const caster = buildBattler({ notes: [ '<noSelfKill>' ], hp: 0.4 });
      const action = buildAction(caster);

      // Act
      const result = action.applyKillFloor(caster, 500);

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('Game_Action.isBarredFromKilling', () =>
  {
    it('is true when the caster hits itself and carries <noSelfKill>', () =>
    {
      // Arrange
      const caster = buildBattler({ notes: [ '<noSelfKill>' ] });
      const action = buildAction(caster);

      // Act
      const result = action.isBarredFromKilling(caster);

      // Assert
      expect(result).toBe(true);
    });

    it('is false when the caster hits itself carrying only <noTargetKill>', () =>
    {
      // Arrange
      const caster = buildBattler({ notes: [ '<noTargetKill>' ] });
      const action = buildAction(caster);

      // Act
      const result = action.isBarredFromKilling(caster);

      // Assert
      expect(result).toBe(false);
    });

    it('is false when the caster hits another battler carrying only <noSelfKill>', () =>
    {
      // Arrange
      const caster = buildBattler({ notes: [ '<noSelfKill>' ], uuid: 'caster' });
      const target = buildBattler({ actor: true, uuid: 'target' });
      registerMapBattler(JABS_AiManager, 'caster', 1, [ 0 ]);
      registerMapBattler(JABS_AiManager, 'target', 0, [ 1 ]);
      const action = buildAction(caster);

      // Act
      const result = action.isBarredFromKilling(target);

      // Assert
      expect(result).toBe(false);
    });

    it('is true when a caster carrying <noTargetKill> hits an opponent', () =>
    {
      // Arrange
      const caster = buildBattler({ notes: [ '<noTargetKill>' ], uuid: 'caster' });
      const target = buildBattler({ actor: true, uuid: 'target' });
      registerMapBattler(JABS_AiManager, 'caster', 1, [ 0 ]);
      registerMapBattler(JABS_AiManager, 'target', 0, [ 1 ]);
      const action = buildAction(caster);

      // Act
      const result = action.isBarredFromKilling(target);

      // Assert
      expect(result).toBe(true);
    });

    it('is false when a caster carrying <noTargetKill> catches an ally in friendly fire', () =>
    {
      // Arrange
      const caster = buildBattler({ notes: [ '<noTargetKill>' ], uuid: 'caster' });
      const ally = buildBattler({ uuid: 'ally' });
      registerMapBattler(JABS_AiManager, 'caster', 1, [ 0 ]);
      registerMapBattler(JABS_AiManager, 'ally', 1, [ 0 ]);
      const action = buildAction(caster);

      // Act
      const result = action.isBarredFromKilling(ally);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('Game_Action.isAgainstOpponent', () =>
  {
    it('lets the team rules decide when the caster is on the map', () =>
    {
      // Arrange
      const caster = buildBattler({ uuid: 'caster' });
      const target = buildBattler({ uuid: 'target' });
      registerMapBattler(JABS_AiManager, 'caster', 1, [ 2 ]);
      registerMapBattler(JABS_AiManager, 'target', 2, [ 1 ]);
      const action = buildAction(caster);

      // Act
      const result = action.isAgainstOpponent(target);

      // Assert
      expect(result).toBe(true);
    });

    it('counts an actor as the opponent of an enemy caster that has left the map', () =>
    {
      // Arrange
      const caster = buildBattler({ uuid: 'gone' });
      const target = buildBattler({ actor: true, uuid: 'target' });
      registerMapBattler(JABS_AiManager, 'target', 0, [ 1 ]);
      const action = buildAction(caster);

      // Act
      const result = action.isAgainstOpponent(target);

      // Assert
      expect(result).toBe(true);
    });

    it('counts another enemy as no opponent of an enemy caster that has left the map', () =>
    {
      // Arrange
      const caster = buildBattler({ uuid: 'gone' });
      const target = buildBattler({ uuid: 'target' });
      registerMapBattler(JABS_AiManager, 'target', 1, [ 0 ]);
      const action = buildAction(caster);

      // Act
      const result = action.isAgainstOpponent(target);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('one pulse, two targets', () =>
  {
    it('stops a <noSelfKill> caster one HP short while the opponent in the same hit can die', () =>
    {
      // Arrange
      const statue = buildBattler({ notes: [ '<noSelfKill>' ], hp: 2000, uuid: 'statue' });
      const player = buildBattler({ actor: true, hp: 1500, uuid: 'player' });
      registerMapBattler(JABS_AiManager, 'statue', 1, [ 0 ]);
      registerMapBattler(JABS_AiManager, 'player', 0, [ 1 ]);
      const pulse = buildAction(statue, buildSkill('<unparryable>'));

      // Act
      const toStatue = pulse.applyKillFloor(statue, 4000);
      const toPlayer = pulse.applyKillFloor(player, 4000);

      // Assert
      expect(toStatue).toBe(1999);
      expect(toPlayer).toBe(4000);
    });
  });

  describe('Game_Action.executeHpDamage', () =>
  {
    it('hands the original only what the kill floor lets through', () =>
    {
      // Arrange
      const original = vi.fn();
      globalThis.J.ABS.Aliased.Game_Action.set('executeHpDamage', original);
      const caster = buildBattler({ notes: [ '<noSelfKill>' ], hp: 12 });
      const action = buildAction(caster);

      // Act
      action.executeHpDamage(caster, 90);

      // Assert
      expect(original).toHaveBeenCalledWith(caster, 11);
    });
  });

  describe('Game_Action.itemEffectRecoverHp / itemEffectRecoverMp', () =>
  {
    it('skips a harmful Recover HP effect on a target that takes no damage', () =>
    {
      // Arrange
      const original = vi.fn();
      globalThis.J.ABS.Aliased.Game_Action.set('itemEffectRecoverHp', original);
      const target = buildBattler({ notes: [ '<noDamage>' ] });
      target.mhp = 1000;
      const action = buildAction(buildBattler());

      // Act
      action.itemEffectRecoverHp(target, { value1: -0.1, value2: 0 });

      // Assert
      expect(original).not.toHaveBeenCalled();
    });

    it('runs a Recover HP effect that restores', () =>
    {
      // Arrange
      const original = vi.fn();
      globalThis.J.ABS.Aliased.Game_Action.set('itemEffectRecoverHp', original);
      const target = buildBattler({ notes: [ '<noDamage>' ] });
      target.mhp = 1000;
      const effect = { value1: 0.1, value2: 0 };
      const action = buildAction(buildBattler());

      // Act
      action.itemEffectRecoverHp(target, effect);

      // Assert
      expect(original).toHaveBeenCalledWith(target, effect);
    });

    it('skips a harmful Recover MP effect on a target that takes no damage', () =>
    {
      // Arrange
      const original = vi.fn();
      globalThis.J.ABS.Aliased.Game_Action.set('itemEffectRecoverMp', original);
      const target = buildBattler({ notes: [ '<noDamage>' ] });
      target.mmp = 200;
      const action = buildAction(buildBattler());

      // Act
      action.itemEffectRecoverMp(target, { value1: 0, value2: -50 });

      // Assert
      expect(original).not.toHaveBeenCalled();
    });

    it('runs a harmful Recover MP effect on a target that can be hurt', () =>
    {
      // Arrange
      const original = vi.fn();
      globalThis.J.ABS.Aliased.Game_Action.set('itemEffectRecoverMp', original);
      const target = buildBattler();
      target.mmp = 200;
      const effect = { value1: 0, value2: -50 };
      const action = buildAction(buildBattler());

      // Act
      action.itemEffectRecoverMp(target, effect);

      // Assert
      expect(original).toHaveBeenCalledWith(target, effect);
    });
  });

  describe('Game_Action.isIgnoredRecoverHarm', () =>
  {
    it('is false for an effect that restores, even on a target that takes no damage', () =>
    {
      // Arrange
      const target = buildBattler({ notes: [ '<noDamage>' ] });
      const action = buildAction(buildBattler());

      // Act
      const result = action.isIgnoredRecoverHarm(target, 1000, { value1: -0.1, value2: 150 });

      // Assert
      expect(result).toBe(false);
    });

    it('is true for an effect written below zero on a target that takes no damage', () =>
    {
      // Arrange
      const target = buildBattler({ notes: [ '<noDamage>' ] });
      const action = buildAction(buildBattler());

      // Act
      const result = action.isIgnoredRecoverHarm(target, 1000, { value1: -0.1, value2: 50 });

      // Assert
      expect(result).toBe(true);
    });

    it('is false for an effect written below zero on a target that can be hurt', () =>
    {
      // Arrange
      const target = buildBattler();
      const action = buildAction(buildBattler());

      // Act
      const result = action.isIgnoredRecoverHarm(target, 1000, { value1: -0.1, value2: 50 });

      // Assert
      expect(result).toBe(false);
    });
  });
});
//endregion plugins/abs/core/_component/damage-limits.test.js
