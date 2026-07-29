//region Window_AptitudeList
import AptitudeSkillAggregate from './../_models/AptitudeSkillAggregate.js';

/**
 * The window containing the list of aptitude skill aggregations for an actor.
 */
class Window_AptitudeAggregateList
  extends Window_Command
{
  //region properties
  /**
   * The actor bound to this window.
   * @type {Game_Actor|null}
   */
  _actor = null;

  /**
   * The list of aggregates bound to this window.
   * @type {AptitudeSkillAggregate[]}
   */
  _aggregates = [];

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
    // initialize members.
    this._actor = null;

    // initialize the aggregates bucket.
    this._aggregates = [];
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
    // do nothing if the actor is unchanged.
    if (this._actor === actor) return;

    // update the actor reference.
    this._actor = actor;

    // rebuild the command list.
    // TODO: update this to be handled from the scene.
    this.refresh();
  }

  /**
   * Get the list of aggregates that are bound to this window.
   * @returns {AptitudeSkillAggregate[]}
   */
  aggregates()
  {
    return this._aggregates;
  }

  /**
   * Sets the prebuilt aggregates for rendering.
   * @param {AptitudeSkillAggregate[]} aggregates The list of aggregates to render.
   */
  setAggregates(aggregates)
  {
    // assign and refresh.
    this._aggregates = aggregates || [];

    // rebuild command list.
    this.refresh();
  }

  //endregion accessors

  //region commands
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
    // grab all the aggregates to build commands for.
    const aggregates = this.aggregates();

    // if no aggregates, nothing to render.
    if (aggregates.length === 0) return [];

    // build each command based on the aggregate.
    const commands = aggregates.map(this.buildCommand, this);

    // return the built command set.
    return commands;
  }

  /**
   * Builds a single command for the given aggregate.
   * @param {AptitudeSkillAggregate} aggregate The aggregate to build a command for.
   * @returns {BuiltWindowCommand}
   */
  buildCommand(aggregate)
  {
    // compute right text.
    const learned = aggregate.learnedAny();
    const rightText = learned === true
      ? 'DONE'
      : `${aggregate.currentAp()}/${aggregate.requiredAp()}`;

    // compute right color index.
    let rightColor = 7; // gray default
    if (learned === true)
    {
      rightColor = 11; // green learned
    }
    else if (aggregate.currentAp() > 0)
    {
      rightColor = 6; // yellow in‑progress
    }

    // build the command for this skill.
    const builtWindowCommand = new WindowCommandBuilder(aggregate.name())
      .setSymbol(`skill:${aggregate.skillId()}`)
      .setExtensionData(aggregate)
      .setIconIndex(aggregate.iconIndex())
      .setRightText(rightText)
      .setRightColorIndex(rightColor)
      .setEnabled(learned === false)
      .build();

    // add to list.
    return builtWindowCommand;
  }

  //endregion commands
}

export default Window_AptitudeAggregateList;
//endregion Window_AptitudeList