//region plugins/passive/ext/conditional/core/describe-conditional-notetags.test.js
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
 * The lines J-Passive-Conditional describes its own tags with, read back through J-Base's real registry against the
 * plugin's real regexes, with sentences and condition phrases written the way Chef Adventure's config would write
 * them. Every line is plain text: no value is left for a screen to color.
 */
describe('ConditionalNotetagDescriptions (direct src import)', () =>
{
  let ConditionalNotetagDescriptions;

  /**
   * The phrases and sentences these tests speak with.
   * @type {Array<[string, string]>}
   */
  const templates = [
    [ 'unit.seconds', '{n} seconds' ],
    [ 'unit.seconds.one', '{n} second' ],
    [ 'unit.tiles', '{n} tiles' ],
    [ 'trigger.time', 'every {seconds}' ],
    [ 'trigger.onKill', 'whenever you defeat an enemy' ],
    [ 'trigger.anyDmg', 'whenever you take damage' ],
    [ 'trigger.onKnockback', 'whenever you knock an enemy back' ],
    [ 'trigger.negaStateInflicted', 'whenever you inflict an ailment' ],
    [ 'gate.hpBelow', 'while your {resource} is at or below {percent}' ],
    [ 'gate.enemiesNearbyBelow.one', 'while no enemy is within {tiles}' ],
    [ 'count.enemiesNearby.one', 'per enemy within {tiles}' ],
    [ 'passiveSourceRule', 'Only active {gate}.' ],
    [ 'passiveStateRule', '{state} is only active {gate}.' ],
    [ 'passiveStateCount', 'One stack of {state} {count}.' ],
    [ 'autoApplyState', 'Gain {state} {trigger}.' ],
    [ 'autoApplyStateOnNearby.enemiesNearby.one', 'Inflict {state} on every enemy within {tiles}, every {seconds}.' ],
    [ 'autoExecuteSkill', 'Use {skill} {trigger}.' ],
    [ 'autoInflictState', 'Inflict {state} {trigger}.' ],
    [ 'autoModifyCooldowns.reduce.percent', 'Cooldowns recover {amount} {trigger}.' ],
    [ 'autoModifyCooldowns.reduce.flat', 'Cooldowns recover {amount} {trigger}.' ],
    [ 'autoModifyCooldowns.increase.percent.single', 'Your {slot} cooldown grows {amount} {trigger}.' ],
    [ 'autoModifyCooldowns.reduce.percent.combat', 'Your {slot} cooldowns recover {amount} {trigger}.' ],
    [ 'removeOnSkillExecution', 'Using a {skillType} skill has a {chance} chance to remove a stack.' ],
    [ 'removeOnSkillResolution.any', 'Landing any skill has a {chance} chance to remove a stack.' ],
    [ 'removeStateOnMove', 'Moving removes {state}.' ],
  ];

  /**
   * Reads a line back as its icon, words, value and impact.
   * @param {NotetagLine} line The line.
   * @returns {Array<number|string>}
   */
  const partsOf = line => [ line.iconIndex, line.text, line.value, line.holderImpact ];

  /**
   * The lines J-Base's registry answers for a row carrying the given note.
   * @param {string} note The note.
   * @returns {Array<Array<number|string>>}
   */
  const linesOf = note => globalThis.NotetagDescriber.linesFor({ note })
    .map(partsOf);

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

    // J-Base's own classes, read the way a shipped plugin reads another ship's globals.
    ({ default: globalThis.JsonMapper } = await import(
      '../../../../../../src/plugins/_base/core/_utilities/JsonMapper.js'));
    ({ default: globalThis.NotetagLine } = await import(
      '../../../../../../src/plugins/_base/core/models/NotetagLine.js'));
    ({ default: globalThis.NotetagDescriber } = await import(
      '../../../../../../src/plugins/_base/core/managers/NotetagDescriber.js'));

    // the resources as Chef Adventure names them.
    globalThis.TextManager.hp = 'Life';

    ({ default: ConditionalNotetagDescriptions } = await import(
      '../../../../../../src/plugins/passive/ext/conditional/core/describeConditionalNotetags.js'));
  });

  beforeEach(() =>
  {
    // registering a tag twice throws, so every test describes into an empty registry.
    globalThis.NotetagDescriber.describers()
      .clear();
    ConditionalNotetagDescriptions.registerAll();

    globalThis.NotetagDescriber.setTemplates(new Map(templates));
  });

  it('refuses to be constructed, being a static class', () =>
  {
    // Arrange & Act
    const attempt = () => new ConditionalNotetagDescriptions();

    // Assert
    expect(attempt)
      .toThrow('This is a static class.');
  });

  it('lists its tags gates first, then what fires on its own, then what takes stacks away, and describes each', () =>
  {
    // Arrange
    const { RegExp: tags } = globalThis.J.PASSIVE.EXT.CONDITIONAL;

    // Act
    const structures = ConditionalNotetagDescriptions.structures();

    // Assert
    expect(structures)
      .toEqual([
        tags.PassiveSourceRule,
        tags.PassiveStateRule,
        tags.PassiveStateCount,
        tags.AutoApplyState,
        tags.AutoApplyStateOnNearby,
        tags.AutoExecuteSkill,
        tags.AutoInflictState,
        tags.AutoModifyCooldowns,
        tags.RemoveOnSkillExecution,
        tags.RemoveOnSkillResolution,
        tags.RemoveStateOnMove,
      ]);
    expect(globalThis.NotetagDescriber.describers().size)
      .toBe(11);
  });

  it('writes the gates and the stack count, each in its own sentence', () =>
  {
    // Arrange
    const note = [
      '<passiveSourceRule:[hpBelow, 20]>',
      '<passiveStateRule:[83, enemiesNearbyBelow, 1, 2]>',
      '<passiveStateCount:[77, enemiesNearby, 1]>',
    ].join('\n');

    // Act
    const lines = linesOf(note);

    // Assert- gates and counts cut neither way; the passives' own lines say which way they cut.
    expect(lines)
      .toEqual([
        [ 0, 'Only active while your \\C[1]Life\\C[0] is at or below \\C[3]\\*20%\\*\\C[0].', '', 0 ],
        [ 0, '\\state[83] is only active while no enemy is within \\C[6]\\*2\\*\\C[0] tiles.', '', 0 ],
        [ 0, 'One stack of \\state[77] per enemy within \\C[6]\\*5\\*\\C[0] tiles.', '', 0 ],
      ]);
  });

  it('writes each rule that fires on its own in its own sentence, working in its holder\'s favor', () =>
  {
    // Arrange
    const note = [
      '<autoApplyState:[1001, time, 3600]>',
      '<autoApplyStateOnNearby:[1061, enemiesNearby, 1, 60]>',
      '<autoExecuteSkill:[262, anyDmg, 0]>',
      '<autoInflictState:[8, onKnockback, 0]>',
    ].join('\n');

    // Act
    const lines = linesOf(note);

    // Assert
    expect(lines)
      .toEqual([
        [ 0, 'Gain \\state[1001] every \\C[6]\\*60\\*\\C[0] seconds.', '', 1 ],
        [
          0,
          'Inflict \\state[1061] on every enemy within \\C[6]\\*5\\*\\C[0] tiles, every \\C[6]\\*1\\*\\C[0] second.',
          '',
          1,
        ],
        [ 0, 'Use \\skill[262] whenever you take damage.', '', 1 ],
        [ 0, 'Inflict \\state[8] whenever you knock an enemy back.', '', 1 ],
      ]);
  });

  it('says a shorter cooldown as a share or in seconds, reaching every slot when no reach is written', () =>
  {
    // Arrange
    const note = [
      '<autoModifyCooldowns:[-10, onKill, 0, percent]>',
      '<autoModifyCooldowns:[-60, negaStateInflicted, 0, flat, all]>',
    ].join('\n');

    // Act
    const lines = linesOf(note);

    // Assert- a shorter cooldown works in its holder's favor.
    expect(lines)
      .toEqual([
        [ 0, 'Cooldowns recover \\C[3]\\*10%\\*\\C[0] whenever you defeat an enemy.', '', 1 ],
        [ 0, 'Cooldowns recover \\C[6]\\*1\\*\\C[0] second whenever you inflict an ailment.', '', 1 ],
      ]);
  });

  it('says a longer cooldown on one slot in that reach\'s own sentence, naming the slot, against its holder', () =>
  {
    // Arrange
    const note = '<autoModifyCooldowns:[25, onKill, 0, percent, single, mainhand]>';

    // Act
    const lines = linesOf(note);

    // Assert
    expect(lines)
      .toEqual([
        [ 0, 'Your \\C[1]mainhand\\C[0] cooldown grows \\C[3]\\*25%\\*\\C[0] whenever you defeat an enemy.', '', -1 ],
      ]);
  });

  it('says nothing for a sentence naming a slot the rule never gave', () =>
  {
    // Arrange- the combat reach names no one slot, so a sentence written with one has a hole in it.
    const note = '<autoModifyCooldowns:[-10, onKill, 0, percent, combat]>';

    // Act
    const lines = linesOf(note);

    // Assert
    expect(lines)
      .toEqual([]);
  });

  it('writes the chance to lose a stack for one skill type, or for any skill in that case\'s own sentence', () =>
  {
    // Arrange
    const note = '<removeOnSkillExecution:[4, 100]>\n<removeOnSkillResolution:[0, 50]>';

    // Act
    const lines = linesOf(note);

    // Assert
    expect(lines)
      .toEqual([
        [ 0, 'Using a \\skillType[4] skill has a \\C[3]\\*100%\\*\\C[0] chance to remove a stack.', '', 0 ],
        [ 0, 'Landing any skill has a \\C[3]\\*50%\\*\\C[0] chance to remove a stack.', '', 0 ],
      ]);
  });

  it('writes the state moving costs', () =>
  {
    // Arrange
    const note = '<removeStateOnMove:[1031]>';

    // Act
    const lines = linesOf(note);

    // Assert
    expect(lines)
      .toEqual([ [ 0, 'Moving removes \\state[1031].', '', 0 ] ]);
  });
});
//endregion plugins/passive/ext/conditional/core/describe-conditional-notetags.test.js
