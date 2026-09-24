//region PresenceMotionCoordinator
import FoldMotionEffect from '../models/FoldMotionEffect.js';

/**
 * Gives a battler an entrance and an exit when its event's page brings it onto the map or takes it
 * off again, rather than letting it blink into or out of existence.
 *
 * Arriving is the easy half. By the time anybody hears about a page change it has already happened,
 * and the battler the new page brought simply unfolds into view. Leaving is the hard half, because
 * the page change is itself what blanks the graphic: by the time a departure could be announced
 * there is nothing left on screen to animate. So a departure holds the page change back instead.
 * The battler keeps its page, folds away, and only then is the change let through. That hold is the
 * only state this class keeps.
 *
 * Like {@link BattlerMotionCoordinator}, this translates what is happening to a battler into motion
 * declarations, plus the battler's own respawn animation as the one flourish every coming and going
 * shares, and draws nothing itself. How a fold looks is {@link FoldMotionEffect}'s business.
 */
class PresenceMotionCoordinator
{
  /**
   * The source key arrivals and departures are both declared under.
   *
   * One key for both, because they are the two ends of one thing. An arrival declared over a
   * departure that is still folding replaces the fold outright rather than composing with it.
   * @type {string}
   */
  static PRESENCE_SOURCE_KEY = 'combat:presence';

  /**
   * The page index vanilla gives an event that has never been set up.
   *
   * An event only ever leaves this value while it is being built, which happens for every event on
   * a map at once as the map loads.
   * @type {number}
   */
  static UNBUILT_PAGE_INDEX = -2;

  /**
   * Every event currently folding out of view, and what seeing its departure through will need.
   *
   * Kept here rather than on the event for the same reason J-Motion keeps motion off characters: a
   * departure is half a second of presentation, and a `WeakMap` gives it no field for a savefile to
   * find. Saving mid-fold simply loses the rest of the fold. The page change is still pending when
   * the save loads, so the next refresh starts a fresh one.
   * @type {WeakMap<Game_Event, Object>}
   */
  static #departures = new WeakMap();

  /**
   * Determines whether an event is partway through folding out of view.
   * @param {Game_Event} event The event to check.
   * @returns {boolean}
   */
  static isDeparting(event)
  {
    return PresenceMotionCoordinator.#departures.has(event);
  }

  /**
   * Holds back a page change that would take a live battler off the map, and starts it folding away.
   *
   * Every page change on an event holding a battler comes through here, whether the new page is
   * empty, a plain event, or another battler entirely. That last case matters. J-ABS rebuilds a
   * battler from scratch whenever its page changes, so a creature swapping for the one on its next
   * page is a new creature at full health, and it should look like one leaving and another arriving.
   * @param {Game_Event} event The event about to change page.
   * @returns {boolean} True when the change must wait for the fold to finish.
   */
  static holdPageChange(event)
  {
    // a departure underway keeps holding, right up until it lets its own change through.
    if (PresenceMotionCoordinator.isDeparting(event) === true)
    {
      return PresenceMotionCoordinator.#isReleasing(event) === false;
    }

    // only a battler actually on the map has anywhere to leave from.
    if (event.hasJabsBattler() === false) return false;

    const jabsBattler = event.getJabsBattler();

    // a battler that cannot bow out changes page the way it always did.
    if (PresenceMotionCoordinator.canDepart(jabsBattler) === false) return false;

    PresenceMotionCoordinator.beginDeparture(event, jabsBattler);

    return true;
  }

  /**
   * Determines whether a battler may fold out of view rather than vanish on the spot.
   * @param {JABS_Battler} jabsBattler The battler whose page is about to change.
   * @returns {boolean}
   */
  static canDepart(jabsBattler)
  {
    // a departure that takes no time is the old instant change, and needs no holding.
    if (J.MOTION.EXT.ABS.Metadata.departureDuration <= 0) return false;

    // a dying battler is already leaving, by way of its death.
    if (jabsBattler.isDying() === true) return false;

    // a battler with no life left is about to be handled as defeated, and gets a death instead.
    if (jabsBattler.isDead() === true) return false;

    return true;
  }

  /**
   * Starts a battler folding out of view, and holds its page until it has finished.
   * @param {Game_Event} event The event whose page is being held.
   * @param {JABS_Battler} jabsBattler The battler that is leaving.
   */
  static beginDeparture(event, jabsBattler)
  {
    const duration = J.MOTION.EXT.ABS.Metadata.departureDuration;
    const sourceKey = PresenceMotionCoordinator.PRESENCE_SOURCE_KEY;

    PresenceMotionCoordinator.#departures.set(event, {
      framesRemaining: duration,
      departingUuid: event.getJabsBattlerUuid(),
      // remembered for the case where the page it is leaving comes back before it has gone.
      wasInvincible: jabsBattler.isInvincible(),
      isReleasing: false,
    });

    // nothing lands on a battler on its way out, and it does not get a parting shot either.
    jabsBattler.setInvincible(true);
    jabsBattler.setWaitCountdown(duration);

    const declaration = new MotionDeclaration(FoldMotionEffect.FOLD, [ duration ], sourceKey);
    CharacterMotionComposer.declare(event, sourceKey, [ declaration ]);

    // and it leaves the same way it would have arrived.
    PresenceMotionCoordinator.#playPresenceAnimation(event);
  }

  /**
   * Counts a departure down by one frame, and lets its page change through once the fold is done.
   *
   * Reached from every event's update, the one per-frame heartbeat an event is guaranteed to have
   * while it is on the map. Nothing else would ever finish a departure: the refresh that started it
   * does not come round again on its own.
   * @param {Game_Event} event The event being updated.
   */
  static updateDeparture(event)
  {
    // almost no event is leaving, which makes this a single lookup for nearly all of them.
    if (PresenceMotionCoordinator.isDeparting(event) === false) return;

    const departure = PresenceMotionCoordinator.#departures.get(event);
    const framesRemaining = departure.framesRemaining - 1;

    // still folding, so hold on for another frame.
    if (framesRemaining > 0)
    {
      PresenceMotionCoordinator.#departures.set(event, { ...departure, framesRemaining });

      return;
    }

    PresenceMotionCoordinator.completeDeparture(event, departure);
  }

  /**
   * Lets a finished departure's page change through, and settles whatever that leaves behind.
   *
   * The fold is withdrawn before the page moves rather than after. All of this happens inside one
   * update, before the sprite next draws, so nothing pops back into view in between. Whatever comes
   * next then starts from a clean slate: an empty page shows nothing, and a battler arriving in its
   * place begins its own unfold without a finished fold still claiming the sprite.
   * @param {Game_Event} event The event that has finished folding.
   * @param {Object} departure What was recorded when the departure began.
   */
  static completeDeparture(event, departure)
  {
    // the fold has done its job.
    CharacterMotionComposer.removeDeclarations(event, PresenceMotionCoordinator.PRESENCE_SOURCE_KEY);

    PresenceMotionCoordinator.#releasePage(event, departure);

    // the page it was leaving came back while it folded, so the very same battler is still here.
    if (event.getJabsBattlerUuid() === departure.departingUuid)
    {
      PresenceMotionCoordinator.#returnFromDeparture(event, departure);
    }
  }

  /**
   * Lets the page change a departure was holding back go through.
   * @param {Game_Event} event The event whose page was held.
   * @param {Object} departure What was recorded when the departure began.
   */
  static #releasePage(event, departure)
  {
    // flag the hold as letting go, so the refresh below is allowed past it rather than held again.
    PresenceMotionCoordinator.#departures.set(event, { ...departure, isReleasing: true });

    // refresh the event, which applies whatever page its conditions call for right now.
    event.refresh();

    // the hold is over, whatever the refresh decided.
    PresenceMotionCoordinator.#departures.delete(event);
  }

  /**
   * Determines whether a departure is in the middle of letting its own page change through.
   * @param {Game_Event} event The departing event.
   * @returns {boolean}
   */
  static #isReleasing(event)
  {
    const departure = PresenceMotionCoordinator.#departures.get(event);

    return departure.isReleasing;
  }

  /**
   * Puts back a battler whose page came back before it had finished leaving.
   * @param {Game_Event} event The event that kept its page.
   * @param {Object} departure What was recorded when the departure began.
   */
  static #returnFromDeparture(event, departure)
  {
    const jabsBattler = event.getJabsBattler();

    // it can be struck again exactly as much as it could before it started to leave.
    jabsBattler.setInvincible(departure.wasInvincible);

    // and it turns back around to face the player.
    PresenceMotionCoordinator.beginArrival(event);
  }

  /**
   * Unfolds a battler into view when a page change has just brought one onto the map.
   * @param {Game_Event} event The event that changed page.
   * @param {number} previousPageIndex The page it was on before the change.
   */
  static welcomeArrival(event, previousPageIndex)
  {
    // an event with no page before this one is being built as the map loads. every battler on a map
    // unfolding the moment the player walks onto it would be a parade, not an entrance.
    if (previousPageIndex === PresenceMotionCoordinator.UNBUILT_PAGE_INDEX) return;

    // the new page brought no battler with it, so there is nobody to arrive.
    if (event.hasJabsBattler() === false) return;

    PresenceMotionCoordinator.beginArrival(event);
  }

  /**
   * Starts a battler unfolding into view with its respawn animation, as a page change brings it in.
   * @param {Game_Event} event The event whose battler is arriving.
   */
  static beginArrival(event)
  {
    // an arrival that takes no time is the old instant appearance, so there is nothing to play.
    if (PresenceMotionCoordinator.#hasArrivals() === false) return;

    PresenceMotionCoordinator.#unfoldIntoView(event);

    // and it announces itself the way a battler returning from the dead does.
    PresenceMotionCoordinator.#playPresenceAnimation(event);
  }

  /**
   * Unfolds a battler that has just been created on the map, rather than one a page change revealed.
   *
   * Two things create a battler outright: a respawn, which rebuilds a defeated battler's event from
   * scratch, and the Spawn Enemy command, which clones one in. Both happen on a brand new event, whose
   * first page is set up as it is built and so never counts as an arrival on its own. Both also play
   * an animation of their own choosing already, which is why this adds only the unfold - a second
   * flourish on top would play the same stars twice.
   *
   * The new event has no sprite yet, and needs none: the unfold is declared against the event, and
   * simply starts on the first frame its sprite draws.
   * @param {Game_Event} event The event that was just created.
   */
  static welcomeNewBattler(event)
  {
    // an arrival that takes no time is the old instant appearance, so there is nothing to play.
    if (PresenceMotionCoordinator.#hasArrivals() === false) return;

    // the new event's page declared no battler, so there is nobody to arrive.
    if (event.hasJabsBattler() === false) return;

    PresenceMotionCoordinator.#unfoldIntoView(event);
  }

  /**
   * Determines whether arrivals are configured to take any time at all.
   * @returns {boolean}
   */
  static #hasArrivals()
  {
    return J.MOTION.EXT.ABS.Metadata.arrivalDuration > 0;
  }

  /**
   * Turns a battler to face the player from edge-on, and keeps it from acting until it has.
   * @param {Game_Event} event The event whose battler is arriving.
   */
  static #unfoldIntoView(event)
  {
    const duration = J.MOTION.EXT.ABS.Metadata.arrivalDuration;
    const sourceKey = PresenceMotionCoordinator.PRESENCE_SOURCE_KEY;
    const jabsBattler = event.getJabsBattler();

    // a battler still turning to face the player has not finished arriving, and does not act yet.
    jabsBattler.setWaitCountdown(duration);

    // the arrival withdraws itself once it has played, which leaves the sprite exactly as it found it.
    const declaration = new MotionDeclaration(FoldMotionEffect.UNFOLD, [ duration ], sourceKey);
    CharacterMotionComposer.declare(event, sourceKey, [ declaration ], duration);
  }

  /**
   * Plays a battler's respawn animation on its event, as a fold into or out of existence begins.
   *
   * The very same animation a battler comes back from the dead with, resolved by J-ABS's own ladder,
   * so a creature appearing at the start of its hours, leaving at the end of them, and respawning after
   * a death all share one flourish. An event or enemy that asks for animation 0 gets none of it, here or
   * on a respawn.
   *
   * Unlike a respawn this needs no delay before asking: a respawned event is built fresh and has no
   * sprite until the next spriteset update, but an event changing page has had its sprite all along.
   * @param {Game_Event} event The event whose battler is arriving or leaving.
   */
  static #playPresenceAnimation(event)
  {
    const animationId = event.respawnAnimationId();

    // an animation of zero means nobody wants one.
    if (animationId === 0) return;

    event.requestAnimation(animationId);
  }
}

export default PresenceMotionCoordinator;
//endregion PresenceMotionCoordinator