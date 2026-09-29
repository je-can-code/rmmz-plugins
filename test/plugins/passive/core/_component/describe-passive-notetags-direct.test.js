//region plugins/passive/core/_component/describe-passive-notetags-direct.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installPassiveHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPassive,
} from '../../_component/fixtures/install-passive-host-globals.js';

/**
 * The lines J-Passive describes its own tags with, read back through J-Base's real registry against the plugin's real
 * regexes and the sentences Chef Adventure's config writes.
 */
describe('J-Passive PassiveNotetagDescriptions (direct src import)', () =>
{
  let PassiveNotetagDescriptions;

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
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJPassive();
    await import('../../../../../src/plugins/passive/core/_metadata/initialization.js');

    // J-Base's own classes, read the way a shipped plugin reads another ship's globals.
    ({ default: globalThis.JsonMapper } = await import(
      '../../../../../src/plugins/_base/core/_utilities/JsonMapper.js'));
    ({ default: globalThis.NotetagLine } = await import(
      '../../../../../src/plugins/_base/core/models/NotetagLine.js'));
    ({ default: globalThis.NotetagDescriber } = await import(
      '../../../../../src/plugins/_base/core/managers/NotetagDescriber.js'));

    ({ default: PassiveNotetagDescriptions } = await import(
      '../../../../../src/plugins/passive/core/core/describePassiveNotetags.js'));
  });

  beforeEach(() =>
  {
    // registering a tag twice throws, so every test describes into an empty registry.
    globalThis.NotetagDescriber.describers()
      .clear();
    PassiveNotetagDescriptions.registerAll();

    // the three sentences, as Chef Adventure's config writes them: the menu tag written empty, to say nothing.
    globalThis.NotetagDescriber.setTemplates(new Map([
      [ 'passive', 'Grants {states}.' ],
      [ 'uniquePassive', 'Grants {states}, which never stacks.' ],
      [ 'hideFromPassiveList', '' ],
    ]));
  });

  it('refuses to be constructed, being a static class', () =>
  {
    // Arrange & Act
    const attempt = () => new PassiveNotetagDescriptions();

    // Assert
    expect(attempt)
      .toThrow('This is a static class.');
  });

  it('describes all three passive tags against the regexes their readers use', () =>
  {
    // Arrange (registerAll ran in beforeEach)
    const describers = globalThis.NotetagDescriber.describers();

    // Act
    const described = [
      describers.has(globalThis.J.PASSIVE.RegExp.PassiveStateIds),
      describers.has(globalThis.J.PASSIVE.RegExp.UniquePassiveStateIds),
      describers.has(globalThis.J.PASSIVE.RegExp.HideFromPassiveList),
    ];

    // Assert
    expect(described)
      .toEqual([ true, true, true ]);
    expect(describers.size)
      .toBe(3);
  });

  it('writes each grant in its own sentence, every state drawing itself, with no face and cutting neither way', () =>
  {
    // Arrange- a list beside a lone unique grant, so the list, its order and the two sentences all show.
    const note = '<passive:[11, 12]>\n<uniquePassive:[13]>';

    // Act
    const lines = linesOf(note);

    // Assert
    expect(lines)
      .toEqual([
        [ 0, 'Grants \\state[11], \\state[12].', '', 0 ],
        [ 0, 'Grants \\state[13], which never stacks.', '', 0 ],
      ]);
  });

  it('says nothing for the menu tag while its sentence is written empty', () =>
  {
    // Arrange
    const note = '<hideFromPassiveList>';

    // Act
    const lines = linesOf(note);

    // Assert
    expect(lines)
      .toEqual([]);
  });

  it('leaves the menu tag\'s words to the config, so a sentence written for it is shown', () =>
  {
    // Arrange- the same tag, now with words, which proves the silence above is the config's and not the code's.
    globalThis.NotetagDescriber.setTemplates(new Map([ [ 'hideFromPassiveList', 'Kept off the Passives menu.' ] ]));
    const note = '<hideFromPassiveList>';

    // Act
    const lines = linesOf(note);

    // Assert
    expect(lines)
      .toEqual([ [ 0, 'Kept off the Passives menu.', '', 0 ] ]);
  });
});
//endregion plugins/passive/core/_component/describe-passive-notetags-direct.test.js
