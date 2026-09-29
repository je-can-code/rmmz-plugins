//region plugins/passive/ext/conditional/core/condition-phrases.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installPassiveHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPassive,
} from '../../../_component/fixtures/install-passive-host-globals.js';
import {
  installPassiveConditionalHostGlobals,
  setPluginContextToJPassiveConditional,
} from '../../../_component/fixtures/install-passive-conditional-host-globals.js';

/**
 * The phrases J-Passive-Conditional's conditions are spoken in, filled through J-Base's real registry from a config
 * written the way Chef Adventure's would be. The plugin's default radius is left at its own default of five tiles, so
 * a phrase naming five tiles is one whose tag wrote no radius.
 */
describe('ConditionPhrases (direct src import)', () =>
{
  let ConditionPhrases;

  /**
   * Every phrase these tests speak with: the units, then a trigger, gate and count of each shape.
   * @type {Array<[string, string]>}
   */
  const phrases = [
    [ 'unit.seconds', '{n} seconds' ],
    [ 'unit.seconds.one', '{n} second' ],
    [ 'unit.tiles', '{n} tiles' ],
    [ 'unit.tiles.one', '{n} tile' ],
    [ 'trigger.time', 'every {seconds}' ],
    [ 'trigger.stand', 'every {seconds} spent standing still' ],
    [ 'trigger.move', 'for every {tiles} traveled' ],
    [ 'trigger.onKill', 'whenever you defeat an enemy' ],
    [ 'trigger.hpDmg', 'whenever you lose {resource}' ],
    [ 'trigger.hpDmg.throttled', 'whenever you lose {resource}, at most once every {seconds}' ],
    [ 'trigger.enemiesNearby', 'every {seconds} while {count} enemies are within {tiles}' ],
    [ 'trigger.enemiesNearby.one', 'every {seconds} while an enemy is within {tiles}' ],
    [ 'trigger.alliesNearby.one', 'every {seconds} while an ally is within {tiles}' ],
    [ 'gate.hpBelow', 'while your {resource} is at or below {percent}' ],
    [ 'gate.hpAbove.allAllies', 'while every ally within {tiles} has {resource} above {percent}' ],
    [ 'gate.alliesNearby', 'while {count} allies are within {tiles}' ],
    [ 'gate.alliesNearby.one', 'while an ally is within {tiles}' ],
    [ 'gate.enemiesTargetingMe.one', 'while an enemy has you targeted' ],
    [ 'gate.sinceLastHit', 'after {seconds} without being hit' ],
    [ 'gate.allOffCooldown', 'while every skill is ready' ],
    [ 'gate.slotOffCooldown', 'while that slot has been ready for {seconds}' ],
    [ 'count.enemiesNearby', 'per {per} enemies within {tiles}' ],
    [ 'count.enemiesNearby.one', 'per enemy within {tiles}' ],
    [ 'count.lessIsMoreHp', 'per {per} of {resource} missing' ],
    [ 'gate.mpBelow', 'while your {resource} is at or below {percent}' ],
    [ 'count.moreIsMoreTp', 'per {per} of {resource} held' ],
  ];

  /**
   * The words of a phrase as the registry hands it back.
   * @param {{text: string, kind: string}} phrase The phrase.
   * @returns {string}
   */
  const textOf = phrase => phrase.text;

  beforeAll(async () =>
  {
    vi.resetModules();

    installPassiveHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJPassive();
    await import('../../../../../../src/plugins/passive/core/_metadata/initialization.js');

    installPassiveConditionalHostGlobals();

    setPluginContextToJPassiveConditional();
    await import('../../../../../../src/plugins/passive/ext/conditional/_metadata/initialization.js');

    // J-Base's own registry, read the way a shipped plugin reads another ship's globals.
    ({ default: globalThis.NotetagDescriber } = await import(
      '../../../../../../src/plugins/_base/core/managers/NotetagDescriber.js'));

    // the resources as Chef Adventure names them.
    globalThis.TextManager.hp = 'Life';
    globalThis.TextManager.mp = 'Magi';
    globalThis.TextManager.tp = 'Tech';

    ({ default: ConditionPhrases } = await import(
      '../../../../../../src/plugins/passive/ext/conditional/core/ConditionPhrases.js'));
  });

  beforeEach(() =>
  {
    globalThis.NotetagDescriber.setTemplates(new Map(phrases));
  });

  it('refuses to be constructed, being a static class', () =>
  {
    // Arrange & Act
    const attempt = () => new ConditionPhrases();

    // Assert
    expect(attempt)
      .toThrow('This is a static class.');
  });

  describe('trigger', () =>
  {
    it('speaks a proximity trigger in the singular for one battler, at the radius and pace its tag writes', () =>
    {
      // Arrange
      const tuple = [ 1001, 'enemiesNearby', 1, 180, 3 ];

      // Act
      const phrase = ConditionPhrases.trigger(tuple);

      // Assert
      expect(textOf(phrase))
        .toBe('every \\C[6]\\*3\\*\\C[0] seconds while an enemy is within \\C[6]\\*3\\*\\C[0] tiles');
    });

    it('speaks a proximity trigger in the plural for several battlers, at the default radius when none is written', () =>
    {
      // Arrange
      const tuple = [ 1005, 'enemiesNearby', 2, 60 ];

      // Act
      const phrase = ConditionPhrases.trigger(tuple);

      // Assert
      expect(textOf(phrase))
        .toBe('every \\C[6]\\*1\\*\\C[0] second while \\C[3]\\*2\\*\\C[0] enemies are within \\C[6]\\*5\\*\\C[0] tiles');
    });

    it('measures an ally trigger at the default radius, whatever radius its tag writes, as its reader does', () =>
    {
      // Arrange- nine tiles written, which the rule's reader never uses for allies.
      const tuple = [ 1062, 'alliesNearby', 1, 60, 9 ];

      // Act
      const phrase = ConditionPhrases.trigger(tuple);

      // Assert
      expect(textOf(phrase))
        .toBe('every \\C[6]\\*1\\*\\C[0] second while an ally is within \\C[6]\\*5\\*\\C[0] tiles');
    });

    it('speaks travel in tiles, singular for exactly one', () =>
    {
      // Arrange
      const tuple = [ 1091, 'move', 1 ];

      // Act
      const phrase = ConditionPhrases.trigger(tuple);

      // Assert
      expect(textOf(phrase))
        .toBe('for every \\C[6]\\*1\\*\\C[0] tile traveled');
    });

    it('speaks a timer\'s interval in seconds', () =>
    {
      // Arrange
      const tuple = [ 1021, 'time', 300 ];

      // Act
      const phrase = ConditionPhrases.trigger(tuple);

      // Assert
      expect(textOf(phrase))
        .toBe('every \\C[6]\\*5\\*\\C[0] seconds');
    });

    it('speaks an interval that is no whole second to two decimals', () =>
    {
      // Arrange
      const tuple = [ 1031, 'stand', 90 ];

      // Act
      const phrase = ConditionPhrases.trigger(tuple);

      // Assert
      expect(textOf(phrase))
        .toBe('every \\C[6]\\*1.5\\*\\C[0] seconds spent standing still');
    });

    it('speaks an unthrottled event plainly', () =>
    {
      // Arrange
      const tuple = [ 68, 'onKill', 0 ];

      // Act
      const phrase = ConditionPhrases.trigger(tuple);

      // Assert
      expect(textOf(phrase))
        .toBe('whenever you defeat an enemy');
    });

    it('speaks a throttled event\'s throttle when its words are written, naming the resource it watches', () =>
    {
      // Arrange
      const tuple = [ 1041, 'hpDmg', 480 ];

      // Act
      const phrase = ConditionPhrases.trigger(tuple);

      // Assert
      expect(textOf(phrase))
        .toBe('whenever you lose \\C[1]Life\\C[0], at most once every \\C[6]\\*8\\*\\C[0] seconds');
    });

    it('names the resource an unthrottled event watches', () =>
    {
      // Arrange
      const tuple = [ 1005, 'hpDmg', 0 ];

      // Act
      const phrase = ConditionPhrases.trigger(tuple);

      // Assert
      expect(textOf(phrase))
        .toBe('whenever you lose \\C[1]Life\\C[0]');
    });

    it('leaves a throttle unsaid when its words are not written, which is still true', () =>
    {
      // Arrange- onKill has no throttled phrase written.
      const tuple = [ 317, 'onKill', 120 ];

      // Act
      const phrase = ConditionPhrases.trigger(tuple);

      // Assert
      expect(textOf(phrase))
        .toBe('whenever you defeat an enemy');
    });

    it('says nothing when the unit it needs has no words', () =>
    {
      // Arrange- every phrase but the seconds.
      const withoutSeconds = phrases.filter(([ key ]) => key.startsWith('unit.seconds') === false);
      globalThis.NotetagDescriber.setTemplates(new Map(withoutSeconds));

      // Act
      const phrase = ConditionPhrases.trigger([ 1021, 'time', 300 ]);

      // Assert
      expect(textOf(phrase))
        .toBe('');
    });
  });

  describe('gate', () =>
  {
    it('speaks a resource threshold of the holder\'s own, naming the resource as its manager does', () =>
    {
      // Arrange
      const rule = [ 'hpBelow', 20 ];

      // Act
      const phrase = ConditionPhrases.gate(rule);

      // Assert
      expect(textOf(phrase))
        .toBe('while your \\C[1]Life\\C[0] is at or below \\C[3]\\*20%\\*\\C[0]');
    });

    it('names Magi for a threshold on it, as its manager does', () =>
    {
      // Arrange
      const rule = [ 'mpBelow', 50 ];

      // Act
      const phrase = ConditionPhrases.gate(rule);

      // Assert
      expect(textOf(phrase))
        .toBe('while your \\C[1]Magi\\C[0] is at or below \\C[3]\\*50%\\*\\C[0]');
    });

    it('speaks a threshold written for the holder\'s own self the same way', () =>
    {
      // Arrange
      const rule = [ 'hpBelow', 30, 'self' ];

      // Act
      const phrase = ConditionPhrases.gate(rule);

      // Assert
      expect(textOf(phrase))
        .toBe('while your \\C[1]Life\\C[0] is at or below \\C[3]\\*30%\\*\\C[0]');
    });

    it('speaks a threshold on the battlers around the holder in its scope\'s own words', () =>
    {
      // Arrange
      const rule = [ 'hpAbove', 75, 'allAllies', 8 ];

      // Act
      const phrase = ConditionPhrases.gate(rule);

      // Assert
      expect(textOf(phrase))
        .toBe('while every ally within \\C[6]\\*8\\*\\C[0] tiles has \\C[1]Life\\C[0] above \\C[3]\\*75%\\*\\C[0]');
    });

    it('says nothing for a scope with no words, rather than speaking of the holder instead', () =>
    {
      // Arrange- hpBelow is written for the holder, but not for any ally.
      const rule = [ 'hpBelow', 20, 'anyAlly', 4 ];

      // Act
      const phrase = ConditionPhrases.gate(rule);

      // Assert
      expect(textOf(phrase))
        .toBe('');
    });

    it('counts one nearby battler in the singular, at the radius its tag writes', () =>
    {
      // Arrange
      const rule = [ 'alliesNearby', 1, 7 ];

      // Act
      const phrase = ConditionPhrases.gate(rule);

      // Assert
      expect(textOf(phrase))
        .toBe('while an ally is within \\C[6]\\*7\\*\\C[0] tiles');
    });

    it('counts several nearby battlers in the plural, at the default radius when none is written', () =>
    {
      // Arrange
      const rule = [ 'alliesNearby', 2 ];

      // Act
      const phrase = ConditionPhrases.gate(rule);

      // Assert
      expect(textOf(phrase))
        .toBe('while \\C[3]\\*2\\*\\C[0] allies are within \\C[6]\\*5\\*\\C[0] tiles');
    });

    it('counts battlers targeting the holder the same way', () =>
    {
      // Arrange
      const rule = [ 'enemiesTargetingMe', 1 ];

      // Act
      const phrase = ConditionPhrases.gate(rule);

      // Assert
      expect(textOf(phrase))
        .toBe('while an enemy has you targeted');
    });

    it('speaks time since something last happened in seconds', () =>
    {
      // Arrange
      const rule = [ 'sinceLastHit', 300 ];

      // Act
      const phrase = ConditionPhrases.gate(rule);

      // Assert
      expect(textOf(phrase))
        .toBe('after \\C[6]\\*5\\*\\C[0] seconds without being hit');
    });

    it('speaks any other gate in nothing but its own words', () =>
    {
      // Arrange
      const rule = [ 'allOffCooldown' ];

      // Act
      const phrase = ConditionPhrases.gate(rule);

      // Assert
      expect(textOf(phrase))
        .toBe('while every skill is ready');
    });

    it('hands a gate that measures no time no seconds, so words asking for them say nothing', () =>
    {
      // Arrange- a slot's readiness is no span of time, whatever its words were written to ask for.
      const rule = [ 'slotOffCooldown', 'mainhand' ];

      // Act
      const phrase = ConditionPhrases.gate(rule);

      // Assert
      expect(textOf(phrase))
        .toBe('');
    });
  });

  describe('count', () =>
  {
    it('counts a resource in steps of a percentage, naming the resource as its manager does', () =>
    {
      // Arrange
      const tuple = [ 1011, 'lessIsMoreHp', 4 ];

      // Act
      const phrase = ConditionPhrases.count(tuple);

      // Assert
      expect(textOf(phrase))
        .toBe('per \\C[3]\\*4%\\*\\C[0] of \\C[1]Life\\C[0] missing');
    });

    it('names Tech for a count scaled by it, as its manager does', () =>
    {
      // Arrange
      const tuple = [ 12, 'moreIsMoreTp', 10 ];

      // Act
      const phrase = ConditionPhrases.count(tuple);

      // Assert
      expect(textOf(phrase))
        .toBe('per \\C[3]\\*10%\\*\\C[0] of \\C[1]Tech\\C[0] held');
    });

    it('counts one battler per stack in the singular, at the radius its tag writes', () =>
    {
      // Arrange
      const tuple = [ 77, 'enemiesNearby', 1, 3 ];

      // Act
      const phrase = ConditionPhrases.count(tuple);

      // Assert
      expect(textOf(phrase))
        .toBe('per enemy within \\C[6]\\*3\\*\\C[0] tiles');
    });

    it('counts several battlers per stack in the plural, at the default radius when none is written', () =>
    {
      // Arrange
      const tuple = [ 66, 'enemiesNearby', 5 ];

      // Act
      const phrase = ConditionPhrases.count(tuple);

      // Assert
      expect(textOf(phrase))
        .toBe('per \\C[3]\\*5\\*\\C[0] enemies within \\C[6]\\*5\\*\\C[0] tiles');
    });
  });
});
//endregion plugins/passive/ext/conditional/core/condition-phrases.test.js
