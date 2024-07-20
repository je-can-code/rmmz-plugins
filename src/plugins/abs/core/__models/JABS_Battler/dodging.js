//region dodging
/**
 * Gets whether or not this battler is dodging.
 * @returns {boolean} True if currently dodging, false otherwise.
 */
JABS_Battler.prototype.isDodging = function()
{
  return this._dodging;
};

/**
 * Sets whether or not this battler is dodging.
 * @param {boolean} dodging Whether or not the battler is dodging (default = true).
 */
JABS_Battler.prototype.setDodging = function(dodging)
{
  this._dodging = dodging;
};

/**
 * Sets the direction that the battler will be moved when dodging.
 * @param {2|4|6|8|1|3|7|9} direction The numeric direction to be moved.
 */
JABS_Battler.prototype.setDodgeDirection = function(direction)
{
  this._dodgeDirection = direction;
};

/**
 * Gets the number of dodge steps remaining to be stepped whilst dodging.
 * @returns {number}
 */
JABS_Battler.prototype.getDodgeSteps = function()
{
  return this._dodgeSteps;
};

/**
 * Sets the number of steps that will be force-moved when dodging.
 * @param {number} stepCount The number of steps to dodge.
 */
JABS_Battler.prototype.setDodgeSteps = function(stepCount)
{
  this._dodgeSteps = stepCount;
};

/**
 * Tries to execute the battler's dodge skill.
 * Checks to see if costs are payable before executing.
 */
JABS_Battler.prototype.tryDodgeSkill = function()
{
  // grab the battler.
  const battler = this.getBattler();

  // grab the skill id for the dodge slot.
  const skillId = battler.getEquippedSkillId(JABS_Button.Dodge);

  // if we have no skill id in the dodge slot, then do not dodge.
  if (!skillId) return;

  // grab the skill for the given dodge skill id.
  const skill = this.getSkill(skillId);

  // determine if it can be paid.
  const canPay = battler.canPaySkillCost(skill);

  // check if the user can pay the cost and if there is a move type available.
  if (canPay && skill.jabsMoveType)
  {
    // execute the skill in the dodge slot.
    this.executeDodgeSkill(skill);
  }
};

/**
 * Executes the provided dodge skill.
 * @param {RPG_Skill} skill The RPG item representing the dodge skill.
 */
JABS_Battler.prototype.executeDodgeSkill = function(skill)
{
  // trigger invincibility for dodging if applicable.
  this.setInvincible(skill.jabsInvincibleDodge);

  // increase the move speed while dodging to give the illusion of "dodge-rolling".
  // TODO: get dodge modifier from skill.
  const dodgeSpeedBonus = 2;
  this.getCharacter()
    .setDodgeModifier(dodgeSpeedBonus);

  // set the number of steps this dodge will roll you.
  this.setDodgeSteps(skill.jabsRadius);

  // set the direction to be dodging in (front/back/specified).
  const dodgeDirection = this.determineDodgeDirection(skill.jabsMoveType);
  this.setDodgeDirection(dodgeDirection);

  // pay whatever costs are associated with the skill.
  this.getBattler()
    .paySkillCost(skill);

  // apply the cooldowns for the dodge.
  this.modCooldownCounter(JABS_Button.Dodge, skill.jabsCooldown);

  // trigger the dodge!
  this.setDodging(true);
};

/**
 * Translates a dodge skill type into a direction to move.
 * @param {string} moveType The type of dodge skill the player is using.
 */
JABS_Battler.prototype.determineDodgeDirection = function(moveType)
{
  const player = this.getCharacter();
  let direction;
  switch (moveType)
  {
    case J.ABS.Notetags.MoveType.Forward:
      direction = player.direction();
      break;
    case J.ABS.Notetags.MoveType.Backward:
      direction = player.reverseDir(player.direction());
      break;
    case J.ABS.Notetags.MoveType.Directional:
      if (Input.isPressed("up"))
      {
        direction = J.ABS.Directions.UP;
      }
      else if (Input.isPressed("right"))
      {
        direction = J.ABS.Directions.RIGHT;
      }
      else if (Input.isPressed("left"))
      {
        direction = J.ABS.Directions.LEFT;
      }
      else if (Input.isPressed("down"))
      {
        direction = J.ABS.Directions.DOWN;
      }
      else
      {
        direction = player.direction();
      }
      break;
    default:
      direction = player.direction();
      break;
  }

  return direction;
};
//endregion dodging