//region teamId
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
 * @type {JABS_EnemyAI}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsBattlerAi', {
  get: function()
  {
    // extract the AI traits out.
    const careful = this.jabsAiTraitCareful;
    const executor = this.jabsAiTraitExecutor;
    const reckless = this.jabsAiTraitReckless;
    const healer = this.jabsAiTraitHealer;
    const follower = this.jabsAiTraitFollower;
    const leader = this.jabsAiTraitLeader;

    // return the compiled battler AI.
    return new JABS_EnemyAI(careful, executor, reckless, healer, follower, leader);
  },
});

//region ai:careful
/**
 * The JABS AI trait of careful.
 * This boolean decides whether or not this battler has this AI trait.
 * @type {boolean}
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
 * @type {boolean}
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
 * @type {boolean}
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
 * @type {boolean}
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
 * @type {boolean}
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
 * @type {boolean}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsAiTraitLeader', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.AiTraitLeader, true);
  },
});
//endregion ai:leader

//endregion ai

//region config
//region config:canIdle
/**
 * The JABS config option for enabling idling.
 * This boolean decides whether or not this battler can idle while not engaged in combat.
 * @type {boolean}
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
 * @type {boolean}
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
 * @returns {boolean|null}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsConfigShowHpBar', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.ConfigShowHpBar, true);
  },
});
//endregion config:showHpBar

//region config:noHpBar
/**
 * The JABS config option for disabling showing the hp bar.
 * This boolean decides whether or not this battler will hide its hp bar under its sprite.
 * @returns {boolean|null}
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
 * @returns {boolean|null}
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
 * @returns {boolean|null}
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
 * @returns {boolean|null}
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
 * @returns {boolean|null}
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
 * @returns {boolean|null}
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
 * @returns {boolean|null}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsConfigNotInanimate', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.ConfigNotInanimate, true);
  },
});
//endregion config:notInanimate

//endregion config