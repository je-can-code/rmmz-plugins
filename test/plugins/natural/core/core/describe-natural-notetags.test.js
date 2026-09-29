//region plugins/natural/core/core/describe-natural-notetags.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installNaturalHostGlobals,
  installParameterCatalog,
  registerShippedNaturalParameters,
  setPluginContextToJBase,
  setPluginContextToJNatural,
} from '../../_component/fixtures/install-natural-host-globals.js';

/**
 * Every bound parameter's buff and growth tags, described from the catalog rather than written one by one.
 *
 * The catalog is the shipped one, thirty parameters bound the way the game binds them at boot, and every line is
 * read back through J-Base's real registry against the sentences Chef Adventure's config writes. The four kinds of
 * tag differ only in which sentence they ask for, so each fixture gives them different amounts: a kind wired to
 * another kind's sentence could not hide behind a matching number.
 */
describe('J-NaturalGrowth NaturalNotetagDescriptions (direct src import)', () =>
{
  let NaturalNotetagDescriptions;

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

    installNaturalHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    await installParameterCatalog();

    setPluginContextToJNatural();
    await import('../../../../../src/plugins/natural/core/_metadata/initialization.js');

    // the names the engine's parameters are registered with, the way Chef Adventure words them. Their icons come
    // from J-Base's own IconManager, which the registrations import rather than read as a global.
    globalThis.TextManager = {
      param: paramId => [
        'Max Life', 'Max Magi', 'Power', 'Endurance', 'Force', 'Resist', 'Speed', 'Luck',
      ][paramId],
      bparamDescription: () => '',
      xparam: xparamId => `xparam ${xparamId}`,
      xparamDescription: () => '',
      sparam: sparamId => [
        'Aggro', 'Parry', 'Recovery', 'Item Effects', 'Magi Cost',
        'Tech Cost', 'Phys Dmg Rate', 'Magi Dmg Rate', 'Env Dmg Rate', 'Experience UP',
      ][sparamId],
      sparamDescription: () => '',
      maxTp: () => 'Max Tech',
      har: () => 'Healing Amp',
      harDescription: () => '',
    };

    // the catalog as the game builds it at boot: J-Base's definitions, then this plugin's bindings.
    await registerShippedNaturalParameters();

    // J-Base's own classes, read the way a shipped plugin reads another ship's globals.
    ({ default: globalThis.RPG_Trait } = await import(
      '../../../../../src/plugins/_base/core/database/_data/RPG_Trait.js'));
    ({ default: globalThis.NotetagLine } = await import(
      '../../../../../src/plugins/_base/core/models/NotetagLine.js'));
    ({ default: globalThis.NotetagDescriber } = await import(
      '../../../../../src/plugins/_base/core/managers/NotetagDescriber.js'));

    ({ default: NaturalNotetagDescriptions } = await import(
      '../../../../../src/plugins/natural/core/core/describeNaturalNotetags.js'));
  });

  beforeEach(() =>
  {
    // registering a tag twice throws, so every test describes into an empty registry.
    globalThis.NotetagDescriber.describers()
      .clear();
    NaturalNotetagDescriptions.registerAll();

    // the four sentences, as Chef Adventure's config writes them.
    globalThis.NotetagDescriber.setTemplates(new Map([
      [ 'naturalBuffPlus', '{stat} Buff+ {value}' ],
      [ 'naturalBuffRate', '{stat} Buff% {value}' ],
      [ 'naturalGrowthPlus', '{stat} Growth+ {value} /lv' ],
      [ 'naturalGrowthRate', '{stat} Growth% {value} /lv' ],
    ]));
  });

  it('refuses to be constructed, being a static class', () =>
  {
    // Arrange & Act
    const attempt = () => new NaturalNotetagDescriptions();

    // Assert
    expect(attempt)
      .toThrow('This is a static class.');
  });

  it('describes all four tags of every parameter bound to natural growth', () =>
  {
    // Arrange
    const describers = globalThis.NotetagDescriber.describers();
    const boundTags = globalThis.ParameterRegistry.naturallyBoundKeys()
      .flatMap(parameterKey =>
      {
        const binding = globalThis.ParameterRegistry.naturalBinding(parameterKey);

        return [ binding.buffPlus, binding.buffRate, binding.growthPlus, binding.growthRate ];
      });

    // Act (registerAll ran in beforeEach)
    const undescribed = boundTags.filter(structure => describers.has(structure) === false);

    // Assert- thirty bound parameters, four tags each.
    expect(describers.size)
      .toBe(120);
    expect(undescribed)
      .toEqual([]);
  });

  it('writes each of the four tags in its own kind\'s sentence, the stat named and the amount left for the screen', () =>
  {
    // Arrange- a different amount on each, so a kind wired to another kind's sentence shows.
    const note = '<atkBuffPlus:[10]>\n<atkBuffRate:[20]>\n<atkGrowthPlus:[30]>\n<atkGrowthRate:[40]>';

    // Act
    const lines = linesOf(note);

    // Assert
    expect(lines)
      .toEqual([
        [ 931, '\\C[1]Power\\C[0] Buff+ {value}', '+10', 1 ],
        [ 931, '\\C[1]Power\\C[0] Buff% {value}', '+20', 1 ],
        [ 931, '\\C[1]Power\\C[0] Growth+ {value} /lv', '+30', 1 ],
        [ 931, '\\C[1]Power\\C[0] Growth% {value} /lv', '+40', 1 ],
      ]);
  });

  it('says nothing for a kind whose sentence is not written yet', () =>
  {
    // Arrange- the buff-plus sentence alone is written; the tag on the row is a buff-rate.
    globalThis.NotetagDescriber.setTemplates(new Map([ [ 'naturalBuffPlus', '{stat} Buff+ {value}' ] ]));
    const note = '<atkBuffRate:[20]>';

    // Act
    const lines = linesOf(note);

    // Assert
    expect(lines)
      .toEqual([]);
  });

  it('reads a cut to a stat where more is better as hurting its holder', () =>
  {
    // Arrange
    const note = '<atkBuffPlus:[-5]>';

    // Act
    const lines = linesOf(note);

    // Assert
    expect(lines)
      .toEqual([ [ 931, '\\C[1]Power\\C[0] Buff+ {value}', '-5', -1 ] ]);
  });

  it('reads a cost the other way round: a rise hurts its holder, and a cut helps', () =>
  {
    // Arrange
    const note = '<mcrBuffPlus:[10]>\n<mcrBuffPlus:[-10]>';

    // Act
    const lines = linesOf(note);

    // Assert
    expect(lines)
      .toEqual([
        [ 964, '\\C[1]Magi Cost\\C[0] Buff+ {value}', '+10', -1 ],
        [ 964, '\\C[1]Magi Cost\\C[0] Buff+ {value}', '-10', 1 ],
      ]);
  });

  it('reads an amount of nothing as cutting neither way', () =>
  {
    // Arrange
    const note = '<atkBuffPlus:[0]>';

    // Act
    const lines = linesOf(note);

    // Assert
    expect(lines)
      .toEqual([ [ 931, '\\C[1]Power\\C[0] Buff+ {value}', '+0', 0 ] ]);
  });

  it('shows a formula as written, in its brackets, cutting neither way', () =>
  {
    // Arrange- a line describes the tag, not any one battler, so there is no one to work the formula out for.
    const note = '<atkBuffPlus:[a.mat*1.0]>\n<atkGrowthPlus:[a.mat*1.0]>';

    // Act
    const lines = linesOf(note);

    // Assert
    expect(lines)
      .toEqual([
        [ 931, '\\C[1]Power\\C[0] Buff+ {value}', '[a.mat*1.0]', 0 ],
        [ 931, '\\C[1]Power\\C[0] Growth+ {value} /lv', '[a.mat*1.0]', 0 ],
      ]);
  });
});
//endregion plugins/natural/core/core/describe-natural-notetags.test.js
