//region plugins/passive/ext/difficulty/windows/window-difficulty-effect-list.test.js
import { beforeAll, describe, expect, it } from 'vitest';

import { installDifficultySceneRealm } from '../_component/fixtures/install-difficulty-scene-realm.js';

/**
 * One side of a difficulty layer, laid out as a flat list against the real engine.
 *
 * The rows arrive already decided, so what is worth proving here is their layout: the title comes first and
 * names the side, each row keeps its icon, name and value, the value takes the color of its tone, and a side
 * with nothing on it says so. A row too long for the list carries on beneath itself and stands that much taller,
 * pushing the rows beneath it down. And since the list is only ever read, it must never hold the cursor.
 *
 * The harness measures every character as ten pixels, so where a row breaks here proves the wiring, never the
 * real font; that is checked in front of a running game.
 */
describe('Window_DifficultyEffectList', () =>
{
  let Window_DifficultyEffectList;

  /**
   * Builds a list the size the scene gives one.
   * @returns {Window_DifficultyEffectList}
   */
  const buildWindow = () =>
  {
    const rectangle = new globalThis.Rectangle(0, 0, 749, 924);

    return new Window_DifficultyEffectList(rectangle);
  };

  /**
   * Reads a list's rows back as [name, value, value color, icon] tuples.
   * @param {Window_DifficultyEffectList} window The list to read.
   * @returns {Array<[string, string, number, number]>}
   */
  const rowsOf = window => window.commandList()
    .map(command => [ command.name, command.rightText, command.rightColor, command.icon ]);

  /**
   * Words far too long for one row of a list the size the scene gives one, at the harness's ten pixels a
   * character.
   * @type {string}
   */
  const longSentence =
    'Grants a stack of courage every three seconds spent standing perfectly still beside the old well.';

  /**
   * Words that fit one row of that list with nothing leading them, but not the room an icon leaves them.
   * @type {string}
   */
  const borderlineSentence = 'Grants a stack of courage every three seconds spent standing still!!';

  beforeAll(async () =>
  {
    await installDifficultySceneRealm();

    ({ default: Window_DifficultyEffectList } = await import(
      '../../../../../../src/plugins/passive/ext/difficulty/windows/Window_DifficultyEffectList.js'));
  });

  it('lists nothing before a side is chosen', () =>
  {
    // Arrange & Act
    const window = buildWindow();

    // Assert
    expect(window.commandList())
      .toEqual([]);
  });

  it('titles the party\'s side, and says when it has no effects', () =>
  {
    // Arrange
    const window = buildWindow();

    // Act
    window.setSide('actor');

    // Assert
    expect(rowsOf(window))
      .toEqual([ [ 'Actor Effects', '', 0, 82 ], [ 'No effects.', '', 0, 0 ] ]);
  });

  it('titles the enemies\' side', () =>
  {
    // Arrange
    const window = buildWindow();

    // Act
    window.setSide('enemy');

    // Assert
    const [ title ] = rowsOf(window);
    expect(title)
      .toEqual([ 'Enemy Effects', '', 0, 14 ]);
  });

  it('lists one row per effect beneath the title, each value in the color of its tone', () =>
  {
    // Arrange- one row of each tone, so a color taken from the wrong tone cannot pass.
    const window = buildWindow();
    window.setSide('actor');

    // Act
    window.setRows([
      { iconIndex: 931, name: 'Attack', value: '+100%', tone: 'easier' },
      { iconIndex: 964, name: 'Magi Cost', value: '+50%', tone: 'harder' },
      { iconIndex: 0, name: 'Encounter Half', value: '', tone: 'neutral' },
    ]);

    // Assert
    expect(rowsOf(window))
      .toEqual([
        [ 'Actor Effects', '', 0, 82 ],
        [ 'Attack', '+100%', 24, 931 ],
        [ 'Magi Cost', '+50%', 25, 964 ],
        [ 'Encounter Half', '', 0, 0 ],
      ]);
  });

  it('writes a sentence with its value colored and bolded where it stands, and nothing on the right', () =>
  {
    // Arrange- the same tone as a stat row's value, so only where the value lands can differ.
    const window = buildWindow();
    window.setSide('enemy');

    // Act
    window.setRows([
      { iconIndex: 87, name: 'Enemies yield {value} \\C[1]EXP\\C[0].', value: '2x', tone: 'easier', isProse: true },
    ]);

    // Assert
    expect(rowsOf(window))
      .toEqual([
        [ 'Enemy Effects', '', 0, 14 ],
        [ 'Enemies yield \\C[24]\\*2x\\*\\C[0] \\C[1]EXP\\C[0].', '', 0, 87 ],
      ]);
  });

  it('carries a row too long for the list onto the lines beneath it, and leaves a row that fits alone', () =>
  {
    // Arrange- a row too long for the list beside one that fits, so wrapping every row cannot pass.
    const window = buildWindow();
    window.setSide('actor');

    // Act
    window.setRows([
      { iconIndex: 0, name: longSentence, value: '', tone: 'neutral' },
      { iconIndex: 0, name: 'Encounter Half', value: '', tone: 'neutral' },
    ]);

    // Assert
    const [ , wrapped, fitting ] = window.commandList();
    expect([ wrapped.name, wrapped.lines ])
      .toEqual([
        'Grants a stack of courage every three seconds spent standing',
        [ 'perfectly still beside the old well.' ],
      ]);
    expect([ fitting.name, fitting.lines ])
      .toEqual([ 'Encounter Half', [] ]);
  });

  it('measures a row with an icon from past its icon, so the same words wrap sooner', () =>
  {
    // Arrange- words that fit a row without an icon, but not the room one with an icon leaves them.
    const window = buildWindow();
    window.setSide('actor');

    // Act
    window.setRows([
      { iconIndex: 0, name: borderlineSentence, value: '', tone: 'neutral' },
      { iconIndex: 931, name: borderlineSentence, value: '', tone: 'neutral' },
    ]);

    // Assert
    const [ , withoutIcon, withIcon ] = window.commandList();
    expect([ withoutIcon.lines.length, withIcon.lines.length ])
      .toEqual([ 0, 1 ]);
  });

  it('stands a wrapped row a line taller, and moves every row beneath it down by as much', () =>
  {
    // Arrange- the same two positions laid out once unwrapped and once wrapped, so the growth is measured.
    const unwrapped = buildWindow();
    unwrapped.setSide('actor');
    unwrapped.setRows([
      { iconIndex: 0, name: 'Encounter Half', value: '', tone: 'neutral' },
      { iconIndex: 0, name: 'Encounter None', value: '', tone: 'neutral' },
    ]);
    const wrapped = buildWindow();
    wrapped.setSide('actor');

    // Act
    wrapped.setRows([
      { iconIndex: 0, name: longSentence, value: '', tone: 'neutral' },
      { iconIndex: 0, name: 'Encounter None', value: '', tone: 'neutral' },
    ]);

    // Assert- the wrapped row's height and the row beneath it, against the same rows unwrapped.
    const layoutOf = window => [ window.itemRect(1).height, window.itemRect(2).y, window.overallHeight() ];
    expect([ layoutOf(unwrapped), layoutOf(wrapped) ])
      .toEqual([ [ 40, 90, 132 ], [ 76, 126, 168 ] ]);
  });

  it('never holds the cursor or takes input', () =>
  {
    // Arrange & Act
    const window = buildWindow();

    // Assert
    expect(window.active)
      .toBe(false);
    expect(window.index())
      .toBe(-1);
  });
});
//endregion plugins/passive/ext/difficulty/windows/window-difficulty-effect-list.test.js
