---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 1.2.0
  - Adds `passive` to the source ranking, between an event page and an applied state, for the motions J-Motion-Passive
    declares.
  - A claimed channel now composes with whatever was holding it rather than discarding it, so a hit reaction on a
    character that is permanently scaled or rotated modulates around that instead of snapping it back to normal for the
    length of the reaction. Ambient wobbles are still suppressed by a claim, which is what claiming was for.
  - Fixed a source declaring an empty set leaving its motions running forever, which an event page changing to one with
    no motion tags does.
### 1.1.0
  - Centred rotation now lifts the sprite instead of dropping it, and scales that lift by the sprite's own scale, so a
    character that spins while changing size stays where it was standing. The anchor is also restored once the rotation
    ends rather than being left at the middle for the rest of the sprite's life.
  - A source that withdraws a transition and immediately re-declares it now resumes the one already travelling home
    rather than starting a second on the same channel, where the two combined into a value nobody asked for. Asking a
    second time for a removal already underway no longer restarts the journey from further out than the sprite had
    reached.
  - Compositions can be asked whether a contribution would actually land, so an effect that lost a channel no longer
    acts as though it had won it. Adds removeDeclarationKind for withdrawing every source of one kind at once.
### 1.0.0
  - The initial release.