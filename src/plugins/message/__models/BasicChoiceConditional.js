//region BasicChoiceConditional
/**
 * A basic choice conditional that can be checked for choice validity based on current leader or switch state.
 */
class BasicChoiceConditional
{
  /**
   * A static property containing the strings representing validation types supported.
   */
  static Types = {
    Leader: 'leader',
    NotLeader: 'not-leader',
    SwitchOn: 'switch-on',
    SwitchOff: 'switch-off',
  }

  /**
   * The {@link BasicChoiceConditional.Types} that this conditional is.
   * @type {string}
   */
  type = String.empty;

  /**
   * The id corresponding with the conditional being validated.
   * @type {number}
   */
  id = 0;

  /**
   * @constructor
   * @param {string} type The {@link BasicChoiceConditional.Types} that this conditional is.
   * @param {number} id The id that corresponds with the designated {@link BasicChoiceConditional.Types}.
   */
  constructor(type, id)
  {
    this.type = type;
    this.id = id;
  }

  /**
   * Determines whether or not this {@link BasicChoiceConditional} is met.
   * @returns {boolean}
   */
  isMet()
  {
    switch (this.type)
    {
      // validate the leader is in fact the correct leader.
      case BasicChoiceConditional.Types.Leader:
        return ($gameParty.leader() && $gameParty.leader()
          ?.actorId() === this.id);

      // validate the leader is in fact the not the specified leader.
      case BasicChoiceConditional.Types.NotLeader:
        return ($gameParty.leader() && $gameParty.leader()
          ?.actorId() !== this.id);

      // validate the conditional switch is ON.
      case BasicChoiceConditional.Types.SwitchOn:
        return $gameSwitches.value(this.id) === true;

      // validate the conditional switch is OFF.
      case BasicChoiceConditional.Types.SwitchOff:
        return $gameSwitches.value(this.id) === false;
    }
    return true;
  }
}

//endregion BasicChoiceConditional