//region plugins/passive/ext/affix/core/describe-affix-notetags.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installPassiveHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPassive,
} from '../../../_component/fixtures/install-passive-host-globals.js';
import {
  installPassiveAffixHostGlobals,
  setPluginContextToJPassiveAffix,
} from '../../../_component/fixtures/install-passive-affix-host-globals.js';

/**
 * The lines J-Passive-Affix describes its own tags with, read back through J-Base's real registry against the
 * plugin's real regexes.
 *
 * A reward multiplier names its reward by asking whichever manager owns that name, so every reward type here gets
 * a different multiplier: a type wired to another type's name or icon could not hide behind a matching number.
 */
describe('J-Passive-Affix AffixNotetagDescriptions (direct src import)', () =>
{
  let AffixNotetagDescriptions;

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

    installPassiveAffixHostGlobals();

    setPluginContextToJPassiveAffix();
    await import('../../../../../../src/plugins/passive/ext/affix/_metadata/initialization.js');

    // J-Base's own classes, read the way a shipped plugin reads another ship's globals.
    ({ default: globalThis.NotetagLine } = await import(
      '../../../../../../src/plugins/_base/core/models/NotetagLine.js'));
    ({ default: globalThis.NotetagDescriber } = await import(
      '../../../../../../src/plugins/_base/core/managers/NotetagDescriber.js'));

    // every reward's name and icon, as the managers that own them answer in Chef Adventure.
    globalThis.TextManager = {
      exp: 'EXP',
      currencyUnit: 'G',
      sdpPoints: () => 'SDP',
      apPoints: () => 'AP',
      rewardParam: rewardParamId => [ 'EXP', 'G', 'Drop Rate', 'Encounter Rate', 'SDP Point Rate' ][rewardParamId],
    };
    globalThis.IconManager = {
      rewardParam: rewardParamId => [ 87, 2048, 208, 914, 445 ][rewardParamId],
      apPoints: () => 86,
    };

    ({ default: AffixNotetagDescriptions } = await import(
      '../../../../../../src/plugins/passive/ext/affix/core/describeAffixNotetags.js'));
  });

  beforeEach(() =>
  {
    // Chef Adventure installs both plugins that grant rewards of their own.
    globalThis.J.SDP = {};
    globalThis.J.APT = {};

    // registering a tag twice throws, so every test describes into an empty registry.
    globalThis.NotetagDescriber.describers()
      .clear();
    AffixNotetagDescriptions.registerAll();

    // the sentence, as Chef Adventure's config writes it.
    globalThis.NotetagDescriber.setTemplates(new Map([
      [ 'rewardMultiplier', 'Enemies yield {value} {reward}.' ],
    ]));
  });

  it('refuses to be constructed, being a static class', () =>
  {
    // Arrange & Act
    const attempt = () => new AffixNotetagDescriptions();

    // Assert
    expect(attempt)
      .toThrow('This is a static class.');
  });

  it('describes the reward multiplier tag against the regex its reader uses', () =>
  {
    // Arrange (registerAll ran in beforeEach)
    const describers = globalThis.NotetagDescriber.describers();

    // Act
    const isDescribed = describers.has(globalThis.J.PASSIVE.EXT.AFFIX.RegExp.RewardMultiplier);

    // Assert
    expect(isDescribed)
      .toBe(true);
    expect(describers.size)
      .toBe(1);
  });

  describe('rewardMultiplier', () =>
  {
    it('says nothing while the game has no sentence written for the tag', () =>
    {
      // Arrange- the tag and everything it names are here; only the sentence is missing.
      globalThis.NotetagDescriber.setTemplates(new Map());
      const note = '<rewardMultiplier:[exp, 2]>';

      // Act
      const lines = linesOf(note);

      // Assert
      expect(lines)
        .toEqual([]);
    });

    it('names each reward the way its own manager does, highlighted, with the bounty where the value goes', () =>
    {
      // Arrange- a different multiplier on each, so a type wired to another's name or icon shows.
      const note = [
        '<rewardMultiplier:[exp, 1.5]>',
        '<rewardMultiplier:[gold, 2]>',
        '<rewardMultiplier:[sdp, 3]>',
        '<rewardMultiplier:[ap, 5]>',
        '<rewardMultiplier:[drops, 10]>',
      ].join('\n');

      // Act
      const lines = linesOf(note);

      // Assert- yielding more on defeat hurts whoever carries it.
      expect(lines)
        .toEqual([
          [ 87, 'Enemies yield {value} \\C[1]EXP\\C[0].', '1.5x', -1 ],
          [ 2048, 'Enemies yield {value} \\C[1]G\\C[0].', '2x', -1 ],
          [ 445, 'Enemies yield {value} \\C[1]SDP\\C[0].', '3x', -1 ],
          [ 86, 'Enemies yield {value} \\C[1]AP\\C[0].', '5x', -1 ],
          [ 208, 'Enemies yield {value} \\C[1]Drop Rate\\C[0].', '10x', -1 ],
        ]);
    });

    it('reads a smaller bounty as helping whoever carries it', () =>
    {
      // Arrange
      const note = '<rewardMultiplier:[exp, 0.5]>';

      // Act
      const lines = linesOf(note);

      // Assert
      expect(lines)
        .toEqual([ [ 87, 'Enemies yield {value} \\C[1]EXP\\C[0].', '0.5x', 1 ] ]);
    });

    it('reads an unchanged bounty as cutting neither way', () =>
    {
      // Arrange
      const note = '<rewardMultiplier:[exp, 1]>';

      // Act
      const lines = linesOf(note);

      // Assert
      expect(lines)
        .toEqual([ [ 87, 'Enemies yield {value} \\C[1]EXP\\C[0].', '1x', 0 ] ]);
    });

    it('reads a reward type written in capitals as that reward', () =>
    {
      // Arrange- the tag's regex ignores case, and so does its reader.
      const note = '<rewardMultiplier:[GOLD, 2]>';

      // Act
      const lines = linesOf(note);

      // Assert
      expect(lines)
        .toEqual([ [ 2048, 'Enemies yield {value} \\C[1]G\\C[0].', '2x', -1 ] ]);
    });

    it('says nothing about SDP in a game without J-SDP, which never grants any', () =>
    {
      // Arrange- experience beside it is still granted, and must still be described.
      delete globalThis.J.SDP;
      const note = '<rewardMultiplier:[sdp, 2]>\n<rewardMultiplier:[exp, 2]>';

      // Act
      const lines = linesOf(note);

      // Assert
      expect(lines)
        .toEqual([ [ 87, 'Enemies yield {value} \\C[1]EXP\\C[0].', '2x', -1 ] ]);
    });

    it('says nothing about AP in a game without J-Aptitude, which never grants any', () =>
    {
      // Arrange
      delete globalThis.J.APT;
      const note = '<rewardMultiplier:[ap, 2]>\n<rewardMultiplier:[exp, 2]>';

      // Act
      const lines = linesOf(note);

      // Assert
      expect(lines)
        .toEqual([ [ 87, 'Enemies yield {value} \\C[1]EXP\\C[0].', '2x', -1 ] ]);
    });
  });
});
//endregion plugins/passive/ext/affix/core/describe-affix-notetags.test.js
