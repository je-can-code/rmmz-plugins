# overview

* [The Plugin Overview](overview.md) - The general overview for what this plugin is about along with the when and how you might use it.

# dependencies

* [Dependencies](dependencies.md) - The list of dependencies- required and optional- for this plugin.

# notetag

* [This Action Critical Modifiers](notetags/this-action-critical-modifiers.md) - The tags modifying the critical chance and critical damage of a specific skill or item's execution.
* [Critical Damage Multiplier](notetags/critical-damage-multiplier.md) - The tags controlling how hard (or weak) a battler's critical hits will be.
* [Critical Damage Reduction](notetags/critical-damage-reduction.md) - The tags reducing the amount of damage received when an enemy battler lands a critical hit.
* [Natural Growth](notetags/natural-growth.md) - The integration details with the J-NaturalGrowth plugin, growing CDM and CDR by flat or rate multipliers.
* [On-Crit State Application](notetags/on-crit-state-application.md) - The tags applying states to the target or to the attacker whenever a critical hit lands.
* [Forcing On-Crit Procs](notetags/forcing-on-crit-procs.md) - The tag forcing every on-crit state application roll to succeed, without touching crit chance or luck.
* [Conditional Critical Chance by Target State](notetags/conditional-critical-chance-by-target-state.md) - The tags adding bonus crit chance that only applies when the target has a specific state active.
* [Conditional Critical Chance by Target State Type](notetags/conditional-critical-chance-by-target-state-type.md) - The tags adding bonus crit chance when the target has any state carrying a given type classifier.
* [Guaranteed Critical Hit by Target State](notetags/guaranteed-critical-hit-by-target-state.md) - The tags guaranteeing a critical hit when the target has any one of the listed states active.
* [Guaranteed Critical Hit by Target State Type](notetags/guaranteed-critical-hit-by-target-state-type.md) - The tags guaranteeing a critical hit when the target has any state carrying a given type classifier.

# plugin-parameter

* [Base Critical Damage Multiplier Plugin Parameter](parameters/crit-multiplier-base-default.md) - The default bonus critical damage (%) for battlers with no <critMultiplierBase> tags. 50 = +50% (x1.5 total).
* [Base Critical Damage Reduction Plugin Parameter](parameters/crit-reduction-base-default.md) - The critical damage reduction (%) every battler starts from, against every crit. 0 = crits land in full; 25 = -25% of the bonus.

# changelog

* [Changelog](changelog.md) - The list of all version updates this plugin has gone through and major change points.
