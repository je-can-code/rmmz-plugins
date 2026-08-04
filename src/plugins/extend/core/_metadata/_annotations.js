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
 * - Skills and states.
 *
 * TAG FORMAT:
 *  <extend:[NUM]>
 *  <extend:[NUM,NUM,...]>
 * Where NUM is the skill or state id to extend.
 *
 * TAG EXAMPLES:
 *  <extend:[40]>
 * This skill/state will act as an extension to skill/state of id 40.
 *
 *  <extend:[7,8,9,10,11]>
 * This skill/state will act as an extension to all skills/states of id 7, 8, 9, 10, and 11.
 *
 * EXTENSION BY TYPE:
 * As an alternative to id-based extension, a skill or state can instead extend
 * EVERY skill/state carrying a matching <type:CLASSIFIER> tag (see J-Base), without
 * having to list each target id individually.
 *
 * TAG USAGE:
 * - Skills and states.
 *
 * TAG FORMAT:
 *  <extendType:CLASSIFIER>
 * Where CLASSIFIER is the type classifier string to match against (see
 * J-Base's <type:CLASSIFIER> tag).
 *
 * TAG EXAMPLES:
 *  <extendType:poison>
 * This state acts as an extension to every currently active state that
 * carries <type:poison>, regardless of that state's specific id.
 *
 *  <extendType:low-effort>
 * This skill acts as an extension to every skill the caster knows that
 * carries <type:low-effort>, regardless of that skill's specific id.
 *
 * NOTE ABOUT CANDIDATE POOLS:
 * States draw type/id candidates from the battler's currently ACTIVE states
 * (including passive-injected ones). Skills draw candidates from the caster's
 * KNOWN/learned skills — a skill overlay never applies unless the caster has
 * actually learned it, same as id-based skill extension already worked.
 *
 * NOTE ABOUT RESOLUTION ORDER:
 * When a candidate pool has both type-based and id-based extension candidates
 * for the same base skill/state, type-based overlays are applied first (in
 * ascending id order), then id-based overlays are applied second (also
 * ascending id order) — id-based extensions win on conflict since they apply last.
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
 *  <onCastSelfStateIfAfflicted:[STATE_TO_APPLY,CHANCE,STATE_REQUIREMENT]>
 *  <onHitSelfState:[STATE_ID,CHANCE]>
 *  <onCastLoseState:[STATE_ID,CHANCE]>
 *  <onHitLoseState:[STATE_ID,CHANCE]>
 *  <onCastStripState:[STATE_ID,CHANCE]>
 *  <onHitStripState:[STATE_ID,CHANCE]>
 *  <onCastRemoveState:[STATE_ID,CHANCE]>
 *  <onHitRemoveState:[STATE_ID,CHANCE]>
 *  <onCastExecuteSkill:[SKILL_ID,CHANCE]>
 *  <onCastExecuteSkillIfAfflicted:[SKILL_ID,CHANCE,STATE_REQUIREMENT]>
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
 *  <onCastSelfStateIfAfflicted:[42,100,19]>
 * On cast, if the caster currently has state id 19 (STATE_REQUIREMENT) active,
 * apply state id 42 (STATE_TO_APPLY) to oneself at 100% chance. If the caster
 * does not have state 19, this tag does nothing- no roll occurs at all.
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
 *
 *  <onCastExecuteSkill:[1026,100]>
 *  <onCastExecuteSkill:[1027,50]>
 * On cast, always force-execute skill id 1026, and separately roll a 50% chance to also
 * force-execute skill id 1027. Fires once at press-time (same timing as onCastSelfState), through
 * JABS forceMapAction — no MP/TP cost, no cooldown on the payload skills. Skill-scoped and
 * repeatable: stack as many <onCastExecuteSkill> tags on one skill as you want, each rolls
 * independently. A forced skill's own <onCastExecuteSkill> tag may chain one further hop before
 * being cut off (depth-guarded against runaway loops).
 *
 *  <onCastExecuteSkillIfAfflicted:[267,100,134]>
 * On cast, if the caster currently has state id 134 active, force-execute skill id 267 at 100%
 * chance. If the caster does not have state 134, this tag does nothing- no roll occurs at all, and
 * nothing is force-executed. Same <onCastExecuteSkill> timing, JABS dispatch path, and depth guard;
 * this is purely a gate on top of it. Skill-scoped and repeatable, same as its unconditional
 * counterpart.
 * ============================================================================
 * ON-HIT APPLY STATE (SKILL-SCOPED):
 * Have you ever wanted a specific skill to apply a state to its target with a
 * custom duration or stack count, rather than whatever the state's defaults are?
 * Well now you can! By applying the appropriate tag directly to the skill, you
 * can author exactly how long or how many stacks a state lands with on a
 * per-skill basis.
 *
 * NOTE 1:
 * CHANCE is an integer between 0 and 100. Target state resistances are still
 * respected — if the target cannot receive the state, it will not be applied
 * regardless of the chance roll.
 *
 * NOTE 2:
 * DURATION is in frames (60 frames = 1 second at 60fps). A positive value replaces
 * the state's own jabsStateDurationFrames value as the BASE duration, and wins over
 * the state's own tags EVEN IF the state carries <indefiniteState> — an explicit
 * DURATION always overrides the target's own indefinite/duration tags. Attacker
 * duration-boost tags (stateDurationFlat, stateDurationPerc, stateDurationFormula)
 * still apply on top of this overridden base, so passive gear and traits remain
 * relevant.
 *
 * NOTE 3:
 * DURATION and STACKS are both optional, and DURATION carries two sentinels:
 *   - Omitted, or {@code 0}: no override — defer entirely to the state's own tags
 *     (jabsStateDurationFrames, <indefiniteState>), unchanged from today.
 *   - {@code -1}: force this application indefinite, regardless of the state's own
 *     tags. No duration-boost math runs (there is no duration to boost).
 * Omitting STACKS uses the state's own default stack count.
 *
 * NOTE 4:
 * A skill may carry multiple <thisApplyState> tags to apply different states on
 * the same hit. Each entry is evaluated independently.
 *
 * NOTE 5:
 * If both <thisApplyState> and <applyState> target the same state id on the same
 * hit, <thisApplyState> fires last and wins.
 *
 * TAG USAGE:
 * - Skills only.
 *
 * TAG FORMAT:
 *  <thisApplyState:[STATE_ID, CHANCE]>
 *  <thisApplyState:[STATE_ID, CHANCE, DURATION]>
 *  <thisApplyState:[STATE_ID, CHANCE, DURATION, STACKS]>
 * Where STATE_ID is the id of the state to apply to the target.
 * Where CHANCE is the percent chance between 0 and 100 that it triggers.
 * Where DURATION is the duration in frames; omit or use 0 for the state's default,
 * or -1 to force the application indefinite regardless of the state's own tags.
 * Where STACKS is the starting stack count; omit to use the state's default.
 *
 * TAG EXAMPLES:
 *  <thisApplyState:[8, 100, 240]>
 * On hit, always apply state id 8 for 240 frames (4 seconds at 60fps).
 *
 *  <thisApplyState:[8, 25]>
 * On hit, 25% chance to apply state id 8 using the state's own default duration.
 *
 *  <thisApplyState:[8, 50, 120, 2]>
 * On hit, 50% chance to apply state id 8 for 120 frames with 2 starting stacks.
 *
 *  <thisApplyState:[8, 50, 0, 2]>
 * On hit, 50% chance to apply state id 8 with 2 starting stacks and the state's
 * own default duration (0 = no duration change).
 *
 *  <thisApplyState:[8, 50, -1]>
 * On hit, 50% chance to apply state id 8 forever, regardless of the state's own
 * duration tags.
 * ============================================================================
 * ON-HIT APPLY STATE (CASTER-WIDE):
 * Have you ever wanted a passive state, equipped item, or actor data to make
 * your attacks apply a state with custom duration or stacks on every hit?
 * Well now you can! The caster-wide variant reads from all of the attacker's
 * notes, so it can live anywhere — a poisoned-blade state, a cursed accessory,
 * or a base actor trait — and will fire whenever that battler lands a hit.
 *
 * NOTE 1:
 * All notes from the same section above apply here as well (CHANCE, DURATION,
 * STACKS behavior, resistances, etc.).
 *
 * NOTE 2:
 * If both <applyState> and <thisApplyState> target the same state id on the same
 * hit, <thisApplyState> fires last and wins.
 *
 * TAG USAGE:
 * - Skills, states, weapons, armors, actors, enemies, classes.
 *
 * TAG FORMAT:
 *  <applyState:[STATE_ID, CHANCE]>
 *  <applyState:[STATE_ID, CHANCE, DURATION]>
 *  <applyState:[STATE_ID, CHANCE, DURATION, STACKS]>
 * Where STATE_ID is the id of the state to apply to the target.
 * Where CHANCE is the percent chance between 0 and 100 that it triggers.
 * Where DURATION is the duration in frames; omit or use 0 for the state's default,
 * or -1 to force the application indefinite regardless of the state's own tags.
 * Where STACKS is the starting stack count; omit to use the state's default.
 *
 * TAG EXAMPLES:
 *  <applyState:[12, 100, 600]>
 * On every hit, always apply state id 12 for 600 frames (10 seconds at 60fps).
 *
 *  <applyState:[12, 30]>
 * On every hit, 30% chance to apply state id 12 with the state's default duration.
 *
 *  <applyState:[12, 30, 0, 3]>
 * On every hit, 30% chance to apply state id 12 with 3 starting stacks and the
 * state's own default duration (0 = no duration change).
 *
 *  <applyState:[12, 30, -1]>
 * On every hit, 30% chance to apply state id 12 forever, regardless of the
 * state's own duration tags.
 * ============================================================================
 * TOGGLE STATE ON EXECUTE:
 * Have you ever wanted a "stance" skill — one that flips a state on when it's off,
 * and flips it off when it's on, using the same skill both ways? This tag does
 * exactly that: it fires once when the skill executes (not per-hit), checks
 * whether the caster currently has the tagged state, and toggles it.
 *
 * NOTE 1:
 * This fires once at press-time, the same as the on-cast self-state tags above —
 * it does not require (or care about) a successful hit against a target.
 *
 * NOTE 2:
 * There is no chance roll; this always triggers when the skill executes.
 *
 * NOTE 3:
 * A skill may carry multiple <toggleOnExecute> tags to flip several states in a
 * single execution. Each STATE_ID is evaluated independently: if the caster has
 * it, it's removed; if not, it's added.
 *
 * TAG USAGE:
 * - Skills only.
 *
 * TAG FORMAT:
 *  <toggleOnExecute:STATE_ID>
 * Where STATE_ID is the id of the state to toggle on the caster.
 *
 * TAG EXAMPLES:
 *  <toggleOnExecute:12>
 * Executing this skill removes state id 12 from the caster if they have it,
 * or adds it if they don't — toggling a stance on/off with one skill.
 *
 *  <toggleOnExecute:12>
 *  <toggleOnExecute:13>
 * Executing this skill independently toggles both state id 12 and state id 13.
 * ============================================================================
 * TOGGLE STATE GROUP ON EXECUTE:
 * The scalar toggle above is fine for a single on/off flag, but it falls apart
 * for a "stance A vs. stance B" pair (or a longer cycle): tagging both states
 * with <toggleOnExecute> flips each one independently, so if anything outside
 * this skill ever strips one of the two states out from under you, the pair can
 * drift into both-active or both-inactive and stay that way. This tag instead
 * treats a whole list of states as one coupled group with exactly one "active"
 * member at a time, and self-repairs if that invariant is ever broken.
 *
 * NOTE 1:
 * Same as <toggleOnExecute>: fires once at press-time, no chance roll, always
 * triggers, and a skill may carry multiple <toggleGroupOnExecute> tags to cycle
 * several independent groups in one execution.
 *
 * NOTE 2:
 * Within one group: if none of the listed states are active, the first one is
 * added. If exactly one is active, it's removed and the NEXT one in the list is
 * added, wrapping back to the first after the last — so a longer list is a full
 * cycle, not just an A/B swap. If more than one is somehow active at once (state
 * drift from some other effect), all of them are removed and the group resyncs
 * to the first entry rather than continuing to advance from a broken position.
 *
 * TAG USAGE:
 * - Skills only.
 *
 * TAG FORMAT:
 *  <toggleGroupOnExecute:[STATE_ID, STATE_ID, ...]>
 * Where each STATE_ID is a member of the cycle, in the order they cycle through.
 *
 * TAG EXAMPLES:
 *  <toggleGroupOnExecute:[12, 13]>
 * A two-state stance swap: executing this skill flips from 12 to 13, or from 13
 * back to 12, always landing on exactly one of the two.
 *
 *  <toggleGroupOnExecute:[12, 13, 14]>
 * A three-state cycle: 12 -> 13 -> 14 -> 12 -> ..., one step per execution.
 * ============================================================================
 * CHANGELOG:
 * - 1.7.2
 *    The plugin metadata class no longer declares private members. Its base
 *    constructor reaches postInitialize before a derived class installs its
 *    own, so anything private was being touched on an object that did not yet
 *    have it.
 * - 1.7.1
 *    Split Game_Item's extension state so the default lands in initMembers
 *    while the mapping from the constructed item stays in the initialize
 *    alias. Decoding never runs a constructor, so only the half that does not
 *    depend on the incoming item can move.
 * - 1.7.0
 *    Renamed plugin from J-SkillExtend to J-Extend (PLUGIN_NAME only; no
 *    functional change, nothing else in the codebase referenced the old
 *    name by string).
 *    Added <extendType:CLASSIFIER> — extends every skill/state carrying a
 *    matching J-Base <type:CLASSIFIER> tag instead of listing ids one by
 *    one. Type-based overlays apply before id-based overlays; id-based
 *    wins on conflict.
 *    Added <applyState>/<thisApplyState> — apply a state on hit with an
 *    authored chance, and optionally an overridden duration (0 = state's
 *    own default, -1 = force indefinite) and starting stack count.
 *    thisApplyState is skill-scoped; applyState reads from any of the
 *    caster's note sources. thisApplyState wins when both target the same
 *    state id on the same hit.
 *    Added two new sibling integration plugins: J-Extend-ABS (prevents
 *    JABS AI from selecting extension skills as actions) and J-Extend-SKS
 *    (skill equip detail window shows the overlayed skill).
 * - 1.6.0
 *    Added <toggleGroupOnExecute:[STATE_ID, ...]> — a skill-scoped, press-time
 *    cycle-group toggle for stance/equation-style mechanics with more than one
 *    exclusive state. Coupled and self-repairing, unlike stacking independent
 *    <toggleOnExecute> tags for the same purpose.
 *    Fixed Game_Action#toggleOnExecuteStateIds throwing on every execution — it read
 *    the tag through RPGManager.getNumbersFromNoteByRegex, which expects a single
 *    bracketed list capture (the shape every other consumer of that helper uses),
 *    but this tag captures one bare number per repeated line. Switched to
 *    RPGManager.getStringsFromNoteByRegex (which collects one entry per matching
 *    line instead of overwriting) plus a Number() map. No notetag syntax change;
 *    existing <toggleOnExecute:STATE_ID> data is unaffected.
 * - 1.5.0
 *    Added <toggleOnExecute:STATE_ID> — a skill-scoped, press-time state toggle
 *    for stance-style skills (add if absent, remove if present). Repeatable.
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