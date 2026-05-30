//region ParameterDefinitionBuilder
import ParameterDefinition from './ParameterDefinition.js';
import ParameterFormat from './../core/ParameterFormat.js';
import SdpParameterBinding from './SdpParameterBinding.js';

/**
 * Fluent builder for {@link ParameterDefinition}.
 */
class ParameterDefinitionBuilder
{
  #key = String.empty;
  #group = String.empty;
  #sortOrder = 0;
  #label = () => String.empty;
  #description = () => [ String.empty ];
  #iconIndex = () => 0;
  #colorIndex = () => 0;
  #format = ParameterFormat.FLAT;
  #getValue = _battler => 0;
  #sdpBinding = SdpParameterBinding.none();

  /**
   * @param {string} key The key driving this step.
   * @returns {ParameterDefinitionBuilder}
   */
  key(key)
  {
    this.#key = key;
    return this;
  }

  /**
   * @param {string} group The group driving this step.
   * @returns {ParameterDefinitionBuilder}
   */
  group(group)
  {
    this.#group = group;
    return this;
  }

  /**
   * @param {number} sortOrder The sort order driving this step.
   * @returns {ParameterDefinitionBuilder}
   */
  sortOrder(sortOrder)
  {
    this.#sortOrder = sortOrder;
    return this;
  }

  /**
   * @param {function(): string} label The label driving this step.
   * @returns {ParameterDefinitionBuilder}
   */
  label(label)
  {
    this.#label = label;
    return this;
  }

  /**
   * @param {function(): string[]} description The description driving this step.
   * @returns {ParameterDefinitionBuilder}
   */
  description(description)
  {
    this.#description = description;
    return this;
  }

  /**
   * @param {function(): number} iconIndex The icon index driving this step.
   * @returns {ParameterDefinitionBuilder}
   */
  iconIndex(iconIndex)
  {
    this.#iconIndex = iconIndex;
    return this;
  }

  /**
   * @param {function(): number} colorIndex The color index driving this step.
   * @returns {ParameterDefinitionBuilder}
   */
  colorIndex(colorIndex)
  {
    this.#colorIndex = colorIndex;
    return this;
  }

  /**
   * @param {string} format The format driving this step.
   * @returns {ParameterDefinitionBuilder}
   */
  format(format)
  {
    this.#format = format;
    return this;
  }

  /**
   * @param {function(Game_Battler): number} getValue The get value driving this step.
   * @returns {ParameterDefinitionBuilder}
   */
  getValue(getValue)
  {
    this.#getValue = getValue;
    return this;
  }

  /**
   * @param {SdpParameterBinding} sdpBinding The sdp binding driving this step.
   * @returns {ParameterDefinitionBuilder}
   */
  sdpBinding(sdpBinding)
  {
    this.#sdpBinding = sdpBinding;
    return this;
  }

  /**
   * @returns {ParameterDefinition}
   */
  build()
  {
    return new ParameterDefinition(
      this.#key,
      this.#group,
      // policy step inside build.
      this.#sortOrder,
      this.#label,
      this.#description,
      // policy step inside build.
      this.#iconIndex,
      this.#colorIndex,
      this.#format,
      // policy step inside build.
      this.#getValue,
      this.#sdpBinding
    );
  }
}

export default ParameterDefinitionBuilder;
//endregion ParameterDefinitionBuilder