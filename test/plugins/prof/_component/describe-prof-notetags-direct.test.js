//region plugins/prof/_component/describe-prof-notetags-direct.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installProfHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJProf,
} from './fixtures/install-prof-host-globals.js';

/**
 * The lines J-Proficiency describes its own tags with, read back through J-Base's real registry against the plugin's
 * real regexes and the sentences Chef Adventure's config writes.
 *
 * The two blocks read alike and cut opposite ways, so a fixture carrying both would show either one wired to the
 * other's sentence or the other's impact.
 */
describe('J-Proficiency ProfNotetagDescriptions (direct src import)', () =>
{
  let ProfNotetagDescriptions;

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

    installProfHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    // registerFormulaContext() is a static method prof's own initialization.js calls at import time.
    await import('../../../../src/plugins/_base/core/objects/Game_Action.js');

    setPluginContextToJProf();
    await import('../../../../src/plugins/prof/core/_metadata/initialization.js');

    // J-Base's own classes, read the way a shipped plugin reads another ship's globals.
    ({ default: globalThis.RPG_Trait } = await import(
      '../../../../src/plugins/_base/core/database/_data/RPG_Trait.js'));
    ({ default: globalThis.NotetagLine } = await import('../../../../src/plugins/_base/core/models/NotetagLine.js'));
    ({ default: globalThis.NotetagDescriber } = await import(
      '../../../../src/plugins/_base/core/managers/NotetagDescriber.js'));

    // J-Base's own icon manager, with this plugin's own icons hung on it the way the shipped bundle hangs them.
    ({ default: globalThis.IconManager } = await import(
      '../../../../src/plugins/_base/core/managers/IconManager.js'));
    await import('../../../../src/plugins/prof/core/managers/IconManager.js');

    ({ default: ProfNotetagDescriptions } = await import(
      '../../../../src/plugins/prof/core/core/describeProfNotetags.js'));
  });

  beforeEach(() =>
  {
    // registering a tag twice throws, so every test describes into an empty registry.
    globalThis.NotetagDescriber.describers()
      .clear();
    ProfNotetagDescriptions.registerAll();

    // the three sentences, as Chef Adventure's config writes them.
    globalThis.NotetagDescriber.setTemplates(new Map([
      [ 'proficiencyBonus', '{value} \\C[1]proficiency\\C[0] from every skill used.' ],
      [ 'proficiencyGivingBlock', 'Skills used against this earn no \\C[1]proficiency\\C[0].' ],
      [ 'proficiencyGainingBlock', 'Skills used by this earn no \\C[1]proficiency\\C[0].' ],
    ]));
  });

  it('refuses to be constructed, being a static class', () =>
  {
    // Arrange & Act
    const attempt = () => new ProfNotetagDescriptions();

    // Assert
    expect(attempt)
      .toThrow('This is a static class.');
  });

  it('describes all three proficiency tags against the regexes their readers use', () =>
  {
    // Arrange (registerAll ran in beforeEach)
    const describers = globalThis.NotetagDescriber.describers();

    // Act
    const described = [
      describers.has(globalThis.J.PROF.RegExp.ProficiencyBonus),
      describers.has(globalThis.J.PROF.RegExp.ProficiencyGivingBlock),
      describers.has(globalThis.J.PROF.RegExp.ProficiencyGainingBlock),
    ];

    // Assert
    expect(described)
      .toEqual([ true, true, true ]);
    expect(describers.size)
      .toBe(3);
  });

  it('writes the bonus as an amount that helps whoever carries it', () =>
  {
    // Arrange
    const note = '<proficiencyBonus:3>';

    // Act
    const lines = linesOf(note);

    // Assert
    expect(lines)
      .toEqual([ [ 979, '{value} \\C[1]proficiency\\C[0] from every skill used.', '+3', 1 ] ]);
  });

  it('reads a bonus of nothing as cutting neither way', () =>
  {
    // Arrange
    const note = '<proficiencyBonus:0>';

    // Act
    const lines = linesOf(note);

    // Assert
    expect(lines)
      .toEqual([ [ 979, '{value} \\C[1]proficiency\\C[0] from every skill used.', '+0', 0 ] ]);
  });

  it('writes each block in its own sentence, the giving block helping its holder and the gaining one hurting it', () =>
  {
    // Arrange
    const note = '<proficiencyGivingBlock>\n<proficiencyGainingBlock>';

    // Act
    const lines = linesOf(note);

    // Assert
    expect(lines)
      .toEqual([
        [ 979, 'Skills used against this earn no \\C[1]proficiency\\C[0].', '', 1 ],
        [ 979, 'Skills used by this earn no \\C[1]proficiency\\C[0].', '', -1 ],
      ]);
  });
});
//endregion plugins/prof/_component/describe-prof-notetags-direct.test.js
