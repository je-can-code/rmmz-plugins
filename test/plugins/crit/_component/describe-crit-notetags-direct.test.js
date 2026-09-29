//region plugins/crit/_component/describe-crit-notetags-direct.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installCritHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJCrit,
} from './fixtures/install-crit-host-globals.js';

/**
 * The lines J-CriticalFactors describes its own tags with, read back through J-Base's real registry against the
 * plugin's real regexes and the sentences Chef Adventure's config writes.
 *
 * The crit tags come in pairs that read alike and mean different things: an amount on top of a base, and the base
 * itself. So a fixture that carries a pair gives them different amounts, and a tag wired to the other's sentence
 * could not hide behind a matching number.
 */
describe('J-CriticalFactors CritNotetagDescriptions (direct src import)', () =>
{
  let CritNotetagDescriptions;

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

    installCritHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJCrit();
    await import('../../../../src/plugins/crit/core/_metadata/initialization.js');

    // J-Base's own classes, read the way a shipped plugin reads another ship's globals.
    ({ default: globalThis.JsonMapper } = await import(
      '../../../../src/plugins/_base/core/_utilities/JsonMapper.js'));
    ({ default: globalThis.RPG_Trait } = await import(
      '../../../../src/plugins/_base/core/database/_data/RPG_Trait.js'));
    ({ default: globalThis.NotetagLine } = await import('../../../../src/plugins/_base/core/models/NotetagLine.js'));
    ({ default: globalThis.NotetagDescriber } = await import(
      '../../../../src/plugins/_base/core/managers/NotetagDescriber.js'));

    // J-Base's own icons, crit chance's among them, then this plugin's own icons hung on that same manager the way
    // the shipped bundle hangs them.
    ({ default: globalThis.IconManager } = await import(
      '../../../../src/plugins/_base/core/managers/IconManager.js'));
    await import('../../../../src/plugins/crit/core/managers/IconManager.js');

    ({ default: CritNotetagDescriptions } = await import(
      '../../../../src/plugins/crit/core/core/describeCritNotetags.js'));
  });

  beforeEach(() =>
  {
    // registering a tag twice throws, so every test describes into an empty registry.
    globalThis.NotetagDescriber.describers()
      .clear();
    CritNotetagDescriptions.registerAll();

    // the seventeen sentences, as Chef Adventure's config writes them.
    globalThis.NotetagDescriber.setTemplates(new Map([
      [
        'critAlwaysIfState',
        'If the target is afflicted with {state}, then \\C[2]critical hits\\C[0] are \\C[3]GUARANTEED\\C[0].',
      ],
      [
        'thisCritsAlwaysIfState',
        'If the target is afflicted with {state}, then this skill is \\C[3]GUARANTEED\\C[0] to land a '
        + '\\C[2]critical hit\\C[0].',
      ],
      [
        'critAlwaysIfStateType',
        'If the target is afflicted with any {type} state, then \\C[2]critical hits\\C[0] are \\C[3]GUARANTEED\\C[0].',
      ],
      [
        'thisCritsAlwaysIfStateType',
        'If the target is afflicted with any {type} state, then this skill is \\C[3]GUARANTEED\\C[0] to land a '
        + '\\C[2]critical hit\\C[0].',
      ],
      [ 'critChanceIfState', '{value} \\C[1]critical hit\\C[0] chance against targets with {state}.' ],
      [
        'thisCritChanceIfState',
        'This skill has {value} \\C[1]critical hit\\C[0] chance against targets with {state}.',
      ],
      [ 'critChanceIfStateType', '{value} \\C[1]critical hit\\C[0] chance against targets with any {type} state.' ],
      [
        'thisCritChanceIfStateType',
        'This skill has {value} \\C[1]critical hit\\C[0] chance against targets with any {type} state.',
      ],
      [ 'forceCritProcs', 'On-crit effects \\C[3]ALWAYS\\C[0] land when landing a \\C[2]critical hit\\C[0].' ],
      [ 'critMultiplier', '\\C[1]Critical hits\\C[0] deal {value} more damage.' ],
      [ 'critMultiplierBase', 'The base multiplier for \\C[1]critical hits\\C[0] is {value} damage.' ],
      [ 'critReduction', 'Extra damage taken from \\C[1]critical hits\\C[0] {value}.' ],
      [ 'critReductionBase', 'The base reduction on \\C[1]critical hits\\C[0] taken is {value}.' ],
      [ 'onCritApply', '\\C[1]Critical hits\\C[0] have a {value} chance to inflict {state}.' ],
      [ 'onCritSelf', '\\C[1]Critical hits\\C[0] have a {value} chance to grant {state} to self.' ],
      [ 'thisCritApply', 'This skill\'s \\C[1]critical hits\\C[0] have a {value} chance to inflict {state}.' ],
      [ 'thisCritSelf', 'This skill\'s \\C[1]critical hits\\C[0] have a {value} chance to grant {state} to self.' ],
    ]));
  });

  it('refuses to be constructed, being a static class', () =>
  {
    // Arrange & Act
    const attempt = () => new CritNotetagDescriptions();

    // Assert
    expect(attempt)
      .toThrow('This is a static class.');
  });

  it('describes all seventeen crit tags against the regexes their readers use', () =>
  {
    // Arrange (registerAll ran in beforeEach)
    const describers = globalThis.NotetagDescriber.describers();

    // Act
    const described = [
      describers.has(globalThis.J.CRIT.RegExp.CritDamageMultiplier),
      describers.has(globalThis.J.CRIT.RegExp.CritDamageMultiplierBase),
      describers.has(globalThis.J.CRIT.RegExp.CritDamageReduction),
      describers.has(globalThis.J.CRIT.RegExp.CritDamageReductionBase),
      describers.has(globalThis.J.CRIT.RegExp.OnCritApply),
      describers.has(globalThis.J.CRIT.RegExp.OnCritSelf),
      describers.has(globalThis.J.CRIT.RegExp.ThisCritApply),
      describers.has(globalThis.J.CRIT.RegExp.ThisCritSelf),
      describers.has(globalThis.J.CRIT.RegExp.ForceCritProcs),
      describers.has(globalThis.J.CRIT.RegExp.CritChanceIfState),
      describers.has(globalThis.J.CRIT.RegExp.ThisCritChanceIfState),
      describers.has(globalThis.J.CRIT.RegExp.CritChanceIfStateType),
      describers.has(globalThis.J.CRIT.RegExp.ThisCritChanceIfStateType),
      describers.has(globalThis.J.CRIT.RegExp.CritAlwaysIfState),
      describers.has(globalThis.J.CRIT.RegExp.ThisCritsAlwaysIfState),
      describers.has(globalThis.J.CRIT.RegExp.CritAlwaysIfStateType),
      describers.has(globalThis.J.CRIT.RegExp.ThisCritsAlwaysIfStateType),
    ];

    // Assert- every one of the seventeen is described.
    expect(described.every(isDescribed => isDescribed === true))
      .toBe(true);
    expect(describers.size)
      .toBe(17);
  });

  it('writes each tag in its own sentence, as an amount that helps whoever carries it', () =>
  {
    // Arrange- a different amount on each, so a tag wired to the other's sentence shows.
    const note = '<critMultiplier:20>\n<critMultiplierBase:50>';

    // Act
    const lines = linesOf(note);

    // Assert
    expect(lines)
      .toEqual([
        [ 976, '\\C[1]Critical hits\\C[0] deal {value} more damage.', '+20%', 1 ],
        [ 976, 'The base multiplier for \\C[1]critical hits\\C[0] is {value} damage.', '+50%', 1 ],
      ]);
  });

  it('reads an amount of nothing as cutting neither way', () =>
  {
    // Arrange
    const note = '<critMultiplier:0>';

    // Act
    const lines = linesOf(note);

    // Assert
    expect(lines)
      .toEqual([ [ 976, '\\C[1]Critical hits\\C[0] deal {value} more damage.', '+0%', 0 ] ]);
  });

  it('writes each reduction tag in its own sentence: the extra damage moving, and the base as written', () =>
  {
    // Arrange- a different amount on each, so a tag wired to the other's sentence shows, and the reduction's
    // own regex has to leave its base's spelling alone.
    const note = '<critReduction:30>\n<critReductionBase:20>';

    // Act
    const lines = linesOf(note);

    // Assert
    expect(lines)
      .toEqual([
        [ 977, 'Extra damage taken from \\C[1]critical hits\\C[0] {value}.', '-30%', 1 ],
        [ 977, 'The base reduction on \\C[1]critical hits\\C[0] taken is {value}.', '+20%', 1 ],
      ]);
  });

  it('reads a negative reduction as crits landing harder, which hurts whoever carries it', () =>
  {
    // Arrange- the shape a "Careless" state takes in play.
    const note = '<critReduction:-10>';

    // Act
    const lines = linesOf(note);

    // Assert
    expect(lines)
      .toEqual([ [ 977, 'Extra damage taken from \\C[1]critical hits\\C[0] {value}.', '+10%', -1 ] ]);
  });

  it('reads a reduction of nothing as cutting neither way', () =>
  {
    // Arrange
    const note = '<critReductionBase:0>';

    // Act
    const lines = linesOf(note);

    // Assert
    expect(lines)
      .toEqual([ [ 977, 'The base reduction on \\C[1]critical hits\\C[0] taken is {value}.', '+0%', 0 ] ]);
  });

  it('writes each on-crit state tag in its own sentence, naming its own state at its own chance', () =>
  {
    // Arrange- every tag names a different state at a different chance, so a tag wired to another's sentence, or
    // a state read from the wrong number, shows. The this-skill spellings must not be read as the global ones.
    const note = '<onCritApply:[11, 50]>\n<onCritSelf:[12, 100]>\n<thisCritApply:[13, 30]>\n<thisCritSelf:[14, 25]>';

    // Act
    const lines = linesOf(note);

    // Assert- each state left as the code that draws it, and every proc helping whoever carries it.
    expect(lines)
      .toEqual([
        [ 976, '\\C[1]Critical hits\\C[0] have a {value} chance to inflict \\state[11].', '50%', 1 ],
        [ 976, '\\C[1]Critical hits\\C[0] have a {value} chance to grant \\state[12] to self.', '100%', 1 ],
        [ 976, 'This skill\'s \\C[1]critical hits\\C[0] have a {value} chance to inflict \\state[13].', '30%', 1 ],
        [
          976,
          'This skill\'s \\C[1]critical hits\\C[0] have a {value} chance to grant \\state[14] to self.',
          '25%',
          1,
        ],
      ]);
  });

  it('writes each conditional crit chance tag in its own sentence, naming its own state at its own bonus', () =>
  {
    // Arrange- a different state and bonus on each, and the this-skill spelling must not be read as the global one.
    const note = '<critChanceIfState:[11, 30]>\n<thisCritChanceIfState:[12, 15]>';

    // Act
    const lines = linesOf(note);

    // Assert- crit chance's own face, and better odds helping whoever carries them.
    expect(lines)
      .toEqual([
        [ 946, '{value} \\C[1]critical hit\\C[0] chance against targets with \\state[11].', '+30%', 1 ],
        [ 946, 'This skill has {value} \\C[1]critical hit\\C[0] chance against targets with \\state[12].', '+15%', 1 ],
      ]);
  });

  it('writes each crit chance tag keyed by state type in its own sentence, naming the type as the tag writes it', () =>
  {
    // Arrange- a different type and bonus on each, and the this-skill spelling must not be read as the global one.
    // A type is no database row, so it arrives exactly as written, hyphen and all.
    const note = '<critChanceIfStateType:[food-protein, 50]>\n<thisCritChanceIfStateType:[bleed, 20]>';

    // Act
    const lines = linesOf(note);

    // Assert
    expect(lines)
      .toEqual([
        [
          946,
          '{value} \\C[1]critical hit\\C[0] chance against targets with any \\C[1]food-protein\\C[0] state.',
          '+50%',
          1,
        ],
        [
          946,
          'This skill has {value} \\C[1]critical hit\\C[0] chance against targets with any \\C[1]bleed\\C[0] state.',
          '+20%',
          1,
        ],
      ]);
  });

  it('writes a line per listed state for each guaranteed-crit tag, in its own sentence', () =>
  {
    // Arrange- the global tag lists two states, either of which is enough, beside a this-skill tag naming a third.
    const note = '<critAlwaysIfState:[11, 12]>\n<thisCritsAlwaysIfState:[13]>';

    // Act
    const lines = linesOf(note);

    // Assert- one line per state, crit chance's own face, and nothing for the screen to color.
    expect(lines)
      .toEqual([
        [
          946,
          'If the target is afflicted with \\state[11], then \\C[2]critical hits\\C[0] are \\C[3]GUARANTEED\\C[0].',
          '',
          1,
        ],
        [
          946,
          'If the target is afflicted with \\state[12], then \\C[2]critical hits\\C[0] are \\C[3]GUARANTEED\\C[0].',
          '',
          1,
        ],
        [
          946,
          'If the target is afflicted with \\state[13], then this skill is \\C[3]GUARANTEED\\C[0] to land a '
          + '\\C[2]critical hit\\C[0].',
          '',
          1,
        ],
      ]);
  });

  it('writes each guaranteed-crit tag keyed by state type in its own sentence, naming the type as written', () =>
  {
    // Arrange- a different type on each, and the this-skill spelling must not be read as the global one.
    const note = '<critAlwaysIfStateType:bleed>\n<thisCritsAlwaysIfStateType:poison>';

    // Act
    const lines = linesOf(note);

    // Assert
    expect(lines)
      .toEqual([
        [
          946,
          'If the target is afflicted with any \\C[1]bleed\\C[0] state, then \\C[2]critical hits\\C[0] are '
          + '\\C[3]GUARANTEED\\C[0].',
          '',
          1,
        ],
        [
          946,
          'If the target is afflicted with any \\C[1]poison\\C[0] state, then this skill is \\C[3]GUARANTEED\\C[0] '
          + 'to land a \\C[2]critical hit\\C[0].',
          '',
          1,
        ],
      ]);
  });

  it('guarantees every on-crit roll in its own sentence, with no amount to show, helping whoever carries it', () =>
  {
    // Arrange
    const note = '<forceCritProcs>';

    // Act
    const lines = linesOf(note);

    // Assert
    expect(lines)
      .toEqual([
        [ 976, 'On-crit effects \\C[3]ALWAYS\\C[0] land when landing a \\C[2]critical hit\\C[0].', '', 1 ],
      ]);
  });
});
//endregion plugins/crit/_component/describe-crit-notetags-direct.test.js
