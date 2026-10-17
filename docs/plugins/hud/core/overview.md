---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [hud, overview]
version: "2.4.0"
---

# Overview

This plugin is the core of the `J-HUD` system, and contains plugin commands for managing the state of your JABS HUD.

## Integrations

Integrates with others of mine plugins:

- `J-HUD-PartyFrame`; enables on-the-map display of the player and ally data.
- `J-HUD-InputFrame`; enables on-the-map display of the player's skill slots.
- `J-HUD-TargetFrame`; enables on-the-map display of the player's last target.

NOTE: If using the `J-HUD-TargetFrame` plugin, there is additional information in the
[plugin help](../ext/target/overview.md) that you will want to review at least once before using it.

## Controlling the HUD

Have you ever wanted to have any degree of control over the HUD that exists as an information data overlay to your
JABS-tastical fun? Well now you can! By leveraging the plugin commands below, you too can manipulate your HUD!

### Details

The "HUD" is controlled as a collection of its frames. The below plugin commands all work to show/hide all portions of
the "HUD" at once.

NOTE: The Party and Input frames both are forcefully hidden while the message window is open and the `$gameInterpreter`
believes an event is running.

### Show/hide commands

Leveraging these commands will give you the control over showing or hiding the entirety of the HUD. This is the type of
command you could use to

- "[Show HUD](commands/show-hud.md)": Shows the entire HUD.
- "[Hide HUD](commands/hide-hud.md)": Hides the entire HUD.

### Ally show/hide commands

Leveraging these commands will give you the control over showing or hiding any allies other than the leader from the
HUD.

- "[Show Allies](commands/show-allies.md)": Shows the allies' section of the party frame.
- "[Hide Allies](commands/hide-allies.md)": Hides the allies' section of the party frame.

### Refresh commands

Leveraging these commands will give you control over refreshing the HUD. These commands are very circumstancial in
nature, but will enable you to forcefully refresh the HUD and it's image cache on-demand in the instance that you make
changes to assets or have some other plugin requiring some sort of data update to a member of the party.

- "[Refresh HUD](commands/refresh-hud.md)": Refreshes the data of the HUD, such as actor parameters and states.
- "[Refresh HUD Image Cache](commands/refresh-image-cache.md)": Refreshes the image cache of the HUD, for when you
  change faces.

## Note about notetags

This plugin has no notetags of its own- HUD control is entirely plugin-command driven.