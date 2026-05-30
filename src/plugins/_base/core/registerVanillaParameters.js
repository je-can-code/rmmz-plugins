//region registerVanillaParameters
import ParameterDefinition from './../models/ParameterDefinition.js';
import ParameterDisplayPolicy from './ParameterDisplayPolicy.js';
import ParameterDisplaySentinel from './ParameterDisplaySentinel.js';
import ParameterFormat from './ParameterFormat.js';
import ParameterGroups from './ParameterGroups.js';
import ParameterKeys from './ParameterKeys.js';
import ParameterRegistry from './ParameterRegistry.js';
import SdpParameterBinding from './../models/SdpParameterBinding.js';
import IconManager from './../managers/IconManager.js';

/**
 * Boot-time registration for vanilla engine parameters in {@link ParameterRegistry}.
 */
class VanillaParameterRegistration
{
  /**
   * Registers a core b-parameter with the catalog.
   * @param {string} key The key driving this step.
   * @param {number} paramId The param id driving this step.
   * @param {string} group The group driving this step.
   * @param {number} sortOrder The sort order driving this step.
   * @param {string} format The format driving this step.
   */
  static registerBparam(key, paramId, group, sortOrder, format = ParameterFormat.FLAT)
  {
    ParameterRegistry.register(
      ParameterDefinition.Builder()
        .key(key)
        .group(group)
        .sortOrder(sortOrder)
        .label(() => TextManager.param(paramId))
        .description(() => TextManager.bparamDescription(paramId))
        .iconIndex(() => IconManager.param(paramId))
        .format(format)
        .getValue(battler => battler.param(paramId))
        .sdpBinding(SdpParameterBinding.bparam(paramId))
        .build()
    );
  }

  /**
   * Registers a core ex-parameter with the catalog.
   * @param {string} key The key driving this step.
   * @param {number} xparamId The xparam id driving this step.
   * @param {string} group The group driving this step.
   * @param {number} sortOrder The sort order driving this step.
   * @param {string} format The format driving this step.
   */
  static registerXparam(key, xparamId, group, sortOrder, format = ParameterFormat.PERCENT)
  {
    ParameterRegistry.register(
      ParameterDefinition.Builder()
        .key(key)
        .group(group)
        .sortOrder(sortOrder)
        .label(() => TextManager.xparam(xparamId))
        .description(() => TextManager.xparamDescription(xparamId))
        .iconIndex(() => IconManager.xparam(xparamId))
        .format(format)
        .getValue(battler => battler.xparam(xparamId))
        .sdpBinding(SdpParameterBinding.xparam(xparamId))
        .build()
    );
  }

  /**
   * Registers a core sp-parameter with the catalog.
   * @param {string} key The key driving this step.
   * @param {number} sparamId The sparam id driving this step.
   * @param {string} group The group driving this step.
   * @param {number} sortOrder The sort order driving this step.
   * @param {string} format The format driving this step.
   * @param {string} displayPolicy The display policy driving this step.
   */
  static registerSparam(
    key,
    sparamId,
    group,
    sortOrder,
    format = ParameterFormat.PERCENT_CENTERED,
    displayPolicy = ParameterDisplayPolicy.NONE)
  {
    ParameterRegistry.register(
      ParameterDefinition.Builder()
        .key(key)
        .group(group)
        .sortOrder(sortOrder)
        .label(() => TextManager.sparam(sparamId))
        .description(() => TextManager.sparamDescription(sparamId))
        .iconIndex(() => IconManager.sparam(sparamId))
        .format(format)
        .displayPolicy(displayPolicy)
        .getValue(battler => battler.sparam(sparamId))
        .sdpBinding(SdpParameterBinding.sparam(sparamId))
        .build()
    );
  }

  /**
   * Registers all vanilla engine parameters with the catalog.
   */
  static registerAll()
  {
    // vitality
    VanillaParameterRegistration.registerBparam('mhp', 0, ParameterGroups.VITALITY, 0, ParameterFormat.FLAT_LARGE);
    VanillaParameterRegistration.registerXparam('hrg', 7, ParameterGroups.VITALITY, 1, ParameterFormat.REGEN_PER_SECOND);
    VanillaParameterRegistration.registerBparam('mmp', 1, ParameterGroups.VITALITY, 2, ParameterFormat.FLAT_LARGE);
    VanillaParameterRegistration.registerXparam('mrg', 8, ParameterGroups.VITALITY, 3, ParameterFormat.REGEN_PER_SECOND);
    ParameterRegistry.register(
      ParameterDefinition.Builder()
        .key('mtp')
        .group(ParameterGroups.VITALITY)
        .sortOrder(4)
        .label(() => TextManager.maxTp())
        .description(() => TextManager.bparamDescription(30))
        .iconIndex(() => IconManager.maxTp())
        .format(ParameterFormat.FLAT)
        .getValue(battler => battler.maxTp())
        .sdpBinding(SdpParameterBinding.custom(
          (actor, base) =>
          {
            if (!J.SDP) return 0;
            if (!actor.maxTpSdpBonuses) return 0;

            return actor.maxTpSdpBonuses(base);
          },
          actor => actor.getBaseMaxTp()
        ))
        .build()
    );
    VanillaParameterRegistration.registerXparam('trg', 9, ParameterGroups.VITALITY, 5, ParameterFormat.REGEN_PER_SECOND);
    VanillaParameterRegistration.registerSparam('rec', 2, ParameterGroups.VITALITY, 6, ParameterFormat.PERCENT_CENTERED, ParameterDisplayPolicy.REWARD_RATE);
    VanillaParameterRegistration.registerSparam('pha', 3, ParameterGroups.VITALITY, 7, ParameterFormat.PERCENT_CENTERED, ParameterDisplayPolicy.REWARD_RATE);

    // combat
    VanillaParameterRegistration.registerBparam('atk', 2, ParameterGroups.COMBAT, 0);
    VanillaParameterRegistration.registerBparam('mat', 4, ParameterGroups.COMBAT, 1);
    ParameterRegistry.register(
      ParameterDefinition.Builder()
        .key('cnt')
        .group(ParameterGroups.COMBAT)
        .sortOrder(2)
        .label(() => TextManager.xparam(6))
        .description(() => TextManager.xparamDescription(6))
        .iconIndex(() => IconManager.xparam(6))
        .format(ParameterFormat.PERCENT_SUFFIX)
        .displayPolicy(ParameterDisplayPolicy.REWARD_RATE)
        .getValue(battler => battler.cnt)
        .sdpBinding(SdpParameterBinding.xparam(6))
        .build()
    );
    ParameterRegistry.register(
      ParameterDefinition.Builder()
        .key('mrf')
        .group(ParameterGroups.COMBAT)
        .sortOrder(3)
        .label(() => TextManager.xparam(5))
        .description(() => TextManager.xparamDescription(5))
        .iconIndex(() => IconManager.xparam(5))
        .format(ParameterFormat.PERCENT_SUFFIX)
        .displayPolicy(ParameterDisplayPolicy.REWARD_RATE)
        .getValue(battler => battler.mrf)
        .sdpBinding(SdpParameterBinding.xparam(5))
        .build()
    );
    VanillaParameterRegistration.registerSparam('mcr', 4, ParameterGroups.COMBAT, 7, ParameterFormat.PERCENT_CENTERED, ParameterDisplayPolicy.COST_RATE);
    VanillaParameterRegistration.registerSparam('tcr', 5, ParameterGroups.COMBAT, 9, ParameterFormat.PERCENT_CENTERED, ParameterDisplayPolicy.COST_RATE);

    // precision
    VanillaParameterRegistration.registerXparam('hit', 0, ParameterGroups.PRECISION, 0, ParameterFormat.SCALED_POINTS);
    VanillaParameterRegistration.registerSparam('grd', 1, ParameterGroups.PRECISION, 1, ParameterFormat.SCALED_OFFSET);
    VanillaParameterRegistration.registerBparam('agi', 6, ParameterGroups.PRECISION, 2);
    VanillaParameterRegistration.registerXparam('eva', 1, ParameterGroups.PRECISION, 3);
    VanillaParameterRegistration.registerXparam('cri', 2, ParameterGroups.PRECISION, 4);
    VanillaParameterRegistration.registerXparam('cev', 3, ParameterGroups.PRECISION, 5);

    // defensive
    VanillaParameterRegistration.registerBparam('def', 3, ParameterGroups.DEFENSIVE, 0);
    VanillaParameterRegistration.registerBparam('mdf', 5, ParameterGroups.DEFENSIVE, 1);
    VanillaParameterRegistration.registerSparam('pdr', 6, ParameterGroups.DEFENSIVE, 2, ParameterFormat.PERCENT_CENTERED, ParameterDisplayPolicy.DAMAGE_RATE);
    VanillaParameterRegistration.registerSparam('mdr', 7, ParameterGroups.DEFENSIVE, 3, ParameterFormat.PERCENT_CENTERED, ParameterDisplayPolicy.DAMAGE_RATE);
    VanillaParameterRegistration.registerSparam('fdr', 8, ParameterGroups.DEFENSIVE, 4, ParameterFormat.PERCENT_CENTERED, ParameterDisplayPolicy.DAMAGE_RATE);
    VanillaParameterRegistration.registerXparam('mev', 4, ParameterGroups.DEFENSIVE, 5);
    VanillaParameterRegistration.registerSparam('tgr', 0, ParameterGroups.FATE, 0, ParameterFormat.PERCENT_CENTERED, ParameterDisplayPolicy.SIGNED);

    // fate
    VanillaParameterRegistration.registerBparam('luk', 7, ParameterGroups.FATE, 2);
    VanillaParameterRegistration.registerSparam('exr', 9, ParameterGroups.FATE, 1, ParameterFormat.PERCENT_CENTERED, ParameterDisplayPolicy.REWARD_RATE);
  }
}

export default VanillaParameterRegistration;
//endregion registerVanillaParameters