//region plugins/message/core/services/message-pacing.test.js
import { beforeAll, describe, expect, it } from 'vitest';

import MessagePacing from '../../../../../src/plugins/message/core/services/MessagePacing.js';
import MessageSpeakerProfile
  from '../../../../../src/plugins/message/core/__models/MessageSpeakerProfile.js';

/**
 * Every answer here is measured in frames *added* to what the engine already spends, and zero is
 * the most important of them: an unprofiled speaker must add nothing, because the alternative is
 * that switching this plugin on quietly changes the reading pace of every line in the game.
 *
 * The punctuation fixtures always weight one mark and leave another alone, so a table lookup that
 * had degraded into "any punctuation is slower" would fail rather than pass on the only case tried.
 */
describe('J-Message MessagePacing (direct src import)', () =>
{
  beforeAll(() =>
  {
    // profiles seed string fields from String.empty, which J-Base installs onto the String constructor.
    if (String.empty === undefined)
    {
      Object.defineProperty(String, 'empty', {
        value: '',
        writable: false,
        configurable: true,
      });
    }
  });

  it('adds nothing at all for a speaker nobody has profiled', () =>
  {
    // Arrange
    const profile = MessageSpeakerProfile.default();

    // Act
    const extraFrames = MessagePacing.extraFramesFor('a', profile);

    // Assert
    expect(extraFrames).toBe(0);
  });

  it('adds the difference between a slower speaker and the engine pace', () =>
  {
    // Arrange
    const profile = MessageSpeakerProfile.fromConfig({ framesPerCharacter: 3 });

    // Act
    const extraFrames = MessagePacing.extraFramesFor('a', profile);

    // Assert
    // three frames per character is two more than the one the engine already spends.
    expect(extraFrames).toBe(2);
  });

  it('weights a punctuation mark the profile singles out', () =>
  {
    // Arrange
    const profile = MessageSpeakerProfile.fromConfig({ punctuationFrames: { '.': 12, ',': 5 } });

    // Act
    const extraFrames = MessagePacing.extraFramesFor('.', profile);

    // Assert
    expect(extraFrames).toBe(12);
  });

  it('weights a different mark differently rather than treating punctuation as one thing', () =>
  {
    // Arrange
    const profile = MessageSpeakerProfile.fromConfig({ punctuationFrames: { '.': 12, ',': 5 } });

    // Act
    const extraFrames = MessagePacing.extraFramesFor(',', profile);

    // Assert
    expect(extraFrames).toBe(5);
  });

  it('adds nothing extra for a character the punctuation table says nothing about', () =>
  {
    // Arrange
    const profile = MessageSpeakerProfile.fromConfig({ punctuationFrames: { '.': 12 } });

    // Act
    const extraFrames = MessagePacing.extraFramesFor('e', profile);

    // Assert
    expect(extraFrames).toBe(0);
  });

  it('combines a slow speaker with a weighted mark rather than choosing between them', () =>
  {
    // Arrange
    const profile = MessageSpeakerProfile.fromConfig({
      framesPerCharacter: 3,
      punctuationFrames: { '.': 12 },
    });

    // Act
    const extraFrames = MessagePacing.extraFramesFor('.', profile);

    // Assert
    // two from the pace, twelve from the mark.
    expect(extraFrames).toBe(14);
  });

  it('adds nothing for a speaker asking to outrun the engine', () =>
  {
    // Arrange
    // a character cannot be revealed in less than the frame it is drawn on, so a pace below one is
    // a request the engine has no way to honour.
    const profile = MessageSpeakerProfile.fromConfig({ framesPerCharacter: 0 });

    // Act
    const extraFrames = MessagePacing.extraFramesFor('a', profile);

    // Assert
    expect(extraFrames).toBe(0);
  });

  it('still honours a weighted mark for a speaker asking to outrun the engine', () =>
  {
    // Arrange
    const profile = MessageSpeakerProfile.fromConfig({
      framesPerCharacter: 0,
      punctuationFrames: { '.': 12 },
    });

    // Act
    const extraFrames = MessagePacing.extraFramesFor('.', profile);

    // Assert
    // the pace contributes minus one and the mark twelve, which is a real pause rather than a floor.
    expect(extraFrames).toBe(11);
  });
});
//endregion plugins/message/core/services/message-pacing.test.js