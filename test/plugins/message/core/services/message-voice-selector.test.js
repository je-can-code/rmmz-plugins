//region plugins/message/core/services/message-voice-selector.test.js
import { beforeAll, describe, expect, it } from 'vitest';

import MessageVoiceSelector
  from '../../../../../src/plugins/message/core/services/MessageVoiceSelector.js';
import MessageSpeakerProfile
  from '../../../../../src/plugins/message/core/__models/MessageSpeakerProfile.js';

/**
 * Three independent reasons exist for this to stay quiet - the speaker has no voice, the character
 * is not one worth sounding, and this glyph falls between blips - and a null proves nothing about
 * which of them fired. Every negative case below therefore disables exactly one reason and leaves
 * the others satisfied, so a guard that had stopped working could not hide behind its neighbours.
 */
describe('J-Message MessageVoiceSelector (direct src import)', () =>
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

  /**
   * A speaker who sounds on every single character, so only the rule under test can silence them.
   * @param {object} [overrides] Fields to differ from that baseline.
   * @returns {MessageSpeakerProfile}
   */
  function loudProfile(overrides = {})
  {
    return MessageSpeakerProfile.fromConfig({
      voiceSeName: 'Cursor1',
      voiceVolume: 80,
      voicePitch: 120,
      voicePan: 0,
      voiceStride: 1,
      ...overrides,
    });
  }

  it('sounds the speaker on an ordinary character', () =>
  {
    // Arrange
    const profile = loudProfile();

    // Act
    const se = MessageVoiceSelector.selectFor(0, 'a', profile);

    // Assert
    expect(se).toEqual({ name: 'Cursor1', volume: 80, pitch: 120, pan: 0 });
  });

  it('stays silent for a speaker with no voice, on a character that would otherwise sound', () =>
  {
    // Arrange
    // every other reason to stay quiet is disabled: an ordinary character, on a glyph the stride
    // would land on.
    const profile = MessageSpeakerProfile.fromConfig({ voiceStride: 1 });

    // Act
    const se = MessageVoiceSelector.selectFor(0, 'a', profile);

    // Assert
    expect(se).toBeNull();
  });

  it('stays silent on a space, for a speaker who sounds on everything else', () =>
  {
    // Arrange
    const profile = loudProfile();

    // Act
    const se = MessageVoiceSelector.selectFor(0, ' ', profile);

    // Assert
    expect(se).toBeNull();
  });

  it('stays silent on a full stop, where the pacing has just placed a beat', () =>
  {
    // Arrange
    const profile = loudProfile();

    // Act
    const se = MessageVoiceSelector.selectFor(0, '.', profile);

    // Assert
    expect(se).toBeNull();
  });

  it('sounds on a character adjacent to a voiceless one', () =>
  {
    // Arrange
    // proves the voiceless list is a membership test rather than a blanket refusal.
    const profile = loudProfile();

    // Act
    const se = MessageVoiceSelector.selectFor(0, 'z', profile);

    // Assert
    expect(se).not.toBeNull();
  });

  it('stays silent on a glyph the stride steps over', () =>
  {
    // Arrange
    const profile = loudProfile({ voiceStride: 3 });

    // Act
    const se = MessageVoiceSelector.selectFor(1, 'a', profile);

    // Assert
    expect(se).toBeNull();
  });

  it('sounds on a glyph the stride lands on', () =>
  {
    // Arrange
    const profile = loudProfile({ voiceStride: 3 });

    // Act
    const se = MessageVoiceSelector.selectFor(3, 'a', profile);

    // Assert
    expect(se).not.toBeNull();
  });

  it('sounds on every character when the stride asks for every character', () =>
  {
    // Arrange
    const profile = loudProfile({ voiceStride: 1 });

    // Act
    const firstGlyph = MessageVoiceSelector.selectFor(1, 'a', profile);
    const secondGlyph = MessageVoiceSelector.selectFor(2, 'a', profile);

    // Assert
    expect(firstGlyph).not.toBeNull();
    expect(secondGlyph).not.toBeNull();
  });

  it('keeps a flat tone for a speaker who has not asked their voice to wander', () =>
  {
    // Arrange
    const profile = loudProfile({ voicePitch: 100, voicePitchVariance: 0 });

    // Act
    const pitches = [ 0, 1, 2, 3 ].map(index => MessageVoiceSelector.selectFor(index, 'a', profile).pitch);

    // Assert
    expect(pitches).toEqual([ 100, 100, 100, 100 ]);
  });

  it('wanders the pitch around the base from one blip to the next', () =>
  {
    // Arrange
    const profile = loudProfile({ voicePitch: 100, voicePitchVariance: 8 });

    // Act
    const pitches = [ 0, 1, 2, 3, 4 ].map(index => MessageVoiceSelector.selectFor(index, 'a', profile).pitch);

    // Assert
    // one sound at one pitch is a metronome; these are what turn it into a voice.
    expect(pitches).toEqual([ 96, 106, 105, 104, 94 ]);
  });

  it('does not open every line on the same note', () =>
  {
    // Arrange
    // the first glyph seeds the hash with the smallest number it ever will, which is exactly where
    // an unsalted hash bottoms out - so this is the one index worth pinning on its own.
    const profile = loudProfile({ voicePitch: 100, voicePitchVariance: 8 });

    // Act
    const firstPitch = MessageVoiceSelector.pitchFor(0, profile);

    // Assert
    expect(firstPitch).not.toBe(100 - 8);
  });

  it('keeps a wandering pitch inside what the engine audio accepts, at the top', () =>
  {
    // Arrange
    const profile = loudProfile({ voicePitch: 148, voicePitchVariance: 40 });

    // Act
    const pitch = MessageVoiceSelector.pitchFor(3, profile);

    // Assert
    expect(pitch).toBe(150);
  });

  it('keeps a wandering pitch inside what the engine audio accepts, at the bottom', () =>
  {
    // Arrange
    const profile = loudProfile({ voicePitch: 52, voicePitchVariance: 40 });

    // Act
    // index four is one the hash swings downward on, which is what pushes this under the floor.
    const pitch = MessageVoiceSelector.pitchFor(4, profile);

    // Assert
    expect(pitch).toBe(50);
  });

  it('leaves a pitch alone when it is comfortably inside the accepted range', () =>
  {
    // Arrange
    // the clamps are boundaries, not a blanket rewrite - a middling pitch must pass through.
    const profile = loudProfile({ voicePitch: 100, voicePitchVariance: 8 });

    // Act
    const pitch = MessageVoiceSelector.pitchFor(1, profile);

    // Assert
    expect(pitch).toBe(106);
  });

  it('sounds on every character rather than falling silent when the stride is zero', () =>
  {
    // Arrange
    // a remainder by zero is NaN, which compares false against everything - a stride of zero left
    // unhandled would silence the speaker completely rather than speed them up.
    const profile = loudProfile({ voiceStride: 0 });

    // Act
    const se = MessageVoiceSelector.selectFor(7, 'a', profile);

    // Assert
    expect(se).not.toBeNull();
  });
});
//endregion plugins/message/core/services/message-voice-selector.test.js