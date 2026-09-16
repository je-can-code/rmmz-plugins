//region plugins/message/core/services/message-effect-set.test.js
import { describe, expect, it } from 'vitest';

import MessageEffectSet
  from '../../../../../src/plugins/message/core/services/MessageEffectSet.js';

/**
 * The property worth protecting here is baseline immunity: a speaker whose profile already waves
 * must keep waving when an author types the wave code inside their line. Every baseline case below
 * therefore carries a second effect that is *not* in the baseline, so that "baseline survives" and
 * "the set never changes at all" cannot both explain a pass.
 */
describe('J-Message MessageEffectSet (direct src import)', () =>
{
  it('resolves to nothing when neither the speaker nor the author asked for anything', () =>
  {
    // Arrange & Act
    const resolved = MessageEffectSet.resolve([], new Set());

    // Assert
    expect(resolved).toEqual([]);
  });

  it('resolves a speaker baseline with no spans open', () =>
  {
    // Arrange & Act
    const resolved = MessageEffectSet.resolve([ 'wave' ], new Set());

    // Assert
    expect(resolved).toEqual([ 'wave' ]);
  });

  it('resolves an open span with no speaker baseline', () =>
  {
    // Arrange & Act
    const resolved = MessageEffectSet.resolve([], new Set([ 'jitter' ]));

    // Assert
    expect(resolved).toEqual([ 'jitter' ]);
  });

  it('puts the speaker baseline before the author emphasis', () =>
  {
    // Arrange & Act
    const resolved = MessageEffectSet.resolve([ 'wave' ], new Set([ 'jitter' ]));

    // Assert
    expect(resolved).toEqual([ 'wave', 'jitter' ]);
  });

  it('collapses an emphasis the speaker baseline already carries', () =>
  {
    // Arrange & Act
    // the author opened a wave inside a character who already waves, and also opened a jitter that
    // is genuinely new - so a result of exactly two proves the collapse without proving inertia.
    const resolved = MessageEffectSet.resolve([ 'wave' ], new Set([ 'wave', 'jitter' ]));

    // Assert
    expect(resolved).toEqual([ 'wave', 'jitter' ]);
  });

  it('keeps a baseline effect acting even after the author toggles its code off', () =>
  {
    // Arrange
    const spanEffects = new Set([ 'jitter' ]);

    // Act
    // the author typed the wave code inside a character who always waves: the span flips, but the
    // baseline is not the span's to switch off.
    MessageEffectSet.toggle(spanEffects, 'wave');
    const resolved = MessageEffectSet.resolve([ 'wave' ], spanEffects);

    // Assert
    expect(resolved).toEqual([ 'wave', 'jitter' ]);
  });

  it('opens a span effect the author has not yet opened', () =>
  {
    // Arrange
    const spanEffects = new Set();

    // Act
    MessageEffectSet.toggle(spanEffects, 'wave');

    // Assert
    expect(spanEffects.has('wave')).toBe(true);
  });

  it('closes a span effect the author had already opened', () =>
  {
    // Arrange
    const spanEffects = new Set([ 'wave', 'jitter' ]);

    // Act
    MessageEffectSet.toggle(spanEffects, 'wave');

    // Assert
    expect(spanEffects.has('wave')).toBe(false);
    expect(spanEffects.has('jitter')).toBe(true);
  });

  it('leaves the baseline list untouched when resolving', () =>
  {
    // Arrange
    const baselineEffects = [ 'wave' ];

    // Act
    // the baseline belongs to the speaker's profile and is read on every flush of every message;
    // a resolve that appended to it would grow the character's identity as the scene went on.
    MessageEffectSet.resolve(baselineEffects, new Set([ 'jitter', 'rainbow' ]));

    // Assert
    expect(baselineEffects).toEqual([ 'wave' ]);
  });
});
//endregion plugins/message/core/services/message-effect-set.test.js