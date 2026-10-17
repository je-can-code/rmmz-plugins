---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [omni-quest, overview]
version: "2.0.4"
---

# Overview

This plugin extends the [Omnipedia](../../core/overview.md) by adding a new entry: The Questopedia.

## Integrations

Integrates with others of mine plugins:

- `J-Base`; always required for my plugins.
- [`J-Messages`](../../../message/core/overview.md); adds `\quest[questKey]` message codes.
- [`J-HUD`](../../../hud/core/overview.md); adds a quest tracker window.

## Details

"The Questopedia" is another module for the Omnipedia. It provides a log for tracking and managing quests in a somewhat
organized fashion.

Quests are described by a collection of data points in the config file. (see the [IMPORTANT NOTE](#important-note) down
below) These data points together define the metadata of a quest. They include:

- `name`
- `key`
- `categoryKey`
- `tagKeys`
- `unknownHint`
- `overview`
- `recommendedLevel`
- `objectives`
  - `id`
  - `type`
  - `description`
  - `fulfillmentData`
  - `fulfillmentQuestKeys`
  - `hiddenByDefault`
  - `isOptional`
  - `logs`
    - `discovered`
    - `completed`
    - `failed`
    - `missed`

You can see that there is a lot of data, but this is what you need to know: A Quest consists of a series of objectives.
Each objective should be identifiable as a single distinct task. Each objective can be categorized into one of five
categories of objective.

Remembering the above will keep you in the right mindset to fill in the rest of the details. Some of the rest of the
details are just text you'll find across the GUI for the system. The rest of the rest of the details are a means to link
objectives and quest data together.

Read the "[BUILDING A QUEST](#building-a-quest)" section for more information about the details.

### Important Note

The Quest data is derived from an external file rather than the plugin's parameters. This file lives in the "`/data`"
directory of your project, and is called "`config.quest.json`". You can absolutely generate/modify this file by hand,
but you'll probably want to visit my GitHub and swipe the `rmmz-data-editor` project I've built that provides a
convenient GUI for generating and modifying quests in just about every way you could need.

If this configuration file is missing, the game will not run.

Additionally, due to the way RMMZ base code is designed, by loading external files for configuration like this, a
project made with this plugin will simply crash when attempting to load in a web context with an error akin to:

```text
"ReferenceError require is not defined"
```

This error is a result of attempting to leverage nodejs' "`require`" loader to load the "`fs`" (file system) library to
then load the plugin's config file. Normally a web deployed game will alternatively use "`forage`" instead to handle
things that need to be read or saved, but because the config file is just that- a file sitting in the `/data` directory
rather than loaded into `forage` storage- it becomes inaccessible.

## Building a Quest

Ever want to build and manage quests in your RPG Maker MZ game? Well now you can! By constructing the correct JSON to
match your heart's deepest desires for quests, you too can do questopedic things!

TLDR;
Use my "`rmmz-data-editor`" to actually construct the data, please don't try to hack this together manually by writing
JSON.