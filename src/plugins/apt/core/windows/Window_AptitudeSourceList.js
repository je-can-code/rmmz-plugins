//region Window_AptitudeSourceList
/**
 * A window listing all aptitude sources currently applied to the actor.
 */
class Window_AptitudeSourceList
  extends Window_Command
{
  //region properties
  /**
   * The actor bound to this window.
   * @type {Game_Actor|null}
   */
  _actor = null;

  /**
   * The list of sources bound to this window.
   * @type {(RPG_Actor|RPG_Class|RPG_EquipItem|RPG_Weapon|RPG_Armor|RPG_Skill|RPG_State)[]}
   */
  _sources = [];

  //endregion properties

  //region init
  constructor(rect)
  {
    // call parent ctor.
    super(rect);

    // initialize members.
    this.initMembers();
  }

  /**
   * Initializes the members of this window.
   */
  initMembers()
  {
    // initialize the actor.
    this._actor = null;

    // initialize the sources bucket.
    this._sources = [];
  }

  //endregion init

  //region accessors
  /**
   * Gets the actor that is bound to this window.
   * @returns {Game_Actor|null}
   */
  actor()
  {
    return this._actor;
  }

  /**
   * Sets the actor for this window.
   * @param {Game_Actor} actor The actor to bind.
   */
  setActor(actor)
  {
    this._actor = actor;
  }

  /**
   * The
   * @returns {(RPG_Actor|RPG_Class|RPG_EquipItem|RPG_Weapon|RPG_Armor|RPG_Skill|RPG_State)[]}
   */
  sources()
  {
    return this._sources || [];
  }

  /**
   * Sets the sources for this window.
   * @param {(RPG_Actor|RPG_Class|RPG_EquipItem|RPG_Weapon|RPG_Armor|RPG_Skill|RPG_State)[]} sources The new sources.
   */
  setSources(sources)
  {
    // assign the sources.
    this._sources = sources;

    // rebuild the command list with the new data.
    this.refresh();
  }

  //endregion accessors

  /**
   * Rebuilds the command list for the current actor.
   */
  makeCommandList()
  {
    // if we don’t have an actor, there is nothing to build.
    if (this.actor() === null) return;

    // build all commands for this window.
    const commands = this.buildCommands();

    // add all built commands to this window.
    commands.forEach(this.addBuiltCommand, this);
  }

  /**
   * Builds all commands for this command window.
   * @returns {BuiltWindowCommand[]}
   */
  buildCommands()
  {
    // grab all the sources to build commands for.
    const sources = this.sources();

    // if no sources, nothing to render.
    if (sources.length === 0) return [];

    // build each command based on the source.
    const commands = sources.map(this.buildCommand, this);

    // return the built command set.
    return commands;
  }

  /**
   * Builds a single command for the given source.
   * @param {RPG_Actor|RPG_Class|RPG_EquipItem|RPG_Weapon|RPG_Armor|RPG_Skill|RPG_State} source The source.
   * @returns {BuiltWindowCommand}
   */
  buildCommand(source)
  {
    let { iconIndex } = source;

    // actors don't normally have an icon index, so lets give em one.
    if (source.isActor())
    {
      iconIndex = 2727;
    }
    // classes also don't normally have an icon index, so lets give em one.
    else if (source.isClass())
    {
      iconIndex = 2694;
    }

    // construct built window command for the next step in this routine.
    const builtWindowCommand = new WindowCommandBuilder(source.name)
      .setSymbol(`source:${source.implementationType()}`)
      .setExtensionData(source)
      .setIconIndex(iconIndex)
      .build();

    return builtWindowCommand;
  }
}

export default Window_AptitudeSourceList;
//endregion Window_AptitudeSourceList