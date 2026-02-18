//region create/apply effects
/**
 * Performs a preliminary check to see if the target is actually able to be hit.
 * @returns {boolean} True if actions can potentially connect, false otherwise.
 */
JABS_Battler.prototype.canActionConnect = function ()
{
  // this battler is untargetable.
  if (this.isInvincible()) return false;

  // precise timing allows for battlers to hit other battlers the instant they
  // meet event conditions, and that is not grounds to hit enemies.
  if (this.getCharacter()
    .isJabsAction())
  {
    return false;
  }

  // passes all the criteria.
  return true;
};

/**
 * Determines whether or not this battler is available as a target based on the
 * provided action's scopes.
 * @param {JABS_Action} action The action to check validity for.
 * @param {JABS_Battler} target The potential candidate for hitting with this action.
 * @param {boolean} alreadyHitOne Whether or not this action has already hit a target.
 */
// eslint-disable-next-line complexity
JABS_Battler.prototype.isWithinScope = function (
  action,
  target,
  alreadyHitOne = false
)
{
  const user = action.getCaster();
  const gameAction = action.getAction();
  const scopeAlly = gameAction.isForFriend();
  const scopeOpponent = gameAction.isForOpponent();
  const scopeSingle = gameAction.isForOne();
  const scopeSelf = gameAction.isForUser();
  const scopeMany = gameAction.isForAll();
  const scopeEverything = gameAction.isForEveryone();
  const scopeAllAllies = scopeAlly && scopeMany;
  const scopeAllOpponents = scopeOpponent && scopeMany;

  const targetIsSelf = (user.getUuid() === target.getUuid() || (action.getAction()
    .isForUser()));
  const actionIsSameTeam = user.getTeam() === this.getTeam();
  const targetIsOpponent = !user.isSameTeam(this.getTeam());

  // scope is for 1 target, and we already found one.
  if (scopeSingle && alreadyHitOne)
  {
    return false;
  }

  // the caster and target are the same.
  if (targetIsSelf && (scopeSelf || scopeAlly || scopeAllAllies || scopeEverything))
  {
    return true;
  }

  // action is from one of the target's allies.
  // inanimate battlers cannot be targeted by their allies with direct skills.
  if (actionIsSameTeam && (scopeAlly || scopeAllAllies || scopeEverything)
    && !(action.isDirectAction() && target.isInanimate()))
  {
    return true;
  }

  // action is for enemy battlers and scope is for opponents.
  if (targetIsOpponent && (scopeOpponent || scopeAllOpponents || scopeEverything))
  {
    return true;
  }

  // meets no criteria, target is not within scope of this action.
  return false;
};

/**
 * Creates a new collection of JABS actions from a skill id.
 * @param {number} skillId The id of the skill to create the JABS actions from.
 * @param {JABS_ActionOptions=} actionOptions The options associated with this action.
 * @returns {JABS_Action[]} The JABS actions based on the skill id provided.
 */
JABS_Battler.prototype.createJabsActionFromSkill = function (
  skillId,
  actionOptions = JABS_ActionOptions.Default()
)
{
  // create the underlying skill for the action.
  const action = new Game_Action(this.getBattler(), false);

  // set the skill which also applies all applicable overlays.
  action.setSkill(skillId);

  // grab the potentially extended skill.
  const skill = this.getSkill(skillId);

  // calculate the projectile count and directions.
  const projectileCount = skill.jabsProjectile ?? 1;
  const projectileDirections = $jabsEngine.determineActionDirections(this.getCharacter()
    .direction(), projectileCount);

  // calculate how many actions will be generated to accommodate the directions.
  const actions = this.convertProjectileDirectionsToActions(projectileDirections, action, actionOptions);

  return actions;
};

/**
 * Generates actions for each projectile direction given.
 * Also applies lateral spawn offsets for parallel lanes on 2- and 3-projectile patterns.
 * @param {number[]} projectileDirections The directions that should be mapped to actions.
 * @param {Game_Action} action The underlying action data.
 * @param {JABS_ActionOptions} actionOptions The options for this action.
 * @returns {JABS_Action[]}
 */
JABS_Battler.prototype.convertProjectileDirectionsToActions = function (
  projectileDirections,
  action,
  actionOptions
)
{
  // determine how many projectiles we are generating.
  const count = projectileDirections.length;

  // compute the lateral offsets in tiles for the given count.
  // 1: [0]
  // 2: [-0.5, +0.5]
  // 3: [0, +1, -1]
  const computeOffsets = projectileCount =>
  {
    if (projectileCount === 1)
    {
      // center only.
      return [ 0 ];
    }

    if (projectileCount === 2)
    {
      // two lanes with 1 tile between them (0.5 tile offset from center for each).
      return [ -0.5, 0.5 ];
    }

    if (projectileCount === 3)
    {
      // center + left/right at 1 tile.
      return [ 0, 1, -1 ];
    }

    // for other patterns, do not offset.
    const zeros = [];
    for (let i = 0; i < projectileCount; i++)
    {
      zeros.push(0);
    }

    return zeros;
  };

  // capture the offsets collection for this volley.
  const lateralOffsets = computeOffsets(count);

  // resolve the caster’s current position as the base origin.
  const originX = this.getX();
  const originY = this.getY();

  // helper to translate a lateral offset into dx/dy against a facing.
  const offsetToDelta = (
    facing,
    lateral
  ) =>
  {
    // default to no offset.
    let dx = 0;
    let dy = 0;

    // for vertical facings (up/down), lateral offset maps to X.
    if (facing === J.ABS.Directions.UP || facing === J.ABS.Directions.DOWN)
    {
      // apply the offset to x.
      dx = lateral;
    }
    // for horizontal facings (left/right), lateral offset maps to Y.
    else if (facing === J.ABS.Directions.LEFT || facing === J.ABS.Directions.RIGHT)
    {
      // apply the offset to y.
      dy = lateral;
    }

    // return the computed delta as a tuple.
    return [ dx, dy ];
  };

  // build a single action with its own positional offset.
  const mapper = (
    projectileDirection,
    index
  ) =>
  {
    // derive the lateral in-tiles offset for this specific projectile.
    const lateral = lateralOffsets[index] ?? 0;

    // translate lateral offset into dx/dy for the given facing.
    const [ dx, dy ] = offsetToDelta(projectileDirection, lateral);

    // compute the per-projectile spawn location in tiles.
    const spawnX = originX + dx;
    const spawnY = originY + dy;

    // construct a location for this projectile; also capture direction for clarity.
    const perActionLocation = JABS_Location.Builder()
      .setX(spawnX)
      .setY(spawnY)
      .setDirection(projectileDirection)
      .build();

    // clone/compose a new options instance per projectile to avoid shared state.
    const perActionOptions = JABS_ActionOptions.Builder()
      .setIsRetaliation(actionOptions.isActionRetaliation())
      .setCooldownKey(actionOptions.getCooldownKey())
      .setLocation(perActionLocation)
      .setIsTerrainDamage(actionOptions.isTerrainDamage())
      .build();

    // build and return the action bound to this projectile’s setup.
    return JABS_Action.Builder()
      .setCaster(this)
      .setGameAction(action)
      .setInitialDirection(projectileDirection)
      .setActionOptions(perActionOptions)
      .build();
  };

  // map directions to fully built actions with offsets.
  const actions = projectileDirections.map(mapper, this);

  // return the full collection of actions for this volley.
  return actions;
};

/**
 * Constructs the attack data from this battler's skill slot.
 * @param {string} cooldownKey The cooldown key.
 * @returns {JABS_Action[]} The constructed JABS actions.
 */
JABS_Battler.prototype.getAttackData = function (cooldownKey)
{
  // grab the underlying battler.
  const battler = this.getBattler();

  // get the skill equipped in the designated slot.
  const skillId = this.getSkillIdForAction(cooldownKey);

  // if there isn't one, then we don't do anything.
  if (!skillId) return [];

  // check to make sure we can actually use the skill.
  if (!battler.meetsSkillConditions(battler.skill(skillId))) return [];

  // check to make sure we actually know the skill, too.
  if (!battler.hasSkill(skillId)) return [];

  // build action options with the cooldown key.
  const builder = JABS_ActionOptions.Builder()
    .setCooldownKey(cooldownKey);

  // attempt decision-time spatialization for direct skills lacking <directLock>.
  const skill = this.getSkill(skillId);
  if (skill.jabsDirect && !skill.jabsDirectLock)
  {
    // resolve a stable snapshot of [x,y] at decision time.
    const [ x, y ] = this.resolveDirectActionTargetCoordinatesForSkill(skill);

    // if resolved, capture into the location on the options.
    if (x !== null && y !== null)
    {
      // create a JABS_Location for the snapshot.
      const frozenLocation = JABS_Location.Builder()
        .setX(x)
        .setY(y)
        .build();

      // assign the frozen location to the options.
      builder.setLocation(frozenLocation);
    }
  }

  // finalize the options.
  const actionOptions = builder.build();

  // otherwise, use the skill from the slot to build an action.
  return this.createJabsActionFromSkill(skillId, actionOptions);
};

/**
 * Gets the next skill id to create an action from for the given slot.
 * Accommodates combo actions.
 * @param {string} slot The slot for the skill to check.
 * @returns {number}
 */
JABS_Battler.prototype.getSkillIdForAction = function (slot)
{
  // grab the underlying battler.
  const battler = this.getBattler();

  // check the slot for a combo action.
  let skillId;

  // check if we have a skill id in the next combo action id slot.
  if (this.getComboNextActionId(slot) !== 0)
  {
    // capture the combo action id.
    skillId = this.getComboNextActionId(slot);
  }
  // if no combo...
  else
  {
    // then just grab the skill id in the slot.
    skillId = battler.getEquippedSkillId(slot);
  }

  // return whichever skill id was found.
  return skillId;
};

/**
 * Consumes an item and performs its effects.
 * @param {number} toolId The id of the tool/item to be used.
 * @param {boolean} isLoot Whether or not this is a loot pickup.
 */
// eslint-disable-next-line complexity
JABS_Battler.prototype.applyToolEffects = function (
  toolId,
  isLoot = false
)
{
  // grab the item data.
  const item = $dataItems.at(toolId);

  // grab this battler.
  const battler = this.getBattler();

  // force the player to use the item.
  battler.consumeItem(item);

  // flag the slot for refresh.
  battler.getSkillSlotManager()
    .getToolSlot()
    .flagSkillSlotForRefresh();

  // also generate an action based on this tool.
  const gameAction = new Game_Action(battler, false);
  gameAction.setItem(toolId);

  // handle scopes of the tool.
  const scopeNone = gameAction.item().scope === 0;
  const scopeSelf = gameAction.isForUser();
  const scopeAlly = gameAction.isForFriend();
  const scopeOpponent = gameAction.isForOpponent();
  const scopeSingle = gameAction.isForOne();
  const scopeAll = gameAction.isForAll();
  const scopeEverything = gameAction.isForEveryone();

  const scopeAllAllies = scopeEverything || (scopeAll && scopeAlly);
  const scopeAllOpponents = scopeEverything || (scopeAll && scopeOpponent);
  const scopeOneAlly = (scopeSingle && scopeAlly);
  const scopeOneOpponent = (scopeSingle && scopeOpponent);

  // apply tool effects based on scope.
  if (scopeSelf || scopeOneAlly)
  {
    this.applyToolToPlayer(toolId);
  }
  else if (scopeEverything)
  {
    this.applyToolForAllAllies(toolId);
    this.applyToolForAllOpponents(toolId);
  }
  else if (scopeOneOpponent)
  {
    this.applyToolForOneOpponent(toolId);
  }
  else if (scopeAllAllies)
  {
    this.applyToolForAllAllies(toolId);
  }
  else if (scopeAllOpponents)
  {
    this.applyToolForAllOpponents(toolId);
  }
  else if (scopeNone)
  {
    // do nothing, the item has no scope and must be relying purely on the skillId.
  }
  else
  {
    console.warn(`unhandled scope for tool: [ ${gameAction.item().scope} ]!`);
  }

  // applies common events that may be a part of an item's effect.
  gameAction.applyGlobal();

  // create the log for the tool use.
  this.createToolLog(item);

  // extract the cooldown and skill id from the item.
  const {
    jabsCooldown: itemCooldown,
    jabsSkillId: itemSkillId
  } = item;

  // it was an item with a skill attached.
  if (itemSkillId)
  {
    const mapAction = this.createJabsActionFromSkill(itemSkillId);
    mapAction.forEach(action =>
    {
      action.setCooldownType(JABS_Button.Tool);
      $jabsEngine.executeMapAction(this, action);
    });
  }

  // if the last item was consumed, unequip it.
  if (!isLoot && !$gameParty.items()
    .includes(item))
  {
    // remove the item from the slot.
    battler.getSkillSlotManager()
      .clearSlot(JABS_Button.Tool);

    // build a lot for it.
    const lastUsedItemLog = new LootLogBuilder()
      .setupUsedLastItem(item.id)
      .build();
    $lootLogManager.addLog(lastUsedItemLog);
  }
  else
  {
    // it is an item with a custom cooldown.
    if (itemCooldown)
    {
      if (!isLoot) this.modCooldownCounter(JABS_Button.Tool, itemCooldown);
    }

    // it was an item, didn't have a skill attached, and didn't have a cooldown.
    if (!itemCooldown && !itemSkillId && !isLoot)
    {
      this.modCooldownCounter(JABS_Button.Tool, J.ABS.DefaultValues.CooldownlessItems);
    }
  }
};

/**
 * Applies the effects of the tool against the leader.
 * @param {number} toolId The id of the tool/item being used.
 */
JABS_Battler.prototype.applyToolToPlayer = function (toolId)
{
  // apply tool effects against player.
  const battler = this.getBattler();
  const gameAction = new Game_Action(battler, false);
  gameAction.setItem(toolId);
  gameAction.apply(battler);

  // display popup from item.
  this.generatePopItem(gameAction, toolId);

  // show tool animation.
  this.showAnimation($dataItems.at(toolId).animationId);
};

/**
 * Generates a popup based on the item used.
 * @param {Game_Action} gameAction The action describing the tool's effect.
 * @param {number} itemId The target having the action applied against.
 * @param {JABS_Battler} target The target for calculating damage; defaults to self.
 */
JABS_Battler.prototype.generatePopItem = function (
  gameAction,
  itemId,
  target = this
)
{
  // if we are not using popups, then don't do this.
  if (!J.POPUPS) return;

  // grab some shorthand variables for local use.
  const character = this.getCharacter();
  const toolData = $dataItems.at(itemId);

  if (toolData.sdpKey !== String.empty)
  {
    $jabsEngine.generatePopItemBulk([ toolData ], character);
    return;
  }

  // generate the textpop.
  const itemPop = $jabsEngine.configureDamagePop(gameAction, toolData, this, target);

  // add the pop to the target's tracking.
  character.addTextPop(itemPop);
  character.requestTextPop();
};

/**
 * Applies the effects of the tool against all allies on the team.
 * @param {number} toolId The id of the tool/item being used.
 */
JABS_Battler.prototype.applyToolForAllAllies = function (toolId)
{
  const battlers = $gameParty.battleMembers();
  if (battlers.length > 1)
  {
    battlers.shift(); // remove the leader, because that's the player.
    battlers.forEach(battler =>
    {
      const gameAction = new Game_Action(battler, false);
      gameAction.setItem(toolId);
      gameAction.apply(battler);
    });
  }

  // also apply effects to player/leader.
  this.applyToolToPlayer(toolId);
};

/**
 * Applies the effects of the tool against all opponents on the map.
 * @param {number} toolId The id of the tool/item being used.
 */
JABS_Battler.prototype.applyToolForOneOpponent = function (toolId)
{
  const item = $dataItems[toolId];
  let jabsBattler = this.getTarget();
  if (!jabsBattler)
  {
    // if we don't have a target, get the last hit battler instead.
    jabsBattler = this.getBattlerLastHit();
  }

  if (!jabsBattler)
  {
    // if we don't have a last hit battler, then give up on this.
    return;
  }

  // grab the battler being affected by this item.
  const battler = jabsBattler.getBattler();

  // create the game action based on the data.
  const gameAction = new Game_Action(battler, false);

  // apply the effects against the battler.
  gameAction.apply(battler);

  // generate the text popup for the item usage on the target.
  this.generatePopItem(gameAction, toolId, jabsBattler);
};

/**
 * Applies the effects of the tool against all opponents on the map.
 * @param {number} toolId The id of the tool/item being used.
 */
JABS_Battler.prototype.applyToolForAllOpponents = function (toolId)
{
  const battlers = JABS_AiManager.getEnemyBattlers();
  battlers.forEach(jabsBattler =>
  {
    // grab the battler being affected by this item.
    const battler = jabsBattler.getBattler();

    // create the game action based on the data.
    const gameAction = new Game_Action(battler, false);

    // apply the effects against the battler.
    gameAction.apply(battler);

    // generate the text popup for the item usage on the target.
    this.generatePopItem(gameAction, toolId);
  }, this);
};

/**
 * Creates the text log entry for executing an tool effect.
 * @param {RPG_Item} item The tool being used in the log.
 */
JABS_Battler.prototype.createToolLog = function (item)
{
  // if not enabled, skip this.
  if (!J.LOG) return;

  const toolUsedLog = new LootLogBuilder()
    .setupUsedItem(item.id)
    .build();
  $lootLogManager.addLog(toolUsedLog);
};

/**
 * Executes the pre-defeat processing for a battler.
 * @param {JABS_Battler} victor The battler that defeated this battler.
 */
JABS_Battler.prototype.performPredefeatEffects = function (victor)
{
  // handle death animations first.
  this.handleOnDeathAnimations();

  // handle the skills executed when this battler is defeated.
  this.handleOnOwnDefeatSkills(victor);

  // handle skills executed when the victor defeats a target.
  this.handleOnTargetDefeatSkills(victor);
};

/**
 * Handles the on-death animations associated with this battler.
 */
JABS_Battler.prototype.handleOnDeathAnimations = function ()
{
  // grab the loser battler.
  const battler = this.getBattler();

  // check if this is an actor with a death effect.
  if (battler.isActor() && battler.needsDeathEffect())
  {
    // perform the actor death animation.
    this.handleActorOnDeathAnimation();
  }
  // if not actor, then check for an enemy.
  else if (battler.isEnemy())
  {
    // perform the enemy death animation.
    this.handleEnemyOnDeathAnimation();
  }
};

/**
 * Handles the on-death animation for actors.
 * Since actors will persist as followers after defeat, they require additional
 * logic to prevent the repeated loop of death animation.
 */
JABS_Battler.prototype.handleActorOnDeathAnimation = function ()
{
  // perform the actor death animation.
  this.showAnimation(152);

  // flag the death effect as "performed".
  this.getBattler()
    .toggleDeathEffect();
};

/**
 * Handle the on-death animation for enemies.
 * Since they are instantly removed after, their logic doesn't require
 * toggling of battler death effects.
 */
JABS_Battler.prototype.handleEnemyOnDeathAnimation = function ()
{
  // perform the enemy death animation.
  this.showAnimation(151);
};

/**
 * Handles the execution of any on-own-defeat skills the defeated battler may possess.
 * @param {JABS_Battler} victor The battler that defeated this battler.
 */
JABS_Battler.prototype.handleOnOwnDefeatSkills = function (victor)
{
  // grab the loser battler.
  const battler = this.getBattler();

  // grab all of the loser battler's on-death skills to execute.
  const onOwnDefeatSkills = battler.onOwnDefeatSkillIds();

  // an iterator function for executing all relevant on-own-defeat skills.
  const forEacher = onDefeatSkill =>
  {
    // extract out the data points from the skill.
    const { skillId } = onDefeatSkill;

    // roll the dice and see if we should trigger this on-own-death skill.
    if (onDefeatSkill.shouldTrigger())
    {
      // extract whether or not this on-defeat skill should be cast from the target.
      const castFromTarget = onDefeatSkill.appearOnTarget();

      // check if the skill should be cast from the target.
      if (castFromTarget)
      {
        // execute it from the target!
        $jabsEngine.forceMapAction(this, skillId, false, victor.getX(), victor.getY());
      }
      // it should be cast from the victor.
      else
      {
        // execute it from the caster like default.
        $jabsEngine.forceMapAction(this, skillId, false);
      }
    }
  };

  // iterate over each of the on-death skills.
  onOwnDefeatSkills.forEach(forEacher, this);
};

/**
 * Handles the execution of any on-target-defeat skills the victorious battler may possess.
 * @param {JABS_Battler} victor The battler that defeated this battler.
 */
JABS_Battler.prototype.handleOnTargetDefeatSkills = function (victor)
{
  // grab all of the victor battler's on-target-defeat skills.
  const onTargetDefeatSkills = victor.getBattler()
    .onTargetDefeatSkillIds();

  // an iterator function for executing all relevant on-target-defeat skills.
  const forEacher = onDefeatSkill =>
  {
    // extract out the data points from the skill.
    const { skillId } = onDefeatSkill;

    // roll the dice and see if we should trigger this on-target-defeat skill.
    if (onDefeatSkill.shouldTrigger())
    {
      // extract whether or not this on-defeat skill should be cast from the target.
      const castFromTarget = onDefeatSkill.appearOnTarget();

      // check if the skill should be cast from the target.
      if (castFromTarget)
      {
        // execute it from the target!
        $jabsEngine.forceMapAction(victor, skillId, false, this.getX(), this.getY());
      }
      // it should be cast from the victor.
      else
      {
        // execute it from the caster like default.
        $jabsEngine.forceMapAction(victor, skillId, false);
      }
    }
  };

  // iterate over each the on-target-defeat skills.
  onTargetDefeatSkills.forEach(forEacher, this);
};

/**
 * Executes the post-defeat processing for a defeated battler.
 * @param {JABS_Battler} victor The battler that defeated this battler.
 */
JABS_Battler.prototype.performPostdefeatEffects = function (victor)
{
  // check if the defeated battler is an actor.
  if (this.isActor())
  {
    // flag them for death.
    this.setDying(true);
  }
};
//endregion apply effects