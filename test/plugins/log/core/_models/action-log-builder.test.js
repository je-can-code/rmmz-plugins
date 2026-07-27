//region plugins/log/core/_models/action-log-builder.test.js
import { beforeAll, describe, expect, it } from 'vitest';

import ActionLogBuilder from '../../../../../src/plugins/log/core/_models/ActionLogBuilder.js';

describe('ActionLogBuilder', () =>
{
  beforeAll(() =>
  {
    // String.empty is a J-Base runtime augmentation, always present by the time this file's
    // production code runs in-game; stub it here since this test doesn't boot J-Base itself.
    String.empty = '';
  });

  describe('build/setMessage/#clear', () =>
  {
    it('builds an ActionLog carrying the currently set message', () =>
    {
      // Arrange
      const builder = new ActionLogBuilder();
      builder.setMessage('hello there');

      // Act
      const log = builder.build();

      // Assert
      expect(log.message()).toEqual('hello there');
    });

    it('clears the message back to empty after build, so a subsequent build does not reuse it', () =>
    {
      // Arrange
      const builder = new ActionLogBuilder();
      builder.setMessage('first message');
      builder.build();

      // Act
      const secondLog = builder.build();

      // Assert
      expect(secondLog.message()).toEqual('');
    });
  });

  describe('setupExecution', () =>
  {
    it('renders a critical hit message', () =>
    {
      // Arrange
      const builder = new ActionLogBuilder();

      // Act
      const log = builder.setupExecution('Target', 'Caster', 5, '100', '', false, true)
        .build();

      // Assert
      expect(log.message()).toEqual(
        '\\C[2]Caster\\C[0] landed a critical \\C[16]Target\\C[0] with \\Skill[5] for \\C[10]100\\C[0]!');
    });

    it('renders a critical heal message', () =>
    {
      // Arrange
      const builder = new ActionLogBuilder();

      // Act
      const log = builder.setupExecution('Target', 'Caster', 5, '100', '', true, true)
        .build();

      // Assert
      expect(log.message()).toEqual(
        '\\C[2]Caster\\C[0] critically healed \\C[16]Target\\C[0] with \\Skill[5] for \\C[29]100\\C[0]!');
    });

    it('renders a normal hit message', () =>
    {
      // Arrange
      const builder = new ActionLogBuilder();

      // Act
      const log = builder.setupExecution('Target', 'Caster', 5, '100', ' (50 reduced)', false, false)
        .build();

      // Assert
      expect(log.message()).toEqual(
        '\\C[2]Caster\\C[0] hit \\C[16]Target\\C[0] with \\Skill[5] for \\C[10]100\\C[0] (50 reduced)!');
    });

    it('renders a normal heal message', () =>
    {
      // Arrange
      const builder = new ActionLogBuilder();

      // Act
      const log = builder.setupExecution('Target', 'Caster', 5, '100', '', true, false)
        .build();

      // Assert
      expect(log.message()).toEqual(
        '\\C[2]Caster\\C[0] healed \\C[16]Target\\C[0] with \\Skill[5] for \\C[29]100\\C[0]!');
    });
  });

  describe('setupTerrainDamage', () =>
  {
    it('renders a devastating critical damage message', () =>
    {
      // Arrange
      const builder = new ActionLogBuilder();

      // Act
      const log = builder.setupTerrainDamage('Target', 5, '100', '', false, true)
        .build();

      // Assert
      expect(log.message()).toEqual(
        '\\C[16]Target\\C[0] was devastatingly damaged by \\Skill[5] for \\C[10]100\\C[0]!');
    });

    it('renders a critically healed message', () =>
    {
      // Arrange
      const builder = new ActionLogBuilder();

      // Act
      const log = builder.setupTerrainDamage('Target', 5, '100', '', true, true)
        .build();

      // Assert
      expect(log.message()).toEqual(
        '\\C[16]Target\\C[0] was critically healed by \\Skill[5] for \\C[29]100\\C[0]!');
    });

    it('renders a normal struck message', () =>
    {
      // Arrange
      const builder = new ActionLogBuilder();

      // Act
      const log = builder.setupTerrainDamage('Target', 5, '100', '', false, false)
        .build();

      // Assert
      expect(log.message()).toEqual(
        '\\C[16]Target\\C[0] was struck by \\Skill[5] for \\C[10]100\\C[0]!');
    });

    it('renders a normal restored message', () =>
    {
      // Arrange
      const builder = new ActionLogBuilder();

      // Act
      const log = builder.setupTerrainDamage('Target', 5, '100', '', true, false)
        .build();

      // Assert
      expect(log.message()).toEqual(
        '\\C[16]Target\\C[0] was restored by \\Skill[5] for \\C[29]100\\C[0]!');
    });
  });

  describe('setupTargetDefeated', () =>
  {
    it('renders a defeated message', () =>
    {
      // Arrange
      const builder = new ActionLogBuilder();

      // Act
      const log = builder.setupTargetDefeated('Target')
        .build();

      // Assert
      expect(log.message()).toEqual('\\C[16]Target\\C[0] was defeated.');
    });
  });

  describe('setupSkillLearn', () =>
  {
    it('renders a skill learned message', () =>
    {
      // Arrange
      const builder = new ActionLogBuilder();

      // Act
      const log = builder.setupSkillLearn('Target', 12)
        .build();

      // Assert
      expect(log.message()).toEqual('\\C[16]Target\\C[0] learned \\Skill[12]!');
    });
  });

  describe('setupLevelUp', () =>
  {
    it('renders a level up message', () =>
    {
      // Arrange
      const builder = new ActionLogBuilder();

      // Act
      const log = builder.setupLevelUp('Target', 10)
        .build();

      // Assert
      expect(log.message()).toEqual('\\C[16]Target\\C[0] has reached level \\*10\\*!');
    });
  });

  describe('setupStateAfflicted', () =>
  {
    it('renders a state afflicted message', () =>
    {
      // Arrange
      const builder = new ActionLogBuilder();

      // Act
      const log = builder.setupStateAfflicted('Target', 4)
        .build();

      // Assert
      expect(log.message()).toEqual('\\C[16]Target\\C[0] became afflicted with \\State[4].');
    });
  });

  describe('setupRetaliation', () =>
  {
    it('renders a retaliation message', () =>
    {
      // Arrange
      const builder = new ActionLogBuilder();

      // Act
      const log = builder.setupRetaliation('Target')
        .build();

      // Assert
      expect(log.message()).toEqual('\\C[16]Target\\C[0] retaliated!');
    });
  });

  describe('setupParry', () =>
  {
    it('renders a precise parry message', () =>
    {
      // Arrange
      const builder = new ActionLogBuilder();

      // Act
      const log = builder.setupParry('Target', 'Caster', 5, true)
        .build();

      // Assert
      expect(log.message()).toEqual("\\C[16]Target\\C[0] precise-parried Caster's \\Skill[5] with finesse!");
    });

    it('renders a normal parry message', () =>
    {
      // Arrange
      const builder = new ActionLogBuilder();

      // Act
      const log = builder.setupParry('Target', 'Caster', 5, false)
        .build();

      // Assert
      expect(log.message()).toEqual("\\C[16]Target\\C[0] parried Caster's \\Skill[5].");
    });
  });

  describe('setupDodge', () =>
  {
    it('renders a dodge message', () =>
    {
      // Arrange
      const builder = new ActionLogBuilder();

      // Act
      const log = builder.setupDodge('Target', 'Caster', 5)
        .build();

      // Assert
      expect(log.message()).toEqual("\\C[16]Target\\C[0] dodged \\C[2]Caster\\C[0]'s \\Skill[5].");
    });
  });

  describe('setupUndamaged', () =>
  {
    it('renders a no-effect message', () =>
    {
      // Arrange
      const builder = new ActionLogBuilder();

      // Act
      const log = builder.setupUndamaged('Target', 'Caster', 5)
        .build();

      // Assert
      expect(log.message()).toEqual(
        '\\C[16]Caster\\C[0] used \\Skill[5], but it had no effect on \\C[2]Target\\C[0].');
    });
  });

  describe('setupPartyCycle', () =>
  {
    it('renders a party cycle message', () =>
    {
      // Arrange
      const builder = new ActionLogBuilder();

      // Act
      const log = builder.setupPartyCycle('Target')
        .build();

      // Assert
      expect(log.message()).toEqual('Party cycled to \\C[16]Target\\C[0].');
    });
  });

  describe('setupExperienceGained', () =>
  {
    it('renders an experience gained message', () =>
    {
      // Arrange
      const builder = new ActionLogBuilder();

      // Act
      const log = builder.setupExperienceGained('Target', 250)
        .build();

      // Assert
      expect(log.message()).toEqual('\\C[16]Target\\C[0] gained \\*\\C[6]250\\C[0]\\* experience.');
    });
  });

  describe('setupSdpAcquired', () =>
  {
    it('renders an SDP points acquired message', () =>
    {
      // Arrange
      const builder = new ActionLogBuilder();

      // Act
      const log = builder.setupSdpAcquired('Target', 30)
        .build();

      // Assert
      expect(log.message()).toEqual('\\C[16]Target\\C[0] acquired \\*30\\* SDP points.');
    });
  });

  describe('setupSdpUnlocked', () =>
  {
    it('renders an SDP unlocked message', () =>
    {
      // Arrange
      const builder = new ActionLogBuilder();

      // Act
      const log = builder.setupSdpUnlocked('brawler')
        .build();

      // Assert
      expect(log.message()).toEqual('\\sdp[brawler] has been unlocked!');
    });
  });

  describe('setupStatePurged', () =>
  {
    it('renders a state purged message', () =>
    {
      // Arrange
      const builder = new ActionLogBuilder();

      // Act
      const log = builder.setupStatePurged('Target', 4)
        .build();

      // Assert
      expect(log.message()).toEqual('\\C[16]Target\\C[0] was purged of \\State[4].');
    });
  });
});
//endregion plugins/log/core/_models/action-log-builder.test.js
