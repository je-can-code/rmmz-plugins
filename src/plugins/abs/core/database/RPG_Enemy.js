//region teamId
import JABS_EnemyAI from '../models/JABS_EnemyAI.js';
import JABS_BattlerRole from '../models/JABS_BattlerRole.js';
import JABS_AiManager from './../managers/JABS_AiManager.js';
/**
 * The JABS team id for this battler.
 * This number is the id of the team that this battler will belong to.
 * @type {number}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsTeamId', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.TeamId, true);
  },
});
//endregion teamId

//region prepare time
/**
 * The JABS prepare time for this battler.
 * This number represents how many frames must pass before this battler can
 * decide an action to perform when controlled by the {@link JABS_AiManager}.
 * @returns {number|null}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsPrepareTime', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.PrepareTime, true);
  },
});
//endregion prepare time

//region sight range
/**
 * The JABS sight range for this battler.
 * This number represents how many tiles this battler can see before
 * engaging in combat when controlled by the {@link JABS_AiManager}.
 * @returns {number|null}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsSightRange', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.Sight, true);
  },
});
//endregion sight range

//region pursuit range
/**
 * The JABS pursuit range for this battler.
 * This number represents how many tiles this battler can see after
 * engaging in combat when controlled by the {@link JABS_AiManager}.
 * @returns {number|null}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsPursuitRange', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.Pursuit, true);
  },
});
//endregion pursuit range

//region guard range
/**
 * The JABS guard range for this battler.
 * When tagged on a guardian-role enemy, this defines the maximum distance at which the guardian
 * will notice threatened wards and continue to pursue their attacker, overriding the normal pursuit radius.
 * When omitted, the guardian falls back to the largest pursuit radius among its allied wards.
 * @returns {number|null}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsGuardRange', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.GuardRange, true);
  },
});
//endregion guard range

//region guard skillId
/**
 * The guard skill id declared directly on this battler's own notes.
 * Enemies have no equipment to hang a guard skill off of the way actors do via
 * {@link RPG_EquipItem#jabsGuardSkillId}, so this is the direct, battler-level equivalent-
 * tag it on an individual enemy to grant it guarding capability.
 * @type {number|null}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsGuardSkillId', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.GuardSkillId, true);
  },
});
//endregion guard skillId

//region respawn
/**
 * The JABS respawn declaration for this battler, as a `[METHOD, PARAM]` pair.
 * This defines how long after defeat this battler returns to the map.
 * An event comment on the placement may override this species-level habit.
 * @type {any[]|null}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsRespawnData', {
  get: function()
  {
    return RPGManager.getArrayFromNotesByRegex(this, J.ABS.RegExp.Respawn, true);
  },
});

/**
 * The JABS declaration that this battler never respawns once defeated.
 * This boolean makes the species finite for the rest of the playthrough.
 * @type {boolean|null}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsNoRespawn', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.NoRespawn, true);
  },
});

/**
 * The JABS animation id played on this battler's event when it respawns.
 * @type {number|null}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsRespawnAnimationId', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.RespawnAnimation, true);
  },
});
//endregion respawn

//region alert duration
/**
 * The JABS alert duration for this battler.
 * This number represents how many frames this battler will remain alerted
 * when controlled by the {@link JABS_AiManager}.<br>
 * @returns {number|null}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsAlertDuration', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.AlertDuration, true);
  },
});
//endregion alert duration

//region alerted sight boost
/**
 * The JABS alerted sight boost for this battler.
 * This number represents the sight bonus applied while this battler is alerted
 * outside of combat when controlled by the {@link JABS_AiManager}.<br>
 * @returns {number|null}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsAlertedSightBoost', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.AlertedSightBoost, true);
  },
});
//endregion alerted sight boost

//region alerted pursuit boost
/**
 * The JABS alerted pursuit boost for this battler.
 * This number represents the sight bonus applied while this battler is alerted
 * inside of combat when controlled by the {@link JABS_AiManager}.<br>
 *
 * It is important to note that enemies cannot be alerted during combat, but their
 * alert duration may spill over into the beginning of combat.
 * @returns {number|null}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsAlertedPursuitBoost', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.AlertedPursuitBoost, true);
  },
});

//endregion alerted pursuit boost

//region ai
/**
 * The compiled {@link JABS_EnemyAI}.<br>
 * This defines how this battler's AI will be controlled.
 * Coordination roles (leader/follower) are handled separately via {@link #jabsBattlerRole}.
 * @type {JABS_EnemyAI}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsBattlerAi', {
  get: function()
  {
    const careful = this.jabsAiTraitCareful;
    const executor = this.jabsAiTraitExecutor;
    const reckless = this.jabsAiTraitReckless;
    const healer = this.jabsAiTraitHealer;
    const cleanser = this.jabsAiTraitCleanser;
    const buffer = this.jabsAiTraitBuffer;
    const tactical = this.jabsAiTraitTactical;
    const berserker = this.jabsAiTraitBerserker;

    return new JABS_EnemyAI(careful, executor, reckless, healer, cleanser, buffer, tactical, berserker);
  },
});

/**
 * The compiled {@link JABS_BattlerRole}.<br>
 * This defines this battler's structural coordination role on the battlefield.
 * Assigned via {@code <aiRole: X>}. The {@code <aiTrait: leader>} and {@code <aiTrait: follower>} tags
 * are supported as backward-compatible aliases.
 * @type {JABS_BattlerRole}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsBattlerRole', {
  get: function()
  {
    // fall back to legacy aiTrait aliases for leader and follower.
    const leader = this.jabsAiRoleLeader || this.jabsAiTraitLeader;
    const follower = this.jabsAiRoleFollower || this.jabsAiTraitFollower;
    const guardian = this.jabsAiRoleGuardian;
    const ward = this.jabsAiRoleWard;
    const solo = this.jabsAiRoleSolo;
    const sentinel = this.jabsAiRoleSentinel;

    return new JABS_BattlerRole(leader, follower, guardian, ward, solo, sentinel);
  },
});

//region ai:careful
/**
 * The JABS AI trait of careful.
 * This boolean decides whether or not this battler has this AI trait.
 * @type {boolean|null}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsAiTraitCareful', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.AiTraitCareful, true);
  },
});
//endregion ai:careful

//region ai:executor
/**
 * The JABS AI trait of executor.
 * This boolean decides whether or not this battler has this AI trait.
 * @type {boolean|null}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsAiTraitExecutor', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.AiTraitExecutor, true);
  },
});
//endregion ai:executor

//region ai:reckless
/**
 * The JABS AI trait of reckless.
 * This boolean decides whether or not this battler has this AI trait.
 * @type {boolean|null}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsAiTraitReckless', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.AiTraitReckless, true);
  },
});
//endregion ai:reckless

//region ai:healer
/**
 * The JABS AI trait of healer.
 * This boolean decides whether or not this battler has this AI trait.
 * @type {boolean|null}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsAiTraitHealer', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.AiTraitHealer, true);
  },
});
//endregion ai:healer

//region ai:follower
/**
 * The JABS AI trait of follower.
 * This boolean decides whether or not this battler has this AI trait.
 * @deprecated Use {@code <aiRole: follower>} instead. Supported as a backward-compatible alias.
 * @type {boolean|null}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsAiTraitFollower', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.AiTraitFollower, true);
  },
});
//endregion ai:follower

//region ai:leader
/**
 * The JABS AI trait of leader.
 * This boolean decides whether or not this battler has this AI trait.
 * @deprecated Use {@code <aiRole: leader>} instead. Supported as a backward-compatible alias.
 * @type {boolean|null}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsAiTraitLeader', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.AiTraitLeader, true);
  },
});
//endregion ai:leader

//region ai:cleanser
/**
 * The JABS AI trait of cleanser.
 * This boolean decides whether or not this battler has this AI trait.
 * @type {boolean|null}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsAiTraitCleanser', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.AiTraitCleanser, true);
  },
});
//endregion ai:cleanser

//region ai:buffer
/**
 * The JABS AI trait of buffer.
 * This boolean decides whether or not this battler has this AI trait.
 * @type {boolean|null}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsAiTraitBuffer', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.AiTraitBuffer, true);
  },
});
//endregion ai:buffer

//region ai:tactical
/**
 * The JABS AI trait of tactical.
 * This boolean decides whether or not this battler has this AI trait.
 * @type {boolean|null}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsAiTraitTactical', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.AiTraitTactical, true);
  },
});
//endregion ai:tactical

//region ai:berserker
/**
 * The JABS AI trait of berserker.
 * This boolean decides whether or not this battler has this AI trait.
 * @type {boolean|null}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsAiTraitBerserker', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.AiTraitBerserker, true);
  },
});
//endregion ai:berserker

//region role:leader
/**
 * The AI role of leader.
 * @type {boolean|null}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsAiRoleLeader', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.AiRoleLeader, true);
  },
});
//endregion role:leader

//region role:follower
/**
 * The AI role of follower.
 * @type {boolean|null}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsAiRoleFollower', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.AiRoleFollower, true);
  },
});
//endregion role:follower

//region role:guardian
/**
 * The AI role of guardian.
 * @type {boolean|null}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsAiRoleGuardian', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.AiRoleGuardian, true);
  },
});
//endregion role:guardian

//region role:ward
/**
 * The AI role of ward.
 * @type {boolean|null}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsAiRoleWard', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.AiRoleWard, true);
  },
});
//endregion role:ward

//region role:solo
/**
 * The AI role of solo.
 * @type {boolean|null}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsAiRoleSolo', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.AiRoleSolo, true);
  },
});
//endregion role:solo

//region role:sentinel
/**
 * The AI role of sentinel.
 * @type {boolean|null}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsAiRoleSentinel', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.AiRoleSentinel, true);
  },
});
//endregion role:sentinel

//endregion ai

//region config
//region config:canIdle
/**
 * The JABS config option for enabling idling.
 * This boolean decides whether or not this battler can idle while not engaged in combat.
 * @type {boolean|null}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsConfigCanIdle', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.ConfigCanIdle, true);
  },
});
//endregion config:canIdle

//region config:noIdle
/**
 * The JABS config option for disabling idling.
 * This boolean decides whether or not this battler can idle while not engaged in combat.
 * @type {boolean|null}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsConfigNoIdle', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.ConfigNoIdle, true);
  },
});
//endregion config:noIdle

//region config:showHpBar
/**
 * The JABS config option for enabling showing the hp bar.
 * This boolean decides whether or not this battler will reveal its hp bar under its sprite.
 * @type {boolean|null}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsConfigShowHpBar', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.ConfigShowHpBar, true);
  },
});
//endregion config:showHpBar

//region config:showStates
/**
 * The JABS config option for enabling showing the map affliction strip.
 * @type {boolean|null}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsConfigShowStates', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.ConfigShowStates, true);
  },
});
//endregion config:showStates

//region config:hideStates
/**
 * The JABS config option for disabling the map affliction strip.
 * @type {boolean|null}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsConfigHideStates', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.ConfigHideStates, true);
  },
});
//endregion config:hideStates

//region config:noHpBar
/**
 * The JABS config option for disabling showing the hp bar.
 * This boolean decides whether or not this battler will hide its hp bar under its sprite.
 * @type {boolean|null}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsConfigNoHpBar', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.ConfigNoHpBar, true);
  },
});
//endregion config:noHpBar

//region config:showName
/**
 * The JABS config option for enabling showing the battler's name.
 * This boolean decides whether or not this battler will reveal its name under its sprite.
 * @type {boolean|null}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsConfigShowName', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.ConfigShowName, true);
  },
});
//endregion config:showName

//region config:noName
/**
 * The JABS config option for disabling showing the battler's name.
 * This boolean decides whether or not this battler will hide its name under its sprite.
 * @type {boolean|null}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsConfigNoName', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.ConfigNoName, true);
  },
});
//endregion config:noName

//region config:invincible
/**
 * The JABS config option for enabling invincibility on this battler.
 * This boolean decides whether or not actions can collide with this battler.
 * @type {boolean|null}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsConfigInvincible', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.ConfigInvincible, true);
  },
});
//endregion config:invincible

//region config:notInvincible
/**
 * The JABS config option for disabling invincibility on this battler.
 * This boolean decides whether or not actions cannot collide with this battler.
 * @type {boolean|null}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsConfigNotInvincible', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.ConfigNotInvincible, true);
  },
});
//endregion config:notInvincible

//region config:inanimate
/**
 * The JABS config option for enabling being inanimate for this battler.
 * This boolean decides whether or not to enable being inanimate
 * @type {boolean|null}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsConfigInanimate', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.ConfigInanimate, true);
  },
});
//endregion config:inanimate

//region config:notInanimate
/**
 * The JABS config option for disabling being inanimate for this battler.
 * This boolean decides whether or not to disable being inanimate.
 * @type {boolean|null}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsConfigNotInanimate', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.ConfigNotInanimate, true);
  },
});
//endregion config:notInanimate

//endregion config