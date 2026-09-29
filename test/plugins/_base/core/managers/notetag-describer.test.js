//region plugins/_base/core/managers/notetag-describer.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installJBaseHostGlobals } from '../_component/fixtures/install-j-base-host-globals.js';

/**
 * The registry every plugin describes its own tags through.
 *
 * What it promises is small and easy to get quietly wrong: a line only for a tag that is on the row and has a
 * describer, one line per occurrence, and a fixed order. Every fixture here carries a second tag, registered or
 * written, that has to be left alone, because a registry that answered for every describer or every tag would
 * pass any test holding only one of each.
 */
describe('NotetagDescriber (direct src import)', () =>
{
  let NotetagDescriber;

  /**
   * A regex for a tag carrying one number, the way a plugin's RegExp table declares one.
   * @type {RegExp}
   */
  const speedTag = /<speed:(\d+)>/i;

  /**
   * A second tag of the same shape, to stand beside the first.
   * @type {RegExp}
   */
  const powerTag = /<power:(\d+)>/i;

  /**
   * A describer that names its tag and repeats the amount it carries.
   * @param {string} name The tag's name, as the line says it.
   * @returns {function(RegExpExecArray): object[]}
   */
  const describerNaming = name => ([ , amount ]) => [ { text: `${name} ${amount}` } ];

  /**
   * Reads a list of lines back as their words alone.
   * @param {object[]} lines The lines.
   * @returns {string[]}
   */
  const textsOf = lines => lines.map(line => line.text);

  beforeAll(async () =>
  {
    // fresh module registry so re-running this file doesn't double-apply J.BASE setup.
    vi.resetModules();

    installJBaseHostGlobals();

    // real production code- sets up the String.empty/Array.empty sentinels RPGManager relies on.
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: NotetagDescriber } = await import('../../../../../src/plugins/_base/core/managers/NotetagDescriber.js'));
  });

  beforeEach(() =>
  {
    // registering a tag twice throws, so every test registers into an empty registry.
    NotetagDescriber.describers()
      .clear();

    // and every test writes the sentences it needs.
    NotetagDescriber.setTemplates(new Map());
  });

  /**
   * Reads a line back as its icon, words, value and impact.
   * @param {NotetagLine} line The line.
   * @returns {Array<number|string>}
   */
  const partsOf = line => [ line.iconIndex, line.text, line.value, line.holderImpact ];

  /**
   * A subject token, the kind a reward or a stat is.
   * @param {string} text The name.
   * @returns {{text: string, kind: string}}
   */
  const subject = text => ({
    text,
    kind: 'subject',
  });

  it('refuses to be constructed, being a static class', () =>
  {
    // Arrange & Act
    const attempt = () => new NotetagDescriber();

    // Assert
    expect(attempt)
      .toThrow('This is a static class.');
  });

  describe('register', () =>
  {
    it('refuses a second describer for one tag, naming the tag, and keeps the first', () =>
    {
      // Arrange
      const first = describerNaming('speed');
      const second = describerNaming('haste');
      NotetagDescriber.register(speedTag, first);

      // Act
      const attempt = () => NotetagDescriber.register(speedTag, second);

      // Assert
      expect(attempt)
        .toThrow('NotetagDescriber: duplicate describer for /<speed:(\\d+)>/i.');
      expect(NotetagDescriber.describers()
        .get(speedTag))
        .toBe(first);
    });
  });

  describe('linesFor', () =>
  {
    it('describes a registered tag on the row, handing its describer the whole match and the row', () =>
    {
      // Arrange
      const describer = vi.fn(describerNaming('speed'));
      NotetagDescriber.register(speedTag, describer);
      const row = { note: '<speed:5>' };

      // Act
      const lines = NotetagDescriber.linesFor(row);

      // Assert
      expect(textsOf(lines))
        .toEqual([ 'speed 5' ]);
      const [ [ match, dataRow ] ] = describer.mock.calls;
      expect([ ...match ])
        .toEqual([ '<speed:5>', '5' ]);
      expect(dataRow)
        .toBe(row);
    });

    it('leaves out a tag no describer is registered for', () =>
    {
      // Arrange- the power tag is on the row, but nothing describes it yet.
      NotetagDescriber.register(speedTag, describerNaming('speed'));
      const row = { note: '<speed:5>\n<power:9>' };

      // Act
      const lines = NotetagDescriber.linesFor(row);

      // Assert
      expect(textsOf(lines))
        .toEqual([ 'speed 5' ]);
    });

    it('never asks a describer whose tag is not on the row', () =>
    {
      // Arrange- both tags are described, and only the speed tag is written.
      const speed = vi.fn(describerNaming('speed'));
      const power = vi.fn(describerNaming('power'));
      NotetagDescriber.register(speedTag, speed);
      NotetagDescriber.register(powerTag, power);
      const row = { note: '<speed:5>' };

      // Act
      NotetagDescriber.linesFor(row);

      // Assert
      expect(speed)
        .toHaveBeenCalledTimes(1);
      expect(power)
        .not
        .toHaveBeenCalled();
    });

    it('adds no line for a tag described as saying nothing, though its describer was asked', () =>
    {
      // Arrange- a tag that only configures something answers with no lines at all.
      const silent = vi.fn(() => []);
      NotetagDescriber.register(speedTag, silent);
      const row = { note: '<speed:5>' };

      // Act
      const lines = NotetagDescriber.linesFor(row);

      // Assert
      expect(lines)
        .toEqual([]);
      expect(silent)
        .toHaveBeenCalledTimes(1);
    });

    it('describes every occurrence of a tag on its own line, in note order', () =>
    {
      // Arrange- a different tag sits between the two occurrences.
      NotetagDescriber.register(speedTag, describerNaming('speed'));
      const row = { note: '<speed:5>\n<power:1>\n<speed:7>' };

      // Act
      const lines = NotetagDescriber.linesFor(row);

      // Assert
      expect(textsOf(lines))
        .toEqual([ 'speed 5', 'speed 7' ]);
    });

    it('groups lines by describer, in the order the describers were registered', () =>
    {
      // Arrange- registered power first, while the note is written speed first.
      NotetagDescriber.register(powerTag, describerNaming('power'));
      NotetagDescriber.register(speedTag, describerNaming('speed'));
      const row = { note: '<speed:5>\n<power:9>' };

      // Act
      const lines = NotetagDescriber.linesFor(row);

      // Assert
      expect(textsOf(lines))
        .toEqual([ 'power 9', 'speed 5' ]);
    });
  });

  describe('linesForTags', () =>
  {
    it('describes only the tags asked for, grouped in the order they are asked for', () =>
    {
      // Arrange- three describers registered, power before speed; only speed and power are asked for, speed first,
      // and the note carries all three tags.
      const guardTag = /<guard:(\d+)>/i;
      NotetagDescriber.register(powerTag, describerNaming('power'));
      NotetagDescriber.register(guardTag, describerNaming('guard'));
      NotetagDescriber.register(speedTag, describerNaming('speed'));
      const row = { note: '<power:9>\n<guard:4>\n<speed:5>' };

      // Act
      const lines = NotetagDescriber.linesForTags(row, [ speedTag, powerTag ]);

      // Assert
      expect(textsOf(lines))
        .toEqual([ 'speed 5', 'power 9' ]);
    });
  });

  describe('hasTemplate', () =>
  {
    it('knows a written key, one written empty included, from one never written', () =>
    {
      // Arrange
      NotetagDescriber.setTemplates(new Map([ [ 'written', 'Words.' ], [ 'silent', '' ] ]));

      // Act
      const found = [ 'written', 'silent', 'missing' ].map(key => NotetagDescriber.hasTemplate(key));

      // Assert
      expect(found)
        .toEqual([ true, true, false ]);
    });
  });

  describe('phrase', () =>
  {
    it('fills a written phrase and hands it back as a code a sentence can name', () =>
    {
      // Arrange- a second phrase sits beside the one asked for, and must not be the one used.
      NotetagDescriber.setTemplates(new Map([
        [ 'trigger.onKill', 'whenever {who} defeats an enemy' ],
        [ 'trigger.time', 'every {seconds}' ],
      ]));

      // Act
      const phrase = NotetagDescriber.phrase('trigger.onKill', { who: subject('Rupert') });

      // Assert
      expect(phrase)
        .toEqual({ text: 'whenever \\C[1]Rupert\\C[0] defeats an enemy', kind: 'code' });
    });

    it('hands back an empty code for a phrase never written', () =>
    {
      // Arrange
      NotetagDescriber.setTemplates(new Map([ [ 'trigger.time', 'every {seconds}' ] ]));

      // Act
      const phrase = NotetagDescriber.phrase('trigger.onKill', {});

      // Assert
      expect(phrase)
        .toEqual({ text: '', kind: 'code' });
    });
  });

  describe('line', () =>
  {
    it('says nothing for a sentence naming a token supplied empty, such as a phrase never written', () =>
    {
      // Arrange- the state is there; the trigger arrived with nothing in it.
      NotetagDescriber.setTemplates(new Map([ [ 'autoApplyState', 'Gain {state} {trigger}.' ] ]));

      // Act
      const lines = NotetagDescriber.line('autoApplyState', {
        tokens: {
          state: { text: '\\state[12]', kind: 'code' },
          trigger: { text: '', kind: 'code' },
        },
      });

      // Assert
      expect(lines)
        .toEqual([]);
    });

    it('builds the line from its key\'s sentence, a subject in its color and the value left for the screen', () =>
    {
      // Arrange- a second sentence sits beside the one asked for, and must not be the one used.
      NotetagDescriber.setTemplates(new Map([
        [ 'rewardMultiplier', 'Enemies yield {value} {reward}.' ],
        [ 'somethingElse', 'Something else {value}.' ],
      ]));

      // Act
      const lines = NotetagDescriber.line('rewardMultiplier', {
        iconIndex: 87,
        holderImpact: -1,
        value: '2x',
        tokens: { reward: subject('EXP') },
      });

      // Assert
      expect(lines.map(partsOf))
        .toEqual([ [ 87, 'Enemies yield {value} \\C[1]EXP\\C[0].', '2x', -1 ] ]);
    });

    it('bolds a token whose kind is a value, as well as coloring it', () =>
    {
      // Arrange
      NotetagDescriber.setTemplates(new Map([ [ 'pulse', 'Every {interval}, gain {value}.' ] ]));

      // Act
      const lines = NotetagDescriber.line('pulse', {
        value: '+5',
        tokens: { interval: { text: '10 seconds', kind: 'measure' } },
      });

      // Assert
      expect(lines.map(partsOf))
        .toEqual([ [ 0, 'Every \\C[6]\\*10 seconds\\*\\C[0], gain {value}.', '+5', 0 ] ]);
    });

    it('places a text code exactly as written, since it draws its own icon and color', () =>
    {
      // Arrange- a subject sits beside the code, so a code colored like one shows.
      NotetagDescriber.setTemplates(new Map([ [ 'inflict', '{who} have a {value} chance to inflict {state}.' ] ]));

      // Act
      const lines = NotetagDescriber.line('inflict', {
        value: '50%',
        tokens: { who: subject('Critical hits'), state: { text: '\\state[12]', kind: 'code' } },
      });

      // Assert
      expect(lines.map(partsOf))
        .toEqual([ [ 0, '\\C[1]Critical hits\\C[0] have a {value} chance to inflict \\state[12].', '50%', 0 ] ]);
    });

    it('builds a sentence that names no value, from its words alone', () =>
    {
      // Arrange- the near-miss of the case below: no value given, and none asked for.
      NotetagDescriber.setTemplates(new Map([ [ 'unremovable', 'Cannot be removed.' ] ]));

      // Act
      const lines = NotetagDescriber.line('unremovable', {});

      // Assert
      expect(lines.map(partsOf))
        .toEqual([ [ 0, 'Cannot be removed.', '', 0 ] ]);
    });

    it('says nothing for a sentence naming the value when no value was given', () =>
    {
      // Arrange
      NotetagDescriber.setTemplates(new Map([ [ 'gain', 'Gain {value}.' ] ]));

      // Act
      const lines = NotetagDescriber.line('gain', {});

      // Assert
      expect(lines)
        .toEqual([]);
    });

    it('says nothing for a key with no sentence written yet', () =>
    {
      // Arrange- everything the sentence would need is here; only the sentence is missing.
      NotetagDescriber.setTemplates(new Map([ [ 'somethingElse', 'Enemies yield {value} {reward}.' ] ]));

      // Act
      const lines = NotetagDescriber.line('rewardMultiplier', {
        value: '2x',
        tokens: { reward: subject('EXP') },
      });

      // Assert
      expect(lines)
        .toEqual([]);
    });

    it('says nothing for a sentence written empty, to say its tag says nothing', () =>
    {
      // Arrange
      NotetagDescriber.setTemplates(new Map([ [ 'stackMax', '' ] ]));

      // Act
      const lines = NotetagDescriber.line('stackMax', { value: '3' });

      // Assert
      expect(lines)
        .toEqual([]);
    });

    it('says nothing for a sentence naming a token the describer never supplied', () =>
    {
      // Arrange- the value is there; the reward is not.
      NotetagDescriber.setTemplates(new Map([ [ 'rewardMultiplier', 'Enemies yield {value} {reward}.' ] ]));

      // Act
      const lines = NotetagDescriber.line('rewardMultiplier', { value: '2x' });

      // Assert
      expect(lines)
        .toEqual([]);
    });

    it('never reads a token from what every object inherits', () =>
    {
      // Arrange- every object answers `constructor`, which is not a token anyone supplied.
      NotetagDescriber.setTemplates(new Map([ [ 'odd', 'Made by {constructor}.' ] ]));

      // Act
      const lines = NotetagDescriber.line('odd', {});

      // Assert
      expect(lines)
        .toEqual([]);
    });
  });

  describe('loadTemplates', () =>
  {
    it('reads every sentence from the game\'s config, keyed as describers ask for them', () =>
    {
      // Arrange- a sentence and a decided silence, both kept.
      globalThis.StorageManager.fsReadFile = () => JSON.stringify([
        { key: 'rewardMultiplier', template: 'Enemies yield {value} {reward}.' },
        { key: 'stackMax', template: '' },
      ]);

      // Act
      NotetagDescriber.loadTemplates();

      // Assert
      expect([ ...NotetagDescriber.templates() ])
        .toEqual([ [ 'rewardMultiplier', 'Enemies yield {value} {reward}.' ], [ 'stackMax', '' ] ]);
    });

    it('refuses a config naming one key twice, since one sentence would silently replace the other', () =>
    {
      // Arrange
      globalThis.StorageManager.fsReadFile = () => JSON.stringify([
        { key: 'rewardMultiplier', template: 'Enemies yield {value} {reward}.' },
        { key: 'stackMax', template: '' },
        { key: 'rewardMultiplier', template: 'Foes drop {value} {reward}.' },
      ]);

      // Act
      const attempt = () => NotetagDescriber.loadTemplates();

      // Assert
      expect(attempt)
        .toThrow('duplicate key(s): rewardMultiplier.');
    });
  });
});
//endregion plugins/_base/core/managers/notetag-describer.test.js
