//region plugins/drops/_component/describe-drops-notetags-direct.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installDropsHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJDrops,
} from './fixtures/install-drops-host-globals.js';

/**
 * The lines J-DropsControl describes its own tags with, read back through J-Base's real registry against the
 * plugin's real regexes and the sentences Chef Adventure's config writes.
 *
 * The drop and gold rates read alike and pay out different things, so a fixture carrying both gives them different
 * amounts, and a tag wired to the other's sentence could not hide behind a matching number.
 */
describe('J-DropsControl DropsNotetagDescriptions (direct src import)', () =>
{
  let DropsNotetagDescriptions;

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

    installDropsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJDrops();
    await import('../../../../src/plugins/drops/core/_metadata/initialization.js');

    // J-Base's own classes, read the way a shipped plugin reads another ship's globals.
    ({ default: globalThis.RPG_Trait } = await import(
      '../../../../src/plugins/_base/core/database/_data/RPG_Trait.js'));
    ({ default: globalThis.NotetagLine } = await import('../../../../src/plugins/_base/core/models/NotetagLine.js'));
    ({ default: globalThis.NotetagDescriber } = await import(
      '../../../../src/plugins/_base/core/managers/NotetagDescriber.js'));

    // J-Base's own icons, the drops reward's among them, then this plugin's own icons hung on that same manager the
    // way the shipped bundle hangs them.
    ({ default: globalThis.IconManager } = await import(
      '../../../../src/plugins/_base/core/managers/IconManager.js'));
    await import('../../../../src/plugins/drops/core/managers/IconManager.js');

    ({ default: DropsNotetagDescriptions } = await import(
      '../../../../src/plugins/drops/core/core/describeDropsNotetags.js'));
  });

  beforeEach(() =>
  {
    // registering a tag twice throws, so every test describes into an empty registry.
    globalThis.NotetagDescriber.describers()
      .clear();
    DropsNotetagDescriptions.registerAll();

    // the four sentences, as Chef Adventure's config writes them.
    globalThis.NotetagDescriber.setTemplates(new Map([
      [ 'dropMultiplier', '{value} \\C[1]item drop chance\\C[0] for the whole party.' ],
      [ 'goldMultiplier', '{value} \\C[1]gold\\C[0] from enemies for the whole party.' ],
      [ 'dropUpgrade', 'Every \\C[1]item dropped\\C[0] is upgraded {value} tier.' ],
      [ 'dropQuantity', 'Every \\C[1]item dropped\\C[0] comes with {value} extra.' ],
    ]));
  });

  it('refuses to be constructed, being a static class', () =>
  {
    // Arrange & Act
    const attempt = () => new DropsNotetagDescriptions();

    // Assert
    expect(attempt)
      .toThrow('This is a static class.');
  });

  it('describes all four reward tags against the regexes their readers use', () =>
  {
    // Arrange (registerAll ran in beforeEach)
    const describers = globalThis.NotetagDescriber.describers();

    // Act
    const described = [
      describers.has(globalThis.J.DROPS.RegExp.DropMultiplier),
      describers.has(globalThis.J.DROPS.RegExp.GoldMultiplier),
      describers.has(globalThis.J.DROPS.RegExp.DropUpgrade),
      describers.has(globalThis.J.DROPS.RegExp.DropQuantity),
    ];

    // Assert
    expect(described)
      .toEqual([ true, true, true, true ]);
    expect(describers.size)
      .toBe(4);
  });

  it('writes each rate in its own sentence with its own icon, as an amount that helps the party', () =>
  {
    // Arrange- a different amount on each, so a tag wired to the other's sentence or icon shows.
    const note = '<dropMultiplier:30>\n<goldMultiplier:5>';

    // Act
    const lines = linesOf(note);

    // Assert
    expect(lines)
      .toEqual([
        [ 210, '{value} \\C[1]item drop chance\\C[0] for the whole party.', '+30%', 1 ],
        [ 314, '{value} \\C[1]gold\\C[0] from enemies for the whole party.', '+5%', 1 ],
      ]);
  });

  it('reads a negative rate as thinning out what the party brings home', () =>
  {
    // Arrange
    const note = '<dropMultiplier:-20>';

    // Act
    const lines = linesOf(note);

    // Assert
    expect(lines)
      .toEqual([ [ 210, '{value} \\C[1]item drop chance\\C[0] for the whole party.', '-20%', -1 ] ]);
  });

  it('reads a rate of nothing as cutting neither way', () =>
  {
    // Arrange
    const note = '<goldMultiplier:0>';

    // Act
    const lines = linesOf(note);

    // Assert
    expect(lines)
      .toEqual([ [ 314, '{value} \\C[1]gold\\C[0] from enemies for the whole party.', '+0%', 0 ] ]);
  });

  it('writes each haul bonus in its own sentence, as a bounty the enemy carrying it gives up', () =>
  {
    // Arrange- a different amount on each, so a tag wired to the other's sentence shows.
    const note = '<dropUpgrade:2>\n<dropQuantity:1>';

    // Act
    const lines = linesOf(note);

    // Assert- the drops' own face, a count rather than a percentage, and a bigger haul hurting its holder.
    expect(lines)
      .toEqual([
        [ 208, 'Every \\C[1]item dropped\\C[0] is upgraded {value} tier.', '+2', -1 ],
        [ 208, 'Every \\C[1]item dropped\\C[0] comes with {value} extra.', '+1', -1 ],
      ]);
  });

  it('reads a haul penalty as working in its holder\'s favor', () =>
  {
    // Arrange
    const note = '<dropQuantity:-1>';

    // Act
    const lines = linesOf(note);

    // Assert
    expect(lines)
      .toEqual([ [ 208, 'Every \\C[1]item dropped\\C[0] comes with {value} extra.', '-1', 1 ] ]);
  });

  it('reads a haul bonus of nothing as cutting neither way', () =>
  {
    // Arrange
    const note = '<dropUpgrade:0>';

    // Act
    const lines = linesOf(note);

    // Assert
    expect(lines)
      .toEqual([ [ 208, 'Every \\C[1]item dropped\\C[0] is upgraded {value} tier.', '+0', 0 ] ]);
  });
});
//endregion plugins/drops/_component/describe-drops-notetags-direct.test.js
