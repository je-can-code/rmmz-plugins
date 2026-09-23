//region Game_Battler
/**
 * Extends `.initMembers()` to include initializing the natural growth parameters.
 */
J.NATURAL.Aliased.Game_Battler.set('initMembers', Game_Battler.prototype.initMembers);
Game_Battler.prototype.initMembers = function()
{
  // perform original logic.
  J.NATURAL.Aliased.Game_Battler.get('initMembers')
    .call(this);

  // initialize the natural parameter collections.
  this.initNaturalGrowthParameters();
};

//region properties
/**
 * Initializes the natural growth parameters for this battler.<br/>
 * Every parameter's natural state lives in four tables keyed by that parameter's registry key, so a
 * parameter bound to natural growth has somewhere to keep its buffs and growths without anything here
 * having to name it. A key nothing has buffed or grown is simply absent from a table, and reads as zero.
 *
 * Every amount is held in the numbers its tags were authored in- the ones the status screen shows- and
 * only converted into the parameter's own units when a bonus is finally resolved. A lifesteal growth
 * of `1.5` per level is therefore stored as `1.5` and not as the `0.015` the engine will add.
 */
Game_Battler.prototype.initNaturalGrowthParameters = function()
{
  /**
   * The J object where all my additional properties live.
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with natural growth.
   */
  this._j._natural ||= {};

  /**
   * The flat bonus each parameter's buff tags currently grant, keyed by registry key.<br/>
   * A cache rather than a record: it is rebuilt from scratch whenever this battler's note sources
   * change, which is how a buff disappears the moment its equipment or state does.
   * @type {Record<string, number>}
   */
  this._j._natural._buffPlus = {};

  /**
   * The percent bonus each parameter's buff tags currently grant, keyed by registry key.<br/>
   * Rebuilt alongside the flat buffs, for the same reason.
   * @type {Record<string, number>}
   */
  this._j._natural._buffRate = {};

  /**
   * The flat bonus each parameter has permanently grown by, keyed by registry key.<br/>
   * Accrued once per level gained, and never given back.
   * @type {Record<string, number>}
   */
  this._j._natural._growthPlus = {};

  /**
   * The percent bonus each parameter has permanently grown by, keyed by registry key.<br/>
   * Accrued alongside the flat growth, for the same reason.
   * @type {Record<string, number>}
   */
  this._j._natural._growthRate = {};

  /**
   * The amount of additional exp to gain. Only affects experience gained from an enemy's defeat.
   * @type {number}
   */
  this._j._natural._expPlus = 0;

  /**
   * The amount of additional gold to gain. Only affects gold gained from an enemy's defeat.
   * @type {number}
   */
  this._j._natural._goldPlus = 0;

  /**
   * The amount of additional SDP points to gain. Only affects points gained from an enemy's defeat.
   * @type {number}
   */
  this._j._natural._sdpsPlus = 0;
};

//region tables
/**
 * Gets the table of flat buffs, keyed by registry key.
 * @returns {Record<string, number>}
 */
Game_Battler.prototype.naturalBuffPlusTable = function()
{
  return this._j._natural._buffPlus;
};

/**
 * Replaces the table of flat buffs.
 * @param {Record<string, number>} table The new table, keyed by registry key.
 */
Game_Battler.prototype.setNaturalBuffPlusTable = function(table)
{
  this._j._natural._buffPlus = table;
};

/**
 * Gets the table of percent buffs, keyed by registry key.
 * @returns {Record<string, number>}
 */
Game_Battler.prototype.naturalBuffRateTable = function()
{
  return this._j._natural._buffRate;
};

/**
 * Replaces the table of percent buffs.
 * @param {Record<string, number>} table The new table, keyed by registry key.
 */
Game_Battler.prototype.setNaturalBuffRateTable = function(table)
{
  this._j._natural._buffRate = table;
};

/**
 * Gets the table of flat growths, keyed by registry key.
 * @returns {Record<string, number>}
 */
Game_Battler.prototype.naturalGrowthPlusTable = function()
{
  return this._j._natural._growthPlus;
};

/**
 * Gets the table of percent growths, keyed by registry key.
 * @returns {Record<string, number>}
 */
Game_Battler.prototype.naturalGrowthRateTable = function()
{
  return this._j._natural._growthRate;
};
//endregion tables

//region per parameter
/**
 * Gets the flat buff a parameter's buff tags currently grant this battler.
 * @param {string} parameterKey The registry key of the parameter.
 * @returns {number} The buff, or zero when nothing is buffing the parameter.
 */
Game_Battler.prototype.naturalBuffPlus = function(parameterKey)
{
  return this.naturalBuffPlusTable()[parameterKey] ?? 0;
};

/**
 * Sets the flat buff a parameter's buff tags currently grant this battler.
 * @param {string} parameterKey The registry key of the parameter.
 * @param {number} amount The flat buff, in the numbers the tags were authored in.
 */
Game_Battler.prototype.setNaturalBuffPlus = function(parameterKey, amount)
{
  this.naturalBuffPlusTable()[parameterKey] = amount;
};

/**
 * Gets the percent buff a parameter's buff tags currently grant this battler.
 * @param {string} parameterKey The registry key of the parameter.
 * @returns {number} The buff, or zero when nothing is buffing the parameter.
 */
Game_Battler.prototype.naturalBuffRate = function(parameterKey)
{
  return this.naturalBuffRateTable()[parameterKey] ?? 0;
};

/**
 * Sets the percent buff a parameter's buff tags currently grant this battler.
 * @param {string} parameterKey The registry key of the parameter.
 * @param {number} amount The percent buff, as a whole percent.
 */
Game_Battler.prototype.setNaturalBuffRate = function(parameterKey, amount)
{
  this.naturalBuffRateTable()[parameterKey] = amount;
};

/**
 * Gets the flat bonus this battler has permanently grown a parameter by.
 * @param {string} parameterKey The registry key of the parameter.
 * @returns {number} The growth, or zero when the parameter has never grown.
 */
Game_Battler.prototype.naturalGrowthPlus = function(parameterKey)
{
  return this.naturalGrowthPlusTable()[parameterKey] ?? 0;
};

/**
 * Grows the flat bonus of a parameter by a given amount.<br/>
 * Modified rather than assigned, because growth is the running total of every level ever gained.
 * @param {string} parameterKey The registry key of the parameter.
 * @param {number} amount The amount to grow by, in the numbers the tags were authored in.
 */
Game_Battler.prototype.modNaturalGrowthPlus = function(parameterKey, amount)
{
  this.naturalGrowthPlusTable()[parameterKey] = this.naturalGrowthPlus(parameterKey) + amount;
};

/**
 * Gets the percent bonus this battler has permanently grown a parameter by.
 * @param {string} parameterKey The registry key of the parameter.
 * @returns {number} The growth, or zero when the parameter has never grown.
 */
Game_Battler.prototype.naturalGrowthRate = function(parameterKey)
{
  return this.naturalGrowthRateTable()[parameterKey] ?? 0;
};

/**
 * Grows the percent bonus of a parameter by a given amount.<br/>
 * Modified rather than assigned, for the same reason as the flat growth.
 * @param {string} parameterKey The registry key of the parameter.
 * @param {number} amount The amount to grow by, as a whole percent.
 */
Game_Battler.prototype.modNaturalGrowthRate = function(parameterKey, amount)
{
  this.naturalGrowthRateTable()[parameterKey] = this.naturalGrowthRate(parameterKey) + amount;
};
//endregion per parameter

//region rewards
/**
 * Gets the bonus to rewarded experience.
 * @returns {number}
 */
Game_Battler.prototype.expPlus = function()
{
  return this._j._natural._expPlus;
};

/**
 * Sets the bonus to rewarded experience.
 * @param {number} expPlus The new bonus rewarded experience value.
 */
Game_Battler.prototype.setExpPlus = function(expPlus)
{
  this._j._natural._expPlus = expPlus;
};

/**
 * Gets the bonus to rewarded gold.
 * @returns {number}
 */
Game_Battler.prototype.goldPlus = function()
{
  return this._j._natural._goldPlus;
};

/**
 * Sets the bonus to rewarded gold.
 * @param {number} goldPlus The new bonus rewarded gold value.
 */
Game_Battler.prototype.setGoldPlus = function(goldPlus)
{
  this._j._natural._goldPlus = goldPlus;
};

/**
 * Gets the bonus to rewarded SDPs.
 * @returns {number}
 */
Game_Battler.prototype.sdpsPlus = function()
{
  return this._j._natural._sdpsPlus;
};

/**
 * Sets the bonus to rewarded SDPs.
 * @param {number} sdpsPlus The new bonus rewarded SDPs value.
 */
Game_Battler.prototype.setSdpsPlus = function(sdpsPlus)
{
  this._j._natural._sdpsPlus = sdpsPlus;
};
//endregion rewards
//endregion properties

//region resolving bonuses
/**
 * Extends {@link #naturalBonus}.<br/>
 * Adds this battler's buffs and growths for a bound parameter, resolved against that parameter's base.
 * This is how every plugin-owned parameter receives its natural bonus: its owner adds this wherever it
 * assembles the value, and never has to know whether this plugin is installed.
 * @param {string} parameterKey The registry key of the parameter being assembled.
 * @returns {number}
 */
J.NATURAL.Aliased.Game_Battler.set('naturalBonus', Game_Battler.prototype.naturalBonus);
Game_Battler.prototype.naturalBonus = function(parameterKey)
{
  // perform original logic.
  const otherBonuses = J.NATURAL.Aliased.Game_Battler.get('naturalBonus')
    .call(this, parameterKey);

  // find the binding first, so a parameter folded in but never bound is loud even while it is zero.
  const binding = ParameterRegistry.naturalBinding(parameterKey);

  // a parameter nothing is buffing or growing adds nothing, and never needs its base resolved.
  if (this.hasNaturalBonus(parameterKey) === false) return otherBonuses;

  // resolve the parameter's own value before natural bonuses, which its rate tags are a percent of.
  const base = binding.getBase(this);

  // add this battler's natural bonus on top of whatever else was contributed.
  return otherBonuses + this.naturalBonusAgainst(parameterKey, base);
};

/**
 * Resolves the natural bonus for one of the engine's own parameters, whose assembly this plugin wraps.<br/>
 * Those wrappers already hold the engine's base when they get here, so the bonus is resolved against it
 * directly rather than through {@link #naturalBonus}, which would have to ask the engine for it again.
 * @param {string|null} parameterKey The registry key the engine id translates to, or null for an id
 * outside the engine's own set.
 * @param {number} base The engine's value for the parameter before natural bonuses.
 * @returns {number}
 */
Game_Battler.prototype.engineNaturalBonus = function(parameterKey, base)
{
  // an id outside the engine's own set names no parameter natural growth knows.
  if (parameterKey === null) return 0;

  // a parameter nothing is buffing or growing adds nothing.
  if (this.hasNaturalBonus(parameterKey) === false) return 0;

  // resolve the bonus against the base the wrapper already has in hand.
  return this.naturalBonusAgainst(parameterKey, base);
};

/**
 * Whether anything is currently buffing or has ever grown a parameter on this battler.
 * @param {string} parameterKey The registry key of the parameter.
 * @returns {boolean}
 */
Game_Battler.prototype.hasNaturalBonus = function(parameterKey)
{
  return this.naturalBuffPlus(parameterKey) !== 0
    || this.naturalBuffRate(parameterKey) !== 0
    || this.naturalGrowthPlus(parameterKey) !== 0
    || this.naturalGrowthRate(parameterKey) !== 0;
};

/**
 * Resolves this battler's natural bonus for a parameter against a known base.<br/>
 * Tags are authored in the numbers the status screen shows, while the parameter itself may be stored as
 * a fraction of them, so the base is lifted into those display numbers, the tags are applied there, and
 * only the finished bonus is brought back down. Lifting the base too, rather than only shrinking the
 * result, is what keeps a rate tag a percent of the base a person actually reads.
 *
 * Buffs and growths are each resolved against the same base and then summed, so neither compounds on
 * the other- a buff does not grow with level, and a growth does not swell when a state is applied.
 * @param {string} parameterKey The registry key of the parameter.
 * @param {number} base The parameter's own value before natural bonuses, in its own units.
 * @returns {number} The bonus, in the parameter's own units.
 */
Game_Battler.prototype.naturalBonusAgainst = function(parameterKey, base)
{
  // how many display units one unit of this parameter is worth.
  const scale = ParameterRegistry.get(parameterKey)
    .displayScale();

  // lift the base into the numbers the tags were written in.
  const displayBase = base * scale;

  // resolve the temporary bonus from whatever is buffing the parameter right now.
  const buffPlus = this.naturalBuffPlus(parameterKey);
  const buffRate = this.naturalBuffRate(parameterKey);
  const buffBonus = this.calculatePlusRate(displayBase, buffPlus, buffRate);

  // resolve the permanent bonus from everything the parameter has grown by.
  const growthPlus = this.naturalGrowthPlus(parameterKey);
  const growthRate = this.naturalGrowthRate(parameterKey);
  const growthBonus = this.calculatePlusRate(displayBase, growthPlus, growthRate);

  // bring the finished bonus back down into the parameter's own units.
  return (buffBonus + growthBonus) / scale;
};

/**
 * The base a parameter's tags see as `b`, in the numbers those tags are written in.<br/>
 * This is the same base a rate tag is a percent of, lifted into display units so a formula such as
 * `b * 0.1` means a tenth of the value the status screen shows.
 * @param {string} parameterKey The registry key of the parameter.
 * @returns {number}
 */
Game_Battler.prototype.naturalDisplayBase = function(parameterKey)
{
  // the binding knows how to find the parameter's own value before natural bonuses.
  const binding = ParameterRegistry.naturalBinding(parameterKey);
  const base = binding.getBase(this);

  // lift that value into the numbers the tags were authored in.
  const scale = ParameterRegistry.get(parameterKey)
    .displayScale();

  return base * scale;
};

/**
 * Calculates the combination of base parameter value, param plus, and param rate.
 * This can be overridden if alternative calculations is desired.
 * @param {number} baseValue The base value of the parameter.
 * @param {number} paramPlus The flat bonus value of the parameter.
 * @param {number} paramRate The multiplier bonus value of the parameter.
 * @returns {number} The calculated result.
 */
Game_Battler.prototype.calculatePlusRate = function(baseValue, paramPlus, paramRate)
{
  // determine the modified buff rate.
  const paramFactor = ((paramRate + 100) / 100);

  // determine the modified base parameter.
  const paramBase = (baseValue + paramPlus);

  // remove the value of base param since it is added at the end.
  return (paramBase * paramFactor) - baseValue;
};
//endregion resolving bonuses

//region refreshing buffs
/**
 * Refreshes both plus/rate buffs for all parameters.
 */
Game_Battler.prototype.refreshAllParameterBuffs = function()
{
  // start from empty, so a parameter whose last buff source was removed reads nothing.
  this.clearAllParameterBuffs();

  // resolve the buffs of every parameter bound to natural growth.
  ParameterRegistry.naturallyBoundKeys()
    .forEach(parameterKey => this.refreshParameterBuffs(parameterKey));

  // refresh the battle reward bonuses, which only an enemy carries.
  this.refreshRewardBonuses();
};

/**
 * Clears all parameter buffs on this battler.
 */
Game_Battler.prototype.clearAllParameterBuffs = function()
{
  // empty both buff tables.
  this.setNaturalBuffPlusTable({});
  this.setNaturalBuffRateTable({});

  // zero out the reward bonuses.
  this.setExpPlus(0);
  this.setGoldPlus(0);
  this.setSdpsPlus(0);
};

/**
 * Resolves the buff tags of one parameter into this battler's buff tables.<br/>
 * Only a parameter something is actually buffing gets an entry, which keeps the tables down to what
 * matters and leaves a saved battler readable at a glance.
 * @param {string} parameterKey The registry key of the parameter.
 */
Game_Battler.prototype.refreshParameterBuffs = function(parameterKey)
{
  // the tags this parameter answers to, and what those tags see as their base.
  const binding = ParameterRegistry.naturalBinding(parameterKey);
  const base = this.naturalDisplayBase(parameterKey);

  // evaluate every flat buff formula this battler carries for the parameter.
  const buffPlus = this.naturalParamBuff(binding.buffPlus, base);

  // record it, when there is anything to record.
  if (buffPlus !== 0)
  {
    this.setNaturalBuffPlus(parameterKey, buffPlus);
  }

  // evaluate every percent buff formula this battler carries for the parameter.
  const buffRate = this.naturalParamBuff(binding.buffRate, base);

  // record it, when there is anything to record.
  if (buffRate !== 0)
  {
    this.setNaturalBuffRate(parameterKey, buffRate);
  }
};

/**
 * Refreshes battle reward bonuses for the battler.
 */
Game_Battler.prototype.refreshRewardBonuses = function()
{
  // do nothing at this level.
};

/**
 * Calculates the bonus growth based on the provided regular expression.
 * @param {RegExp} structure The RegExp structure for this parameter.
 * @param {number} baseParam The original value of the given parameter.
 * @returns {number} The growth amount.
 */
Game_Battler.prototype.naturalParamBuff = function(structure, baseParam)
{
  // gather all database objects with notes that influence parameters.
  const objectsToCheck = this.getAllNotes();

  // leverage RPGManager to evaluate and sum all matching formulas across all notes.
  const total = RPGManager.getResultsFromAllNotesByRegex(objectsToCheck, structure, baseParam, this, false);

  // return the calculated sum (0 if nothing found).
  return total;
};
//endregion refreshing buffs

//region max tp
/**
 * Overwrites {@link #maxTp}.<br/>
 * Combines base max TP with formula-based values derived from tags.
 * @returns {number}
 */
Game_Battler.prototype.maxTp = function()
{
  // calculate our actual max tp.
  return Math.max(0, this.actualMaxTp());
};

/**
 * Get the actual calculated max tp for this battler.
 * @returns {number}
 */
Game_Battler.prototype.actualMaxTp = function()
{
  // the max tech this battler has before any natural bonus.
  const baseMaxTp = this.maxTpBeforeNatural();

  // add whatever natural buffs and growths are bound to max tech.
  const naturalBonus = this.naturalBonus('mtp');

  // return result.
  return (baseMaxTp + naturalBonus);
};

/**
 * The max tech this battler has before natural bonuses: the configured base plus every `<maxTp>` tag.<br/>
 * This is the base max tech's natural tags see, and what its rate tags are a percent of.
 * @returns {number}
 */
Game_Battler.prototype.maxTpBeforeNatural = function()
{
  // get the base max tp defined.
  const baseParam = this.getBaseMaxTp();

  // get the bonuses to max tp.
  const baseBonusParam = this.getBaseMaxTpBonuses();

  // return the combination.
  return (baseParam + baseBonusParam);
};
//endregion max tp
//endregion Game_Battler