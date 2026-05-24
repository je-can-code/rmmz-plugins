//region RPG_State effects
import JABS_State from './../__models/JABS_State.js';
//region paralysis
/**
 * Whether or not this state is also a JABS paralysis state.
 * Paralysis is the same as being rooted & muted & disarmed simultaneously.
 * @type {boolean|null}
 */
Object.defineProperty(RPG_State.prototype, 'jabsParalyzed', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.Paralyzed, true);
  },
});
//endregion paralysis

//region rooted
/**
 * Whether or not this state is also a JABS rooted state.
 * Rooted battlers are unable to move on the map.
 * @type {boolean|null}
 */
Object.defineProperty(RPG_State.prototype, 'jabsRooted', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.Rooted, true);
  },
});
//endregion rooted

//region muted
/**
 * Whether or not this state is also a JABS muted state.
 * Muted battlers are unable to use their combat skills.
 * @type {boolean|null}
 */
Object.defineProperty(RPG_State.prototype, 'jabsMuted', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.Muted, true);
  },
});
//endregion muted

//region disarmed
/**
 * Whether or not this state is also a JABS disarmed state.
 * Disarmed battlers are unable to use their basic attacks.
 * @type {boolean|null}
 */
Object.defineProperty(RPG_State.prototype, 'jabsDisarmed', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.Disabled, true);
  },
});
//endregion disarmed

//region negative
/**
 * Whether or not this state is considered "negative" for the purpose
 * of AI action decision-making. Ally AI set to Support or enemy AI set
 * to Healing will attempt to remove "negative" states if possible.
 * @type {boolean|null}
 */
Object.defineProperty(RPG_State.prototype, 'jabsNegative', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.Negative, true);
  },
});
//endregion negative

//region aggroInAmp
/**
 * Multiply incoming aggro by this amount.
 * @type {number|null}
 */
Object.defineProperty(RPG_State.prototype, 'jabsAggroInAmp', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.AggroInAmp, true);
  },
});
//endregion aggroInAmp

//region aggroOutAmp
/**
 * Multiply outgoing aggro by this amount.
 * @type {number|null}
 */
Object.defineProperty(RPG_State.prototype, 'jabsAggroOutAmp', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.AggroOutAmp, true);
  },
});
//endregion aggroOutAmp

//region aggroLock
/**
 * Whether or not this state locks aggro. Battlers with this state applied
 * can neither gain nor lose aggro for the duration of the state.
 * @type {boolean|null}
 */
Object.defineProperty(RPG_State.prototype, 'jabsAggroLock', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.AggroLock, true);
  },
});
//endregion aggroLock

//region skillTransforms
/**
 * The collection of skill transforms defined on this state.
 *
 * Each entry is expected to be a two-number array in the form:
 * [ baseSkillId, transformedSkillId ]
 * @type {number[][]}
 */
Object.defineProperty(RPG_State.prototype, 'jabsSkillTransforms', {
  get: function()
  {
    return RPGManager.getArraysFromNotesByRegex(this, J.ABS.RegExp.SkillTransform, true);
  },
});
//endregion skillTransforms

//region reapplication type
/**
 * The state reapplication strategy for this state in the context of JABS.<br/>
 * Will either return one of the {@link JABS_State.reapplicationType}, or null if none was found.
 */
Object.defineProperty(RPG_State.prototype, 'jabsStateReapplyType', {
  get: function()
  {
    const type = RPGManager.getStringFromNoteByRegex(this, J.ABS.RegExp.ReapplyType);

    switch (type.toLowerCase())
    {
      case JABS_State.reapplicationType.Refresh:
      case JABS_State.reapplicationType.Extend:
      case JABS_State.reapplicationType.Stack:
        return type;
      default:
        return null;
    }
  },
});

/**
 * The customized number of frames to reduce lesser the base duration when this state is reapplied.<br/>
 * Only applies when the state's reapplication type is {@link JABS_State.reapplicationType.Refresh}.<br/>
 * Will either return the custom number of frames defined on the state, or the default from configuration.
 */
Object.defineProperty(RPG_State.prototype, 'jabsStateRefreshDiminish', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(
      this,
      J.ABS.RegExp.ReapplyRefreshDiminish,
      true
    ) ?? J.ABS.Metadata.DefaultStateRefreshDiminish;
  },
});

/**
 * The customized number of frames until a state can be fully refreshed again without diminishing returns.<br/>
 * Only applies when the state's reapplication type is {@link JABS_State.reapplicationType.Refresh}.<br/>
 * Will either return the custom number of frames defined on the state, or the default from configuration.
 */
Object.defineProperty(RPG_State.prototype, 'jabsStateRefreshReset', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(
      this,
      J.ABS.RegExp.ReapplyRefreshReset,
      true
    ) ?? J.ABS.Metadata.DefaultStateRefreshReset;
  },
});

/**
 * The customized number of frames to extend the duration of this state when reapplied.<br/>
 * Only applies when the state's reapplication type is {@link JABS_State.reapplicationType.Extend}.<br/>
 * Will either return the custom number of frames defined on the state, or the default from configuration.
 */
Object.defineProperty(RPG_State.prototype, 'jabsStateExtendAmount', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(
      this,
      J.ABS.RegExp.ReapplyExtendAmount,
      true
    ) ?? J.ABS.Metadata.DefaultStateExtendAmount;
  },
});

/**
 * The maximum number of frames a state can have its duration extended when reapplied.<br/>
 * Only applies when the state's reapplication type is {@link JABS_State.reapplicationType.Extend}.<br/>
 * Will either return the max number of frames defined on the state, or the default from configuration.
 */
Object.defineProperty(RPG_State.prototype, 'jabsStateExtendMax', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(
      this,
      J.ABS.RegExp.ReapplyExtendMax,
      true
    ) ?? J.ABS.Metadata.DefaultStateExtendMax;
  },
});

/**
 * The max number of stacks a state can stack.<br/>
 * Only applies when the state's reapplication type is {@link JABS_State.reapplicationType.Stack}.<br/>
 * Will either return the custom number of stacks defined on the state, or the default from configuration.
 */
Object.defineProperty(RPG_State.prototype, 'jabsStateStackMax', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(
      this,
      J.ABS.RegExp.ReapplyStackMax,
      true
    ) ?? J.ABS.Metadata.DefaultStateStackMax;
  },
});

/**
 * How many stacks of a state will be applied upon stacking.<br/>
 * Only applies when the state's reapplication type is {@link JABS_State.reapplicationType.Stack}.<br/>
 * Will either return the custom number of stacks defined on the state, or the default from configuration.
 */
Object.defineProperty(RPG_State.prototype, 'jabsStateStacksApplied', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(
      this,
      J.ABS.RegExp.StateApplicationAmount,
      true
    ) ?? J.ABS.Metadata.DefaultStateApplicationCount;
  },
});

/**
 * Whether or not all stacks of a state will be removed upon duration expiration.<br/>
 * Only applies when the state's reapplication type is {@link JABS_State.reapplicationType.Stack}.<br/>
 * If no value is defined on the state, the default from configuration will be used.
 * @type {boolean}
 */
Object.defineProperty(RPG_State.prototype, 'jabsLoseAllStacksAtOnce', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(
      this,
      J.ABS.RegExp.LoseAllStacksAtOnce,
      true
    ) ?? J.ABS.Metadata.DefaultStateLoseAllStacksAtOnce;
  },
});
//endregion reapplication type

//region slipHp
/**
 * The flat slip hp amount- per 5 seconds.
 * @type {number}
 */
Object.defineProperty(RPG_State.prototype, 'jabsSlipHpFlatPerFive', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.SlipHpFlat);
  },
});

/**
 * The percent slip hp amount- per 5 seconds.
 * @type {number}
 */
Object.defineProperty(RPG_State.prototype, 'jabsSlipHpPercentPerFive', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.SlipHpPercent);
  },
});

/**
 * The formula slip hp amount- per 5 seconds.
 * This does NOT `eval()` the formula, as there is no additional variables
 * available for context.
 * @type {string|null}
 */
Object.defineProperty(RPG_State.prototype, 'jabsSlipHpFormulaPerFive', {
  get: function()
  {
    return RPGManager.getStringFromNoteByRegex(this, J.ABS.RegExp.SlipHpFormula);
  },
});
//endregion slipHp

//region slipMp
/**
 * The flat slip mp amount- per 5 seconds.
 * @type {number}
 */
Object.defineProperty(RPG_State.prototype, 'jabsSlipMpFlatPerFive', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.SlipMpFlat);
  },
});

/**
 * The percent slip mp amount- per 5 seconds.
 * @type {number}
 */
Object.defineProperty(RPG_State.prototype, 'jabsSlipMpPercentPerFive', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.SlipMpPercent);
  },
});

/**
 * The formula slip mp amount- per 5 seconds.
 * This does NOT `eval()` the formula, as there is no additional variables
 * available for context.
 * @type {string|null}
 */
Object.defineProperty(RPG_State.prototype, 'jabsSlipMpFormulaPerFive', {
  get: function()
  {
    return RPGManager.getStringFromNoteByRegex(this, J.ABS.RegExp.SlipMpFormula);
  },
});
//endregion slipMp

//region slipTp
/**
 * The flat slip tp amount- per 5 seconds.
 * @type {number}
 */
Object.defineProperty(RPG_State.prototype, 'jabsSlipTpFlatPerFive', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.SlipTpFlat);
  },
});

/**
 * The percent slip tp amount- per 5 seconds.
 * @type {number}
 */
Object.defineProperty(RPG_State.prototype, 'jabsSlipTpPercentPerFive', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.SlipTpPercent);
  },
});

/**
 * The formula slip tp amount- per 5 seconds.
 * This does NOT `eval()` the formula, as there is no additional variables
 * available for context.
 * @type {string|null}
 */
Object.defineProperty(RPG_State.prototype, 'jabsSlipTpFormulaPerFive', {
  get: function()
  {
    return RPGManager.getStringFromNoteByRegex(this, J.ABS.RegExp.SlipTpFormula);
  },
});
//endregion slipTp
//endregion RPG_State effects