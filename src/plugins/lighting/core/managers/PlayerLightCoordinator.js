//region PlayerLightCoordinator
import LightingTagParser from '../core/LightingTagParser.js';
import ScreenLightingComposer from './ScreenLightingComposer.js';

/**
 * Keeps the light the player is carrying in step with who the player currently is and what they hold.
 *
 * The player has no light of their own. That is deliberate: a globe that follows the party
 * everywhere makes true darkness unreachable, because the one place a player can always see is
 * wherever they are standing. So the light comes from the leader's own notes instead - an equipped
 * lantern, a glowing state, a class that sees in the dark - which makes carrying light a thing the
 * game can give and take away rather than a setting.
 *
 * Reading those notes is cheap enough to do on demand: `getAllNotes` is cached on the battler and
 * invalidated whenever their equipment, states or skills change, and the note-parsing behind it is
 * cached per regex. Two cache hits is less work than keeping a subscription correct would be.
 */
class PlayerLightCoordinator
{
  /**
   * The source key every light the player carries is declared under.
   * @type {string}
   */
  static SOURCE_KEY = 'player';

  /**
   * The stand-in identity for having nobody to read lights from.
   *
   * A party can genuinely be empty - a full wipe, or a moment during setup before anybody has been
   * added - and `Game_Party#leader` hands back nothing at all when it is. A sentinel means the
   * change check can compare identities without ever reading through the nothing.
   * @type {string}
   */
  static NO_LEADER = 'none';

  /**
   * Who the lights currently declared were read from.
   * @type {string}
   */
  static #lastLeaderKey = PlayerLightCoordinator.NO_LEADER;

  /**
   * Re-reads the leader's lights and declares them, whatever they turn out to be.
   * @returns {void}
   */
  static refresh()
  {
    const leader = $gameParty.leader();

    PlayerLightCoordinator.#lastLeaderKey = PlayerLightCoordinator.#keyOf(leader);

    // nobody is leading, so nobody is carrying anything; withdrawing is the whole update.
    if (PlayerLightCoordinator.#lastLeaderKey === PlayerLightCoordinator.NO_LEADER)
    {
      ScreenLightingComposer.removeDeclarations(PlayerLightCoordinator.SOURCE_KEY);

      return;
    }

    const noteObjects = leader.getAllNotes();
    const sourceKey = PlayerLightCoordinator.SOURCE_KEY;
    const declarations = LightingTagParser.parseNoteObjects(noteObjects, $gamePlayer, sourceKey);

    ScreenLightingComposer.declareLights(sourceKey, declarations);
  }

  /**
   * Re-reads the leader's lights only if the party is now being led by somebody else.
   *
   * The leader *changing* is a different event from the leader's data changing, and the hook that
   * catches the second cannot catch the first: when party cycling swaps who is in front, nothing
   * about either actor's data changed - only the question of whose data to read. Party cycling also
   * lives in J-ABS, which this plugin must run without, so there is no hook to alias even if one
   * would do. Comparing identities where the composition is already being asked for costs one
   * string comparison a frame and is correct whether J-ABS is installed or not.
   * @returns {void}
   */
  static refreshIfLeaderChanged()
  {
    const leader = $gameParty.leader();
    const currentKey = PlayerLightCoordinator.#keyOf(leader);

    // the same person is still in front, so whatever was declared for them still stands.
    if (currentKey === PlayerLightCoordinator.#lastLeaderKey) return;

    PlayerLightCoordinator.refresh();
  }

  /**
   * The identity of whoever is leading, in a form that is safe to compare.
   * @param {Game_Actor} leader The party leader, if there is one.
   * @returns {string}
   */
  static #keyOf(leader)
  {
    // an empty party has no leader at all, which is a real state rather than a broken one.
    if (leader === undefined) return PlayerLightCoordinator.NO_LEADER;

    return `${leader.actorId()}`;
  }

  /**
   * Forgets who was last read from.
   *
   * Only a test needs this; in a running game the coordinator is re-seeded by arriving anywhere.
   */
  static reset()
  {
    PlayerLightCoordinator.#lastLeaderKey = PlayerLightCoordinator.NO_LEADER;
  }
}

export default PlayerLightCoordinator;
//endregion PlayerLightCoordinator