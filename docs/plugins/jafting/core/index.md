# overview

* [The Plugin Overview](overview.md) - The general overview for what this plugin is about along with the when and how you might use it.

# dependencies

* [Dependencies](dependencies.md) - The list of dependencies- required and optional- for this plugin.

# plugin-parameter

* [Parameter Group: SALVAGE / REFINE STACKS](parameters/jafting-salvage-config.md) - The heading the SALVAGE / REFINE STACKS parameters sit under in the plugin manager.
* [Material armor type id Plugin Parameter](parameters/material-armor-type-id.md) - Armor atypeId treated as stack-only ingredients (refinement base list omits them; dismantle keeps bare rows). Use -1 to disable. Default 5.
* [Material weapon type id Plugin Parameter](parameters/material-weapon-type-id.md) - Weapon wtypeId treated like material armors (stack counts in refine lists; dismantle pass-through). Use -1 to disable; 0 is a valid type id.
* [Parameter Group: HUB — SALVAGE ROW](parameters/jafting-hub-salvage.md) - The heading the HUB — SALVAGE ROW parameters sit under in the plugin manager.
* [Salvage hub switch id Plugin Parameter](parameters/salvage-menu-switch.md) - When non-zero, the Salvage hub row requires this game switch ON. Use 0 to always show Salvage (ignore switches).
* [Salvage hub command name Plugin Parameter](parameters/salvage-menu-name.md) - Label for the Salvage entry on the root JAFTING menu.
* [Salvage hub command icon Plugin Parameter](parameters/salvage-menu-icon.md) - Icon index drawn beside the Salvage hub command (RPG Maker icon sheet).

# plugin-command

* [Call Core Menu Plugin Command](commands/call-menu.md) - Brings up the core JAFTING menu.
* [Call Salvage Scene Plugin Command](commands/call-salvage.md) - Opens the JAFTING salvage scene where stamped gear can be dismantled (same scene as the hub Salvage row).

# scene

* [Salvage Scene](scenes/jafting-salvage.md) - The scene for dismantling stamped items and gear back into the ingredients they were built from.
* [JAFTING Scene](scenes/jafting.md) - The root menu that gives access to every JAFTING mode the installed plugins offer.

# storage

* [Data Saved](storage.md) - The details about what is saved to disk for this plugin.

# changelog

* [Changelog](changelog.md) - The list of all version updates this plugin has gone through and major change points.
