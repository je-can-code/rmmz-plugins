//region ParameterDefinitionBuilder
import ParameterDefinition from './ParameterDefinition.js';
import ParameterDisplayPolicy from './../core/ParameterDisplayPolicy.js';
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
  #displayPolicy = ParameterDisplayPolicy.NONE;
  #getValue = _battler => 0;
  #sdpBinding = SdpParameterBinding.none();

  /**
   * @param {string} key
   * @returns {ParameterDefinitionBuilder}
   */
  key(key)
  {
    this.#key = key;
    return this;
  }

  /**
   * @param {string} group
   * @returns {ParameterDefinitionBuilder}
   */
  group(group)
  {
    this.#group = group;
    return this;
  }

  /**
   * @param {number} sortOrder
   * @returns {ParameterDefinitionBuilder}
   */
  sortOrder(sortOrder)
  {
    this.#sortOrder = sortOrder;
    return this;
  }

  /**
   * @param {function(): string} label
   * @returns {ParameterDefinitionBuilder}
   */
  label(label)
  {
    this.#label = label;
    return this;
  }

  /**
   * @param {function(): string[]} description
   * @returns {ParameterDefinitionBuilder}
   */
  description(description)
  {
    this.#description = description;
    return this;
  }

  /**
   * @param {function(): number} iconIndex
   * @returns {ParameterDefinitionBuilder}
   */
  iconIndex(iconIndex)
  {
    this.#iconIndex = iconIndex;
    return this;
  }

  /**
   * @param {function(): number} colorIndex
   * @returns {ParameterDefinitionBuilder}
   */
  colorIndex(colorIndex)
  {
    this.#colorIndex = colorIndex;
    return this;
  }

  /**
   * @param {string} format
   * @returns {ParameterDefinitionBuilder}
   */
  format(format)
  {
    this.#format = format;
    return this;
  }

  /**
   * @param {string} displayPolicy
   * @returns {ParameterDefinitionBuilder}
   */
  displayPolicy(displayPolicy)
  {
    this.#displayPolicy = displayPolicy;
    return this;
  }

  /**
   * @param {function(Game_Battler): number} getValue
   * @returns {ParameterDefinitionBuilder}
   */
  getValue(getValue)
  {
    this.#getValue = getValue;
    return this;
  }

  /**
   * @param {SdpParameterBinding} sdpBinding
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
      this.#sortOrder,
      this.#label,
      this.#description,
      this.#iconIndex,
      this.#colorIndex,
      this.#format,
      this.#displayPolicy,
      this.#getValue,
      this.#sdpBinding
    );
  }
}

export default ParameterDefinitionBuilder;
//endregion ParameterDefinitionBuilder