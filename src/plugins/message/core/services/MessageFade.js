//region MessageFade
import MessageConfig from './MessageConfig.js';

/**
 * How a message leaves the screen.
 *
 * The engine's own answer is a vertical collapse over eight frames, and it has a flaw that is easy
 * to miss and impossible to unsee: a window's client area is hidden the instant its openness drops
 * below full, so the *text* disappears on the first frame of that animation and what plays out is an
 * empty frame folding up. On anything drawn without a frame - a bubble, say - there is nothing left
 * to watch at all, and a message simply blinks out of existence.
 *
 * So messages fade instead. The whole thing, letters included, goes translucent over about half a
 * second and is gone. Nothing about it is load-bearing; it is entirely about a line of dialogue
 * being allowed to finish rather than being switched off.
 *
 * **The length is a single knob, in one place, shared by everything that fades.** A bubble, the line
 * behind it in the same conversation, and an NPC muttering across the square all have to leave at
 * the same rate or the screen reads as three systems rather than one.
 */
class MessageFade
{
  /**
   * The section of J-Message's external config these settings live in.
   * @type {string}
   */
  static ConfigSection = 'fade';

  /**
   * How many frames a message takes to fade, before any project has said otherwise.
   *
   * About half a second. Long enough to read as a deliberate exit rather than a dropped frame, short
   * enough that somebody mashing through a conversation never waits on it.
   * @type {number}
   */
  static DefaultFrames = 30;

  /**
   * How many frames a message takes to fade in this project.
   * @returns {number}
   */
  static frames()
  {
    const section = MessageConfig.section(MessageFade.ConfigSection);

    return section.frames ?? MessageFade.DefaultFrames;
  }

  /**
   * How opaque a fading message is after a given number of frames.
   *
   * Linear on purpose. An eased fade reads as a thing being animated, and the point of this is for
   * nobody to notice anything happened at all beyond the message having finished.
   * A fade configured to take no frames at all answers zero from its very first tick, which is the
   * old instant behaviour and is what a project asking for no fade meant. Nothing special is done to
   * arrange that; a fade with nothing left has nothing left however it got there.
   * @param {number} elapsed How many frames the fade has been running.
   * @param {number} frames How many frames the whole fade takes.
   * @returns {number} The opacity, from one down to zero.
   */
  static alphaAt(elapsed, frames)
  {
    const remaining = frames - elapsed;

    if (remaining <= 0) return 0;

    return remaining / frames;
  }

  /**
   * Whether a fade that has run this long is finished.
   * @param {number} elapsed How many frames the fade has been running.
   * @param {number} frames How many frames the whole fade takes.
   * @returns {boolean}
   */
  static isFinished(elapsed, frames)
  {
    return elapsed >= frames;
  }
}

export default MessageFade;
//endregion MessageFade