# overview

* [The Plugin Overview](overview.md) - The general overview for what this plugin is about along with the when and how you might use it.

# dependencies

* [Dependencies](dependencies.md) - The list of dependencies- required and optional- for this plugin.

# notetag

* [SDP Points](notetags/sdp-points.md) - The tag defining how many SDP points an enemy yields upon defeat, or an item grants or consumes when used.
* [Enemy SDP Drops](notetags/enemy-sdp-drops.md) - The tag letting an enemy drop an SDP for unlocking across the party, at an integer percent chance.
* [SDP Unlock](notetags/sdp-unlock.md) - The tag making an item unlock an SDP upon use, in addition to whatever else it does.
* [SDP Points (Enemies Only)](notetags/sdp-points-enemies-only.md) - The tag defining how many SDP points the party gains from defeating an enemy.
* [SDP Multipliers](notetags/sdp-multipliers.md) - The tag for modifying the rate at which SDP points are gained.
* [SDP Bonus Formula](notetags/sdp-bonus-formula.md) - The tag scaling the SDP points an actor gains by a formula, applied after the sdpMultiplier step.
* [Natural Growth](notetags/natural-growth.md) - The integration details with the J-NaturalGrowth plugin.

# plugin-parameter

* [Parameter Group: SDP SETUP](parameters/sd-pconfigs.md) - The heading the SDP SETUP parameters sit under in the plugin manager.
* [Menu Switch ID Plugin Parameter](parameters/menu-switch.md) - When this switch is ON, then this command is visible in the menu.
* [Points Icon Plugin Parameter](parameters/sdp-icon.md) - The default icon index to represent "SDP points". Use the context menu to easily select an index.
* [Victory Text Plugin Parameter](parameters/victory-text.md) - The text appended to text as seen in the default. This text usually shows up after a battle is won.
* [Menu Name Plugin Parameter](parameters/menu-command-name.md) - The text to show as the name of this command in menus.
* [Menu Icon Plugin Parameter](parameters/menu-command-icon.md) - The icon to show next to the command in the menu. Use the context menu to easily select an index.
* [Unit name (singular) Plugin Parameter](parameters/sdp-unit-singular.md) - Player-facing word for one rankable entry (panel, node, junction, etc.).
* [Unit name (plural) Plugin Parameter](parameters/sdp-unit-plural.md) - Plural form for counts in confirmations (panels, nodes, …).
* [Points name (short) Plugin Parameter](parameters/sdp-points-display-name.md) - Currency label in SDP UI (confirmation “Remaining …”, cart wallet header, TextManager.sdpPoints).
* [Parameter Group: Panel rank-up defaults (by rarity)](parameters/sdp-panel-cost-defaults.md) - The heading the Panel rank-up defaults (by rarity) parameters sit under in the plugin manager.
* [Common · Base SDP Plugin Parameter](parameters/sdp-default-common-base.md) - The Common · Base SDP plugin parameter.
* [Common · Flat coefficient Plugin Parameter](parameters/sdp-default-common-flat.md) - The Common · Flat coefficient plugin parameter.
* [Common · Mult base Plugin Parameter](parameters/sdp-default-common-mult.md) - The Common · Mult base plugin parameter.
* [Magical · Base SDP Plugin Parameter](parameters/sdp-default-magical-base.md) - The Magical · Base SDP plugin parameter.
* [Magical · Flat coefficient Plugin Parameter](parameters/sdp-default-magical-flat.md) - The Magical · Flat coefficient plugin parameter.
* [Magical · Mult base Plugin Parameter](parameters/sdp-default-magical-mult.md) - The Magical · Mult base plugin parameter.
* [Rare · Base SDP Plugin Parameter](parameters/sdp-default-rare-base.md) - The Rare · Base SDP plugin parameter.
* [Rare · Flat coefficient Plugin Parameter](parameters/sdp-default-rare-flat.md) - The Rare · Flat coefficient plugin parameter.
* [Rare · Mult base Plugin Parameter](parameters/sdp-default-rare-mult.md) - The Rare · Mult base plugin parameter.
* [Epic · Base SDP Plugin Parameter](parameters/sdp-default-epic-base.md) - The Epic · Base SDP plugin parameter.
* [Epic · Flat coefficient Plugin Parameter](parameters/sdp-default-epic-flat.md) - The Epic · Flat coefficient plugin parameter.
* [Epic · Mult base Plugin Parameter](parameters/sdp-default-epic-mult.md) - The Epic · Mult base plugin parameter.
* [Legendary · Base SDP Plugin Parameter](parameters/sdp-default-legendary-base.md) - The Legendary · Base SDP plugin parameter.
* [Legendary · Flat coefficient Plugin Parameter](parameters/sdp-default-legendary-flat.md) - The Legendary · Flat coefficient plugin parameter.
* [Legendary · Mult base Plugin Parameter](parameters/sdp-default-legendary-mult.md) - The Legendary · Mult base plugin parameter.
* [Godlike · Base SDP Plugin Parameter](parameters/sdp-default-godlike-base.md) - The Godlike · Base SDP plugin parameter.
* [Godlike · Flat coefficient Plugin Parameter](parameters/sdp-default-godlike-flat.md) - The Godlike · Flat coefficient plugin parameter.
* [Godlike · Mult base Plugin Parameter](parameters/sdp-default-godlike-mult.md) - The Godlike · Mult base plugin parameter.

# plugin-command

* [Access the SDP Menu Plugin Command](commands/call-sdp-menu.md) - Calls the SDP Menu directly via plugin command.
* [Unlock Panel(s) Plugin Command](commands/unlock-sdp.md) - Unlocks a new panel for the player to level up by its key. Key must exist in the SDPs list above.
* [Lock Panel(s) Plugin Command](commands/lock-sdp.md) - Locks a SDP by its key. Locked panels do not appear in the list nor affect the player's parameters.
* [Add/Remove SDP points Plugin Command](commands/modify-sdp-points.md) - Adds or removes a designated amount of points from an actor.
* [Add/Remove party's SDP points Plugin Command](commands/modify-party-sdp-points.md) - Adds or removes a designated amount of points from all members of the current party.

# scene

* [SDP Scene](scenes/sdp.md) - The scene for managing unlocked SDPs and spending SDP points to rank them up.

# storage

* [Data Saved](storage.md) - The details about what is saved to disk for this plugin.

# changelog

* [Changelog](changelog.md) - The list of all version updates this plugin has gone through and major change points.
