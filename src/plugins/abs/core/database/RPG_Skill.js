//region RPG_Skill effects
import JABS_GuardData from '../models/JABS_GuardData.js';
import JABS_Action from '../models/JABS_Action.js';
//region range
/**
 * The JABS range for this skill.
 * This range determines the number of tiles the skill can reach in the
 * context of collision with targets.
 * @type {number}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsRadius', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.Range, true);
  },
});
//endregion range

//region proximity
/**
 * A new property for retrieving the JABS proximity from this skill.
 * @type {number}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsProximity', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.Proximity, true);
  },
});
//endregion proximity

//region actionId
/**
 * A new property for retrieving the JABS actionId from this skill.
 * @type {number}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsActionId', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.ActionId, true);
  },
});
//endregion actionId

//region duration
/**
 * A new property for retrieving the JABS duration from this skill.
 * @type {number}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsDuration', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.Duration, true);
  },
});
//endregion duration

//region linger
/**
 * The number of frames this action should visually linger after hitbox is disabled.
 * Defaults to 10 if no tag is present.
 * @type {number}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsLinger', {
  get: function()
  {
    const value = RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.Linger, true);
    return value ?? 10;
  },
});
//endregion linger

//region shape
/**
 * A new property for retrieving the JABS shape from this skill.
 * @type {string}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsShape', {
  get: function()
  {
    return RPGManager.getStringFromNoteByRegex(this, J.ABS.RegExp.Shape, true);
  },
});
//endregion shape

//region knockback
/**
 * Gets the JABS knockback this skill.
 * @type {number|null}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsKnockback', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.Knockback, true);
  },
});
//endregion knockback

//region casting
/**
 * A new property for retrieving the JABS castAnimation id from this skill.
 * @type {number}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsCastAnimation', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.CastAnimation, true);
  },
});

/**
 * A new property for retrieving the JABS castTime from this skill.
 * @type {number}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsCastTime', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.CastTime, true);
  },
});
//endregion casting

//region direct targeting
/**
 * A new property for retrieving the JABS direct from this skill.
 * @type {boolean}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsDirect', {
  get: function()
  {
    // treat either <direct> or <directLock> as a direct skill.
    const hasDirect = RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.Direct, true);
    const hasDirectLock = RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.DirectLock, true);
    return !!(hasDirect || hasDirectLock);
  },
});

/**
 * A new property for retrieving the JABS directLock from this skill.
 * @type {boolean|null}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsDirectLock', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.DirectLock, true);
  },
});
//region directStateTarget
/**
 * The state ID that must be present on a target for it to receive top priority
 * when resolving direct-skill targeting at decision time.
 *
 * When set, the targeting system scans within <proximity:N> for any opponent
 * currently afflicted with this state before falling through to the normal
 * priority chain (explicit target -> last-hit -> proximity scan -> inanimate).
 *
 * Requires <direct> and <proximity:N> on the same skill.
 * @type {number|null}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsDirectStateTarget', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.DirectStateTarget, true);
  },
});
//endregion directStateTarget
//endregion direct targeting

//region aggro
/**
 * A new property for retrieving the JABS bonusAggro from this skill.
 * @type {number}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsBonusAggro', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.BonusAggro, true);
  },
});

/**
 * A new property for retrieving the JABS aggroMultiplier from this skill.
 * @type {number}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsAggroMultiplier', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.AggroMultiplier, true);
  },
});
//endregion aggro

//region jabsGuardData
/**
 * The `JABS_GuardData` of this skill.
 * Will return null if there is no guard tag available on this
 * @type {JABS_GuardData}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsGuardData', {
  get: function()
  {
    return new JABS_GuardData(
      this.id,
      this.jabsGuard[0],
      this.jabsGuard[1],
      this.jabsCounterGuard,
      this.jabsCounterParry,
      this.jabsParry
    );
  },
});
//endregion jabsGuardData

//region guard
/**
 * A new property for retrieving the JABS guard from this skill.
 * @type {[number, number]}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsGuard', {
  get: function()
  {
    return RPGManager.getArrayFromNotesByRegex(this, J.ABS.RegExp.Guard, true, true);
  },
});
//endregion guard

//region parry
/**
 * The number of frames that the precise-parry window is available
 * when first guarding.
 * @type {number}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsParry', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.Parry, true);
  },
});
//endregion parry

//region counterGuard
/**
 * While guarding, this skill id will be automatically executed in retaliation.
 * @type {number[]}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsCounterGuard', {
  get: function()
  {
    return RPGManager.getNumbersFromNoteByRegex(this, J.ABS.RegExp.CounterGuard);
  },
});
//endregion counterGuard

//region counterParry
/**
 * When performing a precise-parry, this skill id will be automatically
 * executed in retaliation.
 * @type {number[]}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsCounterParry', {
  get: function()
  {
    return RPGManager.getNumbersFromNoteByRegex(this, J.ABS.RegExp.CounterParry);
  },
});
//endregion counterParry

//region projectiles
/**
 * A new property for retrieving the JABS projectile frames from this skill.
 * @type {number}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsProjectile', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.Projectile, true);
  },
});

/**
 * A new property for retrieving the JABS projectile formation from this skill.
 * @type {string}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsProjectileFormation', {
  get: function()
  {
    return RPGManager.getStringFromNoteByRegex(this, J.ABS.RegExp.ProjectileFormation, true);
  },
});
//endregion projectiles

//region dodging
/**
 * The number of steps that the battler will move during this dodge.
 * @type {number}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsDodgeSteps', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.DodgeSteps);
  },
});

/**
 * The speed bonus the battler will receive during this dodge.
 * @type {number}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsDodgeSpeed', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.DodgeSpeed);
  },
});

/**
 * The iFrames for the start and end of an action that will be applied to the battler.
 * @type {[number, number]|null}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsIFrames', {
  get: function()
  {
    return RPGManager.getArrayFromNotesByRegex(this, J.ABS.RegExp.IFrames, true, true);
  },
});

/**
 * The direction that this dodge skill will move.
 * @type {string}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsMoveType', {
  get: function()
  {
    return RPGManager.getStringFromNoteByRegex(this, J.ABS.RegExp.MoveType, true);
  },
});

/**
 * Whether or not the battler is invincible for the duration of this
 * skill's dodge movement.
 * @type {boolean}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsInvincibleDodge', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.InvincibleDodge);
  },
});
//endregion dodging

//region combos
//region freeCombo
/**
 * Whether or not this skill has the "free combo" trait on it.
 * Skills with "free combo" can continuously be executed regardless of
 * the actual timing factor for combos.
 * @type {boolean}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsFreeCombo', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.FreeCombo);
  },
});
//endregion freeCombo

//region comboAction
/**
 * The JABS combo data for this skill.
 *
 * The zeroth index is the combo skill id
 * The first index is the delay in frames until the combo can be triggered.
 *
 * Will be null if the combo tag is missing from the skill.
 * @type {[number, number]|null}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsComboAction', {
  get: function()
  {
    return RPGManager.getArrayFromNotesByRegex(this, J.ABS.RegExp.ComboAction, true, true);
  },
});

/**
 * Whether or not this skill can be used to engage in a combo.
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsComboStarter', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.ComboStarter);
  },
});

/**
 * Whether or not this skill is a "skill extend" skill.
 * @returns {boolean} True if this is a "skill extend" skill, false otherwise.
 */
Object.defineProperty(RPG_Skill.prototype, 'isSkillExtender', {
  get: function()
  {
    // if we're not using the extend plugin, then this is an automatic no.
    if (!J.EXTEND) return false;

    // if the skill doesn't have the extend tag, then it's not an extend skill.
    return J.EXTEND.RegExp.SkillExtend.test(this.note);
  },
});

/**
 * Whether or not this skill can be chosen at all by the JABS AI.
 * Combo skills can still be executed as they are chosen by different means.
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsAiSkillExclusion', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.AiSkillExclusion);
  },
});

/**
 * The JABS combo skill id that this skill can lead into if the skill is learned
 * by the caster.
 * @type {number|null}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsComboSkillId', {
  get: function()
  {
    return this.jabsComboAction[0];
  },
});

/**
 * The JABS combo delay in frames before the combo skill can be triggered.
 * @type {number|null}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsComboDelay', {
  get: function()
  {
    return this.jabsComboAction[1];
  },
});
//endregion comboAction

/**
 * Gets the list of skill ids in order that this skill going forward can
 * combo into. This will not include combo skills prior to this skill.
 * @returns {number[]}
 */
RPG_Skill.prototype.getComboSkillIdList = function(battler)
{
  return this.recursivelyFindAllComboSkillIds(this.id, Array.empty, battler);
};

/**
 * Recursively finds the complete combo of an equip starting at a particular
 * skill id and building the collection of skill ids that this skill combos into.
 * @param {number} skillId The id to recursively interpret the combo of.
 * @param {number[]=} list The running list of combo skill ids; defaults to an empty list.
 * @param {Game_Battler=} battler The battler perceiving these skills; defaults to null.
 * @returns {number[]} The full combo of the starting skill id.
 */
RPG_Skill.prototype.recursivelyFindAllComboSkillIds = function(skillId, list = Array.empty, battler = null)
{
  // start our list from what was passed in.
  const skillIdList = list;

  // grab the database skill.
  const skill = battler
    ? battler.skill(skillId)
    : $dataSkills.at(skillId);

  // check if we should recurse this skill.
  if (this.shouldRecurseForComboSkills(skill, skillId))
  {
    // grab the combo skill id.
    const { jabsComboSkillId } = skill;

    // add it to the list.
    skillIdList.push(jabsComboSkillId);

    // continue finding more skills with the new combo skill id as the target.
    return this.recursivelyFindAllComboSkillIds(jabsComboSkillId, skillIdList, battler);
  }
  // that was the last combo skill to record.
  else
  {
    // return the complete combo list.
    return skillIdList;
  }
};

/**
 * Determines whether or not we need to recurse another time to continue
 * finding combo skills.
 * @param {RPG_Skill} skill The skill to determine if recursion is required for.
 * @param {number} lastSkillId The last skill id in the combo.
 * @returns {boolean} True if we should recurse another skill, false otherwise.
 */
RPG_Skill.prototype.shouldRecurseForComboSkills = function(skill, lastSkillId)
{
  // if there is no skill, then there is no recursion.
  if (!skill) return false;

  // if there is no combo, then there is no recursion.
  if (!skill.jabsComboAction) return false;

  // if the combo skill is the same as the last skill id, then don't infinitely recurse.
  if (skill.jabsComboSkillId === lastSkillId) return false;

  // we should recurse!
  return true;
};
//endregion combos

//region piercing
/**
 * The JABS piercing data for this skill.
 *
 * The zeroth index is the number of times to repeatedly pierce targets.
 * The first index is the delay in frames between each pierce hit.
 *
 * Will be null if the piercing tag is missing from the skill.
 * @type {[number, number]|null}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsPiercingData', {
  get: function()
  {
    // grab the piercing data from the skill.
    const piercingData = RPGManager.getArrayFromNotesByRegex(this, J.ABS.RegExp.PiercingData, true, true);

    // if there is no data, return defaults.
    if (!piercingData) return [ 1, 0 ];

    // return the data found.
    return piercingData;
  },
});

/**
 * The number of times this skill can hit targets.
 * @type {number}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsPierceCount', {
  get: function()
  {
    return this.jabsPiercingData[0];
  },
});

/**
 * The delay in frames between each pierce hit on targets.
 * There is an arbitrary minimum delay of 5 frames.
 * @type {number}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsPierceDelay', {
  get: function()
  {
    return Math.max(this.jabsPiercingData[1], 5);
  },
});
//endregion piercing

//region bonusHitsSkillNote
/**
 * Extra per-connection bonus hits parsed from this skill note, additive with battler scope tags.
 * When J-SkillExtend merges extension notes into this skill, matching tags on the extension contribute here too.
 * @type {number}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsBonusHitsFromSkillNote', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.BonusHitsSkillNote);
  },
});
//endregion bonusHitsSkillNote

//region ignoreParry
/**
 * The percent of parry rating ignored by this skill.
 * @type {number}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsIgnoreParry', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.IgnoreParry, true);
  },
});
//endregion ignoreParry

//region unparryable
/**
 * Whether or not this skill is completely unparryable by the target.
 * @type {boolean|null}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsUnparryable', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.Unparryable, true);
  },
});
//endregion unparryable

//region offhandEligible
/**
 * Whether or not this skill may be assigned by the player into the offhand slot
 * via the in-game JABS quick menu.
 *
 * Skills that are weapon-typed are implicitly offhand-eligible elsewhere; this tag is
 * the opt-in flag for any other skill type to participate in the offhand assignment list.
 * @type {boolean}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsOffhandEligible', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.OffhandEligible);
  },
});
//endregion offhandEligible

//region selfAnimation
/**
 * The animation id to play on oneself when executing this skill.
 * @type {number}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsSelfAnimationId', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.SelfAnimationId, true);
  },
});
//endregion selfAnimation

//region onCastAnimation
/**
 * The animation id to play on the caster once when the skill actually executes.
 * @type {number}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsOnCastAnimationId', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.OnCastAnimationId, true);
  },
});
//endregion onCastAnimation

//region delay
/**
 * The JABS delay data for this skill.
 *
 * The zeroth index is the number of frames to delay the execution of the skill by.
 * The first index is whether or not to execute regardless of delay by touch.
 * The second index, if present, is the trigger radius in tiles for touch-arming.
 *
 * Will be null if the delay tag is missing from the skill.
 * @type {[number, boolean, number]|null}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsDelayData', {
  get: function()
  {
    // grab the parsed delay data.
    const delayData = RPGManager.getArrayFromNotesByRegex(this, J.ABS.RegExp.DelayData, true, true);

    // if none was found, return defaults for the first two values.
    if (delayData === null)
    {
      return [ 0, false ];
    }

    // return the captured data.
    return delayData;
  },
});

/**
 * The duration in frames before this skill's action will trigger.
 * @type {number|null}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsDelayDuration', {
  get: function()
  {
    return this.jabsDelayData[0];
  },
});

/**
 * Whether or not the delay will be ignored if an enemy touches this skill's action.
 * @type {boolean|null}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsDelayTriggerByTouch', {
  get: function()
  {
    return this.jabsDelayData[1];
  },
});

/**
 * Optional radius in tiles used only for touch-triggering during the delay window.
 * If not provided, the action’s normal hitbox is used (legacy behavior).
 * @type {number|null}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsDelayTriggerRadius', {
  get: function()
  {
    // if a third value exists, return its numeric form.
    const data = this.jabsDelayData;

    // if no third parameter was provided, return null to indicate default behavior.
    if (data.length < 3)
    {
      return null;
    }

    // attempt to coerce a number from the third parameter.
    const [ , , radius ] = data;

    // return the parsed trigger radius in tiles.
    return radius;
  },
});
//endregion delay

//region visual metadata
/**
 * Optional per-skill pixel offset to nudge the action visual relative to its default position.
 * Example: <visOffset:[-6, -12]>
 * @type {[number, number]}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsVisOffset', {
  get: function()
  {
    // grab the data for the skill.
    const data = RPGManager.getArrayFromNotesByRegex(this, J.ABS.RegExp.VisOffset, true, true);

    // validate we have data.
    if (data !== null)
    {
      // and return it.
      return data;
    }

    // use default value.
    return [ 0, 0 ];
  },
});

/**
 * Optional per-skill sprite anchor override; values are 0..1.
 * Example: <visAnchor:[0.5, 0.5]>
 * @type {[number, number]}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsVisAnchor', {
  get: function()
  {
    // grab the data for the skill.
    const data = RPGManager.getArrayFromNotesByRegex(this, J.ABS.RegExp.VisAnchor, true, true);

    // validate we have data.
    if (data !== null)
    {
      // normalize between 0 and 1.
      const ax = Math.max(0, Math.min(1, data[0]));
      const ay = Math.max(0, Math.min(1, data[1]));

      // return the normalized anchor.
      return [ ax, ay ];
    }

    // use default value.
    return null;
  },
});

/**
 * Optional per-skill z-order override for the action sprite.
 * Example: <visZ: 12>
 * @type {number|null}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsVisZ', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.VisZ, true);
  },
});

/**
 * Rotate the visual to face direction/angle if present.
 * Example: <visRotate>
 * @type {boolean|null}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsVisRotate', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.VisRotate, true);
  },
});

/**
 * Scale the visual if present.
 * Example: <visScale:[1.25, 1.0]>
 * @type {[number, number]|null}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsVisScale', {
  get: function()
  {
    // grab the data for the skill.
    const data = RPGManager.getArrayFromNotesByRegex(this, J.ABS.RegExp.VisScale, true, true);

    // validate we have data.
    if (data !== null)
    {
      // and return it.
      return data;
    }

    // provide cached value.
    return null;
  },
});

/**
 * Optional: show a tiny debug cross at the visual origin.
 * Example: <visDebug>
 * @type {boolean|null}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsVisDebug', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.VisDebug, true);
  },
});

//region directional
/**
 * Optional UP-facing visual offset.
 * Example: <visOffsetU:[0, -24]>
 * @type {[number, number]|null}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsVisOffsetU', {
  get: function()
  {
    return RPGManager.getArrayFromNotesByRegex(this, J.ABS.RegExp.VisOffsetU, true, true);
  },
});

/**
 * Optional DOWN-facing visual offset.
 * Example: <visOffsetD:[0, -24]>
 * @type {[number, number]|null}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsVisOffsetD', {
  get: function()
  {
    return RPGManager.getArrayFromNotesByRegex(this, J.ABS.RegExp.VisOffsetD, true, true);
  },
});

/**
 * Optional LEFT-facing visual offset.
 * Example: <visOffsetL:[-6, -12]>
 * @type {[number, number]|null}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsVisOffsetL', {
  get: function()
  {
    return RPGManager.getArrayFromNotesByRegex(this, J.ABS.RegExp.VisOffsetL, true, true);
  },
});

/**
 * Optional RIGHT-facing visual offset.
 * Example: <visOffsetR:[6, -12]>
 * @type {[number, number]|null}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsVisOffsetR', {
  get: function()
  {
    return RPGManager.getArrayFromNotesByRegex(this, J.ABS.RegExp.VisOffsetR, true, true);
  },
});

/**
 * Optional diagonal visual offset for UP-RIGHT.
 * Example: <visOffsetUR:[6, -18]>
 * @type {[number, number]|null}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsVisOffsetUR', {
  get: function()
  {
    return RPGManager.getArrayFromNotesByRegex(this, J.ABS.RegExp.VisOffsetUR, true, true);
  },
});

/**
 * Optional diagonal visual offset for UP-LEFT.
 * Example: <visOffsetUL:[-6, -18]>
 * @type {[number, number]|null}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsVisOffsetUL', {
  get: function()
  {
    return RPGManager.getArrayFromNotesByRegex(this, J.ABS.RegExp.VisOffsetUL, true, true);
  },
});

/**
 * Optional diagonal visual offset for DOWN-RIGHT.
 * Example: <visOffsetDR:[6, -10]>
 * @type {[number, number]|null}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsVisOffsetDR', {
  get: function()
  {
    return RPGManager.getArrayFromNotesByRegex(this, J.ABS.RegExp.VisOffsetDR, true, true);
  },
});

/**
 * Optional diagonal visual offset for DOWN-LEFT.
 * Example: <visOffsetDL:[-6, -10]>
 * @type {[number, number]|null}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsVisOffsetDL', {
  get: function()
  {
    return RPGManager.getArrayFromNotesByRegex(this, J.ABS.RegExp.VisOffsetDL, true, true);
  },
});

/**
 * Resolves the best visual offset for a given numeric direction.
 * Falls back in this order: diagonal → nearest cardinal → <visOffset> → [0, 0].
 * @param {1|2|3|4|6|7|8|9} direction The numeric direction from the action.
 * @returns {[number, number]} The resolved [x, y] visual offset.
 */
// eslint-disable-next-line complexity
RPG_Skill.prototype.getJabsVisOffsetFor = function(direction)
{
  // start from the default offset (may be [0, 0]).
  // default visual offset.
  const def = this.jabsVisOffset;

  // resolve directional override if present.
  switch (direction)
  {
    // uP.
    case 8:
      return this.jabsVisOffsetU || def || [ 0, 0 ];
    // dOWN.
    case 2:
      return this.jabsVisOffsetD || def || [ 0, 0 ];
    // lEFT.
    case 4:
      return this.jabsVisOffsetL || def || [ 0, 0 ];
    // rIGHT.
    case 6:
      return this.jabsVisOffsetR || def || [ 0, 0 ];

    // uP-RIGHT.
    case 9:
      return this.jabsVisOffsetUR || this.jabsVisOffsetU || this.jabsVisOffsetR || def || [ 0, 0 ];
    // uP-LEFT.
    case 7:
      return this.jabsVisOffsetUL || this.jabsVisOffsetU || this.jabsVisOffsetL || def || [ 0, 0 ];
    // dOWN-RIGHT.
    case 3:
      return this.jabsVisOffsetDR || this.jabsVisOffsetD || this.jabsVisOffsetR || def || [ 0, 0 ];
    // dOWN-LEFT.
    case 1:
      return this.jabsVisOffsetDL || this.jabsVisOffsetD || this.jabsVisOffsetL || def || [ 0, 0 ];
  }

  // unknown direction: return default.
  return def || [ 0, 0 ];
};

/**
 * Prefers skill note matches over action-map synthetic note (`holder`) for one array shaped tag pair.
 * @param {RPG_Base} skill The owning skill instance.
 * @param {RPG_Base|null} holder Object with `.note` from {@link JABS_Action#getActionMapVisualNoteHolder}, if any.
 * @param {RegExp} regExp Same structures as skill visual tags.
 * @returns {number[]|null}
 */
RPG_Skill.mergeJabsVisPairFromNotes = function(skill, holder, regExp)
{
  const sk = RPGManager.getArrayFromNotesByRegex(skill, regExp, true, true);
  const ev = holder ? RPGManager.getArrayFromNotesByRegex(holder, regExp, true, true) : null;

  if (sk !== null)
  {
    return sk;
  }

  if (ev !== null)
  {
    return ev;
  }

  return null;
};

/**
 * Prefers skill over action-map synthetic note for one numeric tag.
 * @param {RPG_Base} skill The owning skill instance.
 * @param {RPG_Base|null} holder Synthetic note holder, if any.
 * @param {RegExp} regExp Structured numeric tag regex.
 * @returns {number|null}
 */
RPG_Skill.mergeJabsVisPairNumberFromNotes = function(skill, holder, regExp)
{
  const sk = RPGManager.getNumberFromNoteByRegex(skill, regExp, true);
  const ev = holder ? RPGManager.getNumberFromNoteByRegex(holder, regExp, true) : null;

  if (sk !== null)
  {
    return sk;
  }

  return ev;
};

/**
 * Prefers skill over action-map synthetic note for boolean presence tags (`null` when absent on both sides).
 * @param {RPG_Base} skill The owning skill instance.
 * @param {RPG_Base|null} holder Synthetic note holder, if any.
 * @param {RegExp} regExp Structured boolean regex.
 * @returns {boolean|null}
 */
RPG_Skill.mergeJabsVisPairBoolFromNotes = function(skill, holder, regExp)
{
  const sk = RPGManager.checkForBooleanFromNoteByRegex(skill, regExp, true);
  const ev = holder ? RPGManager.checkForBooleanFromNoteByRegex(holder, regExp, true) : null;

  if (sk !== null)
  {
    return sk;
  }

  return ev;
};

/**
 * Merged sprite anchor tags with tags on the action-map template ({@link RPG_Skill#jabsVisAnchor});
 * skill wins overlaps.
 * @param {JABS_Action|null} jabsAction The executing action so we can read stamped synthetic notes.
 * @returns {[number, number]|null}
 */
RPG_Skill.prototype.getJabsVisAnchorMergedForActionMap = function(jabsAction)
{
  const holder = jabsAction ? jabsAction.getActionMapVisualNoteHolder() : null;
  const combined = RPG_Skill.mergeJabsVisPairFromNotes(this, holder, J.ABS.RegExp.VisAnchor);

  if (combined === null)
  {
    return null;
  }

  const ax = Math.max(0, Math.min(1, combined[0]));
  const ay = Math.max(0, Math.min(1, combined[1]));

  return [ ax, ay ];
};

/**
 * Merged `{@link #jabsVisZ}` with template notes.
 * @param {JABS_Action|null} jabsAction Context action.
 * @returns {number|null}
 */
RPG_Skill.prototype.getJabsVisZMergedForActionMap = function(jabsAction)
{
  const holder = jabsAction ? jabsAction.getActionMapVisualNoteHolder() : null;

  return RPG_Skill.mergeJabsVisPairNumberFromNotes(this, holder, J.ABS.RegExp.VisZ);
};

/**
 * Merged `{@link #jabsVisRotate}` with template notes (false when absent on both).
 * @param {JABS_Action|null} jabsAction Context action.
 * @returns {boolean}
 */
RPG_Skill.prototype.getJabsVisRotateMergedForActionMap = function(jabsAction)
{
  const holder = jabsAction ? jabsAction.getActionMapVisualNoteHolder() : null;
  const merged = RPG_Skill.mergeJabsVisPairBoolFromNotes(this, holder, J.ABS.RegExp.VisRotate);

  return merged !== null ? merged : false;
};

/**
 * Merged `{@link #jabsVisScale}` with template notes.
 * @param {JABS_Action|null} jabsAction Context action.
 * @returns {[number, number]|null}
 */
RPG_Skill.prototype.getJabsVisScaleMergedForActionMap = function(jabsAction)
{
  const holder = jabsAction ? jabsAction.getActionMapVisualNoteHolder() : null;

  return RPG_Skill.mergeJabsVisPairFromNotes(this, holder, J.ABS.RegExp.VisScale);
};

/**
 * Merged `{@link #jabsVisDebug}` with template notes.
 * @param {JABS_Action|null} jabsAction Context action.
 * @returns {boolean}
 */
RPG_Skill.prototype.getJabsVisDebugMergedForActionMap = function(jabsAction)
{
  const holder = jabsAction ? jabsAction.getActionMapVisualNoteHolder() : null;
  const merged = RPG_Skill.mergeJabsVisPairBoolFromNotes(this, holder, J.ABS.RegExp.VisDebug);

  return merged !== null ? merged : false;
};

/**
 * Same resolution as {@link #getJabsVisOffsetFor}, but each tag prefers the skill note over the stamped
 * action-map synthetic note.
 * @param {JABS_Action|null} jabsAction Context action.
 * @param {number} direction RMMZ 8-dir travel code (1–9 except 5).
 * @returns {[number, number]}
 */
// eslint-disable-next-line complexity
RPG_Skill.prototype.getJabsVisOffsetForMergedActionMap = function(jabsAction, direction)
{
  const holder = jabsAction ? jabsAction.getActionMapVisualNoteHolder() : null;

  if (!holder)
  {
    return this.getJabsVisOffsetFor(direction);
  }

  const pick = RPG_Skill.mergeJabsVisPairFromNotes;

  const defSkill = RPGManager.getArrayFromNotesByRegex(this, J.ABS.RegExp.VisOffset, true, true);
  const defEv = RPGManager.getArrayFromNotesByRegex(holder, J.ABS.RegExp.VisOffset, true, true);
  const defRaw = defSkill !== null ? defSkill : defEv;
  const def = defRaw !== null ? defRaw : [ 0, 0 ];

  const mergedU = pick(this, holder, J.ABS.RegExp.VisOffsetU);
  const mergedD = pick(this, holder, J.ABS.RegExp.VisOffsetD);
  const mergedL = pick(this, holder, J.ABS.RegExp.VisOffsetL);
  const mergedR = pick(this, holder, J.ABS.RegExp.VisOffsetR);
  const mergedUR = pick(this, holder, J.ABS.RegExp.VisOffsetUR);
  const mergedUL = pick(this, holder, J.ABS.RegExp.VisOffsetUL);
  const mergedDR = pick(this, holder, J.ABS.RegExp.VisOffsetDR);
  const mergedDL = pick(this, holder, J.ABS.RegExp.VisOffsetDL);

  switch (direction)
  {
    case 8:
      return mergedU || def || [ 0, 0 ];
    case 2:
      return mergedD || def || [ 0, 0 ];
    case 4:
      return mergedL || def || [ 0, 0 ];
    case 6:
      return mergedR || def || [ 0, 0 ];
    case 9:
      return mergedUR || mergedU || mergedR || def || [ 0, 0 ];
    case 7:
      return mergedUL || mergedU || mergedL || def || [ 0, 0 ];
    case 3:
      return mergedDR || mergedD || mergedR || def || [ 0, 0 ];
    case 1:
      return mergedDL || mergedD || mergedL || def || [ 0, 0 ];
  }

  return def || [ 0, 0 ];
};
//endregion directional
//endregion visual metadata
//endregion RPG_Skill effects