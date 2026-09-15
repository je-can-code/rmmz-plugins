//region plugins/message/core/__models/message-speaker-profile.test.js
import { beforeAll, describe, expect, it } from 'vitest';

import MessageSpeakerProfile
  from '../../../../../src/plugins/message/core/__models/MessageSpeakerProfile.js';

/**
 * The default profile is the load-bearing one. Every unnamed NPC, every signpost and every line of
 * narration in the game resolves to it, so if it is anything other than "behave exactly as the
 * engine already does" the change lands on thousands of lines nobody asked to touch.
 *
 * The config cases set one field at a time against a fixture that sets all of them, so a
 * `fromConfig` that read the wrong key would fail rather than coincidentally pick up a neighbour.
 */
describe('J-Message MessageSpeakerProfile (direct src import)', () =>
{
  beforeAll(() =>
  {
    // the model seeds string fields from String.empty, which J-Base installs onto the String constructor.
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
   * A config entry in which every field differs recognisably from its default.
   * @returns {object}
   */
  function fullConfigEntry()
  {
    return {
      voiceSeName: 'Cursor1',
      voiceVolume: 55,
      voicePitch: 70,
      voicePan: -20,
      voiceStride: 4,
      framesPerCharacter: 3,
      punctuationFrames: { '.': 14 },
      baselineEffects: [ 'wave' ],
    };
  }

  it('defaults to the engine pace so an unprofiled speaker reads exactly as today', () =>
  {
    // Arrange & Act
    const profile = MessageSpeakerProfile.default();

    // Assert
    expect(profile.framesPerCharacter).toBe(1);
    expect(profile.punctuationFrames).toEqual({});
    expect(profile.baselineEffects).toEqual([]);
  });

  it('defaults to silence rather than to an arbitrary sound', () =>
  {
    // Arrange & Act
    const profile = MessageSpeakerProfile.default();

    // Assert
    expect(profile.hasVoice()).toBe(false);
  });

  it('reports a speaker with a sound as having a voice', () =>
  {
    // Arrange
    const profile = MessageSpeakerProfile.fromConfig({ voiceSeName: 'Cursor1' });

    // Act & Assert
    expect(profile.hasVoice()).toBe(true);
  });

  it('leaves every field at its default when the config entry is empty', () =>
  {
    // Arrange & Act
    const profile = MessageSpeakerProfile.fromConfig({});

    // Assert
    expect(profile.voiceSeName).toBe('');
    expect(profile.voiceVolume).toBe(90);
    expect(profile.voicePitch).toBe(100);
    expect(profile.voicePan).toBe(0);
    expect(profile.voiceStride).toBe(2);
    expect(profile.framesPerCharacter).toBe(1);
  });

  it('reads every field the config entry does supply', () =>
  {
    // Arrange
    const entry = fullConfigEntry();

    // Act
    const profile = MessageSpeakerProfile.fromConfig(entry);

    // Assert
    expect(profile.voiceSeName).toBe('Cursor1');
    expect(profile.voiceVolume).toBe(55);
    expect(profile.voicePitch).toBe(70);
    expect(profile.voicePan).toBe(-20);
    expect(profile.voiceStride).toBe(4);
    expect(profile.framesPerCharacter).toBe(3);
    expect(profile.punctuationFrames).toEqual({ '.': 14 });
    expect(profile.baselineEffects).toEqual([ 'wave' ]);
  });

  it('keeps a configured zero rather than falling back over it', () =>
  {
    // Arrange
    // zero is a legitimate pan and a legitimate volume, and is also the value a careless fallback
    // treats as absent - a muted speaker configured deliberately must stay muted.
    const entry = { voiceVolume: 0, voicePan: 0 };

    // Act
    const profile = MessageSpeakerProfile.fromConfig(entry);

    // Assert
    expect(profile.voiceVolume).toBe(0);
    expect(profile.voicePan).toBe(0);
  });

  it('builds the sound effect in the shape the engine audio expects', () =>
  {
    // Arrange
    const profile = MessageSpeakerProfile.fromConfig(fullConfigEntry());

    // Act
    const se = profile.voiceSe();

    // Assert
    expect(se).toEqual({ name: 'Cursor1', volume: 55, pitch: 70, pan: -20 });
  });
});
//endregion plugins/message/core/__models/message-speaker-profile.test.js