---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 2.5.0
  - Four ally orders, carried out by J-ABS-AllyAI when it is installed: Ally Charge, Ally Pull Back, Stance: Safer and
    Stance: Bolder. They sit on the right stick's four flicks by default, and on W, S, A and D for a keyboard; each key
    feeds the same input as its flick, so rebinding an order moves both. The remap scene lists them in an Ally Commands
    group, which is left out without J-ABS-AllyAI.
  - Each of the right stick's four directions is a button of its own. A flick has to push the stick 70% of the way
    out, so a thumb resting on it gives no orders, and only the axis pushed harder counts, so a diagonal flick gives one
    order rather than two.
  - W takes the place of vanilla's spare page-down key. E already carries page-down in J-ABS, so guarding and paging
    through menus are unaffected.
  - Stored bindings are laid over the defaults rather than replacing them. An input added after a configuration was
    saved arrives at its default, while every binding the player set, an unbound one included, is kept as they left it.
### 2.4.0
  - Keybinds are now installation scope rather than slot scope, when J-Base-Save is installed. They lived inside each
    savefile only because vanilla ConfigManager had no room for an eighth field, which meant rebinding a key applied to
    one savefile, a second playthrough started on the defaults, and deleting saves deleted the bindings with them. Both
    stores now register as config fields and persist beside volume.
  - Without J-Base-Save installed they stay exactly where they were.
### 2.3.0
  - Added UsableItem as a remappable logical input (R2 by default), wiring J-ABS core's new usable-item equip slot to
    its own trigger.
  - Centralized raw Input symbol strings into JabsInputSymbols.
  - Removed now-redundant defensive guards now that input scaffolding initialization guarantees the mappings/bindings
    shape always exists.
### 2.2.2
  - Raised minimum J-ABS version requirement to 4.7.0.
### 2.2.1
  - Raised minimum J-ABS version requirement to 4.6.0.
### 2.2.0
  - Removed independent remappability of sprint and mobility.
  - Added support for tracking "in combat" to handle dash/mobility switching.
  - Updated sprint input to switch to mobility skill while "in combat".
### 2.1.1
  - Fixed typo in custom input mapping.
### 2.1.0
  - Added ability to use dpad in "Window_Select"-based windows.
  - Moved debug logic from J-ABS to this plugin.
  - Updated old namespace for inputs to match this plugin.
### 2.0.0
  - Significantly overhauled the plugin to support with input remapping.
### 1.0.0
  - Initial release.