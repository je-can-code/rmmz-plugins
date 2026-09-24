//region FramedTarget
import FramedTargetConfiguration from './FramedTargetConfiguration.js';
/**
 * The shape of a target for the target frame.
 */
class FramedTarget
{
  /**
   * The name of the target.
   * @type {string|String.empty}
   */
  name = String.empty;

  /**
   * The additional text of the target.
   * @type {string|String.empty}
   */
  text = String.empty;

  /**
   * The icon to place on the target.
   * @type {number}
   */
  icon = 0;

  /**
   * Icons an extension wants shown ahead of the target's name, drawn after {@link #icon}.<br/>
   * Held apart from {@link #name} so the frame decides where they go- and what goes between them and the
   * name- rather than finding them baked into the name's text.
   * @type {number[]}
   */
  nameIconIndices = [];

  /**
   * The battler data of the target.
   * @type {Game_Enemy|null}
   */
  battler = null;

  /**
   * The configuration of this target.
   * @type {FramedTargetConfiguration|null}
   */
  configuration = null;

  /**
   * Optional `#RRGGBB` for the name row; a passive extension may set this so the HUD tints the target name.
   * Empty means use the window default text color.
   * @type {string|String.empty}
   */
  nameColorHex = String.empty;

  /**
   * Constructor.
   * @param {string} name The name of the target.
   * @param {string=} text The additional text for the target; defaults to an empty string.
   * @param {number=} icon The icon to place on this target; defaults to 0.
   * @param {Game_Enemy=} battler The battler data of the target; defaults to null.
   * @param {FramedTargetConfiguration=} configuration The configuration of this target; defaults to null.
   * @param {string=} nameColorHex Optional hex tint for {@link #drawTargetName}; defaults to empty (no override).
   */
  constructor(name, text = String.empty, icon = 0, battler = null, configuration = null, nameColorHex = String.empty)
  {
    this.name = name;
    this.text = text;
    this.icon = icon;
    // assign battler on this instance for callers.
    this.battler = battler;
    this.configuration = configuration;
    this.nameColorHex = nameColorHex;
  }
}

export default FramedTarget;
//endregion FramedTarget