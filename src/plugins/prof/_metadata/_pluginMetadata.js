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
          requirement.secondarySkillIds));

      return new ProficiencyConditional(
        conditional.key,
        conditional.actorIds,
        requirements,
        conditional.skillRewards,
        conditional.jsRewards);
    });
  }

  /**
   * Constructor.
   */
  constructor(name, version)
  {
    super(name, version);
  }

  postInitialize()
  {
    super.postInitialize();

    this.initializeProficiencies();
  }

  initializeProficiencies()
  {
    const parsedConditionals = JSON.parse(StorageManager.fsReadFile(J_ProficiencyPluginMetadata.CONFIG_PATH));
    if (parsedConditionals === null)
    {
      console.error('no proficiency configuration was found in the /data directory of the project.');
      console.error('Consider adding configuration using the J-MZ data editor, or hand-writing one.');
      throw new Error('Proficiency plugin is being used, but no config file is present.');
    }

    const classifiedConditionalData = J_ProficiencyPluginMetadata.classifyConditionals(parsedConditionals);

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

    console.log(`loaded:
      - ${this.conditionals.length} proficiency conditionals
      from file ${J_ProficiencyPluginMetadata.CONFIG_PATH}.`);
  }
}

//endregion plugin metadata