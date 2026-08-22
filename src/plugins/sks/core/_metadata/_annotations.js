//region annotations
/*:
 * @target MZ
 * @plugindesc [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] A plugin enabling actors to equip skills into dedicated skill slots.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @orderAfter J-Base
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin enables actors to equip skills into dedicated skill slots using
 * a point-budget system. Each actor has a number of slots and a pool of slot
 * points; skills occupy a slot and cost points to equip, and only skills of
 * the configured equippable types appear in the equip scene.
 *
 * Integrates with others of mine plugins:
 * - J-Base; required by all my plugins.
 * - J-Passive; equipping a passive skill activates its perpetual state effect.
 *
 * ----------------------------------------------------------------------------
 * DETAILS
 * Each actor has both a maximum number of slots (maxSlots) and a maximum
 * number of slot points (maxSlotPoints). These are two independent capacities:
 * slots limit how many skills can be equipped at once regardless of cost, and
 * points limit how much those equipped skills can collectively cost. Skills
 * that belong to the configured equippable skill types can be placed into
 * slots, each consuming a number of slot points equal to their slot cost. The
 * player manages equipped skills through the SKS equip scene, accessible from
 * the menu when the configured menu switch is ON.
 *
 * Skills tagged as "unslotted" are perpetually active and never appear in the
 * equip scene. Skills whose type is not in the equippable list are also treated
 * as implicitly unslotted, meaning they remain freely available to whatever
 * other system manages them (such as JABS combat slot equipping).
 *
 * ============================================================================
 * SLOT COST
 * Want to control how many slot points a skill consumes? By applying the
 * appropriate tag to skills in the database, you can fine-tune the cost of
 * equipping each skill.
 *
 * TAG USAGE:
 * - Skills
 *
 * TAG FORMAT:
 *  <slotCost:AMOUNT>
 *    Where AMOUNT is the number of slot points this skill costs to equip.
 *
 * TAG EXAMPLES:
 *  <slotCost:2>
 * This skill costs 2 slot points to equip into a slot.
 *
 * ============================================================================
 * UNSLOTTED
 * Want a skill to always be active without occupying a slot? By applying the
 * appropriate tag to skills in the database, you can mark them as perpetually
 * active. These skills will not appear in the equip scene.
 *
 * TAG USAGE:
 * - Skills
 *
 * TAG FORMAT:
 *  <unslotted>
 *
 * TAG EXAMPLES:
 *  <unslotted>
 * This skill is always active and will never appear in the SKS equip scene.
 *
 * ============================================================================
 * UNSLOTTED SKILLS
 * Want a specific actor/class (or any other note source) to treat a normally-
 * slottable skill as perpetually active for them specifically, without making
 * that skill unslotted for everyone else? By applying the appropriate tag,
 * you can grant a per-battler exemption from the slot requirement- the skill
 * still costs a slot for any other actor who has to learn-then-equip it
 * through the normal pipeline.
 *
 * TAG USAGE:
 * - Actors
 * - Classes
 * - Skills
 * - Weapons
 * - Armor
 * - States
 *
 * TAG FORMAT:
 *  <unslottedSkills:[SKILL_ID, SKILL_ID, ...]>
 *    Where each SKILL_ID is exempted from the slot requirement for this
 *    battler, regardless of that skill's own <unslotted> tag or type.
 *
 * TAG EXAMPLES:
 *  <unslottedSkills:[901,902]>
 * This actor/class always has skills 901 and 902 active, without spending a
 * slot on either- e.g. a class with native weapon access to two weapon types.
 *
 * ============================================================================
 * SLOT COST MODIFIER
 * Want to adjust the slot cost of skills based on what an actor has equipped
 * or what states they are under? By applying the appropriate tag across the
 * various database locations, you can modify the effective slot cost of skills
 * for that actor.
 *
 * TAG USAGE:
 * - Actors
 * - Classes
 * - Weapons
 * - Armor
 * - States
 *
 * TAG FORMAT:
 *  <slotCostModifier:AMOUNT>
 *    Where AMOUNT is the flat modifier applied to all skill slot costs.
 *    Negative values reduce the cost; positive values increase it.
 *
 * TAG EXAMPLES:
 *  <slotCostModifier:-1>
 * All skills cost 1 fewer slot point while this is active on the actor.
 *
 * ============================================================================
 * BASE SLOTS / BASE SLOT POINTS
 * Want to control how many slots or slot points an actor has innately, and
 * have that scale as they grow? By applying the appropriate tag to an actor
 * or their class, you can define a formula-driven baseline for either
 * capacity. When neither the actor nor their class carries the tag, the
 * plugin's configured default is used instead.
 *
 * These formulas have access to "a" (the actor) and "v" (the game's
 * variables), so growth curves can reference things like the actor's level.
 *
 * TAG USAGE:
 * - Actors
 * - Classes
 *
 * TAG FORMAT:
 *  <baseSlots:[FORMULA]>
 *    Where FORMULA computes the actor's baseline slot count.
 *  <baseSlotPoints:[FORMULA]>
 *    Where FORMULA computes the actor's baseline slot point budget.
 *
 * TAG EXAMPLES:
 *  <baseSlots:[4]>
 * This actor/class has a flat baseline of 4 slots.
 *
 *  <baseSlotPoints:[6 + (a.level * 0.5)]>
 * This actor/class's baseline slot points grow by half a point per level,
 * starting from a base of 6.
 *
 * ============================================================================
 * MAX SLOTS / MAX SLOT POINTS
 * Want to grant bonus slots or slot points from equipment, states, or other
 * sources? By applying the appropriate tag across the various database
 * locations, you can add to an actor's baseline capacity. Unlike the base
 * tags, these stack additively across every source found.
 *
 * TAG USAGE:
 * - Actors
 * - Classes
 * - Skills
 * - Weapons
 * - Armor
 * - States
 *
 * TAG FORMAT:
 *  <maxSlots:[FORMULA]>
 *    Where FORMULA computes a bonus to the actor's slot count.
 *  <maxSlotPoints:[FORMULA]>
 *    Where FORMULA computes a bonus to the actor's slot point budget.
 *
 * TAG EXAMPLES:
 *  <maxSlots:[1]>
 * This source grants +1 bonus slot while active/equipped.
 *
 *  <maxSlotPoints:[-2]>
 * This source reduces the actor's slot point budget by 2 while active.
 *
 * ============================================================================
 * EXCLUSIVE MODE
 * By default, equipping a skill is gated by both slot count AND slot points
 * together (tandem mode) - a skill must fit within both the remaining slot
 * count and the remaining point budget to be equipped. If you'd rather only
 * one of those two capacities matter, turn on Exclusive Mode and choose which
 * one governs equipping via the Slots Only config.
 *
 * When Exclusive Mode is ON and Slots Only is ON, only slot count matters -
 * slot points are never checked, so an actor can equip anything as long as a
 * slot is physically available (a la Digital Devil Saga's skill system).
 *
 * When Exclusive Mode is ON and Slots Only is OFF, only slot points matter -
 * slot count is never checked, so an actor can equip anything as long as the
 * point budget allows it, regardless of how many slots that occupies (a la
 * Final Fantasy IX's passive ability system).
 *
 * When Exclusive Mode is OFF, Slots Only has no effect; tandem mode applies.
 *
 * ============================================================================
 * CHANGELOG:
 * - 1.5.1
 *    Adapted to the RPGManager array read signature.
 * - 1.5.0
 *    Routed the _sks namespace into its own save section, so equipped skill
 *    slots land in systems/sks.json rather than inside the actor blobs.
 * - 1.4.0
 *    Retrofitted the skill equip scene onto the shared actor skeleton, so it
 *    matches the other actor-scoped scenes.
 *    Command windows now seed state in initMembers, early enough for
 *    makeCommandList to see it.
 * - 1.3.0
 *    Added per-battler unslotted-skill exemptions via <unslottedSkills:[...]>.
 *    Stale slot entries are now automatically cleared when the actor no
 *    longer knows the skill occupying them.
 * - 1.2.0
 *    Added Exclusive Mode, letting slot count or slot points alone gate
 *    equipping instead of requiring both. Enforced slot count as a real
 *    limit on equipping rather than a display-only limit in the equip scene.
 * - 1.1.0
 *    Promoted maxSlots and maxSlotPoints to independent, notetag-driven stats.
 *    Removed the mod-slot-points-party plugin command.
 * - 1.0.0
 *    The initial release.
 * ============================================================================
 *
 * @param parentConfig
 * @text SETUP
 *
 * @param menu-switch
 * @parent parentConfig
 * @type switch
 * @text Menu Switch ID
 * @desc When this switch is ON, the SKS command is visible in the menu.
 * @default 101
 *
 * @param equippable-skill-type-ids
 * @parent parentConfig
 * @type number[]
 * @text Equippable Skill Type IDs
 * @desc The skill type IDs whose skills are eligible for equipping into slots. Skills of all other types are implicitly unslotted.
 * @default []
 *
 * @param default-max-slots
 * @parent parentConfig
 * @type number
 * @text Default Max Slots
 * @desc The baseline number of skill slots an actor has when no <baseSlots:...> tag is found on the actor or class.
 * @default 4
 *
 * @param default-max-slot-points
 * @parent parentConfig
 * @type number
 * @text Default Max Slot Points
 * @desc The baseline slot point budget an actor has when no <baseSlotPoints:...> tag is found on the actor or class.
 * @default 4
 *
 * @param enable-exclusive-mode
 * @parent parentConfig
 * @type boolean
 * @text Enable Exclusive Mode
 * @desc When ON, only slot count OR slot points gate equipping (see Slots Only), never both together.
 * @on Exclusive
 * @off Tandem
 * @default false
 *
 * @param slots-only
 * @parent parentConfig
 * @type boolean
 * @text Slots Only (Exclusive Mode)
 * @desc Only used when Exclusive Mode is ON. ON means only slot count is checked (points ignored); OFF means only slot points are checked (count ignored).
 * @on Slots Only
 * @off Points Only
 * @default false
 */
//endregion annotations