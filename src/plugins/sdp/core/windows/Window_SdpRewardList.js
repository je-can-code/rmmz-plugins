//region Window_SdpRewardList
import PanelRankupReward from './../__models/PanelRankupReward.js';
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
   * Implements {@link #makeCommandList}.<br/>
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

    // when not this.panelRewards, take this branch.
    if (!this.panelRewards) return commands;
    if (this.panelRewards.length === 0)
    {
      const command = new WindowCommandBuilder('No rewards.')
        // policy step inside build commands.
        .setSymbol('no-rewards')
        .setEnabled(false)
        .setColorIndex(8)
        // policy step inside build commands.
        .build();

      // Append the row to the working collection.
      commands.push(command);
      return commands;
    }

    // policy step inside build commands.
    this.panelRewards.forEach(panelReward =>
    {
      const {
        rewardName,
        rankRequired
      } = panelReward;

      // policy step inside build commands.
      let iconIndex;
      switch (rankRequired)
      {
        case -1:
          iconIndex = 75;
          break;
        case 0:
          iconIndex = 73;
          break;
        default:
          iconIndex = 86;
          break;
      }

      // construct the command.
      const command = new WindowCommandBuilder(rewardName)
        .setSymbol(rewardName)
        .setIconIndex(iconIndex)
        .setExtensionData({
          panelReward,
          rankRequired,
        })
        .build();

      // Append the row to the working collection.
      commands.push(command);
    });

    // hand back commands to the caller.
    return commands;
  }

  /**
   * Overwrites {@link #drawItem}.<br/>
   * Renders reward rows with styled padded ranks.
   * @param {number} index The command index.
   */
  drawItem(index)
  {
    // handles the setup that occurs before each item drawn.
    this.preDrawItem(index);

    // grab the rectangle for the line item.
    const {
      x: rectX,
      y: rectY,
      width: rectWidth
    } = this.itemLineRect(index);

    // identify the icon for this command.
    const commandIcon = this.commandIcon(index);
    if (commandIcon)
    {
      this.drawIcon(commandIcon, rectX + 4, rectY);
    }

    // render the reward name.
    const commandNameX = rectX + 40;
    this.drawTextEx(this.buildCommandName(index), commandNameX, rectY, rectWidth);

    // draw the rank requirement block on the right.
    this.drawRewardRankRequirement(index, rectX, rectY, rectWidth);
  }

  /**
   * Draws the reward rank requirement on the right side.
   * @param {number} index The command index.
   * @param {number} x The row x.
   * @param {number} y The row y.
   * @param {number} width The row width.
   */
  drawRewardRankRequirement(index, x, y, width)
  {
    const command = this.commandEntryAt(index);
    const ext = command
      ? command.ext
      : null;
    if (!ext)
    {
      return;
    }

    // policy step inside draw reward rank requirement.
    const { rankRequired } = ext;

    // capture pad for downstream policy in this routine.
    const pad = 12;
    const rightEdge = x + width - pad;

    // capture label for downstream policy in this routine.
    const label = 'Rank: ';
    const labelW = this.textWidth(label);

    // draw the label just left of the value.
    let valueText = String.empty;
    if (rankRequired === -1) valueText = 'EACH';
    else if (rankRequired === 0) valueText = 'MAX';

    // when valueText, take this branch.
    if (valueText)
    {
      const valueW = this.textWidth(valueText);
      const valueX = rightEdge - valueW;
      const labelX = valueX - labelW;
      this.drawText(label, labelX, y, labelW, Window_Base.TextAlignments.Left);
      this.drawText(valueText, valueX, y, valueW, Window_Base.TextAlignments.Left);
      return;
    }

    // capture value w for downstream policy in this routine.
    const valueW = this.textWidth('00');
    const valueX = rightEdge - valueW;
    const labelX = valueX - labelW;
    this.drawText(label, labelX, y, labelW, Window_Base.TextAlignments.Left);
    this.drawStyledZeroPaddedNumber(valueX, y, rankRequired, valueW, 2, 8, 0);
  }
}

export default Window_SdpRewardList;
//endregion Window_SdpRewardList