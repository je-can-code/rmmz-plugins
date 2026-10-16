# overview

* [The Plugin Overview](overview.md) - The general overview for what this plugin is about along with the when and how you might use it.

# dependencies

* [Dependencies](dependencies.md) - The list of dependencies- required and optional- for this plugin.

# notetag

* [Gate Tags](notetags/gate-tags.md) - The tags gating whether a source's passives are granted, by a threshold or a battlefield condition.
* [Stack Count](notetags/stack-count.md) - The tag scaling how many stacks of one passive state a source contributes.
* [Auto-Apply State](notetags/auto-apply-state.md) - The tag applying a real combat state to its bearer on a timer or a combat event.
* [Auto-Apply State On Nearby](notetags/auto-apply-state-on-nearby.md) - The tag applying a real combat state, aura-style, to every enemy or ally in proximity of its bearer.
* [Auto-Execute Skill](notetags/auto-execute-skill.md) - The tag firing a map skill from its bearer on a timer or a combat event, with no cost or cooldown.
* [Auto-Modify Cooldowns](notetags/auto-modify-cooldowns.md) - The tag shortening or lengthening its bearer's own active skill-slot cooldowns on a combat event.
* [Auto-Inflict State](notetags/auto-inflict-state.md) - The tag applying a real combat state onto whoever its bearer just inflicted a state upon or knocked back.
* [Remove On Skill Execution](notetags/remove-on-skill-execution.md) - The tag giving a state a chance to lose a stack whenever its bearer executes a map skill.
* [Remove On Skill Resolution](notetags/remove-on-skill-resolution.md) - The tag giving a state a chance to lose a stack whenever an action its bearer fired expires.
* [Remove State On Move](notetags/remove-state-on-move.md) - The tag stripping a state's stacks the instant its bearer moves, the pair to a stand-built stack.

# plugin-parameter

* [Parameter Group: PASSIVE CONDITIONAL](parameters/parent-config-passive-conditional.md) - The heading the PASSIVE CONDITIONAL parameters sit under in the plugin manager.
* [Reconcile Delay (frames) Plugin Parameter](parameters/reconcile-delay-frames.md) - Frames between passive rule re-checks per map battler.
* [Default Proximity (tiles) Plugin Parameter](parameters/default-proximity-tiles.md) - Tile radius for alliesNearby/enemiesNearby rules and stack counts.
* [Auto-Execute Max Depth Plugin Parameter](parameters/auto-execute-skill-max-depth.md) - Max nested autoExecuteSkill firings per synchronous call stack.
* [Auto-Inflict Max Depth Plugin Parameter](parameters/auto-inflict-state-max-depth.md) - Max nested autoInflictState firings per synchronous call stack.

# storage

* [Data Saved](storage.md) - The details about what is saved to disk for this plugin.

# changelog

* [Changelog](changelog.md) - The list of all version updates this plugin has gone through and major change points.
