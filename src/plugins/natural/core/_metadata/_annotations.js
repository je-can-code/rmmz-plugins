//region Introduction
/*:
 * @target MZ
 * @plugindesc [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Enables level-based growth of all parameters.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @orderAfter J-Base
 * @orderAfter J-Base-Save
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin enables "Natural Growth", aka formulaic parameter growth, for
 * battlers. This "Natural Growth" enables temporary/permanent stat growth while
 * various tags are applied.
 *
 * Integrates with others of mine plugins:
 * - J-CriticalFactors; enables natural growths of CDM/CTR.
 * - J-Passives; updates with relic gain as well.
 * - J-LevelMaster; enables the ".lvl" access for formulas.
 * - J-SDP; adds SDP to the options for reward-based formulas.
 *
 * Any plugin that registers a parameter can bind natural growth to it, and
 * several of mine do- see the glossary at the bottom for every parameter and
 * the plugin it comes from. Plugin order does not matter for any of them.
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * The "Natural Growths" are separated into two categories:
 * - "Buffs":   has effect while applied.
 * - "Growths": effect is applied permanently for every level gained.
 *
 * Additionally, each "Natural Growth" can be applied in two ways:
 * - "Plus": a flat bonus to the base parameter.
 * - "Rate": a multiplicative bonus to the (base parameter + "plus" bonus).
 *
 * ----------------------------------------------------------------------------
 * UNITS:
 * Every tag is written in the numbers the status screen shows, and never in
 * the fractions RMMZ keeps behind the scenes. A 75% chance is written as 75,
 * not 0.75, whichever parameter it is for.
 * - <lstGrowthPlus:[1.5]> is +1.5% lifesteal for every level gained.
 * - <criBuffPlus:[10]> is +10% critical hit rate while applied.
 * - <atkBuffPlus:[10]> is +10 attack, since attack is already a whole number.
 * - <harBuffRate:[10]> is 10% more of whatever healing rate the battler has.
 *
 * Parameters that are costs, such as life cost (hcr) or mp cost (mcr), move
 * the cost exactly as it is shown, so a negative number is what makes things
 * cheaper: <hcrGrowthPlus:[-2]> lowers life cost by 2% per level.
 * ============================================================================
 * NATURAL GROWTH:
 * Have you ever wanted an actor to gain a particular stat, but couldn't quite
 * make it as customizable as you wanted it to be? Well now you can! By adding
 * the correct tags to your notes across the various entries in the database,
 * you too can make your actors gain more specific stats!
 *
 * DETAILS:
 * By constructing tags using the format described below, you are given access
 * to a "Formula" box that behaves similar to a "Formula" box that defines the
 * damage of a skill. None of the tags are case sensitive, but the order is
 * specific. If you find yourself having trouble building the tags, you can
 * peek at the source code of this file and search for "J.NATURAL.RegExp =" to
 * find the master list for the engine's own parameters; every other plugin
 * keeps its parameters' tags in its own list. Do note that the hard brackets
 * of [] are required to wrap the formula in the note tag.
 *
 * THE PERMANENCE OF BUFF:
 * The "Buffs" effect, as indicated above, is applied temporarily at whatever
 * the formula would calculate out to when the parameter is requested. This
 * allows the application of these "buffs" to live on dynamic objects, such as
 * equipment or states, giving greater control over what stats are gained and
 * how much. However, it is important to note that if you put a "buff" tag on
 * a non-temporary object, such as the actor itself, it would be functionally
 * a permanent "buff".
 *
 * THE PERMANENCE OF GROWTH:
 * The "Growths" effect, as indicated above, is applied permanently for every
 * level gained. However, it is important to note that due to the nature of the
 * growth being permanent, it WILL NOT be lost if the level is reduced in some
 * way, and WILL be gained AGAIN if the level increases once more.
 *
 * NOTE1:
 * The "stats" word choice was deliberate vague because this can apply to any
 * of the 8 base parameters, 10 sp-parameters, or 10 ex-parameters, max tp,
 * healing rate, or any parameter another plugin has bound to natural growth.
 *
 * TIP:
 * Within the FORMULA of the tag, the variable "a" is can be used to access
 * the actor for more complex calculations. The variable "b" is the parameter's
 * own base before any natural bonus, in the same status-screen numbers the tag
 * is written in, so <atkBuffPlus:[b * 0.1]> is a tenth of the base attack.
 * Note that "a" gives the engine's values as they are stored, so a.hit is
 * 0.95 and not 95- multiply by 100 when a formula needs the percent.
 *
 * TAG USAGE:
 * - Actors
 * - Classes
 * - Skills
 * - Weapons
 * - Armors
 * - Enemies
 * - States
 *
 * TAG FORMAT:
 *  <(PARAM)(BUFF|GROWTH)(PLUS|RATE):[FORMULA]>
 * Where (PARAM) is the (base/sp/ex) parameter shorthand.
 * Where (BUFF|GROWTH) is literally one of either "Buff" or "Growth".
 * Where (PLUS|RATE) is literally one of either "Plus" or "Rate".
 * Where [FORMULA] is the formula to produce the amount.
 *
 * EXAMPLE:
 *  <hrgGrowthRate:[5]>
 * Gain +5% hp regen (hrg) per level.
 * This would result in gaining an ever-increasing amount of hp regen per level.
 *
 *  <exrBuffPlus:[25]>
 * Gain a flat 25 exp rate (exr) while this tag is applied to this battler.
 * This would be lost if the object this tag lived on was removed.
 *
 *  <atkGrowthPlus:[a.level * 3]>
 * Gain (the battler's level multiplied by 3) attack (atk) per level.
 * This would result in gaining an ever-increasing amount of attack per level.
 * ----------------------------------------------------------------------------
 * NATURAL GROWTHS AND REWARDS:
 * While the above parameters and such are shared between actors and enemies
 * alike, and thus a common pattern was useful, there are a couple of
 * "parameters" that are unique to enemies: rewards. Specifically, experience,
 * gold, and SDPs. Since they aren't directly useful in combat, their tags are
 * a bit different.
 *
 * NOTE:
 * The base value that is in the database will be added to the calculated
 * value for exp/gold/sdp, thus the static value in the database can be
 * thought of as a "base" value.
 *
 * TAG USAGE:
 * - Enemies
 * - States
 *
 * TAG FORMAT:
 *  <(REWARD)(PLUS):[FORMULA]>
 * Where (REWARD) is one of exp, gold, or sdp.
 * Where (PLUS) is... plus. There is no "rate" for this value.
 * Where [FORMULA] is the formula to produce the amount.
 *
 * EXAMPLE:
 *  <expPlus:[5 + a.lvl * 50]>
 * When defeating this enemy, the experience gained will be increased by the
 * enemy's level multiplied by 50, plus an extra 5.
 *
 *  <goldPlus:[100 + a.luk + a.level ** 2]>
 * When defeating this enemy, the gold gained will be increased by 100 plus the
 * enemy's luck value plus the enemy's level squared (to the second power).
 *
 *  <sdpPlus:[100 * a.atk]>
 * When defeating this enemy, the SDPs gained will be increased by 100 plus the
 * enemy's attack value.
 *
 * ==============================================================================
 * EXAMPLE IDEAS:
 * While you can read about the syntax in the next section below, here I wanted
 * to present you a few ideas of things you can do with this plugin, to better
 * illustrate what exactly this plugin can do.
 *
 * TAG:
 *  <mtpBuffPlus:[80]>
 * LOCATION:
 *  An actor.
 * EFFECT:
 *  The actor now has a permanent bonus of 80 to their max tp.
 *
 * TAG:
 *  <grdGrowthRate:[5]>
 * LOCATION:
 *  A class.
 * EFFECT:
 *  For every level gained by an actor using this class, they will gain a
 *  permanent 5% "rate" bonus to their GRD, meaning it is a multiplied percent
 *  bonus against their base and plus values combined. Note that this is
 *  stored on the actor and will persist even after the class is changed.
 *
 * TAG:
 *  <hrgBuffPlus:[(a.level**1.3)+(a.level*5)]>
 * LOCATION:
 *  An armor.
 * EFFECT:
 *  The actor will have a bonus of (5x their level) and (their level to the
 *  1.3rd power) added together worth of HRG.
 *
 * TAG:
 *  <atkGrowthPlus:[a.level]>
 * LOCATION:
 *  A state.
 * EFFECT:
 *  For every level gained by an actor afflicted with this state, they will
 *  gain their level's worth of attack permanently.
 *
 * TAG:
 *  <harBuffPlus:[20]>
 * LOCATION:
 *  A state.
 * EFFECT:
 *  While afflicted, the actor's outgoing healing is 20% stronger on top of
 *  their base HAR. Lost as soon as the state wears off.
 *
 * TAG:
 *  <lstGrowthPlus:[1.5]>
 * LOCATION:
 *  A class.
 * EFFECT:
 *  For every level gained by an actor using this class, they permanently
 *  gain 1.5% lifesteal. Requires J-Resources-ABS, which owns lifesteal.
 *
 * ==============================================================================
 * GLOSSARY:
 * There are a lot of shorthands available for use with this plugin to build your
 * various buff and growth tags. Here is a comprehensive list of the shorthands
 * along with a translation to the actual parameter of all supported shorthands.
 *
 * NOTE:
 * Custom parameters require their respective plugins to be installed. Where
 * each plugin sits in the plugin list does not matter.
 *
 * Base Parameters:
 * - mhp (max hp)
 * - mmp (max mp)
 * - atk (attack)
 * - def (defense)
 * - mat (magic attack)
 * - mdf (magic defense)
 * - agi (agility)
 * - luk (luck)
 *
 * Ex Parameters:
 * - hit (hit rate)
 * - eva (evasion rate)
 * - cri (critical hit rate)
 * - cev (critical evasion rate)
 * - mev (magic evasion rate)
 * - mrf (magic reflect rate)
 * - cnt (counter attack rate)
 * - hrg (hp regen rate)
 * - mrg (mp regen rate)
 * - trg (tp regen rate)
 *
 * Sp Parameters:
 * - tgr (targeting rate)
 * - grd (guarding rate)
 * - rec (recovery rate)
 * - pha (pharmacy rate)
 * - mcr (mp cost reduction rate)
 * - tcr (tp cost reduction rate)
 * - pdr (physical damage reduction rate)
 * - mdr (magical damage reduction rate)
 * - fdr (floor damage reduction rate)
 * - exr (experience gained rate)
 *
 * Custom Parameters:
 * - mtp (max tp)
 * - har (healing rate, requires J-Base 3.2.0+)
 * - cdm (critical damage multiplier, requires J-CriticalFactors)
 * - ctr (critical damage reduction, requires J-CriticalFactors)
 * - dor (drop rate, requires J-DropsControl)
 * - gdr (gold rate, requires J-DropsControl)
 * - hcr (life cost, requires J-Resources; negative is cheaper)
 * - lst (lifesteal, requires J-Resources-ABS)
 * - mst (manasteal, requires J-Resources-ABS)
 * - tst (techsteal, requires J-Resources-ABS)
 * - sar (shield amplification, requires J-ABS-Shield)
 * - ser (shield effectiveness, requires J-ABS-Shield)
 * - msb (move speed boost, requires J-ABS-Speed)
 * - apr (aptitude rate, requires J-Aptitude)
 * - prof (proficiency bonus, requires J-Proficiency)
 * - sdr (SDP rate, requires J-SDP)
 *
 * Rewards (plus only, no rate):
 * - exp
 * - gold
 * - sdp
 *
 * ============================================================================
 * CHANGELOG:
 * - 3.0.0
 *    Any plugin can now bind natural growth to its own parameters, and plugin
 *    order no longer matters. Every tag is written in the numbers the status
 *    screen shows. Growth accumulated in older saves does not carry over.
 *    Fixed ex- and sp-parameter growth delivering a hundredth of its value, and
 *    healing rate buffs landing as raw amounts rather than percents.
 *    Removed the per-parameter growth accessors and applyNaturalCustomGrowths;
 *    plugins bind their parameters through J-Base's registry instead.
 * - 2.4.1
 *    Routed the unrecognized-subclass warning through J-Base's new Diagnostics,
 *    so it names J-NaturalGrowth in the console.
 * - 2.4.0
 *    Routed the _natural namespace into its own save section, so accumulated
 *    growth lands in systems/natural.json rather than in the system blob.
 * - 2.3.0
 *    BREAKING (tag semantics): ex- and sp-parameter growth tags now take whole
 *    percents, matching the buff tags beside them. The growth path stored its
 *    flat bonus raw while the buff path divided by 100, so the same value in
 *    the two families differed by a factor of one hundred on any parameter the
 *    engine keeps as a 0-1 fraction: <hitBuffPlus:[5]> meant five percent hit
 *    while <hitGrowthPlus:[5]> meant five hundred, applied per level. Base
 *    parameters and max TP are untouched, since those are whole numbers where
 *    a tag of ten has always meant ten points.
 * - 2.2.0
 *    Added HAR (Healing Rate) growth and buff support — not a native param
 *    array member, so it gets its own dedicated tag set like max tp:
 *    <harGrowthPlus:[FORMULA]>, <harGrowthRate:[FORMULA]>,
 *    <harBuffPlus:[FORMULA]>, <harBuffRate:[FORMULA]>. Growth applies via
 *    the existing applyNaturalCustomGrowths hook (actors only); buffs apply
 *    to both actors and enemies. Requires J-Base 3.2.0+.
 * - 2.1.2
 *    Fixed issue with broken regex structures for max TP.
 *    Consumed `RPGManager` updates.
 * - 2.1.1
 *    Relocates basic max TP management to the J.BASE plugin.
 *    Adds ability to also add a bonus to SDP dropped.
 * - 2.1.0
 *    Added formula evaluation for enemy rewards on enemies.
 * - 2.0.1
 *    Fixed issue with buffs not being refreshed in Scene_Equip.
 * - 2.0.0
 *    Buff tracking has been refactored to be more compatible with J-Passives.
 *    Fixed issues with buffs/growths not being tracked correctly.
 * - 1.0.0
 *    Initial release.
 * ============================================================================
 * @param actorBaseTp
 * @type number
 * @min 0
 * @text Actor Base TP Max
 * @desc The base TP for actors is this amount. Any formulai add onto this.
 * @default 0
 *
 * @param enemyBaseTp
 * @type number
 * @min 0
 * @text Enemy Base TP Max
 * @desc The base TP for enemies is this amount. Any formulai add onto this.
 * @default 100
 */
//endregion Introduction