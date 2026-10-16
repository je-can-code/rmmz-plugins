---
type: dependencies
title: Dependencies
description: The list of dependencies- required and optional- for this plugin.
tags: [plugins, deps]
dependencies:
  - key: J-Base
    version: 3.8.0
    base: true
    orderAfter: true
  - key: J-Omnipedia
    version: 1.0.0
    base: true
    orderAfter: true
  - key: J-HUD
    base: false
    orderAfter: true
  - key: J-Message
    version: 2.0.0
    base: false
    orderAfter: true
  - key: J-ABS
    base: false
    orderAfter: true
  - key: J-ABS-InputManager
    version: 2.3.0
    base: false
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-Omnipedia

Supplies the Omnipedia scene and list that this plugin adds its Questopedia entry to, and the `initOmnipediaMembers`
hook on the party that its quests are set up in.

## J-HUD

Nothing in this plugin's code reads it; it is only declared so that it loads before this plugin.

## J-Message

Supplies the `shouldHideChoiceBranch` hook that `<choiceQuestCondition>` hides branches through, the
`translateQuestTextCode` hook that this plugin fills in as the `\quest[questKey]` message code, and the item, weapon,
armor and enemy message codes that objective text is written with.

## J-ABS

Supplies the `JABS_InputAdapter` that this plugin adds its Open Quest Log action to, which is only set up when `J-ABS`
is installed.

## J-ABS-InputManager

Supplies the `Input` action registry and `J.ABS.EXT.INPUT.Symbols` that the Open Quest Log shortcut is registered with,
the `JABS_StandardController` that polls it every frame, and the `Window_JabsRemapActions` rows it is rebound from.