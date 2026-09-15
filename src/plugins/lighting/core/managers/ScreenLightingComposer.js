//region ScreenLightingComposer
import LightingChannels from '../core/LightingChannels.js';
import LightingComposition from '../models/LightingComposition.js';
import LightingEasing from '../core/LightingEasing.js';

/**
 * Owns the screen's light: what has been declared, what is currently easing, and what the renderer
 * should show this frame.
 *
 * Nothing lighting-related lives on a game object. That is deliberate and it is the whole reason
 * this plugin adds nothing to a savefile: there is no field for the save encoder to find, no
 * transient to keep correct, and no way for a future addition to end up persisted by accident. The
 * failure mode is unrepresentable rather than guarded against.
 *
 * Everything arrives here as a declaration carrying a source key, and removal is always by source.
 * `removeDeclarations('time')` cannot touch a map's ambient, and a cutscene handing the screen back
 * cannot erase the fact that the cave it happened in is dark. That property is what lets the clock,
 * a map, an event page, the party leader's lantern and an event command all reach the same screen
 * while remaining completely ignorant of one another.
 */
class ScreenLightingComposer
{
  /**
   * How strongly a source's claim on a channel outranks another's.
   *
   * The order is how transient each kind is, because the more fleeting a declaration is the more
   * likely it is the thing a player is meant to be reading right now. A map's darkness is what a
   * place is forever, an event page's torch lasts as long as that page, the leader's lantern lasts
   * as long as they carry it, the clock's night lasts an hour, and a cutscene's tint is happening
   * this second.
   * @type {Map<string, number>}
   */
  static #sourcePriorities = new Map([
    [ 'command', 5 ],
    [ 'time', 4 ],
    [ 'player', 3 ],
    [ 'page', 2 ],
    [ 'map', 1 ],
  ]);

  /**
   * How long a withdrawal takes to travel home when nothing says otherwise.
   *
   * One frame, because an immediate handover is what the engine has always done: a source that
   * never stated a duration is not asking for a journey.
   * @type {number}
   */
  static DEFAULT_RELEASE_FRAMES = 1;

  /**
   * Every source's declared tone, keyed by who declared it.
   * @type {Map<string, ToneDeclaration>}
   */
  static #toneBySource = new Map();

  /**
   * Every source's declared ambient, keyed by who declared it.
   * @type {Map<string, AmbientDeclaration>}
   */
  static #ambientBySource = new Map();

  /**
   * Every source's declared lights, keyed by who declared them.
   * @type {Map<string, LightDeclaration[]>}
   */
  static #lightsBySource = new Map();

  /**
   * The tone the screen is actually showing right now, partway through whatever journey it is on.
   * @type {number[]}
   */
  static #currentTone = [ 0, 0, 0, 0 ];

  /**
   * The tone the screen is currently travelling toward.
   * @type {number[]}
   */
  static #toneDestination = [ 0, 0, 0, 0 ];

  /**
   * How many frames are left in the current tone journey.
   * @type {number}
   */
  static #toneFramesRemaining = 0;

  /**
   * How long the next withdrawal should take to travel home.
   *
   * Captured when a source withdraws rather than read when the journey starts, because by the time
   * the composer notices the destination changed, the declaration that knew how long it wanted to
   * take is already gone.
   * @type {number}
   */
  static #releaseFrames = ScreenLightingComposer.DEFAULT_RELEASE_FRAMES;

  /**
   * The composition built this frame.
   * @type {LightingComposition}
   */
  static #composition = new LightingComposition([ 0, 0, 0, 0 ], 0, [ 0, 0, 0 ], []);

  /**
   * The frame the current composition was built on.
   *
   * Composition is idempotent within a frame, and this is what makes it so. Two entirely separate
   * consumers ask for it - the colour filter on the base sprite and the mask sprite - and they run
   * at different points in the render walk, in an order that depends on which plugins are installed.
   * Advancing the easing on whichever asked first would make the fade speed depend on the plugin
   * list, so instead the first caller of a frame does the work and the second is handed the answer.
   * @type {number}
   */
  static #composedFrame = -1;

  /**
   * Declares the tone one source wants the screen cast in.
   *
   * A neutral tone is a withdrawal rather than a request. That is how the engine has always spelled
   * "I am finished" - an event tinting back to `[0,0,0,0]` is handing the screen back, not asking
   * for the world to become colourless - and honouring it is what lets the clock's night resume
   * after a cutscene instead of being wiped flat until the next hour.
   * @param {string} sourceKey Who is declaring, ex: `command`.
   * @param {ToneDeclaration} declaration What that source wants.
   */
  static declareTone(sourceKey, declaration)
  {
    if (declaration.isNeutral() === true)
    {
      ScreenLightingComposer.#releaseFrames = declaration.durationFrames();
      ScreenLightingComposer.#toneBySource.delete(sourceKey);

      return;
    }

    const previous = ScreenLightingComposer.#toneBySource.get(sourceKey);

    // the same source asking for the same thing leaves the running journey alone. saying so matters:
    // an event that re-tints to the colour it already asked for should not restart the fade.
    if (previous !== undefined && previous.matches(declaration) === true) return;

    ScreenLightingComposer.#toneBySource.set(sourceKey, declaration);
  }

  /**
   * Declares how dark one source says the scene is.
   * @param {string} sourceKey Who is declaring, ex: `map`.
   * @param {AmbientDeclaration} declaration What that source wants.
   */
  static declareAmbient(sourceKey, declaration)
  {
    const previous = ScreenLightingComposer.#ambientBySource.get(sourceKey);

    // map arrival re-reads the note on every transfer, every save load and every return from the
    // menu, and without this each of those would count as a change.
    if (previous !== undefined && previous.matches(declaration) === true) return;

    ScreenLightingComposer.#ambientBySource.set(sourceKey, declaration);
  }

  /**
   * Declares the complete set of lights one source is responsible for.
   *
   * This replaces whatever that source had before and leaves every other source alone, which is the
   * property that lets a torch go out without disturbing the lantern the player is holding.
   * @param {string} sourceKey Who is declaring, ex: `page`.
   * @param {LightDeclaration[]} declarations Everything that source wants, in full.
   */
  static declareLights(sourceKey, declarations)
  {
    const previous = ScreenLightingComposer.#lightsBySource.get(sourceKey);

    // page setup re-runs for every event on the map whenever a single self-switch flips anywhere,
    // so this comparison is what keeps a room of torches from being rebuilt several times a minute.
    if (ScreenLightingComposer.#areLightsIdentical(previous, declarations) === true) return;

    ScreenLightingComposer.#lightsBySource.set(sourceKey, declarations);
  }

  /**
   * Withdraws everything one source had declared.
   * @param {string} sourceKey Who is withdrawing.
   */
  static removeDeclarations(sourceKey)
  {
    const outgoing = ScreenLightingComposer.#toneBySource.get(sourceKey);

    // a source withdrawing its tone still gets to say how long the handover takes.
    if (outgoing !== undefined)
    {
      ScreenLightingComposer.#releaseFrames = outgoing.durationFrames();
    }

    ScreenLightingComposer.#toneBySource.delete(sourceKey);
    ScreenLightingComposer.#ambientBySource.delete(sourceKey);
    ScreenLightingComposer.#lightsBySource.delete(sourceKey);
  }

  /**
   * Reports what the screen should look like this frame, advancing any journey in progress.
   * @returns {LightingComposition}
   */
  static compose()
  {
    // some other consumer already did this frame's work.
    if (ScreenLightingComposer.#composedFrame === Graphics.frameCount)
    {
      return ScreenLightingComposer.#composition;
    }

    ScreenLightingComposer.#composedFrame = Graphics.frameCount;
    ScreenLightingComposer.#advanceTone();

    const darkness = ScreenLightingComposer.#composeDarkness();
    const ambientColor = ScreenLightingComposer.#composeAmbientColor();
    const lights = ScreenLightingComposer.#composeLights();
    const tone = ScreenLightingComposer.#currentTone;

    ScreenLightingComposer.#composition = new LightingComposition(tone, darkness, ambientColor, lights);

    return ScreenLightingComposer.#composition;
  }

  /**
   * Discards everything the composer knows.
   *
   * Nothing in the game needs this - the composer's state is rebuilt by arriving anywhere - but a
   * test sharing the composer between cases does, and so does anything wanting a hard reset.
   */
  static reset()
  {
    ScreenLightingComposer.#toneBySource.clear();
    ScreenLightingComposer.#ambientBySource.clear();
    ScreenLightingComposer.#lightsBySource.clear();
    ScreenLightingComposer.#currentTone = [ 0, 0, 0, 0 ];
    ScreenLightingComposer.#toneDestination = [ 0, 0, 0, 0 ];
    ScreenLightingComposer.#toneFramesRemaining = 0;
    ScreenLightingComposer.#releaseFrames = ScreenLightingComposer.DEFAULT_RELEASE_FRAMES;
    ScreenLightingComposer.#composedFrame = -1;
    ScreenLightingComposer.#composition = new LightingComposition([ 0, 0, 0, 0 ], 0, [ 0, 0, 0 ], []);
  }

  /**
   * Moves the live tone one frame closer to wherever it is headed, restarting if the target moved.
   *
   * The destination is recomputed every frame rather than remembered, because the thing that decides
   * it is a priority contest whose entrants come and go. A cutscene starting outranks the clock the
   * instant it is declared, and the clock takes the screen back the instant the cutscene withdraws -
   * neither of which involves anybody telling this method anything.
   */
  static #advanceTone()
  {
    const winner = ScreenLightingComposer.#winningTone();
    const destination = winner === null
      ? LightingChannels.identityFor(LightingChannels.TONE)
      : winner.tone();

    if (ScreenLightingComposer.#isSameTone(destination) === false)
    {
      // a withdrawal has no declaration left to ask, so it uses whatever the departing one wanted.
      const frames = winner === null
        ? ScreenLightingComposer.#releaseFrames
        : winner.durationFrames();

      ScreenLightingComposer.#toneDestination = destination;
      ScreenLightingComposer.#toneFramesRemaining = Math.max(frames, 1);
    }

    // the journey is over and the live tone is already exactly where it was going.
    if (ScreenLightingComposer.#toneFramesRemaining <= 0) return;

    const remaining = ScreenLightingComposer.#toneFramesRemaining;
    const target = ScreenLightingComposer.#toneDestination;

    ScreenLightingComposer.#currentTone = ScreenLightingComposer.#currentTone
      .map((channel, index) => LightingEasing.stepToward(channel, target.at(index), remaining));

    ScreenLightingComposer.#toneFramesRemaining -= 1;
  }

  /**
   * The tone declaration belonging to the highest-ranking source that made one.
   * @returns {ToneDeclaration|null} The winning declaration, or null when nobody wants the screen.
   */
  static #winningTone()
  {
    const ordered = ScreenLightingComposer.#ascendingByPriority(ScreenLightingComposer.#toneBySource);

    // nobody is asking for a tone at all, which is the ordinary state of an outdoor map at noon.
    if (ordered.length === 0) return null;

    const [ winner ] = ordered.slice(-1);

    return winner;
  }

  /**
   * Determines whether the live destination already matches a proposed one.
   * @param {number[]} destination The tone being proposed.
   * @returns {boolean}
   */
  static #isSameTone(destination)
  {
    const current = ScreenLightingComposer.#toneDestination;

    return current.every((channel, index) => channel === destination.at(index));
  }

  /**
   * Compounds every source's darkness into the single fraction the mask is drawn from.
   * @returns {number}
   */
  static #composeDarkness()
  {
    const declarations = ScreenLightingComposer.#ascendingByPriority(ScreenLightingComposer.#ambientBySource);
    const identity = LightingChannels.identityFor(LightingChannels.AMBIENT);

    const fold = (accumulated, declaration) =>
    {
      return LightingChannels.combine(LightingChannels.AMBIENT, accumulated, declaration.darkness());
    };

    return declarations.reduce(fold, identity);
  }

  /**
   * Settles what colour the darkness is, among the sources with an opinion about it.
   *
   * Only sources that actually stated a colour are considered. The clock knows how dark night is and
   * has nothing to say about what colour a particular cave's dark should be, so it must not be able
   * to win this contest merely by outranking the cave on the other question.
   * @returns {number[]}
   */
  static #composeAmbientColor()
  {
    const declarations = ScreenLightingComposer.#ascendingByPriority(ScreenLightingComposer.#ambientBySource);
    const opinionated = declarations.filter(declaration => declaration.hasDeclaredColor() === true);
    const identity = LightingChannels.identityFor(LightingChannels.AMBIENT_COLOR);

    const fold = (accumulated, declaration) =>
    {
      return LightingChannels.combine(LightingChannels.AMBIENT_COLOR, accumulated, declaration.color());
    };

    return opinionated.reduce(fold, identity);
  }

  /**
   * Gathers every live light from every source into one list.
   *
   * Lights are a union rather than a contest. Two sources lighting the same room is two lights, and
   * the additive blend that composites them is what makes overlapping pools brighten where they meet.
   * @returns {LightDeclaration[]}
   */
  static #composeLights()
  {
    const gathered = [];

    ScreenLightingComposer.#lightsBySource.forEach(declarations => gathered.push(...declarations));

    return gathered;
  }

  /**
   * Sorts a source-keyed map's values so the most assertive source comes last.
   *
   * Last, not first, because the claiming channels resolve by letting each incoming value overwrite
   * the one before it. Reversing this quietly hands the screen to whichever source cares least.
   * @param {Map<string, Object>} bySource The declarations to order.
   * @returns {Object[]} The declarations, least assertive first.
   */
  static #ascendingByPriority(bySource)
  {
    const entries = Array.from(bySource.entries());
    const sorted = entries.sort((first, second) =>
    {
      const firstPriority = ScreenLightingComposer.#priorityOf(first.at(0));
      const secondPriority = ScreenLightingComposer.#priorityOf(second.at(0));

      return firstPriority - secondPriority;
    });

    return sorted.map(entry => entry.at(1));
  }

  /**
   * How strongly a source key outranks others.
   *
   * Source keys carry an id for anything there can be several of at once - `page:12` is the twelfth
   * event's torch, and a map full of them are all equally page-ranked. The part in front of the
   * colon is what says how a declaration should behave; the part after it only says which one.
   * @param {string} sourceKey The source key to rank.
   * @returns {number}
   */
  static #priorityOf(sourceKey)
  {
    const sourceKind = ScreenLightingComposer.#kindOf(sourceKey);

    // an unrecognised source ranks lowest, so a typo composes politely rather than seizing the screen.
    if (ScreenLightingComposer.#sourcePriorities.has(sourceKind) === false) return 0;

    return ScreenLightingComposer.#sourcePriorities.get(sourceKind);
  }

  /**
   * The kind of source a key names, which is everything in front of the colon.
   * @param {string} sourceKey The source key to read.
   * @returns {string}
   */
  static #kindOf(sourceKey)
  {
    const [ sourceKind ] = sourceKey.split(':');

    return sourceKind;
  }

  /**
   * Withdraws every declaration whose source is of one kind.
   *
   * Leaving a map has to drop every torch on it, and there is no list of which events had one -
   * the events themselves are about to be replaced. Clearing by kind is what makes that possible
   * without core keeping a register it would then have to keep correct.
   * @param {string} sourceKind The kind of source to withdraw, ex: `page`.
   */
  static removeDeclarationKind(sourceKind)
  {
    const everyKey = [
      ...ScreenLightingComposer.#toneBySource.keys(),
      ...ScreenLightingComposer.#ambientBySource.keys(),
      ...ScreenLightingComposer.#lightsBySource.keys(), ];

    const matching = everyKey.filter(sourceKey => ScreenLightingComposer.#kindOf(sourceKey) === sourceKind);

    matching.forEach(sourceKey => ScreenLightingComposer.removeDeclarations(sourceKey));
  }

  /**
   * Determines whether two sets of light declarations ask for exactly the same thing.
   * @param {LightDeclaration[]} previous What the source had declared before, if anything.
   * @param {LightDeclaration[]} incoming What it is asking for now.
   * @returns {boolean}
   */
  static #areLightsIdentical(previous, incoming)
  {
    // a source that has never declared anything cannot be asking for the same thing again.
    if (previous === undefined) return false;

    if (previous.length !== incoming.length) return false;

    return previous.every((declaration, index) => declaration.matches(incoming.at(index)));
  }
}

export default ScreenLightingComposer;
//endregion ScreenLightingComposer