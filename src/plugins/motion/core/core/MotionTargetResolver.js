//region MotionTargetResolver
/**
 * Works out which character a plugin command is talking about.
 *
 * A command names its target in the vocabulary an event author thinks in — the player, a follower,
 * an event, or the event currently running — and this turns that into the actual character. It is
 * separate from everything else because party positioning has nothing to do with motion and no
 * reason to be entangled with it.
 */
class MotionTargetResolver
{
  /**
   * The player and their followers, addressed as one ordered party.
   * @type {string}
   */
  static PLAYER = 'Player';

  /**
   * A specific follower behind the player.
   * @type {string}
   */
  static FOLLOWER = 'Follower';

  /**
   * A specific event on the current map.
   * @type {string}
   */
  static EVENT = 'Event';

  /**
   * The event whose page is running this command.
   * @type {string}
   */
  static THIS_EVENT = 'This Event';

  /**
   * Resolves a command's target into a character.
   * @param {string} target Which kind of thing is being addressed.
   * @param {number} targetId The follower slot or event id, where one applies.
   * @param {Game_Interpreter} interpreter The interpreter running the command.
   * @returns {Game_CharacterBase|null} The character, or null when the target does not exist.
   */
  static resolve(target, targetId, interpreter)
  {
    switch (target)
    {
      case MotionTargetResolver.PLAYER:
        return $gamePlayer;
      case MotionTargetResolver.FOLLOWER:
        return MotionTargetResolver.characterForPartySlot(targetId);
      case MotionTargetResolver.EVENT:
        return $gameMap.event(targetId);
      case MotionTargetResolver.THIS_EVENT:
        return $gameMap.event(interpreter.eventId());
      default:
        return null;
    }
  }

  /**
   * Resolves a party slot into the character that occupies it.
   *
   * Slot 1 is the player and slot 2 onward are the followers walking behind them, which is the
   * numbering an author sees in the editor's own party ordering rather than the zero-based index
   * the follower collection uses.
   * @param {number} partySlot The 1-based party slot.
   * @returns {Game_CharacterBase} The character in that slot.
   */
  static characterForPartySlot(partySlot)
  {
    // the first slot is the player themselves rather than anybody following them.
    if (partySlot <= 1) return $gamePlayer;

    const followerIndex = partySlot - 2;

    return $gamePlayer.followers()
      .follower(followerIndex);
  }
}

export default MotionTargetResolver;
//endregion MotionTargetResolver