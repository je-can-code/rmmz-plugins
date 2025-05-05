//region Window_SdpRewardList
class Window_SdpRewardList
  extends Window_Command
{
  /**
   * The list of rewards for the currently-selected panel.
   * @type {PanelRankupReward[]}
   */
  panelRewards = [];

  /**
   * Constructor.
   * @param {Rectangle} rect The rectangle that represents this window.
   */
  constructor(rect)
  {
    super(rect);
  }

  setRewards(rewards)
  {
    this.panelRewards = rewards;
  }

  /**
   * Implements {@link #makeCommandList}.<br>
   * Creates the command list of rewards granted by this SDP.
   */
  makeCommandList()
  {
    // grab all the omnipedia listings available.
    const commands = this.buildCommands();

    // add all the built commands.
    commands.forEach(this.addBuiltCommand, this);
  }

  /**
   * Builds all commands for this command window.
   * Adds all SDP rewards as commands to the list.
   * @returns {BuiltWindowCommand[]}
   */
  buildCommands()
  {
    const commands = [];

    if (!this.panelRewards) return commands;

    this.panelRewards.forEach(panelReward =>
    {
      const {
        rewardName,
        rankRequired
      } = panelReward;

      // determine the icon for the reward..
      let rankText = String.empty;
      let iconIndex = 0;
      switch (rankRequired)
      {
        case -1:
          iconIndex = 75;
          rankText = 'EACH';
          break;
        case 0:
          iconIndex = 73;
          rankText = 'MAX';
          break;
        default:
          iconIndex = 86;
          rankText = rankRequired.padZero(3);
          break;
      }


      // identify the right-aligned current and bonus amounts.
      let parameterData = `Rank: ${rankText}`;

      // construct the command.
      const command = new WindowCommandBuilder(rewardName)
        .setSymbol(rewardName)
        .setIconIndex(iconIndex)
        .setRightText(parameterData)
        .setExtensionData(panelReward)
        .build();

      commands.push(command);
    });

    return commands;
  }
}

//endregion Window_SdpRewardList