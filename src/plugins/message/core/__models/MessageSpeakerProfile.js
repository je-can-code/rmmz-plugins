//region MessageSpeakerProfile
/**
 * How one character's words arrive on screen.
 *
 * Everything here is a property of the *speaker* rather than of the line, which is the whole reason
 * the class exists. An author emphasising a word types a text code; a character sounding like
 * themselves should cost the author nothing at all, in any of the thousands of lines they were
 * already given. That asymmetry is the leverage: a handful of profiles reaches back across every
 * conversation already written and gives it a voice, with no line edited anywhere.
 *
 * The defaults below are deliberately the behaviour the game has today - one frame per character,
 * no sound, no motion - so a speaker nobody has written a profile for reads exactly as they always
 * did rather than as a bug.
 */
class MessageSpeakerProfile
{
  /**
   * The sound effect played as this character's letters appear, or empty for a silent speaker.
   *
   * Silence is the default and is a legitimate answer, not an oversight: narration, signs and
   * system text have no mouth, and a blip on a wooden noticeboard would be worse than nothing.
   * @type {string}
   */
  voiceSeName = String.empty;

  /**
   * How loud this character's voice is.
   * @type {number}
   */
  voiceVolume = 90;

  /**
   * The pitch this character's voice plays at.
   *
   * The single most recognisable thing about a voice made of one repeated blip - a low pitch reads
   * as large and slow, a high one as small and quick, before any other setting is touched.
   * @type {number}
   */
  voicePitch = 100;

  /**
   * How far this character's voice sits off centre.
   * @type {number}
   */
  voicePan = 0;

  /**
   * How far each blip may wander from this character's base pitch.
   *
   * The difference between a voice and a metronome. One sound repeated at one pitch reads as a
   * machine no matter how well the pitch is chosen; the same sound wandering a few points either
   * side of centre reads as somebody talking, and it is most of what Animal Crossing's cast is
   * actually made of. Zero is a flat tone, which is the default because it is what the game did
   * before anyone wrote a profile.
   * @type {number}
   */
  voicePitchVariance = 0;

  /**
   * How many characters pass between one blip and the next.
   *
   * A sound on every single letter is a buzz rather than a voice, and the engine would refuse most
   * of them anyway - {@link AudioManager.playSe} declines to start the same sound twice in one
   * frame. Spacing them out is what turns a tone into speech.
   * @type {number}
   */
  voiceStride = 2;

  /**
   * How many frames this character lingers on each letter.
   *
   * One is the engine's own pace and the default. Higher reads as deliberate or weary, and the
   * difference between a two and a three is the difference between two people who sound alike and
   * two people who do not.
   * @type {number}
   */
  framesPerCharacter = 1;

  /**
   * Extra frames spent on particular characters, by the character itself.
   *
   * What lets a sentence breathe. A comma that costs a beat and a full stop that costs several are
   * most of what separates dialogue that reads aloud from dialogue that scrolls.
   * @type {Object<string, number>}
   */
  punctuationFrames = {};

  /**
   * Effects that act on everything this character says.
   *
   * The half of the effect system an author never types. A ghost is not a line that happens to
   * wave; it is a character who always does.
   * @type {string[]}
   */
  baselineEffects = [];

  /**
   * The profile used for anyone nobody has written one for.
   *
   * Narration, signs, system text and every NPC not yet given a voice all land here, and it must
   * therefore be indistinguishable from the game as it behaves today.
   * @returns {MessageSpeakerProfile}
   */
  static default()
  {
    return new MessageSpeakerProfile();
  }

  /**
   * Builds a profile from one entry of the external config.
   *
   * Every field falls back to the class default when the config is silent about it, so an author
   * writing a profile only has to say the part that makes this character different.
   * @param {object} entry One speaker's entry from the config file.
   * @returns {MessageSpeakerProfile}
   */
  static fromConfig(entry)
  {
    const profile = new MessageSpeakerProfile();

    profile.voiceSeName = entry.voiceSeName ?? profile.voiceSeName;
    profile.voiceVolume = entry.voiceVolume ?? profile.voiceVolume;
    profile.voicePitch = entry.voicePitch ?? profile.voicePitch;
    profile.voicePan = entry.voicePan ?? profile.voicePan;
    profile.voicePitchVariance = entry.voicePitchVariance ?? profile.voicePitchVariance;
    profile.voiceStride = entry.voiceStride ?? profile.voiceStride;
    profile.framesPerCharacter = entry.framesPerCharacter ?? profile.framesPerCharacter;
    profile.punctuationFrames = entry.punctuationFrames ?? profile.punctuationFrames;
    profile.baselineEffects = entry.baselineEffects ?? profile.baselineEffects;

    return profile;
  }

  /**
   * Whether this speaker makes any sound at all as their words appear.
   * @returns {boolean}
   */
  hasVoice()
  {
    return this.voiceSeName !== String.empty;
  }

  /**
   * The sound effect object this speaker's voice plays, in the shape the engine's audio wants.
   * @param {number} [pitch] The pitch for this particular blip; defaults to this speaker's base.
   * @returns {{name: string, volume: number, pitch: number, pan: number}}
   */
  voiceSe(pitch = this.voicePitch)
  {
    return {
      name: this.voiceSeName,
      volume: this.voiceVolume,
      pitch,
      pan: this.voicePan,
    };
  }
}

export default MessageSpeakerProfile;
//endregion MessageSpeakerProfile