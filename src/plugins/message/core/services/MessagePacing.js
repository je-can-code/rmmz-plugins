//region MessagePacing
/**
 * How long a speaker lingers on each character they say.
 *
 * The engine reveals message text at exactly one character per frame and has no opinion about
 * which character it is, so a full stop costs the same as the letter before it and a sentence
 * arrives as an even scroll. Reading aloud does not work like that, and neither does characterisation
 * - most of what separates a weary old merchant from an excitable one is where and how long they
 * stop.
 *
 * Everything here is measured in **extra** frames rather than total ones, because that is what the
 * consumer can safely apply. The engine's per-character wait is a shared counter that an author's
 * own `\.` and `\|` also write to, and it is assigned rather than accumulated - so pacing that set
 * a total would silently eat a deliberate pause written beside it. Adding a difference composes
 * with the author instead of overruling them.
 */
class MessagePacing
{
  /**
   * The engine's own pace, in frames per character.
   *
   * One, and the number matters: a profile asking for one frame per character is asking for no
   * change at all, which is what an unprofiled speaker must get.
   * @type {number}
   */
  static EnginePace = 1;

  /**
   * How many extra frames to spend on one character, beyond what the engine already spends.
   * @param {string} character The character about to be revealed.
   * @param {MessageSpeakerProfile} profile The profile of whoever is speaking.
   * @returns {number} Frames to add to the pending wait; zero leaves the engine's pace alone.
   */
  static extraFramesFor(character, profile)
  {
    const paceFrames = profile.framesPerCharacter - MessagePacing.EnginePace;
    const punctuationFrames = profile.punctuationFrames[ character ] ?? 0;
    const extraFrames = paceFrames + punctuationFrames;

    // a profile asking to go faster than the engine can is asking for the engine's pace; there is
    // no way to reveal a character in less than the frame it is drawn on.
    if (extraFrames < 0) return 0;

    return extraFrames;
  }
}

export default MessagePacing;
//endregion MessagePacing