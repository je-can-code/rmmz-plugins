//region TimeLightingCoordinator
import TimeToneResolver from './TimeToneResolver.js';

/**
 * Turns what the clock says into what the sky looks like.
 *
 * The clock itself has no opinion about colour. It knows what hour it is and announces when that
 * changes, and everything about what an hour *looks* like lives here - which is the whole point of
 * the split. Night's colour and night's darkness are one artistic decision, and keeping them in one
 * file means they cannot drift apart.
 *
 * Nothing here paints. Everything is declared to the composer under the `time` source, so a cutscene
 * that tints the screen simply outranks the sky for as long as it holds it, and the sky is still
 * there underneath when it lets go.
 *
 * **The clock is always handed in, never reached for.** `$gameTime` does not exist during the very
 * first announcement: `Game_Time`'s own constructor announces the starting hour, and the global it
 * will be assigned to is still null until that constructor returns. Taking the clock as an argument
 * is what makes that moment representable rather than a crash on a fresh game.
 */
class TimeLightingCoordinator
{
  /**
   * The source key everything the sky asks for is declared under.
   * @type {string}
   */
  static SOURCE_KEY = 'time';

  /**
   * How many frames the sky takes to travel from one hour's look to the next.
   *
   * Long, because the sky is the one thing on screen that should never be seen to change. An hour of
   * game time passes in far less than this many frames of real time, so in practice the screen is
   * always partway through a journey it never completes - which is exactly how a sky behaves.
   * @type {number}
   */
  static TRANSITION_FRAMES = 300;

  /**
   * Whether the map the player is standing on has opted out of the day/night cycle.
   * @type {boolean}
   */
  static #suppressedByMap = false;

  /**
   * Whether something has deliberately frozen the sky where it is.
   * @type {boolean}
   */
  static #locked = false;

  /**
   * Re-reads whether the current map wants anything to do with the sky.
   *
   * This is the only thing in the extension that reads map data, and it is deliberately the only
   * thing: everything else works from the hour alone. That split is what lets the hour-change hook
   * run during game-object creation, long before any map exists, without needing to check whether
   * one does.
   */
  static refreshMapSuppression()
  {
    // the tag's mere presence is the opt-in; RMMZ hands back `true` for a bare `<noToneChange>`.
    TimeLightingCoordinator.#suppressedByMap = Boolean($dataMap.meta['noToneChange']);
  }

  /**
   * Declares what the sky should look like at the clock's current hour, or withdraws entirely.
   *
   * Withdrawing rather than declaring something neutral is what makes a cave behave. The composer
   * falls back to whatever else has a claim - a cutscene's tint if one is running, and nothing at
   * all otherwise - so an event that deliberately tinted an interior keeps its tint, and a plain
   * cave simply has no sky rather than inheriting the last map's midnight.
   * @param {Game_Time} clock The clock announcing the time.
   */
  static declareForCurrentTime(clock)
  {
    const sourceKey = TimeLightingCoordinator.SOURCE_KEY;

    // this place has no sky to speak of, so the sky has nothing to say about it.
    if (TimeLightingCoordinator.isActive() === false)
    {
      ScreenLightingComposer.removeDeclarations(sourceKey);

      return;
    }

    const hours = TimeLightingCoordinator.currentHour(clock);
    const metadata = J.LIGHTING.EXT.TIME.Metadata;
    const frames = TimeLightingCoordinator.TRANSITION_FRAMES;

    const tone = TimeToneResolver.toneOfHour(hours, metadata.toneSequence);
    const darkness = TimeToneResolver.darknessOfHour(hours, metadata.darknessSequence);

    const toneDeclaration = new ToneDeclaration(tone, frames, sourceKey);
    ScreenLightingComposer.declareTone(sourceKey, toneDeclaration);

    // the sky says how dark it is and says nothing about what colour a given place's dark should be,
    // so it declares no colour of its own - a teal cave keeps its teal.
    const ambient = new AmbientDeclaration(darkness, [ 0, 0, 0 ], false, sourceKey);
    ScreenLightingComposer.declareAmbient(sourceKey, ambient);
  }

  /**
   * Determines whether the sky should be reaching the screen at all right now.
   * @returns {boolean}
   */
  static isActive()
  {
    // somebody deliberately froze the sky, which outranks everything else here.
    if (TimeLightingCoordinator.#locked === true) return false;

    // an interior, a cave, anywhere the sky is simply not visible.
    return TimeLightingCoordinator.#suppressedByMap === false;
  }

  /**
   * The hour the sky should be showing.
   *
   * Sourcing the hour is the clock's business rather than this class's, except for the one case the
   * clock cannot answer: when the game is running on real time, the hour belongs to the player's own
   * wall clock rather than to anything the game is counting.
   * @param {Game_Time} clock The clock announcing the time.
   * @returns {number}
   */
  static currentHour(clock)
  {
    if (J.TIME.Metadata.UseRealTime === true)
    {
      return new Date().getHours();
    }

    return clock.hours();
  }

  /**
   * Freezes the sky wherever it currently is.
   * @param {Game_Time} clock The clock to resume reading from when it is unfrozen.
   */
  static lock(clock)
  {
    TimeLightingCoordinator.#locked = true;
    TimeLightingCoordinator.declareForCurrentTime(clock);
  }

  /**
   * Lets the sky resume following the clock.
   * @param {Game_Time} clock The clock to resume reading from.
   */
  static unlock(clock)
  {
    TimeLightingCoordinator.#locked = false;
    TimeLightingCoordinator.declareForCurrentTime(clock);
  }

  /**
   * Determines whether the sky is currently frozen.
   * @returns {boolean}
   */
  static isLocked()
  {
    // hand back whether the sky has been deliberately stopped.
    return TimeLightingCoordinator.#locked;
  }
}

export default TimeLightingCoordinator;
//endregion TimeLightingCoordinator