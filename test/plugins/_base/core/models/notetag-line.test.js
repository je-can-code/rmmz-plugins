//region plugins/_base/core/models/notetag-line.test.js
import { beforeAll, describe, expect, it } from 'vitest';

/**
 * The line a notetag's describer answers with. Most describers will pass only some of its parts, so the
 * defaults matter as much as the parts given.
 */
describe('NotetagLine (direct src import)', () =>
{
  let NotetagLine;

  /**
   * Reads a line back as its four parts.
   * @param {NotetagLine} line The line.
   * @returns {Array<number|string>}
   */
  const partsOf = line => [ line.iconIndex, line.text, line.value, line.holderImpact ];

  beforeAll(async () =>
  {
    String.empty = '';

    ({ default: NotetagLine } = await import('../../../../../src/plugins/_base/core/models/NotetagLine.js'));
  });

  it('keeps every part it is given', () =>
  {
    // Arrange & Act
    const line = new NotetagLine({
      iconIndex: 12,
      text: 'Some effect',
      value: '+3',
      holderImpact: NotetagLine.Impacts.HURTS,
    });

    // Assert
    expect(partsOf(line))
      .toEqual([ 12, 'Some effect', '+3', -1 ]);
  });

  it('gives no icon, no value and no direction when only the words are given', () =>
  {
    // Arrange & Act- the words arriving is the proof it was built from what it was given.
    const line = new NotetagLine({ text: 'Words only' });

    // Assert
    expect(partsOf(line))
      .toEqual([ 0, 'Words only', '', 0 ]);
  });

  describe('withValueInPlace', () =>
  {
    it('puts the value where the words mark it, bold and in the color given', () =>
    {
      // Arrange
      const text = 'Enemies yield {value} EXP.';

      // Act
      const rendered = NotetagLine.withValueInPlace(text, '2.4x', 24);

      // Assert
      expect(rendered)
        .toBe('Enemies yield \\C[24]\\*2.4x\\*\\C[0] EXP.');
    });

    it('puts a value holding a dollar sign in place as written', () =>
    {
      // Arrange- `$&` in a replacement string would otherwise repeat the token it replaces.
      const text = 'Costs {value}.';

      // Act
      const rendered = NotetagLine.withValueInPlace(text, '$&5', 0);

      // Assert
      expect(rendered)
        .toBe('Costs \\C[0]\\*$&5\\*\\C[0].');
    });
  });

  describe('hasValueInPlace', () =>
  {
    it('reads a line whose words mark the value as a sentence', () =>
    {
      // Arrange
      const line = new NotetagLine({ text: 'Enemies yield {value} EXP.', value: '2x' });

      // Act
      const isSentence = line.hasValueInPlace();

      // Assert
      expect(isSentence)
        .toBe(true);
    });

    it('reads a line whose words leave the value out as keeping it apart', () =>
    {
      // Arrange
      const line = new NotetagLine({ text: 'Power Buff+', value: '+10' });

      // Act
      const isSentence = line.hasValueInPlace();

      // Assert
      expect(isSentence)
        .toBe(false);
    });
  });
});
//endregion plugins/_base/core/models/notetag-line.test.js
