# overview

* [The Plugin Overview](overview.md) - The general overview for what this plugin is about along with the when and how you might use it.

# dependencies

* [Dependencies](dependencies.md) - The list of dependencies- required and optional- for this plugin.

# notetag

* [Slot Cost](notetags/slot-cost.md) - The tag defining how many slot points a skill costs to equip into a slot.
* [Unslotted](notetags/unslotted.md) - The tag marking a skill as perpetually active without it ever occupying a slot.
* [Unslotted Skills](notetags/unslotted-skills.md) - The tag exempting specific skills from the slot requirement for one battler only.
* [Slot Cost Modifier](notetags/slot-cost-modifier.md) - The tag adjusting the effective slot cost of every skill for the actor it is active on.
* [Base Slots / Base Slot Points](notetags/base-slots-base-slot-points.md) - The tags defining the formula-driven baseline of slots and slot points an actor has innately.
* [Max Slots / Max Slot Points](notetags/max-slots-max-slot-points.md) - The tags granting bonus slots or slot points on top of an actor's baseline, stacking across every source.

# plugin-parameter

* [Parameter Group: SETUP](parameters/parent-config.md) - The heading the SETUP parameters sit under in the plugin manager.
* [Menu Switch ID Plugin Parameter](parameters/menu-switch.md) - When this switch is ON, the SKS command is visible in the menu.
* [Equippable Skill Type IDs Plugin Parameter](parameters/equippable-skill-type-ids.md) - The skill type IDs whose skills are eligible for equipping into slots. Skills of all other types are implicitly unslotted.
* [Default Max Slots Plugin Parameter](parameters/default-max-slots.md) - The baseline number of skill slots an actor has when no <baseSlots:...> tag is found on the actor or class.
* [Default Max Slot Points Plugin Parameter](parameters/default-max-slot-points.md) - The baseline slot point budget an actor has when no <baseSlotPoints:...> tag is found on the actor or class.
* [Enable Exclusive Mode Plugin Parameter](parameters/enable-exclusive-mode.md) - When ON, only slot count OR slot points gate equipping (see Slots Only), never both together.
* [Slots Only (Exclusive Mode) Plugin Parameter](parameters/slots-only.md) - Only used when Exclusive Mode is ON. ON means only slot count is checked (points ignored); OFF means only slot points are checked (count ignored).

# scene

* [Skill Equip Scene](scenes/skill-equip.md) - The scene for managing which of an actor's skills are equipped into their skill slots.

# storage

* [Data Saved](storage.md) - The details about what is saved to disk for this plugin.

# changelog

* [Changelog](changelog.md) - The list of all version updates this plugin has gone through and major change points.
