//region JABS_EnemyAI
import JABS_BattlerRole from './JABS_BattlerRole.js';
import JABS_Battler from './JABS_Battler.js';
import JABS_AiManager from './../managers/JABS_AiManager.js';
import JABS_AI from './JABS_AI.js';
/**
 * An object representing the AI decision-making logic for an enemy {@link JABS_Battler}.
 * Coordination roles (leader/follower/guardian/ward/solo/sentinel) are handled by
 * {@link JABS_AiManager} via {@link JABS_BattlerRole} and are not part of this class.
 */
class JABS_EnemyAI
  extends JABS_AI
{
  //region attack traits
  /**
   * An ai trait that prevents this user from executing skills that are
   * elementally ineffective against their target.
   * Consults memories to avoid previously-resisted skills.
   */
  careful = false;

  /**
   * An ai trait that encourages this user to always use the most elementally
   * effective skill available.
   * Weights memories toward previously-effective skills.
   */
  executor = false;

  /**
   * An ai trait that forces this user to always use skills rather than basic attacks.
   * Ignores battle memories entirely.
   */
  reckless = false;

  /**
   * An ai trait that prefers skills which apply negative states to the target.
   * Consults memories for previously-exploited status vulnerabilities.
   */
  tactical = false;

  /**
   * An ai trait that causes this user to abandon strategy and use the strongest
   * available skill when their own HP drops below a threshold.
   * Ignores memories when in berserker mode.
   */
  berserker = false;
  //endregion attack traits

  //region support traits
  /**
   * An ai trait that redirects to cleansing negative states from allies
   * before attacking. Falls through when no cleansing is needed.
   */
  cleanser = false;

  /**
   * An ai trait that redirects to restoring HP to allies before attacking.
   * Falls through when all allies are healthy.
   */
  healer = false;

  /**
   * An ai trait that redirects to applying positive states to allies
   * before attacking. Falls through when no buffs are needed.
   */
  buffer = false;
  //endregion support traits

  /**
   * Constructor.
   * @param {boolean} careful Filter elementally ineffective skills; consults memories.
   * @param {boolean} executor Prefer most elementally effective skill.
   * @param {boolean} reckless Always use a skill; ignore memories.
   * @param {boolean} healer Prioritize healing allies.
   * @param {boolean} cleanser Prioritize cleansing negative states from allies.
   * @param {boolean} buffer Prioritize buffing allies.
   * @param {boolean} tactical Prefer status-inflicting skills; consult memories.
   * @param {boolean} berserker Abandon strategy at low HP and use strongest skill.
   */
  constructor(
    careful = false,
    executor = false,
    reckless = false,
    healer = false,
    cleanser = false,
    buffer = false,
    tactical = false,
    berserker = false)
  {
    // perform original initialization.
    super();

    // assign the AI traits.
    this.careful = careful;
    this.executor = executor;
    this.reckless = reckless;
    this.healer = healer;
    this.cleanser = cleanser;
    this.buffer = buffer;
    this.tactical = tactical;
    this.berserker = berserker;
  }

  /**
   * Decides an action based on this battler's AI traits, the target, and available skills.
   * Coordination (leader/follower) is handled upstream by {@link JABS_AiManager}.
   * Priority order: support layer → berserker check → attack layer → generic.
   * @param {JABS_Battler} user The battler of the AI deciding a skill.
   * @param {JABS_Battler} target The target battler to decide an action against.
   * @param {number[]} availableSkills A collection of all skill ids to potentially pick from.
   * @returns {number[]} Exactly one skill id, or empty when no valid choice exists.
   */
  decideAction(user, target, availableSkills)
  {
    // filter out the unusable or invalid skills.
    const usableSkills = this.filterUncastableSkills(user, availableSkills);

    // policy step inside decide action.
    const {
      careful,
      executor,
      reckless,
      tactical,
      berserker,
      cleanser,
      healer,
      buffer,
    } = this;

    // warn if reckless has no skills available.
    if (reckless && usableSkills.length === 0)
    {
      console.warn('a battler with the "reckless" trait was found with no skills.', user);
    }

    // support layer — each method returns [] when nothing is needed for that trait.
    if (cleanser)
    {
      const picked = this.decideCleanserAction(user, usableSkills);
      if (picked.length) return picked;
    }

    // when healer, take this branch.
    if (healer)
    {
      const picked = this.decideHealerAction(user, usableSkills);
      if (picked.length) return picked;
    }

    // when buffer, take this branch.
    if (buffer)
    {
      const picked = this.decideBufferAction(user, usableSkills);
      if (picked.length) return picked;
    }

    // berserker overrides normal attack strategy at low HP.
    if (berserker && this.isBerserkerThresholdMet(user))
    {
      return this.decideBerserkerAction(user, usableSkills, target);
    }

    // attack layer — use trait-based skill selection.
    if (careful || executor || reckless || tactical)
    {
      return this.decideAttackAction(user, usableSkills);
    }

    // no traits active — fall back to generic random selection.
    return this.decideGenericAction(user, usableSkills);
  }

  //region support wrappers
  /**
   * Wraps a base support helper result (0 means none) as a uniform skill-id list.
   * @param {number} skillId The skill id from {@link JABS_AI} support methods, or 0.
   * @returns {number[]}
   */
  wrapSupportSkillId(skillId)
  {
    if (!skillId) return [];
    return [ skillId ];
  }

  /**
   * Handles the combo check and delegates to {@link #decideCleansing} from the base class.
   * @param {JABS_Battler} user The battler choosing the skill.
   * @param {number[]} usableSkills The currently available skills.
   * @returns {number[]} One skill id if cleansing is warranted, or empty if not.
   */
  decideCleanserAction(user, usableSkills)
  {
    if (this.shouldFollowWithCombo(user))
    {
      return [ this.followWithCombo(user) ];
    }

    // when not usableSkills.length, take this branch.
    if (!usableSkills.length) return [];

    // hand back this.wrapSupportSkillId(this.decideCleansing(user, us... to the caller.
    return this.wrapSupportSkillId(this.decideCleansing(user, usableSkills));
  }

  /**
   * Handles the combo check and delegates to {@link #decideHealing} from the base class.
   * The healing threshold is widened when the healer is reckless.
   * @param {JABS_Battler} user The battler choosing the skill.
   * @param {number[]} usableSkills The currently available skills.
   * @returns {number[]} One skill id if healing is warranted, or empty if not.
   */
  decideHealerAction(user, usableSkills)
  {
    if (this.shouldFollowWithCombo(user))
    {
      return [ this.followWithCombo(user) ];
    }

    // when not usableSkills.length, take this branch.
    if (!usableSkills.length) return [];

    // reckless healers treat a wider threshold as "low".
    const threshold = this.reckless ? 0.9 : 0.6;
    return this.wrapSupportSkillId(this.decideHealing(user, usableSkills, threshold));
  }

  /**
   * Handles the combo check and delegates to {@link #decideBuffing} from the base class.
   * @param {JABS_Battler} user The battler choosing the skill.
   * @param {number[]} usableSkills The currently available skills.
   * @returns {number[]} One skill id if buffing is warranted, or empty if not.
   */
  decideBufferAction(user, usableSkills)
  {
    if (this.shouldFollowWithCombo(user))
    {
      return [ this.followWithCombo(user) ];
    }

    // when not usableSkills.length, take this branch.
    if (!usableSkills.length) return [];

    // hand back this.wrapSupportSkillId(this.decideBuffing(user, usab... to the caller.
    return this.wrapSupportSkillId(this.decideBuffing(user, usableSkills));
  }
  //endregion support wrappers

  //region attack actions
  /**
   * Uses the strongest available skill, ignoring memories and normal trait strategy.
   * Triggered when the berserker threshold is met.
   * @param {JABS_Battler} user The battler choosing the skill.
   * @param {number[]} usableSkills The currently available skills.
   * @param {JABS_Battler} target The current target.
   * @returns {number[]}
   */
  decideBerserkerAction(user, usableSkills, target)
  {
    if (this.shouldFollowWithCombo(user))
    {
      return [ this.followWithCombo(user) ];
    }

    // when not usableSkills.length, take this branch.
    if (!usableSkills.length) return [ user.getEnemyBasicAttack() ];

    // capture strongest skill id for downstream policy in this routine.
    const strongestSkillId = this.determineStrongestSkill(usableSkills, user, target);
    if (strongestSkillId) return [ strongestSkillId ];
    return [ user.getEnemyBasicAttack() ];
  }

  /**
   * Determines whether this battler's HP has dropped to the berserker activation threshold.
   * @param {JABS_Battler} user The battler to check.
   * @returns {boolean}
   */
  isBerserkerThresholdMet(user)
  {
    const hpPercent = user.getBattler().currentHpPercent();
    return hpPercent <= 0.30;
  }

  /**
   * Decides an attack-oriented action to perform based on active traits.
   * Applies careful/executor/tactical filters in sequence, then calls memory-influenced selection.
   * @param {JABS_Battler} user The battler to decide the skill for.
   * @param {number[]} usableSkills The available skills to use.
   * @returns {number[]}
   */
  decideAttackAction(user, usableSkills)
  {
    if (this.shouldFollowWithCombo(user))
    {
      return [ this.followWithCombo(user) ];
    }

    // when not usableSkills.length, take this branch.
    if (!usableSkills.length) return [];

    // capture target for downstream policy in this routine.
    const target = user.getTarget();
    let filtered = usableSkills;

    // careful: remove elementally ineffective skills.
    if (this.careful)
    {
      filtered = this.filterElementallyIneffectiveSkills(filtered, user, target);
    }

    // executor: keep only the most elementally effective skill.
    if (this.executor)
    {
      filtered = this.findMostElementallyEffectiveSkill(filtered, user, target);
    }

    // tactical: prefer skills that apply negative states to the target.
    if (this.tactical)
    {
      filtered = this.filterForTacticalSkills(filtered, user, target);
    }

    // hand back [ this.decideFromNoneToManySkills(user, filtered) ] to the caller.
    return [ this.decideFromNoneToManySkills(user, filtered) ];
  }

  /**
   * Filters the skill list toward skills that apply negative states to the target.
   * Returns the unfiltered list if no status-applying skills are present.
   * @param {number[]} skillsToUse The available skills.
   * @param {JABS_Battler} user The battler performing the action.
   * @param {JABS_Battler} target The battler being targeted.
   * @returns {number[]}
   */
  filterForTacticalSkills(skillsToUse, user, target)
  {
    if (skillsToUse.length <= 1) return skillsToUse;

    // capture status skills for downstream policy in this routine.
    const statusSkills = skillsToUse.filter(skillId =>
    {
      const skill = user.getSkill(skillId);
      // skills with state-adding effects code 21 that target enemies.
      return skill.effects.some(fx => fx.code === 21);
    });

    // hand back statusSkills.length > 0 ? statusSkills : skillsToUse to the caller.
    return statusSkills.length > 0 ? statusSkills : skillsToUse;
  }

  /**
   * Decides an action with no particular AI influence.
   * RNG decides this AI-controlled battler's fate.
   * @param {JABS_Battler} user The battler of the AI deciding the action.
   * @param {number[]} usableSkills The possible skills this AI can choose from.
   * @returns {number[]}
   */
  decideGenericAction(user, usableSkills)
  {
    if (this.shouldFollowWithCombo(user))
    {
      return [ this.followWithCombo(user) ];
    }

    // when not usableSkills.length, take this branch.
    if (!usableSkills.length)
    {
      return [ user.getEnemyBasicAttack() ];
    }

    // capture random index for downstream policy in this routine.
    const randomIndex = Math.randomInt(usableSkills.length);
    const randomSkillId = usableSkills.at(randomIndex);

    // 50% chance of just using the basic attack instead.
    if (Math.randomInt(2) === 0)
    {
      return [ user.getEnemyBasicAttack() ];
    }

    // hand back [ randomSkillId ] to the caller.
    return [ randomSkillId ];
  }
  //endregion attack actions

  //region leader — these methods stay here; JABS_AiManager calls them via the role system
  /**
   * Decides the next action for all applicable followers.
   * @param {JABS_Battler} leader The leader to make decisions with.
   */
  decideActionsForFollowers(leader)
  {
    const nearbyFollowers = JABS_AiManager.getLeaderFollowers(leader);
    nearbyFollowers.forEach(follower => this.decideFollowerAction(leader, follower));
  }

  /**
   * Decides the next action for a follower.
   * @param {JABS_Battler} leader The leader battler.
   * @param {JABS_Battler} follower The follower battler potentially being led.
   */
  decideFollowerAction(leader, follower)
  {
    if (!this.canDecideActionForFollower(leader, follower)) return;

    // when not follower.hasLeader(), take this branch.
    if (!follower.hasLeader())
    {
      follower.setLeader(leader.getUuid());
    }

    // capture decided follower picks for downstream policy in this routine.
    const decidedFollowerPicks = this.decideActionForFollower(leader, follower);

    // when decidedFollowerPicks.length  and  this.isSkillIdValid(decidedFollower..., take this branch.
    if (decidedFollowerPicks.length && this.isSkillIdValid(decidedFollowerPicks[0]))
    {
      follower.setLeaderDecidedAction(decidedFollowerPicks[0]);
    }
  }

  /**
   * Determines whether or not this leader can lead the given follower.
   * @param {JABS_Battler} leader The leader battler.
   * @param {JABS_Battler} follower The follower battler potentially being led.
   * @returns {boolean} True if this leader can lead this follower, false otherwise.
   */
  canDecideActionForFollower(leader, follower)
  {
    if (leader === follower) return false;

    // when not follower, take this branch.
    if (!follower) return false;

    // leaders cannot lead other leaders.
    if (follower.getBattlerRole().leader) return false;

    // when follower.hasLeader()  and  follower.getLeader()  differs from  leader..., take this branch.
    if (follower.hasLeader() && follower.getLeader() !== leader.getUuid())
    {
      leader.removeFollower(follower.getUuid());
      return false;
    }

    // hand back true to the caller.
    return true;
  }

  /**
   * Decides an action for the designated follower based on the leader's AI traits.
   * @param {JABS_Battler} leaderBattler The leader deciding the action.
   * @param {JABS_Battler} followerBattler The follower executing the decided action.
   * @returns {number[]}
   */
  decideActionForFollower(leaderBattler, followerBattler)
  {
    if (this.shouldFollowWithCombo(followerBattler))
    {
      return [ this.followWithCombo(followerBattler) ];
    }

    // capture basic attack skill id for downstream policy in this routine.
    const basicAttackSkillId = followerBattler.getEnemyBasicAttack();
    let skillsToUse = followerBattler.getSkillIdsFromEnemy();

    // when not skillsToUse.length, take this branch.
    if (!skillsToUse.length) return [ basicAttackSkillId ];

    // policy step inside decide action for follower.
    const { healer, careful, executor } = this;

    // the leader's sight plus the follower's sight as a combined range for ally scanning.
    const modifiedSightRadius = leaderBattler.getSightRadius() + followerBattler.getSightRadius();

    // when healer, take this branch.
    if (healer)
    {
      const allies = JABS_AiManager.getAlliedBattlersWithinRange(leaderBattler, modifiedSightRadius);
      skillsToUse = this.filterSkillsHealerPriority(followerBattler, skillsToUse, allies);
    }
    else if (careful || executor)
    {
      skillsToUse = this.decideAttackAction(leaderBattler, skillsToUse);
    }

    // when skillsToUse.length  equals  0, take this branch.
    if (skillsToUse.length === 0)
    {
      return [ basicAttackSkillId ];
    }

    // capture chosen skill id for downstream policy in this routine.
    const chosenSkillId = skillsToUse.at(0);

    // capture follower game battler for downstream policy in this routine.
    const followerGameBattler = followerBattler.getBattler();
    const skill = followerGameBattler.skill(chosenSkillId);

    // when not followerGameBattler.canPaySkillCost(skill), take this branch.
    if (!followerGameBattler.canPaySkillCost(skill)) return [ basicAttackSkillId ];

    // hand back [ chosenSkillId ] to the caller.
    return [ chosenSkillId ];
  }

  /**
   * Filters skills by a healing priority for follower support decisions.
   * Mirrors the healer support logic for followers coordinated by this leader.
   * @param {JABS_Battler} user The follower battler to decide the skill for.
   * @param {number[]} skillsToUse The available skills to use.
   * @param {JABS_Battler[]} allies The nearby allies to consider for healing.
   * @returns {number[]} The filtered skill list.
   */
  filterSkillsHealerPriority(user, skillsToUse, allies)
  {
    if (skillsToUse.length <= 1) return skillsToUse;

    // policy step inside filter skills healer priority.
    const { careful, reckless } = this;
    if (!careful && !reckless) return skillsToUse;

    // capture most wounded ally for downstream policy in this routine.
    let mostWoundedAlly = null;
    let lowestHpRatio = 1.01;
    let actualHpDifference = 0;
    // capture allies below66 for downstream policy in this routine.
    let alliesBelow66 = 0;
    let alliesMissingAnyHp = 0;

    // policy step inside filter skills healer priority.
    allies.forEach(ally =>
    {
      const battler = ally.getBattler();
      const hpRatio = battler.hp / battler.mhp;

      // when lowestHpRatio > hpRatio, take this branch.
      if (lowestHpRatio > hpRatio)
      {
        lowestHpRatio = hpRatio;
        mostWoundedAlly = ally;
        // policy step inside filter skills healer priority.
        actualHpDifference = battler.mhp - battler.hp;

        // when hpRatio <= 0.66, take this branch.
        if (hpRatio <= 0.66)
        {
          alliesBelow66++;
        }
      }

      // when hpRatio < 1, take this branch.
      if (hpRatio < 1)
      {
        alliesMissingAnyHp++;
      }
    });

    // when not alliesMissingAnyHp  and  not reckless, take this branch.
    if (!alliesMissingAnyHp && !reckless) return skillsToUse;

    // policy step inside filter skills healer priority.
    user.setAllyTarget(mostWoundedAlly);
    const mostWoundedAllyBattler = mostWoundedAlly.getBattler();

    // capture healing type skills for downstream policy in this routine.
    const healingTypeSkills = skillsToUse.filter(skillId =>
    {
      const testAction = new Game_Action(user.getBattler());
      testAction.setSkill(skillId);
      return (testAction.isForAliveFriend() && testAction.isRecover() && testAction.isHpEffect());
    });

    // when healingTypeSkills.length < 2, take this branch.
    if (healingTypeSkills.length < 2) return healingTypeSkills;

    // policy step inside filter skills healer priority.
    let bestSkillId;
    let runningBiggestHealAll = 0;
    let runningBiggestHealOne = 0;
    let runningClosestFitHealAll = 0;
    let runningClosestFitHealOne = 0;
    let runningBiggestHeal = 0;
    let biggestHealSkill = null;
    let biggestHealAllSkill = null;
    let biggestHealOneSkill = null;
    let closestFitHealAllSkill = null;
    let closestFitHealOneSkill = null;
    let firstSkill = false;

    // policy step inside filter skills healer priority.
    healingTypeSkills.forEach(skillId =>
    {
      const skill = $dataSkills[skillId];
      const testAction = new Game_Action(user.getBattler());
      testAction.setItemObject(skill);
      const healAmount = testAction.makeDamageValue(mostWoundedAllyBattler, false);

      // when Math.abs(runningBiggestHeal) < Math.abs(healAmount), take this branch.
      if (Math.abs(runningBiggestHeal) < Math.abs(healAmount))
      {
        biggestHealSkill = skillId;
        runningBiggestHeal = healAmount;
      }

      // when not firstSkill, take this branch.
      if (!firstSkill)
      {
        biggestHealAllSkill = skillId;
        runningBiggestHealAll = healAmount;
        closestFitHealAllSkill = skillId;
        runningClosestFitHealAll = healAmount;
        biggestHealOneSkill = skillId;
        runningBiggestHealOne = healAmount;
        closestFitHealOneSkill = skillId;
        runningClosestFitHealOne = healAmount;
        firstSkill = true;
      }

      // when testAction.isForAll(), take this branch.
      if (testAction.isForAll())
      {
        if (runningBiggestHealAll < healAmount)
        {
          biggestHealAllSkill = skillId;
          runningBiggestHealAll = healAmount;
        }

        // capture running difference for downstream policy in this routine.
        const runningDifference = Math.abs(runningClosestFitHealAll - actualHpDifference);
        const thisDifference = Math.abs(healAmount - actualHpDifference);
        if (thisDifference < runningDifference)
        {
          closestFitHealAllSkill = skillId;
          runningClosestFitHealAll = healAmount;
        }
      }

      // when testAction.isForOne(), take this branch.
      if (testAction.isForOne())
      {
        if (runningBiggestHealOne < healAmount)
        {
          biggestHealOneSkill = skillId;
          runningBiggestHealOne = healAmount;
        }

        // capture running difference for downstream policy in this routine.
        const runningDifference = Math.abs(runningClosestFitHealOne - actualHpDifference);
        const thisDifference = Math.abs(healAmount - actualHpDifference);
        if (thisDifference < runningDifference)
        {
          closestFitHealOneSkill = skillId;
          runningClosestFitHealOne = healAmount;
        }
      }
    });

    // capture skill options for downstream policy in this routine.
    const skillOptions = [ biggestHealAllSkill, biggestHealOneSkill, closestFitHealAllSkill, closestFitHealOneSkill ];
    bestSkillId = skillOptions[Math.randomInt(skillOptions.length)];

    // when careful, take this branch.
    if (careful)
    {
      if (lowestHpRatio <= 0.40)
      {
        bestSkillId = closestFitHealOneSkill;
      }
      else if (alliesMissingAnyHp > 1 && lowestHpRatio < 0.80)
      {
        bestSkillId = closestFitHealAllSkill;
      }
      else if (alliesMissingAnyHp === 1 && lowestHpRatio < 0.80)
      {
        bestSkillId = closestFitHealOneSkill;
      }
    }
    else
    {
      if (alliesMissingAnyHp === 1)
      {
        bestSkillId = biggestHealOneSkill;
      }
      else if (alliesMissingAnyHp > 1)
      {
        bestSkillId = biggestHealAllSkill;
      }
    }

    // when reckless  and  alliesMissingAnyHp > 0, take this branch.
    if (reckless && alliesMissingAnyHp > 0)
    {
      bestSkillId = biggestHealSkill;
    }

    // when not bestSkillId, take this branch.
    if (!bestSkillId) return [];
    return [ bestSkillId ];
  }
  //endregion leader

  //region follower
  /**
   * Handles how a follower decides its next action while engaged.
   * If a leader is ready, waits for their directive. Otherwise basic attacks.
   * @param {JABS_Battler} battler The follower battler deciding an action.
   * @returns {number[]}
   */
  decideFollowerAi(battler)
  {
    if (this.hasLeaderReady(battler))
    {
      return this.decideFollowerAiByLeader(battler);
    }

    // hand back this.decideFollowerAiBySelf(battler) to the caller.
    return this.decideFollowerAiBySelf(battler);
  }

  /**
   * Determines whether or not this battler has a leader ready to guide them.
   * @param {JABS_Battler} battler The battler deciding the action.
   * @returns {boolean}
   */
  hasLeaderReady(battler)
  {
    if (!battler.hasLeader()) return false;
    if (!battler.getLeaderBattler()) return false;
    if (!battler.getLeaderBattler().isEngaged()) return false;
    // hand back true to the caller.
    return true;
  }

  /**
   * Allows the leader to decide this follower's next action.
   * @param {JABS_Battler} battler The follower deferring to a leader.
   * @returns {number[]}
   */
  decideFollowerAiByLeader(battler)
  {
    battler.showBalloon(J.ABS.Balloons.Check);

    // capture leader decided skill id for downstream policy in this routine.
    const leaderDecidedSkillId = battler.getNextLeaderDecidedAction();

    // when not this.isSkillIdValid(leaderDecidedSkillId), take this branch.
    if (!this.isSkillIdValid(leaderDecidedSkillId)) return [];

    // hand back [ leaderDecidedSkillId ] to the caller.
    return [ leaderDecidedSkillId ];
  }

  /**
   * Allows the follower to decide their own next action.
   * Followers with no leader always basic attack.
   * @param {JABS_Battler} battler The follower deciding for themselves.
   * @returns {number[]}
   */
  decideFollowerAiBySelf(battler)
  {
    const basicAttackSkillId = battler.getEnemyBasicAttack();

    // when not this.isSkillIdValid(basicAttackSkillId), take this branch.
    if (!this.isSkillIdValid(basicAttackSkillId)) return [];

    // hand back [ basicAttackSkillId ] to the caller.
    return [ basicAttackSkillId ];
  }
  //endregion follower
}

export default JABS_EnemyAI;
//endregion JABS_EnemyAI