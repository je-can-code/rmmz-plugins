---
type: scene
title: Forecast Scene
description: The forecast as a player reads it, from the weather where they stand to the days ahead over Raevula.
tags: [weather-time, scene, forecast]
---

# Scene_Forecast

The `Scene_Forecast` is the forecast as a player sees it, in three views: what the weather is doing where you are
standing, how the sky over Raevula moves through the rest of the day, and the days ahead over Raevula, at a glance.

## How to call the scene

Nothing in this plugin opens it: there is no plugin command or menu command for it. It can be opened from the dev
console or a script call, with:

```js
Scene_Forecast.callScene()
```