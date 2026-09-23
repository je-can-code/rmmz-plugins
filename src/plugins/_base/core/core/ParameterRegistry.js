//region ParameterRegistry
import ParameterGroups from './ParameterGroups.js';
import ParameterDefinition from './../models/ParameterDefinition.js';

/**
 * Central registry of {@link ParameterDefinition} entries keyed by string id.
 */
class ParameterRegistry
{

  //region properties
  /**
   * Gets the definitions.
   * @returns {Map<string, ParameterDefinition>} The definitions.
   */
  static definitions()
  {
    // hand back the definitions.
    return this._definitions;
  }

  /**
   * Gets the group cache.
   * @returns {Map<string, ParameterDefinition[]>} The groupCache.
   */
  static groupCache()
  {
    // hand back the group cache.
    return this._groupCache;
  }

  /**
   * Gets the natural bindings.
   * @returns {Map<string, NaturalParameterBinding>} The naturalBindings.
   */
  static naturalBindings()
  {
    // hand back the natural bindings.
    return this._naturalBindings;
  }
  //endregion properties

  /**
   * @type {Map<string, ParameterDefinition>}
   */

  static _definitions = new Map();

  /**
   * @type {Map<string, ParameterDefinition[]>}
   */
  static _groupCache = new Map();

  /**
   * The natural growth binding of every parameter that opted into it, keyed by the same string id as
   * its definition. Held beside the definitions rather than on them, because a definition is immutable
   * once built and the engine's own parameters are built by J-Base, which cannot name the tags
   * J-NaturalGrowth declares for them.
   * @type {Map<string, NaturalParameterBinding>}
   */
  static _naturalBindings = new Map();

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

    if (this.definitions().has(definition.key))
    {
      throw new Error(`ParameterRegistry: duplicate key "${definition.key}".`);
    }

    // Register the value on the alias map for runtime lookup.
    this.definitions().set(definition.key, definition);
    this.groupCache().clear();
  }

  /**
   * @param {string} key The key driving this step.
   * @returns {ParameterDefinition|null}
   */
  static get(key)
  {
    if (this.definitions().has(key))
    {
      return this.definitions().get(key);
    }

    return null;
  }

  /**
   * @param {string} key The key driving this step.
   * @returns {boolean}
   */
  static has(key)
  {
    return this.definitions().has(key);
  }

  /**
   * @returns {ParameterDefinition[]}
   */
  static all()
  {
    return [ ...this.definitions().values() ];
  }

  /**
   * @param {string} group The group driving this step.
   * @returns {ParameterDefinition[]}
   */
  static byGroup(group)
  {
    if (this.groupCache().has(group))
    {
      return this.groupCache().get(group);
    }

    const definitions = this.all()
      .filter(definition => definition.group === group)
      .sort((left, right) => left.sortOrder - right.sortOrder);

    // Register the value on the alias map for runtime lookup.
    this.groupCache().set(group, definitions);

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

  /**
   * Opts a registered parameter into natural growth by naming the tags it answers to.<br/>
   * This is how a parameter joins every buff, growth and level-up J-NaturalGrowth performs: storage,
   * refresh and growth are all keyed by the bound key, so binding is the whole of it. What stays with
   * the parameter's owner is adding {@link Game_Battler#naturalBonus} wherever it assembles the value.
   *
   * Binding an unregistered key throws, because there would be no value for the bonus to join. Binding
   * one key twice throws too, since the second binding would silently discard the first one's tags.
   * @param {string} key The registry key of the parameter.
   * @param {NaturalParameterBinding} binding The tags and base the parameter's natural growth reads.
   */
  static bindNatural(key, binding)
  {
    // only a registered parameter has a value for natural bonuses to be added to.
    if (this.has(key) === false)
    {
      throw new Error(`ParameterRegistry: cannot bind natural growth to unregistered key "${key}".`);
    }

    // a second binding would quietly replace the tags the first one named.
    if (this.naturalBindings().has(key))
    {
      throw new Error(`ParameterRegistry: duplicate natural binding for key "${key}".`);
    }

    // record the binding under the parameter's own key.
    this.naturalBindings().set(key, binding);
  }

  /**
   * Gets the natural growth binding of a parameter.<br/>
   * Asking for a key nothing bound throws rather than answering with nothing. A parameter whose owner
   * adds natural bonuses to its value but never bound it would otherwise have tags that parse, pass
   * every check, and silently do nothing- the exact failure binding exists to prevent.
   * @param {string} key The registry key of the parameter.
   * @returns {NaturalParameterBinding}
   */
  static naturalBinding(key)
  {
    // an owner that folds natural bonuses in without binding has a wiring defect worth hearing about.
    if (this.naturalBindings().has(key) === false)
    {
      throw new Error(`ParameterRegistry: no natural binding for key "${key}"; bind it with bindNatural at boot.`);
    }

    return this.naturalBindings().get(key);
  }

  /**
   * Every registry key a natural binding has been attached to, in the order they were bound.
   * @returns {string[]}
   */
  static naturallyBoundKeys()
  {
    return [ ...this.naturalBindings().keys() ];
  }
}

export default ParameterRegistry;
//endregion ParameterRegistry