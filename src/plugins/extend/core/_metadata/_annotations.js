//region Introduction
/*:
 * @target MZ
 * @plugindesc [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Extends the capabilities of skills/actions.
 * @base J-Base
 * @orderAfter J-Base
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @help
 * ============================================================================
 * This plugin extends the functionality of skills. It features additional
 * functionality that allow you to leverage new strategies in skill learning
 * and game development.
 *
 * DETAILS:
 * The new functionalities available are as follows:
 * - Skills extending skills.
 * - On-hit self-state application and removal.
 * - On-cast self-state application and removal.
 * - On-hit target-state stack stripping and full removal.
 * - On-cast target-state stack stripping and full removal.
 * ============================================================================
 * SKILL EXTENSION:
 * Have you ever wanted to have a single skill gain additional effects by
 * learning other skills? Well now you can! By applying the appropriate tag to
 * the skill(s) in question, you too can have skills that can progressively
 * gain additional upgrades/capabilities as a battler learns more skills!
 *
 * TAG USAGE:
 * - Skills only.
 *
 * TAG FORMAT:
 *  <skillExtend:[NUM]>
 *  <skillExtend:[NUM,NUM,...]>
 * Where NUM is the skill id to extend.
 *
 * TAG EXAMPLES:
 *  <skillExtend:[40]>
 * This skill will act as an extension to skill of id 40.
 *
 *  <skillExtend:[7,8,9,10,11]>
 * This skill will act as an extension to all skills of id 7, 8, 9, 10, and 11.
 * ============================================================================
 * WHAT DOES "ACT AS AN EXTENSION" MEAN?
 * ============================================================================
 * This section of information is so important that it gets its own headline!
 *
 * Lets pretend that in our fictional example, skill id 40 maps to "Fireball".
 * We want to extend our "Fireball" skill in some way by using this skill's
 * data points. What might that look like? It can manifest in a variety of
 * ways, but with this plugin, we use extension skills as OVERRIDES or AUGMENTS
 * to the base skill. Thusly, if this skill were some kind of upgrade, you
 * could fill in the damage formula to maybe have higher multipliers, and
 * add some extra repeats (offset of +1). The changes in the skill will overlay
 * the base skill's parameters and apply BEFORE the skill's execution. You
 * can see below for a comprehensive list of what happens to the base skill
 * based on an extension skill.
 *
 * NOTE:
 * Effects are only added or updated. Tags cannot be removed by this plugin
 * with the single exception of the extend tag.
 *
 * Comprehensive breakdown of how things are overridden:
 *  If a damage type is checked:
 *    - yes/no critical option is replaced.
 *    - base element id is replaced.
 *    - allowed upgrade of "hp damage" >> "hp drain" (but not cross or reverse)
 *    - allowed upgrade of "mp damage" >> "mp drain" (but not cross or reverse)
 *    - damage variance is replaced.
 *    - the formula itself is replaced if it is not completely empty.
 *  Other sections include:
 *    - the "effects" section of the skill just adds right into the base skill.
 *    - the two "meta" objects are merged with the extension skill's priority.
 *    - the extension skill's "note" object is appended onto the base skill's.
 *    - the repeats are added onto the base (offset of +1).
 *    - the speed is added onto the base.
 *    - the success is added onto the base (only if not same or equal to 100).
 *    - the scope is replaced.
 *    - the mp cost is replaced.
 *    - the tp cost is replaced.
 *    - the tp gain is added onto the base.
 *    - if the hit type section is not "certain hit", then it replaces.
 *    - both message lines are replaced.
 *  Base data things of note:
 *    - the "occasion" is not changeable.
 *    - though "note" objects are appended, the tag for extension is removed
 *      to prevent recursive behaviors in skill extension. This removal is
 *      only for this execution of the skill for overlay purposes only.
 *    - the editor's speed cap of +/-2000 is not respected!
 *    - the editor's success cap of 0-100 is not respected!
 *  When it comes to the note section:
 *    - all tags by default will be overridden where the key matches.
 *    - you can avoid override behavior by configuring duplicate keys.
 *
 * If using this plugin with JABS...
 *
 * Note about adding move-related tags:
 *  The effects of adding the "moveType" tag onto a skill that didn't
 *  previously have it are completely untested, use at your own risk!
 * Note about adding guard-related tags:
 *  The effects of adding the "counterGuard/counterParry" tags onto a skill
 *  that didn't previously have it are untested, though shouldn't cause any
 *  problems if they are added onto a skill with "guard & parry".
 * Note about combo-related tags:
 *  The effects of adding the "combo/actionId/direct" tags onto any skills is
 *  something to be careful about, as they very significantly change how
 *  the manager interacts with the actions. Replacing any of those values
 *  though should be totally fine if they already existed on the base skill.
 *
 * With that in mind, it is strongly recommended that you copy-paste the base
 * skill into the extension skill slot in your RMMZ editor database skill tab
 * to start your extension (or another skill extension of the same skill
 * perhaps)!
 * ============================================================================
 * STATE REACTION EFFECTS:
 * Have you ever wanted a battler to be able to inflict themselves with a state,
 * lose one of their own state stacks, strip a state stack from a target, or
 * fully remove a state from a target as part of a skill's execution? Well now
 * you can! By applying the appropriate tag to the skill(s) in question, you too
 * can have battlers that react to casting or landing skills with state
 * application and removal effects.
 *
 * NOTE 1:
 * State resistance is not taken into account in regards to the CHANCE of the
 * various self-state effects. It is assumed that the percent chance designated
 * in the tag is fully representative of the chance that the state will be
 * applied to the caster.
 *
 * NOTE 2:
 * In addition to JABS multiple projectiles triggering the on-hit effect
 * multiple times, having a skill "repeat", or in JABS have multiple hits on
 * the skill, will both result in triggering the on-hit effect multiple times.
 *
 * NOTE 3:
 * On-hit effects only process on a literal hit.
 * If the action misses, is evaded, or is parried, then the on-hit effects will
 * not trigger.
 *
 * TAG USAGE:
 * - Skills only.
 *
 * TAG FORMAT:
 *  <onCastSelfState:[STATE_ID,CHANCE]>
 *  <onHitSelfState:[STATE_ID,CHANCE]>
 *  <onCastLoseState:[STATE_ID,CHANCE]>
 *  <onHitLoseState:[STATE_ID,CHANCE]>
 *  <onCastStripState:[STATE_ID,CHANCE]>
 *  <onHitStripState:[STATE_ID,CHANCE]>
 *  <onCastRemoveState:[STATE_ID,CHANCE]>
 *  <onHitRemoveState:[STATE_ID,CHANCE]>
 * Where STATE_ID is the id of the state to apply, strip, or remove.
 * Where CHANCE is the percent chance between 0 and 100 that it'll trigger.
 *
 * TAG EXAMPLES:
 *  <onCastSelfState:[3,40]>
 * The caster has a 40% chance of applying state w/ id of 3 to oneself.
 * When using JABS, this applies as soon as the skill/action is executed.
 * When using non-JABS, this applies in the same phase as you would gain TP
 * from executing a skill.
 *
 *  <onHitSelfState:[19,100]>
 * The caster has a 100% (always) chance of appling state id 19 to oneself.
 * This processes when the action successfully hits the target.
 * When using JABS, this applies as soon as the skill/action lands on
 * a target. This will trigger multiple times if an action has multiple
 * projectiles.
 * When using non-JABS, this applies when a skill successfully hits a
 * target. Misses, evades, and parries do not trigger this.
 *
 *  <onCastLoseState:[6,100]>
 * The caster has a 100% (always) chance of losing one stack of state id 6 from oneself.
 * This processes alongside other on-cast effects when the skill is executed.
 *
 *  <onHitLoseState:[7,50]>
 * The caster has a 50% chance of losing one stack of state id 7 from oneself when the
 * skill successfully hits a target.
 *
 *  <onCastStripState:[8,100]>
 * The caster has a 100% (always) chance of stripping one stack of state id 8
 * from the target.
 * This processes alongside other on-cast effects when the skill is executed.
 *
 *  <onHitStripState:[9,40]>
 * The caster has a 40% chance of stripping one stack of state id 9 from the
 * target when the skill successfully hits that target.
 *
 *  <onCastRemoveState:[10,100]>
 * The caster has a 100% (always) chance of fully removing state id 10 from the target.
 * This processes alongside other on-cast effects when the skill is executed.
 *
 *  <onHitRemoveState:[11,40]>
 * The caster has a 40% chance of fully removing state id 11 from the target when the
 * skill successfully hits that target.
 * ============================================================================
 * CHANGELOG:
 * - 1.4.1
 *    Fixed Game_Actor#hasSkill to compare by skill id rather than object reference.
 *    Vanilla uses includes($dataSkills[id]) which breaks the moment the overlay system
 *    returns a clone instead of the original database entry — hasSkill would always
 *    return false for any overlaid skill, silently blocking JABS action execution.
 *    Optimized OverlayManager#getExtendedSkill hot path: the per-caster cache is now
 *    checked before any array allocation, filter, sort, or string construction. Cache
 *    hits are O(1); the skillId alone is a stable key because the whole per-caster
 *    cache is invalidated wholesale on every learnSkill / forgetSkill call.
 * - 1.4.0
 *    Structural refactor of OverlayManager#getExtendedSkill: overlay candidates are now
 *    collected via caster.skillIds() (raw IDs, no skill()/skills() involvement) instead of
 *    caster.skills(). Removed the WeakSet re-entrancy guard. Each overlay id is now
 *    recursively resolved through getExtendedSkill before being applied, so chained
 *    extensions (A extends B extends C) produce a fully merged result at every level.
 *    A per-skillId WeakMap/Set circular-extension guard replaces the old caster-level guard;
 *    it throws a clear error on circular data rather than silently falling back.
 * - 1.3.0
 *    Lifted skill() override from Game_Actor to Game_Battler so enemies also
 *    receive overlay-merged skills when J-SkillExtend is loaded. Aliased
 *    Game_Actor#skills to map through this.skill(), making the plural form
 *    consistent with the singular for all consumers including the passive system.
 * - 1.2.1
 *    Fixed extendEffects to deduplicate addState effects by state ID when merging overlays.
 *    When an extension defines a state application, any prior entry for that state ID is
 *    replaced rather than concatenated — last extension wins per state. Multiple entries for
 *    the same state within a single extension are preserved for intentional stack effects.
 * - 1.2.0
 *    Implement caching for skill extensions by caster.
 *    Consume `RPGManager` updates.
 * - 1.1.0
 *    Rewrite tag override functionality to replace excluding specified keys.
 * - 1.0.1
 *    Fixed reference error when attempting to extend skills w/ on-hit effects.
 *    Retroactively added this CHANGELOG.
 * - 1.0.0
 *    Initial release.
 * ============================================================================
 */