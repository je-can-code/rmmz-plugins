//region MessageVoiceSelector
import MessageNoise from './MessageNoise.js';

/**
 * Decides when a speaker's voice sounds as their words appear.
 *
 * The effect being aimed at is the one Animal Crossing built an entire cast out of: a single short
 * blip, repeated as the text arrives, pitched and spaced per character. It is a remarkably cheap
 * way to make somebody recognisable before they have said anything in particular, and it costs the
 * writing nothing.
 *
 * Most of the work is deciding when *not* to play. A sound on every glyph is a buzz rather than a
 * voice; a sound on a space is a voice that talks through the gaps; and a sound on the full stop
 * lands on top of the pause the pacing just inserted, which is the one moment the line is supposed
 * to be quiet. What remains after those three exclusions reads as speech.
 */
class MessageVoiceSelector
{
  /**
   * Characters that pass silently, however loud the speaker is.
   *
   * Whitespace because a gap is not a sound, and terminal punctuation because the pacing has just
   * put a beat there on purpose - a blip would be the only thing audible during the pause it is
   * meant to create.
   * @type {string}
   */
  static VoicelessCharacters = ' \n\t.,!?;:…';

  /**
   * The stride at or below which every eligible character is voiced.
   *
   * One means "every character", and so does zero - a config asking for a blip more often than
   * once per character is asking for the most often there is, rather than for a division nobody
   * can hear the result of.
   * @type {number}
   */
  static ContinuousStride = 1;

  /**
   * A large odd multiplier spreading consecutive glyph indices across the hash space.
   * @type {number}
   */
  static PitchSalt = 40503;

  /**
   * The lowest pitch the engine's audio accepts.
   * @type {number}
   */
  static MinimumPitch = 50;

  /**
   * The highest pitch the engine's audio accepts.
   * @type {number}
   */
  static MaximumPitch = 150;

  /**
   * The sound this speaker makes as the given character appears, if any.
   * @param {number} glyphIndex The character's position in the message.
   * @param {string} character The character about to be revealed.
   * @param {MessageSpeakerProfile} profile The profile of whoever is speaking.
   * @returns {?{name: string, volume: number, pitch: number, pan: number}} The sound to play, or
   * null when this character passes silently.
   */
  static selectFor(glyphIndex, character, profile)
  {
    // narration, signs and anyone without a profile have no mouth.
    if (profile.hasVoice() === false) return null;

    if (MessageVoiceSelector.isVoiceless(character) === true) return null;

    if (MessageVoiceSelector.isSkippedByStride(glyphIndex, profile.voiceStride) === true) return null;

    const pitch = MessageVoiceSelector.pitchFor(glyphIndex, profile);

    return profile.voiceSe(pitch);
  }

  /**
   * The pitch this particular blip sounds at.
   *
   * Wandering rather than fixed, because one sound repeated at one pitch is a metronome however
   * carefully that pitch was chosen. A few points either side of centre, differently for each blip,
   * is the whole difference between a tone and somebody speaking - and it has to be reproducible,
   * so it comes from a hash of the glyph's position rather than from chance.
   * @param {number} glyphIndex The character's position in the message.
   * @param {MessageSpeakerProfile} profile The profile of whoever is speaking.
   * @returns {number}
   */
  static pitchFor(glyphIndex, profile)
  {
    // a speaker who has not asked to wander needs no special case: a variance of zero scales the
    // swing to nothing and the base pitch falls straight out of the arithmetic below. Guarding for
    // it would only change what happens to a base pitch outside the engine's range, and clamping
    // that is the better answer anyway.

    // offset before multiplying: the very first glyph would otherwise seed the hash with zero,
    // which lands on the exact bottom of the swing - so every line in the game would open on the
    // same low note, identically, forever.
    const swing = MessageNoise.signedUnit((glyphIndex + 1) * MessageVoiceSelector.PitchSalt);
    const wandered = profile.voicePitch + Math.round(profile.voicePitchVariance * swing);

    // held inside what the engine's audio will actually accept, in plain arithmetic rather than
    // through `Number.prototype.clamp` - that is an engine polyfill, and this service is tested on
    // its own where the engine has never been loaded.
    const notTooLow = Math.max(wandered, MessageVoiceSelector.MinimumPitch);

    return Math.min(notTooLow, MessageVoiceSelector.MaximumPitch);
  }

  /**
   * Whether a character passes silently regardless of who is speaking.
   * @param {string} character The character about to be revealed.
   * @returns {boolean}
   */
  static isVoiceless(character)
  {
    return MessageVoiceSelector.VoicelessCharacters.includes(character);
  }

  /**
   * Whether this character falls between blips rather than on one.
   * @param {number} glyphIndex The character's position in the message.
   * @param {number} stride How many characters pass between one blip and the next.
   * @returns {boolean}
   */
  static isSkippedByStride(glyphIndex, stride)
  {
    // at or below one there is nothing to skip, and a remainder by zero would answer NaN - which
    // compares false against everything and would silence the speaker entirely.
    if (stride <= MessageVoiceSelector.ContinuousStride) return false;

    return (glyphIndex % stride) !== 0;
  }
}

export default MessageVoiceSelector;
//endregion MessageVoiceSelector