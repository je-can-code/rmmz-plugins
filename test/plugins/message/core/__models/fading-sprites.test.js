//region plugins/message/core/__models/fading-sprites.test.js
import { beforeEach, describe, expect, it } from 'vitest';

import FadingSprites from '../../../../../src/plugins/message/core/__models/FadingSprites.js';

/**
 * Every case here holds two departing sprites rather than one. A plane loses several at once every
 * time a conversation ends, and with a single entry "finished the right one" and "finished all of
 * them" are the same program - which would take a bubble off the screen half a second early.
 *
 * The sprites are plain objects with an alpha, because that is the whole of what this touches.
 */
describe('J-Message FadingSprites (direct src import)', () =>
{
  /** @type {FadingSprites} */
  let departing;

  /**
   * A stand-in for a sprite on its way out.
   * @param {number} alpha How opaque it is to begin with.
   * @returns {object}
   */
  function sprite(alpha = 1)
  {
    return { alpha };
  }

  /**
   * A linear fade, matching what the real one does.
   * @param {number} elapsed How many frames have passed.
   * @param {number} frames How long the fade runs.
   * @returns {number}
   */
  function alphaAt(elapsed, frames)
  {
    const remaining = frames - elapsed;

    if (remaining <= 0) return 0;

    return remaining / frames;
  }

  beforeEach(() =>
  {
    departing = new FadingSprites();
  });

  it('knows a sprite it was given', () =>
  {
    // Arrange
    departing.begin('a1', sprite(), 4);

    // Act
    const known = departing.has('a1');

    // Assert
    expect(known).toBe(true);
  });

  it('does not know a sprite it was never given', () =>
  {
    // Arrange
    departing.begin('a1', sprite(), 4);

    // Act
    const known = departing.has('a2');

    // Assert
    expect(known).toBe(false);
  });

  it('fades a sprite a step at a time', () =>
  {
    // Arrange
    const leaving = sprite();
    departing.begin('a1', leaving, 4);

    // Act
    departing.update(alphaAt);

    // Assert
    expect(leaving.alpha).toBe(0.75);
  });

  it('fades from wherever a sprite already was', () =>
  {
    // Arrange- a spent bubble sits dimmed rather than opaque, and starting its fade at full
    // brightness would have it flare up on the very frame it was told to leave.
    const leaving = sprite(0.5);
    departing.begin('a1', leaving, 4);

    // Act
    departing.update(alphaAt);

    // Assert
    expect(leaving.alpha).toBe(0.375);
  });

  it('reports nothing finished while a fade is still running', () =>
  {
    // Arrange
    departing.begin('a1', sprite(), 4);

    // Act
    const finished = departing.update(alphaAt);

    // Assert
    expect(finished).toEqual([]);
  });

  it('reports a sprite finished once its fade has run out', () =>
  {
    // Arrange- one short fade beside a long one, so "finished the short one" cannot pass for
    // "finished whatever it was holding".
    const short = sprite();
    const long = sprite();
    departing.begin('a1', short, 1);
    departing.begin('a2', long, 60);

    // Act
    const finished = departing.update(alphaAt);

    // Assert
    expect(finished).toEqual([ {
      key: 'a1',
      sprite: short,
    } ]);
  });

  it('forgets a sprite once it has finished', () =>
  {
    // Arrange
    departing.begin('a1', sprite(), 1);
    departing.update(alphaAt);

    // Act
    const known = departing.has('a1');

    // Assert- left behind, it would be faded again forever and never leave the plane.
    expect(known).toBe(false);
  });

  it('finishes several sprites that run out together', () =>
  {
    // Arrange- a conversation ending takes every bubble in it at once.
    departing.begin('a1', sprite(), 1);
    departing.begin('a2', sprite(), 1);

    // Act
    const finished = departing.update(alphaAt);

    // Assert
    expect(finished.map(({ key }) => key)).toEqual([ 'a1', 'a2' ]);
    expect(departing.sprites()).toEqual([]);
  });

  it('hands back a sprite whose key came back', () =>
  {
    // Arrange
    const leaving = sprite();
    departing.begin('a1', leaving, 30);
    departing.begin('a2', sprite(), 30);

    // Act
    const taken = departing.take('a1');

    // Assert- the caller takes it off the plane, because it is showing the previous line.
    expect(taken).toBe(leaving);
    expect(departing.has('a1')).toBe(false);
  });

  it('leaves everything else alone when one key comes back', () =>
  {
    // Arrange
    departing.begin('a1', sprite(), 30);
    departing.begin('a2', sprite(), 30);

    // Act
    departing.take('a1');

    // Assert
    expect(departing.has('a2')).toBe(true);
  });

  it('hands back nothing for a key that was never leaving', () =>
  {
    // Arrange- by far the common case, since most sprites are added to a plane that has nothing
    // departing at all.
    departing.begin('a1', sprite(), 30);

    // Act
    const taken = departing.take('a2');

    // Assert
    expect(taken).toBe(null);
  });

  it('lists everything currently on its way out', () =>
  {
    // Arrange
    const first = sprite();
    const second = sprite();
    departing.begin('a1', first, 30);
    departing.begin('a2', second, 30);

    // Act
    const all = departing.sprites();

    // Assert
    expect(all).toEqual([ first, second ]);
  });
});
//endregion plugins/message/core/__models/fading-sprites.test.js