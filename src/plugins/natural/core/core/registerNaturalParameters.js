//region registerNaturalParameters
/**
 * Boot-time natural growth bindings for the parameters J-NaturalGrowth answers for itself: the
 * engine's twenty-eight, plus max tech and healing amplification.<br/>
 * Every other plugin binds its own parameters from its own `register*Parameters.js`, because their
 * tags live in their own `RegExp` tables. These thirty are the ones no other plugin owns, so they are
 * bound here, after J-Base has registered the definitions they attach to.
 *
 * Each engine table below is ordered by the engine's own parameter id, and the id a row sits at is
 * the id it binds- the same order {@link ParameterKeys} lists its keys in.
 */
class NaturalParameterRegistration
{
  /**
   * Binds every parameter this plugin owns the tags for.
   */
  static registerAll()
  {
    this.registerBaseParameters();
    this.registerExParameters();
    this.registerSpParameters();
    this.registerCustomParameters();
  }

  /**
   * Binds the engine's eight base parameters, which grow against the base the engine computes for them.
   */
  static registerBaseParameters()
  {
    this.baseParameterTags()
      .forEach((tags, paramId) =>
      {
        // resolve the registry key the engine's id is known by.
        const parameterKey = ParameterKeys.bparamKey(paramId);

        // grow against the engine's own base for this parameter.
        this.bind(parameterKey, tags, battler => battler.paramBaseBeforeNatural(paramId));
      });
  }

  /**
   * Binds the engine's ten ex-parameters, which grow against the value the engine computes for them.
   */
  static registerExParameters()
  {
    this.exParameterTags()
      .forEach((tags, xparamId) =>
      {
        // resolve the registry key the engine's id is known by.
        const parameterKey = ParameterKeys.xparamKey(xparamId);

        // grow against the engine's own value for this parameter.
        this.bind(parameterKey, tags, battler => battler.xparamBeforeNatural(xparamId));
      });
  }

  /**
   * Binds the engine's ten sp-parameters, which grow against the value the engine computes for them.
   */
  static registerSpParameters()
  {
    this.spParameterTags()
      .forEach((tags, sparamId) =>
      {
        // resolve the registry key the engine's id is known by.
        const parameterKey = ParameterKeys.sparamKey(sparamId);

        // grow against the engine's own value for this parameter.
        this.bind(parameterKey, tags, battler => battler.sparamBeforeNatural(sparamId));
      });
  }

  /**
   * Binds max tech and healing amplification, the two parameters RMMZ has no native slot for.
   */
  static registerCustomParameters()
  {
    // the regexes live in this plugin's own table.
    const tags = J.NATURAL.RegExp;

    // max tech grows against its configured base plus every tag that raises it.
    const maxTechTags = [ tags.MaxTechBuffPlus, tags.MaxTechBuffRate, tags.MaxTechGrowthPlus, tags.MaxTechGrowthRate ];
    this.bind('mtp', maxTechTags, battler => battler.maxTpBeforeNatural());

    // healing amplification grows against the factor its own tags produce.
    const healingTags = [ tags.HarBuffPlus, tags.HarBuffRate, tags.HarGrowthPlus, tags.HarGrowthRate ];
    this.bind('har', healingTags, battler => battler.baseHarFactor());
  }

  /**
   * Binds one parameter's four tags and its base with the registry.
   * @param {string} parameterKey The registry key of the parameter.
   * @param {[RegExp, RegExp, RegExp, RegExp]} tags The buff-plus, buff-rate, growth-plus and growth-rate tags.
   * @param {function(Game_Battler): number} getBase Resolves the parameter's value before natural bonuses.
   */
  static bind(parameterKey, tags, getBase)
  {
    // name the four tags the parameter answers to.
    const [ buffPlus, buffRate, growthPlus, growthRate ] = tags;

    // attach them, and the base they read, to the parameter's key.
    const binding = new NaturalParameterBinding(buffPlus, buffRate, growthPlus, growthRate, getBase);
    ParameterRegistry.bindNatural(parameterKey, binding);
  }

  /**
   * The four tags of each base parameter, ordered by engine param id.
   * @returns {[RegExp, RegExp, RegExp, RegExp][]}
   */
  static baseParameterTags()
  {
    // the regexes live in this plugin's own table.
    const tags = J.NATURAL.RegExp;

    return [
      [ tags.MaxLifeBuffPlus, tags.MaxLifeBuffRate, tags.MaxLifeGrowthPlus, tags.MaxLifeGrowthRate ],
      [ tags.MaxMagiBuffPlus, tags.MaxMagiBuffRate, tags.MaxMagiGrowthPlus, tags.MaxMagiGrowthRate ],
      [ tags.PowerBuffPlus, tags.PowerBuffRate, tags.PowerGrowthPlus, tags.PowerGrowthRate ],
      [ tags.DefenseBuffPlus, tags.DefenseBuffRate, tags.DefenseGrowthPlus, tags.DefenseGrowthRate ],
      [ tags.ForceBuffPlus, tags.ForceBuffRate, tags.ForceGrowthPlus, tags.ForceGrowthRate ],
      [ tags.ResistBuffPlus, tags.ResistBuffRate, tags.ResistGrowthPlus, tags.ResistGrowthRate ],
      [ tags.SpeedBuffPlus, tags.SpeedBuffRate, tags.SpeedGrowthPlus, tags.SpeedGrowthRate ],
      [ tags.LuckBuffPlus, tags.LuckBuffRate, tags.LuckGrowthPlus, tags.LuckGrowthRate ],
    ];
  }

  /**
   * The four tags of each ex-parameter, ordered by engine xparam id.
   * @returns {[RegExp, RegExp, RegExp, RegExp][]}
   */
  static exParameterTags()
  {
    // the regexes live in this plugin's own table.
    const tags = J.NATURAL.RegExp;

    return [
      [ tags.HitBuffPlus, tags.HitBuffRate, tags.HitGrowthPlus, tags.HitGrowthRate ],
      [ tags.EvadeBuffPlus, tags.EvadeBuffRate, tags.EvadeGrowthPlus, tags.EvadeGrowthRate ],
      [ tags.CritChanceBuffPlus, tags.CritChanceBuffRate, tags.CritChanceGrowthPlus, tags.CritChanceGrowthRate ],
      [ tags.CritEvadeBuffPlus, tags.CritEvadeBuffRate, tags.CritEvadeGrowthPlus, tags.CritEvadeGrowthRate ],
      [ tags.MagiEvadeBuffPlus, tags.MagiEvadeBuffRate, tags.MagiEvadeGrowthPlus, tags.MagiEvadeGrowthRate ],
      [ tags.MagiReflectBuffPlus, tags.MagiReflectBuffRate, tags.MagiReflectGrowthPlus, tags.MagiReflectGrowthRate ],
      [ tags.CounterBuffPlus, tags.CounterBuffRate, tags.CounterGrowthPlus, tags.CounterGrowthRate ],
      [ tags.LifeRegenBuffPlus, tags.LifeRegenBuffRate, tags.LifeRegenGrowthPlus, tags.LifeRegenGrowthRate ],
      [ tags.MagiRegenBuffPlus, tags.MagiRegenBuffRate, tags.MagiRegenGrowthPlus, tags.MagiRegenGrowthRate ],
      [ tags.TechRegenBuffPlus, tags.TechRegenBuffRate, tags.TechRegenGrowthPlus, tags.TechRegenGrowthRate ],
    ];
  }

  /**
   * The four tags of each sp-parameter, ordered by engine sparam id.
   * @returns {[RegExp, RegExp, RegExp, RegExp][]}
   */
  static spParameterTags()
  {
    // the regexes live in this plugin's own table.
    const tags = J.NATURAL.RegExp;

    return [
      [ tags.AggroBuffPlus, tags.AggroBuffRate, tags.AggroGrowthPlus, tags.AggroGrowthRate ],
      [ tags.ParryBuffPlus, tags.ParryBuffRate, tags.ParryGrowthPlus, tags.ParryGrowthRate ],
      [ tags.HealingBuffPlus, tags.HealingBuffRate, tags.HealingGrowthPlus, tags.HealingGrowthRate ],
      [ tags.ItemFxBuffPlus, tags.ItemFxBuffRate, tags.ItemFxGrowthPlus, tags.ItemFxGrowthRate ],
      [
        tags.MagiCostRateBuffPlus,
        tags.MagiCostRateBuffRate,
        tags.MagiCostRateGrowthPlus,
        tags.MagiCostRateGrowthRate,
      ],
      [
        tags.TechCostRateBuffPlus,
        tags.TechCostRateBuffRate,
        tags.TechCostRateGrowthPlus,
        tags.TechCostRateGrowthRate,
      ],
      [ tags.PhysDmgRateBuffPlus, tags.PhysDmgRateBuffRate, tags.PhysDmgRateGrowthPlus, tags.PhysDmgRateGrowthRate ],
      [ tags.MagiDmgRateBuffPlus, tags.MagiDmgRateBuffRate, tags.MagiDmgRateGrowthPlus, tags.MagiDmgRateGrowthRate ],
      [
        tags.FloorDmgRateBuffPlus,
        tags.FloorDmgRateBuffRate,
        tags.FloorDmgRateGrowthPlus,
        tags.FloorDmgRateGrowthRate,
      ],
      [ tags.ExpGainRateBuffPlus, tags.ExpGainRateBuffRate, tags.ExpGainRateGrowthPlus, tags.ExpGainRateGrowthRate ],
    ];
  }
}

export default NaturalParameterRegistration;
//endregion registerNaturalParameters