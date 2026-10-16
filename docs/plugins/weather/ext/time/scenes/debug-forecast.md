---
type: scene
title: Diagnostic Forecast Scene
description: The developer screen showing the exact preset and strength every named destination would draw, per phase.
tags: [weather-time, scene, debug, forecast]
---

# Scene_DebugForecast

The `Scene_DebugForecast` is the diagnostic forecast: a developer screen, behind a plugin command and deliberately NOT
in the player's menu. One day at a time, paged left and right; the top row is the sky over Erocia and every row beneath
it is a named destination, with the exact preset and strength each would draw, per phase.

It exists to answer "is this weather that" - to check what is on screen against what the sky rolled, and to see a
[climate](../notetags/climate.md) inverting or a map tag overriding without having to walk there.

It is not what a player sees, for two reasons. The weather is reported from Raevula, which is the only town left on
Erocia - a player has no way to check the sky over somewhere they are not. And a menu listing the Negative Peaks and the
Forest of Dreams tells them those places exist before they have found them.

Destinations are listed in `sky.places` as a name and a map id. The screen reads that map's own note and runs it through
the same resolver the game uses on arrival, so nothing is restated and the two cannot disagree.

## How to call the scene

The scene can be opened in any of these ways:

- With the [Show The Diagnostic Forecast](../commands/show-debug-forecast.md) plugin command.
- From the dev console or a script call, with:

```js
Scene_DebugForecast.callScene()
```