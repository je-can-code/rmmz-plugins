---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 2.1.1
  - A Show Choices, Input Number or Select Item with no Show Text above it no longer flashes an empty message box as it
    closes.
### 2.1.0
  - Added the \more text code, which welds a message onto the one written after it. The box grows to hold whatever they
    add up to.
### 2.0.0
  - Renamed from J-MessageTextCodes. Update the entry in js/plugins.js and delete the old file; nothing else in a
    project has to change.
  - Message text is now drawn as one sprite per character rather than baked into the window's bitmap, which is what lets
    a letter move after it has been drawn. Added \~ wave, \% jitter, \= rainbow and \+ pulse, which nest with each other
    and with the engine's own codes.
  - Added speaker profiles, read from data/config.message.json and keyed by the Name field or the face. A profile
    carries a voice, a pace, per- punctuation beats and effects that act on everything that speaker says, so dialogue
    already written gains a character without being edited.
  - Added layoutMessageGlyphs, which builds a message's glyphs before any of them are revealed - the only way something
    drawing a container around them can know its size on the frame it opens.
  - Effects now declare how far they travel, so a container can reserve room for an effect it has never heard of.
  - Added a named-section accessor for the external config, so an extension can read its own settings without opening
    the file a second time.
  - A finished message now fades out over about half a second rather than blinking away. The engine's own close hides a
    window's client area on its first frame, so the text always left instantly no matter how long the frame took to
    collapse. Length is the "fade" section of the config.
### 1.3.1
  - Fixed choice conditionals not hiding branches inside called common events.
### 1.3.0
  - Added \param[PARAM_KEY] text code, pulling name/icon/color from the shared J-Base ParameterRegistry catalog. An
    unregistered key renders as a loud red "!!! UNKNOWN PARAM !!!" instead of failing silently.
### 1.2.1
  - Added helper for applying text color to fragments.
### 1.2.0
  - Embedded a modified version of HIME's choice conditionals into this.
  - Said plugin was added and modified and extended for other purposes.
  - Implemented questopedia text code format.
  - Added basic choice conditionals for switches and leader for choices.
### 1.1.0
  - Implemented element, the four "types" from database data.
  - Added plugin dependency of J-Base.
  - Implemented SDP panel text code format.
### 1.0.0
  - Initial release.
  - Implemented style toggles for bold and italics.
  - Implemented weapon/armor/item/state/skill/enemy names from database data.