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

    // policy step inside post initialize.
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
     // policy step inside initialize natural growth.
     */
    this.BaseTpMaxActors = Number(this.parsedPluginParameters['actorBaseTp']);

    // policy step inside initialize natural growth.
    /**
     * The default base max TP for enemies when notetag does not override.
     * @type {number}
     */
    this.BaseTpMaxEnemies = Number(this.parsedPluginParameters['enemyBaseTp']);
  }
}

export default J_NaturalGrowthPluginMetadata;
//endregion plugin metadata
