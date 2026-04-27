//region plugin metadata
class J_ProficiencyPluginMetadata
  extends PluginMetadata
{
  /**
   * The path where the external configuration file is located relative to the root of the project.
   * @type {string}
   */
  static CONFIG_PATH = 'data/config.proficiency.json';

  /**
   * Maps all the raw proficiency conditional data
   * @param {any} parsedBlob The JSON.parse()'d data blob of the config.
   * @returns {ProficiencyConditional[]}
   */
  static classifyConditionals(parsedBlob)
  {
    return parsedBlob.conditionals.map(conditional =>
    {
      const requirements = conditional.requirements
        .map(requirement => new ProficiencyRequirement(
          requirement.skillId,
          requirement.proficiency,
          requirement.secondarySkillIds
        ));

      return new ProficiencyConditional(
        conditional.key,
        conditional.actorIds,
        requirements,
        conditional.skillRewards,
        conditional.jsRewards
      );
    });
  }

  /**
   * Constructor.
   */
  constructor(name, version)
  {
    super(name, version);
  }

  /**
   * Initializes the proficiencies from database and external data.
   */
  initializeProficiencies()
  {
    const classifiedConditionalData = ExternalJsonConfigLoader.load(
      J_ProficiencyPluginMetadata.CONFIG_PATH,
      ExternalJsonConfigLoaderOptions.Builder()
        .pluginName('J-Proficiency')
        .configName('proficiency configuration')
        .mapper(J_ProficiencyPluginMetadata.classifyConditionals.bind(J_ProficiencyPluginMetadata))
        .logSummary(result => [ `- ${result.length} proficiency conditionals` ])
        .build()
    );

    /**
     * The collection of all defined skill proficiencies.
     * @type {ProficiencyConditional[]}
     */
    this.conditionals = classifiedConditionalData;

    /**
     * A map of actorId:conditional[] for more easily accessing all conditionals associated with a given actor.
     * @type {Map<number, ProficiencyConditional[]>}
     */
    this.actorConditionalsMap = new Map();

    // iterate over the actors to initialize their conditional maps.
    $dataActors.filter(actor => !!actor)
      .forEach(actor => this.actorConditionalsMap.set(actor.id, Array.empty));

    // iterate over the identified conditionals.
    this.conditionals.forEach(conditional =>
    {
      // iterate over each conditional's actorId.
      conditional.actorIds.forEach(actorId =>
      {
        // add the conditional to the actor's map.
        const data = this.actorConditionalsMap.get(actorId);
        data.push(conditional);
      });
    });
  }
}

//endregion plugin metadata