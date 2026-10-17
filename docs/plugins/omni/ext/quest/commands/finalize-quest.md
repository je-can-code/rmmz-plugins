---
type: plugin-command
title: Finalize Quest Plugin Command
description: Flags a quest as a given finalized state.
tags: [omni-quest, command]
command:
  key: finalize-quest
  text: Finalize Quest
  desc: Flags a quest as a given finalized state.
  args:
    - key: key
      type: string
      desc: The unique key for the quest to progress.
    - key: state
      type: select
      options:
        - option: Completed
          value: 0
        - option: Failed
          value: 1
        - option: Missed
          value: 2
      text: Finalized State
      desc: The state to finalize the quest as.
---

# `finalize-quest`

Flags a quest as a given finalized state.