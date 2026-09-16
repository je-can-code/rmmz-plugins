//region ChatterManager
import ChatterLinePicker from '../services/ChatterLinePicker.js';
import ChatterProfile from '../__models/ChatterProfile.js';
import ChatterScheduler from '../services/ChatterScheduler.js';
import ChatterSession from '../__models/ChatterSession.js';
import ChatterState from '../__models/ChatterState.js';
import ChatterTagParser from '../services/ChatterTagParser.js';

/**
 * Who is muttering, who is resting, and who is waiting for their moment.
 *
 * Holds data and never sprites, exactly as the spent-bubble manager does. A scene can be torn down
 * and rebuilt - which happens on every menu, every battle, every map transfer - and a line already
 * in progress comes back looking the same, because nothing that was on screen was ever the record of
 * it.
 *
 * **Keyed on a target token rather than an event id.** Chatter declared by a page is `e<id>`, which
 * is the same grammar `\pop` speaks, and it has to be: a forced line can name `player` or `a1`, and
 * neither of those is an event. One key space means one resolver, and the resolver already knows how
 * to turn any of those into something with a position on screen.
 */
class ChatterManager
{
  /**
   * The target naming whichever event is running the command.
   * @type {string}
   */
  static SelfToken = 'self';

  /**
   * The letter introducing an event id in a target token.
   * @type {string}
   */
  static EventPrefix = 'e';

  /**
   * The answer when a token names nobody currently standing on this map.
   *
   * Negative because a real distance never is, so nothing downstream can mistake it for a character
   * standing very close.
   * @type {number}
   */
  static NoDistance = -1;

  /**
   * Everything the system remembers, keyed by target token.
   * @type {Map<string, ChatterState>}
   */
  static #states = new Map();

  /**
   * Rewrites a target token into the form this manager keys on.
   *
   * `self` is the one form whose meaning depends on where it was written, so it is resolved at the
   * edges rather than carried inward. Without that, a page declaring chatter under `e12` and a
   * message popping `\pop[self]` from inside event twelve would be two different characters as far
   * as this is concerned, and talking to somebody would not stop them muttering.
   * @param {string} token The target as it was authored.
   * @param {number} hostEventId The event whose page is running, for `self`.
   * @returns {string}
   */
  static normalizeToken(token, hostEventId)
  {
    const normalized = token.trim()
      .toLowerCase();

    if (normalized !== ChatterManager.SelfToken) return normalized;

    return `${ChatterManager.EventPrefix}${hostEventId}`;
  }

  /**
   * The token a given event declares its chatter under.
   * @param {number} eventId The id of the event on the current map.
   * @returns {string}
   */
  static eventToken(eventId)
  {
    return `${ChatterManager.EventPrefix}${eventId}`;
  }

  /**
   * Records what a character's active page says about their chatter.
   *
   * Called far more often than a page actually changes - the engine re-runs page setup for every
   * event on the map whenever any self-switch flips - so this only ever replaces the profile. Timers
   * and anything being said right now are left exactly as they were, which is what keeps a self
   * switch somewhere across the map from resetting a line mid-sentence.
   * @param {string} token The target token this character chatters under.
   * @param {ChatterProfile} profile Their newly-settled profile.
   */
  static declare(token, profile)
  {
    // a page carrying no lines is how chatter is switched off: page two of a character who has
    // stopped being chatty simply omits the tags, and whatever they were saying stops with it.
    if (profile.hasLines() === false)
    {
      ChatterManager.#states.delete(token);

      return;
    }

    const existing = ChatterManager.#states.get(token);

    if (existing === undefined)
    {
      ChatterManager.#states.set(token, new ChatterState(profile));

      return;
    }

    existing.setProfile(profile);
  }

  /**
   * The state held for a token, creating one if this is the first anybody has heard of it.
   *
   * A forced line can name somebody no page ever declared - the player, an actor, a fixed point -
   * and they still need somewhere to keep the line while it is being said.
   * @param {string} token The target token.
   * @returns {ChatterState}
   */
  static stateFor(token)
  {
    const existing = ChatterManager.#states.get(token);

    if (existing !== undefined) return existing;

    const state = new ChatterState(ChatterTagParser.configuredProfile());
    ChatterManager.#states.set(token, state);

    return state;
  }

  /**
   * Every line currently being said, with the token of whoever is saying it.
   *
   * This is what the layer on the map diffs its sprites against, so a bubble is built for a line
   * that has appeared and dropped for one that has ended, with nothing having to tell it either.
   * @returns {Array<[string, ChatterSession]>}
   */
  static liveSessions()
  {
    const live = [];

    ChatterManager.#states.forEach((state, token) =>
    {
      if (state.isSpeaking() === false) return;

      live.push([ token, state.session() ]);
    });

    return live;
  }

  /**
   * Whether anybody is saying anything at all right now.
   * @returns {boolean}
   */
  static isQuiet()
  {
    return ChatterManager.liveSessions().length === 0;
  }

  /**
   * Forgets everything, including anything being said.
   *
   * Called when the map changes, because every token was naming something on the old one.
   */
  static clear()
  {
    ChatterManager.#states = new Map();
  }

  /**
   * Makes a character say a specific line, regardless of what the ambient rules would have allowed.
   *
   * This is how a scene has somebody mutter in the background without blocking it - a real message
   * would stop the interpreter and take the player's input, which is the one thing chatter can never
   * do.
   * @param {string} token The target token of whoever should speak.
   * @param {string} line What they should say.
   * @param {object} values Whatever the command overrode, with anything it left blank absent.
   * @param {boolean} [persistent] Whether it survives a message opening above the same character.
   */
  static force(token, line, values, persistent = false)
  {
    // a token naming nobody on this map produces silence rather than a bubble pointing at nothing.
    // Declined here rather than at the command, because a line nobody can see would never be typed
    // out, would therefore never finish, and would sit on the books until the map changed.
    if (ChatterManager.hasTarget(token) === false) return;

    const state = ChatterManager.stateFor(token);
    const profile = ChatterProfile.overriddenBy(state.profile(), values);
    const session = new ChatterSession(line, profile, true, profile.duration(), persistent);

    state.setSession(session);
  }

  /**
   * Stops a character talking, whatever they were in the middle of.
   *
   * Used when a real message opens above them: somebody you have started a conversation with stops
   * muttering to themselves, while the shopkeeper two doors down carries on.
   *
   * A character cannot ordinarily be muttering to themselves and delivering dialogue at the same
   * time, because the two bubbles would land in the same place - so this cuts a forced line as
   * readily as an idle one. The exception is a line a scene explicitly asked to keep, where somebody
   * has already decided where each of the two goes.
   * @param {string} token The target token of whoever should stop.
   */
  static silence(token)
  {
    const state = ChatterManager.#states.get(token);

    // by far the common case - most messages in a game are spoken by somebody who never chatters.
    if (state === undefined) return;

    if (state.isSpeaking() === false) return;

    const session = state.session();

    // a thought somebody is holding while they talk. Kept on screen alongside the dialogue, which is
    // the whole reason the flag exists.
    if (session.isPersistent() === true) return;

    ChatterManager.endSession(state);
  }

  /**
   * Stops every line a character started on their own, leaving forced ones alone.
   *
   * A cutscene does not get heckled. This cuts rather than merely blocking new lines, because a
   * scene routinely transfers the player or walks them away, and a line left running would be cut a
   * moment later by the earshot rule anyway - at a worse moment, often through a screen fade.
   */
  static silenceAutomatic()
  {
    ChatterManager.#states.forEach(state =>
    {
      if (state.isSpeaking() === false) return;

      const session = state.session();

      if (session.isForced() === true) return;

      ChatterManager.endSession(state);
    });
  }

  /**
   * Advances every character's clock by one frame.
   */
  static update()
  {
    // an event on the map has the floor. Asked once rather than per character, because the answer is
    // about the map rather than about anybody standing on it.
    const isSceneRunning = $gameMap.isEventRunning();

    if (isSceneRunning === true)
    {
      ChatterManager.silenceAutomatic();
    }

    ChatterManager.#states.forEach((state, token) =>
    {
      ChatterManager.updateState(token, state, isSceneRunning);
    });
  }

  /**
   * Advances one character's clock by one frame.
   * @param {string} token The target token of the character.
   * @param {ChatterState} state Everything remembered about them.
   * @param {boolean} isSceneRunning Whether an event currently has the floor.
   */
  static updateState(token, state, isSceneRunning)
  {
    if (state.isSpeaking() === true)
    {
      ChatterManager.updateSession(token, state);

      return;
    }

    ChatterManager.updateSilence(token, state, isSceneRunning);
  }

  /**
   * Advances the line a character is currently saying.
   * @param {string} token The target token of the character.
   * @param {ChatterState} state Everything remembered about them.
   */
  static updateSession(token, state)
  {
    const session = state.session();

    if (ChatterManager.hasWalkedOutOfEarshot(token, state, session) === true)
    {
      ChatterManager.endSession(state);

      return;
    }

    // the bubble is what types the line out, so the bubble is what says when it has finished. Until
    // then the line has not started its time on screen at all - a long one has to be readable for as
    // long as a short one, and measuring from the moment it appeared would give it less.
    if (session.hasRevealed() === false) return;

    session.setDurationRemaining(session.durationRemaining() - 1);

    if (session.isFinished() === false) return;

    ChatterManager.endSession(state);
  }

  /**
   * Whether the player has wandered away from a line that is still being said.
   * @param {string} token The target token of the character.
   * @param {ChatterState} state Everything remembered about them.
   * @param {ChatterSession} session The line being said.
   * @returns {boolean}
   */
  static hasWalkedOutOfEarshot(token, state, session)
  {
    // a forced line was put there by a scene, and a scene is allowed to be heard from anywhere.
    if (session.isForced() === true) return false;

    const distance = ChatterManager.distanceTo(token);

    // the character stopped existing mid-sentence, which is as far out of earshot as it gets.
    if (distance === ChatterManager.NoDistance) return true;

    return ChatterScheduler.isWithinEarshot(distance, state.profile()) === false;
  }

  /**
   * Advances a quiet character toward their next line.
   * @param {string} token The target token of the character.
   * @param {ChatterState} state Everything remembered about them.
   * @param {boolean} isSceneRunning Whether an event currently has the floor.
   */
  static updateSilence(token, state, isSceneRunning)
  {
    if (state.cooldownRemaining() > 0)
    {
      state.setCooldownRemaining(state.cooldownRemaining() - 1);

      return;
    }

    // resting still happens during a cutscene, so a character is not left owing a full cooldown the
    // moment one ends; starting to speak does not.
    if (isSceneRunning === true) return;

    const profile = state.profile();

    // the state exists only because a plugin command made this token speak once, or because a page
    // gave them tuning and no lines. Either way there is no pool to pick from, and this is the only
    // thing standing between that and a character saying nothing over and over.
    if (profile.hasLines() === false) return;

    const distance = ChatterManager.distanceTo(token);

    // off this map, out of the party, or never there to begin with.
    if (distance === ChatterManager.NoDistance) return;

    if (state.isAwaitingDelayRoll() === true)
    {
      state.setDelayRemaining(ChatterScheduler.rollDelay(profile, Math.random));
    }

    // the wait only runs down while the player is close enough to hear how it ends. Walking into a
    // market square therefore starts the muttering over the next few seconds, rather than all of it
    // arriving on the frame somebody crossed a line on the floor.
    if (ChatterScheduler.isWithinEarshot(distance, profile) === false) return;

    state.setDelayRemaining(state.delayRemaining() - 1);

    if (ChatterScheduler.shouldSpeak(distance, profile, state.delayRemaining()) === false) return;

    ChatterManager.speak(state);
  }

  /**
   * Starts a character on a line of their own choosing.
   * @param {ChatterState} state Everything remembered about them.
   */
  static speak(state)
  {
    const profile = state.profile();
    const line = ChatterLinePicker.pick(profile.lines(), state.lastLine(), Math.random);

    // idle chatter is never persistent. Somebody muttering to themselves has not been placed there
    // by anybody, so there is nobody who decided it should share a screen with a conversation.
    const session = new ChatterSession(line, profile, false, profile.duration(), false);

    state.setLastLine(line);
    state.setSession(session);
  }

  /**
   * Takes a character's line down and starts them resting.
   * @param {ChatterState} state Everything remembered about them.
   */
  static endSession(state)
  {
    state.setSession(null);

    // the rest is measured from the end of the line rather than its beginning, so a long line is not
    // punished with a shorter silence afterwards.
    const cooldown = state.profile()
      .cooldown();
    state.setCooldownRemaining(cooldown);

    // the next wait is rolled fresh when it is next needed, which is what keeps a row of characters
    // from falling into step with each other after their first round of lines.
    state.setDelayRemaining(ChatterState.NoDelay);
  }

  /**
   * Whether a token names anybody currently standing on this map.
   * @param {string} token The target token.
   * @returns {boolean}
   */
  static hasTarget(token)
  {
    // the host event id is irrelevant here: every token this manager keys on has already had `self`
    // rewritten into the event it meant.
    const target = BubbleTargetResolver.resolve(token, 0);

    return target !== null;
  }

  /**
   * Turns a plugin command's blank-able fields into the overrides a profile merges.
   *
   * A field left blank in the editor arrives as an empty string and means "whatever this character
   * already does", so it is left out of the overrides entirely rather than passed along as a zero -
   * which is a real setting meaning something quite different.
   * @param {string} duration How long the line stays up, in frames, or empty.
   * @param {string} position Which side of the character it sits on, or empty.
   * @param {string} background What the line is drawn on, or empty.
   * @returns {object}
   */
  static overridesFrom(duration, position, background)
  {
    const overrides = {};

    if (duration !== String.empty)
    {
      overrides.duration = Number(duration);
    }

    if (position !== String.empty)
    {
      overrides.position = position;
    }

    if (background !== String.empty)
    {
      overrides.background = background;
    }

    return overrides;
  }

  /**
   * How many tiles lie between the player and whoever a token names.
   * @param {string} token The target token.
   * @returns {number} The distance in tiles, or {@link ChatterManager.NoDistance} when the token
   * names nobody standing on this map.
   */
  static distanceTo(token)
  {
    // the host event id is irrelevant here: every token this manager keys on has already had `self`
    // rewritten into the event it meant.
    const target = BubbleTargetResolver.resolve(token, 0);

    if (target === null) return ChatterManager.NoDistance;

    return $gameMap.distance($gamePlayer.x, $gamePlayer.y, target.x, target.y);
  }
}

export default ChatterManager;
//endregion ChatterManager