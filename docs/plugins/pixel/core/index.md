# overview

* [The Plugin Overview](overview.md) - The general overview for what this plugin is about along with the when and how you might use it.

# dependencies

* [Dependencies](dependencies.md) - The list of dependencies- required and optional- for this plugin.

# notetag

* [Area Event](notetags/area-event.md) - The tag stretching an event's page into a rectangle of tiles, any of which counts as reaching the event.
* [Relative Transfer](notetags/relative-transfer.md) - The tag landing a transfer from an area as far along its destination as the player crossed the area.

# plugin-parameter

* [Parameter Group: COLLISION SETUP](parameters/collision-configs.md) - The heading the COLLISION SETUP parameters sit under in the plugin manager.
* [Subcells Per Tile Plugin Parameter](parameters/collision-step-count.md) - The number of subcells to divide each tile into along each axis. Higher = more precise edges but more memory.
* [Collision Radius Plugin Parameter](parameters/collision-radius.md) - Half-size of the character's square hitbox in tile units. 0.3 is a reasonable default.
* [Parameter Group: MOVEMENT](parameters/movement-configs.md) - The heading the MOVEMENT parameters sit under in the plugin manager.
* [Enable Vector (360°) Movement Plugin Parameter](parameters/vector-movement-enabled.md) - When true, the player can move at any angle via analog stick or mouse direction. Falls back to 8-dir if no analog input.
* [Foot Touch Trigger Delay (frames) Plugin Parameter](parameters/foot-touch-event-delay-frames.md) - After a map loads, suppress Player Touch / Event Touch on the tile under the player for this many frames (0 = off). Reduces spurious saves after load.
* [Parameter Group: DEBUG](parameters/debug-configs.md) - The heading the DEBUG parameters sit under in the plugin manager.
* [Overlay Initially Visible Plugin Parameter](parameters/overlay-initially-visible.md) - Show the subcell collision overlay on map load. Toggle at runtime with the backslash key.

# storage

* [Data Saved](storage.md) - The details about what is saved to disk for this plugin.

# changelog

* [Changelog](changelog.md) - The list of all version updates this plugin has gone through and major change points.
