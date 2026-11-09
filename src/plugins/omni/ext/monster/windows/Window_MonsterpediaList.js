//region Window_MonsterpediaList
import MonsterpediaTypes from '../managers/MonsterpediaTypes.js';

/**
 * A window listing every entry on whichever page of the monsterpedia is open, one row per enemy.
 */
class Window_MonsterpediaList
  extends Window_Command
{
  /**
   * Constructor.
   * @param {Rectangle} rect The rectangle that represents this window.
   */
  constructor(rect)
  {
    // perform original logic, which seeds this window's members before building the list.
    super(rect);
  }

  /**
   * Implements {@link Window_Command.initMembers}.<br/>
   * Initializes the members of this window.
   *
   * This cannot be a class field declaration: JavaScript applies those only after `super()` returns,
   * by which point the command list has already been built from it and found it undefined.
   */
  initMembers()
  {
    /**
     * The kind of entry this list shows, which is the page of the monsterpedia that is open. Empty until
     * the scene points the list at a page, which lists nothing.
     * @type {string}
     */
    this._currentTypeKey = String.empty;
  }

  /**
   * Gets the kind of entry this list is showing.
   * @returns {string}
   */
  getCurrentTypeKey()
  {
    return this._currentTypeKey;
  }

  /**
   * Sets the kind of entry this list shows.
   * @param {string} typeKey The key of the page to show.
   */
  setCurrentTypeKey(typeKey)
  {
    this._currentTypeKey = typeKey;
  }

  /**
   * Implements {@link #makeCommandList}.<br/>
   * Creates the command list of every entry on the open page.
   */
  makeCommandList()
  {
    // grab all the omnipedia listings available.
    const commands = this.buildCommands();

    // build all the commands.
    commands.forEach(this.addBuiltCommand, this);
  }

  /**
   * Builds all commands for this command window, one per entry on the open page.
   * Which rows those are is {@link MonsterpediaTypes}' call, not this window's.
   * @returns {BuiltWindowCommand[]}
   */
  buildCommands()
  {
    // the rows listed on the open page.
    const enemies = MonsterpediaTypes.entriesFor(this.getCurrentTypeKey());

    // one command per row.
    return enemies.map(this.buildCommand, this);
  }

  /**
   * Builds a {@link BuiltWindowCommand} based on the enemy data.
   * @param {RPG_Enemy} enemy The enemy database data.
   * @returns {BuiltWindowCommand} The built command based on this enemy.
   */
  buildCommand(enemy)
  {
    // deconstruct data points out for building the list.
    const {
      id,
      name
    } = enemy;

    // grab the observations associated with this enemy id.
    const observations = $gameParty.getOrCreateMonsterpediaObservationsById(id);

    // default the name to the enemy's name.
    let enemyName = name;

    // validate the player knows the name of this monster.
    if (!observations.knowsName)
    {
      // mask the name if it isn't known.
      enemyName = J.BASE.Helpers.maskString(enemyName);
    }

    let enemyMonsterFamilyIconIndex = enemy.monsterFamilyIcon;

    // check if the player doesn't know the family, or has never defeated the monster.
    if (!observations.knowsFamily || observations.numberDefeated === 0)
    {
      // TODO: parameterize this.
      // the icon is a question mark.
      enemyMonsterFamilyIconIndex = 93;
    }

    // build a command based on the enemy.
    return new WindowCommandBuilder(enemyName)
      .setSymbol(`${id}-${name}`)
      .setExtensionData(observations)
      .setIconIndex(enemyMonsterFamilyIconIndex)
      .build();
  }
}

export default Window_MonsterpediaList;
//endregion Window_MonsterpediaList