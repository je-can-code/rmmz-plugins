//region plugins/message/core/services/message-profile-resolver.test.js
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import MessageProfileResolver
  from '../../../../../src/plugins/message/core/services/MessageProfileResolver.js';

/**
 * Resolution picks one voice out of a cast, so every fixture here holds more than one speaker and
 * more than one face. With a single entry loaded, "found the right profile" and "found the only
 * profile" are the same program, and a resolver that had degraded into the second would give the
 * whole game one voice while passing a test per branch.
 *
 * The name keys are written as the literal escape codes an author types into the Name field,
 * because that is what the field actually contains - the message window resolves `\N[1]` into an
 * actor's name when it draws, and a config keyed by the rendered name would match nothing.
 */
describe('J-Message MessageProfileResolver (direct src import)', () =>
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
   * A config with two named speakers, two faces on one shared sheet, and a distinct default.
   * @returns {object}
   */
  function twoSpeakerConfig()
  {
    return {
      defaultProfile: { framesPerCharacter: 9 },
      bySpeakerName: {
        '\\N[1]': { voiceSeName: 'Jerald', framesPerCharacter: 1 },
        '\\N[2]': { voiceSeName: 'Rupert', framesPerCharacter: 3 },
      },
      byFace: {
        'People2:0': { voiceSeName: 'Innkeeper' },
        'People2:5': { voiceSeName: 'Blacksmith' },
      },
    };
  }

  beforeEach(() =>
  {
    MessageProfileResolver.load(twoSpeakerConfig());
  });

  it('resolves a speaker by the literal contents of the Name field', () =>
  {
    // Arrange & Act
    const profile = MessageProfileResolver.resolve('\\N[2]', '', 0);

    // Assert
    expect(profile.voiceSeName).toBe('Rupert');
    expect(profile.framesPerCharacter).toBe(3);
  });

  it('distinguishes one named speaker from another', () =>
  {
    // Arrange & Act
    const profile = MessageProfileResolver.resolve('\\N[1]', '', 0);

    // Assert
    expect(profile.voiceSeName).toBe('Jerald');
  });

  it('falls through to the face when the Name field names nobody known', () =>
  {
    // Arrange & Act
    const profile = MessageProfileResolver.resolve('', 'People2', 5);

    // Assert
    expect(profile.voiceSeName).toBe('Blacksmith');
  });

  it('distinguishes two people sharing one face sheet by their index', () =>
  {
    // Arrange & Act
    const profile = MessageProfileResolver.resolve('', 'People2', 0);

    // Assert
    expect(profile.voiceSeName).toBe('Innkeeper');
  });

  it('prefers the name over the face when a message carries both', () =>
  {
    // Arrange & Act
    // the name is the deliberate statement of who is talking; the face is the fallback for lines
    // where nobody wrote one.
    const profile = MessageProfileResolver.resolve('\\N[1]', 'People2', 0);

    // Assert
    expect(profile.voiceSeName).toBe('Jerald');
  });

  it('hands back the default profile when neither the name nor the face is known', () =>
  {
    // Arrange & Act
    const profile = MessageProfileResolver.resolve('Some Passing Stranger', 'Actor3', 2);

    // Assert
    expect(profile.framesPerCharacter).toBe(9);
    expect(profile.hasVoice()).toBe(false);
  });

  it('hands back the default profile for a line with no speaker and no face at all', () =>
  {
    // Arrange & Act
    // narration and signposts, which correctly have no voice.
    const profile = MessageProfileResolver.resolve('', '', 0);

    // Assert
    expect(profile.framesPerCharacter).toBe(9);
  });

  it('builds the face key from the sheet and the index together', () =>
  {
    // Arrange & Act
    const key = MessageProfileResolver.faceKey('People2', 5);

    // Assert
    expect(key).toBe('People2:5');
  });

  it('forgets a speaker who is no longer in a reloaded config', () =>
  {
    // Arrange
    const trimmedConfig = {
      defaultProfile: { framesPerCharacter: 9 },
      bySpeakerName: { '\\N[1]': { voiceSeName: 'Jerald' } },
      byFace: {},
    };

    // Act
    MessageProfileResolver.load(trimmedConfig);
    const profile = MessageProfileResolver.resolve('\\N[2]', '', 0);

    // Assert
    expect(profile.voiceSeName).not.toBe('Rupert');
    expect(profile.framesPerCharacter).toBe(9);
  });

  it('accepts a config that omits the name and face sections entirely', () =>
  {
    // Arrange
    const sparseConfig = { defaultProfile: { framesPerCharacter: 4 } };

    // Act
    MessageProfileResolver.load(sparseConfig);
    const profile = MessageProfileResolver.resolve('\\N[1]', 'People2', 0);

    // Assert
    expect(profile.framesPerCharacter).toBe(4);
  });

  it('leaves unidentified speakers at the engine pace when the config omits a default', () =>
  {
    // Arrange
    const noDefaultConfig = { bySpeakerName: { '\\N[1]': { voiceSeName: 'Jerald' } } };

    // Act
    MessageProfileResolver.load(noDefaultConfig);
    const profile = MessageProfileResolver.resolve('nobody', '', 0);

    // Assert
    expect(profile.framesPerCharacter).toBe(1);
    expect(profile.hasVoice()).toBe(false);
  });
});
//endregion plugins/message/core/services/message-profile-resolver.test.js