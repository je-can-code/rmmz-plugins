//region regeneration
/**
 * Updates all regenerations and ticks four times per second.
 */
JABS_Battler.prototype.updateRG = function()
{
  // check if we are able to update the RG.
  if (!this.canUpdateRG()) return;

  //
  this.performRegeneration();
  this.setRegenCounter(15);
};

/**
 * Determines whether or not the regeneration can be updated.
 * @returns {boolean}
 */
JABS_Battler.prototype.canUpdateRG = function()
{
  // check if the regen is even ready for this battler.
  if (!this.isRegenReady()) return false;

  // if its ready but
  if (this.getBattler()
    .isDead())
  {
    return false;
  }

  return true;
};

/**
 * Whether or not the regen tick is ready.
 * @returns {boolean} True if its time for a regen tick, false otherwise.
 */
JABS_Battler.prototype.isRegenReady = function()
{
  if (this.getRegenCounter() <= 0)
  {
    this.setRegenCounter(0);
    return true;
  }

  this.decrementRegenCounter();
  return false;
};

/**
 * Gets the current count on the regen counter.
 * @returns {number}
 */
JABS_Battler.prototype.getRegenCounter = function()
{
  return this._regenCounter;
};

/**
 * Decrements the regen counter by one.
 */
JABS_Battler.prototype.decrementRegenCounter = function()
{
  this.setRegenCounter(this.getRegenCounter() - 1);
};

/**
 * Sets the regen counter to a given number.
 * @param {number} count The count to set the regen counter to.
 */
JABS_Battler.prototype.setRegenCounter = function(count)
{
  this._regenCounter = count;
};

/**
 * Performs the full suite of possible regenerations handled by JABS.
 *
 * This includes both natural and tag/state-driven regenerations.
 */
JABS_Battler.prototype.performRegeneration = function()
{
  // if we have no battler, don't bother.
  const battler = this.getBattler();
  if (!battler) return;

  // handle our natural rgs since we have a battler.
  this.processNaturalRegens();

  // if we have no states, don't bother.
  let states = battler.allStates();
  if (!states.length) return;

  // clean-up all the states that are somehow applied but not tracked.
  states = states.filter(this.shouldProcessState, this);

  // TODO: modify to interact with state stacks.
  // handle all the tag-specific hp/mp/tp regenerations.
  this.processStateRegens(states);
};

/**
 * Processes the natural regeneration of this battler.
 *
 * This includes all HRG/MRG/TRG derived from any extraneous source.
 */
JABS_Battler.prototype.processNaturalRegens = function()
{
  // check if this battler's natural regen should be reduced.
  const isReduced = this.isNaturalRegenReduced();

  // process the natural hp/mp regens, possibly reduced.
  this.processNaturalHpRegen(isReduced);
  this.processNaturalMpRegen(isReduced);

  // natural TP regen is never reduced.
  this.processNaturalTpRegen(isReduced);
};

/**
 * Checks if the natural regeneration should be reduced for this battler.
 * @returns {boolean}
 */
JABS_Battler.prototype.isNaturalRegenReduced = function()
{
  // enemies are not impacted by reduced natural regen.
  if (this.isEnemy()) return false;

  // in-combat players will have a "last battler hit" tracked. Once that fades, they aren't in combat.
  // TODO: may need to add a "i was last hit in the last 10 seconds" tracker.
  if (this.isPlayer() && this.getBattlerLastHit() !== null) return true;

  // in-combat allies will be actors that are presently engaged.
  if (this.isActor() && this.isEngaged()) return true;

  // no reason to reduce natural regen.
  return false;
};

/**
 * Calculate the per5seconds regeneration rate and reduce it if applicable. By default, this should be roughly 5% of
 * the base100 regeneration value, and 20% of that value if reduced.
 * @param {number} baseValue The base regeneration value.
 * @param {boolean} isReduced Whether or not this regeneration value should be reduced.
 * @returns {number}
 */
JABS_Battler.prototype.calculatedRegen = function(baseValue, isReduced = false)
{
  // calculate the amount regenerated four times per second.
  let calculatedValue = (baseValue * 100) * 0.05;
  if (isReduced)
  {
    // only 20% of your natural HP regen is available while reduced.
    calculatedValue *= 0.20;
  }

  // fix the value to two decimal places.
  return parseFloat(calculatedValue.toFixed(2)) ?? 0;
};

/**
 * Processes the natural HRG for this battler.
 */
JABS_Battler.prototype.processNaturalHpRegen = function(isReduced)
{
  // shorthand the battler.
  const battler = this.getBattler();

  // check if we need to regenerate.
  if (battler.hp < battler.mhp)
  {
    // extract the regens rates.
    const {
      hrg,
      rec
    } = battler;

    // calculate the bonus.
    const naturalHp5 = this.calculatedRegen(hrg, isReduced) * rec;

    // execute the gain.
    battler.gainHp(naturalHp5);
  }
};

/**
 * Processes the natural MRG for this battler.
 */
JABS_Battler.prototype.processNaturalMpRegen = function(isReduced)
{
  // shorthand the battler.
  const battler = this.getBattler();

  // check if we need to regnerate.
  if (battler.mp < battler.mmp)
  {
    // extract the regens rates.
    const {
      mrg,
      rec
    } = battler;

    // calculate the bonus.
    const naturalMp5 = this.calculatedRegen(mrg, isReduced) * rec;

    // execute the gain.
    battler.gainMp(naturalMp5);
  }
};

/**
 * Processes the natural TRG for this battler.
 */
JABS_Battler.prototype.processNaturalTpRegen = function(isReduced)
{
  // shorthand the battler.
  const battler = this.getBattler();

  // check if we need to regenerate.
  if (battler.tp < battler.maxTp())
  {
    // extract the regens rates.
    const {
      trg,
      rec
    } = battler;

    // calculate the bonus.
    const naturalTp5 = this.calculatedRegen(trg, isReduced) * rec;

    // execute the gain.
    battler.gainTp(naturalTp5);
  }
};

/**
 * Processes all regenerations derived from state tags.
 * @param {RPG_State[]} states The filtered list of states to parse.
 */
JABS_Battler.prototype.processStateRegens = function(states)
{
  // grab the battler we're working with.
  const battler = this.getBattler();

  // default the regenerations to the battler's innate regens.
  const { rec } = battler;
  const regens = [ 0, 0, 0 ];

  // process each state for slip actions.
  for (const state of states)
  {
    // add the per-five hp slip.
    regens[0] += this.stateSlipHp(state);

    // add the per-five mp slip.
    regens[1] += this.stateSlipMp(state);

    // add the per-five tp slip.
    regens[2] += this.stateSlipTp(state);
  }

  // iterate over the above regens.
  regens.forEach((regen, index) =>
  {
    // if it wasn't modified, don't worry about it.
    if (!regen)
    {
      return;
    }

    // apply REC effects against all three regens.
    if (regen > 0)
    {
      regen *= rec;
    }

    // apply "per5" rate- 4 times per second, for 5 seconds, equals 20.
    regen /= 20;


    // if we have a non-zero amount, generate the popup.
    if (regen)
    {
      this.applySlipEffect(regen, index);

      // flip the sign for the regen for properly creating pops.
      regen *= -1;

      // generate the textpop.
      this.generatePopSlip(regen, index);
    }
  });
};

/**
 * Determines if a state should be processed or not for slip effects.
 * @param {RPG_State} state The state to check if needing processing.
 * @returns {boolean} True if we should process this state, false otherwise.
 */
JABS_Battler.prototype.shouldProcessState = function(state)
{
  // grab the battler we're working with.
  const battler = this.getBattler();

  // grab the state we're working with.
  const trackedState = $jabsEngine.getJabsStateByUuidAndStateId(battler.getUuid(), state.id);

  // validate the state exists.
  if (!trackedState)
  {
    // untracked states could be passive states the battler is owning.
    if (battler.isPassiveState(state.id)) return true;

    // when loading a file that was saved with a state, we encounter a weird issue
    // where the state is still on the battler but not in temporary memory as a
    // JABS tracked state. In this case, we remove it.
    battler.removeState(state.id);
    return false;
  }

  // don't process states if they have no metadata.
  // the RG from states is a part of the base, now.
  if (!state.meta) return false;

  return true;
};

/**
 * Processes a single state and returns its tag-based hp regen value.
 * @param {RPG_State} state The state to process.
 * @returns {number} The hp regen from this state.
 */
JABS_Battler.prototype.stateSlipHp = function(state)
{
  // grab the battler we're working with.
  const battler = this.getBattler();

  // the running total of the hp-per-5 amount from states.
  let tagHp5 = 0;

  // deconstruct the data out of the state.
  const {
    jabsSlipHpFlatPerFive: hpPerFiveFlat,
    jabsSlipHpPercentPerFive: hpPerFivePercent,
    jabsSlipHpFormulaPerFive: hpPerFiveFormula,
  } = state;

  // if the flat tag exists, use it.
  tagHp5 += hpPerFiveFlat;

  // if the percent tag exists, use it.
  tagHp5 += battler.mhp * (hpPerFivePercent / 100);

  // if the formula tag exists, use it.
  if (hpPerFiveFormula)
  {
    // add the slip formula to the running total.
    tagHp5 += this.calculateStateSlipFormula(hpPerFiveFormula, battler, state);
  }

  // return the per-five.
  return tagHp5;
};

/**
 * Processes a single state and returns its tag-based mp regen value.
 * @param {RPG_State} state The state to process.
 * @returns {number} The mp regen from this state.
 */
JABS_Battler.prototype.stateSlipMp = function(state)
{
  // grab the battler we're working with.
  const battler = this.getBattler();

  // the running total of the mp-per-5 amount from states.
  let tagMp5 = 0;

  // deconstruct the data out of the state.
  const {
    jabsSlipMpFlatPerFive: mpPerFiveFlat,
    jabsSlipMpPercentPerFive: mpPerFivePercent,
    jabsSlipMpFormulaPerFive: mpPerFiveFormula,
  } = state;

  // if the flat tag exists, use it.
  tagMp5 += mpPerFiveFlat;

  // if the percent tag exists, use it.
  tagMp5 += battler.mmp * (mpPerFivePercent / 100);

  // if the formula tag exists, use it.
  if (mpPerFiveFormula)
  {
    // add the slip formula to the running total.
    tagMp5 += this.calculateStateSlipFormula(mpPerFiveFormula, battler, state);
  }

  // return the per-five.
  return tagMp5;
};

/**
 * Processes a single state and returns its tag-based tp regen value.
 * @param {RPG_State} state The state to process.
 * @returns {number} The tp regen from this state.
 */
JABS_Battler.prototype.stateSlipTp = function(state)
{
  // grab the battler we're working with.
  const battler = this.getBattler();

  // default slip to zero.
  let tagTp5 = 0;

  // deconstruct the data out of the state.
  const {
    jabsSlipTpFlatPerFive: tpPerFiveFlat,
    jabsSlipTpPercentPerFive: tpPerFivePercent,
    jabsSlipTpFormulaPerFive: tpPerFiveFormula,
  } = state;

  // if the flat tag exists, use it.
  tagTp5 += tpPerFiveFlat;

  // if the percent tag exists, use it.
  tagTp5 += battler.maxTp() * (tpPerFivePercent / 100);

  // if the formula tag exists, use it.
  if (tpPerFiveFormula)
  {
    // add the slip formula to the running total.
    tagTp5 += this.calculateStateSlipFormula(tpPerFiveFormula, battler, state);
  }

  // return the per-five.
  return tagTp5;
};

/**
 * Calculates the value of a slip-based formula.
 * This is where the source and afflicted are determined before {@link eval}uating the
 * formula with the necessary context to evaluate a formula.
 * @param {string} formula The string containing the formula to parse.
 * @param {Game_Battler} battler The battler that is afflicted with the slip effect.
 * @param {RPG_State} state The state representing this slip effect.
 * @returns {number} The result of the formula representing the slip effect value.
 */
JABS_Battler.prototype.calculateStateSlipFormula = function(formula, battler, state)
{
  // pull the state associated with the battler.
  const trackedState = $jabsEngine.getJabsStateByUuidAndStateId(battler.getUuid(), state.id);

  // initialize the source and afflicted with oneself.
  let sourceBattler = battler;
  let afflictedBattler = battler;

  // check if the trackedState was present.
  if (trackedState)
  {
    // update the source and afflicted with the tracked data instead.
    sourceBattler = trackedState.source;
    afflictedBattler = trackedState.battler;
  }

  // calculate the total for this slip formula.
  const total = this.slipEval(formula, sourceBattler, afflictedBattler, state);

  // return the result.
  return total;
};

/**
 * Performs an {@link eval} on the provided formula with the given parameters as scoped context
 * to calculate a formula-based slip values. Also provides a weak safety net to ensure that no
 * garbage values get returned, or raises exceptions if the formula is invalidly written.
 * @param {string} formula The string containing the formula to parse.
 * @param {Game_Battler} sourceBattler The battler that applied this state to the target.
 * @param {Game_Battler} afflictedBattler The target battler afflicted with this state.
 * @param {RPG_State} state The state associated with this slip effect.
 * @returns {number} The output of the formula (multiplied by `-1`) to
 */
JABS_Battler.prototype.slipEval = function(formula, sourceBattler, afflictedBattler, state)
{
  // variables for contextual eval().
  /* eslint-disable no-unused-vars */
  const a = sourceBattler;        // the one who applied the state.
  const b = afflictedBattler;     // this battler, afflicted by the state.
  const v = $gameVariables._data; // access to variables if you need it.
  const s = state;                // access to the state itself if you need it.
  /* eslint-enable no-unused-vars */

  // initialize the result.
  let result = 0;

  // add a safety net for people who write broken formulas.
  try
  {
    // eval() the formula and default to negative (because "slip" is negative).
    result = eval(formula) * -1;

    // check if the eval() produced garbage output despite not throwing.
    if (!Number.isFinite(result))
    {
      // throw, and then catch to properly log in the next block.
      throw new Error("Invalid formula.")
    }
  }
  catch (err)
  {
    console.warn(`failed to eval() this formula: [ ${formula} ]`);
    console.trace();
    throw err;
  }

  // we prefer to work with integers for slip.
  const formattedResult = Math.round(result);

  // return the calculated result.
  return formattedResult;
};

/**
 * Applies the regeneration amount to the appropriate parameter.
 * @param {number} amount The regen amount.
 * @param {number} type The regen type- identified by index.
 */
JABS_Battler.prototype.applySlipEffect = function(amount, type)
{
  // grab the battler.
  const battler = this.getBattler();

  // pivot on the slip type.
  switch (type)
  {
    case 0:
      battler.gainHp(amount);
      break;
    case 1:
      battler.gainMp(amount);
      break;
    case 2:
      battler.gainTp(amount);
      break;
  }
};

/**
 * Creates the slip popup on this battler.
 * @param {number} amount The slip pop amount.
 * @param {number} type The slip parameter: 0=hp, 1=mp, 2=tp.
 */
JABS_Battler.prototype.generatePopSlip = function(amount, type)
{
  // if we are not using popups, then don't do this.
  if (!J.POPUPS) return;

  // gather shorthand variables for use.
  const character = this.getCharacter();

  // generate the textpop.
  const slipPop = this.configureSlipPop(amount, type);

  // add the pop to the target's tracking.
  character.addTextPop(slipPop);
  character.requestTextPop();
};

/**
 * Configures a popup based on the slip damage type and amount.
 * @param {number} amount The amount of the slip.
 * @param {0|1|2} type The slip parameter: 0=hp, 1=mp, 2=tp.
 * @returns {Map_TextPop}
 */
JABS_Battler.prototype.configureSlipPop = function(amount, type)
{
  // lets take our time with this text pop building.
  const textPopBuilder = new TextPopBuilder(amount);

  // based on the hp/mp/tp type, we apply different visual effects.
  switch (type)
  {
    case 0: // hp
      textPopBuilder.isHpDamage();
      break;
    case 1: // mp
      textPopBuilder.isMpDamage();
      break;
    case 2: // tp
      textPopBuilder.isTpDamage();
      break;
  }

  // build and return the popup.
  return textPopBuilder.build();
};
//endregion regeneration