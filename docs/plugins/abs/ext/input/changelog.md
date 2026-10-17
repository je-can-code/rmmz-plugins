---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

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