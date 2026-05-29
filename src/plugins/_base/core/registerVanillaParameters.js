//region registerVanillaParameters
import ParameterDefinition from './../models/ParameterDefinition.js';
import ParameterDisplayPolicy from './ParameterDisplayPolicy.js';
import ParameterDisplaySentinel from './ParameterDisplaySentinel.js';
import ParameterFormat from './ParameterFormat.js';
import ParameterGroups from './ParameterGroups.js';
import ParameterKeys from './ParameterKeys.js';
import ParameterRegistry from './ParameterRegistry.js';
import SdpParameterBinding from './../models/SdpParameterBinding.js';
import { IconManager } from './../managers/IconManager.js';

/**
 * Registers a core b-parameter with the catalog.
 * @param {string} key
 * @param {number} paramId
 * @param {string} group
 * @param {number} sortOrder
 * @param {string} format
 */
function registerBparam(key, paramId, group, sortOrder, format = ParameterFormat.FLAT)
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
 * @param {string} key
 * @param {number} xparamId
 * @param {string} group
 * @param {number} sortOrder
 * @param {string} format
 */
function registerXparam(key, xparamId, group, sortOrder, format = ParameterFormat.PERCENT)
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
 * @param {string} key
 * @param {number} sparamId
 * @param {string} group
 * @param {number} sortOrder
 * @param {string} format
 * @param {string} displayPolicy
 */
function registerSparam(
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
function registerVanillaParameters()
{
  // vitality
  registerBparam('mhp', 0, ParameterGroups.VITALITY, 0, ParameterFormat.FLAT_LARGE);
  registerXparam('hrg', 7, ParameterGroups.VITALITY, 1, ParameterFormat.REGEN_PER_SECOND);
  registerBparam('mmp', 1, ParameterGroups.VITALITY, 2, ParameterFormat.FLAT_LARGE);
  registerXparam('mrg', 8, ParameterGroups.VITALITY, 3, ParameterFormat.REGEN_PER_SECOND);
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
  registerXparam('trg', 9, ParameterGroups.VITALITY, 5, ParameterFormat.REGEN_PER_SECOND);
  registerSparam('rec', 2, ParameterGroups.VITALITY, 6, ParameterFormat.PERCENT_CENTERED, ParameterDisplayPolicy.REWARD_RATE);
  registerSparam('pha', 3, ParameterGroups.VITALITY, 7, ParameterFormat.PERCENT_CENTERED, ParameterDisplayPolicy.REWARD_RATE);

  // combat
  registerBparam('atk', 2, ParameterGroups.COMBAT, 0);
  registerBparam('mat', 4, ParameterGroups.COMBAT, 1);
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
  registerSparam('mcr', 4, ParameterGroups.COMBAT, 7, ParameterFormat.PERCENT_CENTERED, ParameterDisplayPolicy.COST_RATE);
  registerSparam('tcr', 5, ParameterGroups.COMBAT, 9, ParameterFormat.PERCENT_CENTERED, ParameterDisplayPolicy.COST_RATE);

  // precision
  registerXparam('hit', 0, ParameterGroups.PRECISION, 0, ParameterFormat.SCALED_POINTS);
  registerSparam('grd', 1, ParameterGroups.PRECISION, 1, ParameterFormat.SCALED_OFFSET);
  registerBparam('agi', 6, ParameterGroups.PRECISION, 2);
  registerXparam('eva', 1, ParameterGroups.PRECISION, 3);
  registerXparam('cri', 2, ParameterGroups.PRECISION, 4);
  registerXparam('cev', 3, ParameterGroups.PRECISION, 5);

  // defensive
  registerBparam('def', 3, ParameterGroups.DEFENSIVE, 0);
  registerBparam('mdf', 5, ParameterGroups.DEFENSIVE, 1);
  registerSparam('pdr', 6, ParameterGroups.DEFENSIVE, 2, ParameterFormat.PERCENT_CENTERED, ParameterDisplayPolicy.DAMAGE_RATE);
  registerSparam('mdr', 7, ParameterGroups.DEFENSIVE, 3, ParameterFormat.PERCENT_CENTERED, ParameterDisplayPolicy.DAMAGE_RATE);
  registerSparam('fdr', 8, ParameterGroups.DEFENSIVE, 4, ParameterFormat.PERCENT_CENTERED, ParameterDisplayPolicy.DAMAGE_RATE);
  registerXparam('mev', 4, ParameterGroups.DEFENSIVE, 5);
  registerSparam('tgr', 0, ParameterGroups.FATE, 0, ParameterFormat.PERCENT_CENTERED, ParameterDisplayPolicy.SIGNED);

  // fate
  registerBparam('luk', 7, ParameterGroups.FATE, 2);
  registerSparam('exr', 9, ParameterGroups.FATE, 1, ParameterFormat.PERCENT_CENTERED, ParameterDisplayPolicy.REWARD_RATE);
}

registerVanillaParameters();

export default registerVanillaParameters;
//endregion registerVanillaParameters