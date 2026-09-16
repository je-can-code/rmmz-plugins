//region BubbleTargetResolver
import BubbleAnchor from '../__models/BubbleAnchor.js';

/**
 * Turns the target an author typed into the thing on screen the bubble should sit above.
 *
 * The grammar names what it means rather than encoding it. `self` is the event running the command,
 * `player` is the player, and the counted forms carry a letter saying which database they are
 * counting in - `e12` is an event, `a1` an actor, `f2` a follower. A bare pair of numbers is a fixed
 * point. Nothing is overloaded, so nothing has to be memorised, and a line read three years from now
 * still says who is talking.
 *
 * Every unrecognised token resolves to nothing, and nothing is a perfectly good answer: the message
 * renders as an ordinary panel instead of floating. That is what makes the grammar safe to change -
 * a target this resolver does not understand produces a visibly plain message rather than a bubble
 * pointing confidently at the wrong character.
 */
class BubbleTargetResolver
{
  /**
   * The target naming the event that is running the message command.
   * @type {string}
   */
  static SelfToken = 'self';

  /**
   * The target naming the player.
   * @type {string}
   */
  static PlayerToken = 'player';

  /**
   * The letter introducing an event id.
   * @type {string}
   */
  static EventPrefix = 'e';

  /**
   * The letter introducing an actor id.
   * @type {string}
   */
  static ActorPrefix = 'a';

  /**
   * The letter introducing a follower's place in the marching order.
   * @type {string}
   */
  static FollowerPrefix = 'f';

  /**
   * The punctuation separating the two halves of the fixed-point form.
   * @type {string}
   */
  static PointSeparator = ',';

  /**
   * The number of halves a fixed-point target has.
   * @type {number}
   */
  static PointCoordinateCount = 2;

  /**
   * The marching position of whoever is leading the party.
   *
   * The leader is not drawn as a follower at all - they are the player sprite - so this index is the
   * one place the actor form crosses over into naming `$gamePlayer`.
   * @type {number}
   */
  static LeaderIndex = 0;

  /**
   * What `indexOf` answers for an actor who is not currently marching with the party.
   * @type {number}
   */
  static NotMarching = -1;

  /**
   * The sentinel for a counted form whose number was not a usable id.
   *
   * Zero rather than null because every database MZ has numbers its rows from one, so zero is
   * already a value that can never name anything.
   * @type {number}
   */
  static NoOrdinal = 0;

  /**
   * The thing on screen this target names.
   * @param {string} target The contents of the author's `\pop[...]`, without the brackets.
   * @param {number} hostEventId The id of the event whose page is running this message, for `self`.
   * @returns {?(Game_Character|BubbleAnchor)} Whatever the bubble should follow, or null when the
   * target names nothing on this map - an unrecognised token, an event that no longer exists, or an
   * actor who is not currently marching with the party. Null means "draw no bubble".
   */
  static resolve(target, hostEventId)
  {
    // authors type these by hand into a text box, so meet them halfway on spacing and casing.
    const normalized = target.trim()
      .toLowerCase();

    // the two named forms are named precisely because they are the two that are never counted.
    if (normalized === BubbleTargetResolver.SelfToken) return BubbleTargetResolver.resolveEvent(hostEventId);

    if (normalized === BubbleTargetResolver.PlayerToken) return $gamePlayer;

    // a comma is the only punctuation the grammar has, so its presence identifies the form outright.
    const isPoint = normalized.includes(BubbleTargetResolver.PointSeparator);
    if (isPoint === true) return BubbleTargetResolver.resolvePoint(normalized);

    // everything remaining is a letter followed by a number, and a number that is not a usable id
    // disqualifies the token before the letter is even worth reading. This is the one place the
    // sentinel is read, and reading it here is what keeps the lookups below honest: without it a
    // typo would be caught three different ways by three different databases each happening to hold
    // nothing at zero, which is luck rather than a rule.
    const ordinal = BubbleTargetResolver.ordinalOf(normalized);
    if (ordinal === BubbleTargetResolver.NoOrdinal) return null;

    return BubbleTargetResolver.resolveCounted(normalized.charAt(0), ordinal);
  }

  /**
   * The thing named by one of the counted forms.
   * @param {string} prefix The letter saying which database the number counts in.
   * @param {number} ordinal The id or marching position being counted to.
   * @returns {?(Game_Character)} The character named, or null when the letter is not one of ours.
   */
  static resolveCounted(prefix, ordinal)
  {
    switch (prefix)
    {
      case BubbleTargetResolver.EventPrefix:
        return BubbleTargetResolver.resolveEvent(ordinal);
      case BubbleTargetResolver.ActorPrefix:
        return BubbleTargetResolver.resolveActor(ordinal);
      case BubbleTargetResolver.FollowerPrefix:
        return BubbleTargetResolver.resolveFollower(ordinal);
      default:
        return null;
    }
  }

  /**
   * The event with the given id on the current map.
   * @param {number} eventId The id of the event being named.
   * @returns {?Game_Event} The event, or null when this map has no such event.
   */
  static resolveEvent(eventId)
  {
    const event = $gameMap.event(eventId);

    // an id can outlive the event it named: a page copied in from another map, or an event deleted
    // since the line was written. Neither is worth crashing a cutscene over.
    if (event === undefined) return null;

    return event;
  }

  /**
   * The sprite an actor is currently walking around as.
   *
   * An actor is not a thing on screen; their *place in the marching order* is. The party leader is
   * drawn as the player sprite and everyone behind them as a follower, so the same actor moves
   * between the two as the party is reordered - which is exactly why this is resolved per message
   * rather than remembered.
   * @param {number} actorId The id of the actor being named.
   * @returns {?Game_Character} The player or a follower, or null when that actor is not currently
   * marching - held in reserve, out of the party entirely, or never in the database to begin with.
   */
  static resolveActor(actorId)
  {
    const actor = $gameActors.actor(actorId);
    const marching = $gameParty.battleMembers();
    const marchingIndex = marching.indexOf(actor);

    // in reserve, or not in the party at all, or - since an id outside the database resolves to
    // null and no party contains null - not an actor to begin with. All three mean the same thing
    // here: there is no sprite of them walking around this map to point at. The check has to happen
    // before the arithmetic below, because a marching position of -1 would otherwise be counted
    // backwards into the follower array and land on nobody by accident rather than on purpose.
    if (marchingIndex === BubbleTargetResolver.NotMarching) return null;

    // the leader walks as the player rather than as a follower.
    if (marchingIndex === BubbleTargetResolver.LeaderIndex) return $gamePlayer;

    return BubbleTargetResolver.resolveFollower(marchingIndex);
  }

  /**
   * The follower walking in the given place behind the player.
   * @param {number} ordinal The place in line, counting from one for the follower directly behind.
   * @returns {?Game_Follower} The follower, or null when the party is not that long.
   */
  static resolveFollower(ordinal)
  {
    // the author counts from one because "the first follower" is the one directly behind the player;
    // the engine stores that same follower at zero.
    const follower = $gamePlayer.followers()
      .follower(ordinal - 1);

    // a party of two has one follower, so asking for the third is asking for nobody.
    if (follower === undefined) return null;

    return follower;
  }

  /**
   * The fixed point named by a pair of coordinates.
   * @param {string} target The whole target, known to contain the separator.
   * @returns {?BubbleAnchor} The anchor, or null when the pair is not two real numbers.
   */
  static resolvePoint(target)
  {
    const coordinates = target.split(BubbleTargetResolver.PointSeparator);

    // one comma and no more: a third value would mean the author is reaching for something this
    // grammar does not offer, and quietly using the first two would hide that from them.
    if (coordinates.length !== BubbleTargetResolver.PointCoordinateCount) return null;

    const [ rawX, rawY ] = coordinates;
    const x = Number(rawX.trim());
    const y = Number(rawY.trim());

    // `Number` reads an empty string as zero, so a half-typed pair would otherwise anchor to an edge
    // of the screen rather than admitting it is incomplete.
    if (rawX.trim() === String.empty) return null;

    if (rawY.trim() === String.empty) return null;

    if (Number.isFinite(x) === false) return null;

    if (Number.isFinite(y) === false) return null;

    return new BubbleAnchor(x, y);
  }

  /**
   * The number a counted form is counting to.
   * @param {string} target The whole target, whose first character is the prefix letter.
   * @returns {number} The id or place being named, or zero when what followed the letter was not a
   * whole counting number.
   */
  static ordinalOf(target)
  {
    const digits = target.slice(1);
    const parsed = Number(digits);

    // `Number` will happily answer for an empty string, a fraction and a negative; only a whole
    // counting number can name a row or a place in line.
    if (Number.isInteger(parsed) === false) return BubbleTargetResolver.NoOrdinal;

    if (parsed < 1) return BubbleTargetResolver.NoOrdinal;

    return parsed;
  }
}

export default BubbleTargetResolver;
//endregion BubbleTargetResolver