//region plugin metadata
class J_NaturalGrowthPluginMetadata
  extends PluginMetadata
{
  /**
   * Constructor.
   */
  constructor(name, version)
  {
    super(name, version);
  }

  /**
   * Extends {@link #postInitialize}.<br/>
   * Maps plugin parameters into instance fields used by battler TP logic.
   */
  postInitialize()
  {
    super.postInitialize();

    this.initializeNaturalGrowth();
  }

  /**
   * Initializes the metadata associated with this plugin from plugin parameters.
   */
  initializeNaturalGrowth()
  {
    /**
     * The default base max TP for actors when notetag does not override.
     * @type {number}
     */
    this.BaseTpMaxActors = Number(this.parsedPluginParameters['actorBaseTp']);

    /**
     * The default base max TP for enemies when notetag does not override.
     * @type {number}
     */
    this.BaseTpMaxEnemies = Number(this.parsedPluginParameters['enemyBaseTp']);
  }
}

export default J_NaturalGrowthPluginMetadata;
//endregion plugin metadata
