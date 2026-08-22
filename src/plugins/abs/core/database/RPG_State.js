//region RPG_State effects
import JABS_State from '../models/JABS_State.js';
import JABS_StateExpireData from '../models/JABS_StateExpireData.js';
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
 * Whether or not this state carries the {@code <type:negative>} classifier, used to determine
 * "negative"/ailment polarity for AI action decision-making, immunity gating, and passive rule
 * dispatch. Ally AI set to Support or enemy AI set to Healing will attempt to remove states this
 * returns true for. Polarity used to be its own dedicated {@code <negative>} notetag, but was
 * folded into the shared {@code <type:CLASSIFIER>} system so it composes naturally with
 * {@code <stateTypeResist>}/{@code <stateTypeImmune>} instead of needing a parallel mechanism.
 * @returns {boolean}
 */
RPG_State.prototype.isNegativeType = function()
{
  return this.types()
    .some(type => type.toLowerCase() === 'negative');
};
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
    return RPGManager.getArraysFromNotesByRegex(this, J.ABS.RegExp.SkillTransform);
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
 * A bonus to this state's stack cap, read from this state's own note only.<br/>
 * When J-Extend is active and another active state carries `<extend:[...]>` or
 * `<extendType:TYPE>` targeting this state, that overlay's note (and thus its own
 * `<thisStackMaxBoost:VAL>` tag, if any) is merged into this note before this getter runs-
 * so this is effectively "one state raising the stack cap of another it extends."<br/>
 * Only applies when the state's reapplication type is {@link JABS_State.reapplicationType.Stack}.
 * @type {number}
 */
Object.defineProperty(RPG_State.prototype, 'jabsThisStackMaxBoost', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.ThisStackMaxBoost);
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

/**
 * When true, duration expiration gains a stack instead of losing one, indefinitely, with no
 * external reapplication required after the state is first planted on a target.
 * @type {boolean}
 */
Object.defineProperty(RPG_State.prototype, 'jabsStackOnExpire', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.StackOnExpire);
  },
});
//region stacksConvertToState
/**
 * The state conversion data for this state.<br/>
 * When the stack count reaches the required threshold, the specified state is applied
 * to the afflicted battler as a fresh application.<br/>
 * Returns null when no {@code <stacksConvertToState:[NEW_STATE_ID, STACKS_REQUIRED]>} tag is present.
 * Only the first tag is read.
 * @type {{ stateId: number, stacksRequired: number }|null}
 */
Object.defineProperty(RPG_State.prototype, 'jabsStacksConvertToState', {
  get: function()
  {
    // grab all matching bracket-pairs from the note.
    const arrays = RPGManager.getArraysFromNotesByRegex(this, J.ABS.RegExp.StacksConvertToState);

    // if nothing was found, there is no conversion defined.
    if (!arrays || arrays.length === 0) return null;

    // only the first tag is respected; destructure the pair.
    const [ stateId, stacksRequired ] = arrays.at(0);

    // wrap in a plain object so callers have typed access to each field.
    return { stateId, stacksRequired };
  },
});
//endregion stacksConvertToState

//region removeOnConvert
/**
 * Whether the source state should be removed from the battler when a stack conversion fires.<br/>
 * Without this tag, the source state remains active alongside the converted state.<br/>
 * @type {boolean}
 */
Object.defineProperty(RPG_State.prototype, 'jabsRemoveOnConvert', {
  get: function()
  {
    // check the note for the boolean remove-on-convert flag.
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.RemoveOnConvert);
  },
});
//endregion removeOnConvert

//region convertUsesCaster
/**
 * Whether this state's conversion data should be read from the caster's perceived version
 * of the state rather than the target's.<br/>
 * Use this when <stacksConvertToState> is added via a caster-side extension passive so that
 * the enemy target's lack of the passive doesn't suppress the conversion.
 * @type {boolean}
 */
Object.defineProperty(RPG_State.prototype, 'jabsConvertUsesCaster', {
  get: function()
  {
    // check the note for the boolean convert-uses-caster flag.
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.ConvertUsesCaster);
  },
});
//endregion convertUsesCaster

//endregion reapplication type

//region applyStateOnExpire
/**
 * The follow-up state to apply when this state expires naturally by frame counter.<br/>
 * Returns a {@link JABS_StateExpireData} describing the follow-up, or null when no
 * tag is present. Does NOT fire on forced removal or dispel.
 * @type {JABS_StateExpireData|null}
 */
Object.defineProperty(RPG_State.prototype, 'jabsApplyStateOnExpire', {
  get: function()
  {
    // grab all matching bracket-pairs from the note.
    const arrays = RPGManager.getArraysFromNotesByRegex(this, J.ABS.RegExp.ApplyStateOnExpire);

    // if nothing was found, there is no follow-up state.
    if (!arrays || arrays.length === 0) return null;

    // only the first tag is respected; destructure the pair.
    const [stateId, chance] = arrays.at(0);

    // wrap in a proper model so callers have typed access to each field.
    return new JABS_StateExpireData(stateId, chance);
  },
});
//endregion applyStateOnExpire

//region state spread
/**
 * Spread rule for this state row: chance and range in tiles.<br/>
 * Returns null when no {@code <spread:[CHANCE, RANGE]>} tag is present.
 * @type {{ chance: number, range: number }|null}
 */
Object.defineProperty(RPG_State.prototype, 'jabsSpreadRule', {
  get: function()
  {
    const arrays = RPGManager.getArraysFromNotesByRegex(this, J.ABS.RegExp.Spread);

    if (!arrays || arrays.length === 0) return null;

    const tuple = arrays.at(0);
    const chance = Number(tuple[0]);
    const range = Number(tuple[1]);

    if (Number.isNaN(chance) || chance <= 0) return null;

    if (Number.isNaN(range) || range <= 0) return null;

    return { chance, range };
  },
});

/**
 * When true, spread candidates include all battlers in range, not only same-side allies.
 * @type {boolean}
 */
Object.defineProperty(RPG_State.prototype, 'jabsViral', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.Viral, true) === true;
  },
});

/**
 * Per-state spread pulse interval in frames when {@code <spreadTick:N>} is present.
 * @type {number}
 */
Object.defineProperty(RPG_State.prototype, 'jabsSpreadTickFrames', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.SpreadTick, true) || 0;
  },
});

/**
 * Max successful spreads per pulse when {@code <spreadPerTick:N>} is present.
 * @type {number}
 */
Object.defineProperty(RPG_State.prototype, 'jabsSpreadPerTick', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.SpreadPerTick, true) || 0;
  },
});

/**
 * When true, spread tries battlers not already afflicted with this state id before others.
 * @type {boolean}
 */
Object.defineProperty(RPG_State.prototype, 'jabsSpreadPreferUnafflicted', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(
      this,
      J.ABS.RegExp.SpreadPreferUnafflicted,
      true
    ) === true;
  },
});

/**
 * When true, spread pulses skip battlers who already have this state id (no spread reapplication).
 * @type {boolean}
 */
Object.defineProperty(RPG_State.prototype, 'jabsSpreadSkipAfflicted', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(
      this,
      J.ABS.RegExp.SpreadSkipAfflicted,
      true
    ) === true;
  },
});
//endregion state spread

//region slipHp
/**
 * The flat slip hp amount, applied in full on every tick.
 * @type {number}
 */
Object.defineProperty(RPG_State.prototype, 'jabsSlipHpFlat', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.SlipHpFlat);
  },
});

/**
 * The percent slip hp amount, applied in full on every tick.
 * @type {number}
 */
Object.defineProperty(RPG_State.prototype, 'jabsSlipHpPercent', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.SlipHpPercent);
  },
});

/**
 * The formula slip hp amount, applied in full on every tick.
 * This does NOT `eval()` the formula, as there is no additional variables
 * available for context.
 * @type {string|null}
 */
Object.defineProperty(RPG_State.prototype, 'jabsSlipHpFormula', {
  get: function()
  {
    return RPGManager.getStringFromNoteByRegex(this, J.ABS.RegExp.SlipHpFormula);
  },
});
//endregion slipHp

//region slipMp
/**
 * The flat slip mp amount, applied in full on every tick.
 * @type {number}
 */
Object.defineProperty(RPG_State.prototype, 'jabsSlipMpFlat', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.SlipMpFlat);
  },
});

/**
 * The percent slip mp amount, applied in full on every tick.
 * @type {number}
 */
Object.defineProperty(RPG_State.prototype, 'jabsSlipMpPercent', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.SlipMpPercent);
  },
});

/**
 * The formula slip mp amount, applied in full on every tick.
 * This does NOT `eval()` the formula, as there is no additional variables
 * available for context.
 * @type {string|null}
 */
Object.defineProperty(RPG_State.prototype, 'jabsSlipMpFormula', {
  get: function()
  {
    return RPGManager.getStringFromNoteByRegex(this, J.ABS.RegExp.SlipMpFormula);
  },
});
//endregion slipMp

//region slipTp
/**
 * The flat slip tp amount, applied in full on every tick.
 * @type {number}
 */
Object.defineProperty(RPG_State.prototype, 'jabsSlipTpFlat', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.SlipTpFlat);
  },
});

/**
 * The percent slip tp amount, applied in full on every tick.
 * @type {number}
 */
Object.defineProperty(RPG_State.prototype, 'jabsSlipTpPercent', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.SlipTpPercent);
  },
});

/**
 * The formula slip tp amount, applied in full on every tick.
 * This does NOT `eval()` the formula, as there is no additional variables
 * available for context.
 * @type {string|null}
 */
Object.defineProperty(RPG_State.prototype, 'jabsSlipTpFormula', {
  get: function()
  {
    return RPGManager.getStringFromNoteByRegex(this, J.ABS.RegExp.SlipTpFormula);
  },
});
//endregion slipTp

//region tickSpeed
/**
 * The base tick interval (in frames) for this state's own slip/regen ticking, overriding the
 * global default before any flat/percent tick speed modifiers are applied.
 * @type {number}
 */
Object.defineProperty(RPG_State.prototype, 'jabsThisTickSpeed', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.ThisTickSpeed, true) || 0;
  },
});
//endregion tickSpeed

//region noLogs
/**
 * Whether the logs for adding this state show up in the action logs.
 * @type {boolean}
 */
Object.defineProperty(RPG_State.prototype, 'jabsNoLogs', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.NoLogs);
  },
});
//endregion noLogs

//region indefiniteState
/**
 * When true, this state never expires on the map (J-ABS duration {@code -1}).<br/>
 * Authors use {@code <indefiniteState>} instead of MZ {@code removeByWalking}, which
 * only existed to unlock the {@code stepsToRemove} field in the database editor.
 * @type {boolean}
 */
Object.defineProperty(RPG_State.prototype, 'jabsIndefiniteState', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.IndefiniteState, true);
  },
});
//endregion indefiniteState

//region stateHasMapTimer
/**
 * Whether J-ABS should run a finite map timer when this state is applied.<br/>
 * True when {@code <stateDuration>} or {@code <stateDurationSec>} is present with a
 * positive value and {@link #jabsIndefiniteState} is false.
 * @type {boolean}
 */
Object.defineProperty(RPG_State.prototype, 'jabsStateHasMapTimer', {
  get: function()
  {
    if (this.jabsIndefiniteState)
    {
      return false;
    }

    const framesFromTag = RPGManager.getNumberFromNoteByRegex(
      this,
      J.ABS.RegExp.StateDuration,
      true,
    );

    if (framesFromTag !== null && framesFromTag > 0)
    {
      return true;
    }

    const secondsFromTag = RPGManager.getNumberFromNoteByRegex(
      this,
      J.ABS.RegExp.StateDurationSec,
      true,
    );

    if (secondsFromTag !== null && secondsFromTag > 0)
    {
      return true;
    }

    return false;
  },
});
//endregion stateHasMapTimer

//region stateDurationFrames
/**
 * Effective map-state duration in frames for this database row.<br/>
 * Authors use {@code <stateDuration:FRAMES>} or {@code <stateDurationSec:SECONDS>}
 * when {@code stepsToRemove} must exceed the RPG Maker MZ editor cap (9999).
 * When no tag is present, falls back to {@code stepsToRemove} for display/legacy only;
 * {@link #jabsStateHasMapTimer} does not treat {@code stepsToRemove} alone as a timer.
 * @type {number}
 */
Object.defineProperty(RPG_State.prototype, 'jabsStateDurationFrames', {
  get: function()
  {
    const framesFromTag = RPGManager.getNumberFromNoteByRegex(
      this,
      J.ABS.RegExp.StateDuration,
      true,
    );

    if (framesFromTag !== null && framesFromTag > 0)
    {
      return framesFromTag;
    }

    const secondsFromTag = RPGManager.getNumberFromNoteByRegex(
      this,
      J.ABS.RegExp.StateDurationSec,
      true,
    );

    if (secondsFromTag !== null && secondsFromTag > 0)
    {
      return secondsFromTag * 60;
    }

    return this.stepsToRemove;
  },
});
//endregion stateDurationFrames

//region thisStateDurationBoost
/**
 * A bonus to this state's own outgoing map-timer duration, read from this state's own note only.<br/>
 * When J-Extend is active and another active state carries `<extend:[...]>` or
 * `<extendType:TYPE>` targeting this state, that overlay's note (and thus its own
 * `<thisStateDurationFlat/Perc/Formula>` tags, if any) is merged into this note before this
 * getter runs- so this is effectively "one state doubling the duration of another it extends,"
 * without touching the caster-wide {@code <stateDurationFlat/Perc/Formula>} tags (which apply to
 * every state a battler applies, not just ones sharing a classifier).<br/>
 * Mirrors {@link Game_Battler#getStateDurationBoost}, but sourced from a single (possibly
 * extension-merged) state note instead of every note source on the applying battler.
 * @param {number} baseDuration The base duration (in frames) to compute percent/formula bonuses off of.
 * @returns {number} The bonus frames to add to this state's own outgoing duration.
 */
RPG_State.prototype.jabsThisStateDurationBoost = function(baseDuration)
{
  // grab the flat frame bonus from this state's own note.
  const flat = RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.ThisStateDurationFlatPlus);

  // grab the percent-of-base bonus from this state's own note.
  const percent = RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.ThisStateDurationPercentPlus);

  // resolve the percent bonus into frames against the base duration.
  const percentBoost = Math.round(baseDuration * (percent / 100));

  // grab the formula-driven bonus from this state's own note; no battler context is available here
  // since this boost is state-scoped rather than caster-scoped, so "a" resolves to null in-formula.
  const formulaBoost = RPGManager.getResultFromNoteByRegex(
    this,
    J.ABS.RegExp.ThisStateDurationFormulaPlus,
    baseDuration);

  // sum the boosts together to get the total boost.
  const durationBoost = flat + percentBoost + formulaBoost;

  // format it kindly because javascript floating point numbers suck.
  return parseFloat(durationBoost.toFixed(2));
};
//endregion thisStateDurationBoost
//endregion RPG_State effects