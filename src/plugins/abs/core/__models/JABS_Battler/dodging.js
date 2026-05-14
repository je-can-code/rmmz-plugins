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

  // grab the resolved skill id for the dodge slot, applying any active transform.
  const skillId = battler.getResolvedSkillId(JABS_Button.Dodge);

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
 * @param {number} [forcedDirection8] When set, skips movement-note inference (AI rolls away from a threat vector).
 */
JABS_Battler.prototype.executeDodgeSkill = function(skill, forcedDirection8)
{
  // dodge and held guard share the body; drop guard so dodge movement and speed stack cleanly.
  if (this.guarding())
  {
    this.executeGuard(false, JABS_Button.Offhand);
  }

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
  let dodgeDirection;
  if (forcedDirection8 !== undefined && forcedDirection8 !== null)
  {
    dodgeDirection = forcedDirection8;
  }
  else
  {
    dodgeDirection = this.determineDodgeDirection(skill.jabsMoveType);
  }

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
 * AI-only: spends dodge toward open tile away from an opposing battler when interrupt logic demands it.
 * @param {JABS_Battler} threatBattler The hostile pressure source.
 * @returns {boolean} True when dodge map actions actually fired.
 */
JABS_Battler.prototype.tryExecuteAiEmergencyDodgeAwayFrom = function(threatBattler)
{
  const battler = this.getBattler();

  // get the resolved skill id for the dodge slot, applying any active transform.
  const skillId = battler.getResolvedSkillId(JABS_Button.Dodge);

  if (!skillId)
  {
    return false;
  }

  if (!JABS_Battler.isDodgeSkillById(skillId))
  {
    return false;
  }

  if (!this.canExecuteSkill(skillId))
  {
    return false;
  }

  const skill = this.getSkill(skillId);

  if (!battler.canPaySkillCost(skill))
  {
    return false;
  }

  const chr = this.getCharacter();
  const threatChr = threatBattler.getCharacter();
  const towardThreat = chr.findDirectionTo(threatChr.x, threatChr.y);
  const awayFromThreat = chr.reverseDir(towardThreat);

  this.executeDodgeSkill(skill, awayFromThreat);

  return true;
};

/**
 * Whether one dodge step in the given eight-way direction is passable for this character.
 * Prefers Pixelistics collision probes when present.
 * @param {Game_Character} character The character that will step.
 * @param {number} direction8 Eight-way direction constant.
 * @returns {boolean}
 */
JABS_Battler.prototype.canDirectionalDodgeStepPass = function(character, direction8)
{
  if (character.isDiagonalDirection(direction8))
  {
    if (typeof character.canPassDiagonalByDirection === 'function')
    {
      return character.canPassDiagonalByDirection(direction8);
    }

    if (typeof character.getDiagonalDirections === 'function'
      && typeof character.canPassDiagonally === 'function')
    {
      const pair = character.getDiagonalDirections(direction8);

      return character.canPassDiagonally(character._x, character._y, pair[0], pair[1]);
    }
  }

  if (typeof character.canPassStraight === 'function')
  {
    return character.canPassStraight(direction8);
  }

  return true;
};

/**
 * Scores eight-way directions by alignment with fleeing away from a unit threat vector.
 * @param {number} ux Unit X component away from threat (world space).
 * @param {number} uy Unit Y component away from threat (world space).
 * @returns {{d: number, s: number}[]} Sorted best-first for dodge preference.
 */
JABS_Battler.buildDirectionalDodgeScores = function(ux, uy)
{
  const rows = [
    { d: J.ABS.Directions.UP, vx: 0, vy: -1 },
    { d: J.ABS.Directions.DOWN, vx: 0, vy: 1 },
    { d: J.ABS.Directions.LEFT, vx: -1, vy: 0 },
    { d: J.ABS.Directions.RIGHT, vx: 1, vy: 0 },
    { d: J.ABS.Directions.UPPERLEFT, vx: -1, vy: -1 },
    { d: J.ABS.Directions.UPPERRIGHT, vx: 1, vy: -1 },
    { d: J.ABS.Directions.LOWERLEFT, vx: -1, vy: 1 },
    { d: J.ABS.Directions.LOWERRIGHT, vx: 1, vy: 1 },
  ];

  const scored = rows.map(({ d, vx, vy }) => ({
    d,
    s: vx * ux + vy * uy,
  }));

  scored.sort((a, b) => b.s - a.s);

  return scored;
};

/**
 * Directional dodge for non-leader battlers: flee passable directions away from the best threat,
 * never preferring toward-negative alignment before exhausting safer options.
 * @returns {number} Eight-way direction code.
 */
JABS_Battler.prototype.pickAiDirectionalDodgeDirection = function()
{
  const character = this.getCharacter();
  const threat = JABS_AiManager.getClosestOpposingBattler(this)
    || JABS_AiManager.findDefensiveThreatBattler(this);

  if (!threat || threat.isDead())
  {
    return character.direction();
  }

  const tx = threat.getX();
  const ty = threat.getY();
  const dxAway = character.x - tx;
  const dyAway = character.y - ty;
  const magSq = dxAway * dxAway + dyAway * dyAway;

  if (magSq < 0.0001)
  {
    return character.reverseDir(character.direction());
  }

  const mag = Math.sqrt(magSq);
  const ux = dxAway / mag;
  const uy = dyAway / mag;
  const scored = JABS_Battler.buildDirectionalDodgeScores(ux, uy);

  const pickWithFloor = minScore =>
  {
    for (let i = 0; i < scored.length; i++)
    {
      if (scored[i].s < minScore)
      {
        continue;
      }

      if (this.canDirectionalDodgeStepPass(character, scored[i].d))
      {
        return scored[i].d;
      }
    }

    return 0;
  };

  let chosen = pickWithFloor(0.01);

  if (chosen)
  {
    return chosen;
  }

  chosen = pickWithFloor(-0.2);

  if (chosen)
  {
    return chosen;
  }

  chosen = pickWithFloor(-999);

  if (chosen)
  {
    return chosen;
  }

  return character.direction();
};

/**
 * Translates a dodge skill type into a direction to move.
 * @param {'forward'|'backward'|'directional'} moveType The type of dodge skill the player is using.
 */
JABS_Battler.prototype.determineDodgeDirection = function(moveType)
{
  const character = this.getCharacter();

  switch (moveType)
  {
    case J.ABS.Notetags.MoveType.Forward:
      return character.direction();

    case J.ABS.Notetags.MoveType.Backward:
      return character.reverseDir(character.direction());

    case J.ABS.Notetags.MoveType.Directional:
      if (character.isPlayer())
      {
        if (Input.dir8 === 0)
        {
          return character.direction();
        }

        return Input.dir8;
      }

      return this.pickAiDirectionalDodgeDirection();

    default:
      return character.direction();
  }
};
//endregion dodging