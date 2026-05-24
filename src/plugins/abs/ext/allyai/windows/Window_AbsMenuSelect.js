//region Window_AbsMenuSelect
import JABS_AllyAI from './../_models/JABS_AllyAI.js';

/**
 * Extends {@link Window_AbsMenuSelect#initialize}.<br/>
 * Also initializes the ally AI members.
 */
J.ABS.EXT.ALLYAI.Aliased.Window_AbsMenuSelect.set('initialize', Window_AbsMenuSelect.prototype.initialize);
Window_AbsMenuSelect.prototype.initialize = function(rect, type)
{
  // perform original logic.
  J.ABS.EXT.ALLYAI.Aliased.Window_AbsMenuSelect.get('initialize')
    .call(this, rect, type);

  // initialize ally AI-specific members.
  this.initJabsAllyAiMenuMembers();
};

/**
 * Initializes the ally AI members for this window.
 */
Window_AbsMenuSelect.prototype.initJabsAllyAiMenuMembers = function()
{
  /**
   * The actor id of the ally currently being managed via this window.
   * @type {number}
   */
  this._j._chosenActorId = 0;
};

/**
 * Sets the actor id assigned to this window.
 * @param {number} actorId The new actor id for this window.
 */
Window_AbsMenuSelect.prototype.setActorId = function(actorId)
{
  this._j._chosenActorId = actorId;
};

/**
 * Gets the actor id assigned to this window, if any.
 * @returns {number}
 */
Window_AbsMenuSelect.prototype.getActorId = function()
{
  return this._j._chosenActorId;
};

/**
 * Extends the JABS quick menu select to also handle ai management.
 */
J.ABS.EXT.ALLYAI.Aliased.Window_AbsMenuSelect.set('makeCommandList', Window_AbsMenuSelect.prototype.makeCommandList);
Window_AbsMenuSelect.prototype.makeCommandList = function()
{
  // perform original logic.
  J.ABS.EXT.ALLYAI.Aliased.Window_AbsMenuSelect.get('makeCommandList')
    .call(this);

  // pivot on the menu type.
  switch (this._j._menuType)
  {
    case "ai-party-list":
      this.addAggroPassiveToggleCommand();
      this.makeAllyList();
      this.addAllyFormationCommand();
      break;
    case "select-ai":
      this.makeAllyAiDoNothingToggle();
      this.makeAllyAiPresetList();
      break;
  }
};

/**
 * Draws the list of available AI modes that an ally can use.
 */
Window_AbsMenuSelect.prototype.makeAllyList = function()
{
  // an iterator function for building all the actor commands for changing ally AI.
  const forEacher = member =>
  {
    // build the command for this member of the party.
    const command = new WindowCommandBuilder(member.name())
      .setSymbol("party-member")
      .setExtensionData(member.actorId())
      .build();

    // add the built command to the list.
    this.addBuiltCommand(command);
  };

  // build all the commands.
  $gameParty.allMembers()
    .forEach(forEacher, this);
};

/**
 * Injects the aggro-passive toggle command into the menu.
 */
Window_AbsMenuSelect.prototype.addAggroPassiveToggleCommand = function()
{
  // define the icons for passive/aggressive ally AI aggro settings.
  const aggroPassiveCommandName = $gameParty.isAggro()
    ? J.ABS.EXT.ALLYAI.Metadata.PartyAiAggressiveText
    : J.ABS.EXT.ALLYAI.Metadata.PartyAiPassiveText;
  const aggroPassiveCommandIcon = $gameParty.isAggro()
    ? J.ABS.EXT.ALLYAI.Metadata.PartyAiAggressiveIconIndex
    : J.ABS.EXT.ALLYAI.Metadata.PartyAiPassiveIconIndex;

  const description = $gameParty.isAggro()
    ? "The party is currently 'aggro'.\nAllies will engage in any enemy that comes within their range."
    : "The party is currently 'passive'.\nAllies will not engage until the leader strikes or is struck.";

  const textColor = $gameParty.isAggro()
    ? 2
    : 3;

  // build the command for toggling ally AI aggro.
  const command = new WindowCommandBuilder(aggroPassiveCommandName)
    .setSymbol("aggro-passive-toggle")
    .setTextLines(description.split(/[\r\n]/i))
    .flagAsSubText()
    .setColorIndex(textColor)
    .setIconIndex(aggroPassiveCommandIcon)
    .build();

  // add the aggro toggle command.
  this.addBuiltCommand(command);
};

/**
 * Injects the party formations command into the menu.
 */
Window_AbsMenuSelect.prototype.addAllyFormationCommand = function()
{
  const allyFormationsCommand = new WindowCommandBuilder(J.ABS.EXT.ALLYAI.Metadata.AllyFormationsCommandName)
    .setSymbol('ally-formations')
    .setIconIndex(J.ABS.EXT.ALLYAI.Metadata.AllyFormationsCommandIconIndex)
    .setColorIndex(23)
    .build();

  // add the aggro toggle command.
  this.addBuiltCommand(allyFormationsCommand);
};

/**
 * Adds a do-nothing toggle command at the top of the ally AI selection window.
 * Mirrors the aggro/passive toggle pattern from the party list window.
 */
Window_AbsMenuSelect.prototype.makeAllyAiDoNothingToggle = function()
{
  const currentActor = $gameActors.actor(this.getActorId());
  if (!currentActor) return;

  const allyAI = currentActor.getAllyAI();
  const isDoNothing = allyAI.isDoNothing();

  const commandName = isDoNothing
    ? 'Do Nothing: ON'
    : 'Do Nothing: OFF';

  const description = isDoNothing
    ? 'This ally hangs back and takes no actions.\nToggle off to restore their preset behavior.'
    : 'This ally acts according to their preset.\nToggle on to make them stand down entirely.';

  const colorIndex = isDoNothing ? 3 : 2;

  const iconIndex = isDoNothing
    ? J.ABS.EXT.ALLYAI.Metadata.PartyAiPassiveIconIndex
    : J.ABS.EXT.ALLYAI.Metadata.PartyAiAggressiveIconIndex;

  const command = new WindowCommandBuilder(commandName)
    .setSymbol('do-nothing-toggle')
    .setTextLines(description.split(/[\r\n]/i))
    .flagAsSubText()
    .setColorIndex(colorIndex)
    .setIconIndex(iconIndex)
    .build();

  this.addBuiltCommand(command);
};

/**
 * Draws the list of available AI presets that an ally can use.
 */
Window_AbsMenuSelect.prototype.makeAllyAiPresetList = function()
{
  const currentActor = $gameActors.actor(this.getActorId());
  if (!currentActor) return;

  const presets = JABS_AllyAI.getPresets();
  const currentAi = currentActor.getAllyAI();

  const forEacher = preset =>
  {
    const { key, name, description } = preset;

    const isEquipped = currentAi.getPresetKey() === key;

    const iconIndex = isEquipped
      ? J.ABS.EXT.ALLYAI.Metadata.AiModeEquippedIconIndex
      : J.ABS.EXT.ALLYAI.Metadata.AiModeNotEquippedIconIndex;

    const command = new WindowCommandBuilder(name)
      .setSymbol('select-ai')
      .setTextLines(description.split(/[\r\n]/i))
      .flagAsSubText()
      .setIconIndex(iconIndex)
      .setEnabled(true)
      .setExtensionData(preset)
      .build();

    this.addBuiltCommand(command);
  };

  presets.forEach(forEacher, this);
};

/**
 * Overwrites {@link #itemHeight}.<br/>
 * Increases the height so subtext can be added.
 * @returns {number}
 */
Window_AbsMenuSelect.prototype.itemHeight = function()
{
  return this.lineHeight() * 2;
};
//endregion Window_AbsMenuSelect