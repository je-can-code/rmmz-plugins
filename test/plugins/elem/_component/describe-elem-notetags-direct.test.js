//region plugins/elem/_component/describe-elem-notetags-direct.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installElemHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJElem,
} from './fixtures/install-elem-host-globals.js';

/**
 * The lines J-Elementalistics describes its own tags with, read back through J-Base's real registry against the
 * plugin's real regexes and the sentences Chef Adventure's config writes.
 */
describe('J-Elementalistics ElemNotetagDescriptions (direct src import)', () =>
{
  let ElemNotetagDescriptions;

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

    installElemHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJElem();
    await import('../../../../src/plugins/elem/core/_metadata/initialization.js');

    // J-Base's own classes, read the way a shipped plugin reads another ship's globals.
    ({ default: globalThis.JsonMapper } = await import(
      '../../../../src/plugins/_base/core/_utilities/JsonMapper.js'));
    ({ default: globalThis.IconManager } = await import(
      '../../../../src/plugins/_base/core/managers/IconManager.js'));
    ({ default: globalThis.RPG_Trait } = await import(
      '../../../../src/plugins/_base/core/database/_data/RPG_Trait.js'));
    ({ default: globalThis.NotetagLine } = await import('../../../../src/plugins/_base/core/models/NotetagLine.js'));
    ({ default: globalThis.NotetagDescriber } = await import(
      '../../../../src/plugins/_base/core/managers/NotetagDescriber.js'));

    ({ default: ElemNotetagDescriptions } = await import(
      '../../../../src/plugins/elem/core/core/describeElemNotetags.js'));
  });

  beforeEach(() =>
  {
    // registering a tag twice throws, so every test describes into an empty registry.
    globalThis.NotetagDescriber.describers()
      .clear();
    ElemNotetagDescriptions.registerAll();

    // the sentences, as Chef Adventure's config writes them.
    globalThis.NotetagDescriber.setTemplates(new Map([
      [ 'absorbElements', 'Absorbs {elements}.' ],
      [ 'boostElement', '{value} {element} damage dealt.' ],
      [ 'strictElements', 'Only takes damage from {elements}.' ],
      [ 'pierceElement', 'Negates {value} {element} resistance.' ],
      [ 'thisPierceElement', 'This skill negates {value} {element} resistance.' ],
      [ 'slayer', '{value} damage {element}.' ],
    ]));
  });

  it('refuses to be constructed, being a static class', () =>
  {
    // Arrange & Act
    const attempt = () => new ElemNotetagDescriptions();

    // Assert
    expect(attempt)
      .toThrow('This is a static class.');
  });

  it('describes all six element tags against the regexes their readers use', () =>
  {
    // Arrange (registerAll ran in beforeEach)
    const describers = globalThis.NotetagDescriber.describers();

    // Act
    const described = [
      describers.has(globalThis.J.ELEM.RegExp.AbsorbElementIds),
      describers.has(globalThis.J.ELEM.RegExp.BoostElement),
      describers.has(globalThis.J.ELEM.RegExp.Slayer),
      describers.has(globalThis.J.ELEM.RegExp.StrictElementIds),
      describers.has(globalThis.J.ELEM.RegExp.PierceElement),
      describers.has(globalThis.J.ELEM.RegExp.ThisPierceElement),
    ];

    // Assert
    expect(described)
      .toEqual([ true, true, true, true, true, true ]);
    expect(describers.size)
      .toBe(6);
  });

  it('lists every absorbed element in one line, each drawing itself, led by the first one\'s face', () =>
  {
    // Arrange- two elements, so the list, its order and whose face leads the line all show.
    const note = '<absorbElements:[4, 9]>';

    // Act
    const lines = linesOf(note);

    // Assert- heat's face (915) rather than void's (920), and absorbing helping whoever carries it.
    expect(lines)
      .toEqual([ [ 915, 'Absorbs \\element[4], \\element[9].', '', 1 ] ]);
  });

  it('writes each element boost in its own line, a boost helping and a curse hurting whoever carries it', () =>
  {
    // Arrange- a different element and amount on each, so an element read from the wrong capture shows.
    const note = '<boostElement:[4, 50]>\n<boostElement:[9, -30]>';

    // Act
    const lines = linesOf(note);

    // Assert
    expect(lines)
      .toEqual([
        [ 915, '{value} \\element[4] damage dealt.', '+50%', 1 ],
        [ 920, '{value} \\element[9] damage dealt.', '-30%', -1 ],
      ]);
  });

  it('lists every element a strict holder takes damage from in its own sentence, led by the first one\'s face', () =>
  {
    // Arrange- a list beside an absorb tag naming others, so the two sentences and their elements cannot cross.
    const note = '<absorbElements:[4]>\n<strictElements:[7, 8]>';

    // Act
    const lines = linesOf(note);

    // Assert- ground's face (918) rather than energy's (919), and shrugging off the rest helping its holder.
    expect(lines)
      .toEqual([
        [ 915, 'Absorbs \\element[4].', '', 1 ],
        [ 918, 'Only takes damage from \\element[7], \\element[8].', '', 1 ],
      ]);
  });

  it('writes each resistance-negating tag in its own sentence, the amount unsigned, helping whoever carries it', () =>
  {
    // Arrange- a different element and amount on each, and the this-skill spelling must not be read as the global.
    const note = '<pierceElement:[4, 5]>\n<thisPierceElement:[9, 40]>';

    // Act
    const lines = linesOf(note);

    // Assert
    expect(lines)
      .toEqual([
        [ 915, 'Negates {value} \\element[4] resistance.', '5%', 1 ],
        [ 920, 'This skill negates {value} \\element[9] resistance.', '40%', 1 ],
      ]);
  });

  it('writes a slayer in its own sentence beside a boost for the same element, each in its own words', () =>
  {
    // Arrange- the same element and amount on both, so only the sentence can tell the two tags apart.
    const note = '<boostElement:[4, 50]>\n<slayer:[4, 50]>';

    // Act
    const lines = linesOf(note);

    // Assert
    expect(lines)
      .toEqual([
        [ 915, '{value} \\element[4] damage dealt.', '+50%', 1 ],
        [ 915, '{value} damage \\element[4].', '+50%', 1 ],
      ]);
  });

  it('reads a boost of nothing as cutting neither way', () =>
  {
    // Arrange
    const note = '<boostElement:[1, 0]>';

    // Act
    const lines = linesOf(note);

    // Assert
    expect(lines)
      .toEqual([ [ 912, '{value} \\element[1] damage dealt.', '+0%', 0 ] ]);
  });
});
//endregion plugins/elem/_component/describe-elem-notetags-direct.test.js
