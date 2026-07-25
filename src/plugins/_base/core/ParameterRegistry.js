//region ParameterRegistry
import ParameterGroups from './ParameterGroups.js';
import ParameterDefinition from './../models/ParameterDefinition.js';

/**
 * Central registry of {@link ParameterDefinition} entries keyed by string id.
 */
class ParameterRegistry
{
  /**
   * @type {Map<string, ParameterDefinition>}
   */
  static _definitions = new Map();

  /**
   * @type {Map<string, ParameterDefinition[]>}
   */
  static _groupCache = new Map();

  /**
   * Registers a parameter definition. Duplicate keys throw.
   * @param {ParameterDefinition} definition The definition driving this step.
   */
  static register(definition)
  {
    if (!(definition instanceof ParameterDefinition))
    {
      throw new Error('ParameterRegistry.register requires a ParameterDefinition instance.');
    }

    if (this._definitions.has(definition.key))
    {
      throw new Error(`ParameterRegistry: duplicate key "${definition.key}".`);
    }

    // Register the value on the alias map for runtime lookup.
    this._definitions.set(definition.key, definition);
    this._groupCache.clear();
  }

  /**
   * @param {string} key The key driving this step.
   * @returns {ParameterDefinition|null}
   */
  static get(key)
  {
    if (this._definitions.has(key))
    {
      return this._definitions.get(key);
    }

    return null;
  }

  /**
   * @param {string} key The key driving this step.
   * @returns {boolean}
   */
  static has(key)
  {
    return this._definitions.has(key);
  }

  /**
   * @returns {ParameterDefinition[]}
   */
  static all()
  {
    return [ ...this._definitions.values() ];
  }

  /**
   * @param {string} group The group driving this step.
   * @returns {ParameterDefinition[]}
   */
  static byGroup(group)
  {
    if (this._groupCache.has(group))
    {
      return this._groupCache.get(group);
    }

    const definitions = this.all()
      .filter(definition => definition.group === group)
      .sort((left, right) => left.sortOrder - right.sortOrder);

    // Register the value on the alias map for runtime lookup.
    this._groupCache.set(group, definitions);

    return definitions;
  }

  /**
   * Resolves a live battler value for the given parameter key.
   * @param {Game_Battler} battler The battler driving this step.
   * @param {string} key The key driving this step.
   * @returns {number}
   */
  static resolveValue(battler, key)
  {
    const definition = this.get(key);

    if (!definition) return 0;

    return definition.resolveValue(battler);
  }

  /**
   * Resolves SDP panel bonus for the given key.
   * @param {Game_Actor} actor The actor driving this step.
   * @param {string} key The key driving this step.
   * @returns {number}
   */
  static resolveSdpPanelBonus(actor, key)
  {
    const definition = this.get(key);

    if (!definition) return 0;

    const base = definition.sdpBinding.getBaseForSdp
      ? definition.sdpBinding.getBaseForSdp(actor)
      : definition.resolveValue(actor);

    return definition.sdpBinding.getPanelBonus(actor, base);
  }
}

export default ParameterRegistry;
//endregion ParameterRegistry