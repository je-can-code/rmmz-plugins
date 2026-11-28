//region plugins/abs/core/_component/describe-abs-notetags-direct.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

/**
 * The lines J-ABS describes its own tags with, read back through J-Base's real registry against the plugin's real
 * regexes and the sentence Chef Adventure's config writes.
 */
describe('J-ABS AbsNotetagDescriptions (direct src import)', () =>
{
  let AbsNotetagDescriptions;

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

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJAbs();
    await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');

    // J-Base's own classes, read the way a shipped plugin reads another ship's globals.
    ({ default: globalThis.IconManager } = await import(
      '../../../../../src/plugins/_base/core/managers/IconManager.js'));
    ({ default: globalThis.NotetagLine } = await import(
      '../../../../../src/plugins/_base/core/models/NotetagLine.js'));
    ({ default: globalThis.NotetagDescriber } = await import(
      '../../../../../src/plugins/_base/core/managers/NotetagDescriber.js'));

    ({ default: AbsNotetagDescriptions } = await import(
      '../../../../../src/plugins/abs/core/core/describeAbsNotetags.js'));
  });

  beforeEach(() =>
  {
    // registering a tag twice throws, so every test describes into an empty registry.
    globalThis.NotetagDescriber.describers()
      .clear();
    AbsNotetagDescriptions.registerAll();

    // the sentence, as Chef Adventure's config writes it.
    globalThis.NotetagDescriber.setTemplates(new Map([
      [
        'pierceDamageRateIfStateType',
        'Your hits ignore the \\C[1]damage mitigation\\C[0] of targets with any {type} state.',
      ],
    ]));
  });

  it('refuses to be constructed, being a static class', () =>
  {
    // Arrange & Act
    const attempt = () => new AbsNotetagDescriptions();

    // Assert
    expect(attempt)
      .toThrow('This is a static class.');
  });

  it('describes the pierce tag against the regex its reader uses', () =>
  {
    // Arrange (registerAll ran in beforeEach)
    const describers = globalThis.NotetagDescriber.describers();

    // Act
    const described = describers.has(globalThis.J.ABS.RegExp.PierceDamageRateIfStateType);

    // Assert
    expect(described)
      .toBe(true);
    expect(describers.size)
      .toBe(1);
  });

  it('names the type as the tag writes it, wearing PDR\'s face and helping its holder', () =>
  {
    // Arrange- a near-miss tag beside it, which has no describer and so must add no line of its own.
    const note = '<pierceDamageRateIfStateType:cc>\n<bonusDamageIfStateType:[cc, 20]>';

    // Act
    const lines = linesOf(note);

    // Assert
    expect(lines)
      .toEqual([
        [
          966,
          'Your hits ignore the \\C[1]damage mitigation\\C[0] of targets with any \\C[1]cc\\C[0] state.',
          '',
          1,
        ],
      ]);
  });
});
//endregion plugins/abs/core/_component/describe-abs-notetags-direct.test.js