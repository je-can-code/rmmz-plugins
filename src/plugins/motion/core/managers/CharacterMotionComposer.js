//region CharacterMotionComposer
import MotionComposition from '../models/MotionComposition.js';
import MotionTypeRegistry from '../core/MotionTypeRegistry.js';

/**
 * Owns every character's motion: what has been declared, what is currently animating, and what the
 * sprite should look like this frame.
 *
 * Nothing motion-related lives on a character. That is unusual for this codebase, and the reason
 * is that motion is presentation with no persistence — parking it in a `WeakMap` here means there
 * is no field for the save encoder to find, no transient declaration to keep correct, and no way
 * for a future addition to end up in a savefile by accident. The failure mode is unrepresentable
 * rather than guarded against.
 *
 * A `WeakMap` also means a character that leaves the game takes its motions with it, so there is no
 * registry to sweep on a scene change and no way to leak effects across maps.
 */
class CharacterMotionComposer
{
  /**
   * Every character's motion state, keyed by the character itself.
   * @type {WeakMap<Game_CharacterBase, Object>}
   */
  static #stateByCharacter = new WeakMap();

  /**
   * The composition handed to characters that have no motion at all.
   *
   * Most characters on a map are declaring nothing, and allocating an identical all-identity
   * composition for each of them every frame is a lot of garbage for no information. Nothing
   * writes to a composition it was handed, so one instance serves everybody.
   * @type {MotionComposition}
   */
  static #emptyComposition = new MotionComposition();

  /**
   * How strongly a source's claim on a channel outranks another's.
   * @type {Map<string, number>}
   */
  static #sourcePriorities = new Map([
    [ 'combat', 4 ],
    [ 'command', 3 ],
    [ 'state', 2 ],
    [ 'page', 1 ],
  ]);

  /**
   * Declares the complete set of motions for one source on one character.
   *
   * This replaces whatever that source had declared before and leaves every other source alone,
   * which is the property that lets a state expire without disturbing an event page's ambient
   * motion.
   * @param {Game_CharacterBase} character The character that should move.
   * @param {string} sourceKey Who is declaring, ex: `page` or `state:42`.
   * @param {MotionDeclaration[]} declarations Everything that source wants, in full.
   * @param {number=} expiryFrames How long the source wants this to last; 0 means indefinitely.
   */
  static declare(character, sourceKey, declarations, expiryFrames = 0)
  {
    const state = CharacterMotionComposer.#stateFor(character);
    const previous = state.declarationsBySource.get(sourceKey);

    // the same source asking for the same things leaves the running motion alone, and saying so
    // matters: page setup re-runs on every map refresh, so rebuilding here would re-roll every
    // enemy's phase and snap the whole screen mid-breath several times a minute.
    //
    // the clock is still restarted, because a cutscene asking for another second of shaking means
    // another second from now even when the shaking never stopped.
    if (CharacterMotionComposer.#areDeclarationsIdentical(previous, declarations) === true)
    {
      CharacterMotionComposer.#scheduleExpiry(state, sourceKey, expiryFrames);

      return;
    }

    // this source withdrew a moment ago and is already back asking for the same thing, while the
    // effects it withdrew are still easing home. Take the withdrawal back rather than building a
    // second set — an effect travelling home and an effect travelling out both write the same
    // channel, and on a channel nobody claims those two values combine into one nobody asked for.
    if (CharacterMotionComposer.#reclaimWithdrawn(state, sourceKey, declarations) === true)
    {
      state.declarationsBySource.set(sourceKey, declarations);
      CharacterMotionComposer.#scheduleExpiry(state, sourceKey, expiryFrames);

      return;
    }

    // retire whatever this source had before making its new request. this clears the old clock as
    // well, which is why the new one is set afterwards rather than before.
    CharacterMotionComposer.removeDeclarations(character, sourceKey);

    // and forget anything it left winding down. a source replacing its own declarations is taking
    // the channel over rather than handing it back, so an effect still easing home from the old
    // request would compose with the new one for the length of its release.
    state.effects = state.effects
      .filter(effect => CharacterMotionComposer.#isFromSource(effect, sourceKey) === false);

    state.declarationsBySource.set(sourceKey, declarations);
    declarations.forEach(declaration => state.effects.push(CharacterMotionComposer.#buildEffect(declaration)), this);
    CharacterMotionComposer.#scheduleExpiry(state, sourceKey, expiryFrames);
  }

  /**
   * Withdraws everything one source had declared on a character.
   * @param {Game_CharacterBase} character The character to stop moving.
   * @param {string} sourceKey Who is withdrawing.
   */
  static removeDeclarations(character, sourceKey)
  {
    const state = CharacterMotionComposer.#stateFor(character);

    state.declarationsBySource.delete(sourceKey);
    state.expiryBySource.delete(sourceKey);

    // effects are asked to stop rather than dropped, because a transition holding a channel far
    // from its rest state has to travel back before it disappears or the character snaps.
    state.effects
      .filter(effect => CharacterMotionComposer.#isFromSource(effect, sourceKey))
      .forEach(effect => effect.requestRemoval());
  }

  /**
   * Withdraws every declaration on a character that came from one kind of source.
   *
   * This exists for the case where a character's whole relationship to a kind of source has changed
   * rather than one declaration within it — most of all a character that now represents somebody
   * else, which is what party cycling does to the player. Withdrawing declaration by declaration
   * cannot work there, because the thing that would know which ones to withdraw is exactly the thing
   * that just changed.
   * @param {Game_CharacterBase} character The character to clear.
   * @param {string} sourceKind The kind of source to withdraw, ex: `state`.
   */
  static removeDeclarationKind(character, sourceKind)
  {
    const state = CharacterMotionComposer.#stateFor(character);
    const keys = Array.from(state.declarationsBySource.keys());
    const matching = keys.filter(sourceKey => CharacterMotionComposer.#kindOf(sourceKey) === sourceKind);

    matching.forEach(sourceKey => CharacterMotionComposer.removeDeclarations(character, sourceKey));
  }

  /**
   * Determines whether a character has any motion worth composing.
   * @param {Game_CharacterBase} character The character to check.
   * @returns {boolean}
   */
  static hasMotion(character)
  {
    // a character nobody has ever declared a motion on has no state at all.
    if (CharacterMotionComposer.#stateByCharacter.has(character) === false) return false;

    const state = CharacterMotionComposer.#stateByCharacter.get(character);

    return state.effects.length > 0;
  }

  /**
   * Advances a character's motions by one frame and reports what its sprite should look like.
   * @param {Game_CharacterBase} character The character being drawn.
   * @returns {MotionComposition}
   */
  static compose(character)
  {
    // nothing is animating, so hand back the shared do-nothing composition.
    if (CharacterMotionComposer.hasMotion(character) === false)
    {
      return CharacterMotionComposer.#emptyComposition;
    }

    const state = CharacterMotionComposer.#stateByCharacter.get(character);

    CharacterMotionComposer.#expireElapsedSources(character, state);

    state.effects.forEach(effect => effect.tick());

    // forget anything that has finished winding down, before it can contribute again.
    state.effects = state.effects.filter(effect => effect.isDiscardable() === false);

    const composition = new MotionComposition();
    CharacterMotionComposer.#awardClaims(state.effects, composition);
    state.effects.forEach(effect => effect.applyTo(composition));

    return composition;
  }

  /**
   * Discards everything known about a character's motion.
   *
   * Nothing in core needs this — a character's state dies with the character — but a test that
   * shares a character between cases does, and so will anything that wants a hard reset.
   * @param {Game_CharacterBase} character The character to forget.
   */
  static forget(character)
  {
    CharacterMotionComposer.#stateByCharacter.delete(character);
  }

  /**
   * Records how long a source wants to last, or clears any clock it had.
   * @param {Object} state The character's motion state.
   * @param {string} sourceKey The source being scheduled.
   * @param {number} expiryFrames How long it should last; 0 means indefinitely.
   */
  static #scheduleExpiry(state, sourceKey, expiryFrames)
  {
    // an indefinite declaration is the normal case and simply has no clock.
    if (expiryFrames <= 0)
    {
      state.expiryBySource.delete(sourceKey);

      return;
    }

    state.expiryBySource.set(sourceKey, expiryFrames);
  }

  /**
   * Counts down every timed source and withdraws the ones whose time is up.
   *
   * Timed removal lives here rather than with whoever asked for it because this is the only place
   * that already counts frames. An applier states how long it wants something to last and never
   * has to run a clock of its own.
   * @param {Game_CharacterBase} character The character being composed.
   * @param {Object} state The character's motion state.
   */
  static #expireElapsedSources(character, state)
  {
    // nothing is on a clock, which is true of every ambient declaration.
    if (state.expiryBySource.size === 0) return;

    const expired = [];

    state.expiryBySource.forEach((framesRemaining, sourceKey) =>
    {
      const remaining = framesRemaining - 1;

      if (remaining <= 0)
      {
        expired.push(sourceKey);

        return;
      }

      state.expiryBySource.set(sourceKey, remaining);
    });

    expired.forEach(sourceKey => CharacterMotionComposer.removeDeclarations(character, sourceKey));
  }

  /**
   * Settles which effect owns each contested channel this frame.
   *
   * Claims are resolved up front so that a losing contribution can be discarded when it arrives
   * rather than written and then painted over. Higher-priority sources win outright, and among
   * equals the most recently declared wins, because the newest thing to happen to a character is
   * usually the thing a player is meant to notice.
   * @param {MotionEffect[]} effects Every live effect on the character.
   * @param {MotionComposition} composition The composition being built.
   */
  static #awardClaims(effects, composition)
  {
    const winningPriorities = new Map();

    effects.forEach(effect =>
    {
      const priority = CharacterMotionComposer.#priorityFor(effect);

      effect.claims()
        .forEach(channel =>
        {
          const incumbent = winningPriorities.get(channel);

          // an earlier claimant outranks this one, so it keeps the channel.
          if (incumbent !== undefined && incumbent > priority) return;

          winningPriorities.set(channel, priority);
          composition.awardClaim(channel, effect);
        });
    }, this);
  }

  /**
   * How strongly an effect's source outranks others when claiming a channel.
   *
   * Source keys carry an id for states and combat reactions, so the rank comes from the part in
   * front of the colon. An unrecognised source ranks lowest, which means a typo produces a motion
   * that composes politely rather than one that seizes a channel from everything else.
   * @param {MotionEffect} effect The effect whose source is being ranked.
   * @returns {number}
   */
  static #priorityFor(effect)
  {
    const sourceKey = effect.declaration()
      .sourceKey();
    const sourceKind = CharacterMotionComposer.#kindOf(sourceKey);

    // an unknown source is treated as ambient, the least assertive rank there is.
    if (CharacterMotionComposer.#sourcePriorities.has(sourceKind) === false) return 0;

    return CharacterMotionComposer.#sourcePriorities.get(sourceKind);
  }

  /**
   * The kind of source a key names, which is everything in front of the colon.
   *
   * Source keys carry an id for anything there can be several of at once — `state:42`, `combat:death`
   * — and the part in front is what says how the declaration should behave.
   * @param {string} sourceKey The source key to read.
   * @returns {string}
   */
  static #kindOf(sourceKey)
  {
    const [ sourceKind ] = sourceKey.split(':');

    return sourceKind;
  }

  /**
   * Resumes a source's withdrawn effects when it comes straight back asking for the same thing.
   *
   * Only an exact match resumes. A source that changed its mind about what it wants gets a fresh
   * set, because the running effects are animating toward targets nobody is asking for any more.
   * @param {Object} state The character's motion state.
   * @param {string} sourceKey The source declaring again.
   * @param {MotionDeclaration[]} declarations What it is asking for now.
   * @returns {boolean} True when the withdrawal was taken back.
   */
  static #reclaimWithdrawn(state, sourceKey, declarations)
  {
    const winding = state.effects.filter(effect => CharacterMotionComposer.#isWindingDown(effect, sourceKey));

    // nothing of this source's is still running, so there is nothing to take back.
    if (winding.length === 0) return false;

    if (winding.length !== declarations.length) return false;

    const sameRequest = winding.every((effect, index) => effect.declaration()
      .matches(declarations.at(index)));

    if (sameRequest === false) return false;

    winding.forEach(effect => effect.cancelRemoval());

    return true;
  }

  /**
   * Determines whether an effect from a source is still travelling back to its rest state.
   *
   * This is the difference between an effect that is *gone* and one that is *going*. Most motions
   * stop the instant their declaration does, and a source that re-declares over the top of one of
   * those genuinely wants a fresh start — a battler struck twice by the same weapon has to flinch
   * twice. Only a motion that parks a channel somewhere visible outlives its declaration, and only
   * that kind is worth resuming rather than rebuilding.
   * @param {MotionEffect} effect The effect being tested.
   * @param {string} sourceKey The source declaring again.
   * @returns {boolean}
   */
  static #isWindingDown(effect, sourceKey)
  {
    if (CharacterMotionComposer.#isFromSource(effect, sourceKey) === false) return false;

    if (effect.hasRemovalRequested() === false) return false;

    return effect.isDiscardable() === false;
  }

  /**
   * Determines whether an effect came from a given source.
   * @param {MotionEffect} effect The effect being tested.
   * @param {string} sourceKey The source being withdrawn.
   * @returns {boolean}
   */
  static #isFromSource(effect, sourceKey)
  {
    const effectSource = effect.declaration()
      .sourceKey();

    return effectSource === sourceKey;
  }

  /**
   * Builds the live effect for a declaration, with its configured defaults applied.
   * @param {MotionDeclaration} declaration The declaration being brought to life.
   * @returns {MotionEffect}
   */
  static #buildEffect(declaration)
  {
    const motionType = declaration.type();
    const configuredDefaults = J.MOTION.Metadata.defaultsForMotionType(motionType);

    return MotionTypeRegistry.buildEffect(declaration, configuredDefaults);
  }

  /**
   * Determines whether a source is asking for exactly what it already asked for.
   * @param {MotionDeclaration[]} previous What that source declared last time, if anything.
   * @param {MotionDeclaration[]} incoming What it is declaring now.
   * @returns {boolean}
   */
  static #areDeclarationsIdentical(previous, incoming)
  {
    // this source has never declared anything before, so there is nothing to match.
    if (previous === undefined) return false;

    if (previous.length !== incoming.length) return false;

    return previous.every((declaration, index) => declaration.matches(incoming.at(index)));
  }

  /**
   * Gets a character's motion state, creating it on first use.
   * @param {Game_CharacterBase} character The character.
   * @returns {Object} The state.
   */
  static #stateFor(character)
  {
    if (CharacterMotionComposer.#stateByCharacter.has(character) === false)
    {
      CharacterMotionComposer.#stateByCharacter.set(character, {
        declarationsBySource: new Map(),
        expiryBySource: new Map(),
        effects: [],
      });
    }

    return CharacterMotionComposer.#stateByCharacter.get(character);
  }
}

export default CharacterMotionComposer;
//endregion CharacterMotionComposer