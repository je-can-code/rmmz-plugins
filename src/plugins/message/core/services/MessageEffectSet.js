//region MessageEffectSet
/**
 * Decides which effects are acting on the text at any point in a message.
 *
 * Two sources feed in and they are deliberately kept apart. A speaker's **baseline** comes from
 * their profile and describes how that character always sounds on the page - a ghost whose words
 * never sit still, a drunk whose letters wander. A **span** comes from a text code the author typed
 * and describes an emphasis in this particular line. Baseline is who is talking; span is what they
 * are doing right now.
 *
 * Holding them in one set and toggling within it looks simpler and is wrong in a way that only
 * shows up in the writing. `\~` is a toggle, so an author reaching for a wave inside a line already
 * waving would *switch the character's own voice off* for that span - the exact opposite of the
 * emphasis they were adding. Keeping the two apart makes a baseline effect immune to its own toggle
 * by construction rather than by a special case somebody has to remember, and the whole rule
 * becomes "the union of who you are and what you are doing".
 *
 * Spans are also the half that resets. An author who opens `\~` and never closes it has ended that
 * emphasis at the page break whether they said so or not; the speaker's baseline, being a property
 * of the speaker, survives it.
 */
class MessageEffectSet
{
  /**
   * The effects acting on text right now.
   *
   * Baseline first, then spans, so a reader of the resulting list sees identity before emphasis.
   * Duplicates are collapsed: an author emphasising something already in the baseline has said
   * nothing new, and an effect applied twice would displace the glyph twice as far.
   * @param {string[]} baselineEffects The speaker's own effects, from their profile.
   * @param {Set<string>} spanEffects The effects the author has opened and not yet closed.
   * @returns {string[]}
   */
  static resolve(baselineEffects, spanEffects)
  {
    const resolved = [ ...baselineEffects ];

    spanEffects.forEach(name =>
    {
      // already present from the baseline, so the author's toggle adds nothing to apply.
      if (resolved.includes(name)) return;

      resolved.push(name);
    });

    return resolved;
  }

  /**
   * Flips one span effect on or off, the way the text code that names it does.
   * @param {Set<string>} spanEffects The effects the author has opened and not yet closed.
   * @param {string} name The effect the author just toggled.
   */
  static toggle(spanEffects, name)
  {
    if (spanEffects.has(name) === true)
    {
      spanEffects.delete(name);
      return;
    }

    spanEffects.add(name);
  }
}

export default MessageEffectSet;
//endregion MessageEffectSet