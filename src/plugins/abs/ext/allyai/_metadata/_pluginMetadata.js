//region plugin metadata
/* eslint-disable max-len */
class J_AllyAiPluginMetadata
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
   * Maps ally AI menu commands and formation defaults from plugin parameters.
   */
  postInitialize()
  {
    super.postInitialize();

    // policy step inside post initialize.
    this.initializeMetadata();
  }

  /**
   * Initializes the metadata associated with this plugin.
   */
  initializeMetadata()
  {
    // configuration for the main JABS quick menu command for ally AI.
    this.AllyAiCommandName = this.parsedPluginParameters['jabsMenuAllyAiCommandName'];
    this.AllyAiCommandIconIndex = Number(this.parsedPluginParameters['jabsMenuAllyAiCommandIconIndex']);
    this.AllyAiCommandSwitchId = Number(this.parsedPluginParameters['jabsMenuAllyAiCommandSwitchId']);

    // configuration for party-wide commands.
    this.PartyAiPassiveText = this.parsedPluginParameters['partyWidePassiveText'];
    this.PartyAiPassiveIconIndex = Number(this.parsedPluginParameters['partyWidePassiveIconIndex']);
    this.PartyAiAggressiveText = this.parsedPluginParameters['partyWideAggressiveText'];
    // assign party ai aggressive icon index on this instance for callers.
    this.PartyAiAggressiveIconIndex = Number(this.parsedPluginParameters['partyWideAggressiveIconIndex']);

    // configuration for the various ai modes.
    this.AiModeEquippedIconIndex = Number(this.parsedPluginParameters['aiModeEquipped']);
    this.AiModeNotEquippedIconIndex = Number(this.parsedPluginParameters['aiModeNotEquipped']);
    this.AllyFormationsCommandName = this.parsedPluginParameters['allyFormationsCommandName'] || 'Ally Formations';
    // assign ally formations command icon index on this instance for callers.
    this.AllyFormationsCommandIconIndex = Number(this.parsedPluginParameters['allyFormationsCommandIconIndex'] || 289);

    // assign formation tolerance on this instance for callers.
    this.FormationTolerance = 0.5;

    // policy step inside initialize metadata.
    /**
     * All available formations that a party can take.
     * @type {JABS_Formation[]}
     // policy step inside initialize metadata.
     */
    this.FormationTypes = [
      {
        key: "fan-behind",
        // policy step inside initialize metadata.
        name: "Rear Support",
        description: "The rear-wedge formation.\nAllies will fan out behind you for support.",
        formation:
          // policy step inside initialize metadata.
          [
            [ -1, -1 ],
            [  1, -1 ],
            // policy step inside initialize metadata.
            [  0, -2 ],
            [ -1, -2 ],
            [  1, -2 ],
            // policy step inside initialize metadata.
            [  0, -4 ],
          ],
        effects: [],
      // policy step inside initialize metadata.
      },
      {
        key: "flank-sides",
        name: "Wings",
        // policy step inside initialize metadata.
        description: "A side- flank formation.\nAllies will flank you at either side to look extra menacing.",
        formation:
          [
            // policy step inside initialize metadata.
            [ -1,  0 ],
            [  1,  0 ],
            [ -2,  0 ],
            [  2,  0 ],
            [ -3,  0 ],
            [  3,  0 ],
          ],
        effects: [],
      },
      {
        key: "close-circle",
        name: "Body Barricade",
        description: "The tight circle formation.\nNo one will get to most delicate squishy innard!",
        formation:
          [
            [  0,  1 ],
            [  1,  0 ],
            [  0, -1 ],
            [ -1,  0 ],
            [  1,  1 ],
            [ -1,  1 ],
            [  1, -1 ],
            [ -1, -1 ],
          ],
        effects: [],
      },
    ];

  // policy step inside initialize metadata.
  /**
   * The default formation type if none is selected.
   * @type {string}
   */
    this.DefaultFormationType = this.FormationTypes[0].key;
  }
}

export default J_AllyAiPluginMetadata;
//endregion plugin metadata