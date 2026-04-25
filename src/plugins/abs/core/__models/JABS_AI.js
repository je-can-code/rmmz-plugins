//region JABS_AI
/**
 * A base class containing the commonalities between all AI governed by {@link JABS_AiManager}.
 */
class JABS_AI
{
  /**
   * The collection of battle memories this AI has accumulated.
   * Enemies: in-combat only (cleared on despawn via object lifecycle).
   * Allies: persistent across fights.
   * @type {JABS_BattleMemory[]}
   */
  memory = [];

  /**
   * Decides an action based on this battler's AI, the target, and the given available skills.
   * {@link JABS_EnemyAI} and {@link JABS_AllyAI} override this and return exactly zero or one skill id as a list.
   * @param {JABS_Battler} user The battler of the AI deciding a skill.
   * @param {JABS_Battler} target The target battler to decide an action against.
   * @param {number[]} availableSkills A collection of all skill ids to potentially pick from.
   * @returns {number[]} Empty stub; subclasses return `[]` or `[skillId]`.
   */
  decideAction(user, target, availableSkills)
  {
    return [];
  }

  /**
   * Determines whether or not the attacker should continue with their combo.
   * @param {JABS_Battler} user The user potentially pursuing a combo skill.
   * @returns {boolean} True if the user should follow with combo, false otherwise.
   */
  shouldFollowWithCombo(user)
  {
    // if the AI-controlled battler has no combos ready, they don't combo.
    if (!user.hasComboReady()) return false;

    // grab the combo skill id from the last used skill slot.
    const comboSkillId = user.getComboNextActionId(user.getLastUsedSlot());

    // if the battler doesn't meet the criteria to perform the skill, then don't combo.
    if (!user.canExecuteSkill(comboSkillId)) return false;

    // determine this AI's chance to perform a combo, conditions allowing.
    const comboChance = this.determineComboChance();

    // roll the dice and determine your fate!!
    const comboRng = RPGManager.chanceIn100(comboChance);

    // return combo rngesus's determination in life.
    return comboRng;
  }

  /**
   * Calculates the chance for combos based on this AI's traits.
   * @returns {number} The integer percent chance to perform the combo skill if available.
   */
  determineComboChance()
  {
    // determine the base combo chance.
    const baseChance = this.baseComboChance();

    // determine the modifier based on this ai for comboing.
    const modifierChance = this.aiComboChanceModifier();

    // sum the two chance rates together.
    const comboChance = (baseChance + modifierChance);

    // return whether or not we will combo.
    return comboChance;
  }

  /**
   * Gets the base percent chance for whether or not to perform a combo skill.
   * @returns {number}
   */
  baseComboChance()
  {
    return 50;
  }

  /**
   * Gets the combo skill id of the next
   * @param {JABS_Battler} user The user following with a combo.
   * @returns {number}
   */
  followWithCombo(user)
  {
    // grab the combo skill id from the last used skill slot.
    const comboSkillId = user.getComboNextActionId(user.getLastUsedSlot());

    // return what we found.
    return comboSkillId;
  }

  /**
   * Gets the modifier percent chance, based on the AI of this battler,
   * as to whether or not to perform a combo skill.
   * @returns {number}
   */
  aiComboChanceModifier()
  {
    return 0;
  }

  /**
   * Determines whether or not the parameter provided is a valid skill id.
   * @param {number|number[]|null} skillId The skill id or ids to validate.
   * @returns {boolean} True if it is a single skill id, false otherwise.
   */
  isSkillIdValid(skillId)
  {
    // if the skill id is something falsy like 0/null/undefined, not valid.
    if (!skillId) return false;

    // if the skill id somehow managed to become many skill ids, not valid.
    if (Array.isArray(skillId)) return false;

    // skill id is valid!
    return true;
  }

  /**
   * Filters out skills that cannot be executed at this time by the battler.
   * This prevents the user from continuously picking a skill they cannot execute.
   * @param {JABS_Battler} user The battler to decide the skill for.
   * @param {number[]} skillsToUse The available skills to use.
   * @returns {number[]}
   */
  filterUncastableSkills(user, skillsToUse)
  {
    // check to make sure we have skills to filter.
    if (!skillsToUse || !skillsToUse.length) return [];

    // filter the skills by whether or not they can be executed.
    return skillsToUse.filter(user.canExecuteSkill, user);
  }

  /**
   * Determines which skill would deal the greatest amount of damage to the target.
   * @param {number[]} usableSkills The skill ids available to choose from.
   * @param {JABS_Battler} user The battler choosing the skill.
   * @param {JABS_Battler} target The targeted battler to use the skill against.
   * @returns {number}
   */
  determineStrongestSkill(usableSkills, user, target)
  {
    // initialize tracking for data points that determine skill strength.
    let strongestSkillId = 0;
    let highestDamage = 0;
    let biggestCritDamage = 0;

    // an iterator function for calculating projected damage for each skill to find the strongest.
    const forEacher = skillId =>
    {
      const skill = user.getSkill(skillId);

      // setup a game action for testing damage.
      const testAction = new Game_Action(user.getBattler(), false);
      testAction.setItemObject(skill);

      // test the base and crit damage values for this skill against the target.
      const baseDamageValue = testAction.makeDamageValue(target.getBattler(), false);
      const critDamageValue = testAction.makeDamageValue(target.getBattler(), true);

      // we live risky- if the crit damage is bigger due to crit damage modifiers, then try that.
      if (critDamageValue > biggestCritDamage)
      {
        strongestSkillId = skillId;
        highestDamage = baseDamageValue;
        biggestCritDamage = critDamageValue;
        return;
      }

      // if the crit isn't modified, then just go based on best base damage.
      if (baseDamageValue > highestDamage)
      {
        strongestSkillId = skillId;
        highestDamage = baseDamageValue;
        biggestCritDamage = critDamageValue;
      }
    };

    // iterate over each skill id to see which is the strongest.
    usableSkills.forEach(forEacher, this);

    // return the strongest found skill id.
    return strongestSkillId;
  }

  //region attack filters
  /**
   * A protection method for handling none, one, or many skills remaining after
   * filtering, and only returning a single skill id.
   * @param {JABS_Battler} user The battler to decide the skill for.
   * @param {number[]|number|null} skillsToUse The available skills to use.
   * @returns {number}
   */
  decideFromNoneToManySkills(user, skillsToUse)
  {
    // check if "skills" is actually just one valid skill.
    if (Number.isInteger(skillsToUse))
    {
      // return that, this is fine.
      return skillsToUse;
    }
    // check if "skills" is indeed an array of skills with values.
    else if (Array.isArray(skillsToUse) && skillsToUse.length)
    {
      // pick one at random.
      return skillsToUse[Math.randomInt(skillsToUse.length)];
    }

    // always at least basic attack.
    return user.getEnemyBasicAttack();
  }

  /**
   * Filters out skills that are elementally ineffective against the target.
   * Only filters when more than one skill is available so a choice remains.
   * @param {number[]} skillsToUse The available skills to use.
   * @param {JABS_Battler} user The battler performing the action.
   * @param {JABS_Battler} target The battler being targeted.
   * @returns {number[]}
   */
  filterElementallyIneffectiveSkills(skillsToUse, user, target)
  {
    if (skillsToUse.length <= 1) return skillsToUse;

    return skillsToUse.filter(skillId =>
    {
      const testAction = new Game_Action(user.getBattler());
      testAction.setSkill(skillId);
      const rate = testAction.calcElementRate(target.getBattler());
      return rate >= 1;
    });
  }

  /**
   * Narrows the skill list to the single most elementally effective skill against the target.
   * Returns the original array unchanged if only one skill is present.
   * @param {number[]} skillsToUse The available skills to use.
   * @param {JABS_Battler} user The battler deciding the action.
   * @param {JABS_Battler} target The battler being targeted.
   * @returns {number[]}
   */
  findMostElementallyEffectiveSkill(skillsToUse, user, target)
  {
    if (skillsToUse.length <= 1) return skillsToUse;

    const elementalSkillCollection = [];
    skillsToUse.forEach(skillId =>
    {
      const testAction = new Game_Action(user.getBattler());
      testAction.setSkill(skillId);
      const rate = testAction.calcElementRate(target.getBattler());
      elementalSkillCollection.push([ skillId, rate ]);
    });

    // sort descending by elemental effectiveness.
    elementalSkillCollection.sort((a, b) =>
    {
      if (a[1] > b[1]) return -1;
      if (a[1] < b[1]) return 1;
      return 0;
    });

    // wrap result as an array so the caller can use decideFromNoneToManySkills uniformly.
    return [ elementalSkillCollection[0][0] ];
  }
  //endregion attack filters

  //region support decisions
  /**
   * Decides the best cleansing skill to use on the nearest ally suffering a negative state.
   * Returns 0 if no cleansing is needed or possible.
   * @param {JABS_Battler} user The battler choosing the skill.
   * @param {number[]} availableSkills The skill ids available to choose from.
   * @returns {number}
   */
  decideCleansing(user, availableSkills)
  {
    const nearbyAllies = user.getAllNearbyAllies();
    let bestSkillId = 0;

    nearbyAllies.forEach(ally =>
    {
      const allyBattler = ally.getBattler();
      const allyStates = allyBattler.states();
      if (allyStates.length === 0) return;

      const cleansableState = allyStates.find(state =>
      {
        const isNegative = state.jabsNegative;
        const canBeCleansed = this.determineBestSkillForStateCleansing(availableSkills, state.id, user);
        return isNegative && canBeCleansed;
      });

      if (cleansableState)
      {
        bestSkillId = this.determineBestSkillForStateCleansing(availableSkills, cleansableState.id, user);
      }
    });

    return bestSkillId;
  }

  /**
   * Decides the best healing skill to use based on ally health status.
   * Returns 0 if no healing is needed or possible.
   * @param {JABS_Battler} user The battler choosing the skill.
   * @param {number[]} availableSkills The skill ids available to choose from.
   * @returns {number}
   */
  decideHealing(user, availableSkills)
  {
    const healingTypeSkills = availableSkills.filter(skillId =>
    {
      const testAction = new Game_Action(user.getBattler());
      testAction.setSkill(skillId);
      return (testAction.isForAliveFriend() && testAction.isRecover() && testAction.isHpEffect());
    });

    if (healingTypeSkills.length === 0) return 0;

    const lowestAlly = this.determineLowestHpAlly(user);
    user.setAllyTarget(lowestAlly);

    const below60 = this.countLowHpAllies(user);

    if (below60 === 0) return 0;

    const lowestAllyBattler = lowestAlly.getBattler();
    const healerBattler = user.getBattler();

    if (below60 === 1)
    {
      return this.bestFitHealingOneSkill(healingTypeSkills, healerBattler, lowestAllyBattler);
    }

    return this.bestFitHealingAllSkill(healingTypeSkills, healerBattler, lowestAllyBattler);
  }

  /**
   * Decides the best buffing skill to apply to a nearby ally missing a buff.
   * Returns 0 if no buffing is needed or possible.
   * @param {JABS_Battler} user The battler choosing the skill.
   * @param {number[]} availableSkills The skill ids available to choose from.
   * @returns {number}
   */
  decideBuffing(user, availableSkills)
  {
    const nearbyAllies = user.getAllNearbyAllies();
    let bestSkillId = 0;
    let chosenAlly = null;

    availableSkills.forEach(skillId =>
    {
      const skill = user.getSkill(skillId);
      const stateAddingEffects = skill.effects.filter(fx => fx.code === 21);
      if (stateAddingEffects.length === 0) return;

      let ready = false;
      stateAddingEffects.forEach(effect =>
      {
        if (ready) return;

        nearbyAllies.forEach(ally =>
        {
          const trackedState = $jabsEngine.getJabsStateByUuidAndStateId(ally.getUuid(), effect.dataId);
          if (!trackedState || trackedState.isAboutToExpire())
          {
            ready = true;
            bestSkillId = skillId;
            chosenAlly = ally;
          }
        });
      });
    });

    if (chosenAlly)
    {
      user.setAllyTarget(chosenAlly);
    }

    return bestSkillId;
  }

  /**
   * Gets the lowest hp ally nearby.
   * @param {JABS_Battler} healer The battler performing the healing.
   * @returns {JABS_Battler}
   */
  determineLowestHpAlly(healer)
  {
    const nearbyAllies = healer.getAllNearbyAllies();
    let lowestAlly = null;

    nearbyAllies.forEach(ally =>
    {
      if (!lowestAlly)
      {
        lowestAlly = ally;
      }
      else if (ally.getBattler().currentHpPercent() < lowestAlly.getBattler().currentHpPercent())
      {
        lowestAlly = ally;
      }
    });

    return lowestAlly;
  }

  /**
   * Gets how many of the nearby allies are below the given hp threshold.
   * @param {JABS_Battler} healer The battler performing the healing.
   * @param {number} threshold The decimal percent (0-1) below which hp is considered low.
   * @returns {number}
   */
  countLowHpAllies(healer, threshold = 0.6)
  {
    const nearbyAllies = healer.getAllNearbyAllies();
    let belowThreshold = 0;

    nearbyAllies.forEach(ally =>
    {
      if (ally.getBattler().currentHpPercent() < threshold)
      {
        belowThreshold++;
      }
    });

    return belowThreshold;
  }

  /**
   * Finds the best-fit single-target or all-target healing skill for the wounded ally.
   * @param {number[]} healingTypeSkills The collection of hp-restoring skills.
   * @param {Game_Battler} healerBattler The battler choosing the skill.
   * @param {Game_Battler} lowestAllyBattler The ally with the lowest hp.
   * @returns {number}
   */
  bestFitHealingOneSkill(healingTypeSkills, healerBattler, lowestAllyBattler)
  {
    let bestSkillId = 0;
    let smallestDifference = Number.MAX_SAFE_INTEGER;

    healingTypeSkills.forEach(skillId =>
    {
      const skill = healerBattler.skill(skillId);
      const testAction = new Game_Action(healerBattler);
      testAction.setItemObject(skill);

      // skip self-only skills when the lowest ally isn't the healer.
      if (healerBattler !== lowestAllyBattler && testAction.isForUser()) return;

      // only consider skills targeting one, all, or dead allies.
      if (!testAction.isForOne() && !testAction.isForAll() && !testAction.isForDeadFriend()) return;

      const healAmount = Math.abs(testAction.makeDamageValue(lowestAllyBattler, false));
      const differenceFromMax = Math.abs((lowestAllyBattler.hp + healAmount) - lowestAllyBattler.mhp);
      if (differenceFromMax < smallestDifference)
      {
        bestSkillId = skillId;
        smallestDifference = differenceFromMax;
      }
    });

    return bestSkillId;
  }

  /**
   * Finds the best-fit multi-target healing skill.
   * Falls back to single-target if no multi-target skills are available.
   * @param {number[]} healingTypeSkills The collection of hp-restoring skills.
   * @param {Game_Battler} healerBattler The battler choosing the skill.
   * @param {Game_Battler} lowestAllyBattler The ally with the lowest hp.
   * @returns {number}
   */
  bestFitHealingAllSkill(healingTypeSkills, healerBattler, lowestAllyBattler)
  {
    const multiTargetSkills = healingTypeSkills.filter(skillId =>
    {
      const skill = healerBattler.skill(skillId);
      const testAction = new Game_Action(healerBattler);
      testAction.setItemObject(skill);
      return testAction.isForAll();
    });

    if (multiTargetSkills.length === 0)
    {
      return this.bestFitHealingOneSkill(healingTypeSkills, healerBattler, lowestAllyBattler);
    }

    if (multiTargetSkills.length === 1) return multiTargetSkills[0];

    let bestSkillId = 0;
    let smallestDifference = 99999999;

    multiTargetSkills.forEach(skillId =>
    {
      const skill = healerBattler.skill(skillId);
      const testAction = new Game_Action(healerBattler);
      testAction.setItemObject(skill);

      const healAmount = Math.abs(testAction.makeDamageValue(lowestAllyBattler, false));
      const differenceFromMax = Math.abs((lowestAllyBattler.hp + healAmount) - lowestAllyBattler.mhp);
      if (differenceFromMax < smallestDifference)
      {
        bestSkillId = skillId;
        smallestDifference = differenceFromMax;
      }
    });

    return bestSkillId;
  }

  /**
   * Finds the skill with the highest removal rate for the given state.
   * @param {number[]} availableSkills The skill ids available to choose from.
   * @param {number} stateIdToBeCleansed The id of the state to be cleansed.
   * @param {JABS_Battler} healer The battler choosing the skill.
   * @returns {number}
   */
  determineBestSkillForStateCleansing(availableSkills, stateIdToBeCleansed, healer)
  {
    let bestSkillForStateCleansing = null;
    let highestCleanseRate = 0.0;

    availableSkills.forEach(skillId =>
    {
      const skill = healer.getSkill(skillId);
      const stateCleansingEffects = skill.effects.filter(fx => fx.code === 22 && fx.dataId === stateIdToBeCleansed);

      if (stateCleansingEffects.length > 0)
      {
        stateCleansingEffects.forEach(effect =>
        {
          if (highestCleanseRate < effect.value1)
          {
            bestSkillForStateCleansing = skillId;
            highestCleanseRate = effect.value1;
          }
        });
      }
    });

    return bestSkillForStateCleansing;
  }
  //endregion support decisions

  //region battle memory
  /**
   * Handles a new memory, adding it or updating the existing record.
   * @param {JABS_BattleMemory} newMemory The new memory to handle.
   */
  applyMemory(newMemory)
  {
    const memory = this.getMemory(newMemory.battlerId, newMemory.skillId);
    if (!memory)
    {
      this.addMemory(newMemory);
    }
    else
    {
      this.updateMemory(newMemory);
    }
  }

  /**
   * Gets a memory for a given battler id and skill id.
   * @param {number} battlerId The composite key for the battler.
   * @param {number} skillId The composite key for the skill.
   * @returns {JABS_BattleMemory|undefined}
   */
  getMemory(battlerId, skillId)
  {
    return this.getMemories()
      .find(mem => mem.battlerId === battlerId && mem.skillId === skillId);
  }

  /**
   * Gets all memories currently stored by this AI.
   * @returns {JABS_BattleMemory[]}
   */
  getMemories()
  {
    return this.memory;
  }

  /**
   * Adds a new battle memory.
   * @param {JABS_BattleMemory} newMemory The new memory to add.
   */
  addMemory(newMemory)
  {
    this.memory.push(newMemory);
    this.memory.sort();
  }

  /**
   * Updates an existing battle memory with new effectiveness data.
   * @param {JABS_BattleMemory} newMemory The memory to update with.
   */
  updateMemory(newMemory)
  {
    const memory = this.getMemory(newMemory.battlerId, newMemory.skillId);
    memory.effectiveness = newMemory.effectiveness;
    memory.damageApplied = newMemory.damageApplied;
    this.memory.sort();
  }

  /**
   * Filters a list of skill ids down to only those remembered as effective against a target.
   * @param {number[]} usableSkills The skill ids being filtered.
   * @param {JABS_BattleMemory[]} memoriesOfTarget All memories stored for this target.
   * @returns {number[]} Only the skill ids recalled as effective.
   */
  filterMemoriesByEffectiveness(usableSkills, memoriesOfTarget)
  {
    const filtering = skillId =>
    {
      const priorMemory = memoriesOfTarget.find(mem => mem.skillId === skillId);
      if (!priorMemory) return false;
      if (priorMemory.wasEffective()) return true;
      return false;
    };

    return usableSkills.filter(filtering, this);
  }
  //endregion battle memory
}

//endregion JABS_AI