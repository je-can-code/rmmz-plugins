//region dodging
//region properties
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
 * Gets the direction that the battler will be moved when dodging.
 * @returns {number}
 */
JABS_Battler.prototype.getDodgeDirection = function()
{
  return this._dodgeDirection;
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
 * Decrements the dodge steps remaining.
 */
JABS_Battler.prototype.decrementDodgeSteps = function()
{
  this._dodgeSteps--;
};

/**
 * Gets the current frame of the dodge animation.
 * @returns {number}
 */
JABS_Battler.prototype.getDodgeFrame = function()
{
  return this._dodgeFrame;
};

/**
 * Sets the current frame of the dodge animation.
 * @param {number} frame The dodge frame.
 */
JABS_Battler.prototype.setDodgeFrame = function(frame)
{
  this._dodgeFrame = frame;
};

/**
 * Increments the dodge frame.
 */
JABS_Battler.prototype.incrementDodgeFrame = function()
{
  this._dodgeFrame++;
};

/**
 * Gets the iframe window for this dodge, or null if there is none.
 * @returns {[number, number]|null}
 */
JABS_Battler.prototype.getDodgeIFrames = function()
{
  return this._dodgeIframes;
};

/**
 * Sets the number of iframes the dodge has.
 * @param {number} frames The number of iframes.
 */
JABS_Battler.prototype.setDodgeIFrames = function(frames)
{
  this._dodgeIFrames = frames;
};
//endregion properties

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
  if (battler.canPaySkillCost(skill))
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
  // set up any parsed i‑frame window; not applied yet pending semantics.
  this.setDodgeIFrames(skill.jabsIFrames);

  // apply invincibility now if using the full‑duration flag.
  this.setInvincible(skill.jabsInvincibleDodge);

  // apply the move speed modifier for the dodge.
  this.getCharacter()
    .setDodgeModifier(skill.jabsDodgeSpeed);

  // set the number of steps this dodge will move you.
  this.setDodgeSteps(skill.jabsDodgeSteps);

  // set the direction to be dodging in.
  const dodgeDirection = this.determineDodgeDirection(skill.jabsMoveType);
  this.setDodgeDirection(dodgeDirection);

  // also execute the mobility skill’s action payload.
  const actionOptions = JABS_ActionOptions.Builder()
    .setCooldownKey(JABS_Button.Dodge)
    .build();

  // create the action(s) from the dodge skill.
  const actions = this.createJabsActionFromSkill(skill.id, actionOptions);

  // ensure the cooldown key is present on each action (mirrors main/offhand path).
  actions.forEach(a => a.setCooldownType(JABS_Button.Dodge));

  // execute the actions immediately; this applies costs/cooldowns/animations properly.
  $jabsEngine.executeMapActions(this, actions);

  // trigger the dodge!
  this.setDodging(true);
};

/**
 * Translates a dodge skill type into a direction to move.
 * @param {'forward'|'backward'|'directional'} moveType The type of dodge skill the player is using.
 */
JABS_Battler.prototype.determineDodgeDirection = function(moveType)
{
  // grab the player's current direction.
  const player = this.getCharacter();

  // pivot on move type.
  switch (moveType)
  {
    // "forward" represents the direction the player is currently facing.
    case J.ABS.Notetags.MoveType.Forward:
      return player.direction();

    // "backward" is the inverse of the direction the player's current direction.
    case J.ABS.Notetags.MoveType.Backward:
      return player.reverseDir(player.direction());

    // "directional" is the direction that the player is moving.
    case J.ABS.Notetags.MoveType.Directional:
      // check if the player is just standing there.
      if (Input.dir8 === 0)
      {
        // move the player in the direction they are facing.
        return player.direction();
      }

      // return the direction the player is moving.
      return Input.dir8;

    // other forms of dodge default to moving the way the player is facing.
    default:
      return player.direction();
  }
};
//endregion dodging