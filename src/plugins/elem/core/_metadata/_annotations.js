//region Introduction
/*:
 * @target MZ
 * @plugindesc [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Enables greater control over elements.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @help
 * ============================================================================
 * This plugin enables the ability to modify skills with note tags to to
 * further control a skill's elemental properties in the context of battle.
 *
 * By overwriting the .calcElementRate() function, we have added new
 * functionality to elemental processing:
 * - Skills can now possess more than one element.
 * - Elements can now be absorbed.
 * - Elements can now be boosted.
 * - Actors/Enemies can now whitelist effective elements.
 *
 * NOTE:
 * Combining multiple elements together is done multiplicatively for all
 * the various operations below.
 * ============================================================================
 * ADDITIONAL ELEMENTS:
 * Have you ever wanted a skill to be both fire and ice typed? Well now you
 * can! By applying the appropriate tag to the skill(s) in question, you can
 * add one or more "attack elements" to a given skill.
 *
 * NOTE:
 * If you use "normal attack" as the base element on a skill, you will apply
 * all elements that your normal attack should include AND all elements you
 * add with this tag.
 *
 * TAG USAGE:
 * - Skills Only
 *
 * TAG FORMAT:
 *  <attackElements:[NUM]>          (for one extra element)
 *  <attackElements:[NUM,NUM,...]>  (for many extra elements)
 *
 * TAG EXAMPLE(S):
 *  <attackElements:[22]>
 * Adds the element of 22 to the skill, in addition to any other attack
 * elements the skill has.
 *
 *  <attackElements:[1,2,5]>
 * Adds elements 1, 2, and 5 to the skill, in addition to any other attack
 * elements the skill has.
 * ============================================================================
 * ABSORB ELEMENTS:
 * Have you ever wanted a battler to completely absorb lightning type skills?
 * Well now you can! By applying the appropriate note tag to the various
 * database locations applicable, you can absorb one or more "absorb elements"
 * from anything that performs elemental calculations (mostly skills/items).
 *
 * DETAILS:
 * When a skill lands on a battler, all relevant notes will be checked to see
 * if the incoming skill elements have any overlap with the elements that this
 * battler absorbs. If there are ANY elements absorbed, then all non-absorbed
 * elements will be removed from consideration and all elements being absorbed
 * will have their rates multiplied together. Absorption is prioritized over
 * handling elements with 0% rate (null elements).
 *
 * EXAMPLE 1:
 * If an enemy was weak to fire, but absorbed ice, and you hit them with a
 * fire+ice element skill, the weakness would be ignored and the skill would
 * be absorbed at the rate provided for ice.
 *
 * EXAMPLE 2:
 * If an enemy was immune to fire, but absorbed ice, and you hit them with a
 * fire+ice element skill, the immunity would be ignored, and the skill would
 * be absorbed at the rate provided.
 *
 * EXAMPLE 3:
 * If an enemy absorbed both fire at 200% (or no rate specified) and ice at
 * the rate of 300%, and you hit them with a fire+ice element skill, the
 * rates would be multiplied together and the rate would be 600% damage
 * absorbed.
 *
 * NOTE:
 * Defining the same element on two different sources does nothing extra.
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
 *  <absorbElements:[NUM]>          (for one absorbed element)
 *  <absorbElements:[NUM,NUM,...]>  (for many absorbed elements)
 * Where NUM is the element id from the "types" tab.
 *
 * TAG EXAMPLES:
 *  <absorbElements:[4]>
 * This battler now absorbs element id of 4.
 *
 *  <absorbElements:[10,18]>
 * This battler now absorbs elements 10 and 18.
 *
 *  <absorbElements:[3,7]> on battler (either actor or enemy)
 *  <absorbElements:[4,7,9,12]> on armor (only applicable to actors)
 *  <absorbElements:[10]> on state
 * This actor now absorbs elements 3, 4, 7, 9, 10, and 12.
 * ============================================================================
 * BOOST ELEMENTS:
 * Have you ever wanted a battler to temporarily (or permanently) become more
 * effective with skills of a particular element? Well now you can! By applying
 * the appropriate note tag to the various database locations applicable, you
 * can "boost" one or more elements (more requires multiple tags) by as little
 * or as much as your heart desires!
 *
 * DETAILS:
 * When a skill's elemental calculation is performed, all relevant notes will
 * be checked to see if the the caster has any boosts for any of the elements
 * that a skill possesses. If there are ANY elemental boosts found, it applies
 * to the total damage that would've been dealt. The general use case for this
 * tag would be to give an actor/enemy a passive bonus to a particular element
 * that the actor/enemy would have access to cast in some way.
 *
 * NOTE:
 * Absorb and null and strict rules still apply!
 *
 * EXAMPLE 1:
 * If a skill has element id 1 on it, and the caster has a tag on it that
 * boosts element 1 by 30%, then that skill would deal 130% of its original
 * damage.
 *
 * EXAMPLE 2:
 * If a skill has multiple elements 1, 2, and 3 on it, and the caster has a tag
 * that boosts element 2 by 50% and element 3 by 50%, then the result would be
 * the product of the two resulting in the skill dealing 225% of its original
 * damage.
 *
 * TAG USAGE:
 * - Actors
 * - Enemies
 * - Weapons
 * - Armors
 * - Skills
 * - States
 * - Classes
 *
 * TAG FORMAT:
 *  <boostElement:[ELEMENT_ID, PERCENT_BOOST]>
 * PERCENT_BOOST accepts negative numbers too, for a penalty instead of a boost.
 * Repeatable — one tag per boosted element.
 *
 * TAG EXAMPLES:
 *  <boostElement:[1, 50]>
 * This battler has a +50% boost to skills bearing element id 1.
 *
 *  <boostElement:[1, -30]>
 * This battler deals 30% LESS damage with skills bearing element id 1- useful
 * for a curse/debuff state rather than a buff.
 *
 * ============================================================================
 * STRICT ELEMENTS:
 * Have you ever wanted a battler to be completely immunte to all elemental
 * damage with the exception of just one or more elements? Well now you can!
 * By applying the appropriate note tag to the various database locations
 * applicable, you can restrict incoming damage to be limited to only a
 * subset of the available elements.
 *
 * DETAILS:
 * All sources are checked and a list of all "strict" elements are combined
 * to define for a given battler. Effectively, this is a whitelist of all
 * elements a battler can be hurt by. If there are no tags found on any
 * sources, then all elements are added to the list as a default. Similar
 * to absorption, only the elements that a skill has that overlap with the
 * "strict" elements of a battler are considered for calculation.
 *
 * NOTE:
 * Defining the same element on two different sources does nothing extra.
 * Additionally, this effect could also be done without this plugin by just
 * adding a 0%-rate for all elements except the one you want, but if you
 * have a ton of elements, that might get unwieldly, which is the exact
 * reason I created this functionality.
 *
 * TAG USAGE:
 * - Actors
 * - Enemies
 * - Weapons
 * - Armors
 * - States
 * - Classes
 *
 * TAG FORMAT:
 *  <strictElements:[NUM]>          (for one strict element)
 *  <strictElements:[NUM,NUM,...]>  (for many strict elements)
 *
 * TAG EXAMPLES:
 *  <strictElements:[8]>
 * This battler now can only receive damage from skills with element id of 8.
 *
 *  <strictElements:[3,5,6]>
 * This battler now can only receive damage from skills that include the
 * element id of 3, 5, or 6.
 *
 *  <strictElements:[1,2,3,4,5,6]> on state applied to battler.
 *  <strictElements:[1,8]> on battler (either actor or enemy).
 * This battler now can only receive damage from skills that include the
 * element id of 1, 2, 3, 4, 5, 6, or 8.
 * ============================================================================
 * PIERCE ELEMENTS:
 * Have you ever wanted a battler to partially ignore an enemy's elemental
 * resistance — punching through fire immunity to deal real damage? Well now
 * you can! By applying the appropriate tag(s) to any notetag source, you can
 * reduce the target's effective element rate for one or more elements,
 * nudging it toward neutral (1.0x) damage.
 *
 * DETAILS:
 * When a skill's elemental calculation is performed, all relevant pierce tags
 * are summed for the element being used. The target's effective rate is then
 * raised by that sum, capped at 1.0 (neutral). Pierce never turns a resistance
 * into a weakness, and it never affects elements the target is already weak to
 * or absorbs.
 *
 * Two scopes are available:
 *
 *   pierceElement tags are read from the ATTACKER's full getAllNotes() sources
 *   (actor, class, equips, states, and learned skills). If placed on a skill,
 *   the attacker passively benefits from the pierce on ALL skills they cast for
 *   as long as they know that skill.
 *
 *   thisPierceElement tags are read from the SKILL being cast RIGHT NOW only.
 *   This is the right tag when the pierce should only apply to one specific
 *   attack rather than granting a global passive benefit.
 *
 * EXAMPLE 1:
 * Target has 0% fire rate (immune). Attacker has 50 total fire pierce.
 * Effective rate = min(1.0, 0.0 + 0.50) = 0.50 → target takes 50% fire damage.
 *
 * EXAMPLE 2:
 * Target has 50% fire rate (resistant). Attacker has 30 fire pierce.
 * Effective rate = min(1.0, 0.50 + 0.30) = 0.80 → target takes 80% fire damage.
 *
 * EXAMPLE 3:
 * Target has 200% fire rate (weak). Pierce is irrelevant — weakness unchanged.
 *
 * EXAMPLE 4:
 * Target absorbs fire. Pierce is irrelevant — absorption unchanged.
 *
 * NOTE:
 * Multiple pierce tags on the same element are summed together. A state with
 * <pierceElement:[4, 30]> and an armor with <pierceElement:[4, 20]> together
 * give 50 total pierce on element 4.
 *
 * TAG USAGE (pierceElement — global, any skill):
 * - Actors
 * - Enemies
 * - Classes
 * - Skills (knowing the skill passively grants the pierce to all casts)
 * - Weapons
 * - Armors
 * - States
 *
 * TAG USAGE (thisPierceElement — this skill only):
 * - Skills only
 *
 * TAG FORMAT:
 *  <pierceElement:[ELEMENT_ID, PIERCE_PERCENT]>
 *  <thisPierceElement:[ELEMENT_ID, PIERCE_PERCENT]>
 * Where ELEMENT_ID is the numeric element id from the Types tab,
 * and PIERCE_PERCENT is an integer (30 = 30 pierce, raising effective rate by 0.30).
 *
 * TAG EXAMPLES:
 *  <pierceElement:[4, 30]>
 * The attacker pierces 30% of the target's fire (element 4) resistance on all skills.
 * If placed on a passive mastery state, it is always active while the state is applied.
 *
 *  <pierceElement:[4, 50]> on actor, <pierceElement:[4, 20]> on equipped ring:
 * Combined 70 fire pierce. A fully immune target takes 70% fire damage.
 *
 *  <thisPierceElement:[4, 100]>
 * Only when casting THIS specific skill does it fully pierce fire immunity.
 * Other skills the caster uses are unaffected.
 *
 *  <thisPierceElement:[4, 40]> combined with <pierceElement:[4, 30]> from a state:
 * 70 total fire pierce on this skill (40 skill-specific + 30 passive global).
 *
 * ============================================================================
 * CHANGELOG:
 * - 1.3.2
 *    Routed the damage-formula failure through J-Base's new Diagnostics. It was
 *    two warnings plus a separate error; it is now one error naming
 *    J-Elementalistics and the offending skill id, carrying the item and the
 *    caught error as named keys.
 * - 1.3.1
 *    Fixed Game_Actor#elementRate capturing its own original into the actor
 *    alias map and then invoking the enemy's chain instead. Harmless only by
 *    coincidence, since vanilla defines elementRate on Game_BattlerBase alone
 *    and both maps held the same inherited function; the moment either
 *    subclass gained its own, actors would have silently run the enemy's.
 * - 1.3.0
 *    Changed <boostElement:ELEMENT_ID:PERCENT_BOOST> to <boostElement:[ELEMENT_ID, PERCENT_BOOST]>.
 *    The old colon-separated shape required a bespoke, ad-hoc capture-group reader
 *    (RPGManager.getAllCapturesFromNoteByRegex) instead of the standardized bracket-array
 *    family used by every other multi-value tag; the bracket form now reads through
 *    getArraysFromNotesByRegex like the rest. Existing game data must be migrated.
 * - 1.2.0
 *    evalDamageFormula now delegates formula evaluation to Game_Action#evalFormulaWithContext.
 *    The hardcoded p (proficiency) setup and J.PROF conditional block have been removed;
 *    J-Proficiency registers p independently via Game_Action.registerFormulaContext.
 *    All registered context variables (p, s, and any future additions) are automatically
 *    available in damage formulas without J-Elementalistics needing to know about them.
 * - 1.1.0
 *    Added resistance piercing via pierceElement and thisPierceElement tags.
 *    Pierce applies to the target's base element rate before the attacker's
 *    boost multiplier, nudging resistances toward neutral (1.0). Weaknesses
 *    and absorbed elements are never affected.
 * - 1.0.1
 *    Consumed `RPGManager` updates.
 * - 1.0.0
 *    The initial release.
 * ============================================================================
 */