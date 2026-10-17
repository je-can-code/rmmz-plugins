---
type: scene
title: Debug Aptitude Scene
description: A debug scene for viewing all of the available aptitudes for your actors.
tags: [ap, scene, debug]
---

# Scene_Aptitude

The `Scene_Aptitude` is the base scene that serves as a debug viewer of all teachables a battler has currently applied
from their various sources.

## How to call the scene

Because it is treated as a debug scene, it can be viewed only via the dev console with:

```js
Scene_Aptitude.callScene()
```